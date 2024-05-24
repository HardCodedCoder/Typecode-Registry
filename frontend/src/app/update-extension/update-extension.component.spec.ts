import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateExtensionComponent } from './update-extension.component';

describe('UpdateExtensionComponent', () => {
  let component: UpdateExtensionComponent;
  let fixture: ComponentFixture<UpdateExtensionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateExtensionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
