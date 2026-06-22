# 01 — TurboRepo Monorepo Setup Directive
### Godigitify Nexus · React Native + Next.js + Fastify
**Version:** 1.0 | **Stack:** TurboRepo + pnpm + Expo SDK 52 + EAS

---

## DIRECTIVE GOAL
Set up a production-grade TurboRepo monorepo that Claude Code can scaffold end-to-end.
Every workspace is independently deployable. Shared packages enforce type safety across all surfaces.
This file is the **single source of truth** for repo structure and tooling decisions.

---

## 1. Repository Structure

```
godigitify-rn-monorepo/
├── apps/
│   ├── mobile/                    # React Native + Expo (iOS + Android)
│   ├── web/                       # Next.js 15 App Router (Admin Dashboard)
│   └── api/                       # Fastify v5 Backend
├── packages/
│   ├── ui/                        # Shared React Native component library
│   ├── ui-web/                    # Shared Next.js component library
│   ├── types/                     # Shared TypeScript types & Zod schemas
│   ├── utils/                     # Pure utility functions (no framework deps)
│   ├── config/                    # Shared config: eslint, tsconfig, tailwind
│   └── api-client/                # Type-safe API client (used by mobile + web)
├── tooling/
│   ├── eslint/                    # ESLint shared config
│   └── typescript/                # Base tsconfig files
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint + typecheck + test on PR
│       ├── eas-build-preview.yml  # EAS Preview build on PR
│       └── eas-build-prod.yml    # EAS Production build on main
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.example
```

---

## 2. Tooling & Package Manager

**MANDATORY: Use pnpm. Never npm or yarn in this monorepo.**

```bash
# Bootstrap command (run once on fresh clone)
corepack enable
corepack prepare pnpm@9.x --activate
pnpm install
```

### pnpm-workspace.yaml
```yaml
packages:
  - "apps/*"
  - "packages/*"
  - "tooling/*"
```

### Root package.json
```json
{
  "name": "godigitify-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev --parallel",
    "dev:mobile": "turbo dev --filter=mobile",
    "dev:web": "turbo dev --filter=web",
    "dev:api": "turbo dev --filter=api",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "clean": "turbo clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\""
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "prettier": "^3.0.0",
    "@types/node": "^22.0.0",
    "typescript": "^5.5.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

---

## 3. turbo.json — Pipeline Definition

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "JWT_SECRET",
    "REDIS_URL",
    "EXPO_PUBLIC_API_URL",
    "NEXT_PUBLIC_API_URL"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "build/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "cache": false
    },
    "clean": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    }
  }
}
```

---

## 4. Shared TypeScript Config

### tooling/typescript/base.json
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

### tooling/typescript/react-native.json
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "jsx": "react-native",
    "paths": {
      "@/*": ["./src/*"],
      "@godigitify/types": ["../../packages/types/src"],
      "@godigitify/utils": ["../../packages/utils/src"],
      "@godigitify/ui": ["../../packages/ui/src"],
      "@godigitify/api-client": ["../../packages/api-client/src"]
    }
  }
}
```

### tooling/typescript/nextjs.json
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@godigitify/types": ["../../packages/types/src"],
      "@godigitify/utils": ["../../packages/utils/src"],
      "@godigitify/api-client": ["../../packages/api-client/src"]
    }
  }
}
```

---

## 5. Shared ESLint Config

### tooling/eslint/base.js
```js
module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "import/order": ["error", {
      "groups": ["builtin", "external", "internal", "parent", "sibling", "index"],
      "newlines-between": "always",
      "alphabetize": { "order": "asc" }
    }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

---

## 6. packages/types — Shared Type Definitions

```
packages/types/
├── src/
│   ├── index.ts                  # Re-exports everything
│   ├── auth.types.ts             # User, Role, Token types
│   ├── task.types.ts             # Task, Status, Priority types
│   ├── user.types.ts             # Employee, Admin, Profile types
│   ├── department.types.ts       # Department types
│   ├── notification.types.ts     # Notification types
│   ├── api.types.ts              # API request/response envelopes
│   └── schemas/                  # Zod validation schemas (source of truth)
│       ├── auth.schema.ts
│       ├── task.schema.ts
│       └── user.schema.ts
└── package.json
```

### Critical: All Zod schemas live here and are consumed by both API (validation) and mobile/web (form validation). Never duplicate schema logic.

### packages/types/src/api.types.ts
```typescript
export type ApiResponse<T> = {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: { page: number; limit: number; total: number; totalPages: number };
};
```

---

## 7. packages/api-client — Type-Safe HTTP Client

```
packages/api-client/
├── src/
│   ├── index.ts
│   ├── client.ts               # Base fetch wrapper with auth header injection
│   ├── auth.api.ts             # login, logout, refresh, resetPassword
│   ├── tasks.api.ts            # CRUD + status transitions + bulk ops
│   ├── users.api.ts            # profile, list, update
│   ├── departments.api.ts
│   ├── notifications.api.ts
│   └── reports.api.ts
└── package.json
```

### client.ts pattern (used across all api files)
```typescript
// Base client — wraps fetch with auth token injection + error normalization
// Both mobile (Expo) and web (Next.js) import from this package
// Token is injected via a configurable token provider function
// so mobile uses SecureStore and web uses httpOnly cookie / memory

