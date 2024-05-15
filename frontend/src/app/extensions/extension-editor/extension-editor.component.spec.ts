import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { StoreService } from '../../services/store.service';
import { BackendService } from '../../services/backend.service';
import { ExtensionEditorComponent } from './extension-editor.component';
import { ExtensionsAPIResponse } from '../../services/interfaces/extension';
import { ProjectsAPIResponse } from '../../services/interfaces/project';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TuiTableModule } from '@taiga-ui/addon-table';
import { TuiScrollbarModule } from '@taiga-ui/core';
import {TuiElasticContainerModule} from '@taiga-ui/kit';
import { TuiAlertService } from '@taiga-ui/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';

describe('ExtensionEditorComponent', () => {
  let component: ExtensionEditorComponent;
  let fixture: ComponentFixture<ExtensionEditorComponent>;
  let storeService: StoreService;
  let backendService: BackendService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExtensionEditorComponent],
      providers: [StoreService, BackendService],
      imports: [HttpClientTestingModule, TuiTableModule, TuiScrollbarModule, TuiElasticContainerModule, TuiAlertService, Router, FormControl, FormGroup],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtensionEditorComponent);
    component = fixture.componentInstance;
    storeService = TestBed.inject(StoreService);
    backendService = TestBed.inject(BackendService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load extensions on init', () => {
    const mockExtensions: ExtensionsAPIResponse = {
      extensions: [
        {
          id: 1,
          project_id: 1,
          name: 'extension1',
          scope: 'scope1',
          description: 'description1',
          creation_date: new Date(),
          item_count: 1,
        },
        {
          id: 2,
          project_id: 2,
          name: 'extension2',
          scope: 'scope2',
          description: 'description2',
          creation_date: new Date(),
          item_count: 2,
        },
      ],
    };
    spyOn(backendService, 'getExtensions').and.returnValue(of(mockExtensions));

    component.ngOnInit();

    expect(storeService.allExtensions).toEqual(mockExtensions.extensions);
  });

  it('should load projects on init', () => {
    const mockProjects: ProjectsAPIResponse = {
      projects: [
        {
          id: 1,
          name: 'project1',
          description: 'description1',
          creation_date: new Date(),
        },
        {
          id: 2,
          name: 'project2',
          description: 'description2',
          creation_date: new Date(),
        },
      ],
    };
    spyOn(backendService, 'getProjects').and.returnValue(of(mockProjects));

    component.ngOnInit();

    expect(storeService.projects).toEqual(mockProjects.projects);
  });

  it('should return project name for given id', () => {
    const mockProjects: ProjectsAPIResponse = {
      projects: [
        {
          id: 1,
          name: 'project1',
          description: 'description1',
          creation_date: new Date(),
        },
        {
          id: 2,
          name: 'project2',
          description: 'description2',
          creation_date: new Date(),
        },
      ],
    };

    storeService.projects = mockProjects.projects;

    const projectName = component.getProjectName(1);

    expect(projectName).toEqual('project1');
  });

  it('should return undefined if project id does not exist', () => {
    const mockProjects: ProjectsAPIResponse = {
      projects: [
        {
          id: 1,
          name: 'project1',
          description: 'description1',
          creation_date: new Date(),
        },
        {
          id: 2,
          name: 'project2',
          description: 'description2',
          creation_date: new Date(),
        },
      ],
    };
    storeService.projects = mockProjects.projects;

    const projectName = component.getProjectName(3);

    expect(projectName).toBeUndefined();
  });
});
