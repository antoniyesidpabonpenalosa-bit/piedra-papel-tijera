import { describe, it, expect } from 'vitest';
import { cpuLine } from '../src/trashtalk.js';

describe('trash-talk de la CPU', () => {
  it('devuelve una frase para cada evento conocido', () => {
    for (const event of ['cpu_win', 'cpu_loss', 'tie', 'player_game_win', 'cpu_game_win']) {
      expect(typeof cpuLine(event, 'normal')).toBe('string');
    }
  });

  it('devuelve null para un evento desconocido', () => {
    expect(cpuLine('evento_inventado', 'normal')).toBe(null);
  });

  it('en dificultad experta a veces usa frases de "predicción"', () => {
    let sawTaunt = false;
    for (let i = 0; i < 200; i++) {
      const line = cpuLine('cpu_win', 'expert');
      if (line.includes('patrones') || line.includes('lo que vas a jugar') || line.includes('esta jugada antes')) {
        sawTaunt = true; break;
      }
    }
    expect(sawTaunt).toBe(true);
  });
});
