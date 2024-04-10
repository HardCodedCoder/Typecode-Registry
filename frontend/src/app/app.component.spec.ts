import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';
import { TuiRootModule, TuiSvgModule } from '@taiga-ui/core';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent, SidebarMenuComponent],
      imports: [RouterModule.forRoot([]), TuiRootModule, TuiSvgModule],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Typecode Registry'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Typecode Registry');
  });

  it('should toggle isSidebarActive when SidebarMenuComponent emits toggleSidebar event', () => {
    const sidebarMenuComponent = fixture.debugElement.query(
      By.directive(SidebarMenuComponent)
    ).componentInstance as SidebarMenuComponent;

    expect(component.isSidebarActive).toBe(false); // initial value

    sidebarMenuComponent.toggleSidebar.emit(true);
    expect(component.isSidebarActive).toBe(true); // after emitting true

    sidebarMenuComponent.toggleSidebar.emit(false);
    expect(component.isSidebarActive).toBe(false); // after emitting false
  });
});
