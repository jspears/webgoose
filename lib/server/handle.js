var mquery = require('mongoose/node_modules/mquery'), isFunction = require('lodash/lang/isFunction');
module.exports = function (mongoose, options) {
    options = options || {};
    var security = options.security || require('./security')(options);


    function findType(o, def) {
        return Array.isArray(o) ? o.length && o[0] ? o[0].constructor.modelName : def : o ? o.constructor.modelName : def;
    }

    function isMerge(ret) {
        return !!(ret && isFunction(ret.merge));
    }

    function isPromise(ret) {
        return !!(ret && isFunction(ret.then));
    }

    function result(o) {
        return {
            result: o,
            resultType: findType(o)
        }
    }

    function error(e, status) {
        return e ? {
            status: status || 1,
            error: e
        } : null;
    }

    function can(method) {
        if (typeof options[method] === 'boolean')
            return options[method];

    }

    function populator(populate) {
        /*        path: space delimited path(s) to populate
         select: optional fields to select
         match: optional query conditions to match
         model: optional name of the model to use for population
         options: optional query options like sort, limit, etc
         */
        return Object.keys(populate).map(function (key) {
            return populate[key]
        })
    }

    var dropDatabase = options.allowDropDatabase ? function (cb) {
        var db = (mongoose.db || mongoose.connection.db);
        console.log('dropiing database');
        db && db.dropDatabase(cb);
    } : function dropDatabase(cb) {
        console.log('a call to dropDatabase has been made but it does not support the operation');
        cb(new Error('Drop database can not be executed'));
    }

    return function (req, res, next) {
        console.log('handling', req.url);
        var parts = req.url.split('/');
        if (!parts[0]) parts.shift();
        var model = parts.shift(), Method = parts.shift(), id = parts.shift(), qp = req.body.promise, populate = req.body.populate, args = req.body && req.body.args || [];
        if (model === 'db' && Method === 'dropDatabase') {
            return dropDatabase(function (e, o) {
                if (e) {
                    return res.send(error(e));
                }
                return res.send({
                    status: 0
                })
            });
        }


        var Model = mongoose.model(model);

        function send(e, o) {
            if (e) {
                return res.send(error(e));
            }
            res.send(result(o));
        }

        if (!security(model, Model, Method, id, populate)) {
            return send('Security Violation');
        }
        if (id) {
            if (qp && Method === 'findById') {
                return Model.findById.apply(Model, args).merge(mquery(qp._conditions, qp.options)).exec(send);
            }

            return Model.findById(id, function (err, obj) {
                if (err || Method !== 'findById' && obj == null) {
                    return res.send(error(err || 'Could not find model of "' + model + '" with "' + id + '"'));
                }
                switch (Method) {
                    case  'execPopulate':
                    {
                        return obj.populate(populator(populate), send);
                    }
                    case 'findById':
                    {
                        return res.send(result(obj, model));
                    }
                    //save update remove are handled differently
                    case 'save':
                    {
                        obj.set(args[0]);
                    }
                    case 'remove':
                    {
                        return obj[Method](send);
                    }
                    //otherwise treat as a method call
                    default:
                    {
                        if (!isFunction(obj[Method])) {
                            return send('No such method "' + Method + '" on "' + model + '#' + obj._id + '" ');
                        }
                        if (!qp) {
                            return obj[Method].apply(obj, args.concat(send));
                        }
                        var ret = obj[Method].apply(obj, args);
                        if (isMerge(ret)) {
                            return ret.merge(mquery(qp._conditions, qp.options)).exec(send);
                        }
                        if (isPromise(ret)) {
                            return ret.then(function (o) {
                                send(null, o);
                            }, send);
                        }
                        return send(null, ret);

                    }
                }
            });

        }

        if (Method === 'save') {
            return new Model(args[0]).save(send)
        }

        if (!isFunction(Model[Method])) {
            return send('No such method "' + Method + '" on "' + model + '" ');
        }

        if (qp) {
            var ret = Model[Method].apply(Model, args);
            if (isMerge(ret)) {
                return ret.merge(mquery(qp._conditions, qp.options)).exec(send);
            }
            if (isPromise(ret)) {
                return ret.then(function (o) {
                    send(null, o);
                }, send);
            }
            return send(null, ret);
        }

        Model[Method].apply(Model, args.concat(send));

    }

};

