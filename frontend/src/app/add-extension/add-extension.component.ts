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
    this.form = this.formBuilder.group(
      {
        extensionName: ['', Validators.required],
        extensionDescription: [''],
        extensionScope: ['Project'],
        projectComboBox: ['', this.validProjectValidator.bind(this)],
      },
      { validators: this.validateForm() }
    );
  }

  private validateForm() {
    console.log('validate form called');
    return undefined;
  }

  scopeChanged($event: any) {
    if ($event.extensionScope !== this.lastSelectedScope) {
      this.projectScopeSelected = !this.projectScopeSelected;
      this.lastSelectedScope = $event.extensionScope;
      if ($event.extensionScope === 'Shared') {
        this.form.controls['projectComboBox'].setValue('');
        this.form.controls['projectComboBox'].markAsUntouched();
        this.form.clearValidators();
        this.form.updateValueAndValidity();
      } else {
        this.form.controls['projectComboBox'].setValidators(
          this.validProjectValidator.bind(this)
        );
        this.form.controls['projectComboBox'].updateValueAndValidity();
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

  submit() {
    this.context.completeWith(this.form.value);
  }
}
