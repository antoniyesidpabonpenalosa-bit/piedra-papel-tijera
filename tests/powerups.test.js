import { describe, it, expect } from 'vitest';
import { POWERUPS, SURVIVAL_POWERUPS, getPowerup, rollNextPowerupRound, maybeSpawnPowerup } from '../src/powerups.js';

describe('power-ups', () => {
  it('getPowerup encuentra por id', () => {
    expect(getPowerup('double').name).toBe('Doble Punto');
    expect(getPowerup('inexistente')).toBe(null);
  });

  it('rollNextPowerupRound devuelve entre +3 y +5 rondas', () => {
    for (let i = 0; i < 50; i++) {
      const next = rollNextPowerupRound(10);
      expect(next).toBeGreaterThanOrEqual(13);
      expect(next).toBeLessThanOrEqual(15);
    }
  });

  it('no aparece antes de la ronda elegible', () => {
    for (let i = 0; i < 30; i++) {
      expect(maybeSpawnPowerup(4, 10)).toBe(null);
    }
  });

  it('puede aparecer una vez alcanzada la ronda elegible', () => {
    let spawned = false;
    for (let i = 0; i < 200; i++) {
      if (maybeSpawnPowerup(10, 10)) { spawned = true; break; }
    }
    expect(spawned).toBe(true);
  });

  it('el power-up generado siempre es válido', () => {
    for (let i = 0; i < 200; i++) {
      const p = maybeSpawnPowerup(10, 10);
      if (p) expect(POWERUPS.map(x => x.id)).toContain(p.id);
    }
  });

  it('SURVIVAL_POWERUPS solo incluye Espía y Escudo', () => {
    expect(SURVIVAL_POWERUPS.map(p => p.id).sort()).toEqual(['peek', 'shield']);
  });

  it('respeta el pool personalizado al generar', () => {
    for (let i = 0; i < 200; i++) {
      const p = maybeSpawnPowerup(10, 10, SURVIVAL_POWERUPS);
      if (p) expect(['peek', 'shield']).toContain(p.id);
    }
  });
});
