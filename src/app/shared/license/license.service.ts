import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { GetLicenseResponse } from './license';
import { Global } from 'app/shared/global/global';

@Injectable()
export class LicenseService {
  public onError: EventEmitter<string> = new EventEmitter<string>();
  public license: GetLicenseResponse;

  constructor(private http: HttpClient, private global: Global) {
  }

  async getLicense(): Promise<void> {
    try {
      const uri = this.global.webApiUrl + 'v1/License/Data';
      console.log('getLicense: ' + uri);
      this.license = new GetLicenseResponse(await this.http.get<GetLicenseResponse>(uri).toPromise());
      console.log('getLicense done');
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }
}
