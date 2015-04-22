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

      Tracker.autorun(function (computation) {
        var result = ReactiveMethod.call("joinStrings", "a", "b");

        if (runs === 0) {
          test.equal(result, undefined);
        } else if (runs === 1) {
          test.equal(result, "a, b");
          computation.invalidate();
        } else if (runs === 2) {
          test.equal(result, "a, b");
          computation.invalidate();
        } else if (runs === 3) {
          test.equal(result, "a, b");
          ReactiveMethod.invalidateCall("joinStrings", "a", "b");
        } else if (runs === 4) {
          test.equal(result, undefined);
        } else if (runs === 5) {
          test.equal(result, "a, b");

          Meteor.call("joinStrings", "a", "b", function () {
            computation.stop();
            
            Tracker.flush();

            Meteor.defer(function () {
              console.log(ReactiveMethod._computations);
              test.equal(ReactiveMethod._computations, {});
              done();
            });
          });
        } else {
          test.fail();
        }

        runs++;
      });
    }
  ]);
}