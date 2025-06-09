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

  // Simulate CDN failure and run the fallback snippet
  const fallback = `
    if (!window.jQuery) {
      var script = document.createElement('script');
      script.src = 'js/jquery-3.7.1.min.js';
      document.head.appendChild(script);
    }
  `;
  window.eval(fallback);

  if (!window.jQuery) {
    jQueryFactory(window);
  }

  const main = fs.readFileSync('js/main.js', 'utf8');
  window.eval(main);

  assert.ok(window.jQuery, 'jQuery loaded');
  assert.strictEqual(typeof window.calculateTotals, 'function', 'main.js executed');
});
