const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getInstalledApps: () => ipcRenderer.invoke('get-installed-apps'),
  searchApps: (query) => ipcRenderer.invoke('search-apps', query),
  installApp: (appName) => ipcRenderer.invoke('install-app', appName),
  uninstallApp: (appName) => ipcRenderer.invoke('uninstall-app', appName),
  updateApp: (appName) => ipcRenderer.invoke('update-app', appName),
  stopDocker: () => ipcRenderer.invoke('stop-docker'),
  restartDocker: () => ipcRenderer.invoke('restart-docker'),
  checkDockerStatus: () => ipcRenderer.invoke('check-docker-status'),
  getContainers: () => ipcRenderer.invoke('get-containers'),
  startContainer: (containerId) => ipcRenderer.invoke('start-container', containerId),
  stopContainer: (containerId) => ipcRenderer.invoke('stop-container', containerId),
  removeContainer: (containerId) => ipcRenderer.invoke('remove-container', containerId),
  askAI: (question, config) => ipcRenderer.invoke('ask-ai', question, config),
  executeCommand: (command) => ipcRenderer.invoke('execute-command', command),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  installDatabase: (dbName, category) => ipcRenderer.invoke('install-database', dbName, category),
  uninstallDatabase: (dbName, category) => ipcRenderer.invoke('uninstall-database', dbName, category),
  startDatabase: (dbName, category) => ipcRenderer.invoke('start-database', dbName, category),
  stopDatabase: (dbName, category) => ipcRenderer.invoke('stop-database', dbName, category),
  saveDatabaseConfig: (dbName, category, config) => ipcRenderer.invoke('save-database-config', dbName, category, config),
  checkDatabaseStatus: (dbName) => ipcRenderer.invoke('check-database-status', dbName)
});
