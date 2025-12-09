let currentView = 'installed';
let installedApps = [];
let availableApps = [];
let dockerInstalled = false;

const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const installedAppsContainer = document.getElementById('installedApps');
const availableAppsContainer = document.getElementById('availableApps');
const dockerNavItem = document.getElementById('dockerNavItem');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const viewName = item.dataset.view;
    switchView(viewName);
  });
});

function switchView(viewName) {
  currentView = viewName;
  
  navItems.forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  views.forEach(view => {
    if (view.id === `${viewName}View`) {
      view.classList.add('active');
    } else {
      view.classList.remove('active');
    }
  });
  
  // 清空搜索框
  searchInput.value = '';
  
  if (viewName === 'installed') {
    loadInstalledApps();
  } else if (viewName === 'available') {
    loadAvailableApps();
  } else if (viewName === 'docker') {
    loadDockerConfig();
  }
}

async function loadInstalledApps() {
  installedAppsContainer.innerHTML = '<div class="loading">加载中...</div>';
  
  try {
    installedApps = await window.electronAPI.getInstalledApps();
    renderInstalledApps(installedApps);
    checkDockerInstalled();
  } catch (error) {
    showToast('加载失败: ' + error.message, 'error');
    installedAppsContainer.innerHTML = '<div class="loading">加载失败</div>';
  }
}

function renderInstalledApps(apps) {
  if (apps.length === 0) {
    installedAppsContainer.innerHTML = '<div class="loading">暂无已安装的应用</div>';
    return;
  }
  
  installedAppsContainer.innerHTML = apps.map(app => `
    <div class="app-card" id="card-${app.name}">
      <div class="app-header">
        <div class="app-icon">${getAppIcon(app.name)}</div>
        <div class="app-info">
          <div class="app-name">${app.name}</div>
          <div class="app-version">v${app.version || '未知'}</div>
        </div>
      </div>
      <div class="app-description">${app.description || '暂无描述'}</div>
      <div class="app-actions">
        <button class="btn btn-secondary" onclick="updateApp('${app.name}')">更新</button>
        <button class="btn btn-danger" onclick="uninstallApp('${app.name}')">卸载</button>
      </div>
      <div class="progress-container" id="progress-${app.name}" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill indeterminate"></div>
        </div>
        <div class="progress-text">处理中...</div>
      </div>
    </div>
  `).join('');
}

async function loadAvailableApps() {
  availableAppsContainer.innerHTML = '<div class="loading">加载可用程序...</div>';
  
  availableApps = [
    { name: 'git', description: '分布式版本控制系统', bucket: 'main' },
    { name: 'nodejs', description: 'JavaScript 运行时环境', bucket: 'main' },
    { name: 'python', description: 'Python 编程语言', bucket: 'main' },
    { name: 'vscode', description: 'Visual Studio Code 编辑器', bucket: 'extras' },
    { name: '7zip', description: '文件压缩工具', bucket: 'main' },
    { name: 'chrome', description: 'Google Chrome 浏览器', bucket: 'extras' },
    { name: 'firefox', description: 'Mozilla Firefox 浏览器', bucket: 'extras' },
    { name: 'vlc', description: 'VLC 媒体播放器', bucket: 'extras' },
    { name: 'notepadplusplus', description: 'Notepad++ 文本编辑器', bucket: 'extras' },
    { name: 'docker', description: 'Docker 容器平台', bucket: 'main' },
    { name: 'postman', description: 'API 开发测试工具', bucket: 'extras' },
    { name: 'wget', description: '文件下载工具', bucket: 'main' },
    { name: 'curl', description: '数据传输工具', bucket: 'main' },
    { name: 'ffmpeg', description: '音视频处理工具', bucket: 'main' },
    { name: 'gradle', description: 'Gradle 构建工具', bucket: 'main' },
    { name: 'maven', description: 'Maven 构建工具', bucket: 'main' }
  ];
  
  renderAvailableApps(availableApps);
}

