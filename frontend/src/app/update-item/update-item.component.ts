import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';
import { UpdateItemFormData } from '../services/interfaces/formdata';

@Component({
  selector: 'app-update-item',
  templateUrl: './update-item.component.html',
  styleUrl: './update-item.component.scss',
})
export class UpdateItemComponent implements OnDestroy {
  updateItemData: UpdateItemFormData;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<UpdateItemFormData>
  ) {
    this.form = this.formBuilder.group({
      itemName: ['', Validators.required],
      itemTable: ['', Validators.required],
    });

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
    };

    if (this.updateItemData.item.id === 0) {
      this.updateItemData.error = {
        error: true,
        message: 'Error: No item data provided.',
      };
      this.context.completeWith(this.updateItemData);
    }
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
   * Submits the form data.
   */
  submit(): void {
    this.updateItemData.new_item_name = this.form.value.itemName;
    this.updateItemData.new_table_name = this.form.value.itemTable;
    this.context.completeWith(this.updateItemData);
  }

  /*
   * Closes the dialog box.
   */
  closeDialog(): void {
    this.context.completeWith(this.updateItemData);
  }
}
