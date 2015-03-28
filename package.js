Package.describe({
  name: 'simple:reactive-method',
  version: '1.0.1',
  // Brief, one-line summary of the package.
  summary: 'Call methods synchronously inside Tracker.autorun',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/stubailo/meteor-reactive-method',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.use(["tracker", "meteor", "ddp", "ejson"]);

  api.addFiles('reactive-method.js');

  api.export("ReactiveMethod");
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use(['simple:reactive-method', 'test-helpers', 'reactive-var']);
  api.addFiles('reactive-method-tests.js');
});
