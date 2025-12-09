let currentView = 'installed';
let installedApps = [];
let availableApps = [];
let dockerInstalled = false;
let containers = [];

const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const installedAppsContainer = document.getElementById('installedApps');
const availableAppsContainer = document.getElementById('availableApps');
const dockerNavItem = document.getElementById('dockerNavItem');
const containersNavItem = document.getElementById('containersNavItem');

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
    stopContainerAutoRefresh();
    loadInstalledApps();
  } else if (viewName === 'available') {
    stopContainerAutoRefresh();
    loadAvailableApps();
  } else if (viewName === 'docker') {
    stopContainerAutoRefresh();
    loadDockerConfig();
  } else if (viewName === 'containers') {
    loadContainers();
    startContainerAutoRefresh();
  } else if (viewName === 'console') {
    stopContainerAutoRefresh();
    loadConsoleConfig();
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

// Docker 配置相关 - 使用延迟获取避免 DOM 未加载问题
let diskSizeSlider, diskValue, memorySizeSlider, memoryValue, cpuCoresSlider, cpuValue;
let registryMirror, enableExperimental, enableBuildKit;
let saveDockerConfigBtn, resetDockerConfigBtn, stopDockerBtn, restartDockerBtn;
let dockerStatus, dockerStatusText;

function initDockerElements() {
  diskSizeSlider = document.getElementById('diskSize');
  diskValue = document.getElementById('diskValue');
  memorySizeSlider = document.getElementById('memorySize');
  memoryValue = document.getElementById('memoryValue');
  cpuCoresSlider = document.getElementById('cpuCores');
  cpuValue = document.getElementById('cpuValue');
  registryMirror = document.getElementById('registryMirror');
  enableExperimental = document.getElementById('enableExperimental');
  enableBuildKit = document.getElementById('enableBuildKit');
  saveDockerConfigBtn = document.getElementById('saveDockerConfig');
  resetDockerConfigBtn = document.getElementById('resetDockerConfig');
  stopDockerBtn = document.getElementById('stopDockerBtn');
  restartDockerBtn = document.getElementById('restartDockerBtn');
  dockerStatus = document.getElementById('dockerStatus');
  dockerStatusText = document.getElementById('dockerStatusText');
}

// 滑块事件监听器已移到 initApp 函数中

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
    if (dockerNavItem) dockerNavItem.style.display = 'flex';
    if (containersNavItem) containersNavItem.style.display = 'flex';
    
    // 如果当前在容器管理页面，自动加载容器列表
    if (currentView === 'containers') {
      loadContainers();
    }
  } else {
    dockerInstalled = false;
    if (dockerNavItem) dockerNavItem.style.display = 'none';
    if (containersNavItem) containersNavItem.style.display = 'none';
  }
}

// 容器管理功能
const refreshContainersBtn = document.getElementById('refreshContainersBtn');
const containerStatusFilter = document.getElementById('containerStatusFilter');
const containersTableBody = document.getElementById('containersTableBody');

refreshContainersBtn.addEventListener('click', loadContainers);

containerStatusFilter.addEventListener('change', () => {
  const filter = containerStatusFilter.value;
  renderContainers(containers, filter);
});

let containerRefreshInterval = null;

async function loadContainers() {
  if (!containersTableBody) return;
  
  containersTableBody.innerHTML = '<div class="loading">加载容器列表...</div>';
  
  try {
    const result = await window.electronAPI.getContainers();
    containers = result.containers || [];
    renderContainers(containers);
    
    if (result.message) {
      showToast(result.message, 'info');
    }
  } catch (error) {
    containersTableBody.innerHTML = '<div class="loading">加载失败: ' + error.message + '</div>';
  }
}

function startContainerAutoRefresh() {
  // 清除现有的定时器
  if (containerRefreshInterval) {
    clearInterval(containerRefreshInterval);
  }
  
  // 每30秒自动刷新容器列表
  containerRefreshInterval = setInterval(() => {
    if (currentView === 'containers' && dockerInstalled) {
      loadContainers();
    }
  }, 30000);
}

