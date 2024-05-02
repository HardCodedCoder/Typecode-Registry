import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  Renderer2,
} from '@angular/core';
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
export class UpdateItemComponent implements OnDestroy, AfterViewInit {
  updateItemData: UpdateItemFormData;
  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    @Inject(POLYMORPHEUS_CONTEXT)
    private readonly context: TuiDialogContext<UpdateItemFormData>,
    private el: ElementRef,
    private renderer: Renderer2
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

  ngAfterViewInit(): void {
    this.applyDialogStyles();
  }

  public applyDialogStyles() {
    const dialogElement = this.el.nativeElement.closest('.t-content');
    if (!dialogElement) {
      console.warn('Dialog element not found');
      return;
    }
    this.applyStyleIfElementExists(
      dialogElement,
      'background-color',
      '#232528CC'
    );
    const h2Element = dialogElement.querySelector('h2');
    this.applyStyleIfElementExists(h2Element, 'color', 'white');
  }

  private applyStyleIfElementExists(
    element: Element | null,
    styleProp: string,
    value: string
  ): void {
    if (element) {
      this.renderer.setStyle(element, styleProp, value);
    } else {
      console.warn(`Element not found for style ${styleProp}`);
    }
  }
}
