# Sprint 2.3C — Codex Brief

## Scope: Due Date / Overdue Tracking (Audit + CAPA only)

---

## 1. Overdue Logic (Exact Rule)

### Audit
```
isOverdue = scheduleDate < today && status NOT IN ("Completed", "Cancelled")
```
- **scheduleDate < today** : เปรียบเทียบเป็นวัน (midnight UTC)
- **ยกเว้น** Completed/Cancelled = ไม่นับ overdue

### CAPA
```
isOverdue = targetDate < today && status NOT IN ("Closed")
```
- **targetDate < today** : เปรียบเทียบเป็นวัน (midnight UTC)
- **ยกเว้น** Closed = ไม่นับ overdue

### Date comparison (critical!)
- ใช้ `new Date().toISOString().slice(0, 10)` → `YYYY-MM-DD`
- เปรียบเทียบ string date แทน DateTime เพื่อไม่ให้เวลา (time) มีผล
- Audit ที่ scheduleDate = today → NOT overdue (ยังไม่ถึงวันพรุ่งนี้)

---

## 2. Files to Edit

| ไฟล์ | การเปลี่ยนแปลง | ขนาด |
|------|---------------|------|
| `src/app/api/audits/route.ts` | +`isOverdue` ใน response GET | 🟢 เล็ก |
| `src/app/api/capas/route.ts` | +`isOverdue` ใน response GET | 🟢 เล็ก |
| `src/app/api/audits/[id]/route.ts` | Patch: +`logActivity` ที่ status change | 🟢 เล็ก |
| `src/app/api/capas/[id]/route.ts` | Patch: +`logActivity` ที่ status change | 🟢 เล็ก |
| `src/app/page.tsx` | Dashboard: +Overdue KPI card(s) | 🟡 กลาง |
| `src/app/audits/page.tsx` | +Overdue badge ในตาราง | 🟢 เล็ก |
| `src/app/capas/page.tsx` | +Overdue badge ในตาราง | 🟢 เล็ก |

**รวม:** 7 ไฟล์ — ทุกไฟล์เป็นการแก้ไข (เพิ่ม) ไม่มีเขียนใหม่

---

## 3. API Routes ที่ต้องแก้

### GET /api/audits — เพิ่ม `isOverdue` field
```typescript
// ที่ 1 computation helper
function isOverdue(date: Date): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10) < today;
}

// ที่ 2 map response
const audits = await prisma.audit.findMany({...});
return Response.json(audits.map(a => ({
  ...a,
  isOverdue: isOverdue(a.scheduleDate) && !["Completed", "Cancelled"].includes(a.status),
})));
```

### GET /api/capas — เพิ่ม `isOverdue` field
```typescript
const capas = await prisma.cAPA.findMany({...});
return Response.json(capas.map(c => ({
  ...c,
  isOverdue: isOverdue(c.targetDate) && c.status !== "Closed",
})));
```

### PATCH /api/audits/[id] — +logActivity (Activity Log)
```typescript
import { logActivity } from "@/lib/activity";
// ...inside PATCH:
if (body.status) {
  logActivity(auth.session.id, "audit.status_changed", {
    auditId: id,
    status: body.status,
  });
}
```

### PATCH /api/capas/[id] — +logActivity (Activity Log)
```typescript
if (body.status) {
  logActivity(auth.session.id, "capa.status_changed", {
    capaId: id,
    status: body.status,
  });
}
if (body.targetDate) {
  logActivity(auth.session.id, "capa.due_date_changed", {
    capaId: id,
    targetDate: body.targetDate,
  });
}
```

---

## 4. UI Pages ที่ต้องแก้

### Dashboard (`/`)
ปัจจุบันมี 3 KPI cards: เอกสารทั้งหมด, การตรวจประเมิน, CAPA เปิดอยู่

**เพิ่ม KPI card ตัวที่ 4:** "ค้างส่ง" (Overdue)
```typescript
const overdueCount = data.audits.filter(a => a.isOverdue).length + 
                    data.capas.filter(c => c.isOverdue).length;

{kpis.push({ label: "ค้างส่ง", value: overdueCount, urgent: true })}
```

ถ้าทำได้ไม่ใหญ่ แยกเป็น:
- "ตรวจค้าง" (Audit overdue count)
- "CAPA ค้าง" (CAPA overdue count)

### Audit Page (`/audits`)
- เพิ่ม `<span>` overdue badge ข้าง status badge ถ้า `audit.isOverdue === true`
- Badge ข้อความ: "เกินกำหนด"
- สี: แดงอมส้ม (bg-rose-100 text-rose-800)

