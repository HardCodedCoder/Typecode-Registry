import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemEditorComponent } from './item-editor/item-editor.component';
import { ErrorDisplayComponent } from './error-display/error-display.component';
import { ExtensionEditorComponent } from './extension-editor/extension-editor.component';
import { ProjectEditorComponent } from './project-editor/project-editor.component';

const routes: Routes = [
  { path: '', redirectTo: '/items', pathMatch: 'full' },
  { path: 'items', component: ItemEditorComponent },
  { path: 'extensions', component: ExtensionEditorComponent },
  { path: 'projects', component: ProjectEditorComponent },
  { path: 'error/:code', component: ErrorDisplayComponent },
  { path: '**', redirectTo: '/error/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
