import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { Session, GetSysDataResponse, LoginData } from 'app/shared/sessions/session';
import { SessionService } from 'app/shared/sessions/session.service';
import { GetSysEnumTypeResponse } from 'app/shared/texts/text';
import { TextService } from 'app/shared/texts/text.service';
import { TimerService } from 'app/shared/timers/timer.service';
import { LicenseService } from 'app/shared/license/license.service';
import { OauthService } from 'app/shared/oauth/oauth.service';
import { UpdateService } from 'app/shared/update/update.service';
import { EventService } from 'app/shared/events/event.service';
import { ObjectService } from 'app/shared/objects/object.service';
import { Router } from '@angular/router';
import { Result, LoginResult, WebClientState, OdbPriorityLevel, OdbObjectType } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { Idle, DEFAULT_INTERRUPTSOURCES, AutoResume } from '@ng-idle/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ToastComponent } from '@syncfusion/ej2-angular-notifications';
import { ConfigService } from 'app/shared/config/config.service';
import { AppModule } from './app.module';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('container1', { static: false }) container1: HTMLElement;

  @ViewChild('errorMsg', { static: false }) errorMsg: ToastComponent;
  @ViewChild('maintenanceMsgs', { static: false }) maintenanceMsgs: ToastComponent;
  private timerStarted = false;
  private userActionOccured = false;

  closed = false;

  constructor(private idle: Idle, private global: Global, private licenseService: LicenseService,
    private timerService: TimerService, private sessionService: SessionService, private textService: TextService,
    private configService: ConfigService,
    private router: Router, private oauthService: OauthService, private updateService: UpdateService,
    private eventService: EventService, private objectService: ObjectService, private deviceService: DeviceDetectorService) {
    this.licenseService.onError.subscribe(errorText => this.onLicenseError(errorText));
    this.sessionService.onSessionCreated.subscribe(session => this.onSessionCreated(session));
    this.sessionService.onInvalidSession.subscribe(() => this.onInvalidSession());
    this.sessionService.onGetSysData.subscribe(getSysDataResponse => this.onGetSysData(getSysDataResponse));
    this.sessionService.onLogin.subscribe(loginData => this.onLogin(loginData));
    this.sessionService.onUserChanged.subscribe(loginData => this.onUserChanged(loginData));
    this.sessionService.onError.subscribe(errorText => this.onSessionError(errorText));
    this.textService.onError.subscribe(errorText => this.onTextError(errorText));
    this.timerService.onTimer5s.subscribe(() => this.onTimer5s());
    this.eventService.onError.subscribe(errorText => this.onEventError(errorText));
    this.objectService.onError.subscribe(errorText => this.onObjectError(errorText));
    // sets an idle timeout of 50 seconds
    this.idle.setIdleName('userActionOccured');
    this.idle.setIdle(60);
    // sets the default interrupts, in this case, things like clicks, scrolls, touches to the document
    this.idle.setInterrupts(DEFAULT_INTERRUPTSOURCES);
    this.idle.onInterrupt.subscribe(eventArgs => this.onUserActionOccured(eventArgs));
    this.oauthService.onError.subscribe(errorText => this.onOauthError(errorText));

    if (this.deviceService.getDeviceInfo().os.toUpperCase() === 'MAC') {
      this.global.isIOS = true;
    }
  }

  ngOnInit() {
    console.log('ngOnInit (AppComponent)');

    this.updateService.checkForUpdates();
  }

  async ngAfterViewInit(): Promise<void> {
    console.log('ngAfterViewInit (AppComponent)');

    if (await this.oauthService.login()) {
      await this.licenseService.getLicense();
      this.sessionService.createSession(false);
    }
  }

  ngOnDestroy() {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!  ngOnDestroy (AppComponent)');
    // Wenn das hier aufgerufen würde, dann könnte man hier die Session disconnecten!!!
    // Dann wäre aber vermutlich der aktuell angemeldete Benutzer wieder angemeldet, weil die Session gelöscht wird!?!
    // Beim nächsten Start müsste man sich dann auf jeden Fall wieder neu anmelden, was jetzt nicht der Fall ist wegen Cookie

    // if(this.sessionService.validSession) {
    // }
  }

  private onUserActionOccured(eventArgs: any): void {
    this.userActionOccured = true;
  }

  private onTimer5s(): void {
    if (!this.timerStarted) {
      return;
    }

    console.log('onGetSysDataTimeout');

    this.getSysData();
  }

  private showError(titleText: string, detail: string): void {
    const title = '{0} ({1})'.format(titleText, Global.formatDateTime(new Date(), false));

    if (this.errorMsg.element.childElementCount !== 0) {
      this.errorMsg.hide('All');
    }

    this.errorMsg.show({
      title: title,
      content: detail,
      animation: {
        show: { duration: 0 }, // damit Toast bei refresh quasi stehen bleibt!
        hide: { duration: 0 } // damit Toast bei refresh quasi stehen bleibt!
      }
    });
  }

  private async onSessionCreated(session: Session): Promise<void> {
    if (session.result !== Result.Ok) {
      setTimeout(() => {
        this.sessionService.createSession(true);
      },
        session.reconnectTimeout * 1000);
    } else {
      this.readGlobalSettings();
      this.getSysData();
      this.timerStarted = true;
    }
  }

  private onInvalidSession() {
    this.timerStarted = false;
    setTimeout(() => {
      this.sessionService.createSession(true);
    },
      5000);
  }

  private async onGetSysData(getSysDataResponse: GetSysDataResponse): Promise<void> {
    if (this.maintenanceMsgs.element.childElementCount !== 0) {
      this.maintenanceMsgs.hide('All');
    }

    if (getSysDataResponse.maintenanceText) {
      this.maintenanceMsgs.show({
        title: 'Wartungsmeldung',
        content: getSysDataResponse.maintenanceText,
        animation: {
          show: { duration: 0 }, // damit Toast bei refresh quasi stehen bleibt!
          hide: { duration: 0 } // damit Toast bei refresh quasi stehen bleibt!
        }
      });
    }
  }

  async readGlobalSettings() {
    // Lesen von Text-Services anstossen
    this.textService.init();

    // Lesen von Config-Services anstossen
    this.configService.init();

    // HideObjName
    let getConfigDataResponse = await this.configService.getConfigDataDefinition('project.ini', 'Mobile-Client');
    if (getConfigDataResponse && getConfigDataResponse.result === Result.Ok) {
      let hideObjNameNum: number;
      getConfigDataResponse.configDataList.forEach(configData => {
        if (configData.key.toUpperCase() === 'HideObjName'.toUpperCase()) {
          hideObjNameNum = parseInt(configData.value, 10);
          this.global.hideObjName = (hideObjNameNum === 1) ? true : false;
        }
      })
    }

    // PrioAuto
    getConfigDataResponse = await this.configService.getConfigDataDefinition('project.ini', 'Bindings');
    if (getConfigDataResponse && getConfigDataResponse.result === Result.Ok) {
      getConfigDataResponse.configDataList.forEach(configData => {
        if (configData.key.toUpperCase() === 'PrioAuto'.toUpperCase()) {
          this.global.prioAuto = parseInt(configData.value, 10) as OdbPriorityLevel;
        }
      })
    }
  }

  getSysData(): void {
    this.sessionService.getSysData(this.userActionOccured);

    this.userActionOccured = false;
    this.idle.stop();
    this.idle.watch();
  }

  private onLicenseError(errorText: string) {
    this.showError('License-Service Error', errorText);
  }

  private onSessionError(errorText: string) {
    this.showError('Session-Service Error', errorText);
  }

  private onOauthError(errorText: string) {
    this.showError('OAuth-Service Error', errorText);

    setTimeout(async () => {
      if (await this.oauthService.login()) {
        await this.licenseService.getLicense();
        this.sessionService.createSession(false);
      }
    },
      30000);
  }

  private onTextError(errorText: string) {
    this.showError('Text-Service Error', errorText);
  }

  private onEventError(errorText: string) {
    this.showError('Event-Service Error', errorText);
  }

  private onObjectError(errorText: string) {
    this.showError('Object-Service Error', errorText);
  }

  private onLogin(loginData: LoginData) {
    if (loginData.result !== LoginResult.Ok) {
      this.showError('Service Error', LoginResult[loginData.result]);
    }
  }

  onResize(event) {
    this.global.windowWidth = event.target.innerWidth;
    this.global.onWindowWidthChanged.emit(this.global.windowWidth);

    this.global.windowHeight = event.target.innerHeight;
    this.global.onWindowHeightChanged.emit(this.global.windowHeight);

    this.global.isMobile = window.matchMedia('(max-width: 600px)').matches ||
      (event.target.innerHeight > event.target.innerWidth);
    this.global.onIsMobileChanged.emit(this.global.isMobile);
  }

  /*
    // Wird momentan bei Beenden der Website bzw. WebApp nicht verwendet,
    // da Ef ein Sicherheitsrisiko mit Client-Lizenzen sieht und wir deshalb
    // jeden Client beim beenden lieber nach 5 Minuten in den Zustand "keine Rückmeldung"
    // laufen lassen.
    async onBeforeUnload(event) {
      await this.sessionService.setClientState(WebClientState.Idle);
      return undefined;
    }
  */

  private async onUserChanged(loginData: LoginData): Promise<void> {
    this.resetUserSettings();
    this.router.navigate(['']);
  }

  private resetUserSettings(): void {
    this.global.curSelectedObjTreeNodeGroupID = undefined;
  }

  async destory() {
    if (this.sessionService.validSession) {
      // await this.sessionService.setClientState(WebClientState.Idle);
    }

    this.closed = true;
  }

  start() {
  }
}
