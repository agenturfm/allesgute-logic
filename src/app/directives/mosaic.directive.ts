/*!
 * Copyright florianmatthias o.G. 2021 - All rights reserved
 */

import { AfterViewChecked, Directive, ElementRef, HostListener } from '@angular/core';
import { RendererService } from '../services/renderer.service';
import { ImagesService } from '../services/images.service';

@Directive( {
    selector: '[appMosaic]'
} )
export class MosaicDirective implements AfterViewChecked {

    private readonly _containerElement : HTMLElement;

    public constructor (
        private readonly _containerRef: ElementRef,
        private readonly _rendererService: RendererService,
        private readonly _imagesService: ImagesService
    ) {

        this._containerElement = _containerRef.nativeElement;

        this._containerElement.style.width = '100%';
        this._containerElement.style.height = '100%';
        this._containerElement.style.overflow = 'hidden';

    }

    @HostListener( 'window:resize' )
    public setSize (): void {
        this.updateRendererSize();
    }

    public ngAfterViewChecked () : void {
        this.updateRendererSize();
    }

    private updateRendererSize () {
        this._rendererService.setSize( this._containerElement.offsetWidth, this._containerElement.offsetHeight );
    }

}
