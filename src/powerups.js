// Power-ups aleatorios: cada N rondas (aleatorio entre 3 y 5) aparece un
// comodín que el jugador puede activar antes de elegir su jugada. Efecto
// puramente de UI/estado, aplicado por quien llama a estas funciones.

export const POWERUPS = [
  {
    id: 'double',
    name: 'Doble Punto',
    emoji: '⚡',
    desc: 'Si ganas esta ronda, vale 2 puntos',
    color: '#ffd700',
  },
  {
    id: 'peek',
    name: 'Espía',
    emoji: '👁️',
    desc: 'Revela qué va a jugar el rival',
    color: '#c084fc',
  },
  {
    id: 'steal',
    name: 'Robo',
    emoji: '💰',
    desc: 'Si ganas, le quitas 1 punto extra al rival',
    color: '#f5576c',
  },
  {
    id: 'shield',
    name: 'Escudo',
    emoji: '🛡️',
    desc: 'Si pierdes esta ronda, no cuenta',
    color: '#2af598',
  },
];

// Subconjunto válido para Supervivencia: no hay puntaje de rival ni meta de
// puntos, así que "Doble Punto" y "Robo" no aplican.
export const SURVIVAL_POWERUPS = POWERUPS.filter(p => p.id === 'peek' || p.id === 'shield');

export function getPowerup(id) {
  return POWERUPS.find(p => p.id === id) || null;
}

// Probabilidad de que aparezca un power-up al iniciar una ronda nueva
// (además del intervalo mínimo entre apariciones).
const APPEAR_CHANCE = 0.35;

export function rollNextPowerupRound(currentRound) {
  // próxima ronda elegible: entre 3 y 5 rondas después
  return currentRound + 3 + Math.floor(Math.random() * 3);
}

export function maybeSpawnPowerup(roundsPlayed, nextEligibleRound, pool = POWERUPS) {
  if (roundsPlayed < nextEligibleRound) return null;
  if (Math.random() > APPEAR_CHANCE) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
