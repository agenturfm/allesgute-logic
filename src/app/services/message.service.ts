import { Injectable } from '@angular/core';
import { MessageDialog } from '../components/message.dialog';
import { MatDialog } from '@angular/material/dialog';

@Injectable( {
    providedIn: 'root'
} )
export class MessageService {

    public constructor( private _dialog: MatDialog )
    {}

    public openDialog( message: string, title: string = 'Information' ) {
        const dialogRef = this._dialog.open(MessageDialog, {
            minWidth: '15em',
            maxWidth: '25em',
            autoFocus: true,
            data: {title, message}
        });

        // dialogRef.afterClosed().subscribe(result => {
        //     console.log(`Dialog result: ${result}`);
        // });
    }
}
