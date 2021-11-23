# AllesGute canvas App

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.2.12.

## App Routes

App landing page designs (Hochzeit, Geburtstag, ...) can be pre-selected by either URL query string or virtual directory:

* `leinwand.allesgute.info?t=geburtstag` or
* `leinwand.allesgute.info/geburtstag`

Supported tags: `geburt`, `geburtstag`, `kommunion`, `hochzeit`, `weihnachten` 

## Development server

Run `npm run-script start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `npm run-script build-prod` to build the project in production mode. The build artifacts will be stored in the `dist/` directory.

## Installation
* `npm install --production`
* Review configuration in `src/environments/environment.prod.ts`
* Build productive version: `npm run-script build-prod`
* Serve application from `dist/allesgute`


## App configuration

Several App parameters can be configured by means of `src/environments/environment.prod.ts` configuration file (used for productive version of App):

```
PAYPAL_CLIENT_ID: Paypal client ID to use
PAYPAL_CURRENCY:  Paypal currency (normally 'EUR')
PAYPAL_ITEM_NAME: Item description used on invoices, suffixed by size (e.g. '40x40')
GTM_ID:           Google Analytics ID to use
CANVAS_PRICES:    Prices for different canvas sizes; first value is 'Statt'-price, 2nd is real price sent to Paypal  
```

After editing the environment parameters, App has to be re-built and re-deployed as described above.
