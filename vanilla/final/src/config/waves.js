/**
 * @fileoverview Wave definitions for enemy patterns
 * Each wave has unique movement patterns and combat parameters
 */

/**
 * @typedef {Object} WaveConfig
 * @property {number} id - Wave identifier
 * @property {string} name - Display name
 * @property {string} pattern - Pattern type identifier
 * @property {Object} enemy - Enemy properties
 * @property {number} count - Number of enemies
 * @property {number} spawnInterval - MS between spawns
 * @property {number} formationDelay - MS before wave starts
 * @property {number} speed - Base movement speed
 * @property {string} pathType - Movement path algorithm
 * @property {Object} pathParams - Path-specific parameters
 * @property {number} fireRate - MS between enemy shots (0 = no fire)
 * @property {number} bulletSpeed - Enemy bullet speed
 * @property {number} requiredKills - Enemies to kill to complete wave
 */

/**
 * All wave configurations
 * @type {WaveConfig[]}
 */
export const waves = [
  {
    id: 1,
    name: 'Horizontal Sweep',
    pattern: 'horizontal',
    enemy: {
      width: 24,
      height: 24,
      color: '#ff0000',
      hp: 1,
      scoreValue: 10
    },
    count: 8,
    spawnInterval: 500,
    formationDelay: 0,
    speed: 80,
    pathType: 'sweep',
    pathParams: {
      amplitude: 200,
      direction: 1,
      ySpeed: 20
    },
    fireRate: 0,
    bulletSpeed: 200,
    requiredKills: 8
  },

  {
    id: 2,
    name: 'Zigzag Formation',
    pattern: 'zigzag',
    enemy: {
      width: 24,
      height: 24,
      color: '#ff8800',
      hp: 1,
      scoreValue: 10
    },
    count: 10,
    spawnInterval: 400,
    formationDelay: 1000,
    speed: 100,
    pathType: 'zigzag',
    pathParams: {
      amplitude: 150,
      frequency: 0.02,
      ySpeed: 30
    },
    fireRate: 2000,
    bulletSpeed: 200,
    requiredKills: 10
  },

  {
    id: 3,
    name: 'Dive Bombers',
    pattern: 'dive',
    enemy: {
      width: 24,
      height: 24,
      color: '#ffff00',
      hp: 1,
      scoreValue: 20
    },
    count: 6,
    spawnInterval: 800,
    formationDelay: 1500,
    speed: 120,
    pathType: 'sine_dive',
    pathParams: {
      amplitude: 100,
      frequency: 0.03,
      diveSpeed: 80
    },
    fireRate: 1500,
    bulletSpeed: 200,
    requiredKills: 6
  },

  {
    id: 4,
    name: 'Circle Formation',
    pattern: 'circle',
    enemy: {
      width: 24,
      height: 24,
      color: '#ff00ff',
      hp: 1,
      scoreValue: 20
    },
    count: 12,
    spawnInterval: 300,
    formationDelay: 2000,
    speed: 90,
    pathType: 'circular',
    pathParams: {
      radius: 120,
      centerX: 320,
      centerY: 150,
      angularSpeed: 0.015
    },
    fireRate: 2500,
    bulletSpeed: 200,
    requiredKills: 12
  },

  {
    id: 5,
    name: 'Fast Swarm',
    pattern: 'swarm',
    enemy: {
      width: 16,
      height: 16,
      color: '#00ffff',
      hp: 1,
      scoreValue: 30
    },
    count: 15,
    spawnInterval: 250,
    formationDelay: 2500,
    speed: 150,
    pathType: 'chaotic',
    pathParams: {
      changeInterval: 800,
      amplitude: 180,
      ySpeed: 40
    },
    fireRate: 3000,
    bulletSpeed: 200,
    requiredKills: 15
  }
];

/**
 * Get wave configuration by ID
 * @param {number} waveId - Wave ID (1-based)
 * @returns {WaveConfig|null} Wave configuration or null if not found
 */
export function getWaveById(waveId) {
  return waves.find(w => w.id === waveId) || null;
}

/**
 * Get wave by index in cycle (handles looping)
 * @param {number} index - Wave index (0-based)
 * @returns {WaveConfig} Wave configuration
 */
export function getWaveByIndex(index) {
  return waves[index % waves.length];
}

/**
 * Get total number of waves
 * @returns {number} Wave count
 */
export function getTotalWaves() {
  return waves.length;
}
