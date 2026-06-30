# ⚙ QMS v0.4 — คู่มือติดตั้งระบบนำร่อง (Pilot Deployment Guide)

> ระบบบริหารคุณภาพ (Quality Management System) สำหรับนำร่องทดสอบ ก่อนใช้งานจริง  
> QMS Pilot Kit for v0.4 — Department hierarchy, severity, priority, dashboard filters

---

## 1. ระบบนี้คืออะไร (What is QMS?)

QMS (Quality Management System) เป็นระบบบริหารจัดการเอกสารคุณภาพ การตรวจประเมิน (Audit) และการแก้ไขข้อบกพร่อง (CAPA) สำหรับโรงงานอุตสาหกรรม  
**เวอร์ชัน v0.4** เพิ่มระบบแผนกแบบลำดับชั้น (Division → Section), การจัดระดับความรุนแรงของข้อค้นพบ (OBS/OFI/MINOR/MAJOR/CAR), การจัดลำดับความสำคัญของ CAPA (Low/Medium/High/Critical), Dashboard แสดงสถิติ และระบบกรองข้อมูล

### ผู้ใช้ทดสอบ (Demo Accounts)

| บทบาท | อีเมล | สิทธิ์ |
|--------|-------|--------|
| Admin | admin@qms.local | จัดการทุกอย่าง |
| QA | qa@qms.local | ประกันคุณภาพ — สร้าง/แก้ไขเอกสาร, ตรวจประเมิน, CAPA |
| Engineer | engineer@qms.local | วิศวกร — อ่านเอกสาร, ดูรายงาน |

⚠ **เปลี่ยนรหัสผ่านทันทีหลังติดตั้งครั้งแรก!** (ดูหัวข้อ Security)

---

## 2. ความต้องการขั้นต่ำ (Minimum Requirements)

| รายการ | Linux / WSL | Windows |
|--------|-------------|---------|
| **OS** | Ubuntu 22.04+, Debian 12+, WSL2 | Windows 10/11 |
| **Node.js** | 20.x LTS | 20.x LTS |
| **npm** | 10+ | 10+ |
| **RAM** | 2 GB (4 GB แนะนำ) | 2 GB (4 GB แนะนำ) |
| **พื้นที่ว่าง** | 500 MB | 500 MB |
| **Git** | git 2.x | git for Windows |

---

## 3. ติดตั้งบน Linux / WSL

```bash
# 1. Clone repository
git clone https://github.com/ostomic0-cpu/ISODEM.git qms-app
cd qms-app

# 2. ตรวจสอบ v0.4
git checkout v0.4

# 3. รันสคริปต์ติดตั้งอัตโนมัติ
bash scripts/deploy-linux.sh

# 4. เริ่มเซิร์ฟเวอร์
bash scripts/start-linux.sh
```

**ทีละขั้นตอน (Manual):**

```bash
# Environment
cp .env.example .env
# แก้ไข JWT_SECRET ใน .env ก่อนเริ่มใช้งาน

# สร้างโฟลเดอร์อัปโหลด
mkdir -p public/uploads

# ติดตั้ง dependencies
npm install

# ฐานข้อมูล
npx prisma migrate deploy     # สร้างตาราง
npx prisma generate            # สร้าง Prisma client
npx prisma db seed             # ใส่ข้อมูลตัวอย่าง

# Build
npm run build

# Start
NODE_OPTIONS="--max-old-space-size=1024" npx next start -p 3000
```

---

## 4. ติดตั้งบน Windows CMD

```cmd
REM 1. Clone repository
git clone https://github.com/ostomic0-cpu/ISODEM.git qms-app
cd qms-app

REM 2. ตรวจสอบ v0.4
git checkout v0.4

REM 3. รันสคริปต์ติดตั้งอัตโนมัติ
scripts\setup-windows.bat

REM 4. เริ่มเซิร์ฟเวอร์
scripts\start-windows.bat
```

**ทีละขั้นตอน (Manual):**

```cmd
REM Environment
copy .env.example .env
REM แก้ไข JWT_SECRET ใน .env ก่อนเริ่มใช้งาน

REM สร้างโฟลเดอร์อัปโหลด
if not exist "public\uploads" mkdir "public\uploads"

REM ติดตั้ง dependencies
npm install

REM ฐานข้อมูล
npx prisma migrate deploy
npx prisma generate
npx prisma db seed

REM Build
npm run build

REM Start
set NODE_OPTIONS=--max-old-space-size=1024
npx next start -p 3000
```

---

## 5. การใช้งานประจำวัน (Daily Operations)

### เริ่มเซิร์ฟเวอร์

| Platform | คำสั่ง |
|----------|--------|
| Linux/WSL | `bash scripts/start-linux.sh` |
| Windows | `scripts\start-windows.bat` |
| Manual | `NODE_OPTIONS="--max-old-space-size=1024" npx next start -p 3000` |

### หยุดเซิร์ฟเวอร์

| Platform | คำสั่ง |
|----------|--------|
| Linux/WSL | กด `Ctrl+C` หรือ `fuser -k 3000/tcp` |
| Windows | กด `Ctrl+C` |

### รีสตาร์ท

