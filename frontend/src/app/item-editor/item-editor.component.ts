import {
  Component,
  ElementRef,
  Inject,
  Injector,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { TuiDialogService } from '@taiga-ui/core';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { AddItemComponent } from '../add-item/add-item.component';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';
import { FormData, UpdateItemFormData } from '../services/interfaces/formdata';
import { catchError, throwError } from 'rxjs';
import { ItemResponse } from '../services/interfaces/items';
import { TUI_PROMPT, TuiPromptData } from '@taiga-ui/kit';
import { Router } from '@angular/router';
import { UpdateItemComponent } from '../update-item/update-item.component';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from '../services/message.service';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrl: './item-editor.component.scss',
})
export class ItemEditorComponent implements OnInit {
  @ViewChildren('codeElements') codeElements!: QueryList<
    ElementRef<HTMLDivElement>
  >;
  readonly columns: string[] = [
    'Scope',
    'Project',
    'Extension',
    'TypeName',
    'TableName',
    'Typecode',
    'Action',
  ];
  searchForm = new FormGroup({
    search: new FormControl(''),
  });
  selectedItem: ItemResponse | null = null;

  constructor(
    @Inject(TuiDialogService) private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
    @Inject(BackendService) private readonly backendService: BackendService,
    @Inject(StoreService) public readonly store: StoreService,
    @Inject(MessageService) public readonly messageService: MessageService,
    @Inject(Router) private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.backendService.getItems().subscribe({
      next: response => {
        this.store.items = response.items;
        console.log(this.store.items);

        if (response.items === null) {
          console.warn('NULL response: /items');

          if (this.store.hasShown204ErrorItems) {
            this.messageService.showInformationNotification(
              'Please populate the database.'
            );
          }

          if (!this.store.hasShown204ErrorItems) {
            this.router.navigate(['/error/204'], {
              state: {
                errorOrigin: '/items',
              },
            });
            this.store.hasShown204ErrorItems = true;
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

    this.backendService.getProjects().subscribe({
      next: response => {
        this.store.projects = response.projects;
      },
      error: error => {
        console.error('Could not fetch projects:', error);
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
          label: 'Add Item',
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
        // necessary for cancel button in add-item dialog
        if (data.itemName === undefined) {
          return;
        }
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

  /**
   * Returns the name of the extension with the given ID.
   * @param {number} extension_id - The ID of the extension to get the name for.
   * @returns {string | undefined} The name of the extension or undefined if the extension was not found.
   */
  getExtensionName(extension_id: number): string | undefined {
    let extension = this.store.projectExtensions?.find(
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

        this.messageService.showSuccessMessage(
          'added',
          'Item',
          response.item.id
        );
      });
  }

  /**
   * Removes an item.
   * Displays a confirmation dialog and deletes the item upon confirmation.
   * @param {ItemResponse} item - The item to be deleted.
   */
  onDeleteItem(item: ItemResponse): void {
    const data: TuiPromptData = {
      content: `This will delete Item <b>${item.name}</b> in Table <b>${item.table_name}</b> with Typecode <b>${item.typecode}</b>.`,
      // The order of the "Yes" and "No" buttons is reversed in styles.scss (attribute selector _ngcontent-ng-c77178733)
      yes: 'Remove',
      no: 'Cancel',
    };

    this.dialogs
      .open<boolean>(TUI_PROMPT, {
        label: 'Do you really want to delete this Item?',
        size: 'm',
        data,
      })
      .subscribe(response => {
        if (response) {
          this.backendService.deleteItem(item.id).subscribe({
            next: response => {
              if (response.status === 204) {
                console.log('Received 204 response from backend');
                this.messageService.showSuccessMessage(
                  'deleted',
                  'Item',
                  item.id
                );
                if (this.store.items != null) {
                  this.store.items = this.store.items.filter(
                    i => i.id !== item.id
                  );
                }
              } else {
                this.messageService.showFailureMessage(
                  `Could not delete item: ${item.id}! Received status code: ${response.status}`
                );
              }
            },
            error: error =>
              this.messageService.showFailureMessage(
                `Could not delete item: ${item.id}! Error: ${error}`
              ),
          });
        }
      });
  }

  /**
   * Opens a dialog box to update an item.
   * Processes the data from the closed dialog and sends a request to update the item to the backend.
   * If an error occurs, a failure notification is displayed.
   * @param {ItemResponse} item - The item to update.
   * @returns {void}
   */
  onEditItem(item: ItemResponse): void {
    if (item.id === 0) {
      this.messageService.showFailureMessage(
        'Error: Unexpected internal error! Please restart application!'
      );
      return;
    }

    const data: UpdateItemFormData = {
      item: item,
      new_item_name: '',
      new_table_name: '',
      wasCanceled: false,
    };

    const dialog$ = this.dialogs
      .open<UpdateItemFormData>(
        new PolymorpheusComponent(UpdateItemComponent, this.injector),
        {
          dismissible: true,
          label: 'Update Item',
          data: data,
        }
      )
      .pipe(
        catchError(err => {
          console.error('item-editor: Error opening dialog:', err);
          return throwError(err);
        })
      );

    dialog$.subscribe({
      next: (data: UpdateItemFormData) => {
        console.log('item-editor: Dialog closed with data:', data);
        // necessary for cancel button in update-item dialog
        if (data.wasCanceled === true) {
          return;
        }
        if (data.error?.error === true) {
          this.messageService.showFailureMessage(data.error.message);
        } else {
          this.backendService
            .updateItem(item.id, {
              name: data.new_item_name,
              table_name: data.new_table_name,
            })
            .subscribe({
              next: response => {
                if (response.status === 204) {
                  console.log('Received 204 response from backend');
                  this.messageService.showSuccessMessageWithCustomMessage(
                    `Item with ID ${item.id} (${data.item.project}, ${this.getExtensionName(data.item.extension_id)}, ${data.item.typecode}) updated!`
                  );
                  item.table_name = data.new_table_name;
                  item.name = data.new_item_name;
                } else {
                  this.messageService.showFailureMessage(
                    `Could not update item: ${item.id}!<br>Received status code: ${response.status}`
                  );
                }
              },
              error: error =>
                this.messageService.showFailureMessage(
                  `Could not update item: ${item.id}! Error: ${error}`
                ),
            });
        }
      },
    });
  }

  /**
   * Allows the user to select an item. The selected item is highlighted.
   * @param {ItemResponse} item - The item to select.
   */
  selectItem(item: ItemResponse) {
    // Deselect the item if it is already selected
    this.selectedItem = this.selectedItem === item ? null : item;
    setTimeout(() => {
      // Timeout as html is not yet rendered
      if (this.codeElements) {
        this.codeElements.forEach(element => {
          element.nativeElement.classList.add('change-colors');
          setTimeout(() => {
            element.nativeElement.classList.remove('change-colors');
          }, 500);
        });
      }
    }, 10);
  }

  /**
   * Copies the given text to the clipboard.
   * @param {code} text - The code text to copy.
   */
  copyText(code: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.messageService.showSuccessMessage(
      'Snippet copied successfully!',
      '',
      undefined
    );
  }

  /**
   * Returns the snippet for the given item.
   * @param {any} item - The item to get the snippet for.
   * @returns {string} The snippet for the item.
   */
  getItemSnippet(item: any): string {
    return [
      `<itemtype code="${item.name}">`,
      `    <deployment table="${item.table_name}" typecode="${item.typecode}"/>`,
      `    <attributes>`,
      `        <!-- attributes -->`,
      `    </attributes>`,
      `</itemtype>`,
    ].join('\n');
  }

  /**
   * Returns the snippet for the given item relation.
   * @param {any} item - The item to get the relation snippet for.
   * @returns {string} The relation snippet for the item.
   */
  getRelationSnippet(item: any): string {
    return [
      `<relation code="${item.name}" localized="false">`,
      `    <deployment table="${item.table_name}" typecode="${item.typecode}"/>`,
      `    <sourceElement type="" cardinality="" ordered="" qualifier=""/>`,
      `    <targetElement type="" cardinality="" navigable=""/>`,
      `</relation>`,
    ].join('\n');
  }
}
