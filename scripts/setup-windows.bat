@echo off
REM QMS v0.4 — Pilot Setup (Windows CMD)
REM Run this from the project root directory (where package.json lives).

echo === QMS v0.4 — Pilot Setup (Windows) ===
echo.

REM ── Prerequisites ────────────────────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed. Install Node.js 20+ first.
    exit /b 1
)
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed.
    exit /b 1
)
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: git is not installed.
    exit /b 1
)

echo Node: 
node -v
echo npm: 
call npm -v

REM ── Environment ──────────────────────────────────────────────────────────
if not exist .env (
    if exist .env.example (
        echo WARN: .env not found. Copying .env.example to .env
        copy .env.example .env
        echo WARN: Edit .env and set JWT_SECRET before going live!
    ) else (
        echo ERROR: .env and .env.example both missing. Create .env first.
        exit /b 1
    )
)

REM ── Uploads directory ────────────────────────────────────────────────────
if not exist "public\uploads" mkdir "public\uploads"
echo OK: public\uploads ready

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

echo --- Seeding demo data ---
call npx prisma db seed

REM ── Build ────────────────────────────────────────────────────────────────
echo.
echo --- Building production bundle ---
call npm run build

echo.
echo === Setup complete ===
echo.
echo Next step: start the server
echo.
echo   scripts\start-windows.bat
echo.
