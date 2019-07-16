import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { EventEmitter } from '@angular/core';
import { EvComponent } from 'app/components/ev/ev.component';
import { Global } from 'app/shared/global/global';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ev-nav',
  templateUrl: './ev-nav.component.html',
  styleUrls: ['./ev-nav.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class EvNavComponent implements OnInit, OnDestroy {

  private lastYPosition = 0;
  public isMobile = false;

  constructor(private router: Router, private global: Global, private evComponent: EvComponent) {
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
    const evNav = document.getElementById('evNav');
    const yPos = this.currentYPosition();

    if (yPos > this.lastYPosition) {
      this.closeResponsiveMenu();
    }

    if ((yPos > 50) && (yPos > this.lastYPosition)) {
      if (!evNav.className.includes(' up')) {
        evNav.className += ' up';
      }
    } else {
      evNav.className = evNav.className.replace(' up', '')
    }

    this.lastYPosition = yPos;

    if (this.currentYPosition() <= 0) {
      evNav.className = evNav.className.replace(' up', '')
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

/*
  showContextMenuClick(event) {
    this.evComponent.showContextMenu(event);
  }
*/

  menuToggleClick() {
    const evNav = document.getElementById('evNav');
    if (evNav.className.includes(' responsive')) {
      evNav.className = evNav.className.replace(' responsive', '')
    } else {
      evNav.className += ' responsive';
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className === 'hamburger') {
      hamburger.className += ' open';
    } else {
      hamburger.className = 'hamburger';
    }
  }

  closeResponsiveMenu() {
    const evNav = document.getElementById('evNav');
    if (evNav.className.includes(' responsive')) {
      evNav.className = evNav.className.replace(' responsive', '')
    }

    const hamburger = document.getElementById('myHamburger');
    if ((hamburger != null) && hamburger.className.includes(' open')) {
      hamburger.className = hamburger.className.replace(' open', '')
    }
  }

  showObjectViewer() {
    this.router.navigate(['ov']);
  }

  showHome() {
    this.router.navigate(['']);
  }

}
