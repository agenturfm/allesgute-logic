/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

/* tslint:disable:variable-name no-inferrable-types no-console */
import { Inject, Injectable, isDevMode, Optional } from '@angular/core';
import { forkJoin, from, Observable } from 'rxjs';
import { WorkerService } from './worker.service';
import { InputMessage, Methods } from '../../worker/shared/message.class';
import { mergeMap, switchMap, tap } from 'rxjs/operators';
// import { DeviceDetectorService } from 'ngx-device-detector';
import { Tile } from './design.abstract';
import { AppService } from './app.service';

export const IMAGES_SERVICE_IMAGES_TOTAL_ALLOWED: number = 32;
export const IMAGES_SERVICE_IMAGES_MINIMUM: number = 1;

const LOW_RESOLUTION_WIDTH_LIMIT: number = 1024;    // Every image with an width under this value is considered low-res

export enum UIImageEXIFRotation {

    /* See https://www.impulseadventure.com/photo/exif-orientation.html for details */

    deg0 = 1,
    deg180 = 3,
    deg90 = 6,
    deg270 = 8

}

export class UIImage {

    private _tile : Tile = null;
    private readonly _lowResolution : boolean;

    public constructor (
        private readonly _handle: File,
        private readonly _image: HTMLImageElement,
        private readonly _rotation: UIImageEXIFRotation = UIImageEXIFRotation.deg0,
        private readonly _originalWidth: number
    ) {

        this._lowResolution = _originalWidth < LOW_RESOLUTION_WIDTH_LIMIT;

    }

    public get handle (): File {

        return this._handle;

    }

    public get dataURL (): string {

        return this._image.src;

    }

    public get filename (): string {

        return this._handle.name;

    }

    // noinspection JSUnusedGlobalSymbols
    public get mime (): string {

        return this._handle.type;

    }

    public get image (): HTMLImageElement {

        return this._image;

    }

    public get rotation (): UIImageEXIFRotation {

        return this._rotation;

    }

    public get lowResolution (): boolean {

        // GH-336: Do not check for low resolution images anymore!
        // return this._lowResolution;

        return false;

    }

    public get originalWidth (): number {

        return this._originalWidth;

    }

    public get tile (): Tile {

        return this._tile;

    }

    public set tile ( value: Tile ) {

        this._tile = value;

    }

    public getRotationDegree (): number {

        if ( this._rotation === UIImageEXIFRotation.deg0 ) {

            return 0;

        } else if ( this._rotation === UIImageEXIFRotation.deg90 ) {

            return 90;

        } else if ( this._rotation === UIImageEXIFRotation.deg180 ) {

            return 180;

        } else if ( this._rotation === UIImageEXIFRotation.deg270 ) {

            return 270;

        }

        return 0;

    }

}

@Injectable( {
    providedIn: 'root'
} )
export class ImagesService {

    private readonly _maxImages : number = IMAGES_SERVICE_IMAGES_TOTAL_ALLOWED;
    private readonly _images : Array< UIImage > = new Array< UIImage >();
    private readonly _uiImageWidth : number;

    private _working : boolean = false;
    private _processingTotal : number = 0;
    private _processingCurrent : number = 0;

    public constructor (
        @Inject( 'uiImageWidthDesktop' ) @Optional() _uiImageWidthDesktop: number = 640,
        @Inject( 'uiImageWidthMobil' ) @Optional() _uiImageWidthMobil: number = 640,
        @Inject( 'uiImageQuality' ) @Optional() private readonly _uiImageQuality: number = 0.5,
        private readonly _workerService: WorkerService,
        // private readonly _deviceDetector: DeviceDetectorService,
        private readonly _appService: AppService
    ) {

        // if ( _deviceDetector.isMobile() ) {

            // this._uiImageWidth = _uiImageWidthMobil;
        // } else {
        //
            this._uiImageWidth = _uiImageWidthDesktop;
        //
        // }

    }

    public get current (): number {
        return this._images.length;
    }

    public get maxImages (): number {
        return this._maxImages;
    }

    public get images (): Array<UIImage> {
        return this._images;
    }

    public get working (): boolean {
        return this._working;
    }

    public get processingTotal (): number {
        return this._processingTotal;
    }

    public get processingCurrent (): number {
        return this._processingCurrent;
    }


    public clear () {
        this._images.forEach( _image => this.removeImage( _image ) );
    }

