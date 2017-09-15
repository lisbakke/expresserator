const express                           = require('express');
const {decorate}                        = require('core-decorators');
const uuid                              = require('uuid');
const ExpressDecorators                 = require('./express-decorators');
const {Root, Path, GetParam, PostParam} = ExpressDecorators;
const compression                       = require('compression');
const bodyParser                        = require('body-parser');

const app                   = express();
ExpressDecorators.app       = app;
ExpressDecorators.errorJson = function(errString) {
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
  @GetParam('foo', {type: 'number', required: true})
  @GetParam('bar', {type: 'number', required: false})
  async helloGet(req, res, next, foo, bar) {
    await timeout(100);
    res.json({greeting: `Hello Get. Foo ${foo} Bar ${bar}`});
  }

  @Path('/hello', 'post')
  @PostParam('foo', {type: 'number', required: true})
  @PostParam('bar', {type: 'number', required: false})
  async helloPost(req, res, next, foo, bar) {
    await timeout(100);
    res.json({greeting: `Hello Post. Foo ${foo} Bar ${bar}`});
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
