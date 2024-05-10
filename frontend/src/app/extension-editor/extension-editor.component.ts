import { Component, Inject, OnInit } from '@angular/core';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { TuiAlertService } from '@taiga-ui/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

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
    @Inject(StoreService) public readonly storeService: StoreService,
    @Inject(BackendService) public readonly backendService: BackendService,
    @Inject(TuiAlertService) private readonly alertService: TuiAlertService,
    @Inject(Router) private readonly router: Router
  ) {}

  getProjectName(project_id: number): string | undefined {
    return this.storeService.projects.find(project => project.id === project_id)
      ?.name;
  }

  ngOnInit(): void {
    this.backendService.getExtensions().subscribe(extensions => {
      this.storeService.allExtensions = extensions.extensions;
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
    });

    this.backendService.getProjects().subscribe(projects => {
      this.storeService.projects = projects.projects;
      console.log(this.storeService.projects);
    });
  }

  showDialog(): void {
    console.log('Add Extension Dialog');
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
