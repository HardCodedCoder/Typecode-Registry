import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { ErrorDisplayComponent } from './error-display.component';
import {
  httpStatusCodes,
  HttpStatusDetails,
} from '../services/interfaces/http-status-codes';
import { TuiNotificationModule } from '@taiga-ui/core';

describe('ErrorDisplayComponent', () => {
  let component: ErrorDisplayComponent;
  let fixture: ComponentFixture<ErrorDisplayComponent>;
  const activatedRouteStub = {
    params: of({ code: '404' }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorDisplayComponent],
      imports: [RouterTestingModule, TuiNotificationModule],
      providers: [{ provide: ActivatedRoute, useValue: activatedRouteStub }],
    }).compileComponents();

    activatedRouteStub.params = of({ code: '404' });
    fixture = TestBed.createComponent(ErrorDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set error details based on route params', () => {
    const expectedErrorDetails: HttpStatusDetails = httpStatusCodes['404'];
    expect(component.errorDetails).toEqual(expectedErrorDetails);
  });

  it('should display the correct error message', () => {
    const compiled = fixture.debugElement.nativeElement;
    const h2Element = compiled.querySelector('h2');
    expect(h2Element.textContent).toContain(httpStatusCodes['404'].errorText);
  });

  it('should handle unknown error codes gracefully', () => {
    activatedRouteStub.params = of({ code: '999' });

    fixture = TestBed.createComponent(ErrorDisplayComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const expectedErrorDetails: HttpStatusDetails = httpStatusCodes['520'];
    expect(component.errorDetails).toEqual(expectedErrorDetails);
  });
});