| Platform | คำสั่ง |
|----------|--------|
| Linux/WSL | `fuser -k 3000/tcp && sleep 1 && bash scripts/start-linux.sh` |
| Windows | `Ctrl+C` แล้วรัน `scripts\start-windows.bat` อีกครั้ง |

### เริ่มใหม่ทั้งระบบ (Clean restart)

```bash
fuser -k 3000/tcp 2>/dev/null; sleep 1; bash scripts/start-linux.sh
```

---

## 6. อัปเดตระบบ (Update)

```bash
# Linux/WSL
bash scripts/update-linux.sh

# Windows
scripts\update-windows.bat
```

**คำสั่งด้วยตนเอง:**

```bash
# 1. Backup ก่อน
bash scripts/backup.sh

# 2. ดึงโค้ดล่าสุด
git fetch --all --tags
git checkout v0.4

# 3. ติดตั้ง + ฐานข้อมูล + build
npm install
npx prisma migrate deploy
npx prisma generate
npm run build

# 4. รีสตาร์ทเซิร์ฟเวอร์
```

---

## 7. การสำรองข้อมูล (Backup)

### อัตโนมัติ

```bash
bash scripts/backup.sh
```

สร้างไฟล์备份ใน `backups/`:
- `backups/dev-YYYYMMDD-HHMMSS.db` — ฐานข้อมูล
- `backups/uploads-YYYYMMDD-HHMMSS/` — ไฟล์อัปโหลด

**เก็บไฟล์备份ไว้ 7 ชุดล่าสุด** — ชุดเก่าถูกลบอัตโนมัติ

### Manual

```bash
# Database
cp prisma/dev.db backups/dev-manual-$(date +%F-%H%M).db

# Uploads
cp -r public/uploads backups/uploads-manual-$(date +%F-%H%M)
```

### ตั้ง Cron Backup (Linux/WSL)

```bash
crontab -e
# เพิ่มบรรทัด:
0 2 * * * cd /home/your-user/qms-app && bash scripts/backup.sh
```

---

## 8. การกู้คืนข้อมูล (Restore)

```bash
# 1. หยุดเซิร์ฟเวอร์
pm2 stop qms-app   # หรือ fuser -k 3000/tcp

# 2. คืนค่า Database
cp backups/dev-20260630-120000.db prisma/dev.db

# 3. คืนค่า Uploads
rm -rf public/uploads
cp -r backups/uploads-20260630-120000 public/uploads

# 4. รีสตาร์ท
pm2 restart qms-app
```

---

## 9. แนวทางปฏิบัติด้านความปลอดภัย (Security Checklist)

- [ ] **เปลี่ยนรหัสผ่าน demo** — Admin123!, Qa123!, Engineer123!
- [ ] **เปลี่ยน JWT_SECRET** — `openssl rand -hex 32` แล้วใส่ใน `.env`
- [ ] **ไม่เปิดเผย `.env`** — `.env` อยู่ใน `.gitignore` อยู่แล้ว
- [ ] **ตรวจสอบผู้ใช้** — ลบบัญชีทดสอบที่ไม่จำเป็น
- [ ] **อัปเดต Node.js** — ใช้ LTS เวอร์ชันล่าสุด
- [ ] **เปิด firewall** — จำกัดการเข้าถึง port 3000 เฉพาะผู้ที่เกี่ยวข้อง

---

## 10. ปัญหาที่พบบ่อย (Common Problems)

### "Port 3000 is already in use"

```bash
# Linux/WSL: หยุด process ที่ใช้ port 3000
fuser -k 3000/tcp

# Windows: หา PID แล้ว kill
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### ".env not found"

```bash
cp .env.example .env
# แล้วแก้ไข JWT_SECRET ใน .env
```

### "Database does not exist" / "Prisma migrations not run"

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

### "Cannot find module" / "Module not found"

```bash
npm install
npm run build
```

### "Exit 137" / "OOM" (Out of Memory)

`NODE_OPTIONS="--max-old-space-size=1024"` ช่วยลดการใช้ RAM  
ถ้ายังมีปัญหา → เพิ่ม RAM เครื่อง หรือใช้ VPS

### "404 on page refresh" (ถ้าใช้ Static Export)

ระบบนี้ใช้ `next start` (Node.js server) — รองรับ refresh ทุกหน้า

### "Uploads folder missing"

```bash
mkdir -p public/uploads
```

---

## 11. การเชื่อมต่อจากเครื่องอื่น (Remote Access)

### ใช้ Cloudflare Tunnel (ฟรี)

```bash
# ติดตั้ง cloudflared
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

# รัน tunnel
cloudflared tunnel --url http://localhost:3000
```

ได้ URL `https://xxxx.trycloudflare.com` — แชร์ให้ผู้ทดสอบเข้าใช้ได้

---

## 12. ถ้ายังไม่เคยติดตั้ง Node.js

### Linux / WSL (Ubuntu)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
node -v
npm -v
```

### Windows

ดาวน์โหลดจาก https://nodejs.org (เลือก LTS 20.x)  
ติดตั้ง → รีสตาร์ท CMD → `node -v`

---

## License

Internal use — QMS App v0.4  
Copyright © 2026