    public addFiles ( files: FileList, length: number ): Observable< Array< boolean > | boolean > {

        // Calculate the processingTotal
        this._processingTotal = Math.min( length, this._maxImages - this._images.length );

        const obsFiles: Array< File > = new Array< File >();

        for ( let i: number = 0; i < this._processingTotal; i++ ) {
            obsFiles.push( files.item( i ) );
        }

        // Already enough images or still some work to do?
        if ( obsFiles.length > 0 ) {
            // Set the working state
            this._working = true;
        }

        const concurrent: number = 1;   /* Switched to "concurrent" 1 for older (android) devices */

        return from( obsFiles ).pipe(

            mergeMap( result => this.addFile( result ), 1 ),

            tap( () => {

                // "concurrent" amount is processed
                this._processingCurrent += concurrent;

                if ( this._processingCurrent === this._processingTotal ) {

                    // Done working
                    this._working = false;

                    // Resetting all processing numbers
                    this._processingTotal = 0;
                    this._processingCurrent = 0;

                }

            } )

        );

    }

    public removeImage ( image: UIImage ) {

        if ( this._images.indexOf( image ) > -1 ) {

            this._images.splice( this._images.indexOf( image ), 1 );

            // MIT fix for GH-378
            if ( this._images.length < 4 ) {

                // MIT: Need "Bilder" component to initially open file dialog
                // this._appService.currentAppSlide = this._appService.sliderIdBilder;

            }

        }

    }

    public swapImages ( img1UUID: string, img2UUID: string ): void {

        const img1: UIImage = this.getImageByUUID( img1UUID );
        const img2: UIImage = this.getImageByUUID( img2UUID );

        if ( !! img1 && !! img2 ) {

            const img1Idx: number = this._images.indexOf( img1 );
            const img2Idx: number = this._images.indexOf( img2 );

            if ( img1Idx > -1 && img2Idx > -1 ) {

                // Swap images in array
                const tempImg: UIImage = img1;
                this._images[img1Idx] = this._images[img2Idx];
                this._images[img2Idx] = tempImg;

                // Swap their tile references
                const tempTile: Tile = img1.tile;
                img1.tile = img2.tile;
                img2.tile = tempTile;

            }

        }

    }

    public replaceFile ( oldImg: string, newImg: File ): Observable< boolean > {

        return this.addFile( newImg, oldImg );

    }

    public getImageByUUID ( uuid: string ): UIImage | undefined {

        return this._images.find( img => !! img.tile && img.tile.tileId === uuid );

    }

    private addFile ( file: File, replaceImg?: string ): Observable< boolean > {

        return forkJoin( [
            this._workerService.doWork< File, ArrayBuffer >( InputMessage.getInstance( Methods.FILE_READER_ARRAY_BUFFER, file ) ),
            this._workerService.doWork< File, string >( InputMessage.getInstance( Methods.FILE_READER_DATA_URL, file ) )
        ] ).pipe(

            switchMap( results => {

                // Exif
                const { exif, base64Patch } = this.readEXIFRotation( results[0].data, results[1].data );

                // Create Data-URL
                let imageDataUrl: string;

                // Apply base64 patch, if any
                if ( base64Patch.length > 0 ) {

                    // Start of base64 encoded image
                    const b64Start = results[1].data.indexOf( ',' ) + 1;
                    // Length of replacement part
                    const replLen = b64Start + base64Patch.length;

                    imageDataUrl = results[1].data.slice( 0, b64Start ) + base64Patch + results[1].data.slice( replLen );

                } else {

                    imageDataUrl = results[1].data;

                }

                return new Observable< boolean >( subscriber => {

                    if ( isDevMode() ) {
                        console.time( 'ImageService: Process Image ' + file.name );
                    }

                    // Load the image
                    const image: HTMLImageElement = document.createElement( 'img' );

                    image.onload = () => {

                        // Resize the image to save memory on device
                        let canvas: HTMLCanvasElement = document.createElement( 'canvas' );
                        const scale: number = this._uiImageWidth / image.width;
                        // #10: Canvas performance: avoid float for width/height
                        const uiImageHeight: number = Math.round( image.height * scale );

                        canvas.width = this._uiImageWidth;
                        canvas.height = uiImageHeight;

                        // #10: Canvas performance: disable alpha if not needed
                        const context: CanvasRenderingContext2D = canvas.getContext( '2d', { alpha: false } );

                        context.drawImage( image, 0, 0, this._uiImageWidth, uiImageHeight );

                        const uiImage: HTMLImageElement = new Image( this._uiImageWidth, uiImageHeight );
                        uiImage.src = context.canvas.toDataURL( 'image/jpeg', this._uiImageQuality );

                        uiImage.onload = () => {

                            if ( isDevMode() ) {
                                console.timeEnd( 'ImageService: Process Image ' + file.name );
                            }

                            // All done... add or replace the new UIImage
                            const newUIImage: UIImage = new UIImage( file, uiImage, exif, image.width );

                            // remove the original image again
                            image.remove();

                            if ( !! replaceImg ) {

                                const idx: number = this._images.indexOf( this.getImageByUUID( replaceImg ) );
                                if ( idx > -1 ) {
                                    this._images[ idx ] = newUIImage;
                                }

                            } else {
                                this._images.push( newUIImage );
                            }

                            // #10: Set canvas size to 0, reset canvas to null
                            canvas.width = 0;
                            canvas.height = 0;
                            canvas = null;

                            // Signal all good
                            subscriber.next( true );
                            subscriber.complete();

                        };

                        uiImage.onerror = err => {

                            subscriber.error( err );
                            subscriber.complete();

                        };

                    };

                    image.onerror = err => {

                        subscriber.error( err );
                        subscriber.complete();

                    };

                    image.src = imageDataUrl;

                } );

            } )

        );

    }

