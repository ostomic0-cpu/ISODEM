# Sprint 2.4 — Codex Brief: Demo Polish / UX / Mobile Responsive

---

## How I Analyzed

- Code review: all 9 pages + 5 API routes + sidebar + activity log
- Browser visual check: Dashboard, Login, Activity Log
- Tracked every `logActivity()` call to find missing action labels

---

## 1. MUST FIX (Before Demo — affect usability/credibility)

### MF1: Activity Page — Missing Thai action labels (7 items)

**File:** `src/app/activity/page.tsx`

**Problem:** The `actionLabels` map is missing these 7 actions — they show raw English names in the demo:

```
document.submitted    → "ส่งตรวจสอบ"
document.approved     → "อนุมัติเอกสาร"
document.rejected     → "ปฏิเสธเอกสาร"
document.obsoleted    → "ลบล้างเอกสาร"
audit.status_changed  → "เปลี่ยนสถานะตรวจประเมิน"
capa.status_changed   → "เปลี่ยนสถานะ CAPA"
capa.due_date_changed → "เปลี่ยนกำหนดแล้วเสร็จ"
```

**Fix:** Add 7 entries to `actionLabels` Record.

---

### MF2: Activity Page — Raw JSON metadata for unknown actions

**File:** `src/app/activity/page.tsx`, function `metadataDetail()`

**Problem:** When an action is NOT in the switch/case, the `default` branch returns raw JSON like:
```
{"capaId":"cmqwi...","status":"Closed"}
```
This affects `audit.status_changed`, `capa.status_changed`, `capa.due_date_changed`, `document.submitted`, `document.approved`, `document.rejected`, `document.obsoleted`.

**Fix:** Add 7 cases to `metadataDetail()` switch. Example formats:
- `document.submitted`: `"${docNumber}: ${title} → ส่งตรวจสอบ"`
- `document.approved`: `"${docNumber}: ${title} → อนุมัติ"`
- `document.rejected`: `"${docNumber}: ${title} → ปฏิเสธ (${reason})"`
- `document.obsoleted`: `"${docNumber}: ${title} → ลบล้าง"`
- `audit.status_changed`: `"${title} → ${status}"`
- `capa.status_changed`: `"CAPA #${id} → ${status}"`
- `capa.due_date_changed`: `"CAPA #${id} → ${targetDate}"`

---

### MF3: Dashboard "กิจกรรมล่าสุด" — items not clickable

**File:** `src/app/page.tsx`

**Problem:** The 5 most recent documents show title + status but are NOT links. Demo user can't click to see details.

**Fix:** Wrap title in `<Link href={"/documents/" + document.id}>` (use next/link).

---

### MF4: Audit/CAPA create — no success message

**Files:** `src/app/audits/page.tsx`, `src/app/capas/page.tsx`

**Problem:** After creating audit/CAPA, page reloads silently — no "สร้างสำเร็จ" message.

**Fix:** Add `success` state variable. After successful POST, show:
- Audits: "สร้างแผนตรวจประเมินสำเร็จ" (auto-hide after 3s)
- CAPAs: "สร้าง CAPA สำเร็จ" (auto-hide after 3s)

---

### MF5: Document Detail — success/error placement

**File:** `src/app/documents/[id]/page.tsx`

**Problem:** Success/error messages appear above the approval card, far from action buttons. On long pages user may scroll past them.

**Fix:** No structural change needed — the current placement (line 284-285) is between the status banner and the approval card. Consider making messages `sticky` or adding a brief toast effect (fade out). BUT the auto-hide timer already works (3s/5s). Minor priority.

---

## 2. SHOULD IMPROVE

### SI1: Sidebar mobile — horizontal scroll vs hamburger

**File:** `src/components/layout/sidebar.tsx`

**Current:** `overflow-x-auto` — items scroll horizontally on mobile. Works but not ideal.

**Suggestion:** For MVP, the horizontal scroll is acceptable. Can add hamburger later. **Defer to next sprint.**

