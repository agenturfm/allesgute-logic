const ProgressPlugin = require( 'webpack/lib/ProgressPlugin' );
const {NoEmitOnErrorsPlugin} = require( 'webpack' );
const {AngularWebpackPlugin} = require( '@ngtools/webpack' );

module.exports = {
    'mode': 'production',
    'resolve': {
        'extensions': [
            '.ts',
            '.js'
        ],
        'modules': [
            './node_modules'
        ]
    },
    'resolveLoader': {
        'modules': [
            './node_modules'
        ]
    },
    'entry': {
        './src/assets/workers/worker.main': [
            './src/worker/main.worker.ts'
        ]
    },
    'output': {
        'path': process.cwd(),
        'filename': '[name].js'
    },
    'watch': false,
    'module': {
        'rules': [
            {
                'enforce': 'pre',
                'test': /\.js$/,
                'loader': 'source-map-loader',
                'exclude': [
                    /\/node_modules\//
                ]
            },
            {
                'test': /\.json$/,
                'loader': 'json-loader'
            },
            {
                'test': /\.ts$/,
                'loader': '@ngtools/webpack'
            }
        ]
    },
    'plugins': [
        new NoEmitOnErrorsPlugin(),
        new ProgressPlugin(),
        new AngularWebpackPlugin({
            'tsconfig': './src/tsconfig.worker.json'
        })
    ]
};
