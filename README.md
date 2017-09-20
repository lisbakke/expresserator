# Decorators for Express

Decorators for http path (e.g. `/api/foo/bar`), http verb (e.g. `GET`) and defining input parameters.

# Example

```
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
```
