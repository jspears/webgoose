var mongoose = require('../../lib/client/model');

var models = require('../support/blogpost');
var expect = require('expect');
describe('model', function () {
    var connection;
    var url = mongoose.isBrowser ? '/rest/mongoose' : 'mongodb://localhost/test-webgoose';
    before(function (done) {
        mongoose.connect(url, function () {
            mongoose.connection.db.dropDatabase(function (e, o) {
                done();
            })
        });
    });
    this.timeout(50000);
    var _id;
    var user, e1, e2, bp;
    before(function (done) {
        user = new models.User({username: 'joe', factor:5});
        e1 = new models.User({username: 'anna', factor:2});
        e2 = new models.User({username: 'bobanna', factor:5});

        user.save(function (e, u) {
            e1.save(function (e, e1) {
                e2.save(function (e, e2) {
                    e1.friends.push(e2._id);
                    e1.save(function () {
                        bp = new models.BlogPost({
                            title: 'world', owner: u._id, editors: [e1._id, e2._id], comments: [{
                                title: 'Cool',
                                body: 'Not so cool'
                            }]
                        });
                        bp.save(function (e, o) {
                            _id = o._id;
                            done();
                        });
                    })
                });
            });
        });
    });
    it('should find  joe', function(){
      return models.User.find().where({username:'joe'}).then(function(d){
          expect(d.length).toBe(1);
      });
    });
    it('should find distinct factors', function(){
        return models.User.find().distinct('factor').then(function(d){
            expect(d.length).toBe(2);
        });
    });
    it('should count users', function(){
        return models.User.find().count().then(function(v){
            expect(v).toBe(3);
        });
    });
    it('should count users with conditions', function(){
        return models.User.find().count({factor:5}).then(function(v){
            expect(v).toBe(2);
        });
    });
    it('should save', function () {
        var bp = new models.BlogPost({title: 'world', owner: user});
        return bp.save(function (e, o) {
            expect(e).toNotExist();
            expect(o).toExist();
            expect(o).toEqual(bp);
        });
    });
    it('should should save a saved object', function () {
        var bp = new models.BlogPost({title: 'save', owner: user});
        var id;
        return bp.save(function (e, o) {
            expect(e).toNotExist();
            expect(o).toExist();
            expect(o).toEqual(bp);
            id = bp._id;
        }).then(function () {
            bp.set('title', 'updated');
            return bp.save(function (e, r) {
                expect(r.title).toEqual('updated');
                expect(r._id).toEqual(id);
                expect(r).toEqual(bp);
                expect(bp.isNew).toEqual(false);
            });
        });

    });


    it('should findById', function () {
        return models.BlogPost.findById(_id).then(function (o) {
            expect(o._id + '').toEqual(_id + '');
        });
    });
    it('should not populate user', function () {
        return models.BlogPost.findById(_id).then(function (o) {
            expect(o._id + '').toEqual(_id + '');
            expect(o.owner).toEqual(user._id);
        });
    });
    it('should populate user', function (done) {

        models.BlogPost.findById(_id, function (e, o) {
            expect(o._id + '').toEqual(_id + '');
            expect(o.owner + '').toEqual(user._id + '');

            o.populate('owner');

            o.execPopulate().then(function (p) {
                expect(o).toEqual(p);
                expect(p.owner.username).toEqual('joe');
                done();
            }, function (e) {
                done(e);
            });
        });
    });

    it('should populate editors and owner', function (done) {

        models.BlogPost.findById(_id, function (e, o) {
            expect(o._id + '').toEqual(_id + '');
            expect(o.owner + '').toEqual(user._id + '');
            o.populate(['owner', 'editors']);
            var p = o.execPopulate();
            p.then(function (p) {
                expect(o).toEqual(p);
                expect(p.owner.username).toEqual('joe');
                expect(p.editors[0].username).toEqual('anna');
                expect(p.editors[1].username).toEqual('bobanna');
                done();
            }, function (e) {
                done(e);
            });
        });
    });

    it('should execute BlogPost#findTitleLike', function () {

        return models.BlogPost.findTitleLike('w').then(function (o) {

            expect(o[0].title).toMatch(/w/i);

        });
    });
    it('should execute BlogPost.findCommentsLike', function () {

        return bp.findCommentsLike('C').then(function (comments) {
            expect(comments[0].title).toMatch(/C/i);
        });
    });
});