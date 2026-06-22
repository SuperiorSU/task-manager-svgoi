# 08 — SVGOI Task Management App · Project Directive
### Godigitify Nexus → SVGOI
**Client:** SVGOI (Sri Vishwakarma Group of Institutions)
**BRD Version:** v1.0 · June 2026 | **App Codename:** TaskFlow SVGOI
**Stack:** TurboRepo Monorepo (this system) | **UI Reference:** PetPooja task management style

---

## DIRECTIVE GOAL
Build the complete TaskFlow SVGOI system end-to-end using the Godigitify RN Monorepo template.
This file is the project-specific layer on top of the base directives (01–07).
It maps every BRD requirement (FR-01 through FR-68) to implementation decisions.
**Read base directives 01–07 first. This file only covers project-specific decisions.**

---

## 1. Project Identity

```
App name:        TaskFlow SVGOI
Bundle ID:       com.godigitify.svgoitasks
Package name:    com.godigitify.svgoitasks
Web admin URL:   admin.svgoi.godigitify.com (staging: admin-staging.svgoi.godigitify.com)
API URL:         api.svgoi.godigitify.com
Primary color:   #1A5CF8 (brand blue — matches SVIET identity)
Secondary color: #0D2270 (dark navy)
Accent:          #F59E0B (amber — used for in-progress, warnings)
```

---

## 2. Role Architecture (FR-01 through FR-09)

### Three-Tier Role System
```
SUPER_ADMIN
├── Full system access
├── Manages all departments, all admins, all employees
├── Only role that can: delete tasks, view audit logs, configure system
├── Dashboard: org-wide view (all depts combined)
└── Primary surface: Web Admin (desktop-first use case)

ADMIN
├── Department-scoped (can be assigned to 1+ departments)
├── Creates + assigns tasks within their department(s)
├── Manages employees in their department
├── Dashboard: dept-level view
├── Reports: dept-level only (SA sees org-wide)
└── Primary surface: Both Web Admin + Mobile App

EMPLOYEE
├── Sees only their own assigned tasks
├── Can: accept, update status, add comments, upload proof
├── Cannot: create tasks, see other employees' tasks, access web admin
└── Primary surface: Mobile App ONLY
```

### Permission Matrix Implementation
```typescript
// Extend base PERMISSIONS from 07_SECURITY_CHECKLIST with SVGOI-specific additions:

// Status transition permissions (who can do what):
// PENDING → ACCEPTED:      Task assignee (EMPLOYEE)
// ACCEPTED → IN_PROGRESS:  Task assignee (EMPLOYEE)
// IN_PROGRESS → UNDER_REVIEW: Task assignee (EMPLOYEE)
// UNDER_REVIEW → COMPLETED:   Task creator (ADMIN/SA)
// UNDER_REVIEW → IN_PROGRESS: Task creator (ADMIN/SA) — reject submission
// ANY → CANCELLED:            Task creator or SA only

// Multi-level assignment matrix (FR-13):
// SA → ADMIN:      ✅
// SA → EMPLOYEE:   ✅
// ADMIN → ADMIN:   ✅ (same dept only)
// ADMIN → EMPLOYEE:✅ (own dept only)
// EMPLOYEE → self: ✅ (self-tasks, requires manager approval if configured)
```

---

## 3. Screen Inventory — Mobile App

### Authentication Screens
```
/login                 → Login with Employee ID + Password
/forgot-password       → Request reset link via email
/reset-password        → Set new password (from email link deeplink)
```

### Employee Tab Navigator (4 tabs)
```
Tab 1: Dashboard (Home)
Tab 2: My Tasks
Tab 3: Calendar
Tab 4: Profile
```

### Admin/SA Tab Navigator (4 tabs)
```
Tab 1: Dashboard
Tab 2: Tasks (all tasks, with department filter)
Tab 3: Calendar
Tab 4: Profile
```

### Stack Screens (pushed from tabs)
```
tasks/[id]                  → Task Detail
tasks/[id]/comments         → Comments thread (full screen)
tasks/create                → Create Task (Admin+ only)
tasks/[id]/edit             → Edit Task (Admin+ only)
tasks/[id]/upload-proof     → Upload completion proof
notifications               → Notification center
reports/index               → Reports overview (Admin+ only)
profile/edit                → Edit profile
profile/change-password     → Change password
profile/notification-settings → Notification preference toggles
```

---

## 4. Screen-by-Screen Implementation Notes

