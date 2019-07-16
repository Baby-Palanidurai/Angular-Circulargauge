import { Component, ViewEncapsulation, OnInit, AfterViewInit, Input } from '@angular/core';
import { ObjPropData } from 'app/shared/objects/object';
import { ObjTreeNode } from 'app/shared/treenode/treenode';
import { Result, ObjGroupSelector, OdbGroupLevel } from 'app/shared/global/enum';
import { ObjectService } from 'app/shared/objects/object.service';
import { NodeAnimationSettingsModel, NodeExpandEventArgs, NodeSelectEventArgs } from '@syncfusion/ej2-angular-navigations';

@Component({
  selector: 'app-obj-single-tree',
  templateUrl: './obj-single-tree.component.html',
  styleUrls: ['./obj-single-tree.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ObjSingleTreeComponent implements OnInit, AfterViewInit {
  @Input() objPropData: ObjPropData;

  treeNodes: ObjTreeNode[] = [];
  treeNodeFields: Object = {
    dataSource: this.treeNodes, id: 'groupIdString', text: 'label', iconCss: 'icon', child: 'children',
    parentID: 'parentGroupId', selected: 'selectedString', expanded: 'expandedString'
  };

  treeAnimation: NodeAnimationSettingsModel;

  constructor(private objectService: ObjectService) {
    this.treeAnimation = {
      expand: { effect: 'SlideDown', duration: 0, easing: 'linear' },
      collapse: { effect: 'SlideUp', duration: 0, easing: 'linear' }
    }
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.getObjTree();
  }


  async getObjTree(): Promise<void> {
    this.treeNodes = [];

    const rsp = await this.objectService.getObjTree(ObjGroupSelector.IdPath, this.objPropData.objParentGroupID, undefined);

    if (rsp && rsp.result === Result.Ok) {
      let parentGroupId: number;
      let parentTreeNode: ObjTreeNode = null;

      for (const objGroup of rsp.objGroupList) {
        if (objGroup.level === OdbGroupLevel.Project) {
          continue;
        }

        let descr: string = objGroup.description;
        if (!descr) {
          descr = '[' + objGroup.groupIDStr + ']';
        }

        const treeNode = new ObjTreeNode(descr, objGroup, parentGroupId);
        treeNode.expanded = true;

        if (parentTreeNode === null) {

          this.treeNodes.push(treeNode);
        } else {
          parentTreeNode.children.push(treeNode);
        }

        parentGroupId = objGroup.groupID;
        parentTreeNode = treeNode;
      }

      // TreeNodeFields müssen hier nochmal bestückt werden, damit sich Tree aufbaut!!!
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
    }
  }

  nodeCollapsing(eventArgs: NodeExpandEventArgs) {
    eventArgs.cancel = true;
  }

  nodeSelecting(eventArgs: NodeSelectEventArgs) {
    eventArgs.cancel = true;
  }

}
