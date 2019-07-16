import {
  Component, OnInit, EventEmitter, Input, Output, ViewChild, ElementRef, ViewEncapsulation,
  AfterViewInit, OnDestroy
} from '@angular/core';
import { ButtonComponent } from '@syncfusion/ej2-angular-buttons';
import { ObjPropData, ObjResult, ObjPropRef } from 'app/shared/objects/object';
import { OdbObject } from 'app/shared/objects/odb-object';
import { TextService } from 'app/shared/texts/text.service';
import { OdbObjectType, OdbCommandType, PdmServiceResult, OdbPriorityLevel, Result, MultistateAdjustment } from 'app/shared/global/enum';
import { OdbBinding, SdbPropertyId } from 'app/shared/global/enum';
import { OdbStatusFlags, SdbTaskID } from 'app/shared/global/enum';
import { ObjectService } from 'app/shared/objects/object.service';
import { ConfigService } from 'app/shared/config/config.service';
import { SessionService } from 'app/shared/sessions/session.service';
import { EventService } from 'app/shared/events/event.service';
import { OdbConstants } from 'app/shared/global/constant';
import { Global } from 'app/shared/global/global';
import { StateText } from 'app/shared/texts/text';
import { DialogUtility, DialogModel, ButtonArgs } from '@syncfusion/ej2-popups';
import { IPointerDragEventArgs, CircularGaugeComponent, Range, Pointer } from '@syncfusion/ej2-angular-circulargauge';
import { Router, ActivatedRoute } from '@angular/router';
import { createSpinner, showSpinner, hideSpinner } from '@syncfusion/ej2-angular-popups';
import { Browser } from '@syncfusion/ej2-base';
import { DropDownListComponent, PopupEventArgs, ChangeEventArgs } from '@syncfusion/ej2-angular-dropdowns';
import { RoutingData } from 'app/shared/routing/routing-data';
import { TimerService } from './../../shared/timers/timer.service';
import { MenuItemModel, BeforeOpenCloseMenuEventArgs, ContextMenuComponent, MenuEventArgs } from '@syncfusion/ej2-angular-navigations';
import { AckEventsReq, AckEventSignature } from './../../shared/events/event';
import { BACnetEventTransitions } from 'app/shared/global/enum';
import { LicenseService } from './../../shared/license/license.service';
import { NoticePriority, NoticeFlags } from 'app/shared/global/enum';
import { Notice } from 'app/shared/notices/notice';

@Component({
  selector: 'app-object-box',
  templateUrl: './object-box.component.html',
  styleUrls: ['./object-box.component.scss'],
  encapsulation: ViewEncapsulation.None, // damit deep-css aus ca-styles.css in syncfusion-componenten geht!
})
export class ObjectBoxComponent implements OnInit, AfterViewInit, OnDestroy {
  objPropData: ObjPropData;
  // @ViewChild('toFocus', { static: false }) toFocus: ElementRef;
  @ViewChild('circulargauge', { static: false }) circulargauge: CircularGaugeComponent;
  @ViewChild('dropDownList', { static: false }) dropDownList: DropDownListComponent;
  @ViewChild('analogValueInput', { static: false }) analogValueInput: ElementRef;
  @ViewChild('contextmenu', { static: false }) contextmenu: ContextMenuComponent;
  isAnalog: boolean;
  defaultWritePrio: OdbPriorityLevel;
  analogValue: number = null;
  pointerValue: number = null;
  isManual: boolean;
  analogAutoButtonDisabled: boolean;

  lowLimit?: number = null;
  highLimit?: number = null;

  stateTextFields: Object = { value: 'value', text: 'text' };
  stateTexts: StateText[];
  autoStateText: StateText;
  selectedStateText: number;

  step = 1.0;
  alertDialogButtonArgs: ButtonArgs = { text: 'OK', icon: 'fa fa-check', cssClass: 'e-success e-round-corner' };
  firstDataLoading = true;
  isInitial = true;
  private timerStarted = false;

