import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { GetSysEnumTypeResponse, SysEnumType, GetObjTextResponse, GetCmdPrioListResponse, CmdPrio, GetUserDataResponse } from './text';
import { Result, LoginResult, SdbEnumId, GetObjTextScope, OdbObjectType, OdbCommandPrioSymbol } from 'app/shared/global/enum';
import { OdbConstants } from 'app/shared/global/constant';
import 'app/shared/global/string';
import { Global } from 'app/shared/global/global';
import { stringToNumber } from '@syncfusion/ej2-circulargauge';

@Injectable()
export class TextService {
  public onError: EventEmitter<string> = new EventEmitter<string>();
  private objTypeMap: Map<number, string>; // objType, Text
  private systemStatusMap: Map<number, string>; // enumVal, Text
  private commandStateMap: Map<number, string>; // enumVal, Text
  private commandModeMap: Map<number, string>; // enumVal, Text
  private connectionStateMap: Map<number, string>; // enumVal, Text
  private errorStateMap: Map<number, string>; // enumVal, Text
  private eventStateMap: Map<number, string>; // enumVal, Text
  private tendencyMap: Map<number, string>; // enumVal, Text

  private statesMap: Map<number, string[]>; // statesID, Text[]
  private cmdPrioMap: Map<number, CmdPrio>; // priority, CmdPrio
  private userNameMap: Map<number, string>; // userId, userName

  constructor(private http: HttpClient, private global: Global) {
  }

  init(): void {
    this.getAllSysEnumTypes();

    this.getStates(0);
    this.getCommandPrioSymbol(0);
    this.getUserName(0);
    this.getStatusFlagsBitText(0);
    this.getEventTransitionBitText(0);
  }

