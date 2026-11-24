let ctx = null;
let master = null;
let style = 'modern';

// Timbre por tema: "retro" suena a chiptune (ondas cuadradas), "modern" es más suave.
// Las ondas cuadradas suenan mucho más fuerte, por eso llevan menos volumen.
const VOICES = {
  modern: { lead: 'sine', bass: 'triangle', harsh: 'sawtooth', vol: 1, attack: 0.008 },
  retro: { lead: 'square', bass: 'triangle', harsh: 'square', vol: 0.55, attack: 0 },
};

export function setSoundStyle(next) {
  style = next === 'retro' ? 'retro' : 'modern';
}

export function getSoundStyle() {
  return style;
}

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume?.();
  return ctx;
}

// Una nota. Con endFreq la frecuencia se desliza (para caídas y "sirenas").
function tone(freq, duration, gainVal = 0.3, type = 'sine', startTime = 0, endFreq = null) {
  const c = getCtx();
  const v = VOICES[style];
  const t = c.currentTime + startTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.connect(gain);
  gain.connect(master);
  osc.frequency.setValueAtTime(freq, t);
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  if (v.attack > 0) {
    // Entrada breve para evitar el "clic" al arrancar la onda.
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(gainVal * v.vol, t + v.attack);
  } else {
    gain.gain.setValueAtTime(gainVal * v.vol, t);
  }
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

// Ráfaga de ruido filtrado: es el "golpe" del choque de manos.
function noise(duration, gainVal = 0.25, startTime = 0, cutoff = 1800) {
  const c = getCtx();
  const t = c.currentTime + startTime;
  const length = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, length, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, t);
  filter.frequency.exponentialRampToValueAtTime(200, t + duration);
  const gain = c.createGain();
  gain.gain.setValueAtTime(gainVal * VOICES[style].vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start(t);
  src.stop(t + duration);
}

// Choque al revelar las jugadas: golpe grave que cae de tono + ruido.
function impact(strength = 1) {
  const v = VOICES[style];
  tone(style === 'retro' ? 160 : 130, 0.16, 0.4 * strength, v.lead, 0, 40);
  noise(0.12, 0.22 * strength, 0, style === 'retro' ? 3500 : 1800);
}

export function playClick() {
  try { tone(700, 0.08, 0.2, style === 'retro' ? 'square' : 'triangle'); } catch {}
}

export function playWin() {
  try {
    const v = VOICES[style];
    impact(0.6);
    // Arpegio ascendente do-mi-sol-do con un destello agudo al final.
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.3, v.lead, 0.08 + i * 0.09));
    tone(2093, 0.3, 0.08, v.lead, 0.46);
  } catch {}
}

export function playLose() {
  try {
    const v = VOICES[style];
    impact(1);
    if (style === 'retro') {
      // Escalera descendente al estilo "game over" de las consolas clásicas.
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.16, 0.25, v.harsh, 0.1 + i * 0.12));
    } else {
      tone(380, 0.55, 0.22, v.harsh, 0.08, 140);
      tone(110, 0.5, 0.3, v.bass, 0.1, 55);
    }
  } catch {}
}

export function playTie() {
  try {
    const v = VOICES[style];
    impact(0.3);
    tone(440, 0.25, 0.2, v.bass, 0.06);
    tone(440, 0.25, 0.2, v.bass, 0.38);
  } catch {}
}

export function playVictory() {
  try {
    const v = VOICES[style];
    // Fanfarria "ta-ta-ta TAAA" y acorde final sostenido con bajo.
    [[523, 0, 0.12], [523, 0.12, 0.12], [523, 0.24, 0.12], [659, 0.36, 0.3],
      [523, 0.7, 0.12], [659, 0.82, 0.12]].forEach(([f, at, dur]) => tone(f, dur, 0.35, v.lead, at));
    [784, 1047, 659].forEach((f) => tone(f, 0.9, 0.22, v.lead, 0.94));
    tone(262, 0.9, 0.3, v.bass, 0.94);
  } catch {}
}

export function playCountdown() {
  try { tone(880, 0.1, 0.2, 'square'); } catch {}
}

// Pitido final de la cuenta regresiva ("¡ya!"): dos notas ascendentes.
export function playGo() {
  try {
    tone(990, 0.09, 0.26, 'square');
    tone(1320, 0.2, 0.3, 'square', 0.08);
  } catch {}
}

// Vibración háptica en móvil (ignorada en desktop / sin soporte)
export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
}
