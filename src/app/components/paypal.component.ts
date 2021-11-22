import { AfterViewChecked, Component, EventEmitter, Input, isDevMode, OnDestroy, OnInit, Output } from '@angular/core';
import { environment } from '../../environments/environment';
import { loadScript } from "@paypal/paypal-js";
import { MessageService, MessageText } from '../services/message.service';
import { of, Subscription } from 'rxjs';
import { CheckoutService } from '../services/checkout.service';
import { OrderResponseBody } from '@paypal/paypal-js/types/apis/orders';

//
// IMPORTANT!
// Keep these classes in sync with backend!
//
export class PaypalPayerInfo {
    countryCode: string = '';
    email: string = '';
    givenName: string = '';
    surname: string = '';
    payerId: string = '';
}

export class PaypalDeliveryInfo {
    itemPaymentId: string = '';
    itemDescription: string = '';
    itemAmount: string = '';
    itemCurrency: string = '';
    itemValue: string = '';
    fullName: string = '';
    addressLine1: string = '';
    addressLine2: string = '';
    city: string = '';        // admin_area_2
    zipCode: string = '';
    countryCode: string = '';
}

export class PaypalMetaInfo {
    transaction: string = '';
    orderID: string = '';
    orderDate: string = '';
    payer: PaypalPayerInfo = new PaypalPayerInfo();
    delivery: PaypalDeliveryInfo = new PaypalDeliveryInfo();
}

interface PaypalAmount {
    currency_code: string;
    value: string;
}

// https://developer.paypal.com/docs/api/orders/v2/#orders-capture-response
interface PaypalPurchaseUnitCapture {
    "id" : string;
    "status" : string;
    "amount" : PaypalAmount;
    "seller_protection" : {
        "status" :  string;
        "dispute_categories" : string[];
    };
    "final_capture" : boolean
    "disbursement_mode" :  string;
    "seller_receivable_breakdown" : {
        "gross_amount" : PaypalAmount;
        "paypal_fee" : PaypalAmount;
        "net_amount" : PaypalAmount;
    };
    "create_time" :  string;
    "update_time" : string;
    "links" : [ {
        "href" : string;
        "rel" : string;
        "method" : string;
    }];
}

@Component({
    selector: 'app-paypal',
    templateUrl: './paypal.component.html'
})
export class PaypalComponent implements OnInit, OnDestroy, AfterViewChecked {

    @Input('images') public images: EventEmitter<number>;
    @Output() public checkoutDone: EventEmitter<boolean> = new EventEmitter<boolean>();

    private _isError: boolean = false;
    private _isSuccess: boolean = false;

