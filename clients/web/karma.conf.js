// Karma configuration — merged with Angular CLI defaults via karmaConfig.
// https://angular.dev/guide/testing/code-coverage

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {},
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/web'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'lcovonly', subdir: '.', file: 'lcov.info' },
      ],
      // Ratchet toward NFR-003 80%; baseline Sprint 12 (2026-06-16).
      check: {
        global: {
          statements: 58,
          branches: 41,
          functions: 51,
          lines: 58,
        },
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
  });
};
