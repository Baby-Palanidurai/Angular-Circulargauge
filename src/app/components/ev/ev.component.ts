import { Component, ViewEncapsulation, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Session } from 'app/shared/sessions/session';
import { SessionService } from 'app/shared/sessions/session.service';
import { EventService } from 'app/shared/events/event.service';
import { LicenseService } from 'app/shared/license/license.service';
import { TextService } from 'app/shared/texts/text.service';
import { AckEventsReq, AckEventSignature, ActiveEventData, GetEventStatesFilter } from 'app/shared/events/event';
import { GetEventStatesReq } from 'app/shared/events/event';
import { TimerService } from 'app/shared/timers/timer.service';
import { Result, OdbPropertyID, AuthdbObjAccessRights, BACnetEventTransitions, BACnetEventTransitionBits } from 'app/shared/global/enum';
import { NoticePriority, NoticeFlags, BACnetEventState } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { Router } from '@angular/router';
import { DialogUtility, DialogModel } from '@syncfusion/ej2-popups';
import {
  MenuItemModel, BeforeOpenCloseMenuEventArgs, ContextMenuComponent, MenuEventArgs, FieldSettingsModel
} from '@syncfusion/ej2-angular-navigations';
import { ListViewComponent, Fields } from '@syncfusion/ej2-angular-lists';
import {
  GridComponent, RowSelectEventArgs, RowSelectingEventArgs, SelectionSettingsModel, PageSettingsModel, ContextMenuItemModel,
  RowDataBoundEventArgs, SortEventArgs, VirtualScrollService, QueryCellInfoEventArgs
} from '@syncfusion/ej2-angular-grids';
import { RoutingData } from 'app/shared/routing/routing-data';

import * as _ from 'lodash';
import { Notice } from 'app/shared/notices/notice';


//import { MyTestClass } from 'app/shared/objects/object';



