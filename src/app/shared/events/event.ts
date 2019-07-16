import { BACnetEventTransitions, NoticePriority, GetEventStatesFilterScope, OdbObjectType } from 'app/shared/global/enum';
import { NoticeFlags, BACnetEventTransitionBits } from 'app/shared/global/enum';
import { BACnetNotifyType, BACnetEventState, AuthdbObjAccessRights, Result, SdbTaskID, SdbPropertyId } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { TextService } from 'app/shared/texts/text.service';
import { EventService } from 'app/shared/events/event.service';
import * as Base64ArrayBuffer from 'base64-arraybuffer';

export class AckEventsReq {
  forceOnFailure: boolean;
  signature: AckEventSignature;
  transitions: BACnetEventTransitions;
  eventIdsToAck?: number[];
  objTagsToAck?: string[];

  constructor(forceOnFailure: boolean,
    signature: AckEventSignature,
    transitions: BACnetEventTransitions,
    eventIdsToAck?: number[],
    objTagsToAck?: string[]) {
    this.forceOnFailure = forceOnFailure;
    this.signature = signature;
    this.transitions = transitions;
    this.eventIdsToAck = eventIdsToAck;
    this.objTagsToAck = objTagsToAck;
  }
}

export class AckEventSignature {
  ackTime: number;
  machineIdent: string;
  noticePrio: NoticePriority;
  noticeSubject: string;
  noticeText: string;
  sessionGUID: string;
  personId?: number;
  taskId: number = SdbTaskID.hiWebApp;

  constructor(ackTime: number,
    machineIdent: string,
    noticePrio: NoticePriority,
    noticeSubject: string,
    noticeText: string,
    sessionGUID: string,
    personId?: number) {
    this.ackTime = ackTime;
    this.machineIdent = machineIdent;
    this.noticePrio = noticePrio;
    this.noticePrio = noticePrio;
    this.noticeText = noticeText;
    this.sessionGUID = sessionGUID;
    this.personId = personId;
  }
}

export class AckEventsRsp {

  constructor(json: AckEventsRsp) {
  }
}

export class ActiveEventData {
  eventStateInfo: EventStateInfo;
  objAccessRights: AuthdbObjAccessRights;
  evGroupDefData: EvGroupDefData;
  color = '#000000'; // schwarz
  ackRequired = false;
  objTag2: string;

  constructor(eventStateInfo: EventStateInfo, objAccessRights: AuthdbObjAccessRights, eventService: EventService) {
    this.objTag2 = eventStateInfo.objTag;

    this.eventStateInfo = eventStateInfo;
    this.objAccessRights = objAccessRights;
    this.evGroupDefData = eventService.getEvGroup(this.eventStateInfo.evGroupId);

    this.setAckRequired(); // zuerst !!!
    this.setColor(); // danach !!!
  }

  private setColor(): void {
    let color = '#000000'; // schwarz

    if (this.evGroupDefData == null) {
      color = '#000000'; // schwarz
    } else {
      // Prüfen, ob alle Quittungen erfolgt sind
      let argb: string;

      if (this.ackRequired) { // Quittung erwartet
        if ((this.eventStateInfo.evState === BACnetEventState.Normal) &&
          (this.eventStateInfo.evTimes[2] !== 0)) { // gegangen
          argb = this.evGroupDefData.colorInactiveAckExpected; // Quittung erwartet (inaktiv)
        } else { // noch nicht gegangen
          argb = this.evGroupDefData.colorActiveAckExpected; // Quittung erwartet (aktiv)
        }
      } else {
        if (this.eventStateInfo.acksReq === BACnetEventTransitions.None) {
          argb = this.evGroupDefData.colorActiveAckUnnecessary; // Quittung unnötig (aktiv)
        } else {
          argb = this.evGroupDefData.colorActiveAcknowledged; // Quittung erfolgt (aktiv)
        }
      }

      if (argb.length < 8) {
        color = '#000000'; // schwarz
      } else {
        const rgb = argb.substr(2, 6);

        color = '#{0}'.format(rgb);
      }
    }

    if (color !== this.color) {
      //console.log('set color: old color={0}, new color={1}, item={2}'.format(this.color, color, this.eventStateInfo.msgText));
      this.color = color;
      //console.log('color set: new color={0}, item={1}'.format(this.color, this.eventStateInfo.msgText));
    } else {
      //console.log('color not changed: old color={0}, new color={1}, item={2}'.format(this.color, color, this.eventStateInfo.msgText));
    }
  }

