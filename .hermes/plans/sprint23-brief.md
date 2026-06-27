# Sprint 2.3 — Codex Brief

## Overall Scope
Two features:
1. **Task A**: Multi-Step Approval Flow (Draft → InReview → Approved → Obsolete + Reject)
2. **Task B**: Due Date / Overdue Tracking (CAPA + Audit first, Document later)

## Recommendation
**ทำ Task A (Approval Flow) ก่อน Task B (Due Date)**
เหตุผล:
- Approval Flow สัมผัส Document model โดยตรง — core QMS requirement
- Due Date ใช้ `scheduleDate`/`targetDate` ที่มีอยู่แล้ว → schema change เล็กน้อย
- แยก workload ไม่ให้ Codex ต้องแก้ 20+ ไฟล์พร้อมกัน

---

# TASK A: Multi-Step Approval Flow

## 1. Current Architecture Review

### Document Model (prisma/schema.prisma lines 62-76)
```prisma
model Document {
  id         String   @id @default(cuid())
  docNumber  String   @unique
  title      String
  category   String
  status     String   // Free-text: "Draft", "InReview", "Approved", "Obsolete"
  ownerId    String
  owner      User     @relation(fields: [ownerId], references: [id])
  department String
  folderId   String
  folder     Folder   @relation(fields: [folderId], references: [id])
  versions   DocumentVersion[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model DocumentVersion {
  id               String    @id @default(cuid())
  versionNumber    String
  filePath         String
  changeSummary    String
  status           String    // Currently: "InReview" on new revisions
  submittedById    String
  submittedBy      User      @relation("SubmittedVersions")
  approvedById     String?
  approvedBy       User?     @relation("ApprovedVersions")
  documentId       String
  document         Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}
```

### Existing Routes:
- `GET /api/documents` — list paginated
- `POST /api/documents` — create + first version upload
- `GET /api/documents/[id]` — detail with versions
- `PATCH /api/documents/[id]` — update ANY field (NO protection)
- `POST /api/documents/[id]` — add new version (upload)
- `DELETE /api/documents/[id]` — delete

### Existing UI (documents/page.tsx + documents/[id]/page.tsx):
- Single-page form: create doc + filter/sort/paginate table
- Detail page: version list + "Add Version" form
- NO approval/rejection buttons yet
- NO status transition validation
- NO lock on Approved docs

## 2. Workflow State Machine

```
                    QA/Admin reject
                    +--- reason ---+
                    |              |
                    v              |
  [Draft] ──Engineer submit──→ [InReview]
    ^                              |
    |                    QA/Admin approve
    +──────────────────────+
                           |
                           v
                      [Approved] ──Admin──→ [Obsolete]
                           |
                    (if edit needed)
                           |
                    Engineer upload revision
                           |
                           v
                      [InReview]  (new cycle)
```

### Status Transition Matrix:
| From | To | Who | Condition |
|------|----|-----|-----------|
| Draft | InReview | Engineer (owner) | Session.userId === document.ownerId |
| InReview | Approved | QA/Admin | — |
| InReview | Draft | QA/Admin | Must include rejection reason |
| Approved | Obsolete | Admin only | — |
| Approved | InReview | Engineer (owner) | New version uploaded triggers re-review |
| Draft | (edit) | Engineer/QA/Admin | All metadata editable |
| Approved | (edit) | ❌ BLOCKED | Only version upload allowed |

## 3. Files to Edit

### Schema: `prisma/schema.prisma`
- Add `rejectReason` (String?) to DocumentVersion
- Add `approvalDate` (DateTime?) to Document
- Add `approvedById` (String?, relation) to Document (reuse existing User relation)

### API Routes (DeepSeek — save Codex tokens):
**New routes:**
- `src/app/api/documents/[id]/submit-review/route.ts`
- `src/app/api/documents/[id]/approve/route.ts`
- `src/app/api/documents/[id]/reject/route.ts`
- `src/app/api/documents/[id]/obsolete/route.ts`

**Modified routes:**
- `src/app/api/documents/[id]/route.ts` — PATCH: block metadata change on Approved docs; POST version: if doc is Approved, auto-set doc status to InReview
- `src/app/api/documents/route.ts` — POST create: always set status to "Draft" (remove status from form data)

