import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        '.nuxt/**',
        'coverage/**',
        'pages/**',
        'components/**',
        'app.vue',
        '**/*.d.ts',
        'test/**',
        '**/*.{test,spec}.{js,ts,jsx,tsx}',
        '**/*.config.{js,ts}'
      ]
    },
    globals: true,
    setupFiles: ['./tests/setup.js']
  }
});
