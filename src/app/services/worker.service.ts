/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

/* tslint:disable:variable-name no-console */
import { Injectable, isDevMode } from '@angular/core';
import { InputMessage, OutputMessage } from '../../worker/shared/message.class';
import { Observable, Subscriber } from 'rxjs';

const WORKER_PATH = 'assets/workers/main.js';

@Injectable( {
    providedIn: 'root'
} )
export class WorkerService {

    private readonly _worker : Worker|null;
    private readonly _pending : Map<string, Subscriber<any>> = new Map<string, Subscriber<any>>();

    public constructor () {

        if ( Worker ) {

            this._worker = new Worker( WORKER_PATH );

            this._worker.onmessage = ( event: MessageEvent ) => {

                const outputMessage: OutputMessage<any> = OutputMessage.deserializeInstance( event.data );

                if ( !!outputMessage ) {

                    const id: string = outputMessage.id;
                    if ( this._pending.has( id ) ) {

                        // Ok got the message
                        this._pending.get( id ).next( outputMessage );

                        // Done...
                        this._pending.get( id ).complete();

                        // Finally delete the pending message
                        this._pending.delete( id );

                    }

                }

            };

            // TODO: How to handle this case really?
            this._worker.onerror = ( event: ErrorEvent ) => console.error( event );

        } else {

            this._worker = null;

        }

    }

    private get _available (): boolean {

        return !!this._worker;

    }

    public get available (): boolean {

        return this._available;

    }

    public doWork<IN, OUT> ( message: InputMessage<IN> ): Observable<OutputMessage<OUT>> {

        return new Observable<OutputMessage<OUT>>( subscriber => {

            if ( this._available ) {

                try {

                    this._worker.postMessage( message );
                    this._pending.set( message.id, subscriber );

                } catch ( e ) {

                    if ( isDevMode() ) {

                        console.warn( 'WorkerService error:', e );

                    }

                    // TODO: Implement

                }

            }

        } );

    }

}
