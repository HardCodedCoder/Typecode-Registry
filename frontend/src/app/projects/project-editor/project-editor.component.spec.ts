import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { share } from 'rxjs/operators';
import { ProjectEditorComponent } from './project-editor.component';
import {
  TuiAlertService,
  TuiDialogService,
  TuiScrollbarModule,
  TuiTextfieldControllerModule,
  TuiNotificationModule,
} from '@taiga-ui/core';
import { BackendService } from '../../services/backend.service';
import { StoreService } from '../../services/store.service';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiLetModule } from '@taiga-ui/cdk';
import { TuiTagModule, TuiInputModule } from '@taiga-ui/kit';
import { ProjectResponse } from '../../services/interfaces/project';

describe('ProjectEditorComponent', () => {
  let component: ProjectEditorComponent;
  let fixture: ComponentFixture<ProjectEditorComponent>;
  let mockDialogService: jasmine.SpyObj<TuiDialogService>;
  let mockBackendService: jasmine.SpyObj<BackendService>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  let mockAlertService: jasmine.SpyObj<TuiAlertService>;

  beforeEach(async () => {
    mockDialogService = jasmine.createSpyObj('TuiDialogService', ['open']);
    mockDialogService.open.and.returnValue(of({}).pipe(share()));
    mockBackendService = jasmine.createSpyObj('BackendService', [
      'sendCreateProjectRequest',
      'getProjects',
      'deleteProject',
    ]);
    mockBackendService.getProjects.and.returnValue(
      of({
        projects: [
          {
            id: 1,
            name: 'Project A',
            description: 'Description A',
            creation_date: new Date(),
          },
          {
            id: 2,
            name: 'Project B',
            description: 'Description B',
            creation_date: new Date(),
          },
        ],
      })
    );
    mockBackendService.sendCreateProjectRequest.and.returnValue(
      of({
        project: {
          id: 1,
          name: 'New Project',
          description: 'New Project Description',
          creation_date: new Date(),
        },
      })
    );

    mockStoreService = jasmine.createSpyObj('StoreService', [], { projects: [] });
    mockAlertService = jasmine.createSpyObj('TuiAlertService', ['open']);
    mockAlertService.open.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [ProjectEditorComponent],
      imports: [
        TuiScrollbarModule,
        TuiTableModule,
        CdkVirtualScrollViewport,
        ScrollingModule,
        TuiLetModule,
        TuiTagModule,
        TuiInputModule,
        CdkFixedSizeVirtualScroll,
        ReactiveFormsModule,
        TuiTextfieldControllerModule,
        TuiNotificationModule,
      ],
      providers: [
        { provide: TuiDialogService, useValue: mockDialogService },
        { provide: BackendService, useValue: mockBackendService },
        { provide: StoreService, useValue: mockStoreService },
        { provide: TuiAlertService, useValue: mockAlertService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display projects in the table', () => {
    const compiled = fixture.debugElement.nativeElement;
    const projectRows = compiled.querySelectorAll('.project-row');
    expect(projectRows.length).toBe(2);
    expect(projectRows[0].textContent).toContain('Project A');
    expect(projectRows[1].textContent).toContain('Project B');
  });
  /*
    it('should update the table after adding a new project', () => {
      const newProject = {
        id: 3,
        name: 'Project C',
        description: 'Description C',
        creation_date: new Date(),     };
      /*
      mockBackendService.sendCreateProjectRequest.and.returnValue(
        of({ project: newProject })
      );
     component.addProject(newProject);
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    const projectRows = compiled.querySelectorAll('.project-row');
    expect(projectRows.length).toBe(3);
    expect(projectRows[2].textContent).toContain('Project C');
  });
*/
  it('should update the table after deleting a project', () => {
    const projectToDelete: ProjectResponse = {
      id: 1,
      name: 'Project A',
      description: 'Description A',
      creation_date: new Date(),
    };

    mockDialogService.open.and.returnValue(of(true));
    //mockBackendService.deleteProject.and.returnValue(of({ status: 204 }));
    component.onDeleteProject(projectToDelete);
    fixture.detectChanges();

    const compiled = fixture.debugElement.nativeElement;
    const projectRows = compiled.querySelectorAll('.project-row');
    expect(projectRows.length).toBe(1);
    expect(projectRows[0].textContent).toContain('Project B');
  });

  it('should display "No projects available" when there are no project details', () => {
    component.storeService.projects = [];
    fixture.detectChanges();

    const noDataContent =
      fixture.debugElement.nativeElement.querySelector('h1');
    expect(noDataContent.textContent).toContain('No projects available.');
  });
});
