import { AfterViewChecked, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { environment } from '../../environments/environment';
import { loadScript } from "@paypal/paypal-js";
import { MessageService } from '../services/message.service';
import { of, Subscription } from 'rxjs';
import { CheckoutService } from '../services/checkout.service';
import { OrderResponseBody } from '@paypal/paypal-js/types/apis/orders';

// @todo: Set correct Paypal client id!!

@Component({
    selector: 'app-paypal',
    templateUrl: './paypal.component.html'
})
export class PaypalComponent implements OnInit, OnDestroy, AfterViewChecked {

    @Input('images') public images: EventEmitter<number>;

    public isError: boolean = false;
    public isSuccess: boolean = false;

    private _acceptAGB: boolean = true;
    private _acceptDSGVO: boolean = true;
    private _imagesLength: number = 0;
    private _orderCreated: boolean = false;
    private _showErrDlg: boolean = false;

    // SB business account token: AXUHq7-v7CqikhcgViD35Xw8xlDxbHX_abqEBalAJidRg6Izi-kd4g6-jEmhKEOlGHVK1kZ8bsUjntvX

    private readonly _paypalClientId: string = environment.PAYPAL_CLIENT_ID;
    private readonly _paypalCurrency: string = environment.PAYPAL_CURRENCY || 'EUR';
    private readonly _paypalItemName: string = environment.PAYPAL_ITEM_NAME;
    private _paypalActionBtns: any;
    private _subs: Subscription[] = [];


    public constructor ( private _msgSvc: MessageService,
                         private _checkoutSvc: CheckoutService ) {
    }

    public async ngOnInit () {

        this._subs.push( this.images.subscribe( {
            next: value => {
                this._imagesLength = value;
                this.canSubmitOrder();
            }
        }));

        let paypal;

        try {
            paypal = await loadScript({
                "client-id": this._paypalClientId,
                // "buyer-country": 'DE',      // sandbox only
                currency: this._paypalCurrency,
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
                        this._showErrDlg = !this.canSubmitOrder();
                        if (!this._showErrDlg) {
                            // Create order on server, upload images/metadata
                            // Return a promise to be able to cancel payment if server upload failed...
                            return this._checkoutSvc.createOrder().toPromise()
                                .then( () => {
                                    this._orderCreated = true;
                                    return actions.resolve();
                                })
                                .catch( err => {
                                    this._msgSvc.openDialog([
                                        { text: 'Fehler beim Upload der Bilddaten - bitte versuchen Sie es nochmals!' },
                                        { text: 'Es wurde noch keine Zahlung durchgeführt!', style: 'font-weight: bold' } ],
                                        `Fehler ${err}`);
                                    return actions.reject();
                                })
                        }
                        return of<void>().toPromise();
                    },
                    createOrder: (data, actions) => {
                        return actions.order.create({
                            intent: 'capture',
                            purchase_units: [{
                                description: `${this._paypalItemName} ${this._checkoutSvc.size}x${this._checkoutSvc.size}`,
                                amount: {
                                    currency_code: this._paypalCurrency,
                                    value: this._checkoutSvc.paypalPrice
                                }
                            }]
                        });
                    },
                    onApprove: (data, actions) => {
                        return actions.order.capture().then( ( details: OrderResponseBody ) => {
                            this._checkoutSvc.doCheckout().subscribe( {
                                next: val => {
                                    this.isSuccess = true;
                                    console.log( val, details );
                                },
                                error: err => {
                                    // If something happens in this step, this is really bad.
                                    // Order processing could not be triggered on server side, quite unlikely though!
                                    this.isSuccess = false
                                    this._msgSvc.openDialog([
                                            { text: 'Bei der Verarbeitung der Bestellung ist ein Fehler aufgetreten!' },
                                            { text: 'Kontaktieren Sie bitte den Händler unter Angabe folgender Informationen:' },
                                            { text: `Payment ID: ${details.id}`, style: 'font-weight: bold' },
                                            { text: `Order ID: ${this._checkoutSvc.orderId}`, style: 'font-weight: bold' }],
                                        `Fehler ${err}`);
                                }
                            });
                        });
                    },
                    onCancel: (data, actions) => {
                        console.info( 'transaction cancelled', data );
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
        this.canSubmitOrder();
    }

    public get acceptAGB () : boolean {
        return this._acceptAGB;
    }

    public set acceptAGB ( value : boolean ) {
        this._acceptAGB = value;
        this.canSubmitOrder();
    }

    public canSubmitOrder () {
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
