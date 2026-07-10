# 🌭 Super Megamania 🌭

A modern JavaScript remake of the classic Atari 2600 game *Megamania* with a twist - featuring multiple themes including the gloriously absurd **ABSURD MODE**!

![Game Screenshot](vanilla/final/assets/icon-192.png)

## 🎮 Play Now

**▶️ Play in your browser: https://profpowell.github.io/super-megamania/**

Works on desktop and phones (touch controls appear automatically). Every push to `main` auto-deploys via GitHub Actions.

Or run it locally — open `vanilla/final/index.html` in a modern web browser or serve it with a local HTTP server:

```bash
cd vanilla/final
python3 -m http.server 8000
# Then visit http://localhost:8000
```

Or install as a Progressive Web App (PWA) on your phone or desktop!

## 🎯 Features

### Core Gameplay
- **Classic Megamania mechanics** - Horizontal shooter with wave-based enemy patterns
- **Energy system** - Time-based energy depletion adds urgency
- **15 unique wave patterns** - Sweep, zigzag, spiral, kamikaze, and more!
- **3 difficulty levels** - Easy, Normal, and Hard
- **High score persistence** - Tracks top 10 scores with player initials
- **Perfect wave bonuses** - Extra points for flawless performance
- **Energy bonuses** - Convert remaining energy to points between waves

### Visual Themes 🎨

Choose from 8 distinct visual themes:

1. **🐱 Cats** - Adorable cat faces (default)
2. **🍔 Food** - Burgers, pizza, donuts, and more
3. **🛸 Space** - UFOs and alien invaders
4. **😊 Emoji** - Expressive emoji faces
5. **⚡ Retro** - Classic geometric wireframes
6. **🎨 Classic** - Simple colored shapes
7. **📁 Demo** - Example external file theme
8. **🌭 ABSURD MODE** - Maximum internet chaos! (Dancing hot dog vs angry AI, loading spinners, coffee cups, 404 errors, and screaming emojis)

### Audio 🔊
- **Theme-specific sound effects** - Different sounds for ABSURD MODE!
- **Background music** - Retro chiptune-style looping soundtrack
- **Procedurally generated sounds** - All sounds use Web Audio API
- **Volume controls** - Master volume slider, separate SFX/Music toggles

### Progressive Features
- **Progressive Web App (PWA)** - Install on mobile or desktop
- **Touch controls** - Mobile-optimized on-screen buttons
- **Keyboard controls** - Arrow keys or WASD
- **Offline support** - Service worker caching
- **Responsive design** - Works on all screen sizes

## 🕹️ Controls

### Keyboard
- **Arrow Keys / A/D** - Move left/right
- **Space / W** - Fire
- **Escape / P** - Pause
- **Enter / R** - Restart (when game over)

### Touch
- Tap the on-screen buttons (automatically appear on mobile)

## 🚀 Quick Start

### Play Immediately
Just open `vanilla/final/index.html` - no build step required!

### Run Tests
```bash
npm install
npm test
```

All 36 unit tests should pass ✅

### Development
The game is written in modern vanilla JavaScript with ES6 modules:

```text
vanilla/final/
├── index.html           # Entry point
├── src/
│   ├── main.js         # Game initialization
│   ├── gameLoop.js     # Update/render loop
│   ├── config/         # Game configuration
│   ├── entities/       # Player, enemies, projectiles
│   ├── systems/        # Collision, particles, waves
│   ├── ui/             # HUD, menus
│   ├── input/          # Keyboard/touch input
│   ├── audio/          # Sound effects & music
│   ├── storage/        # High scores, settings
│   └── assets/         # Themes & asset loading
├── styles/             # CSS
├── assets/
│   ├── images/         # Theme graphics (SVG)
│   └── music/          # Background music (WAV)
└── tests/              # Unit tests
```

## 🎨 Creating Custom Themes

Themes support both embedded SVG data URLs and external image files (PNG, JPG, SVG).

