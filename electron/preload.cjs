'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:   () => ipcRenderer.invoke('app-version'),
  printPreview: () => ipcRenderer.invoke('print-preview'),
});

// APIs used only by the first-run setup screen (electron/setup.html).
contextBridge.exposeInMainWorld('setupAPI', {
  getConfig:      () => ipcRenderer.invoke('get-config'),
  testConnection: (url) => ipcRenderer.invoke('test-connection', url),
  saveConfig:     (cfg) => ipcRenderer.invoke('save-config', cfg),
});