### UI Pages (Codex — requires React component generation):
- `src/app/documents/[id]/page.tsx` — MAJOR update:
  - Show current status + workflow state indicator
  - Engineer: "Submit for Review" button (when Draft)
  - QA/Admin: "Approve" / "Reject with reason" buttons (when InReview)
  - Admin: "Mark Obsolete" button (when Approved)
  - Rejection reason modal/input
  - Show approval history
  - Lock metadata edit form when Approved (but still show read-only)

- `src/app/documents/page.tsx` — Minor:
  - Status filter options: Add "Draft", "InReview", "Approved", "Obsolete"
  - Table: Add status badge (already exists)

### Sidebar: `src/components/layout/sidebar.tsx`
- No changes needed (nav items same)

## 4. API Route Logic (DeepSeek Handles)

### POST /api/documents/[id]/submit-review
```typescript
// Validate: doc exists, status === "Draft", session.user === doc.ownerId
// Update: document.status = "InReview"
// Log: activity("document.submitted", { docNumber, title })
// Return: updated document
```

### POST /api/documents/[id]/approve
```typescript
// Validate: session.role === "Admin" || "QA", doc.status === "InReview"
// Update: document.status = "Approved", approvalDate = now(), approvedById = session.id
// Log: activity("document.approved", { docNumber })
// Return: updated document
```

### POST /api/documents/[id]/reject
```typescript
// Validate: session.role === "Admin" || "QA", doc.status === "InReview"
// Body: { reason: string }
// Validate: reason is required, non-empty
// Update: document.status = "Draft", latestVersion.rejectReason = reason
// Log: activity("document.rejected", { docNumber, reason })
// Return: updated document
```

### POST /api/documents/[id]/obsolete
```typescript
// Validate: session.role === "Admin", doc.status === "Approved"
// Update: document.status = "Obsolete"
// Log: activity("document.obsoleted", { docNumber })
```

### PATCH /api/documents/[id] Modification
```typescript
// If doc.status === "Approved" → return 400 "เอกสารที่อนุมัติแล้วไม่สามารถแก้ไขได้"
// Allow PATCH only for Draft/InReview docs
```

### POST /api/documents/[id] (Add Version) Modification
```typescript
// If doc.status === "Approved":
//   1. Create new version as before (status = "InReview")
//   2. Set document.status = "InReview" (re-trigger approval flow)
// Log: activity("revision.created", { docNumber, versionNumber })
```

### POST /api/documents (Create) Modification
```typescript
// Remove status from form data — always set to "Draft" on creation
// Log: activity("document.created", { docNumber, title })
```

## 5. UI Components Needed (Codex Handles)

### Document Detail Page Major Update:
1. **Status Banner**: Show current workflow step at top
2. **Workflow Action Buttons** (conditionally rendered by role + status):
   - Draft + Engineer owner: "Submit for Review" button
   - InReview + QA/Admin: "Approve" + "Reject" buttons
   - Approved + Admin: "Mark Obsolete" button
   - Approved: Lock metadata edit form
3. **Rejection Modal**: When clicking Reject, show modal with textarea for reason + confirm
4. **Approval History**: Show list of approval/rejection events (from ActivityLog or version status)
5. **Version Table Enhancement**: Show approval status per version

### Document List Page Minor Update:
- Status filter: Already has "Draft", "Review", "Approved", "Archived" — rename "Review" to "InReview", change "Archived" to "Obsolete"
- Status badge: Already works with StatusBadge component

## 6. Activity Log Actions to Add
- `document.submitted` — { docNumber, title }
- `document.approved` — { docNumber, title }
- `document.rejected` — { docNumber, title, reason }
- `document.obsoleted` — { docNumber, title }

Update `ALLOWED_METADATA_KEYS` in `src/lib/activity.ts` to add `"reason"`.

---

# TASK B: Due Date / Overdue Tracking

## 1. Current Architecture Review

### Existing Date Fields:
- `Audit.scheduleDate` (DateTime) — audit scheduled date, can serve as due date
- `CAPA.targetDate` (DateTime) — CAPA target completion date, can serve as due date
- `Document` — NO date fields for deadlines
- `DocumentVersion` — NO date fields for review deadlines

### Dashboard (src/app/page.tsx):
- Currently shows: total counts (documents, audits, capas)
- Recent activity: top 5 documents by updatedAt
- NO overdue indicators

