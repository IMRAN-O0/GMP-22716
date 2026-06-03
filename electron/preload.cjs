'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getVersion:   () => ipcRenderer.invoke('app-version'),
  printPreview: () => ipcRenderer.invoke('print-preview'),
});
