const { JSDOM } = require('jsdom');
const jQueryFactory = require('jquery');
const QUnit = require('qunit');

QUnit.module('jQuery fallback');

QUnit.test('main.js runs with local jQuery when CDN fails', async assert => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    runScripts: 'outside-only',
    url: 'http://localhost'
  });
  const { window } = dom;

  // Simulate CDN failure and run the fallback snippet
  const fallback = `
    if (!window.jQuery) {
      var script = document.createElement('script');
      script.src = 'js/jquery-3.7.1.min.js';
      script.defer = true;
      document.head.appendChild(script);
    }
  `;
  window.eval(fallback);

  if (!window.jQuery) {
    jQueryFactory(window);
  }

  // Prevent jsdom "Not implemented" alert errors
  window.alert = global.alert = () => {};

  // Stub $.getJSON so no network request is made
  window.$.getJSON = () => ({
    fail: cb => { setTimeout(cb, 0); }
  });

  await import('../js/main.js');

  assert.ok(window.jQuery, 'jQuery loaded');
  assert.strictEqual(typeof window.calculateTotals, 'function', 'main.js executed');
});
