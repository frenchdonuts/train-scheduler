var path = require('path');
var webpack = require('webpack');
var merge = require('webpack-merge');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');

console.log('WEBPACK GO!');

// detemine build env
var TARGET_ENV = process.env.npm_lifecycle_event === 'build' ? 'production' : 'development';

// common webpack config
var commonConfig = {

    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: '[hash].js'
    },

    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ['', '.js', '.elm']
    },

    module: {
        noParse: /\.elm$/
    },

    plugins: [
        new HtmlWebpackPlugin({
            template: './index.html',
            inject: 'body',
            filename: 'index.html'
        }),
        new ServiceWorkerWebpackPlugin({
            entry: path.join(__dirname, 'src/js/serviceworker/sw.js'),
            excludes: [
                '**/.*',
                '**/*.map',
                '*.html',
            ]
        })
    ],

    postcss: [autoprefixer({
        browsers: ['last 2 versions']
    })],

}

var swConfig = {
    output: {
        path: path.resolve(__dirname, 'dist/'),
        filename: 'serviceworker.js'
    },

    entry: {
        serviceworker: path.join(__dirname, './src/js/serviceworker/sw.js')
    },

    resolve: {
        root: path.join(__dirname, './src/js/serviceworker')
    },

    module: {
        loaders: [{
            test: /src\/js\/serviceworker\/.*\.js$/,
            loader: 'babel-loader'
        }]
    }
}

// additional webpack settings for local env (when invoked by 'npm start')
if (TARGET_ENV === 'development') {
    console.log('Serving locally...');

    module.exports = [merge(commonConfig, {

            entry: [
                'webpack-dev-server/client?http://localhost:8080',
                'babel-polyfill',
                path.join(__dirname, './index.js')
            ],

            devServer: {
                inline: true,
                progress: true
            },

            module: {
                loaders: [{
                    test: /\.elm$/,
                    exclude: [/elm-stuff/, /node_modules/],
                    loader: 'elm-webpack'
                }, {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader'
                }, {
                    test: /\.(css|scss)$/,
                    loaders: [
                        'style-loader',
                        'css-loader',
                        'postcss-loader',
                        'sass-loader'
                    ]
                }, {
                    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    loader: "url-loader?limit=10000&mimetype=application/font-woff"
                }, {
                    test: /\.(txt|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    loader: "file-loader"
                }]
            }

        })] //, swConfig ]
}

// additional webpack settings for prod env (when invoked via 'npm run build')
if (TARGET_ENV === 'production') {
    console.log('Building for prod...');

    module.exports = [merge(commonConfig, {

            entry: [
                'babel-polyfill',
                path.join(__dirname, './index.js')
            ],

            module: {
                loaders: [{
                    test: /\.elm$/,
                    exclude: [/elm-stuff/, /node_modules/],
                    loader: 'elm-webpack'
                }, {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    loader: 'babel-loader'
                }, {
                    test: /\.(css|scss)$/,
                    loader: ExtractTextPlugin.extract('style-loader', [
                        'css-loader',
                        'postcss-loader',
                        'sass-loader'
                    ])
                }, {
                    test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    loader: "url-loader?limit=10000&mimetype=application/font-woff"
                }, {
                    test: /\.(txt|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                    loader: "file-loader"
                }]
            },

            plugins: [
                new webpack.optimize.OccurenceOrderPlugin(),

                // extract CSS into a separate file
                new ExtractTextPlugin('./[hash].css', {
                    allChunks: true
                }),

                // minify & mangle JS/CSS
                new webpack.optimize.UglifyJsPlugin({
                    minimize: true,
                    compressor: {
                        warnings: false
                    }
                    // mangle:  true
                })
            ]

        })] //, swConfig ]
}
