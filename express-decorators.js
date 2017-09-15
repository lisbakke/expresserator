const PATH_KEY      = "EXPRESS_DECORATORS_PATHS";

async function _validateParamAndPassOn(paramName, paramVal, opts, oldFunc, oldArgs, res) {
  if (paramVal === null || paramVal === undefined) {
    if (opts.required === true) {
      res.json(ExpressDecorators.errorJson(`'${paramName}' is required!`));
      return;
    } else {
      await oldFunc(...oldArgs, null);
      return;
    }
  }
  let parsedValue = paramVal;
  let parseError  = null;
  if (opts.type === 'number') {
    try {
      parsedValue = parseInt(paramVal);
      if (Number.isNaN(parsedValue)) {
        parseError = true;
      }
    } catch (e) {
      parseError = true;
    }
  }
  if (parseError) {
    res.json(ExpressDecorators.errorJson(`Could not parse '${paramName}' as type ${opts.type}!`));
    return;
  }
  await oldFunc(...oldArgs, parsedValue);
}

const ExpressDecorators = {
  app      : null,
  errorJson: function(errString) {
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
            ExpressDecorators.app[verb].call(ExpressDecorators.app, `${rootPath}${path}`, errorCheckedFunction);
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
      const oldFunc = target[name];
      target[name]  = async function(req, res, next) {
        const queryVal = req.query[queryName];
        await _validateParamAndPassOn(queryName, queryVal, opts, oldFunc, arguments, res);
      }
    }
  },
  PostParam(paramName, opts) {
    return function(target, name, descriptor) {
      const oldFunc = target[name];
      target[name]  = async function(req, res, next) {
        const paramVal = req.body[paramName];
        await _validateParamAndPassOn(paramName, paramVal, opts, oldFunc, arguments, res);
      }
    }
  }
};

module.exports = ExpressDecorators;