    // noinspection JSMethodCanBeStatic
    private readEXIFRotation ( buffer: ArrayBuffer, dataUrl: string ): { exif : UIImageEXIFRotation, base64Patch : string } {

        let result: UIImageEXIFRotation = UIImageEXIFRotation.deg0; // Default not rotated
        let base64Patch: string = '';

        const view: DataView = new DataView( buffer );
        let length: number = view.byteLength;

        let index: number = 0;
        let littleEndian: boolean = false;

        // Check SOI marker
        if ( view.getUint16( index ) !== 0xFFD8 ) {

            return { exif: result, base64Patch };

        }

        index += 2; // Shift 2 bytes

        let inAPP1: boolean = false;
        let endOfHeader: boolean = false;

        while ( index < length - 2 && false === endOfHeader ) {

            // EXIF Tags reference: https://www.exiv2.org/tags.html
            const exifHeader: number = view.getUint16( index, inAPP1 ? littleEndian : false );
            index += 2;

            switch ( exifHeader ) {

                case 0xFFDA: // SOS marker (start of scan, actual image data)

                    endOfHeader = true;
                    break;

                case 0xFFE1: // APP1 Marker

                    inAPP1 = true;
                    const headerLength: number = view.getUint16( index );

                    // skip
                    length = headerLength - index;

                    index += 8;
                    // Read byte order information of EXIF header
                    // 0x4d4d ('MM') is big endian ('Motorola'), 0x4949 ('II') is little endian ('Intel').
                    littleEndian = view.getUint16( index ) !== 0x4d4d;

                    // Skip rest of TIFF header
                    index += 4;

                    break;

                case 0x0112:  // Orientation marker (within APP1)

                    // Instead of parsing complicated IFD headers, search for matching header 0x0112
                    // which consists of (endianess considered!):
                    // Tag: 0x0112
                    // Type: 0x0003
                    // Counter: 0x00000001
                    if ( true === inAPP1 && view.getUint16( index, littleEndian ) === 3 && view.getUint32( index + 2, littleEndian ) === 1 ) {

                        index += 6;

                        // Read the orientation value
                        result = view.getUint16( index, littleEndian );

                        // Replace tag 'Orientation' with '1' ('normal')
                        view.setUint16( index, 1, littleEndian );

                        if ( isDevMode() ) {

                            console.log( `Image rotation: ${result} at offset: ${index}` );

                        }

                        // Prepare a patch for base64 encoded URL with new Orientation value
                        // Index of Orientation value in base64 string
                        const baseOffs: number = Math.ceil( index / 3 ) * 4;

                        // Start of image data in base64 encoded string
                        const b64Start: number = dataUrl.indexOf( ',' ) + 1;

                        // Slice the part from beginning up to Orientation value
                        const binData: string = atob( dataUrl.slice( b64Start, b64Start + baseOffs + 4 ) );

                        // Convert binary data to numerical array to patch it
                        const binDataA = [];
                        for ( let i = 0; i < binData.length; i ++ ) {

                            binDataA.push( binData.charCodeAt( i ) );

                        }

                        // Patch the Orientation tag value to '1' ('normal') in base64 array
                        binDataA[ index ] = 0;
                        binDataA[ index + 1 ] = 1;

                        // And convert back to base64 string
                        binDataA.forEach( n => base64Patch += String.fromCharCode( n ) );
                        base64Patch = btoa( base64Patch );

                        length = 0; // done

                    }

                    break;

                default:

                    // Skip over unknown header if not in APP1 processing
                    // Known JPEG segment headers cf. https://en.wikipedia.org/wiki/JPEG#Syntax_and_structure:
                    // SOF0: 0xFFC0
                    // SOF2: 0xFFC2
                    // DHT: 0xFFC4
                    // RSTn: 0xFFD0 - 0xFFD7
                    // SOI: 0xFFD8
                    // EOI: 0xFFD9
                    // SOS: 0xFFDA
                    // DQT: 0xFFDB
                    // DRI: 0xFFDD
                    // APPn: 0xFFEn
                    // COM: 0xFFFE
                    if ( false === inAPP1 && exifHeader >= 0xFFC0 ) {

                        const headerLen = view.getUint16( index );
                        index += headerLen;
                        if ( isDevMode() ) {

                            console.log( 'Skipping EXIF header ID/len: ', exifHeader.toString( 16 ), headerLen );

                        }

                    }

                    break;

            }

        }

        return { exif: result, base64Patch };

    }

}
