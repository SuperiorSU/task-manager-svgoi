# 06 — Frontend Design Guidelines
### Godigitify Nexus · Impeccable-standard Design Rules for All Surfaces
**Reference:** https://impeccable.style · **Applies to:** Mobile (RN) + Web Admin (Next.js)
**Version:** 1.0

---

## DIRECTIVE GOAL
These are the design rules Claude Code must follow before writing a single line of UI code.
Based on the Impeccable design framework — the goal is intentional, non-generic, high-quality UI
that doesn't look like every other Expo or Next.js app. Every decision is justified by the brief,
not by AI defaults.

---

## Part 1 — The Impeccable Framework Applied to Godigitify Projects

### The Core Principle
Before any UI code is written, answer these three questions:
1. **Who uses this surface?** (Super Admin on desktop, Employee on phone during a busy lab shift)
2. **What is the single job of this screen?** (Show me what needs my attention RIGHT NOW)
3. **What's the one thing this screen will be remembered by?** (The priority stripe. The overdue pulse. The completion ring.)

If you can't answer all three, don't start coding.

---

### The Two-Pass Rule (From Impeccable)

**Pass 1 — Design Plan (do this in your head before touching code):**
- Color: Name 4-6 hex values and what each is for
- Type: Name the typeface pair and the exact scale used
- Layout: Sketch it in ASCII before building
- Signature: Name the ONE element that makes this screen memorable

**Pass 2 — Critique before shipping:**
- Does it look like a generic SaaS template? If yes, revise.
- Does it look like a default Expo starter? If yes, revise.
- Would the same design work for any other app? If yes, it's not specific enough.

---

## Part 2 — What Godigitify AI Slop Looks Like

These are patterns that make our apps look AI-generated. Flag and fix all of these:

### Typography Slop
```
❌ Using system fonts without loading custom fonts
❌ Using the same font weight for headings and body
❌ Line heights that match font size exactly (claustrophobic)
❌ Letter spacing on body text (that's for display/labels only)
❌ H1/H2/H3 tags with no meaningful size difference
❌ Centered text for data-heavy screens
```

### Color Slop
```
❌ Gradient backgrounds on functional screens (dashboard, task list)
❌ Using 3+ brand colors on the same screen
❌ Status colors that aren't distinctive (two similar greens for different states)
❌ Pure white #FFFFFF as app background (use #F4F6FA — slightly cool)
❌ Pure black #000000 for text (use #0F172A)
❌ Opacity hacks instead of semantic color tokens
```

### Layout Slop
```
❌ Cards with equal padding but different content densities
❌ Inconsistent border radii (mix of 8, 10, 12, 16 on same screen)
❌ Shadow values that don't match elevation hierarchy
❌ Full-width buttons everywhere (use full-width only for primary CTA)
❌ Empty state with just centered text (must include illustration or icon)
❌ List items without a clear visual anchor (left edge, avatar, icon, or stripe)
```

### Interaction Slop
```
❌ No pressed state on tappable items (required)
❌ Spinners in the center of the screen (use skeleton loaders inline)
❌ Error states in small red text below input (must also show error icon)
❌ Success states that are just a green checkmark with no label
❌ Action buttons that appear/disappear without animation
```

### Mobile-Specific Slop
```
❌ Bottom tab labels that are cut off on small screens
❌ Touch targets smaller than 44×44pt
❌ Full-screen modal for a yes/no confirmation
❌ No pull-to-refresh on list screens
❌ Overflow menus without visible trigger (no floating mystery button)
```

---

## Part 3 — Screen-by-Screen Design Standards

