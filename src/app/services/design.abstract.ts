/*!
 * Copyright florianmatthias o.G. 2021 - All rights reserved
 */

import { UIImage } from './images.service';
import Konva from 'konva';
import { v4 } from 'uuid';
import { SceneContext } from 'konva/lib/Context';

// Deprecated: Stroke width of 'splines' between images
// Use getStrokeWidth() instead.
// export const DESIGN_STROKE_WIDTH: number = 3;

const LOW_RES_IMAGE_LINE_COLOR: string = '#E4007B';


export class TileTransformOperations {

    public constructor (
        private _rotation: number = 0,
        private _initialRotation: number = 0,
        private _scale: number = 1,
        private _initialScale: number = 1,
        private _userScale: number = 1,
        private _flipX: boolean = false,
        private _flipY: boolean = false,
        private _position: Konva.Vector2d = { x: 0, y: 0 },
        private _positionOffs: Konva.Vector2d = { x: 0, y: 0 },
        private _initialPosition: Konva.Vector2d = { x: 0, y: 0 },
        private _center: Konva.Vector2d = { x: 0, y: 0 }
    ) {}

    public get rotation (): number {

        return this._rotation;

    }

    public set rotation ( value: number ) {

        this._rotation = value;

    }

    public get initialRotation (): number {

        return this._initialRotation;

    }

    public set initialRotation ( value: number ) {

        this._initialRotation = value;

    }

    public get scale (): number {

        return this._scale;

    }

    public set scale ( value: number ) {

        this._scale = value;

    }

     public get userScale (): number {

        return this._userScale;

    }

    public set userScale ( value: number ) {

        this._userScale = value;

    }

    public set initialScale ( value: number ) {

        this._initialScale = value;

    }

    public get flipX (): boolean {

        return this._flipX;

    }

    public set flipX ( value: boolean ) {

        this._flipX = value;

    }

    public get flipY (): boolean {

        return this._flipY;

    }

    public set flipY ( value: boolean ) {

        this._flipY = value;

    }

    public get position (): Konva.Vector2d {

        return this._position;

    }

    public set position ( value: Konva.Vector2d ) {

        this._position.x = value.x;
        this._position.y = value.y;

    }

    public get initialPosition (): Konva.Vector2d {

        return this._initialPosition;

    }

    public get positionOffs (): Konva.Vector2d {

        return this._positionOffs;

    }

    public get center (): Konva.Vector2d {

        return this._center;

    }

    public set center ( value: Konva.Vector2d ) {

        this._center.x = value.x;
        this._center.y = value.y;

    }

    public calcCombinedScale ( currScale: number ): number {

        return this._userScale * this._initialScale * ( currScale / this._initialScale );

    }

}

export class Tile extends Konva.Group {

    private readonly _tileId : string = v4();
    private readonly _tileCache : Array< Konva.Vector2d > = [];
    private _transformations : TileTransformOperations = new TileTransformOperations();
    private _boundingPolyLine : Konva.Line;
    private _lowResImage : boolean = false;
    // GH-339: Rotation of tile image (Prints design only)
    private _imageBaseRotation : number = 0;

    public constructor (
        private readonly _tileIndex: number,
        private readonly _tile: Array< Konva.Vector2d >,
        private readonly _shadow: boolean = false
    ) {

        super();

        this.cachePath();

    }

    public get tileId (): string {

        return this._tileId;

    }

    public get path (): Array< Konva.Vector2d > {

        return this._tile;

    }

    public get shadow (): boolean {

        return this._shadow;

    }

    public get cachedPath (): Array< Konva.Vector2d > {

        return this._tileCache;

    }

    public get transformations (): TileTransformOperations {

        return this._transformations;

    }

    public set transformations ( value: TileTransformOperations ) {

        this._transformations = value;

    }

    public get imageBaseRotation (): number {

        return this._imageBaseRotation;

    }

    public set imageBaseRotation ( value: number ) {

        this._imageBaseRotation = value;

    }

