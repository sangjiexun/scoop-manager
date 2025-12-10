# 新功能测试指南

## 已添加的功能

### 1. 左下角齿轮设置按钮
- 位置：侧边栏底部
- 功能：点击打开设置弹窗

### 2. 设置弹窗功能
包含以下设置选项：

#### 开机自动启动
- 设置应用是否随系统启动时自动运行
- 使用 Electron 的 `setLoginItemSettings` API

#### 启动时最小化到托盘
- 应用启动后直接最小化到系统托盘

#### 关闭时最小化到托盘
- 点击关闭按钮时最小化到托盘而不是退出
- 默认启用

### 3. 隐藏顶部菜单栏
- 使用 `autoHideMenuBar: true` 隐藏 File 等菜单栏
- 提供更简洁的界面

## 测试步骤

1. 启动应用：`npm start`
2. 查看左下角是否有齿轮图标
3. 点击齿轮图标打开设置弹窗
4. 测试各个开关功能
5. 保存设置并验证是否生效
6. 确认顶部菜单栏已隐藏

## 技术实现

- **前端**：HTML + CSS + JavaScript
- **后端**：Electron Main Process
- **数据存储**：SQLite (better-sqlite3)
- **进程通信**：IPC (Inter-Process Communication)