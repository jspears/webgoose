var webpack = require('webpack'), path = require('path');

module.exports = function (config) {
    config.set({
        browsers: ['Chrome'], //run in Chrome
        singleRun: true, //just run once by default
        frameworks: ['mocha'], //use the mocha test framework
        files: [
            //'tests.webpack.js' //just load this file
           // 'test/*-test.js',
            'test/client/**/*-test.js'
        ],
        preprocessors: {
            'test/client/**/*-test.js': ['webpack', 'sourcemap'] //preprocess with webpack and our sourcemap loader
        },

        proxies: {
            '/rest/mongoose/': 'http://localhost:3082/rest/mongoose/'
        },
        reporters: ['dots'], //report results in this format

        webpack: { //kind of a copy of your webpack config
            cache: true,
            debug: true,
            devtool: 'inline-source-map',
            stats: {
                colors: true,
                reasons: true
            }
        }
    });

};
