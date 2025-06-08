const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;

QUnit.module('calculateTotals', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));


    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.$;
  });

QUnit.test('updates totals based on checkbox states', assert => {
  const html = `
    <span id="foo_overall_total"></span>
    <span id="foo_totals_1"></span>
    <span id="foo_nav_totals_1"></span>
    <input type="checkbox" id="foo_1_1" checked>
    <input type="checkbox" id="foo_1_2">
  `;
  document.body.innerHTML = html;

  window.calculateTotals();
  assert.strictEqual(document.getElementById('foo_totals_1').textContent, '[1/2]');
  assert.strictEqual(document.getElementById('foo_nav_totals_1').textContent, '[1/2]');
  assert.strictEqual(document.getElementById('foo_overall_total').textContent, '[1/2]');

  document.getElementById('foo_1_2').checked = true;
  window.calculateTotals();
  assert.strictEqual(document.getElementById('foo_totals_1').textContent, '[DONE]');
  assert.strictEqual(document.getElementById('foo_nav_totals_1').textContent, '[DONE]');
  assert.strictEqual(document.getElementById('foo_overall_total').textContent, '[DONE]');
});

});
