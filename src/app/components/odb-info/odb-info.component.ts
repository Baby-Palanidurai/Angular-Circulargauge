import { Component, OnInit, EventEmitter, Input, Output, OnDestroy, ViewChild, ViewEncapsulation } from '@angular/core';
import { GetOdbInfoDataResponse } from 'app/shared/objects/object';
import { ObjectService } from 'app/shared/objects/object.service';
import { Result } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { DialogComponent } from '@syncfusion/ej2-angular-popups';

@Component({
  selector: 'app-odb-info',
  templateUrl: './odb-info.component.html',
  styleUrls: ['./odb-info.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class OdbInfoComponent implements OnInit, OnDestroy {
  @ViewChild('odbInfoDialog', { static: false }) dialog: DialogComponent;
  @Input() display: boolean;
  @Input() objTag: string;
  @Output() displayChange = new EventEmitter();
  curOdbInfoData: GetOdbInfoDataResponse = null;
  headerText: Object = [
    { 'text': 'Allgemein' },
    { 'text': 'Objekt' },
    { 'text': 'Anbindung' },
    { 'text': 'Info Benutzeradresse' }];
  animationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };

  constructor(private global: Global, private objectService: ObjectService) {
    this.curOdbInfoData = null;
  }

  ngOnInit() {
  }

  async onBeforeOpen(event) {
    this.curOdbInfoData = null;
    const rsp = await this.objectService.getOdbInfoData(this.objTag);
    if (rsp && rsp.result === Result.Ok) {
      this.curOdbInfoData = rsp;
      if ((this.curOdbInfoData.odbInfoDataBindingList != null) && (this.curOdbInfoData.odbInfoDataBindingList.length > 0)) {
        this.headerText[2].text = 'Anbindung ' + this.curOdbInfoData.odbBindingText;
      }
      this.displayChange.emit(true);
    }
  }

  onClose(event) {
    this.display = false;
    this.displayChange.emit(false);
  }

  // Work against memory leak if component is destroyed
  ngOnDestroy() {
    this.displayChange.unsubscribe();
  }

}
