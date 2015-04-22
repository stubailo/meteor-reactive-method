if (Meteor.isServer) {
  Meteor.methods({
    joinStrings: function (a, b) {
      return a + ", " + b;
    }
  });
} else {
  testAsyncMulti("throws error outside of autorun", [
    function (test) {
      var error;
      try {
        ReactiveMethod.call("joinStrings", "a", "b");
      } catch (e) {
        error = e;
      }

      test.equal(error.message, "Don't use ReactiveMethod.call outside of a Tracker computation.");
    },
    function (test) {
      var error;
      try {
        ReactiveMethod.apply("joinStrings", "a", "b");
      } catch (e) {
        error = e;
      }

      test.equal(error.message, "Don't use ReactiveMethod.apply outside of a Tracker computation.");
    }
  ]);

  testAsyncMulti("returns correct value", [
    function (test, expect) {
      var checkedResult = expect();

      Tracker.autorun(function (computation) {
        var result = ReactiveMethod.call("joinStrings", "a", "b");

        if (! computation.firstRun) {
          test.equal(result, "a, b");

          setTimeout(function () {
            computation.stop();
            checkedResult();
          }, 0);
        }
      });
    },
    function (test, expect) {
      var checkedResult = expect();

      Tracker.autorun(function (computation) {
        var result = ReactiveMethod.apply("joinStrings", ["a", "b"]);

        if (! computation.firstRun) {
          test.equal(result, "a, b");

          setTimeout(function () {
            computation.stop();
            checkedResult();
          }, 0);
        }
      });
    }
  ]);

  testAsyncMulti("avoid extra reruns", [
    function (test, expect) {
      var done = expect();
      var runs = 0;
      var argVar = new ReactiveVar(1);

      Tracker.autorun(function () {
        // just to trigger recomputation
        argVar.get();
        ReactiveMethod.call("joinStrings", "a", "b");
        runs++;
      });

      setTimeout(function () {
        argVar.set(2);
      }, 200);

      setTimeout(function () {
        argVar.set(3);
      }, 400);

      setTimeout(function () {
        ReactiveMethod.invalidateCall("joinStrings", "a", "b");
      }, 600);

      setTimeout(function () {
        // I can't think any way to check how many reruns happen without
        // setting a strict timeout
        
        // Here is why there are 6 runs:
        // 1. The initial run
        // 2. The method result comes back
        // 3. argVar is set to 2
        // 4. argVar is set to 3
        // 5. Method result is reset by invalidateCall
        // 6. New method result comes back
        
        // There should not be more than 4 runs; if there are then it means
        // the method call is returning more than once, which means something
        // about result caching broke
        test.equal(runs, 6);
        done();
      }, 1000);
    }
  ]);
}