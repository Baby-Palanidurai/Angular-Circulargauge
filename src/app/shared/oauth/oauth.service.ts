import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Global } from 'app/shared/global/global';
import { OauthTokenRsp } from 'app/shared/oauth/oauth';
import { HttpParams } from '@angular/common/http';

@Injectable()
export class OauthService {
  public onError: EventEmitter<string> = new EventEmitter<string>();
  private token = '';

  constructor(private http: HttpClient, private global: Global) {
  }

  async login(): Promise<boolean> {
    try {
      console.log('create oauth token');

      const params = new HttpParams()
      .set('client_id', 'MobileClient')
      .set('grant_type', 'password')
      .set('username', 'MobileClient')
      .set('password', '12345');

      const headers = new HttpHeaders({ 'Content-type': 'application/x-www-form-urlencoded' });

      const uri = this.global.webApiUrl + 'token';
      // const uri = window.location.protocol + '//' + window.location.hostname + ':17987/' + 'token';

      const response = new OauthTokenRsp(await this.http.post<OauthTokenRsp>(uri, params.toString(), { headers: headers }).toPromise());
      this.token = response.access_token;
      console.log('create oauth token done');

      return true;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  getToken(): string {
    return this.token;
  }

}
