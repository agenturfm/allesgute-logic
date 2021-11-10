import { Injectable } from '@angular/core';
import { MessageDialog } from '../components/message.dialog';
import { MatDialog } from '@angular/material/dialog';

export interface MessageText {
    text: string;
    style?: string;
}


@Injectable( {
    providedIn: 'root'
} )
export class MessageService {

    public constructor( private _dialog: MatDialog )
    {}

    public openDialog( message: string|MessageText|MessageText[], title: string = 'Information' ) {
        const msg = typeof message == 'object' ? message : ( typeof message == 'string' ? [{text: message}] : [message]);
        const dialogRef = this._dialog.open(MessageDialog, {
            minWidth: '15em',
            maxWidth: '25em',
            autoFocus: true,
            data: {title, message: msg}
        });

        // dialogRef.afterClosed().subscribe(result => {
        //     console.log(`Dialog result: ${result}`);
        // });
    }
}
