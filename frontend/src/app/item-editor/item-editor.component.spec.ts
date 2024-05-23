import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { share } from 'rxjs/operators';
import { ItemEditorComponent } from './item-editor.component';
import {
  TuiAlertService,
  TuiDialogService,
  TuiScrollbarModule,
  TuiTextfieldControllerModule,
  TuiNotificationModule,
} from '@taiga-ui/core';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiLetModule } from '@taiga-ui/cdk';
import { TuiTagModule, TuiInputModule } from '@taiga-ui/kit';
import { ItemResponse } from '../services/interfaces/items';
import { MessageService } from '../services/message.service';

describe('ItemEditorComponent', () => {
  let component: ItemEditorComponent;
  let fixture: ComponentFixture<ItemEditorComponent>;
  let mockDialogService: jasmine.SpyObj<TuiDialogService>;
  let mockBackendService: jasmine.SpyObj<BackendService>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  let mockAlertService: jasmine.SpyObj<TuiAlertService>;
  let messageServiceMock: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    mockDialogService = jasmine.createSpyObj('TuiDialogService', ['open']);
    mockDialogService.open.and.returnValue(of({}).pipe(share()));
    mockBackendService = jasmine.createSpyObj('BackendService', [
      'sendCreateItemRequest',
      'getItems',
      'getExtensions',
      'deleteItem',
      'getProjects',
    ]);
    mockBackendService.getItems.and.returnValue(
      of({
        items: [
          {
            id: 1,
            scope: 'Project',
            project: 'Project A',
            name: 'Item A',
            table_name: 'Table A',
            extension_id: 1,
            typecode: 1,
            creation_date: new Date(),
          },
          {
            id: 2,
            scope: 'Shared',
            project: '',
            name: 'Item A',
            table_name: 'Table A',
            extension_id: 2,
            typecode: 1,
            creation_date: new Date(),
          },
        ],
      })
    );
    mockBackendService.sendCreateItemRequest.and.returnValue(
      of({
        item: {
          id: 1,
          scope: 'Project',
          project: 'Project A',
          name: 'Non-Shared Item',
          table_name: 'Non-Shared Table',
          extension_id: 2,
          typecode: 1,
          creation_date: new Date(),
        },
      })
    );
    mockBackendService.getExtensions.withArgs('Shared').and.returnValue(
      of({
        extensions: [
          {
            id: 1,
            name: 'Extension 1',
            project_id: 0,
            scope: 'Shared',
            description: 'Test extension',
            creation_date: new Date(''),
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
    mockBackendService.getExtensions.withArgs('Project').and.returnValue(
      of({
        extensions: [
          {
            id: 1,
            name: 'Extension 1',
            project_id: 1,
            scope: 'Project',
            description: 'Test extension',
            creation_date: new Date(''),
          },
          {
            id: 2,
            name: 'Extension 2',
            project_id: 2,
            scope: 'Project',
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

    messageServiceMock = jasmine.createSpyObj('MessageService', [
      'showSuccessMessage',
      'showFailureMessage',
    ]);

    await TestBed.configureTestingModule({
      declarations: [ItemEditorComponent],
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
        { provide: MessageService, useValue: messageServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ItemEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open dialog on showDialog', () => {
    component.showDialog();
    expect(mockDialogService.open).toHaveBeenCalled();
  });

  it('should send create item request when dialog closes with data', () => {
    const formData = {
      itemName: 'Test Item',
      itemTable: 'Test Table',
      extensionScope: 'Shared',
      extensionComboBox: 'Test ComboBox',
      projectComboBox: 'Test Project',
    };
    const extensionId = 1;
    mockDialogService.open.and.returnValue(of(formData).pipe(share()));
    mockStoreService.getSharedExtensionId.and.returnValue(extensionId);
    mockBackendService.sendCreateItemRequest.and.returnValue(
      of({
        item: {
          id: 1,
          scope: 'Project',
          project: 'Project A',
          name: 'Non-Shared Item',
          table_name: 'Non-Shared Table',
          extension_id: 2,
          typecode: 1,
          creation_date: new Date(),
        },
      })
    );
    mockBackendService.getItems.and.returnValue(
      of({
        items: [
          {
            id: 1,
            scope: 'Project',
            project: 'Project A',
            name: 'Item A',
            table_name: 'Table A',
            extension_id: 1,
            typecode: 1,
            creation_date: new Date(),
          },
          {
            id: 2,
            scope: 'Shared',
            project: '',
            name: 'Item A',
            table_name: 'Table A',
            extension_id: 2,
            typecode: 1,
            creation_date: new Date(),
          },
        ],
      })
    );

    component.showDialog();

    expect(mockStoreService.getSharedExtensionId).toHaveBeenCalledWith(
      formData.extensionComboBox
    );
    expect(mockBackendService.sendCreateItemRequest).toHaveBeenCalledWith({
      name: formData.itemName,
      table_name: formData.itemTable,
      extension_id: extensionId,
    });
  });

  it('should handle non-shared extension scope correctly', () => {
    const formData = {
      itemName: 'Non-Shared Item',
      itemTable: 'Non-Shared Table',
      extensionScope: 'Project', // Non-shared scope
      extensionComboBox: 'Test ComboBox',
      projectComboBox: 'Test Project',
    };
    const extensionId = 2;
    mockDialogService.open.and.returnValue(of(formData).pipe(share()));
    mockStoreService.getProjectExtensionId.and.returnValue(extensionId);
    mockBackendService.sendCreateItemRequest.and.returnValue(
      of({
        item: {
          id: 1,
          scope: 'Project',
          project: 'Project A',
          name: 'Non-Shared Item',
          table_name: 'Non-Shared Table',
          extension_id: 2,
          typecode: 1,
          creation_date: new Date(),
        },
      })
    );

    component.showDialog();

    expect(mockStoreService.getProjectExtensionId).toHaveBeenCalledWith(
      formData.projectComboBox,
      formData.extensionComboBox
    );
  });

  it('should close dialog correctly', () => {
    const dialogObservable = of({}).pipe(share());
    const subscribeSpy = spyOn(dialogObservable, 'subscribe').and.callThrough();
    mockDialogService.open.and.returnValue(dialogObservable);

    component.showDialog();

    expect(subscribeSpy).toHaveBeenCalled();
    expect(mockDialogService.open).toHaveBeenCalled();
  });

  it('should return the correct extension name for project extensions', () => {
    const extensionId = 1;
    const extensionName = 'Extension 1';
    mockStoreService.projectExtensions = [
      {
        id: extensionId,
        name: extensionName,
        project_id: 0,
        scope: 'Shared',
        description: 'Test extension',
        creation_date: new Date(),
      },
    ];
    const result = component.getExtensionName(extensionId);
    expect(result).toEqual(extensionName);
  });

  it('should return the correct extension name for shared extensions', () => {
    const extensionId = 2;
    const extensionName = 'Extension 2';
    mockStoreService.sharedExtensions = [
      {
        id: extensionId,
        name: extensionName,
        project_id: 0,
        scope: 'Shared',
        description: 'Test extension',
        creation_date: new Date(),
      },
    ];
    const result = component.getExtensionName(extensionId);
    expect(result).toEqual(extensionName);
  });

  it('should return undefined if the extension is not found', () => {
    const extensionId = 3;
    mockStoreService.projectExtensions = [];
    mockStoreService.sharedExtensions = [];
    const result = component.getExtensionName(extensionId);
    expect(result).toBeUndefined();
  });

  it('should not delete the item if the user cancels the operation', () => {
    const item: ItemResponse = {
      id: 3,
      scope: 'Project',
      project: 'Project A',
      extension_id: 2,
      name: 'Test Item',
      table_name: 'Test Table',
      typecode: 2,
      creation_date: new Date(),
    };

    mockDialogService.open.and.returnValue(of(false)); // user clicks cancel.

    component.onDeleteItem(item);

    expect(mockBackendService.deleteItem).not.toHaveBeenCalled();
  });

  it('should update items list after deletion on successful backend response', () => {
    // Prepare initial list of items in the StoreService
    mockStoreService.items = [
      {
        id: 1,
        scope: 'Project',
        project: 'Project A',
        extension_id: 1,
        name: 'Item 1',
        table_name: 'Table 1',
        typecode: 101,
        creation_date: new Date('2023-01-01'),
      },
      {
        id: 2,
        scope: 'Project',
        project: 'Project B',
        extension_id: 2,
        name: 'Item 2',
        table_name: 'Table 2',
        typecode: 102,
        creation_date: new Date('2023-01-02'),
      },
    ];

    const initialItems: ItemResponse[] = [...mockStoreService.items];
    const itemToDelete: ItemResponse = initialItems[0];

    // User confirms the deletion
    mockDialogService.open.and.returnValue(of(true));
    // Simulate successful backend deletion response
    mockBackendService.deleteItem.and.returnValue(of({ status: 204 }));

    // Execute onDeleteItem function
    component.onDeleteItem(itemToDelete);

    // Verify that items list in StoreService is updated
    expect(mockStoreService.items.length).toBeLessThan(initialItems.length);
    expect(
      mockStoreService.items.find(item => item.id === itemToDelete.id)
    ).toBeUndefined();
  });

  it('should handle failure response from backend service', () => {
    const itemToDelete: ItemResponse = {
      id: 1,
      scope: 'Project',
      project: 'Project A',
      extension_id: 1,
      name: 'Item 1',
      table_name: 'Table 1',
      typecode: 101,
      creation_date: new Date('2023-01-01'),
    };

    // User confirms the deletion
    mockDialogService.open.and.returnValue(of(true));
    // Simulate backend failure response
    mockBackendService.deleteItem.and.returnValue(of({ status: 500 }));

    // Execute onDeleteItem function
    component.onDeleteItem(itemToDelete);
  });

  it('should log an error when backend service fails', () => {
    const error = new Error('Backend error');
    mockBackendService.getItems.and.returnValue(throwError(() => error));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith('Could not fetch items', error);
  });

  it('should display "No items available" when there are no item details', () => {
    component.store.items = null;
    fixture.detectChanges();

    const noDataContent =
      fixture.debugElement.nativeElement.querySelector('h1');
    expect(noDataContent.textContent).toContain('No items available.');
  });

  beforeEach(() => {
    // Mocking getExtensions for 'Project'
    mockBackendService.getExtensions
      .withArgs('Project')
      .and.returnValue(
        throwError(() => new Error('Failed to fetch project extensions'))
      );

    // Mocking getProjects
    mockBackendService.getProjects.and.returnValue(
      throwError(() => new Error('Failed to fetch projects'))
    );
  });

  it('should log an error when failing to fetch project extensions', () => {
    spyOn(console, 'error'); // Spy on console.error to verify if it is called

    component.ngOnInit(); // Assuming these subscriptions happen in ngOnInit

    expect(mockBackendService.getExtensions).toHaveBeenCalledWith('Project');
    expect(console.error).toHaveBeenCalledWith(
      'Could not fetch project extensions:',
      jasmine.any(Error)
    );
  });

  it('should log an error when failing to fetch projects', () => {
    spyOn(console, 'error');

    component.ngOnInit(); // trigger the method where subscriptions occur

    expect(mockBackendService.getProjects).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Could not fetch projects:',
      jasmine.any(Error)
    );
  });
});
