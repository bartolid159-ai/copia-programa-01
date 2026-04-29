const { contextBridge, ipcRenderer } = require('electron');

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDbPath: () => ipcRenderer.invoke('get-db-path')
});

// Handle environment for the renderer
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('DOMContentLoaded', () => {
    const preload = document.createElement('script');
    preload.src = 'http://localhost:5173/src/electron-dev.js';
    document.head.appendChild(preload);
  });
}