const { JSDOM } = require('jsdom');
const QUnit = require('qunit');
const fs = require('fs');
const path = require('path');

function teardownDom(dom) {
  delete global.$;
  delete global.jQuery;
  if (global.window) {
    delete global.window.$;
  }
  delete global.window;
  delete global.document;
  delete global.alert;
  delete globalThis.alert;
  if (dom) {
    dom.window.close();
  }
}

async function setupDom() {
  const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost' });
  const { window } = dom;
  global.window = window;
  global.document = window.document;
  window.profilesKey = 'profiles';
  global.alert = globalThis.alert = () => {};
  alert = global.alert;

  delete require.cache[require.resolve('jquery')];
  const $ = require('jquery')(window);
  global.$ = global.jQuery = window.$ = $;

  $.getJSON = (url, cb) => {
    if (url.includes('playthrough')) {
      setTimeout(
        () =>
          cb([
            { id: 'section1', title: 'Section 1', items: [{ id: 'foo_1_1', content: 'Item' }] }
          ]),
        0
      );
    } else if (url.includes('checklists')) {
      setTimeout(() => cb([]), 0);
    } else {
      setTimeout(() => cb([]), 0);
    }
    return { fail: () => {} };
  };

  await import('../js/main.js');
  document.dispatchEvent(new window.Event('DOMContentLoaded'));
  return dom;
}

QUnit.module('index.html integration', hooks => {
  let dom;
  hooks.beforeEach(async () => {
    dom = await setupDom();
    return new Promise(r => setTimeout(r, 50));
  });

  hooks.afterEach(() => {
    teardownDom(dom);
  });

  QUnit.test('renders playthrough via index.html template', assert => {
    const li = document.querySelector('li[data-id="foo_1_1"]');
    assert.ok(li, 'list item rendered');
    const nav = document.querySelector('#playthrough_nav li a');
    assert.ok(nav && nav.textContent.includes('Section 1'), 'nav rendered');
  });
});
