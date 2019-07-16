import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { OvComponent } from './../../components/ov/ov.component';
import { EventEmitter } from '@angular/core';
import { Global } from 'app/shared/global/global';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ov-nav',
  templateUrl: './ov-nav.component.html',
  styleUrls: ['./ov-nav.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class OvNavComponent implements OnInit, OnDestroy {

  private lastYPosition = 0;
  public isMobile = false;

  constructor(private router: Router, private global: Global, private ovComponent: OvComponent) {
    this.isMobile = global.isMobile;
    this.global.onIsMobileChanged.subscribe(isMobile => this.onIsMobileChanged(isMobile));
  }

  private onIsMobileChanged(isMobile: boolean): void {
    this.isMobile = isMobile;
  }

  ngOnInit() {
    window.addEventListener('scroll', this.scroll, true);
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.scroll, true);
  }

  scroll = (): void => {
    const ovNav = document.getElementById('ovNav');
    const yPos = this.currentYPosition();

    if (yPos > this.lastYPosition) {
      this.closeResponsiveMenu();
    }

    if ((yPos > 50) && (yPos > this.lastYPosition)) {
      if (!ovNav.className.includes(' up')) {
        ovNav.className += ' up';
      }
    } else {
      ovNav.className = ovNav.className.replace(' up', '')
    }

    this.lastYPosition = yPos;

    if (this.currentYPosition() <= 0) {
      ovNav.className = ovNav.className.replace(' up', '')
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

  showTreeClick() {
    this.ovComponent.showTree();
  }

/*
  showContextMenuClick(event) {
    this.ovComponent.showContextMenu(event);
  }
*/

  menuToggleClick() {
    const ovNav = document.getElementById('ovNav');
    if (ovNav.className.includes(' responsive')) {
      ovNav.className = ovNav.className.replace(' responsive', '')
    } else {
      ovNav.className += ' responsive';
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className === 'hamburger') {
      hamburger.className += ' open';
    } else {
      hamburger.className = 'hamburger';
    }
  }

  closeResponsiveMenu() {
    const ovNav = document.getElementById('ovNav');
    if (ovNav.className.includes(' responsive')) {
      ovNav.className = ovNav.className.replace(' responsive', '')
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className.includes(' open')) {
      hamburger.className = hamburger.className.replace(' open', '')
    }
  }

  showEventViewer() {
    this.router.navigate(['ev']);
  }

  showHome() {
    this.router.navigate(['']);
  }

}