    public containsPoint ( p: Konva.Vector2d ): boolean {

        // This polygon contains point "p"?
        let inside: boolean = false;

        for ( let i = 0, j = this.path.length - 1; i < this.path.length; j = i++ ) {

            const xi = this.path[ i ].x;
            const yi = this.path[ i ].y;
            const xj = this.path[ j ].x;
            const yj = this.path[ j ].y;

            const intersect = ( ( yi > p.y ) !== ( yj > p.y ) ) && ( p.x < ( xj - xi ) * ( p.y - yi ) / ( yj - yi ) + xi );

            if ( intersect ) {

                inside = !inside;

            }

        }

        return inside;

    }

    public renderTile ( ctx: SceneContext ) {

        // set the first point
        ctx.moveTo( this.path[ 0 ].x, this.path[ 0 ].y );

        let n: number = this.path.length;

        // Eliminate the duplicate end points (if present)
        while ( this.path[ 0 ].x === this.path[ n - 1 ].x && this.path[ 0 ].y === this.path[ n - 1 ].y ) {
            n--;
        }

        // iterate over the left over points and draw a line
        for ( let i = 1; i < n; i++ ) {
            if ( this.path[ i ].x !== this.path[ i - 1 ].x || this.path[ i ].y !== this.path[ i - 1 ].y ) {
                ctx.lineTo( this.path[ i ].x, this.path[ i ].y );
            }
        }

        // close the path (important for masking)
        ctx.closePath();
    }

    public addKonvaLine ( lowResolution: boolean = false, tileLineStrokeWidth: number = 3 ) {

        this._lowResImage = lowResolution;

        this.add(
            this._boundingPolyLine = new Konva.Line( {
                points: [].concat( ...this.path.map( value => [ value.x, value.y ] ) ),
                strokeWidth: tileLineStrokeWidth,
                closed: true,
                perfectDrawEnabled: false,
                listening: false
            } )
        );

        this.setKonvaLineLowResStatus( lowResolution );
    }

    public setKonvaLineLowResStatus ( lowResolution: boolean = this._lowResImage ): void {

        if ( !! this._boundingPolyLine ) {

            this._boundingPolyLine.stroke( lowResolution ? LOW_RES_IMAGE_LINE_COLOR : 'white' );

            if ( lowResolution ) {

                this.moveToTop();

            }

        }

    }

    public flashKonvaLine (): void {

        this.moveToTop();

        this._boundingPolyLine.to( {
            stroke: LOW_RES_IMAGE_LINE_COLOR,
            duration: .15,
            easing: Konva.Easings.EaseInOut,
            onFinish: () => {

                this._boundingPolyLine.to( {
                    stroke: 'white',
                    duration: .15,
                    easing: Konva.Easings.EaseInOut
                } );

            }
        } );

    }

    public addShadow (): void {

        if ( !! this.shadow ) {

            this.add(
                new Konva.Line( {

                    points: [].concat( ...this.path.map( value => [ value.x, value.y ] ) ),
                    fill: 'white',
                    closed: true,
                    perfectDrawEnabled: false,
                    listening: false,
                    shadowEnabled: true,
                    shadowOpacity: 0.5,
                    shadowBlur: 10,
                    shadowOffset: { x: 5, y: 5 }    // FYI: On change must be adapted in "src/app/services/designs/prints-design.class.ts" on "TILE_PRINTS_SHADOW" as well
                } )
            );

        }

    }

    public getBBPolygon (): [ Konva.Vector2d, Konva.Vector2d ] {

        let xMin: number = Number.MAX_SAFE_INTEGER;
        let xMax: number = Number.MIN_SAFE_INTEGER;
        let yMin: number = Number.MAX_SAFE_INTEGER;
        let yMax: number = Number.MIN_SAFE_INTEGER;

        this.path.forEach( point => {

            xMax = Math.max( point.x, xMax );
            xMin = Math.min( point.x, xMin );

            yMax = Math.max( point.y, yMax );
            yMin = Math.min( point.y, yMin );

        } );

        return [ { x: xMin, y: yMin }, { x: xMax, y: yMax } ];

    }

    // noinspection JSUnusedGlobalSymbols
    public getKonvaImage (): Konva.Image {

        const images = this.find( node => {

            return node instanceof Konva.Image && node.id() === this._tileId;

        } );

        if ( images.length > 0 ) {

            return images[ 0 ] as Konva.Image;

        }

        return undefined;

    }

    private cachePath (): void {

        this._tileCache.splice( 0 );
        this._tile.forEach( tile => this._tileCache.push( { x: tile.x, y: tile.y } ) );

    }

}

