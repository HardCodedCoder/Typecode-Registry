import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypecodeEditorComponent } from './typecode-editor.component';

describe('TypecodeEditorComponent', () => {
  let component: TypecodeEditorComponent;
  let fixture: ComponentFixture<TypecodeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TypecodeEditorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TypecodeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
