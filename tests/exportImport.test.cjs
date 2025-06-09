const { JSDOM } = require('jsdom');
const QUnit = require('qunit');

let $;
let store1;
let store2;

QUnit.module('export/import progress', hooks => {
  hooks.beforeEach(async () => {
    const dom = new JSDOM('<!doctype html><html><body>' +
      '<div id="playthrough_sections"></div>' +
      '<ul id="playthrough_nav"></ul>' +
      '<select id="profiles"></select>' +
      '<input type="checkbox" id="foo_1_1">' +
      '<input type="checkbox" id="foo_1_2">' +
      '<button id="progressExport"></button>' +
      '<a id="progressDownload"></a>' +
      '<button id="progressImport"></button>' +
      '<input id="progressFile" type="file">' +
      '<span id="importError"></span>' +
      '</body></html>', { url: 'http://localhost' });
    const { window } = dom;
    global.window = window;
    global.document = window.document;

    delete require.cache[require.resolve('jquery')];
    $ = require('jquery')(window);
    global.$ = global.jQuery = window.$ = $;

    $.getJSON = (_url, cb) => { setTimeout(() => cb({}), 0); };

    store1 = { current: 'Profile1' };
    store1['profiles'] = {
      'Profile1': { checklistData: { 'foo_1_1': true, 'foo_1_2': false } }
    };
    store2 = { current: 'Profile2' };
    store2['profiles'] = {
      'Profile2': { checklistData: { 'foo_1_1': false, 'foo_1_2': true } }
    };

    window.localStorage.setItem('profiles', JSON.stringify(store1));

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

  QUnit.test('serializeProfiles returns stored JSON', assert => {
    const json = window.serializeProfiles();
    assert.strictEqual(json, JSON.stringify(store1));
  });

  QUnit.test('restoreProfiles updates store and UI', assert => {
    assert.notOk(document.getElementById('foo_1_2').checked, 'initial state');
    const ok = window.restoreProfiles(JSON.stringify(store2));
    assert.ok(ok, 'restore success');

    const saved = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(saved, store2, 'localStorage updated');
    assert.strictEqual(document.getElementById('profiles').value, 'Profile2', 'profile select updated');
    assert.ok(document.getElementById('foo_1_2').checked, 'checkbox updated');
    assert.notOk(document.getElementById('foo_1_1').checked, 'checkbox updated');
  });

  QUnit.test('restoreProfiles rejects invalid current', assert => {
    const invalid = { current: 'Missing', profiles: { 'Profile1': { checklistData: {} } } };
    const before = JSON.parse(window.localStorage.getItem('profiles'));
    const ok = window.restoreProfiles(JSON.stringify(invalid));
    assert.notOk(ok, 'restore failed');
    const after = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(after, before, 'localStorage unchanged');
    assert.strictEqual(document.getElementById('profiles').value, 'Profile1', 'profile select unchanged');
  });

  QUnit.test('restoreProfiles rejects bad JSON and import button shows error', assert => {
    const before = JSON.parse(window.localStorage.getItem('profiles'));
    const ok = window.restoreProfiles('bad json');
    assert.notOk(ok, 'restore failed');
    const after = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(after, before, 'localStorage unchanged');

    class FR {
      readAsText() { this.onload({ target: { result: 'bad json' } }); }
    }
    window.FileReader = FR;

    $('#progressFile').trigger('change', { target: { files: [new Blob()] } });
    assert.strictEqual(document.getElementById('importError').textContent, 'Invalid progress data', 'error shown');
    delete window.FileReader;
  });

  QUnit.test('export generates downloadable blob', async assert => {
    let blobArg;
    const orig = window.URL.createObjectURL;
    window.URL.createObjectURL = b => { blobArg = b; return 'blob:url'; };
    const link = document.getElementById('progressDownload');
    let clicked = false;
    link.click = () => { clicked = true; };

    $('#progressExport').trigger('click');

    assert.ok(clicked, 'download triggered');
    const text = await blobArg.text();
    assert.strictEqual(text, JSON.stringify(store1), 'blob content');
    window.URL.createObjectURL = orig;
  });

  QUnit.test('file import loads progress', assert => {
    class FR {
      readAsText() { this.onload({ target: { result: JSON.stringify(store2) } }); }
    }
    window.FileReader = FR;

    $('#progressFile').trigger('change', { target: { files: [new Blob()] } });

    const saved = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(saved, store2, 'localStorage updated');
    assert.strictEqual(document.getElementById('profiles').value, 'Profile2', 'profile select updated');
    delete window.FileReader;
  });

  QUnit.test('restoreProfiles rejects invalid profile structure', assert => {
    const before = JSON.parse(window.localStorage.getItem('profiles'));

    const invalidProfiles = [
      { current: 'Profile1', profiles: null },
      { current: 'Profile1', profiles: [] },
      { current: 'Profile1', profiles: { 'Profile1': null } },
      { current: 'Profile1', profiles: { 'Profile1': {} } },
      { current: 'Profile1', profiles: { 'Profile1': { checklistData: [] } } }
    ];

    for (const bad of invalidProfiles) {
      assert.notOk(window.restoreProfiles(JSON.stringify(bad)), 'invalid rejected');
    }

    const after = JSON.parse(window.localStorage.getItem('profiles'));
    assert.deepEqual(after, before, 'localStorage unchanged');
  });
});
