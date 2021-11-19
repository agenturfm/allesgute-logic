// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    appVersion: require('../../package.json').version + '-dev',
    // Sandbox KW
    PAYPAL_CLIENT_ID: 'AXUHq7-v7CqikhcgViD35Xw8xlDxbHX_abqEBalAJidRg6Izi-kd4g6-jEmhKEOlGHVK1kZ8bsUjntvX',
    PAYPAL_CURRENCY: 'EUR',
    // Suffixed by size ' <n>x<n>', e.g. '40x40'
    PAYPAL_ITEM_NAME: 'Fotoleinwand AllesGute.info',
    // Prices for different canvas sizes
    // First price is 'statt', 2nd is real price sent to paypal
    CANVAS_PRICES: {
        sm: [ '54,90', '39,90' ],
        md: [ '74,90', '59,90' ],
        lg: [ '84,90', '69,90' ]
    },
    // No tailing "/" allowed!!
    // backendAPI: 'https://3.64.32.251/api'
    // backendAPI: 'https://leinwand.allesgute.info/api'
    backendAPI: 'http://localhost:3000'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