export abstract class Design extends Konva.Group {

    private _shuffleDimensions : Konva.Vector2d = { x: this._dimensions.x, y: this._dimensions.y };
    private _focusedTile : Tile;

    protected constructor ( private _images: Array< UIImage >, private readonly _dimensions: Konva.Vector2d ) {
        super();
    }

    protected get images (): Array< UIImage > {

        return this._images;

    }

    protected get dimensions (): Konva.Vector2d {

        return this._dimensions;

    }

    public get tiles (): Array< Tile > {

        const tiles: Array< Tile > = new Array< Tile >();

        this.children.forEach( child => child instanceof Tile ? tiles.push( child ) : null );

        return tiles;

    }

    public get tilesAmount (): number {

        return this.children.length;

    }

    public clear (): void {

        this.tiles.forEach( tile => {

            // #93
            this.clearCacheCanvas( tile );
            tile.remove();

        } );
        this.destroyChildren();

    }

    public clearImages (): void {

        this.tiles.forEach( tile => {

            const tileGrp: Konva.Group = ( tile as Konva.Group );
            // #93
            this.clearCacheCanvas( tile );
            tileGrp.children.forEach( tileChild => tileChild.remove() );
            tileGrp.destroyChildren();

        } );

    }

    /**
     * Update current design
     *
     * @param dimensions        Optional dimensions of new design
     * @param skipShuffle       Whether to skip image shuffling or not; if not shuffled, tiles remain, only images are re-applied
     */
    public update ( dimensions?: Konva.Vector2d, skipShuffle: boolean = false ): void {

        let scaleChanged: boolean = false;

        // Update call without dimensions: just re-apply images
        if ( false === !!dimensions ) {
            dimensions = { x: this._dimensions.x, y: this._dimensions.y };
            skipShuffle = true;
        } else {
            scaleChanged = this._dimensions.x !== dimensions.x || this._dimensions.y !== dimensions.y;
        }

        // Update the dimensions first
        this._dimensions.x = dimensions.x;
        this._dimensions.y = dimensions.y;

        if ( false === skipShuffle ) {
            // Clear the tiles
            this.clear();
        } else {

            // Clear the images associated to the tiles if no re-shuffle!
            this.clearImages();

            const currentScale: number = this._shuffleDimensions.x > 0 ? dimensions.x / this._shuffleDimensions.x : 1;
            this.scaleTilePath( currentScale );
        }

        if ( this._images.length > 0 ) {

            if ( false === skipShuffle ) {

                this._shuffleDimensions = { x: this._dimensions.x, y: this._dimensions.y };
                // Compute the tiles of the selected design
                this.computeTiles();
                // Shuffle the images
                this.shuffleImages();
            }

            // Apply the images to the tiles
            this.applyImages( ! skipShuffle, scaleChanged );
        }
    }

    // public focusTile ( tile: Tile ): void {
    //
    //     const boundingBox: [ Konva.Vector2d, Konva.Vector2d ] = tile.getBBPolygon();
    //
    //     // Adopt scale to fill nearly entire stage dimensions
    //     const bbWidth: number = boundingBox[1].x - boundingBox[0].x;
    //     const bbHeight: number = boundingBox[1].y - boundingBox[0].y;
    //
    //     const scaleX: number = this._dimensions.x / bbWidth;
    //     const scaleY: number = this._dimensions.y / bbHeight;
    //     const scale: number = Math.min( scaleX, scaleY ) * .85;
    //
    //     // Center tile in stage
    //     const invScale: number = 1 / scale;
    //
    //     // Animate scaling / centering
    //     // #9: Use this for single-shot Tween according to KonvaJS memory leak avoidance tips
    //     // Ref: https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html
    //     this.to( {
    //         scaleX: scale,
    //         scaleY: scale,
    //         offsetX: boundingBox[0].x - invScale * ( ( this._dimensions.x - bbWidth * scale ) / 2 ),
    //         offsetY: boundingBox[0].y - invScale * ( ( this._dimensions.y - bbHeight * scale ) / 2 ),
    //         duration: .5,
    //         easing: Konva.Easings.StrongEaseOut
    //     } );
    //
    //     // Shade other tiles
    //     this.shadeOtherTiles( tile );
    //
    //     // #7: Remember currently focused tile
    //     this._focusedTile = tile;
    //
    // }

