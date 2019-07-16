import { ObjGroup } from 'app/shared/objects/object';

export class ObjTreeNode {
  label: string;
  icon: string;
  groupIdString: string;
  data: ObjGroup;
  parentGroupId?: number;
  children: ObjTreeNode[];
  expandedString = 'false'; // muss string sein, damit es zum JSON-Objekt von Syncfusion passt!
  selectedString = 'false'; // muss string sein, damit es zum JSON-Objekt von Syncfusion passt!

  constructor(label: string, objGroup: ObjGroup, parentGroupId?: number) {
    this.label = label;
    this.icon = ObjGroup.getIcon(objGroup.level);
    this.groupId = objGroup.groupID;
    this.data = objGroup;
    this.parentGroupId = parentGroupId;
    this.children = [];
  }

  get groupId(): number {
    return Number(this.groupIdString);
  }

  set groupId(value: number) {
    this.groupIdString = value.toString();
  }

  get expanded(): boolean {
    if (this.expandedString === 'true') {
      return true;
    }

    return false;
  }

  set expanded(value: boolean) {
    if (value) {
      this.expandedString = 'true';
    } else {
      this.expandedString = 'false';
    }
  }

  get selected(): boolean {
    if (this.selectedString === 'true') {
      return true;
    }

    return false;
  }

  set selected(value: boolean) {
    if (value) {
      this.selectedString = 'true';
    } else {
      this.selectedString = 'false';
    }
  }
}

