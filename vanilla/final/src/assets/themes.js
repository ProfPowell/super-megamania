/**
 * @fileoverview Asset themes
 * Different graphical themes for enemies and player
 */

/**
 * Generate SVG data URL
 * @param {string} svg - SVG markup
 * @returns {string} Data URL
 */
function svgToDataURL(svg) {
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Classic theme - simple geometric shapes
 */
export const classicTheme = {
  name: 'Classic',
  player: null, // Use programmatic triangle
  enemies: {
    wave1: null, // Red square
    wave2: null, // Orange diamond
    wave3: null, // Yellow circle
    wave4: null, // Magenta triangle
    wave5: null, // Cyan small square
  }
};

/**
 * Cat theme - cat heads and related imagery
 */
export const catTheme = {
  name: 'Cats',
  player: svgToDataURL(`<svg width="32" height="24" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,2 4,22 28,22" fill="#00ff00" stroke="#fff" stroke-width="2"/>
    <circle cx="12" cy="14" r="2" fill="#fff"/>
    <circle cx="20" cy="14" r="2" fill="#fff"/>
  </svg>`),
  enemies: {
    wave1: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ff6600" stroke="#000" stroke-width="1"/>
      <circle cx="8" cy="10" r="2" fill="#000"/>
      <circle cx="16" cy="10" r="2" fill="#000"/>
      <polygon points="4,4 2,8 6,6" fill="#ff6600"/>
      <polygon points="20,4 18,6 22,8" fill="#ff6600"/>
      <path d="M 8 14 Q 12 16 16 14" stroke="#000" fill="none" stroke-width="1"/>
    </svg>`),
    wave2: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#888" stroke="#000" stroke-width="1"/>
      <circle cx="8" cy="10" r="2" fill="#00ff00"/>
      <circle cx="16" cy="10" r="2" fill="#00ff00"/>
      <polygon points="5,5 3,9 7,7" fill="#888"/>
      <polygon points="19,5 17,7 21,9" fill="#888"/>
      <ellipse cx="12" cy="16" rx="3" ry="1.5" fill="#ff69b4"/>
    </svg>`),
    wave3: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#fff" stroke="#000" stroke-width="1"/>
      <circle cx="8" cy="10" r="2" fill="#000"/>
      <circle cx="16" cy="10" r="2" fill="#000"/>
      <polygon points="6,6 4,10 8,8" fill="#fff"/>
      <polygon points="18,6 16,8 20,10" fill="#fff"/>
      <path d="M 9 14 L 12 16 L 15 14" stroke="#000" fill="none" stroke-width="1"/>
    </svg>`),
    wave4: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#ff8800" stroke="#000" stroke-width="1"/>
      <circle cx="8" cy="11" r="2" fill="#000"/>
      <circle cx="16" cy="11" r="2" fill="#000"/>
      <polygon points="6,3 4,7 8,5" fill="#ff8800"/>
      <polygon points="18,3 16,5 20,7" fill="#ff8800"/>
      <path d="M 10 15 Q 12 13 14 15" stroke="#000" fill="none" stroke-width="1"/>
    </svg>`),
    wave5: svgToDataURL(`<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill="#000" stroke="#fff" stroke-width="1"/>
      <circle cx="6" cy="7" r="1.5" fill="#ffff00"/>
      <circle cx="10" cy="7" r="1.5" fill="#ffff00"/>
      <polygon points="3,2 2,5 4,3" fill="#000"/>
      <polygon points="13,2 12,3 14,5" fill="#000"/>
    </svg>`)
  }
};

/**
 * Food theme - various food items
 */
