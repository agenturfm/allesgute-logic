/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

/* tslint:disable:variable-name no-inferrable-types */
import { EventEmitter, Inject, Injectable, Optional } from '@angular/core';
import { Design, Tile, TileFilterOperationType } from './design.abstract';
import { MosaicDesign } from './mosaic-design.class';
import { IMAGES_SERVICE_IMAGES_TOTAL_ALLOWED, ImagesService, UIImage } from './images.service';
import Konva from 'konva';
import { v4 } from 'uuid';
import { forkJoin, Observable, of } from 'rxjs';


const PREVIEW_IMAGE_WIDTH: number = 1200;
const PREVIEW_IMAGE_HEIGHT: number = 1200;
const PREVIEW_IMAGE_BORDER: number = 48;
const PREVIEW_IMAGE_BOTTOM_TEXT: string = 'printyomo.com';
const PREVIEW_IMAGE_BOTTOM_TEXT_FONT_SIZE: number = 20;
const PREVIEW_IMAGE_BOTTOM_TEXT_FONT_FAMILY: string = 'source_sans_proregular';
const PREVIEW_IMAGE_LOGO_SRC: string = 'assets/icons/logo.svg';
const PREVIEW_IMAGE_LOGO_WIDTH: number = 427;
const PREVIEW_IMAGE_LOGO_HEIGHT: number = 97;
const PREVIEW_IMAGE_LOGO_SCALE: number = 28 / PREVIEW_IMAGE_LOGO_HEIGHT;

// #10: Static amount of canvasses to render tiles filters
interface FilterCanvas {
    free : boolean;
    canvas : HTMLCanvasElement;
    context : CanvasRenderingContext2D;
}
const FILTER_CANVAS: Map<number, FilterCanvas> = new Map<number, FilterCanvas>();

export enum RendererDesignType {

    Voronoi = 0,
    Square = 1,
    Mosaic = 2,
    Prints = 3,
    Stripes = 4

}

@Injectable( {
    providedIn: 'root'
} )
export class RendererService {

    private _containerElement : HTMLDivElement; // = <HTMLDivElement> document.getElementById('konvacanvas');
    private _stage : Konva.Stage;
    private readonly _mainLayer : Konva.Layer = new Konva.Layer( { clearBeforeDraw: true } );
    // #10: needed when generating image data from stage (preview, mockup in checkout stage)
    // If not enabled, background will be black (visible in prints design only)
    private readonly _backgroundLayer : Konva.Layer = new Konva.Layer( { clearBeforeDraw: true, listening: false } );
    private readonly _backgroundRect : Konva.Rect = new Konva.Rect( { fillEnabled: true, fill: '#FFFFFF' } );

    private _yomoID : string = null;
    private _activeRendererDesign : Design = null;

    private readonly _filterWorkerDone : EventEmitter< number > = new EventEmitter< number >( true );
    private _filterWorkers : number = 0;

    public _isEditing : boolean = false;

    public constructor (
        @Inject( 'initialRendererDesign' ) @Optional() private _rendererDesign: RendererDesignType = RendererDesignType.Mosaic,
        @Inject( 'uiImageQuality' ) @Optional() private readonly _uiImageQuality: number = 0.5,
        private readonly _imageService: ImagesService
    ) {


    }

    public init ( container: HTMLDivElement ) {

        this._containerElement = container;
        //
        // this._containerElement.style.width = '100%';
        // this._containerElement.style.height = '100%';
        // this._containerElement.style.overflow = 'hidden';

        this._stage = new Konva.Stage( { draggable: false, container: this._containerElement.id } );

        // this._backgroundLayer.add( this._backgroundRect );
        // this._stage.add( this._backgroundLayer );
        this._stage.add( this._mainLayer );

        // New yomo id
        // this.newYomoID();

        this._activeRendererDesign = new MosaicDesign( this._imageService.images, { x: 0, y: 0 } );
        this._mainLayer.add( this._activeRendererDesign );

        // New renderer design
        // this.setupRendererDesign();

    }

    public get containerElement (): HTMLDivElement {

        return this._containerElement;

    }

    public get mainLayer (): Konva.Layer {

        return this._mainLayer;

    }

    public get width (): number {

        return this._stage?.width();

    }

    /*
    // #91: Removed in favour of setSize()!
    //
    public set width ( value: number ) {

        // Only re-apply new width if changed;
        if ( !! value && value !== this.width ) {

            this.updateStageDimensions( value, this._stage.height() );

        }

    }
*/