export const createApiClient = (config: {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  onUnauthorized: () => void;
}) => { /* ... */ };
```

---

## 8. packages/utils — Pure Utilities

```
packages/utils/src/
├── date.utils.ts          # formatDate, isOverdue, getDaysRemaining, timeAgo
├── string.utils.ts        # truncate, capitalize, slugify, initials
├── validation.utils.ts    # email, phone, password strength
├── debounce.utils.ts      # debounce, throttle with proper TypeScript generics
├── storage.utils.ts       # Platform-agnostic key-value (bridges SecureStore/localStorage)
├── priority.utils.ts      # getPriorityColor, getPriorityLabel, sortByPriority
└── task.utils.ts          # getStatusColor, canTransitionTo, getNextStatus
```

---

## 9. Environment Variables

### .env.example (committed to repo — no secrets)
```env
# ─── API ───────────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/godigitify_db"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="change-this-in-production"
JWT_REFRESH_SECRET="change-this-in-production-too"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# ─── STORAGE ───────────────────────────────────────
SUPABASE_URL=""
SUPABASE_SERVICE_KEY=""
MAX_FILE_SIZE_MB=10

# ─── EMAIL ─────────────────────────────────────────
SMTP_HOST=""
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
FROM_EMAIL="noreply@godigitify.com"

# ─── PUSH NOTIFICATIONS ────────────────────────────
EXPO_PUSH_TOKEN_KEY=""          # For Expo push notifications

# ─── MOBILE APP (Expo) ─────────────────────────────
EXPO_PUBLIC_API_URL="http://localhost:3001"
EXPO_PUBLIC_APP_ENV="development"

# ─── WEB ADMIN (Next.js) ───────────────────────────
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_APP_ENV="development"
```

---

## 10. GitHub Actions CI Pipeline

### .github/workflows/ci.yml
```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --passWithNoTests
      - name: Check build
        run: pnpm build --filter=api --filter=web
```

### .github/workflows/eas-build-preview.yml
```yaml
name: EAS Preview Build
on:
  pull_request:
    branches: [main]
    paths: ['apps/mobile/**', 'packages/**']

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: eas build --profile preview --platform all --non-interactive
        working-directory: apps/mobile
```

---

## 11. Git Branch Strategy

```
main          ← Production. Protected. Only merges from develop.
develop       ← Staging. All feature PRs merge here.
feature/*     ← Feature branches. PR to develop.
hotfix/*      ← Emergency fixes. PR directly to main + backport to develop.
```

### Branch naming
```
feature/FR-11-task-creation
feature/FR-59-push-notifications
hotfix/auth-token-expiry-fix
```

---

## 12. DOs and DON'Ts — Monorepo Level

### ✅ DO
- Always run `pnpm install` from the **root**, never inside individual packages
- Import shared code via workspace aliases: `@godigitify/types`, never with relative `../../../`
- Add new shared types to `packages/types` first, then import where needed
- Pin Node.js version in `.nvmrc` and `engines` field
- Keep `turbo.json` pipeline updated when adding new build scripts
- Use `--filter` flag when running turbo commands for a single workspace during development
- Commit `.env.example` with all keys but no values

### ❌ DON'T
- Never install a package only used in one app inside a shared `packages/` workspace
- Never use `require()` — ESM only throughout the monorepo
- Never bypass TypeScript with `@ts-ignore` — fix the type properly
- Never hardcode environment variables — always read from `process.env` or `Constants.expoConfig`
- Never commit `.env` files — they are gitignored
- Never run EAS builds locally for production — always use CI pipeline
- Never duplicate validation logic — Zod schemas in `packages/types` are the single source