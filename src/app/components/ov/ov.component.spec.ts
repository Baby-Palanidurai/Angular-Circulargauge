import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OvComponent } from './ov.component';

describe('OvComponent', () => {
  let component: OvComponent;
  let fixture: ComponentFixture<OvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OvComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
