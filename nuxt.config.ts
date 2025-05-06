// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@nuxt/icon',
    '@nuxt/test-utils/module',
    '@nuxtjs/seo',
    '@vite-pwa/nuxt'
  ],
  // LiveKit configuration
  runtimeConfig: {
    livekit: {
      apiKey: process.env.LIVEKIT_API_KEY,
      apiSecret: process.env.LIVEKIT_API_SECRET,
      wsUrl: 'wss://ws.adidharmatoru.dev'
    },
    // Keys within public are exposed to the client
    public: {
      livekit: {
        wsUrl: 'wss://ws.adidharmatoru.dev'
      }
    }
  },
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
        },
        {
          rel: 'manifest',
          href: '/manifest.webmanifest',
          type: 'application/manifest+json',
          crossorigin: 'use-credentials'
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
      },
      '/manifest.webmanifest': {
        headers: {
          'Content-Type': 'application/manifest+json; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate'
        }
      },
      '/manifest.json': {
        headers: {
          'Content-Type': 'application/manifest+json; charset=utf-8',
          'Cache-Control': 'public, max-age=0, must-revalidate'
        }
      }
    },
    prerender: {
      routes: ['/']
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
  },
  // PWA Configuration
  pwa: {
    registerType: 'autoUpdate',
    includeAssets: [
      'favicon.ico',
      'favicon-dark.svg',
      'favicon-light.svg',
      'screenshots/*',
      '/'
    ],
    manifest: {
      name: 'Remo - Hardware-Accelerated Remote Desktop',
      short_name: 'Remo',
      description: 'Hardware-Accelerated Remote Desktop',
      lang: 'en',
      theme_color: '#0b0d0e',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      id: '/',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ],
      screenshots: [
        {
          src: 'screenshots/desktop.png',
          sizes: '1920x1024',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Remo Desktop Experience'
        },
        {
          src: 'screenshots/mobile.png',
          sizes: '889x1920',
          type: 'image/png',
          label: 'Remo Mobile Experience'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,webp}'],
      cleanupOutdatedCaches: true,
      sourcemap: false,
      skipWaiting: true,
      clientsClaim: true,
      runtimeCaching: [
        {
          urlPattern: '/',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'root-cache',
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    devOptions: {
      enabled: true,
      type: 'module'
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 20
    },
    strategies: 'injectManifest',
    injectManifest: {
      globPatterns: ['**/*.{js,json,css,html,ico,png,svg,webp,woff,woff2}'],
      maximumFileSizeToCacheInBytes: 3000000
    },
    filename: 'sw.js',
    manifestFilename: 'manifest.webmanifest'
  },
  experimental: {
    payloadExtraction: false
  }
});
