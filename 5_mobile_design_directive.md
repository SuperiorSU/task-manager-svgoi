# 05 — Mobile Design System
### Godigitify Nexus · React Native Design Tokens + Component Patterns
**Version:** 1.0 | **Reference UI:** PetPooja-style task management · Clean · Information-dense · Functional

---

## DIRECTIVE GOAL
Define the complete visual language for the SVGOI Task Management mobile app.
Every component is derived from these tokens. No component hardcodes a color, font size, or spacing value.
The design language: **clean, institutional, high-information-density with clear hierarchy** — 
professional enough for a college administration system, fast enough for daily use.

---

## 1. Visual Direction

**Personality:** Institutional confidence meets mobile clarity.
Think: clean card surfaces, strong typographic hierarchy, status-driven color language.
NOT: playful, gradient-heavy, consumer-social. YES: WhatsApp Business meets Notion mobile.

**Signature element:** Priority indicator — a left-border colored stripe on every task card
(Critical=purple, High=red, Medium=amber, Low=green) that gives instant visual scanning
without reading the label. Inspired by PetPooja's category tagging.

**Anti-references:** Don't build this like a generic Jira clone. Avoid:
- Excessive whitespace that wastes screen real estate
- Icon-only actions without visible labels (accessibility failure)
- Gradient backgrounds on data-heavy screens
- Full-screen modals for simple confirmations (use action sheets)

---

## 2. Color Tokens

```typescript
// src/constants/colors.ts

export const Colors = {
  // ─── Brand ──────────────────────────────────────────────────────
  brand: {
    primary: '#1A5CF8',      // CTA, active tab, primary button
    primaryDark: '#1238A8',  // Pressed state
    primaryLight: '#EFF6FF', // Selected backgrounds
    secondary: '#0D2270',    // Headers, heavy emphasis
  },

  // ─── Surfaces ───────────────────────────────────────────────────
  surface: {
    background: '#F4F6FA',   // App background (slightly cool white)
    card: '#FFFFFF',         // Card backgrounds
    cardElevated: '#FFFFFF', // Elevated card (modal, bottom sheet)
    border: '#E2E8F0',       // Dividers, borders
    borderStrong: '#CBD5E1', // Input borders on focus
    overlay: 'rgba(0,0,0,0.4)', // Modal backdrop
  },

  // ─── Text ───────────────────────────────────────────────────────
  text: {
    primary: '#0F172A',    // Headings, primary content
    secondary: '#475569',  // Secondary labels, metadata
    tertiary: '#94A3B8',   // Placeholders, hints
    inverse: '#FFFFFF',    // Text on dark backgrounds
    link: '#1A5CF8',       // Links, tappable text
    disabled: '#CBD5E1',   // Disabled state
  },

  // ─── Priority Colors ─────────────────────────────────────────────
  priority: {
    critical: {
      solid: '#7C3AED',    // Purple
      bg: '#F5F3FF',
      border: '#C4B5FD',
      text: '#5B21B6',
    },
    high: {
      solid: '#EF4444',    // Red
      bg: '#FEF2F2',
      border: '#FECACA',
      text: '#B91C1C',
    },
    medium: {
      solid: '#F59E0B',    // Amber
      bg: '#FFFBEB',
      border: '#FDE68A',
      text: '#B45309',
    },
    low: {
      solid: '#22C55E',    // Green
      bg: '#F0FDF4',
      border: '#BBF7D0',
      text: '#15803D',
    },
  },

  // ─── Status Colors ───────────────────────────────────────────────
  status: {
    pending: {
      solid: '#94A3B8',
      bg: '#F8FAFC',
      text: '#475569',
    },
    accepted: {
      solid: '#60A5FA',
      bg: '#EFF6FF',
      text: '#1D4ED8',
    },
    inProgress: {
      solid: '#F59E0B',
      bg: '#FFFBEB',
      text: '#B45309',
    },
    underReview: {
      solid: '#A78BFA',
      bg: '#F5F3FF',
      text: '#6D28D9',
    },
    completed: {
      solid: '#22C55E',
      bg: '#F0FDF4',
      text: '#15803D',
    },
    cancelled: {
      solid: '#94A3B8',
      bg: '#F8FAFC',
      text: '#64748B',
    },
    overdue: {
      solid: '#DC2626',
      bg: '#FEF2F2',
      text: '#991B1B',
    },
  },

  // ─── Semantic ────────────────────────────────────────────────────
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    successBg: '#F0FDF4',
    warningBg: '#FFFBEB',
    errorBg: '#FEF2F2',
    infoBg: '#EFF6FF',
  },

  // ─── Dark mode (future-proofed) ──────────────────────────────────
  dark: {
    background: '#0F172A',
    card: '#1E293B',
    border: '#334155',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
  },
} as const;
```