function renderAvailableApps(apps) {
  if (apps.length === 0) {
    availableAppsContainer.innerHTML = '<div class="loading">未找到匹配的应用</div>';
    return;
  }
  
  availableAppsContainer.innerHTML = apps.map(app => `
    <div class="app-card" id="card-available-${app.name}">
      <div class="app-header">
        <div class="app-icon">${getAppIcon(app.name)}</div>
        <div class="app-info">
          <div class="app-name">${app.name}</div>
          <div class="app-version">${app.bucket || 'main'}</div>
        </div>
      </div>
      <div class="app-description">${app.description}</div>
      <div class="app-actions">
        <button class="btn btn-primary" onclick="installApp('${app.name}')">安装</button>
      </div>
      <div class="progress-container" id="progress-available-${app.name}" style="display: none;">
        <div class="progress-bar">
          <div class="progress-fill indeterminate"></div>
        </div>
        <div class="progress-text">正在安装...</div>
      </div>
    </div>
  `).join('');
}

function getAppIcon(name) {
  return name.charAt(0).toUpperCase();
}

async function installApp(appName) {
  const progressId = `progress-available-${appName}`;
  const progressEl = document.getElementById(progressId);
  
  if (progressEl) {
    progressEl.style.display = 'block';
  }
  
  showToast(`正在安装 ${appName}...`, 'success');
  
  try {
    const result = await window.electronAPI.installApp(appName);
    
    if (progressEl) {
      progressEl.style.display = 'none';
    }
    
    if (result.success) {
      showToast(`${appName} 安装成功`, 'success');
      if (currentView === 'installed') {
        loadInstalledApps();
      }
    } else {
      showToast(`安装失败: ${result.message}`, 'error');
    }
  } catch (error) {
    if (progressEl) {
      progressEl.style.display = 'none';
    }
    showToast(`安装失败: ${error.message}`, 'error');
  }
}

async function uninstallApp(appName) {
  if (!confirm(`确定要卸载 ${appName} 吗？`)) {
    return;
  }
  
  const progressId = `progress-${appName}`;
  const progressEl = document.getElementById(progressId);
  
  if (progressEl) {
    progressEl.style.display = 'block';
    progressEl.querySelector('.progress-text').textContent = '正在卸载...';
  }
  
  showToast(`正在卸载 ${appName}...`, 'success');
  
  try {
    const result = await window.electronAPI.uninstallApp(appName);
    
    if (progressEl) {
      progressEl.style.display = 'none';
    }
    
    if (result.success) {
      showToast(`${appName} 卸载成功`, 'success');
      loadInstalledApps();
    } else {
      showToast(`卸载失败: ${result.message}`, 'error');
    }
  } catch (error) {
    if (progressEl) {
      progressEl.style.display = 'none';
    }
    showToast(`卸载失败: ${error.message}`, 'error');
  }
}

async function updateApp(appName) {
  const progressId = `progress-${appName}`;
  const progressEl = document.getElementById(progressId);
  
  if (progressEl) {
    progressEl.style.display = 'block';
    progressEl.querySelector('.progress-text').textContent = '正在更新...';
  }
  
  showToast(`正在更新 ${appName}...`, 'success');
  
  try {
    const result = await window.electronAPI.updateApp(appName);
    
    if (progressEl) {
      progressEl.style.display = 'none';
    }
    
    if (result.success) {
      showToast(`${appName} 更新成功`, 'success');
      loadInstalledApps();
    } else {
      showToast(`更新失败: ${result.message}`, 'error');
    }
  } catch (error) {
    if (progressEl) {
      progressEl.style.display = 'none';
    }
    showToast(`更新失败: ${error.message}`, 'error');
  }
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

refreshBtn.addEventListener('click', () => {
  if (currentView === 'installed') {
    loadInstalledApps();
  } else {
    loadAvailableApps();
  }
});

searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();
  
  if (currentView === 'installed') {
    const filtered = installedApps.filter(app => 
      app.name.toLowerCase().includes(query) ||
      (app.description && app.description.toLowerCase().includes(query))
    );
    renderInstalledApps(filtered);
  } else if (currentView === 'available') {
    const filtered = availableApps.filter(app => 
      app.name.toLowerCase().includes(query) ||
      (app.description && app.description.toLowerCase().includes(query))
    );
    renderAvailableApps(filtered);
  }
});

