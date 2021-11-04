const wpMerge = require( 'webpack-merge' );
const baseConfig = require( '../webpack.config.worker.js' );

module.exports = wpMerge.merge( baseConfig, {
    'mode': 'development',
    'devtool': 'source-map',
    'watch': true
});
