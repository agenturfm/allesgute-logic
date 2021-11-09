export const environment = {
    production: true,
    PAYPAL_CLIENT_ID: 'test',
    appVersion: require('../../package.json').version,
    backendAPI: 'https://api.printyomo.com',    /* No tailing "/" allowed!! */
    shopBaseURL: 'https://shop.printyomo.com'       /* No tailing "/" allowed!! */
};
