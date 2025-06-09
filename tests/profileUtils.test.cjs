const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;

async function setup(store) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' });
  const { window } = dom;
  global.window = window;
  global.document = window.document;

  delete require.cache[require.resolve('jquery')];
  $ = require('jquery')(window);
  global.$ = global.jQuery = window.$ = $;

  $.getJSON = (_url, cb) => { setTimeout(() => cb({}), 0); };

  window.localStorage.setItem('profiles', JSON.stringify(store));

  delete require.cache[require.resolve('../js/main.js')];
  require('../js/main.js');
    document.dispatchEvent(new window.Event('DOMContentLoaded'));
  await new Promise(r => setTimeout(r, 50));
}

function teardown() {
  delete global.$;
  delete global.jQuery;
  delete window.$;
  delete global.window;
  delete global.document;
}

QUnit.module('profile util functions');

QUnit.test('canDelete returns false with one profile', async assert => {
  const store = {
    current: 'Only',
    profiles: {
      'Only': { checklistData: {} }
    }
  };
  await setup(store);
  assert.notOk(window.canDelete(), 'should not allow delete with one profile');
  teardown();
});

QUnit.test('canDelete returns true with multiple profiles', async assert => {
  const store = {
    current: 'Profile1',
    profiles: {
      'Profile1': { checklistData: {} },
      'Profile2': { checklistData: {} }
    }
  };
  await setup(store);
  assert.ok(window.canDelete(), 'allows delete with multiple profiles');
  teardown();
});

QUnit.test('getFirstProfile returns the first profile name', async assert => {
  const store = {
    current: 'B',
    profiles: {
      'A': { checklistData: {} },
      'B': { checklistData: {} },
      'C': { checklistData: {} }
    }
  };
  await setup(store);
  assert.strictEqual(window.getFirstProfile(), 'A');
  teardown();
});
