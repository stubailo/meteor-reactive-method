# Meteor Reactive Methods

Call methods synchronously inside Tracker.autorun, install with `meteor add simple:reactive-method`

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
    }
});
```