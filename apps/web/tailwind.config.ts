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
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      width: { sidebar: '240px', 'sidebar-rail': '60px' },
    },
  },
  plugins: [],
};

export default config;
