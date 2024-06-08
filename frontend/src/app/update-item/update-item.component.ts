import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { UpdateItemFormData } from '../services/interfaces/formdata';
import { TuiValidationError } from '@taiga-ui/cdk';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-update-item',
  templateUrl: './update-item.component.html',
  styleUrl: './update-item.component.scss',
})
export class UpdateItemComponent implements OnInit, OnDestroy {
  updateItemData: UpdateItemFormData;
  form: FormGroup;
  private destroy$ = new Subject<void>();
  private initialItemName: string;
  private initialTableName: string;

  constructor(
    private formBuilder: FormBuilder,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<UpdateItemFormData>
  ) {
    this.updateItemData = this.context.data ?? {
      item: {
        id: 0,
        scope: '',
        project: '',
        extension_id: 0,
        name: '',
        table_name: '',
        typecode: 0,
        creation_date: new Date(),
      },
      new_item_name: '',
      new_table_name: '',
      wasCanceled: false,
    };

    this.initialItemName = this.updateItemData.item.name;
    this.initialTableName = this.updateItemData.item.table_name;

    this.form = this.formBuilder.group({
      itemName: [this.initialItemName, Validators.required],
      itemTable: [this.initialTableName, Validators.required],
    });

    if (this.updateItemData.item.id === 0) {
      this.updateItemData.error = {
        error: true,
        message: 'Error: No item data provided.',
      };
      this.context.completeWith(this.updateItemData);
    }
  }

  /**
   * Checks if the form data has changed.
   */
  ngOnInit(): void {
    this.form.valueChanges.subscribe(() => {
      this.checkForChanges();
    });
  }

  /**
   * Unsubscribes from the destroy$ observable.
   * This method is called when the component is destroyed.
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Checks if the form data has changed. Empty values are considered as no change.
   * @returns boolean
   */
  checkForChanges(): boolean {
    const newItemName = this.form.value.itemName || this.initialItemName;
    const newTableName = this.form.value.itemTable || this.initialTableName;
    return (
      newItemName !== this.initialItemName ||
      newTableName !== this.initialTableName
    );
  }

  /**
   * Submits the form data.
   */
  submit(): void {
    // Check if the form values are empty and use the existing item values if they are
    const newItemName =
      this.form.value.itemName || this.updateItemData.item.name;
    const newTableName =
      this.form.value.itemTable || this.updateItemData.item.table_name;

    this.updateItemData.new_item_name = newItemName;
    this.updateItemData.new_table_name = newTableName;

    this.context.completeWith(this.updateItemData);
  }

  /*
   * Closes the dialog box.
   */
  closeDialog(): void {
    this.updateItemData.wasCanceled = true;
    this.context.completeWith(this.updateItemData);
  }

  /**
   * Returns the error message for the input fields.
   * @returns TuiValidationError
   */
  get inputValidationError(): TuiValidationError | null {
    return new TuiValidationError('Empty values will be ignored.');
  }
}
