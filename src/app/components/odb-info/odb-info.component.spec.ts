import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OdbInfoComponent } from './odb-info.component';

describe('OdbInfoComponent', () => {
  let component: OdbInfoComponent;
  let fixture: ComponentFixture<OdbInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OdbInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OdbInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
