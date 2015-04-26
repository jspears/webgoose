#!/usr/bin/env node
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var path = require('path');
var DEF_PORT = 3082, DEF_MONGO = 'mongodb://localhost/react_mongoose', DEF_CONTEXT = '/rest/mongoose';
var args = process.argv.slice(2), port = DEF_PORT, mongo = DEF_MONGO, includes = [], context = DEF_CONTEXT, allowDropDatabase = false;

while (args.length) {
    var val = args.shift();
    switch (val) {
        case '-p':
        case '--port':
            port = parseInt(args.shift());
            break;
        case '-m':
        case '--mongo':
            mongo = args.shift();
            break;
        case '-c':
        case '--context':
            context = args.shift();
            break;
        case '--allow-drop-database':
            allowDropDatabase = true;
            console.log('allowing drop database sure hope you know what you are doing');
            break;
        case '-h':
        case '--help':
            console.log('usage: webgoose-dev-server [-hpmc] models...\n\
            \t-h|--help\tThis help message\n\
            \t-p|--port\tPort for the server to listen default:\t' + DEF_PORT + '\n\
            \t-m|--mongo\tMongo connection url default:\t' + DEF_MONGO + '\n\
            \t-c|--context\tContext for the server to listen to default:' + DEF_CONTEXT + '\n\
            \t--allow-drop-database default: false\n\
            ');
            process.exit(1);
        default:
            includes.push(val);
    }
}
//load models
includes.forEach(function (v) {
    require(path.join(process.cwd(), v));
});


var app = express();
app.use(bodyParser.json());
app.use(context, require('../middleware')(mongoose, {allowDropDatabase: allowDropDatabase}));

mongoose.connect(mongo);

console.log('webgoose-dev-server listening on ', port, 'at context', context);
app.listen(port);
