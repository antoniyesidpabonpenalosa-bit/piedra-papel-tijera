import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// AudioContext falso que registra qué osciladores y ruidos se programan.
function makeFakeAudio() {
  const log = { oscillators: [], noises: 0 };
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  });
  class FakeAudioContext {
    constructor() { this.currentTime = 0; this.sampleRate = 8000; this.state = 'running'; this.destination = {}; }
    createGain() { return { gain: param(), connect: vi.fn() }; }
    createOscillator() {
      const osc = { type: 'sine', frequency: param(), connect: vi.fn(), start: vi.fn(), stop: vi.fn() };
      log.oscillators.push(osc);
      return osc;
    }
    createBuffer(_ch, length) { return { getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { log.noises++; return { buffer: null, connect: vi.fn(), start: vi.fn(), stop: vi.fn() }; }
    createBiquadFilter() { return { type: '', frequency: param(), connect: vi.fn() }; }
    resume() {}
  }
  return { FakeAudioContext, log };
}

async function loadSounds() {
  vi.resetModules();
  return import('../src/sounds.js');
}

describe('sonidos', () => {
  let log;
  beforeEach(() => {
    const fake = makeFakeAudio();
    log = fake.log;
    globalThis.window = { AudioContext: fake.FakeAudioContext };
  });
  afterEach(() => { delete globalThis.window; });

  it('todos los efectos programan al menos un oscilador sin lanzar error', async () => {
    const s = await loadSounds();
    for (const fn of ['playClick', 'playWin', 'playLose', 'playTie', 'playVictory', 'playCountdown', 'playGo']) {
      const before = log.oscillators.length;
      expect(() => s[fn]()).not.toThrow();
      expect(log.oscillators.length, fn).toBeGreaterThan(before);
    }
  });

  it('ganar, perder y empatar empiezan con el golpe de ruido del choque', async () => {
    const s = await loadSounds();
    for (const fn of ['playWin', 'playLose', 'playTie']) {
      const before = log.noises;
      s[fn]();
      expect(log.noises, fn).toBe(before + 1);
    }
  });

  it('la victoria final es más larga que una ronda ganada', async () => {
    const s = await loadSounds();
    s.playWin();
    const win = log.oscillators.length;
    log.oscillators.length = 0;
    s.playVictory();
    expect(log.oscillators.length).toBeGreaterThan(win);
  });

  it('el tema retro usa ondas cuadradas y el moderno no', async () => {
    const s = await loadSounds();
    s.setSoundStyle('retro');
    s.playWin();
    expect(log.oscillators.some(o => o.type === 'square')).toBe(true);

    log.oscillators.length = 0;
    s.setSoundStyle('modern');
    s.playWin();
    expect(log.oscillators.some(o => o.type === 'square')).toBe(false);
  });

  it('perder en tema moderno incluye una caída de tono (glissando)', async () => {
    const s = await loadSounds();
    s.setSoundStyle('modern');
    s.playLose();
    const slid = log.oscillators.some(o => o.frequency.exponentialRampToValueAtTime.mock.calls.length > 0);
    expect(slid).toBe(true);
  });

  it('un estilo desconocido vuelve a "modern"', async () => {
    const s = await loadSounds();
    s.setSoundStyle('retro');
    expect(s.getSoundStyle()).toBe('retro');
    s.setSoundStyle('otra-cosa');
    expect(s.getSoundStyle()).toBe('modern');
  });

  it('sin soporte de audio los efectos no rompen el juego', async () => {
    globalThis.window = {};
    const s = await loadSounds();
    for (const fn of ['playClick', 'playWin', 'playLose', 'playTie', 'playVictory', 'playCountdown', 'playGo']) {
      expect(() => s[fn]()).not.toThrow();
    }
  });
});
