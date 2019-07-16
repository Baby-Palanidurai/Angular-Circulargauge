import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-nav',
  templateUrl: './main-nav.component.html',
  styleUrls: ['./main-nav.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class MainNavComponent implements OnInit, OnDestroy {

  private lastYPosition = 0;
  @Output() showAboutDialog = new EventEmitter();
  @Output() showLoginDialog = new EventEmitter();
  @Output() showNotificationSettingsDialog = new EventEmitter();

  constructor(private router: Router) {
  }

  ngOnInit() {
    window.addEventListener('scroll', this.scroll, true);
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scroll, true);
  }

  scroll = (): void => {
    const mainNav = document.getElementById('mainNav');
    const yPos = this.currentYPosition();

    if (yPos > this.lastYPosition) {
      this.closeResponsiveMenu();
    }

    if ((yPos > 50) && (yPos > this.lastYPosition)) {
      if (!mainNav.className.includes(' up')) {
        mainNav.className += ' up';
      }
    } else {
      mainNav.className = mainNav.className.replace(' up', '')
    }

    this.lastYPosition = yPos;

    if (this.currentYPosition() <= 0) {
      mainNav.className = mainNav.className.replace(' up', '')
    }
  };

  currentYPosition(): number {
    // Firefox, Chrome, Opera, Safari
    if (self.pageYOffset) {
      return self.pageYOffset;
    }
    // Internet Explorer 6 - standards mode
    if (document.documentElement && document.documentElement.scrollTop) {
      return document.documentElement.scrollTop;
    }
    // Internet Explorer 6, 7 and 8
    if (document.body.scrollTop) {
      return document.body.scrollTop;
    }
    return 0;
  }

  menuToggleClick() {
    const mainNav = document.getElementById('mainNav');
    if (mainNav.className.includes(' responsive')) {
      mainNav.className = mainNav.className.replace(' responsive', '')
    } else {
      mainNav.className += ' responsive';
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className === 'hamburger') {
      hamburger.className += ' open';
    } else {
      hamburger.className = 'hamburger';
    }
  }

  closeResponsiveMenu() {
    const mainNav = document.getElementById('mainNav');
    if (mainNav.className.includes(' responsive')) {
      mainNav.className = mainNav.className.replace(' responsive', '')
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className.includes(' open')) {
      hamburger.className = hamburger.className.replace(' open', '')
    }
  }

  aboutDialogClick(): void {
    this.showAboutDialog.emit(null);
  }

  loginDialogClick(): void {
    this.showLoginDialog.emit(null);
  }

  showObjectViewer() {
    this.router.navigate(['ov']);
  }

  showEventViewer() {
    this.router.navigate(['ev']);
  }

  notificationSettingsDialogClick() {
    this.showNotificationSettingsDialog.emit(null);
  }
}
