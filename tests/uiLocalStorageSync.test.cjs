const { JSDOM } = require('jsdom');
const { fireEvent } = require('@testing-library/dom');
const QUnit = require('qunit');
const fs = require('fs');
const path = require('path');

let $;
let store = {};

function teardownDom() {
  delete global.$;
  delete global.jQuery;
  if (global.window) {
    delete global.window.$;
  }
  delete global.window;
  delete global.document;
}

async function setupDom() {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost' });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  window.profilesKey = 'profiles';

  delete require.cache[require.resolve('jquery')];
  $ = require('jquery')(window);
  global.$ = global.jQuery = window.$ = $;

  $.getJSON = (url, cb) => {
    if (url.includes('checklists')) {
      setTimeout(() => cb([
        { id: 'section1', title: 'Section 1', items: [
          { id: 'foo_1_1', content: 'Item 1' },
          { id: 'foo_1_2', content: 'Item 2' }
        ] }
      ]), 0);
    } else {
      setTimeout(() => cb([]), 0);
    }
    return { fail: () => {} };
  };

  const mockLocalStorage = {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: key => { delete store[key]; },
    clear: () => { store = {}; }
  };
  Object.defineProperty(window, 'localStorage', { value: mockLocalStorage, configurable: true });

  await import('../js/main.js');
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return new Promise(r => setTimeout(r, 50));
}

QUnit.module('ui localStorage sync');

QUnit.test('checkbox states persist via localStorage', async assert => {
  await setupDom();
  const cb1 = document.getElementById('foo_1_1');
  const cb2 = document.getElementById('foo_1_2');
  assert.ok(cb1 && cb2, 'checkboxes exist');

  fireEvent.click(cb1);
  fireEvent.click(cb2);

  let profiles = JSON.parse(window.localStorage.getItem('profiles'));
  assert.ok(profiles.profiles['Default Profile'].checklistData['foo_1_1'], 'first stored');
  assert.ok(profiles.profiles['Default Profile'].checklistData['foo_1_2'], 'second stored');

  teardownDom();
  await setupDom();

  assert.ok(document.getElementById('foo_1_1').checked, 'first restored');
  assert.ok(document.getElementById('foo_1_2').checked, 'second restored');

  teardownDom();
});
