import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { TuiAlertService, TuiDialogService } from '@taiga-ui/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { ExtensionFormData } from '../services/interfaces/formdata';
import { AddExtensionComponent } from '../add-extension/add-extension.component';
import { Injector } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ExtensionRequest } from '../services/interfaces/extensionRequest';
import { MessageService } from '../services/message.service';

@Component({
  selector: 'app-extension-editor',
  templateUrl: './extension-editor.component.html',
  styleUrl: './extension-editor.component.scss',
})
export class ExtensionEditorComponent implements OnInit {
  readonly MAX_DESCRIPTION_LENGTH = 75;
  expandedItemIds: Set<number> = new Set();
  searchForm = new FormGroup({
    search: new FormControl(''),
  });

  readonly columns: string[] = [
    'Name',
    'Description',
    'Project',
    'Scope',
    'Item Count',
    'Creation Date',
    'Actions',
  ];

  constructor(
    @Inject(TuiDialogService) private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
    @Inject(StoreService) public readonly storeService: StoreService,
    @Inject(BackendService) public readonly backendService: BackendService,
    @Inject(TuiAlertService) private readonly alertService: TuiAlertService,
    @Inject(MessageService) private readonly messageService: MessageService,
    @Inject(Router) private readonly router: Router,
    @Inject(ChangeDetectorRef)
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  getProjectName(project_id: number): string | undefined {
    return this.storeService.projects.find(project => project.id === project_id)
      ?.name;
  }

  ngOnInit(): void {
    this.backendService.getExtensions().subscribe({
      next: response => {
        this.storeService.allExtensions = response.extensions;
        console.log(this.storeService.allExtensions);

        if (this.storeService.allExtensions === null) {
          console.warn('NULL response: /extensions');

          if (this.storeService.hasShown204ErrorExtensions) {
            this.showInformationNotification();
          }

          if (!this.storeService.hasShown204ErrorExtensions) {
            this.router.navigate(['/error/204'], {
              state: {
                errorOrigin: '/extensions',
              },
            });
            this.storeService.hasShown204ErrorExtensions = true;
          }
        }
      },
      error: error => {
        console.error('Could not fetch extensions', error);
      },
    });

    this.backendService.getProjects().subscribe({
      next: projects => {
        this.storeService.projects = projects.projects;
        console.log(this.storeService.projects);
      },
      error: error => {
        console.error('Could not fetch projects', error);
      },
    });
  }

  showDialog(): void {
    const dialog$ = this.dialogs
      .open<ExtensionFormData>(
        new PolymorpheusComponent(AddExtensionComponent, this.injector),
        {
          dismissible: true,
          label: 'Add Extension',
        }
      )
      .pipe(
        catchError(err => {
          console.error('extension-editor: Error opening dialog:', err);
          return throwError(err);
        })
      );

    dialog$.subscribe({
      next: (data: ExtensionFormData) => {
        console.log('extension-editor: Dialog closed with data: ', data);
        const project_id = this.storeService.projects.find(
          project => project.name === data.projectComboBox
        )?.id;
        let requestData: ExtensionRequest;

        if (project_id === undefined && data.extensionScope === 'Project') {
          throwError('Project not found!');
          return;
        } else if (
          project_id !== undefined &&
          data.extensionScope === 'Shared'
        ) {
          requestData = {
            name: data.extensionName,
            scope: data.extensionScope,
            description: data.extensionDescription,
          };
        } else {
          requestData = {
            project_id: project_id,
            name: data.extensionName,
            scope: data.extensionScope,
            description: data.extensionDescription,
          };
        }
        this.sendCreateExtensionRequest(requestData);
      },
    });
  }

  sendCreateExtensionRequest(data: ExtensionRequest): void {
    // necessary for cancel button in add-extension dialog
    if (data.name === undefined) {
      return;
    }
    this.backendService.sendCreateExtensionRequest(data).subscribe({
      next: response => {
        console.log(response);
        this.messageService.showSuccessMessage(
          'added',
          'Extension',
          response.extension.id
        );
        if (response.extension.project_id > 0) {
          this.storeService.projectExtensions = [
            ...this.storeService.projectExtensions,
            response.extension,
          ];
        } else {
          this.storeService.sharedExtensions = [
            ...this.storeService.sharedExtensions,
            response.extension,
          ];
        }
        if (this.storeService.allExtensions !== null) {
          this.storeService.allExtensions = [
            ...this.storeService.allExtensions,
            response.extension,
          ];
        }
      },
      error: error => {
        this.messageService.showFailureMessage(
          `An error occurred while creating the extension. Please try again.
          ${error.message}`
        );
        console.error('Could not create extension', error);
      },
    });
  }

  toggle(extensionId: number): void {
    if (this.expandedItemIds.has(extensionId)) {
      this.expandedItemIds.delete(extensionId); // collapse the description
    } else {
      this.expandedItemIds.add(extensionId); // expand the description
    }
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
