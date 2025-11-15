# Megamania Game Design Notes

## Game Overview

A vertical shooter inspired by the classic Atari 2600 game Megamania. The player controls a ship at the bottom of the screen, defending against waves of enemies attacking from above.

## Player Mechanics

### Movement
- **Zone**: Bottom 20% of screen, horizontal movement only
- **Speed**: 250 pixels/second (base speed)
- **Bounds**: Cannot move off-screen left or right

### Combat
- **Fire Rate**: 300ms cooldown between shots
- **Bullet Speed**: 400 pixels/second upward
- **Max Bullets**: 5 simultaneous projectiles on screen
- **Bullet Size**: 4x12 pixels

### Lives & Health
- **Starting Lives**: 3
- **Hit Behavior**:
  - Lose 1 life on collision with enemy or enemy bullet
  - Brief invincibility period (2 seconds) after hit
  - Visual feedback (flashing sprite)
- **Game Over**: When lives reach 0

## Enemy Waves

### Wave Patterns

**Wave 1: Horizontal Sweep**
- 8 enemies in a row
- Move horizontally left-right across screen
- Speed: 80 px/s
- Spawn interval: 500ms
- No firing

**Wave 2: Zigzag Formation**
- 10 enemies in zigzag pattern
- Diagonal movement with direction changes
- Speed: 100 px/s
- Spawn interval: 400ms
- Fire rate: 2 seconds

**Wave 3: Dive Bombers**
- 6 enemies that dive toward player
- Sinusoidal vertical descent
- Speed: 120 px/s
- Spawn interval: 800ms
- Fire rate: 1.5 seconds

**Wave 4: Circle Formation**
- 12 enemies in rotating circle
- Circular motion pattern around center point
- Speed: 90 px/s (angular)
- Spawn interval: 300ms
- Fire rate: 2.5 seconds

**Wave 5: Fast Swarm**
- 15 small enemies
- Chaotic movement (random direction changes)
- Speed: 150 px/s
- Spawn interval: 250ms
- Fire rate: 3 seconds

### Enemy Properties
- **Hit Points**: 1 (destroyed on single hit)
- **Score Value**:
  - Wave 1-2: 10 points
  - Wave 3-4: 20 points
  - Wave 5: 30 points
- **Collision**: Enemies destroy player bullets and themselves
- **Enemy Bullets**: 3x8 pixels, 200 px/s downward

## Difficulty Progression

### Levels
After completing all 5 waves, difficulty increases:

**Level 1 (Waves 1-5)**: Base parameters

**Level 2+**: Each level increases:
- Enemy speed: +15%
- Enemy fire rate: +20% faster
- Spawn interval: -10% (enemies appear faster)
- Score multiplier: 1.5x per level

### Win Condition
- Complete all waves to advance to next level
- Game continues indefinitely with increasing difficulty

### Lose Condition
- All lives lost

## Scoring System

### Points
- Enemy destroyed: 10-30 points (based on wave)
- Wave completed: 100 points × level
- Perfect wave (no hits taken): +50 bonus points

### High Scores
- Top 10 scores saved to localStorage
- Display: initials (3 characters) + score
- Persist across sessions

## Visual Design

### Screen Layout
- **Logical Resolution**: 640×480 pixels
- **Aspect Ratio**: 4:3
- **Player Zone**: Bottom 96 pixels (20%)
- **Enemy Zone**: Top 384 pixels (80%)
- **HUD**: Overlay on top edge

### Colors (Placeholder Scheme)
- Background: #0a0e27 (dark blue)
- Player: #00ff00 (green)
- Enemies: Varies by wave (#ff0000, #ff8800, #ffff00, #ff00ff, #00ffff)
- Bullets: Player=#ffffff, Enemy=#ff0000
- HUD Text: #ffffff

### Sprites (Initial Implementation)
- Simple geometric shapes (rectangles/triangles)
- Can be replaced with sprite images later
- Player: 32×24 triangle
- Enemies: 24×24 squares (colored by wave)
- Bullets: Small rectangles

## Audio Design

### Sound Effects
- **Player Fire**: Short laser "pew" (100ms)
- **Enemy Explosion**: Small pop/explosion (200ms)
- **Player Hit**: Louder explosion with reverb (400ms)
- **Wave Start**: Brief "whoosh" or alert tone (300ms)
- **Game Over**: Descending tone sequence (800ms)

### Music
- Optional: Simple looping background track
- Can be toggled in settings

### Audio Settings
- Master volume: 0-100%
- Sound effects on/off toggle
- Music on/off toggle (if implemented)

## Controls

### Desktop (Keyboard)
- **Move Left**: ArrowLeft or 'A'
- **Move Right**: ArrowRight or 'D'
- **Fire**: Space or 'W'
- **Pause**: Escape or 'P'
- **Restart** (on game over): Enter or 'R'

### Mobile (Touch)
- **Left Button**: Touch zone on left 40% of screen bottom
- **Right Button**: Touch zone on right 40% of screen bottom
- **Fire Button**: Dedicated button in center bottom or auto-fire
- **Responsive**: Touch controls overlay canvas

### Accessibility
- Visual feedback for all inputs
- Keyboard and touch work simultaneously
- Clear button labels on touch controls

## Game States

1. **MENU**: Title screen with "Start Game" and "High Scores"
2. **PLAYING**: Active gameplay
3. **PAUSED**: Game frozen, resume or quit options
4. **GAME_OVER**: Show final score, high score entry, restart option
5. **SETTINGS**: Difficulty, audio, controls configuration

## Technical Requirements

- **Frame Rate**: Target 60 FPS
- **Update Loop**: Fixed timestep with delta time
- **Collision**: AABB (Axis-Aligned Bounding Box)
- **Rendering**: Canvas 2D API
- **Data Persistence**: localStorage for scores and settings
- **Offline Support**: PWA with service worker
- **Performance**: Smooth on mobile devices (iOS/Android)