### 4.1 Login Screen
```
Fields: Employee ID (not email — SVGOI uses employee IDs) + Password
Show/hide password toggle (required)
"Forgot password?" → triggers email-based OTP (employee has email on file)
Error states:
  - Invalid credentials: "Employee ID or password is incorrect"
  - Account inactive: "Your account has been deactivated. Contact HR."
  - Rate limited: "Too many attempts. Try again in 15 minutes."
No registration screen — accounts created by Admin/SA only (FR-03)

Biometric login: Add in v1.1 (expo-local-authentication — architecture ready, feature deferred)
```

### 4.2 Dashboard Screen (Employee)
```
Greeting: "Good [morning/afternoon/evening], [First Name]"
Date: formatted as "Tuesday, 24 December"

Stats row (2×2 grid):
[My Tasks: 12]     [Due Today: 3]
[Completed: 8]     [Overdue: 1]   ← Overdue card has red tint if > 0

Overdue alert banner (visible ONLY if overdue > 0):
"⚠️ You have [N] overdue task(s). Tap to view."
→ Tapping opens My Tasks filtered to Overdue

Upcoming section (next 7 days, max 5 compact task cards)
Recent activity (last 3 events on my tasks — status changes, comments)
```

### 4.3 Dashboard Screen (Admin)
```
Additional stats for Admin:
[Dept Tasks]  [Team Pending]
[Team Done]   [Team Overdue]

Additional sections:
- Workload distribution: horizontal bar per team member (compact, max 5 visible + "see all")
- Department completion rate: ring chart (FR-26)
- Quick action: [+ Create Task] FAB (floating action button, bottom-right)
```

### 4.4 Dashboard Screen (Super Admin)
```
Org-wide stats:
[Total Tasks]  [Across All Depts]
[Org Completed] [Org Overdue]

Additional sections:
- Department comparison: small bar chart (dept names + completion %)
- System health: [N] active users, [N] admins, [N] departments
- Recent audit events (last 5)
```

### 4.5 My Tasks Screen
```
Search bar (sticky): debounced 300ms, searches title + description
Filter chips (horizontal scroll):
  [All] [Pending] [Accepted] [In Progress] [Under Review] [Completed] [Overdue]

Sort options (bottom sheet on tap of sort icon):
  - Due Date (default)
  - Priority (Critical first)
  - Newest First
  - Oldest First

Task list:
  - FlatList, keyExtractor = task.id
  - GroupBy: today's due tasks first (labeled "Due Today"), then rest
  - Pull-to-refresh
  - Infinite scroll (20 per page)
  - Swipe left on card: [Accept] (green) | [View] (blue)
  - Long press: multi-select mode (Employee: none; Admin: bulk status change)

Empty states:
  - All tasks empty: "No tasks assigned yet 🎉"
  - Filter active + empty: "No [status] tasks right now"
  - Search + empty: 'No tasks matching "[query]"'
```

### 4.6 Task Detail Screen
```
Full spec:

Header:
  - Back button (←) + "Task Details" title + Edit button (Admin+ only, top right)

Priority banner:
  - Full-width colored bar (6pt height) at top: priority color
  - Contains: [PRIORITY LABEL] badge left, [STATUS BADGE] right

Title section:
  - Task title (h2, semiBold, 2 lines max then expand button)
  - Department chip + Category chip (if set)

Info grid (2-column):
  - Due: [formatted date + time] | Created: [relative time]
  - Assigned by: [avatar + name] | Assignee: [avatar + name]

Description (collapsible):
  - Collapsed: 3 lines max + "Show more"
  - Expanded: full text + "Show less"

Attachments section:
  - Header: "Attachments (N)" + [+ Add] button (assignee only)
  - Horizontal scroll of attachment cards (thumbnail for images, PDF icon for PDFs)
  - Tap → in-app preview (expo-document-picker viewer or WebView for PDFs)
  - Long press → [Download] | [Share]

Activity Timeline (FR-36):
  - "Activity (N events)" collapsible section
  - Each event: [user avatar] [action description] [relative time]
  - Events: status changes, assignments, comments, file uploads, due date changes
  - Max 10 visible, "Show all activity" to expand

Comments section:
  - Displayed above input bar
  - Each comment: avatar + name + time + text
  - @mention highlighted in brand.primary color
  - Reply: indented under parent comment (max 1 level deep)

Bottom action bar (fixed, role-contextual):
  For EMPLOYEE (on own task):
    PENDING:        [Accept Task]                          (full-width, primary)
    ACCEPTED:       [Mark In Progress]                     (full-width, primary)
    IN_PROGRESS:    [Submit for Review] [+ Upload Proof]   (split, proof optional or required)
    UNDER_REVIEW:   Waiting... (read-only message)
    COMPLETED:      Completed ✓ (read-only)

  For ADMIN (on team task):
    UNDER_REVIEW:   [Approve & Complete] [Request Revision]
    Any status:     [Reassign] [Edit] (in bottom overflow menu)

Comment input (always visible):
  - Expandable text input
  - @mention trigger: shows user picker dropdown as user types @
  - [Send] button → disabled when empty
```

