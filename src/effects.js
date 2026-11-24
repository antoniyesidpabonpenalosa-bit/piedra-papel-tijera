// Generador de efectos visuales (puro: sin DOM ni React, para poder probarlo).

export const OUTCOMES = ['win', 'lose', 'tie'];

// Color del destello de pantalla según el resultado.
export const FLASH_COLORS = {
  win: 'rgba(0,255,136,.55)',
  lose: 'rgba(255,40,70,.6)',
  tie: 'rgba(255,204,0,.45)',
};

// Cantidad de piezas por resultado: la victoria es la más festiva.
export const BURST_SIZE = { win: 36, lose: 18, tie: 10 };

const WIN_COLORS = ['#ffd700', '#ff006e', '#8338ec', '#3a86ff', '#2af598', '#fa709a'];
const LOSE_COLORS = ['#ff4444', '#8b1a1a', '#666', '#ff7a00'];
const TIE_COLORS = ['#ffcc00', '#fff3b0'];
const WIN_EMOJIS = ['⭐', '✨', '🎉'];
const LOSE_EMOJIS = ['💥', '💨'];

// Acepta el formato anterior (true = ganar, false = perder) y los nombres nuevos.
export function normalizeOutcome(kind) {
  if (kind === true) return 'win';
  if (kind === false) return 'lose';
  return OUTCOMES.includes(kind) ? kind : 'win';
}

export function prefersReducedMotion() {
  try {
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
  } catch {
    return false;
  }
}

const between = (rng, min, max) => min + rng() * (max - min);
const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

// Cada pieza se anima con tres variables CSS: --dx (desplazamiento lateral),
// --up (impulso inicial, negativo = hacia arriba) y --fall (posición final).
function makePiece(outcome, i, rng, idBase) {
  const base = { id: idBase + i, delay: between(rng, 0, 0.12), rot: between(rng, -540, 540) };

  if (outcome === 'win') {
    // Explota desde el centro hacia arriba y abre en abanico; después cae.
    const angle = between(rng, -165, -15) * (Math.PI / 180);
    const speed = between(rng, 120, 300);
    const useEmoji = i % 4 === 0;
    return {
      ...base, dx: Math.round(Math.cos(angle) * speed), up: Math.round(Math.sin(angle) * speed),
      fall: Math.round(between(rng, 160, 420)), duration: between(rng, 1.3, 1.9),
      shape: useEmoji ? 'emoji' : 'rect', emoji: useEmoji ? pick(rng, WIN_EMOJIS) : null,
      color: pick(rng, WIN_COLORS), size: useEmoji ? 22 : Math.round(between(rng, 7, 12)),
    };
  }

  if (outcome === 'lose') {
    // Escombros que se desploman casi en vertical, sin elevarse.
    const useEmoji = i % 3 === 0;
    return {
      ...base, dx: Math.round(between(rng, -140, 140)), up: Math.round(between(rng, -40, -10)),
      fall: Math.round(between(rng, 320, 560)), duration: between(rng, 1, 1.5),
      shape: useEmoji ? 'emoji' : 'rect', emoji: useEmoji ? pick(rng, LOSE_EMOJIS) : null,
      color: pick(rng, LOSE_COLORS), size: useEmoji ? 22 : Math.round(between(rng, 6, 11)),
    };
  }

  // Empate: destellos suaves que suben y se desvanecen.
  return {
    ...base, dx: Math.round(between(rng, -90, 90)), up: Math.round(between(rng, -160, -70)),
    fall: Math.round(between(rng, -200, -90)), duration: between(rng, 1, 1.4),
    shape: 'emoji', emoji: '✨', color: pick(rng, TIE_COLORS), size: 20,
  };
}

// Devuelve las piezas del confeti y el destello de pantalla para un resultado.
// Con "movimiento reducido" no hay piezas ni destello (los parpadeos incomodan).
export function makeBurst(kind, { rng = Math.random, reduced = false, idBase = Date.now() } = {}) {
  const outcome = normalizeOutcome(kind);
  if (reduced) return { outcome, pieces: [], flash: null };
  return {
    outcome,
    pieces: Array.from({ length: BURST_SIZE[outcome] }, (_, i) => makePiece(outcome, i, rng, idBase)),
    flash: { id: idBase, color: FLASH_COLORS[outcome] },
  };
}

export const EMPTY_BURST = { outcome: null, pieces: [], flash: null };
