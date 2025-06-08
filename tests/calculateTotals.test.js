const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

// Setup DOM
const dom = new JSDOM('<!doctype html><html><body></body></html>');
const { window } = dom;
global.window = window;
global.document = window.document;
// jQuery setup
const $ = require('jquery');
window.$ = window.jQuery = $;
global.$ = global.jQuery = $;

// Stub jStorage used by main.js
$.jStorage = {
  get: (_key, def) => def,
  set: () => {}
};

// Load script which attaches calculateTotals to window
require('../js/main.js');

QUnit.module('calculateTotals');

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