// Docker 配置相关
const diskSizeSlider = document.getElementById('diskSize');
const diskValue = document.getElementById('diskValue');
const memorySizeSlider = document.getElementById('memorySize');
const memoryValue = document.getElementById('memoryValue');
const cpuCoresSlider = document.getElementById('cpuCores');
const cpuValue = document.getElementById('cpuValue');
const registryMirror = document.getElementById('registryMirror');
const enableExperimental = document.getElementById('enableExperimental');
const enableBuildKit = document.getElementById('enableBuildKit');
const saveDockerConfigBtn = document.getElementById('saveDockerConfig');
const resetDockerConfigBtn = document.getElementById('resetDockerConfig');
const stopDockerBtn = document.getElementById('stopDockerBtn');
const restartDockerBtn = document.getElementById('restartDockerBtn');
const dockerStatus = document.getElementById('dockerStatus');
const dockerStatusText = document.getElementById('dockerStatusText');

// 滑块值更新
diskSizeSlider.addEventListener('input', (e) => {
  diskValue.textContent = e.target.value;
});

memorySizeSlider.addEventListener('input', (e) => {
  memoryValue.textContent = e.target.value;
});

cpuCoresSlider.addEventListener('input', (e) => {
  cpuValue.textContent = e.target.value;
});

// 保存 Docker 配置
saveDockerConfigBtn.addEventListener('click', () => {
  const config = {
    diskSize: parseInt(diskSizeSlider.value),
    memory: parseInt(memorySizeSlider.value),
    cpus: parseInt(cpuCoresSlider.value),
    registryMirror: registryMirror.value,
    experimental: enableExperimental.checked,
    buildKit: enableBuildKit.checked
  };
  
  saveDockerConfig(config);
});

// 重置 Docker 配置
resetDockerConfigBtn.addEventListener('click', () => {
  if (confirm('确定要重置为默认配置吗？')) {
    resetDockerConfigToDefault();
  }
});

function loadDockerConfig() {
  // 从本地存储加载配置
  const savedConfig = localStorage.getItem('dockerConfig');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    diskSizeSlider.value = config.diskSize || 64;
    diskValue.textContent = config.diskSize || 64;
    memorySizeSlider.value = config.memory || 4;
    memoryValue.textContent = config.memory || 4;
    cpuCoresSlider.value = config.cpus || 2;
    cpuValue.textContent = config.cpus || 2;
    registryMirror.value = config.registryMirror || '';
    enableExperimental.checked = config.experimental || false;
    enableBuildKit.checked = config.buildKit !== false;
  }
  
  // 检查 Docker 状态
  checkDockerStatus();
}

function saveDockerConfig(config) {
  localStorage.setItem('dockerConfig', JSON.stringify(config));
  showToast('Docker 配置已保存', 'success');
  
  // 这里可以调用实际的 Docker 配置命令
  console.log('保存的 Docker 配置:', config);
}

function resetDockerConfigToDefault() {
  diskSizeSlider.value = 64;
  diskValue.textContent = 64;
  memorySizeSlider.value = 4;
  memoryValue.textContent = 4;
  cpuCoresSlider.value = 2;
  cpuValue.textContent = 2;
  registryMirror.value = '';
  enableExperimental.checked = false;
  enableBuildKit.checked = true;
  
  localStorage.removeItem('dockerConfig');
  showToast('已重置为默认配置', 'success');
}