### Login Screen
```
Design intent: Authoritative, not inviting. This is a work tool.
Do NOT build: Consumer-style login with gradient hero, big logo center, marketing tagline.
DO build: Clean, form-first layout. SVGOI logo top-left (not centered). 
         Brand color only on primary CTA. No decorative elements.
         "Organization" field or pre-filled domain (single-tenant), not email prefix guessing.

Layout:
┌─────────────────────────────┐
│  [SVGOI Logo]               │  ← Left-aligned, 48pt tall
│                             │
│  Sign in to your account    │  ← h2, not "Welcome Back!"
│                             │
│  [Employee ID / Email]      │
│  [Password]          [👁]   │
│  [Forgot password?]         │  ← Right-aligned, text link
│                             │
│  [    Sign In    ]          │  ← Full-width primary button
└─────────────────────────────┘
```

### Task List Screen
```
Design intent: Fast scanning. I should be able to see my overdue task in < 2 seconds.
Signature element: Priority stripe on every card (4pt left border).
Color scanning order: Red stripe → task is critical/high. No red → safe.

Rules:
- Task cards: consistent 96pt min height
- Overdue tasks float to top of list automatically (sorted server-side)
- Overdue cards get a subtle error-bg tint (Colors.semantic.errorBg)
- Filter chips above list: compact (32pt height), horizontal scroll
- Search bar: always visible above filters, not hidden behind icon
- Empty state: shows categorized message ("No pending tasks 🎉" not generic "Nothing here")
```

### Task Detail Screen
```
Design intent: Full context for action. I should be able to accept/reject/submit without scrolling 3x.
Layout rule: Most important actions pinned to bottom. Never hidden in overflow.

Hierarchy:
1. Priority stripe (full-width top border, 6pt height)
2. Status badge + due date (same line, prominent)
3. Title (h2, most real estate)
4. Metadata (dept, creator, assignee) — compact 2-col grid
5. Description (collapsible if long)
6. Attachments (horizontal scroll thumbnails)
7. Activity timeline (expandable)
8. Comment input (sticky bottom)
```

### Dashboard Screen
```
Design intent: At-a-glance operational status. Not a vanity metrics page.
Most important number: Overdue tasks. It should be the most visually prominent.

Rules:
- If overdue count > 0: show red alert banner BEFORE stat cards
- Stat cards: 2-column grid, equal size, no ranking by position
- Recent activity: max 5 items, "See all" link
- Upcoming tasks: max 3 items, compact card style (not full TaskCard)
- No chart on main dashboard (save for Reports screen — charts are exploration, not monitoring)
```

### Calendar Screen
```
Design intent: Date-first task planning. See density, not detail.
Default view: Weekly strip (not monthly — too small, not daily — too narrow)

Rules:
- Date with tasks: show colored dot below date number (priority color of highest-priority task)
- Selected date: filled circle, brand.primary background
- Overdue dates: subtle red tint on date cell (not the dot — the whole cell background)
- Task list below calendar: compact mode (title + status badge only, no description)
```

### Profile Screen
```
Design intent: Information + settings. Not a social profile.
Do NOT: Large avatar hero, cover photo, follower counts.
DO: Avatar (64pt) + name + role badge + department. Then settings list.

Settings grouped:
1. Account (edit profile, change password)
2. Notifications (per-type toggles)
3. App (theme, about)
4. Session (sign out — at bottom, danger red text, no button)
```

---

## Part 4 — Web Admin Design Standards

### Admin Dashboard Layout
```
Sidebar: 240pt fixed width (desktop). Collapsible to icon rail (60pt) on compact.
Content area: max-width 1280pt, centered.
Topbar: 64pt height, breadcrumb left, user avatar + notifications right.

Sidebar sections:
─ Navigation items (icon + label, active = brand bg pill)
─ Bottom: User profile chip + Sign out

Color: Sidebar bg #0D2270 (brand.secondary) with white text/icons.
Content area bg: #F4F6FA (matches mobile app background).
```

### Admin Table Design
```
Column max widths prevent horizontal scroll at 1280pt:
- Title: 280pt, truncate with tooltip
- Status badge: 120pt
- Priority badge: 100pt
- Assignee: 160pt (avatar + name)
- Due date: 140pt
- Actions: 80pt (overflow menu ⋮)

Row hover: surface.muted background (#F8FAFC)
Selected rows: brand.primaryLight background
Bulk action bar: slides in from bottom when rows selected (like iOS)
```