---

### SI2: Audit detail — no status banner

**File:** `src/app/audits/[id]/page.tsx`

**Problem:** Unlike documents which have a colored status banner, audit detail has only a plain page header.

**Fix:** Add an `OverdueBadge` + status banner similar to documents, showing `scheduleDate`, overdue status, and a colored background.

**Effort:** Small (< 20 lines)

---

### SI3: CAPA detail — no overdue badge

**File:** `src/app/capas/[id]/page.tsx`

**Problem:** CAPA detail doesn't show overdue status, only `targetDate`.

**Fix:** Add `isOverdue` badge from API (already computed server-side). Show "เกินกำหนด" badge next to targetDate.

**Effort:** Tiny (< 5 lines)

---

### SI4: Dashboard "กิจกรรมล่าสุด" shows only documents

**File:** `src/app/page.tsx`

**Problem:** The activity section only shows `data.documents.slice(0,5)`. Doesn't show audits or CAPAs.

**Fix:** Fetch from `/api/activity?page=1&pageSize=5` instead, showing mixed activity feed. **But careful** — this adds a 3rd API call. For demo with few docs, acceptable.

**Alternative (simpler):** Merge recent audits + capas into the same list, with a brief label prefix.

---

### SI5: No dynamic page title

**File:** all pages

**Problem:** Browser tab always shows "QMS". Should show page-specific title.

**Fix:** Use Next.js `metadata` export or `<title>` in layout.

**Effort:** Small (add `<title>` or `metadata` per page)

---

### SI6: Table overflow on mobile — audit/CAPA

**Files:** `src/app/audits/page.tsx`, `src/app/capas/page.tsx`

**Current:** `overflow-x-auto` on the Card wrapper. Works but finding descriptions get truncated.

**Fix:** Already acceptable for MVP. **Defer.**

---

## 3. NICE TO HAVE (After demo)

| Item | Effort | Notes |
|------|--------|-------|
| Breadcrumb navigation | Medium | Good for UX but not essential for demo |
| Loading skeleton | Medium | Replace "กำลังโหลด..." with skeleton shimmer |
| PDF/Excel export | Large | Future sprint |
| Dark mode | Medium | Future sprint |
| Toast component | Medium | Reusable success/error toasts instead of inline text |

---

## Files to Edit (Sprint 2.4 Scope)

| # | File | Change | Effort |
|---|------|--------|--------|
| MF1 | `src/app/activity/page.tsx` | +7 Thai action labels | 🟢 3 min |
| MF2 | `src/app/activity/page.tsx` | +7 metadata detail cases | 🟢 10 min |
| MF3 | `src/app/page.tsx` | Link title to document detail | 🟢 2 min |
| MF4 | `src/app/audits/page.tsx` | +success message for create | 🟢 5 min |
| MF4 | `src/app/capas/page.tsx` | +success message for create | 🟢 5 min |
| SI2 | `src/app/audits/[id]/page.tsx` | +status banner | 🟡 15 min |
| SI3 | `src/app/capas/[id]/page.tsx` | +overdue badge | 🟢 2 min |
| SI4 | `src/app/page.tsx` | Better activity feed | 🟡 20 min |
| SI5 | All pages | Dynamic page titles | 🟡 15 min |

**Total effort:** ~1.5-2 hours (Codex time)

---

## Test Plan

1. Activity page shows Thai labels for all 7 new action types
2. Activity page shows readable text (not raw JSON) for metadata
3. Dashboard "กิจกรรมล่าสุด" items link to document detail
4. Audit create shows success message "สร้างแผนตรวจประเมินสำเร็จ"
5. CAPA create shows success message "สร้าง CAPA สำเร็จ"
6. Audit detail shows status banner
7. CAPA detail shows "เกินกำหนด" badge when overdue
8. Dynamic page title updates correctly per page
9. `npm run lint` passes
10. `npm run build` passes

---

**Let user approve before Codex executes.**
