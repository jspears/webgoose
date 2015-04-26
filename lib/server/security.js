var lodash = require('lodash');
module.exports = function (options) {

    /*builtin  | boolean | false disables all the built in functions including findById
     | populate | boolean | false disables population
     | methods  | boolean | false disables instance method invocations
     | statics  | boolean | false disables static method invocations
     | models   | String  | a comma delimented list of allowed models (or an array).
     |conditions| boolean | allow for condintions (mquery);
     |options| boolean | allow for options (mquery);
     */
    function isTrue() {
        return true;
    }

    function isFalse() {
        return false;
    }

    function hasAll(allowed, check) {
        return !check.some(function (v) {
            return !(lodash.contains(allowed, v));
        });
    }

    function compilePaths(v) {

        var result = v.map(function (v) {
            if (lodash.isRegExp(v)) {
                return function (model, method) {
                    return v.test([model, method].join('.'));
                }
            }
            if (lodash.isString(v)) {
                var parts = v.split('.', 3);
                return function (model, method) {
                    return parts[0] === model && parts[1] === method;
                }
            }
            throw new Error("Don't know what to do with " + v);
        });
        return function compilePaths$matched(model, method) {
            for (var i = 0, l = result.length; i < l; i++) {
                if (result[i](model, method) === true) {
                    return true;
                }
            }
            return false;
        }
    }

    function compilePathsDeep(v) {

        var result = v.map(function (v) {
            if (lodash.isRegExp(v)) {
                return function (model, method, keys) {
                    return keys.some(function (key) {
                        return v.test([model, method, key].join('.'));
                    });
                }
            }
            if (lodash.isString(v)) {
                var parts = v.split('.', 3);
                return function (model, method, keys) {
                    if (!(parts[0] === model && parts[1] === method || parts.length < 3))
                        return false;
                    return keys.indexOf(parts[2]) > -1;
                }
            }
            throw new Error("Don't know what to do with " + v);
        });
        return function compilePaths$matched(model, method, keys) {
            for (var i = 0, l = result.length; i < l; i++) {
                if (result[i](model, method, keys) === true) {
                    return true;
                }
            }
            return false;
        }
    }

    function normalize$each(v, k) {
        if (v === true) {
            return isTrue;
        }
        if (lodash.isBoolean(v)) {
            switch (k) {
                case 'builtin':
                    return function (model, Model, Method, id, populate, promise) {
                        return (Method in Model.schema.statics) || (Method in Model.schema.methods);
                    }
                case 'populate':

                    return function (model, Model, Method, id, populate) {
                        return Method !== 'execPopulate' && Object.keys(populate).length === 0;
                    }
                case 'statics':
                    return function (model, Model, Method, id, populate) {
                        return !(Method in Model.schema.statics);
                    }
                case 'methods':
                    return function (model, Model, Method, id, populate) {
                        return !(Method in Model.schema.methods);
                    }
                case 'conditions':
                    return function (model, Model, Method, id, populate, promise) {
                        return !promise || !promise._conditions || Object.keys(promise._conditions).length === 0;
                    }
                case 'options':
                    return function (model, Model, Method, id, populate, promise) {
                        return promise === false || options == null || Object.keys(options).length === 0;
                    }
                default:
                    throw Error('Security option ' + k + ' does not understand a boolean');
            }
        }
        if (lodash.isArray(v)) {
            if (v.length === 0) {
                return isFalse;
            }
            switch (k) {
                case 'methods':
                    var isMatch = compilePaths(v);
                    return function (model, Model, Method, id, populate) {
                        return isMatch(model, Method);
                    }
                case 'populate':
                    var deep = compilePathsDeep(v);
                    return function (model, Model, Method, id, populate) {
                        return deep(model, Method, Object.keys(populate));
                    }
                case 'conditions':

                    var deep = compilePathsDeep(v);
                    return function (model, Model, Method, id, populate, promise) {
                        return !promise || Object.keys(promise._conditions).length === 0 || deep(model, Method, Object.keys(promise._conditions));
                    }
                case 'options':
                    var deep = compilePathsDeep(v);
                    return function (model, Model, Method, id, populate, promise) {
                        return !promise || Object.keys(promise.options).length === 0 || deep(model, Method, Object.keys(promise.options));
                    }
                default:
                    throw Error('Security option ' + k + ' does not understand arrays');
            }
        }

        if (lodash.isString(v)) {
            return normalize$each(v.split(/,\s*/), k);
        }
        if (lodash.isFunction(v)) {
            return v;
        }
        throw new Error('Unknown security option ' + k);
    }

    var normalized = lodash.map(lodash.pick(options, 'builtin', 'models', 'statics', 'methods', 'conditions', 'options', 'populate'), normalize$each);

    return function security$check(model, Model, Method, id, populate, promise) {
        return !lodash.some(normalized, function (v) {
            return v(model, Model, Method, id, populate, promise) === false;
        });
    }
}