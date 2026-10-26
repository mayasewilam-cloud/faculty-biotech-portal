@echo off
title Upload Faculty Portal to GitHub
echo ========================================================
echo   Uploading Faculty Biotech Portal to your GitHub
echo   Repository: https://github.com/mayasewilam-cloud/faculty-biotech-portal.git
echo ========================================================
echo.

cd /d "%~dp0"

echo Current directory: %CD%
echo.
echo Setting remote origin...
git remote set-url origin https://github.com/mayasewilam-cloud/faculty-biotech-portal.git

echo.
echo Pushing all files, folders (src, public, app) to GitHub...
echo If a browser window pops up, click 'Sign in with your browser'.
echo.

git push -u origin main --force

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================================
    echo   SUCCESS! All files and folders have been uploaded!
    echo   You can now go to Vercel and it will build and deploy!
    echo ========================================================
) else (
    echo ========================================================
    echo   Push encountered an error. Please check your GitHub login.
    echo ========================================================
)

echo.
pause