function stopContainerAutoRefresh() {
  if (containerRefreshInterval) {
    clearInterval(containerRefreshInterval);
    containerRefreshInterval = null;
  }
}

function renderContainers(containerList, statusFilter = '') {
  let filteredContainers = containerList;
  
  if (statusFilter) {
    filteredContainers = containerList.filter(container => 
      container.status.toLowerCase().includes(statusFilter.toLowerCase())
    );
  }
  
  if (filteredContainers.length === 0) {
    const message = containerList.length === 0 ? '暂无容器' : '没有匹配的容器';
    containersTableBody.innerHTML = `<div class="loading">${message}</div>`;
    return;
  }
  
  containersTableBody.innerHTML = filteredContainers.map((container, index) => {
    const statusText = container.status === 'running' ? '运行中' : '已停止';
    const statusClass = container.status.toLowerCase();
    
    return `
      <div class="table-row">
        <div class="table-cell">#${index + 1}</div>
        <div class="table-cell" title="${container.name}">
          ${container.name.length > 20 ? container.name.substring(0, 20) + '...' : container.name}
        </div>
        <div class="table-cell">
          <span class="container-status ${statusClass}">${statusText}</span>
        </div>
        <div class="table-cell" title="${container.image}">
          ${container.image.length > 25 ? container.image.substring(0, 25) + '...' : container.image}
        </div>
        <div class="table-cell">${container.ports || '-'}</div>
        <div class="table-cell">
          <div class="container-actions">
            ${container.status === 'running' ? 
              `<button class="btn btn-secondary" onclick="stopContainer('${container.id}')">停止</button>` :
              `<button class="btn btn-primary" onclick="startContainer('${container.id}')">启动</button>`
            }
            <button class="btn btn-danger" onclick="removeContainer('${container.id}')">删除</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function startContainer(containerId) {
  try {
    const result = await window.electronAPI.startContainer(containerId);
    if (result.success) {
      showToast('容器启动成功', 'success');
      loadContainers();
    } else {
      showToast('启动失败: ' + result.message, 'error');
    }
  } catch (error) {
    showToast('启动失败: ' + error.message, 'error');
  }
}

async function stopContainer(containerId) {
  try {
    const result = await window.electronAPI.stopContainer(containerId);
    if (result.success) {
      showToast('容器停止成功', 'success');
      loadContainers();
    } else {
      showToast('停止失败: ' + result.message, 'error');
    }
  } catch (error) {
    showToast('停止失败: ' + error.message, 'error');
  }
}

async function removeContainer(containerId) {
  if (!confirm('确定要删除这个容器吗？')) {
    return;
  }
  
  try {
    const result = await window.electronAPI.removeContainer(containerId);
    if (result.success) {
      showToast('容器删除成功', 'success');
      loadContainers();
    } else {
      showToast('删除失败: ' + result.message, 'error');
    }
  } catch (error) {
    showToast('删除失败: ' + error.message, 'error');
  }
}

// AI 控制台功能
const aiEndpoint = document.getElementById('aiEndpoint');
const aiModel = document.getElementById('aiModel');
const aiApiKey = document.getElementById('aiApiKey');
const aiPromptTemplate = document.getElementById('aiPromptTemplate');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

sendChatBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

function loadConsoleConfig() {
  // 从本地存储加载 AI 配置
  const savedConfig = localStorage.getItem('aiConfig');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    aiEndpoint.value = config.endpoint || 'https://api.openai.com/v1/chat/completions';
    aiModel.value = config.model || 'gpt-3.5-turbo';
    aiApiKey.value = config.apiKey || '';
    aiPromptTemplate.value = config.promptTemplate || aiPromptTemplate.value;
  }
}

function saveConsoleConfig() {
  const config = {
    endpoint: aiEndpoint.value,
    model: aiModel.value,
    apiKey: aiApiKey.value,
    promptTemplate: aiPromptTemplate.value
  };
  localStorage.setItem('aiConfig', JSON.stringify(config));
}

async function sendMessage() {
  const question = chatInput.value.trim();
  if (!question) return;
  
  // 保存配置
  saveConsoleConfig();
  
  // 添加用户消息
  addMessage('user', question);
  chatInput.value = '';
  
  // 显示加载状态
  const loadingId = addMessage('ai', '正在思考中...');
  
  try {
    const config = {
      endpoint: aiEndpoint.value,
      model: aiModel.value,
      apiKey: aiApiKey.value,
      promptTemplate: aiPromptTemplate.value
    };
    
    const result = await window.electronAPI.askAI(question, config);
    
    // 移除加载消息
    removeMessage(loadingId);
    
    if (result.success) {
      addAIResponse(result.commands);
    } else {
      addMessage('ai', '抱歉，生成指令时出现错误: ' + result.message);
    }
  } catch (error) {
    removeMessage(loadingId);
    addMessage('ai', '请求失败: ' + error.message);
  }
}

function addMessage(type, content) {
  const messageId = Date.now();
  const messageDiv = document.createElement('div');
  messageDiv.className = `chat-message message-${type}`;
  messageDiv.id = `message-${messageId}`;
  
  messageDiv.innerHTML = `
    <div class="message-content">${content}</div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageId;
}

function removeMessage(messageId) {
  const messageEl = document.getElementById(`message-${messageId}`);
  if (messageEl) {
    messageEl.remove();
  }
}

function addAIResponse(commands) {
  if (!commands || commands.length === 0) {
    addMessage('ai', '抱歉，无法生成有效的命令。请尝试重新描述你的问题。');
    return;
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message message-ai';
  
  const optionsHtml = commands.map((cmd, index) => `
    <div class="command-option" onclick="executeCommand('${cmd.replace(/'/g, "\\'")}')">
      <div class="command-number">${index + 1}</div>
      <div class="command-text">${escapeHtml(cmd)}</div>
    </div>
  `).join('');
  
  messageDiv.innerHTML = `
    <div class="message-content">
      为你生成了以下命令，点击数字执行：
      <div class="command-options">
        ${optionsHtml}
      </div>
    </div>
  `;
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

async function executeCommand(command) {
  if (!confirm(`确定要执行以下命令吗？\n\n${command}`)) {
    return;
  }
  
  addMessage('user', `执行命令: ${command}`);
  
  try {
    const result = await window.electronAPI.executeCommand(command);
    if (result.success) {
      addMessage('ai', `执行成功:\n${result.output}`);
    } else {
      addMessage('ai', `执行失败: ${result.message}`);
    }
  } catch (error) {
    addMessage('ai', `执行错误: ${error.message}`);
  }
}

function setQuickQuestion(question) {
  chatInput.value = question;
  chatInput.focus();
}

// Docker 控制功能
async function handleStopDocker() {
  if (!confirm('确定要停止 Docker 服务吗？所有运行中的容器将被停止。')) {
    return;
  }
  
  if (stopDockerBtn) stopDockerBtn.disabled = true;
  if (restartDockerBtn) restartDockerBtn.disabled = true;
  showToast('正在停止 Docker...', 'success');
  updateDockerStatus('stopping', '正在停止...');
  
  try {
    const result = await window.electronAPI.stopDocker();
    if (result.success) {
      showToast(result.message, 'success');
      updateDockerStatus('stopped', 'Docker 已停止');
      setTimeout(() => checkDockerStatus(), 2000);
    } else {
      showToast(result.message, 'success');
      updateDockerStatus('stopped', 'Docker 未运行');
      setTimeout(() => checkDockerStatus(), 2000);
    }
  } catch (error) {
    showToast('操作失败: ' + error.message, 'error');
    setTimeout(() => checkDockerStatus(), 2000);
  } finally {
    if (stopDockerBtn) stopDockerBtn.disabled = false;
    if (restartDockerBtn) restartDockerBtn.disabled = false;
  }
}

async function handleRestartDocker() {
  if (!confirm('确定要重启 Docker 服务吗？这可能需要 30-60 秒时间。')) {
    return;
  }
  
  if (restartDockerBtn) restartDockerBtn.disabled = true;
  if (stopDockerBtn) stopDockerBtn.disabled = true;
  showToast('正在重启 Docker...', 'success');
  updateDockerStatus('restarting', '正在重启...');
  
  try {
    const result = await window.electronAPI.restartDocker();
    if (result.success) {
      showToast(result.message, 'success');
      let attempts = 0;
      const maxAttempts = 12;
      
      const checkInterval = setInterval(async () => {
        attempts++;
        const status = await window.electronAPI.checkDockerStatus();
        
        if (status.running) {
          clearInterval(checkInterval);
          updateDockerStatus('running', 'Docker 运行中');
          showToast('Docker 已成功启动', 'success');
          if (restartDockerBtn) restartDockerBtn.disabled = false;
          if (stopDockerBtn) stopDockerBtn.disabled = false;
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          updateDockerStatus('unknown', 'Docker 启动超时，请手动检查');
          showToast('Docker 启动超时，请手动检查', 'error');
          if (restartDockerBtn) restartDockerBtn.disabled = false;
          if (stopDockerBtn) stopDockerBtn.disabled = false;
        } else {
          updateDockerStatus('restarting', `正在启动... (${attempts * 5}s)`);
        }
      }, 5000);
    } else {
      showToast('重启失败: ' + result.message, 'error');
      updateDockerStatus('unknown', '状态未知');
      if (restartDockerBtn) restartDockerBtn.disabled = false;
      if (stopDockerBtn) stopDockerBtn.disabled = false;
    }
  } catch (error) {
    showToast('重启失败: ' + error.message, 'error');
    updateDockerStatus('unknown', '状态未知');
    if (restartDockerBtn) restartDockerBtn.disabled = false;
    if (stopDockerBtn) stopDockerBtn.disabled = false;
  }
}

function updateDockerStatus(status, text) {
  if (dockerStatus) dockerStatus.className = `status-indicator ${status}`;
  if (dockerStatusText) dockerStatusText.textContent = text;
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

// 初始化应用
function initApp() {
  console.log('Initializing app...');
  
  // 初始化 Docker 元素
  initDockerElements();
  
  // 添加事件监听器
  if (diskSizeSlider) {
    diskSizeSlider.addEventListener('input', (e) => {
      if (diskValue) diskValue.textContent = e.target.value;
    });
  }
  
  if (memorySizeSlider) {
    memorySizeSlider.addEventListener('input', (e) => {
      if (memoryValue) memoryValue.textContent = e.target.value;
    });
  }
  
  if (cpuCoresSlider) {
    cpuCoresSlider.addEventListener('input', (e) => {
      if (cpuValue) cpuValue.textContent = e.target.value;
    });
  }
  
  // 保存 Docker 配置
  if (saveDockerConfigBtn) {
    saveDockerConfigBtn.addEventListener('click', () => {
      const config = {
        diskSize: parseInt(diskSizeSlider?.value || 64),
        memory: parseInt(memorySizeSlider?.value || 4),
        cpus: parseInt(cpuCoresSlider?.value || 2),
        registryMirror: registryMirror?.value || '',
        experimental: enableExperimental?.checked || false,
        buildKit: enableBuildKit?.checked !== false
      };
      
      saveDockerConfig(config);
    });
  }
  
  // 重置 Docker 配置
  if (resetDockerConfigBtn) {
    resetDockerConfigBtn.addEventListener('click', () => {
      if (confirm('确定要重置为默认配置吗？')) {
        resetDockerConfigToDefault();
      }
    });
  }
  
  // Docker 控制按钮
  if (stopDockerBtn) {
    stopDockerBtn.addEventListener('click', handleStopDocker);
  }
  
  if (restartDockerBtn) {
    restartDockerBtn.addEventListener('click', handleRestartDocker);
  }
  
  // 加载应用数据
  loadInstalledApps();
}

// 确保 DOM 完全加载后再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
