import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
    selector: 'app-message-dialog',
    template: `
        <h2 mat-dialog-title>{{data.title}}</h2>
        <mat-dialog-content class="mat-typography">
            <p *ngFor="let msg of data.message">
                <span [style]="msg.style || ''">{{msg.text}}</span>
            </p>
        </mat-dialog-content>
        <mat-dialog-actions>
<!--            <button mat-button mat-dialog-close>Cancel</button>-->
            <button mat-button [mat-dialog-close]="true" cdkFocusInitial>Ok!</button>
        </mat-dialog-actions>
    `
})
export class MessageDialog {
    public constructor ( @Inject(MAT_DIALOG_DATA) public data: any ) {
    }
}
