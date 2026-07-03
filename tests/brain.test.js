import { describe, it, expect } from 'vitest';
import { loadBrain, recordPlayerMove, expertChoose, resetBrain, brainStats } from '../src/brain.js';
import { DEFAULT_RULESET, ids, beats } from '../src/ruleset.js';

describe('cerebro de la IA experta', () => {
  it('registra jugadas y transiciones', () => {
    recordPlayerMove('piedra');
    recordPlayerMove('papel');
    recordPlayerMove('tijera');
    const b = loadBrain();
    expect(b.totalMoves).toBe(3);
    expect(b.freq.piedra).toBe(1);
    expect(b.trans1.piedra.papel).toBe(1);
    expect(b.trans2['piedra>papel'].tijera).toBe(1);
    expect(b.last).toBe('tijera');
  });

  it('devuelve siempre un elemento válido', () => {
    for (let i = 0; i < 50; i++) {
      expect(ids(DEFAULT_RULESET)).toContain(expertChoose(DEFAULT_RULESET));
    }
  });

  it('aprende un patrón fuerte y lo contraataca la mayoría de las veces', () => {
    // El jugador SIEMPRE juega piedra
    for (let i = 0; i < 20; i++) recordPlayerMove('piedra');
    let counters = 0;
    const N = 300;
    for (let i = 0; i < N; i++) {
      const cpu = expertChoose(DEFAULT_RULESET);
      if (beats(DEFAULT_RULESET, cpu, 'piedra')) counters++;
    }
    // Con 15% de ruido aleatorio, debería contraatacar ~85%+1/3·15% ≈ 90%.
    // Margen amplio para no hacer el test frágil:
    expect(counters / N).toBeGreaterThan(0.6);
  });

  it('resetBrain borra la memoria', () => {
    recordPlayerMove('piedra');
    resetBrain();
    expect(brainStats().totalMoves).toBe(0);
  });
});
