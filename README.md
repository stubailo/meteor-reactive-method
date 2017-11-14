# Meteor Reactive Methods

> Call methods synchronously inside Tracker.autorun.

---------------

**Deprecated: Please fork this package if you would like to continue to work on it, and I'd happily link to it!**

---------------

Install with `meteor add simple:reactive-method`

Sometimes, you want to call a [Meteor method](http://docs.meteor.com/#/full/meteor_call) inside of a template helper or Tracker.autorun computation, and get a return value. Now you can!

### Before (doesn't work)

```js
Template.foo.helpers({
   methodResult: function () {
       Meteor.call("myMethod", "a", "b", function (err, result) {
           return result; // this doesn't work!!!
       });
   } 
});
```

### After (works!)

```js
Template.foo.helpers({
    methodResult: function () {
        // Super fun!
        return ReactiveMethod.call("myMethod", "a", "b");
        
        // Can also use 'apply' style
        // return ReactiveMethod.apply("myMethod", ["a", "b"]);
    }
});
```

### Method results are updated every time their arguments change

Be careful! If you pass something like `Random.id()` or `new Date()` as one of the arguments, you will cause an infinite loop where the method is called infinitely over and over. If you don't want your method call to re-run on every argument change, try this other package: https://atmospherejs.com/mnmtanish/call

### Invalidating method calls

Sometimes, you want to force a reactive method to get a new value from the server, even though the arguments are the same. In that case, use `ReactiveMethod.invalidateCall` or `ReactiveMethod.invalidateApply`, like so:

```js
// Will cause the helper above to rerun
ReactiveMethod.invalidateCall("myMethod", "a", "b");
```