    // /**
    //  * Reset focused tile
    //  *
    //  * @param animation   Whether to use animation on resetting or not
    //  */
    // // public focusTileReset ( animation: boolean = true ): boolean {
    //
    //     if ( !! this._focusedTile ) {
    //
    //         if ( true === animation ) {
    //
    //             // Animate tile reset
    //             // #9: Use this for single-shot Tween according to KonvaJS memory leak avoidance tips
    //             // Ref: https://konvajs.org/docs/performance/Avoid_Memory_Leaks.html
    //             this.to( {
    //                 scaleX: 1,
    //                 scaleY: 1,
    //                 offsetX: 0,
    //                 offsetY: 0,
    //                 duration: .5,
    //                 easing: Konva.Easings.StrongEaseOut
    //             } );
    //
    //         } else {
    //
    //             this.scale( { x: 1, y: 1 } );
    //             this.offset( { x: 0, y: 0 } );
    //
    //         }
    //
    //         // Reset shading of other tiles
    //         this.shadeOtherTiles( this._focusedTile, false );
    //
    //         this._focusedTile.setKonvaLineLowResStatus();
    //
    //         this._focusedTile = undefined;
    //
    //         return true;
    //
    //     }
    //
    //     return false;
    //
    // }

    // public shadeOtherTiles ( self: Tile, shade: boolean = true ): void {
    //
    //     this.tiles.forEach( tile => {
    //
    //         if ( tile !== self ) {
    //
    //             // Remove previous shade poly if present
    //             tile.find( '.shade' ).forEach( shadeObj => {
    //
    //                 shadeObj.remove();
    //                 shadeObj.destroy();
    //
    //             } );
    //
    //             if ( true === shade ) {
    //
    //                 // Have to create a new overlay polygon, otherwise opacity on current poly
    //                 // conflicts with layering of tiles; and we cannot use 'moveToTop', as this
    //                 // jeopardizes image order!
    //                 tile.add( new Konva.Line( {
    //                     name: 'shade',
    //                     points: [].concat( ...tile.path.map( entry => [ entry.x, entry.y ] ) ),
    //                     fillEnabled: true,
    //                     fill: 'white',
    //                     opacity: 0.5,
    //                     closed: true
    //                 } ) );
    //
    //             }
    //
    //         }
    //
    //     } );
    //
    // }

    // public removeTilesHighlight (): void {
    //
    //     this.tiles.forEach( tile => {
    //
    //         // Remove other highlights if any
    //         tile.find( '.highlight' ).forEach( shadeObj => {
    //
    //             shadeObj.remove();
    //             shadeObj.destroy();
    //
    //         } );
    //
    //     } );
    //
    // }

    // public highlightTile ( self: Tile ): void {
    //
    //     self.add( new Konva.Line( {
    //         name: 'highlight',
    //         points: [].concat( ...self.path.map( entry => [ entry.x, entry.y ] ) ),
    //         fillEnabled: true,
    //         fill: 'white',
    //         opacity: 0.5,
    //         closed: true
    //     } ) );
    //
    // }

    // public applyUserScale ( tile: Tile, img: Konva.Image = tile.getKonvaImage(), dryRun: boolean = false ): number {
    //
    //     const currImgScale: number = this.calcImgScale( img.width(), img.height(), tile );
    //     const newScale: number = tile.transformations.calcCombinedScale( currImgScale );
    //
    //     if ( false === dryRun ) {
    //
    //         tile.transformations.scale = newScale;
    //
    //         img.scale( {
    //             x: tile.transformations.scale * ( tile.transformations.flipX ? - 1 : 1 ),
    //             y: tile.transformations.scale * ( tile.transformations.flipY ? - 1 : 1 )
    //         } );
    //
    //     }
    //
    //     return newScale;
    //
    // }
    //
    // public flipImage ( tile: Tile, img: Konva.Image = tile.getKonvaImage() ): void {
    //
    //     const flip: boolean = tile.transformations.initialRotation % 180 !== 0;
    //
    //     if ( flip ) {
    //
    //         tile.transformations.flipY = ! tile.transformations.flipY;
    //
    //     } else {
    //
    //         tile.transformations.flipX = ! tile.transformations.flipX;
    //
    //     }
    //
    //     this.applyUserScale( tile, img );
    //
    // }
    //
    public applyUserPosition ( tile: Tile, img: Konva.Image = tile.getKonvaImage() ): void {

        tile.transformations.position = {
            x: tile.transformations.initialPosition.x + tile.transformations.positionOffs.x,
            y: tile.transformations.initialPosition.y + tile.transformations.positionOffs.y
        };

        tile.transformations.center = {
            x: img.width() / 2,
            y: img.height() / 2
        };

        img.position( tile.transformations.position );
        img.offset( tile.transformations.center );

    }
    //
    // public checkPosition ( offsX: number, offsY: number, tile: Tile, imgPath: Array<Konva.Vector2d> ): boolean {
    //
    //     const imgPos: Konva.Vector2d = {
    //         x: tile.transformations.initialPosition.x + offsX,
    //         y: tile.transformations.initialPosition.y + offsY
    //     };
    //
    //     // Check whether all tile path points are within rotated/scaled image path <imgPath>
    //     return ! !! tile.path.find( tp => ! this.containsPoint( imgPath, tp, imgPos ) );
    //
    // }


