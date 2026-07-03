// Misiones diarias: 3 misiones deterministas por día (misma fecha = mismas
// misiones), con progreso guardado en localStorage. Completar misiones suma
// al contador de por vida, que desbloquea avatares.

const KEY = 'ppt-missions';

export const MISSION_POOL = [
  { id: 'win3',    name: 'Gana 3 rondas',                        emoji: '🏆', target: 3,  event: 'round_win' },
  { id: 'win5',    name: 'Gana 5 rondas',                        emoji: '⚔️', target: 5,  event: 'round_win' },
  { id: 'play10',  name: 'Juega 10 rondas',                      emoji: '🎮', target: 10, event: 'round_played' },
  { id: 'play20',  name: 'Juega 20 rondas',                      emoji: '🕹️', target: 20, event: 'round_played' },
  { id: 'streak3', name: 'Logra una racha de 3 victorias',       emoji: '🔥', target: 3,  event: 'streak', mode: 'max' },
  { id: 'streak5', name: 'Logra una racha de 5 victorias',       emoji: '💥', target: 5,  event: 'streak', mode: 'max' },
  { id: 'wingame', name: 'Gana una partida completa',            emoji: '🎉', target: 1,  event: 'game_win' },
  { id: 'wingame2',name: 'Gana 2 partidas completas',            emoji: '👑', target: 2,  event: 'game_win' },
  { id: 'hard3',   name: 'Gana 3 rondas a la IA Difícil/Experta',emoji: '🧠', target: 3,  event: 'hard_win' },
  { id: 'tie2',    name: 'Empata 2 rondas',                      emoji: '🤝', target: 2,  event: 'round_tie' },
];

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// PRNG determinista sembrado con la fecha, para que las 3 misiones del día
// sean las mismas aunque se recargue la app.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

function pickDaily(dateKey) {
  const rnd = mulberry32(hashStr(dateKey));
  const pool = [...MISSION_POOL];
  const picked = [];
  for (let i = 0; i < 3 && pool.length; i++) {
    const idx = Math.floor(rnd() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { date: null, progress: {}, done: [], totalCompleted: 0 };
}

function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

// Devuelve el estado del día actual, reseteando progreso si cambió la fecha.
function ensureToday() {
  const s = load();
  const today = todayKey();
  if (s.date !== today) {
    s.date = today;
    s.progress = {};
    s.done = [];
    save(s);
  }
  return s;
}

// Misiones de hoy con su progreso: [{...def, progress, completed}]
export function getDailyMissions() {
  const s = ensureToday();
  return pickDaily(s.date).map(m => ({
    ...m,
    progress: Math.min(s.progress[m.id] || 0, m.target),
    completed: s.done.includes(m.id),
  }));
}

export function getTotalCompleted() {
  return load().totalCompleted || 0;
}

// Reporta un evento de juego. Devuelve las misiones recién completadas
// (para mostrar toast).
export function missionEvent(event, value = 1) {
  const s = ensureToday();
  const daily = pickDaily(s.date);
  const newlyCompleted = [];
  for (const m of daily) {
    if (m.event !== event || s.done.includes(m.id)) continue;
    const cur = s.progress[m.id] || 0;
    s.progress[m.id] = m.mode === 'max' ? Math.max(cur, value) : cur + value;
    if (s.progress[m.id] >= m.target) {
      s.done.push(m.id);
      s.totalCompleted = (s.totalCompleted || 0) + 1;
      newlyCompleted.push(m);
    }
  }
  save(s);
  return newlyCompleted;
}

export function resetMissions() {
  try { localStorage.removeItem(KEY); } catch {}
}

// ── Avatares desbloqueables ──────────────────────────────────────────────────
// unlock = misiones completadas de por vida necesarias.

export const AVATARS = [
  { emoji: '😀', unlock: 0 },
  { emoji: '😎', unlock: 0 },
  { emoji: '🐱', unlock: 0 },
  { emoji: '🐶', unlock: 0 },
  { emoji: '🐼', unlock: 2 },
  { emoji: '🦊', unlock: 4 },
  { emoji: '🐸', unlock: 6 },
  { emoji: '🤖', unlock: 8 },
  { emoji: '👽', unlock: 10 },
  { emoji: '🦄', unlock: 13 },
  { emoji: '🐉', unlock: 16 },
  { emoji: '👑', unlock: 20 },
];

export function getAvatars() {
  const total = getTotalCompleted();
  return AVATARS.map(a => ({ ...a, unlocked: total >= a.unlock }));
}