### 4.7 Create Task Screen (Admin+)
```
Form fields (in order):
1. Task Title (required, max 200 chars, char counter shown at 150+)
2. Description (optional, markdown supported, max 5000 chars)
3. Department (required for SA, pre-filled for Admin)
4. Assignee (required, searchable dropdown filtered by department)
   - Multi-assignee NOT in v1 (simplify — one task, one owner)
5. Priority (required, visual selector: 4 colored pills)
6. Due Date + Time (required, datetime picker)
7. Category/Type (optional, configurable dropdown)
8. Attachments (optional, up to 5 files)
9. Recurring (toggle → reveals: daily/weekly/monthly + end date)

Validation:
- Due date must be in the future
- Assignee must be active and in selected department
- Title uniqueness: warn (not block) if duplicate title exists for same dept this month

Submission:
- [Save as Draft] (saves without notifying assignee) — future v1.1
- [Create & Assign] → creates task + sends push notification to assignee
```

### 4.8 Calendar Screen
```
Top: Week strip calendar (7-day view, default)
     Day toggle buttons: [Day] [Week] [Month]
     Swipe left/right to navigate periods

Day cells:
  - Date number
  - Colored dots below (max 3, representing task priorities)
  - If overdue tasks: date cell has subtle red background tint
  - Today: filled circle (brand.primary)
  - Selected: filled circle (brand.secondary)

Below calendar: Task list for selected date
  - Sorted by: time (if set), then priority
  - Compact card mode: title + status badge + time only
  - Tap → full task detail

FAB (Admin+ only): [+] → Create task for selected date (pre-fills due date)

Empty state: "No tasks on [selected date]" with calendar illustration
```

### 4.9 Notifications Screen
```
Header: "Notifications" + [Mark all read] (text button, top right)

List (FlatList):
  - Unread: white bg, left 3pt blue border
  - Read: surface.muted bg (#F8FAFC), no border
  - Each item: notification icon (type-based) + title + body + relative time
  - Tap: navigate to relevant task + mark as read

Types and icons:
  📋 Task assigned → navigate to task detail
  ✅ Task accepted → navigate to task detail
  🔄 Status changed → navigate to task detail
  ⏰ Due date reminder → navigate to task detail
  🔴 Task overdue → navigate to task detail
  💬 New comment → navigate to comments thread
  ❓ Clarification request → navigate to task detail
  📤 Submitted for review → navigate to task detail (Admin only)

Grouping: "Today", "Yesterday", "This week", "Earlier"

Empty state: "All caught up! 🎉" + bell illustration
```

### 4.10 Profile Screen
```
Top section (non-scrollable):
  - Avatar (64pt) with edit overlay → image picker
  - Name (h3, semiBold)
  - Role badge + Department chip
  - Employee ID (caption, monospace)

Settings list sections:

ACCOUNT
  > Edit Profile (name, phone, avatar)
  > Change Password

NOTIFICATIONS  
  > Task Assigned        [toggle]
  > Due Date Reminders   [toggle]
  > Overdue Alerts       [toggle]
  > Comments             [toggle]
  > Task Completed       [toggle]

REPORTS (Admin+ only)
  > My Performance       → Reports screen
  > Department Report    → Reports screen

APP
  > About TaskFlow SVGOI
  > Version (x.x.x)

Bottom (no section header):
  > Sign Out             (danger red text, no button border)
```

---

## 5. Push Notification Strategy (FR-59 through FR-63)

