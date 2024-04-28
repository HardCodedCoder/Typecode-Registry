import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { share } from 'rxjs/operators';
import { ItemEditorComponent } from './item-editor.component';
import { TuiDialogService, TuiScrollbarModule } from '@taiga-ui/core';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { TuiLetModule } from '@taiga-ui/cdk';
import { TuiTagModule } from '@taiga-ui/kit';

describe('ItemEditorComponent', () => {
  let component: ItemEditorComponent;
  let fixture: ComponentFixture<ItemEditorComponent>;
  let mockDialogService: jasmine.SpyObj<TuiDialogService>;
  let mockBackendService: jasmine.SpyObj<BackendService>;
  let mockStoreService: jasmine.SpyObj<StoreService>;
  //let mockAlertService: jasmine.SpyObj<TuiAlertService>;

  beforeEach(async () => {
    mockDialogService = jasmine.createSpyObj('TuiDialogService', ['open']);
    mockDialogService.open.and.returnValue(of({}).pipe(share()));
    mockBackendService = jasmine.createSpyObj('BackendService', [
      'sendCreateItemRequest',
      'getItems',
      'getExtensions',
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
    mockStoreService = jasmine.createSpyObj('StoreService', [
      'getSharedExtensionId',
      'getProjectExtensionId',
    ]);
    mockStoreService.getSharedExtensionId.and.returnValue(1);
    mockStoreService.getProjectExtensionId.and.returnValue(1);

    //mockAlertService = jasmine.createSpyObj('AlertService', ['open']);

    await TestBed.configureTestingModule({
      declarations: [ItemEditorComponent],
      imports: [
        TuiScrollbarModule,
        TuiTableModule,
        CdkVirtualScrollViewport,
        ScrollingModule,
        TuiLetModule,
        TuiTagModule,
        CdkFixedSizeVirtualScroll,
      ],
      providers: [
        { provide: TuiDialogService, useValue: mockDialogService },
        { provide: BackendService, useValue: mockBackendService },
        { provide: StoreService, useValue: mockStoreService },
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
      tableName: formData.itemTable,
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

  /*
  it('should open confirmation dialog when remove method is called', () => {
    const item = {
      scope: 'Shared',
      project: 'Project A',
      extension: 'Extension A',
      item_name: 'Item A1',
      item_table_name: 'Table A1',
      typecode: 20000,
    };

    mockDialogService.open.and.returnValue(of(true));

    component.remove(item);

    expect(mockDialogService.open).toHaveBeenCalledOnceWith(TUI_PROMPT, {
      label: 'Do you really want to delete this item?',
      size: 'm',
      data: {
        content: `Item ${item.item_name} in table ${item.item_table_name} with typecode ${item.typecode}.`,
        yes: 'REMOVE',
        no: 'Cancel',
      },
    });
  });

  it('should call deleteItem method when user confirms deletion', () => {
    const item = {
      id: 1,
      scope: 'Shared',
      project: 'Project A',
      extension: 'Extension A',
      item_name: 'Item A1',
      item_table_name: 'Table A1',
      typecode: 20000,
    };

    mockDialogService.open.and.returnValue(of(true));

    component.remove(item);

    expect(mockBackendService.deleteItem).toHaveBeenCalledWith(item.id);
  });

  it('should not call deleteItem method when user cancels deletion', () => {
    const item = {
      scope: 'Shared',
      project: 'Project A',
      extension: 'Extension A',
      item_name: 'Item A1',
      item_table_name: 'Table A1',
      typecode: 20000,
    };

    mockDialogService.open.and.returnValue(of(false));

    component.remove(item);

    expect(mockBackendService.deleteItem).not.toHaveBeenCalled();
  });

  it('should call alertService.open with success message after deletion', () => {
    const item = {
      id: 1,
      scope: 'Shared',
      project: 'Project A',
      extension: 'Extension A',
      item_name: 'Item A1',
      item_table_name: 'Table A1',
      typecode: 20000,
    };

    mockDialogService.open.and.returnValue(of(true));

    component.remove(item);

    expect(mockAlertService.open).toHaveBeenCalledWith(
      `Item with id: ${item.id} deleted!`,
      {
        label: '🎉 Success 🎉',
        status: 'success',
      }
    );
  });
   */
});
