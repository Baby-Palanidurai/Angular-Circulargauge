import { Result } from 'app/shared/global/enum';
import { ConfigService } from 'app/shared/config/config.service';

export class ConfigData {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}

export class GetConfigDataResponse {
  configDataList: ConfigData[];
  result: Result;

  constructor(json: GetConfigDataResponse) {
    this.configDataList = json.configDataList.map(configData => new ConfigData(configData.key, configData.value));
    this.result = json.result;
  }
}



