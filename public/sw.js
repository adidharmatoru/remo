import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Skip waiting and claim clients
self.skipWaiting();
clientsClaim();

// Clean up old caches
cleanupOutdatedCaches();

// Precache and route
precacheAndRoute(self.__WB_MANIFEST);

// Log successful installation
self.addEventListener('install', () => {
  console.log('Service Worker installed');
});

// Log activation
self.addEventListener('activate', () => {
  console.log('Service Worker activated');
});

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});
