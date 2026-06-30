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

### Four-Tier Role System

```
PLATFORM_MANAGER  ← Super-super admin. Godigitify-level. Web only.
│
├── Scope: entire platform (all orgs, all tenants)
├── Exclusive capabilities:
│     - Account/org creation and deletion
│     - System-wide audit log access and export
│     - User lifecycle management across all orgs (create, suspend, hard-delete)
│     - Log management (retention, archival, purge)
│     - System configuration and feature flags
│     - Billing / plan management (future)
├── Cannot: create or assign tasks (not an operational role)
├── Dashboard: platform-level (org count, user count, system health)
└── Primary surface: Web Admin ONLY — never the mobile app

SUPER_ADMIN  ← Org-level administrator. SVGOI leadership.
│
├── Scope: entire SVGOI organisation
├── Task capabilities:
│     - Create tasks and assign to ANY Admin or ANY Employee across all departments
│     - Reassign, edit, cancel, or soft-delete any task
│     - Approve/reject task submissions (UNDER_REVIEW → COMPLETED or back to IN_PROGRESS)
├── User management (via Mobile App + Web Admin):
│     - Create Admin accounts
│     - Create Employee accounts
│     - Suspend / reactivate any user
│     - Reset any user's password
│     - Assign users to departments
│     - Cannot hard-delete users (PLATFORM_MANAGER only)
├── Visibility: org-wide dashboard, all departments, all tasks
├── Reports: org-wide + dept-level + individual
├── Audit logs: read-only (write access is PLATFORM_MANAGER only)
└── Primary surface: Mobile App + Web Admin

ADMIN  ← Department manager / HOD.
│
├── Scope: their assigned department(s) — can be multi-dept
├── Task capabilities:
│     - Create tasks and assign to:
│         → Employees within their own department(s)
│         → Admins of OTHER departments (cross-dept admin assignment ✅)
│         → Employees of OTHER departments (cross-dept employee assignment — configurable per org)
│     - Reassign tasks (within scope)
│     - Approve/reject task submissions for tasks they created
│     - Cannot delete tasks (soft-cancel only)
├── User management (via Mobile App):
│     - Create Employee accounts within their department
│     - Suspend / reactivate employees in their department
│     - Cannot create Admin accounts (SA only)
│     - Cannot manage users outside their department
├── Dashboard: own dept(s) view + summary of tasks assigned to other depts
├── Reports: own dept + employees they manage
└── Primary surface: Mobile App + Web Admin

EMPLOYEE  ← Operational staff.
│
├── Scope: their own assigned tasks only
├── Task capabilities:
│     - Accept assigned tasks
│     - Update status (PENDING→ACCEPTED→IN_PROGRESS→UNDER_REVIEW)
│     - Add comments and @mentions on own tasks
│     - Upload completion proof
│     - Request clarifications
│     - Cannot create tasks, cannot see other employees' tasks
├── User management: none
├── Dashboard: personal task summary only
└── Primary surface: Mobile App ONLY — zero web admin access
```

