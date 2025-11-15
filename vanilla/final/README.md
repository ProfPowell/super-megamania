# Super Megamania - Vanilla JavaScript Final Build

A complete Megamania-style arcade shooter built with vanilla JavaScript and the Canvas API. This is the final, production-ready version of the game with all features implemented.

## Features

### Core Gameplay
- **Player Control**: Smooth horizontal movement with keyboard and touch controls
- **Multiple Enemy Waves**: 5 unique wave patterns with increasing difficulty
  - Wave 1: Horizontal Sweep
  - Wave 2: Zigzag Formation
  - Wave 3: Dive Bombers
  - Wave 4: Circle Formation
  - Wave 5: Fast Swarm
- **Progressive Difficulty**: Speed, fire rate, and spawn rate increase with each level
- **Lives System**: 3 lives with invincibility period after being hit
- **Scoring**: Points based on enemy type and perfect wave bonuses

### UI Features
- **Main Menu**: Start game, view high scores, adjust settings, read help
- **HUD**: Real-time score, lives, wave, and level display
- **Pause System**: Pause/resume gameplay with ESC key
- **High Score Table**: Top 10 scores saved with player initials
- **Settings Menu**: Adjust difficulty, sound effects, music, and volume
- **Game Over Screen**: Final score, high score entry, and play again option

### Technical Features
- **Canvas Rendering**: Hardware-accelerated 2D graphics
- **Fixed Timestep Game Loop**: Consistent 60 FPS gameplay
- **AABB Collision Detection**: Accurate hit detection
- **Particle System**: Explosion effects and visual feedback
- **LocalStorage Persistence**: High scores and settings saved locally
- **Audio System**: Web Audio API for synthesized sound effects
- **Touch Controls**: Mobile-friendly on-screen buttons
- **PWA Support**: Installable app with offline play
- **Responsive Design**: Scales to fit any screen size

### Input Support
- **Keyboard**: Arrow keys or WASD for movement, Space to fire
- **Touch**: On-screen buttons for mobile devices
- **Auto-detection**: Automatically shows touch controls on mobile

## File Structure

```
vanilla/final/
├── index.html              # Main HTML file
├── manifest.webmanifest    # PWA manifest
├── service-worker.js       # Service worker for offline support
├── styles/
│   └── style.css          # Game styling
├── src/
│   ├── main.js            # Entry point and game orchestration
│   ├── canvas.js          # Canvas setup and rendering utilities
│   ├── gameLoop.js        # Game loop implementation
│   ├── config/
│   │   ├── gameConfig.js  # Master configuration
│   │   └── waves.js       # Wave definitions
│   ├── state/
│   │   └── gameState.js   # Game state management
│   ├── input/
│   │   ├── keyboard.js    # Keyboard input handler
│   │   ├── touch.js       # Touch input handler
│   │   └── inputManager.js # Unified input manager
│   ├── entities/
│   │   ├── player.js      # Player entity
│   │   ├── enemy.js       # Enemy entity
│   │   └── projectile.js  # Bullet entities
│   ├── systems/
│   │   ├── collision.js   # Collision detection
│   │   ├── waveManager.js # Wave spawning and progression
│   │   └── particleSystem.js # Particle effects
│   ├── ui/
│   │   ├── hud.js         # HUD rendering
│   │   └── menu.js        # Menu controller
│   ├── storage/
│   │   ├── highScores.js  # High score persistence
│   │   └── settings.js    # Settings persistence
│   └── audio/
│       └── audioManager.js # Audio system
└── tests/
    ├── collision.test.js   # Collision tests
    ├── player.test.js      # Player tests
    ├── gameState.test.js   # Game state tests
    └── highScores.test.js  # High scores tests
```

## How to Run

### Development Server

1. Install dependencies (if any):
   ```bash
   npm install
   ```

2. Start a local server:
   ```bash
   npm run serve
   ```
   Or use any static file server:
   ```bash
   npx serve . -p 3000
   ```

3. Open your browser to `http://localhost:3000`

### Production Deployment

Simply upload all files to a web server or hosting service. The game works entirely client-side with no backend required.

For PWA features to work properly, the site must be served over HTTPS.

## How to Play

### Controls

**Keyboard:**
- **Move Left**: ← or A
- **Move Right**: → or D
- **Fire**: Space or W
- **Pause**: Esc or P
- **Restart** (game over): Enter or R

**Touch (Mobile):**
- **Left Button**: Move left
- **Right Button**: Move right
- **Fire Button**: Shoot

### Objective

- Destroy all enemies in each wave
- Avoid enemy bullets and collisions
- Complete waves to advance levels
- Survive as long as possible and get the highest score
- Perfect waves (no hits taken) award bonus points

### Difficulty Levels

- **Easy**: Slower enemies, less frequent firing, higher player speed
- **Normal**: Balanced gameplay
- **Hard**: Faster enemies, more frequent firing, higher score multipliers

## Testing

Run the test suite:

```bash
npm test
```

Watch mode for development:

```bash
npm run test:watch
```

Tests cover:
- Collision detection logic
- Player movement and boundaries
- Game state management
- High score persistence
- Scoring calculations

## Browser Compatibility

Tested and working on:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 9+)

## PWA Installation

On supported browsers:
1. Visit the game in your browser
2. Look for the "Install" button in the address bar
3. Click to install as a standalone app
4. Launch from your home screen or app drawer

The game will work offline after the first load.

## Performance

- Target: 60 FPS on all devices
- Lightweight: <200KB total size (excluding fonts)
- No external dependencies
- Optimized for mobile and desktop

## Architecture Highlights

### Separation of Concerns
- **Entities**: Pure data objects with update/render functions
- **Systems**: Reusable logic modules (collision, wave management)
- **UI**: Separate rendering and state management
- **Storage**: Isolated persistence layer

### Modular Design
- ES6 modules for clean imports
- No global variables
- Composable functions
- Easy to extend and modify

### Best Practices
- JSDoc comments for all public APIs
- Pure functions for testable logic
- Immutable configuration objects
- Clear naming conventions

## Customization

### Adjusting Difficulty

Edit `src/config/gameConfig.js`:

```javascript
difficulty: {
  easy: {
    enemySpeedMult: 0.8,  // Slower
    enemyFireRateMult: 0.7, // Less frequent
    // ...
  }
}
```

### Adding New Waves

Edit `src/config/waves.js`:

```javascript
{
  id: 6,
  name: 'My New Wave',
  pattern: 'custom',
  // ... wave configuration
}
```

### Changing Colors/Visuals

Edit `src/config/gameConfig.js` for entity colors, or modify rendering functions in `src/entities/*.js`.

### Custom Sound Effects

Replace synthesized sounds in `src/audio/audioManager.js` with loaded audio files.

## License

MIT License - Free to use, modify, and distribute

## Credits

Inspired by the classic Activision game *Megamania* for the Atari 2600.

Built as a tutorial project demonstrating modern JavaScript game development techniques.
