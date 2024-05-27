import { Component, Inject, Injector, OnInit } from '@angular/core';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { TuiDialogService } from '@taiga-ui/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  ProjectResponse,
  ProjectUpdateRequest,
} from '../services/interfaces/project';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { catchError, throwError } from 'rxjs';
import { MessageService } from '../services/message.service';
import {
  ProjectFormData,
  UpdateExtensionFormData,
  UpdateProjectFormData,
} from '../services/interfaces/formdata';
import { AddProjectComponent } from '../add-project/add-project.component';
import { UpdateProjectComponent } from '../update-project/update-project.component';
import { TUI_PROMPT, TuiPromptData } from '@taiga-ui/kit';

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

  formattedDate(dateString: Date): string {
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
    if (project === undefined || project.id === 0) {
      this.messageService.showFailureMessage(
        'Error: Unexpected internal error! Please restart application!'
      );
      return;
    }

    const data: UpdateProjectFormData = {
      project: project,
    };

    const dialog$ = this.dialogs
      .open<UpdateExtensionFormData>(
        new PolymorpheusComponent(UpdateProjectComponent, this.injector),
        {
          dismissible: true,
          label: 'Update Project',
          data: data,
        }
      )
      .pipe(
        catchError(err => {
          console.error('project-editor: Error opening dialog:', err);
          return throwError(err);
        })
      );

    dialog$.subscribe(dialogData => {
      if (dialogData.error !== undefined) {
        if (dialogData.error.message === 'Cancelled')
          this.messageService.showInformationNotification(
            dialogData.error.message
          );
        else this.messageService.showFailureMessage(dialogData.error.message);
        return;
      }

      const requestData: ProjectUpdateRequest = {};
      if (dialogData.new_name !== undefined)
        requestData.name = dialogData.new_name;
      if (dialogData.new_description !== undefined)
        requestData.description = dialogData.new_description;

      this.backendService.updateProject(project.id, requestData).subscribe({
        next: response => {
          console.log('Project updated successfully', response);
          this.messageService.showSuccessMessage(
            'updated',
            'project',
            project.id
          );

          if (requestData.name !== undefined) project.name = requestData.name;
          if (requestData.description !== undefined)
            project.description = requestData.description;
        },
        error: error => {
          console.error('Error updating project', error);
          this.messageService.showFailureMessage('Error updating project');
        },
      });
    });
  }

  onDeleteProject(project: ProjectResponse) {
    const data: TuiPromptData = {
      content: `This will delete the project <b>${project.name}</b>.`,
      yes: 'Remove',
      no: 'Cancel',
    };

    this.dialogs
      .open<boolean>(TUI_PROMPT, {
        label: 'Do you really want to delete this project?',
        size: 'm',
        data,
      })
      .subscribe(response => {
        if (response) {
          this.backendService.deleteProject(project.id).subscribe({
            next: response => {
              if (response.status === 204) {
                console.log('Received response 204 from backend');
                this.messageService.showSuccessMessage(
                  `deleted project: ${project.name}`,
                  '',
                  undefined
                );
                if (this.storeService.projects != null) {
                  this.storeService.projects =
                    this.storeService.projects.filter(i => i.id !== project.id);
                }
              } else {
                this.messageService.showFailureMessage(
                  `Could not delete project: ${project.id}! Received status code: ${response.status}`
                );
              }
            },
            error: error =>
              this.messageService.showFailureMessage(
                `Could not delete project: ${project.id}! Error: ${error}`
              ),
          });
        }
      });
  }
}
