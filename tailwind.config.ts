import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ['Satoshi', 'Inter', 'system-ui', 'sans-serif'],
    },
    extend: {
      // 8pt base grid system
      spacing: {
        '0.5': '0.125rem', // 2px
        '1': '0.25rem',    // 4px
        '2': '0.5rem',     // 8px
        '3': '0.75rem',    // 12px
        '4': '1rem',       // 16px
        '5': '1.25rem',    // 20px
        '6': '1.5rem',     // 24px
        '8': '2rem',       // 32px
        '10': '2.5rem',    // 40px
        '12': '3rem',      // 48px
        '16': '4rem',      // 64px
        '20': '5rem',      // 80px
        '24': '6rem',      // 96px
        '32': '8rem',      // 128px
        '40': '10rem',     // 160px
        '48': '12rem',     // 192px
        '64': '16rem',     // 256px
        '80': '20rem',     // 320px
        '96': '24rem',     // 384px
      },
             colors: {
               brand: {
                 300: "#C2A8FF",
                 400: "#B491FF",
                 500: "#9A6AFF",
                 600: "#6B4EFF",
               },
        // Semantic color system
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          500: "#ef4444",
          600: "#dc2626",
        },
        info: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#3b82f6",
          600: "#2563eb",
        },
        // Neutral gray ramp
        neutral: {
          50: "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a",
        },
        // Glass morphism tokens
        glass: {
          subtle: "rgba(255, 255, 255, 0.03)",
          default: "rgba(255, 255, 255, 0.05)",
          elevated: "rgba(255, 255, 255, 0.10)",
        },
        border: {
          subtle: "rgba(255, 255, 255, 0.08)",
          default: "rgba(255, 255, 255, 0.10)",
          elevated: "rgba(255, 255, 255, 0.15)",
        }
      },
      borderRadius: {
        frame: "28px",
      },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(99,102,241,0.35)" },
          "70%": { boxShadow: "0 0 0 24px rgba(99,102,241,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(99,102,241,0)" }
        },
      },
      animation: {
        float: "float 5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        pulseRing: "pulseRing 2.4s ease-out infinite",
      },
      scale: {
        '102': '1.02',
        '98': '0.98',
      },
      // Typography system - Tight, cohesive scale
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }], // 48px - Hero headlines
        'heading': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }], // 30px - Section headings
        'large': ['1.125rem', { lineHeight: '1.6', letterSpacing: '0' }], // 18px - Emphasis text
        'body': ['1rem', { lineHeight: '1.6', letterSpacing: '0' }], // 16px - Body text
        'small': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }], // 14px - Small text
      },
      // Depth system - 3 surface levels
      boxShadow: {
        'base': '0 1px 2px 0 rgb(255 255 255 / 0.05)',
        'raised': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'overlay': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'elev-1': "0 10px 30px -10px rgba(99,102,241,0.25)",
        'elev-2': "0 20px 60px -18px rgba(99,102,241,0.35)",
      },
      // Micro-interaction timing
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
             // Glass morphism utilities
             backgroundImage: {
               'glass-subtle': 'linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)',
               'glass-default': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
               'glass-elevated': 'linear-gradient(135deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.06) 100%)',
               'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
             }
    },
  },
  plugins: [],
} satisfies Config;