### Event → Notification Mapping
```
Event                    Recipient(s)                    Priority    Delay
Task assigned            Assignee                        High        Immediate
Task accepted            Creator                         Medium      Immediate
Task in-progress         Creator                         Low         Immediate
Task submitted (review)  Creator                         High        Immediate
Task approved            Assignee                        High        Immediate
Task rejected (revision) Assignee                        High        Immediate
Due in 24 hours          Assignee + Creator              Medium      Scheduled cron
Due in 1 hour            Assignee                        High        Scheduled cron
Task overdue (initial)   Assignee                        Critical    Scheduled cron (hourly check)
Task overdue (escalation)Assignee + Manager              Critical    After 4h overdue
Task overdue (further)   Assignee + Manager + Dept Head  Critical    After 24h overdue
New comment              All task stakeholders           Low         Immediate
@mention in comment      Mentioned user                  Medium      Immediate
Task reassigned          New assignee + Old assignee     High        Immediate
```

### Notification Service Pattern
```typescript
// All notifications go through BullMQ queue — never sent synchronously
// src/jobs/workers/notification.worker.ts

// Push notification payload structure (Expo):
{
  to: expoPushToken,
  title: "Task Assigned",
  body: "Dr. Kumar assigned you 'Fix Lab Equipment Schedule'",
  data: {
    type: 'TASK_ASSIGNED',
    taskId: 'task_abc123',
    screen: '/(app)/tasks/task_abc123',  // Deep link target
  },
  sound: 'default',
  badge: unreadCount,
  priority: 'high',  // For critical/high priority tasks
}
```

### Cron Job Schedule (BullMQ Repeatable Jobs)
```
Every hour:     Check overdue tasks → send initial overdue notification
Every 4 hours:  Check 4h+ overdue tasks → escalate to manager
Every 24 hours: Check 24h+ overdue tasks → escalate to dept head
Every hour:     Check tasks due in next 24h → queue due-soon reminders
Every 5 min:    Check tasks due in next 60min → send urgent reminder
Daily 6 AM:     Send daily digest to Admins (pending tasks summary)
Weekly Monday:  Send weekly report to Super Admin
```

---

## 6. File Upload Implementation (FR-37 through FR-43)

### Storage Architecture
```
Provider: Supabase Storage (S3-compatible)
Bucket structure:
  svgoi-task-attachments/
    {orgId}/
      tasks/
        {taskId}/
          references/      ← Reference documents (attached at creation)
            {uuid}.pdf
            {uuid}.jpg
          proof/           ← Completion proof uploads
            {uuid}.pdf
            {uuid}.jpg

File access:
  - All files: private bucket (no public access)
  - Download: API generates signed URL (15 min expiry)
  - Preview: API generates signed URL (1 hour expiry for inline view)

File limits:
  - Max file size: 10 MB per file
  - Max files per task: 10 total (5 reference + 5 proof)
  - Allowed types: image/jpeg, image/png, application/pdf

Upload flow (mobile):
1. User picks file (expo-document-picker)
2. App calls POST /files/presign → gets signed upload URL + fileKey
3. App uploads directly to Supabase (never through API server — bandwidth)
4. App calls POST /files/confirm {taskId, fileKey, fileName, fileSize, mimeType, isProof}
5. API saves FileAttachment record to DB
6. API writes TaskActivity: "{user} attached {filename}"
```

---

## 7. Reports Module (FR-57)

### Report Types
```
1. Individual Performance Report
   - Date range: configurable (default last 30 days)
   - Metrics: tasks assigned, completed, on-time rate, avg completion time
   - Trend chart: daily completion over date range
   - Generated: PDF via Puppeteer (HTML template → PDF)
   - Available to: SA (all employees), Admin (own dept employees), Employee (own)

2. Department Performance Report
   - Date range: configurable
   - Metrics: total tasks, completion %, overdue %, avg resolution time
   - Comparison: vs previous period, vs org average
   - Available to: SA (all depts), Admin (own dept)

3. Organization Summary Report
   - Date range: configurable
   - Top-level KPIs + department breakdown
   - Available to: SA only

4. Task Audit Report
   - All tasks in date range with full activity trail
   - Used for compliance / management review
   - Available to: SA only

Report generation flow:
1. Admin requests report via app/web
2. API enqueues report job in BullMQ (reportQueue)
3. Worker generates PDF using HTML template + Puppeteer
4. PDF saved to Supabase storage (reports/ bucket)
5. Push notification sent: "Your report is ready"
6. App calls GET /reports/{id}/download → gets signed URL → opens in device PDF viewer
```

---

## 8. Recurring Tasks Implementation (FR-19)

