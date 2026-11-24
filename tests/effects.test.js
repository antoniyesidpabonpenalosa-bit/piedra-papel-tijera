import { describe, it, expect } from 'vitest';
import {
  makeBurst, normalizeOutcome, prefersReducedMotion, BURST_SIZE, FLASH_COLORS,
} from '../src/effects.js';

// Generador pseudoaleatorio determinista para que las pruebas no sean frágiles.
function seeded(seed = 1) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

describe('normalizeOutcome', () => {
  it('traduce el formato anterior (true/false) y acepta los nombres nuevos', () => {
    expect(normalizeOutcome(true)).toBe('win');
    expect(normalizeOutcome(false)).toBe('lose');
    expect(normalizeOutcome('tie')).toBe('tie');
  });

  it('un valor desconocido cae en "win" en vez de romper', () => {
    expect(normalizeOutcome('???')).toBe('win');
    expect(normalizeOutcome(undefined)).toBe('win');
  });
});

describe('makeBurst', () => {
  it('genera la cantidad de piezas y el destello propios de cada resultado', () => {
    for (const outcome of ['win', 'lose', 'tie']) {
      const b = makeBurst(outcome, { rng: seeded(), idBase: 1000 });
      expect(b.outcome).toBe(outcome);
      expect(b.pieces).toHaveLength(BURST_SIZE[outcome]);
      expect(b.flash).toEqual({ id: 1000, color: FLASH_COLORS[outcome] });
    }
  });

  it('ganar es más festivo que perder, y perder más que empatar', () => {
    expect(BURST_SIZE.win).toBeGreaterThan(BURST_SIZE.lose);
    expect(BURST_SIZE.lose).toBeGreaterThan(BURST_SIZE.tie);
  });

  it('las piezas tienen ids únicos (sirven de key en React)', () => {
    const { pieces } = makeBurst('win', { rng: seeded(7), idBase: 50 });
    expect(new Set(pieces.map(p => p.id)).size).toBe(pieces.length);
  });

  it('al ganar el confeti sale hacia arriba y después cae', () => {
    const { pieces } = makeBurst('win', { rng: seeded(3) });
    for (const p of pieces) {
      expect(p.up).toBeLessThan(0);
      expect(p.fall).toBeGreaterThan(0);
    }
  });

  it('al perder las piezas se desploman sin elevarse mucho', () => {
    const { pieces } = makeBurst('lose', { rng: seeded(5) });
    for (const p of pieces) {
      expect(p.fall).toBeGreaterThan(250);
      expect(p.up).toBeGreaterThan(-50);
    }
  });

  it('al empatar los destellos suben y se desvanecen', () => {
    const { pieces } = makeBurst('tie', { rng: seeded(9) });
    for (const p of pieces) {
      expect(p.shape).toBe('emoji');
      expect(p.fall).toBeLessThan(0);
    }
  });

  it('cada pieza trae todo lo que necesita el CSS', () => {
    for (const outcome of ['win', 'lose', 'tie']) {
      for (const p of makeBurst(outcome, { rng: seeded(11) }).pieces) {
        for (const key of ['dx', 'up', 'fall', 'rot', 'delay', 'duration', 'size']) {
          expect(Number.isFinite(p[key])).toBe(true);
        }
        expect(p.duration).toBeGreaterThan(0);
        expect(['rect', 'emoji']).toContain(p.shape);
        if (p.shape === 'emoji') expect(typeof p.emoji).toBe('string');
      }
    }
  });

  it('con movimiento reducido no hay piezas ni destello', () => {
    for (const outcome of ['win', 'lose', 'tie']) {
      const b = makeBurst(outcome, { reduced: true });
      expect(b.pieces).toEqual([]);
      expect(b.flash).toBe(null);
    }
  });

  it('acepta true/false como antes', () => {
    expect(makeBurst(true, { rng: seeded() }).outcome).toBe('win');
    expect(makeBurst(false, { rng: seeded() }).outcome).toBe('lose');
  });
});

describe('prefersReducedMotion', () => {
  it('fuera del navegador (sin window) devuelve false', () => {
    expect(prefersReducedMotion()).toBe(false);
  });

  it('lee la preferencia del sistema cuando existe matchMedia', () => {
    globalThis.window = { matchMedia: (q) => ({ matches: q.includes('reduce') }) };
    try {
      expect(prefersReducedMotion()).toBe(true);
      globalThis.window = { matchMedia: () => ({ matches: false }) };
      expect(prefersReducedMotion()).toBe(false);
    } finally {
      delete globalThis.window;
    }
  });
});
