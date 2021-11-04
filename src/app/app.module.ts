import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './components/app.component';
import { ConfigComponent } from './components/config.component';
import { RootComponent } from './components/root.component';
import { HeaderComponent } from './components/header.component';
import { MosaicDirective } from './directives/mosaic.directive';
import { ImagesService } from './services/images.service';

@NgModule({
    declarations: [
        RootComponent,
        AppComponent,
        ConfigComponent,
        HeaderComponent,
        MosaicDirective
    ],
    imports: [
        BrowserModule
    ],
    providers: [
        { provide: 'uiImageWidthDesktop', useValue: 800 },
        { provide: 'uiImageWidthMobil', useValue: 400 },
        { provide: 'uiImageQuality', useValue: 0.7 },
        ImagesService
    ],
    bootstrap: [RootComponent]
})
export class AppModule { }
