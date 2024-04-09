import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarMenuComponent } from './sidebar-menu.component';
import { TuiSvgModule } from '@taiga-ui/core';
import { Component } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'tui-svg',
  template: '<div></div>',
})
class TuiSvgStubComponent {}

describe('SidebarMenuComponent', () => {
  let component: SidebarMenuComponent;
  let fixture: ComponentFixture<SidebarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarMenuComponent, TuiSvgStubComponent],
      imports: [TuiSvgModule],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have isActive initially as false', () => {
    expect(component.isActive).toBe(false);
  });

  it('should toggle is Active when toggle method is called', () => {
    component.toggle();
    expect(component.isActive).toBe(true);
    component.toggle();
    expect(component.isActive).toBe(false);
  });

  it('should emit toggleSidebar event with correct value when toggle method is called', () => {
    spyOn(component.toggleSidebar, 'emit');

    component.toggle();
    expect(component.toggleSidebar.emit).toHaveBeenCalledWith(true);

    component.toggle();
    expect(component.toggleSidebar.emit).toHaveBeenCalledWith(false);
  });
});