  public setColorTest(): void {
    if (this.color === '#000000') {
      this.color = '#F01400'
    } else {
      this.color = '#000000'

    }
  }

  private setAckRequired(): void {
    let ackRequired = false;

    if (((this.eventStateInfo.acksReq & BACnetEventTransitions.ToOffNormal) === BACnetEventTransitions.ToOffNormal) &&
      (this.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToOffNormal] === 0)) {
      ackRequired = true;
    } else if (((this.eventStateInfo.acksReq & BACnetEventTransitions.ToFault) === BACnetEventTransitions.ToFault) &&
      (this.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToFault] === 0)) {
      ackRequired = true;
    } else if (((this.eventStateInfo.acksReq & BACnetEventTransitions.ToNormal) === BACnetEventTransitions.ToNormal) &&
      (this.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToNormal] === 0)) {
      ackRequired = true;
    }

    if (ackRequired !== this.ackRequired) {
      this.ackRequired = ackRequired;
    }
  }

  update(eventStateInfo: EventStateInfo, objAccessRights: AuthdbObjAccessRights, textService: TextService,
    eventService: EventService, global: Global): boolean {
    let hasChanged = false;

    /*
        let b = true;
    
        if (this.objTag2 === 'Ay0000133') {
    
    
          if (Object.isFrozen(this.eventStateInfo.evState)) {
            console.log ('----- this.eventStateInfo.evState is immutable.');
          } else {
            console.log ('----- this.eventStateInfo.evState is mutable.');
          }
    
          if (Object.isFrozen(this)) {
            console.log ('+++++ this is immutable.');
          } else {
            console.log ('+++++ this is mutable.');
          }
    
          b = this.eventStateInfo.CompareProperties(this.eventStateInfo, eventStateInfo);
    
          if (!b) {
            console.log('this.eventStateInfo.CompareProperties changed!!!: old EventState={0}, new EventState={1}'.format(this.eventStateInfo.evState.toString(), eventStateInfo.evState.toString()));
          } else {
            console.log('this.eventStateInfo.CompareProperties not changed!!!: old EventState={0}, new EventState={1}'.format(this.eventStateInfo.evState.toString(), eventStateInfo.evState.toString()));
          }
        }
    */

    if (!this.eventStateInfo.CompareProperties(this.eventStateInfo, eventStateInfo)) {
      hasChanged = true;
    }

    if (hasChanged) {
      // kein update aufrufen , da this.eventStateInfo wohl immutable und Werte darin nicht mehr verändert werden können!!!
      // Deshalb this.eventStateInfo mit neuen eventStateInfo versehen !!!
      //this.eventStateInfo.update(eventStateInfo, textService, eventService, global);
      this.eventStateInfo = eventStateInfo;
    }

    /*
        if (!b) {
          console.log('!!!!!!!!!!!!!!!!!!!!!!!!: old EventState={0}, new EventState={1}'.format(this.eventStateInfo.evState.toString(), eventStateInfo.evState.toString()));
        }
    */

    if (this.objAccessRights !== objAccessRights) {
      this.objAccessRights = objAccessRights;
      hasChanged = true;
    }

    this.setAckRequired(); // zuerst !!!
    this.setColor(); // danach !!!

    return hasChanged;
  }

  get comeTimeCompareEntry(): any {
    return {
      toOffNormalTime: this.eventStateInfo.evTimes[BACnetEventTransitionBits.ToOffNormal],
      toFaultTime: this.eventStateInfo.evTimes[BACnetEventTransitionBits.ToFault],
      objTag: this.eventStateInfo.objTag
    };
  }

  get goTimeCompareEntry(): any {
    return {
      timeNormalTime: this.eventStateInfo.evTimes[BACnetEventTransitionBits.ToNormal],
      objTag: this.eventStateInfo.objTag
    };
  }

  get ackToOffNormalTimeCompareEntry(): any {
    return {
      ackToOffNormalTime: this.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToOffNormal],
      objTag: this.eventStateInfo.objTag
    };
  }

  get ackToFaultTimeCompareEntry(): any {
    return {
      ackToFaultTime: this.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToFault],
      objTag: this.eventStateInfo.objTag
    };
  }

  get ackToNormalTimeCompareEntry(): any {
    return {
      ackToNormalTime: this.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToNormal],
      objTag: this.eventStateInfo.objTag
    };
  }
}

