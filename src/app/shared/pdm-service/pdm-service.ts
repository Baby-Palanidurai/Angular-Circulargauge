import { PdmServiceResult } from 'app/shared/global/enum';

export class PdmServiceResponse {
  result: PdmServiceResult;
  errorDetails: any;

  constructor(json: PdmServiceResponse) {
      this.result = json.result;
      this.errorDetails = json.errorDetails;
  }
}
