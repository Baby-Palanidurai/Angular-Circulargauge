import { Result, LoginResult, WebClientState, SdbTaskState, PasswordResult } from 'app/shared/global/enum';

export class LoginData {
  personID: number;
  personName: string;
  personNameShort: string;
  result: LoginResult;
  roleId: number;

  constructor(json: LoginData) {
    this.personID = json.personID;
    this.personName = json.personName;
    this.personNameShort = json.personNameShort;
    this.result = json.result;
    this.roleId = json.roleId;
  }
}

export class Session {
  sessionGUID: string;
  result: Result;
  loginData: LoginData;
  clientState: WebClientState;
  reconnectTimeout: number;

  constructor(json: Session) {
    this.sessionGUID = json.sessionGUID;
    this.result = json.result;
    this.loginData = new LoginData(json.loginData);
    this.clientState = json.clientState;
    this.reconnectTimeout = 0;
  }
}

export class LoginDataResponse {
  loginData: LoginData;

  constructor(json: LoginDataResponse) {
    this.loginData = new LoginData(json.loginData);
  }
}

export class GetSysDataResponse {
  loginData: LoginData;
  eventCount: number;
  maintenanceText: string;
  pdmTaskState: SdbTaskState;
  sessionGUID: string;

  constructor(json: GetSysDataResponse) {
    this.loginData = new LoginData(json.loginData);
    this.eventCount = json.eventCount;
    this.maintenanceText = json.maintenanceText;
    this.pdmTaskState = json.pdmTaskState;
    this.sessionGUID = json.sessionGUID;
  }
}

export class ChangePasswordResponse {
  result: PasswordResult;

  constructor(json: ChangePasswordResponse) {
    this.result = json.result;
  }
}
