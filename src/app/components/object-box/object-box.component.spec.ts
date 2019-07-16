import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectBoxComponent } from './object-box.component';

describe('ObjectBoxComponent', () => {
  let component: ObjectBoxComponent;
  let fixture: ComponentFixture<ObjectBoxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ObjectBoxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObjectBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