  private async getAllSysEnumTypes(): Promise<void> {
    try {
      const uri = this.global.webApiUrl + 'v1/texts/sdbenums?enumID=-1';
      console.log('getSysEnumTypes: ' + uri);
      const response: GetSysEnumTypeResponse = new GetSysEnumTypeResponse(await this.http.get<GetSysEnumTypeResponse>(uri).toPromise());
      console.log('getSysEnumTypes done');
      if (response.result === Result.Ok) {
        this.objTypeMap = new Map<number, string>();
        this.systemStatusMap = new Map<number, string>();
        this.commandStateMap = new Map<number, string>();
        this.commandModeMap = new Map<number, string>();
        this.connectionStateMap = new Map<number, string>();
        this.errorStateMap = new Map<number, string>();
        this.eventStateMap = new Map<number, string>();
        this.tendencyMap = new Map<number, string>();

        response.sysEnumTypeList.forEach(sysEnumType => {
          switch (sysEnumType.enumID) {
            case SdbEnumId.ObjectType: {
              this.objTypeMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.DeviceState: {
              this.systemStatusMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.CommandState: {
              this.commandStateMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.CommandMode: {
              this.commandModeMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.ConnectionState: {
              this.connectionStateMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.ErrorState: {
              this.errorStateMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.EventState: {
              this.eventStateMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            case SdbEnumId.Tendency: {
              this.tendencyMap.set(sysEnumType.enumVal, sysEnumType.text);
              break;
            }

            default: {
              break;
            }

          } // switch
        })
      } else {
        Global.handleError('getSysEnumTypes failed: result=' + Result[response.result], this.onError);
      }
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  private async getSysEnumType(enumID: SdbEnumId): Promise<Map<number, string>> {
    try {
      const uri = this.global.webApiUrl + 'v1/texts/sdbenums?enumID=' + enumID;
      console.log('getSysEnumType: ' + uri);
      const response: GetSysEnumTypeResponse = new GetSysEnumTypeResponse(await this.http.get<GetSysEnumTypeResponse>(uri).toPromise());
      console.log('getSysEnumType done');
      const map = new Map<number, string>();
      if (response.result === Result.Ok) {
        response.sysEnumTypeList.forEach(sysEnumType => {
          map.set(sysEnumType.enumVal, sysEnumType.text);
        })
      } else {
        Global.handleError('getSysEnumType failed: result=' + Result[response.result], this.onError);
      }
      return map;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  private async getObjText(scope: GetObjTextScope): Promise<Map<number, string[]>> {
    try {
      const uri = this.global.webApiUrl + 'v1/texts/objTexts?scope=' + scope;
      console.log('getObjText: ' + uri);
      const response: GetObjTextResponse = new GetObjTextResponse(await this.http.get<GetObjTextResponse>(uri).toPromise());
      console.log('getObjText done');
      const map = new Map<number, string[]>();
      if (response.result === Result.Ok) {
        response.objTextList.forEach(objText => {
          map.set(objText.textID, objText.textList);
        })
      } else {
        Global.handleError('getObjText failed: result=' + Result[response.result], this.onError);
      }
      return map;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  private async getCmdPrioList(): Promise<Map<number, CmdPrio>> {
    try {
      const uri = this.global.webApiUrl + 'v1/texts/cmdprios';
      console.log('getCmdPrioList: ' + uri);
      const response: GetCmdPrioListResponse = new GetCmdPrioListResponse(await this.http.get<GetCmdPrioListResponse>(uri).toPromise());
      console.log('getCmdPrioList done');
      const map = new Map<number, CmdPrio>();
      if (response.result === Result.Ok) {
        response.cmdPrioList.forEach(cmdPrio => {
          map.set(cmdPrio.priority, cmdPrio);
        })
      } else {
        Global.handleError('getCmdPrioList failed: result=' + Result[response.result], this.onError);
      }
      return map;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  private async getUserList(): Promise<Map<number, string>> {
    try {
      const uri = this.global.webApiUrl + 'v1/texts/users';
      console.log('getUserData: ' + uri);
      const response: GetUserDataResponse = new GetUserDataResponse(await this.http.get<GetUserDataResponse>(uri).toPromise());
      console.log('getUserData done');
      const map = new Map<number, string>();
      response.loginDataList.forEach(loginData => {
        if (loginData.result === LoginResult.Ok) {
          map.set(loginData.personID, loginData.personName);
        }
      })
      return map;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  getObjTypeText(objType: OdbObjectType): string {
    if (!this.objTypeMap) {
      this.objTypeMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.ObjectType).then(objTypeMap => this.objTypeMap = objTypeMap);
      if (!this.objTypeMap) {
        this.objTypeMap = new Map<number, string>();
      }
    }

    if (this.objTypeMap.has(objType)) {
      return this.objTypeMap.get(objType);
    }

    return OdbConstants.unresolvedTextFormat.format(objType.toString());
  }

  getStates(statesID: number): string[] {
    if (!this.statesMap) {
      this.statesMap = new Map<number, string[]>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getObjText(GetObjTextScope.States).then(statesMap => this.statesMap = statesMap);
      if (!this.statesMap) {
        this.statesMap = new Map<number, string[]>();
      }
    }

    if (this.statesMap.has(statesID)) {
      return this.statesMap.get(statesID);
    }

    return null;
  }

  async getStatesAsync(statesID: number): Promise<string[]> {
    if (!this.statesMap) {
      this.statesMap = await this.getObjText(GetObjTextScope.States);
    }

    if (this.statesMap.has(statesID)) {
      return this.statesMap.get(statesID);
    }

    return null;
  }

  getSystemStatusText(systemStatus: number): string {
    if (!this.systemStatusMap) {
      this.systemStatusMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.DeviceState).then(systemStatusMap => this.systemStatusMap = systemStatusMap);
      if (!this.systemStatusMap) {
        this.systemStatusMap = new Map<number, string>();
      }
    }

    if (this.systemStatusMap.has(systemStatus)) {
      return this.systemStatusMap.get(systemStatus);
    }

    return OdbConstants.unresolvedTextFormat.format(systemStatus.toString());
  }

  getCommandStateText(commandState: number): string {
    if (!this.commandStateMap) {
      this.commandStateMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.CommandState).then(commandStateMap => this.commandStateMap = commandStateMap);
      if (!this.commandStateMap) {
        this.commandStateMap = new Map<number, string>();
      }
    }

    if (this.commandStateMap.has(commandState)) {
      return this.commandStateMap.get(commandState);
    }

    return OdbConstants.unresolvedTextFormat.format(commandState.toString());
  }

  getCommandModeText(commandMode: number): string {
    if (!this.commandModeMap) {
      this.commandModeMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.CommandMode).then(commandModeMap => this.commandStateMap = commandModeMap);
      if (!this.commandModeMap) {
        this.commandModeMap = new Map<number, string>();
      }
    }

    if (this.commandModeMap.has(commandMode)) {
      return this.commandModeMap.get(commandMode);
    }

    return OdbConstants.unresolvedTextFormat.format(commandMode.toString());
  }

  getConnectionStateText(connectionState: number): string {
    if (!this.connectionStateMap) {
      this.connectionStateMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.ConnectionState).then(connectionStateMap => this.connectionStateMap = connectionStateMap);
      if (!this.connectionStateMap) {
        this.connectionStateMap = new Map<number, string>();
      }
    }

    if (this.connectionStateMap.has(connectionState)) {
      return this.connectionStateMap.get(connectionState);
    }

    return OdbConstants.unresolvedTextFormat.format(connectionState.toString());
  }

  getErrorStateText(errorState: number): string {
    if (!this.errorStateMap) {
      this.errorStateMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.ErrorState).then(errorStateMap => this.errorStateMap = errorStateMap);
      if (!this.errorStateMap) {
        this.errorStateMap = new Map<number, string>();
      }
    }

    if (this.errorStateMap.has(errorState)) {
      return this.errorStateMap.get(errorState);
    }

    return OdbConstants.unresolvedTextFormat.format(errorState.toString());
  }

  getEventStateText(eventState: number): string {
    if (!this.eventStateMap) {
      this.eventStateMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.EventState).then(eventStateMap => this.eventStateMap = eventStateMap);
      if (!this.eventStateMap) {
        this.eventStateMap = new Map<number, string>();
      }
    }

    if (this.eventStateMap.has(eventState)) {
      return this.eventStateMap.get(eventState);
    }

    return OdbConstants.unresolvedTextFormat.format(eventState.toString());
  }

  getTendencyText(tendency: number): string {
    if (!this.tendencyMap) {
      this.tendencyMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getSysEnumType(SdbEnumId.Tendency).then(tendencyMap => this.tendencyMap = tendencyMap);
      if (!this.tendencyMap) {
        this.tendencyMap = new Map<number, string>();
      }
    }

    if (this.tendencyMap.has(tendency)) {
      return this.tendencyMap.get(tendency);
    }

    return OdbConstants.unresolvedTextFormat.format(tendency.toString());
  }

  getCommandPrioSymbol(prio: number): OdbCommandPrioSymbol {
    if (!this.cmdPrioMap) {
      this.cmdPrioMap = new Map<number, CmdPrio>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getCmdPrioList().then(cmdPrioMap => this.cmdPrioMap = cmdPrioMap);
      if (!this.cmdPrioMap) {
        this.cmdPrioMap = new Map<number, CmdPrio>();
      }
    }

    if (this.cmdPrioMap.has(prio)) {
      return this.cmdPrioMap.get(prio).symbol;
    }

    return null;
  }

  getCommandPrioText(prio: number): string {
    if (!this.cmdPrioMap) {
      this.cmdPrioMap = new Map<number, CmdPrio>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getCmdPrioList().then(cmdPrioMap => this.cmdPrioMap = cmdPrioMap);
      if (!this.cmdPrioMap) {
        this.cmdPrioMap = new Map<number, CmdPrio>();
      }
    }

    if (this.cmdPrioMap.has(prio)) {
      return this.cmdPrioMap.get(prio).text;
    }

    return OdbConstants.unresolvedTextFormat.format(prio.toString());
  }

  getStatusFlagsBitText(statusFlagsBitIndex: number): string {
    return ''; // momentan nicht implementiert
  }

  getEventTransitionBitText(eventTransitionBitIndex: number): string {
    return ''; // momentan nicht implementiert
  }

  getUserName(userId: number): string {
    if (!this.userNameMap) {
      this.userNameMap = new Map<number, string>(); // zuerst initialisieren, wegen asynchronen Aufrufen von anderen Objekten!
      this.getUserList().then(userNameMap => this.userNameMap = userNameMap);
      if (!this.userNameMap) {
        this.userNameMap = new Map<number, string>();
      }
    }

    if (this.userNameMap.has(userId)) {
      return this.userNameMap.get(userId);
    }

    return OdbConstants.unresolvedTextFormat.format(userId.toString());
  }

}
