import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#1A5CF8',
          600: '#1648D0',
          700: '#1238A8',
          900: '#0D2270',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8FAFC',
          page: '#F4F6FA',
          subtle: '#F1F5F9',
          border: '#E2E8F0',
        },
        priority: {
          low: '#22C55E',
          'low-bg': '#F0FDF4',
          medium: '#F59E0B',
          'medium-bg': '#FFFBEB',
          high: '#EF4444',
          'high-bg': '#FEF2F2',
          critical: '#7C3AED',
          'critical-bg': '#F5F3FF',
        },
        status: {
          pending: '#94A3B8',
          'pending-bg': '#F8FAFC',
          accepted: '#60A5FA',
          'accepted-bg': '#EFF6FF',
          'in-progress': '#F59E0B',
          'in-progress-bg': '#FFFBEB',
          'under-review': '#A78BFA',
          'under-review-bg': '#F5F3FF',
          completed: '#22C55E',
          'completed-bg': '#F0FDF4',
          cancelled: '#EF4444',
          'cancelled-bg': '#FEF2F2',
          overdue: '#DC2626',
          'overdue-bg': '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      // Restrained elevation: borders carry separation, shadows stay near-flat
      // and cool-tinted (slate 15,23,42). Heavy drop-shadows on every card read
      // as generic — keep real shadow for floating elements only (modals, menus).
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        'card-hover': '0 2px 8px -2px rgb(15 23 42 / 0.08)',
      },
      // In `spacing` (not just `width`) so both the sidebar's `w-sidebar` and
      // the content offset's `ml-sidebar`/`ml-sidebar-rail` resolve — otherwise
      // the fixed sidebar has no matching content margin and overlaps it.
      spacing: { sidebar: '240px', 'sidebar-rail': '60px' },
    },
  },
  plugins: [],
};

export default config;
