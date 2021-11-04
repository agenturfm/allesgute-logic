/*!
 * Copyright florianmatthias o.G. 2019 - All rights reserved
 */

/* tslint:disable:variable-name no-inferrable-types */
import { Component, HostListener, isDevMode, OnInit, Renderer2, ViewChild } from '@angular/core';
import { AppService } from './app.service';
import { RendererDesignType, RendererService } from './renderer.service';
import { ImagesService } from './images.service';

@Component( {
    selector: 'app-designs',
    template: ''
} )
export class DesignsComponent implements OnInit {

    @ViewChild( 'frame', { static: true } ) public frame;
    // MIT (XK): disabled due to new getter
    // currentDesign = 'Mosaic';
    public scrollStatus = false;
    public scrollEnd = false;

    public constructor (
        private appService: AppService,
        private render: Renderer2,
        private readonly _rendererService: RendererService,
        private readonly _imagesService: ImagesService
    ) {

        // Fixes #149
        if ( this._imagesService.current === 0 ) {

            if ( isDevMode() ) {

                this._rendererService.rendererDesignType = RendererDesignType.Mosaic;

            }  else {

                // Initially select Mosaic (#170)
                this._rendererService.rendererDesignType = RendererDesignType.Mosaic;

            }

        }

    }

    public get currentDesign (): string {

        return this._rendererService.rendererDesignString;

    }

    // noinspection JSUnusedLocalSymbols
    @HostListener( 'window:resize', [ '$event' ] )
    public onResize ( event ) {

        this.calcAvailHt();

    }

    public calcAvailHt () {

        this.render.setStyle( this.frame.nativeElement, 'height', this.appService.calcAvailHt( this.frame ) + 'px' );
        this.render.setStyle( this.frame.nativeElement, 'width', this.appService.calcAvailHt( this.frame ) + 'px' );

    }

    public scrollHandler ( event ) {

        this.scrollStatus = true;
        this.scrollEnd = ( event.target.scrollWidth - ( event.target.scrollLeft + event.target.clientWidth ) ) < 30;

        if ( event.target.scrollLeft === 0 ) {

            this.scrollStatus = false;

        }

    }

    public ngOnInit () {

        this.calcAvailHt();

    }

    public updateDesign ( type ) {

        /*
         * MIT (XK): Signal new design to renderer service
         */
        if ( type === 'Mosaic' ) {

            // Mosaic design
            this._rendererService.rendererDesignType = RendererDesignType.Mosaic;

        }


    }

}
