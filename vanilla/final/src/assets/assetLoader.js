/**
 * @fileoverview Asset loader and manager
 * Handles loading and caching of images and audio files
 */

/**
 * @typedef {Object} AssetManifest
 * @property {Object} images - Image assets
 * @property {Object} sounds - Sound assets
 */

/**
 * Asset loader class
 */
export class AssetLoader {
  constructor() {
    this.images = new Map();
    this.sounds = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.onProgress = null;
  }

  /**
   * Load image
   * @param {string} key - Asset key
   * @param {string} url - Image URL
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(key, url) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.images.set(key, img);
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount, this.totalCount);
        }
        resolve(img);
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${key} from ${url}`);
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount, this.totalCount);
        }
        reject(new Error(`Failed to load image: ${url}`));
      };

      img.src = url;
    });
  }

  /**
   * Load audio file
   * @param {string} key - Asset key
   * @param {string} url - Audio URL
   * @returns {Promise<HTMLAudioElement>}
   */
  loadSound(key, url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();

      audio.addEventListener('canplaythrough', () => {
        this.sounds.set(key, audio);
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount, this.totalCount);
        }
        resolve(audio);
      }, { once: true });

      audio.addEventListener('error', () => {
        console.warn(`Failed to load sound: ${key} from ${url}`);
        this.loadedCount++;
        if (this.onProgress) {
          this.onProgress(this.loadedCount, this.totalCount);
        }
        reject(new Error(`Failed to load sound: ${url}`));
      }, { once: true });

      audio.src = url;
      audio.load();
    });
  }

  /**
   * Load all assets from manifest
   * @param {AssetManifest} manifest - Asset manifest
   * @param {Function} onProgress - Progress callback (loaded, total)
   * @returns {Promise<void>}
   */
  async loadManifest(manifest, onProgress = null) {
    this.onProgress = onProgress;
    this.loadedCount = 0;

    const promises = [];

    // Count total assets
    if (manifest.images) {
      this.totalCount += Object.keys(manifest.images).length;
    }
    if (manifest.sounds) {
      this.totalCount += Object.keys(manifest.sounds).length;
    }

    // Load images
    if (manifest.images) {
      for (const [key, url] of Object.entries(manifest.images)) {
        promises.push(
          this.loadImage(key, url).catch(err => {
            console.warn(`Image ${key} failed to load, will use fallback`);
          })
        );
      }
    }

    // Load sounds
    if (manifest.sounds) {
      for (const [key, url] of Object.entries(manifest.sounds)) {
        promises.push(
          this.loadSound(key, url).catch(err => {
            console.warn(`Sound ${key} failed to load, will use fallback`);
          })
        );
      }
    }

    await Promise.allSettled(promises);
  }

  /**
   * Get loaded image
   * @param {string} key - Asset key
   * @returns {HTMLImageElement|null}
   */
  getImage(key) {
    return this.images.get(key) || null;
  }

  /**
   * Get loaded sound
   * @param {string} key - Asset key
   * @returns {HTMLAudioElement|null}
   */
  getSound(key) {
    return this.sounds.get(key) || null;
  }

  /**
   * Check if asset is loaded
   * @param {string} key - Asset key
   * @returns {boolean}
   */
  hasAsset(key) {
    return this.images.has(key) || this.sounds.has(key);
  }

  /**
   * Get loading progress
   * @returns {{loaded: number, total: number, percentage: number}}
   */
  getProgress() {
    return {
      loaded: this.loadedCount,
      total: this.totalCount,
      percentage: this.totalCount > 0 ? (this.loadedCount / this.totalCount) * 100 : 0
    };
  }
}

/**
 * Check if a URL is a data URL (inline image)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isDataURL(url) {
  return url && url.startsWith('data:');
}

/**
 * Check if a URL is an external file path
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isExternalFile(url) {
  return url && !url.startsWith('data:') && (
    url.endsWith('.png') ||
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.gif') ||
    url.endsWith('.svg')
  );
}

/**
 * Load image from either data URL or external file
 * @param {string} source - Data URL or file path
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImageFromSource(source) {
  return new Promise((resolve, reject) => {
    if (!source) {
      resolve(null);
      return;
    }

    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      console.warn(`Failed to load image from: ${source}`);
      resolve(null); // Return null instead of rejecting for graceful fallback
    };

    img.src = source;
  });
}

/**
 * Load multiple images from theme configuration
 * @param {Object} themeConfig - Theme configuration with image sources
 * @returns {Promise<Object>} Object mapping keys to loaded images
 */
export async function loadThemeImages(themeConfig) {
  const images = {};

  // Load player image
  if (themeConfig.player) {
    images.player = await loadImageFromSource(themeConfig.player);
  }

  // Load enemy images
  if (themeConfig.enemies) {
    for (const [key, source] of Object.entries(themeConfig.enemies)) {
      images[key] = await loadImageFromSource(source);
    }
  }

  // Load bullet images if provided
  if (themeConfig.playerBullet) {
    images.playerBullet = await loadImageFromSource(themeConfig.playerBullet);
  }
  if (themeConfig.enemyBullet) {
    images.enemyBullet = await loadImageFromSource(themeConfig.enemyBullet);
  }

  return images;
}

/**
 * Create global asset loader instance
 */
export const assetLoader = new AssetLoader();
