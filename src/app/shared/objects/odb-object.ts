import { TextService } from 'app/shared/texts/text.service';
import { OdbObjectType, OdbBinding, OdbPropertyID, VarEnum, MultistateAdjustment } from 'app/shared/global/enum';
import { OdbStatusFlagsBits, OdbStatusFlags } from 'app/shared/global/enum';
import { OdbConstants } from 'app/shared/global/constant';
import 'app/shared/global/string';

export class OdbObject {

  public static nullObjectDisplayValue = '***';

  static isAnalogObjType(objType: OdbObjectType): boolean {
    return (objType === OdbObjectType.MeasuredValue) ||
      (objType === OdbObjectType.Setpoint) ||
      (objType === OdbObjectType.ManipulatedValue) ||
      (objType === OdbObjectType.AnalogValue) ||
      (objType === OdbObjectType.Loop) ||
      (objType === OdbObjectType.Counter) ||
      (objType === OdbObjectType.CounterOperatingHours) ||
      (objType === OdbObjectType.CounterConsumption) ||
      (objType === OdbObjectType.Trigger) ||
      (objType === OdbObjectType.Averaging);
  }

  static isMultistateObjType(objType: OdbObjectType): boolean {
    return (objType === OdbObjectType.MultistateInput) ||
      (objType === OdbObjectType.MultistateOutput) ||
      (objType === OdbObjectType.MultistateValue) ||
      (objType === OdbObjectType.Command);
  }

  static isCounterObjType(objType: OdbObjectType): boolean {
    return (objType === OdbObjectType.Counter) ||
      (objType === OdbObjectType.CounterOperatingHours) ||
      (objType === OdbObjectType.CounterConsumption);
  }

  static isBinaryObjType(objType: OdbObjectType): boolean {
    return (objType === OdbObjectType.MultistateInput) ||
      (objType === OdbObjectType.Alarm) ||
      (objType === OdbObjectType.Status) ||
      (objType === OdbObjectType.Maintenance) ||
      (objType === OdbObjectType.BinaryOutput) ||
      (objType === OdbObjectType.BinaryValue);
  }

  static isDigitalObjType(objType: OdbObjectType): boolean {
    return OdbObject.isBinaryObjType(objType) || OdbObject.isMultistateObjType(objType);
  }

  static isCommandableObjType(objType: OdbObjectType): boolean {
    switch (objType) {
      case OdbObjectType.AnalogValue:
      case OdbObjectType.BinaryOutput:
      case OdbObjectType.BinaryValue:
      case OdbObjectType.MultistateOutput:
      case OdbObjectType.MultistateValue:
      case OdbObjectType.Setpoint:
      case OdbObjectType.ManipulatedValue:
      case OdbObjectType.Command: {
        return true;
      }
    }
    return false;
  }

  static getDefaultPropertyID(objType: OdbObjectType): OdbPropertyID {
    switch (objType) {
      case OdbObjectType.EventEnrollment: {
        return OdbPropertyID.EventState;
      }

      case OdbObjectType.Averaging: {
        return OdbPropertyID.AverageValue;
      }

      case OdbObjectType.Device:
      case OdbObjectType.Network:
      case OdbObjectType.PDM: {
        return OdbPropertyID.ConnectionState;
      }

      default: {
        return OdbPropertyID.PresentValue;
      }
    }
  }

  static getPropValueType(objType: OdbObjectType, propertyID: OdbPropertyID): VarEnum {
    switch (propertyID) {
      case OdbPropertyID.ElapsedActiveTime:
      case OdbPropertyID.Setpoint:
      case OdbPropertyID.ControlledVarValue:
      case OdbPropertyID.AverageValue:
        return VarEnum.VT_R8;

      case OdbPropertyID.FeedbackPrioManual:
        // case OdbPropertyID.CommandPrio :
        return VarEnum.VT_I4;

      case OdbPropertyID.StatusFlags:
      case OdbPropertyID.AckedTransitions:
        return VarEnum.VT_BOOL | VarEnum.VT_ARRAY;

      case OdbPropertyID.EventState:
      // case OdbPropertyID.FeedbackManual :
      // case OdbPropertyID.FeedbackLocal :
      case OdbPropertyID.CommandManual:
      case OdbPropertyID.SystemStatus:
      // case OdbPropertyID.Reliability :
      case OdbPropertyID.ConnectionState:
      case OdbPropertyID.Tendency:
        return VarEnum.VT_I2;

      case OdbPropertyID.PresentValue:
      case OdbPropertyID.CommandValue:
      case OdbPropertyID.FeedbackValue:
        switch (objType) {
          case OdbObjectType.Alarm:
          case OdbObjectType.Status:
          case OdbObjectType.Maintenance:
          case OdbObjectType.MultistateInput:
          case OdbObjectType.MultistateOutput:
          case OdbObjectType.MultistateValue:
          case OdbObjectType.BinaryValue:
          case OdbObjectType.BinaryOutput:
          case OdbObjectType.Command:
            return VarEnum.VT_UI1;

          case OdbObjectType.MeasuredValue:
          case OdbObjectType.Setpoint:
          case OdbObjectType.ManipulatedValue:
          case OdbObjectType.Counter:
          case OdbObjectType.CounterOperatingHours:
          case OdbObjectType.CounterConsumption:
          case OdbObjectType.AnalogValue:
          case OdbObjectType.Loop:
            return VarEnum.VT_R8;

          case OdbObjectType.Trigger:
            return VarEnum.VT_I4;

          case OdbObjectType.Error:
            return VarEnum.VT_I2;
        }
        break;
    }

    return VarEnum.VT_UNKNOWN;
  }

