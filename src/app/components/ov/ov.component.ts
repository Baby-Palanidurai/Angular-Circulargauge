import { Component, ViewEncapsulation, OnInit, AfterViewInit, OnDestroy, ElementRef } from '@angular/core';
// import { ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ViewChild } from '@angular/core';
import { Session } from './../../shared/sessions/session';
import { SessionService } from './../../shared/sessions/session.service';
import { TextService } from 'app/shared/texts/text.service';
import { GetObjGroupResponse, ObjResult, GetObjFilterDataResponse, ObjData, GetObjPropValuesResponse } from './../../shared/objects/object';
import { ObjPropRef, ObjPropData, ObjPropValueGetRsp, ObjGroup, ObjPropValue } from './../../shared/objects/object';
import { ObjectService } from './../../shared/objects/object.service';
import { EventService } from './../../shared/events/event.service';
import { LicenseService } from './../../shared/license/license.service';
import { AckEventsReq, AckEventSignature } from './../../shared/events/event';
import { ObjTreeNode } from 'app/shared/treenode/treenode';
import { TimerService } from './../../shared/timers/timer.service';
import { Result, ObjGroupSelector, OdbGroupLevel, OdbPropertyID, AuthdbObjAccessRights } from 'app/shared/global/enum';
import { BACnetEventTransitions } from 'app/shared/global/enum';
import { NoticePriority, NoticeFlags } from 'app/shared/global/enum';
import { OdbObject } from 'app/shared/objects/odb-object';
import { OdbConstants } from 'app/shared/global/constant';
import { Global } from 'app/shared/global/global';
import { ConfigService } from './../../shared/config/config.service';
import {
  TreeView, NodeSelectEventArgs, NodeExpandEventArgs, NodeAnimationSettingsModel, MenuItemModel, BeforeOpenCloseMenuEventArgs,
  ContextMenuComponent, MenuEventArgs, FieldsSettings
} from '@syncfusion/ej2-angular-navigations';
import {
  GridComponent, RowSelectEventArgs, RowSelectingEventArgs, SelectionSettingsModel, PageSettingsModel, ContextMenuItemModel,
  RowDataBoundEventArgs, SortEventArgs, VirtualScrollService, QueryCellInfoEventArgs
} from '@syncfusion/ej2-angular-grids';
import { DialogUtility, DialogModel, Tooltip } from '@syncfusion/ej2-popups';
import { ListViewComponent, Fields, SelectedItem } from '@syncfusion/ej2-angular-lists';
import { SidebarComponent } from '@syncfusion/ej2-angular-navigations';
import { Router } from '@angular/router';
import { RoutingData } from 'app/shared/routing/routing-data';
import { Notice } from 'app/shared/notices/notice';

import * as _ from 'lodash';

