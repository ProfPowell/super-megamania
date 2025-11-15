# Configuration Schema

## Overview

This document defines the JSON/JavaScript configuration schema for the Megamania game. Configuration is split into modules for maintainability and allows easy tuning of game parameters.

## Master Configuration Object

```javascript
{
  canvas: { /* Canvas configuration */ },
  player: { /* Player parameters */ },
  waves: [ /* Array of wave definitions */ ],
  difficulty: { /* Difficulty level settings */ },
  audio: { /* Audio settings */ },
  controls: { /* Control mappings */ },
  ui: { /* UI/HUD settings */ },
  storage: { /* LocalStorage keys */ }
}
```

## Canvas Configuration

Controls screen resolution and rendering.

```javascript
{
  canvas: {
    width: 640,              // Logical width in pixels
    height: 480,             // Logical height in pixels
    backgroundColor: "#0a0e27", // Background color
    scaleMode: "fit",        // "fit" | "fill" | "stretch"
    pixelArt: true,          // Disable image smoothing for crisp pixels
    maxFPS: 60               // Target frame rate
  }
}
```

## Player Configuration

Defines player ship behavior and capabilities.

```javascript
{
  player: {
    width: 32,               // Sprite width
    height: 24,              // Sprite height
    speed: 250,              // Horizontal speed (px/s)
    initialLives: 3,         // Starting lives
    invincibilityTime: 2000, // Invincibility after hit (ms)

    // Position
    startX: 320,             // Starting X position (center)
    startY: 440,             // Starting Y position (near bottom)
    moveZone: {
      minX: 16,              // Left boundary
      maxX: 624,             // Right boundary
      minY: 384,             // Top of player zone
      maxY: 464              // Bottom boundary
    },

    // Combat
    bullet: {
      width: 4,
      height: 12,
      speed: 400,            // Upward speed (px/s)
      cooldown: 300,         // Fire rate (ms between shots)
      maxActive: 5,          // Max simultaneous bullets
      color: "#ffffff"
    },

    // Visual
    color: "#00ff00",        // Default color (if no sprite)
    sprite: null,            // Image asset (or null for shape)

    // Collision
    hitboxScale: 0.8         // Hitbox is 80% of sprite (forgiving)
  }
}
```

## Wave Configuration

Array of enemy wave definitions.

```javascript
{
  waves: [
    {
      id: 1,
      name: "Horizontal Sweep",
      pattern: "horizontal",

      // Enemy properties
      enemy: {
        width: 24,
        height: 24,
        color: "#ff0000",
        sprite: null,
        hp: 1,
        scoreValue: 10
      },

      // Spawn parameters
      count: 8,              // Number of enemies
      spawnInterval: 500,    // Time between spawns (ms)
      formationDelay: 0,     // Delay before wave starts (ms)

      // Movement
      speed: 80,             // Base movement speed (px/s)
      pathType: "sweep",     // Movement pattern type
      pathParams: {
        amplitude: 200,      // Horizontal sweep distance
        direction: 1         // 1 = right first, -1 = left first
      },

      // Combat
      fireRate: 0,           // 0 = don't fire, or ms between shots
      bulletSpeed: 200,      // Enemy bullet speed (px/s)

      // Wave completion
      requiredKills: 8       // Must kill this many to advance
    },

    {
      id: 2,
      name: "Zigzag Formation",
      pattern: "zigzag",
      enemy: {
        width: 24,
        height: 24,
        color: "#ff8800",
        sprite: null,
        hp: 1,
        scoreValue: 10
      },
      count: 10,
      spawnInterval: 400,
      formationDelay: 1000,
      speed: 100,
      pathType: "zigzag",
      pathParams: {
        amplitude: 150,
        frequency: 0.02      // How tight the zigzag
      },
      fireRate: 2000,
      bulletSpeed: 200,
      requiredKills: 10
    },

    {
      id: 3,
      name: "Dive Bombers",
      pattern: "dive",
      enemy: {
        width: 24,
        height: 24,
        color: "#ffff00",
        sprite: null,
        hp: 1,
        scoreValue: 20
      },
      count: 6,
      spawnInterval: 800,
      formationDelay: 1500,
      speed: 120,
      pathType: "sine_dive",
      pathParams: {
        amplitude: 100,
        frequency: 0.03,
        diveSpeed: 80        // Vertical descent speed
      },
      fireRate: 1500,
      bulletSpeed: 200,
      requiredKills: 6
    },

    {
      id: 4,
      name: "Circle Formation",
      pattern: "circle",
      enemy: {
        width: 24,
        height: 24,
        color: "#ff00ff",
        sprite: null,
        hp: 1,
        scoreValue: 20
      },
      count: 12,
      spawnInterval: 300,
      formationDelay: 2000,
      speed: 90,
      pathType: "circular",
      pathParams: {
        radius: 120,
        centerX: 320,
        centerY: 150,
        angularSpeed: 0.015  // Radians per frame
      },
      fireRate: 2500,
      bulletSpeed: 200,
      requiredKills: 12
    },

    {
      id: 5,
      name: "Fast Swarm",
      pattern: "swarm",
      enemy: {
        width: 16,
        height: 16,
        color: "#00ffff",
        sprite: null,
        hp: 1,
        scoreValue: 30
      },
      count: 15,
      spawnInterval: 250,
      formationDelay: 2500,
      speed: 150,
      pathType: "chaotic",
      pathParams: {
        changeInterval: 800, // Change direction every 800ms
        amplitude: 180
      },
      fireRate: 3000,
      bulletSpeed: 200,
      requiredKills: 15
    }
  ]
}
```

## Difficulty Configuration

Modifiers applied based on difficulty setting and level progression.

