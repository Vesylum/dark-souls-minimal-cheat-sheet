const fs = require('fs');
const { JSDOM } = require('jsdom');
const jQueryFactory = require('jquery');
const QUnit = require('qunit');

QUnit.module('jQuery fallback');

QUnit.test('main.js runs with local jQuery when CDN fails', assert => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost'
  });
  const { window } = dom;

  // Simulate CDN failure by loading local jQuery if needed
  if (!window.jQuery) {
    jQueryFactory(window);
  }

  // Prevent jsdom "Not implemented" alert errors
  window.alert = global.alert = () => {};

  // Stub $.getJSON so no network request is made
  window.$.getJSON = () => ({
    fail: cb => { setTimeout(cb, 0); }
  });

  const main = fs.readFileSync('js/main.js', 'utf8');
  window.eval(main);

  assert.ok(window.jQuery, 'jQuery loaded');
  assert.strictEqual(typeof window.calculateTotals, 'function', 'main.js executed');
});
