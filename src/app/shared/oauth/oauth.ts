
export class OauthTokenRsp {
  access_token: string;

  constructor(json: OauthTokenRsp) {
    this.access_token = json.access_token;
  }
}



