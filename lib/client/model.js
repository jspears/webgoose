var mongoose = require('mongoose'), isFunction = require('lodash/lang/isFunction'), Promise = require('mongoose/lib/promise'), mquery = require('mongoose/node_modules/mquery');

if (!mongoose.model) {
    mongoose.isBrowser = true;
    function promise(cb) {
        return cb ? new Promise(cb) : new Promise();
    }

    var methods = ['save', 'remove'];
    var statics = ['find', 'update', 'remove', 'findById', 'findByIdAndRemove', 'findByIdAndUpdate'];
    var queue = [], inBatch = false;

    function doPost(url, data, promise) {
        url = options.url + '/' + url;

        var xhr = new XMLHttpRequest;
        var canAbort = false, isAbort = false;

        xhr.addEventListener("error", function (e) {
            if (!isAbort) {
                promise.resolve(xhr);
            }
        });

        xhr.addEventListener("load", function () {
            canAbort = false
            if (!isAbort) {
                promise.resolve(null, JSON.parse(xhr.responseText));
            }
            xhr = null;
        });

        xhr.open("POST", url, true);
        canAbort = true;

        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.send(JSON.stringify(data));

        promise.cancel = function () {
            isAbort = true;
            if (xhr && canAbort) {
                xhr.abort();
                xhr = null;
                promise.resolve(xhr, null);
            }
        };
        return promise;
    }

    function post(url, data, promise) {
        if (!options.url || inBatch) {
            queue.push([url, data, promise]);
            return promise;
        }
        return doPost(url, data, promise);
    }

    function wrapError(res) {
        return res && res.error;
    }

    function wrap(res) {
        var obj = res && res.result, Known;
        if (res && res.resultType && res.result) {
            Known = mongoose.model(res.resultType);
            if (!Known) {
                console.log('unknown type', res.resultType);
                return obj;
            }
            if (Array.isArray(obj)) {
                for (var i = 0, l = obj.length; i < l; i++) {
                    obj[i] = new Known().init(obj[i]);
                }
                return obj;
            } else {
                return new Known(obj);
            }
        }
        return obj;
    }

    function isLastFunction(args) {
        return args && args.length > 0 && isFunction(args.slice(-1)[0]);
    }

    function handleStatic(model, method, Model) {
        var url = model + '/' + method;
        return function model$static() {
            var args = Array.prototype.slice.call(arguments), p = promise();
            if (isLastFunction(args)) {
                var cb = args.pop().bind(Model);
                return post(url, {args: args, promise: false}, p).then(function (o) {
                    cb(wrapError(o), wrap(o));
                }, function (e) {
                    cb(e);
                });
            }
            var ret = mquery(), hasExec = false;

            ret.exec = function (cb) {
                hasExec = true;
                return post(url, {args: args, promise: ret}, p).then(wrap, wrapError).onResolve(cb);
            }
            ret.then = function (cb, er) {
                return (hasExec ? p : post(url, {args: args, promise: ret}, p)).then(function (o) {
                    cb(wrap(o));
                }, er && function (e) {
                    er(wrapError(e));
                });
            }
            return ret;


        }
    }

    function popper(populate, result) {
        return populate ? Object.keys(populate).map(function (key) {
            var item = populate[key], docs = (item._docs || (item._docs = {}));
            if (result[key]) {
                docs[result._id] = new mongoose.model('User')(result[key]);
            }
            return item;
        }) : false;
    }

    function handleMethod(model, method) {
        var url = model + '/' + method;
        return function model$method() {
            var curl = url + (this.isNew ? '' : '/' + this._id), self = this, args = Array.prototype.slice.call(arguments), p;
            var handler = (methods.indexOf(method) > -1) ? function (cb, ret) {
                return post(curl, {
                    args: method === 'execPopulate' ? [] : [self.toJSON()],
                    promise: ret,
                    populate: self.$__.populate
                }, promise(function (e, r) {
                    if (e) return cb(e);
                    self.init(r.result, {populated: popper(self.$__.populate, r.result)});
                    cb(null, self);
                }));

            } : function (cb, ret) {
                var p = promise(cb);
                return cb ? post(curl, {
                    args: args,
                    promise: ret,
                    populate: self.$__.populate
                }, p) : post(curl, {
                    args: args,
                    promise: ret,
                    populate: self.$__.populate
                }, p);
            }

            if (isLastFunction(args)) {
                return handler(args.pop().bind(self));

            }
            var ret = mquery(), hasExec = false;
            ret.then = function (cb, er) {
                return handler(function (e, o) {
                    if (e && er || o && o.error) return er(e || o.error);
                    return cb(wrap(o));
                }, ret);
            }
            ret.exec = function (cb) {
                return handler(cb, ret);
            }
            return ret;


        }
    }

    function create(Model) {
        return function model$create(obj, fn) {
            var p = promise(fn);
            new Model(obj).validate().then(function () {
                return m.save(p.resolve.bind(p));
            }, p.reject.bind(p));
            return p;
        }
    }

    var options = {};
    mongoose.connection = {
        db: {
            dropDatabase: function (cb) {
                post('db/dropDatabase', {}, promise(cb));
            }
        }
    };
    mongoose.connect = function (url, cb) {
        options.url = url || '/rest/mongoose';
        cb && cb();
        return mongoose;
    }

    mongoose.batch = function () {
        inBatch = true;
    }
    mongoose.unbatch = function unbatch(type) {
        inBatch = false;
        if (typeof type === 'function') {
            return type(queue.splice(0));
        }

        switch (type) {
            case 'async':
            {

                return mongoose.unbatch(function (queue) {
                    return promise().all(queue.map(function (args) {
                        return doPost.apply(null, args);
                    }));
                });
            }
            case 'sync':
            {

            }
            case 'serverAsync':
            {

            }
            case 'serverSync':
            {

            }
            default:
            {

            }
        }

    }
    mongoose.model = (function () {


        var models = {}, Document = mongoose.Document;


        return function mongoose$model(model, schema) {
            if (schema) {
                function ModelDocument(obj, fields, skipId, skipInit) {
                    if (!(this instanceof ModelDocument)) {
                        return new ModelDocument(obj, fields, skipId, skipInit);
                    }
                    var isNew = obj && !('_id' in obj) || this._id != null;
                    skipId = skipId == null ? true : skipId;
                    skipInit = skipInit == null ? false : skipInit;
                    fields = fields == null ? false : fields;
                    Document.call(this, obj, schema, fields, skipId, skipInit);
                    this.isNew = isNew;
                }


                /*!
                 * Inherits from Document.
                 *
                 * All Model.prototype features are available on
                 * top level (non-sub) documents.
                 */


                ModelDocument.__proto__ = Document;
                ModelDocument.prototype.__proto__ = Document.prototype;

                statics.concat(Object.keys(schema.statics)).forEach(function (k) {
                    this[k] = handleStatic(model, k, ModelDocument);
                }, ModelDocument);

                methods.concat(Object.keys(schema.methods)).forEach(function (k) {
                    this[k] = handleMethod(model, k);
                }, ModelDocument.prototype);
                schema.methods = {};

                ModelDocument.modelName = model;
                ModelDocument.create = create(ModelDocument);
                ModelDocument.populate = function populate(doc, paths, fn) {
                    var p = promise(function (e, o) {
                        o.result && paths.map(function (path) {
                            var odata = o.result[path.path], sp = schema.path(path.path);

                            if (odata && sp && sp.options) {
                                if (sp.options.ref) {
                                    var Model = models[sp.options.ref];
                                    o.result[path.path] = new Model().init(odata);
                                } else if (sp.instance === 'Array' && sp.options.type && sp.options.type[0]) {
                                    var Model = models[sp.options.type[0].ref];
                                    o.result[path.path] = o.result[path.path].map(function (val) {
                                        return new Model().init(val);
                                    })
                                }
                            }
                        });
                        return fn(e || o && o.error, doc.init(o.result));
                    });
                    return post('BlogPost/execPopulate/' + doc._id, {
                        args: [doc._id],
                        populate: paths
                    }, p);

                }

                models[model] = ModelDocument;
            }
            return models[model];
        }
    })()
}
module.exports = mongoose;