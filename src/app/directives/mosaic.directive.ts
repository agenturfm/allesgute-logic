
import {
    AfterContentChecked,
    AfterContentInit, AfterViewChecked,
    AfterViewInit,
    Directive,
    ElementRef,
    HostListener,
    isDevMode,
    OnDestroy
} from '@angular/core';
import { RendererService } from '../services/renderer.service';
import { ImagesService } from '../services/images.service';

@Directive( {
    selector: '[appMosaic]'
} )
export class MosaicDirective implements OnDestroy, AfterViewChecked, AfterContentInit, AfterContentChecked {

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

        // Update the placeholder
        this.updatePlaceholder();

    }

    @HostListener( 'window:resize' )
    public setSize (): void {

        this.updateRendererSize();

    }

    public ngOnDestroy (): void {
        //
        // if ( this._containerElement.hasChildNodes() ) {
        //
        //     // Remove the canvas
        //     this._containerElement.childNodes.forEach( child => child === this._rendererService.containerElement ? child.remove() : null );
        //
        // }

    }

    public ngAfterContentChecked (): void {

        // rendering or placeholder?
        // if (
        //     false === this._imagesService.working &&
        //     this._imagesService.images.length > 3
        // ) {
        //
        //     // rendering
        //
        //     // check for canvas
        //     if (
        //         !this._rendererService.containerElement.parentNode ||
        //         this._rendererService.containerElement.parentNode !== this._containerElement
        //     ) {
        //
        //         if ( isDevMode() ) {
        //
        //             console.info( 'RendererDirective: Adding renderer to container' );
        //
        //         }
        //
        //         this._containerElement.appendChild( this._rendererService.containerElement );
        //
        //         // Remove the placeholder background
        //         this.updatePlaceholder( true );
        //
        //     }
        //
        // } else {
        //
        //     // placeholder
        //
        //     if ( this._containerElement.hasChildNodes() ) {
        //
        //         if ( isDevMode() ) {
        //
        //             console.info( 'RendererDirective: Removing renderer from container' );
        //
        //         }
        //
        //         // Remove the canvas
        //         this._containerElement.childNodes.forEach( child => child === this._rendererService.containerElement ? child.remove() : null );
        //
        //     }
        //
        //     // Update the placeholder
        //     this.updatePlaceholder();
        //
        // }

    }

    public ngAfterContentInit (): void {

        // Update the dimensions
        // this.updateRendererSize();

    }

    public ngAfterViewChecked () : void {
        this.updateRendererSize();
    }

    private updateRendererSize () {

        this._rendererService.setSize( this._containerElement.offsetWidth, this._containerElement.offsetHeight );

        // if ( isDevMode() ) {
        //
        //     console.info( `Updating renderer size to ${ this._containerElement.offsetWidth }x${ this._containerElement.offsetHeight } (w x h in px)` );
        //
        // }

    }

    private updatePlaceholder ( remove: boolean = false ) {

        if ( false === remove ) {

            // Setup the background image
            // this._containerElement.style.backgroundImage = `url("assets/icons/design/${ this._rendererService.rendererDesignString }.jpg")`;
            this._containerElement.style.backgroundRepeat = 'no-repeat';

        } else {

            this._containerElement.style.backgroundImage = 'none';

        }

    }

}
