import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

/** `hsl(var(--x) / <alpha-value>)` — habilita modificadores de opacidade
 *  (`bg-primary/90`) sobre os triplets HSL definidos em `globals.css`. */
function hslVar(name: string) {
  return `hsl(var(${name}) / <alpha-value>)`
}

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        sans: [
          'Instrument Sans',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        border: hslVar('--border'),
        'border-strong': hslVar('--border-strong'),
        'border-faint': hslVar('--border-faint'),
        input: hslVar('--input'),
        ring: hslVar('--ring'),
        background: hslVar('--background'),
        foreground: hslVar('--foreground'),
        canvas: hslVar('--canvas'),
        surface: hslVar('--surface'),
        subtle: hslVar('--subtle'),
        content: {
          secondary: hslVar('--content-secondary'),
          muted: hslVar('--content-muted'),
          subtle: hslVar('--content-subtle'),
          disabled: hslVar('--content-disabled'),
        },
        primary: {
          DEFAULT: hslVar('--primary'),
          foreground: hslVar('--primary-foreground'),
          hover: hslVar('--primary-hover'),
        },
        secondary: {
          DEFAULT: hslVar('--secondary'),
          foreground: hslVar('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: hslVar('--destructive'),
          foreground: hslVar('--destructive-foreground'),
        },
        muted: {
          DEFAULT: hslVar('--muted'),
          foreground: hslVar('--muted-foreground'),
        },
        accent: {
          DEFAULT: hslVar('--accent'),
          foreground: hslVar('--accent-foreground'),
        },
        // ── Marca (tenant) — sempre o accent, mesmo quando o primário vira tinta ──
        brand: {
          DEFAULT: hslVar('--brand'),
          foreground: hslVar('--brand-foreground'),
        },
        // ── Casco (shell): sidebar + appbar. Cores COMPLETAS (var direto, sem
        //    hsl()) porque derivam de --brand / color-mix; comutadas por data-shell.
        nav: {
          DEFAULT: 'var(--nav-bg)',
          foreground: 'var(--nav-fg)',
          muted: 'var(--nav-muted)',
          border: 'var(--nav-border)',
          hover: 'var(--nav-hover-bg)',
          active: 'var(--nav-active-bg)',
          'active-foreground': 'var(--nav-active-fg)',
        },
        appbar: {
          DEFAULT: 'var(--appbar-bg)',
          foreground: 'var(--appbar-fg)',
          border: 'var(--appbar-border)',
        },
        popover: {
          DEFAULT: hslVar('--popover'),
          foreground: hslVar('--popover-foreground'),
        },
        card: {
          DEFAULT: hslVar('--card'),
          foreground: hslVar('--card-foreground'),
        },
        // ── Semânticas fixas (status/estados) ──
        danger: {
          DEFAULT: hslVar('--danger'),
          soft: hslVar('--danger-soft'),
          foreground: hslVar('--danger-foreground'),
        },
        warning: {
          DEFAULT: hslVar('--warning'),
          soft: hslVar('--warning-soft'),
          foreground: hslVar('--warning-foreground'),
        },
        success: {
          DEFAULT: hslVar('--success'),
          soft: hslVar('--success-soft'),
          foreground: hslVar('--success-foreground'),
        },
        neutralc: {
          DEFAULT: hslVar('--neutralc'),
          soft: hslVar('--neutralc-soft'),
          foreground: hslVar('--neutralc-foreground'),
        },
        info: {
          DEFAULT: hslVar('--info'),
          soft: hslVar('--info-soft'),
          foreground: hslVar('--info-foreground'),
        },
        chart: {
          1: hslVar('--chart-1'),
          2: hslVar('--chart-2'),
          3: hslVar('--chart-3'),
          4: hslVar('--chart-4'),
          5: hslVar('--chart-5'),
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)', // ~5px
        md: 'calc(var(--radius) - 2px)', // ~7px  botão/input
        lg: 'var(--radius)', // 9px  card
        modal: '12px',
        pill: '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,26,23,.05)',
        raised: '0 1px 3px rgba(28,26,23,.08), 0 1px 2px rgba(28,26,23,.04)',
        overlay: '0 12px 32px rgba(28,26,23,.14)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        gear: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // Engrenagens decorativas do login — giro lento e contínuo.
        'gear-slow': 'gear 18s linear infinite',
        'gear-slow-reverse': 'gear 13s linear infinite reverse',
      },
    },
  },
  plugins: [animate],
}

export default config
