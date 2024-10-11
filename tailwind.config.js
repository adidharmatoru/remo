/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  plugins: ['@tailwindcss/typography', 'prettier-plugin-tailwindcss'],
  theme: {
    extend: {
      height: {
        '10v': '10vh',
        '20v': '20vh',
        '30v': '30vh',
        '40v': '40vh',
        '50v': '50vh',
        '60v': '60vh',
        '70v': '70vh',
        '80v': '80vh',
        '90v': '90vh',
        '100v': '100vh'
      },
      backdropBlur: {
        xs: '1px'
      },
      colors: {
        canvas: {
          default: 'var(--color-canvas-default)',
          subtle: 'var(--color-canvas-subtle)'
        },
        border: {
          default: 'var(--color-border-default)'
        },
        success: {
          subtle: 'var(--color-success-subtle)',
          fg: 'var(--color-success-fg)'
        },
        danger: {
          subtle: 'var(--color-danger-subtle)',
          fg: 'var(--color-danger-fg)'
        },
        accent: {
          subtle: 'var(--color-accent-subtle)'
        },
        neutral: {
          subtle: 'var(--color-neutral-subtle)'
        }
      }
    },
    fontFamily: {
      inter: ['inter', 'sans-serif'],
      poppins: ['poppins', 'serif'],
      'fira-mono': ['fira-mono']
    }
  }
};
