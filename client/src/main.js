import Phaser from 'phaser';
import GameScene from './scenes/GameScene';
import './style.css';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

const game = new Phaser.Game(config);

// Check if teacher mode
const urlParams = new URLSearchParams(window.location.search);
const isTeacher = urlParams.get('role') === 'teacher';

// UI Elements
const introOverlay = document.getElementById('intro-overlay');
const lobbyOverlay = document.getElementById('lobby-overlay');
const introBtn = document.getElementById('intro-continue-btn');
const nameInput = document.getElementById('player-name');
const joinBtn = document.getElementById('join-btn');

// Initial UI State
if (isTeacher) {
  introOverlay.classList.add('hidden');
  lobbyOverlay.classList.add('hidden');
  game.events.once('ready', () => {
    const scene = game.scene.getScene('GameScene');
    if (scene) scene.joinGame('TEACHER_OBSERVER', true);
  });
} else {
  lobbyOverlay.classList.add('hidden');
  introOverlay.classList.remove('hidden');
}

introBtn.addEventListener('click', () => {
  introOverlay.classList.add('hidden');
  lobbyOverlay.classList.remove('hidden');
});

joinBtn.addEventListener('click', () => {
  const name = nameInput.value.trim() || 'Player';
  lobbyOverlay.classList.add('hidden');

  // Notify the game scene — player will spawn in Waiting Room
  const scene = game.scene.getScene('GameScene');
  if (scene) {
    scene.joinGame(name);
  }
});
