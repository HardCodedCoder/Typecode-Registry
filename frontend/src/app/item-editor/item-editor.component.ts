import { Component, Inject, Injector, OnInit } from '@angular/core';
import { TuiAlertService, TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { AddItemComponent } from '../add-item/add-item.component';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';
import { FormData } from '../services/interfaces/formdata';
import { catchError, throwError } from 'rxjs';
import { ItemResponse } from '../services/interfaces/items';
import { TUI_PROMPT, TuiPromptData } from '@taiga-ui/kit';
import { Router } from '@angular/router';

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
    @Inject(TuiAlertService) private readonly alertService: TuiAlertService,
    @Inject(Router) private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.backendService.getItems().subscribe({
      next: response => {
        this.store.items = response.items;
        console.log(this.store.items);

        if (response.items === null) {
          console.warn('NULL response: /items');

          if (this.store.hasShown204Error) {
            this.showInformationNotification();
          }

          if (!this.store.hasShown204Error) {
            this.router.navigate(['/error/204'], {
              state: {
                errorOrigin: '/items',
              },
            });
            this.store.hasShown204Error = true;
          }
        }
      },
      error: error => {
        console.error('Could not fetch items', error);
      },
    });

    this.backendService.getExtensions('Shared').subscribe({
      next: response => {
        this.store.sharedExtensions = response.extensions;
      },
      error: error => {
        console.error('Could not fetch shared extensions:', error);
      },
    });

    this.backendService.getExtensions('Project').subscribe({
      next: response => {
        this.store.projectExtensions = response.extensions;
      },
      error: error => {
        console.error('Could not fetch project extensions:', error);
      },
    });
  }

  /**
   * Opens a dialog box to add a new item.
   * Processes the data from the closed dialog and sends a request to create a new item to the backend.
   * @returns {void}
   */
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

  getExtensionName(extension_id: number): string | undefined {
    let extension = this.store.projectExtensions.find(
      ext => ext.id === extension_id
    );
    if (!extension) {
      extension = this.store.sharedExtensions.find(
        ext => ext.id === extension_id
      );
    }
    return extension ? extension.name : undefined;
  }

  /**
   * Sends a request to create a new item to the backend.
   * Updates the item details in the store upon successful creation and displays a notification.
   * @param {FormData} data - The data of the item to be created.
   * @param {number} extension_id - The ID of the extension associated with the item.
   * @returns {void}
   */
  private sendCreateItemRequest(data: FormData, extension_id: number): void {
    this.backendService
      .sendCreateItemRequest({
        name: data.itemName,
        table_name: data.itemTable,
        extension_id: extension_id,
      })
      .subscribe(response => {
        this.backendService.getItems().subscribe({
          next: response => {
            // TODO: Change to only load the newly created item detail.
            this.store.items = response.items;
            console.log(this.store.items);
          },
          error: error => {
            console.error('Could not fetch items', error);
          },
        });

        this.showSuccessMessage('created', response.item.id);
      });
  }

  /**
   * Removes an item.
   * Displays a confirmation dialog and deletes the item upon confirmation.
   * @param {ItemResponse} item - The item to be deleted.
   */
  onDeleteItem(item: ItemResponse): void {
    const data: TuiPromptData = {
      content: `Item ${item.name} in table ${item.table_name} with typecode ${item.typecode}.`,
      yes: 'REMOVE',
      no: 'Cancel',
    };

    this.dialogs
      .open<boolean>(TUI_PROMPT, {
        label: 'Do you really want to delete this item?',
        size: 'm',
        data,
      })
      .subscribe(response => {
        if (response) {
          this.backendService.deleteItem(item.id).subscribe({
            next: response => {
              if (response.status === 204) {
                console.log('Received response 204 from backend');
                this.showSuccessMessage('deleted', item.id);
                if (this.store.items != null) {
                  this.store.items = this.store.items.filter(
                    i => i.id !== item.id
                  );
                }
              } else {
                this.showFailureMessage(
                  `Could not delete item: ${item.id}! Received status code: ${response.status}`
                );
              }
            },
            error: error =>
              this.showFailureMessage(
                `Could not delete item: ${item.id}! Error: ${error}`
              ),
          });
        }
      });
  }

  /**
   * Displays a success notification for various actions.
   * @param {string} action - The action performed ('created' or 'deleted').
   * @param {number} itemId - The ID of the item affected.
   * @returns {void}
   */
  showSuccessMessage(action: string, itemId: number): void {
    const message = `Item with id: ${itemId} ${action}!`;
    this.alertService
      .open(message, {
        label: '🎉 Success 🎉',
        status: 'success',
      })
      .subscribe();
  }

  /**
   * Displays a failure notification for various actions.
   * @param {string} errorMessage - The custom error message to display.
   * @returns {void}
   */
  showFailureMessage(errorMessage: string): void {
    this.alertService
      .open(errorMessage, {
        label: '❌ Failure ❌',
        status: 'error',
      })
      .subscribe();
  }

  /**
   * Shows an information notification.
   */
  private showInformationNotification(): void {
    this.alertService
      .open('Please populate the database.', {
        label: '💡 Information 💡',
        status: 'info',
      })
      .subscribe();
  }
}
