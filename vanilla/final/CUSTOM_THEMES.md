# Creating Custom Themes with External Images

This guide shows you how to create custom themes using PNG/JPG image files instead of the built-in SVG graphics.

## Quick Start

### 1. Prepare Your Images

Create your sprite images following these guidelines:

**Player Ship:**
- Size: 32x24 pixels recommended
- Format: PNG with transparency
- Save to: `assets/images/player/ship.png`

**Enemy Sprites:**
- Size: 24x24 pixels (standard) or 16x16 pixels (small)
- Format: PNG with transparency
- Save to: `assets/images/enemies/`

### 2. Create Your Theme

Edit `src/assets/themes.js` and add your custom theme:

```javascript
// Uncomment and customize the example theme at line 275
export const customTheme = {
  name: 'Custom',
  player: 'assets/images/player/ship.png',
  enemies: {
    wave1: 'assets/images/enemies/enemy1.png',
    wave2: 'assets/images/enemies/enemy2.png',
    wave3: 'assets/images/enemies/enemy3.png',
    wave4: 'assets/images/enemies/enemy4.png',
    wave5: 'assets/images/enemies/enemy5.png',
  }
};

// Add to themes object
export const themes = {
  classic: classicTheme,
  cats: catTheme,
  food: foodTheme,
  space: spaceTheme,
  emoji: emojiTheme,
  retro: retroTheme,
  custom: customTheme  // Add your theme here
};
```

### 3. Add to Settings Menu

Edit `index.html` and add your theme to the dropdown:

```html
<select id="theme-select" class="setting-select">
  <option value="cats" selected>CATS</option>
  <option value="food">FOOD</option>
  <option value="space">SPACE</option>
  <option value="emoji">EMOJI</option>
  <option value="retro">RETRO</option>
  <option value="classic">CLASSIC</option>
  <option value="custom">CUSTOM</option>  <!-- Add this -->
</select>
```

### 4. Test Your Theme

1. Run the game: `npm run serve`
2. Open settings menu
3. Select your custom theme
4. Play!

## Original Megamania Enemies

If you want to recreate the original game, create these 8 enemy sprites:

| Enemy | Filename | Points | Description |
|-------|----------|--------|-------------|
| Hamburgers | `hamburger.png` | 20 | Deluxe hamburgers |
| Ice Cream | `icecream.png` | 30 | Ice cream sandwiches |
| Magnets | `magnet.png` | 40 | Refrigerator magnets |
| Tires | `tire.png` | 50 | Radial tires |
| Diamonds | `diamond.png` | 60 | Diamond rings |
| Irons | `iron.png` | 70 | Steaming irons |
| Bow Ties | `bowtie.png` | 80 | Party bow ties |
| Dice | `dice.png` | 90 | Dreaded space dice |

Example theme using the original enemies:

```javascript
export const megamaniaTheme = {
  name: 'Original Megamania',
  player: 'assets/images/player/ship.png',
  enemies: {
    hamburger: 'assets/images/enemies/hamburger.png',
    icecream: 'assets/images/enemies/icecream.png',
    magnet: 'assets/images/enemies/magnet.png',
    tire: 'assets/images/enemies/tire.png',
    diamond: 'assets/images/enemies/diamond.png',
    iron: 'assets/images/enemies/iron.png',
    bowtie: 'assets/images/enemies/bowtie.png',
    dice: 'assets/images/enemies/dice.png',
  }
};
```

## Advanced Options

### Mixed Sources

You can mix data URLs (inline SVG) with external files:

```javascript
export const mixedTheme = {
  name: 'Mixed',
  player: svgToDataURL(`<svg>...</svg>`),  // Inline SVG
  enemies: {
    wave1: 'assets/images/enemies/special.png',  // External file
    wave2: svgToDataURL(`<svg>...</svg>`),       // Inline SVG
    wave3: 'assets/images/enemies/boss.png',     // External file
  }
};
```

### Custom Bullets

You can also customize bullet sprites:

```javascript
export const customTheme = {
  name: 'Custom',
  player: 'assets/images/player/ship.png',
  enemies: { /* ... */ },
  playerBullet: 'assets/images/bullets/player_bullet.png',
  enemyBullet: 'assets/images/bullets/enemy_bullet.png'
};
```

