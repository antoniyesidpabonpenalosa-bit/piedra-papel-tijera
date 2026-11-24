import { describe, it, expect } from 'vitest';
import { getDailyMissions, missionEvent, getTotalCompleted, resetMissions, getAvatars, AVATARS, MISSION_POOL } from '../src/missions.js';

describe('misiones diarias', () => {
  it('devuelve 3 misiones del pool', () => {
    const daily = getDailyMissions();
    expect(daily).toHaveLength(3);
    const poolIds = MISSION_POOL.map(m => m.id);
    for (const m of daily) expect(poolIds).toContain(m.id);
  });

  it('las misiones del día son deterministas (misma fecha, mismas misiones)', () => {
    const a = getDailyMissions().map(m => m.id);
    const b = getDailyMissions().map(m => m.id);
    expect(a).toEqual(b);
  });

  it('no repite misiones en el mismo día', () => {
    const idsToday = getDailyMissions().map(m => m.id);
    expect(new Set(idsToday).size).toBe(3);
  });

  it('acumula progreso con eventos', () => {
    const daily = getDailyMissions();
    const target = daily[0];
    missionEvent(target.event, 1);
    const after = getDailyMissions().find(m => m.id === target.id);
    expect(after.progress).toBeGreaterThanOrEqual(target.mode === 'max' ? 0 : 1);
  });

  it('completa una misión al llegar al target y suma al total', () => {
    const daily = getDailyMissions();
    // dispara todos los eventos muchas veces para completar todo lo posible
    let completed = [];
    for (const m of daily) {
      for (let i = 0; i < m.target + 2; i++) {
        completed.push(...missionEvent(m.event, m.mode === 'max' ? m.target : 1));
      }
    }
    expect(completed.length).toBeGreaterThan(0);
    expect(getTotalCompleted()).toBe(completed.length);
    // no se completa dos veces
    for (const m of daily) {
      expect(missionEvent(m.event, m.target)).toHaveLength(0);
    }
  });

  it('resetMissions limpia todo', () => {
    const daily = getDailyMissions();
    missionEvent(daily[0].event, daily[0].target);
    resetMissions();
    expect(getTotalCompleted()).toBe(0);
  });
});

describe('avatares', () => {
  it('los básicos (unlock 0) están desbloqueados desde el inicio', () => {
    const avs = getAvatars();
    for (const a of avs.filter(x => x.unlock === 0)) expect(a.unlocked).toBe(true);
  });

  it('los avanzados están bloqueados sin misiones', () => {
    const avs = getAvatars();
    for (const a of avs.filter(x => x.unlock > 0)) expect(a.unlocked).toBe(false);
  });

  it('AVATARS tiene emojis únicos', () => {
    const emojis = AVATARS.map(a => a.emoji);
    expect(new Set(emojis).size).toBe(emojis.length);
  });
});
