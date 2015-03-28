// Write your package code here!

ReactiveMethod = {
  call: function (/* arguments */) {
    if (! Tracker.currentComputation) {
      // If not in an autorun, throw error
      throw new Error("Don't use ReactiveMethod.call outside of a Tracker computation.");
    }

    var args = _.toArray(arguments);

    return ReactiveMethod.apply(_.first(args), _.rest(args));
  },
  apply: function (/* arguments */) {
    var cc = Tracker.currentComputation;

    if (! cc) {
      // If not in an autorun, throw error
      throw new Error("Don't use ReactiveMethod.apply outside of a Tracker computation.");
    }

    var args = _.toArray(arguments);
    var serializedArgs = EJSON.stringify(args);

    cc._reactiveMethodData = cc._reactiveMethodData || {};
    cc._reactiveMethodStale = cc._reactiveMethodStale || {};

    if (cc._reactiveMethodData && _.has(cc._reactiveMethodData, serializedArgs)) {
      // We are calling the method again with the same arguments, return the
      // previous result
      
      // Mark this result as used
      delete cc._reactiveMethodStale[serializedArgs];

      return cc._reactiveMethodData[serializedArgs];
    }

    Meteor.apply(args[0], args[1], function (err, result) {
      cc._reactiveMethodData[serializedArgs] = result;
      cc.invalidate();
    });

    if (Tracker.active) {
      // Copied logic from meteor/meteor/packages/ddp/livedata_connection.js
      Tracker.onInvalidate(function () {
        // Make sure this is used
        cc._reactiveMethodStale[serializedArgs] = true;

        Tracker.afterFlush(function () {
          if (cc._reactiveMethodStale[serializedArgs]) {
            delete cc._reactiveMethodData[serializedArgs];
            delete cc._reactiveMethodStale[serializedArgs];
          }
        });
      });
    }
  }
};