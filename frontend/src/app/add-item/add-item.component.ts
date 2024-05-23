import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { ExtensionResponse } from '../services/interfaces/extensionRequest';
import { Subject, takeUntil } from 'rxjs';
import { TuiValidationError } from '@taiga-ui/cdk';
import { TuiDialogContext } from '@taiga-ui/core';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss',
})
export class AddItemComponent implements OnInit, OnDestroy {
  extensionsToDisplay: ExtensionResponse[] = [];
  projectScopeSelected: boolean = false;
  showExtensionInput: boolean = true;
  lastSelectedScope: string = 'Shared';
  form: FormGroup;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    public store: StoreService,
    private backend: BackendService,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<FormGroup>
  ) {
    this.form = this.formBuilder.group(
      {
        itemName: ['', Validators.required],
        itemTable: ['', Validators.required],
        extensionScope: ['Shared'],
        projectComboBox: [null],
        extensionComboBox: ['', this.validExtensionValidator.bind(this)],
      },
      { validators: this.validateForm() }
    );
  }

  /**
   * Returns the names of the extensions to be displayed in the combobox.
   *
   * @returns The names of the extensions to be displayed in the combobox.
   */
  get extensionNames(): string[] {
    return this.extensionsToDisplay
      ? this.extensionsToDisplay.map(extension => extension.name)
      : [];
  }

  /**
   * Returns a validation error if the entered extension does not exist.
   *
   * @returns A validation error if the entered extension does not exist.
   */
  get extensionValidationError(): TuiValidationError | null {
    return new TuiValidationError('The entered extension does not exist.');
  }

  /**
   * Returns a validation error if the entered project does not exist.
   *
   * @returns A validation error if the entered project does not exist.
   */
  get projectValidationError(): TuiValidationError | null {
    return new TuiValidationError('The entered project does not exist.');
  }

  /**
   * Unsubscribes from the destroy$ observable.
   * This method is called when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.backend.getExtensions('Shared').subscribe({
      next: response => {
        this.store.sharedExtensions = response.extensions;
        this.extensionsToDisplay = this.store.sharedExtensions;
      },
      error: error => {
        console.error('Could not fetch shared extensions:', error);
      },
    });

    this.backend.getExtensions('Project').subscribe({
      next: response => {
        this.store.projectExtensions = response.extensions;
      },
      error: error => {
        console.error('Could not fetch project extensions:', error);
      },
    });

    /**
     * Fetches the list of projects from the backend.
     * If the request is successful, it updates the list of projects in the store.
     */
    this.backend.getProjects().subscribe({
      next: response => {
        this.store.projects = response.projects;
      },
      error: error => {
        console.error('Error loading projects:', error);
      },
    });

    this.form.controls['extensionComboBox'].valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(extension => {
        console.log(`Extension selected: + ${extension}`);
      });
  }

  /**
   * Handles changes when the user changes the scope.
   *
   * This method is triggered when the user changes the scope of the target extension in the form.
   * Depending on the selected scope, it updates the list of extensions to be displayed and resets the
   * value of the other scopes combobox.
   * If the selected scope is 'Project', it also hides the extension input field, as the user needs to first
   * select a project so that the extensions which belong to that specific project can be displayed.
   *
   * @param $event - The event object containing the selected scope.
   */
  scopeChanged($event: any) {
    if (this.lastSelectedScope != $event.extensionScope) {
      this.projectScopeSelected = !this.projectScopeSelected;

      const projectControl = this.form.get('projectComboBox');

      if (this.projectScopeSelected) {
        this.showExtensionInput = false;
        this.extensionsToDisplay = this.store.projectExtensions;
        if (this.form.controls['extensionComboBox']?.value) {
          this.form.controls['extensionComboBox']?.setValue(null, {
            emitEvent: false,
          });
          this.form.controls['extensionComboBox']?.markAsUntouched();
        }
        projectControl?.setValidators(this.validProjectValidator.bind(this));
      } else {
        this.showExtensionInput = true;
        this.extensionsToDisplay = this.store.sharedExtensions;
        if (this.form.controls['projectComboBox']?.value) {
          this.form.controls['projectComboBox']?.setValue(null, {
            emitEvent: false,
          });
          this.form.controls['projectComboBox']?.markAsUntouched();
        }
      }
      projectControl?.clearValidators();
    }

    this.lastSelectedScope = $event.extensionScope;
  }

  /**
   * Validates the selected extension.
   *
   * @param control - The control to validate.
   * @returns A validation error if the selected extension is invalid.
   */
  validExtensionValidator(control: AbstractControl): ValidationErrors | null {
    return this.extensionNames.includes(control.value)
      ? null
      : { invalidExtension: true };
  }

  /**
   * Validates the selected project.
   *
   * @param control - The control to validate.
   * @returns A validation error if the selected project is invalid.
   */
  validProjectValidator(control: AbstractControl): ValidationErrors | null {
    console.log('Validator called in class');
    return this.store.projectNames.includes(control.value)
      ? null
      : { invalidProject: true };
  }

  /**
   * Handles changes when the user selects a project.
   *
   * This method is triggered when the user selects a project from the combobox.
   * It updates the list of extensions to be displayed based on the selected project.
   *
   * @param $event - The event object containing the selected project.
   */
  onProjectSelected($event: any) {
    if (this.store.projectNames.includes($event)) {
      this.extensionsToDisplay = this.store.projectExtensions;
      const selectedProject = this.store.projects.find(
        project => project.name == $event
      );

      if (selectedProject) {
        this.extensionsToDisplay = this.extensionsToDisplay.filter(
          extension => extension.project_id === selectedProject.id
        );

        this.showExtensionInput = true;
      }
    }
  }

  /**
   * Submits the form data.
   */
  submit(): void {
    this.context.completeWith(this.form.value);
  }

  /*
   * Closes the dialog box.
   */
  closeDialog(): void {
    this.context.completeWith(this.form);
  }

  /**
   * Validates the form.
   *
   * @returns A validation error if the form is invalid.
   * @returns null if the form is valid.
   */
  private validateForm(): ValidatorFn {
    console.log('validate form called');
    return (control: AbstractControl): ValidationErrors | null => {
      const group = control as FormGroup;
      const extensionScope = group.controls['extensionScope'];
      const projectComboBox = group.controls['projectComboBox'];

      if (extensionScope.value !== 'Shared' && !projectComboBox.value) {
        return { invalidProject: true };
      }

      return null;
    };
  }
}