    private _acceptAGB: boolean = false;
    private _acceptDSGVO: boolean = false;
    private _imagesLength: number = 0;
    private _orderCreated: boolean = false;
    private _showErrDlg: boolean = false;

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
            this._msgSvc.openDialog( 'Oops ein Fehler ist aufgetreten - PayPal konnte nicht geladen werden! Lade bitte die Seite neu!');
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
                                        { text: 'Fehler beim Upload der Bilddaten - bitte versuche es nochmals!' },
                                        { text: 'Es wurde noch keine Zahlung durchgeführt!', style: 'font-weight: bold' } ]);

                                    this._checkoutSvc.cancelOrder().subscribe( {
                                        error: err1 => {
                                            // in error case, let the stale data reside on server
                                            if (isDevMode()) {
                                                console.log( 'Could not remove order on server; error ', err1 );
                                            }
                                        }
                                    });
                                    // create new order ID to let customer continue
                                    this.createNewOrder();

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
                            if (isDevMode()) {
                                console.log( details );
                            }
                            // Provide paypal details to server (update order meta data)
                            this.updateOrderDetails( details ).subscribe( {
                                next: () => {
                                    // continue with checkout
                                    this._checkoutSvc.doCheckout().subscribe( {
                                        next: val => {
                                            this.isSuccess = true;
                                        },
                                        error: err => {
                                            // If something happens in this step, this is really bad - quite unlikely though!
                                            // Order processing could not be triggered on server side
                                            this.isSuccess = false
                                            this.showOrderFatal( err, [
                                                { text: `Step: Checkout`, style: 'font-weight: bold' },
                                                { text: `Payment ID: ${details.id}`, style: 'font-weight: bold' },
                                                { text: `Order ID: ${this._checkoutSvc.orderId}`, style: 'font-weight: bold' }
                                            ])
                                        }
                                    });
                                },
                                error: () => {
                                    // That's really bad. Already paid but no meta info could be delivered to server
                                    this.showOrderFatal( '', [
                                        { text: `Step: Update order details`, style: 'font-weight: bold' },
                                        { text: `Payment ID: ${details.id}`, style: 'font-weight: bold' },
                                        { text: `Order ID: ${this._checkoutSvc.orderId}`, style: 'font-weight: bold' }
                                    ])
                                }
                            });
                        });
                    },

                    onCancel: (data, actions) => {
                        if (isDevMode()) {
                            console.info( 'transaction cancelled', data );
                        }
                        this.isError = true;
                        this._checkoutSvc.cancelOrder().subscribe( {
                            error: err =>
                                this.showOrderFatal( err, [
                                    { text: `Step: Paypal cancellation handling`, style: 'font-weight: bold' },
                                    { text: `Order ID: ${this._checkoutSvc.orderId}`, style: 'font-weight: bold' }])
                        });
                    },

                    onError: err => {
                        if (isDevMode()) {
                            console.log( err );
                        }
                        this.isError = true;
                        this._checkoutSvc.cancelOrder().subscribe( {
                            error: err =>
                                this.showOrderFatal( err, [
                                    { text: `Step: Paypal error handling`, style: 'font-weight: bold' },
                                    { text: `Order ID: ${this._checkoutSvc.orderId}`, style: 'font-weight: bold' }])
                        });
                    }
                }).render("#paypal-button-container");
            } catch (error) {
                this._msgSvc.openDialog( 'Oops ein Fehler ist aufgetreten - PayPal konnte nicht geladen werden! Lade bitte die Seite neu!');
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

    public createNewOrder() {
        this.resetPayPalButtons();

        this._checkoutSvc.createNewOrderId();
        if (isDevMode()) {
            console.log( `Assigned new order ID ${this._checkoutSvc.orderId}` );
        }
    }

    public get isSuccess () : boolean {
        return this._isSuccess;
    }

    public set isSuccess ( value : boolean ) {
        this._isSuccess = value;
        if ( value ) {
            this._isError = false;
        }
        this.setCheckoutDone();
    }

    public get isError () : boolean {
        return this._isError;
    }

    public set isError ( value : boolean ) {
        this._isError = value;
        if ( value ) {
            this._isSuccess = false;
        }
        this.setCheckoutDone();
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

    private setCheckoutDone () {
        this.checkoutDone.emit(!(this._isSuccess || this._isError));
    }

    private updateOrderDetails ( details: OrderResponseBody ) {

        const d = new PaypalMetaInfo();
        d.transaction = details.id || '<undefined>';
        d.orderID = this._checkoutSvc.orderId;
        d.orderDate = details.update_time || '<undefined>';

        d.payer.payerId = details.payer.payer_id || '<undefined>';
        d.payer.givenName = details.payer.name.given_name || '<undefined>';
        d.payer.surname = details.payer.name.surname || '<undefined>';
        d.payer.email = details.payer.email_address || '<undefined>';
        d.payer.countryCode = details.payer.address.country_code || '<undefined>';

        // There shall only be exactly one PU present!
        const u = details.purchase_units[0];
        // There shall only be exactly one capture present!
        const c = <PaypalPurchaseUnitCapture> <unknown> u.payments.captures[0];

        d.delivery.itemPaymentId = <string> c.id || '<undefined>';
        d.delivery.itemDescription = u.description || '<undefined>';
        d.delivery.itemAmount = '1';
        d.delivery.itemCurrency = (<PaypalAmount> c.amount).currency_code || '<undefined>';
        d.delivery.itemValue = (<PaypalAmount> c.amount).value || '<undefined>';

        d.delivery.fullName = u.shipping.name.full_name || '<undefined>';
        d.delivery.addressLine1 = u.shipping.address.address_line_1 || '<undefined>';
        d.delivery.addressLine2 = u.shipping.address.address_line_2 || '<undefined>';
        d.delivery.city = u.shipping.address.admin_area_1 || u.shipping.address.admin_area_2 || '<undefined>';
        d.delivery.countryCode = u.shipping.address.country_code || '<undefined>';
        d.delivery.zipCode = u.shipping.address.postal_code || '<undefined>';

        return this._checkoutSvc.updateOrder( d );
    }

    private showSubmitErrorDlg () {
        if (this._imagesLength == 0) {
            this._msgSvc.openDialog( 'Es wurden keine Fotos ausgewählt!' );
        } else if (!this.acceptAGB || !this.acceptDSGVO ) {
            this._msgSvc.openDialog( `Akzeptiere bitte die allgemeinen Geschäftsbedingungen und die Datenschutzerklärung!` );
        }
    }

    private showOrderFatal (error: any, text: MessageText[] )  {
        this._msgSvc.openDialog( [
                { text: 'Bei der Verarbeitung der Bestellung ist ein Fehler aufgetreten!' },
                { text: 'Kontaktiere bitte den Händler unter Angabe folgender Informationen:' }
            ].concat( text ), `Fehler ${error}`);
    }
}
