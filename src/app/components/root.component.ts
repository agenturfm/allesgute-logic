import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

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

    public constructor ( private _router: Router,
                         private _activatedRoute: ActivatedRoute )
    {
        // Routing via route
        _activatedRoute.data.subscribe( () => {
            const data = _router.url.startsWith('/') ? _router.url.substring(1) : _router.url;
            this.handleUrlParam(data);
        });

        // Routing via queryString ('?t=xxx')
        _router.routerState.root.queryParams.subscribe( params => {
            if ( !! params.t && typeof params.t == 'string' ) {
                this.handleUrlParam(params.t);
            }
        });
    }

    private handleUrlParam ( location: string ) {
        switch (location.toLowerCase()) {
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
            case 'c':
                // Directly start configurator
                this.configActive = true; break;
            default:
                this.activeCat = 0; break;
        }

    }
}