### Wave-Based vs Named Enemies

You can organize enemies either way:

**Wave-based** (numbered):
```javascript
enemies: {
  wave1: 'assets/images/enemies/enemy1.png',
  wave2: 'assets/images/enemies/enemy2.png',
  // Cycles through as waves progress
}
```

**Named enemies** (original Megamania style):
```javascript
enemies: {
  hamburger: 'assets/images/enemies/hamburger.png',
  icecream: 'assets/images/enemies/icecream.png',
  // Reference by name in wave configs
}
```

## Image Guidelines

### Format Recommendations

- **Format:** PNG-8 with transparency (smallest file size)
- **Color:** Index color mode with alpha channel
- **Optimization:** Use tools like TinyPNG or pngquant

### Size Guidelines

| Asset Type | Recommended Size | Notes |
|------------|------------------|-------|
| Player | 32x24px | Larger for visibility |
| Enemies (standard) | 24x24px | Most enemy types |
| Enemies (small) | 16x16px | Fast/swarm enemies |
| Bullets | 4x8px or 8x8px | Small, simple shapes |

### Design Tips

1. **High Contrast:** Use bright colors that stand out against dark space background
2. **Clear Silhouette:** Should be recognizable at small size
3. **Transparency:** Use alpha channel for smooth edges
4. **Test on Dark:** Always preview on black/dark background
5. **Pixel Perfect:** Keep edges crisp at intended display size

## Pixel Art Tools

### Free Tools
- **Piskel** (https://www.piskelapp.com/) - Online, beginner-friendly
- **GIMP** - Full-featured, supports pixel art
- **Krita** - Great for digital art and pixel work

### Paid Tools
- **Aseprite** - Industry standard for pixel art
- **Photoshop** - Professional, but overkill for simple sprites

## Troubleshooting

### Images Not Loading

**Check file paths:**
```javascript
// Correct (relative to index.html)
player: 'assets/images/player/ship.png'

// Wrong - don't use absolute paths
player: '/assets/images/player/ship.png'

// Wrong - don't include vanilla/final
player: 'vanilla/final/assets/images/player/ship.png'
```

**Check browser console:**
- Open DevTools (F12)
- Look for 404 errors or failed image loads
- Verify file names match exactly (case-sensitive!)

### Images Look Blurry

Add this CSS to prevent image smoothing:

```css
canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

### Theme Not Appearing in Menu

1. Check you added it to the `themes` object in `themes.js`
2. Verify the theme key matches the option value in `index.html`
3. Clear browser cache and reload

## Example Directory Structure

```
vanilla/final/
├── assets/
│   ├── images/
│   │   ├── player/
│   │   │   └── ship.png
│   │   ├── enemies/
│   │   │   ├── hamburger.png
│   │   │   ├── icecream.png
│   │   │   ├── magnet.png
│   │   │   ├── tire.png
│   │   │   ├── diamond.png
│   │   │   ├── iron.png
│   │   │   ├── bowtie.png
│   │   │   └── dice.png
│   │   └── bullets/
│   │       ├── player_bullet.png
│   │       └── enemy_bullet.png
│   └── sounds/
│       └── ... (future feature)
└── src/
    └── assets/
        └── themes.js  (edit this file)
```

## Resources

### Finding Sprites

**Public Domain/CC0:**
- OpenGameArt.org
- Kenney.nl (huge sprite collections)
- itch.io (many free asset packs)

**Make Your Own:**
- Use pixel art tutorials on YouTube
- Practice with simple geometric shapes first
- Study original Megamania screenshots

### Attribution

If using third-party assets, add attribution to `assets/README.md`:

```markdown
## Attribution

- Player ship sprite - [Artist Name] - [License] - [Link]
- Enemy sprites pack - [Asset Pack Name] - CC0 - [Link]
```

## Next Steps

1. Create your sprites or download a pack
2. Organize them in the assets directory
3. Create a theme configuration
4. Test in-game
5. Share your theme with others!

Happy theming! 🎨🚀
