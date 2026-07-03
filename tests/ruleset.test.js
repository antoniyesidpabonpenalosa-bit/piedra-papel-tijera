import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RULESET, RPSLS_RULESET,
  beats, determineWinner, winningChoice, cpuChoose, ids, emptyCounts,
} from '../src/ruleset.js';

describe('beats (reglas clásicas, 3 elementos)', () => {
  it('piedra gana a tijera', () => expect(beats(DEFAULT_RULESET, 'piedra', 'tijera')).toBe(true));
  it('papel gana a piedra', () => expect(beats(DEFAULT_RULESET, 'papel', 'piedra')).toBe(true));
  it('tijera gana a papel', () => expect(beats(DEFAULT_RULESET, 'tijera', 'papel')).toBe(true));
  it('tijera NO gana a piedra', () => expect(beats(DEFAULT_RULESET, 'tijera', 'piedra')).toBe(false));
  it('un elemento no se gana a sí mismo', () => expect(beats(DEFAULT_RULESET, 'piedra', 'piedra')).toBe(false));
  it('ids desconocidos no ganan', () => expect(beats(DEFAULT_RULESET, 'laser', 'piedra')).toBe(false));
});

describe('beats (Lagarto-Spock, 5 elementos)', () => {
  const rs = RPSLS_RULESET;
  it('cada elemento gana exactamente a 2', () => {
    for (const a of ids(rs)) {
      const wins = ids(rs).filter(b => beats(rs, a, b)).length;
      expect(wins).toBe(2);
    }
  });
  it('la relación es antisimétrica', () => {
    for (const a of ids(rs)) for (const b of ids(rs)) {
      if (a !== b) expect(beats(rs, a, b)).toBe(!beats(rs, b, a));
    }
  });
});

describe('determineWinner', () => {
  it('empate con la misma elección', () => expect(determineWinner(DEFAULT_RULESET, 'piedra', 'piedra')).toBe('tie'));
  it('p1 gana', () => expect(determineWinner(DEFAULT_RULESET, 'papel', 'piedra')).toBe('p1'));
  it('p2 gana', () => expect(determineWinner(DEFAULT_RULESET, 'piedra', 'papel')).toBe('p2'));
});

describe('winningChoice (multijugador)', () => {
  it('null si todos eligen lo mismo', () =>
    expect(winningChoice(DEFAULT_RULESET, ['piedra', 'piedra', 'piedra'])).toBe(null));
  it('gana la elección que vence a todas las demás', () =>
    expect(winningChoice(DEFAULT_RULESET, ['papel', 'piedra', 'piedra'])).toBe('papel'));
  it('null en ciclo completo (piedra, papel, tijera)', () =>
    expect(winningChoice(DEFAULT_RULESET, ['piedra', 'papel', 'tijera'])).toBe(null));
});

describe('cpuChoose', () => {
  it('devuelve siempre un elemento válido', () => {
    for (let i = 0; i < 50; i++) {
      const c = cpuChoose(DEFAULT_RULESET, emptyCounts(DEFAULT_RULESET), i);
      expect(ids(DEFAULT_RULESET)).toContain(c);
    }
  });
});
