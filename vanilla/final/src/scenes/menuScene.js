/**
 * Menu scene: the title-screen backdrop of falling theme enemies.
 *
 * No gameplay events are emitted here — the menu is cosmetic. Button
 * click handlers (start, settings, help, etc.) remain attached in
 * main.js's bootstrap; this scene only owns the animated backdrop.
 */

const SPAWN_INTERVAL = 0.4; // seconds
const FALL_SPEED = 80;      // pixels/second
const SCREEN_W = 640;
const SCREEN_H = 480;

export function createMenuScene() {
  let fallingEnemies = [];
  let spawnTimer = 0;

  function enter() {
    fallingEnemies = [];
    spawnTimer = 0;
  }

  function update(ctx, dt) {
    spawnTimer += dt;

    if (spawnTimer >= SPAWN_INTERVAL) {
      spawnTimer = 0;
      const enemyKeys = Object.keys(ctx.themeImages);
      if (enemyKeys.length > 0) {
        const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
        fallingEnemies.push({
          x: Math.random() * (SCREEN_W - 20),
          y: -30,
          themeKey: randomKey,
          speed: FALL_SPEED + Math.random() * 40,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 3,
          scale: 0.8 + Math.random() * 0.4
        });
      }
    }

    for (let i = fallingEnemies.length - 1; i >= 0; i--) {
      const enemy = fallingEnemies[i];
      enemy.y += enemy.speed * dt;
      enemy.rotation += enemy.rotationSpeed * dt;
      if (enemy.y > SCREEN_H + 30) {
        fallingEnemies.splice(i, 1);
      }
    }
  }

  function render(ctx) {
    const g = ctx.ctx2d;
    g.save();
    g.globalAlpha = 0.6;

    for (const enemy of fallingEnemies) {
      const image = ctx.themeImages[enemy.themeKey];
      if (image && image.complete) {
        g.save();
        g.translate(enemy.x, enemy.y);
        g.rotate(enemy.rotation);
        g.scale(enemy.scale, enemy.scale);
        g.drawImage(image, -16, -16, 32, 32);
        g.restore();
      }
    }

    g.restore();
  }

  return { enter, update, render };
}
