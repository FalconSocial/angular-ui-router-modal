module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai', 'sinon-chai'],
    files: [
      'bower_components/angular/angular.js',
      'bower_components/ui-router/release/angular-ui-router.js',
      'bower_components/ui-router-extras/release/ct-ui-router-extras.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/*.js',
      'test/bind.poly.js',
      'test/*.js'
    ],
    port: 8067,
    logLevel: config.LOG_INFO,
    singleRun: true,
    browsers: [ 'PhantomJS' ]
  });
};
