import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { AddItemComponent } from './add-item.component';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { ExtensionResponse } from '../services/interfaces/extension';
import { ProjectResponse } from '../services/interfaces/project';
import { of } from 'rxjs';

describe('AddItemComponent', () => {
  let component: AddItemComponent;
  let fixture: ComponentFixture<AddItemComponent>;
  const mockExtensions: ExtensionResponse[] = [
    {
      id: 1,
      project_id: 1,
      name: 'Extension A',
      scope: 'Shared',
      description: 'Eine Beschreibung für Extension A',
      creation_date: new Date('2021-01-01'),
    },
    {
      id: 2,
      project_id: 1,
      name: 'Extension B',
      scope: 'Project',
      description: 'Eine Beschreibung für Extension B',
      creation_date: new Date('2021-02-01'),
    },
  ];
  const mockProjects: ProjectResponse[] = [
    {
      id: 1,
      name: 'Project Alpha',
      description: 'Eine Beschreibung für Project Alpha',
      creation_date: new Date('2020-01-01'),
    },
    {
      id: 2,
      name: 'Project Beta',
      description: 'Eine Beschreibung für Project Beta',
      creation_date: new Date('2020-06-01'),
    },
  ];

  const mockStoreService: Partial<StoreService> = {
    projects: mockProjects,
    sharedExtensions: mockExtensions.filter(
      extension => extension.scope === 'Shared'
    ),
    projectExtensions: mockExtensions.filter(
      extension => extension.scope === 'Project'
    ),
    getSharedExtensionId: (name: string) => {
      const extension = mockExtensions.find(
        extension => extension.name === name && extension.scope === 'Shared'
      );
      return extension ? extension.id : undefined;
    },
    getProjectExtensionId: (projectName: string, extensionName: string) => {
      const project = mockProjects.find(
        project => project.name === projectName
      );
      if (project) {
        const extension = mockExtensions.find(
          extension =>
            extension.project_id === project.id &&
            extension.name === extensionName
        );
        return extension ? extension.id : undefined;
      }
      return undefined;
    },
  };

  const mockBackendService = {
    getExtensions: jasmine
      .createSpy('getExtensions')
      .and.returnValue(of(mockExtensions)),
    getProjects: jasmine
      .createSpy('getProjects')
      .and.returnValue(of(mockProjects)),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddItemComponent],
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
        { provide: BackendService, useValue: mockBackendService },
        { provide: POLYMORPHEUS_CONTEXT, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddItemComponent);
    component = fixture.componentInstance;

    component.extensionsToDisplay = [
      {
        id: 1,
        project_id: 1,
        name: 'Shared Extension 1',
        scope: 'Shared',
        description: 'This is a shared extension',
        creation_date: new Date('2022-03-01'),
      },
      {
        id: 2,
        project_id: 2,
        name: 'Project Extension 1',
        scope: 'Project',
        description: 'This is a project extension',
        creation_date: new Date('2022-04-01'),
      },
    ];

    fixture.detectChanges();
  });

  afterEach(() => {
    mockBackendService.getExtensions.calls.reset();
    mockBackendService.getProjects.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form', () => {
    expect(component.form).toBeDefined();
  });

  it('should call backend services on init', () => {
    expect(mockBackendService.getExtensions).toHaveBeenCalledTimes(2);
    expect(mockBackendService.getProjects).toHaveBeenCalledTimes(1);
  });

  it('should change scope when scopeChanged is called', () => {
    component.scopeChanged({ extensionScope: 'Project' });
    expect(component.projectScopeSelected).toBeTrue();
    expect(component.showExtensionInput).toBeFalse();
  });

  it('should validate extension correctly', () => {
    const control = { value: 'invalidExtension' };
    const result = component.validExtensionValidator(control as any);
    expect(result).toEqual({ invalidExtension: true });
  });

  it('should validate project correctly', () => {
    const control = { value: 'invalidProject' };
    const result = component.validProjectValidator(control as any);
    expect(result).toEqual({ invalidProject: true });
  });

  it('should mark form as valid when extensionScope is "Shared" and projectComboBox can be empty', () => {
    component.extensionsToDisplay = [
      {
        id: 1,
        project_id: 1,
        name: 'Extension A',
        scope: 'Shared',
        description: 'Beschreibung',
        creation_date: new Date(),
      },
    ];

    component.form.controls['itemName'].setValue('Some Name');
    component.form.controls['itemTable'].setValue('Some Table Name');
    component.form.controls['extensionScope'].setValue('Shared');
    component.form.controls['projectComboBox'].setValue(null);
    component.form.controls['extensionComboBox'].setValue('Extension A'); // Angenommen, das ist optional oder hat einen Standardwert

    component.form.updateValueAndValidity();

    /* UNCOMMENT FOR DEBUGGING
    Object.keys(component.form.controls).forEach(key => {
      const control = component.form.get(key);
      console.log(key, control?.status, control?.errors);
    });
    */

    fixture.detectChanges();

    expect(component.form.valid).toBeTruthy();
  });

  /*
  it('should hide extension input and set validators when scope changes from "Shared" to "Project"', () => {
    component.lastSelectedScope = 'Shared';
    const event = { extensionScope: 'Project' };

    const projectComboBoxControl = component.form.get(
      'projectComboBox'
    ) as FormControl;
    const extensionComboBoxControl = component.form.get(
      'extensionComboBox'
    ) as FormControl;

    spyOn(projectComboBoxControl, 'setValidators');
    spyOn(projectComboBoxControl, 'clearValidators');
    spyOn(extensionComboBoxControl, 'setValue');
    spyOn(extensionComboBoxControl, 'markAsUntouched');

    component.scopeChanged(event);

    expect(component.projectScopeSelected).toBeTrue();
    expect(component.showExtensionInput).toBeFalse();
    expect(component.extensionsToDisplay).toEqual(
      component.store.projectExtensions
    );
    expect(
      component.form.get('extensionComboBox')?.setValue
    ).toHaveBeenCalledWith(null, { emitEvent: false });
    expect(
      component.form.get('extensionComboBox')?.markAsUntouched
    ).toHaveBeenCalled();
    expect(
      component.form.get('projectComboBox')?.setValidators
    ).toHaveBeenCalledWith(jasmine.any(Function));
    expect(
      component.form.get('projectComboBox')?.clearValidators
    ).not.toHaveBeenCalled();
  });
   */
});
