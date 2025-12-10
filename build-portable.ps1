# Scoop Manager 便携版打包脚本
# PowerShell 脚本用于创建便携版应用

Write-Host "开始打包 Scoop Manager 便携版..." -ForegroundColor Green

# 设置中国镜像加速
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR = "https://npmmirror.com/mirrors/electron-builder-binaries/"
$env:CSC_IDENTITY_AUTO_DISCOVERY = "false"

# 清理旧的打包文件
Write-Host "清理旧文件..." -ForegroundColor Yellow
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# 创建打包目录
Write-Host "创建打包目录..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "dist\manual" | Out-Null
New-Item -ItemType Directory -Force -Path "dist\manual\resources\app" | Out-Null
New-Item -ItemType Directory -Force -Path "dist\manual\resources\app\node_modules" | Out-Null

# 复制 Electron 运行时
Write-Host "复制 Electron 运行时..." -ForegroundColor Yellow
Copy-Item -Recurse "node_modules\electron\dist\*" "dist\manual\"

# 复制应用文件
Write-Host "复制应用文件..." -ForegroundColor Yellow
$appFiles = @("*.js", "*.html", "*.css", "*.json", "*.conf", "*.md")
foreach ($pattern in $appFiles) {
    Copy-Item $pattern "dist\manual\resources\app\" -ErrorAction SilentlyContinue
}

# 复制必要的 node_modules
Write-Host "复制依赖模块..." -ForegroundColor Yellow
$modules = @("better-sqlite3", "node-fetch", "bindings", "file-uri-to-path")
foreach ($module in $modules) {
    $sourcePath = "node_modules\$module"
    $destPath = "dist\manual\resources\app\node_modules\$module"
    
    if (Test-Path $sourcePath) {
        New-Item -ItemType Directory -Force -Path $destPath | Out-Null
        Copy-Item -Recurse "$sourcePath\*" $destPath
        Write-Host "  ✓ 复制 $module" -ForegroundColor Green
    } else {
        Write-Host "  ✗ 未找到 $module" -ForegroundColor Red
    }
}

# 重命名可执行文件
Write-Host "重命名可执行文件..." -ForegroundColor Yellow
Rename-Item "dist\manual\electron.exe" "Scoop Manager.exe"

# 创建便携版压缩包
Write-Host "创建便携版压缩包..." -ForegroundColor Yellow
Compress-Archive -Path "dist\manual\*" -DestinationPath "dist\ScoopManager-Portable.zip" -Force

# 显示结果
Write-Host "`n打包完成！" -ForegroundColor Green
Write-Host "便携版目录: dist\manual\" -ForegroundColor Cyan
Write-Host "便携版压缩包: dist\ScoopManager-Portable.zip" -ForegroundColor Cyan

$zipSize = (Get-Item "dist\ScoopManager-Portable.zip").Length / 1MB
Write-Host "压缩包大小: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Cyan

Write-Host "`n使用方法:" -ForegroundColor Yellow
Write-Host "1. 解压 ScoopManager-Portable.zip" -ForegroundColor White
Write-Host "2. 双击 'Scoop Manager.exe' 运行" -ForegroundColor White
Write-Host "3. 或使用启动脚本: '启动 Scoop Manager.bat'" -ForegroundColor White