### CAPA Page (`/capas`)
- เพิ่ม `<span>` overdue badge ข้าง status badge ถ้า `capa.isOverdue === true`
- Badge ข้อความ: "เกินกำหนด"
- สี: แดงอมส้ม (bg-rose-100 text-rose-800)

---

## 5. ต้องแก้ schema.prisma หรือไม่

**ไม่ต้อง** — `scheduleDate` และ `targetDate` มีอยู่แล้วใน schema  
`status` field ก็มีอยู่แล้ว ใช้ string เปรียบเทียบได้เลย  
`isOverdue` เป็น computed field (คำนวณตอน response) ไม่ได้เก็บใน DB

---

## 6. Risks

| Risk | Level | Mitigation |
|------|-------|-----------|
| Date comparison with time (scheduleDate=2026-06-27T15:00 > today=2026-06-27T00:00 = false alarm) | 🟡 Medium | ใช้ string YYYY-MM-DD เปรียบเทียบเสมอ |
| Timezone: server UTC ≠ user timezone (Bangkok +7) | 🟡 Medium | MVP ใช้ UTC ก่อน ถ้าต้องการแม่นยำค่อยปรับ |
| Audit/CAPA PATCH ไม่มี logActivity มาก่อน (ต้องเพิ่ม) | 🟢 Low | เพิ่ม logActivity call แบบเดียวกับ document routes |
| Performance: map() ทุก request | 🟢 Low | น้อยกว่า 10k records ไม่มีปัญหา |
| ห้ามกระทบ Approval Flow | 🟢 Low | ไม่แตะ document routes เลย |

---

## 7. Test Plan (14 Tests)

| # | Test | Category |
|---|------|----------|
| 1 | Audit future date → isOverdue = false | Audit |
| 2 | Audit past date, Completed → isOverdue = false | Audit |
| 3 | Audit past date, Scheduled → isOverdue = true | Audit |
| 4 | Audit past date, InProgress → isOverdue = true | Audit |
| 5 | Audit past date, Cancelled → isOverdue = false | Audit |
| 6 | CAPA future date → isOverdue = false | CAPA |
| 7 | CAPA past date, Closed → isOverdue = false | CAPA |
| 8 | CAPA past date, Open → isOverdue = true | CAPA |
| 9 | Dashboard KPI overdueCount ตรง | Dashboard |
| 10 | Audit page badge แสดง "เกินกำหนด" | UI |
| 11 | CAPA page badge แสดง "เกินกำหนด" | UI |
| 12 | PATCH audit status → logActivity | Activity |
| 13 | PATCH capa status/duedate → logActivity | Activity |
| 14 | Lint + Build ผ่าน | Gate |

---

## 8. DeepSeek vs Codex Split

### DeepSeek (ทำได้ — แค่ brief/test/review)
✅ เขียน brief นี้ (เสร็จแล้ว)  
✅ เขียน test script  
✅ ตรวจสอบผลลัพธ์หลัง Codex

### Codex (ต้องทำจริง)
Codex ต้องเขียนโค้ดทั้งหมด 7 ไฟล์:
1. `src/app/api/audits/route.ts` — +isOverdue + helper
2. `src/app/api/capas/route.ts` — +isOverdue + helper
3. `src/app/api/audits/[id]/route.ts` — +logActivity import + call
4. `src/app/api/capas/[id]/route.ts` — +logActivity import + call
5. `src/app/page.tsx` — Dashboard KPI overdue
6. `src/app/audits/page.tsx` — Overdue badge
7. `src/app/capas/page.tsx` — Overdue badge

**ลำดับ Codex ควรทำ:** API → Dashboard → Audit page → CAPA page

---

## 9. คำแนะนำ

1. **ไม่มี schema change** → ไม่ต้อง prisma generate/db push
2. **ยกเว้น "today" = เที่ยงคืน UTC** → ใช้ `.slice(0,10)` string compare
3. **ถ้า backend isOverdue field ไม่มีใน API** → Dashboard/Audit page ก็คำนวณ client-side ได้อีกชั้น (fallback)
4. **เข้มงวด** — ใช้ `status !== "Closed"` สำหรับ CAPA (ไม่ include "Verified" เพราะ schema ไม่มี)
5. **โล่งอก** — ไม่แตะ document modules เลย

---

รอพี่ Approve ก่อนเริ่มแก้โค้ดครับ 🙏