    /**
     * Center the image of a tile to the tile
     *
     * @param tile      Tile to use as center
     * @param img       Optional image reference, otherwise tile's image will be used
     */
    public centerImage ( tile: Tile, img: Konva.Image = tile.getKonvaImage() ): void {

        const boundingBox: [ Konva.Vector2d, Konva.Vector2d ] = tile.getBBPolygon();
        const bb_width: number = boundingBox[1].x - boundingBox[0].x;
        const bb_height: number = boundingBox[1].y - boundingBox[0].y;

        tile.transformations.initialPosition.x = boundingBox[0].x + ( bb_width * .5 );
        tile.transformations.initialPosition.y = boundingBox[0].y + ( bb_height * .5 );

        tile.transformations.positionOffs.x = 0;
        tile.transformations.positionOffs.y = 0;

        this.applyUserPosition( tile, img );

    }

    // public containsPoint ( path: Array<Konva.Vector2d>, p: Konva.Vector2d, pathCenter: Konva.Vector2d ): boolean {
    //
    //     // This path contains point "p"?
    //     let inside: boolean = false;
    //
    //     for ( let i = 0, j = path.length - 1; i < path.length; j = i++ ) {
    //
    //         const xi = path[ i ].x + pathCenter.x;
    //         const yi = path[ i ].y + pathCenter.y;
    //         const xj = path[ j ].x + pathCenter.x;
    //         const yj = path[ j ].y + pathCenter.y;
    //
    //         const intersect = ( ( yi > p.y ) !== ( yj > p.y ) ) && ( p.x < ( xj - xi ) * ( p.y - yi ) / ( yj - yi ) + xi );
    //
    //         if ( intersect ) {
    //
    //             inside = !inside;
    //
    //         }
    //
    //     }
    //
    //     return inside;
    //
    // }

    public getStrokeWidth (): number {

        // Dynamic stroke with gh#178
        // Draw the white "path" line
        let stroke: number = 7.3;

        switch ( true ) {
            case ( this.dimensions.x < 480 ):
                stroke *= 320 / 991;
                break;
            case ( this.dimensions.x < 768 ):
                stroke *= 480 / 991;
                break;
            case ( this.dimensions.x < 991 ):
                stroke *= 768 / 991;
                break;
        }

        return stroke;

    }

    protected abstract computeTiles (): void;

    protected addTile ( tile: Array< Konva.Vector2d >, shadow: boolean = false ): Tile {

        const newTile: Tile = new Tile( this.tiles.length, tile, shadow );
        this.add( newTile );

        // GH-339: Return reference to new Tile object (used in Prints design)
        return newTile;

    }

    // noinspection JSMethodCanBeStatic
    private calcImgScale ( width: number, height: number, tile: Tile ): number {

        const boundingBox: [ Konva.Vector2d, Konva.Vector2d ] = tile.getBBPolygon();
        const bb_width: number = boundingBox[1].x - boundingBox[0].x;
        const bb_height: number = boundingBox[1].y - boundingBox[0].y;

        const flip: boolean = tile.transformations.initialRotation % 180 !== 0;

        const scale_x = bb_width / ( flip ? height : width );
        const scale_y = bb_height / ( flip ? width : height );

        // GH-267: Fit maximum image pixels into tile
        return Math.max( scale_x, scale_y );

    }

