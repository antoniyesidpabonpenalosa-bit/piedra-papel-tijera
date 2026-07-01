const KEY = 'ppt-stats';

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

function blank() {
  return {
    totalGames: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    streak: 0,
    bestStreak: 0,
    tournamentWins: 0,
    roundsPlayed: 0,
    achievements: [],
    choiceCounts: {},
  };
}

export function getStats() {
  return load() || blank();
}

export function resetStats() {
  save(blank());
}

export function recordRound(result, choiceId) {
  const s = getStats();
  s.roundsPlayed++;
  if (choiceId) s.choiceCounts[choiceId] = (s.choiceCounts[choiceId] || 0) + 1;
  if (result === 'win') {
    s.wins++;
    s.streak++;
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
  } else if (result === 'loss') {
    s.losses++;
    s.streak = 0;
  } else {
    s.ties++;
  }
  save(s);
  return s;
}

export function recordGameWin() {
  const s = getStats();
  s.totalGames++;
  save(s);
  return s;
}

export function recordGameLoss() {
  const s = getStats();
  s.totalGames++;
  save(s);
  return s;
}

export function recordTournamentWin() {
  const s = getStats();
  s.tournamentWins++;
  save(s);
  return s;
}

const ACHIEVEMENT_DEFS = [
  { id: 'first_win', name: 'Primera Victoria', emoji: '🌟', desc: 'Gana tu primera ronda', check: s => s.wins >= 1 },
  { id: 'streak_3', name: 'En Racha', emoji: '🔥', desc: 'Gana 3 rondas seguidas', check: s => s.bestStreak >= 3 },
  { id: 'streak_5', name: 'Imparable', emoji: '💥', desc: 'Gana 5 rondas seguidas', check: s => s.bestStreak >= 5 },
  { id: 'streak_10', name: 'Leyenda', emoji: '👑', desc: 'Gana 10 rondas seguidas', check: s => s.bestStreak >= 10 },
  { id: 'rounds_50', name: 'Veterano', emoji: '🎖️', desc: 'Juega 50 rondas', check: s => s.roundsPlayed >= 50 },
  { id: 'rounds_100', name: 'Centurión', emoji: '⚔️', desc: 'Juega 100 rondas', check: s => s.roundsPlayed >= 100 },
  { id: 'wins_10', name: 'Guerrero', emoji: '🛡️', desc: 'Gana 10 rondas', check: s => s.wins >= 10 },
  { id: 'wins_50', name: 'Campeón', emoji: '🏆', desc: 'Gana 50 rondas', check: s => s.wins >= 50 },
  { id: 'tournament_1', name: 'Torneo Ganado', emoji: '🥇', desc: 'Gana un torneo', check: s => s.tournamentWins >= 1 },
  { id: 'tournament_3', name: 'Tricampeón', emoji: '👑', desc: 'Gana 3 torneos', check: s => s.tournamentWins >= 3 },
  { id: 'games_10', name: 'Adicto', emoji: '🎮', desc: 'Juega 10 partidas', check: s => s.totalGames >= 10 },
];

export function checkAchievements() {
  const s = getStats();
  const newlyUnlocked = [];
  for (const a of ACHIEVEMENT_DEFS) {
    if (!s.achievements.includes(a.id) && a.check(s)) {
      s.achievements.push(a.id);
      newlyUnlocked.push(a);
    }
  }
  if (newlyUnlocked.length) save(s);
  return newlyUnlocked;
}

export function getAllAchievements() {
  const s = getStats();
  return ACHIEVEMENT_DEFS.map(a => ({ ...a, unlocked: s.achievements.includes(a.id) }));
}
