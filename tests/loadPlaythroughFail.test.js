const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let alertCalled;

QUnit.module('loadPlaythrough failure', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<div id="playthrough_sections"></div>' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    $.getJSON = () => ({
      fail: cb => { setTimeout(cb, 0); }
    });

    alertCalled = false;
    global.alert = () => { alertCalled = true; };
    alert = global.alert;

    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.$;
  });

  QUnit.test('shows error and alerts user on JSON fail', assert => {
    assert.ok(alertCalled, 'alert shown');
    const html = document.getElementById('playthrough_sections').innerHTML.trim();
    assert.strictEqual(html, '<p class="text-danger">Failed to load playthrough data</p>');
  });
});
