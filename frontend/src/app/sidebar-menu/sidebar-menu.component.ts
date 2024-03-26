import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-sidebar-menu',
  templateUrl: './sidebar-menu.component.html',
  styleUrl: './sidebar-menu.component.scss'
})
export class SidebarMenuComponent {
  @Output() toggleSidebar = new EventEmitter<boolean>();
  isActive: boolean = false;

  toggle() {
    this.isActive = !this.isActive;
    this.toggleSidebar.emit(this.isActive);
  }
}