export const foodTheme = {
  name: 'Food',
  player: svgToDataURL(`<svg width="32" height="24" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="16" cy="12" rx="14" ry="10" fill="#ffd700" stroke="#ff8800" stroke-width="2"/>
    <circle cx="12" cy="10" r="2" fill="#000"/>
    <circle cx="20" cy="10" r="2" fill="#000"/>
    <path d="M 10 15 Q 16 18 22 15" stroke="#000" fill="none" stroke-width="2"/>
  </svg>`),
  enemies: {
    wave1: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="10" width="20" height="12" fill="#8B4513" rx="2"/>
      <rect x="2" y="8" width="20" height="4" fill="#ff6347" rx="1"/>
      <rect x="2" y="4" width="20" height="6" fill="#FFD700" rx="3"/>
      <circle cx="8" cy="6" r="1" fill="#fff"/>
      <circle cx="16" cy="6" r="1" fill="#fff"/>
    </svg>`),
    wave2: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 4,22 20,22" fill="#ff6347"/>
      <circle cx="10" cy="12" r="1.5" fill="#ffff00"/>
      <circle cx="14" cy="16" r="1.5" fill="#ffff00"/>
      <circle cx="12" cy="8" r="1.5" fill="#ffff00"/>
      <rect x="6" y="20" width="12" height="2" fill="#8B4513"/>
    </svg>`),
    wave3: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="14" r="9" fill="#ff69b4"/>
      <ellipse cx="12" cy="6" rx="8" ry="4" fill="#ffb6c1"/>
      <circle cx="8" cy="6" r="1" fill="#ff1493"/>
      <circle cx="12" cy="7" r="1" fill="#ff1493"/>
      <circle cx="16" cy="6" r="1" fill="#ff1493"/>
      <rect x="11" y="22" width="2" height="2" fill="#8B4513"/>
    </svg>`),
    wave4: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="12" rx="10" ry="8" fill="#FFD700"/>
      <path d="M 5 12 Q 12 18 19 12" fill="#ff8c00"/>
      <circle cx="9" cy="10" r="1.5" fill="#000"/>
      <circle cx="15" cy="10" r="1.5" fill="#000"/>
    </svg>`),
    wave5: svgToDataURL(`<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill="#32cd32"/>
      <circle cx="6" cy="6" r="1" fill="#228b22"/>
      <circle cx="10" cy="6" r="1" fill="#228b22"/>
      <circle cx="8" cy="10" r="1" fill="#228b22"/>
    </svg>`)
  }
};

/**
 * Space theme - UFOs and alien ships
 */
export const spaceTheme = {
  name: 'Space',
  player: svgToDataURL(`<svg width="32" height="24" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,4 8,20 24,20" fill="#00ffff" stroke="#0088ff" stroke-width="2"/>
    <rect x="14" y="8" width="4" height="8" fill="#004488"/>
    <circle cx="16" cy="18" r="2" fill="#ff0000"/>
  </svg>`),
  enemies: {
    wave1: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="12" rx="11" ry="6" fill="#888" stroke="#444" stroke-width="1"/>
      <ellipse cx="12" cy="8" rx="7" ry="5" fill="#00ffff" stroke="#0088ff" stroke-width="1"/>
      <circle cx="12" cy="8" r="3" fill="#88ffff"/>
      <circle cx="6" cy="12" r="1.5" fill="#ffff00"/>
      <circle cx="12" cy="13" r="1.5" fill="#ffff00"/>
      <circle cx="18" cy="12" r="1.5" fill="#ffff00"/>
    </svg>`),
    wave2: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,4 2,14 22,14" fill="#ff00ff"/>
      <ellipse cx="12" cy="14" rx="10" ry="4" fill="#aa00aa" stroke="#880088" stroke-width="1"/>
      <circle cx="8" cy="10" r="2" fill="#fff"/>
      <circle cx="16" cy="10" r="2" fill="#fff"/>
      <circle cx="5" cy="14" r="1" fill="#00ffff"/>
      <circle cx="19" cy="14" r="1" fill="#00ffff"/>
    </svg>`),
    wave3: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="8" width="16" height="10" fill="#444" stroke="#888" stroke-width="1"/>
      <polygon points="4,8 8,4 16,4 20,8" fill="#666"/>
      <rect x="10" y="10" width="4" height="6" fill="#00ffff"/>
      <circle cx="7" cy="12" r="1.5" fill="#ff0000"/>
      <circle cx="17" cy="12" r="1.5" fill="#ff0000"/>
    </svg>`),
    wave4: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="#1a1a1a" stroke="#00ff00" stroke-width="2"/>
      <circle cx="12" cy="12" r="7" fill="#00aa00"/>
      <circle cx="8" cy="10" r="2" fill="#000"/>
      <circle cx="16" cy="10" r="2" fill="#000"/>
      <circle cx="8" cy="10" r="1" fill="#00ff00"/>
      <circle cx="16" cy="10" r="1" fill="#00ff00"/>
      <path d="M 8 15 L 16 15" stroke="#000" stroke-width="2"/>
    </svg>`),
    wave5: svgToDataURL(`<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <polygon points="8,2 2,14 14,14" fill="#ffff00" stroke="#ff8800" stroke-width="1"/>
      <circle cx="8" cy="10" r="2" fill="#ff0000"/>
      <line x1="4" y1="14" x2="3" y2="16" stroke="#ffff00" stroke-width="1"/>
      <line x1="12" y1="14" x2="13" y2="16" stroke="#ffff00" stroke-width="1"/>
    </svg>`)
  }
};

/**
 * Emoji theme - emoji-style faces
 */
