import { Component, Inject } from '@angular/core';
import { UpdateProjectFormData } from '../services/interfaces/formdata';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { StoreService } from '../services/store.service';

@Component({
  selector: 'app-update-project',
  templateUrl: './update-project.component.html',
  styleUrl: './update-project.component.scss',
})
export class UpdateProjectComponent {
  updateProjectData: UpdateProjectFormData;
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<UpdateProjectFormData>,
    public store: StoreService
  ) {
    this.updateProjectData = this.context.data ?? {
      project: {
        id: 0,
        name: '',
        description: '',
        creation_date: new Date(),
      },
      new_name: '',
      new_description: '',
    };

    if (this.updateProjectData.project.id === 0) {
      this.updateProjectData.error = {
        error: true,
        message: 'Error: No project data provided.',
      };
      this.context.completeWith(this.updateProjectData);
    }

    this.form = this.formBuilder.group({
      projectName: [
        `${this.updateProjectData.project.name}`,
        Validators.required,
      ],
      projectDescription: [`${this.updateProjectData.project.description}`],
    });
  }

  /**
   * Submits the form data.
   */
  submit(): void {
    if (this.updateProjectData.new_name !== this.updateProjectData.project.name)
      this.updateProjectData.new_name = this.form.value.projectName;

    if (
      this.updateProjectData.new_description !==
      this.updateProjectData.project.description
    )
      this.updateProjectData.new_description =
        this.form.value.projectDescription;

    this.context.completeWith(this.updateProjectData);
  }

  cancel() {
    this.updateProjectData.error = {
      error: true,
      message: 'Cancelled',
    };
    this.context.completeWith(this.updateProjectData);
  }

  isDisabled(): boolean {
    return (
      this.form.get('projectName')?.value ===
        this.updateProjectData.project.name &&
      this.form.get('projectDescription')?.value ===
        this.updateProjectData.project.description
    );
  }

  formattedDate(dateString: Date): string {
    const date = new Date(dateString);

    const dateOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    };

    const formattedDate = date.toLocaleDateString('de-DE', dateOptions);
    const formattedTime = date.toLocaleTimeString('de-DE', timeOptions);

    return `${formattedDate} - ${formattedTime} Uhr`;
  }
}
