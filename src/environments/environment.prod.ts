export const environment = {
    production: true,
    appVersion: require('../../package.json').version,
    // FM
    PAYPAL_CLIENT_ID: 'AVGrO4Qr2il2mkNjP-igenDR7sUsZPIuiVBsqS5YkNjhJYeJMLv-_dnLEG1dUMFjNWgT7GU0l-4EpfHz',
    PAYPAL_CURRENCY: 'EUR',
    // Suffixed by size ' <n>x<n>', e.g. '40x40'
    PAYPAL_ITEM_NAME: 'Fotoleinwand',
    // Google Tag Manager ID
    GTM_ID: 'UA-188334684-1',
    // Prices for different canvas sizes
    // First price is 'statt', 2nd is real price sent to paypal
    CANVAS_PRICES: {
        sm: [ '54,90', '24,90' ],
        md: [ '74,90', '39,90' ],
        lg: [ '84,90', '49,90' ]
    },
    // No tailing "/" allowed!!
    backendAPI: 'https://leinwand.allesgute.info/api'
};
