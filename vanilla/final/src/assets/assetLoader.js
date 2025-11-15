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
 * Create global asset loader instance
 */
export const assetLoader = new AssetLoader();
