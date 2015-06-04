ReactiveMethod = {
  /**
   * A global object that matches serialized arguments of Method.apply to an
   * array of computations that depend on the result of that method. Used mainly
   * to allow invalidation of method results from outside of the computation
   * using that result.
   * @type {Object}
   */
  _computations: {},

  /**
   * Call a Meteor method. Can only be used inside a Tracker autorun (which
   * includes Blaze helpers). Functions much like a promise - on the first run
   * of the computation returns undefined, and when the method result comes back
   * reruns the computation and returns the actual result. If this method is
   * called in consecutive reruns of the computation with the same arguments, it
   * remembers the previous result, which avoids calling the method over and
   * over again forever.
   *
   * Watch out - if you call this method with a constantly changing value as one
   * of the arguments (for example the current time or a random value) it will
   * never return anything.
   *
   * The API for the arguments is exactly the same as Meteor.call.
   * 
   * @param {String} methodName The name of the method to call
   * @param {EJSONable} [arg1,arg2...] Optional method arguments
   */
  call: function (methodName /*, ...arguments */) {
    if (! Tracker.currentComputation) {
      // If not in an autorun, throw error
      throw new Error("Don't use ReactiveMethod.call outside of a Tracker computation.");
    }

    var args = _.toArray(arguments);
    return ReactiveMethod.apply(methodName, _.rest(args));
  },

  /**
   * Just like ReactiveMethod.call except uses the calling API of Meteor.apply
   * instead of Meteor.call. 
   * @param  {[type]} methodName [description]
   * @param  {[type]} methodArgs [description]
   * @return {[type]}            [description]
   */
  apply: function (methodName, methodArgs) {
    var cc = Tracker.currentComputation;

    if (! cc) {
      // If not in an autorun, throw error
      throw new Error("Don't use ReactiveMethod.apply outside of a Tracker computation.");
    }

    var serializedArgs = EJSON.stringify([methodName, methodArgs]);


    cc._reactiveMethodData = cc._reactiveMethodData || {};
    cc._reactiveMethodStale = cc._reactiveMethodStale || {};

    var methodReturnValue;

    if (cc._reactiveMethodData && _.has(cc._reactiveMethodData, serializedArgs)) {
      // We are calling the method again with the same arguments, return the
      // previous result
      
      // Mark this result as used
      delete cc._reactiveMethodStale[serializedArgs];
      methodReturnValue = cc._reactiveMethodData[serializedArgs];
    } else {
      // Only record the method call if it doesn't match the condition above about
      // being called again with the same arguments
      recordMethodComputation(cc, serializedArgs);

      Meteor.apply(methodName, methodArgs, function (err, result) {
        cc._reactiveMethodData[serializedArgs] = result;
        cc.invalidate();
      });
    }

    // Copied logic from meteor/meteor/packages/ddp/livedata_connection.js
    cc.onInvalidate(function () {
      // Make sure this is used
      cc._reactiveMethodStale[serializedArgs] = true;

      Tracker.afterFlush(function () {
        if (cc._reactiveMethodStale[serializedArgs]) {
          delete cc._reactiveMethodData[serializedArgs];
          delete cc._reactiveMethodStale[serializedArgs];
          deleteMethodComputation(cc, serializedArgs);
        }
      });
    });

    cc.onInvalidate(function () {
      if (cc.stopped) {
        // Delete this computation from global computation store to avoid
        // keeping a reference to every computation ever
        cleanUpComputation(cc);
      }
    });

    return methodReturnValue;
  },

  /**
   * Invalidate all computations that are currently depending on the result
   * of a particular ReactiveMethod.call.
   */
  invalidateCall: function (methodName /*, ...arguments */) {
    var args = _.toArray(arguments);
    ReactiveMethod.invalidateApply(methodName, _.rest(args));
  },

  /**
   * Invalidate all computations that are currently depending on the result of
   * a particular ReactiveMethod.apply.
   */
  invalidateApply: function (methodName, methodArgs) {
    var serializedArgs = EJSON.stringify([methodName, methodArgs]);

    _.each(ReactiveMethod._computations[serializedArgs], function (cc) {
      delete cc._reactiveMethodData[serializedArgs];
      cc._compute();
    });
  }
};

/**
 * Record that a computation is using the result of a method call, to allow
 * invalidation from outside of the computation
 * @param  {String} serializedArgs Arguments to Method.apply, in serialized form
 */
function recordMethodComputation(computation, serializedArgs) {
  // Add computation to the list of computations using these arguments, and
  // create the array if it doesn't exist.
  var initial = ReactiveMethod._computations[serializedArgs] || [];
  ReactiveMethod._computations[serializedArgs] =
    _.union(initial, [computation]);
}

/**
 * Remove the computation from the global dictionary of which computations are
 * watching which method results
 * @param  {Tracker.Computation} computation
 * @param  {String} serializedArgs Arguments to Method.apply, in serialized form
 */
function deleteMethodComputation(computation, serializedArgs) {
  var methodsForArgs = ReactiveMethod._computations[serializedArgs];
  var withoutCC = _.without(methodsForArgs, computation);

  if (withoutCC.length > 0) {
    // Remove computation from the array
    ReactiveMethod._computations[serializedArgs] = withoutCC;
  } else {
    // Delete the array if it is empty to avoid memory leak
    delete ReactiveMethod._computations[serializedArgs];
  }
}

/**
 * Remove all references to the computation from global cache of computations,
 * used to avoid memory leaks from storing stopped computations
 * @param  {Tracker.Computation} computation
 */
function cleanUpComputation(computation) {
  _.each(computation._reactiveMethodData, function (data, serializedArgs) {
    deleteMethodComputation(computation, serializedArgs);
  });
}