export const emojiTheme = {
  name: 'Emoji',
  player: svgToDataURL(`<svg width="32" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="12" r="11" fill="#FFD700" stroke="#ff8800" stroke-width="2"/>
    <circle cx="11" cy="10" r="2" fill="#000"/>
    <circle cx="21" cy="10" r="2" fill="#000"/>
    <path d="M 10 15 Q 16 19 22 15" stroke="#000" fill="none" stroke-width="2"/>
  </svg>`),
  enemies: {
    wave1: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#ff6347"/>
      <circle cx="8" cy="10" r="2" fill="#000"/>
      <circle cx="16" cy="10" r="2" fill="#000"/>
      <path d="M 8 16 Q 12 14 16 16" stroke="#000" fill="none" stroke-width="2"/>
    </svg>`),
    wave2: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#9370DB"/>
      <circle cx="8" cy="10" r="2.5" fill="#000"/>
      <circle cx="16" cy="10" r="2.5" fill="#000"/>
      <circle cx="8" cy="10" r="1" fill="#fff"/>
      <circle cx="16" cy="10" r="1" fill="#fff"/>
      <ellipse cx="12" cy="16" rx="4" ry="2" fill="#ff69b4"/>
    </svg>`),
    wave3: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#00CED1"/>
      <circle cx="8" cy="11" r="2" fill="#000"/>
      <circle cx="16" cy="11" r="2" fill="#000"/>
      <path d="M 7 16 L 17 16" stroke="#000" stroke-width="2"/>
      <line x1="6" y1="7" x2="10" y2="9" stroke="#000" stroke-width="2"/>
      <line x1="18" y1="7" x2="14" y2="9" stroke="#000" stroke-width="2"/>
    </svg>`),
    wave4: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#FFB6C1"/>
      <circle cx="8" cy="10" r="2" fill="#000"/>
      <circle cx="16" cy="10" r="2" fill="#000"/>
      <path d="M 8 16 Q 12 18 16 16" stroke="#000" fill="none" stroke-width="2"/>
      <circle cx="7" cy="13" r="1.5" fill="#ff69b4"/>
      <circle cx="17" cy="13" r="1.5" fill="#ff69b4"/>
    </svg>`),
    wave5: svgToDataURL(`<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="7" fill="#32CD32"/>
      <circle cx="6" cy="7" r="1.5" fill="#000"/>
      <circle cx="10" cy="7" r="1.5" fill="#000"/>
      <path d="M 5 10 Q 8 12 11 10" stroke="#000" fill="none" stroke-width="1.5"/>
    </svg>`)
  }
};

/**
 * Retro theme - geometric patterns
 */