export class GetEventStatesReq {
  filter: GetEventStatesFilter;
  languageId: number;
  resetSession: boolean;
  sessionGUID: string;
  taskId: number;

  constructor(onlyChanged: boolean, filter: GetEventStatesFilter, sessionGUID: string) {
    this.filter = filter;
    this.languageId = 1;
    this.resetSession = !onlyChanged;
    this.sessionGUID = sessionGUID;
    this.taskId = SdbTaskID.hiWebApp;
  }
}

export class GetEventStatesFilter {
  eventGroup1Pattern: string;
  eventGroup2Pattern: string;
  eventGroup3Pattern: string;
  eventGroup4Pattern: string;
  eventTransitions: BACnetEventTransitions;
  objName1Pattern: string;
  objName2Pattern: string;
  objName3Pattern: string;
  objName4Pattern: string;
  objName5Pattern: string;
  scope: GetEventStatesFilterScope;
  taskId: number;

  constructor() {
    this.eventTransitions = BACnetEventTransitions.All;
    this.objName1Pattern = '*';
    this.scope = GetEventStatesFilterScope.IncludeDisableDistribution | GetEventStatesFilterScope.Active;
    this.taskId = SdbTaskID.Unknown;
  }
}

export class EventStateInfo {
  acksReq: BACnetEventTransitions;
  ackTimes: number[];
  active: boolean;
  addOnTextFileName: string;
  evCnt: number;
  evIds: number[];
  evState: BACnetEventState;
  evTimes: number[];
  evGroupId: number;
  imageId?: number;
  itemDsgn: string;
  ackPersonId?: number;
  msgText: string;
  noticesFlags: NoticeFlags;
  notifyType: BACnetNotifyType;
  objDescr: string;
  objGroupId: number;
  objGroupText: string;
  objName: string;
  objTag: string;
  objType: OdbObjectType;
  plantDescr: string;
  prio: number;
  responsible: string;
  stateText: string;
  eventStateText: string;
  comeTimeText: string;
  goTimeText: string;
  ackToOffNormalTimeText: string;
  ackToFaultTimeText: string;
  ackToNormalTimeText: string;
  lastAckPersonName: string;
  evGroupText: string;

  constructor(json: EventStateInfo, textService: TextService, eventService: EventService, global: Global) {
    this.acksReq = json.acksReq;
    this.ackTimes = json.ackTimes;
    this.active = json.active;
    this.addOnTextFileName = json.addOnTextFileName;
    this.evCnt = json.evCnt;
    this.evIds = json.evIds;
    this.evState = json.evState;
    this.evTimes = json.evTimes;
    this.evGroupId = json.evGroupId;
    this.evGroupText = eventService.getEvGroupText(json.evGroupId);
    this.imageId = json.imageId;
    this.itemDsgn = json.itemDsgn;
    this.ackPersonId = json.ackPersonId;
    this.msgText = json.msgText;
    this.noticesFlags = json.noticesFlags;
    this.notifyType = json.notifyType;
    this.objDescr = json.objDescr;
    this.objGroupId = json.objGroupId;
    this.objGroupText = json.objGroupText;
    this.objName = json.objName;
    this.objTag = json.objTag;
    this.objType = json.objType;
    this.plantDescr = json.plantDescr;
    this.prio = json.prio;
    this.responsible = json.responsible;
    this.stateText = json.stateText;

    this.setEventStateText(textService);
    this.setComeTimeText(global);
    this.setGoTimeText(global);
    this.setAckToOffNormalTimeText(global);
    this.setAckToFaultTimeText(global);
    this.setAckToNormalTimeText(global);
    this.setLastAckPersonName(textService);
  }

