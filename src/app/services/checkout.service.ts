/*!
 * Copyright florianmatthias o.G. 2021 - All rights reserved
 */

import { EventEmitter, Injectable, isDevMode } from '@angular/core';
import { ImagesService, UIImage } from './images.service';
import { RendererService } from './renderer.service';
import { concat, Observable, of } from 'rxjs';
import { WorkerService } from './worker.service';
import { InputMessage, Methods } from '../../worker/shared/message.class';
import { catchError, last, retry, switchMap } from 'rxjs/operators';
import { HttpClient, HttpEventType, HttpHeaders } from '@angular/common/http';
import Konva from 'konva';
import { environment } from '../../environments/environment';
import { CanvasSize } from '../components/config.component';
import { TileTransformOperations } from './design.abstract';
import { OrderResponseBody } from '@paypal/paypal-js/types/apis/orders';

export enum CheckoutNotificationType {
    DONE,
    ERROR,
    PROCESSING_START,
    UPLOADING,
    UPLOADING_META,
    UPLOADING_PAYLOAD
}

export class UploadNotificationStatus {

    public constructor (
        private readonly _type: CheckoutNotificationType,
        private readonly _processed?: number,
        private readonly _total?: number
    ) {}

    public get type (): CheckoutNotificationType {
        return this._type;
    }

    public get processed (): number {
        return this._processed;
    }

    public get total (): number {
        return this._total;
    }
}

export class PayloadCheckoutNotificationStatus extends UploadNotificationStatus {

    public constructor (
        _type: CheckoutNotificationType,
        private readonly _index: number,
        _processed?: number,
        _total?: number
    ) {
        super( _type, _processed, _total );
    }

    public get index (): number {
        return this._index;
    }
}
class OrderParams {

    constructor (
        public readonly orderID: string,
        public readonly pendingOrderID: string
    ) {}

}


class OrderResponse {

    public constructor (
        public readonly response: boolean,
        public readonly reason?: number,
        public readonly pendingOrderID?: string
    ) {}

}

export class PayloadImageMeta {

    public constructor (
        private readonly _width: number,
        private readonly _height: number
    ) {}

}

export class PayloadSideText {

    public constructor ( private readonly _text: string, private readonly _color = '0x000000', private readonly _family: string = 'Arial' ) {}

    public get text (): string {
        return this._text;
    }

    public get color (): string {
        return this._color;
    }

    public get family (): string {
        return this._family;
    }

}

interface PayloadElement {
    path : Array< Konva.Vector2d >;
    image : string;
    meta : PayloadImageMeta;
    operations : TileTransformOperations;
}

@Injectable( {
    providedIn: 'root'
} )
export class CheckoutService {

    private readonly _backendURI : string = environment.backendAPI;
    private readonly _uploadNotification : EventEmitter< UploadNotificationStatus > = new EventEmitter< UploadNotificationStatus >( true );

    private _size: CanvasSize = CanvasSize.sm;
    private _amount: number = 1;
    private _price: string = '';
    private _sideText : PayloadSideText = null;
    private _processingImage : number = 0;
    private _paypalOrderResponse: OrderResponseBody;

    public constructor (
        private readonly _imageService: ImagesService,
        private readonly _rendererService: RendererService,
        private readonly _workerService: WorkerService,
        private readonly _httpClient: HttpClient
    ) {}

    public get uploadNotification (): EventEmitter< UploadNotificationStatus > {
        return this._uploadNotification;
    }

    public set size ( value: CanvasSize ) {
        this._size = value;
    }

    public get size () : CanvasSize {
        return this._size;
    }

    public get orderId () : string {
        return this._rendererService.orderId;
    }

    public set amount ( value: number ) {
        this._amount = value;
    }

    public get amount () : number {
        return this._amount;
    }

    public set price ( value: string ) {
        this._price = value;
    }

    public get price () : string {
        return this._price;
    }

    public get paypalPrice () : string {
        return this._price.replace( ',', '.' );
    }

    public set sideText ( value: PayloadSideText ) {
        this._sideText = value;
    }