@Component({
  selector: 'app-ev',
  templateUrl: './ev.component.html',
  styleUrls: ['./ev.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [VirtualScrollService]
})
export class EvComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('contextmenu', { static: false }) contextmenu: ContextMenuComponent;
  @ViewChild('listView', { static: false }) listView: ListViewComponent;
  @ViewChild('grid', { static: false }) grid: GridComponent;

  session: Session;

  activeEventData: ActiveEventData[] = [];

  activeEventsLoading = false;
  private timerStarted = false;
  selectedActiveEventDatas: ActiveEventData[] = [];
  contextMenuItems: MenuItemModel[];
  displayOdbInfo = false;
  isMobile = false;
  displayNoticeEdit = false;
  noticeSubject = '';
  ackEventsReq: AckEventsReq = null;
  private firstGetEventStates = true;

  listViewHeight: number;
  gridHeight: number;
  gridSelectionSettings: SelectionSettingsModel;
  gridPageSettings: PageSettingsModel;
  gridSortSettings: Object;
  ackEventsConfirmDialog: DialogModel;
  dialogAnimationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };

  listViewFields: Object = { id: 'objTag2' };

  constructor(private router: Router, private global: Global,
    private licenseService: LicenseService,
    private timerService: TimerService,
    private sessionService: SessionService, private textService: TextService,
    private eventService: EventService, private routingData: RoutingData) {
    this.sessionService.onSessionCreated.subscribe(session => this.onSessionCreated(session));
    this.timerService.onTimer5s.subscribe(() => this.onTimer5s());
    this.isMobile = global.isMobile;
    this.global.onIsMobileChanged.subscribe(isMobile => this.onIsMobileChanged(isMobile));
    this.global.onWindowHeightChanged.subscribe(windowHeight => this.onWindowHeightChanged(windowHeight));
    this.setGridHeight();
    this.setListViewHeight();
    this.selectedActiveEventDatas = [];

    this.ackEventsConfirmDialog = null;

    this.gridSelectionSettings = { type: 'Multiple' };
    this.gridPageSettings = { pageSize: 100 }
    this.gridSortSettings = { columns: [{ field: 'comeTimeCompareEntry', direction: 'Descending' }] };
  }

  private onIsMobileChanged(isMobile: boolean): void {
    this.isMobile = isMobile;

    if (isMobile) {
      const activeEventData = this.activeEventData; // zuerst in neues Array füllen und sortieren, sonst hat syncfusion ein Scroll-Problem!
      this.onComeTimeSort(activeEventData);
      this.activeEventData = activeEventData;
      this.setListViewHeight();
      setTimeout(() => {
        // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
        if (this.listView) {
          this.listView.refreshItemHeight();
        }
      }, 300);
    } else {
      this.activeEventData = [...this.activeEventData];
      this.setGridHeight();
    }
  }

  private onWindowHeightChanged(windowHeight: number): void {
    this.setGridHeight();
    this.setListViewHeight();
  }

  private setGridHeight() {
    // this.gridHeight = (this.global.windowHeight - 200); // mit Paging
    this.gridHeight = (this.global.windowHeight - 150); // ohne Paging
  }

  private setListViewHeight() {
    // Here 110 for reduce the header and footer element's height from window’s inner height (from syncfusion!)
    this.listViewHeight = (window.innerHeight - 110);
  }

  private async onTimer5s(): Promise<void> {
    if (!this.timerStarted) {
      return;
    }

    if (!this.firstGetEventStates) {
      console.log('getEventStates - onTimer5s');
      this.getEventStates(true);
    }
  }

  private onSessionCreated(session: Session) {
    if (session.result !== Result.Ok) {
      return;
    }

    this.activeEventData = [];
    this.setGridHeight();
    this.setListViewHeight();

    setTimeout(() => {
      console.log('getEventStates - onSessionCreated');
      this.getEventStates(false);
    }, 1000);

  }

  async getEventStates(onlyChanged: boolean): Promise<void> {
    const oldItemCount = this.activeEventData.length;

    if (this.activeEventsLoading) {
      return;
    }

    if (!onlyChanged) {
      this.setGridHeight();
      this.setListViewHeight();
    }

    if (!this.sessionService.session) {
      this.activeEventData = [];
      this.setGridHeight();
      this.setListViewHeight();
      return;
    }

    //this.activeEventsLoading = true;

    if (!onlyChanged) {
      await this.eventService.getEvGroupDefData();
    }

    const getEventStatesFilter = new GetEventStatesFilter();
    const getEventStatesReq = new GetEventStatesReq(onlyChanged, getEventStatesFilter, this.sessionService.session.sessionGUID);
    const rsp = await this.eventService.getEventStates(getEventStatesReq);

    let activeEventData: ActiveEventData[] = this.activeEventData;
    let hasChanged = false;
    let mustRefreshItemHeight = false;
    let mustRefreshListView = false;
    let mustRefreshGrid = false;

    if (rsp) {
      if (!onlyChanged) {
        this.activeEventsLoading = true; // ListView ausblenden
        activeEventData = [];
        this.setGridHeight();
        this.setListViewHeight();
        if (rsp.hasEvents) {
          // zuerst in neues Array füllen und sortieren, sonst hat syncfusion ein Scroll-Problem!
          for (let i = 0; i < rsp.eventStateInfos.length; i++) {
            const eventStateInfo = rsp.eventStateInfos[i];
            const activeEventDataItem = new ActiveEventData(eventStateInfo,
              rsp.userAccessRights[i], this.eventService);
            activeEventData.push(activeEventDataItem);

            if (this.isMobile) {
              //this.listView.addItem([activeEventDataItem as any]); // from syncfusion
            }
          }

          if (this.isMobile) {
            this.onComeTimeSort(activeEventData);
          }

          mustRefreshListView = true;
          mustRefreshItemHeight = true;
          mustRefreshGrid = true;
        }
      } else {
        /*
                // Farb-Test-syncfusion
                for (let i = 0; i < activeEventData.length; i++) {
                  const evData = activeEventData[i];
                  evData.setColorTest();
                }
        */

        // Aktualisieren!!!
        // Dies hier alle so umständlich lassen, damit syncfusion mit grid und listView funktioniert !!!
        if (rsp.hasEvents) {
          for (let i = 0; i < rsp.eventStateInfos.length; i++) {
            const eventStateInfo = rsp.eventStateInfos[i];

            const index = activeEventData.findIndex((activeEventData2) => {
              return (activeEventData2.eventStateInfo.objTag === eventStateInfo.objTag);
            });

            if (index >= 0) {
              let evData = activeEventData[index];

              const oldColor = evData.color;

              if (evData.update(eventStateInfo, rsp.userAccessRights[i], this.textService, this.eventService, this.global)) {
                //console.log('evData.update: old color={0}, new color={1},item={2}'.format(evData.color, oldColor, evData.eventStateInfo.msgText));
                //  activeEventData);

                hasChanged = true;
              }
            } else {
              // Neuer Alarm
              this.activeEventsLoading = true; // ListView ausblenden
              const activeEventDataItem = new ActiveEventData(eventStateInfo,
                rsp.userAccessRights[i], this.eventService);
              activeEventData.push(activeEventDataItem);
              hasChanged = true;

              if (this.isMobile) {
                //this.listView.addItem([activeEventDataItem as any]); // from syncfusion
              }

              mustRefreshListView = true;
              mustRefreshItemHeight = true;
              mustRefreshGrid = true;
            }
          }

          if (this.isMobile && hasChanged) {
            this.onComeTimeSort(activeEventData);
          }
        }

        if (rsp.obsoleteObjTags && (rsp.obsoleteObjTags.length > 0)) {
          for (let i = 0; i < rsp.obsoleteObjTags.length; i++) {
            const objTag = rsp.obsoleteObjTags[i];
            const index = activeEventData.findIndex((activeEventData2) => {
              return (activeEventData2.eventStateInfo.objTag === objTag);
            });

            if (index >= 0) {
              // zuerst in neues Array füllen und sortieren, sonst hat syncfusion ein Scroll-Problem!
              this.activeEventsLoading = true; // ListView ausblenden
              activeEventData.splice(index, 1)
              hasChanged = true;

              if (this.isMobile) {
                //this.listView.removeItem({ 'objTag2': objTag });
              }

              mustRefreshListView = true;
              mustRefreshItemHeight = true;
              mustRefreshGrid = true;
            }
          }
        }
      }

      //if (!this.isMobile) {
      this.activeEventData = activeEventData;
      //}

      this.setGridHeight();
      this.setListViewHeight();

      this.firstGetEventStates = false;
      
      this.startTimer();
    }

    if (hasChanged) {
      //console.log(this.activeEventData);
       //this.refreshGrid();
    }

    if (!this.isMobile && mustRefreshGrid) {
      this.refreshGrid();
    }

    if (this.isMobile && mustRefreshListView && onlyChanged) {
      if (this.listView) {
        // ListView zuerst leeren und dann neu aufbauen!!!
        //this.listView.refresh();
      }
    }

    if (this.activeEventsLoading) {
      setTimeout(() => {
        this.activeEventsLoading = false; // ListView wieder anzeigen, dadurch werden die Items über das Array neu aufgebaut!

        if (this.isMobile && (this.activeEventData.length !== oldItemCount)) {
          setTimeout(() => {
            // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
            if (this.listView) {
              this.listView.refreshItemHeight();
            }
          }, 300);
        }
      }, 100);
    }

    /*
        if (this.isMobile && (this.activeEventData.length !== oldItemCount)) {
          setTimeout(() => {
            // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
            if (this.listView) {
              this.listView.refreshItemHeight();
            }
          }, 300);
        }
    */
  }

  listViewActionBegin() {
    //console.log('listViewActionBegin {0}'.format(Global.formatDateTime(new Date(), true)));
  }

  listViewActionComplete() {
    //console.log('listViewActionComplete {0}'.format(Global.formatDateTime(new Date(), true)));

    setTimeout(() => {
      // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
      this.listView.refreshItemHeight();
    }, 100);
  }

  refreshGrid() {
    if (!this.isMobile) {
      if (this.grid) {
        this.grid.refresh();
      }
    }
  }

  startTimer() {
    this.timerStarted = true;
  }

  stopTimer() {
    this.timerStarted = false;
  }

  ngOnInit() {
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
        id: 'ObjectViewer',
        text: 'Objekt-Viewer',
        iconCss: 'objectViewer-icon',
      },
      {
        id: 'OdbInfo',
        text: 'Objekt-Information...',
        iconCss: 'odbInfo-icon',
      }
    ];
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

      case 'ObjectViewer': {
        this.showObjectViewer();
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

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');

    this.activeEventData = [];
    this.setGridHeight();
    this.setListViewHeight();

    if (this.sessionService.validSession) {
      console.log('getEventStates - ngAfterViewInit');
      this.getEventStates(false);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  onRowSelected(args: RowSelectEventArgs) {
    this.selectedActiveEventDatas = this.grid.getSelectedRecords() as ActiveEventData[];
    this.updateContextMenuItems();
    // this.contextmenu.hide();
  }

  showObjectViewer() {
    const objGroupId = this.selectedActiveEventDatas[0].eventStateInfo.objGroupId;
    const objTag = this.selectedActiveEventDatas[0].eventStateInfo.objTag;
    this.routingData.objTreeNodeGroupID = objGroupId;
    this.routingData.objTag = objTag;
    this.router.navigate(['ov']);
  }

  showOdbInfo() {

    this.displayOdbInfo = true;

    //this.activeEventData[0].color = 'Green';
    //this.activeEventData[1].color = 'Green';
    //this.activeEventData[2].color = 'Green';





    // check circular references
    //const s = JSON.stringify(this.selectedActiveEventDatas[0]);
    //const b = 0;


    //const objTag = this.selectedActiveEventDatas[0].eventStateInfo.objTag;

    //this.listView.removeItem( {'objTag2': objTag} );
    //this.listView.removeItem( {'eventStateInfo.objTag': objTag};
  }

  onOdbInfoDialogDisplayChange(event) {
    this.displayOdbInfo = event;
  }

  updateContextMenuItems() {
    let enableAckToOffNormal = false;
    let enableAckToFault = false;
    let enableAckToNormal = false;
    let enableAckAll = false;
    let enableOdbInfo = false;
    let enableObjectViewer = false;

    if (this.selectedActiveEventDatas.length === 1) {
      if ((this.selectedActiveEventDatas[0].objAccessRights & AuthdbObjAccessRights.Acknowledge) === AuthdbObjAccessRights.Acknowledge) {
        if (((this.selectedActiveEventDatas[0].eventStateInfo.acksReq & BACnetEventTransitions.ToOffNormal) !== 0) &&
          (this.selectedActiveEventDatas[0].eventStateInfo.ackTimes[BACnetEventTransitionBits.ToOffNormal] === 0)) {
          enableAckToOffNormal = true;
          enableAckAll = true;
        }

        if (((this.selectedActiveEventDatas[0].eventStateInfo.acksReq & BACnetEventTransitions.ToFault) !== 0) &&
          (this.selectedActiveEventDatas[0].eventStateInfo.ackTimes[BACnetEventTransitionBits.ToFault] === 0)) {
          enableAckToFault = true;
          enableAckAll = true;
        }

        if (((this.selectedActiveEventDatas[0].eventStateInfo.acksReq & BACnetEventTransitions.ToNormal) !== 0) &&
          (this.selectedActiveEventDatas[0].eventStateInfo.ackTimes[BACnetEventTransitionBits.ToNormal] === 0)) {
          enableAckToNormal = true;
          enableAckAll = true;
        }
      }

      if (this.selectedActiveEventDatas[0].eventStateInfo.objTag !== '_EVNT_Control') {
        enableOdbInfo = true;
      }

      enableObjectViewer = true;
    } else if (this.selectedActiveEventDatas.length > 1) {
      this.selectedActiveEventDatas.forEach(selectedActiveEventData => {
        if ((selectedActiveEventData.objAccessRights & AuthdbObjAccessRights.Acknowledge) === AuthdbObjAccessRights.Acknowledge) {
          if (((selectedActiveEventData.eventStateInfo.acksReq & BACnetEventTransitions.ToOffNormal) !== 0) &&
            (selectedActiveEventData.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToOffNormal] === 0)) {
            enableAckToOffNormal = true;
            enableAckAll = true;
          }

          if (((selectedActiveEventData.eventStateInfo.acksReq & BACnetEventTransitions.ToFault) !== 0) &&
            (selectedActiveEventData.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToFault] === 0)) {
            enableAckToFault = true;
            enableAckAll = true;
          }

          if (((selectedActiveEventData.eventStateInfo.acksReq & BACnetEventTransitions.ToNormal) !== 0) &&
            (selectedActiveEventData.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToNormal] === 0)) {
            enableAckToNormal = true;
            enableAckAll = true;
          }
        }
      })
    }

    let items: string[] = ['Ack', 'ObjectViewer', 'OdbInfo'];
    this.contextmenu.enableItems(items, true, true);
    if (this.grid) {
      this.grid.contextMenuModule.contextMenu.enableItems(items, true, true);
    }

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
    if (!enableObjectViewer) {
      items.push('ObjectViewer');
    }

    this.contextmenu.enableItems(items, false, true);
    if (this.grid) {
      this.grid.contextMenuModule.contextMenu.enableItems(items, false, true);
    }
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
    this.ack(BACnetEventTransitions.All, true);
  }

  async ack(transitions: BACnetEventTransitions, forceOnFailure: boolean) {
    this.ackEventsReq = null;
    const eventIdsToAck: number[] = [];
    let mustCreateNotice = false;

    this.selectedActiveEventDatas.forEach(activeEventData => {
      if (((transitions & activeEventData.eventStateInfo.acksReq) !== 0) &&
        ((activeEventData.objAccessRights & AuthdbObjAccessRights.Acknowledge) === AuthdbObjAccessRights.Acknowledge)) {

        if ((transitions & BACnetEventTransitions.ToOffNormal) !== 0) {
          if ((activeEventData.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToOffNormal] === 0) &&
            (activeEventData.eventStateInfo.evIds[BACnetEventTransitionBits.ToOffNormal] !== 0)) {
            eventIdsToAck.push(activeEventData.eventStateInfo.evIds[BACnetEventTransitionBits.ToOffNormal]);

            if (this.licenseService.license && this.licenseService.license.noticesLicensed &&
              ((activeEventData.eventStateInfo.noticesFlags & NoticeFlags.EnforceOnAckToOffNormal) ===
                NoticeFlags.EnforceOnAckToOffNormal)) {
              mustCreateNotice = true;
            }
          }

        }

        if ((transitions & BACnetEventTransitions.ToFault) !== 0) {
          if ((activeEventData.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToFault] === 0) &&
            (activeEventData.eventStateInfo.evIds[BACnetEventTransitionBits.ToFault] !== 0)) {
            eventIdsToAck.push(activeEventData.eventStateInfo.evIds[BACnetEventTransitionBits.ToFault]);

            if (this.licenseService.license && this.licenseService.license.noticesLicensed &&
              ((activeEventData.eventStateInfo.noticesFlags & NoticeFlags.EnforceOnAckToFault) ===
                NoticeFlags.EnforceOnAckToFault)) {
              mustCreateNotice = true;
            }
          }

        }

        if ((transitions & BACnetEventTransitions.ToNormal) !== 0) {
          if ((activeEventData.eventStateInfo.ackTimes[BACnetEventTransitionBits.ToNormal] === 0) &&
            (activeEventData.eventStateInfo.evIds[BACnetEventTransitionBits.ToNormal] !== 0)) {
            eventIdsToAck.push(activeEventData.eventStateInfo.evIds[BACnetEventTransitionBits.ToNormal]);

            if (this.licenseService.license && this.licenseService.license.noticesLicensed &&
              ((activeEventData.eventStateInfo.noticesFlags & NoticeFlags.EnforceOnAckToNormal) ===
                NoticeFlags.EnforceOnAckToNormal)) {
              mustCreateNotice = true;
            }
          }
        }
      }
    })

    this.noticeSubject = '';

    if (mustCreateNotice) {
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
      eventIdsToAck,
      null);

    if (!mustCreateNotice) {
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

  onComeTimeSort(array: ActiveEventData[]) {
    array.sort((entry1: ActiveEventData, entry2: ActiveEventData) => {
      const toOffNormalTime1 = entry1.eventStateInfo.evTimes[BACnetEventTransitionBits.ToOffNormal];
      const toFaultTime1 = entry1.eventStateInfo.evTimes[BACnetEventTransitionBits.ToFault];
      let time1 = 0;
      const toOffNormalTime2 = entry2.eventStateInfo.evTimes[BACnetEventTransitionBits.ToOffNormal];
      const toFaultTime2 = entry2.eventStateInfo.evTimes[BACnetEventTransitionBits.ToFault];
      let time2 = 0;

      if ((toOffNormalTime1 !== 0) || (toFaultTime1 !== 0)) {
        time1 = Math.max(toOffNormalTime1, toFaultTime1);
      }

      if ((toOffNormalTime2 !== 0) || (toFaultTime2 !== 0)) {
        time2 = Math.max(toOffNormalTime2, toFaultTime2);
      }

      if (time1 < time2) {
        return 1; // drehen, damit neueste oben
      }
      if (time1 > time2) {
        return -1; // drehen, damit neueste oben
      }

      // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
      // Sonst können die Zeilen beim nächsten Compare im Grid springen!
      return entry1.eventStateInfo.objTag.localeCompare(entry2.eventStateInfo.objTag);
    });
  }

  gridSortComparerComeTime = (entry1: any, entry2: any) => {
    const toOffNormalTime1 = entry1.toOffNormalTime;
    const toFaultTime1 = entry1.toFaultTime;
    let time1 = 0;
    const toOffNormalTime2 = entry2.toOffNormalTime;
    const toFaultTime2 = entry2.toFaultTime;
    let time2 = 0;

    if ((toOffNormalTime1 !== 0) || (toFaultTime1 !== 0)) {
      time1 = Math.max(toOffNormalTime1, toFaultTime1);
    }

    if ((toOffNormalTime2 !== 0) || (toFaultTime2 !== 0)) {
      time2 = Math.max(toOffNormalTime2, toFaultTime2);
    }

    if (time1 < time2) {
      return -1;
    }
    if (time1 > time2) {
      return 1;
    }

    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerGoTime = (entry1: any, entry2: any) => {
    const timeNormalTime1 = entry1.timeNormalTime;
    const timeNormalTime2 = entry2.timeNormalTime;

    if (timeNormalTime1 < timeNormalTime2) {
      return -1;
    }
    if (timeNormalTime1 > timeNormalTime2) {
      return 1;
    }

    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerAckToOffNormalTime = (entry1: any, entry2: any) => {
    if (entry1.ackToOffNormalTime < entry2.ackToOffNormalTime) {
      return -1;
    }
    if (entry1.ackToOffNormalTime > entry2.ackToOffNormalTime) {
      return 1;
    }

    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  }

  gridSortComparerAckToFaultTime = (entry1: any, entry2: any) => {
    if (entry1.ackToFaultTime < entry2.ackToFaultTime) {
      return -1;
    }
    if (entry1.ackToFaultTime > entry2.ackToFaultTime) {
      return 1;
    }

    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  }

  gridSortComparerAckToNormalTime = (entry1: any, entry2: any) => {
    if (entry1.ackToNormalTime < entry2.ackToNormalTime) {
      return -1;
    }
    if (entry1.ackToNormalTime > entry2.ackToNormalTime) {
      return 1;
    }

    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  }

  /*
    showContextMenu(event) {
      this.updateContextMenuItems();
      //this.contextMenu.toggle(event);
    }
  */

  openContextMenu(event) {
    this.updateContextMenuItems();
    this.contextmenu.open(event.pageY, event.pageX);
  }

  contextMenuBeforeOpen(args: BeforeOpenCloseMenuEventArgs) {
    this.updateContextMenuItems();
  }

  gridDatabound(args: any) {
    // "no records to display"-Text ausblenden!
    const contentTable = this.grid.getContentTable() as HTMLElement;
    const elems = contentTable.getElementsByClassName('e-emptyrow');

    if (elems && elems.length === 1) {
      elems[0].textContent = '';
    }
  }
}
