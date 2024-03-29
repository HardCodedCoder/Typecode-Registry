import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TypecodeEditorComponent } from './typecode-editor/typecode-editor.component';

const routes: Routes = [{ path: '', component: TypecodeEditorComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
