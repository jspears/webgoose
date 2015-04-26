var sf = require('../../lib/server/security'), expect = require('expect'), model = require('../support/blogpost');
describe('security', function () {

    it('should create a function', function () {
        var all = sf({});
        expect(all()).toEqual(true);
    });
    /*case 'builtin':
     return function (model, Model, Method, id, populate, promise) {
     return (Method in Model.schema.static) || (Method in Model.schema.methods);
     }
     case 'populate':
     return function (model, Model, Method, id, populate) {
     return Method !== 'execPopulate' && Object.keys(populate).length === 0;
     }
     case 'statics':
     return function (model, Model, Method, id, populate) {
     return (Method in Model.schema.static);
     }
     case 'methods':
     return function (model, Model, Method, id, populate) {
     return (Method in Model.schema.methods);
     }
     case 'conditions':
     return function (model, Model, Method, id, populate, promise) {
     return promise === false;
     }
     case 'options':
     return function (model, Model, Method, id, populate, promise) {
     return promise === false || options == null || Object.keys(options).length === 0;
     }*/
    describe('boolean options', function () {
        describe('builtin', function () {
            it('builtin false should be false', function () {
                var all = sf({
                    builtin: false/*,
                     populate: false,
                     statics: false,
                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'find')).toEqual(false);
            });
            it('builtin true should be true', function () {
                var all = sf({
                    builtin: true/*,
                     populate: false,
                     statics: false,
                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'find')).toEqual(true);
            });
            it('builtin false should  be true', function () {
                var all = sf({
                    builtin: false/*,
                     populate: false,
                     statics: false,
                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'findTitleLike')).toEqual(true);
            });
        });
        describe('statics', function () {
            it('statics true should  be true', function () {
                var all = sf({
                    statics: true
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'findTitleLike')).toEqual(true);
            });
            it('statics false should  be false', function () {
                var all = sf({
                    statics: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'findTitleLike')).toEqual(false);
            });
            it('statics false should  be true', function () {
                var all = sf({
                    statics: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'notAStatic')).toEqual(true);
            });
        });

        describe('methods', function () {
            it('methods true should  be true', function () {
                var all = sf({
                    methods: true,
                    builtin: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'findCommentsLike')).toEqual(true);
            });

            it('methods false should  be false', function () {
                var all = sf({
                    methods: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'findCommentsLike')).toEqual(false);
            });
            it('methods false should  be true', function () {
                var all = sf({
                    methods: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'notAmethod')).toEqual(true);
            });
        });
    });
    describe('arrays', function(){

        describe('methods', function () {
            it('methods when paths match true', function () {
                var all = sf({
                    methods: ['BlogPost.findCommentsLike'],
                    builtin: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'findCommentsLike')).toEqual(true);
            });
            it('methods when paths don not match false', function () {
                var all = sf({
                    methods: ['BlogPost.findCommentsLike'],
                    builtin: false
                    /*,
                     populate: false,

                     methods: false,
                     conditions: false,
                     options: false*/
                });
                expect(all('BlogPost', model.BlogPost, 'stuff')).toEqual(false);
            });



        });

    })

});