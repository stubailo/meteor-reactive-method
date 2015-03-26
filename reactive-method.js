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
    var invocationId = EJSON.stringify({
      ccid: cc._id,
      methodName: args[0]
    }, {canonical: true});

    cc._reactiveMethodData = cc._reactiveMethodData || {};
    cc._reactiveMethodStale = cc._reactiveMethodStale || {};

    //If we find this invocation has completed and a result
    if (cc._reactiveMethodData && cc._reactiveMethodData[invocationId]) {
      //mark as used
      delete cc._reactiveMethodStale[invocationId];
      return cc._reactiveMethodData[invocationId];
    }

    Meteor.apply(args[0], args[1], function (err, result) {
      cc._reactiveMethodData[invocationId] = result;
      cc.invalidate();
    });

    if (Tracker.active) {
      // Copied logic from meteor/meteor/packages/ddp/livedata_connection.js
      Tracker.onInvalidate(function () {
        // Make sure this is used
        cc._reactiveMethodStale[invocationId] = true;

        Tracker.afterFlush(function () {
          if (cc._reactiveMethodStale[invocationId]) {
            delete cc._reactiveMethodData[invocationId];
            delete cc._reactiveMethodStale[invocationId];
          }
        });
      });
    }
  }
};
