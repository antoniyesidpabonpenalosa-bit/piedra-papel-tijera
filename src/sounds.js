let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, duration, gainVal = 0.3, type = 'sine', startTime = 0) {
  const c = getCtx();
  const t = c.currentTime + startTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.connect(gain);
  gain.connect(c.destination);
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(gainVal, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

export function playClick() {
  try { tone(700, 0.08, 0.2, 'square'); } catch {}
}

export function playWin() {
  try {
    [523, 659, 784].forEach((f, i) => tone(f, 0.25, 0.3, 'sine', i * 0.12));
  } catch {}
}

export function playLose() {
  try {
    [400, 320, 240].forEach((f, i) => tone(f, 0.25, 0.2, 'sawtooth', i * 0.12));
  } catch {}
}

export function playTie() {
  try {
    tone(440, 0.3, 0.2, 'triangle');
    tone(440, 0.3, 0.2, 'triangle', 0.35);
  } catch {}
}

export function playVictory() {
  try {
    [523, 523, 523, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, 0.35, 'sine', i * 0.1));
  } catch {}
}

export function playCountdown() {
  try { tone(880, 0.1, 0.2, 'square'); } catch {}
}

// Pitido final de la cuenta regresiva ("¡ya!")
export function playGo() {
  try { tone(1320, 0.18, 0.28, 'square'); } catch {}
}

// Vibración háptica en móvil (ignorada en desktop / sin soporte)
export function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {}
}
