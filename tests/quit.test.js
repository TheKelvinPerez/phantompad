const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
function setup() {
  const ipcMain = new EventEmitter(); ipcMain.handle = () => {};
  const app = new EventEmitter();
  Object.assign(app, { requestSingleInstanceLock: () => true, whenReady: () => new Promise(() => {}), quit() {}, getPath: () => '/unused' });
  const timers = new Map();
  const errors = [];
  const electron = { app, ipcMain, dialog: { showMessageBox: async (_, options) => { errors.push(options); return { response: 2 }; } } };
  const context = vm.createContext({ require: name => name === 'electron' ? electron : require('node:module').createRequire(require.resolve('../main.js'))(name), process, console, __dirname: __dirname,
    setTimeout: fn => { const id = {}; timers.set(id, fn); return id; }, clearTimeout: id => timers.delete(id) });
  vm.runInContext(fs.readFileSync(require.resolve('../main.js'), 'utf8'), context);
  vm.runInContext('mainWindow = { webContents: { send() {} }, getBounds: () => ({ width: 420, height: 720 }) }', context);
  return { ipcMain, errors, timers, run: code => vm.runInContext(code, context) };
}
test('repeated quit requests share one renderer handshake', async () => {
  const h = setup();
  const first = h.run('handleQuitAttempt()');
  const second = h.run('handleQuitAttempt()');
  assert.equal(h.ipcMain.listenerCount('editor-state-response'), 1);
  h.ipcMain.emit('editor-state-response', { sender: h.run('mainWindow.webContents') }, false, null, '');
  await Promise.all([first, second]);
  assert.equal(h.ipcMain.listenerCount('editor-state-response'), 0);
  assert.equal(h.timers.size, 0);
});
test('unresponsive renderer leaves no stale listener and reports the problem', async () => {
  const h = setup();
  const quitting = h.run('handleQuitAttempt()');
  for (const expire of h.timers.values()) expire();
  await quitting;
  assert.equal(h.ipcMain.listenerCount('editor-state-response'), 0);
  assert.equal(h.errors[0].type, 'error');
  assert.equal(h.run('isQuitting'), false);
});