  /*
    update(eventStateInfo: EventStateInfo, textService: TextService, eventService: EventService, global: Global) {
      this.acksReq = eventStateInfo.acksReq;
      this.ackTimes = eventStateInfo.ackTimes;
      this.active = eventStateInfo.active;
      this.addOnTextFileName = eventStateInfo.addOnTextFileName;
      this.evCnt = eventStateInfo.evCnt;
      this.evIds = eventStateInfo.evIds;
  
      console.log('!!!!!!!!!!!!! vor !! old EventState={0}, new EventState={1}'.format(this.evState.toString(), eventStateInfo.evState.toString()));
      this.evState = eventStateInfo.evState;
      console.log('!!!!!!!!!!!!! danach !! old EventState={0}, new EventState={1}'.format(this.evState.toString(), eventStateInfo.evState.toString()));
  
  
      this.evTimes = eventStateInfo.evTimes;
      this.evGroupId = eventStateInfo.evGroupId;
      this.evGroupText = eventService.getEvGroupText(eventStateInfo.evGroupId);
      this.imageId = eventStateInfo.imageId;
      this.itemDsgn = eventStateInfo.itemDsgn;
      this.ackPersonId = eventStateInfo.ackPersonId;
      this.msgText = eventStateInfo.msgText;
      this.noticesFlags = eventStateInfo.noticesFlags;
      this.notifyType = eventStateInfo.notifyType;
      this.objDescr = eventStateInfo.objDescr;
      this.objGroupId = eventStateInfo.objGroupId;
      this.objGroupText = eventStateInfo.objGroupText;
      this.objName = eventStateInfo.objName;
      this.objTag = eventStateInfo.objTag;
      this.objType = eventStateInfo.objType;
      this.plantDescr = eventStateInfo.plantDescr;
      this.prio = eventStateInfo.prio;
      this.responsible = eventStateInfo.responsible;
      this.stateText = eventStateInfo.stateText;
  
      this.setEventStateText(textService);
      this.setComeTimeText(global);
      this.setGoTimeText(global);
      this.setAckToOffNormalTimeText(global);
      this.setAckToFaultTimeText(global);
      this.setAckToNormalTimeText(global);
      this.setLastAckPersonName(textService);
    }
  */

  private setEventStateText(textService: TextService): void {
    this.eventStateText = textService.getEventStateText(this.evState);
  }

  private setComeTimeText(global: Global): void {
    const toOffNormalTime = this.evTimes[BACnetEventTransitionBits.ToOffNormal];
    const toFaultTime = this.evTimes[BACnetEventTransitionBits.ToFault];

    if ((toOffNormalTime !== 0) || (toFaultTime !== 0)) {
      const time = Math.max(toOffNormalTime, toFaultTime);
      this.comeTimeText = Global.getDisplayTimeStamp(time);
      return;
    }

    if (global.isMobile) {
      this.comeTimeText = '-';
      return;
    }

    this.comeTimeText = '';
  }

  private setGoTimeText(global: Global): void {
    if (this.evTimes[BACnetEventTransitionBits.ToNormal] !== 0) {
      this.goTimeText = Global.getDisplayTimeStamp(this.evTimes[BACnetEventTransitionBits.ToNormal]);
      return;
    }

    if (global.isMobile) {
      this.goTimeText = '-';
      return;
    }

    this.goTimeText = '';
  }

  private setAckToOffNormalTimeText(global: Global): void {
    if (this.ackTimes[BACnetEventTransitionBits.ToOffNormal] !== 0) {
      this.ackToOffNormalTimeText = Global.getDisplayTimeStamp(this.ackTimes[BACnetEventTransitionBits.ToOffNormal]);
      return;
    }

    if (global.isMobile) {
      this.ackToOffNormalTimeText = '-';
      return;
    }

    this.ackToOffNormalTimeText = '';
  }

  private setAckToFaultTimeText(global: Global): void {
    if (this.ackTimes[BACnetEventTransitionBits.ToFault] !== 0) {
      this.ackToFaultTimeText = Global.getDisplayTimeStamp(this.ackTimes[BACnetEventTransitionBits.ToFault]);
      return;
    }

    if (global.isMobile) {
      this.ackToFaultTimeText = '-';
      return;
    }

    this.ackToFaultTimeText = '';
  }

  private setAckToNormalTimeText(global: Global): void {
    if (this.ackTimes[BACnetEventTransitionBits.ToNormal] !== 0) {
      this.ackToNormalTimeText = Global.getDisplayTimeStamp(this.ackTimes[BACnetEventTransitionBits.ToNormal]);
      return;
    }

    if (global.isMobile) {
      this.ackToNormalTimeText = '-';
      return;
    }

    this.ackToNormalTimeText = '';
  }

  private setLastAckPersonName(textService: TextService): void {
    if (this.ackPersonId !== -1) {
      this.lastAckPersonName = textService.getUserName(this.ackPersonId);
      return;
    }

    this.lastAckPersonName = '';
  }

