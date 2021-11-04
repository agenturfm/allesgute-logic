/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

import { InputMessage, Methods, OutputMessage } from './shared/message.class';
import { FileReaderRunner } from './methods/filereader.class';
import { Runner } from './run-worker.interface';
import { Observable } from 'rxjs';

export class YomoWorker {

    public constructor ( private readonly _context: Worker ) {}

    public broker ( inputMessage: InputMessage< any > ): void {

        const method: Methods = inputMessage.method;

        let runner: Runner = null;

        if ( method === Methods.FILE_READER_ARRAY_BUFFER || method === Methods.FILE_READER_DATA_URL ) {

            const message: InputMessage< File > = inputMessage as InputMessage< File >;

            runner = new FileReaderRunner();

            this.done( runner.run< File, ArrayBuffer >( message ) );

        }

    }

    private done< T > ( message: Observable< OutputMessage< T > > ): void {

        if ( !! this._context ) {

            // TODO: Handle error case
            message.subscribe( _message => this._context.postMessage( _message ) );

        }

    }

}

/* Cast will hold on runtime */
export const worker = new YomoWorker( self as unknown as Worker );

addEventListener( 'message', ( event: MessageEvent ) => {

    const input: InputMessage< any > = InputMessage.deserializeInstance( event.data );

    if ( input ) {

        worker.broker( input );

    } else {

        // TODO: Signal error

    }

} );
