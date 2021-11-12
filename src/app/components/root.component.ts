import { Component } from '@angular/core';

@Component({
    selector: 'app-root',
    template: `
        <app-home *ngIf="!configActive" (startConfig)="configActive=$event.valueOf()"></app-home>
        <app-config *ngIf="configActive"></app-config>
    `
})
export class RootComponent {
    public configActive = false;
}
