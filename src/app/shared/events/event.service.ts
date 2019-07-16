import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import {
  AckEventsReq, AckEventsRsp, GetEventStatesReq, GetEventStatesRsp,
  GetEvGroupDefDataResponse, EvGroupDefData, Limits
} from './event';
import { OdbConstants } from 'app/shared/global/constant';
import { Result } from 'app/shared/global/enum';
import { TextService } from 'app/shared/texts/text.service';
import { Global } from 'app/shared/global/global';

@Injectable()
export class EventService {
  public onError: EventEmitter<string> = new EventEmitter<string>();
  /*
    private headers = new HttpHeaders({
      'Content-type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + this.global.webApiOAuthAccessToken
    });
  */
  private evGroupMap: Map<number, EvGroupDefData>; // userId, userName

  constructor(private http: HttpClient, private global: Global, private textService: TextService) {
  }

  async ackEvents(ackEventsReq: AckEventsReq): Promise<AckEventsRsp> {
    try {
      const uri = this.global.webApiUrl + 'v1/Events/Acknowledge';
      console.log('ackEvents: ' + uri);
      const body = JSON.stringify(ackEventsReq);  // {}
      const response = new AckEventsRsp(await this.http.post<AckEventsRsp>(uri, body).toPromise());
      console.log('ackEvents done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getEventStates(getEventStatesReq: GetEventStatesReq): Promise<GetEventStatesRsp> {
    try {
      const uri = this.global.webApiUrl + 'v1/Events/EventStates';
      console.log('getEventStates: ' + uri);
      const body = JSON.stringify(getEventStatesReq);  // {}
      const response = new GetEventStatesRsp(await this.http.post<GetEventStatesRsp>(uri, body).toPromise(),
        this.textService, this, this.global);
      console.log('getEventStates done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getEvGroupDefData(): Promise<Map<number, EvGroupDefData>> {
    try {
      const uri = this.global.webApiUrl + 'v1/Events/EvGroupDefData';
      console.log('getEvGroupDefData: ' + uri);
      const response = new GetEvGroupDefDataResponse(await this.http.get<GetEvGroupDefDataResponse>(uri).toPromise());
      console.log('getEvGroupDefData done');
      this.evGroupMap = new Map<number, EvGroupDefData>();
      if (response.result === Result.Ok) {
        response.evGroupDefDataList.forEach(evGroupDefData => {
          this.evGroupMap.set(evGroupDefData.evGroupId, evGroupDefData);
        })
      }
      return this.evGroupMap;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  getEvGroup(evGroupId: number): EvGroupDefData {
    if (this.evGroupMap && this.evGroupMap.has(evGroupId)) {
      return this.evGroupMap.get(evGroupId);
    }

    return null;
  }

  getEvGroupText(evGroupId: number): string {
    if (this.evGroupMap && this.evGroupMap.has(evGroupId)) {
      return this.evGroupMap.get(evGroupId).text;
    }

    return OdbConstants.unresolvedTextFormat.format(evGroupId.toString());
  }

  async getLimits(objTag: string): Promise<Limits> {
    try {
      const uri = this.global.webApiUrl + 'v1/events/' + objTag + '/Limits';
      console.log('getLimits: ' + uri);
      const response = new Limits(await this.http.get<Limits>(uri).toPromise());
      console.log('getLimits done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

}
