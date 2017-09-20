const express       = require('express');
const {decorate}    = require('core-decorators');
const uuid          = require('uuid');
const Expresserator = require('../src/Expresserator');
const compression   = require('compression');
const bodyParser    = require('body-parser');

const {Root, Path, GetParam, PostParam, TYPE_BOOLEAN, TYPE_NUMBER, TYPE_STRING, TYPE_ARRAY} = Expresserator;

const app               = express();
Expresserator.app       = app;
Expresserator.errorJson = function(errString) {
  return {
    success: false,
    error  : errString
  }
};

app.use(compression());
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({
  extended: true,
  limit   : '5mb'
}));

async function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Root('/foo')
class Greeter {

  @Path('/hello', 'get')
  @GetParam('fooNumber', {type: TYPE_NUMBER, required: true})
  @GetParam('fooString', {type: TYPE_STRING, required: true})
  @GetParam('fooBoolean', {type: TYPE_BOOLEAN, required: true})
  async helloGet(req, res, next, fooNumber, fooString, fooBoolean) {
    await timeout(100);
    res.json({greeting: `Hello Get. fooNumber ${fooNumber} fooString ${fooString} fooBoolean ${fooBoolean}`});
  }

  @Path('/hello', 'post')
  @PostParam('fooNumber', {type: TYPE_NUMBER, required: true})
  @PostParam('fooArray', {type: TYPE_ARRAY, required: true})
  @PostParam('fooString', {type: TYPE_STRING, required: true})
  @PostParam('fooBoolean', {type: TYPE_BOOLEAN, required: true})
  async helloPost(req, res, next, fooNumber, fooArray, fooString, fooBoolean) {
    await timeout(100);
    res.json({greeting: `Hello Post. fooNumber ${fooNumber} fooArray ${fooArray} fooString ${fooString} fooBoolean ${fooBoolean}`});
  }
}

app.use("*", (error, req, res, next) => {
  res.status(500).json({
    error        : "Uncaught server exception.",
    serverErrorId: 'asdf',
    errorString  : error
  });
});

app.listen(1221, () => console.log('server ready at localhost:1221'));
