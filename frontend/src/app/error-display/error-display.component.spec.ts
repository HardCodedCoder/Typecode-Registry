import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TuiScrollbarModule } from '@taiga-ui/core';
import { TuiLetModule } from '@taiga-ui/cdk';
import { TuiTagModule } from '@taiga-ui/kit';
import { ErrorDisplayComponent } from './error-display.component';
import { TuiTableModule } from '@taiga-ui/addon-table';

describe('ErrorDisplayComponent', () => {
  let component: ErrorDisplayComponent;
  let fixture: ComponentFixture<ErrorDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ErrorDisplayComponent],
      imports: [TuiScrollbarModule, TuiTableModule, TuiLetModule, TuiTagModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
