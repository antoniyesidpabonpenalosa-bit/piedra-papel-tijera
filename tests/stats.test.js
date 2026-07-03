import { describe, it, expect } from 'vitest';
import { getStats, recordRound, recordGameWin, recordTournamentWin, checkAchievements, getAllAchievements, resetStats } from '../src/stats.js';

describe('estadísticas', () => {
  it('empieza en cero', () => {
    const s = getStats();
    expect(s.wins).toBe(0);
    expect(s.streak).toBe(0);
  });

  it('cuenta victorias y racha', () => {
    recordRound('win', 'piedra');
    recordRound('win', 'papel');
    const s = recordRound('win', 'tijera');
    expect(s.wins).toBe(3);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(3);
  });

  it('la derrota corta la racha pero conserva bestStreak', () => {
    recordRound('win', 'piedra');
    recordRound('win', 'piedra');
    const s = recordRound('loss', 'piedra');
    expect(s.streak).toBe(0);
    expect(s.bestStreak).toBe(2);
    expect(s.losses).toBe(1);
  });

  it('el empate no corta la racha', () => {
    recordRound('win', 'piedra');
    const s = recordRound('tie', 'piedra');
    expect(s.streak).toBe(1);
    expect(s.ties).toBe(1);
  });

  it('persiste entre lecturas', () => {
    recordRound('win', 'piedra');
    expect(getStats().wins).toBe(1);
  });

  it('resetStats limpia todo', () => {
    recordRound('win', 'piedra');
    resetStats();
    expect(getStats().wins).toBe(0);
  });
});

describe('logros', () => {
  it('desbloquea "Primera Victoria" al ganar', () => {
    recordRound('win', 'piedra');
    const unlocked = checkAchievements();
    expect(unlocked.map(a => a.id)).toContain('first_win');
  });

  it('no desbloquea dos veces el mismo logro', () => {
    recordRound('win', 'piedra');
    checkAchievements();
    recordRound('win', 'piedra');
    const again = checkAchievements();
    expect(again.map(a => a.id)).not.toContain('first_win');
  });

  it('desbloquea racha de 3', () => {
    recordRound('win', 'a'); recordRound('win', 'b'); recordRound('win', 'c');
    const unlocked = checkAchievements();
    expect(unlocked.map(a => a.id)).toContain('streak_3');
  });

  it('logro de torneo', () => {
    recordTournamentWin();
    const unlocked = checkAchievements();
    expect(unlocked.map(a => a.id)).toContain('tournament_1');
  });

  it('getAllAchievements refleja el estado', () => {
    recordRound('win', 'piedra');
    checkAchievements();
    const all = getAllAchievements();
    expect(all.find(a => a.id === 'first_win').unlocked).toBe(true);
    expect(all.find(a => a.id === 'wins_50').unlocked).toBe(false);
  });
});
