const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;

QUnit.module('filterItems', hooks => {
  hooks.beforeEach(async () => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<ul id="list">' +
        '<li data-id="p">Parent<ul>' +
          '<li data-id="c1">Alpha</li>' +
          '<li data-id="c2">Beta</li>' +
        '</ul></li>' +
      '</ul>' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = window.$ = $;

    $.getJSON = (_url, cb) => { setTimeout(() => cb({}), 0); };

    await import('../js/main.js');
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

  QUnit.test('li remains visible when descendant matches', assert => {
    window.filterItems('Alpha', '#list');
    const parent = document.querySelector('li[data-id="p"]');
    const child1 = document.querySelector('li[data-id="c1"]');
    const child2 = document.querySelector('li[data-id="c2"]');
    assert.strictEqual(parent.style.display, '', 'parent visible');
    assert.strictEqual(child1.style.display, '', 'matching child visible');
    assert.strictEqual(child2.style.display, 'none', 'non matching child hidden');
  });
});
