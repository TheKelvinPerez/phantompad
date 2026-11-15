const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup(overrides = {}) {
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, {
      value: id === 'opacity-slider' ? '85' : '', textContent: '', checked: true,
      style: {}, classList: { add() {}, remove() {}, toggle() {} },
      handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; },
      focus() {}, contains() { return false; }
    });
    return elements.get(id);
  };
  let tick;
  let stateCallback;
  const errors = [];
  const api = {
    openFile: async () => null, saveFile: async () => '/note.md',
    confirmUnsaved: async () => 'cancel', showError: async message => errors.push(message),
    getEditorState: fn => stateCallback = fn, sendEditorState() {},
    ...overrides
  };
  const context = vm.createContext({
    document: { getElementById: element, body: element('body'), addEventListener() {}, hasFocus: () => true },
    window: { padAPI: api, addEventListener() {} },
    localStorage: { getItem: () => null, setItem() {} },
    setInterval: fn => { tick = fn; return 1; }, clearInterval() {}, console
  });
  vm.runInContext(fs.readFileSync(require.resolve('../renderer/renderer.js'), 'utf8'), context);
  return {
    element, errors, run: code => vm.runInContext(code, context),
    edit(text) { element('editor').value = text; element('editor').handlers.input(); },
    tick: () => tick(), state: () => stateCallback()
  };
}

test('new and open preserve an unsaved note when the user cancels', async () => {
  let opened = false;
  const h = setup({ openFile: async () => { opened = true; return { filePath: '/other.md', content: 'other' }; } });
  h.edit('keep this');
  await h.run('newFile()');
  assert.equal(h.element('editor').value, 'keep this');
  await h.run('openFile()');
  assert.equal(opened, false);
  assert.equal(h.element('editor').value, 'keep this');
});

test('edits made during a save stay dirty and autosave on the next tick', async () => {
  let finish;
  const writes = [];
  const h = setup({ saveFile: (path, text) => {
    writes.push(text);
    return writes.length === 1 ? new Promise(resolve => finish = resolve) : Promise.resolve('/note.md');
  } });
  h.edit('first');
  const saving = h.run('saveFile()');
  h.edit('second');
  finish('/note.md');
  await saving;
  assert.match(h.element('status-file').textContent, /•/);
  await h.tick();
  assert.deepEqual(writes, ['first', 'second']);
  assert.doesNotMatch(h.element('status-file').textContent, /•/);
});

test('failed saves preserve dirty state and report an actionable error', async () => {
  const h = setup({ saveFile: async () => { throw new Error('Permission denied'); } });
  h.edit('keep this');
  await h.run('saveFile()');
  assert.match(h.element('status-file').textContent, /•/);
  assert.match(h.errors[0], /Permission denied/);
});

test('cancelling Save As prevents replacing the unsaved note', async () => {
  const h = setup({ confirmUnsaved: async () => 'save', saveFile: async () => null });
  h.edit('keep this');
  await h.run('newFile()');
  assert.equal(h.element('editor').value, 'keep this');
});