export const retroTheme = {
  name: 'Retro',
  player: svgToDataURL(`<svg width="32" height="24" xmlns="http://www.w3.org/2000/svg">
    <polygon points="16,2 4,22 28,22" fill="none" stroke="#00ff00" stroke-width="3"/>
    <polygon points="16,8 10,18 22,18" fill="#00ff00"/>
  </svg>`),
  enemies: {
    wave1: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="20" height="20" fill="none" stroke="#ff0000" stroke-width="3"/>
      <rect x="7" y="7" width="10" height="10" fill="#ff0000"/>
    </svg>`),
    wave2: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="#ff8800" stroke-width="3"/>
      <polygon points="12,8 16,12 12,16 8,12" fill="#ff8800"/>
    </svg>`),
    wave3: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="none" stroke="#ffff00" stroke-width="3"/>
      <circle cx="12" cy="12" r="5" fill="#ffff00"/>
    </svg>`),
    wave4: svgToDataURL(`<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 22,22 2,22" fill="none" stroke="#ff00ff" stroke-width="3"/>
      <polygon points="12,10 16,18 8,18" fill="#ff00ff"/>
    </svg>`),
    wave5: svgToDataURL(`<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="14" height="14" fill="none" stroke="#00ffff" stroke-width="2"/>
      <rect x="5" y="5" width="6" height="6" fill="#00ffff"/>
    </svg>`)
  }
};

/**
 * EXAMPLE: Custom theme using external PNG/JPG files
 *
 * To use external image files instead of SVG data URLs:
 * 1. Place your PNG/JPG files in the assets/images directory
 * 2. Create a theme object like this (uncomment to use):
 */
/*
export const customTheme = {
  name: 'Custom',
  // External file paths work alongside data URLs
  player: 'assets/images/player/ship.png',  // External PNG file
  enemies: {
    // Original Megamania enemies (if you have the sprites)
    hamburger: 'assets/images/enemies/hamburger.png',    // 20 points
    icecream: 'assets/images/enemies/icecream.png',      // 30 points
    magnet: 'assets/images/enemies/magnet.png',          // 40 points
    tire: 'assets/images/enemies/tire.png',              // 50 points
    diamond: 'assets/images/enemies/diamond.png',        // 60 points
    iron: 'assets/images/enemies/iron.png',              // 70 points
    bowtie: 'assets/images/enemies/bowtie.png',          // 80 points
    dice: 'assets/images/enemies/dice.png',              // 90 points

    // Or use wave-based naming
    wave1: 'assets/images/enemies/enemy1.png',
    wave2: 'assets/images/enemies/enemy2.png',
    wave3: 'assets/images/enemies/enemy3.png',
    // ... etc
  },
  // Optional: custom bullet images
  playerBullet: 'assets/images/bullets/player_bullet.png',
  enemyBullet: 'assets/images/bullets/enemy_bullet.png'
};
*/

/**
 * DEMO theme using EXTERNAL SVG files
 * Demonstrates how to load images from the filesystem
 */
export const demoTheme = {
  name: 'Demo (External Files)',
  player: 'assets/images/player/demo-ship.svg',
  enemies: {
    wave1: 'assets/images/enemies/demo-enemy1.svg',  // Red saucer
    wave2: 'assets/images/enemies/demo-enemy2.svg',  // Purple diamond
    wave3: 'assets/images/enemies/demo-enemy3.svg',  // Orange hexagon
    wave4: 'assets/images/enemies/demo-enemy1.svg',  // Repeat for more waves
    wave5: 'assets/images/enemies/demo-enemy2.svg',
  }
};

/**
 * ABSURD MODE - Embrace the chaos! 🌭🤖☕😱💩🍕
 * Maximum internet/meme culture absurdity with 16 unique enemies!
 */
export const absurdTheme = {
  name: 'ABSURD MODE',
  player: 'assets/images/absurd/player/hotdog.svg',  // Dancing hot dog!
  enemies: {
    // Wave 1-15: Maximum variety and chaos!
    wave1: 'assets/images/absurd/enemies/angry-ai.svg',       // 🤖 Angry AI robot
    wave2: 'assets/images/absurd/enemies/poop.svg',           // 💩 Poop emoji
    wave3: 'assets/images/absurd/enemies/trollface.svg',      // Troll face meme
    wave4: 'assets/images/absurd/enemies/wrench.svg',         // 🔧 Angry wrench
    wave5: 'assets/images/absurd/enemies/toilet.svg',         // 🚽 Toilet seat
    wave6: 'assets/images/absurd/enemies/loading.svg',        // ⏳ Eternal loading spinner
    wave7: 'assets/images/absurd/enemies/nyan.svg',           // 🌈 Nyan cat
    wave8: 'assets/images/absurd/enemies/skull.svg',          // 💀 Skull
    wave9: 'assets/images/absurd/enemies/pizza.svg',          // 🍕 Pizza slice
    wave10: 'assets/images/absurd/enemies/mcdonalds.svg',     // 🍟 McDonald's logo
    wave11: 'assets/images/absurd/enemies/plunger.svg',       // 🪠 Plunger
    wave12: 'assets/images/absurd/enemies/pumpkin.svg',       // 🎃 Jack O'Lantern
    wave13: 'assets/images/absurd/enemies/bitcoin.svg',       // ₿ Bitcoin logo
    wave14: 'assets/images/absurd/enemies/doge.svg',          // 🐕 Doge meme (wow such enemy)
    wave15: 'assets/images/absurd/enemies/screaming-emoji.svg', // 😱 Screaming emoji

    // Bonus waves (cycle repeats with different enemies)
    coffee: 'assets/images/absurd/enemies/coffee.svg',         // ☕ Coffee cup
    error404: 'assets/images/absurd/enemies/error404.svg',     // 🚫 Error 404
    cowboyhat: 'assets/images/absurd/enemies/cowboyhat.svg',   // 🤠 Cowboy hat
    chili: 'assets/images/absurd/enemies/chili.svg',           // 🌶️ Chili pepper
    martini: 'assets/images/absurd/enemies/martini.svg',       // 🍸 Martini glass
    stonks: 'assets/images/absurd/enemies/stonks.svg',         // 📈 STONKS meme
  }
};

/**
 * All available themes
 */
export const themes = {
  classic: classicTheme,
  cats: catTheme,
  food: foodTheme,
  space: spaceTheme,
  emoji: emojiTheme,
  retro: retroTheme,
  demo: demoTheme,     // Demo theme with external files
  absurd: absurdTheme  // ABSURD MODE - Maximum chaos! 🌭
  // Add custom themes here:
  // custom: customTheme
};

/**
 * Get theme by name
 * @param {string} name - Theme name
 * @returns {Object} Theme object
 */
export function getTheme(name = 'cats') {
  return themes[name] || themes.cats;
}

/**
 * Get list of theme names
 * @returns {string[]} Theme names
 */
export function getThemeNames() {
  return Object.keys(themes);
}
