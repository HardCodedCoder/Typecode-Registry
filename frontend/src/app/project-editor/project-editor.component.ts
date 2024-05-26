import { Component, Inject, Injector, OnInit } from '@angular/core';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { TuiDialogService } from '@taiga-ui/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ProjectResponse } from '../services/interfaces/project';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { catchError, throwError } from 'rxjs';
import { MessageService } from '../services/message.service';
import { ProjectFormData } from '../services/interfaces/formdata';
import { AddProjectComponent } from '../add-project/add-project.component';

@Component({
  selector: 'app-project-editor',
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.scss',
})
export class ProjectEditorComponent implements OnInit {
  searchForm = new FormGroup({
    search: new FormControl(''),
  });

  readonly columns: string[] = [
    'Name',
    'Description',
    'Creation Date',
    'Actions',
  ];

  constructor(
    @Inject(StoreService) public readonly storeService: StoreService,
    @Inject(BackendService) public readonly backendService: BackendService,
    @Inject(TuiDialogService) private readonly dialogs: TuiDialogService,
    @Inject(Injector) private readonly injector: Injector,
    @Inject(MessageService) private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.backendService.getProjects().subscribe(projects => {
      this.storeService.projects = projects.projects;
      console.log(this.storeService.projects);
    });
  }

  showDialog(): void {
    const data: ProjectFormData = {
      projectName: ' ',
      projectDescription: '',
    };
    const dialog$ = this.dialogs
      .open<ProjectFormData>(
        new PolymorpheusComponent(AddProjectComponent, this.injector),
        {
          dismissible: true,
          label: 'Create Project',
          data: data,
        }
      )
      .pipe(
        catchError(err => {
          console.error('project-editor: Error opening dialog:', err);
          return throwError(err);
        })
      );

    dialog$.subscribe({
      next: (data: ProjectFormData) => {
        console.log('project-editor: Dialog closed with data:', data);
        if (
          data.error?.error === true &&
          data.error?.message === 'cancelled by user'
        )
          return;

        const requestData = {
          name: data.projectName,
          description: data.projectDescription,
        };
        console.log(requestData);
        this.backendService
          .sendCreateProjectRequest(requestData)
          .subscribe(next => {
            if (this.storeService.projects !== null) {
              this.storeService.projects = [
                ...this.storeService.projects,
                next.project,
              ];
            }
            this.messageService.showSuccessMessage(
              'added',
              'Project',
              next.project.id
            );
          });
      },
      complete: () => {
        console.info('project-editor: Dialog closed');
      },
    });
  }

  formatDate(dateString: Date): string {
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

  onEditProject(project: ProjectResponse) {
    console.log(project);
  }

  onDeleteProject(project: ProjectResponse) {
    console.log(project);
  }
}
