const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;

QUnit.module('loadPlaythrough', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<div id="playthrough_sections"></div>' +
      '<ul id="playthrough_nav"></ul>' +
      '<div id="checklists"></div>' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    $.getJSON = (url, cb) => {
      if (url.includes('playthrough')) {
        setTimeout(() => cb([
          {
            id: 'section1',
            title: 'Section 1',
            items: [ { id: 'foo_1_1', content: 'Item 1' } ]
          }
        ]), 0);
      } else {
        setTimeout(() => cb([]), 0);
      }
    };

    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.$;
  });

  QUnit.test('renders playthrough from JSON', assert => {
    const li = document.querySelector('li[data-id="foo_1_1"]');
    assert.ok(li, 'list item rendered');
    const nav = document.querySelector('#playthrough_nav li a');
    assert.ok(nav && nav.textContent.includes('Section 1'), 'nav rendered');
  });
});
