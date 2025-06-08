const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let store1;
let store2;

QUnit.module('export/import progress', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<div id="playthrough_sections"></div>' +
      '<ul id="playthrough_nav"></ul>' +
      '<select id="profiles"></select>' +
      '<input type="checkbox" id="foo_1_1">' +
      '<input type="checkbox" id="foo_1_2">' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    $.getJSON = (_url, cb) => { cb({}); };

    store1 = { current: 'Profile1' };
    store1['profiles'] = {
      'Profile1': { checklistData: { 'foo_1_1': true, 'foo_1_2': false } }
    };
    store2 = { current: 'Profile2' };
    store2['profiles'] = {
      'Profile2': { checklistData: { 'foo_1_1': false, 'foo_1_2': true } }
    };

    window.localStorage.setItem('profiles', JSON.stringify(store1));

    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.$;
  });

  QUnit.test('serializeProfiles returns stored JSON', assert => {
    const json = window.serializeProfiles();
    assert.strictEqual(json, JSON.stringify(store1));
  });

  QUnit.test('restoreProfiles updates store and UI', assert => {
    assert.notOk(document.getElementById('foo_1_2').checked, 'initial state');
    const ok = window.restoreProfiles(JSON.stringify(store2));
    assert.ok(ok, 'restore success');

    const saved = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(saved, store2, 'localStorage updated');
    assert.strictEqual(document.getElementById('profiles').value, 'Profile2', 'profile select updated');
    assert.ok(document.getElementById('foo_1_2').checked, 'checkbox updated');
    assert.notOk(document.getElementById('foo_1_1').checked, 'checkbox updated');
  });
});