### Permission Matrix Implementation
```typescript
// Four-tier permission system — extend base PERMISSIONS from 07_SECURITY_CHECKLIST

// ─── Task assignment matrix (FR-13) ─────────────────────────────────
// PLATFORM_MANAGER → nobody (not an operational role)
// SUPER_ADMIN      → ADMIN (any dept)     ✅
// SUPER_ADMIN      → EMPLOYEE (any dept)  ✅
// ADMIN            → ADMIN (any dept)     ✅  ← KEY CHANGE: cross-dept admin assignment allowed
// ADMIN            → EMPLOYEE (own dept)  ✅
// ADMIN            → EMPLOYEE (other dept)✅  (configurable org setting, default ON)
// EMPLOYEE         → self                 ✅  (self-tasks, requires manager approval if configured)

// ─── Status transition matrix ────────────────────────────────────────
// PENDING       → ACCEPTED:       Task assignee (any role)
// ACCEPTED      → IN_PROGRESS:    Task assignee (any role)
// IN_PROGRESS   → UNDER_REVIEW:   Task assignee (any role)
// UNDER_REVIEW  → COMPLETED:      Task creator (ADMIN / SUPER_ADMIN)
// UNDER_REVIEW  → IN_PROGRESS:    Task creator (ADMIN / SUPER_ADMIN) — reject/revision
// ANY           → CANCELLED:      Task creator OR SUPER_ADMIN only
// COMPLETED     → (terminal):     No transitions out of COMPLETED
// CANCELLED     → (terminal):     No transitions out of CANCELLED

// ─── User management permissions ────────────────────────────────────
// PLATFORM_MANAGER: create/suspend/hard-delete any user, any org
// SUPER_ADMIN:      create Admin + Employee, suspend/reactivate any user in org
// ADMIN:            create Employee (own dept), suspend/reactivate Employee (own dept)
// EMPLOYEE:         none

// ─── Audit / system access ──────────────────────────────────────────
// PLATFORM_MANAGER: full audit log (all orgs), system config, log management
// SUPER_ADMIN:      read-only audit log (own org), org-level reports
// ADMIN:            read-only task activity (own dept tasks only)
// EMPLOYEE:         read-only activity on own tasks only

export const ROLE_HIERARCHY = {
  PLATFORM_MANAGER: 4,
  SUPER_ADMIN: 3,
  ADMIN: 2,
  EMPLOYEE: 1,
} as const;

// RBAC rule: a user can only manage users with a strictly lower hierarchy value
// e.g. SA (3) can manage ADMIN (2) and EMPLOYEE (1), but not another SA (3)
```

---

## 3. Screen Inventory — Mobile App

> **Note:** PLATFORM_MANAGER has NO mobile app access. PM operates exclusively via Web Admin.
> All other roles (SUPER_ADMIN, ADMIN, EMPLOYEE) use the mobile app as their primary surface.

### Authentication Screens
```
/login                 → Login with Employee ID + Password (all roles)
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

### Admin Tab Navigator (5 tabs)
```
Tab 1: Dashboard
Tab 2: Tasks (all dept tasks, with cross-dept filter)
Tab 3: Team (user management for own dept)
Tab 4: Calendar
Tab 5: Profile
```

### Super Admin Tab Navigator (5 tabs)
```
Tab 1: Dashboard
Tab 2: Tasks (org-wide, all departments)
Tab 3: People (org-wide user management — admins + employees)
Tab 4: Calendar
Tab 5: Profile
```

### Stack Screens (pushed from tabs)
```
tasks/[id]                     → Task Detail
tasks/[id]/comments            → Comments thread (full screen)
tasks/create                   → Create Task (Admin+ only)
tasks/[id]/edit                → Edit Task (Admin+ only)
tasks/[id]/upload-proof        → Upload completion proof
notifications                  → Notification center
reports/index                  → Reports overview (Admin+ only)

─── User Management (Admin+ only, via People / Team tab) ───────────
people/index                   → User list (SA: all users | Admin: own dept)
people/create                  → Create new user (SA: Admin or Employee | Admin: Employee only)
people/[id]                    → User profile view
people/[id]/edit               → Edit user details
people/[id]/suspend            → Suspend / reactivate user (confirmation modal)
people/[id]/reset-password     → Force password reset for user

─── Profile ────────────────────────────────────────────────────────
profile/edit                   → Edit own profile
profile/change-password        → Change own password
profile/notification-settings  → Notification preference toggles
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
Stats row 1 — Own department:
[Dept Tasks: 24]   [Team Pending: 8]
[Team Done: 14]    [Team Overdue: 2]

Stats row 2 — Tasks assigned OUT to other depts (Admin cross-dept assignment):
[Assigned Out: 6]  [Out Pending: 3]   ← only visible if Admin has cross-dept assignments

Overdue alert banner (if team overdue > 0):
"⚠️ [N] tasks in [Dept Name] are overdue. Tap to view."

Additional sections:
- Workload distribution: horizontal bar per team member (compact, max 5 + "see all")
- Department completion rate: ring chart (FR-26)
- Cross-dept assigned tasks summary: compact list of tasks sent to other depts
- Quick action: [+ Create Task] FAB (floating action button, bottom-right)
```

### 4.4 Dashboard Screen (Super Admin)
```
Org-wide stats row:
[Total Tasks]    [Org Pending]
[Org Completed]  [Org Overdue]

