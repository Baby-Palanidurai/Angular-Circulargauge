import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GetConfigDataResponse } from './config';
import { Result, OdbObjectType } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';

@Injectable()
export class ConfigService {
  public onError: EventEmitter<string> = new EventEmitter<string>();
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  private objTypeColorMap: Map<OdbObjectType, string>; // objType, color

  constructor(private http: HttpClient, private global: Global) {
  }

  init(): void {
    this.getObjTypeColors();
  }

  getDefaultObjTypeColors() {
    const map = new Map<OdbObjectType, string>();

    map.set(OdbObjectType.Alarm, '#E60000');
    map.set(OdbObjectType.Status, '#008040');
    map.set(OdbObjectType.Maintenance, '#008040');
    map.set(OdbObjectType.MultistateInput, '#008040');
    map.set(OdbObjectType.MultistateOutput, '#000000');
    map.set(OdbObjectType.MultistateValue, '#000000');
    map.set(OdbObjectType.BinaryOutput, '#000000');
    map.set(OdbObjectType.BinaryValue, '#008040');
    map.set(OdbObjectType.MeasuredValue, '#0000FF');
    map.set(OdbObjectType.AnalogValue, '#0000FF');
    map.set(OdbObjectType.Setpoint, '#800080');
    map.set(OdbObjectType.ManipulatedValue, '#000000');
    map.set(OdbObjectType.Counter, '#320080');
    map.set(OdbObjectType.CounterOperatingHours, '#320080');
    map.set(OdbObjectType.CounterConsumption, '#320080');
    map.set(OdbObjectType.Trigger, '#000000');
    map.set(OdbObjectType.Error, '#FF0000');
    map.set(OdbObjectType.Device, '#E673000');
    map.set(OdbObjectType.Network, '#800000');
    map.set(OdbObjectType.Loop, '#8C4600');
    map.set(OdbObjectType.PDM, '#800000');
    map.set(OdbObjectType.EventEnrollment, '#E60000');

    return map;
  }

  async getObjTypeColors(): Promise<Map<number, string>> {
    this.objTypeColorMap = this.getDefaultObjTypeColors();
    const response = await this.getConfigDataDefinition('project.ini', 'Object-Viewer');
    if (response.result === Result.Ok) {
      response.configDataList.forEach(configData => {
        // ObjType => Bsp.: 'ColorAlarm'
        if (!configData.key.startsWith('Color')) {
          return;
        }

        const objTypeString = configData.key.substr(5, configData.key.length - 5);

        const objType = OdbObjectType[objTypeString] as OdbObjectType;

        // Color => Bsp.: '128,0,0'
        const rgbColor = configData.value;

        const colorArray = rgbColor.split(',');

        if (!colorArray || (colorArray.length !== 3)) {
          return;
        }

        const rInt = Number.parseInt(colorArray[0], 10);
        const gInt = Number.parseInt(colorArray[1], 10);
        const bInt = Number.parseInt(colorArray[2], 10);

        let r = rInt.toString(16);
        if (r.length < 2) {
          r = '0' + r;
        }
        let g = gInt.toString(16);
        if (g.length < 2) {
          g = '0' + g;
        }
        let b = bInt.toString(16);
        if (b.length < 2) {
          b = '0' + b;
        }

        const color = '#{0}{1}{2}'.format(r, g, b);

        this.objTypeColorMap.set(objType, color);
      })
    }
    return this.objTypeColorMap;
  }

  getObjTypeColor(objType: OdbObjectType): string {
    if (this.objTypeColorMap && this.objTypeColorMap.has(objType)) {
      return this.objTypeColorMap.get(objType);
    }

    return '#000000'; // schwarz
  }

  async getConfigDataDefinition(definitionFilename: string, section: string): Promise<GetConfigDataResponse> {
    try {
      const uri = this.global.webApiUrl +
        'v1/Config/ConfigDataDefinition' +
        '?definitionFilename={0}&section={1}'.format(definitionFilename, section);
      console.log('getConfigDataDefinition: ' + uri);
      const response = new GetConfigDataResponse(await this.http.get<GetConfigDataResponse>(uri).toPromise());
      console.log('getConfigDataDefinition done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

  async getConfigDataRuntime(personNameShort: string, fallbackMachineIdent: string, section: string): Promise<GetConfigDataResponse> {
    try {
      const uri = this.global.webApiUrl +
        'v1/Config/ConfigDataRuntime' +
        '?personNameShort={0}&fallbackMachineIdent={1}&section={2}'.format(personNameShort, fallbackMachineIdent, section);
      console.log('getConfigDataRuntime: ' + uri);
      const response = new GetConfigDataResponse(await this.http.get<GetConfigDataResponse>(uri).toPromise());
      console.log('getConfigDataRuntime done');
      return response;
    } catch (error) {
      Global.handleError(error, this.onError);
    }
  }

}