### Architecture Decision
```
Approach: Explicit instance creation (NOT virtual events)
WHY: Easier to query, modify individual instances, track per-instance history

Storage:
- RecurringConfig stored on parent Task record (recurringConfig JSON field)
- Each recurrence creates a new Task record with parentTaskId = original task ID
- Parent task has isRecurring=true, instance tasks have same flag + parentTaskId

Instance creation:
- BullMQ cron job runs every day at midnight
- Finds all active recurring tasks due to spawn next instance
- Creates next instance with status=PENDING, sends assignment notification
- Does NOT create more than 3 future instances in advance (prevents DB bloat)

RecurringConfig shape:
{
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom',
  interval: 1,         // Every N days/weeks/months
  daysOfWeek: [1,3,5], // For weekly (0=Sun, 6=Sat)
  dayOfMonth: 15,      // For monthly
  endDate: '2026-12-31', // null = indefinite
  lastCreatedAt: '2026-06-22'
}
```

---

## 9. Real-Time Updates (FR-35)

### Socket.IO Event Definitions
```typescript
// Server-emitted events (src/modules/tasks/tasks.service.ts):
// After every task mutation, emit to relevant rooms

type ServerToClientEvents = {
  // Task events — emitted to room `task:{taskId}`
  'task:status-updated': (data: { taskId: string; status: TaskStatus; actor: string }) => void;
  'task:comment-added': (data: { taskId: string; comment: Comment }) => void;
  'task:reassigned': (data: { taskId: string; newAssignee: User }) => void;
  'task:proof-uploaded': (data: { taskId: string; attachment: FileAttachment }) => void;

  // User events — emitted to room `user:{userId}`
  'notification:new': (data: Notification) => void;
  'notification:count': (data: { unread: number }) => void;
};

// Room strategy:
// task:{taskId}  → All users involved in that task (assignee + creator + mentioned)
// user:{userId}  → Personal channel (notifications, direct messages)
// dept:{deptId}  → Department-wide broadcasts (Admin use)

// Mobile app subscribes on task detail open:
// socket.emit('join:task', taskId)
// socket.emit('leave:task', taskId)  ← on screen unmount
```

---

## 10. Development Phases & FR Mapping

### Phase 1 — Foundation (Weeks 1–3)
```
Monorepo setup, EAS config, Fastify server, Prisma schema, Auth module
FR coverage: FR-01 (SA creation), FR-05 (roles), FR-10 (password reset)
Deliverable: Login works on iOS + Android. JWT auth works. Web admin shell loads.
```

### Phase 2 — Core Task Engine (Weeks 4–6)
```
Task CRUD, status workflow, assignment, task detail screen
FR coverage: FR-11, FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-20, FR-21
Deliverable: Admin can create task. Employee receives it, accepts it, updates status.
```

### Phase 3 — User & Department Management (Week 7)
```
User CRUD (web admin), department CRUD, RBAC enforcement
FR coverage: FR-02, FR-03, FR-04, FR-06, FR-07, FR-08, FR-09
Deliverable: SA can create Admin. Admin can create Employee. Dept scoping works.
```

### Phase 4 — Collaboration & Notifications (Week 8–9)
```
Comments, @mentions, push notifications, Socket.IO real-time
FR coverage: FR-31, FR-32, FR-33, FR-34, FR-35, FR-36, FR-59, FR-60, FR-61, FR-62, FR-63
Deliverable: Employee comments on task. Admin gets push notification.
```

### Phase 5 — Files, Calendar, Search (Week 10)
```
File upload (presign flow), calendar screen, search + filters
FR coverage: FR-37, FR-38, FR-39, FR-40, FR-41, FR-42, FR-43, FR-44–FR-49, FR-22, FR-23
Deliverable: Employee uploads completion proof. Calendar shows task density.
```

### Phase 6 — Dashboard, Analytics, Reports (Week 11)
```
Dashboard widgets, productivity metrics, PDF reports
FR coverage: FR-25–FR-30, FR-50–FR-58
Deliverable: Admin sees completion rate chart. SA downloads org report PDF.
```

### Phase 7 — Advanced Features (Week 12)
```
Recurring tasks, bulk operations, audit log UI, notification preferences
FR coverage: FR-19, FR-24, FR-64, FR-65, FR-66, FR-67, FR-68
Deliverable: Daily recurring task auto-creates. SA views audit log in web.
```

### Phase 8 — Polish, Testing, Deployment (Weeks 13–14)
```
UAT fixes, performance optimization, EAS production build, Play Store + App Store submission
Deliverable: v1.0 deployed to production. App submitted to both stores.
```

