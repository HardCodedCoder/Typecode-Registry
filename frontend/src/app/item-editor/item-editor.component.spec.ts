import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { share } from 'rxjs/operators';
import { ItemEditorComponent } from './item-editor.component';
import { TuiDialogService } from '@taiga-ui/core';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';

describe('ItemEditorComponent', () => {
  let component: ItemEditorComponent;
  let fixture: ComponentFixture<ItemEditorComponent>;
  let mockDialogService: jasmine.SpyObj<TuiDialogService>;
  let mockBackendService: jasmine.SpyObj<BackendService>;
  let mockStoreService: jasmine.SpyObj<StoreService>;

  beforeEach(async () => {
    mockDialogService = jasmine.createSpyObj('TuiDialogService', ['open']);
    mockBackendService = jasmine.createSpyObj('BackendService', [
      'sendCreateItemRequest',
    ]);
    mockStoreService = jasmine.createSpyObj('StoreService', [
      'getSharedExtensionId',
      'getProjectExtensionId',
    ]);

    await TestBed.configureTestingModule({
      declarations: [ItemEditorComponent],
      providers: [
        { provide: TuiDialogService, useValue: mockDialogService },
        { provide: BackendService, useValue: mockBackendService },
        { provide: StoreService, useValue: mockStoreService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ItemEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open dialog on showDialog', () => {
    mockDialogService.open.and.returnValue(of({}).pipe(share()));
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
          name: 'Test Item',
          typecode: 1,
          table_name: 'Test Table',
          extensionId: 1,
          creation_date: '2022-01-01',
        },
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
          name: 'Non-Shared Item',
          typecode: 1,
          table_name: 'Non-Shared Table',
          extensionId: 2,
          creation_date: '2022-01-01',
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
  });
});
