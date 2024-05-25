import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProjectEditorComponent } from './project-editor.component';
import { StoreService } from '../../services/store.service';
import { BackendService } from '../../services/backend.service';
import { TuiDialogService } from '@taiga-ui/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { ProjectRequest, ProjectResponse } from '../../services/interfaces/project';
import { AddProjectComponent } from '../add-project/add-project.component';
import { PolymorpheusComponent } from '@tinkoff/ng-polymorpheus';
import { Injector } from '@angular/core';

describe('ProjectEditorComponent', () => {
  let component: ProjectEditorComponent;
  let fixture: ComponentFixture<ProjectEditorComponent>;
  let mockStoreService: Partial<StoreService>;
  let mockBackendService: Partial<BackendService>;
  let mockDialogService: jasmine.SpyObj<TuiDialogService>;
  let mockInjector: Injector;

  beforeEach(() => {
    mockStoreService = {
      projects: [],
    };

    mockBackendService = {
      getProjects: () => of({ projects: [] }),
      sendCreateProjectRequest: (requestData: ProjectRequest) => of({
        project: {
          id: 1,
          name: requestData.name,
          description: requestData.description,
          creation_date: new Date()
        }
      })
    };

    mockDialogService = jasmine.createSpyObj('TuiDialogService', ['open']);
    mockDialogService.open.and.returnValue(of({
      projectName: 'Test Project',
      projectDescription: 'Test Description'
    }));

    TestBed.configureTestingModule({
      declarations: [ProjectEditorComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: StoreService, useValue: mockStoreService },
        { provide: BackendService, useValue: mockBackendService },
        { provide: TuiDialogService, useValue: mockDialogService },
        { provide: Injector, useValue: mockInjector },
      ]
    });

    fixture = TestBed.createComponent(ProjectEditorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with projects from backend service', () => {
    const projects: ProjectResponse[] = [
      {
        id: 1,
        name: 'Test Project 1',
        description: 'Test Description 1',
        creation_date: new Date(),
      },
      {
        id: 2,
        name: 'Test Project 2',
        description: 'Test Description 2',
        creation_date: new Date(),
      },
    ];
    spyOn(mockBackendService as any, 'getProjects').and.returnValue(of({ projects }));
    component.ngOnInit();
    expect(component.storeService.projects).toEqual(projects);
  });

  it('should open a dialog and handle the response', () => {
    const dialogData = { projectName: 'New Project', projectDescription: 'New Description' };
    const projectResponse = {
      project: {
        id: 1,
        name: dialogData.projectName,
        description: dialogData.projectDescription,
        creation_date: new Date(),
      },
    };

    mockDialogService.open.and.returnValue(of(dialogData));
    spyOn(mockBackendService as any, 'sendCreateProjectRequest').and.returnValue(of(projectResponse));

    component.showDialog();

    expect(mockDialogService.open).toHaveBeenCalledWith(
        new PolymorpheusComponent(AddProjectComponent, component['injector']),
        jasmine.objectContaining({
          dismissible: true,
          label: 'Create Project',
          data: jasmine.objectContaining({ projectName: ' ', projectDescription: '' })
        })
    );

    expect(mockBackendService.sendCreateProjectRequest).toHaveBeenCalledWith({
      name: dialogData.projectName,
      description: dialogData.projectDescription,
    });

    expect(component.storeService.projects).toContain(projectResponse.project);
  });

  it('should format date correctly', () => {
    const date = new Date(2022, 1, 1, 13, 30);
    const formattedDate = component.formatDate(date);
    expect(formattedDate).toEqual('01.02.2022 - 13:30 Uhr');
  });
});
