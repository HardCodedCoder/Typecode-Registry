import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionEditorComponent } from './extension-editor.component';

describe('ExtensionEditorComponent', () => {
  let component: ExtensionEditorComponent;
  let fixture: ComponentFixture<ExtensionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExtensionEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtensionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
