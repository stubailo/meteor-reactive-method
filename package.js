Package.describe({
  name: 'deanius:reactive-method',
  version: '1.1.3',
  summary: 'Deprecated. See okgrow:promise instead',
  git: 'https://github.com/deanius/meteor-reactive-method',
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
  api.use(["tracker", "meteor", "ddp", "ejson"]);
  api.imply('okgrow:promise@0.9.0');
});