---

## 11. Known Architectural Decisions & Rationale

```
DECISION: Single assignee per task (not multi-assignee)
RATIONALE: BRD FR-12 mentions "multiple employees" but also "specify task owners" (singular).
           SVGOI's use case is accountability-driven — one owner per task.
           Multi-assignee makes status transitions ambiguous ("who accepts?").
           MITIGATION: Admin can duplicate task (FR-23) to assign same work to multiple people.
           FUTURE: v1.1 can add co-assignees as read-only watchers.

DECISION: Employees are mobile-only (no web admin access)
RATIONALE: Employees perform operational tasks on-the-go.
           Web admin is management-layer tooling.
           Reduces scope significantly, improves security (fewer attack surfaces for regular users).

DECISION: PDF report generation via BullMQ (async)
RATIONALE: Puppeteer is slow (2–10 seconds). Blocking the API request is unacceptable.
           Reports are queued, generated in background, user notified when ready.

DECISION: Supabase Storage (not Cloudflare R2) for v1
RATIONALE: Already using Supabase for PostgreSQL. Reduces infrastructure complexity.
           R2 migration path is straightforward if needed at scale.

DECISION: Expo Push Notifications (not FCM/APNs direct)
RATIONALE: Single cross-platform API. Expo abstracts FCM/APNs.
           For v1 (< 1000 users), Expo's free tier is sufficient.
           FUTURE: Direct FCM/APNs at high scale if needed.

DECISION: No biometric auth in v1
RATIONALE: Adds complexity (expo-local-authentication + secure token linking).
           Architecture is ready (SecureStore used) — just not triggered yet.
           Add in v1.1 post-UAT stabilization.
```

---

## 12. Test Scenarios — Critical Paths

### Auth
```
□ Employee logs in with Employee ID + correct password → lands on Dashboard
□ Employee logs in with wrong password → error message, no redirect
□ Employee locked after 5 attempts → sees lockout message, can retry after 15 min
□ SA resets employee password → employee receives email, sets new password
□ Refresh token used twice → second use returns 401 (rotation enforcement)
```

### Task Workflow
```
□ SA creates task for Employee → Employee gets push notification immediately
□ Employee accepts task → status → ACCEPTED, creator gets push notification
□ Employee submits for review with proof → SA/Admin notified
□ Admin approves → task COMPLETED, employee notified
□ Admin rejects (request revision) → task back to IN_PROGRESS, employee notified
□ Task passes due date without completion → overdue notification sent, badge shown
□ Admin reassigns task → old assignee notified, new assignee notified, history preserved
```

### RBAC
```
□ Employee tries GET /tasks (all tasks) → 403 Forbidden
□ Employee tries to update another employee's task status → 404 (IDOR protection)
□ Admin tries to view another dept's tasks → 403 Forbidden
□ Admin tries to access /audit-logs → 403 Forbidden
□ SA can access all of the above → 200 OK
```

### Offline
```
□ Employee opens app with no internet → sees cached task list with offline banner
□ Employee tries to change status offline → queued, replays on reconnect
□ Notification received while offline → appears on reconnect in correct order
```

---

## 13. DOs and DON'Ts — SVGOI Project-Specific

### ✅ DO
- Use **Employee ID** (not email) as the primary login identifier — SVGOI uses HR-assigned IDs
- Scope ALL Admin queries to their **department(s)** — never show cross-dept data by accident
- Show **overdue tasks prominently** — they are the most operationally critical signal
- Send push notifications for **task assignment immediately** — the whole value prop is instant visibility
- Preserve **complete task history** per FR-20 — even cancelled tasks have immutable audit trails
- Support **PDF upload for completion proof** — lab reports, forms, signed documents are PDFs in SVGOI context
- Use the **PetPooja-style priority stripe** (left border) on every task card — it's the design signature

### ❌ DON'T
- Never let an Employee see another Employee's tasks — isolation is non-negotiable per BRD
- Never hard-delete any task or audit record — soft-delete (isDeleted=true) always
- Never block the UI during report generation — always async via BullMQ
- Never show department-switching in the app — Admin is scoped to their dept(s) permanently
- Never skip the **task acceptance step** (FR-17) — it's contractually required per BRD
- Never allow status to go backwards except **UNDER_REVIEW → IN_PROGRESS** (revision flow)
- Never let EAS production builds go out without both iOS + Android tested on physical devices