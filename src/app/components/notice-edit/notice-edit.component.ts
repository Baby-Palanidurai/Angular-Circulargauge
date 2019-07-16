import { Component, OnInit, EventEmitter, Input, Output, OnDestroy, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { Notice, NoticePriorityItem } from './../../shared/notices/notice';
import { NoticePriority } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { DialogUtility, ButtonArgs } from '@syncfusion/ej2-popups';

@Component({
  selector: 'app-notice-edit',
  templateUrl: './notice-edit.component.html',
  styleUrls: ['./notice-edit.component.scss'],
  encapsulation: ViewEncapsulation.None, // damit deep-css aus ca-styles.css in syncfusion-componenten geht!
})

export class NoticeEditComponent implements OnInit, OnDestroy {
  @Input() display: boolean;
  @Input() noticeSubject: string;
  @Output() onOk = new EventEmitter<Notice>();
  @Output() onCancel = new EventEmitter();
  @Output() displayChange = new EventEmitter();
  @ViewChild('toFocus', { static: false }) toFocus: ElementRef;

  priorities: NoticePriorityItem[] = [];
  noticeText: string;
  priorityFields: Object = { value: 'priority', text: 'text' };
  selectedPriority: NoticePriority;

  dialogAnimationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };
  alertDialogButtonArgs: ButtonArgs = { text: 'OK', icon: 'fa fa-check', cssClass: 'e-success e-round-corner' };

  constructor(private global: Global) {
    this.priorities.push( new NoticePriorityItem(NoticePriority.Low, 'Niedrig') );
    this.priorities.push( new NoticePriorityItem(NoticePriority.Normal, 'Normal') );
    this.priorities.push( new NoticePriorityItem(NoticePriority.High, 'Hoch') );
    // Priority-array nochmal umkopieren, damit die syncfusion-Combobox den selektierten Eintrag als Text anzeigt!
    this.priorities = [...this.priorities];
    this.selectedPriority = NoticePriority.Normal;
    this.noticeText = '';
  }

  ngOnInit() {
  }

  async onOpen(event) {
    this.noticeText = '';
    if (this.toFocus) {
      this.toFocus.nativeElement.focus();
    }
    this.displayChange.emit(true);
  }

  onClose(event) {
    this.displayChange.emit(false);
  }

  // Work against memory leak if component is destroyed
  ngOnDestroy() {
    this.displayChange.unsubscribe();
    this.onOk.unsubscribe();
    this.onCancel.unsubscribe();
  }

  okClick() {
    if (!this.noticeSubject) {
      DialogUtility.alert({
        title: 'Fehler',
        content: 'Bitte geben Sie einen Betreff ein!',
        okButton: this.alertDialogButtonArgs,
        position: { X: 'center', Y: 'center' },
      });
      return;
    }

    if (!this.selectedPriority) {
      DialogUtility.alert({
        title: 'Fehler',
        content: 'Bitte wählen Sie eine Priorität aus!',
        okButton: this.alertDialogButtonArgs,
        position: { X: 'center', Y: 'center' },
      });
      return;
    }

    if (!this.noticeText) {
      DialogUtility.alert({
        title: 'Fehler',
        content: 'Bitte geben Sie einen Text ein!',
        okButton: this.alertDialogButtonArgs,
        position: { X: 'center', Y: 'center' },
      });
      return;
    }

    this.display = false;
    const notice = new Notice(this.noticeSubject, this.selectedPriority, this.noticeText);
    this.onOk.emit(notice);
  }
  cancelClick() {
    this.display = false;
    this.onCancel.emit();
  }

  // Syncfusion: FocusIn Event function for input component
  public focusInLeft(target: HTMLElement): void {
    target.parentElement.parentElement.classList.add('e-input-focus');
  }

  // Syncfusion: FocusOut Event function for input component
  public focusOutLeft(target: HTMLElement): void {
    target.parentElement.parentElement.classList.remove('e-input-focus');
  }

  onBeforeOpen(event) {
    this.selectedPriority = NoticePriority.Normal;
    this.noticeText = '';
  }
}
