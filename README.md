# ReactiveMethod

> Call Meteor.methods in an apparently synchronous style inside Reactive contexts such as helpers and Tracker.autorun

Install with `meteor add deanius:reactive-method`

Sometimes, you want to call a [Meteor method](http://docs.meteor.com/#/full/meteor_call) inside of a template helper or Tracker.autorun computation, and work with its return value without passing a callback. That's what this enables.

## How it works

### Single Meteor.call in a helper

```js
Template.foo.helpers({
  lastViewed: function () {
    return ReactiveMethod.call("lastViewed", new Date());
  }
});
```

### Chain results of Meteor.call into each other

```js
/*
  The autorun below will execute 3 times.
  1. Kick off the first method call, and result1 will be undefined, so our work is done.
  2. The first call returns, causing the autorun to execute again.
     This time result1 has a value (hopefully truthy),
     and we kick off the second call.
  3. Run one last time when the 2nd method call returns
     This time result1 and result2 have values.
*/
Tracker.autorun(function(){
  var result1 = ReactiveMethod.call("getThing1", "x", "y");
  if (!result1) return;

  var result2 = ReactiveMethod.call("modifyThing", result1);
  if (!result2) return;

})
```
## Caveats

* ReactiveMethod does not currently support calling the same server-side method more than once in a single autorun function.

* When chaining using the above pattern, server methods must return truthy values.

> This is because we reunite the result with the function by keying off two things-
the ID asssigned to the autorun function by Meteor, and the name of the method.
We can't count on function arguments, since these may be different across

* Similarly, it would be *very bad* to write a function which called a different
server method every time the autorun was executed!

* Be aware of the multiple invocations, and try to avoid side-effects in the `autorun` functions

Alternate implementations would be considered via PR or Issue!