  static getMultistateAdjustedValue(binding: OdbBinding, objectType: OdbObjectType, adjustment: MultistateAdjustment,
    state: number): number {
    if (binding === OdbBinding.All || binding === OdbBinding.Unknown) {
      throw new Error('valid binding expected');
    }

    if (objectType === OdbObjectType.Unknown) {
      throw new Error('valid object-type expected');
    }

    if (binding === OdbBinding.BACnet && objectType !== OdbObjectType.Command) {
      if (adjustment === MultistateAdjustment.ProcessToStateIndex) {
        return state - 1;
      } else if (adjustment === MultistateAdjustment.StateIndexToProcess) {
        return state + 1;
      } else {
        throw new Error();
      }
    }

    return state;
  }

  static getPropArrayLength(propertyID: OdbPropertyID) {
    if (propertyID === OdbPropertyID.AckedTransitions) {
      return OdbConstants.eventTransitionBitsCount;
    } else if (propertyID === OdbPropertyID.StatusFlags) {
      return OdbConstants.statusFlagsBitsCount;
    } else {
      return 0;
    }
  }

  static getDisplayValueText(textService: TextService, objType: OdbObjectType, propertyID: OdbPropertyID, processValue: Object,
    binding: OdbBinding, statesID?: number, resolution?: number, arrayIndex?: number, useGroupSeparator = true): string {
    if (processValue == null) {
      return OdbObject.nullObjectDisplayValue;
    }

    const vt = this.getPropValueType(objType, propertyID);

    switch (vt) {
      case VarEnum.VT_R8: { // analog value
        return this.getDisplayValueTextAnalog(processValue as number, resolution, 15, useGroupSeparator);
      }

      case VarEnum.VT_UI1: { // state value
        const state = processValue as number;
        let adjustedState: number = state;

        if (OdbObject.isMultistateObjType(objType)) {
          adjustedState = this.getMultistateAdjustedValue(binding, objType, MultistateAdjustment.ProcessToStateIndex, state);
        }

        if (adjustedState >= 0 && statesID != null) {
          const states = textService.getStates(statesID);

          if (states && states.length > adjustedState) {
            return states[adjustedState];
          }
        }
        return OdbConstants.unresolvedTextFormat.format(state.toString());
      }

      case VarEnum.VT_I2: { // enumeration value
        const iV = processValue as number;
        switch (propertyID) {
          case OdbPropertyID.SystemStatus:
            return textService.getSystemStatusText(iV);

          case OdbPropertyID.ConnectionState:
            return textService.getConnectionStateText(iV);

          case OdbPropertyID.CommandManual:
            return textService.getCommandStateText(iV);

          case OdbPropertyID.EventState:
            return textService.getEventStateText(iV);

          case OdbPropertyID.PresentValue:
            if (objType === OdbObjectType.Error) {
              return textService.getErrorStateText(iV);
            } else {
              return iV.toString();
            }

          case OdbPropertyID.Tendency:
            return textService.getTendencyText(iV);

          default:
            return iV.toString();
        }
      }

      case VarEnum.VT_UI4: {
        const ui4V = processValue as number;
        return ui4V.toString();
      }

      case VarEnum.VT_I4: {
        const i4V = processValue as number;
        if (propertyID === OdbPropertyID.FeedbackPrioManual) {
          if (i4V === 0) {
            return ''; // relinquish-default
          } else {
            return '{0} [{1}]'.format(textService.getCommandPrioText(i4V), i4V.toString());
          }
        } else {
          // Trigger for example
          return i4V.toString();
        }
      }

      case VarEnum.VT_ARRAY | VarEnum.VT_BOOL: {
        const bits = processValue as boolean[];
        if (bits == null) {
          throw new Error('bool array expected');
        }

        if (arrayIndex != null) {
          if (arrayIndex >= this.getPropArrayLength(propertyID)) {
            throw new Error('array index out of range:{0}'.format(arrayIndex.toString()));
          }

          if (bits[arrayIndex]) {
            switch (propertyID) {
              case OdbPropertyID.StatusFlags: {
                return textService.getStatusFlagsBitText(arrayIndex);
              }

              case OdbPropertyID.AckedTransitions: {
                return textService.getEventTransitionBitText(arrayIndex);
              }

              default: {
                throw new Error(propertyID.toString());
              }
            }
          } else {
            return '';
          }
        } else {
          let s = '';
          let mask = 0;
          switch (propertyID) {
            case OdbPropertyID.StatusFlags: {
              if (bits.length !== OdbConstants.statusFlagsBitsCount) {
                throw new Error('invalid array size:{0}, expected:{1}'.format(
                  bits.length.toString(),
                  OdbConstants.statusFlagsBitsCount.toString()));
              }

              // if offline, all other bits are masked out
              if (bits[OdbStatusFlagsBits.Offline]) {
                mask = (OdbStatusFlags.All & ~OdbStatusFlags.Offline) as number;
              }
              break;
            }

            case OdbPropertyID.AckedTransitions: {
              if (bits.length !== OdbConstants.eventTransitionBitsCount) {
                throw new Error('invalid array size:{0}, expected:{1}'.format(
                  bits.length.toString(),
                  OdbConstants.eventTransitionBitsCount.toString()));
              }
              break;
            }

            default: {
              throw new Error(propertyID.toString());
            }
          }

          for (let i = 0; i < bits.length; i++) {
            if (bits[i] && (mask & (1 << i)) === 0) {
              if (s.length > 0) {
                s += '+';
              }
              switch (propertyID) {
                case OdbPropertyID.StatusFlags: {
                  s += textService.getStatusFlagsBitText(i);
                  break;
                }
                case OdbPropertyID.AckedTransitions: {
                  s += textService.getEventTransitionBitText(i);
                  break;
                }
              }
            }
          }
          return s;
        }
      }
    }

    // if variable type is not known, return standard implementation
    return processValue.toString();
  }

