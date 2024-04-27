import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Typecode Registry';
  isSidebarActive = false;

  /**
   * Toggles the sidebar menu.
   *
   * @param isActive - The state of the sidebar menu.
   */
  onToggleSidebar(isActive: boolean) {
    this.isSidebarActive = isActive;
  }
}