---

## 3. Typography Scale

```typescript
// src/constants/typography.ts
// Base font: Inter (all weights loaded via expo-font)

export const Typography = {
  // ─── Font Families ──────────────────────────────────────────────
  family: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
  },

  // ─── Type Scale ──────────────────────────────────────────────────
  // Display
  displayLg: { fontSize: 32, lineHeight: 40, letterSpacing: -0.5 },
  displaySm: { fontSize: 28, lineHeight: 36, letterSpacing: -0.3 },

  // Headings
  h1: { fontSize: 24, lineHeight: 32, letterSpacing: -0.2 },
  h2: { fontSize: 20, lineHeight: 28, letterSpacing: -0.1 },
  h3: { fontSize: 18, lineHeight: 26, letterSpacing: 0 },
  h4: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },

  // Body
  bodyLg: { fontSize: 16, lineHeight: 24 },
  bodyMd: { fontSize: 14, lineHeight: 22 },
  bodySm: { fontSize: 13, lineHeight: 20 },

  // UI Labels
  labelLg: { fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMd: { fontSize: 12, lineHeight: 18, letterSpacing: 0.2 },
  labelSm: { fontSize: 11, lineHeight: 16, letterSpacing: 0.3 },

  // Captions
  caption: { fontSize: 12, lineHeight: 16, letterSpacing: 0.1 },
  captionSm: { fontSize: 11, lineHeight: 14 },

  // Mono (for IDs, codes)
  mono: { fontSize: 13, lineHeight: 20, letterSpacing: 0 },
} as const;
```

---

## 4. Spacing System (4pt Grid)

```typescript
// src/constants/spacing.ts
// Everything in multiples of 4. Never use arbitrary numbers.

export const Spacing = {
  px: 1,    // 1px hairline — border only
  '0.5': 2, // 2pt
  1: 4,     // 4pt — minimum breathing room
  2: 8,     // 8pt — tight spacing
  3: 12,    // 12pt — component internal padding
  4: 16,    // 16pt — standard padding (screen edges)
  5: 20,    // 20pt
  6: 24,    // 24pt — section spacing
  7: 28,    // 28pt
  8: 32,    // 32pt — large spacing
  10: 40,   // 40pt — section separators
  12: 48,   // 48pt — hero spacing
  16: 64,   // 64pt — large gaps
} as const;

export const Layout = {
  screenPaddingH: 16,       // Horizontal screen edge padding
  screenPaddingV: 20,       // Vertical screen padding
  cardPadding: 16,          // Internal card padding
  cardRadius: 12,           // Card border radius
  cardRadiusLg: 16,         // Large card
  buttonRadius: 10,         // Button radius
  inputRadius: 10,          // Input radius
  badgeRadius: 6,           // Small badge
  tabBarHeight: 60,         // Bottom tab bar
  headerHeight: 56,         // Screen header
  taskCardMinHeight: 96,    // Task card minimum height
} as const;
```

---

## 5. Component Specifications

### 5.1 TaskCard
```
┌─────────────────────────────────────────┐
│ ▌ [Priority stripe]  [Status badge]  [⋮]│  ← 4pt left border in priority color
│   Task Title (h4, semiBold, max 2 lines) │
│   Department · Due Dec 25 · John D.      │  ← 12pt, secondary color
│   ━━━━━━━━━━░░░░░░░░ 60%                 │  ← Progress bar (if time-based)
└─────────────────────────────────────────┘

Specs:
- Left border: 4pt width, full height, priority color
- Card padding: 16pt horizontal, 14pt vertical
- Card radius: 12pt
- Shadow: 0 1pt 3pt rgba(0,0,0,0.08)
- Title: Typography.h4, Inter-SemiBold, Colors.text.primary
- Metadata row: Typography.labelMd, Colors.text.secondary
- Priority stripe tap area: full card is tappable
- Swipe left reveals: Accept / Reassign quick actions
```

### 5.2 StatusBadge
```
Specs:
- Pill shape: paddingH=10, paddingV=4, radius=20
- Font: Typography.labelSm, weight=SemiBold
- Background: status.{status}.bg
- Text: status.{status}.text
- No icon by default (keep it tight)

Examples:
[PENDING]      ← slate bg/text
[IN PROGRESS]  ← amber bg/text
[COMPLETED]    ← green bg/text
[OVERDUE]      ← red bg/text, slight pulse animation
```