### Audit/CAPA APIs:
- `GET /api/audits` — returns flat array (no overdue flag)
- `GET /api/capas` — returns flat array (no overdue flag)

## 2. Design Decision

Per requirement: **Due Date เฉพาะ CAPA และ Audit ก่อน** (Document เลื่อนไป)
สาเหตุ:
- CAPA มี `targetDate` อยู่แล้ว — แค่เพิ่ม overdue calculation
- Audit มี `scheduleDate` อยู่แล้ว — แค่เพิ่ม overdue flag
- Document ต้องเพิ่ม `dueDate` field และออกแบบ workflow — scope ใหญ่เกิน

## 3. Schema Changes

### CAPA & Audit — NO schema change needed
Use existing dates:
- `Audit.scheduleDate` → เกินวันนี้ + status !== "Completed" = overdue
- `CAPA.targetDate` → เกินวันนี้ + status !== "Closed" = overdue

### Future Document:
- Add `dueDate` (DateTime?) to Document model — เลื่อนไป Sprint ถัดไป

## 4. API Routes to Modify (DeepSeek)

### GET /api/audits — add isOverdue
```typescript
const audits = await prisma.audit.findMany({ ... });
const now = new Date();
const result = audits.map(audit => ({
  ...audit,
  isOverdue: audit.scheduleDate < now && audit.status !== "Completed"
}));
return Response.json(result);
```

### GET /api/capas — add isOverdue
```typescript
const capas = await prisma.cAPA.findMany({ ... });
const now = new Date();
const result = capas.map(capa => ({
  ...capa,
  isOverdue: capa.targetDate < now && capa.status !== "Closed"
}));
return Response.json(result);
```

### Optional: Dedicated overdue endpoint (if needed)
- `GET /api/overdue` — returns { overdueAudits, overdueCapas, count }

## 5. UI Changes (Codex)

### Dashboard (src/app/page.tsx):
- Add "Overdue KPI" card: red-colored card showing number of overdue items (Audit + CAPA)
- Add "Overdue Items" section below recent activity

### Audit Page (src/app/audits/page.tsx):
- StatusBadge → show "Overdue" badge (red) when isOverdue
- Add due date column (show scheduleDate in red if overdue)

### CAPA Page (src/app/capas/page.tsx):
- StatusBadge → show "Overdue" badge when isOverdue
- Highlight targetDate in red if overdue

### Activity Log — New Actions:
- No new schema — use existing ActivityLog with action names:
  - `due_date.changed` — { entityType, entityId, oldDate, newDate }
  - `overdue.closed` — { entityType, entityId, daysOverdue }

## 6. Risks

| Risk | Level | Mitigation |
|------|-------|------------|
| **Approved doc lock** — PATCH บล็อค metadata แต่ UI ยังมี form | 🔴 High | UI ต้อง disable form + show lock message |
| **Status transition race** — Two admins approve same doc simultaneously | 🟡 Medium | Prisma transaction — last write wins (acceptable for MVP) |
| **Migration of existing docs** — เอกสารเก่ามี status หลากหลาย | 🟡 Medium | Should work since we validate current status, not enum |
| **Engineer submitting others' docs** — ตรวจแค่ ownerId | 🟡 Medium | Current design allows submit only own docs via ownerId check |
| **Timezone for due date** — "ห้ามใส่ dueDate ย้อนอดีต" | 🟢 Low | Compare UTC dates server-side, not client |
| **CAPA targetDate rename vs reuse** — existing `targetDate` field | 🟢 Low | Reuse as-is, just add computed `isOverdue` |

## 7. Test Plan

### Approval Flow Tests:
1. Engineer creates doc → status is "Draft" ✅
2. Engineer submits Draft review → status "InReview" ✅
3. QA/Admin approves InReview → status "Approved" ✅
4. QA/Admin rejects InReview with reason → status "Draft" + reason saved ✅
5. Engineer submits rejected doc again → status "InReview" ✅
6. Admin marks Approved → Obsolete ✅
7. Engineer CANNOT submit another engineer's doc ✅
8. Engineer CANNOT approve/reject docs ✅
9. QA CANNOT mark Obsolete ✅
10. PATCH on Approved doc → 400 error ✅
11. Upload new version to Approved doc → auto re-trigger InReview ✅
12. Reject without reason → 400 error ✅
13. Activity log for: submitted, approved, rejected, obsoleted ✅

