
import { Result, OdbObjectType, OdbGroupLevel, OdbPropertyID, OdbTendency, OdbStatusSymbol, OdbStatusFlags } from 'app/shared/global/enum';
import { OdbCommandPrioSymbol, AuthdbObjAccessRights, NoticeFlags } from 'app/shared/global/enum';
import { BACnetEventTransitions, OdbStatusFlagsBits, OdbCommandType, ObjCmdOptions, OdbBinding } from 'app/shared/global/enum';
import { TextService } from 'app/shared/texts/text.service';
import { ConfigService } from 'app/shared/config/config.service';
import { OdbObject } from 'app/shared/objects/odb-object';
import { OdbStatusIcons } from 'app/shared/objects/odb-status-icons';
import { OdbConstants } from 'app/shared/global/constant';
import { PdmServiceResponse } from 'app/shared/pdm-service/pdm-service';

import * as _ from 'lodash';
// import { basename } from 'path';

export class AuthdbObjAccessRightsCoding {
  private accessRightsInt: number;
  accessRights: AuthdbObjAccessRights;
  readAccess: boolean;
  writeAccess: boolean;
  activateAccess: boolean;
  acknowledgeAccess: boolean;
  engineeringAccess: boolean;

  constructor(json: AuthdbObjAccessRightsCoding) {
    this.accessRightsInt = json.accessRightsInt;
    this.accessRights = json.accessRightsInt;
    this.readAccess = ((this.accessRights & AuthdbObjAccessRights.Read) !== 0);
    this.writeAccess = ((this.accessRights & AuthdbObjAccessRights.Write) !== 0);
    this.activateAccess = ((this.accessRights & AuthdbObjAccessRights.Activate) !== 0);
    this.acknowledgeAccess = ((this.accessRights & AuthdbObjAccessRights.Acknowledge) !== 0);
    this.engineeringAccess = ((this.accessRights & AuthdbObjAccessRights.Engineering) !== 0);
  }
}

export class ObjPropRef {
  objTag: string;
  propertyID: number;

  constructor(json: ObjPropRef) {
    if (json) {
      this.objTag = json.objTag;
      this.propertyID = json.propertyID;
    }
  }
}

export class ObjPropValue {
  value: Object;

  constructor(json: ObjPropValue) {
    this.value = json.value;
  }
}

export class ObjGroup {
  groupID: number;
  groupIDStr: string;
  description: string;
  level: OdbGroupLevel;
  trL: number;
  trR: number;
  itemDsgn: string;

  static getIcon(level: OdbGroupLevel): string {
    let icon = '';

    switch (level) {
      case OdbGroupLevel.InformationCenter: {
        icon = 'tree-informationcenter-icon';
        break;
      }
      case OdbGroupLevel.SwitchPanel: {
        icon = 'tree-switchpanel-icon';
        break;
      }
      case OdbGroupLevel.Plant: {
        icon = 'tree-plant-icon';
        break;
      }
      case OdbGroupLevel.PartialPlant: {
        icon = 'tree-partialplant-icon';
        break;
      }
      case OdbGroupLevel.FunctionalGroup: {
        icon = 'tree-functionalgroup-icon';
        break;
      }
      case OdbGroupLevel.OperatingResource: {
        icon = 'tree-operatingresource-icon';
        break;
      }
      default: {
        break;
      }
    }

    return icon;
  }

  constructor(json: ObjGroup) {
    this.groupID = json.groupID;
    this.groupIDStr = json.groupIDStr;
    this.description = json.description;
    this.level = json.level;
    this.trL = json.trL;
    this.trR = json.trR;
    this.itemDsgn = json.itemDsgn;
  }
}

export class GetObjGroupResponse {
  objGroupList: ObjGroup[];
  result: Result;

  constructor(json: GetObjGroupResponse) {
    this.objGroupList = json.objGroupList.map(objGroup => new ObjGroup(objGroup));
    this.result = json.result;
  }
}

export class ObjResult {
  result: Result;
  project: string;
  objdbRelease: number;

  constructor(json: ObjResult) {
    this.result = json.result;
    this.project = json.project;
    this.objdbRelease = json.objdbRelease;
  }
}

export class ObjData {
  objTag: string;
  objName: string;
  description: string;
  objType: OdbObjectType;
  objTypeText: string;
  bindType: number;
  cmdType?: OdbCommandType;
  cmdOptions: ObjCmdOptions;
  resolution?: number;
  decimals: number;
  unit: string;
  statesID?: number;
  rights: AuthdbObjAccessRightsCoding;
  noticesFlags: NoticeFlags;
  minPV?: number;
  maxPV?: number;
  isCommandable: boolean;
  objParentGroupID: number;
  suppPropList: OdbPropertyID[];

