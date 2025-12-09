const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  searchApps: (query) => ipcRenderer.invoke('search-apps', query),
  installApp: (appName) => ipcRenderer.invoke('install-app', appName),
  uninstallApp: (appName) => ipcRenderer.invoke('uninstall-app', appName),
  updateApp: (appName) => ipcRenderer.invoke('update-app', appName),
  stopDocker: () => ipcRenderer.invoke('stop-docker'),
  restartDocker: () => ipcRenderer.invoke('restart-docker'),
  checkDockerStatus: () => ipcRenderer.invoke('check-docker-status')
});
