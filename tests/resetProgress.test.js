const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

const dom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = dom;
global.window = window;
global.document = window.document;

const $ = require('jquery')(window);
global.$ = global.jQuery = $;

let flushed = false;
$.jStorage = {
  get: (_key, def) => ({
    current: 'Default Profile',
    profiles: {
      'Default Profile': {
        checklistData: { 'foo_1_1': true }
      }
    }
  }),
  set: () => {},
  flush: () => { flushed = true; }
};

require('../js/main.js');

QUnit.module('resetProgress');

QUnit.test('clears progress and totals', assert => {
  const html = `
    <span id="foo_overall_total"></span>
    <span id="foo_totals_1"></span>
    <span id="foo_nav_totals_1"></span>
    <input type="checkbox" id="foo_1_1" checked>
  `;
  document.body.innerHTML = html;

  window.calculateTotals();
  assert.strictEqual(document.getElementById('foo_overall_total').textContent, '[1/1]');
  assert.ok(document.getElementById('foo_1_1').checked);

  window.resetProgress();
  assert.ok(flushed, 'storage flushed');
  assert.strictEqual(document.getElementById('foo_1_1').checked, false);
  assert.strictEqual(document.getElementById('foo_overall_total').textContent, '[0/1]');
});
