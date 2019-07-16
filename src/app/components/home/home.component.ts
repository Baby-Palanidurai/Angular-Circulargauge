import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { Session, ChangePasswordResponse } from 'app/shared/sessions/session';
import { SessionService } from 'app/shared/sessions/session.service';
import { Result, PasswordResult } from 'app/shared/global/enum';
import { Global } from 'app/shared/global/global';
import { DialogUtility, ButtonArgs } from '@syncfusion/ej2-popups';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('toFocusLogin', { static: false }) toFocusLogin: ElementRef;
  @ViewChild('toFocusPwChange', { static: false }) toFocusPwChange: ElementRef;

  displayAboutDialog = false;
  displayNotificationSettingsDialog = false;
  displayLoginDialog = false;
  displayChangePwDialog = false;
  username = '';
  password = '';
  oldPassword = '';
  newPassword = '';
  newPasswordCopy = '';
  dialogAnimationSettings: Object = { effect: 'Zoom', duration: 400, delay: 0 };
  alertDialogButtonArgs: ButtonArgs = { text: 'OK', icon: 'fa fa-check', cssClass: 'e-success e-round-corner' };

  eventViewerNotifications = false;

  constructor(private global: Global, private sessionService: SessionService) {
    this.sessionService.onSessionCreated.subscribe(session => this.onSessionCreated(session));
    this.global.onShowLoginDialog.subscribe(() => this.onShowLoginDialog());
  }

  ngOnInit() {
    let eventViewerNotifications = false;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
        serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription) {
          if (subscription) {
            eventViewerNotifications = true;
          }
        })
      }).catch(function (error) {
        console.log('Fehler', error);
      });
    }

    this.eventViewerNotifications = eventViewerNotifications;
  }

  ngOnDestroy() {
  }

  private async onSessionCreated(session: Session): Promise<void> {
    if (session.result !== Result.Ok) {
      return;
    }
  }

  aboutDialogClick() {
    this.displayAboutDialog = true;
  }

  aboutDialogOkClick() {
    this.displayAboutDialog = false;
  }

  notificationSettingsDialogClick() {
    this.displayNotificationSettingsDialog = true;
  }

  notificationSettingsDialogOkClick() {
    this.displayNotificationSettingsDialog = false;

    if ('serviceWorker' in navigator) {
      if (this.eventViewerNotifications) {
        // subscribe
        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
          serviceWorkerRegistration.pushManager.subscribe({
            userVisibleOnly: true
          }).then(function (sub) {
            console.log('Url:', sub.endpoint);
          });
        }).catch(function (error) {
          console.log('Fehler', error);
        });
      } else {
        // unsubscribe
        navigator.serviceWorker.ready.then(function (serviceWorkerRegistration) {
          serviceWorkerRegistration.pushManager.getSubscription().then(function (subscription) {
            subscription.unsubscribe();
          });
        }).catch(function (error) {
          console.log('Fehler', error);
        });
      }
    }
  }

  loginDialogClick() {
    this.onShowLoginDialog();
  }

  loginClick() {
    this.displayLoginDialog = false;
    this.sessionService.loginSession(true, this.username, this.password);
  }

  logoutClick() {
    this.displayLoginDialog = false;
    this.sessionService.loginSession(false, this.username, this.password);
  }

  private onShowLoginDialog() {
    this.username = '';
    this.password = '';
    this.displayLoginDialog = true;
  }

  onLoginDialogShow(event) {
    if (this.toFocusLogin) {
      setTimeout(() => {
        this.toFocusLogin.nativeElement.focus();
      },
        100);
    }
  }

  changePwDialogClick() {
    this.displayChangePwDialog = true;
  }

  async changePwClick() {
    if (this.newPassword !== this.newPasswordCopy) {
      DialogUtility.alert({
        title: 'Fehler',
        content: 'Die Passwortwiederholung ist nicht korrekt!',
        okButton: this.alertDialogButtonArgs,
        position: { X: 'center', Y: 'center' },
      });
      return;
    }

    const changePasswordResponse = await this.sessionService.changePassword(this.username, this.oldPassword, this.newPassword);

    if (changePasswordResponse.result !== PasswordResult.Ok) {
      DialogUtility.alert({
        title: 'Fehler',
        content: PasswordResult[changePasswordResponse.result].toString(),
        okButton: this.alertDialogButtonArgs,
        position: { X: 'center', Y: 'center' },
      });
      return;
    }

    this.displayChangePwDialog = false;
  }

  cancelChangePwClick() {
    this.displayChangePwDialog = false;
  }

  onChangePwDialogShow(event) {
    this.username = '';
    this.oldPassword = '';
    this.newPassword = '';
    this.newPasswordCopy = '';

    if (this.toFocusPwChange) {
      setTimeout(() => {
        this.toFocusPwChange.nativeElement.focus();
      },
        100);
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

}
