import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjSingleTreeComponent } from './obj-single-tree.component';

describe('ObjSingleTreeComponent', () => {
  let component: ObjSingleTreeComponent;
  let fixture: ComponentFixture<ObjSingleTreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjSingleTreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjSingleTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
