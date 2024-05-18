import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExtensionComponent } from './add-extension.component';
import { BackendService } from '../services/backend.service';
import { StoreService } from '../services/store.service';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from '../services/message.service';
import {
  TuiFieldErrorPipeModule,
  TuiInputModule,
  TuiRadioBlockModule,
} from '@taiga-ui/kit';
import { TuiErrorModule } from '@taiga-ui/core';
import { of } from 'rxjs';

describe('AddExtensionComponent', () => {
  //let component: AddExtensionComponent;
  let fixture: ComponentFixture<AddExtensionComponent>;
  let backendServiceMock: any;
  let storeServiceMock: any;
  let dialogContextMock: any;
  let messageServiceMock: jasmine.SpyObj<MessageService>;

  beforeEach(async () => {
    backendServiceMock = jasmine.createSpyObj('BackendService', [
      'getProjects',
    ]);
    backendServiceMock.getProjects.and.returnValue(of({ projects: [] }));

    storeServiceMock = jasmine.createSpyObj('StoreService', [], {
      // Mock the projectNames getter to return an array of project names
      projectNames: ['Project A', 'Project B'],
    });
    dialogContextMock = jasmine.createSpyObj('TuiDialogContext', [
      'completeWith',
    ]);
    messageServiceMock = jasmine.createSpyObj('MessageService', [
      'showSuccessMessage',
      'showFailureMessage',
    ]);

    await TestBed.configureTestingModule({
      declarations: [AddExtensionComponent],
      providers: [
        { provide: BackendService, useValue: backendServiceMock },
        { provide: StoreService, useValue: storeServiceMock },
        { provide: POLYMORPHEUS_CONTEXT, useValue: dialogContextMock },
        { provide: MessageService, useValue: messageServiceMock },
        FormBuilder,
      ],
      imports: [
        TuiInputModule,
        TuiErrorModule,
        TuiFieldErrorPipeModule,
        TuiRadioBlockModule,
        ReactiveFormsModule,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddExtensionComponent);
    // component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /*
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  */
});
