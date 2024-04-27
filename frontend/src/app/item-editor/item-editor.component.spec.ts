import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
      'getItemsDetails',
    ]);
    mockBackendService.getItemsDetails.and.returnValue(
      of({
        details: [
          {
            scope: 'Project',
            project: 'Project A',
            extension: 'Extension A',
            item_name: 'Item A',
            item_table_name: 'Table A',
            typecode: 1,
          },
          {
            scope: 'Shared',
            project: '',
            extension: 'Extension A',
            item_name: 'Item A',
            item_table_name: 'Table A',
            typecode: 1,
          },
        ],
      })
    );
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
          name: 'Test Item',
          typecode: 1,
          table_name: 'Test Table',
          extensionId: 1,
          creation_date: '2022-01-01',
        },
      })
    );
    mockBackendService.getItemsDetails.and.returnValue(
      of({
        details: [
          {
            scope: 'Project',
            project: 'Project A',
            extension: 'Extension A',
            item_name: 'Item A',
            item_table_name: 'Table A',
            typecode: 1,
          },
          {
            scope: 'Shared',
            project: '',
            extension: 'Extension A',
            item_name: 'Item A',
            item_table_name: 'Table A',
            typecode: 1,
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
    expect(mockDialogService.open).toHaveBeenCalled();
  });

  it('should log an error when backend service fails', () => {
    const error = new Error('Backend error');
    mockBackendService.getItemsDetails.and.returnValue(throwError(() => error));
    spyOn(console, 'error');

    component.ngOnInit();

    expect(console.error).toHaveBeenCalledWith('Could not fetch items', error);
  });

  it('should log a warning and navigate to error page when response.details is null and has not shown 204 error', () => {
    mockBackendService.getItemsDetails.and.returnValue(of({ details: null }));
    const navigateSpy = spyOn((component as any).router, 'navigate');
    const consoleWarnSpy = spyOn(console, 'warn');

    component.ngOnInit();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'NULL response: /items/details'
    );
    expect(navigateSpy).toHaveBeenCalledWith(['/error/204'], {
      state: { errorOrigin: '/items/details' },
    });
    expect(mockStoreService.hasShown204Error).toBe(true);
  });

  it('should show information notification when response.details is null and has already shown 204 error', () => {
    mockBackendService.getItemsDetails.and.returnValue(of({ details: null }));
    mockStoreService.hasShown204Error = true;
    const showInformationNotificationSpy = spyOn(
      component,
      'showInformationNotification' as any
    );

    component.ngOnInit();

    expect(showInformationNotificationSpy).toHaveBeenCalled();
  });

  it('should display "No items available" when there are no item details', () => {
    component.store.details = null;
    fixture.detectChanges();

    const noDataContent =
      fixture.debugElement.nativeElement.querySelector('h2');
    expect(noDataContent.textContent).toContain('No items available.');
  });
});
