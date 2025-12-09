const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const Database = require('better-sqlite3');

// 导入 fetch（Node.js 18+ 内置，较低版本需要 polyfill）
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  fetch = require('node-fetch');
}

let mainWindow;
let db;
let tray;

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

  // 处理窗口关闭事件
  mainWindow.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      mainWindow.hide();
      
      // 首次最小化到托盘时显示提示
      if (!tray.isDestroyed()) {
        tray.displayBalloon({
          iconType: 'info',
          title: 'Scoop Manager',
          content: '应用已最小化到系统托盘，点击托盘图标可重新打开'
        });
      }
    }
  });

  // 处理窗口最小化
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
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

function createTray() {
  // 创建带有"S"字母的紫色方块托盘图标
  const size = 16;
  const pixels = [];
  
  // S字母的像素图案 (简化的5x7像素S字母)
  const sPattern = [
    [0,1,1,1,0],
    [1,0,0,0,1],
    [1,0,0,0,0],
    [0,1,1,1,0],
    [0,0,0,0,1],
    [1,0,0,0,1],
    [0,1,1,1,0]
  ];
  
  // 计算S字母的起始位置（居中）
  const startX = Math.floor((size - 5) / 2);
  const startY = Math.floor((size - 7) / 2);
  
  // 生成16x16的像素数据
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 检查当前像素是否在S字母范围内
      const sX = x - startX;
      const sY = y - startY;
      
      if (sX >= 0 && sX < 5 && sY >= 0 && sY < 7 && sPattern[sY][sX] === 1) {
        // S字母部分 - 白色
        pixels.push(255, 255, 255, 255);
      } else {
        // 背景 - 紫色 #8b5cf6
        pixels.push(139, 92, 246, 255);
      }
    }
  }
  
  const image = nativeImage.createFromBuffer(
    Buffer.from(pixels), 
    { width: size, height: size }
  );
  
  tray = new Tray(image);
  
  // 设置托盘提示文本
  tray.setToolTip('Scoop Manager');
  
  // 创建托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '隐藏窗口',
      click: () => {
        mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuiting = true;
        app.quit();
      }
    }
  ]);
  
  // 设置托盘菜单
  tray.setContextMenu(contextMenu);
  
  // 托盘图标点击事件
  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  // 托盘图标双击事件
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
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

ipcMain.handle('get-containers', async () => {
  try {
    // 使用 JSON 格式获取容器信息，避免编码问题
    const { stdout } = await execPromise('docker ps -a --format "{{json .}}"', {
      encoding: 'utf8'
    });
    
    if (!stdout.trim()) {
      return { success: true, containers: [] };
    }
    
    const lines = stdout.trim().split('\n');
    const containers = lines.map(line => {
      try {
        const container = JSON.parse(line);
        return {
          id: container.ID || container.id,
          name: container.Names || container.names,
          status: (container.Status || container.status).toLowerCase().includes('up') ? 'running' : 'exited',
          image: container.Image || container.image,
          ports: container.Ports || container.ports || '-',
          created: container.CreatedAt || container.created,
          command: container.Command || container.command
        };
      } catch (e) {
        return null;
      }
    }).filter(Boolean);
    
    return { success: true, containers };
  } catch (error) {
    // 如果 Docker 未运行，返回空列表而不是错误
    if (error.message.includes('Cannot connect to the Docker daemon')) {
      return { success: true, containers: [], message: 'Docker 未运行' };
    }
    return { success: false, containers: [], message: error.message };
  }
});

ipcMain.handle('start-container', async (event, containerId) => {
  try {
    const { stdout } = await execPromise(`docker start ${containerId}`);
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-container', async (event, containerId) => {
  try {
    const { stdout } = await execPromise(`docker stop ${containerId}`);
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('remove-container', async (event, containerId) => {
  try {
    const { stdout } = await execPromise(`docker rm ${containerId}`);
    return { success: true, message: stdout };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('ask-ai', async (event, question, config) => {
  try {
    const prompt = config.promptTemplate.replace('{question}', question);
    
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 解析命令（按行分割）
    let commands = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#') && !line.startsWith('//'))
      .slice(0, 3); // 最多3条命令
    
    // 过滤和清理命令
    commands = commands.map(cmd => {
      // 移除命令前的数字编号
      cmd = cmd.replace(/^\d+[\.\)]\s*/, '');
      // 移除 markdown 代码块标记
      cmd = cmd.replace(/^```\w*\s*/, '').replace(/```$/, '');
      return cmd.trim();
    }).filter(cmd => {
      // 过滤空命令和过短命令
      if (!cmd || cmd.length < 3) return false;
      // 过滤包含敏感信息的命令
      if (cmd.includes('password') || cmd.includes('--password')) return false;
      return true;
    });
    
    return { success: true, commands };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('execute-command', async (event, command) => {
  try {
    // 安全检查：过滤危险命令
    const dangerousPatterns = [
      /rm\s+-rf/i,
      /del\s+\/[sq]/i,
      /format\s+/i,
      /shutdown\s+/i,
      /restart\s+/i,
      /--password=/i,
      /passwd/i,
      /sudo\s+/i,
      /net\s+user.*\/add/i
    ];
    
    const isDangerous = dangerousPatterns.some(pattern => pattern.test(command));
    if (isDangerous) {
      return { success: false, message: '检测到潜在危险命令，已阻止执行' };
    }
    
    // 限制命令长度
    if (command.length > 200) {
      return { success: false, message: '命令过长，已阻止执行' };
    }
    
    const { stdout, stderr } = await execPromise(command, { 
      timeout: 30000,
      maxBuffer: 1024 * 1024, // 1MB 输出限制
      encoding: 'utf8',
      env: { ...process.env, CHCP: '65001' } // 设置 UTF-8 编码
    });
    
    let output = stdout || stderr || '命令执行完成';
    
    // 尝试修复中文乱码
    try {
      // 如果是 Windows 系统，尝试转换编码
      if (process.platform === 'win32' && output.includes('�')) {
        // 使用 PowerShell 重新执行命令以获得正确编码
        const psCommand = `powershell -Command "& {${command}}"`;
        const { stdout: psStdout } = await execPromise(psCommand, {
          timeout: 30000,
          encoding: 'utf8'
        });
        output = psStdout || output;
      }
    } catch (e) {
      // 如果转换失败，使用原输出
    }
    
    // 限制输出长度
    if (output.length > 2000) {
      output = output.substring(0, 2000) + '\n... (输出已截断)';
    }
    
    return { success: true, output };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

app.whenReady().then(() => {
  initDatabase();
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on('window-all-closed', () => {
  // 在 Windows 上，即使所有窗口都关闭了，也保持应用运行（托盘模式）
  if (process.platform === 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  app.isQuiting = true;
});

app.on('will-quit', () => {
  if (db) {
    db.close();
  }
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
  }
});
