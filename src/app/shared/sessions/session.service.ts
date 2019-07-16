import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Session, LoginData, LoginDataResponse, GetSysDataResponse, ChangePasswordResponse } from './session';
import { Result, SdbTaskState, LoginResult, WebClientState } from 'app/shared/global/enum';
import { OdbConstants } from 'app/shared/global/constant';
import { Global } from 'app/shared/global/global';
import { CookieService } from 'ngx-cookie-service';
// import { crypto } from 'crypto-browserify';

@Injectable()
export class SessionService {
  public session: Session;
  public onSessionCreated: EventEmitter<Session> = new EventEmitter<Session>();
  public onInvalidSession: EventEmitter<null> = new EventEmitter<null>();
  public onGetSysData: EventEmitter<GetSysDataResponse> = new EventEmitter<GetSysDataResponse>();
  public onLogin: EventEmitter<LoginData> = new EventEmitter<LoginData>();
  public onError: EventEmitter<string> = new EventEmitter<string>();
  public onUserChanged: EventEmitter<LoginData> = new EventEmitter<LoginData>();
  private taskId = 5001; // SystemGroup
  private personID?: number = null;

  private clientState: WebClientState = WebClientState.WaitPdm;

  public machineIdent = '';
  public validSession = false;

  constructor(private http: HttpClient, private global: Global, private cookieService: CookieService) {
    this.validSession = false;
  }

  private getMachineIdentFromCookie(): string {
    if (this.cookieService.check(OdbConstants.machineIdentCookieName)) {
      return this.cookieService.get(OdbConstants.machineIdentCookieName);
    }

    return '';
  }

  private setMachineIdentToCookie(): void {
    this.cookieService.set(OdbConstants.machineIdentCookieName, this.machineIdent, 1);
  }

  private generateMachineIdent(): string {
    return 'Mobile-Client.' + this.generateGUID();
  }

  private generateGUID(): string {
    let d = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  async createSession(generateNewMachineIdent: boolean): Promise<Session> {
    let reconnectTimeout = 1; // 1 Sekunde

    try {
      this.machineIdent = '';

      if (!generateNewMachineIdent) {
        this.machineIdent = this.getMachineIdentFromCookie();
      }

      if (this.machineIdent === '') {
        this.machineIdent = this.generateMachineIdent();
        reconnectTimeout = 30; // 30 Sekunden
      }

      console.log('createSession: ' + this.machineIdent);

      const createSessionUrl = this.global.webApiUrl + 'v1/sessions?machineIdent=' + this.machineIdent;
      const body = JSON.stringify({});  // {}
      const response = new Session(await this.http.post<Session>(createSessionUrl, body).toPromise());
      console.log('createSession done');
      this.session = response;
      if (this.session.result === Result.Ok) {
        this.validSession = true;
        this.setMachineIdentToCookie();
        this.onSessionCreated.emit(this.session);
        this.checkUserChanged();
        this.onLogin.emit(this.session.loginData);
      } else {
        this.validSession = false;
        this.session.reconnectTimeout = reconnectTimeout;
        Global.handleError('create-session failed: result=' + Result[this.session.result], this.onError);
        this.onSessionCreated.emit(this.session);
      }
      return response;
    } catch (error) {
      this.validSession = false;
      this.session.reconnectTimeout = reconnectTimeout;
      Global.handleError(error, this.onError);
      this.onSessionCreated.emit(this.session);
    }
  }

  async loginSession(login: boolean, personName: string, password: string): Promise<LoginData> {
    try {
      console.log('loginSession: ' + login);

      const loginSessionUrl = this.global.webApiUrl + 'v1/sessions/login';
      const obj = {
        'personNameShort': personName,
        'password': password,
        'sessionGUID': this.session.sessionGUID,
        'login': login,
        'machineIdent': this.machineIdent,
        'taskID': this.taskId,
        'userPrincipalName': '',
      };
      const body = JSON.stringify(obj);  // {}

      const response = new LoginDataResponse(await this.http.post<LoginDataResponse>(loginSessionUrl, body).toPromise());

      console.log('loginSession done');
      const loginData = response.loginData;
      if (loginData.result === LoginResult.Ok) {
        this.session.loginData = loginData;
        this.checkUserChanged();
      }
      this.onLogin.emit(loginData);
      return response.loginData;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async changePassword(username: string, oldPassword: string, newPassword: string): Promise<ChangePasswordResponse> {
    try {
      console.log('changePassword');

      const changePasswordUrl = this.global.webApiUrl + 'v1/sessions/changePassword';
      const obj = {
        'personNameShort': username,
        'passwordHashOld': oldPassword, // Hash wird erst in WebAPI gebildet!
        'passwordHashNew': newPassword, // Hash wird erst in WebAPI gebildet!
        'personNameShortCurrent': this.session.loginData.personNameShort,
        'machineIdent': this.machineIdent,
        'taskID': this.taskId,
      };
      const body = JSON.stringify(obj);  // {}

      const response = new ChangePasswordResponse(await this.http.post<ChangePasswordResponse>(changePasswordUrl, body).toPromise());

      console.log('changePassword done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getSysData(resetLifeTime: boolean): Promise<GetSysDataResponse> {
    try {
      console.log('getSysData: resetLifeTime={0}'.format(resetLifeTime ? 'true' : 'false'));

      const getSysDataUrl = this.global.webApiUrl + 'v1/sessions/sysdata';
      const obj = {
        'sessionGUID': this.session.sessionGUID,
        'taskId': this.taskId,
        'resetLifeTime': resetLifeTime,
        'clientState': this.clientState,
      };
      const body = JSON.stringify(obj);  // {}

      const response = new GetSysDataResponse(await this.http.post<GetSysDataResponse>(getSysDataUrl, body).toPromise());

      console.log('getSysData done');
      const loginData: LoginData = response.loginData;
      if (loginData.result === LoginResult.Ok) {
        this.session.loginData = loginData;
        this.checkUserChanged();
      }
      this.onLogin.emit(loginData);
      if (response.pdmTaskState === SdbTaskState.Running) {
        this.clientState = WebClientState.Running;
      } else {
        this.clientState = WebClientState.WaitPdm;
        Global.handleError('DPM not running', this.onError);
      }
      this.onGetSysData.emit(response);

      if ((loginData.result === LoginResult.InvalidSession) ||
        (response.sessionGUID !== this.session.sessionGUID)) {
        this.validSession = false;
        this.onInvalidSession.emit(null);
      }

      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  private checkUserChanged(): void {
    if (this.session.loginData.result !== LoginResult.Ok) {
      return;
    }

    if (this.personID == null) {
      this.personID = this.session.loginData.personID;
      return;
    }

    if (this.personID !== this.session.loginData.personID) {
      this.personID = this.session.loginData.personID;
      this.onUserChanged.emit(this.session.loginData);
    }
  }

}
