/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

/* tslint:disable:no-console */
import { InputMessage, Methods, OutputMessage } from '../shared/message.class';
import { Runner } from '../run-worker.interface';
import { Observable } from 'rxjs';

export class FileReaderRunner implements Runner {

    public run<IN, OUT> ( input: InputMessage<IN> ): Observable<OutputMessage<OUT>> {

        if ( input.method === Methods.FILE_READER_ARRAY_BUFFER ) {

            return this.readArrayBuffer( input as unknown as InputMessage<File> ) as unknown as Observable<OutputMessage<OUT>>;

        } else if ( input.method === Methods.FILE_READER_DATA_URL ) {

            return this.readDataUrl( input as unknown as InputMessage<File> ) as unknown as Observable<OutputMessage<OUT>>;

        } else {

            throw new Error( 'FileReader: Method unknown' );

        }

    }

    private readArrayBuffer ( input: InputMessage<File> ): Observable<OutputMessage<ArrayBuffer>> {

        return new Observable<OutputMessage<ArrayBuffer>>( subscriber => {

            const fileReader: FileReader = new FileReader();

            fileReader.onload = () => {

                subscriber.next( OutputMessage.getInstance<ArrayBuffer, File>( input, fileReader.result as ArrayBuffer ) );

            };

            fileReader.onerror = err => {

                subscriber.error( err );

            };

            fileReader.onloadend = () => subscriber.complete();

            fileReader.readAsArrayBuffer( input.data );

        } );

    }

    private readDataUrl ( input: InputMessage<File> ) {

        return new Observable<OutputMessage<string>>( subscriber => {

            const fileReader: FileReader = new FileReader();

            fileReader.onload = () => {

                subscriber.next( OutputMessage.getInstance<string, File>( input, fileReader.result as string ) );

            };

            fileReader.onerror = err => {

                subscriber.error( err );

            };

            fileReader.onloadend = () => subscriber.complete();

            fileReader.readAsDataURL( input.data );

        } );

    }

}
