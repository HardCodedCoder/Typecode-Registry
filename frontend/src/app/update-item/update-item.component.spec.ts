import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateItemComponent } from './update-item.component';

describe('UpdateItemComponent', () => {
  let component: UpdateItemComponent;
  let fixture: ComponentFixture<UpdateItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateItemComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
