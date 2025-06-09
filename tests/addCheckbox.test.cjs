const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;

QUnit.module('addCheckbox', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<div id="playthrough_sections"></div>' +
      '<ul id="playthrough_nav"></ul>' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = window.$ = $;

    $.getJSON = (_url, cb) => {
      setTimeout(() => cb([
        {
          id: 'section1',
          title: 'Section 1',
          items: [
            {
              id: 'foo_1_1',
              content: 'Item 1',
              children: [ { id: 'foo_1_1_1', content: 'Child' } ]
            }
          ]
        }
      ]), 0);
    };

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
  QUnit.test('checkbox and label inserted correctly', assert => {
    const li = document.querySelector('li[data-id="foo_1_1"]');
    assert.ok(li, 'li exists');
    const label = li.firstElementChild;
    assert.strictEqual(label.tagName, 'LABEL');
    assert.strictEqual(label.className, 'checkbox');
    const input = label.firstElementChild;
    assert.strictEqual(input.tagName, 'INPUT');
    assert.strictEqual(input.type, 'checkbox');
    assert.strictEqual(input.id, 'foo_1_1');
    assert.ok(label.textContent.includes('Item 1'));

    const childUl = li.querySelector('ul');
    assert.ok(childUl, 'child ul exists');
    assert.strictEqual(childUl.parentElement, li, 'child ul not inside label');
  });

  QUnit.test('accessibility attributes are added', assert => {
    const label = document.querySelector('li[data-id="foo_1_1"] > label');
    const input = label.firstElementChild;
    assert.strictEqual(label.htmlFor, 'foo_1_1', 'label htmlFor set');
    assert.strictEqual(input.getAttribute('aria-label'), 'Item 1', 'aria-label set');
  });

  QUnit.test('clicking dynamically created checkbox updates profiles', assert => {
    const checkbox = document.getElementById('foo_1_1');
    assert.ok(checkbox, 'checkbox exists');
    $(checkbox).prop('checked', true).trigger('change');
    const store = JSON.parse(window.localStorage.getItem('profiles'));
    assert.ok(store.profiles['Default Profile'].checklistData['foo_1_1'], 'profile updated');
  });
});
