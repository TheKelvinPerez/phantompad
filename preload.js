const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('padAPI', {
  // Files
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', filePath, content),

  confirmUnsaved: () => ipcRenderer.invoke('confirm-unsaved'),
  showError: (message) => ipcRenderer.invoke('show-error', message),

  // Window
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  hideWindow: () => ipcRenderer.send('hide-window'),
  quitApp: () => ipcRenderer.send('quit-app'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Quit guard handshake
  getEditorState: (callback) => ipcRenderer.on('get-editor-state', callback),
  sendEditorState: (hasChanges, filePath, content) =>
    ipcRenderer.send('editor-state-response', hasChanges, filePath, content)
});
