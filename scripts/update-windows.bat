@echo off
REM QMS v0.4 — Update App (Windows CMD)
REM Run this from the project root directory.
REM
REM Usage:
REM   scripts\update-windows.bat           update to latest v0.4
REM   scripts\update-windows.bat v0.4      update to specific tag

set VERSION=v0.4
if not "%1"=="" set VERSION=%1

echo === QMS v0.4 — Update to %VERSION% (Windows) ===

REM ── Backup guidance ──────────────────────────────────────────────────────
echo.
echo IMPORTANT: Backup your database and uploads manually before updating:
echo   Copy prisma\dev.db to a safe location
echo   Copy public\uploads\ to a safe location
echo.

REM ── Git pull ─────────────────────────────────────────────────────────────
echo --- Fetching latest tags ---
call git fetch --all --tags

echo --- Checking out %VERSION% ---
call git checkout %VERSION%

REM ── Install dependencies ─────────────────────────────────────────────────
echo.
echo --- Installing dependencies ---
call npm install

REM ── Database ─────────────────────────────────────────────────────────────
echo.
echo --- Running database migrations ---
call npx prisma migrate deploy

echo --- Generating Prisma client ---
call npx prisma generate

REM ── Build ────────────────────────────────────────────────────────────────
echo.
echo --- Building production bundle ---
call npm run build

echo.
echo === Update complete ===
echo.
echo Restart the server to apply changes:
echo   scripts\start-windows.bat
echo.
