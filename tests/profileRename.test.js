const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

// Setup DOM with required elements before loading script
const dom = new JSDOM('<!doctype html><html><body>\n'
  + '<input id="profileModalName">\n'
  + '<div id="profileModal"></div>\n'
  + '<select id="profiles"></select>\n'
  + '<a id="profileModalUpdate"></a>\n'
  + '</body></html>');
const { window } = dom;
global.window = window;
global.document = window.document;

const $ = require('jquery');
global.$ = global.jQuery = $;

// stub bootstrap modal
$.fn.modal = () => {};

let store = { current: 'Default Profile' };
store['profiles'] = {
  'Default Profile': { checklistData: {} },
  'Existing': { checklistData: {} }
};

$.jStorage = {
  get: () => store,
  set: (_key, val) => { store = val; }
};

let alertCalled = false;
window.alert = () => { alertCalled = true; };

require('../js/main.js');

QUnit.module('profile rename');

QUnit.test('alert when renaming to existing profile', assert => {
  $('#profileModalName').val('Existing');
  $('#profileModalUpdate').trigger('click');
  assert.ok(alertCalled, 'alert shown');
  assert.strictEqual(store.current, 'Default Profile', 'current profile unchanged');
  assert.ok(store.profiles['Default Profile'], 'original profile kept');
  assert.ok(store.profiles['Existing'], 'existing profile kept');
});
