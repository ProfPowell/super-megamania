import { loadPlayerName, savePlayerName } from '../storage/settings.js';
import { isHighScore, addHighScore, renderHighScores } from '../storage/highScores.js';

/**
 * Game-over flow: optional name entry for a new high score, then the
 * standard game-over menu. Driven by DOM events from the existing
 * menu screens — no per-frame update or render needed.
 *
 * Exposes a single async-friendly entry point: handleGameOver(ctx, menuController).
 */

export function handleGameOver(ctx, menuController) {
  ctx.state.currentState = 'GAME_OVER';

  ctx.audio.stopMusic();
  ctx.audio.playGameOver();

  if (isHighScore(ctx.state.score)) {
    showNameEntryScreen(ctx, menuController);
  } else {
    showGameOverMenu(ctx, menuController);
  }
}

function showNameEntryScreen(ctx, menuController) {
  document.getElementById('name-entry-score').textContent = `SCORE: ${ctx.state.score}`;
  const nameInput = document.getElementById('player-name');
  nameInput.value = loadPlayerName();
  menuController.showScreen('nameEntry');

  setTimeout(() => {
    nameInput.focus();
    nameInput.select();
  }, 100);

  const handleNameSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'change') {
      e.preventDefault();
      const name = nameInput.value.toUpperCase().substring(0, 3).padEnd(3, 'A');
      savePlayerName(name);
      addHighScore(name, ctx.state.score, ctx.state.level);
      nameInput.removeEventListener('keydown', handleNameSubmit);
      nameInput.removeEventListener('change', handleNameSubmit);
      showHighScoresAfterEntry(ctx, menuController);
    }
  };

  nameInput.addEventListener('keydown', handleNameSubmit);
  nameInput.addEventListener('change', handleNameSubmit);
}

function showHighScoresAfterEntry(ctx, menuController) {
  menuController.showScreen('high-scores');
  renderHighScores('high-scores-list');

  const backButton = document.getElementById('btn-back-scores');
  const handleContinue = () => {
    backButton.removeEventListener('click', handleContinue);
    showGameOverMenu(ctx, menuController);
  };
  backButton.addEventListener('click', handleContinue, { once: true });
}

function showGameOverMenu(ctx, menuController) {
  document.getElementById('final-score').textContent = `SCORE: ${ctx.state.score}`;
  menuController.showScreen('gameOver');
}
