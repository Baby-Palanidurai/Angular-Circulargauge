import { Injectable, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { SimpleTimer } from 'ng2-simple-timer';

@Injectable()
export class TimerService implements OnInit, OnDestroy {
  public onTimer5s: EventEmitter<void> = new EventEmitter<void>();

  private timer5sId: string;

  constructor(private timer5s: SimpleTimer) {
    this.timer5s.newTimer('Timer5s', 5);

    this.timer5sId = this.timer5s.subscribe('Timer5s', () => this.onTimer5s.emit());
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    if (this.timer5sId) {
      this.timer5s.unsubscribe(this.timer5sId);
    }
  }
}