  contextMenuItems: MenuItemModel[];
  displayOdbInfo = false;
  displayNoticeEdit = false;
  noticeSubject = '';
  ackEventsReq: AckEventsReq = null;
  ackEventsConfirmDialog: DialogModel;
  dialogAnimationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };

  splitterOrientation: string;
  secondPaneHeight: number;

  hasMinMaxPV = false;

  constructor(private global: Global, private textService: TextService, private objectService: ObjectService,
    private configService: ConfigService, private sessionService: SessionService, private eventService: EventService,
    private router: Router, private route: ActivatedRoute, private routingData: RoutingData,
    private timerService: TimerService, private licenseService: LicenseService) {
    this.global.onIsMobileChanged.subscribe(isMobile => this.onIsMobileChanged(isMobile));
    this.setSplitter(this.global.isMobile);
    this.stateTexts = [];
    this.autoStateText = new StateText(-1, 'Auto');
    this.selectedStateText = null;
    // this.selectedStateText = this.autoStateText.value;
    this.defaultWritePrio = OdbPriorityLevel.ManualOperator;
    this.isManual = true;
    this.isInitial = true;
    this.analogAutoButtonDisabled = true;
    this.analogValue = null;
    this.pointerValue = null;
    this.lowLimit = null;
    this.highLimit = null;
    this.isAnalog = true;
    this.secondPaneHeight = 280;
    this.timerService.onTimer5s.subscribe(() => this.onTimer5s());
    this.ackEventsConfirmDialog = null;
  }

  ngOnInit() {
    this.firstDataLoading = true;

    this.contextMenuItems = [
      {
        id: 'Ack',
        text: 'Eintrag quittieren',
        iconCss: 'eventViewer-icon',
        items: [
          {
            id: 'AckToOffNormal',
            text: 'ToOffNormal',
          },
          {
            id: 'AckToFault',
            text: 'ToFault',
          },
          {
            id: 'AckToNormal',
            text: 'ToNormal',
          },
          {
            separator: true
          },
          {
            id: 'AckAll',
            text: 'Alle',
          }
        ]
      },
      {
        id: 'OdbInfo',
        text: 'Objekt-Information...',
        iconCss: 'odbInfo-icon',
      }
    ];
  }

  private onIsMobileChanged(isMobile: boolean): void {
    this.setSplitter(isMobile);
  }

  private setSplitter(isMobile: boolean): void {
    if (isMobile) {
      this.splitterOrientation = 'Vertical';
    } else {
      this.splitterOrientation = 'Horizontal';
    }
  }

  contextMenuItemSelected(args: MenuEventArgs) {
    switch (args.item.id) {
      case 'AckToOffNormal': {
        this.ackToOffNormal();
        break;
      }

      case 'AckToFault': {
        this.ackToFault();
        break;
      }

      case 'AckToNormal': {
        this.ackToNormal();
        break;
      }

      case 'AckAll': {
        this.ackAll();
        break;
      }

      case 'OdbInfo': {
        this.showOdbInfo();
        break;
      }

      default: {
        break;
      }
    }
  }

  async ngAfterViewInit() {
    createSpinner({
      // Specify the target for the spinner to show
      target: document.getElementById('spinnerContainer')
    });

    showSpinner(document.getElementById('spinnerContainer'));

    const params = this.route.snapshot.params;

    if (!params) {
      this.router.navigate(['']);
      return;
    }

    // let srcComponent: string = params['srcComponent'];
    const objTag: string = params['objTag'];

    if (!objTag || (objTag !== this.routingData.objTag)) {
      this.router.navigate(['']);
      return;
    }

    if (!this.sessionService.validSession) {
      this.router.navigate(['']);
      return;
    }

    const getObjDataResponse = await this.objectService.getObjData(objTag, this.sessionService.session.sessionGUID);
    if (!getObjDataResponse || getObjDataResponse.result !== Result.Ok) {
      this.router.navigate(['']);
      return;
    }

    const objData = getObjDataResponse.objDataList[0];

    this.objPropData = new ObjPropData(null, this.textService, this.configService);
    this.objPropData.init(getObjDataResponse.objDataList[0], this.textService);

    this.hasMinMaxPV = (this.objPropData.minPV != null) &&
      (this.objPropData.maxPV != null) &&
      (this.objPropData.minPV < this.objPropData.maxPV);

    if (!await this.refreshObjPropValues(true)) {
      this.router.navigate(['']);
      return;
    }

    await this.init();

    hideSpinner(document.getElementById('spinnerContainer'));

    this.startTimer();

    this.firstDataLoading = false;
  }

  async refreshObjPropValues(first: boolean): Promise<boolean> {
    const objPropRefList: ObjPropRef[] = [];
    this.objPropData.suppPropList.forEach(suppProp => {
      const objPropRef = new ObjPropRef(null);
      objPropRef.objTag = this.objPropData.objTag;
      objPropRef.propertyID = suppProp;
      objPropRefList.push(objPropRef);
    })

    const getObjPropValuesResponse = await this.objectService.getObjPropValues(objPropRefList);
    if (!getObjPropValuesResponse || getObjPropValuesResponse.objResult.result !== Result.Ok) {
      return false;
    }

    this.objPropData.updateObjPropValues(getObjPropValuesResponse.objPropValueGetRspList, first, this.textService);

    return true;
  }

  async init() {
    this.stateTexts = [];
    this.selectedStateText = null;
    // this.selectedStateText = this.autoStateText.value;
    this.defaultWritePrio = OdbPriorityLevel.ManualOperator;
    this.analogValue = null;
    this.pointerValue = null;
    this.isInitial = true;
    this.isManual = true;
    this.analogAutoButtonDisabled = true;
    this.lowLimit = null;
    this.highLimit = null;

    // let analogValue = 0;

    this.isAnalog = OdbObject.isAnalogObjType(this.objPropData.objType);

    if (this.isAnalog) {
      this.secondPaneHeight = 280;
      this.step = 1;
      if (this.objPropData.resolution) {
        this.step = this.objPropData.resolution;
      }
    } else {
      this.secondPaneHeight = 175;
    }

    if (!this.objPropData.cmdType || (this.objPropData.cmdType !== OdbCommandType.AutoManual)) {
      this.isManual = true;
    } else {
      this.analogAutoButtonDisabled = false;
    }

    if (this.objPropData.objType === OdbObjectType.Command) {
      this.defaultWritePrio = -1;
    } else {
      const getConfigDataResponse = await this.configService.getConfigDataDefinition('project.ini', 'WritePriority');
      if (getConfigDataResponse && getConfigDataResponse.result === Result.Ok) {
        let writePrio: number;
        getConfigDataResponse.configDataList.forEach(configData => {
          if (configData.key.toUpperCase() === OdbConstants.objBoxWritePrioKey.toUpperCase()) {
            writePrio = parseInt(configData.value, 10);
            if ((writePrio.toString() === configData.value) &&
              (writePrio > 0) &&
              (writePrio <= OdbConstants.cmdPrioArraySize)) {
              this.defaultWritePrio = writePrio;
            }
          }
        })
      }
    }

    if (!this.isAnalog) {
      // Binary oder Multistate
      if (this.objPropData.statesID != null) {

        const states = await this.textService.getStatesAsync(this.objPropData.statesID);

        if (states && states.length > 0) {

          for (let i = 0; i < states.length; i++) {
            if (states[i] && states[i] !== '') {
              this.stateTexts.push(new StateText(i, states[i]));
            }
          }
        }
      }

      if ((this.objPropData.objType !== OdbObjectType.Command) &&
        this.objPropData.cmdType && (this.objPropData.cmdType === OdbCommandType.AutoManual)) {
        // Auto-Button dazu adden
        this.stateTexts.push(this.autoStateText);
      }
    }

    // StateText-array nochmal umkopieren, damit die syncfusion-Combobox den selektierten Eintrag als Text anzeigt!
    this.stateTexts = [...this.stateTexts];

    if (this.isAnalog) {
      await this.getLimits();
    }

    this.processDefaultValue();
  }

  processDefaultValue() {
    // Auto
    this.isManual = true; // Hand
    const feedbackPrioManual = this.objPropData.feedbackPrioManual;
    if (this.objPropData.cmdType && (this.objPropData.cmdType === OdbCommandType.AutoManual)) {
      if (((feedbackPrioManual === null)) || (feedbackPrioManual === this.global.prioAuto)) {
        this.isManual = false; // Auto
      }
    }

    // DefaultValue
    let defaultValue = null;
    if (this.objPropData.defaultValue !== null) {
      defaultValue = this.objPropData.defaultValue as number;
      if (this.isAnalog) {
        try {
          defaultValue = parseFloat(defaultValue.toFixed((this.objPropData.decimals !== null) ? this.objPropData.decimals : 0));
        } catch (error) {
        }
      }
      this.isInitial = false;
    }

    if (!this.isAnalog) {
      // Binary oder Multistate
      if (defaultValue != null) {
        let state: number = parseInt(defaultValue.toString(), 10);

        if (OdbObject.isMultistateObjType(this.objPropData.objType)) {
          state = OdbObject.getMultistateAdjustedValue(this.objPropData.bindType,
            this.objPropData.objType,
            MultistateAdjustment.ProcessToStateIndex,
            state);
        }

        this.selectedStateText = state;
      } else if (feedbackPrioManual !== null) {
        if ((this.objPropData.objType !== OdbObjectType.Command) &&
          this.objPropData.cmdType && (this.objPropData.cmdType === OdbCommandType.AutoManual)) {
          // Auto
          this.selectedStateText = this.autoStateText.value;
        }
      }
    }

    this.analogValue = defaultValue;
    this.pointerValue = defaultValue;
  }

  async writeClick() {
    let cmdValue: number = null;

    if (this.isAnalog) {
      if (!this.isManual) {
        cmdValue = null;
      } else {
        cmdValue = this.analogValue;

        if (this.hasMinMaxPV && ((cmdValue < this.objPropData.minPV) || (cmdValue > this.objPropData.maxPV))) {
          DialogUtility.alert({
            title: 'Fehler',
            content: 'Die Zahl liegt ausserhalb des gültigen Wertebereichs',
            okButton: this.alertDialogButtonArgs,
            position: { X: 'center', Y: 'center' },
          });
          return;
        }
      }
    } else {
      cmdValue = this.selectedStateText;

      if (cmdValue === null) {
        return;
      }

      if (OdbObject.isMultistateObjType(this.objPropData.objType)) {
        cmdValue = OdbObject.getMultistateAdjustedValue(this.objPropData.bindType,
          this.objPropData.objType,
          MultistateAdjustment.StateIndexToProcess,
          cmdValue);
      }
    }

    const pdmServiceResponse = await this.objectService.setObjCmdValue(this.objPropData.objTag, this.objPropData.bindType,
      this.objPropData.cmdType, this.objPropData.objType, this.defaultWritePrio, OdbStatusFlags.OK, cmdValue,
      this.sessionService.machineIdent, this.sessionService.session.loginData.personID, SdbTaskID.hiWebApp);
    if (pdmServiceResponse && pdmServiceResponse.result !== PdmServiceResult.Ok) {
      DialogUtility.alert({
        title: 'Fehler',
        content: pdmServiceResponse.result.toString(),
        okButton: this.alertDialogButtonArgs,
        position: { X: 'center', Y: 'center' },
      });
    } else {
      this.startTimer();
    }
  }

  // Syncfusion: FocusIn Event function for input component
  public focusInLeft(target: HTMLElement): void {
    target.parentElement.parentElement.classList.add('e-input-focus');
  }

  // Syncfusion: FocusOut Event function for input component
  public focusOutLeft(target: HTMLElement): void {
    target.parentElement.parentElement.classList.remove('e-input-focus');
  }

  public dragMove(args: IPointerDragEventArgs): void {
    this.stopTimer();

    if (this.objPropData.isCommandable) {
      if (this.isManual) {
        if (this.circulargauge && this.circulargauge.axes[0].pointers.length >= 3) {
          if (args.pointer !== this.circulargauge.axes[0].pointers[0]) {
            this.analogValue = Math.round(args.currentValue);
          } else {
            // Pointer ist der graue Range-Pointer!
            // Wert darf nur verwendet werden, wenn kein Übergang von minValue auf maxValue !!!
            // Sonst springt der Wert von 0 auf 100 !!!
            const maxValue = this.hasMinMaxPV ? this.objPropData.maxPV : 100;
            const minValue = this.hasMinMaxPV ? this.objPropData.minPV : 0;
            // console.log('!!!!!!!!!!!!!! {0}'.format(args.currentValue.toString()));
            if ((args.currentValue === maxValue) && (this.analogValue <= minValue + 5)) {
            } else {
              this.analogValue = Math.round(args.currentValue);
            }
          }
          this.isInitial = false;
        }
      }
    }

    this.updateCircularGaugePointerValues(this.analogValue);
  }

  public dragEnd(args: IPointerDragEventArgs): void {
    this.stopTimer();

    if (this.objPropData.isCommandable) {
      if (this.isManual) {
        if (this.circulargauge && this.circulargauge.axes[0].pointers.length >= 3) {
          if (args.pointer !== this.circulargauge.axes[0].pointers[0]) {
            this.analogValue = Math.round(args.currentValue);
          }
          this.isInitial = false;
        }
      }
    }
  }

  updateCircularGaugePointerValues(value: number) {
    if (this.circulargauge && this.circulargauge.axes[0].pointers.length >= 3) {
      this.circulargauge.setPointerValue(0, 0, this.hasMinMaxPV ? this.objPropData.maxPV : 100);
      this.circulargauge.setPointerValue(0, 1, value);
      this.circulargauge.setPointerValue(0, 2, value);
    }
  }

  async getLimits() {
    const limits = await this.eventService.getLimits(this.objPropData.objTag);

    if (limits) {
      this.lowLimit = limits.lowLimit;
      this.highLimit = limits.highLimit;
    }
  }

  navigateBack() {
    if (this.objPropData) {
      // this.routingData.objTreeNodeGroupID = this.objPropData.objParentGroupID;
      // this.routingData.objTag = this.objPropData.objTag;
    }

    this.router.navigate(['ov']);
  }

  onDropDownListPopupOpen(event: PopupEventArgs) {
    if (Browser.isDevice) {
      // Breite von Popup der DropDownList anpassen (syncfusion Vorgabe) !!!
      event.popup.offsetX = 0;
      event.popup.offsetY = 0;
      event.popup.width = this.dropDownList.element.offsetWidth + 'px';
      event.popup.dataBind();
      event.popup.refreshPosition(this.dropDownList.element, true);
    }
  }

  onDropDownListChange(event: ChangeEventArgs) {
    this.isInitial = false;

    this.stopTimer();
  }

  onSwitchChange(event: ChangeEventArgs) {
    this.isInitial = false;

    this.stopTimer();
  }

  onNumericTextBoxChange(event: any) {
    this.isInitial = false;

    this.updateCircularGaugePointerValues(this.analogValue);

    this.stopTimer();
  }

  private async onTimer5s(): Promise<void> {
    if (!this.timerStarted) {
      return;
    }

    console.log('onObjPropValuesTimeout');

    await this.refreshObjPropValues(false);

    this.processDefaultValue();
    this.updateCircularGaugePointerValues(this.analogValue);
  }

  startTimer() {
    this.timerStarted = true;
  }

  stopTimer() {
    this.timerStarted = false;
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  showOdbInfo() {
    this.displayOdbInfo = true;
  }

  onOdbInfoDialogDisplayChange(event: any) {
    this.displayOdbInfo = event;
  }

  contextMenuBeforeOpen(args: BeforeOpenCloseMenuEventArgs) {
    this.updateContextMenuItems();
  }

  updateContextMenuItems() {
    let enableAckToOffNormal = false;
    let enableAckToFault = false;
    let enableAckToNormal = false;
    let enableAckAll = false;
    let enableOdbInfo = false;

    if (this.objPropData) {
      if (this.objPropData.hasStatusFlags && this.objPropData.rights.acknowledgeAccess) {
        if (this.objPropData.hasAckedTransitions) {
          if ((this.objPropData.ackedTransitions & BACnetEventTransitions.ToOffNormal) === 0) {
            enableAckToOffNormal = true;
            enableAckAll = true;
          }

          if ((this.objPropData.ackedTransitions & BACnetEventTransitions.ToFault) === 0) {
            enableAckToFault = true;
            enableAckAll = true;
          }

          if ((this.objPropData.ackedTransitions & BACnetEventTransitions.ToNormal) === 0) {
            enableAckToNormal = true;
            enableAckAll = true;
          }
        }
      }

      enableOdbInfo = true;
    }

    let items: string[] = ['Ack', 'OdbInfo'];
    this.contextmenu.enableItems(items, true, true);

    items = [];
    if (!enableAckToOffNormal && !enableAckToFault && !enableAckToNormal && !enableAckAll) {
      items.push('Ack');
    }
    if (!enableAckToOffNormal) {
      items.push('AckToOffNormal');
    }
    if (!enableAckToFault) {
      items.push('AckToFault');
    }
    if (!enableAckToNormal) {
      items.push('AckToNormal');
    }
    if (!enableAckAll) {
      items.push('AckAll');
    }
    if (!enableOdbInfo) {
      items.push('OdbInfo');
    }

    this.contextmenu.enableItems(items, false, true);
  }

  ackToOffNormal() {
    this.ack(BACnetEventTransitions.ToOffNormal, false);
  }

  ackToFault() {
    this.ack(BACnetEventTransitions.ToFault, false);
  }

  ackToNormal() {
    this.ack(BACnetEventTransitions.ToNormal, false);
  }

  ackAll() {
    let transitions = BACnetEventTransitions.None;

    if ((this.objPropData.ackedTransitions & BACnetEventTransitions.ToOffNormal) === 0) {
      transitions |= BACnetEventTransitions.ToOffNormal;
    }

    if ((this.objPropData.ackedTransitions & BACnetEventTransitions.ToFault) === 0) {
      transitions |= BACnetEventTransitions.ToFault;
    }

    if ((this.objPropData.ackedTransitions & BACnetEventTransitions.ToNormal) === 0) {
      transitions |= BACnetEventTransitions.ToNormal;
    }

    this.ack(transitions, true);
  }

  async ack(transitions: BACnetEventTransitions, forceOnFailure: boolean) {
    this.ackEventsReq = null;
    let displayNoticeEdit = false;

    if (this.licenseService.license && this.licenseService.license.noticesLicensed) {
      if ((((transitions & BACnetEventTransitions.ToOffNormal) === BACnetEventTransitions.ToOffNormal) &&
        ((this.objPropData.noticesFlags & NoticeFlags.EnforceOnAckToOffNormal) === NoticeFlags.EnforceOnAckToOffNormal)) ||
        (((transitions & BACnetEventTransitions.ToFault) === BACnetEventTransitions.ToFault) &&
          ((this.objPropData.noticesFlags & NoticeFlags.EnforceOnAckToFault) === NoticeFlags.EnforceOnAckToFault)) ||
        (((transitions & BACnetEventTransitions.ToNormal) === BACnetEventTransitions.ToNormal) &&
          ((this.objPropData.noticesFlags & NoticeFlags.EnforceOnAckToNormal) === NoticeFlags.EnforceOnAckToNormal))) {
        this.noticeSubject = 'Ereignis-Quittierung / ';
        if (forceOnFailure) {
          this.noticeSubject += 'Alle';
        } else if ((transitions & BACnetEventTransitions.ToOffNormal) === BACnetEventTransitions.ToOffNormal) {
          this.noticeSubject += 'ToOffNormal';
        } else if ((transitions & BACnetEventTransitions.ToFault) === BACnetEventTransitions.ToFault) {
          this.noticeSubject += 'ToFault';
        } else if ((transitions & BACnetEventTransitions.ToNormal) === BACnetEventTransitions.ToNormal) {
          this.noticeSubject += 'ToNormal';
        }
        displayNoticeEdit = true;
      }
    }

    this.ackEventsReq = new AckEventsReq(forceOnFailure,
      new AckEventSignature(0, // AckTime wird erst mal in WebApi bestückt!
        this.sessionService.machineIdent,
        NoticePriority.Normal,
        this.noticeSubject,
        '',
        this.sessionService.session.sessionGUID,
        this.sessionService.session.loginData.personID),
      transitions,
      null,
      [this.objPropData.objTag]);

    if (!displayNoticeEdit) {
      this.confirmAckEvents();
    } else {
      this.displayNoticeEdit = true;
    }
  }

  confirmAckEvents() {
    this.ackEventsConfirmDialog = DialogUtility.confirm({
      title: 'Quittierung',
      content: 'Möchten Sie das ausgewählte Ereignis wirklich quittieren?',
      okButton: {
        text: 'Ja', icon: 'fa fa-check', cssClass: 'e-success e-round-corner',
        click: () => { this.eventService.ackEvents(this.ackEventsReq); this.closeAckEventsDialog() }
      },
      cancelButton: { text: 'Nein', icon: 'fa fa-close', cssClass: 'e-success e-round-corner' },
      showCloseIcon: true,
      closeOnEscape: true,
      position: { X: 'center', Y: 'center' },
      animationSettings: this.dialogAnimationSettings,
    });
  }

  closeAckEventsDialog() {
    if (this.ackEventsConfirmDialog) {
      this.ackEventsConfirmDialog.close();
    }
    this.ackEventsConfirmDialog = null;
  }

  onNoticeEditDialogOk(notice: Notice) {
    this.ackEventsReq.signature.noticeSubject = notice.subject;
    this.ackEventsReq.signature.noticePrio = notice.priority;
    this.ackEventsReq.signature.noticeText = notice.text;

    this.eventService.ackEvents(this.ackEventsReq);
  }

  onNoticeEditDialogDisplayChange(event) {
    this.displayNoticeEdit = event;
  }

  openContextMenu(event: any) {
    this.updateContextMenuItems();
    this.contextmenu.open(event.pageY, event.pageX);
  }

}
