import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';

import { PapaParseModule } from 'ngx-papaparse';
import { FileDropModule } from 'ngx-file-drop';
import { ChartsModule } from 'ng2-charts';

declare var require: any;

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    PapaParseModule,
    FileDropModule,
    ChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