  constructor(json: ObjData, textService: TextService) {
    if (json) {
      this.init(json, textService);
    }
  }

  init(json: ObjData, textService: TextService) {
    this.objTag = json.objTag;
    this.objName = json.objName;
    this.description = json.description;
    this.objType = json.objType;
    this.objTypeText = textService.getObjTypeText(this.objType);
    this.bindType = json.bindType;
    this.cmdType = json.cmdType;
    this.cmdOptions = json.cmdOptions;
    this.resolution = json.resolution;
    this.objParentGroupID = json.objParentGroupID
    this.suppPropList = json.suppPropList.map(suppProp => suppProp);

    this.decimals = 0;

    if ((this.resolution != null) && (this.resolution <= 0.0)) {
      // 06.05.2015 added, ignore invalid resolution, don't throw an exception
      this.resolution = null;
    }

    if (this.resolution != null) {
      let r: number = this.resolution;

      while (r < 1.0) {
        r *= 10.0;
        this.decimals++;
      }
    } else {
      // no resolution defined
      this.decimals = 0;
    }

    this.unit = json.unit;
    this.statesID = json.statesID;
    this.rights = new AuthdbObjAccessRightsCoding(json.rights);
    this.noticesFlags = json.noticesFlags;
    this.minPV = json.minPV;
    this.maxPV = json.maxPV;

    this.isCommandable = ((OdbObject.isCommandableObjType(this.objType)) &&
      (this.cmdType != null) &&
      (this.cmdType !== OdbCommandType.NotCommandable) &&
      ((this.cmdOptions & ObjCmdOptions.DisableCmd) === 0) &&
      this.rights.writeAccess &&
      (OdbObject.isAnalogObjType(this.objType) || this.statesID != null));
  }
}

export class ObjPropValueGetRsp {
  objPropValue: ObjPropValue;
  objPropRef: ObjPropRef;

  constructor(json: ObjPropValueGetRsp) {
    this.objPropValue = new ObjPropValue(json.objPropValue);
    this.objPropRef = new ObjPropRef(json.objPropRef);
  }
}

export class ObjPropData extends ObjData {
  defaultPropertyId: OdbPropertyID;
  objPropValueGetRspList: ObjPropValueGetRsp[] = null;
  defaultValue: Object = null;
  statusFlags: OdbStatusFlags = null;
  ackedTransitions: BACnetEventTransitions = null;
  elapsedActiveTime: number = null;
  feedbackPrioManual: number = null;
  tendency: OdbTendency = null;
  hasStatusFlags = false;
  hasAckedTransitions = false;
  hasElapsedActiveTime = false;
  hasFeedbackPrioManual = false;
  hasTendency = false;
  tendencyIcon = '';
  tendencyText = '';
  prioIcon = '';
  prioText = '';
  inAlIcon = '';
  inAlText = '';
  fltIcon = '';
  fltText = '';
  ovrIcon = '';
  ovrText = '';
  oosIcon = '';
  oosText = '';
  offLIcon = '';
  offlText = '';
  isInAl = false;
  displayValue = '';
  color = '#000000'; // schwarz
  objTagKey = '';

  constructor(json: ObjPropData, textService: TextService, configService: ConfigService) {
    super(json, textService);
    if (json) {
      this.defaultPropertyId = OdbObject.getDefaultPropertyID(this.objType);
      this.objTagKey = this.objTag;
      this.objPropValueGetRspList = json.objPropValueGetRspList.map(objPropValueGetRsp => new ObjPropValueGetRsp(objPropValueGetRsp));

      this.updateObjPropValues(this.objPropValueGetRspList, true, textService);
    }

    this.color = configService.getObjTypeColor(this.objType);
  }

  init(json: ObjData, textService: TextService) {
    super.init(json, textService);

    this.defaultPropertyId = OdbObject.getDefaultPropertyID(this.objType);
    this.objTagKey = this.objTag;
}

