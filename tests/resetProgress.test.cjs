const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let deleted;

QUnit.module('resetProgress', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>'
      + '<button id="progressReset"></button>'
      + '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    $.getJSON = (_url, cb) => { setTimeout(() => cb({}), 0); };

    deleted = false;
    const initialStore = {
      current: 'Default Profile',
      profiles: {
        'Default Profile': {
          checklistData: { 'foo_1_1': true }
        }
      }
    };
    const ls = window.localStorage;
    const origRemove = ls.__proto__.removeItem;
    ls.__proto__.removeItem = function(key) { deleted = true; origRemove.call(this, key); };
    ls.setItem('profiles', JSON.stringify(initialStore));

    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.$;
  });

QUnit.test('clears progress and totals', assert => {
  const html = `
    <span id="foo_overall_total"></span>
    <span id="foo_totals_1"></span>
    <span id="foo_nav_totals_1"></span>
    <input type="checkbox" id="foo_1_1" checked>
  `;
  document.body.innerHTML = html;

  window.calculateTotals();
  assert.strictEqual(document.getElementById('foo_overall_total').textContent, '[DONE]');
  assert.ok(document.getElementById('foo_1_1').checked);

  window.resetProgress();
  assert.ok(deleted, 'storage cleared');
  assert.strictEqual(document.getElementById('foo_1_1').checked, false);
  assert.strictEqual(document.getElementById('foo_overall_total').textContent, '[0/1]');
});

QUnit.test('click handler confirms before resetting', assert => {
  const button = $('#progressReset');
  let confirmCalls = 0;
  window.confirm = global.confirm = () => { confirmCalls++; return false; };

  button.trigger('click');

  let store = JSON.parse(window.localStorage.getItem('profiles'));
  assert.strictEqual(confirmCalls, 1, 'confirm called');
  assert.ok(store.profiles['Default Profile'].checklistData['foo_1_1'], 'progress kept when cancelled');

  window.confirm = global.confirm = () => true;
  button.trigger('click');
  store = JSON.parse(window.localStorage.getItem('profiles'));
  assert.deepEqual(store.profiles['Default Profile'].checklistData, {}, 'progress cleared after confirmation');
});

});