    public set paypalOrderResponse ( value : OrderResponseBody ) {
        this._paypalOrderResponse = value;
    }

// public getPreviewToken (): Observable< string > {
    //
    //     return this._rendererService.generatePreview().pipe(
    //
    //         switchMap( _preview => new Observable< string >( subscriber => {
    //             this._httpClient.post< { token : string } | OrderResponse >(
    //                 this._backendURI + '/preview/',
    //                 { preview: _preview },
    //                 {
    //                     reportProgress: true,
    //                     withCredentials: false,
    //                     responseType: 'json',
    //                     headers: new HttpHeaders(),
    //                     observe: 'events'
    //                 }
    //             ).pipe(
    //                 retry( 5 )
    //             ).subscribe( value => {
    //
    //                 if ( value.type === HttpEventType.UploadProgress ) {
    //                     this._checkoutNotification.emit( new CheckoutNotificationStatus( CheckoutNotificationType.UPLOADING, value.loaded, value.total ) );
    //                 } else if ( value.type === HttpEventType.Response ) {
    //                     this._checkoutNotification.emit( new CheckoutNotificationStatus( CheckoutNotificationType.DONE ) );
    //
    //                     if ( !! value.body && !( value.body instanceof OrderResponse ) && !! value.body.token  ) {
    //                         subscriber.next( value.body.token );
    //                     } else {
    //                         // Must be a YomoResponse type
    //                         subscriber.error( ( value.body as OrderResponse ).reason );
    //                     }
    //
    //                     subscriber.complete();
    //                 }
    //
    //             }, err => {
    //
    //                 if ( isDevMode() ) {
    //                     console.warn( 'Uploading error', err );
    //                 }
    //
    //                 subscriber.error( err );
    //                 subscriber.complete();
    //
    //             } );
    //
    //         } ) )
    //
    //     );
    //
    //
    // }

    public createOrder (): Observable< string > {
        // Reset the processing counter
        this._processingImage = 0;

        // Signal "Processing started"
        this._uploadNotification.emit( new UploadNotificationStatus( CheckoutNotificationType.PROCESSING_START, this._processingImage, this._imageService.images.length ) );

        return this._rendererService.generatePreview( this._rendererService.getCanvasImageData() ).pipe(

            switchMap( _prevImg => this._createOrder( _prevImg ) ),

            switchMap( _url => this._uploadOrderImages( _url ) )
        );
    }

    public doCheckout (): Observable< string > {

        return this._doCheckout();
    }

    private _getPayloadElement ( image: UIImage ): Observable< PayloadElement > {

        return new Observable< PayloadElement >( subscriber => {

            const konvaImage: Konva.Image = image.tile.getKonvaImage();
            const element: PayloadElement = {
                path: image.tile.path,
                image: null,
                meta: new PayloadImageMeta(
                    konvaImage.width(),
                    konvaImage.height()
                ),
                operations: image.tile.transformations
            };

            this._workerService.doWork< File, string >( InputMessage.getInstance( Methods.FILE_READER_DATA_URL, image.handle ) ).pipe(
                catchError( err => {
                    subscriber.error( err );
                    return of( null );
                } )
            ).subscribe( result => {
                // Apply the ArrayBuffer ("image")
                element.image = result.data;

                subscriber.next( element );
                subscriber.complete();
            } );

        } );

    }

    private _doCheckout (): Observable< string > {

        if ( isDevMode() ) {
            console.info(`Performing checkout of order "${ this.orderId }"`);
        }

        return new Observable< string >( subscriber => {

            this._httpClient.post< OrderResponse >(
                this._backendURI + '/checkout',
                new OrderParams( '123456', this.orderId),
                {
                    reportProgress: false,
                    withCredentials: false,
                    responseType: 'json',
                    headers: new HttpHeaders()
                }
            ).pipe(
                retry( 5 )

            ).subscribe( value => {

                console.log( 'checked out', value );
                if ( value.response ) {

                    if ( !! value.pendingOrderID ) {
                        subscriber.next( value.pendingOrderID );
                    } else {
                        subscriber.error( value.reason );
                    }
                    subscriber.complete();
                }

            }, err => {

                if ( isDevMode() ) {
                    console.warn( 'Checkout error', err );
                }

                subscriber.error( err );
                subscriber.complete();

            } );

        } );
    }