  updateObjPropValues(objPropValueGetRspList: ObjPropValueGetRsp[], first: boolean, textService: TextService): boolean {
    let hasChanged = false;

    if (this.objPropValueGetRspList === null) {
      this.objPropValueGetRspList = objPropValueGetRspList;
    }


    for (let i = 0; i < objPropValueGetRspList.length; i++) {
      const objPropValueGetRsp = objPropValueGetRspList[i];
      switch (objPropValueGetRsp.objPropRef.propertyID) {
        case OdbPropertyID.StatusFlags: {
          if (!this.hasStatusFlags) {
            this.hasStatusFlags = true;
          }
          break;
        }

        case OdbPropertyID.AckedTransitions: {
          if (!this.hasAckedTransitions) {
            this.hasAckedTransitions = true;
          }
          break;
        }

        case OdbPropertyID.ElapsedActiveTime: {
          if (!this.hasElapsedActiveTime) {
            this.hasElapsedActiveTime = true;
          }
          break;
        }

        case OdbPropertyID.FeedbackPrioManual: {
          if (!this.hasFeedbackPrioManual) {
            this.hasFeedbackPrioManual = true;
          }
          break;
        }

        case OdbPropertyID.Tendency: {
          if (!this.hasTendency) {
            this.hasTendency = true;
          }
          break;
        }

        default: {
          break;
        }
      } // switch
    }

    let statusFlagsChanged = false;
    let ackedTransitionsChanged = false;
    let defaultValueChanged = false;

    for (const opv of objPropValueGetRspList) {
      const index2 = this.objPropValueGetRspList.findIndex((item) => {
        return ((item.objPropRef.objTag === opv.objPropRef.objTag) && (item.objPropRef.propertyID === opv.objPropRef.propertyID));
      });

      if (index2 >= 0) {
        if (first || !_.isEqual(this.objPropValueGetRspList[index2].objPropValue.value, opv.objPropValue.value)) {
          this.objPropValueGetRspList[index2].objPropValue = opv.objPropValue;

          switch (opv.objPropRef.propertyID) {
            case this.defaultPropertyId: {
              this.defaultValue = this.objPropValueGetRspList[index2].objPropValue.value;
              defaultValueChanged = true;

              break;
            }

            case OdbPropertyID.StatusFlags: {
              const sfArray = this.objPropValueGetRspList[index2].objPropValue.value as boolean[];
              if (sfArray != null) {
                let sf: OdbStatusFlags = OdbStatusFlags.None;

                for (let i = 0; i < OdbConstants.statusFlagsBitsCount; i++) {
                  if (sfArray[i]) {
                    sf |= (1 << i);
                  }
                }

                this.statusFlags = sf;
                statusFlagsChanged = true;
              }

              break;
            }

            case OdbPropertyID.AckedTransitions: {
              const etArray = this.objPropValueGetRspList[index2].objPropValue.value as boolean[];
              if (etArray != null) {
                let et: BACnetEventTransitions = BACnetEventTransitions.None;

                for (let i = 0; i < OdbConstants.eventTransitionBitsCount; i++) {
                  if (etArray[i]) {
                    et |= (1 << i);
                  }
                }

                this.ackedTransitions = et;
                ackedTransitionsChanged = true;
              }

              break;
            }

            case OdbPropertyID.ElapsedActiveTime: {
              this.elapsedActiveTime = this.objPropValueGetRspList[index2].objPropValue.value as number;

              break;
            }

            case OdbPropertyID.FeedbackPrioManual: {
              this.feedbackPrioManual = this.objPropValueGetRspList[index2].objPropValue.value as number;
              this.setPrioIcon(textService);
              this.setPrioText(textService);

              break;
            }

            case OdbPropertyID.Tendency: {
              this.tendency = this.objPropValueGetRspList[index2].objPropValue.value as OdbTendency;
              this.setTendencyIcon();
              this.setTendencyText(textService);

              break;
            }

            default: {
              break;
            }
          } // switch

          hasChanged = true;
        }
      }
    }

    if (statusFlagsChanged || ackedTransitionsChanged) {
      this.setInAlIcon();
      this.setInAlText();
      this.setFltIcon();
      this.setFltText();
      this.setOvrIcon();
      this.setOvrText();
      this.setOosIcon();
      this.setOosText();
      this.setOffLIcon();
      this.setOfflText();
      this.setIsInAl();
    }

    if (statusFlagsChanged || defaultValueChanged) {
      this.setDisplayValue(textService);
    }

    if (first) {
      hasChanged = false;
    }

    return hasChanged;
  }

