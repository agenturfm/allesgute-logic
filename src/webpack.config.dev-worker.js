const merge = require( 'webpack-merge' );
const baseConfig = require( '../webpack.config.worker.js' );

module.exports = merge( baseConfig, {
    'mode': 'development',
    'devtool': 'source-map',
    'watch': true
});
