# 04 — Next.js Admin Dashboard Directive
### Godigitify Nexus · Web Admin Panel
**Version:** 1.0 | **Stack:** Next.js 15 App Router · TypeScript · TanStack Query · Zustand · Tailwind CSS

---

## DIRECTIVE GOAL
Build a fast, accessible, role-gated admin dashboard. Super Admins and Admins manage the full
system here. Employees are mobile-only. This directive covers routing, layout, data fetching,
RBAC enforcement, and all admin-specific patterns.

---

## 1. Web Workspace Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                     # Root layout (fonts, QueryProvider, AuthProvider)
│   │   ├── page.tsx                       # Redirect → /dashboard or /login
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   └── (admin)/                       # Protected admin routes
│   │       ├── layout.tsx                 # Admin shell: sidebar + topbar + auth gate
│   │       ├── dashboard/
│   │       │   └── page.tsx
│   │       ├── tasks/
│   │       │   ├── page.tsx               # Task list with filters
│   │       │   ├── create/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       ├── page.tsx           # Task detail
│   │       │       └── edit/
│   │       │           └── page.tsx
│   │       ├── users/
│   │       │   ├── page.tsx
│   │       │   ├── create/
│   │       │   │   └── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── departments/
│   │       │   ├── page.tsx
│   │       │   └── [id]/
│   │       │       └── page.tsx
│   │       ├── reports/
│   │       │   ├── page.tsx
│   │       │   └── [type]/
│   │       │       └── page.tsx
│   │       ├── notifications/
│   │       │   └── page.tsx
│   │       ├── audit/                     # Super Admin only
│   │       │   └── page.tsx
│   │       └── settings/
│   │           └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── AdminShell.tsx             # Sidebar + content area
│   │   │   └── BreadcrumbNav.tsx
│   │   ├── ui/                            # Primitive components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx                  # Sortable + paginated data table
│   │   │   ├── Modal.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── DateRangePicker.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── task/
│   │   │   ├── TaskTable.tsx
│   │   │   ├── TaskStatusBadge.tsx
│   │   │   ├── TaskPriorityBadge.tsx
│   │   │   ├── TaskFilters.tsx
│   │   │   ├── TaskCreateForm.tsx
│   │   │   ├── BulkActionBar.tsx
│   │   │   └── ActivityTimeline.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── CompletionRingChart.tsx
│   │   │   ├── TaskTrendChart.tsx
│   │   │   ├── DeptComparisonChart.tsx
│   │   │   └── OverdueAlert.tsx
│   │   └── shared/
│   │       ├── PermissionGate.tsx
│   │       ├── RoleChip.tsx
│   │       └── AvatarWithFallback.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useTasks.ts
│   │   ├── useUsers.ts
│   │   ├── useDashboard.ts
│   │   ├── useDebounce.ts
│   │   └── usePermissions.ts
│   ├── stores/
│   │   ├── auth.store.ts                  # httpOnly cookie + server session
│   │   └── ui.store.ts                    # Sidebar open/close, modal state
│   ├── lib/
│   │   ├── queryClient.ts
│   │   ├── api.ts                         # Axios instance with auth interceptor
│   │   └── utils.ts                       # cn() + misc helpers
│   ├── constants/
│   │   ├── navigation.ts                  # Sidebar nav items with permission requirements
│   │   ├── permissions.ts
│   │   └── queryKeys.ts
│   └── middleware.ts                      # Next.js middleware: auth guard on /admin routes
├── public/
│   ├── favicon.ico
│   └── logo.svg
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Next.js Middleware (Route Guard)

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  // Protect all /admin routes
  if (pathname.startsWith('/(admin)') || pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect authenticated users away from login
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## 3. Admin Shell Layout

```typescript
// src/app/(admin)/layout.tsx
// Server component — fetch session server-side, gate by role
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/session';
import { AdminShell } from '@/components/layout/AdminShell';
import { PlatformShell } from '@/components/layout/PlatformShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();
  if (!session) redirect('/login');

  const { role } = session.user;

  // Employees are mobile-only — never web admin
  if (role === 'EMPLOYEE') {
    redirect('/unauthorized');
  }

  // PLATFORM_MANAGER gets a completely separate shell (different nav, different branding)
  if (role === 'PLATFORM_MANAGER') {
    return <PlatformShell user={session.user}>{children}</PlatformShell>;
  }

  // SUPER_ADMIN and ADMIN share the AdminShell (nav items filtered by permission)
  return <AdminShell user={session.user}>{children}</AdminShell>;
}
```

---

## 4. Navigation Structure

```typescript
// src/constants/navigation.ts
// Navigation is role-filtered — each item only renders if the user has the required permission

type NavItem = {
  label: string;
  href: string;
  icon: string;
  permission?: string;
  roles?: string[];        // Alternative to permission — restrict by role directly
  children?: NavItem[];
};

// ─── PLATFORM_MANAGER nav (web only) ─────────────────────────────────
export const PM_NAV_ITEMS: NavItem[] = [
  { label: 'Platform Overview', href: '/platform', icon: 'globe' },
  { label: 'Organisations', href: '/platform/orgs', icon: 'building' },
  { label: 'All Users', href: '/platform/users', icon: 'users', permission: 'user:read' },
  { label: 'Audit Logs', href: '/platform/audit', icon: 'shield', permission: 'audit:view:system' },
  { label: 'Log Management', href: '/platform/logs', icon: 'file-text', permission: 'log:manage' },
  { label: 'System Config', href: '/platform/config', icon: 'settings', permission: 'system:config' },
];

// ─── SUPER_ADMIN + ADMIN shared nav ──────────────────────────────────
export const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: 'check-square',
    permission: 'task:read:all',
    children: [
      { label: 'All Tasks', href: '/tasks' },
      { label: 'Create Task', href: '/tasks/create', permission: 'task:create' },
    ],
  },
  {
    label: 'People',
    href: '/people',
    icon: 'users',
    permission: 'user:read',
    // SA sees all users org-wide; Admin sees own dept — enforced at data layer
  },
  {
    label: 'Departments',
    href: '/departments',
    icon: 'building-2',
    permission: 'dept:manage',
    roles: ['SUPER_ADMIN'],  // Admin can view but not manage
  },
  { label: 'Reports', href: '/reports', icon: 'bar-chart', permission: 'report:view:dept' },
  { label: 'Notifications', href: '/notifications', icon: 'bell' },
  {
    label: 'Audit Log',
    href: '/audit',
    icon: 'shield',
    permission: 'audit:view:org',
    roles: ['SUPER_ADMIN'],   // Admin cannot see audit log on web
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: 'settings',
    roles: ['SUPER_ADMIN'],
  },
];

// Note: EMPLOYEE has no web admin access at all.
// The admin layout gate redirects EMPLOYEE and PLATFORM_MANAGER to appropriate surfaces.
```

---

## 5. Data Table Pattern

```typescript
// Reusable pattern for all admin list views
// Combines: pagination + sorting + filtering + bulk selection

// TaskTable.tsx uses:
// - TanStack Table v8 for column definitions + sorting logic
// - TanStack Query for data fetching
// - URL search params for filter/sort state (sharable URLs)
// - BulkActionBar appears when rows are selected

// URL state pattern (filters persist across refreshes):
// /tasks?status=PENDING&priority=HIGH&dept=abc&page=1&sort=dueDate&order=asc

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

export const useTaskFilters = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = {
    status: searchParams.get('status') ?? undefined,
    priority: searchParams.get('priority') ?? undefined,
    departmentId: searchParams.get('dept') ?? undefined,
    page: Number(searchParams.get('page') ?? 1),
    search: searchParams.get('q') ?? undefined,
  };

  const setFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1'); // Reset page on filter change
    router.replace(`${pathname}?${params.toString()}`);
  };

  return { filters, setFilter };
};
```

---

## 6. PermissionGate Component

```typescript
// src/components/shared/PermissionGate.tsx
'use client';
import { usePermissions } from '@/hooks/usePermissions';

type Props = {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export const PermissionGate = ({ permission, children, fallback = null }: Props) => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
};

// Usage:
// <PermissionGate permission="task:create">
//   <Button onClick={openCreateModal}>Create Task</Button>
// </PermissionGate>
```

---

## 7. Dashboard Data Fetching

```typescript
// Dashboard uses React Server Components for initial load + client-side refresh
// src/app/(admin)/dashboard/page.tsx

import { Suspense } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { StatCardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<StatCardSkeleton count={4} />}>
        <DashboardStats />
      </Suspense>
      {/* Chart components also wrapped in Suspense */}
    </div>
  );
}
```

---

## 8. Chart Library & Analytics

```typescript
// Use Recharts for all charts — lightweight, React-native-friendly API
// Charts that are needed:
// 1. Task completion rate donut — dashboard summary
// 2. Task trend line chart — 30-day completion trend
// 3. Department comparison bar chart — side-by-side performance
// 4. Overdue tasks by age — stacked bar
// 5. Workload distribution — horizontal bar per employee

// All charts:
// - Are responsive (ResponsiveContainer wrapper)
// - Have loading states (Skeleton placeholder, not spinner)
// - Handle empty data gracefully (EmptyState component)
// - Use design token colors (not hardcoded hex values)
```

---

## 9. Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design tokens — must match mobile constants/colors.ts
        brand: {
          50: '#EFF6FF',
          500: '#1A5CF8',
          600: '#1648D0',
          700: '#1238A8',
          900: '#0D2270',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          subtle: '#F1F5F9',
        },
        priority: {
          low: '#22C55E',
          medium: '#F59E0B',
          high: '#EF4444',
          critical: '#7C3AED',
        },
        status: {
          pending: '#94A3B8',
          accepted: '#60A5FA',
          'in-progress': '#F59E0B',
          'under-review': '#A78BFA',
          completed: '#22C55E',
          cancelled: '#EF4444',
          overdue: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
};

export default config;
```

---

## 10. DOs and DON'Ts — Web Admin

### ✅ DO
- Render **separate shells** for PLATFORM_MANAGER (PlatformShell) vs SA/Admin (AdminShell) — they have completely different nav and scope
- Keep **filter/sort state in URL search params** — never in component state
- Use **React Server Components** for initial data fetches where possible
- Use **Suspense + skeleton loaders** for every async data boundary
- Guard pages with **middleware** AND component-level **PermissionGate**
- Scope People/Users list to **own department for Admin**, org-wide for SA — same component, different query
- Implement **optimistic updates** for status changes in the task table
- Show **confirmation dialogs** for all destructive actions (suspend user, cancel task)
- Implement **keyboard shortcuts** for power users (/ to search, N for new task)
- Export all report downloads via **background job** (BullMQ) — never block UI for PDF gen
- Make the **cross-dept assignment** visible in task list with a dept-transfer icon indicator

### ❌ DON'T
- Never allow **Employees** to access the web admin — mobile only for them
- Never allow **PLATFORM_MANAGER** to reach the standard admin routes (/dashboard, /tasks) — they go to /platform/*
- Never let **PM create or assign tasks** — block at the API layer (no task permissions in PM role)
- Never fetch data in **useEffect** — use TanStack Query or Server Components
- Never put **sensitive logic** in Client Components that reaches out to raw DB
- Never store auth tokens in **localStorage** — httpOnly cookies only on web
- Never build **non-paginated** list views — always paginate at 20 items default
- Never show **system-level audit logs** to SA in the web admin — that's PM territory only