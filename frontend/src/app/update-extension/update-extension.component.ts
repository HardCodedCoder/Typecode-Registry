import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UpdateExtensionFormData } from '../services/interfaces/formdata';
import { TuiDialogContext } from '@taiga-ui/core';
import { StoreService } from '../services/store.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';

@Component({
  selector: 'app-update-extension',
  templateUrl: './update-extension.component.html',
  styleUrl: './update-extension.component.scss',
})
export class UpdateExtensionComponent {
  updateExtensionData: UpdateExtensionFormData;
  form: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<UpdateExtensionFormData>,
    public store: StoreService
  ) {
    this.updateExtensionData = this.context.data ?? {
      extension: {
        id: 0,
        scope: '',
        project_id: 0,
        name: '',
        description: '',
        creation_date: new Date(),
      },
      new_name: '',
      new_description: '',
    };

    if (this.updateExtensionData.extension.id === 0) {
      this.updateExtensionData.error = {
        error: true,
        message: 'Error: No extension data provided.',
      };
      this.context.completeWith(this.updateExtensionData);
    }

    this.form = this.formBuilder.group({
      extensionName: [
        `${this.updateExtensionData.extension.name}`,
        Validators.required,
      ],
      extensionDescription: [
        `${this.updateExtensionData.extension.description}`,
      ],
    });
  }

  /**
   * Submits the form data.
   */
  submit(): void {
    if (
      this.updateExtensionData.new_name !==
      this.updateExtensionData.extension.name
    )
      this.updateExtensionData.new_name = this.form.value.extensionName;

    if (
      this.updateExtensionData.new_description !==
      this.updateExtensionData.extension.description
    )
      this.updateExtensionData.new_description =
        this.form.value.extensionDescription;

    this.context.completeWith(this.updateExtensionData);
  }

  cancel() {
    this.updateExtensionData.error = {
      error: true,
      message: 'Cancelled',
    };

    this.context.completeWith(this.updateExtensionData);
  }

  isDisabled(): boolean {
    return (
      this.form.get('extensionName')?.value ===
        this.updateExtensionData.extension.name &&
      this.form.get('extensionDescription')?.value ===
        this.updateExtensionData.extension.description
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
