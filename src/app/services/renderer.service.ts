/*!
 * Copyright florianmatthias o.G. 2021 - All rights reserved
 */

import { Inject, Injectable, isDevMode, Optional } from '@angular/core';
import { Design } from './design.abstract';
import { MosaicDesign } from './mosaic-design.class';
import { ImagesService } from './images.service';
import Konva from 'konva';
import { Observable } from 'rxjs';
import { v4 } from 'uuid';


const PREVIEW_IMAGE_WIDTH: number = 1200;
const PREVIEW_IMAGE_HEIGHT: number = 1200;
const PREVIEW_IMAGE_BORDER: number = 0;

@Injectable( {
    providedIn: 'root'
} )
export class RendererService {

    private _containerElement : HTMLDivElement;
    private _stage : Konva.Stage;
    private readonly _mainLayer : Konva.Layer = new Konva.Layer( { clearBeforeDraw: true } );
    private _activeRendererDesign : Design = null;
    private _orderId: string = '';

    public constructor (
        @Inject( 'uiImageQuality' ) @Optional() private readonly _uiImageQuality: number = 0.5,
        private readonly _imageService: ImagesService
    ) {
    }

    public init ( container: HTMLDivElement ) {

        this.createNewOrderId();

        this._containerElement = container;
        this._stage = new Konva.Stage( { draggable: false, container: this._containerElement.id } );
        this._stage.add( this._mainLayer );

        this._activeRendererDesign = new MosaicDesign( this._imageService.images, { x: 0, y: 0 } );
        this._mainLayer.add( this._activeRendererDesign );
    }

    public get containerElement (): HTMLDivElement {
        return this._containerElement;
    }

    public get width (): number {
        return this._stage.width();
    }

    public get height (): number {
        return this._stage.height();
    }

    public setSize ( width, height ) {
        this.updateStageDimensions( width, height );
    }

    public get orderId () : string {
        return this._orderId;
    }

    public get activeDesign () : Design {
        return this._activeRendererDesign;
    }

    public createNewOrderId () {
        this._orderId = v4();
    }

    public shuffle (): void {

        if ( !!this._activeRendererDesign ) {

            // GH-401: Set shuffle state to active (influences Shuffle button state)
            // this._appService.shuffleActive = true;

            this._activeRendererDesign.update( { x: this._stage.width(), y: this._stage.height() }, false );

            // Stage redraw will be called as soon as filters finished
            // this.setImagesFilter( filter );

            // GH-401: Set shuffle state to inactive
            // this._appService.shuffleActive = false;

        }

    }

    public getCanvasImageData () {
        return this._stage.toDataURL( { quality: 0.8, mimeType: 'image/jpeg', pixelRatio: 2.0 } );
    }

    /**
     * Generate a preview image for sharing
     *
     * @param image      The image
     * @returns         Observable for new image
     */
    public generatePreview ( image: string = this.getCanvasImageData() ): Observable<string> {

        return new Observable<string>( subscriber => {

            const canvas = document.createElement( 'canvas' );

            canvas.width = PREVIEW_IMAGE_WIDTH;
            canvas.height = PREVIEW_IMAGE_HEIGHT;

            const ctx = canvas.getContext( '2d' );

            const previewImg = new Image();
            // const logo = new Image();

            // logo.onload = () => {

            previewImg.onload = () => {

                ctx.fillStyle = 'white';
                ctx.fillRect( 0, 0, PREVIEW_IMAGE_WIDTH, PREVIEW_IMAGE_HEIGHT );

                ctx.drawImage( previewImg, PREVIEW_IMAGE_BORDER, PREVIEW_IMAGE_BORDER,
                    PREVIEW_IMAGE_WIDTH - 2 * PREVIEW_IMAGE_BORDER, PREVIEW_IMAGE_HEIGHT - 2 * PREVIEW_IMAGE_BORDER );

                // const logoW: number = PREVIEW_IMAGE_LOGO_WIDTH * PREVIEW_IMAGE_LOGO_SCALE;
                // const logoH: number = PREVIEW_IMAGE_LOGO_HEIGHT * PREVIEW_IMAGE_LOGO_SCALE;
                // ctx.drawImage( logo, PREVIEW_IMAGE_WIDTH / 2 - logoW / 2,
                //     ( PREVIEW_IMAGE_BORDER - logoH ) / 2, logoW, logoH );

                // ctx.font = `${ PREVIEW_IMAGE_BOTTOM_TEXT_FONT_SIZE }px ${ PREVIEW_IMAGE_BOTTOM_TEXT_FONT_FAMILY }`;
                // ctx.fillStyle = 'black';
                // ctx.textAlign = 'center';
                // ctx.textBaseline = 'top';
                // ctx.fillText( PREVIEW_IMAGE_BOTTOM_TEXT, PREVIEW_IMAGE_WIDTH / 2,
                //     PREVIEW_IMAGE_HEIGHT - ( PREVIEW_IMAGE_BORDER + PREVIEW_IMAGE_BOTTOM_TEXT_FONT_SIZE ) / 2 );

                const prev: string = canvas.toDataURL( 'image/jpeg', 0.8 );

                subscriber.next( prev );
                subscriber.complete();

            };

            previewImg.src = image;

            // };
            //
            // logo.src = PREVIEW_IMAGE_LOGO_SRC;

        } );

    }

    // public showHideDesign ( show: boolean ) {
    //
    //     this._activeRendererDesign.visible( show );
    //     this._backgroundLayer.visible( show );
    //     this._stage.batchDraw();
    //
    // }

    public redraw (): void {
        this._stage.batchDraw();
    }

    private updateStageDimensions ( width: number, height: number ): void {

        const lineStroke = this._activeRendererDesign?.getStrokeWidth() || 0;

        if ( !!this._stage && (width !== this._stage.width() - lineStroke || height !== this._stage.height() - lineStroke ) ) {

            if (isDevMode()) {
                console.log( 'New stage dimensions', width, height );
            }

            // Easiest way to remove surrounding border in canvas by shifting stage by line stroke width...
            this._stage.offsetX( lineStroke / 2 );
            this._stage.offsetY( lineStroke / 2 );

            height += lineStroke;
            width += lineStroke;

            this._stage.width( width );
            this._stage.height( height );

            if ( !!this._activeRendererDesign ) {
                this._activeRendererDesign.update( { x: width, y: height }, true );
            }

            this.redraw();
        }
    }

}
