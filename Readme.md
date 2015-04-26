#Webgoose

A project to make accessing mongoose functions from the browser easy.

## Security *Use at your own risk*
Webgoose is pretty hard to secure.   For some applciations this might be fine.  There
are a few basic problems.
 1) Webpack sends the source to the server for your model.   This could expose the inner workings of your app.
 2) Some more advanced features such as populations and anything that uses query makes it possible to expose more
   of your apps.  
   
There is more information below how to secure your application.   

## Usage
Webgoose uses webpack and friends for the front end components, and express for the server.

### Installation
Basic 

```sh
  $ npm i webgoose --save
  # Do not use this in production
  $ webgoose-dev-server ./path/to/your/model.js
```


### Example model/blogpost.js
This is (or should be exactly the same as your mongoose, on the server
webgoose just exports mongoose.  On the client it does special magic.
For testing the api is meant to be the same.   Not the connect method
should not be here.

```js
  //on the server webgoose will just return mongoose.  On the client
  // it does magic.
  var mongoose = require('webgoose');
  var Schema = mongoose.Schema;

  var CommentSchema = new Schema({
        title: String, body: String, comment: String, date: Date
  });

  var UserSchema = new Schema({
        username: {type: String, match: /^[a-z]+?$/},
        friends: [{type: Schema.Types.ObjectId, ref: 'User'}]
  });
  var BlogPostSchema = new Schema({
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        editors: [{ref: 'User', type: Schema.Types.ObjectId}],
        title: {
            type: String,
            match: new RegExp('^.{3,}$')
        },
        body: String,
        buf: Buffer,
        date: Date,
        comments: [CommentSchema],
        meta: {
            votes: Number, favs: Number
        }
    });
    /**
     * Note this must return a query object.   If it doesn't well, I dunno what it'll do.
     * @param q
     * @param term
     */
    BlogPostSchema.statics.findTitleLike = function findTitleLike(search) {
        if (!search)
            return this.find({_id: null});


        return this.find({title: new RegExp(search, 'i')});
    }
   BlogPostSchema.methods.findCommentsLike = function (search) {
        return this.constructor.findById(this._id).where({
            'comments.title': new RegExp(search, 'i')
        }).then(function (o) {
            return o.comments;
        });
  }
  mongoose.model('User', UserSchema);
  mongoose.model('BlogPost', BlogPostSchema);
  mongoose.model('Comment', CommentSchema);
  
  //might as well export mongoose.
  module.exports = mongoose;

```

#### Setting up the server
Example server.js

```js
var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('./model/blogpost');
var webgoose = require('webgoose/middleware');

//Mongoose needs to connect.
mongoose.connect('mongodb://localhost/webgoose_db');

//Must have body parser 
app.use(bodyParser.json());

//use the webgoose express login
app.use('/rest/webgoose', webgoose(mongoose));

console.log('listening on 3000');
app.listen(3000);
```

### Setting up the client

If you are not using [webpack](http://webpack.github.io/) well good luck. If you
are then you can just, use it.  See the example below

#### Example webpack.config.js
There is nothing special but the proxy setup.

```js
    module.exports = {
        devServer: {
            contentBase: "./.build",
            info: false, //  --no-info option
            hot: true,
            inline: true,
            proxy: {
             //we setup a proxy to pass the requests to the server
             '/rest/mongoose/*': 'http://localhost:3001'
        },
        entry: {
               app: './public/app.js'
        }
    }
};
```

#### Client example of public/app.js

```js
  var mongoose = require('webgoose');

  //this sets the url to the client and server.
  mongoose.connect('/rest/webgoose');
  var BlogPost = mongoose.model('BlogPost');
  
  //create a blogpost
  new BlogPost({ 
  //your blogpost
  
  }).save(function(e, o){
     //typical mongoose handler.
  });

```

#### Package.json
Starting from package.json is convienent.

```json
  
  "scripts": {
    "start": "webgoose-dev-server path/to/your/model path/to/your/other/model",
  },

```


```sh
  $ npm start &

```

##Security Configuration
See the top security disclosure.  But here are some ways to configure.
in your server.js. Everything is available by default.  

pass the following options
 
  |Key       | Type    |Description
  +----------+---------+------------
  | builtin  | boolean | false disables all the built in functions including findById
  | mquery   | boolean | false disables mquery operations.
  | populate | boolean | false disables population
  | methods  | boolean | false disables instance method invocations
  | statics  | boolean | false disables static method invocations
  | models   | String  | a comma delimented list of allowed models (or an array).
  