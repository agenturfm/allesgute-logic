export const environment = {
    production: true,
    appVersion: require('../../package.json').version,
    PAYPAL_CLIENT_ID: 'test',
    PAYPAL_CURRENCY: 'EUR',
    // Suffixed by size '<n>x<n>', e.g. '40x40'
    PAYPAL_ITEM_NAME: 'Fotokanvas',
    // Prices for different canvas sizes
    // First price is 'statt', 2nd is real price sent to paypal
    CANVAS_PRICES: {
        sm: [ '54,90', '39,90' ],
        md: [ '74,90', '59,90' ],
        lg: [ '84,90', '69,90' ]
    },
    // No tailing "/" allowed!!
    backendAPI: 'https://api.printyomo.com',
    shopBaseURL: 'https://shop.printyomo.com'
};
