import { Component, OnInit, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { Session, LoginData, GetSysDataResponse } from './../../shared/sessions/session';
import { SessionService } from './../../shared/sessions/session.service';
import { LoginResult } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { Router } from '@angular/router';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FooterComponent implements OnInit, AfterViewInit {
  isMobile = false;

  personname = '-';
  eventCountText = '-';

  constructor(private global: Global, private sessionService: SessionService, private router: Router) {
    this.sessionService.onLogin.subscribe(loginData => this.onLogin(loginData));
    this.sessionService.onGetSysData.subscribe(getSysDataResponse => this.onGetSysData(getSysDataResponse));
    this.isMobile = global.isMobile;
    this.global.onIsMobileChanged.subscribe(isMobile => this.onIsMobileChanged(isMobile));
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

  private onIsMobileChanged(isMobile): void {
    this.isMobile = isMobile;
  }

  private onLogin(loginData: LoginData) {
    if (loginData.result === LoginResult.Ok) {
      this.personname = loginData.personName;
      this.eventCountText = '-';
    }
  }

  private async onGetSysData(getSysDataResponse: GetSysDataResponse): Promise<void> {
    this.eventCountText = getSysDataResponse.eventCount.toString();
  }

  showEventViewer(): void {
    this.router.navigate(['ev']);
  }

  showLoginDialog(): void {
    this.router.navigate(['home']).then(() => {
      setTimeout(() => {
        this.global.onShowLoginDialog.emit(null)
      },
        250);
    });
  }
}