### Due Date Tests:
14. Audit with past scheduleDate + not Completed = isOverdue=true ✅
15. CAPA with past targetDate + not Closed = isOverdue=true ✅
16. Recent scheduleDate → isOverdue=false ✅
17. Closed CAPA → isOverdue=false (even if past targetDate) ✅
18. Dashboard shows overdue count ✅

## 8. DeepSeek vs Codex Split

| Work | Who | Files |
|------|-----|-------|
| **Schema** — Add rejectReason, approvalDate, approvedById to Document | DeepSeek (patch) | `prisma/schema.prisma` |
| **API Logic** — submit-review, approve, reject, obsolete routes | DeepSeek (patch/create) | `documents/[id]/*/route.ts` |
| **PATCH modification** — Block Approved doc edits | DeepSeek (patch) | `documents/[id]/route.ts` |
| **POST modification** — Auto InReview on version upload to Approved | DeepSeek (patch) | `documents/[id]/route.ts` |
| **POST create** — Force status "Draft" on create | DeepSeek (patch) | `documents/route.ts` |
| **Due date computation** — isOverdue flag on audit/capa APIs | DeepSeek (patch) | `audits/route.ts`, `capas/route.ts` |
| **Activity log metadata** — Add "reason" to allowlist | DeepSeek (patch) | `src/lib/activity.ts` |
| **Activity log calls** — All new approval/due-date actions | DeepSeek (patch) | All new route files |
| **Test script** | DeepSeek (write) | `/tmp/test_sprint23.py` |
| **UI: Document Detail** — Workflow buttons, rejection modal, status banner, lock form | Codex | `documents/[id]/page.tsx` |
| **UI: Document List** — Status filter options update | Codex | `documents/page.tsx` |
| **UI: Dashboard** — Overdue KPI card + list | Codex | `page.tsx` |
| **UI: Audit/CAPA pages** — Overdue badge, red date | Codex | `audits/page.tsx`, `capas/page.tsx` |

## 9. Execution Order

```
Phase 1: DeepSeek (save token)
├── Schema: Add rejectReason, approvalDate, approvedById
├── Activity.ts: Add "reason" to allowlist
├── API: submit-review route (new)
├── API: approve route (new)
├── API: reject route (new)
├── API: obsolete route (new)
├── Modify: PATCH locking on Approved docs
├── Modify: POST version on Approved → auto InReview
├── Modify: POST create → force Draft status
├── Due date: isOverdue on audits + capas APIs
├── Activity log: Add logActivity calls to all new routes
├── Prisma generate + db push
├── Lint + Build
└── Test script

Phase 2: Codex (UI only)
├── Prompt → document detail page (workflow buttons, modal)
├── Prompt → document list page (status filter)
├── Prompt → dashboard (overdue KPI)
├── Prompt → audit page (overdue badge)
└── Prompt → CAPA page (overdue badge)

Phase 3: DeepSeek verify
├── Lint + Build
└── Run tests (18 tests)
```

## 10. Files Summary

### New Files:
1. `src/app/api/documents/[id]/submit-review/route.ts`
2. `src/app/api/documents/[id]/approve/route.ts`
3. `src/app/api/documents/[id]/reject/route.ts`
4. `src/app/api/documents/[id]/obsolete/route.ts`

### Modified Files:
1. `prisma/schema.prisma` — +rejectReason, +approvalDate, +approvedById on Document
2. `src/lib/activity.ts` — +"reason" to ALLOWED_METADATA_KEYS
3. `src/app/api/documents/[id]/route.ts` — PATCH lock, POST auto-InReview
4. `src/app/api/documents/route.ts` — POST force Draft
5. `src/app/api/audits/route.ts` — +isOverdue
6. `src/app/api/capas/route.ts` — +isOverdue
7. `src/app/documents/[id]/page.tsx` — MAJOR UI update
8. `src/app/documents/page.tsx` — Minor status filter update
9. `src/app/page.tsx` — Overdue KPI card
10. `src/app/audits/page.tsx` — Overdue badge
11. `src/app/capas/page.tsx` — Overdue badge