    public get height (): number {

        return this._stage?.height();

    }

/*
    // #91: Removed in favour of setSize()!
    //
    public set height ( value: number ) {

        // Only re-apply new width if changed;
        if ( !! value && value !== this.height ) {

            this.updateStageDimensions( this._stage.width(), value );

        }

    }
*/

    public setSize ( width, height ) {
        this.updateStageDimensions( width, height );
    }

    public get rendererDesignType (): RendererDesignType {

        return this._rendererDesign;

    }


    // public performHammerEvent ( eventType: HammerInputEventType, event: HammerInput | WheelEvent ): void {
    //
    //     // Only perform a hammer event when a design is active and images are available
    //     if ( !! this._activeRendererDesign && this._imageService.images.length > 0 ) {
    //
    //         // GH-343: Redirect to "bearbeiten" slide
    //         if ( ( eventType === HammerInputEventType.PRESS || eventType === HammerInputEventType.TAP ) &&
    //             this._appService.currentAppSlide !== this._appService.sliderIdBearbeiten ) {
    //
    //             // Remember event to forward here again after slider movement and Edit component initialization
    //             this._appService.setCurrentAppSlideAndEvent( this._appService.sliderIdBearbeiten, eventType, event );
    //
    //         }
    //
    //         const rect: ClientRect | DOMRect = this._containerElement.getBoundingClientRect();
    //
    //         let x: number;
    //         let y: number;
    //
    //         if ( event instanceof WheelEvent ) {
    //
    //             x = event.clientX - rect.left;
    //             y = event.clientY - rect.top;
    //
    //         } else {
    //
    //             x = event.center.x - rect.left;
    //             y = event.center.y - rect.top;
    //
    //         }
    //
    //         // Fire the event "into" the active konva group
    //         this._activeRendererDesign.fire( 'hammer', new HammerKonvaEventInput( { x, y }, eventType, event as HammerInput ) );
    //
    //     }
    //
    // }

    public shuffle ( filter: TileFilterOperationType = this._activeRendererDesign.getImagesFilter() ): void {

        if ( !!this._activeRendererDesign ) {

            // GH-401: Set shuffle state to active (influences Shuffle button state)
            // this._appService.shuffleActive = true;

            // #7: Reset possibly focused tile before shuffle
            this.focusTileReset( false );

            this._activeRendererDesign.update( { x: this._stage.width(), y: this._stage.height() }, false );

            // Stage redraw will be called as soon as filters finished
            // this.setImagesFilter( filter );

            // GH-401: Set shuffle state to inactive
            // this._appService.shuffleActive = false;

        }

    }

    public updateImages (): void {

        if ( !!this._activeRendererDesign ) {

            // #4 (GH #187): Re-apply images filter
            const filter: TileFilterOperationType = this._activeRendererDesign.getImagesFilter();

            this._activeRendererDesign.imagesChanged();

            // #4
            // Will redraw
            // this.setImagesFilter( filter );

        }

    }

    /**
     * Set filter to all tiles
     *
     * @param value   Optional new filter value
     */
    // public setImagesFilter ( value: TileFilterOperationType = this._activeRendererDesign.getImagesFilter() ) {
    //
    //     const filterWorkers: Array<Observable<void>> = [];
    //
    //     // GH-401: Will be re-set in filter component when all workers are finished.
    //     // Influences state of Shuffle button
    //     this._appService.filterWorkersActive = true;
    //
    //     this._activeRendererDesign.tiles.forEach( tile => {
    //
    //         tile.filter = value;
    //         // Create the workers
    //         this._filterWorkers = 0;
    //         filterWorkers.push( this.applyTileFilter( tile ) );
    //
    //     } );
    //
    //     // Wait for all filter workers to finish, then redraw stage
    //     // tslint:disable-next-line:no-empty
    //     forkJoin( ...filterWorkers ).subscribe( () => {}, () => {}, () => {
    //
    //         // Redraw stage as soon as all filters finished
    //         this.redraw();
    //
    //         // GH-401: Reset state of filter worker active (influences state of Shuffle button)
    //         this._appService.filterWorkersActive = false;
    //
    //     } );
    //
    // }

    public focusTile ( tile: Tile ): void {

        this._activeRendererDesign.focusTile( tile );
        this.redraw();

    }

    /**
     * Reset focused tile
     * @param animation   Whether to use animation on resetting or not
     */
    public focusTileReset ( animation: boolean = true ): void {

        if ( true === this._activeRendererDesign.focusTileReset( animation ) ) {

            // #7: Do immediate re-draw (no batch)
            this.redraw();

        }

    }