  private setDisplayValue(textService: TextService): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.displayValue = OdbObject.nullObjectDisplayValue;
      }
    }

    this.displayValue = OdbObject.getDisplayValueText(textService,
      this.objType,
      this.defaultPropertyId,
      this.defaultValue,
      this.bindType,
      this.statesID,
      this.resolution);
  }

  private setTendencyIcon(): void {
    let icon = '';

    if (this.hasTendency) {
      switch (this.tendency) {
        case OdbTendency.Rising: {
          icon = 'up-icon';
          break;
        }
        case OdbTendency.Falling: {
          icon = 'down-icon';
          break;
        }
        case OdbTendency.Steady: {
          break;
        }
        default: {
          break;
        }
      } // switch
    }

    // icon = 'up-icon';
    // icon = 'down-icon';
    this.tendencyIcon = icon;
  }

  private setTendencyText(textService: TextService): void {
    let text = '';

    if (this.hasTendency && ((this.tendency === OdbTendency.Rising) || (this.tendency === OdbTendency.Falling))) {
      text = textService.getTendencyText(this.tendency);
    }

    this.tendencyText = text;
  }

  private setPrioIcon(textService: TextService): void {
    let icon = '';

    if (this.hasFeedbackPrioManual) {
      const prio = this.feedbackPrioManual;
      if ((prio > 0) && (prio <= OdbConstants.cmdPrioArraySize)) {
        const cps = textService.getCommandPrioSymbol(prio);
        switch (cps) {
          case OdbCommandPrioSymbol.Default: {
            icon = 'status_Prio{0}-icon'.format(prio.toString());
            break;
          }
          case OdbCommandPrioSymbol.LifeSafety: {
            icon = 'status_PrioLifeSafety-icon';
            break;
          }
          case OdbCommandPrioSymbol.Manual: {
            icon = 'status_PrioManual-icon';
            break;
          }
          case OdbCommandPrioSymbol.Schedule: {
            icon = 'status_PrioSchedule-icon';
            break;
          }
          case OdbCommandPrioSymbol.UnitProtect: {
            icon = 'status_PrioUnitProtect-icon';
            break;
          }
          default: {
            break;
          }
        }
      }
    }

    this.prioIcon = icon;
  }

  private setPrioText(textService: TextService): void {
    let text = '';

    if (this.hasFeedbackPrioManual) {
      const prio = this.feedbackPrioManual;
      if ((prio > 0) && (prio <= OdbConstants.cmdPrioArraySize)) {
        text = textService.getCommandPrioText(prio);
      }
    }

    this.prioText = text;
  }

  private setIsInAl(): void {
    let isInAl = false;

    if (this.hasStatusFlags) {
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }

      const statusSymbol = OdbStatusIcons.getPriorizedStatusSymbol(this.statusFlags, ackedTransitions, OdbStatusFlags.InAlarm);

      switch (statusSymbol) {
        case OdbStatusSymbol.InAlActive:
        case OdbStatusSymbol.FltActive: {
          isInAl = true;

          break;
        }

        default: {
          break;
        }
      }
    }

    this.isInAl = isInAl;
  }

  private setInAlIcon(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.inAlIcon = '';
        return;
      }

      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }

      this.inAlIcon = OdbStatusIcons.getPriorizedStatusIcon(this.statusFlags, ackedTransitions, OdbStatusFlags.InAlarm);
    } else {
      this.inAlIcon = '';
    }
  }

  private setInAlText(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.inAlText = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.inAlText = OdbStatusIcons.getPriorizedStatusSymbolText(this.statusFlags, ackedTransitions, OdbStatusFlags.InAlarm);
    } else {
      this.inAlText = '';
    }
  }

  private setFltIcon(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.fltIcon = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.fltIcon = OdbStatusIcons.getPriorizedStatusIcon(this.statusFlags, ackedTransitions, OdbStatusFlags.Fault);
    } else {
      this.fltIcon = '';
    }
  }

  private setFltText(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.fltText = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.fltText = OdbStatusIcons.getPriorizedStatusSymbolText(this.statusFlags, ackedTransitions, OdbStatusFlags.Fault);
    } else {
      this.fltText = '';
    }
  }

  private setOvrIcon(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.ovrIcon = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.ovrIcon = OdbStatusIcons.getPriorizedStatusIcon(this.statusFlags, ackedTransitions, OdbStatusFlags.Overridden);
    } else {
      this.ovrIcon = '';
    }
  }

  private setOvrText(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.ovrText = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.ovrText = OdbStatusIcons.getPriorizedStatusSymbolText(this.statusFlags, ackedTransitions, OdbStatusFlags.Overridden);
    } else {
      this.ovrText = '';
    }
  }

  private setOosIcon(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.oosIcon = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.oosIcon = OdbStatusIcons.getPriorizedStatusIcon(this.statusFlags, ackedTransitions, OdbStatusFlags.OutOfService);
    } else {
      this.oosIcon = '';
    }
  }

  private setOosText(): void {
    if (this.hasStatusFlags) {
      if ((this.statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
        this.oosText = '';
        return;
      }
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.oosText = OdbStatusIcons.getPriorizedStatusSymbolText(this.statusFlags, ackedTransitions, OdbStatusFlags.OutOfService);
    } else {
      this.oosText = '';
    }
  }

  private setOffLIcon(): void {
    if (this.hasStatusFlags) {
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.offLIcon = OdbStatusIcons.getPriorizedStatusIcon(this.statusFlags, ackedTransitions, OdbStatusFlags.Offline);
    } else {
      this.offLIcon = '';
    }
  }

  private setOfflText(): void {
    if (this.hasStatusFlags) {
      let ackedTransitions: BACnetEventTransitions = BACnetEventTransitions.None;
      if (this.hasAckedTransitions) {
        ackedTransitions = this.ackedTransitions;
      }
      this.offlText = OdbStatusIcons.getPriorizedStatusSymbolText(this.statusFlags, ackedTransitions, OdbStatusFlags.Offline);
    } else {
      this.offlText = '';
    }
  }

  get displayValueCompareEntry(): any {
    return { objType: this.objType, displayValue: this.displayValue, defaultValue: this.defaultValue, objTag: this.objTag };
  }

  get prioCompareEntry(): any {
    return { feedbackPrioManual: this.feedbackPrioManual, prioText: this.prioText, objTag: this.objTag };
  }

  get inAlCompareEntry(): any {
    return { inAlText: this.inAlText, objTag: this.objTag };
  }

  get fltCompareEntry(): any {
    return { fltText: this.fltText, objTag: this.objTag };
  }

  get ovrCompareEntry(): any {
    return { ovrText: this.ovrText, objTag: this.objTag };
  }

  get oosCompareEntry(): any {
    return { oosText: this.oosText, objTag: this.objTag };
  }

  get offlCompareEntry(): any {
    return { offlText: this.offlText, objTag: this.objTag };
  }

  get tendencyCompareEntry(): any {
    return { tendency: this.tendency, tendencyText: this.tendencyText, objTag: this.objTag };
  }
}

