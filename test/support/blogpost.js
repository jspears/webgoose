/**
 * Wrap the export so that a mongoose can be passed in.  This is useful, for testing, and managing connections.
 * @param m
 * @returns {{Comment: *, BlogPost: *}}
 */
var mongoose = require('../../lib/client/model');
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


BlogPostSchema.statics.findByCallback = function onFindByCallback(query$id) {
    return this.find({_id: query$id}).exec();
}
/**
 * This is just an example, if this proves useful, may make it part of mers.
 * @param q
 * @param collection
 * @constructor
 */


module.exports = {
    Comment: mongoose.model('Comment', CommentSchema),
    User: mongoose.model('User', UserSchema),
    BlogPost: mongoose.model('BlogPost', BlogPostSchema)
};
