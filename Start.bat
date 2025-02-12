@echo off
title Tool MemesWar@zepmoo

setlocal

:: Mở terminal tại thư mục hiện tại
cd /d %~dp0

:: In ra câu chào
echo Tool MemesWar@zepmoo

:: Kiểm tra phiên bản Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js chua duoc cai dat. Vui long cai dat Node.js truoc.
    exit /b 1
)

:: Kiểm tra và cài đặt các package nếu chưa được cài đặt
if not exist node_modules (
    echo Dang cai dat cac package...
    npm install
    if %errorlevel% neq 0 (
        echo Co loi xay ra khi cai dat cac package.
        exit /b 1
    )
)

echo Dang chay Tool MemesWar@zepmoo
node memecore.js

:: pause
pause

endlocal