export class GetObjDataResponse {
  objDataList: ObjData[];
  result: Result;

  constructor(json: GetObjDataResponse, private textService: TextService) {
    this.objDataList = json.objDataList.map(objData => new ObjData(objData, textService));
    this.result = json.result;
  }
}

export class GetObjFilterDataResponse {
  objPropDataList: ObjPropData[];
  lastEntryPoint: string;
  overflow: boolean;
  totalRowCount: number;
  objResult: ObjResult;

  constructor(json: GetObjFilterDataResponse, private textService: TextService, private configService: ConfigService) {
    this.objPropDataList = json.objPropDataList.map(objPropData => new ObjPropData(objPropData, textService, configService));
    this.lastEntryPoint = json.lastEntryPoint;
    this.overflow = json.overflow;
    this.totalRowCount = json.totalRowCount;
    this.objResult = new ObjResult(json.objResult);
  }
}

export class GetObjPropValuesResponse {
  objPropValueGetRspList: ObjPropValueGetRsp[];
  dpcStateList: number[];
  cmdPrioList: number[];
  objResult: ObjResult;

  constructor(json: GetObjPropValuesResponse) {
    this.objPropValueGetRspList = json.objPropValueGetRspList.map(objPropValueGetRsp => new ObjPropValueGetRsp(objPropValueGetRsp));
    this.dpcStateList = json.dpcStateList.map(state => state);
    this.cmdPrioList = json.cmdPrioList.map(prio => prio);
    this.objResult = new ObjResult(json.objResult);
  }
}

export class GetOdbInfoDataResponse {
  odbBindingText: string;
  odbInfoDataBindingList: string[][];
  odbInfoDataGeneralList: string[][];
  odbInfoDataObjectList: string[][];
  odbInfoDataObjNameFieldList: string[][];
  result: Result;

  constructor(json: GetOdbInfoDataResponse) {
    this.odbBindingText = json.odbBindingText;
    this.odbInfoDataBindingList = json.odbInfoDataBindingList;
    this.odbInfoDataGeneralList = json.odbInfoDataGeneralList
    this.odbInfoDataObjectList = json.odbInfoDataObjectList;
    this.odbInfoDataObjNameFieldList = json.odbInfoDataObjNameFieldList;
    this.result = json.result;
  }
}

export class GetObjCmdValueResponse extends PdmServiceResponse {
  found: boolean;
  priority?: number;
  value: any;

  constructor(json: GetObjCmdValueResponse) {
    super(json);
    this.found = json.found;
    this.priority = json.priority;
    this.value = json.value;
  }
}


