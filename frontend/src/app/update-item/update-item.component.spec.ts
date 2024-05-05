import { ComponentFixture, TestBed } from '@angular/core/testing';
import { POLYMORPHEUS_CONTEXT } from '@tinkoff/ng-polymorpheus';
import { UpdateItemComponent } from './update-item.component';
import { TuiErrorModule } from '@taiga-ui/core';
import { TuiInputModule, TuiFieldErrorPipeModule } from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';

describe('UpdateItemComponent', () => {
  let component: UpdateItemComponent;
  let fixture: ComponentFixture<UpdateItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UpdateItemComponent],
      imports: [
        TuiInputModule,
        TuiFieldErrorPipeModule,
        TuiErrorModule,
        ReactiveFormsModule,
      ],
      providers: [
        { provide: POLYMORPHEUS_CONTEXT, useValue: {} }, // Provide a mock object or a suitable mock service
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
