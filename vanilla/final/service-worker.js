/**
 * Service Worker for Super Megamania PWA
 * Provides offline support and asset caching
 */

const CACHE_NAME = 'super-megamania-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles/style.css',
  './src/main.js',
  './src/canvas.js',
  './src/gameLoop.js',
  './src/config/gameConfig.js',
  './src/config/waves.js',
  './src/state/gameState.js',
  './src/input/keyboard.js',
  './src/input/touch.js',
  './src/input/inputManager.js',
  './src/entities/player.js',
  './src/entities/enemy.js',
  './src/entities/projectile.js',
  './src/systems/collision.js',
  './src/systems/waveManager.js',
  './src/systems/particleSystem.js',
  './src/ui/hud.js',
  './src/ui/menu.js',
  './src/storage/highScores.js',
  './src/storage/settings.js',
  './src/audio/audioManager.js',
  './manifest.webmanifest',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
];

/**
 * Install event - cache assets
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Caching failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return cached response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request
        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache the new response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            // Could return a custom offline page here
            throw error;
          });
      })
  );
});
