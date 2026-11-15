const { app, BrowserWindow, ipcMain, dialog, shell, globalShortcut, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const { restoreBounds } = require('./window-bounds');

// Global toggle. Override with PHANTOMPAD_HOTKEY="Alt+P" etc, or change it here.
const TOGGLE_HOTKEY = process.env.PHANTOMPAD_HOTKEY || 'Control+Alt+Shift+P';

let mainWindow = null;
let isQuitting = false;
let quitAttempt = null;

// ---------------------------------------------------------------------------
// Window state persistence
// ---------------------------------------------------------------------------

function statePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  try {
    return JSON.parse(fs.readFileSync(statePath(), 'utf8'));
  } catch {
    return null;
  }
}

function saveWindowState() {
  if (!mainWindow) return;
  try {
    const bounds = mainWindow.getBounds();
    if (bounds.width >= 200 && bounds.height >= 200) {
      fs.writeFileSync(statePath(), JSON.stringify(bounds));
    }
  } catch {
    // Best effort only.
  }
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
  const saved = loadWindowState() || {};
  const display = Number.isFinite(saved.x) && Number.isFinite(saved.y)
    ? screen.getDisplayNearestPoint({ x: Math.round(saved.x), y: Math.round(saved.y) })
    : screen.getPrimaryDisplay();
  const bounds = restoreBounds(saved, display.workArea);

  mainWindow = new BrowserWindow({
    minWidth: 280,
    minHeight: 240,
    ...bounds,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    // Electron's ElectronNSPanel: nonactivating mask plus forced
    // CanJoinAllSpaces + FullScreenAuxiliary collection behavior.
    type: process.platform === 'darwin' ? 'panel' : undefined,
    title: 'PhantomPad',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });

  if (process.platform === 'darwin') {
    const subrole = require('./build/Release/panel.node').configure(mainWindow.getNativeWindowHandle());
    console.log('[phantompad] overlay accessibility:', subrole);
  }

  // Keep the pad above everything, including full-screen apps.
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  // Belt and suspenders on top of the panel type: join all spaces.
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // Closing the pad hides it, panel style. Quit happens via Cmd+Q or the dock.
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      saveWindowState();
      mainWindow.hide();
    }
  });

  mainWindow.on('moved', saveWindowState);
  mainWindow.on('resized', saveWindowState);
}

function togglePad() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) {
    mainWindow.restore();
    mainWindow.show();
  } else if (mainWindow.isVisible()) {
    saveWindowState();
    mainWindow.hide();
  } else {
    mainWindow.restore();
    mainWindow.show();
  }
}

// ---------------------------------------------------------------------------
// Quit guard with unsaved-changes check
// ---------------------------------------------------------------------------

function readEditorState() {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout);
      ipcMain.removeListener('editor-state-response', onResponse);
    };
    const onResponse = (event, hasChanges, filePath, content) => {
      if (event.sender !== mainWindow.webContents) return;
      cleanup();
      resolve({ hasChanges, filePath, content });
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('The editor is not responding. Your note has been kept open.'));
    }, 3000);
    ipcMain.on('editor-state-response', onResponse);
    mainWindow.webContents.send('get-editor-state');
  });
}

function handleQuitAttempt() {
  if (isQuitting) return Promise.resolve();
  if (quitAttempt) return quitAttempt;
  quitAttempt = (async () => {
    try {
      if (mainWindow) {
        const { hasChanges, filePath, content } = await readEditorState();
        if (hasChanges) {
          const choice = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            buttons: ['Save and Quit', 'Quit Without Saving', 'Cancel'],
            defaultId: 0, cancelId: 2, title: 'Unsaved Changes',
            message: 'You have unsaved changes. What would you like to do?',
            detail: filePath || 'New unsaved file'
          });
          if (choice.response === 2) return;
          if (choice.response === 0) {
            let destination = filePath;
            if (!destination) {
              const result = await dialog.showSaveDialog(mainWindow, {
                defaultPath: 'Untitled.md',
                filters: [
                  { name: 'Markdown Files', extensions: ['md', 'markdown'] },
                  { name: 'Text Files', extensions: ['txt'] }
                ]
              });
              if (result.canceled || !result.filePath) return;
              destination = result.filePath;
            }
            await fsp.writeFile(destination, content, 'utf-8');
          }
        }
      }
      isQuitting = true;
      saveWindowState();
      app.quit();
    } catch (error) {
      await dialog.showMessageBox(mainWindow, {
        type: 'error', buttons: ['OK'], message: `Could not quit safely: ${error.message}`
      });
    } finally {
      quitAttempt = null;
    }
  })();
  return quitAttempt;
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  app.whenReady().then(() => {
    // Accessory policy: no Dock icon, no menu bar takeover. Pure panel life.
    if (process.platform === 'darwin') {
      app.setActivationPolicy('accessory');
    }
    Menu.setApplicationMenu(null);

    createWindow();

    try {
      if (globalShortcut.register(TOGGLE_HOTKEY, togglePad)) {
        console.log('[phantompad] toggle hotkey:', TOGGLE_HOTKEY);
      } else {
        console.warn('[phantompad] hotkey unavailable:', TOGGLE_HOTKEY);
      }
    } catch (err) {
      console.warn('[phantompad] could not register hotkey:', err.message);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

app.on('before-quit', async (event) => {
  if (isQuitting) return;
  event.preventDefault();
  await handleQuitAttempt();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ---------------------------------------------------------------------------
// IPC
// ---------------------------------------------------------------------------

ipcMain.handle('open-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) return null;

  const filePath = result.filePaths[0];
  const content = await fsp.readFile(filePath, 'utf-8');
  return { filePath, content };
});

ipcMain.handle('save-file', async (event, filePath, content) => {
  if (!filePath) {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath: 'Untitled.md',
      filters: [
        { name: 'Markdown Files', extensions: ['md', 'markdown'] },
        { name: 'Text Files', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled) return null;
    filePath = result.filePath;
  }

  await fsp.writeFile(filePath, content, 'utf-8');
  return filePath;
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('hide-window', () => {
  if (mainWindow) {
    saveWindowState();
    mainWindow.hide();
  }
});

ipcMain.on('quit-app', async () => {
  await handleQuitAttempt();
});

ipcMain.handle('open-external', async (event, url) => {
  if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
    await shell.openExternal(url);
  }
});


ipcMain.handle('confirm-unsaved', async () => {
  const { response } = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Save', 'Discard Changes', 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    message: 'Save your changes before replacing this note?'
  });
  return ['save', 'discard', 'cancel'][response] || 'cancel';
});

ipcMain.handle('show-error', async (event, message) => {
  await dialog.showMessageBox(mainWindow, {
    type: 'error', buttons: ['OK'], message: String(message)
  });
});