```javascript
{
  difficulty: {
    easy: {
      playerSpeedMult: 1.2,
      enemySpeedMult: 0.8,
      enemyFireRateMult: 0.7,   // Slower fire rate
      scoreMultiplier: 0.8
    },

    normal: {
      playerSpeedMult: 1.0,
      enemySpeedMult: 1.0,
      enemyFireRateMult: 1.0,
      scoreMultiplier: 1.0
    },

    hard: {
      playerSpeedMult: 1.0,
      enemySpeedMult: 1.3,
      enemyFireRateMult: 1.5,   // Faster fire rate
      scoreMultiplier: 1.5
    },

    // Level progression (applied after each full wave cycle)
    levelProgression: {
      speedIncrease: 0.15,      // +15% speed per level
      fireRateIncrease: 0.20,   // +20% faster firing
      spawnIntervalDecrease: 0.10, // -10% spawn time
      scoreMultiplier: 1.5      // ×1.5 per level
    }
  }
}
```

## Audio Configuration

Sound and music settings.

```javascript
{
  audio: {
    masterVolume: 0.7,         // 0.0 - 1.0
    sfxVolume: 0.8,            // 0.0 - 1.0
    musicVolume: 0.5,          // 0.0 - 1.0
    sfxEnabled: true,
    musicEnabled: false,       // Start with music off

    // Sound effect paths
    sounds: {
      playerFire: "assets/audio/sfx/player_fire.mp3",
      enemyExplode: "assets/audio/sfx/enemy_explode.mp3",
      playerHit: "assets/audio/sfx/player_hit.mp3",
      waveStart: "assets/audio/sfx/wave_start.mp3",
      gameOver: "assets/audio/sfx/game_over.mp3",
      menuNavigate: "assets/audio/sfx/menu_navigate.mp3",
      menuSelect: "assets/audio/sfx/menu_select.mp3"
    },

    // Music track paths
    music: {
      menu: "assets/audio/music/menu.mp3",
      gameplay: "assets/audio/music/gameplay.mp3"
    }
  }
}
```

## Controls Configuration

Input mappings for keyboard and touch.

```javascript
{
  controls: {
    keyboard: {
      moveLeft: ["ArrowLeft", "KeyA"],
      moveRight: ["ArrowRight", "KeyD"],
      fire: ["Space", "KeyW"],
      pause: ["Escape", "KeyP"],
      restart: ["Enter", "KeyR"]
    },

    touch: {
      enabled: true,
      zones: {
        left: {
          x: 0,              // Left edge
          y: 400,            // Top of button area
          width: 150,        // Button width
          height: 80,        // Button height
          label: "◀"
        },
        right: {
          x: 490,            // Right side
          y: 400,
          width: 150,
          height: 80,
          label: "▶"
        },
        fire: {
          x: 270,            // Center bottom
          y: 400,
          width: 100,
          height: 80,
          label: "🔥"
        }
      },
      opacity: 0.6,          // Touch button opacity
      activeOpacity: 0.9     // When pressed
    }
  }
}
```

## UI Configuration

HUD and menu settings.

```javascript
{
  ui: {
    hud: {
      font: "16px 'Press Start 2P', monospace",
      color: "#ffffff",
      scorePosition: { x: 10, y: 25 },
      livesPosition: { x: 450, y: 25 },
      wavePosition: { x: 250, y: 25 },
      fpsPosition: { x: 10, y: 470 },  // Debug only
      showFPS: false
    },

    menu: {
      titleFont: "32px 'Press Start 2P', monospace",
      buttonFont: "20px 'Press Start 2P', monospace",
      textColor: "#ffffff",
      highlightColor: "#ffff00",
      backgroundColor: "rgba(0, 0, 0, 0.8)"
    },

    gameOver: {
      font: "24px 'Press Start 2P', monospace",
      color: "#ff0000",
      fadeIn: 1000           // Fade in time (ms)
    },

    highScores: {
      font: "16px 'Press Start 2P', monospace",
      maxEntries: 10,
      nameLength: 3          // Initials only
    }
  }
}
```

## Storage Configuration

LocalStorage keys and settings.

```javascript
{
  storage: {
    keys: {
      highScores: "megamania_high_scores",
      settings: "megamania_settings",
      playerName: "megamania_player_name"
    },

    defaults: {
      playerName: "AAA",
      difficulty: "normal",
      audioEnabled: true,
      musicEnabled: false
    }
  }
}
```

## Usage Example

In code:

```javascript
// config/gameConfig.js
export const gameConfig = {
  canvas: { /* ... */ },
  player: { /* ... */ },
  // ... rest of config
};

// Import and use
import { gameConfig } from './config/gameConfig.js';

const playerSpeed = gameConfig.player.speed;
const wave1 = gameConfig.waves[0];
```

## Dynamic Configuration

Some values can be computed at runtime:

```javascript
export function applyDifficulty(baseConfig, difficulty, level) {
  const diffMod = baseConfig.difficulty[difficulty];
  const levelMod = baseConfig.difficulty.levelProgression;

  return {
    ...baseConfig,
    player: {
      ...baseConfig.player,
      speed: baseConfig.player.speed * diffMod.playerSpeedMult
    },
    waves: baseConfig.waves.map(wave => ({
      ...wave,
      speed: wave.speed * diffMod.enemySpeedMult * (1 + level * levelMod.speedIncrease),
      fireRate: wave.fireRate / diffMod.enemyFireRateMult,
      spawnInterval: wave.spawnInterval * (1 - level * levelMod.spawnIntervalDecrease)
    }))
  };
}
```

This schema provides a complete, flexible configuration system that can be easily modified without touching game logic code.