People stats row:
[Active Users]   [Departments]   ← tappable → People screen

Overdue alert banner (if org overdue > 0):
"⚠️ [N] tasks across [M] departments are overdue."

Additional sections:
- Department comparison: small bar chart (dept names + completion %)
- Workload distribution: dept-level summary (not employee-level — too granular for SA dash)
- Upcoming (org-wide, next 3 days of critical/high priority tasks only)
- Quick actions row: [+ Create Task]  [+ Add User]  [View Reports]

Note: SA does NOT see system audit logs on the dashboard — that is PLATFORM_MANAGER territory.
      SA sees task activity and org-level operational data only.
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
    UNDER_REVIEW:   Waiting for review... (read-only message, grey)
    COMPLETED:      Completed ✓ (read-only, green)

  For ADMIN (on task they CREATED):
    UNDER_REVIEW:   [Approve & Complete] [Request Revision]
    Any status:     [Reassign] [Edit] [Cancel Task] (in bottom overflow menu ⋮)

  For ADMIN (on task assigned TO them by SA or another Admin):
    Same flow as EMPLOYEE — they are the assignee:
    PENDING:        [Accept Task]
    ACCEPTED:       [Mark In Progress]
    IN_PROGRESS:    [Submit for Review] [+ Upload Proof]
    UNDER_REVIEW:   Waiting for review... (read-only)

  For SUPER_ADMIN (on any task):
    UNDER_REVIEW:   [Approve & Complete] [Request Revision]
    Any status:     [Reassign] [Edit] [Cancel Task] (always available)
    Full overflow:  [Edit] [Reassign] [Cancel] [View Audit Trail]

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
3. Department (required for SA — any dept; pre-filled for Admin but changeable for cross-dept assign)
   - Admin sees own dept pre-selected but CAN switch to another dept for cross-dept assignment
   - Changing department resets the Assignee field
4. Assignee (required, searchable dropdown):
   - SA: shows all active users across all departments, grouped by dept
   - Admin: shows users in selected department (own dept OR cross-dept if switched)
   - Assignee role can be ADMIN or EMPLOYEE — both valid
   - Multi-assignee NOT in v1 (one task, one owner)
5. Priority (required, visual selector: 4 colored pills — Critical / High / Medium / Low)
6. Due Date + Time (required, datetime picker)
7. Category/Type (optional, configurable dropdown)
8. Attachments (optional, up to 5 reference files)
9. Recurring (toggle → reveals: daily/weekly/monthly + end date)

Validation:
- Due date must be in the future
- Assignee must be active
- If cross-dept assignment: show confirmation chip "Assigning to [Dept Name] — [Assignee Name]"
- Title uniqueness: warn (not block) if duplicate title exists for same dept this month

Submission:
- [Save as Draft] — saves without notifying assignee (v1.1)
- [Create & Assign] → creates task + sends push notification to assignee immediately

Cross-dept assignment UX note:
  When Admin selects a department other than their own, show a subtle info chip:
  "ℹ️ This task will be assigned outside your department"
  This is informational only — not a blocker.
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
  - Role badge + Department chip (employees + admins)
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
  > Organisation Report  → Reports screen (SA only)

APP
  > About TaskFlow SVGOI
  > Version (x.x.x)

Bottom (no section header):
  > Sign Out             (danger red text, no button border)

Note: User management is NOT in Profile — it lives in the dedicated
      People tab (SA) or Team tab (Admin) in the tab navigator.
      Profile is for the current user's own settings only.
```

### 4.11 People / Team Screen (Admin+ only)
```
Header: "People" (SA) or "My Team" (Admin)
Sub-header chip: "[N] Active · [M] Suspended" (tappable toggles between views)

Search bar: debounced 300ms, searches name + employee ID + email

Filter chips (horizontal scroll):
  SA view:    [All] [Admins] [Employees] [Suspended] — all depts, dept filter dropdown
  Admin view: [All] [Employees] [Suspended] — own dept only

