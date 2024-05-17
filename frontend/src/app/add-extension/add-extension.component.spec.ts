import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExtensionComponent } from './add-extension.component';

describe('AddExtensionComponent', () => {
  let component: AddExtensionComponent;
  let fixture: ComponentFixture<AddExtensionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddExtensionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
