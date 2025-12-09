@echo off
echo 正在启动 Scoop Manager...
echo.

cd /d "%~dp0"
start "" "Scoop Manager.exe" 2>&1

if errorlevel 1 (
    echo.
    echo 启动失败！错误代码: %errorlevel%
    echo.
    echo 可能的原因：
    echo 1. 缺少必要的 DLL 文件
    echo 2. 权限不足
    echo 3. 被杀毒软件拦截
    echo.
    pause
) else (
    echo 启动成功！
    timeout /t 2 >nul
)
