const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let store;

QUnit.module('populate functions', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>\n'
      + '<select id="profiles"></select>\n'
      + '<input type="checkbox" id="foo_1_1">\n'
      + '<input type="checkbox" id="foo_1_2">\n'
      + '</body></html>');
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));

    store = {
      current: 'Profile B'
    };
    store['profiles'] = {
      'Profile A': { checklistData: { 'foo_1_1': true, 'foo_1_2': false } },
      'Profile B': { checklistData: { 'foo_1_1': false, 'foo_1_2': true } }
    };

    $.jStorage = {
      get: () => store,
      set: (_key, val) => { store = val; }
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

  QUnit.test('populateProfiles fills select with profiles', assert => {
    window.populateProfiles();
    const options = Array.from(document.querySelectorAll('#profiles option'))
      .map(o => o.value);
    assert.deepEqual(options.sort(), ['Profile A', 'Profile B']);
    assert.strictEqual(document.getElementById('profiles').value, 'Profile B');
  });

  QUnit.test('populateChecklists sets checkbox states', assert => {
    window.populateChecklists();
    assert.notOk(document.getElementById('foo_1_1').checked);
    assert.ok(document.getElementById('foo_1_2').checked);

    // switch profiles via change handler
    document.getElementById('profiles').value = 'Profile A';
    $('#profiles').trigger('change');

    assert.ok(document.getElementById('foo_1_1').checked);
    assert.notOk(document.getElementById('foo_1_2').checked);
  });
});
