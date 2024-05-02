import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgDompurifySanitizer } from '@tinkoff/ng-dompurify';
import {
  TuiRootModule,
  TuiDialogModule,
  TuiAlertModule,
  TUI_SANITIZER,
  TuiErrorModule,
  TuiGroupModule,
  TuiHintModule,
  TuiDropdownModule,
  TuiButtonModule,
  TuiSvgModule,
  TuiScrollbarModule,
  TuiHostedDropdownModule,
} from '@taiga-ui/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { ItemEditorComponent } from './item-editor/item-editor.component';
import { AddItemComponent } from './add-item/add-item.component';
import {
  TuiComboBoxModule,
  TuiDataListWrapperModule,
  TuiFieldErrorPipeModule,
  TuiFilterByInputPipeModule,
  TuiInputModule,
  TuiRadioBlockModule,
  TuiTagModule,
} from '@taiga-ui/kit';
import { ReactiveFormsModule } from '@angular/forms';
import { TuiLetModule, TuiValueChangesModule } from '@taiga-ui/cdk';
import { HttpClientModule } from '@angular/common/http';
import { TuiTableModule } from '@taiga-ui/addon-table';
import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { RouterModule } from '@angular/router';
import { ErrorDisplayComponent } from './error-display/error-display.component';
import { UpdateItemComponent } from './update-item/update-item.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarMenuComponent,
    ItemEditorComponent,
    AddItemComponent,
    ErrorDisplayComponent,
    UpdateItemComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    TuiRootModule,
    TuiDialogModule,
    TuiAlertModule,
    TuiHintModule,
    TuiErrorModule,
    TuiGroupModule,
    TuiDropdownModule,
    TuiInputModule,
    ReactiveFormsModule,
    TuiFieldErrorPipeModule,
    TuiValueChangesModule,
    TuiRadioBlockModule,
    TuiComboBoxModule,
    TuiDataListWrapperModule,
    TuiFilterByInputPipeModule,
    TuiButtonModule,
    TuiSvgModule,
    TuiTableModule,
    TuiLetModule,
    TuiTagModule,
    TuiScrollbarModule,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    RouterModule,
    TuiHostedDropdownModule,
  ],
  providers: [{ provide: TUI_SANITIZER, useClass: NgDompurifySanitizer }],
  bootstrap: [AppComponent],
})
export class AppModule {}
