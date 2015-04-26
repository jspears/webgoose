var path = require('path'), version = require('./package.json').version;
module.exports = {

    devtool: 'source-map',
    devServer: {
        contentBase: "./.build",
        info: false, //  --no-info option
        hot: true,
        inline: true,
        proxy: {
            '/rest/mongoose/*': 'http://localhost:3080'
        }
    },

    entry: {
        webgoose: './lib/client/model.js'
    },

    output: {
        path: path.join(__dirname, "dist"),
        filename: "[name]." + version + ".js",
        library: ["[name]"],
        libraryTarget: "umd"
    },
    stats: {
        colors: true,
        reasons: true
    }

};

