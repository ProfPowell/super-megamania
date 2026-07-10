/**
 * Service Worker for Super Megamania PWA
 * Provides offline support and asset caching
 */

// Bump the version whenever the file list or any cached file changes —
// activate() deletes caches with other names, which is our only
// invalidation mechanism.
const CACHE_NAME = 'super-megamania-v2';

// Everything the game needs to run offline. All same-origin: cache.addAll
// rejects wholesale if ANY entry fails, so listing a missing file (or a
// CDN URL that's down) silently kills the whole install.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles/style.css',
  './manifest.webmanifest',
  './src/app/context.js',
  './src/app/eventBus.js',
  './src/app/events.js',
  './src/assets/assetLoader.js',
  './src/assets/themes.js',
  './src/audio/audioManager.js',
  './src/canvas.js',
  './src/config/gameConfig.js',
  './src/config/wavesExpanded.js',
  './src/entities/enemyExpanded.js',
  './src/entities/player.js',
  './src/entities/powerup.js',
  './src/entities/projectile.js',
  './src/gameLoop.js',
  './src/input/inputManager.js',
  './src/input/keyboard.js',
  './src/input/touch.js',
  './src/main.js',
  './src/scenes/_bonusStateMutations.js',
  './src/scenes/bonusScene.js',
  './src/scenes/gameOverScene.js',
  './src/scenes/menuScene.js',
  './src/scenes/microModeScene.js',
  './src/scenes/micromodes/captcha.js',
  './src/scenes/micromodes/coffeeBreak.js',
  './src/scenes/micromodes/emojiRain.js',
  './src/scenes/micromodes/loading99.js',
  './src/scenes/playScene.js',
  './src/scenes/sceneController.js',
  './src/state/gameState.js',
  './src/storage/highScores.js',
  './src/storage/settings.js',
  './src/systems/backgroundSystem.js',
  './src/systems/collision.js',
  './src/systems/juice.js',
  './src/systems/memeIntrusion.js',
  './src/systems/microModeTrigger.js',
  './src/systems/particleSystem.js',
  './src/systems/postEffects.js',
  './src/systems/screenShake.js',
  './src/systems/waveManager.js',
  './src/ui/hud.js',
  './src/ui/menu.js',
  './assets/images/absurd/enemies/amogus.svg',
  './assets/images/absurd/enemies/angry-ai.svg',
  './assets/images/absurd/enemies/bitcoin.svg',
  './assets/images/absurd/enemies/chili.svg',
  './assets/images/absurd/enemies/coffee.svg',
  './assets/images/absurd/enemies/cowboyhat.svg',
  './assets/images/absurd/enemies/dab.svg',
  './assets/images/absurd/enemies/distracted.svg',
  './assets/images/absurd/enemies/doge.svg',
  './assets/images/absurd/enemies/error404.svg',
  './assets/images/absurd/enemies/fidget.svg',
  './assets/images/absurd/enemies/knuckles.svg',
  './assets/images/absurd/enemies/loading.svg',
  './assets/images/absurd/enemies/martini.svg',
  './assets/images/absurd/enemies/mcdonalds.svg',
  './assets/images/absurd/enemies/nyan.svg',
  './assets/images/absurd/enemies/pepe.svg',
  './assets/images/absurd/enemies/pizza.svg',
  './assets/images/absurd/enemies/plunger.svg',
  './assets/images/absurd/enemies/poop.svg',
  './assets/images/absurd/enemies/pumpkin.svg',
  './assets/images/absurd/enemies/rickroll.svg',
  './assets/images/absurd/enemies/screaming-emoji.svg',
  './assets/images/absurd/enemies/skull.svg',
  './assets/images/absurd/enemies/stonks.svg',
  './assets/images/absurd/enemies/tidepod.svg',
  './assets/images/absurd/enemies/toilet.svg',
  './assets/images/absurd/enemies/trollface.svg',
  './assets/images/absurd/enemies/wrench.svg',
  './assets/images/absurd/player/hotdog.svg',
  './assets/images/enemies/demo-enemy1.svg',
  './assets/images/enemies/demo-enemy2.svg',
  './assets/images/enemies/demo-enemy3.svg',
  './assets/images/player/demo-ship.svg',
  './assets/music/background.wav'
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
