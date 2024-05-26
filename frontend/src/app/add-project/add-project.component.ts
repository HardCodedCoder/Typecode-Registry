import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../services/store.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { ProjectFormData } from '../services/interfaces/formdata';

@Component({
  selector: 'app-add-project',
  templateUrl: './add-project.component.html',
  styleUrl: './add-project.component.scss',
})
export class AddProjectComponent {
  form: FormGroup;

  private projectFormData: ProjectFormData;

  constructor(
    private formBuilder: FormBuilder,
    public store: StoreService,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<ProjectFormData>
  ) {
    this.form = this.formBuilder.group({
      projectName: ['', Validators.required],
      projectDescription: [''],
    });

    this.projectFormData = this.context.data ?? {
      projectName: '',
      projectDescription: '',
      error: {
        error: true,
        message: 'Failure in initializing component! No data available!',
      },
    };
  }

  submit() {
    this.projectFormData.projectName = this.form.get('projectName')?.value;
    this.projectFormData.projectDescription =
      this.form.get('projectDescription')?.value;
    this.context.completeWith(this.projectFormData);
  }

  cancel() {
    this.projectFormData.error = {
      error: true,
      message: 'cancelled by user',
    };

    this.context.completeWith(this.projectFormData);
  }
}
