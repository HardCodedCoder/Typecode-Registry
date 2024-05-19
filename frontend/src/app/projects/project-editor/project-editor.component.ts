import { Component, Inject, OnInit } from '@angular/core';
import { StoreService } from '../../services/store.service';
import { BackendService } from '../../services/backend.service';
import { TuiAlertService } from '@taiga-ui/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { ProjectResponse } from '../../services/interfaces/project';

@Component({
  selector: 'app-project-editor',
  templateUrl: './project-editor.component.html',
  styleUrl: './project-editor.component.scss',
})
export class ProjectEditorComponent implements OnInit {
  readonly MAX_DESCRIPTION_LENGTH = 40;
  expandedItemId: number | null = null;
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
    @Inject(TuiAlertService) private readonly alertService: TuiAlertService,
    @Inject(Router) private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.backendService.getProjects().subscribe(projects => {
      this.storeService.projects = projects.projects;
      console.log(this.storeService.projects);
    });
  }

  showDialog() {}

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

  onEditProject(project: ProjectResponse) {}

  onDeleteProject(project: ProjectResponse) {}
}
