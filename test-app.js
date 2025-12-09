// 测试打包后的应用
const { spawn } = require('child_process');
const path = require('path');

const appPath = path.join(process.env.USERPROFILE, 'Desktop', 'ScoopManager', 'Scoop Manager.exe');

console.log('尝试启动应用:', appPath);

const child = spawn(appPath, [], {
  detached: true,
  stdio: 'ignore'
});

child.unref();

console.log('应用已启动，PID:', child.pid);

setTimeout(() => {
  console.log('如果应用没有显示窗口，可能存在以下问题：');
  console.log('1. 被杀毒软件拦截');
  console.log('2. 缺少必要的依赖');
  console.log('3. 数据库文件权限问题');
  process.exit(0);
}, 3000);
