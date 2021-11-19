import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-root',
    template: `
        <app-home *ngIf="!configActive" [section]="activeCat" (startConfig)="configActive=$event.valueOf()"></app-home>
        <app-config *ngIf="configActive"></app-config>
    `
})
export class RootComponent {
    public configActive = false;
    public activeCat: number = 0;

    public constructor (private _router: Router) {
        _router.routerState.root.queryParams.subscribe( params => {
            if ( !! params.t && typeof params.t == 'string' ) {
                switch (params.t.toLowerCase()) {
                    case 'geburtstag':
                        this.activeCat = 0; break;
                    case 'hochzeit':
                        this.activeCat = 1; break;
                    case 'geburt':
                        this.activeCat = 2; break;
                    case 'kommunion':
                        this.activeCat = 3; break;
                    case 'weihnachten':
                        this.activeCat = 4; break;
                    default:
                        this.activeCat = 0; break;
                }
            }
        });
    }
}
