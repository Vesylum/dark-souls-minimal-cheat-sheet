const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let store;
let alertCalled;

QUnit.module('profile rename', hooks => {
  hooks.beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><body>\n'
      + '<input id="profileModalName">\n'
      + '<div id="profileModal"></div>\n'
      + '<select id="profiles"></select>\n'
      + '<a id="profileModalUpdate"></a>\n'
      + '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery');
    global.$ = global.jQuery = $;
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
    $.getJSON = (_url, cb) => { setTimeout(() => cb({}), 0); };
    $.fn.modal = () => {};

    store = { current: 'Default Profile' };
    store['profiles'] = {
      'Default Profile': { checklistData: {} },
      'Existing': { checklistData: {} }
    };

    window.localStorage.setItem('profiles', JSON.stringify(store));

    alertCalled = false;
    global.alert = () => { alertCalled = true; };
    alert = global.alert; // expose as global variable for strict mode

    delete require.cache[require.resolve('../js/main.js')];
    require('../js/main.js');
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.$;
  });

QUnit.test('alert when renaming to existing profile', assert => {
  $('#profileModalName').val('Existing');
  $('#profileModalUpdate').trigger('click');
  assert.ok(alertCalled, 'alert shown');
  store = JSON.parse(window.localStorage.getItem('profiles'));
  assert.strictEqual(store.current, 'Default Profile', 'current profile unchanged');
  assert.ok(store.profiles['Default Profile'], 'original profile kept');
  assert.ok(store.profiles['Existing'], 'existing profile kept');
});

});
