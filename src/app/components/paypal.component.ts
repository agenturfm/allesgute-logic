import { AfterViewChecked, Component, EventEmitter, Input, OnDestroy, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { loadScript } from "@paypal/paypal-js";
import { MessageService } from '../services/message.service';
import { Subscription } from 'rxjs';

// @todo: Set correct Paypal client id!!

@Component({
    selector: 'app-paypal',
    template: `
        <div class="section-block" [style.display]="!isError && !isSuccess ? '' : 'none'">
            <div class="checkbox-list">
                <div class="checkbox-group">
                    <div class="checkbox" [class.checked]="acceptAGB" (click)="acceptAGB=!acceptAGB"><i class="icon icon-check"></i></div>
                    <div class="label">Ich akzeptiere die <a href="">allgemeinen Geschäftsbedingungen.</a></div>
                </div>
                <div class="checkbox-group">
                    <div class="checkbox" [class.checked]="acceptDSGVO" (click)="acceptDSGVO=!acceptDSGVO"><i class="icon icon-check"></i></div>
                    <div class="label">Ich habe die <a href="">Datenschutzerklärung</a> gelesen und bin damit einverstanden.</div>
                </div>
            </div>
        </div>
        <div class="payment-btn" [style.display]="!isError && !isSuccess ? '' : 'none'">
            <div id="paypal-button-container"></div>
            <div class="pay-msg">Zahlung erfolgt erst im nächsten Schritt</div>
        </div>
        <div class="payment-result success" *ngIf="isSuccess">
            <div class="result-msg">
                <i class="icon icon-success"></i>
                <p class="result-msg">
                    <b>Super!</b> Danke für deine Bestellung. Dein Paket landet in 6-8 Werktagen in deinem Postfach.
                </p>
                <a class="btn cta-btn" (click)="resetPayPalButtons()"><span>Nochmal bestellen?</span></a>
                <p class="msg">Du möchtest dein Bild nochmal in z.B. einer anderen Größe bestellen? Klick auf den Button und du gelangst wieder zurück zum Editor.</p>
            </div>
        </div>
        <div class="payment-result error" *ngIf="isError">
            <div class="result-msg">
                <i class="icon icon-error"></i>
                <p class="result-msg">
                    <b>Hoppala!</b> Da ist leider etwas schief gelaufen, bitte versuche es nochmal.
                </p>
                <a class="btn cta-btn" (click)="resetPayPalButtons()"><span>Nochmal versuchen</span></a>
            </div>
        </div>
        `
})
export class PaypalComponent implements OnInit, OnDestroy, AfterViewChecked {

    @Input('images') public images: EventEmitter<number>;
    public isError: boolean = false;
    public isSuccess: boolean = false;

    private _acceptAGB: boolean = false;
    private _acceptDSGVO: boolean = false;
    private _showErrDlg: boolean = false;
    private _imagesLength: number = 0;

    // KW token: AXUHq7-v7CqikhcgViD35Xw8xlDxbHX_abqEBalAJidRg6Izi-kd4g6-jEmhKEOlGHVK1kZ8bsUjntvX

    private readonly _paypalClientId: string = environment.PAYPAL_CLIENT_ID;
    private _paypalActionBtns: any;
    private _subs: Subscription[] = [];


    public constructor ( private _msgSvc: MessageService ) {
    }

    public async ngOnInit () {

        this._subs.push( this.images.subscribe( {
            next: value => {
                this._imagesLength = value;
                this.canSubmitPayment();
            }
        }));

        let paypal;

        try {
            paypal = await loadScript({
                "client-id": this._paypalClientId,
                "buyer-country": 'DE',      // sandbox only
                currency: "EUR",
                intent: 'capture'
            });
        } catch (error) {
            this._msgSvc.openDialog( 'Oops ein Fehler ist aufgetreten - PayPal konnte nicht geladen werden!');
            console.error("failed to load the PayPal JS SDK script", error);
        }

        if (paypal) {
            try {
                await paypal.Buttons( {
                    style: {
                        shape: 'rect',
                        color: 'gold',
                        layout: 'vertical',
                        label: 'paypal',
                    },
                    onInit: ( data, actions ) => {
                        this._paypalActionBtns = actions;
                        actions.disable();
                    },
                    onClick: ( data, actions ) => {
                        this._showErrDlg = !this.canSubmitPayment();
                    },
                    createOrder: (data, actions) => {
                        return actions.order.create({
                            purchase_units: [{"amount":{"currency_code":"EUR","value":1}}]
                        });
                    },
                    onApprove: (data, actions) => {
                        this.isSuccess = true;
                        return actions.resolve();
                    },
                    onCancel: (data, actions) => {
                        console.info( 'transaction cancelled' );
                        this.isError = true;
                    },
                    onError: err => {
                        this.isError = true;
                        console.log( err );
                    }
                }).render("#paypal-button-container");
            } catch (error) {
                console.error("failed to render the PayPal Buttons", error);
            }
        }
    }

    public ngOnDestroy () : void {
        this._subs.forEach( s => s.unsubscribe() );
        this._subs = [];
    }

    public ngAfterViewChecked () : void {
        if (this._showErrDlg) {
            this._showErrDlg = false;
            this.showSubmitErrorDlg();
        }
    }

    public resetPayPalButtons() {
        this.isError = false;
        this.isSuccess = false;
    }

    public get acceptDSGVO () : boolean {
        return this._acceptDSGVO;
    }

    public set acceptDSGVO ( value : boolean ) {
        this._acceptDSGVO = value;
        this.canSubmitPayment();
    }

    public get acceptAGB () : boolean {
        return this._acceptAGB;
    }

    public set acceptAGB ( value : boolean ) {
        this._acceptAGB = value;
        this.canSubmitPayment();
    }

    public canSubmitPayment (msg: boolean = false) {
        const result = this.acceptAGB && this.acceptDSGVO && this._imagesLength > 0;
        if (!!this._paypalActionBtns) {
            if (result) {
                this._paypalActionBtns.enable();
            } else {
                this._paypalActionBtns.disable();
            }
        }
        return result;
    }

    private showSubmitErrorDlg () {
        if (this._imagesLength == 0) {
            this._msgSvc.openDialog( 'Es wurden keine Fotos ausgewählt!' );
        } else if (!this.acceptAGB || !this.acceptDSGVO ) {
            this._msgSvc.openDialog( `Akzeptieren Sie bitte die allgemeinen Geschäftsbedingungen und die Datenschutzerklärung!` );
        }
    }

}
