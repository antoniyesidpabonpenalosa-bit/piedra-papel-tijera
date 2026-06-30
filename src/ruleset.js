// Motor de reglas generalizado para Piedra-Papel-Tijera personalizable.
//
// Un "ruleset" define una lista ordenada de elementos. La relación de victoria
// es CÍCLICA: cada elemento gana a los siguientes k elementos en el orden
// (en círculo), donde k = floor((n-1)/2). Con n impar (3, 5, 7) el juego queda
// perfectamente balanceado (sin empates salvo elección idéntica). Con n par
// algunas combinaciones quedan en empate.

export const ELEMENT_STYLES = [
  { g: 'linear-gradient(135deg,#667eea,#764ba2)', s: 'rgba(102,126,234,.4)' },
  { g: 'linear-gradient(135deg,#2af598,#009efd)', s: 'rgba(42,245,152,.4)' },
  { g: 'linear-gradient(135deg,#fa709a,#fee140)', s: 'rgba(250,112,154,.4)' },
  { g: 'linear-gradient(135deg,#f093fb,#f5576c)', s: 'rgba(240,147,251,.4)' },
  { g: 'linear-gradient(135deg,#30cfd0,#330867)', s: 'rgba(48,207,208,.4)' },
  { g: 'linear-gradient(135deg,#f6d365,#fda085)', s: 'rgba(246,211,101,.4)' },
  { g: 'linear-gradient(135deg,#a18cd1,#fbc2eb)', s: 'rgba(161,140,209,.4)' },
];

export const DEFAULT_RULESET = {
  name: 'Clásico',
  elements: [
    { id: 'piedra', name: 'Piedra', emoji: '🪨' },
    { id: 'papel', name: 'Papel', emoji: '📄' },
    { id: 'tijera', name: 'Tijera', emoji: '✂️' },
  ],
};

// Plantilla extra de ejemplo (5 elementos), por si el usuario quiere inspirarse.
export const RPSLS_RULESET = {
  name: 'Lagarto-Spock',
  elements: [
    { id: 'piedra', name: 'Piedra', emoji: '🪨' },
    { id: 'spock', name: 'Spock', emoji: '🖖' },
    { id: 'papel', name: 'Papel', emoji: '📄' },
    { id: 'lagarto', name: 'Lagarto', emoji: '🦎' },
    { id: 'tijera', name: 'Tijera', emoji: '✂️' },
  ],
};

const STORAGE_KEY = 'ppt-ruleset';

export function loadRuleset() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_RULESET;
    const rs = JSON.parse(raw);
    if (rs && Array.isArray(rs.elements) && rs.elements.length >= 3) return rs;
  } catch {}
  return DEFAULT_RULESET;
}

export function saveRuleset(rs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rs)); } catch {}
}

export function resetRuleset() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

// ── Helpers de lógica ────────────────────────────────────────────────────────

export const ids = (rs) => rs.elements.map(e => e.id);
export const elemById = (rs, id) => rs.elements.find(e => e.id === id);
export const emojiOf = (rs, id) => elemById(rs, id)?.emoji ?? '❓';
export const nameOf = (rs, id) => elemById(rs, id)?.name ?? id;
export const styleOf = (rs, id) => ELEMENT_STYLES[rs.elements.findIndex(e => e.id === id) % ELEMENT_STYLES.length];

export function emptyCounts(rs) {
  return Object.fromEntries(rs.elements.map(e => [e.id, 0]));
}

// ¿a le gana a b?
export function beats(rs, a, b) {
  if (a === b) return false;
  const list = rs.elements;
  const n = list.length;
  const ia = list.findIndex(e => e.id === a);
  const ib = list.findIndex(e => e.id === b);
  if (ia < 0 || ib < 0) return false;
  const d = ((ia - ib) % n + n) % n;
  const k = Math.floor((n - 1) / 2);
  return d >= 1 && d <= k;
}

// Resultado entre dos elecciones: 'tie' | 'p1' | 'p2'
export function determineWinner(rs, c1, c2) {
  if (c1 === c2) return 'tie';
  if (beats(rs, c1, c2)) return 'p1';
  if (beats(rs, c2, c1)) return 'p2';
  return 'tie';
}

// Dada una lista de elecciones presentes, devuelve la elección ganadora única
// (la que le gana a todas las demás distintas), o null si hay empate.
export function winningChoice(rs, choices) {
  const distinct = [...new Set(choices)];
  if (distinct.length <= 1) return null;
  const winners = distinct.filter(c => distinct.every(d => d === c || beats(rs, c, d)));
  return winners.length === 1 ? winners[0] : null;
}

// IA: predice la jugada más frecuente del jugador y devuelve algo que le gane.
export function cpuChoose(rs, playerHistory, roundsPlayed) {
  const idList = ids(rs);
  const rnd = () => idList[Math.floor(Math.random() * idList.length)];
  if (roundsPlayed < 2) return rnd();
  const h = playerHistory || emptyCounts(rs);
  const total = idList.reduce((s, id) => s + (h[id] || 0), 0);
  if (total === 0 || Math.random() >= 0.7) return rnd();
  // elemento más frecuente
  let prediction = idList[0];
  for (const id of idList) if ((h[id] || 0) > (h[prediction] || 0)) prediction = id;
  // contraataque: algo que le gane a la predicción
  const counters = idList.filter(id => beats(rs, id, prediction));
  if (counters.length === 0) return rnd();
  return counters[Math.floor(Math.random() * counters.length)];
}
