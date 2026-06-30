@echo off
REM QMS v0.4 — Start Server (Windows CMD)
REM Run this from the project root directory.

set PORT=3000
if not "%1"=="" set PORT=%1

echo === QMS v0.4 — Starting server on port %PORT% ===
echo.
echo   URL: http://localhost:%PORT%
echo.

set NODE_OPTIONS=--max-old-space-size=1024
call npx next start -p %PORT%
