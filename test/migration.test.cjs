const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function fixture (initial, legacy, firefox = false) {
  const data = structuredClone(initial), lifecycle = {created: 0, closed: 0};
  let message;
  const chrome = {runtime: {getURL: name => `chrome-extension://test/${name}`, getContexts: async () => [],
    sendMessage: async () => ({folders: legacy}), onMessage: {addListener: callback => { message = callback; }},
    onInstalled: {addListener() {}}}, offscreen: {createDocument: async () => { lifecycle.created++; },
      closeDocument: async () => { lifecycle.closed++; }},
    storage: {local: {get: async defaults => ({...(defaults || {}), ...structuredClone(data)}),
      set: async value => Object.assign(data, structuredClone(value))}}};
  const context = {chrome, console};
  if (firefox) context.localStorage = {getItem: () => legacy};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../background.js'), 'utf8'), context);
  return {data, lifecycle, request: () => new Promise(resolve => message({type: 'easy-inbox-zero:get-folders'}, {}, resolve))};
}

test('old folders import once before simultaneous callers receive settings', async () => {
  const f = fixture({}, '["Work", "Inbox", "Work"]');
  const responses = await Promise.all([f.request(), f.request()]);
  assert.deepEqual(responses[0].folders, ['Work', 'Inbox']);
  assert.deepEqual(responses[1].folders, ['Work', 'Inbox']);
  assert.deepEqual(f.lifecycle, {created: 1, closed: 1});
});

test('an intentional empty MV3 folder list is never replaced by old folders', async () => {
  const f = fixture({folders: []}, '["Old folder"]');
  assert.deepEqual((await f.request()).folders, []);
});

test('invalid legacy JSON falls back to Inbox without blocking settings', async () => {
  const f = fixture({}, '{invalid');
  assert.deepEqual(Array.from((await f.request()).folders), ['Inbox']);
  assert.equal(f.data.storageVersion, 1);
});

test('Firefox imports preferences without creating an offscreen document', async () => {
  const f = fixture({}, '["Work"]', true);
  assert.deepEqual((await f.request()).folders, ['Work']);
  assert.equal(f.lifecycle.created, 0);
});