@Component({
  selector: 'app-ov',
  templateUrl: './ov.component.html',
  styleUrls: ['./ov.component.scss'],
  encapsulation: ViewEncapsulation.None,
  // changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [VirtualScrollService]
})
export class OvComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('objTreeView', { static: false }) objTreeView: TreeView;
  // @ViewChild('listView', { static: false }) listView: ListView;
  @ViewChild('grid', { static: false }) grid: GridComponent;
  @ViewChild('contextmenu', { static: false }) contextmenu: ContextMenuComponent;
  @ViewChild('listView', { static: false }) listView: ListViewComponent;
  @ViewChild('sideBar', { static: false }) sideBar: SidebarComponent;

  session: Session;

  objFilterData: ObjPropData[];

  curSelectedObjPropData: ObjPropData;

  treeNodes: ObjTreeNode[] = [];
  treeNodeGroupIdMap: Map<number, ObjTreeNode>; // groupId, ObjTreeNode
  treeNodeFields: Object = {};

  treeAnimation: NodeAnimationSettingsModel;
  expandedNodes: string[];
  expandActive = false;
  selectActive = false;

  joinedObjGroupDescr = OdbConstants.labelNotAvailable;

  objTreeLoading = false;
  objDataLoading = false;
  private timerStarted = false;
  contextMenuItems: MenuItemModel[];
  displayOdbInfo = false;
  isMobile = false;
  displayNoticeEdit = false;
  noticeSubject = '';
  ackEventsReq: AckEventsReq = null;
  listViewHeight: number;
  gridHeight: number;
  gridSelectionSettings: SelectionSettingsModel;
  gridPageSettings: PageSettingsModel;
  gridSortSettings: Object;
  ackEventsConfirmDialog: DialogModel;
  dialogAnimationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };

  listViewFields: Object = { id: 'objTag' };

  constructor(private router: Router, private global: Global, private licenseService: LicenseService,
    private timerService: TimerService, private sessionService: SessionService, private objectService: ObjectService,
    private eventService: EventService, private configService: ConfigService, private textService: TextService,
    private routingData: RoutingData) {
    this.sessionService.onSessionCreated.subscribe(session => this.onSessionCreated(session));
    this.timerService.onTimer5s.subscribe(() => this.onTimer5s());
    this.isMobile = global.isMobile;
    // this.isMobile = true;
    this.global.onIsMobileChanged.subscribe(isMobile => this.onIsMobileChanged(isMobile));
    this.global.onWindowHeightChanged.subscribe(windowHeight => this.onWindowHeightChanged(windowHeight));
    this.objFilterData = [];
    this.setGridHeight();
    this.setListViewHeight();
    this.treeNodeGroupIdMap = new Map<number, ObjTreeNode>();
    this.expandedNodes = [];
    this.ackEventsConfirmDialog = null;

    /*
        this.treeNodeFields = {
          dataSource: this.treeNodes,
          id: 'groupIdString',
          text: 'label',
          iconCss: 'icon',
          child: 'children',
          parentID: 'parentGroupId',
          selected: 'selectedString',
          expanded: 'expandedString',
        };
    */

    this.treeAnimation = {
      expand: { effect: 'SlideDown', duration: 0, easing: 'linear' }, // damit zuklappen von anderen TreeNodes richtig kappt!
      collapse: { effect: 'SlideUp', duration: 0, easing: 'linear' } // damit zuklappen von anderen TreeNodes richtig kappt!
    };

    this.gridSelectionSettings = { type: 'Single' };
    this.gridPageSettings = { pageSize: 100 }
    this.gridSortSettings = { /*columns: [{ field: 'description', direction: 'Ascending' }]*/ };
  }

  private onIsMobileChanged(isMobile: boolean): void {
    // this.isMobile = true;
    // return;

    this.isMobile = isMobile;

    if (isMobile) {
      const objFilterData = this.objFilterData; // zuerst in neues Array füllen und sortieren, sonst hat syncfusion ein Scroll-Problem!
      this.onDescrSort(objFilterData);
      this.objFilterData = objFilterData;
      this.setListViewHeight();
      setTimeout(() => {
        // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
        if (this.listView) {
          this.listView.refreshItemHeight();
        }
      }, 300);
    } else {
      this.objFilterData = [...this.objFilterData];
      this.setGridHeight();
    }

  }

  private onWindowHeightChanged(windowHeight: number): void {
    this.setGridHeight();
    this.setListViewHeight();
  }

  private setGridHeight() {
    this.gridHeight = (this.global.windowHeight - 150);
  }

  private setListViewHeight() {
    // Here 110 for reduce the header and footer element's height from window’s inner height (from syncfusion!)
    this.listViewHeight = (window.innerHeight - 110);
  }

  private async onTimer5s(): Promise<void> {
    if (!this.timerStarted) {
      return;
    }

    console.log('onObjTimeout');

    const objPropRefArray = this.prepareObjPropRef();

    const rsp = await this.objectService.getObjPropValues(objPropRefArray);
    if (rsp && rsp.objResult.result === Result.Ok) {
      this.onGetObjPropValues(rsp.objPropValueGetRspList);
      this.startTimer();
    }
  }

  private async onSessionCreated(session: Session) {
    if (session.result !== Result.Ok) {
      return;
    }

    this.objFilterData = [];
    this.setGridHeight();
    this.setListViewHeight();

    this.getObjTree();
  }

  async getObjTree(): Promise<void> {
    if (this.objTreeLoading) {
      return;
    }

    this.treeNodes = [];
    this.treeNodeGroupIdMap.clear();

    if (!this.sessionService.session) {
      return;
    }

    this.objTreeLoading = true;

    const rsp = await this.objectService.getObjTree(ObjGroupSelector.LevelMinLimit, undefined, OdbGroupLevel.InformationCenter);

    if (rsp && rsp.result === Result.Ok) {
      let curIdx = 0;
      let curTreeNode: ObjTreeNode = null;
      let selectedTreeNode: ObjTreeNode = null;

      for (const objGroup of rsp.objGroupList) {
        let descr: string = objGroup.description;
        if (!descr) {
          descr = '[' + objGroup.groupIDStr + ']';
        }

        if (curTreeNode != null) {
          if (objGroup.trL === (curIdx + 1)) {
            const curTreeNodeOld = curTreeNode;

            curTreeNode = this.createTreeNode(descr, objGroup, curTreeNodeOld);
            curTreeNodeOld.children.push(curTreeNode);
            this.treeNodeGroupIdMap.set(objGroup.groupID, curTreeNode);
            curIdx = objGroup.trL;
            if (objGroup.groupID === this.routingData.objTreeNodeGroupID) {
              selectedTreeNode = curTreeNode;
            }
          } else {
            let end = false;

            do {
              curTreeNode = this.getTreeNode(curTreeNode.parentGroupId);

              if (curTreeNode == null) {
                curTreeNode = this.createTreeNode(descr, objGroup, null);
                this.treeNodes.push(curTreeNode);
                this.treeNodeGroupIdMap.set(objGroup.groupID, curTreeNode);
                curIdx = objGroup.trL;
                if (objGroup.groupID === this.routingData.objTreeNodeGroupID) {
                  selectedTreeNode = curTreeNode;
                }

                end = true;
              } else if (curTreeNode.data.trR > objGroup.trL) {
                end = true;

                const curTreeNodeOld = curTreeNode;

                curTreeNode = this.createTreeNode(descr, objGroup, curTreeNodeOld);
                curTreeNodeOld.children.push(curTreeNode);
                this.treeNodeGroupIdMap.set(objGroup.groupID, curTreeNode);
                curIdx = objGroup.trL;
                if (objGroup.groupID === this.routingData.objTreeNodeGroupID) {
                  selectedTreeNode = curTreeNode;
                }
              }

            } while (!end);
          }
        } else {
          curTreeNode = this.createTreeNode(descr, objGroup, null);
          this.treeNodes.push(curTreeNode);
          this.treeNodeGroupIdMap.set(objGroup.groupID, curTreeNode);
          curIdx = objGroup.trL;
          if (objGroup.groupID === this.routingData.objTreeNodeGroupID) {
            selectedTreeNode = curTreeNode;
          }
        }
      }

      if (selectedTreeNode !== null) {
        selectedTreeNode.selected = true;
        this.nodeSelect3(selectedTreeNode);
      }
    }

    this.treeNodeFields = {
      dataSource: this.treeNodes,
      id: 'groupIdString',
      text: 'label',
      iconCss: 'icon',
      child: 'children',
      parentID: 'parentGroupId',
      selected: 'selectedString',
      expanded: 'expandedString',
    };

    this.objTreeLoading = false;
  }

  createTreeNode(text: string, objGroup: ObjGroup, parent: ObjTreeNode): ObjTreeNode {
    let parentGroupId: number;

    if (parent) {
      const parentObjGroup: ObjGroup = parent.data;
      parentGroupId = parentObjGroup.groupID;
    }

    const treeNode = new ObjTreeNode(text, objGroup, parentGroupId);

    return treeNode;
  }

  nodeSelect(eventArgs: NodeSelectEventArgs) {
    if (this.selectActive) {
      return;
    }

    if (eventArgs.action === 'select') {
      this.selectActive = true;
      const groupId: number = Number(eventArgs.nodeData.id);
      const treeNode = this.getTreeNode(groupId);
      this.nodeSelect2(treeNode);
      setTimeout(() => {
        this.selectActive = false;
      },
        250);
    }
  }

  nodeSelect2(treeNode: ObjTreeNode) {

    /*
    if (!treeNode.expanded) {
      treeNode.expanded = true;
      this.expandActive = true;
      this.expandedNodes = [];
      this.expandedNodes.push(treeNode.groupIdString);
      this.expandParentNode(treeNode); // Alle Parent's von aktuellem treeNode aufklappen!
      setTimeout(() => {
        this.expandActive = false;
      },
        250);
    }
  */
    const objGroup: ObjGroup = (treeNode).data as ObjGroup;

    let mustGetObjFilterData = false;

    if (this.routingData.objTreeNodeGroupID !== objGroup.groupID) {
      mustGetObjFilterData = true;
    }

    this.routingData.objTreeNodeGroupID = objGroup.groupID;

    this.joinedObjGroupDescr = this.getJoinedObjGroupDescr(treeNode);

    if (mustGetObjFilterData) {
      this.getObjFilterData(objGroup);
    }
  }

  nodeSelect3(treeNode: ObjTreeNode) {

    if (!treeNode.expanded) {
      treeNode.expanded = true;
      this.expandActive = true;
      this.expandedNodes = [];
      this.expandedNodes.push(treeNode.groupIdString);
      this.expandParentNode(treeNode); // Alle Parent's von aktuellem treeNode aufklappen!
      setTimeout(() => {
        this.expandActive = false;
      },
        250);
    }

    const objGroup: ObjGroup = (treeNode).data as ObjGroup;

    this.routingData.objTreeNodeGroupID = objGroup.groupID;

    this.joinedObjGroupDescr = this.getJoinedObjGroupDescr(treeNode);

    this.getObjFilterData(objGroup);
  }

  nodeExpand(eventArgs: NodeExpandEventArgs) {
    if (this.expandActive) {
      return;
    }

    const groupId: number = Number(eventArgs.nodeData.id);
    const treeNode = this.getTreeNode(groupId);

    this.expandActive = true;
    treeNode.expanded = true;
    this.expandedNodes = [];
    this.expandedNodes.push(treeNode.groupIdString);
    this.expandParentNode(treeNode); // Alle Parent's von aktuellem treeNode aufklappen!
    setTimeout(() => {
      this.expandActive = false;
    },
      250);
  }

  expandParentNode(treeNode: ObjTreeNode): void {
    const parentTreeNode = this.getTreeNode(treeNode.parentGroupId);

    if (parentTreeNode) {
      parentTreeNode.expanded = true;
      this.expandedNodes.push(parentTreeNode.groupIdString);
      this.expandParentNode(parentTreeNode);
    }
  }

  getTreeNode(groupId?: number): ObjTreeNode {
    if (groupId && this.treeNodeGroupIdMap.has(groupId)) {
      return this.treeNodeGroupIdMap.get(groupId);
    }

    return undefined;
  }

  async getObjFilterData(objGroup: ObjGroup): Promise<void> {
    if (this.sessionService.session != null) {
      // Momentan keine Objekte von OK1 und OK2 lesen, da Performance-Problem mit Grid
      if (objGroup.level < OdbGroupLevel.SwitchPanel) {
        // if (objGroup.level < OdbGroupLevel.Plant) {
        this.objFilterData = [];
        this.setGridHeight();
        this.setListViewHeight();
        return;
      }

      this.objDataLoading = true;
      const rsp = await this.objectService.getObjFilterData(this.sessionService.session.sessionGUID, objGroup.groupID);

      if (rsp && rsp.objResult.result === Result.Ok) {
        const objFilterData = rsp.objPropDataList; // zuerst in neues Array füllen und sortieren, sonst hat syncfusion ein Scroll-Problem!
        this.onDescrSort(objFilterData);
        this.objFilterData = objFilterData;

        /*
                this.objFilterData.forEach( o => {
          console.log('---------- {0} --------- {1}'.format(o.objTag, o.description));
        } );
        */

        this.setGridHeight();
        this.setListViewHeight();

        this.refreshGrid();
        this.refreshListView();

        this.startTimer();
      }

      this.objDataLoading = false;

      if (this.isMobile) {
        setTimeout(() => {
          // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
          if (this.listView) {
            this.listView.refreshItemHeight();
          }
        }, 300);
      }
    }
  }

  onGetObjPropValues(objPropValueGetRsp: ObjPropValueGetRsp[]): void {
    let hasChanged = false;

    console.log('onGetObjPropValues');
    let objTag = '';
    let objPropValueGetRspList: ObjPropValueGetRsp[] = [];
    for (const opv of objPropValueGetRsp) {
      if (objTag === '') {
        objTag = opv.objPropRef.objTag;
      }

      if (objTag !== opv.objPropRef.objTag) {
        if (this.updateObjValues(objTag, objPropValueGetRspList)) {
          hasChanged = true;
        }
        objPropValueGetRspList = [];
        objTag = opv.objPropRef.objTag;
      }

      objPropValueGetRspList.push(opv);
    }
    if (this.updateObjValues(objTag, objPropValueGetRspList)) {
      hasChanged = true;
    }

    if (hasChanged) {
      //this.refreshGrid();
    }

    console.log('onGetObjPropValues done');
  }

  updateObjValues(objTag: string, objPropValueGetRspList: ObjPropValueGetRsp[]): boolean {
    let hasChanged = false;

    const index = this.objFilterData.findIndex((element) => {
      return (element.objTag === objTag);
    });

    if (index >= 0) {
      const objPropData = this.objFilterData[index];

      hasChanged = objPropData.updateObjPropValues(objPropValueGetRspList, false, this.textService);

      if (hasChanged) {
        // this.objFilterData[index] = objPropData; // bringt nix !!!

        // this.objFilterData = [...this.objFilterData];
      }
    }

    return hasChanged;
  }

  // Prepares a ObjPropRef list based on the result of the ObjFilterData
  prepareObjPropRef(): ObjPropRef[] {
    console.log('prepareObjPropRef');
    const objPropRefArray: ObjPropRef[] = [];
    for (const objPropData of this.objFilterData) {
      for (const opv of objPropData.objPropValueGetRspList) {
        const objPropRef = { objTag: objPropData.objTag, propertyID: opv.objPropRef.propertyID };
        objPropRefArray.push(objPropRef);
      }
    }
    console.log('prepareObjPropRef done');
    return objPropRefArray;
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
        id: 'ObjBox',
        text: 'Objekt-Eigenschaften...',
        iconCss: 'objectBox-icon',
      },
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

  contextMenuItemSelected(args: MenuEventArgs) {
    switch (args.item.id) {
      case 'ObjBox': {
        this.showObjectBox();
        break;
      }

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

  async ngAfterViewInit(): Promise<void> {
    console.log('ngAfterViewInit');
    this.getObjTree();

    if (!this.routingData.objTreeNodeGroupID) {
      setTimeout(() => {
        this.showTree();
      }, 250);
    }
  }

  showTree(): void {
    this.sideBar.show();
  }

  hideTree(): void {
    this.sideBar.hide();
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  getJoinedObjGroupDescr(treeNode: ObjTreeNode): string {
    let joinedDescr: string = (treeNode.data as ObjGroup).description;
    let curTreeNode: ObjTreeNode = treeNode;

    while (curTreeNode.parentGroupId) {
      const parentTreeNode = this.getTreeNode(curTreeNode.parentGroupId);

      const descr = (parentTreeNode.data as ObjGroup).description;

      joinedDescr = descr + '/' + joinedDescr;

      curTreeNode = parentTreeNode;
    }

    return joinedDescr;
  }

  /*
  customSort(event) {
    if ((event.field === undefined) || (event.field === null)) {
      return;
    }

    const sortField: string = event.field;
    const sortOrder: number = event.order;

    switch (sortField) {
      case 'displayValue': {
        this.onDisplayValueSort(event.data, sortOrder);
        break;
      }

      case 'prio': {
        this.onPrioSort(event.data, sortOrder);
        break;
      }

      case 'inAl': {
        this.onInAlSort(event.data, sortOrder);
        break;
      }

      case 'flt': {
        this.onFltSort(event.data, sortOrder);
        break;
      }

      case 'ovr': {
        this.onOvrSort(event.data, sortOrder);
        break;
      }

      case 'oos': {
        this.onOosSort(event.data, sortOrder);
        break;
      }

      case 'offL': {
        this.onOffLSort(event.data, sortOrder);
        break;
      }

      default: {
        this.onDefaultSort(event.data, sortOrder, sortField);
        break;
      }

    } // switch
  }

  onDefaultSort(array: ObjPropData[], order: number, sortField: string) {
    array.sort((entry1: ObjPropData, entry2: ObjPropData) => {
      let value1 = null;
      let value2 = null;
      let result = null;

      switch (sortField) {
        case 'description': {
          value1 = entry1.description;
          value2 = entry2.description;
          break;
        }

        case 'unit': {
          value1 = entry1.unit;
          value2 = entry2.unit;
          break;
        }

        case 'objName': {
          value1 = entry1.objName;
          value2 = entry2.objName;
          break;
        }

        case 'objTypeText': {
          value1 = entry1.objTypeText;
          value2 = entry2.objTypeText;
          break;
        }

        default: {
          break;
        }
      } // switch

      if (value1 == null && value2 != null) {
        result = -1;
      } else if (value1 != null && value2 == null) {
        result = 1;
      } else if (value1 == null && value2 == null) {
        result = 0;
      } else if (typeof value1 === 'string' && typeof value2 === 'string') {
        result = value1.localeCompare(value2);
      } else {
        result = (value1 < value2) ? -1 : (value1 > value2) ? 1 : 0;
      }

      if (result === 0) {
        // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
        // Sonst können die Zeilen beim nächsten Compare im Grid springen!
        result = entry1.objTag.localeCompare(entry2.objTag);
      }

      return (order * result);
    });
  }
*/

  onDescrSort(array: ObjPropData[]) {
    array.sort((entry1: ObjPropData, entry2: ObjPropData) => {
      const descr1 = entry1.description;
      const descr2 = entry2.description;

      let ret = descr1.localeCompare(descr2);

      if (ret === 0) {
        // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
        // Sonst können die Zeilen beim nächsten Compare im Grid springen!
        ret = entry1.objTag.localeCompare(entry2.objTag);

      }

      return ret;
    });
  }

  gridSortComparerDisplayValue = (entry1: any, entry2: any, obj1: ObjPropData, obj2: ObjPropData) => {
    if (OdbObject.isAnalogObjType(entry1.objType) && !OdbObject.isAnalogObjType(entry2.objType)) {
      return -1;
    }
    if (!OdbObject.isAnalogObjType(entry1.objType) && OdbObject.isAnalogObjType(entry2.objType)) {
      return 1;
    }
    if (!OdbObject.isAnalogObjType(entry1.objType) && !OdbObject.isAnalogObjType(entry2.objType)) {
      if (entry1.displayValue.toUpperCase() < entry2.displayValue.toUpperCase()) {
        return -1;
      }
      if (entry1.displayValue.toUpperCase() > entry2.displayValue.toUpperCase()) {
        return 1;
      }
      // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
      // Sonst können die Zeilen beim nächsten Compare im Grid springen!
      return entry1.objTag.localeCompare(entry2.objTag);
    }
    if ((entry1.defaultValue != null) && (entry2.defaultValue == null)) {
      return -1;
    }
    if ((entry1.defaultValue == null) && (entry2.defaultValue != null)) {
      return 1;
    }
    if ((entry1.defaultValue == null) && (entry2.defaultValue == null)) {
      // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
      // Sonst können die Zeilen beim nächsten Compare im Grid springen!
      return entry1.objTag.localeCompare(entry2.objTag);
    }
    if ((entry1.defaultValue as Number) < (entry2.defaultValue as Number)) {
      return -1;
    }
    if ((entry1.defaultValue as Number) > (entry2.defaultValue as Number)) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  /*
  gridSortComparerDescription = (reference: string, comparer: string) => {
    return reference.localeCompare(comparer, options: ignoreCase);
  };
*/

  gridSortComparerTendency = (entry1: any, entry2: any) => {
    if (entry1.tendency < entry2.tendency) {
      return -1;
    }
    if (entry1.tendency > entry2.tendency) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerPrio = (entry1: any, entry2: any) => {
    if (entry1.feedbackPrioManual < entry2.feedbackPrioManual) {
      return -1;
    }
    if (entry1.feedbackPrioManual > entry2.feedbackPrioManual) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerInAl = (entry1: any, entry2: any) => {
    if (entry1.inAlText < entry2.inAlText) {
      return -1;
    }
    if (entry1.inAlText > entry2.inAlText) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerFlt = (entry1: any, entry2: any) => {
    if (entry1.fltText < entry2.fltText) {
      return -1;
    }
    if (entry1.fltText > entry2.fltText) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerOvr = (entry1: any, entry2: any) => {
    if (entry1.ovrText < entry2.ovrText) {
      return -1;
    }
    if (entry1.ovrText > entry2.ovrText) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerOos = (entry1: any, entry2: any) => {
    if (entry1.oosText < entry2.oosText) {
      return -1;
    }
    if (entry1.oosText > entry2.oosText) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  gridSortComparerOffl = (entry1: any, entry2: any) => {
    if (entry1.offlText < entry2.offlText) {
      return -1;
    }
    if (entry1.offlText > entry2.offlText) {
      return 1;
    }
    // Wenn beide gleich, dann nach ObjTag vergleichen, damit eindeutig!
    // Sonst können die Zeilen beim nächsten Compare im Grid springen!
    return entry1.objTag.localeCompare(entry2.objTag);
  };

  onRowSelecting(args: RowSelectingEventArgs) {
    if (args.data) {
      this.curSelectedObjPropData = args.data as ObjPropData;
    }
    this.updateContextMenuItems();
    // this.contextmenu.hide();
  }

  showOdbInfo() {
    this.displayOdbInfo = true;
  }

  onOdbInfoDialogDisplayChange(event: any) {
    this.displayOdbInfo = event;
  }

  showObjectBox() {
    this.routingData.objTag = this.curSelectedObjPropData.objTag;

    // this.router.navigate(['object-box'], { queryParams: { objTag: this.curSelectedObjPropData.objTag } });
    this.router.navigate(['object-box', this.curSelectedObjPropData.objTag]);
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
    let enableObjectBox = false;

    if (this.curSelectedObjPropData) {
      if (this.curSelectedObjPropData.hasStatusFlags && this.curSelectedObjPropData.rights.acknowledgeAccess) {
        if (this.curSelectedObjPropData.hasAckedTransitions) {
          if ((this.curSelectedObjPropData.ackedTransitions & BACnetEventTransitions.ToOffNormal) === 0) {
            enableAckToOffNormal = true;
            enableAckAll = true;
          }

          if ((this.curSelectedObjPropData.ackedTransitions & BACnetEventTransitions.ToFault) === 0) {
            enableAckToFault = true;
            enableAckAll = true;
          }

          if ((this.curSelectedObjPropData.ackedTransitions & BACnetEventTransitions.ToNormal) === 0) {
            enableAckToNormal = true;
            enableAckAll = true;
          }
        }
      }

      enableOdbInfo = true;

      enableObjectBox = true;
      /*
            if (this.curSelectedObjPropData.isCommandable) {
              enableObjectBox = true;
            }
      */
    }

    let items: string[] = ['ObjBox', 'Ack', 'OdbInfo'];
    this.contextmenu.enableItems(items, true, true);
    if (this.grid) {
      this.grid.contextMenuModule.contextMenu.enableItems(items, true, true);
    }

    items = [];
    if (!enableObjectBox) {
      items.push('ObjBox');
    }
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
    let transitions = BACnetEventTransitions.None;

    if ((this.curSelectedObjPropData.ackedTransitions & BACnetEventTransitions.ToOffNormal) === 0) {
      transitions |= BACnetEventTransitions.ToOffNormal;
    }

    if ((this.curSelectedObjPropData.ackedTransitions & BACnetEventTransitions.ToFault) === 0) {
      transitions |= BACnetEventTransitions.ToFault;
    }

    if ((this.curSelectedObjPropData.ackedTransitions & BACnetEventTransitions.ToNormal) === 0) {
      transitions |= BACnetEventTransitions.ToNormal;
    }

    this.ack(transitions, true);
  }

  async ack(transitions: BACnetEventTransitions, forceOnFailure: boolean) {
    this.ackEventsReq = null;
    let displayNoticeEdit = false;

    if (this.licenseService.license && this.licenseService.license.noticesLicensed) {
      if ((((transitions & BACnetEventTransitions.ToOffNormal) === BACnetEventTransitions.ToOffNormal) &&
        ((this.curSelectedObjPropData.noticesFlags & NoticeFlags.EnforceOnAckToOffNormal) === NoticeFlags.EnforceOnAckToOffNormal)) ||
        (((transitions & BACnetEventTransitions.ToFault) === BACnetEventTransitions.ToFault) &&
          ((this.curSelectedObjPropData.noticesFlags & NoticeFlags.EnforceOnAckToFault) === NoticeFlags.EnforceOnAckToFault)) ||
        (((transitions & BACnetEventTransitions.ToNormal) === BACnetEventTransitions.ToNormal) &&
          ((this.curSelectedObjPropData.noticesFlags & NoticeFlags.EnforceOnAckToNormal) === NoticeFlags.EnforceOnAckToNormal))) {
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
      [this.curSelectedObjPropData.objTag]);

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

  /*
    showContextMenu(event) {
      this.updateContextMenuItems();
      //this.contextmenu.toggle(event);
    }
  */

  openContextMenu(event: any) {
    this.updateContextMenuItems();
    this.contextmenu.open(event.pageY, event.pageX);
  }

  refreshGrid() {
    if (!this.isMobile) {
      if (this.grid) {
        this.grid.refresh();
      }
      // this.objFilterData = [...this.objFilterData];
    }
  }

  refreshListView() {
    return;
    if (this.isMobile) {
      setTimeout(() => {
        this.listView.refresh();
      }, 500);
    }
  }

  showTooltip(args: QueryCellInfoEventArgs) {
    let content = '';
    const entry = args.data[args.column.field] as any;

    switch (args.column.field) {
      case 'prioCompareEntry': {
        content = entry.prioText;
        break;
      }

      case 'inAlCompareEntry': {
        content = entry.inAlText;
        break;
      }

      case 'fltCompareEntry': {
        content = entry.fltText;
        break;
      }

      case 'ovrCompareEntry': {
        content = entry.ovrText;
        break;
      }

      case 'oosCompareEntry': {
        content = entry.oosText;
        break;
      }

      case 'offlCompareEntry': {
        content = entry.offlText;
        break;
      }

      case 'tendencyCompareEntry': {
        content = entry.tendencyText;
        break;
      }

      default: {
        break;
      }
    }

    if (content !== '') {
      args.cell.classList.add('e-customtooltip');
      args.cell.setAttribute('title', content);
    }
  }

  gridDatabound(args: any) {
    // "no records to display"-Text ausblenden!
    const contentTable = this.grid.getContentTable() as HTMLElement;
    const elems = contentTable.getElementsByClassName('e-emptyrow');

    if (elems && elems.length === 1) {
      elems[0].textContent = '';
    }
  }

  listViewActionBegin() {
    console.log('listViewActionBegin {0}'.format(Global.formatDateTime(new Date(), true)));
  }

  listViewActionComplete() {
    console.log('listViewActionComplete {0}'.format(Global.formatDateTime(new Date(), true)));

    setTimeout(() => {
      // Damit die Item-Höhe passt und es beim scrollen nicht springt!!!
      this.listView.refreshItemHeight();

      if (this.routingData.objTag) {
        const index = this.objFilterData.findIndex((element) => {
          return (element.objTag === this.routingData.objTag);
        });

        if (index >= 0) {
          // console.log('!!!!!!!!!!!!!! {0}'.format(this.routingData.objTag));
          this.listView.selectItem({ objTag: this.routingData.objTag }); // geht aufgrund listViewFields-Property

          const item = this.listView.getSelectedItems() as any;

          if (item) {
            // console.log('!!!!!!!!!!!!!! item');
            const listViewItemIndex = item.index;

            // Scrolling to the item by its index position
            this.scrollListViewToElement(listViewItemIndex);
          }
        }
      }
    }, 100);
  }

  scrollListViewToElement(index: number) {
    const isWindow = !this.listView.height ? true : false;
    let startingHeight: number;

    if (isWindow) {
      const documentHeight = document.documentElement.getBoundingClientRect().top;
      startingHeight =
        this.listView.element.querySelector('ul').getBoundingClientRect().top - documentHeight;
    } else {
      startingHeight = this.listView.element.querySelector('.e-list-header') ?
        this.listView.element.querySelector('.e-list-header').getBoundingClientRect().height : 0;
    }

    const itemHeight = this.listView.element.querySelector('li').getBoundingClientRect().height;
    const positionToScroll = (itemHeight * index) + startingHeight;

    isWindow ? window.scrollTo(0, positionToScroll) : this.listView.element.scrollTop = positionToScroll;
  }

  gridActionBegin(event: any) {
  }

  gridActionComplete(event: any) {
    console.log('gridActionComplete {0}'.format(Global.formatDateTime(new Date(), true)));

    switch (event.requestType) {
      case 'refresh': {
        setTimeout(() => {
          if (this.routingData.objTag) {
            const index = this.objFilterData.findIndex((element) => {
              return (element.objTag === this.routingData.objTag);
            });

            if (index >= 0) {
              console.log('!!!!!!!!!!!!!! {0}'.format(this.routingData.objTag));
              const a: Element[] = this.grid.getRows(); // nur die 50 von PageSettings in Virtualmode vorhanden!!!
              // this.grid.selectedRowIndex = index;
              // this.grid.selectionModule.selectRow(index);

              // let rowHeight: number = this.grid.getRows()[this.grid.getSelectedRowIndexes()[0]].scrollHeight;
              // this.grid.getContent().children[0].scrollTop = rowHeight * this.grid.getSelectedRowIndexes()[0];
            }
          }
        }, 100);
        break;
      }
      default: {
        break;
      }
    } // switch

  }

  public onTreeViewCreated(obj: any) {
    // Hiezu gehören die css-Einstellungen in ca-styles.css unter "automatischer Textumbruch in TreeView bei langen Texten !!! "

    // To hover/select the node with larger text
    ['mouseover', 'keydown', 'touchstart'].forEach(evt =>
      document.getElementById('objTreeView').addEventListener(evt, (event) => { setHeight(event.target); }));
    // To set the height for the node with larger text
    function setHeight(element: any) {
      if (element.classList.contains('e-treeview')) {
        element = element.querySelector('.e-node-focus').querySelector('.e-fullrow');
      } else if (element.classList.contains('e-list-parent')) {
        element = element.querySelector('.e-fullrow');
      } else if (element.classList.value !== ('e-fullrow') && element.closest('.e-list-item')) {
        element = element.closest('.e-list-item').querySelector('.e-fullrow');
      }
      if (element.nextElementSibling) {
        element.style.height = element.nextElementSibling.offsetHeight + 'px';
      }
    }
  }

}
