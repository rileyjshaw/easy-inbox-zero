const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function fixture (title, folders) {
  let changed, mutation;
  const style = {};
  const document = {title, head: {append() {}}, createElement: () => style};
  const chrome = {runtime: {sendMessage: (_message, callback) => callback({folders})},
    storage: {onChanged: {addListener: callback => { changed = callback; }}}};
  class MutationObserver { constructor(callback) { mutation = callback; } observe() {} }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../inbox-zero.js'), 'utf8'), {chrome, document, MutationObserver});
  return {document, style, change: folders => changed({folders: {newValue: folders}}, 'local'), update: title => { document.title = title; mutation(); }};
}

test('only whole folder names at the beginning of the title match', () => {
  assert.equal(fixture('Inbox (12) - Gmail', ['box']).document.title, 'Inbox (12) - Gmail');
  assert.equal(fixture('Inbox (12) - Gmail', ['Inbox']).document.title, 'Inbox - Gmail');
  assert.equal(fixture('Work [A] (4) - Gmail', ['Work [A]']).document.title, 'Work [A] - Gmail');
});

test('changing folders restores the count without reloading Gmail', () => {
  const f = fixture('Inbox (12) - Gmail', ['Inbox']);
  f.change([]);
  assert.equal(f.document.title, 'Inbox (12) - Gmail');
  f.change(['Inbox']);
  f.update('Inbox (25) - Gmail');
  assert.equal(f.document.title, 'Inbox - Gmail');
  f.change([]);
  assert.equal(f.document.title, 'Inbox (25) - Gmail');
});

test('quoted and CSS-special folder names stay escaped', () => {
  const f = fixture('"Work" (2) - Gmail', ['Work', 'a"b\\c']);
  assert.equal(f.document.title, '"Work" - Gmail');
  assert(f.style.textContent.includes('a\\"b\\\\c'));
});