User card (in list):
  [Avatar] [Name]          [Role badge]
           [Dept chip]     [Status: Active / Suspended]
           [Employee ID]
  → Tap: opens User Profile view
  → Swipe left (Admin on own-dept employee): [Suspend] (amber) | [Reset PWD] (blue)
  → Swipe left (SA on any user):             [Suspend] (amber) | [Reset PWD] (blue)

FAB: [+ Add User]
  SA sees: role selector (Admin / Employee) → create user form
  Admin sees: Employee-only create form (no role selector, defaults to Employee)

Empty state: "No team members yet. Add your first team member."
```

### 4.12 Create / Edit User Screen (Admin+ only)
```
Fields:
1. Full Name (required)
2. Employee ID (required, unique — validated against org)
3. Email (required, used for password reset only — not the login identifier)
4. Phone (optional)
5. Role (required):
   - SA sees: [Admin] [Employee] selector
   - Admin sees: Employee only (no selector shown)
6. Department (required):
   - SA: department dropdown (all active depts)
   - Admin: pre-filled with own dept, read-only
7. Designation / Job Title (optional)
8. Reporting Manager (optional, searchable — shows Admins in selected dept)

On create:
  - System generates a temporary password and emails it to the user
  - User is prompted to change password on first login
  - Toast: "User created. Temporary password sent to [email]"

On edit:
  - Role and Department changes require confirmation modal
  - Role downgrade (Admin → Employee) warns: "This will remove their task creation access"
```

### 4.13 User Profile View Screen (Admin+ only — viewing another user)
```
Layout:
  [Avatar 80pt]   [Name h2]
                  [Role badge] [Status badge: Active/Suspended]
                  [Dept chip]  [Employee ID monospace]
  
  CONTACT
  > Email: user@svgoi.ac.in
  > Phone: +91 XXXXXX

  TASK SUMMARY (last 30 days)
  > Assigned: [N]   Completed: [N]   Overdue: [N]
  > On-time rate: [N%]

  RECENT TASKS (last 5, compact cards)

  ACTIONS (overflow menu ⋮ top right):
  SA on any user:
    > Edit Profile
    > Reset Password  → sends email with reset link
    > Suspend Account → confirmation modal: "Suspend [Name]? They will be logged out immediately."
    > Reactivate      → (shown only if suspended)

  Admin on own-dept employee:
    > Edit Profile
    > Reset Password
    > Suspend Account / Reactivate

  Admin on another dept's user: READ ONLY (no actions)
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

