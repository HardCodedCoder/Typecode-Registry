import { Component, Inject, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { StoreService } from '../services/store.service';
import { TuiValidationError } from '@taiga-ui/cdk';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-add-extension',
  templateUrl: './add-extension.component.html',
  styleUrl: './add-extension.component.scss',
})
export class AddExtensionComponent implements OnInit {
  form: FormGroup;
  projectScopeSelected: boolean = true;
  lastSelectedScope: string = 'Project';

  constructor(
    private formBuilder: FormBuilder,
    @Inject(BackendService) public readonly backendService: BackendService,
    @Inject(StoreService) public readonly store: StoreService,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<FormGroup>
  ) {
    this.form = this.formBuilder.group({
      extensionName: ['', Validators.required],
      extensionDescription: [''],
      extensionScope: ['Project'],
      projectComboBox: ['', this.validProjectValidator.bind(this)],
    });
  }

  /**
   * Handles changes when the user changes the scope of the target extension in the form.
   *
   * @param $event - An event object containing the selected scope. The `extensionScope` property of this object indicates the new scope selected by the user.
   *
   * This method performs the following actions:
   * 1. Scope Comparison: Checks if the new scope (`$event.extensionScope`) is different from the last selected scope (`this.lastSelectedScope`).
   * 2. Update Scope State: Updates the `projectScopeSelected` property based on whether the new scope is 'Project'. Also updates `lastSelectedScope` to the new scope.
   * 3. Project ComboBox Control:
   *    - Retrieves the `projectComboBox` control from the form.
   *    - If the new scope is 'Project':
   *      - Sets the validators for the `projectComboBox` control using the `validProjectValidator` method.
   *      - Calls `updateValueAndValidity` to re-evaluate the control's validation state.
   *    - If the new scope is not 'Project':
   *      - Clears the validators for the `projectComboBox` control.
   *      - Sets the value of the `projectComboBox` control to an empty string.
   *      - Marks the `projectComboBox` control as untouched.
   *      - Calls `updateValueAndValidity` to re-evaluate the control's validation state.
   *
   * This method ensures that the form's validation state is correctly updated based on the selected scope, and that the `projectComboBox` control is appropriately reset when the scope is changed to 'Shared'.
   */
  scopeChanged($event: any) {
    if ($event.extensionScope !== this.lastSelectedScope) {
      this.projectScopeSelected = $event.extensionScope === 'Project';
      this.lastSelectedScope = $event.extensionScope;

      const projectComboBoxControl = this.form.controls['projectComboBox'];

      if (this.projectScopeSelected) {
        projectComboBoxControl.setValidators(
          this.validProjectValidator.bind(this)
        );
        projectComboBoxControl?.updateValueAndValidity();
      } else {
        projectComboBoxControl?.clearValidators();
        projectComboBoxControl?.setValue('');
        projectComboBoxControl?.markAsUntouched();
        projectComboBoxControl?.updateValueAndValidity();
      }
    }
  }

  /**
   * Returns a validation error if the entered project does not exist.
   *
   * @returns A validation error if the entered project does not exist.
   */
  get projectValidationError(): TuiValidationError | null {
    return new TuiValidationError('The entered project does not exist.');
  }

  ngOnInit(): void {
    this.backendService.getProjects().subscribe(projects => {
      console.log('Received projects from backend');
      this.store.projects = projects.projects;
    });
  }

  /**
   * Validates the selected project.
   *
   * @param control - The control to validate.
   * @returns A validation error if the selected project is invalid.
   */
  validProjectValidator(control: AbstractControl): ValidationErrors | null {
    return this.store.projectNames.includes(control.value)
      ? null
      : { invalidProject: true };
  }

  /**
   * Submits the form data.
   */
  submit() {
    this.context.completeWith(this.form.value);
  }

  /*
   * Closes the dialog box.
   */
  closeDialog(): void {
    this.context.completeWith(this.form);
  }
}
