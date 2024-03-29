import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'Typecode Registry';
  isSidebarActive = false;

  onToggleSidebar(isActive: boolean) {
    this.isSidebarActive = isActive;
  }
}
