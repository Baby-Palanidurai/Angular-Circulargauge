import { Injectable, EventEmitter } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import 'app/shared/global/string';
import { ObjPropData } from '../objects/object';
import { OdbPriorityLevel } from 'app/shared/global/enum';

@Injectable()
export class Global {
  public windowWidth = window.innerWidth;
  public windowHeight = window.innerHeight;
  public onWindowWidthChanged: EventEmitter<number> = new EventEmitter<number>();
  public onWindowHeightChanged: EventEmitter<number> = new EventEmitter<number>();
  public isMobile = window.matchMedia('(max-width: 600px)').matches || (window.innerHeight > window.innerWidth);
  public onIsMobileChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  //public webApiUrl = window.location.protocol + '//' + window.location.hostname + '/InsightFacilities/HmiWebApi/';
   public webApiUrl = 'https://test1.ca-computer-automation.de/InsightFacilities/HmiWebApi/'; // Test syncfusion!!!
  // public webApiUrl = window.location.protocol + '//' + window.location.hostname + ':17987' + '/'; // Test debug WebAPI
  public onShowLoginDialog: EventEmitter<void> = new EventEmitter<void>();
  public curSelectedObjTreeNodeGroupID?: Number;
  public isIOS = false;
  public hideObjName = false;
  public prioAuto = OdbPriorityLevel.Auto;


  public static handleError(err: any, onError: EventEmitter<string>) {
    let errorText = '';

    if (err instanceof HttpErrorResponse) {
      if (err.error instanceof Error) {
        errorText = (err.error as Error).message;
      } else if (err.error && err.error.message) {
        errorText = err.error.message;
      } else {
        errorText = 'HTTP-Error ' + err.status + ': ' + err.statusText;
      }
    } else {
      if (err.message) {
        errorText = err.message;
      } else {
        errorText = err;
      }
    }

    console.log('error occured: ' + errorText);
    onError.emit(errorText);
  }

  public static getDisplayTimeStamp(filetime: number): string {
    let timeText = '';

    // let date = new Date(Global.filetimeToUnixtime(time));

    // timeText = time.toString();
    // timeText = date.toString();

    timeText = Global.filetimeAsString(filetime);

    return timeText;
  }

  public static filetimeToUnixtime(filetime: number): number {
    const epochDiff = 116444736000000000;
    const rateDiff = 10000000;
    return ((filetime - epochDiff) / rateDiff);
  }

  public static filetimeAsString(filetime: number): string {
    const ut = Global.filetimeToUnixtime(filetime);
    const date = new Date(ut * 1000);

    const year = date.getFullYear();
    const yearText = year.toString();
    const month = date.getMonth() + 1;
    let monthText = month.toString();
    if (month < 10) {
      monthText = '0' + monthText;
    }
    const day = date.getDate();
    let dayText = day.toString();
    if (day < 10) {
      dayText = '0' + dayText;
    }
    const hour = date.getHours();
    let hourText = hour.toString();
    if (hour < 10) {
      hourText = '0' + hourText;
    }
    const minute = date.getMinutes();
    let minuteText = minute.toString();
    if (minute < 10) {
      minuteText = '0' + minuteText;
    }
    const second = date.getSeconds();
    let secondText = second.toString();
    if (second < 10) {
      secondText = '0' + secondText;
    }
    let milliSecond = date.getMilliseconds();
    milliSecond /= 10;
    milliSecond = Math.floor(milliSecond);
    let milliSecondText = milliSecond.toString();
    if (milliSecond < 10) {
      milliSecondText = '0' + milliSecondText;
    }

    return '{0}.{1}.{2} {3}:{4}:{5}.{6}'.format(dayText,
      monthText,
      yearText,
      hourText,
      minuteText,
      secondText,
      milliSecondText);
  }

  public static formatDateTime(date: Date, useMilliSeconds: boolean): string {
    const year = date.getFullYear();
    const yearText = year.toString();
    const month = date.getMonth() + 1;
    let monthText = month.toString();
    if (month < 10) {
      monthText = '0' + monthText;
    }
    const day = date.getDate();
    let dayText = day.toString();
    if (day < 10) {
      dayText = '0' + dayText;
    }
    const hour = date.getHours();
    let hourText = hour.toString();
    if (hour < 10) {
      hourText = '0' + hourText;
    }
    const minute = date.getMinutes();
    let minuteText = minute.toString();
    if (minute < 10) {
      minuteText = '0' + minuteText;
    }
    const second = date.getSeconds();
    let secondText = second.toString();
    if (second < 10) {
      secondText = '0' + secondText;
    }

    if (useMilliSeconds) {
      const milliSecond = date.getMilliseconds();
      let milliSecondText = milliSecond.toString();
      if (milliSecond < 100) {
        milliSecondText = '0' + milliSecondText;
      }
      if (milliSecond < 10) {
        milliSecondText = '0' + milliSecondText;
      }
      return '{0}.{1}.{2} {3}:{4}:{5}.{6}'.format(dayText,
        monthText,
        yearText,
        hourText,
        minuteText,
        secondText,
        milliSecondText);
    } else {
      return '{0}.{1}.{2} {3}:{4}:{5}'.format(dayText,
        monthText,
        yearText,
        hourText,
        minuteText,
        secondText);
      }
  }
}

