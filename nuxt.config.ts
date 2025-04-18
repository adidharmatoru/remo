// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@nuxt/test-utils/module',
    '@nuxtjs/seo'
  ],
  colorMode: {
    preference: 'dark', // default value of $colorMode.preference
    fallback: 'light', // fallback value if not system preference found
    hid: 'nuxt-color-mode-script',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '-mode',
    storage: 'localStorage', // or 'sessionStorage' or 'cookie'
    storageKey: 'nuxt-color-mode'
  },
  css: ['~/assets/css/app.css'],
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon-light.svg',
          media: '(prefers-color-scheme: light)'
        },
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/favicon-dark.svg',
          media: '(prefers-color-scheme: dark)'
        }
      ],
      htmlAttrs: {
        lang: 'en'
      }
    }
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  build: {
    transpile: ['vue-teleport']
  },
  imports: {
    dirs: ['composables/**']
  },
  // Remove static site generation configuration
  nitro: {
    // Enable server-side rendering
    preset: 'node-server',
    // Add compression for better performance
    compressPublicAssets: true,
    // Add caching headers for static assets
    routeRules: {
      '/_nuxt/**': {
        headers: { 'cache-control': 'public, max-age=31536000, immutable' }
      }
    }
  },
  // Enable server-side rendering
  ssr: true,
  // SEO Tags
  site: {
    url: 'https://remo.adidharmatoru.dev',
    name: 'Remo - Hardware-Accelerated Remote Desktop',
    description: 'Hardware-Accelerated Remote Desktop'
  },
  schemaOrg: {
    identity: 'Organization'
  }
});