### Example Theme
```javascript
export const myTheme = {
  name: 'My Cool Theme',
  player: 'assets/images/my-theme/player.svg',
  enemies: {
    wave1: 'assets/images/my-theme/enemy1.svg',
    wave2: 'assets/images/my-theme/enemy2.svg',
    wave3: 'assets/images/my-theme/enemy3.svg',
    wave4: 'assets/images/my-theme/enemy4.svg',
    wave5: 'assets/images/my-theme/enemy5.svg',
  }
};
```

Add your theme to `src/assets/themes.js` and it will appear in the settings menu!

See `CUSTOM_THEMES.md` for detailed instructions.

## 🌭 ABSURD MODE

The crown jewel of Super Megamania! Select "🌭 ABSURD MODE 🌭" in the theme settings for:

### Visuals
- **Player**: Dancing hot dog with googly eyes and waving arms
- **Wave 1**: Angry AI robots with blinking red LED eyes
- **Wave 2**: Eternal loading spinners stuck at 99%
- **Wave 3**: Coffee cups with animated steam (developer fuel)
- **Wave 4**: Error 404 browser windows with glitch effects
- **Wave 5**: Screaming emojis with panic vibration lines

### Sounds
- **Player Fire**: Silly "pew-pew-boing!" sounds
- **Enemy Explode**: Cartoonish ascending explosion with pop
- **Player Death**: Sad trombone (womp womp womp)
- **Wave Start**: Quirky fanfare with glitchy ending
- **Energy Refill**: Power-up with wobbling glitch
- **Menu Select**: Bouncy quirky beeps

All absurd assets feature CSS animations for maximum chaos! 🎉

## 🏆 High Scores

Top 10 scores are saved to browser localStorage with player initials (3 characters).

High scores persist across sessions and are displayed on the game over screen.

## 📱 PWA Installation

The game can be installed as a standalone app:

1. Open the game in Chrome/Edge/Safari
2. Look for "Install" prompt or "Add to Home Screen"
3. Install and launch like a native app
4. Works offline thanks to service worker caching

## 🧪 Architecture

### Modern JavaScript
- ES6 modules (no bundler needed)
- Strict mode throughout
- JSDoc comments for type hints
- Clean separation of concerns

### Game Loop
- RequestAnimationFrame-based
- Delta time for frame-independent movement
- Separate update and render phases

### State Management
- Centralized game state object
- Immutable config objects
- No global variables (except module-level state)

### Testing
- Node.js built-in test runner
- Unit tests for core systems
- Collision detection tests
- Game state tests
- High score tests

## 🎵 Music Generation

Background music is procedurally generated using Python:

```bash
cd vanilla/final/assets/music
python3 generate_music.py
```

This creates a retro chiptune-style melody that loops seamlessly.

## 🐛 Known Limitations

- Music requires user interaction to start (browser autoplay policy)
- Touch controls work best on mobile devices in portrait mode
- PWA installation varies by browser

## 📄 License

MIT License - Feel free to use, modify, and distribute!

## 🙏 Credits

Based on the classic Atari 2600 game *Megamania* by Activision (1982).

Modern implementation built with:
- Vanilla JavaScript
- HTML5 Canvas API
- Web Audio API
- Service Workers
- LocalStorage API

Special thanks to the absurdity of the internet for inspiring ABSURD MODE! 🌭🤖☕😱

## 🔧 Troubleshooting

**Music not playing?**
- Check that music is enabled in settings
- Ensure browser allows audio (click anywhere first)
- Verify `assets/music/background.wav` exists

**Game running slowly?**
- Try reducing browser window size
- Close other tabs
- Check browser console for errors

**Touch controls not showing?**
- They only appear on touch-enabled devices
- Try refreshing the page
- Check that JavaScript is enabled

## 🚀 Future Enhancements

- More enemy wave patterns
- Boss battles
- Power-ups (shields, rapid fire, etc.)
- Multiplayer mode
- Leaderboard sync via backend
- Additional themes (community submissions welcome!)
- More absurd sound effects

## 📞 Contributing

Found a bug? Have a cool theme idea? Want to make ABSURD MODE even more absurd?

This is a fun project - contributions welcome! The codebase is intentionally simple and well-documented to make it easy to hack on.

---

**Enjoy the game and embrace the absurdity!** 🌭
