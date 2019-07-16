import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { GetObjPropValuesResponse, ObjPropRef, GetObjDataResponse, GetObjFilterDataResponse, ObjData, ObjPropData } from './object';
import { ObjPropValueGetRsp, ObjGroup, GetObjGroupResponse, GetOdbInfoDataResponse, GetObjCmdValueResponse } from './object';
import { TextService } from 'app/shared/texts/text.service';
import { ConfigService } from 'app/shared/config/config.service';
import { ObjGroupSelector, OdbGroupLevel, OdbBinding, OdbCommandType, OdbObjectType, OdbPriorityLevel } from 'app/shared/global/enum';
import { OdbStatusFlags, SdbTaskID } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { PdmServiceResponse } from 'app/shared/pdm-service/pdm-service';

@Injectable()
export class ObjectService {
  public onError: EventEmitter<string> = new EventEmitter<string>();

  constructor(private http: HttpClient, private global: Global, private textService: TextService, private configService: ConfigService) {
  }

  async getObjTree(objGroupSelector: ObjGroupSelector, groupID?: number, level?: OdbGroupLevel): Promise<GetObjGroupResponse> {
    try {
      let uri = this.global.webApiUrl + 'v1/ObjectTree?objGroupSelector=' + objGroupSelector;
      if (groupID) {
        uri += '&groupID=';
        uri += groupID;
      }
      if (level) {
        uri += '&level=';
        uri += level;
      }
      console.log('getObjTree: ' + uri);
      const response = new GetObjGroupResponse(await this.http.get<GetObjGroupResponse>(uri).toPromise());
      console.log('getObjTree done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getObjData(objTag: string, sessionGUID: string): Promise<GetObjDataResponse> {
    try {
      const uri = this.global.webApiUrl + 'v1/objects/' + objTag + '/objdata?sessionGUID=' + sessionGUID;
      console.log('getObjData: ' + uri);

      const response = new GetObjDataResponse(await this.http.get<GetObjDataResponse>(uri).toPromise(),
        this.textService);

      console.log('getObjData done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getObjFilterData(sessionGUID: string, groupID: number): Promise<GetObjFilterDataResponse> {
    try {
      const uri = this.global.webApiUrl + 'v1/objects/objdata?sessionGUID=' + sessionGUID + '&groupID=' + groupID;
      console.log('getObjFilterData: ' + uri);

      const response = new GetObjFilterDataResponse(await this.http.get<GetObjFilterDataResponse>(uri).toPromise(),
        this.textService, this.configService);

      console.log('getObjFilterData done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getObjPropValues(propRef: ObjPropRef[]): Promise<GetObjPropValuesResponse> {
    try {
      const uri = this.global.webApiUrl + 'v1/objects/propvalues';
      console.log('getObjPropValues: ' + uri);
      const body = JSON.stringify(propRef);  // {}
      const response = new GetObjPropValuesResponse(await this.http.post<GetObjPropValuesResponse>(uri, body).toPromise());
      console.log('getObjPropValues done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getOdbInfoData(objTag: string): Promise<GetOdbInfoDataResponse> {
    try {
      const uri = this.global.webApiUrl + 'v1/objects/' + objTag + '/odbInfo';
      console.log('getOdbInfoData: ' + uri);
      const response = new GetOdbInfoDataResponse(await this.http.get<GetOdbInfoDataResponse>(uri).toPromise());
      console.log('getOdbInfoData done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getObjCmdValue(objTag: string): Promise<GetObjCmdValueResponse> {
    try {
      const uri = this.global.webApiUrl + 'v1/objects/' + objTag + '/CmdValue';
      console.log('getObjCmdValue: ' + uri);
      const response = new GetObjCmdValueResponse(await this.http.get<GetObjCmdValueResponse>(uri).toPromise());
      console.log('getObjCmdValue done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async setObjCmdValue(objTag: string, bindType: OdbBinding, cmdType: OdbCommandType, objType: OdbObjectType,
    writePrio: OdbPriorityLevel, statusFlags: OdbStatusFlags, cmdValue: number, machineIdent: string,
    personId: number, taskId: SdbTaskID): Promise<PdmServiceResponse> {
    try {
      const uri = this.global.webApiUrl + 'v1/objects/' + objTag + '/CmdValue?binding=' + bindType +
        '&cmdType=' + cmdType + '&objType=' + objType + '&priority=' + writePrio + '&statusFlags=' + statusFlags +
        '&cmdValue=' + cmdValue + '&machineIdent=' + machineIdent + '&personId=' + personId + '&taskId=' + taskId;
      console.log('setObjCmdValue: ' + uri);
      const body = JSON.stringify({});  // {}
      const response = new PdmServiceResponse(await this.http.post<PdmServiceResponse>(uri, body).toPromise());
      console.log('setObjCmdValue done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

}