    public highlightTile ( tile: Tile ): void {

        this._activeRendererDesign.removeTilesHighlight();
        this._activeRendererDesign.highlightTile( tile );
        this._mainLayer.batchDraw();

    }

    public removeTilesHighlight (): void {

        this._activeRendererDesign.removeTilesHighlight();
        this._mainLayer.draw();

    }

    public getCanvasImageData () {

        return this._stage.toDataURL( { quality: 0.8, mimeType: 'image/jpeg', pixelRatio: 2.0 } );

    }

    /**
     * Generate a preview image for sharing
     *
     * @param yomo      The yomo
     * @returns         Observable for new image
     */
    public generatePreview ( yomo: string = this.getCanvasImageData() ): Observable<string> {

        return new Observable<string>( subscriber => {

            const canvas = document.createElement( 'canvas' );

            canvas.width = 1200;
            canvas.height = 1200;

            const ctx = canvas.getContext( '2d' );

            const previewImg = new Image();
            const logo = new Image();

            logo.onload = () => {

                previewImg.onload = () => {

                    ctx.fillStyle = 'white';
                    ctx.fillRect( 0, 0, PREVIEW_IMAGE_WIDTH, PREVIEW_IMAGE_HEIGHT );

                    ctx.drawImage( previewImg, PREVIEW_IMAGE_BORDER, PREVIEW_IMAGE_BORDER,
                        PREVIEW_IMAGE_WIDTH - 2 * PREVIEW_IMAGE_BORDER, PREVIEW_IMAGE_HEIGHT - 2 * PREVIEW_IMAGE_BORDER );

                    const logoW: number = PREVIEW_IMAGE_LOGO_WIDTH * PREVIEW_IMAGE_LOGO_SCALE;
                    const logoH: number = PREVIEW_IMAGE_LOGO_HEIGHT * PREVIEW_IMAGE_LOGO_SCALE;
                    ctx.drawImage( logo, PREVIEW_IMAGE_WIDTH / 2 - logoW / 2,
                        ( PREVIEW_IMAGE_BORDER - logoH ) / 2, logoW, logoH );

                    ctx.font = `${ PREVIEW_IMAGE_BOTTOM_TEXT_FONT_SIZE }px ${ PREVIEW_IMAGE_BOTTOM_TEXT_FONT_FAMILY }`;
                    ctx.fillStyle = 'black';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText( PREVIEW_IMAGE_BOTTOM_TEXT, PREVIEW_IMAGE_WIDTH / 2,
                        PREVIEW_IMAGE_HEIGHT - ( PREVIEW_IMAGE_BORDER + PREVIEW_IMAGE_BOTTOM_TEXT_FONT_SIZE ) / 2 );

                    const prev: string = canvas.toDataURL( 'image/jpeg', 0.8 );

                    subscriber.next( prev );
                    subscriber.complete();

                };

                previewImg.src = yomo;

            };

            logo.src = PREVIEW_IMAGE_LOGO_SRC;

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

    public getStageDimensions (): Konva.Vector2d {

        return { x:  this._stage.width(), y: this._stage.height() };

    }

    private updateStageDimensions ( width: number, height: number ): void {

        if ( !!this._stage && (width !== this._stage.width() || height !== this._stage.height()) ) {

            console.log( 'New stage dimensions', width, height );

            this._stage.width( width );
            this._stage.height( height );

            if ( !!this._activeRendererDesign ) {

                this._backgroundRect.width( width );
                this._backgroundRect.height( height );

                this._activeRendererDesign.update( { x: width, y: height }, true );

            }

            this._stage.draw();

        }

    }

    private setupRendererDesign () {

        // Cleanup
        if ( !!this._activeRendererDesign ) {

            // GH #145: Make sure Konva cache canvas is cleared on remove/destroy of current design
            this._activeRendererDesign.clear();
            this._activeRendererDesign.remove();
            this._activeRendererDesign.destroy();
            this._activeRendererDesign = null;

        }

        const dimensions: Konva.Vector2d = { x: this._stage.width(), y: this._stage.height() };

        this._activeRendererDesign = new MosaicDesign( this._imageService.images, dimensions );
        this._mainLayer.add( this._activeRendererDesign );

    }

    private newYomoID () {

        this._yomoID = v4();

    }

    // noinspection JSMethodCanBeStatic
    private initializeFilterCanvas (): void {

        for ( let i: number = 0; i < IMAGES_SERVICE_IMAGES_TOTAL_ALLOWED; i++ ) {

            const canvas: HTMLCanvasElement = document.createElement( 'canvas' );
            canvas.id = 'FilterCanvas-' + i;
            canvas.width = 0;
            canvas.height = 0;

            FILTER_CANVAS.set( i, {
                free: true,
                canvas,
                context: canvas.getContext( '2d' )
            } );

        }

    }

    // noinspection JSMethodCanBeStatic
    private getFilterCanvas (): FilterCanvas|null {

        let i: number;

        for ( i = 0; i < IMAGES_SERVICE_IMAGES_TOTAL_ALLOWED; i++ ) {

            if ( true === FILTER_CANVAS.get( i ).free ) {

                // Mark as occupied
                FILTER_CANVAS.get( i ).free = false;
                break;

            }

        }

        return i < IMAGES_SERVICE_IMAGES_TOTAL_ALLOWED ? FILTER_CANVAS.get( i ) : null;

    }

    // noinspection JSMethodCanBeStatic
    private releaseFilterCanvas ( canvas: FilterCanvas ): void {

        canvas.canvas.width = 0;
        canvas.canvas.height = 0;
        // Release, mark as free
        canvas.free = true;

    }

    //
    // !!! IMPORTANT !!!
    // When changing filter settings (values) below, remember to change settings in backend, too!
    //
    // private applyTileFilter ( tile: Tile ): Observable<void> {
    //
    //     const image: Konva.Image = tile.getKonvaImage();
    //
    //     let filter: InstagramFilters;
    //
    //     switch ( tile.filter ) {
    //
    //         case TileFilterOperationType.NONE:
    //             break;
    //
    //         case TileFilterOperationType.Coolgray:
    //             filter = new WillowInstagramFilter();
    //             break;
    //
    //         case TileFilterOperationType.SW:
    //             filter = new InkwellInstagramFilter();
    //             break;
    //
    //         case TileFilterOperationType.Vintage:
    //             filter = new RiseInstagramFilter();
    //             break;
    //
    //         case TileFilterOperationType.Cross:
    //             filter = new ClarendonInstagramFilter();
    //             break;
    //
    //     }
    //
    //     // Find a free filter canvas
    //     const canvasElem: FilterCanvas = this.getFilterCanvas();
    //
    //     if ( !! image && !! canvasElem ) {
    //
    //         return new Observable<void>( subscriber => {
    //
    //             // Get reference to original (unfiltered) UI image
    //             const uiImage: UIImage = this._imageService.getImageByUUID( tile.tileId );
    //
    //             const canvas: HTMLCanvasElement = canvasElem.canvas;
    //             const ctx2D = canvasElem.context;
    //
    //             canvas.width = uiImage.image.width;
    //             canvas.height = uiImage.image.height;
    //
    //             // Draw original UI image to new canvas
    //             ctx2D.drawImage( this._imageService.getImageByUUID( tile.tileId ).image, 0, 0, uiImage.image.width, uiImage.image.height );
    //
    //             // Only perform pixel operation if filter type is not 'NONE'
    //             if ( !! filter ) {
    //
    //                 // Get the pixels
    //                 filter.imageData = ctx2D.getImageData( 0, 0, uiImage.image.width, uiImage.image.height );
    //                 // Apply filter
    //                 filter.apply();
    //                 // Write the modified pixels
    //                 ctx2D.putImageData( filter.imageData, 0, 0 );
    //
    //             }
    //
    //             // Create a new img element used as source for Konva image associated to tile
    //             const filteredImage: HTMLImageElement = document.createElement( 'img' );
    //             filteredImage.onload = () => {
    //
    //                 // Update the image source of Konva image
    //                 image.image( filteredImage );
    //
    //                 // Free the canvas
    //                 this.releaseFilterCanvas( canvasElem );
    //
    //                 this._filterWorkerDone.emit( ++this._filterWorkers );
    //
    //                 subscriber.next();
    //                 subscriber.complete();
    //
    //             };
    //             // Set the base64 encoded image as source of new HTML img
    //             filteredImage.src = canvas.toDataURL( 'image/jpeg', this._uiImageQuality );
    //
    //         } );
    //
    //     } else {
    //
    //         console.error( `Invalid filter state: image = ${ image }, canvas = ${ canvasElem }` );
    //
    //     }
    //
    //     // Error case, no Konva image found
    //     return of();
    //
    // }

}
