# GitHub 发布指南

## 步骤 1: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名称: `scoop-manager`
3. 描述: `A modern visual package manager for Scoop with Docker integration`
4. 选择 Public
5. 不要初始化 README（我们已经有了）
6. 点击 "Create repository"

## 步骤 2: 推送代码到 GitHub

在项目目录中运行以下命令（替换 YOUR_USERNAME 为你的 GitHub 用户名）：

```bash
git remote add origin https://github.com/YOUR_USERNAME/scoop-manager.git
git branch -M main
git push -u origin main
```

## 步骤 3: 创建第一个 Release

1. 在 GitHub 仓库页面，点击 "Releases"
2. 点击 "Create a new release"
3. Tag version: `v1.0.0`
4. Release title: `Scoop Manager v1.0.0`
5. 描述发布内容
6. 点击 "Publish release"

## 步骤 4: 自动构建

GitHub Actions 会自动构建应用并上传到 Release 页面。

## 本地命令

如果你想在本地推送，运行：

```bash
# 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/scoop-manager.git

# 推送到 GitHub
git push -u origin master

# 创建并推送标签
git tag v1.0.0
git push origin v1.0.0
```

## 项目特点

✅ 完整的 Electron 应用
✅ SQLite 数据库集成
✅ Docker 配置管理
✅ 现代化 UI 设计
✅ 自动化构建流程
✅ MIT 开源许可证