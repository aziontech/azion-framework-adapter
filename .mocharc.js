'use strict';

module.exports = {
    'exit': true,
    timeouts: false,
    recursive: false,
    reporter: 'mochawesome',
    'reporter-option': ['reportDir=test-results'],
    require: 'source-map-support/register'
    // spec: ['test/out/**/*.test.js']
};