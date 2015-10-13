Package.describe({
  name: 'deanius:reactive-method',
  version: '1.1.3',
  summary: 'Deprecated. See deanius:promise instead',
  git: 'https://github.com/deanius/meteor-reactive-method',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.2');
  api.use(["tracker", "meteor", "ddp", "ejson"]);
  api.imply('deanius:promise@3.0.1');
});