### Report Types & Access Matrix
```
1. Individual Performance Report
   - Date range: configurable (default last 30 days)
   - Metrics: tasks assigned, completed, on-time rate, avg completion time
   - Trend chart: daily completion over date range
   - Generated: PDF via Puppeteer (HTML template → PDF)
   - Available to: SA (all employees), Admin (own dept employees only), Employee (own report only)

2. Department Performance Report
   - Date range: configurable
   - Metrics: total tasks, completion %, overdue %, avg resolution time
   - Comparison: vs previous period, vs org average
   - Available to: SA (all depts), Admin (own dept only)

3. Organisation Summary Report
   - Date range: configurable
   - Top-level KPIs + department-by-department breakdown
   - Available to: SA only

4. Task Audit Report
   - All tasks in date range with full activity trail per task
   - Used for operational compliance / management review
   - Available to: SA only (own org tasks)
   - Note: PLATFORM_MANAGER has a separate system-level audit export — not this report

5. Cross-Department Assignment Report  ← NEW (reflects new Admin cross-dept capability)
   - Shows tasks that an Admin assigned OUTSIDE their own department
   - Tracks completion rates of cross-dept assignments vs own-dept assignments
   - Available to: SA only (org-wide view) + Admin (their own cross-dept assignments)

Report generation flow:
1. User requests report via app or web admin
2. API enqueues report job in BullMQ (reportQueue)
3. Worker generates PDF using HTML template + Puppeteer
4. PDF saved to Supabase storage (reports/ bucket, scoped to requester's org)
5. Push notification sent to requester: "Your [Report Type] report is ready"
6. App calls GET /reports/{id}/download → gets signed URL (15 min) → opens in device PDF viewer
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
DECISION: Four-tier role system (PLATFORM_MANAGER / SUPER_ADMIN / ADMIN / EMPLOYEE)
RATIONALE: PLATFORM_MANAGER is a Godigitify-level infrastructure role, not a client role.
           Separating it from SUPER_ADMIN means SVGOI leadership (SA) never has system-config
           access, and Godigitify retains control of account/log management across all clients.
           This also future-proofs multi-tenancy — one PM manages many SVGOI-type orgs.

DECISION: PLATFORM_MANAGER is web-only — no mobile app access
RATIONALE: PM's job is system administration: user lifecycle, log management, audit exports.
           These are deliberate, seated-at-a-desk tasks.
           Forcing PM to mobile creates security risk (PM credentials on a device).
           PM has no operational task work that would require mobile access.

DECISION: SUPER_ADMIN uses Mobile App as primary surface (not web-only)
RATIONALE: SVGOI leadership needs real-time visibility while walking departments.
           A college principal or head of institution is not desk-bound.
           SA retains full web admin access as well — it's not a restriction, it's an addition.
           User management (create, suspend, reset password) is exposed via the mobile People tab.

DECISION: ADMIN can assign tasks cross-department (to other Admins AND Employees in other depts)
RATIONALE: College operations frequently span departments. Lab work assigned by CS dept head
           to Physics dept staff is a real SVGOI use case. Restricting to own-dept-only would
           force SAs to intermediate every cross-dept task — creating a bottleneck.
           SAFEGUARD: cross-dept assignments are tracked separately in dashboard + reports.
           SA can see exactly which Admin is assigning outside their scope.

DECISION: Single assignee per task (not multi-assignee)
RATIONALE: BRD FR-12 mentions "multiple employees" but SVGOI's use case is accountability-driven.
           One task, one owner. Multi-assignee makes status transitions ambiguous ("who accepts?").
           MITIGATION: Admin can duplicate task (FR-23) to assign same work to multiple people.
           FUTURE: v1.1 can add co-assignees as read-only watchers.

DECISION: Employee accounts created by Admin or SA (no self-registration)
RATIONALE: SVGOI is a controlled institutional environment. HR assigns employee IDs.
           Self-registration would create unverified accounts outside the org hierarchy.
           ADMIN can create Employee accounts within their own department.
           SA can create both Admin and Employee accounts across all departments.

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
□ Employee logs in with Employee ID + correct password → lands on Dashboard (4-tab)
□ Admin logs in → lands on Dashboard (5-tab with Team tab)
□ SA logs in → lands on Dashboard (5-tab with People tab)
□ PM logs in via web → lands on PM web dashboard (no mobile access)
□ PM tries to access mobile app login → account not recognised (PM role blocked on mobile)
□ Employee logs in with wrong password → error message, no redirect
□ Employee locked after 5 attempts → lockout message, can retry after 15 min
□ SA resets employee password → employee receives email, sets new password on first login
□ Admin resets own-dept employee password → works (own dept only)
□ Admin tries to reset another dept's employee password → 403 Forbidden
□ Refresh token used twice → second use returns 401 (rotation enforcement)
```

### Task Workflow
```
□ SA creates task → assigns to Admin in Dept A → Admin gets push notification
□ SA creates task → assigns to Employee in Dept B → Employee gets push notification
□ Admin (Dept A) creates task → assigns to Admin in Dept B (cross-dept) → Dept B Admin notified
□ Admin (Dept A) creates task → assigns to Employee in Dept B (cross-dept) → Employee notified
□ Employee accepts task → status ACCEPTED, creator notified
□ Employee submits for review with proof → task creator (Admin/SA) notified
□ Admin (creator) approves → COMPLETED, employee notified
□ Admin (creator) rejects → back to IN_PROGRESS, employee notified
□ Admin (assignee on a task from SA) acts as employee — accepts, progresses, submits
□ Task passes due date → overdue notification to assignee, escalation after 4h to manager
□ SA cancels any task → CANCELLED, assignee notified, history preserved
□ Admin tries to cancel a task they didn't create → 403 Forbidden
```

