/*!
 * Copyright florianmatthias o.G. 2021 - All rights reserved
 */

export enum Methods {
    FILE_READER_ARRAY_BUFFER,
    FILE_READER_DATA_URL
}

export abstract class Message< T > {

    public constructor ( private readonly _id: string, private readonly _method: Methods, private readonly _data: T ) {}

    public get id (): string {
        return this._id;
    }

    public get method (): Methods {
        return this._method;
    }

    public get data (): T {
        return this._data;
    }

    // Adaption of the work by "jcxplorer" (credits: https://gist.github.com/jcxplorer/823878)
    public static generateUUIDv4 (): string {

        let uuid = '';

        for ( let i = 0; i < 32; i++ ) {

            // tslint:disable-next-line:no-bitwise
            const random: number = Math.random() * 16 | 0;

            if ( i === 8 || i === 12 || i === 16 || i === 20 ) {
                uuid += '-';
            }

            // tslint:disable-next-line:no-bitwise
            uuid += ( i === 12 ? 4 : ( i === 16 ? ( random & 3 | 8 ) : random ) ).toString( 16 );
        }

        return uuid;

    }

}

export class InputMessage< T > extends Message< T > {

    public static getInstance< T > ( method: Methods, data: T ): InputMessage< T > {
        return new InputMessage< T >( Message.generateUUIDv4(), method, data );
    }

    public static deserializeInstance ( input: any ): InputMessage< any >|undefined {

        if (
            typeof input === 'object' &&
            input.hasOwnProperty( '_id' ) && typeof input._id === 'string' &&
            input.hasOwnProperty( '_method' ) && typeof input._method === 'number' &&
            input.hasOwnProperty( '_data' )
        ) {

            // tslint:disable-next-line:no-string-literal
            return new InputMessage< any >( input[ '_id' ], input[ '_method' ], input[ '_data' ] );

        }

        return undefined;
    }

}

export class OutputMessage< T > extends Message< T > {

    public static getInstance< T, IN > ( input: InputMessage< IN >, data: T ): OutputMessage< T > {
        return new OutputMessage< T >( input.id, input.method, data );
    }

    public static deserializeInstance ( output: any ): OutputMessage< any >|undefined {

        if (
            typeof output === 'object' &&
            output.hasOwnProperty( '_id' ) && typeof output._id === 'string' &&
            output.hasOwnProperty( '_method' ) && typeof output._method === 'number' &&
            output.hasOwnProperty( '_data' )
        ) {
            // tslint:disable-next-line:no-string-literal
            return new OutputMessage< any >( output[ '_id' ], output[ '_method' ], output[ '_data' ] );
        }

        return undefined;
    }

}

