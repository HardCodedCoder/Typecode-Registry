import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { UpdateItemComponent } from './update-item.component';
import { ElementRef, Renderer2 } from '@angular/core';
import { TuiErrorModule } from '@taiga-ui/core';
import { TuiFieldErrorPipeModule, TuiInputModule } from '@taiga-ui/kit';

describe('UpdateItemComponent', () => {
  let component: UpdateItemComponent;
  let fixture: ComponentFixture<UpdateItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateItemComponent],
      imports: [
        ReactiveFormsModule,
        NoopAnimationsModule,
        TuiErrorModule,
        TuiFieldErrorPipeModule,
        TuiInputModule,
      ],
      providers: [
        {
          provide: POLYMORPHEUS_CONTEXT,
          useValue: {
            data: {
              item: {
                id: 1,
                scope: '',
                project: '',
                extension_id: 0,
                name: '',
                table_name: '',
                typecode: 0,
                creation_date: new Date(),
              },
              new_item_name: '',
              new_table_name: '',
            },
            completeWith: jasmine.createSpy('completeWith'),
          },
        },
        {
          provide: Renderer2,
          useValue: {
            setStyle: jasmine
              .createSpy('setStyle')
              .and.callFake((el, prop, value) => {
                console.log(`Setting style ${prop} to ${value} on element`, el);
              }),
          },
        },
        {
          provide: ElementRef,
          useValue: {
            nativeElement: {
              closest: jasmine.createSpy('closest').and.callFake(selector => {
                console.log('closest called with:', selector);
                if (selector === '.t-content') {
                  const fakeDiv = document.createElement('div');
                  fakeDiv.className = 't-content';
                  const h2 = document.createElement('h2');
                  fakeDiv.appendChild(h2);
                  return fakeDiv;
                }
                return null;
              }),
            },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UpdateItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with required validators', () => {
    const formGroup = component.form;
    const itemNameInput = formGroup.get('itemName');
    const itemTableInput = formGroup.get('itemTable');

    expect(formGroup).toBeTruthy();
    expect(itemNameInput).toBeTruthy();
    expect(itemNameInput?.errors?.['required']).toBeTruthy();
    expect(itemTableInput).toBeTruthy();
    expect(itemTableInput?.errors?.['required']).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    const itemNameControl = component.form.get('itemName');
    const itemTableControl = component.form.get('itemTable');

    expect(itemNameControl?.value).toEqual('');
    expect(itemTableControl?.value).toEqual('');
  });

  it('should update updateItemData on submit', () => {
    const itemNameControl = component.form.get('itemName');
    const itemTableControl = component.form.get('itemTable');

    itemNameControl?.setValue('Test Item');
    itemTableControl?.setValue('Test Table');

    component.submit();

    expect(component.updateItemData.new_item_name).toEqual('Test Item');
    expect(component.updateItemData.new_table_name).toEqual('Test Table');
  });
  it('should complete context with updateItemData on submit', () => {
    // Get the existing spy from the provider
    const completeWithSpy =
      TestBed.inject(POLYMORPHEUS_CONTEXT)['completeWith'];

    component.submit();

    expect(completeWithSpy).toHaveBeenCalledWith(component.updateItemData);
  });

  /*
  it('should apply styles to dialog and h2 elements', async () => {
    const fakeDialogElement = document.createElement('div');
    fakeDialogElement.className = 't-content';
    const h2 = document.createElement('h2');
    fakeDialogElement.appendChild(h2);

    const elementRefSpy = TestBed.inject(ElementRef);
    const rendererSpy = TestBed.inject(Renderer2);

    elementRefSpy.nativeElement.closest = () => fakeDialogElement;
    fakeDialogElement.querySelector = () => h2;

    component.applyDialogStyles(); // Direkt aufrufen statt ngAfterViewInit

    expect(rendererSpy.setStyle).toHaveBeenCalledWith(
        fakeDialogElement,
        'background-color',
        '#232528CC'
    );
    expect(rendererSpy.setStyle).toHaveBeenCalledWith(h2, 'color', 'white');
  });
*/
});
