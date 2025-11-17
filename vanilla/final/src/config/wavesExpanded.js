/**
 * @fileoverview Expanded wave definitions
 * 15+ unique wave patterns with varied attack styles
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
 * @property {string} themeKey - Which enemy sprite from theme to use
 */

/**
 * All wave configurations (15 unique patterns)
 * @type {WaveConfig[]}
 */
export const waves = [
  // Wave 1: Horizontal Sweep
  {
    id: 1,
    name: 'Horizontal Sweep',
    pattern: 'horizontal',
    enemy: { width: 24, height: 24, color: '#ff0000', hp: 1, scoreValue: 10 },
    count: 12,            // Increased from 8
    spawnInterval: 400,   // Faster spawning
    formationDelay: 0,
    speed: 80,
    pathType: 'sweep',
    pathParams: { amplitude: 200, direction: 1, ySpeed: 20 },
    fireRate: 0,
    bulletSpeed: 200,
    requiredKills: 12,
    themeKey: 'wave1'
  },

  // Wave 2: Zigzag Formation
  {
    id: 2,
    name: 'Zigzag Formation',
    pattern: 'zigzag',
    enemy: { width: 24, height: 24, color: '#ff8800', hp: 1, scoreValue: 10 },
    count: 15,            // Increased from 10
    spawnInterval: 350,
    formationDelay: 1000,
    speed: 100,
    pathType: 'zigzag',
    pathParams: { amplitude: 150, frequency: 0.02, ySpeed: 30 },
    fireRate: 2000,
    bulletSpeed: 200,
    requiredKills: 15,
    themeKey: 'wave2'
  },

  // Wave 3: Dive Bombers
  {
    id: 3,
    name: 'Dive Bombers',
    pattern: 'dive',
    enemy: { width: 24, height: 24, color: '#ffff00', hp: 1, scoreValue: 20 },
    count: 10,            // Increased from 6
    spawnInterval: 600,
    formationDelay: 1500,
    speed: 120,
    pathType: 'sine_dive',
    pathParams: { amplitude: 100, frequency: 0.03, diveSpeed: 80 },
    fireRate: 1500,
    bulletSpeed: 200,
    requiredKills: 10,
    themeKey: 'wave3'
  },

  // Wave 4: Circle Formation
  {
    id: 4,
    name: 'Circle Formation',
    pattern: 'circle',
    enemy: { width: 24, height: 24, color: '#ff00ff', hp: 1, scoreValue: 20 },
    count: 18,            // Increased from 12
    spawnInterval: 250,
    formationDelay: 2000,
    speed: 90,
    pathType: 'circular',
    pathParams: { radius: 120, centerX: 320, centerY: 150, angularSpeed: 0.015 },
    fireRate: 2500,
    bulletSpeed: 200,
    requiredKills: 18,
    themeKey: 'wave4'
  },

  // Wave 5: Fast Swarm
  {
    id: 5,
    name: 'Fast Swarm',
    pattern: 'swarm',
    enemy: { width: 16, height: 16, color: '#00ffff', hp: 1, scoreValue: 30 },
    count: 22,            // Increased from 15
    spawnInterval: 200,
    formationDelay: 2500,
    speed: 150,
    pathType: 'chaotic',
    pathParams: { changeInterval: 800, amplitude: 180, ySpeed: 40 },
    fireRate: 3000,
    bulletSpeed: 200,
    requiredKills: 22,
    themeKey: 'wave5'
  },

  // Wave 6: V-Formation
  {
    id: 6,
    name: 'V-Formation',
    pattern: 'v_formation',
    enemy: { width: 24, height: 24, color: '#ff6600', hp: 1, scoreValue: 15 },
    count: 7,
    spawnInterval: 600,
    formationDelay: 1000,
    speed: 70,
    pathType: 'v_shape',
    pathParams: { angle: 45, spacing: 40, ySpeed: 25 },
    fireRate: 1800,
    bulletSpeed: 220,
    requiredKills: 7,
    themeKey: 'wave1'
  },

  // Wave 7: Spiral Descent
  {
    id: 7,
    name: 'Spiral Descent',
    pattern: 'spiral',
    enemy: { width: 24, height: 24, color: '#9370DB', hp: 1, scoreValue: 25 },
    count: 10,
    spawnInterval: 500,
    formationDelay: 1500,
    speed: 60,
    pathType: 'spiral',
    pathParams: { radius: 80, radiusGrowth: 0.5, angularSpeed: 0.05, ySpeed: 20 },
    fireRate: 2200,
    bulletSpeed: 180,
    requiredKills: 10,
    themeKey: 'wave2'
  },

  // Wave 8: Wave Pattern
  {
    id: 8,
    name: 'Wave Pattern',
    pattern: 'wave',
    enemy: { width: 24, height: 24, color: '#00CED1', hp: 1, scoreValue: 15 },
    count: 12,
    spawnInterval: 350,
    formationDelay: 1000,
    speed: 90,
    pathType: 'wave',
    pathParams: { amplitude: 120, frequency: 0.015, ySpeed: 35 },
    fireRate: 2000,
    bulletSpeed: 200,
    requiredKills: 12,
    themeKey: 'wave3'
  },

  // Wave 9: Split Formation
  {
    id: 9,
    name: 'Split Formation',
    pattern: 'split',
    enemy: { width: 24, height: 24, color: '#FFB6C1', hp: 1, scoreValue: 20 },
    count: 8,
    spawnInterval: 700,
    formationDelay: 1200,
    speed: 100,
    pathType: 'split',
    pathParams: { splitPoint: 200, divergeAngle: 30, ySpeed: 30 },
    fireRate: 1600,
    bulletSpeed: 210,
    requiredKills: 8,
    themeKey: 'wave4'
  },

  // Wave 10: Cluster Bomb
  {
    id: 10,
    name: 'Cluster Bomb',
    pattern: 'cluster',
    enemy: { width: 20, height: 20, color: '#32CD32', hp: 1, scoreValue: 35 },
    count: 18,
    spawnInterval: 200,
    formationDelay: 2000,
    speed: 120,
    pathType: 'cluster',
    pathParams: { clusterSize: 3, spacing: 30, ySpeed: 45 },
    fireRate: 2800,
    bulletSpeed: 190,
    requiredKills: 18,
    themeKey: 'wave5'
  },

  // Wave 11: Figure-8
  {
    id: 11,
    name: 'Figure-8',
    pattern: 'figure8',
    enemy: { width: 24, height: 24, color: '#FF4500', hp: 1, scoreValue: 30 },
    count: 8,
    spawnInterval: 600,
    formationDelay: 1800,
    speed: 80,
    pathType: 'figure8',
    pathParams: { width: 150, height: 100, speed: 0.02 },
    fireRate: 2400,
    bulletSpeed: 200,
    requiredKills: 8,
    themeKey: 'wave1'
  },

  // Wave 12: Pincer Attack
  {
    id: 12,
    name: 'Pincer Attack',
    pattern: 'pincer',
    enemy: { width: 24, height: 24, color: '#8B4513', hp: 1, scoreValue: 25 },
    count: 10,
    spawnInterval: 550,
    formationDelay: 1500,
    speed: 95,
    pathType: 'pincer',
    pathParams: { startSide: 'alternate', convergeY: 200, ySpeed: 28 },
    fireRate: 1900,
    bulletSpeed: 205,
    requiredKills: 10,
    themeKey: 'wave2'
  },

  // Wave 13: Bouncing Balls
  {
    id: 13,
    name: 'Bouncing Balls',
    pattern: 'bounce',
    enemy: { width: 20, height: 20, color: '#FF1493', hp: 1, scoreValue: 40 },
    count: 12,
    spawnInterval: 400,
    formationDelay: 2000,
    speed: 140,
    pathType: 'bounce',
    pathParams: { bounceHeight: 150, gravity: 300, xSpeed: 60 },
    fireRate: 2600,
    bulletSpeed: 215,
    requiredKills: 12,
    themeKey: 'wave3'
  },

  // Wave 14: Cross Formation
  {
    id: 14,
    name: 'Cross Formation',
    pattern: 'cross',
    enemy: { width: 24, height: 24, color: '#4169E1', hp: 1, scoreValue: 20 },
    count: 9,
    spawnInterval: 500,
    formationDelay: 1200,
    speed: 85,
    pathType: 'cross',
    pathParams: { armLength: 100, rotationSpeed: 0.01, ySpeed: 30 },
    fireRate: 2100,
    bulletSpeed: 200,
    requiredKills: 9,
    themeKey: 'wave4'
  },

  // Wave 15: Kamikaze Rush
  {
    id: 15,
    name: 'Kamikaze Rush',
    pattern: 'kamikaze',
    enemy: { width: 22, height: 22, color: '#DC143C', hp: 1, scoreValue: 50 },
    count: 20,
    spawnInterval: 300,
    formationDelay: 2500,
    speed: 160,
    pathType: 'kamikaze',
    pathParams: { trackPlayer: true, updateInterval: 200, ySpeed: 55 },
    fireRate: 0,
    bulletSpeed: 0,
    requiredKills: 20,
    themeKey: 'wave5'
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
