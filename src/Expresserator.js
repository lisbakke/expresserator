const PATH_KEY = "EXPRESS_DECORATORS_PATHS";

function _parseNumber(paramVal) {
  try {
    const parsedValue = parseInt(paramVal);
    if (Number.isNaN(parsedValue)) {
      return [true, null];
    }
    return [false, parsedValue]
  } catch (e) {
    return [true, null];
  }
}

function _parseArray(paramVal) {
  if (paramVal instanceof Array) {
    return [false, paramVal];
  } else {
    try {
      const parsedArray:?Array = JSON.parse(paramVal);
      if (parsedArray && parsedArray instanceof Array) {
        return [false, parsedArray];
      }
    } catch(e) {
      return [true, null];
    }
  }
  return [true, null];
}

function _parseBoolean(paramVal) {
  if (paramVal === true || paramVal === false) {
    return [false, paramVal];
  }
  if (paramVal === 'true') {
    return [false, true];
  }
  if (paramVal === 'false') {
    return [false, false];
  }
  return [true, null];
}

function _parseString(paramVal) {
  if (typeof paramVal === 'string') {
    return [false, paramVal];
  }
  return [true, null];
}

// TODO(lisbakke): Allow more advanced object shape parsing.
function _parseObject(paramVal) {
  if (typeof paramVal === 'object') {
    return [false, paramVal];
  }
  return [true, null];
}

function _isValidParamType(opts, httpVerb) {
  if (httpVerb.toLowerCase() === 'post' && (
      opts.type === Expresserator.TYPE_ARRAY ||
      opts.type === Expresserator.TYPE_BOOLEAN ||
      opts.type === Expresserator.TYPE_STRING ||
      opts.type === Expresserator.TYPE_NUMBER)) {
    return true;
  } else if (httpVerb.toLowerCase() === 'get' && (
      opts.type === Expresserator.TYPE_BOOLEAN ||
      opts.type === Expresserator.TYPE_STRING ||
      opts.type === Expresserator.TYPE_NUMBER)) {
    return true;
  }
  return false;
}

async function _validateParamAndPassOn(paramName: String, paramVal: Any, opts: ?Object, oldFunc: Function, oldArgs: Array,
                                       res: Object, httpVerb: String) {
  if (!_isValidParamType(opts, httpVerb)) {
    res.json(Expresserator.errorJson(`Invalid type '${opts.type}' for param '${paramName}' HTTP verb '${httpVerb}'`));
    return true;
  }
  if (paramVal === null || paramVal === undefined) {
    if (opts.required === true) {
      res.json(Expresserator.errorJson(`'${paramName}' is required!`));
      return;
    } else {
      await oldFunc(...oldArgs, null);
      return;
    }
  }
  let parsedValue = paramVal;
  let parseError  = null;
  if (opts.type === Expresserator.TYPE_NUMBER) [parseError, parsedValue] = _parseNumber(parsedValue);
  if (opts.type === Expresserator.TYPE_ARRAY) [parseError, parsedValue] = _parseArray(parsedValue);
  if (opts.type === Expresserator.TYPE_BOOLEAN) [parseError, parsedValue] = _parseBoolean(parsedValue);
  if (opts.type === Expresserator.TYPE_STRING) [parseError, parsedValue] = _parseString(parsedValue);
  if (opts.type === Expresserator.TYPE_OBJECT) [parseError, parsedValue] = _parseObject(parsedValue);
  if (parseError) {
    res.json(Expresserator.errorJson(`Could not parse '${paramName}' as type ${opts.type}!`));
    return;
  }
  await oldFunc(...oldArgs, parsedValue);
}

const Expresserator = {
  TYPE_OBJECT : 'object',
  TYPE_NUMBER : 'number',
  TYPE_ARRAY  : 'array',
  TYPE_STRING : 'string',
  TYPE_BOOLEAN: 'boolean',
  app         : null,
  errorJson   : function(errString) {
    return {
      success: false,
      error  : errString
    }
  },
  Root(rootPath) {
    return function(target, name, descriptor) {
      const targetInstance = new target();
      let pathsObjects     = targetInstance[PATH_KEY];
      if (pathsObjects) {
        for (const path of Object.keys(pathsObjects)) {
          const verbObject = pathsObjects[path];
          for (const verb of Object.keys(verbObject)) {
            const fn                 = verbObject[verb];
            rootPath                 = rootPath || "";
            let errorCheckedFunction = async function(req, res, next) {
              try {
                await fn(req, res, next);
              } catch (err) {
                next(err);
              }
            };
            Expresserator.app[verb].call(Expresserator.app, `${rootPath}${path}`, errorCheckedFunction);
          }
        }
      }
    }
  },
  Path(path, verb) {
    return function(target, name, descriptor) {
      const finalVerb                   = verb || "get";
      target[PATH_KEY]                  = target[PATH_KEY] || {};
      target[PATH_KEY][path]            = target[PATH_KEY][path] || {};
      target[PATH_KEY][path][finalVerb] = target[name];
    }
  },
  GetParam(queryName, opts) {
    return function(target, name, descriptor) {
      const oldFunc = target[name].bind(new target.constructor());
      target[name]  = async function(req, res, next) {
        const queryVal = req.query ? req.query[queryName] : null;
        await _validateParamAndPassOn(queryName, queryVal, opts, oldFunc, arguments, res, 'get');
      }
    }
  },
  PathParam(queryName, opts) {
    return function(target, name, descriptor) {
      const oldFunc = target[name].bind(new target.constructor());
      target[name]  = async function(req, res, next) {
        const queryVal = req.params ? req.params[queryName] : null;
        await _validateParamAndPassOn(queryName, queryVal, opts, oldFunc, arguments, res, 'get');
      }
    }
  },
  PostParam(paramName, opts) {
    return function(target, name, descriptor) {
      const oldFunc = target[name].bind(new target.constructor());
      target[name]  = async function(req, res, next) {
        const paramVal = req.body ? req.body[paramName] : null;
        await _validateParamAndPassOn(paramName, paramVal, opts, oldFunc, arguments, res, 'post');
      }
    }
  }
};

module.exports = Expresserator;
