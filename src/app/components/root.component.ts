import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-root',
    template: `
        <app-home *ngIf="!configActive"></app-home>
        <app-config *ngIf="configActive"></app-config>
    `
})
export class RootComponent {
    public configActive = true;
}
