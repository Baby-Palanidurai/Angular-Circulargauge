import { Result, OdbCommandPrioSymbol } from 'app/shared/global/enum';
import { LoginData } from 'app/shared/sessions/session';

export class SysEnumType {
  enumID: number;
  enumVal: number;
  text: string;

  constructor(json: SysEnumType) {
    this.enumID = json.enumID;
    this.enumVal = json.enumVal;
    this.text = json.text;
  }
}

export class GetSysEnumTypeResponse {
  result: Result;
  sysEnumTypeList: SysEnumType[];

  constructor(json: GetSysEnumTypeResponse) {
    this.sysEnumTypeList = json.sysEnumTypeList.map(sysEnumType => new SysEnumType(sysEnumType));
    this.result = json.result;
  }
}

export class ObjText {
  textID: number;
  textList: string[];

  constructor(json: ObjText) {
    this.textID = json.textID;
    this.textList = json.textList;
  }
}

export class GetObjTextResponse {
  result: Result;
  objTextList: ObjText[];

  constructor(json: GetObjTextResponse) {
    this.objTextList = json.objTextList.map(objText => new ObjText(objText));
    this.result = json.result;
  }
}

export class CmdPrio {
  priority: number;
  text: string;
  symbol: OdbCommandPrioSymbol;

  constructor(json: CmdPrio) {
    this.priority = json.priority;
    this.text = json.text;
    this.symbol = json.symbol;
  }
}

export class GetCmdPrioListResponse {
  result: Result;
  cmdPrioList: CmdPrio[];

  constructor(json: GetCmdPrioListResponse) {
    this.cmdPrioList = json.cmdPrioList.map(cmdPrio => new CmdPrio(cmdPrio));
    this.result = json.result;
  }
}

export class GetUserDataResponse {
  loginData: LoginData;
  loginDataList: LoginData[];

  constructor(json: GetUserDataResponse) {
    this.loginData = json.loginData;
    this.loginDataList = json.loginDataList.map(loginData => new LoginData(loginData));
  }
}

export class StateText {
  constructor(public value: number, public text: string) {
  }
}
