import { Component } from '@angular/core';
import { environment } from '../../environments/environment';

@Component({
    selector: 'app-disp',
    template: `<router-outlet></router-outlet>`
})
// Main router outlet for root app to provide the optional path to RootComponent
export class DispatchComponent {
    constructor () {
        // Setup Google Analytics
        // Note: gtag() has to be defined in index.html!
        (<any>window).gtag('js', new Date());
        (<any>window).gtag('config', environment.GTM_ID);
    }
}