### RBAC — Four-Tier Enforcement
```
□ EMPLOYEE tries GET /tasks (all tasks) → 403 Forbidden
□ EMPLOYEE tries to update another employee's task status → 404 (IDOR protection)
□ ADMIN tries to view another dept's user list → 403 Forbidden
□ ADMIN tries to create an Admin account → 403 Forbidden (SA only)
□ ADMIN suspends own-dept employee → 200 OK, user logged out, refresh tokens revoked
□ ADMIN tries to suspend another dept's employee → 403 Forbidden
□ SA suspends any user → 200 OK, user logged out immediately
□ SA tries to view system-level audit logs → 403 Forbidden (PM only)
□ PM accesses system audit log → 200 OK
□ PM tries to create a task → 403 Forbidden (PM is not an operational role)
□ PM tries to access the mobile app → blocked at auth layer
```

### Cross-Department Task Assignment
```
□ Admin assigns task to employee in same dept → works, appears in Admin's task list
□ Admin assigns task to admin in different dept → works, cross-dept summary shows on dashboard
□ Admin assigns task to employee in different dept → works (if org setting ON)
□ Assigned cross-dept admin acts as assignee (accepts, progresses, submits)
□ Cross-dept task creator (Admin A) approves submission from Admin B → COMPLETED
□ Cross-dept assignment appears in SA's org-wide task view with correct dept labels
□ Cross-dept assignment report (SA) correctly tracks Admin A's assignments to other depts
```

### User Management (Mobile App)
```
□ SA creates Admin account via mobile People tab → Admin gets email with temp password
□ SA creates Employee account → Employee gets email with temp password
□ SA suspends Admin → Admin immediately kicked out (push refresh triggers logout)
□ SA reactivates suspended Employee → Employee can log in again
□ Admin creates Employee in own dept via mobile Team tab → Employee gets email
□ Admin tries to create Employee in another dept (via API) → 403 Forbidden
□ New user logs in with temp password → forced to set new password before seeing dashboard
```

### Offline
```
□ Employee opens app with no internet → sees cached task list with offline banner
□ Employee tries to change status offline → queued, replays on reconnect
□ Notification received while offline → appears in correct order on reconnect
```

---

## 13. DOs and DON'Ts — SVGOI Project-Specific

### ✅ DO
- Use **Employee ID** (not email) as the primary login identifier — SVGOI uses HR-assigned IDs
- Treat **PLATFORM_MANAGER as infrastructure, not operations** — PM creates orgs and manages logs; PM never touches tasks
- Allow **ADMIN to assign tasks cross-department** — track these in a separate dashboard section
- Make **SUPER_ADMIN mobile-first** — the People tab on mobile is their primary user management surface
- Scope ALL Admin DATA queries to their **department(s)** — unless the query is cross-dept task assignment scope
- Show **overdue tasks prominently** — they are the most operationally critical signal
- Send push notifications for **task assignment immediately** — the whole value prop is instant visibility
- **Suspend users immediately** — revoke all refresh tokens on suspend so they're logged out within seconds
- Preserve **complete task history** per FR-20 — even cancelled tasks have immutable audit trails
- Support **PDF upload for completion proof** — lab reports, forms, signed documents are PDFs in SVGOI context
- Use the **PetPooja-style priority stripe** (left border) on every task card — it's the design signature
- Show **cross-dept assignment context** on the task detail screen (e.g. "Assigned by Physics Dept → CS Dept")

### ❌ DON'T
- Never give **PLATFORM_MANAGER** access to the mobile app — web only, always
- Never let **PLATFORM_MANAGER create or assign tasks** — not an operational role
- Never let an **Employee** see another Employee's tasks — isolation is non-negotiable per BRD
- Never let an **Admin create another Admin** — Super Admin only
- Never allow an **Admin to manage users outside their department** — dept-scoped always
- Never hard-delete any task, user, or audit record — soft-delete (isDeleted=true / isActive=false) always
- Never block the UI during report generation — always async via BullMQ
- Never skip the **task acceptance step** (FR-17) — it's contractually required per BRD
- Never allow status to go backwards except **UNDER_REVIEW → IN_PROGRESS** (revision flow)
- Never expose **system audit logs** to Super Admin — those are PLATFORM_MANAGER territory
- Never let EAS production builds go out without both iOS + Android tested on physical devices