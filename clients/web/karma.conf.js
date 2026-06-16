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
      // Ratchet toward NFR-003 80%; baseline Sprint 13 (2026-06-16).
      check: {
        global: {
          statements: 78,
          branches: 80,
          functions: 79,
          lines: 80,
        },
      },
    },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    restartOnFileChange: true,
  });
};
