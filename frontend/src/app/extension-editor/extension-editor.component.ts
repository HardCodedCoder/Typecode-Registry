import { Component, Inject, OnInit } from '@angular/core';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';

@Component({
  selector: 'app-extension-editor',
  templateUrl: './extension-editor.component.html',
  styleUrl: './extension-editor.component.scss',
})
export class ExtensionEditorComponent implements OnInit {
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
    @Inject(BackendService) public readonly backendService: BackendService
  ) {}

  getProjectName(project_id: number): string | undefined {
    return this.storeService.projects.find(project => project.id === project_id)
      ?.name;
  }

  ngOnInit(): void {
    this.backendService.getExtensions().subscribe(extensions => {
      this.storeService.allExtensions = extensions.extensions;
      console.log(this.storeService.allExtensions);
    });

    this.backendService.getProjects().subscribe(projects => {
      this.storeService.projects = projects.projects;
      console.log(this.storeService.projects);
    });
  }
}
