import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OvNavComponent } from './ov-nav.component';

describe('OvNavComponent', () => {
  let component: OvNavComponent;
  let fixture: ComponentFixture<OvNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OvNavComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OvNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
