/*!
 * Copyright florianmatthias o.G. 2021 - All rights reserved
 */

import { Design } from './design.abstract';
import { UIImage } from './images.service';
import Konva from 'konva';

interface Tile {
    x : number;
    y : number;
    w : number;
    h : number;
}

interface TileQuadrant {
    a : Tile;
    b? : Tile;
    c? : Tile;
    d? : Tile;
}

export class MosaicDesign extends Design {

    public constructor ( images: Array<UIImage>, dimensions: Konva.Vector2d ) {
        super( images, dimensions );
    }

    protected computeTiles (): void {

        const length: number = this.images.length;
        const tiles: Array<Tile> = new Array<Tile>();

        this.computeQuadrants( length, length, { x: 0, y: 0, w: this.dimensions.x, h: this.dimensions.y }, tiles );

        if ( tiles.length !== length ) {
            console.error( 'Invalid tiles distribution, expected', length, 'got', tiles.length );
        }

        tiles.forEach( tile => this.addTile( this.convertTileToPolygon( tile ) ) );

    }

    private computeQuadrants ( nrTiles: number, totalTiles: number, parentTile: Tile, tiles: Array<Tile> ): void {

        const push_helper = ( addTile: TileQuadrant ) => {

            tiles.push( addTile.a );

            if ( addTile.b ) {
                tiles.push( addTile.b );
            }

            if ( addTile.c ) {
                tiles.push( addTile.c );
            }

            if ( addTile.d ) {
                tiles.push( addTile.d );
            }

        };

        const newTiles: TileQuadrant = this.createTiles(
            parentTile.x, parentTile.y, parentTile.w, parentTile.h,
            ( nrTiles > 4 ? 4 : nrTiles ) as 1 | 2 | 3 | 4
        );

        if ( nrTiles <= 4 ) {

            push_helper( newTiles );
            return;

        } else {

            const randA: number = Math.random();
            const randB: number = Math.random();
            const randC: number = Math.random();

            const varFloor: number = Math.floor( nrTiles / 4 );
            const varCeil: number = Math.ceil( nrTiles / 4 );

            // Random floor/ceil decision for tiles
            const ceilA: boolean = randA > 0.5;
            let ceilB: boolean;
            let ceilC: boolean;


            // #6: New logic to distribute remaining tiles in quadrants more 'evenly'

            const tilesA: number = ceilA ? varCeil : varFloor;
            let tileCnt: number = tilesA;

            if ( nrTiles - ( tileCnt + varCeil ) < 2 ) {
                // There would be too few tiles left for C, D ( need at least 2)
                // Prevent tile B from selecting ceil
                ceilB = false;
            } else {
                // Else: tile B can make random decision
                ceilB = randB > 0.5;
            }

            const tilesB: number = ceilB ? varCeil : varFloor;
            tileCnt += tilesB;

            if ( nrTiles - ( tileCnt + varCeil ) < 1 ) {
                // There would be too few tiles left for D ( need at least 1)
                // Prevent tile C from selecting ceil
                ceilC = false;
            } else {
                // Else: tile C can make random decision
                ceilC = randC > 0.5;
            }

            const t3: number = ceilC ? varCeil : varFloor;

            // Tile D accumulates the rest
            const t4: number = nrTiles - tilesA - tilesB - t3;


            this.computeQuadrants( tilesA, totalTiles, newTiles.a, tiles );

            if ( tiles.length < totalTiles && !!newTiles.b ) {
                this.computeQuadrants( tilesB, totalTiles, newTiles.b, tiles );
            }

            if ( tiles.length < totalTiles && !!newTiles.c ) {
                this.computeQuadrants( t3, totalTiles, newTiles.c, tiles );
            }

            if ( tiles.length < totalTiles && !!newTiles.d ) {
                this.computeQuadrants( t4, totalTiles, newTiles.d, tiles );
            }

            return;

        }

    }

    private createTiles (
        offsetX: number = 0, offsetY: number = 0,
        width: number = this.dimensions.x, height: number = this.dimensions.y,
        count: 1 | 2 | 3 | 4 = 4
    ): TileQuadrant|undefined {

        const randDecision: number = Math.random();

        // Restrict min/max to tighter boundaries (48% - 52%)
        //
        const horizontal: number = ( Math.random() * 4 ) + 48;
        const vertical: number = ( Math.random() * 4 ) + 48;

        const left: number = width * ( horizontal / 100 );
        const top: number = height * ( vertical / 100 );

        const right: number = width - left;
        const bottom: number = height - top;

        if ( count === 4 ) {

            /* |------------|
             * |  a  |   b  |
             * |------------|
             * |  c  |   d  |
             * |------------|
             */

            return {
                a: { x: offsetX, y: offsetY, w: left, h: top },
                b: { x: offsetX + left, y: offsetY, w: right, h: top },
                c: { x: offsetX, y: offsetY + top, w: right, h: bottom },
                d: { x: offsetX + right, y: offsetY + top, w: left, h: bottom }
            };

        } else if ( count === 3 ) {

            /* A:
             * |------------|
             * |  a  |   b  |
             * |------------|
             * |     c      |
             * |------------|
             * or B:
             * |------------|
             * |     a      |
             * |------------|
             * |  b  |   c  |
             * |------------|
             */

            // More likelihood for 'B'
            return randDecision < 0.25 ?
                /* A */
                {
                    a: { x: offsetX, y: offsetY, w: left, h: top },
                    b: { x: offsetX + left, y: offsetY, w: right, h: top },
                    c: { x: offsetX, y: offsetY + top, w: width, h: bottom }
                } :
                /* B */
                {
                    a: { x: offsetX, y: offsetY, w: width, h: top },
                    b: { x: offsetX, y: offsetY + top, w: left, h: bottom },
                    c: { x: offsetX + left, y: offsetY + top, w: right, h: bottom }
                };

        } else if ( count === 2 ) {

            /* A:
             * |------------|
             * |  a  |   b  |
             * |------------|
             * or B:
             * |------------|
             * |     a      |
             * |------------|
             * |     b      |
             * |------------|
             */

            // More likelihood for 'A'
            return randDecision < 0.75 ?
                /* A */
                {
                    a: { x: offsetX, y: offsetY, w: left, h: height },
                    b: { x: offsetX + left, y: offsetY, w: right, h: height }
                } :
                /* B */
                {
                    a: { x: offsetX, y: offsetY, w: width, h: top },
                    b: { x: offsetX, y: offsetY + top, w: width, h: bottom }
                };

        } else if ( count === 1 ) {

            /* |------------|
             * |            |
             * |      a     |
             * |            |
             * |------------|
             */

            return {
                a: { x: offsetX, y: offsetY, w: width, h: height }
            };

        }
        return undefined;

    }

    // noinspection JSMethodCanBeStatic
    private convertTileToPolygon ( tile: Tile ): Array<Konva.Vector2d> {

        const polygon: Array<Konva.Vector2d> = new Array<Konva.Vector2d>();

        polygon.push( { x: tile.x, y: tile.y } );
        polygon.push( { x: tile.x + tile.w, y: tile.y } );
        polygon.push( { x: tile.x + tile.w, y: tile.y + tile.h } );
        polygon.push( { x: tile.x, y: tile.y + tile.h } );
        polygon.push( { x: tile.x, y: tile.y } );

        return polygon;

    }

}

