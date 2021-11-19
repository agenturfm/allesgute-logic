import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './components/app.component';
import { ConfigComponent } from './components/config.component';
import { RootComponent } from './components/root.component';
import { HeaderComponent } from './components/header.component';
import { MosaicDirective } from './directives/mosaic.directive';
import { ImagesService } from './services/images.service';
import { MessageDialog } from './components/message.dialog';
import { MessageService } from './services/message.service';
import { PaypalComponent } from './components/paypal.component';
import { CheckoutService } from './services/checkout.service';
import { DispatchComponent } from './components/dispatch.component';

const routes: Routes = [
    { path: 'hochzeit', component: RootComponent },
    { path: 'geburtstag', component: RootComponent },
    { path: 'kommunion', component: RootComponent },
    { path: 'weihnachten', component: RootComponent },
    { path: 'geburt', component: RootComponent },
    { path: '**', component: RootComponent }
];

@NgModule({
    declarations: [
        RootComponent,
        AppComponent,
        ConfigComponent,
        HeaderComponent,
        MosaicDirective,
        MessageDialog,
        PaypalComponent,
        DispatchComponent
    ],
    imports: [
        BrowserModule,
        MatDialogModule,
        MatButtonModule,
        BrowserAnimationsModule,
        HttpClientModule,
        RouterModule.forRoot(routes)
    ],
    providers: [
        { provide: 'uiImageWidth', useValue: 800 },
        { provide: 'uiImageQuality', useValue: 0.7 },
        ImagesService,
        MessageDialog,
        MessageService,
        CheckoutService,
    ],
    bootstrap: [DispatchComponent]
})
export class AppModule { }