### Form Design (Create/Edit)
```
Web forms use 2-column layout on desktop, 1-column on mobile.
Left column: Title, Description, Department
Right column: Assignee, Priority, Due Date, Attachments

All form pages:
- Back navigation clearly visible
- Auto-save indicator (saves draft every 30s)
- Submit + Cancel always in same position (bottom right)
- Unsaved changes warning on navigate away
```

---

## Part 5 — Impeccable Commands Reference for Claude Code

When iterating on UI, use these mental commands:

```
/polish     → Before marking any screen done, do a visual pass:
               - Is every color from the token system?
               - Is every font size from the typography scale?
               - Are tap targets all ≥ 44pt?
               - Is there a loading state?
               - Is there an empty state?
               - Is there an error state?

/bolder     → Use when a screen feels too timid:
               - Increase heading size one step
               - Increase priority indicator width from 3pt to 4pt
               - Darken secondary text one step

/quieter    → Use when a screen feels cluttered:
               - Remove any decorative element that doesn't carry information
               - Reduce shadow intensity by half
               - Consolidate 3+ metadata items into 2 rows max

/typeset    → When typography feels generic:
               - Check all font weights are used intentionally
               - Check letter-spacing on labels is applied correctly
               - Check line-heights create comfortable reading rhythm

/audit      → Pre-ship checklist (run on every screen before PR):
               1. Tap targets ≥ 44pt?
               2. Text contrast ≥ 4.5:1?
               3. Empty state handled?
               4. Error state handled?
               5. Loading skeleton matches content shape?
               6. No hardcoded colors or font sizes?
               7. Works on iPhone SE (375pt) AND iPhone Pro Max (430pt)?
               8. Works on Android (360pt) AND Android XL (412pt)?
```

---

## Part 6 — The 3-Second Test (From AIS School Standard)

Every screen must pass the 3-second test:
> Show the screen to someone for 3 seconds, then hide it. They should be able to tell you:
> 1. What app this is
> 2. What the most important information on the screen is
> 3. What the next action is

If they can't — the visual hierarchy needs work. Apply `/bolder` and `/typeset`.

---

## Part 7 — PRODUCT.md Template (Run Before Every New Screen)

Before building a new screen, fill this in:

```markdown
## Screen: [Screen Name]

**Surface:** Mobile App / Web Admin
**Users:** Super Admin / Admin / Employee
**Single job:** [One sentence — what does the user accomplish here?]
**Signature element:** [What makes this screen visually distinct?]
**Anti-references:** [3 things this screen should NOT look like]

**Color tokens used:** [List only the tokens needed — if you need more than 6, the screen is too complex]
**Typography:** [List heading and body choices]
**Key interactions:** [List the 2-3 actions — everything else is secondary]
```

---

## Part 8 — Quick Dos and Don'ts Summary

### ✅ DO
- Design the screen in ASCII wireframe before writing JSX
- Name the signature element before starting code
- Load **Inter** at all 4 weights — never use system fonts
- Use **skeleton loaders** in the exact shape of the content they replace
- Make the **overdue count** the most visually prominent number on the dashboard
- Apply **haptic feedback** on task status changes (expo-haptics)
- Ensure **dark mode** color token equivalents exist from day one (even if not switched on)
- Run the **/audit** checklist before every screen PR

### ❌ DON'T
- Never start with a Tailwind component library template and style over it — design first
- Never use gradients on data screens
- Never use more than 2 typeface weights in a single component
- Never design only for iPhone 14 Pro — test on iPhone SE and Android 360pt
- Never add animation to cover up missing content — if data isn't there, show empty state
- Never ship a screen without all three states: loading, empty, error
- Never ignore the priority stripe — it is the visual identity of this product