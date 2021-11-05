import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './components/app.component';
import { ConfigComponent } from './components/config.component';
import { RootComponent } from './components/root.component';
import { HeaderComponent } from './components/header.component';
import { MosaicDirective } from './directives/mosaic.directive';
import { ImagesService } from './services/images.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MessageDialog } from './components/message.dialog';
import { MatButtonModule } from '@angular/material/button';
import { MessageService } from './services/message.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
    declarations: [
        RootComponent,
        AppComponent,
        ConfigComponent,
        HeaderComponent,
        MosaicDirective,
        MessageDialog
    ],
    imports: [
        BrowserModule,
        MatDialogModule,
        MatButtonModule,
        BrowserAnimationsModule
    ],
    providers: [
        { provide: 'uiImageWidth', useValue: 800 },
        { provide: 'uiImageQuality', useValue: 0.7 },
        ImagesService,
        MessageDialog,
        MessageService
    ],
    bootstrap: [RootComponent]
})
export class AppModule { }