    private _createOrder ( preview: string ): Observable< string > {

        if ( isDevMode() ) {
            console.info(
                `Starting upload of order "${ this.orderId }",
                size ${ this._size }, amount "${ this._amount }" and canvas text "${ this._sideText }"`
            );
        }

        return new Observable< string >( subscriber => {

            this._httpClient.post< OrderResponse >(
                this._backendURI + '/new',
                {
                    orderID: this.orderId,
                    options: {
                        size: this._size,
                        amount: this._amount,
                        sideText: this._sideText
                    },
                    preview
                },
                {
                    reportProgress: true,
                    withCredentials: false,
                    responseType: 'json',
                    headers: new HttpHeaders(),
                    observe: 'events'
                }
            ).pipe(
                retry( 5 )

            ).subscribe( value => {

                if ( value.type === HttpEventType.UploadProgress ) {

                    this._uploadNotification.emit( new UploadNotificationStatus( CheckoutNotificationType.UPLOADING_META, value.loaded, value.total ) );

                } else if ( value.type === HttpEventType.Response ) {

                    this._uploadNotification.emit( new UploadNotificationStatus( CheckoutNotificationType.DONE ) );

                    if ( !! value.body && !! value.body.response && !! value.body.pendingOrderID ) {
                        subscriber.next( value.body.pendingOrderID );
                    } else {
                        subscriber.error( value.body.reason );
                    }
                    subscriber.complete();
                }

            }, err => {

                if ( isDevMode() ) {
                    console.warn( 'Uploading error', err );
                }

                subscriber.error( err );
                subscriber.complete();

            } );

        } );
    }

    private _uploadOrderImages ( orderID: string ): Observable< string > {

        // Upload all images (sequentially)
        const images: Array< Observable< string > > = new Array< Observable< string > >();

        let index: number = 0;

        // Process each image (with active tile)
        this._imageService.images.forEach( image => {
            // Check if the tile is part of the current design
            if ( image.tile && this._rendererService.activeDesign.tiles.indexOf( image.tile ) > -1 ) {
                images.push( this._uploadOrderImage( orderID, image, index++ ) );
            }
        } );

        return concat( ...images ).pipe(
            last()
        );

    }

    private _uploadOrderImage ( orderID: string, image: UIImage, index: number ): Observable< string > {

        return new Observable< string >( subscriber => {

            this._getPayloadElement( image ).pipe(
                switchMap( payload => this._httpClient.post<OrderResponse>(
                    `${ this._backendURI }/payload/${ index }/${ orderID }`,
                    payload,
                    {
                        reportProgress: true,
                        withCredentials: false,
                        responseType: 'json',
                        headers: new HttpHeaders(),
                        observe: 'events'
                    }
                ).pipe(
                    retry( 5 )
                ) )
            ).subscribe( value => {

                if ( value.type === HttpEventType.UploadProgress ) {
                    this._uploadNotification.emit( new PayloadCheckoutNotificationStatus( CheckoutNotificationType.UPLOADING_PAYLOAD, index, value.loaded, value.total ) );

                } else if ( value.type === HttpEventType.Response ) {

                    this._uploadNotification.emit( new UploadNotificationStatus( CheckoutNotificationType.DONE ) );

                    if ( !!value.body && !!value.body.response && !!value.body.pendingOrderID ) {
                        subscriber.next( value.body.pendingOrderID );
                    } else {
                        subscriber.error( value.body.reason );
                    }
                    subscriber.complete();
                }

            }, err => {

                if ( isDevMode() ) {
                    console.warn( 'Uploading payload error', err );
                }

                subscriber.error( err );
                subscriber.complete();

            } );

        } );

    }

}
