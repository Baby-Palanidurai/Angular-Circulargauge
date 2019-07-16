import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ObjectBoxComponent } from './../../components/object-box/object-box.component';
import { EventEmitter } from '@angular/core';
import { Global } from 'app/shared/global/global';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-object-box-nav',
  templateUrl: './object-box-nav.component.html',
  styleUrls: ['./object-box-nav.component.scss'],
  encapsulation: ViewEncapsulation.None,
})

export class ObjectBoxNavComponent implements OnInit, OnDestroy {

  private lastYPosition = 0;
  public isMobile = false;

  constructor(private router: Router, private location: Location, private global: Global, private objectBoxComponent: ObjectBoxComponent) {
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
    const objBoxNav = document.getElementById('objBoxNav');
    const yPos = this.currentYPosition();

    if (yPos > this.lastYPosition) {
      this.closeResponsiveMenu();
    }

    if ((yPos > 50) && (yPos > this.lastYPosition)) {
      if (!objBoxNav.className.includes(' up')) {
        objBoxNav.className += ' up';
      }
    } else {
      objBoxNav.className = objBoxNav.className.replace(' up', '')
    }

    this.lastYPosition = yPos;

    if (this.currentYPosition() <= 0) {
      objBoxNav.className = objBoxNav.className.replace(' up', '')
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
    const objBoxNav = document.getElementById('objBoxNav');
    if (objBoxNav.className.includes(' responsive')) {
      objBoxNav.className = objBoxNav.className.replace(' responsive', '')
    } else {
      objBoxNav.className += ' responsive';
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className === 'hamburger') {
      hamburger.className += ' open';
    } else {
      hamburger.className = 'hamburger';
    }
  }

  closeResponsiveMenu() {
    const objBoxNav = document.getElementById('objBoxNav');
    if (objBoxNav.className.includes(' responsive')) {
      objBoxNav.className = objBoxNav.className.replace(' responsive', '')
    }

    const hamburger = document.getElementById('myHamburger');
    if (hamburger.className.includes(' open')) {
      hamburger.className = hamburger.className.replace(' open', '')
    }
  }

  backClick() {
    this.objectBoxComponent.navigateBack();
  }

  showHome() {
    this.router.navigate(['']);
  }

}
