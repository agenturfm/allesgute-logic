/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

import { EventEmitter, Injectable, isDevMode } from '@angular/core';
import { environment } from '../../environments/environment';

export enum MenuSliderIds {
    SliderBilder = 0,
    SliderDesigns = 1,
    SliderBearbeiten = 2,
    SliderFilter = 3
}

@Injectable( {
    providedIn: 'root'
} )
export class AppService {

    private readonly _baseURI : string;
    private readonly _shuffleEventEmitter : EventEmitter< boolean > = new EventEmitter< boolean >();
    // GH-426: Introduced new shuffleDoneEventEmitter => emits when the shuffle process is completed
    private readonly _shuffleDoneEventEmitter : EventEmitter< boolean > = new EventEmitter< boolean >();
    private _currentAppSlide : number = 0;
    // GH-401
    private _filterWorkersActive : boolean = false;
    private _shuffleActive : boolean = false;

    public constructor () {

        if ( isDevMode() ) {

            this._baseURI = environment.backendAPI;

        } else {

            this._baseURI = environment.backendAPI;

        }

    }


    public get shuffleEventEmitter (): EventEmitter<boolean> {

        return this._shuffleEventEmitter;

    }

    public get shuffleDoneEventEmitter (): EventEmitter<boolean> {

        return this._shuffleDoneEventEmitter;

    }

    public get baseURI (): string {

        // If a tailing '/' remove it!
        if ( this._baseURI.substr( -1 ) === '/' ) {

            return this._baseURI.substring( 0, this._baseURI.length - 1 );

        }

        return this._baseURI;

    }

    public get sliderIdBilder (): number {

        return MenuSliderIds.SliderBilder;

    }

    public get sliderIdDesigns (): number {

        return MenuSliderIds.SliderDesigns;

    }

    public get sliderIdBearbeiten (): number {

        return MenuSliderIds.SliderBearbeiten;

    }

    public get sliderIdFilter (): number {

        return MenuSliderIds.SliderFilter;

    }

    public get currentAppSlide (): number {

        return this._currentAppSlide;

    }


    public set currentAppSlideNoEvent ( value: number ) {

        this._currentAppSlide = value;

    }

    public set shufflePressed ( value: boolean ) {

        this._shuffleEventEmitter.emit( value );

    }

    // GH-401
    public set filterWorkersActive ( value: boolean ) {

        if ( isDevMode() ) {

            console.info( 'Filter', value );

        }

        this._filterWorkersActive = value;

    }

    // GH-401
    public get filterWorkersActive (): boolean {

        return this._filterWorkersActive;

    }

    // GH-401
    public set shuffleActive ( value: boolean ) {

        if ( isDevMode() ) {

            console.info( 'Shuffle', value );

        }

        // GH-426:  If the shuffleActive state is reset => shuffle is done so emit the done event
        if ( true === this._shuffleActive && false === value ) {

            this._shuffleDoneEventEmitter.emit( true );

        }

        this._shuffleActive = value;

    }

    // GH-401
    public get shuffleActive (): boolean {

        return this._shuffleActive;

    }

// Calculate available area for frame
    // noinspection JSUnusedLocalSymbols
    public calcAvailHt ( elem ) {

        // 355 (Header + Filter + Footer)
        let availht;
        if ( window.innerHeight > 640 ) {

            availht = window.innerHeight - 355 - 9;

        } else if ( window.innerHeight > 580 ) {

            availht = window.innerHeight - 336 - 5;

        } else {

            availht = window.innerHeight - 268 - 9;

        }

        return ( availht < 170 ) ? 170 : availht;

    }

}
