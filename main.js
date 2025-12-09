const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Database = require('better-sqlite3');

let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#1e1e2e',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
}

function initDatabase() {
  db = new Database('scoop-manager.db');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      version TEXT,
      description TEXT,
      bucket TEXT,
      installed INTEGER DEFAULT 0,
      icon TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getScoopApps() {
  try {
    const { stdout } = await execPromise('scoop list');
    const lines = stdout.split('\n').filter(line => line.trim());
    const apps = [];
    
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(/\s+/);
      if (parts.length >= 2) {
        apps.push({
          name: parts[0],
          version: parts[1],
          bucket: parts[2] || 'main'
        });
      }
    }
    return apps;
  } catch (error) {
    console.error('获取 Scoop 应用列表失败:', error);
    return [];
  }
}

async function getAvailableApps() {
  try {
    const { stdout } = await execPromise('scoop search');
    return stdout;
  } catch (error) {
    console.error('搜索可用应用失败:', error);
    return '';
  }
}

ipcMain.handle('get-installed-apps', async () => {
  const apps = await getScoopApps();
  
  apps.forEach(app => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO apps (name, version, bucket, installed)
      VALUES (?, ?, ?, 1)
    `);
    stmt.run(app.name, app.version, app.bucket);
  });
  
  const allApps = db.prepare('SELECT * FROM apps WHERE installed = 1').all();
  return allApps;
});

ipcMain.handle('search-apps', async (event, query) => {
  try {
    const { stdout } = await execPromise(`scoop search ${query}`);
    return stdout;
  } catch (error) {
    return '';
  }
});

ipcMain.handle('install-app', async (event, appName) => {
  try {
    const { stdout } = await execPromise(`scoop install ${appName}`);
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO apps (name, installed)
      VALUES (?, 1)
    `);
    stmt.run(appName);
    
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('uninstall-app', async (event, appName) => {
  try {
    const { stdout } = await execPromise(`scoop uninstall ${appName}`);
    
    const stmt = db.prepare('UPDATE apps SET installed = 0 WHERE name = ?');
    stmt.run(appName);
    
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('update-app', async (event, appName) => {
  try {
    const { stdout } = await execPromise(`scoop update ${appName}`);
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-docker', async () => {
  try {
    let stopped = false;
    let errorMsg = '';
    
    // 停止所有运行中的容器
    try {
      const { stdout } = await execPromise('docker ps -q', { shell: 'powershell.exe' });
      if (stdout.trim()) {
        await execPromise(`docker stop ${stdout.trim().split('\n').join(' ')}`, { shell: 'powershell.exe' });
      }
    } catch (e) {
      // Docker 可能未运行，继续执行
    }
    
    // 尝试停止 Docker Desktop - 方法1: PowerShell
    try {
      const { stdout } = await execPromise('Get-Process "Docker Desktop" -ErrorAction SilentlyContinue | Stop-Process -Force', { shell: 'powershell.exe' });
      stopped = true;
    } catch (e) {
      errorMsg = e.message;
    }
    
    // 方法2: 尝试其他可能的进程名
    if (!stopped) {
      try {
        await execPromise('Get-Process "com.docker.backend" -ErrorAction SilentlyContinue | Stop-Process -Force', { shell: 'powershell.exe' });
        stopped = true;
      } catch (e) {
        errorMsg = e.message;
      }
    }
    
    // 方法3: 检查进程是否存在
    if (!stopped) {
      try {
        const { stdout } = await execPromise('tasklist /FI "IMAGENAME eq Docker Desktop.exe"', { shell: 'cmd.exe' });
        if (stdout.includes('Docker Desktop.exe')) {
          await execPromise('taskkill /F /IM "Docker Desktop.exe"', { shell: 'cmd.exe' });
          stopped = true;
        } else {
          // Docker Desktop 本来就没有运行
          return { success: true, message: 'Docker Desktop 未运行' };
        }
      } catch (e) {
        errorMsg = e.message;
      }
    }
    
    if (stopped) {
      return { success: true, message: 'Docker 已停止' };
    } else {
      return { success: false, message: 'Docker Desktop 未运行或已停止' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('restart-docker', async () => {
  try {
    // 先尝试停止 Docker Desktop
    try {
      await execPromise('Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue', { shell: 'powershell.exe' });
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (e) {
      // 如果进程不存在，继续执行
    }
    
    // 尝试启动 Docker Desktop
    const possiblePaths = [
      'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',
      'C:\\Program Files (x86)\\Docker\\Docker\\Docker Desktop.exe',
      process.env.LOCALAPPDATA + '\\Docker\\Docker Desktop.exe'
    ];
    
    let started = false;
    for (const dockerPath of possiblePaths) {
      try {
        await execPromise(`Start-Process "${dockerPath}"`, { shell: 'powershell.exe' });
        started = true;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (!started) {
      // 尝试通过 scoop 安装的路径
      try {
        await execPromise('Start-Process "docker"', { shell: 'powershell.exe' });
        started = true;
      } catch (e) {
        return { success: false, message: '未找到 Docker Desktop，请确保已正确安装' };
      }
    }
    
    return { success: true, message: 'Docker 正在重启，请稍候...' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('check-docker-status', async () => {
  try {
    const { stdout } = await execPromise('docker info', { timeout: 5000 });
    return { success: true, running: true, message: 'Docker 运行中' };
  } catch (error) {
    return { success: false, running: false, message: 'Docker 未运行' };
  }
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    db.close();
    app.quit();
  }
});
