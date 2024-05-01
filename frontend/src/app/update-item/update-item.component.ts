import { Component, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { StoreService } from '../services/store.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { TuiDialogContext } from '@taiga-ui/core';


@Component({
  selector: 'app-update-item',
  templateUrl: './update-item.component.html',
  styleUrl: './update-item.component.scss',
})
export class UpdateItemComponent implements OnDestroy {
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    public store: StoreService,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<FormGroup>
  ) {
    this.form = this.formBuilder.group({
      itemName: ['', Validators.required],
      itemTable: ['', Validators.required],
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
   * Submits the form data.
   */
  submit(): void {
    this.context.completeWith(this.form.value);
  }
}
