const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;

QUnit.module('defaultProfiles clone', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<input type="checkbox" id="foo_1_1">' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery')(window);
    global.$ = global.jQuery = window.$ = $;

    $.getJSON = (_url, cb) => { setTimeout(() => cb({}), 0); };

    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.$;
    delete global.jQuery;
    delete window.$;
    delete global.window;
    delete global.document;
  });

  QUnit.test('resetProgress should clear stored checklist data', assert => {
    const checkbox = document.getElementById('foo_1_1');
    $(checkbox).prop('checked', true).trigger('change');

    let store = JSON.parse(window.localStorage.getItem('profiles'));
    assert.ok(store.profiles['Default Profile'].checklistData['foo_1_1'], 'progress saved');

    window.resetProgress();

    store = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(store.profiles['Default Profile'].checklistData, {}, 'checklist cleared');
  });
});