  public CompareProperties(o1: EventStateInfo, o2: EventStateInfo): boolean {
    for (const p in o1) {
      if (o1.hasOwnProperty(p)) {
        if (o1[p] !== o2[p]) {
          return false;
        }
      }
    }
    for (const p in o2) {
      if (o2.hasOwnProperty(p)) {
        if (o1[p] !== o2[p]) {
          return false;
        }
      }
    }

    return true;
  }
}

export class EventPopupInfo {
  addOnTextFileName: string;
  alarmEventTime: number;
  evGroupId: number;
  msgText: string;
  objGroupText: string;
  objName: string;
  objTag: string;
  stateText: string;

  constructor(json: EventPopupInfo) {
    this.addOnTextFileName = json.addOnTextFileName;
    this.alarmEventTime = json.alarmEventTime;
    this.evGroupId = json.evGroupId;
    this.msgText = json.msgText;
    this.objGroupText = json.objGroupText;
    this.objName = json.objName;
    this.objTag = json.objTag;
    this.stateText = json.stateText;
  }
}

export class GetEventStatesRsp {
  eventStateInfos: EventStateInfo[];
  userAccessRights: number[];
  obsoleteObjTags: string[];
  popupInfo: EventPopupInfo;
  resetSession: boolean;
  moreEvents: boolean;

  hasEvents = false;

  constructor(json: GetEventStatesRsp, private textService: TextService, private eventService: EventService, private global: Global) {
    if (json == null) {
      return;
    }

    if (json.eventStateInfos == null) {
      this.eventStateInfos = [];
    } else {
      this.eventStateInfos = json.eventStateInfos.map(eventStateInfo =>
        new EventStateInfo(eventStateInfo, textService, eventService, global));
      if (this.eventStateInfos.length > 0) {
        this.hasEvents = true;
      }
    }
    this.userAccessRights = [];
    if (json.userAccessRights != null) {
      const uint8Array = new Uint8Array(Base64ArrayBuffer.decode(json.userAccessRights.toString()));
      this.userAccessRights = [];
      uint8Array.forEach(item => this.userAccessRights.push(item));
    }
    if (json.obsoleteObjTags == null) {
      this.obsoleteObjTags = [];
    } else {
      this.obsoleteObjTags = json.obsoleteObjTags;
    }
    this.popupInfo = json.popupInfo;
    this.resetSession = json.resetSession;
    this.moreEvents = json.moreEvents;
  }
}

export class EvGroupDefData {
  ackToOffNormalRequired: boolean;
  ackToFaultRequired: boolean;
  ackToNormalRequired: boolean;
  autoForeground: boolean;
  colorActiveAckExpected: string;
  colorActiveAcknowledged: string;
  colorActiveAckUnnecessary: string;
  colorInactiveAckExpected: string;
  evGroupId: number;
  isDefault: boolean;
  notifyType: BACnetNotifyType;
  showPopup: boolean;
  soundFile: string;
  soundPlayCount: number;
  text: string;

  constructor(json: EvGroupDefData) {
    this.ackToOffNormalRequired = json.ackToOffNormalRequired;
    this.ackToFaultRequired = json.ackToFaultRequired;
    this.ackToNormalRequired = json.ackToNormalRequired;
    this.autoForeground = json.autoForeground;
    this.colorActiveAckExpected = json.colorActiveAckExpected;
    this.colorActiveAcknowledged = json.colorActiveAcknowledged;
    this.colorActiveAckUnnecessary = json.colorActiveAckUnnecessary;
    this.colorInactiveAckExpected = json.colorInactiveAckExpected;
    this.evGroupId = json.evGroupId;
    this.isDefault = json.isDefault;
    this.notifyType = json.notifyType;
    this.showPopup = json.showPopup;
    this.soundFile = json.soundFile;
    this.soundPlayCount = json.soundPlayCount;
    this.text = json.text;
  }
}

export class GetEvGroupDefDataResponse {
  evGroupDefDataList: EvGroupDefData[];
  result: Result;

  constructor(json: GetEvGroupDefDataResponse) {
    this.evGroupDefDataList = json.evGroupDefDataList.map(evGroupDefData => new EvGroupDefData(evGroupDefData));
    this.result = json.result;
  }
}

export class Limits {
  lowLimit?: number;
  highLimit?: number;

  constructor(json: Limits) {
    this.lowLimit = json.lowLimit;
    this.highLimit = json.highLimit;
  }
}


