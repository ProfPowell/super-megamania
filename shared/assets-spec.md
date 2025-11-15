# Assets Specification

## Overview

This document defines all assets (graphics, audio, fonts) for the Megamania-style game. Initial implementation uses programmatic shapes and placeholder assets, which can be replaced with production assets later.

## Logical Resolution

- **Base Resolution**: 640×480 pixels
- **Aspect Ratio**: 4:3
- **Scaling**: CSS scales canvas to fit viewport while maintaining aspect ratio
- **Pixel Ratio**: Account for devicePixelRatio for crisp rendering

## Graphics Assets

### Sprite Naming Convention

Format: `{type}_{variant}_{size}.png`

Examples:
- `player_ship_32x24.png`
- `enemy_wave1_24x24.png`
- `bullet_player_4x12.png`

### Player Graphics

**Player Ship**
- **Filename**: `player_ship_32x24.png`
- **Dimensions**: 32×24 pixels
- **Format**: PNG with transparency
- **Design**: Triangle/wedge shape pointing upward
- **Color**: Green (#00ff00) or custom sprite
- **Fallback**: Programmatic triangle (`ctx.beginPath()`, `ctx.lineTo()`)

**Player Hit Animation** (Optional)
- **Frames**: 4 frames of explosion
- **Dimensions**: 48×48 pixels each
- **Format**: Sprite sheet or individual PNGs
- **Fallback**: Flash white/red using `ctx.globalAlpha`

### Enemy Graphics

**Wave 1: Hamburger Enemies**
- **Filename**: `enemy_wave1_24x24.png`
- **Dimensions**: 24×24 pixels
- **Color**: Red (#ff0000)
- **Fallback**: Red rectangle

**Wave 2: Diamond Enemies**
- **Filename**: `enemy_wave2_24x24.png`
- **Dimensions**: 24×24 pixels
- **Color**: Orange (#ff8800)
- **Fallback**: Rotated square (diamond)

**Wave 3: Swooper Enemies**
- **Filename**: `enemy_wave3_24x24.png`
- **Dimensions**: 24×24 pixels
- **Color**: Yellow (#ffff00)
- **Fallback**: Yellow circle

**Wave 4: Spinner Enemies**
- **Filename**: `enemy_wave4_24x24.png`
- **Dimensions**: 24×24 pixels
- **Color**: Magenta (#ff00ff)
- **Fallback**: Magenta triangle (inverted)

**Wave 5: Swarmer Enemies**
- **Filename**: `enemy_wave5_16x16.png`
- **Dimensions**: 16×16 pixels (smaller)
- **Color**: Cyan (#00ffff)
- **Fallback**: Cyan small square

**Enemy Explosion Animation** (Optional)
- **Frames**: 3-4 frames
- **Dimensions**: 32×32 pixels
- **Format**: Sprite sheet
- **Fallback**: Particle burst using circles

### Projectiles

**Player Bullet**
- **Filename**: `bullet_player_4x12.png`
- **Dimensions**: 4×12 pixels
- **Color**: White (#ffffff)
- **Fallback**: White rectangle with glow

**Enemy Bullet**
- **Filename**: `bullet_enemy_3x8.png`
- **Dimensions**: 3×8 pixels
- **Color**: Red (#ff0000)
- **Fallback**: Red rectangle

### Background

**Starfield Background** (Optional)
- **Filename**: `background_starfield_640x480.png`
- **Dimensions**: 640×480 pixels
- **Format**: PNG or procedurally generated
- **Design**: Sparse white stars on dark blue (#0a0e27)
- **Fallback**: Solid color fill + procedural stars

**Tiled Background** (Alternative)
- **Filename**: `background_tile_64x64.png`
- **Dimensions**: 64×64 pixels (repeating)
- **Pattern**: Subtle space texture

### UI Elements

**Button Background**
- **Filename**: `ui_button_120x40.png`
- **Dimensions**: 120×40 pixels
- **Fallback**: Rounded rectangle with gradient

**Touch Control Buttons** (Mobile)
- **Left Arrow**: `ui_btn_left_64x64.png`
- **Right Arrow**: `ui_btn_right_64x64.png`
- **Fire Button**: `ui_btn_fire_64x64.png`
- **Dimensions**: 64×64 pixels each
- **Format**: PNG with transparency
- **Fallback**: CSS styled buttons with text/symbols

## Audio Assets

### Format Requirements

- **Primary Format**: MP3 (broad browser support)
- **Fallback Format**: OGG (for Firefox/older browsers)
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128kbps minimum

### Sound Effect Files

**Player Fire**
- **Filename**: `sfx_player_fire.mp3`
- **Duration**: ~100ms
- **Description**: Short, sharp laser sound
- **Volume**: Medium

**Enemy Explosion**
- **Filename**: `sfx_enemy_explode.mp3`
- **Duration**: ~200ms
- **Description**: Small pop/explosion
- **Volume**: Medium

**Player Hit**
- **Filename**: `sfx_player_hit.mp3`
- **Duration**: ~400ms
- **Description**: Larger explosion with slight reverb
- **Volume**: Loud

**Wave Start**
- **Filename**: `sfx_wave_start.mp3`
- **Duration**: ~300ms
- **Description**: Alert tone or swoosh
- **Volume**: Medium

**Game Over**
- **Filename**: `sfx_game_over.mp3`
- **Duration**: ~800ms
- **Description**: Descending tone sequence
- **Volume**: Medium-loud

**Menu Navigate** (Optional)
- **Filename**: `sfx_menu_navigate.mp3`
- **Duration**: ~50ms
- **Description**: Subtle blip
- **Volume**: Quiet

**Menu Select** (Optional)
- **Filename**: `sfx_menu_select.mp3`
- **Duration**: ~100ms
- **Description**: Confirmation beep
- **Volume**: Medium

### Music Files (Optional)

**Main Menu Theme**
- **Filename**: `music_menu.mp3`
- **Duration**: 60-90 seconds (looping)
- **Style**: Upbeat chiptune/retro
- **Volume**: Background level

**Gameplay Theme**
- **Filename**: `music_gameplay.mp3`
- **Duration**: 90-120 seconds (looping)
- **Style**: Energetic, rhythmic
- **Volume**: Background level

### Audio Fallbacks

If audio files are missing:
- Use Web Audio API to generate simple tones
- Provide silent placeholders
- Gracefully disable audio features

## Fonts

### Primary Font: Retro Gaming

**Font Family**: "Press Start 2P" (Google Fonts) or system fallback

**Fallback Stack**:
```css
font-family: "Press Start 2P", "Courier New", monospace;
```

**Usage**:
- HUD text (score, lives, wave)
- Menu text
- Game over screen
- High score table

**Sizes**:
- Title: 32px
- Menu: 20px
- HUD: 16px
- Small text: 12px

### Alternative: System Fonts

For better performance on mobile:
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", monospace;
```

## Asset Loading Strategy

### Priority Levels

**Critical** (block game start):
- Player sprite (or fallback)
- Enemy sprites (or fallbacks)
- Bullet sprites (or fallbacks)

**High Priority** (load before gameplay):
- Sound effects
- Background

**Low Priority** (lazy load):
- Music
- Optional animations
- Menu graphics

### Loading Implementation

1. **Preloader Phase**: Show loading screen with progress bar
2. **Parallel Loading**: Load all critical assets simultaneously
3. **Fallback Strategy**: Use programmatic rendering if asset fails to load
4. **Caching**: Cache loaded assets in memory
5. **Service Worker**: Cache files for offline access (PWA)

### Asset Paths

Recommended structure:
```
/vanilla/final/assets/
  /sprites/
    player_ship_32x24.png
    enemy_wave1_24x24.png
    ...
  /audio/
    /sfx/
      player_fire.mp3
      enemy_explode.mp3
      ...
    /music/
      gameplay.mp3
      menu.mp3
  /fonts/
    (if self-hosting fonts)
```

## Performance Considerations

### Image Optimization

- Use PNG-8 for simple sprites (smaller file size)
- PNG-24 only when alpha channel needed
- Compress PNGs with tools like TinyPNG
- Consider sprite sheets for animations
- Target: <5KB per sprite, <50KB total sprites

### Audio Optimization

- Compress audio files (remove silence, normalize)
- Keep SFX files short (<1 second)
- Consider reducing sample rate for SFX (22kHz acceptable)
- Target: <20KB per SFX, <500KB per music track

### Loading Performance

- Total asset budget: <200KB for critical assets
- Use resource hints: `<link rel="preload">`
- Implement progressive enhancement
- Test on 3G network conditions

## Placeholder Asset Generation

For development, programmatic fallbacks:

**Player Ship**:
```javascript
ctx.fillStyle = '#00ff00';
ctx.beginPath();
ctx.moveTo(x, y - 12);
ctx.lineTo(x - 16, y + 12);
ctx.lineTo(x + 16, y + 12);
ctx.closePath();
ctx.fill();
```

**Enemy**:
```javascript
ctx.fillStyle = waveColor;
ctx.fillRect(x - 12, y - 12, 24, 24);
```

**Bullet**:
```javascript
ctx.fillStyle = '#ffffff';
ctx.fillRect(x - 2, y - 6, 4, 12);
```

**Stars** (background):
```javascript
for (let star of stars) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(star.x, star.y, 2, 2);
}
```

These ensure the game is fully playable without any external assets.
