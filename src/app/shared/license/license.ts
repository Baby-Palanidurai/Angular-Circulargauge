
export class GetLicenseResponse {
  noticesLicensed: boolean;

  constructor(json: GetLicenseResponse) {
    this.noticesLicensed = json.noticesLicensed;
  }
}


