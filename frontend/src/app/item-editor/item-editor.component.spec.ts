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
});
