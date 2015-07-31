Package.describe({
  name: 'deanius:reactive-method',
  version: '1.1.2',
  summary: 'Deprecated. See deanius:promise instead',
  git: 'https://github.com/deanius/meteor-reactive-method',
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
  api.use(['deanius:reactive-method', 'test-helpers', 'reactive-var']);
  api.addFiles('reactive-method-tests.js');
});
