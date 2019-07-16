import { OdbStatusSymbol, OdbStatusFlags, BACnetEventTransitions } from 'app/shared/global/enum';

export class OdbStatusIcons {
  static getPriorizedStatusSymbol(statusFlags: OdbStatusFlags, ackedTransitions: BACnetEventTransitions,
    includedFlags: OdbStatusFlags): OdbStatusSymbol {

    if (statusFlags == null) {
      return OdbStatusSymbol.OK;
    }

    statusFlags &= includedFlags;

    if ((includedFlags & OdbStatusFlags.InAlarm) !== OdbStatusFlags.InAlarm) {
      ackedTransitions |= BACnetEventTransitions.ToOffNormal;
    }

    if ((includedFlags & OdbStatusFlags.Fault) !== OdbStatusFlags.Fault) {
      ackedTransitions |= BACnetEventTransitions.ToFault;
    }

    if ((statusFlags & OdbStatusFlags.Offline) === OdbStatusFlags.Offline) {
      return OdbStatusSymbol.OffL;
    }

    // InAlarm
    if ((statusFlags & OdbStatusFlags.InAlarm) === OdbStatusFlags.InAlarm) {
      if ((ackedTransitions & BACnetEventTransitions.ToOffNormal) === BACnetEventTransitions.ToOffNormal) {
        return OdbStatusSymbol.InAlActiveAcked;
      } else {
        return OdbStatusSymbol.InAlActive;
      }
    }
    if ((ackedTransitions & BACnetEventTransitions.ToOffNormal) !== BACnetEventTransitions.ToOffNormal) {
      return OdbStatusSymbol.InAlInactiveNotAcked;
    }

    // Fault
    if ((statusFlags & OdbStatusFlags.Fault) === OdbStatusFlags.Fault) {
      if ((ackedTransitions & BACnetEventTransitions.ToFault) === BACnetEventTransitions.ToFault) {
        return OdbStatusSymbol.FltActiveAcked;
      } else {
        return OdbStatusSymbol.FltActive;
      }
    }
    if ((ackedTransitions & BACnetEventTransitions.ToFault) !== BACnetEventTransitions.ToFault) {
      return OdbStatusSymbol.FltInactiveNotAcked;
    }

    // OutOfService
    if ((statusFlags & OdbStatusFlags.OutOfService) === OdbStatusFlags.OutOfService) {
      return OdbStatusSymbol.OoS;
    }

    // Overridden
    if ((statusFlags & OdbStatusFlags.Overridden) === OdbStatusFlags.Overridden) {
      return OdbStatusSymbol.Ovr;
    }

    return OdbStatusSymbol.OK;
  }

  static getPriorizedStatusIcon(statusFlags: OdbStatusFlags, ackedTransitions: BACnetEventTransitions,
    includedFlags: OdbStatusFlags): string {
    const statusSymbol: OdbStatusSymbol = OdbStatusIcons.getPriorizedStatusSymbol(statusFlags, ackedTransitions, includedFlags);

    switch (statusSymbol) {
      case OdbStatusSymbol.InAlActive: {
        return 'status-InAlActive-icon';
      }

      case OdbStatusSymbol.InAlActiveAcked: {
        return 'status-InAlActiveAcked-icon';
      }

      case OdbStatusSymbol.InAlInactiveNotAcked: {
        return 'status-InAlInactiveNotAcked-icon';
      }

      case OdbStatusSymbol.FltActive: {
        return 'status-FltActive-icon';
      }

      case OdbStatusSymbol.FltActiveAcked: {
        return 'status-FltActiveAcked-icon';
      }

      case OdbStatusSymbol.FltInactiveNotAcked: {
        return 'status-FltInactiveNotAcked-icon';
      }

      case OdbStatusSymbol.OffL: {
        return 'status-OffL-icon';
      }

      case OdbStatusSymbol.Ovr: {
        return 'status-Ovr-icon';
      }

      case OdbStatusSymbol.OoS: {
        return 'status-OoS-icon';
      }

      default: {
        return '';
      }
    }
  }

  static getPriorizedStatusSymbolText(statusFlags: OdbStatusFlags, ackedTransitions: BACnetEventTransitions,
    includedFlags: OdbStatusFlags): string {
    const statusSymbol = OdbStatusIcons.getPriorizedStatusSymbol(statusFlags, ackedTransitions, includedFlags);

    switch (statusSymbol) {
      case OdbStatusSymbol.InAlActive: {
        return 'In-Alarm';
      }

      case OdbStatusSymbol.InAlActiveAcked: {
        return 'In-Alarm (quittiert)';
      }

      case OdbStatusSymbol.InAlInactiveNotAcked: {
        return 'In-Alarm (nicht quittiert)';
      }

      case OdbStatusSymbol.FltActive: {
        return 'Fault';
      }

      case OdbStatusSymbol.FltActiveAcked: {
        return 'Fault (quittiert)';
      }

      case OdbStatusSymbol.FltInactiveNotAcked: {
        return 'Fault (nicht quittiert)';
      }

      case OdbStatusSymbol.OffL: {
        return 'Offline';
      }

      case OdbStatusSymbol.Ovr: {
        return 'Overridden';
      }

      case OdbStatusSymbol.OoS: {
        return 'Out-Of-Service';
      }

      default: {
        return '';
      }
    }
  }

  constructor() { }
}
