import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StoreService } from '../services/store.service';
import { BackendService } from '../services/backend.service';
import { ExtensionEditorComponent } from './extension-editor.component';
import { ProjectsAPIResponse } from '../services/interfaces/project';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  TuiAlertService,
  TuiScrollbarModule,
  TuiTextfieldControllerModule,
} from '@taiga-ui/core';
import { TuiElasticContainerModule, TuiInputModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiLetModule } from '@taiga-ui/cdk';

describe('ExtensionEditorComponent', () => {
  let component: ExtensionEditorComponent;
  let fixture: ComponentFixture<ExtensionEditorComponent>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  let mockBackendService: jasmine.SpyObj<BackendService>;
  let mockAlertService: jasmine.SpyObj<TuiAlertService>;

  beforeEach(async () => {
    mockBackendService = jasmine.createSpyObj('BackendService', [
      'getExtensions',
      'getProjects',
    ]);
    mockBackendService.getExtensions.and.returnValue(
      of({
        extensions: [
          {
            id: 1,
            name: 'Extension 1',
            project_id: 0,
            scope: 'Shared',
            description: 'Test extension',
            creation_date: new Date(),
          },
          {
            id: 2,
            name: 'Extension 2',
            project_id: 0,
            scope: 'Shared',
            description: 'Test extension',
            creation_date: new Date(),
          },
        ],
      })
    );
    mockBackendService.getProjects.and.returnValue(of({ projects: [] }));
    mockStoreService = jasmine.createSpyObj('StoreService', [
      'getSharedExtensionId',
      'getProjectExtensionId',
    ]);
    mockStoreService.getSharedExtensionId.and.returnValue(1);
    mockStoreService.getProjectExtensionId.and.returnValue(1);
    mockAlertService = jasmine.createSpyObj('TuiAlertService', ['open']);
    mockAlertService.open.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      declarations: [ExtensionEditorComponent],
      providers: [
        { provide: BackendService, useValue: mockBackendService },
        { provide: StoreService, useValue: mockStoreService },
      ],
      imports: [
        HttpClientTestingModule,
        TuiTableModule,
        TuiScrollbarModule,
        TuiElasticContainerModule,
        TuiInputModule,
        ReactiveFormsModule,
        TuiTextfieldControllerModule,
        TuiLetModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExtensionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load extensions on init', () => {
    component.ngOnInit();
    expect(mockBackendService.getExtensions).toHaveBeenCalled();
    expect(component.storeService.allExtensions!.length).toBeGreaterThan(0);
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
    mockBackendService.getProjects.and.returnValue(of(mockProjects));
    component.ngOnInit();
    expect(mockStoreService.projects).toEqual(mockProjects.projects);
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

    mockStoreService.projects = mockProjects.projects;

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
    mockStoreService.projects = mockProjects.projects;

    const projectName = component.getProjectName(3);

    expect(projectName).toBeUndefined();
  });

  it('should display "No extensions available" when there are no extensions', () => {
    component.storeService.allExtensions = null;
    fixture.detectChanges();

    const noDataContent =
      fixture.debugElement.nativeElement.querySelector('h1');
    expect(noDataContent.textContent).toContain('No extensions available.');
  });

  it('should handle failure when fetching items', () => {
    const error = new Error('Backend error');
    mockBackendService.getExtensions.and.returnValue(throwError(() => error));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith(
      'Could not fetch extensions',
      error
    );
  });

  it('should display "No items available" when there are no item details', () => {
    component.storeService.allExtensions = null;
    fixture.detectChanges();

    const noDataContent =
      fixture.debugElement.nativeElement.querySelector('h1');
    expect(noDataContent.textContent).toContain('No extensions available.');
  });

  it('should add an ID to expandedItemIds if it does not exist', () => {
    const testId = 1;
    component.toggle(testId);
    expect(component.expandedItemIds.has(testId)).toBeTrue();
  });

  it('should remove an ID from expandedItemIds if it already exists', () => {
    const testId = 1;
    component.expandedItemIds.add(testId); // Pre-add the ID
    component.toggle(testId); // Should remove the ID
    expect(component.expandedItemIds.has(testId)).toBeFalse();
  });
});