function checkDockerInstalled() {
  // 检查 Docker 是否在已安装应用列表中
  const dockerApp = installedApps.find(app => 
    app.name.toLowerCase() === 'docker' || 
    app.name.toLowerCase() === 'docker-desktop'
  );
  
  if (dockerApp) {
    dockerInstalled = true;
    dockerNavItem.style.display = 'flex';
  } else {
    dockerInstalled = false;
    dockerNavItem.style.display = 'none';
  }
}

// Docker 控制功能
stopDockerBtn.addEventListener('click', async () => {
  if (!confirm('确定要停止 Docker 服务吗？所有运行中的容器将被停止。')) {
    return;
  }
  
  stopDockerBtn.disabled = true;
  restartDockerBtn.disabled = true;
  showToast('正在停止 Docker...', 'success');
  updateDockerStatus('stopping', '正在停止...');
  
  try {
    const result = await window.electronAPI.stopDocker();
    if (result.success) {
      showToast(result.message, 'success');
      updateDockerStatus('stopped', 'Docker 已停止');
      // 延迟后再次检查状态
      setTimeout(() => checkDockerStatus(), 2000);
    } else {
      // 即使失败，也可能是因为 Docker 本来就没运行
      showToast(result.message, 'success');
      updateDockerStatus('stopped', 'Docker 未运行');
      setTimeout(() => checkDockerStatus(), 2000);
    }
  } catch (error) {
    showToast('操作失败: ' + error.message, 'error');
    setTimeout(() => checkDockerStatus(), 2000);
  } finally {
    stopDockerBtn.disabled = false;
    restartDockerBtn.disabled = false;
  }
});

restartDockerBtn.addEventListener('click', async () => {
  if (!confirm('确定要重启 Docker 服务吗？这可能需要 30-60 秒时间。')) {
    return;
  }
  
  restartDockerBtn.disabled = true;
  stopDockerBtn.disabled = true;
  showToast('正在重启 Docker...', 'success');
  updateDockerStatus('restarting', '正在重启...');
  
  try {
    const result = await window.electronAPI.restartDocker();
    if (result.success) {
      showToast(result.message, 'success');
      // 等待 Docker 完全启动，定期检查状态
      let attempts = 0;
      const maxAttempts = 12; // 最多等待 60 秒
      
      const checkInterval = setInterval(async () => {
        attempts++;
        const status = await window.electronAPI.checkDockerStatus();
        
        if (status.running) {
          clearInterval(checkInterval);
          updateDockerStatus('running', 'Docker 运行中');
          showToast('Docker 已成功启动', 'success');
          restartDockerBtn.disabled = false;
          stopDockerBtn.disabled = false;
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          updateDockerStatus('unknown', 'Docker 启动超时，请手动检查');
          showToast('Docker 启动超时，请手动检查', 'error');
          restartDockerBtn.disabled = false;
          stopDockerBtn.disabled = false;
        } else {
          updateDockerStatus('restarting', `正在启动... (${attempts * 5}s)`);
        }
      }, 5000);
    } else {
      showToast('重启失败: ' + result.message, 'error');
      updateDockerStatus('unknown', '状态未知');
      restartDockerBtn.disabled = false;
      stopDockerBtn.disabled = false;
    }
  } catch (error) {
    showToast('重启失败: ' + error.message, 'error');
    updateDockerStatus('unknown', '状态未知');
    restartDockerBtn.disabled = false;
    stopDockerBtn.disabled = false;
  }
});

function updateDockerStatus(status, text) {
  dockerStatus.className = `status-indicator ${status}`;
  dockerStatusText.textContent = text;
}

// 检查 Docker 状态
async function checkDockerStatus() {
  if (!dockerInstalled) {
    updateDockerStatus('unknown', 'Docker 未安装');
    return;
  }
  
  updateDockerStatus('checking', '检查中...');
  
  try {
    const result = await window.electronAPI.checkDockerStatus();
    if (result.running) {
      updateDockerStatus('running', 'Docker 运行中');
    } else {
      updateDockerStatus('stopped', 'Docker 未运行');
    }
  } catch (error) {
    updateDockerStatus('stopped', 'Docker 未运行');
  }
}

loadInstalledApps();
