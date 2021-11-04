import { AfterContentInit, AfterViewInit, Component, ElementRef, isDevMode, ViewChild } from '@angular/core';
import { RendererService } from '../services/renderer.service';
import { catchError, finalize } from 'rxjs/operators';
import { of } from 'rxjs';
import { IMAGES_SERVICE_IMAGES_MINIMUM, ImagesService, UIImage } from '../services/images.service';

@Component({
    selector: 'app-config',
    templateUrl: './config.component.html'
})
export class ConfigComponent implements AfterViewInit {

    public totalCounter = 0;
    public disableUploadbtn = false;

    @ViewChild('konvacanvas') private _konvaCanvas: ElementRef;
    @ViewChild('imageinput') private _imageInput: ElementRef;

    private _inputElem;

    public constructor ( private _renderSvc: RendererService,
                         private _imagesService: ImagesService) {
    }

    public ngAfterViewInit () : void {
        this._renderSvc.init( this._konvaCanvas.nativeElement );
        this._inputElem = this._imageInput.nativeElement;
        this._inputElem.addEventListener( 'change', () => this._addImage() );
    }

    public get uploadBtnVisible (): boolean {
        return this.totalCounter < this.maxImages;
    }

    public get images (): Array<UIImage> {
        return this._imagesService.images;
    }

    public get maxImages (): number {
        return this._imagesService.maxImages;
    }

    public get working (): boolean {
        return this._imagesService.working;
    }

    public get progress (): number {
        return !!this.working ? ( this._imagesService.processingCurrent / this._imagesService.processingTotal ) * 100 : 0;
    }

    public addImage () {
        // Trigger file selection dialog
        this._inputElem.click();
    }

    public removeImage ( image: UIImage ) {

        this._imagesService.removeImage( image );
        this.totalCounter -= 1;

        // Shuffle again
        this._renderSvc.shuffle();
    }

    private _addImage () {

        let flen = this._inputElem.files.length;
        if (this.totalCounter + this._inputElem.files.length > this.maxImages ) {
            flen = this.maxImages - this.totalCounter;
        }
        this.totalCounter += flen;

        this._imagesService.addFiles( this._inputElem.files, flen ).pipe(
            catchError( err => {

                // Something substantial happened => What TODO???
                if ( isDevMode() ) {
                    console.warn( 'Error adding files', err );
                }

                // Keep the pipe results intact
                const res: Array<boolean> = new Array<boolean>( this._inputElem.files.length );
                res.fill( false );

                return of( res );
            } ),
            finalize( () => {

                // When all is done => remove the this._inputElem from the dom again
                // this.render.removeChild( this.frame.nativeElement, this._inputElem );

                if ( this.images.length < IMAGES_SERVICE_IMAGES_MINIMUM ) {
                    // this.text = this.textMinError;
                }

                // if ( !this._imagesService.working ) {
                //     if ( this.totalCounter > this.maxImages ) {
                //
                //         // this.handleMaxValidation();
                //         this.totalCounter = this.maxImages;
                //     }
                //     if ( this.totalCounter >= this.maxImages ) {
                //         this.disableUploadbtn = true;
                //     }
                //
                // }
                //
                // if ( this.totalCounter < 4 ) {
                //
                //     this.text = this.textMinError;
                //     this.magenta = true;
                //
                // } else {
                //
                //     this.text = this.textNormal;
                //     this.magenta = false;
                //
                // }

            } )
        ).subscribe( () => {

            if (
                this._imagesService.images.length >= IMAGES_SERVICE_IMAGES_MINIMUM &&
                !this._imagesService.working
            ) {
                // Trigger update
                this._renderSvc.shuffle();
            }

        } );

    }

}