### 5.3 PriorityBadge
```
Specs:
- Square-ish pill: paddingH=8, paddingV=3
- Font: Typography.labelSm (11pt), weight=Bold, uppercase, letter-spacing=0.5
- All four colors from priority token

[CRITICAL]  ← purple
[HIGH]      ← red
[MEDIUM]    ← amber
[LOW]       ← green
```

### 5.4 Button
```
Primary:
- Background: Colors.brand.primary
- Text: Colors.text.inverse, Typography.labelLg, SemiBold
- Height: 52pt (comfortable tap target)
- Radius: Layout.buttonRadius (10pt)
- Pressed: Colors.brand.primaryDark + scale(0.98) animation

Secondary (Outlined):
- Border: 1.5pt, Colors.brand.primary
- Text: Colors.brand.primary
- Background: transparent

Danger:
- Background: Colors.semantic.error
- Use only for destructive actions (cancel task, etc.)

Ghost:
- No border, no background
- Text: Colors.brand.primary
- Use for low-priority inline actions

Disabled state on all variants:
- opacity: 0.5, not interactive
```

### 5.5 Input
```
Specs:
- Height: 52pt
- Padding: 16pt horizontal, 14pt vertical
- Radius: 10pt
- Border: 1.5pt, Colors.surface.border
- Focus border: Colors.brand.primary
- Error border: Colors.semantic.error
- Background: Colors.surface.card
- Label: Typography.labelMd, Colors.text.secondary, 8pt above input
- Error text: Typography.caption, Colors.semantic.error, 4pt below input
- Placeholder: Colors.text.tertiary
```

### 5.6 Dashboard StatCard
```
┌──────────────────────────┐
│  [Icon bg circle]  [Trend↑]│
│                           │
│  47                       │  ← Display number, h1 or displaySm
│  Total Tasks              │  ← labelMd, secondary
│  +12 from last week       │  ← caption, trend color
└──────────────────────────┘

- Card: 160pt wide × 120pt tall (2-per-row grid)
- Icon circle: 44pt diameter, brand.primaryLight bg
- Number: Typography.displaySm, Inter-Bold
- Trend: semantic.success or semantic.error
```

### 5.7 Bottom Tab Bar
```
Tabs (left to right):
[Dashboard]  [My Tasks]  [Calendar]  [Profile]

Active tab:
- Icon: filled variant, Colors.brand.primary
- Label: Typography.labelSm, Colors.brand.primary
- Indicator: 3pt dot or line above icon

Inactive:
- Icon: outline variant, Colors.text.tertiary
- Label: Typography.labelSm, Colors.text.tertiary

Badge (notification count):
- Position: top-right of icon
- Background: Colors.semantic.error
- Text: white, 10pt, min 18pt diameter
```

---

## 6. Screen Layout Templates

### 6.1 List Screen (My Tasks, Notifications)
```
┌─────────────────────────────┐
│ [Back]  Screen Title  [+]   │  ← ScreenHeader 56pt
│─────────────────────────────│
│ ┌──────────────────────────┐│
│ │ 🔍 Search tasks...       ││  ← Search input, sticky
│ └──────────────────────────┘│
│ [All] [Pending] [In Progress]│  ← Filter chips, horizontal scroll
│─────────────────────────────│
│                             │
│  TaskCard                   │  ← FlatList with 12pt gap
│  TaskCard                   │
│  TaskCard                   │
│                             │
│─────────────────────────────│
│ [Dashboard] [Tasks] [Cal] [👤]│  ← Bottom tab 60pt
└─────────────────────────────┘
```

### 6.2 Task Detail Screen
```
┌─────────────────────────────┐
│ [←]  Task Detail    [Edit]  │
│─────────────────────────────│
│  ▌ CRITICAL  [IN PROGRESS]  │  ← Priority stripe + status
│  Fix Lab Equipment Schedule │  ← h2, title
│  Physics Department         │  ← labelMd, dept tag
│─────────────────────────────│
│  Due Date    📅 Dec 25, 5PM │
│  Assigned by  👤 Dr. Kumar  │
│  Assignee     👤 Rajan S.   │
│─────────────────────────────│
│  Description                │
│  Lorem ipsum task details...│
│─────────────────────────────│
│  Attachments (2)     [+ Add]│
│  ┌────────┐ ┌────────┐      │
│  │ PDF 📄 │ │ IMG 🖼 │      │
│  └────────┘ └────────┘      │
│─────────────────────────────│
│  Activity (8 events)        │
│  Timeline entries...        │
│─────────────────────────────│
│  [  Add Comment  ]  [Submit]│  ← Fixed bottom action bar
└─────────────────────────────┘
```

