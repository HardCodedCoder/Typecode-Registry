import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarMenuComponent } from './sidebar-menu.component';
import { TuiSvgComponent } from '@taiga-ui/core';

describe('SidebarMenuComponent', () => {
  let component: SidebarMenuComponent;
  let fixture: ComponentFixture<SidebarMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SidebarMenuComponent],
      imports: [TuiSvgComponent],
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
