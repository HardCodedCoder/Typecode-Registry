import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import {
  TuiRootModule,
  TuiDialogModule,
  TuiAlertModule,
  TuiHintModule,
  TuiErrorModule,
  TuiGroupModule,
  TuiDropdownModule,
  TuiButtonModule,
} from '@taiga-ui/core';
import {
  TuiInputModule,
  TuiComboBoxModule,
  TuiDataListWrapperModule,
  TuiRadioBlockModule,
  TuiFilterByInputPipeModule,
  TuiFieldErrorPipeModule,
} from '@taiga-ui/kit';
import { TuiValueChangesModule } from '@taiga-ui/cdk';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import { TUI_SANITIZER } from '@taiga-ui/core';
import { AddProjectComponent } from './add-project.component';
import { StoreService } from '../../services/store.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { Renderer2 } from '@angular/core';

describe('AddProjectComponent', () => {
  let component: AddProjectComponent;
  let fixture: ComponentFixture<AddProjectComponent>;

  const mockStoreService: Partial<StoreService> = {
    projects: [
      {
        id: 1,
        name: 'Project Alpha',
        description: 'Description Alpha',
        creation_date: new Date(),
      },
      {
        id: 2,
        name: 'Project Beta',
        description: 'Description Beta',
        creation_date: new Date(),
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddProjectComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        HttpClientTestingModule,
        TuiRootModule,
        TuiDialogModule,
        TuiAlertModule,
        TuiHintModule,
        TuiErrorModule,
        TuiGroupModule,
        TuiDropdownModule,
        TuiInputModule,
        TuiFieldErrorPipeModule,
        TuiValueChangesModule,
        TuiRadioBlockModule,
        TuiComboBoxModule,
        TuiDataListWrapperModule,
        TuiFilterByInputPipeModule,
        TuiButtonModule,
      ],
      providers: [
        { provide: TUI_SANITIZER, useClass: NgDompurifySanitizer },
        { provide: StoreService, useValue: mockStoreService },
        { provide: POLYMORPHEUS_CONTEXT, useValue: {} },
        {
          provide: Renderer2,
          useValue: {
            setStyle: jasmine
              .createSpy('setStyle')
              .and.callFake((el, prop, value) => {
                console.log(`Setting style ${prop} to ${value} on element`, el);
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.form).toBeDefined();
    expect(component.form.controls['projectName']).toBeDefined();
    expect(component.form.controls['projectDescription']).toBeDefined();
  });

  it('should have projectName as a required field', () => {
    const projectNameControl = component.form.controls['projectName'];
    projectNameControl.setValue('');
    expect(projectNameControl.valid).toBeFalse();
    expect(projectNameControl.errors).toEqual({ required: true });

    projectNameControl.setValue('Project Alpha');
    expect(projectNameControl.valid).toBeTrue();
  });
});
