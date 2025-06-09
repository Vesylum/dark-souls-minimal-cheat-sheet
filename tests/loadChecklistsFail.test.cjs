const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let alertCalled;

QUnit.module('loadChecklists failure', hooks => {
  hooks.beforeEach(async () => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<div id="checklists"></div>' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery')(window);
    global.$ = global.jQuery = window.$ = $;

    $.getJSON = () => ({
      fail: cb => { setTimeout(cb, 0); }
    });

    alertCalled = false;
    global.alert = globalThis.alert = () => { alertCalled = true; };
    alert = global.alert;

    await import('../js/main.js');
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.$;
    delete global.jQuery;
    delete window.$;
    delete global.alert;
    delete globalThis.alert;
    delete global.window;
    delete global.document;
  });

  QUnit.test('shows error and alerts user on JSON fail', assert => {
    assert.ok(alertCalled, 'alert shown');
    const html = document.getElementById('checklists').innerHTML.trim();
    assert.strictEqual(html, '<p class="text-danger">Failed to load checklist data</p>');
  });
});