  static getDisplayValueTextAnalog(d: number, resolution?: number, precision = 15, useGroupSeparator = true): string {
    // check special values (e.g. nan ... )
    if (d === Infinity || d === NaN) {
      return d.toString();
    } else {
      let value: string = null;
      let decimals = 0;

      if ((resolution != null) && (resolution <= 0.0)) {
        // 06.05.2015 added, ignore invalid resolution, don't throw an exception
        resolution = null;
      }

      if (resolution != null) {
        let r: number = resolution;

        while (r < 1.0) {
          r *= 10.0;
          decimals++;
        }
      } else {
        // no resolution defined
        decimals = 0;
      }

      if (d !== 0.0) {
        let displayDigits: number = Math.log10(Math.abs(d));
        if (displayDigits < 0) {
          displayDigits = -displayDigits;
          if (displayDigits < decimals) {
            displayDigits = decimals;
          }
        } else {
          displayDigits += decimals;
        }
        displayDigits++;

        if (displayDigits > precision) {
          // not enough place (precision) to show all decimals, so use an e+xx format
          // format = 'G' + precision.toString();
          try {
            value = d.toExponential(decimals);
          } catch (e) {
            value = d.toFixed(decimals);
          }
        }
      }

      if (value == null) {
        if (useGroupSeparator) {
          // format = 'N' + decimals.toString();		// Standard-Formatierung decimals = Anzahl NK-Stellen (use group-separator 1.000,12)
          try {
            value = d.toLocaleString(undefined, { useGrouping: true, minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          } catch (e) {
            value = d.toFixed(decimals);
          }
        } else {
          // format = 'F' + decimals.toString();		// Standard-Formatierung decimals = Anzahl NK-Stellen (don't use group-separator 1000,12)
          try {
            value = d.toLocaleString(undefined, { useGrouping: false, minimumFractionDigits: decimals, maximumFractionDigits: decimals });
          } catch (e) {
            value = d.toFixed(decimals);
          }
        }
      }

      return value;
    }
  }

  constructor() { }
}
