# Game Assets

This directory contains game assets for Super Megamania.

## Directory Structure

```
assets/
├── images/
│   ├── player/          # Player ship sprites
│   ├── enemies/         # Enemy sprites
│   └── ui/              # UI elements
└── sounds/
    ├── sfx/             # Sound effects
    └── music/           # Background music
```

## Image Format Guidelines

### Enemy Sprites
- **Format:** PNG with transparency
- **Size:** 24x24 pixels (standard), 16x16 pixels (small enemies)
- **Naming:** `enemy_{type}_{variant}.png`
  - Example: `enemy_hamburger_01.png`

### Player Sprites
- **Format:** PNG with transparency
- **Size:** 32x24 pixels
- **Naming:** `player_{variant}.png`

### Original Megamania Enemies

The original game had 8 enemy types, each worth different points:

1. **Hamburgers** - 20 points (`enemy_hamburger.png`)
2. **Ice Cream Sandwiches** - 30 points (`enemy_icecream.png`)
3. **Refrigerator Magnets** - 40 points (`enemy_magnet.png`)
4. **Radial Tires** - 50 points (`enemy_tire.png`)
5. **Diamond Rings** - 60 points (`enemy_diamond.png`)
6. **Steaming Irons** - 70 points (`enemy_iron.png`)
7. **Party Bow Ties** - 80 points (`enemy_bowtie.png`)
8. **Dreaded Space Dice** - 90 points (`enemy_dice.png`)

## Sound Format Guidelines

### Sound Effects
- **Format:** MP3 or OGG
- **Sample Rate:** 44.1kHz
- **Bit Rate:** 128kbps
- **Duration:** Keep under 2 seconds for responsiveness

### Music
- **Format:** MP3 or OGG
- **Looping:** Should loop seamlessly
- **Duration:** 60-120 seconds recommended

## Using External Assets

### In Code

To use external image files instead of inline SVG:

```javascript
// In themes.js
export const customTheme = {
  name: 'Custom',
  player: 'assets/images/player/ship.png',  // URL instead of data URL
  enemies: {
    hamburger: 'assets/images/enemies/hamburger.png',
    icecream: 'assets/images/enemies/icecream.png',
    // ...
  }
};
```

### Loading Assets

The AssetLoader automatically handles both:
- Data URLs (inline SVG/images)
- External files (PNG, JPG, GIF)

```javascript
import { assetLoader } from './assets/assetLoader.js';

// Load manifest with mixed sources
await assetLoader.loadManifest({
  images: {
    player: 'assets/images/player/ship.png',  // External file
    enemy1: 'data:image/svg+xml;base64,...'   // Inline SVG
  }
});
```

## Creating Your Own Assets

### Pixel Art Tools
- Aseprite
- Piskel (online)
- GIMP
- Photoshop

### Tips
- Use transparency for sprites
- Keep sizes consistent
- Test on dark backgrounds
- Export as PNG-8 for smaller file sizes

## Attribution

If using assets from external sources, list attributions here:

- [Asset source] - [License] - [Link]