### 6.3 Dashboard Screen
```
┌─────────────────────────────┐
│  Good morning, Sujal 👋     │  ← Greeting, h2
│  Tuesday, Dec 24            │  ← date, caption
│─────────────────────────────│
│  [Total 47] [Pending 12]    │  ← StatCards 2-col grid
│  [Done 28]  [Overdue 7]     │
│─────────────────────────────│
│  ⚠️ Overdue Tasks (7)       │  ← Alert strip if overdue > 0
│─────────────────────────────│
│  Recent Activity            │
│  ─ Rajan accepted "Fix Lab" │
│  ─ You completed "Budget"   │
│─────────────────────────────│
│  Upcoming (next 7 days)     │
│  TaskCard (compact)         │
│  TaskCard (compact)         │
└─────────────────────────────┘
```

---

## 7. Animation Guidelines

```typescript
// Use react-native-reanimated for ALL animations
// Principle: purposeful, fast, non-blocking

// Timing standards
export const AnimationDuration = {
  instant: 100,    // Micro-interactions (checkbox check)
  fast: 200,       // Most UI transitions (button press, badge appear)
  standard: 300,   // Screen transitions, card expand
  slow: 500,       // Skeleton → content fade
} as const;

// Easing standards  
// spring: bouncy elements (FAB, success confirmation)
// easeOut: items entering the screen
// easeIn: items leaving the screen
// linear: progress bars, loaders

// Required animations:
// 1. Task card: swipe-to-reveal quick actions (useAnimatedGestureHandler)
// 2. Status badge: color transition on status change
// 3. Overdue badge: subtle pulse (every 3s, stop after 2 pulses)
// 4. Skeleton → content: fade in with slight upward translate
// 5. FAB: scale spring on press
// 6. Tab switch: translateY the content, no full-screen transitions

// Forbidden:
// No entrance animations on list items (kills scroll performance)
// No sustained looping animations except overdue pulse
// No animations on text content changes
```

---

## 8. Iconography

```
Use: @expo/vector-icons (Feather set as primary, MaterialIcons for platform-specific)

Standard icon size: 20pt
Navigation icon: 22pt
Header icon: 24pt
Large illustration icon: 40-48pt

Tappable icon minimum hit area: 44×44pt (use Pressable with hitSlop)

Icon + label spacing: 6pt

Icon meanings (locked — never repurpose):
✓ check-circle     → completed
✕ x-circle         → cancelled / error
⏰ clock            → due date, time
⚠️ alert-triangle  → overdue, warning
📎 paperclip        → attachment
💬 message-circle  → comment
↩ corner-up-left   → reassign
⊕ plus-circle      → create / add
🔔 bell             → notifications
⋮ more-vertical    → overflow menu
```

---

## 9. Gesture Patterns

```
Tap:            Primary action on cards (open detail)
Long press:     Multi-select mode on task lists
Swipe left:     Quick actions (Accept / Reassign / View)
Swipe down:     Dismiss bottom sheet
Pull to refresh: Refresh list data
Pinch:          Calendar zoom (daily/weekly/monthly)

Bottom sheet trigger height: 56pt drag handle area
Bottom sheet snap points: ['40%', '75%', '100%']
```

---

## 10. Accessibility Standards

```
Touch targets: minimum 44×44pt for all interactive elements
Color contrast: 4.5:1 minimum for body text, 3:1 for large text
Text scaling: support up to 150% Dynamic Type without layout breaking
Screen reader: all interactive elements have accessibilityLabel
Error states: never rely on color alone — always pair with icon/text
Reduced motion: check useReducedMotion() before playing animations
```

---

## 11. DOs and DON'Ts — Design System

### ✅ DO
- Reference **Colors.*** tokens always — never hardcode hex values
- Use **Typography.*** scale — never set fontSize directly
- Use **Spacing.*** values — multiples of 4 only
- Build **4pt priority stripe** into every task card — it's the signature element
- Test every screen in both **light mode AND dark mode** from day one
- Ensure **minimum 44×44pt** tap targets on all interactive elements
- Use **skeleton loaders** in the exact shape of the content they replace

### ❌ DON'T
- Never use system default fonts (no 'System', '-apple-system', 'Roboto' directly)
- Never use inline styles with hardcoded values
- Never show **more than 3 action buttons** on a single task card
- Never use **full-screen modal** for confirmation — use ConfirmDialog (bottom action sheet)
- Never animate **list item entrances** (destroys scroll performance at scale)
- Never use red for anything other than errors/overdue/critical
- Never make the **bottom tab bar taller than 60pt** (wasted real estate)