    /**
     * Apply UI images to tiles either with current transformations, if set, or centered in tile.
     * Also re-applies image filters, if already set.
     * <scaleChange> shall be set to true if the canvas was resized. Then tiles will be scaled to match actual canvas size.
     *
     * @param initial       First call after shuffle
     * @param scaleChanged  Stage dimensions changed
     */
    private applyImages ( initial: boolean, scaleChanged: boolean = false ) {

        this.tiles.forEach( ( tile, index ) => {

            const imageClippingGroup: Konva.Group = new Konva.Group( {

                id: tile.tileId,
                clipFunc: ( ctx: SceneContext ) => {
                    tile.renderTile( ctx );
                },
                perfectDrawEnabled: false,
                listening: true

            } );

            const uiImage: UIImage = this.images[index];

            // Associate the current tile with the uiImage
            uiImage.tile = tile;

            if ( initial ) {
                tile.transformations.initialRotation = uiImage.getRotationDegree();
                // GH-339: Also add base rotation of tile image (Prints design only)
                tile.transformations.rotation = uiImage.getRotationDegree() - tile.imageBaseRotation;
                tile.transformations.flipX = false;
                tile.transformations.flipY = false;
            }

            // Needs initialRotation already set
            const currImgScale: number = this.calcImgScale( uiImage.image.width, uiImage.image.height, tile );

            if ( initial ) {
                tile.transformations.initialScale = currImgScale;
                tile.transformations.userScale = 1;
            }

            // Compute the resulting scale based on current stage dimensions and user scale
            tile.transformations.scale = tile.transformations.calcCombinedScale( currImgScale );

            const image: Konva.Image = new Konva.Image( {
                id: tile.tileId,
                image: uiImage.image,
                width: uiImage.image.width,
                height: uiImage.image.height,
                scaleX:  tile.transformations.scale * ( tile.transformations.flipX ? -1 : 1 ),
                scaleY: tile.transformations.scale * ( tile.transformations.flipY ? -1 : 1 ),
                rotation: tile.transformations.rotation,

                perfectDrawEnabled: false,

                listening: false
            } );

            if ( initial || scaleChanged ) {
                this.centerImage( tile, image );
            } else {
                image.position( tile.transformations.position );
                image.offset( tile.transformations.center );
            }

            // Add the shadow "rect"
            tile.addShadow();

            // Add the image group
            tile.add( imageClippingGroup );

            // #10: Adding Konva image _after_ clipping group was added to tile prevents creating
            // hit, cache, scene canvasses (memory overhead on mobile devices!)
            imageClippingGroup.add( image );

            tile.addKonvaLine( uiImage.lowResolution, this.getStrokeWidth() );
        } );

    }

    private shuffleImages (): void {

        // Shuffle the images
        for ( let i = this._images.length - 1; i > 0; i-- ) {

            const j = Math.floor( Math.random() * ( i + 1 ) );
            [ this._images[i], this._images[j] ] = [ this._images[j], this._images[i] ];

        }

    }
    private scaleTilePath ( scale: number ): void {

        this.tiles.forEach( tile => {
            tile.path.forEach( ( pathItem, index ) => {
                pathItem.x = tile.cachedPath[ index ].x * scale;
                pathItem.y = tile.cachedPath[ index ].y * scale;
            } );
        } );

    }

    // Workaround for Konva issue #653 for iOS Safari 12+
    // #93: Clear cache canvas manually
    //
    // noinspection JSMethodCanBeStatic
    private clearCacheCanvas ( tile: Tile ): void {

        // #10: No scene / hit / cache canvases are created anymore
/*
        const img: Konva.Image = tile.getKonvaImage();

        // Workaround source: https://github.com/konvajs/konva/issues/653
        img._cache.get( 'canvas' ).scene._canvas.width = 0;
        img._cache.get( 'canvas' ).scene._canvas.height = 0;
        img._cache.get( 'canvas' ).hit._canvas.width = 0;
        img._cache.get( 'canvas' ).hit._canvas.height = 0;
        img._cache.get( 'canvas' ).filter._canvas.width = 0;
        img._cache.get( 'canvas' ).filter._canvas.height = 0;
*/

    }

}
