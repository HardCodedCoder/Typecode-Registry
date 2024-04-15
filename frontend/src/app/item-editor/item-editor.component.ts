import { Component, Inject, Injector, OnInit } from '@angular/core';
import { TuiAlertService, TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { AddItemComponent } from '../add-item/add-item.component';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';
import { FormData } from '../services/interfaces/formdata';
import { catchError, throwError } from 'rxjs';
import { ItemDetailResponse } from '../services/interfaces/items';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrl: './item-editor.component.scss',
})
export class ItemEditorComponent implements OnInit {
  readonly columns: string[] = [
    'Scope',
    'Project',
    'Extension',
    'TypeName',
    'TableName',
    'Typecode',
    'Action',
  ];

  constructor(
    @Inject(TuiDialogService) private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
    @Inject(BackendService) private readonly backendService: BackendService,
    @Inject(StoreService) public readonly store: StoreService,
    @Inject(TuiAlertService) private readonly alertService: TuiAlertService
  ) {}

  ngOnInit(): void {
    this.backendService.getItemsDetails().subscribe({
      next: response => {
        this.store.details = response.details;
        console.log(this.store.details);
      },
      error: error => {
        console.error('Could not fetch items', error);
      },
    });
  }

  showDialog(): void {
    const dialog$ = this.dialogs
      .open<FormData>(
        new PolymorpheusComponent(AddItemComponent, this.injector),
        {
          dismissible: true,
          label: 'Create Item',
        }
      )
      .pipe(
        catchError(err => {
          console.error('item-editor: Error opening dialog:', err);
          return throwError(err);
        })
      );

    dialog$.subscribe({
      next: (data: FormData) => {
        console.log('item-editor: Dialog closed with data:', data);
        let extension_id: number | undefined;
        if (data.extensionScope === 'Shared') {
          extension_id = this.store.getSharedExtensionId(
            data.extensionComboBox
          );
        } else {
          extension_id = this.store.getProjectExtensionId(
            data.projectComboBox,
            data.extensionComboBox
          );
          if (!extension_id) {
            console.error('item-editor: Project not found');
          }
        }

        if (extension_id && extension_id > 0)
          this.sendCreateItemRequest(data, extension_id);
      },
      complete: () => {
        console.info('item-editor: Dialog closed');
      },
    });
  }

  private sendCreateItemRequest(data: FormData, extension_id: number): void {
    this.backendService
      .sendCreateItemRequest({
        name: data.itemName,
        tableName: data.itemTable,
        extension_id: extension_id,
      })
      .subscribe(response => {
        this.backendService.getItemsDetails().subscribe({
          next: response => {
            // TODO: Change to only load the newly created item detail.
            this.store.details = response.details;
            console.log(this.store.details);
          },
          error: error => {
            console.error('Could not fetch items', error);
          },
        });

        this.showNotification(response.item.id);
      });
  }

  remove(detail: ItemDetailResponse) {
    console.log('TODO: Implement deleting detail');
    console.log(detail);
  }

  private showNotification(itemId: number): void {
    this.alertService
      .open('Item with id: ' + itemId + ' created!', {
        label: '🎉 Success 🎉',
        status: 'success',
      })
      .subscribe();
  }
}
