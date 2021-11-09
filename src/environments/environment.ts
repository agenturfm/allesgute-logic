// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
    production: false,
    PAYPAL_CLIENT_ID: 'AXUHq7-v7CqikhcgViD35Xw8xlDxbHX_abqEBalAJidRg6Izi-kd4g6-jEmhKEOlGHVK1kZ8bsUjntvX',         // Sandbox
    appVersion: require('../../package.json').version + '-dev',
    backendAPI: 'http://localhost:3000',             /* No tailing "/" allowed!! */
    // backendAPI: 'https://api.printyomo.com',       /* No tailing "/" allowed!! */
    shopBaseURL: 'https://shop.printyomo.com'        /* No tailing "/" allowed!! */
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
