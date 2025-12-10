# Scoop Manager 打包指南

## 🚀 快速打包

### 方法一：使用 npm 脚本（推荐）
```bash
npm run build:portable
```

### 方法二：使用 PowerShell 脚本
```powershell
.\build-portable.ps1
```

### 方法三：使用批处理文件
双击 `启动 Scoop Manager.bat`

## 📦 打包配置

### 中国镜像加速
项目已配置中国镜像源（`.npmrc`）：
- npm registry: https://registry.npmmirror.com/
- electron mirror: https://npmmirror.com/mirrors/electron/
- electron-builder binaries: https://npmmirror.com/mirrors/electron-builder-binaries/

### 依赖模块
打包时会自动复制以下必要模块：
- `better-sqlite3` - SQLite 数据库支持
- `node-fetch` - HTTP 请求库
- `bindings` - 原生模块绑定
- `file-uri-to-path` - 文件路径转换

## 📁 输出文件

打包完成后会生成：
- `dist/manual/` - 便携版目录
- `dist/ScoopManager-Portable.zip` - 便携版压缩包（约 109MB）

## 🔧 故障排除

### 权限问题
如果遇到权限错误，请：
1. 以管理员身份运行 PowerShell
2. 或使用 `build-portable.ps1` 脚本

### 模块缺失
如果应用启动时报模块错误：
1. 检查 `dist/manual/resources/app/node_modules/` 目录
2. 确保所有依赖模块都已正确复制
3. 重新运行打包脚本

### 网络问题
如果下载缓慢：
1. 确认 `.npmrc` 文件存在
2. 检查网络连接
3. 尝试使用 VPN

## 📋 版本信息

- Electron: 28.0.0
- Node.js: 兼容版本
- 平台: Windows x64
- 架构: 便携版（无需安装）

## 🎯 使用说明

1. 解压 `ScoopManager-Portable.zip`
2. 双击 `Scoop Manager.exe` 启动
3. 首次启动会创建数据库文件
4. 享受所有功能：数据库管理、设置配置、AI控制台等