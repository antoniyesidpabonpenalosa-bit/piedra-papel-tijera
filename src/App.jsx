import React, { useState, useCallback, useEffect, useRef } from 'react';
import { RotateCcw, Trophy, Zap, Target, Users, Cpu, Volume2, VolumeX, Settings, Plus, Trash2, ChevronUp, ChevronDown, Gamepad2, Sparkles, Timer, BarChart3, Award, X, Clock } from 'lucide-react';
import { playClick, playWin, playLose, playTie, playVictory, playCountdown, playGo, vibrate } from './sounds.js';
import {
  DEFAULT_RULESET, RPSLS_RULESET, ELEMENT_STYLES,
  loadRuleset, saveRuleset,
  ids, emojiOf, nameOf, styleOf, emptyCounts,
  determineWinner, winningChoice, cpuChoose,
} from './ruleset.js';
import { getStats, recordRound, recordGameWin, recordGameLoss, recordTournamentWin, checkAchievements, getAllAchievements, resetStats } from './stats.js';
import { expertChoose, recordPlayerMove, resetBrain, brainStats } from './brain.js';

// ── Constants ────────────────────────────────────────────────────────────────

const PLAYER_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];
const PLAYER_SOLIDS = ['#667eea', '#f093fb', '#2af598', '#fa709a'];

const DIFFICULTY_LABELS = { easy: 'Fácil', normal: 'Normal', hard: 'Difícil', expert: 'Experta 🧠' };
const DIFFICULTY_COLORS = { easy: '#2af598', normal: '#ffd700', hard: '#f5576c', expert: '#c084fc' };

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a1a; }
  input:focus, button:focus { outline: none; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes fall { to{transform:translateY(110vh) rotate(360deg);opacity:0} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,.5)} 50%{box-shadow:0 0 40px rgba(255,215,0,.9)} }
  @keyframes slideIn { from{transform:scale(0) rotate(-180deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
  @keyframes fadeIn { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes bounceIn { 0%{transform:scale(0)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @keyframes countPop { 0%{transform:scale(2.4);opacity:0} 35%{transform:scale(1);opacity:1} 100%{transform:scale(.6);opacity:0} }
  @keyframes scanline { 0%{background-position:0 0} 100%{background-position:0 100%} }
  @keyframes borderGlow { 0%,100%{border-color:rgba(102,126,234,.6)} 50%{border-color:rgba(240,147,251,.6)} }
  @keyframes neonFlicker { 0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.6} 94%{opacity:1} 96%{opacity:.7} 97%{opacity:1} }
  @keyframes slideUp { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes barFill { from{width:0} }
  @keyframes achievePop { 0%{transform:scale(0) rotate(-10deg);opacity:0} 60%{transform:scale(1.15) rotate(3deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
  @keyframes timerPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }

  /* ── Tema RETRO 8-bit ── */
  .retro * { font-family: 'Press Start 2P', 'Courier New', monospace !important; letter-spacing: 0 !important; }
  .retro div { border-radius: 0 !important; }
  .retro h1 { background: none !important; -webkit-text-fill-color: #ffe66d !important; color: #ffe66d !important;
    font-size: 16px !important; line-height: 1.7 !important; text-shadow: 3px 3px 0 #000 !important; animation: none !important; }
  .retro h2 { background: none !important; -webkit-text-fill-color: #fff !important; color: #fff !important;
    font-size: 14px !important; line-height: 1.6 !important; text-shadow: 2px 2px 0 #000 !important; }
  .retro button { border-radius: 0 !important; border: 3px solid #000 !important;
    box-shadow: 4px 4px 0 rgba(0,0,0,.85) !important; font-size: 11px !important; transform: none !important; }
  .retro input { border-radius: 0 !important; border: 3px solid #000 !important; font-size: 12px !important; }
  .retro p, .retro span, .retro label { text-shadow: 1px 1px 0 #000; }
`;

const BG_STYLE = {
  minHeight: '100vh',
  background: 'linear-gradient(180deg, #0a0a1a 0%, #1a1a3e 40%, #0d0d2b 100%)',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  position: 'relative',
};

const CARD_STYLE = {
  background: 'rgba(15,15,35,.95)',
  borderRadius: 20,
  border: '2px solid rgba(102,126,234,.3)',
  boxShadow: '0 0 30px rgba(102,126,234,.15), 0 20px 60px rgba(0,0,0,.6)',
  animation: 'borderGlow 4s ease-in-out infinite',
};

// ── Particles ────────────────────────────────────────────────────────────────

function Particles({ particles }) {
  return particles.map(p => (
    <div key={p.id} style={{
      position: 'fixed', left: `${p.left}%`, top: -30,
      fontSize: 28, zIndex: 2000, pointerEvents: 'none',
      animation: `fall 2s ease-in forwards`,
      animationDelay: `${p.delay}s`,
    }}>{p.emoji}</div>
  ));
}

function useParticles() {
  const [particles, setParticles] = useState([]);
  const burst = useCallback((isWin) => {
    const emojis = isWin ? ['✨','🎉','⭐','💫','🏆'] : ['💥','💨','😢','💔'];
    const p = Array.from({ length: 22 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      emoji: emojis[i % emojis.length],
    }));
    setParticles(p);
    setTimeout(() => setParticles([]), 2500);
  }, []);
  return [particles, burst];
}

// ── Achievement Toast ────────────────────────────────────────────────────────

function AchievementToast({ achievement, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);
  if (!achievement) return null;
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 3000,
      background: 'linear-gradient(135deg, #ffd700, #ff8c00)', borderRadius: 16,
      padding: '14px 28px', color: '#000', fontWeight: 800, fontSize: 15,
      boxShadow: '0 8px 30px rgba(255,215,0,.5)', animation: 'achievePop .5s ease-out',
      display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 28 }}>{achievement.emoji}</span>
      <div>
        <div style={{ fontSize: 11, opacity: .7 }}>LOGRO DESBLOQUEADO</div>
        <div>{achievement.name}</div>
      </div>
    </div>
  );
}

function useAchievementToast() {
  const [queue, setQueue] = useState([]);
  const show = useCallback((newAchievements) => {
    if (newAchievements.length) setQueue(q => [...q, ...newAchievements]);
  }, []);
  const dismiss = useCallback(() => setQueue(q => q.slice(1)), []);
  return [queue[0] || null, show, dismiss];
}

// ── Countdown 3·2·1 ───────────────────────────────────────────────────────────

function useCountdown() {
  const [count, setCount] = useState(0);
  const run = useCallback((onDone, soundOn) => {
    let n = 3;
    setCount(3);
    if (soundOn) playCountdown();
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCount(0);
        if (soundOn) playGo();
        onDone();
      } else {
        setCount(n);
        if (soundOn) playCountdown();
      }
    }, 700);
  }, []);
  return [count, run];
}

function CountdownOverlay({ count }) {
  if (!count) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 1500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div key={count} style={{
        fontSize: 160, fontWeight: 900, color: '#ffd700',
        textShadow: '0 0 60px #ffd700, 0 0 120px rgba(255,215,0,.4), 4px 4px 0 #000',
        animation: 'countPop .7s ease-out',
      }}>{count}</div>
    </div>
  );
}

// ── Turn Timer ──────────────────────────────────────────────────────────────

function useTurnTimer(enabled, seconds, onExpire) {
  const [timeLeft, setTimeLeft] = useState(seconds);
  const intervalRef = useRef(null);
  const expireCb = useRef(onExpire);
  expireCb.current = onExpire;

  const start = useCallback(() => {
    if (!enabled) return;
    setTimeLeft(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          expireCb.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, [enabled, seconds]);

  const stop = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { timeLeft, start, stop };
}

function TimerBar({ timeLeft, maxTime, enabled }) {
  if (!enabled) return null;
  const pct = (timeLeft / maxTime) * 100;
  const color = pct > 50 ? '#2af598' : pct > 25 ? '#ffd700' : '#f5576c';
  return (
    <div style={{
      width: '100%', height: 8, background: 'rgba(255,255,255,.08)', borderRadius: 4,
      marginBottom: 16, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color, borderRadius: 4,
        transition: 'width 1s linear, background .3s',
        boxShadow: `0 0 10px ${color}`,
        animation: pct <= 25 ? 'timerPulse .5s infinite' : 'none',
      }} />
    </div>
  );
}

// ── Generic Button ───────────────────────────────────────────────────────────

function GradBtn({ onClick, gradient = 'linear-gradient(135deg,#667eea,#764ba2)', shadow = 'rgba(102,126,234,.4)', children, disabled, style = {} }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: disabled ? 'rgba(100,100,100,.3)' : gradient,
        border: 'none', borderRadius: 14, padding: '18px 24px',
        color: 'white', fontSize: 16, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        boxShadow: hov && !disabled
          ? `0 14px 38px ${shadow}, 0 0 20px ${shadow}`
          : `0 8px 25px ${shadow}`,
        transform: hov && !disabled ? 'translateY(-3px) scale(1.02)' : 'scale(1)',
        transition: 'all .25s', opacity: disabled ? .5 : 1,
        width: '100%',
        textShadow: '0 2px 4px rgba(0,0,0,.3)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Stats Screen ─────────────────────────────────────────────────────────────

function StatsScreen({ onBack }) {
  const stats = getStats();
  const achievements = getAllAchievements();
  const [brainMoves, setBrainMoves] = useState(() => brainStats().totalMoves);
  const winRate = stats.roundsPlayed > 0 ? Math.round((stats.wins / stats.roundsPlayed) * 100) : 0;

  const statCards = [
    { label: 'Victorias', value: stats.wins, emoji: '🏆', color: '#2af598' },
    { label: 'Derrotas', value: stats.losses, emoji: '💀', color: '#f5576c' },
    { label: 'Empates', value: stats.ties, emoji: '🤝', color: '#ffd700' },
    { label: 'Mejor Racha', value: stats.bestStreak, emoji: '🔥', color: '#ff8c00' },
    { label: 'Rondas', value: stats.roundsPlayed, emoji: '🎯', color: '#667eea' },
    { label: 'Torneos', value: stats.tournamentWins, emoji: '🥇', color: '#f093fb' },
  ];

  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 520, width: '100%', ...CARD_STYLE, padding: '36px 28px' }}>
        <h2 style={{
          textAlign: 'center', fontSize: 24, fontWeight: 900, marginBottom: 6,
          background: 'linear-gradient(45deg, #ffd700, #ff8c00)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>📊 ESTADÍSTICAS</h2>

        {/* Win rate bar */}
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <div style={{ color: '#888', fontSize: 12, marginBottom: 8, letterSpacing: 2 }}>TASA DE VICTORIA</div>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#2af598', textShadow: '0 0 20px rgba(42,245,152,.4)' }}>{winRate}%</div>
          <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,.08)', borderRadius: 5, marginTop: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${winRate}%`, background: 'linear-gradient(90deg, #2af598, #009efd)', borderRadius: 5, animation: 'barFill .8s ease-out', boxShadow: '0 0 10px rgba(42,245,152,.5)' }} />
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 }}>
          {statCards.map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '14px 8px', textAlign: 'center',
              border: `1px solid ${s.color}33`,
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{s.emoji}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: s.color, textShadow: `0 0 10px ${s.color}44` }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#777', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Achievements */}
        <div style={{ color: '#888', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>🏅 LOGROS ({achievements.filter(a=>a.unlocked).length}/{achievements.length})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 20 }}>
          {achievements.map(a => (
            <div key={a.id} style={{
              background: a.unlocked ? 'rgba(255,215,0,.08)' : 'rgba(255,255,255,.02)',
              borderRadius: 10, padding: '10px 12px',
              border: a.unlocked ? '1px solid rgba(255,215,0,.3)' : '1px solid rgba(255,255,255,.06)',
              opacity: a.unlocked ? 1 : .4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.emoji}</span>
                <div>
                  <div style={{ color: a.unlocked ? '#ffd700' : '#555', fontSize: 11, fontWeight: 700 }}>{a.name}</div>
                  <div style={{ color: '#666', fontSize: 10 }}>{a.desc}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Memoria de la IA experta */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: 'rgba(192,132,252,.06)', border: '1px solid rgba(192,132,252,.25)',
          borderRadius: 12, padding: '12px 14px', marginBottom: 16,
        }}>
          <div>
            <div style={{ color: '#c084fc', fontSize: 12, fontWeight: 700 }}>🧠 Memoria IA Experta</div>
            <div style={{ color: '#777', fontSize: 11, marginTop: 2 }}>
              Ha aprendido de <strong style={{ color: '#c084fc' }}>{brainMoves}</strong> jugadas tuyas
            </div>
          </div>
          <button onClick={() => { playClick(); if (confirm('¿Borrar la memoria de la IA? Olvidará todos tus patrones.')) { resetBrain(); setBrainMoves(0); } }} style={{
            background: 'rgba(192,132,252,.12)', border: '1px solid rgba(192,132,252,.3)',
            borderRadius: 8, padding: '7px 12px', color: '#c084fc', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Borrar memoria</button>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => { playClick(); if (confirm('¿Borrar todas las estadísticas?')) { resetStats(); onBack(); } }} style={{
            flex: 1, padding: 12, background: 'rgba(245,87,108,.15)', border: '1px solid rgba(245,87,108,.3)',
            borderRadius: 12, color: '#f5576c', fontSize: 13, cursor: 'pointer', fontWeight: 600,
          }}>Resetear</button>
          <button onClick={() => { playClick(); onBack(); }} style={{
            flex: 2, padding: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)',
            border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>← Volver</button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: Menu ─────────────────────────────────────────────────────────────

function MenuScreen({ onSelect, onEditRules, onStats, ruleset, soundEnabled, toggleSound, theme, toggleTheme, timerEnabled, toggleTimer, difficulty, cycleDifficulty }) {
  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      {/* Decorative background shapes */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(102,126,234,.08), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -100, left: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(240,147,251,.08), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 560, width: '100%', ...CARD_STYLE, padding: '40px 36px' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={onStats} title="Estadísticas" style={{
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 10, padding: '8px 12px', color: '#ffd700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
          }}>
            <BarChart3 size={16} /> Stats
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={toggleTimer} title="Contrarreloj" style={{
              background: timerEnabled ? 'rgba(42,245,152,.15)' : 'rgba(255,255,255,.06)',
              border: `1px solid ${timerEnabled ? 'rgba(42,245,152,.4)' : 'rgba(255,255,255,.12)'}`,
              borderRadius: 10, padding: '8px 12px', color: timerEnabled ? '#2af598' : '#888', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            }}>
              <Timer size={15} /> {timerEnabled ? 'ON' : 'OFF'}
            </button>
            <button onClick={toggleTheme} title="Cambiar estilo" style={{
              background: theme === 'retro' ? 'linear-gradient(135deg,#2af598,#009efd)' : 'rgba(255,255,255,.06)',
              border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '8px 12px',
              color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700,
            }}>
              {theme === 'retro' ? <Gamepad2 size={15} /> : <Sparkles size={15} />}
              {theme === 'retro' ? '8-BIT' : 'NEÓN'}
            </button>
            <button onClick={toggleSound} title="Sonido" style={{
              background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
              borderRadius: 10, padding: '8px 12px', color: 'white', cursor: 'pointer', lineHeight: 0,
            }}>
              {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        </div>

        <h1 style={{
          textAlign: 'center',
          background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff, #ff006e)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: 34, fontWeight: 900, marginBottom: 6,
          animation: 'float 3s ease-in-out infinite, neonFlicker 4s infinite',
          letterSpacing: -1,
        }}>
          ⚔️ PIEDRA PAPEL TIJERA
        </h1>
        <p style={{ textAlign: 'center', color: '#666', fontSize: 14, marginBottom: 24, letterSpacing: 1 }}>
          ELIGE TU MODO DE COMBATE
        </p>

        {/* Ruleset + Difficulty */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
            background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 14px',
            border: '1px solid rgba(255,255,255,.08)',
          }}>
            <div style={{ color: '#ccc', fontSize: 12 }}>
              <span style={{ color: '#555' }}>Reglas: </span>
              <strong style={{ color: '#ffd700' }}>{ruleset.name || 'Custom'}</strong>
              <span style={{ color: '#444', marginLeft: 4 }}>{ruleset.elements.map(e => e.emoji).join('')}</span>
            </div>
            <button onClick={() => { playClick(); onEditRules(); }} style={{
              background: 'linear-gradient(135deg,#30cfd0,#330867)', border: 'none',
              borderRadius: 8, padding: '6px 12px', color: 'white', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Settings size={13} /> Editar
            </button>
          </div>
          <button onClick={cycleDifficulty} title="Dificultad IA" style={{
            background: 'rgba(255,255,255,.04)', border: `1px solid ${DIFFICULTY_COLORS[difficulty]}44`,
            borderRadius: 12, padding: '10px 14px', color: DIFFICULTY_COLORS[difficulty],
            fontSize: 11, fontWeight: 800, cursor: 'pointer', minWidth: 80, textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 9, color: '#555' }}>IA</span>
            {DIFFICULTY_LABELS[difficulty]}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GradBtn onClick={() => { playClick(); onSelect('cpu', 1); }}
            gradient="linear-gradient(135deg,#667eea,#764ba2)" shadow="rgba(102,126,234,.4)">
            <Cpu size={26} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 17 }}>VS CPU</div>
              <div style={{ fontSize: 12, opacity: .7, fontWeight: 400 }}>Computadora inteligente · {DIFFICULTY_LABELS[difficulty]}</div>
            </div>
          </GradBtn>

          <div style={{ color: '#333', textAlign: 'center', fontSize: 11, letterSpacing: 3, margin: '4px 0' }}>
            ── MULTIJUGADOR LOCAL ──
          </div>

          {[2, 3, 4].map(n => (
            <GradBtn key={n} onClick={() => { playClick(); onSelect('multi', n); }}
              gradient="linear-gradient(135deg,#f093fb,#f5576c)" shadow="rgba(240,147,251,.4)">
              <Users size={22} />
              <div style={{ textAlign: 'left' }}>
                <div>{n} Jugadores</div>
                <div style={{ fontSize: 12, opacity: .7, fontWeight: 400 }}>Mismo dispositivo · Turnos</div>
              </div>
            </GradBtn>
          ))}

          <div style={{ color: '#333', textAlign: 'center', fontSize: 11, letterSpacing: 3, margin: '4px 0' }}>
            ── TORNEO ──
          </div>

          <GradBtn onClick={() => { playClick(); onSelect('tournament', 4); }}
            gradient="linear-gradient(135deg,#ffd700,#ff8c00)" shadow="rgba(255,215,0,.3)">
            <Trophy size={26} />
            <div style={{ textAlign: 'left' }}>
              <div>TORNEO — 4 jugadores</div>
              <div style={{ fontSize: 12, opacity: .7, fontWeight: 400 }}>Bracket eliminatorio · Semis + Final</div>
            </div>
          </GradBtn>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: Rules Editor ─────────────────────────────────────────────────────

function RulesEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial.name || 'Personalizado');
  const [elements, setElements] = useState(() => initial.elements.map(e => ({ ...e })));

  const setElem = (i, field, value) =>
    setElements(prev => prev.map((e, j) => j === i ? { ...e, [field]: value } : e));

  const addElem = () => {
    if (elements.length >= 7) return;
    playClick();
    const id = `el${Date.now()}`;
    setElements(prev => [...prev, { id, name: `Elemento ${prev.length + 1}`, emoji: '⭐' }]);
  };

  const removeElem = (i) => {
    if (elements.length <= 3) return;
    playClick();
    setElements(prev => prev.filter((_, j) => j !== i));
  };

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= elements.length) return;
    playClick();
    setElements(prev => {
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const loadTemplate = (tpl) => {
    playClick();
    setName(tpl.name);
    setElements(tpl.elements.map(e => ({ ...e })));
  };

  function handleSave() {
    playClick();
    const seen = new Set();
    const cleaned = elements.map((e, i) => {
      let id = e.id || `el${i}`;
      while (seen.has(id)) id = id + '_' + i;
      seen.add(id);
      return { id, name: (e.name || '').trim() || `Elemento ${i + 1}`, emoji: (e.emoji || '').trim() || '⭐' };
    });
    onSave({ name: name.trim() || 'Personalizado', elements: cleaned });
  }

  const n = elements.length;
  const k = Math.floor((n - 1) / 2);
  const balanced = n % 2 === 1;

  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 540, width: '100%', ...CARD_STYLE, padding: '36px 28px' }}>
        <h2 style={{
          textAlign: 'center', fontSize: 24, fontWeight: 900, marginBottom: 6,
          background: 'linear-gradient(45deg, #30cfd0, #330867)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>⚙️ Editor de Reglas</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: 12, marginBottom: 20 }}>
          Cada elemento gana a los <strong style={{ color: '#ffd700' }}>{k}</strong> siguiente(s) en el orden circular.
        </p>

        <label style={{ color: '#888', fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>NOMBRE DEL SET</label>
        <input value={name} maxLength={20} onChange={e => setName(e.target.value)} style={{
          width: '100%', padding: '10px 14px', marginBottom: 18,
          background: 'rgba(255,255,255,.05)', border: '2px solid rgba(255,215,0,.25)',
          borderRadius: 10, color: 'white', fontSize: 15,
        }} />

        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button onClick={() => loadTemplate(DEFAULT_RULESET)} style={tplBtnStyle}>🪨 Clásico (3)</button>
          <button onClick={() => loadTemplate(RPSLS_RULESET)} style={tplBtnStyle}>🖖 Lagarto-Spock (5)</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {elements.map((e, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 12px',
              border: `1px solid ${ELEMENT_STYLES[i % ELEMENT_STYLES.length].s.replace('.4', '.3')}`,
              animation: 'slideUp .3s ease-out',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => move(i, -1)} disabled={i === 0} style={arrowStyle(i === 0)}><ChevronUp size={14} /></button>
                <button onClick={() => move(i, 1)} disabled={i === n - 1} style={arrowStyle(i === n - 1)}><ChevronDown size={14} /></button>
              </div>
              <input value={e.emoji} maxLength={4} onChange={ev => setElem(i, 'emoji', ev.target.value)} style={{
                width: 48, textAlign: 'center', padding: '8px 4px',
                background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 8, color: 'white', fontSize: 22,
              }} />
              <input value={e.name} maxLength={14} onChange={ev => setElem(i, 'name', ev.target.value)} style={{
                flex: 1, padding: '8px 10px',
                background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 8, color: 'white', fontSize: 14,
              }} />
              <button onClick={() => removeElem(i)} disabled={n <= 3} style={{
                background: n <= 3 ? 'rgba(100,100,100,.15)' : 'rgba(245,87,108,.15)',
                border: 'none', borderRadius: 8, padding: 8,
                color: n <= 3 ? '#444' : '#f5576c', cursor: n <= 3 ? 'not-allowed' : 'pointer', lineHeight: 0,
              }}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>

        <button onClick={addElem} disabled={n >= 7} style={{
          width: '100%', padding: 11, marginBottom: 14,
          background: n >= 7 ? 'rgba(100,100,100,.15)' : 'rgba(42,245,152,.08)',
          border: `1px dashed ${n >= 7 ? '#444' : 'rgba(42,245,152,.4)'}`,
          borderRadius: 10, color: n >= 7 ? '#444' : '#2af598',
          fontSize: 13, fontWeight: 700, cursor: n >= 7 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Plus size={16} /> Añadir ({n}/7)
        </button>

        <div style={{
          background: 'rgba(0,0,0,.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 8,
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          <div style={{ color: '#666', fontSize: 10, letterSpacing: 1, marginBottom: 8 }}>QUIÉN GANA A QUIÉN</div>
          {elements.map((e, i) => {
            const targets = [];
            for (let d = 1; d <= k; d++) targets.push(elements[(i + d) % n]);
            return (
              <div key={i} style={{ color: '#bbb', fontSize: 12, marginBottom: 2 }}>
                {e.emoji} <strong>{e.name}</strong>
                <span style={{ color: '#555' }}> → </span>
                {targets.map(t => `${t.emoji} ${t.name}`).join(', ')}
              </div>
            );
          })}
        </div>
        {!balanced && (
          <div style={{ color: '#ffcc00', fontSize: 11, marginBottom: 8 }}>
            ⚠️ Número par = más empates. Usa 3, 5 o 7 para balance perfecto.
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => { playClick(); onCancel(); }} style={{
            flex: 1, padding: 12, background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#888',
            fontSize: 14, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)',
            border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}>Guardar ✓</button>
        </div>
      </div>
    </div>
  );
}

const tplBtnStyle = {
  flex: 1, padding: '9px 8px', background: 'rgba(255,255,255,.04)',
  border: '1px solid rgba(255,255,255,.1)', borderRadius: 10,
  color: '#ccc', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const arrowStyle = (disabled) => ({
  background: 'transparent', border: 'none', padding: 1,
  color: disabled ? '#333' : '#888', cursor: disabled ? 'not-allowed' : 'pointer', lineHeight: 0,
});

// ── SCREEN: Setup ───────────────────────────────────────────────────────────

function SetupScreen({ mode, numPlayers, onStart, onBack }) {
  const count = mode === 'cpu' ? 1 : numPlayers;
  const [names, setNames] = useState(
    Array.from({ length: count }, (_, i) => `Jugador ${i + 1}`)
  );
  const setName = (i, v) => setNames(prev => prev.map((n, j) => j === i ? v : n));

  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ maxWidth: 460, width: '100%', ...CARD_STYLE, padding: '36px 32px' }}>
        <h2 style={{
          textAlign: 'center', fontSize: 24, fontWeight: 900, marginBottom: 24,
          background: 'linear-gradient(45deg, #667eea, #f093fb)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>✏️ Nombres</h2>
        {names.map((name, i) => (
          <div key={i} style={{ marginBottom: 14, animation: `slideUp .3s ease-out ${i * .1}s both` }}>
            <label style={{ color: PLAYER_SOLIDS[i % 4], fontSize: 11, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              {mode === 'cpu' && i === 0 ? 'TU NOMBRE' : `JUGADOR ${i + 1}`}
            </label>
            <input value={name} maxLength={16} onChange={e => setName(i, e.target.value)} style={{
              width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.05)',
              border: `2px solid ${PLAYER_SOLIDS[i % 4]}44`, borderRadius: 10, color: 'white', fontSize: 16,
            }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button onClick={() => { playClick(); onBack(); }} style={{
            flex: 1, padding: 12, background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, color: '#888', fontSize: 14, cursor: 'pointer',
          }}>← Atrás</button>
          <button onClick={() => { playClick(); onStart(names.map((n, i) => n.trim() || `Jugador ${i + 1}`)); }} style={{
            flex: 2, padding: 12, background: 'linear-gradient(135deg,#667eea,#764ba2)',
            border: 'none', borderRadius: 12, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 25px rgba(102,126,234,.4)',
          }}>¡Jugar! 🚀</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────────────────────

function ScoreCard({ title, emoji, score, color, highlight, hasChosen }) {
  return (
    <div style={{
      background: color, borderRadius: 12, padding: '12px 8px', textAlign: 'center',
      border: highlight ? '2px solid #ffd700' : '2px solid rgba(255,255,255,.1)',
      animation: highlight ? 'glow 2s infinite' : 'none', flex: 1,
      boxShadow: highlight ? '0 0 20px rgba(255,215,0,.3)' : 'none',
    }}>
      <div style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginBottom: 4, fontWeight: 600 }}>
        {title} {emoji} {hasChosen ? '✓' : ''}
      </div>
      <div style={{ color: 'white', fontSize: 38, fontWeight: 900, textShadow: '0 2px 8px rgba(0,0,0,.3)' }}>{score}</div>
    </div>
  );
}

function ChoiceButton({ ruleset, id, disabled, onClick }) {
  const [hov, setHov] = useState(false);
  const st = styleOf(ruleset, id);
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        height: 110, background: disabled ? 'rgba(100,100,100,.2)' : st.g,
        border: (hov && !disabled) ? '2px solid rgba(255,255,255,.4)' : '2px solid transparent',
        borderRadius: 16, color: 'white', fontSize: 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .35 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        boxShadow: (hov && !disabled) ? `0 12px 36px ${st.s}, 0 0 20px ${st.s}` : `0 4px 16px ${st.s}`,
        transform: (hov && !disabled) ? 'translateY(-4px) scale(1.05)' : 'scale(1)',
        transition: 'all .2s',
      }}
    >
      <span style={{ fontSize: 38, filter: disabled ? 'grayscale(.8)' : 'drop-shadow(0 2px 6px rgba(0,0,0,.4))' }}>{emojiOf(ruleset, id)}</span>
      <span style={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: 11 }}>{nameOf(ruleset, id)}</span>
    </button>
  );
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ChoiceGrid({ ruleset, disabled, onChoice, order }) {
  const list = order && order.length === ruleset.elements.length ? order : ids(ruleset);
  const cols = Math.min(list.length, list.length <= 4 ? list.length : 3);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 10, marginBottom: 18 }}>
      {list.map(id => (
        <ChoiceButton key={id} ruleset={ruleset} id={id} disabled={disabled} onClick={() => onChoice(id)} />
      ))}
    </div>
  );
}

function ConfirmTurnOverlay({ playerName, colorIndex, onReady }) {
  return (
    <Overlay>
      <div style={{ textAlign: 'center', color: 'white', fontWeight: 700, marginBottom: 32 }}>
        <div style={{ fontSize: 50, marginBottom: 14 }}>🔒</div>
        <div style={{ fontSize: 16, color: '#888', marginBottom: 8 }}>Pásale el dispositivo a</div>
        <div style={{ fontSize: 40, background: PLAYER_COLORS[colorIndex % 4], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textShadow: 'none' }}>
          {playerName}
        </div>
      </div>
      <GradBtn onClick={onReady} gradient={PLAYER_COLORS[colorIndex % 4]} shadow="rgba(0,0,0,.4)" style={{ maxWidth: 300 }}>
        ✅ Listo, soy {playerName}
      </GradBtn>
      <div style={{ color: '#555', fontSize: 11, marginTop: 14, textAlign: 'center' }}>
        Las fichas cambian de posición 🔀
      </div>
    </Overlay>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(5,5,15,.96)', zIndex: 998,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn .3s', padding: 24,
    }}>
      {children}
    </div>
  );
}

// ── SCREEN: Game ────────────────────────────────────────────────────────────

function GameScreen({ mode, players, goal, ruleset, onGoalChange, onReset, onRematch, soundEnabled, difficulty, timerEnabled }) {
  const [playerScores, setPlayerScores] = useState(() => Object.fromEntries(players.map(p => [p, 0])));
  const [cpuScore, setCpuScore] = useState(0);
  const [history, setHistory] = useState(() => Object.fromEntries(players.map(p => [p, emptyCounts(ruleset)])));
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [cpuChoice, setCpuChoice] = useState(null);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [result, setResult] = useState(mode === 'cpu' ? '¡Buena suerte! 🍀' : '¡Que comience! ⚔️');
  const [resultColor, setResultColor] = useState('#ffd700');
  const [gameOver, setGameOver] = useState(false);
  const [showBattle, setShowBattle] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [multiChoices, setMultiChoices] = useState({});
  const [turnPhase, setTurnPhase] = useState(mode === 'multi' ? 'confirm' : 'choosing');
  const [waitingForChoices, setWaitingForChoices] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [buttonOrder, setButtonOrder] = useState(() => shuffle(ids(ruleset)));
  const [particles, burstParticles] = useParticles();
  const [count, runCountdown] = useCountdown();
  const [achievement, showAchievement, dismissAchievement] = useAchievementToast();

  const TIMER_SECONDS = 10;
  const currentPlayer = players[currentPlayerIndex];

  const handleTimerExpire = useCallback(() => {
    if (mode === 'cpu') {
      const randomChoice = ids(ruleset)[Math.floor(Math.random() * ids(ruleset).length)];
      playVsCPU(randomChoice);
    } else {
      const randomChoice = ids(ruleset)[Math.floor(Math.random() * ids(ruleset).length)];
      playMulti(randomChoice);
    }
  }, [mode, ruleset, gameOver, showBattle, turnPhase, currentPlayerIndex, multiChoices, history, roundsPlayed, playerScores, cpuScore]);

  const timer = useTurnTimer(timerEnabled, TIMER_SECONDS, handleTimerExpire);

  useEffect(() => {
    if (timerEnabled && !gameOver && !showBattle && !waitingForChoices && !showResults && !count) {
      if (mode === 'cpu' && turnPhase === 'choosing') timer.start();
      if (mode === 'multi' && turnPhase === 'choosing') timer.start();
    }
    return () => timer.stop();
  }, [turnPhase, gameOver, showBattle, waitingForChoices, showResults, count, timerEnabled, mode]);

  function playVsCPU(choice) {
    if (gameOver || showBattle) return;
    timer.stop();
    if (soundEnabled) playClick();
    const pName = players[0];
    setPlayerChoice(choice);
    setShowBattle(true);
    setCpuChoice(null);

    runCountdown(() => {
      const cpu = difficulty === 'easy'
        ? ids(ruleset)[Math.floor(Math.random() * ids(ruleset).length)]
        : difficulty === 'hard'
          ? cpuChooseHard(ruleset, history[pName], roundsPlayed)
          : difficulty === 'expert'
            ? expertChoose(ruleset)
            : cpuChoose(ruleset, history[pName], roundsPlayed);
      setCpuChoice(cpu);
      // La IA experta aprende del jugador DESPUÉS de haber elegido (sin trampa)
      recordPlayerMove(choice);
      const newHistory = { ...history, [pName]: { ...history[pName], [choice]: (history[pName][choice] || 0) + 1 } };
      setHistory(newHistory);
      setRoundsPlayed(r => r + 1);

      const winner = determineWinner(ruleset, choice, cpu);
      let text, color;
      let newPScore = playerScores[pName];
      let newCPUScore = cpuScore;

      if (winner === 'tie') {
        text = '¡Empate! 🤝'; color = '#ffcc00';
        if (soundEnabled) playTie();
        recordRound('tie', choice);
      } else if (winner === 'p1') {
        text = '¡Ganaste! 🏆'; color = '#00ff88'; newPScore++;
        if (soundEnabled) playWin(); vibrate(60); burstParticles(true);
        recordRound('win', choice);
        if (newPScore >= goal) {
          text = `🎉 ¡${pName} GANÓ! 🎉`; setGameOver(true);
          if (soundEnabled) playVictory(); vibrate([80, 40, 80, 40, 160]);
          recordGameWin();
        }
      } else {
        text = 'CPU ganó 💀'; color = '#ff4444'; newCPUScore++;
        if (soundEnabled) playLose(); vibrate([40, 40, 40]); burstParticles(false);
        recordRound('loss', choice);
        if (newCPUScore >= goal) {
          text = '💀 CPU GANÓ 💀'; setGameOver(true);
          recordGameLoss();
        }
      }

      const newAch = checkAchievements();
      if (newAch.length) showAchievement(newAch);

      setPlayerScores({ ...playerScores, [pName]: newPScore });
      setCpuScore(newCPUScore);
      setResult(text); setResultColor(color);
      setTimeout(() => { setShowBattle(false); setButtonOrder(shuffle(ids(ruleset))); }, 1400);
    }, soundEnabled);
  }

  function confirmTurn() {
    if (soundEnabled) playClick();
    setButtonOrder(shuffle(ids(ruleset)));
    setTurnPhase('choosing');
  }

  function playMulti(choice) {
    if (gameOver || waitingForChoices || turnPhase !== 'choosing') return;
    timer.stop();
    if (soundEnabled) playClick();
    const pName = currentPlayer;
    const newChoices = { ...multiChoices, [pName]: choice };
    setMultiChoices(newChoices);
    setHistory(h => ({ ...h, [pName]: { ...h[pName], [choice]: (h[pName][choice] || 0) + 1 } }));

    if (currentPlayerIndex === players.length - 1) {
      setWaitingForChoices(true);
      setTurnPhase('confirm');
      runCountdown(() => processMultiRound(newChoices), soundEnabled);
    } else {
      setCurrentPlayerIndex(i => i + 1);
      setTurnPhase('confirm');
    }
  }

  function processMultiRound(choices) {
    setRoundsPlayed(r => r + 1);
    const winChoice = winningChoice(ruleset, Object.values(choices));
    let text, color, rWinner = null;
    let newScores = { ...playerScores };

    if (!winChoice) {
      text = '¡EMPATE! 🤝'; color = '#ffcc00';
      if (soundEnabled) playTie();
    } else {
      const winners = players.filter(p => choices[p] === winChoice);
      if (winners.length === 1) {
        rWinner = winners[0];
        newScores[rWinner] = (newScores[rWinner] || 0) + 1;
        if (newScores[rWinner] >= goal) {
          text = `🎉 ¡${rWinner} GANÓ! 🎉`; color = '#00ff88'; setGameOver(true);
          if (soundEnabled) playVictory(); vibrate([80, 40, 80, 40, 160]);
        } else {
          text = `¡${rWinner} ganó! 🏆`; color = '#00ff88';
          if (soundEnabled) playWin(); vibrate(60);
        }
        burstParticles(true);
      } else {
        text = `¡${winners.join(' y ')} empataron! 🤝`; color = '#ffcc00';
        if (soundEnabled) playTie();
      }
    }

    setPlayerScores(newScores); setRoundWinner(rWinner); setResult(text); setResultColor(color); setShowResults(true);
    setTimeout(() => {
      setShowResults(false); setWaitingForChoices(false);
      setMultiChoices({}); setCurrentPlayerIndex(0); setRoundWinner(null);
      setTurnPhase('confirm');
    }, 2800);
  }

  const handleChoice = mode === 'cpu' ? playVsCPU : playMulti;
  const isDisabled = gameOver || (mode === 'cpu' && showBattle) || (mode === 'multi' && (waitingForChoices || turnPhase !== 'choosing'));

  return (
    <div style={{ ...BG_STYLE, padding: '20px 12px', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <Particles particles={particles} />
      <CountdownOverlay count={count} />
      <AchievementToast achievement={achievement} onDone={dismissAchievement} />

      {mode === 'multi' && waitingForChoices && !showResults && !count && (
        <Overlay><div style={{ textAlign: 'center', color: 'white', fontSize: 24, fontWeight: 700 }}>
          <div style={{ fontSize: 50, marginBottom: 16 }}>⏳</div>Procesando...
        </div></Overlay>
      )}

      {mode === 'multi' && turnPhase === 'confirm' && !waitingForChoices && !showResults && !gameOver && (
        <ConfirmTurnOverlay playerName={currentPlayer} colorIndex={currentPlayerIndex} onReady={confirmTurn} />
      )}

      {showResults && mode === 'multi' && (
        <Overlay>
          <div style={{ textAlign: 'center', color: resultColor, fontSize: 28, fontWeight: 700, marginBottom: 28, textShadow: `0 0 30px ${resultColor}` }}>{result}</div>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {players.map((p, i) => (
              <div key={p} style={{
                textAlign: 'center', padding: '16px 20px',
                background: p === roundWinner ? 'rgba(0,255,136,.12)' : 'rgba(255,255,255,.04)',
                borderRadius: 14, border: p === roundWinner ? '2px solid #00ff88' : '2px solid rgba(255,255,255,.08)', minWidth: 100,
              }}>
                <div style={{ color: PLAYER_SOLIDS[i % 4], fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{p}</div>
                <div style={{ fontSize: 48 }}>{emojiOf(ruleset, multiChoices[p])}</div>
                {p === roundWinner && <div style={{ marginTop: 6, fontSize: 20 }}>👑</div>}
              </div>
            ))}
          </div>
        </Overlay>
      )}

      <div style={{
        maxWidth: 720, margin: '0 auto', ...CARD_STYLE, padding: '28px 24px', position: 'relative', zIndex: 1,
      }}>
        <h1 style={{
          textAlign: 'center', background: 'linear-gradient(45deg,#ff006e,#8338ec,#3a86ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 22, fontWeight: 900, marginBottom: 14,
        }}>⚔️ PIEDRA PAPEL TIJERA</h1>

        {mode === 'multi' && !waitingForChoices && !gameOver && (
          <div style={{
            textAlign: 'center', padding: '10px 18px', background: PLAYER_COLORS[currentPlayerIndex % 4],
            borderRadius: 12, marginBottom: 14, color: 'white', fontSize: 16, fontWeight: 700,
          }}>🎮 Turno: {currentPlayer}</div>
        )}

        {mode === 'cpu' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
            <ScoreCard title={players[0]} emoji="👤" score={playerScores[players[0]] || 0} color={PLAYER_COLORS[0]} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 36 }}>
              <span style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)', borderRadius: 8, padding: '5px 8px', color: 'white', fontWeight: 700, fontSize: 13, boxShadow: '0 0 15px rgba(240,147,251,.3)' }}>VS</span>
            </div>
            <ScoreCard title="CPU" emoji="🤖" score={cpuScore} color="linear-gradient(135deg,#f093fb,#f5576c)" />
          </div>
        )}

        {mode === 'multi' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 18 }}>
            {players.map((p, i) => (
              <ScoreCard key={p} title={p} emoji="" score={playerScores[p] || 0} color={PLAYER_COLORS[i % 4]}
                highlight={p === currentPlayer && !waitingForChoices && !gameOver} hasChosen={!!multiChoices[p]} />
            ))}
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,.03)', borderRadius: 10, padding: '10px 14px',
          border: '1px solid rgba(255,255,255,.06)', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6,
        }}>
          <div style={{ color: '#ccc', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} color="#ffd700" />
            <span style={{ fontSize: 12 }}>Meta: <strong>{goal}</strong></span>
          </div>
          {mode === 'cpu' && (
            <div style={{ color: '#555', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: DIFFICULTY_COLORS[difficulty], fontWeight: 700 }}>IA: {DIFFICULTY_LABELS[difficulty]}</span>
            </div>
          )}
          {timerEnabled && <div style={{ color: '#2af598', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} /> Contrarreloj</div>}
          <div style={{ color: '#444', fontSize: 11 }}>Ronda {roundsPlayed}</div>
        </div>

        <TimerBar timeLeft={timer.timeLeft} maxTime={TIMER_SECONDS} enabled={timerEnabled && !isDisabled && !count} />

        {showBattle && mode === 'cpu' && (
          <div style={{
            background: 'rgba(0,0,0,.3)', borderRadius: 16, padding: '22px 14px', marginBottom: 16,
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            border: '2px solid rgba(255,215,0,.2)', animation: 'shake .4s',
          }}>
            <div style={{ fontSize: 64, animation: 'slideIn .5s ease-out', filter: 'drop-shadow(0 0 12px rgba(102,126,234,.8))' }}>
              {emojiOf(ruleset, playerChoice)}
            </div>
            <Zap size={32} color="#ffd700" style={{ animation: 'pulse .5s infinite' }} />
            <div style={{ fontSize: 64, animation: cpuChoice ? 'slideIn .5s ease-out' : 'none', filter: 'drop-shadow(0 0 12px rgba(245,87,108,.8))' }}>
              {cpuChoice ? emojiOf(ruleset, cpuChoice) : '❓'}
            </div>
          </div>
        )}

        <ChoiceGrid ruleset={ruleset} disabled={isDisabled} onChoice={handleChoice} order={buttonOrder} />

        <div style={{
          textAlign: 'center', padding: '16px 14px', background: 'rgba(0,0,0,.2)', borderRadius: 14, marginBottom: 18,
          minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          <div style={{
            color: resultColor, fontSize: gameOver ? 22 : 16, fontWeight: 700,
            textShadow: `0 0 20px ${resultColor}`, animation: gameOver ? 'pulse 1s infinite' : 'none',
          }}>{result}</div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div style={{ color: '#888', fontSize: 11, textAlign: 'center', letterSpacing: 2, marginBottom: 10 }}>🎯 META</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[3, 5, 10].map(g => (
              <button key={g} onClick={() => { playClick(); onGoalChange(g); }} style={{
                width: 64, height: 48,
                background: goal === g ? 'linear-gradient(135deg,#ffd700,#ffed4e)' : 'rgba(255,255,255,.05)',
                border: goal === g ? '2px solid #ffd700' : '2px solid rgba(255,255,255,.1)',
                borderRadius: 10, color: goal === g ? '#000' : '#ccc', fontSize: 20, fontWeight: 700,
                cursor: 'pointer', transition: 'all .2s',
                boxShadow: goal === g ? '0 0 15px rgba(255,215,0,.4)' : 'none',
              }}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {gameOver && (
            <button onClick={() => { playClick(); onRematch(); }} style={{
              background: 'linear-gradient(135deg,#2af598,#009efd)', border: 'none', borderRadius: 12,
              padding: '12px 28px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(42,245,152,.3)',
            }}><RotateCcw size={18} />Revancha</button>
          )}
          <button onClick={() => { playClick(); onReset(); }} style={{
            background: 'linear-gradient(135deg,#f5576c,#f093fb)', border: 'none', borderRadius: 12,
            padding: '12px 28px', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(245,87,108,.3)',
          }}>{gameOver ? '🏠 Menú' : <><RotateCcw size={18} />Cambiar Modo</>}</button>
        </div>
      </div>
    </div>
  );
}

function cpuChooseHard(rs, playerHistory, roundsPlayed) {
  const idList = ids(rs);
  const rnd = () => idList[Math.floor(Math.random() * idList.length)];
  if (roundsPlayed < 1) return rnd();
  const h = playerHistory || emptyCounts(rs);
  const total = idList.reduce((s, id) => s + (h[id] || 0), 0);
  if (total === 0) return rnd();
  let prediction = idList[0];
  for (const id of idList) if ((h[id] || 0) > (h[prediction] || 0)) prediction = id;
  const n = rs.elements.length;
  const k = Math.floor((n - 1) / 2);
  const counters = idList.filter(id => {
    if (id === prediction) return false;
    const ia = rs.elements.findIndex(e => e.id === id);
    const ib = rs.elements.findIndex(e => e.id === prediction);
    const d = ((ia - ib) % n + n) % n;
    return d >= 1 && d <= k;
  });
  if (counters.length === 0) return rnd();
  return counters[Math.floor(Math.random() * counters.length)];
}

// ── SCREEN: Tournament ──────────────────────────────────────────────────────

function TournamentScreen({ players, ruleset, onReset, onRematch, soundEnabled, timerEnabled }) {
  const [bracket, setBracket] = useState({
    semi1: { p1: players[0], p2: players[1], winner: null },
    semi2: { p1: players[2], p2: players[3], winner: null },
    final: { p1: null, p2: null, winner: null },
  });
  const [phase, setPhase] = useState('bracket');
  const [currentMatch, setCurrentMatch] = useState(null);
  const [goal] = useState(3);
  const [particles, burstParticles] = useParticles();

  function startMatch(matchKey) { playClick(); setCurrentMatch(matchKey); setPhase('match'); }

  function onMatchEnd(matchKey, winnerName) {
    if (soundEnabled) playVictory();
    burstParticles(true);
    setBracket(prev => {
      const next = { ...prev, [matchKey]: { ...prev[matchKey], winner: winnerName } };
      if (matchKey === 'semi1' || matchKey === 'semi2') {
        const s1w = matchKey === 'semi1' ? winnerName : prev.semi1.winner;
        const s2w = matchKey === 'semi2' ? winnerName : prev.semi2.winner;
        if (s1w && s2w) next.final = { p1: s1w, p2: s2w, winner: null };
      }
      if (matchKey === 'final') recordTournamentWin();
      return next;
    });
    setPhase('bracket'); setCurrentMatch(null);
  }

  const champion = bracket.final.winner;

  if (champion) {
    return (
      <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <style>{CSS}</style>
        <Particles particles={particles} />
        <div style={{
          maxWidth: 460, width: '100%', ...CARD_STYLE, padding: 44, textAlign: 'center',
          border: '2px solid #ffd700',
        }}>
          <div style={{ fontSize: 76, marginBottom: 14, animation: 'bounceIn .6s' }}>🏆</div>
          <h2 style={{ color: '#ffd700', fontSize: 14, letterSpacing: 3, marginBottom: 8 }}>CAMPEÓN DEL TORNEO</h2>
          <h1 style={{
            background: 'linear-gradient(45deg,#ffd700,#ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 40, fontWeight: 900, marginBottom: 24, animation: 'pulse 1.5s infinite',
          }}>{champion}</h1>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => { playClick(); onRematch(); }} style={{
              background: 'linear-gradient(135deg,#2af598,#009efd)', border: 'none', borderRadius: 12,
              padding: '12px 24px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>🔄 Revancha</button>
            <button onClick={() => { playClick(); onReset(); }} style={{
              background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', borderRadius: 12,
              padding: '12px 24px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}>🏠 Menú</button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'match' && currentMatch) {
    const m = bracket[currentMatch];
    return (
      <TournamentMatch players={[m.p1, m.p2]} matchKey={currentMatch} goal={goal}
        ruleset={ruleset} onMatchEnd={onMatchEnd} soundEnabled={soundEnabled} timerEnabled={timerEnabled} />
    );
  }

  const semisReady = bracket.semi1.winner && bracket.semi2.winner;

  return (
    <div style={{ ...BG_STYLE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: '100vh' }}>
      <style>{CSS}</style>
      <Particles particles={particles} />
      <div style={{ maxWidth: 560, width: '100%', ...CARD_STYLE, padding: '32px 28px' }}>
        <h1 style={{
          textAlign: 'center', background: 'linear-gradient(45deg,#ffd700,#ff8c00)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 26, fontWeight: 900, marginBottom: 6,
        }}>🏆 TORNEO</h1>
        <p style={{ textAlign: 'center', color: '#555', fontSize: 12, marginBottom: 24 }}>Primero a {goal} pts gana el partido</p>

        <div style={{ color: '#666', fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>SEMIFINALES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {['semi1', 'semi2'].map((key, ki) => {
            const m = bracket[key];
            return <MatchCard key={key} match={m} matchNum={ki + 1} onPlay={!m.winner ? () => startMatch(key) : null} />;
          })}
        </div>

        <div style={{ color: '#666', fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>FINAL</div>
        {semisReady ? (
          <MatchCard match={bracket.final} matchNum="F" onPlay={!bracket.final.winner ? () => startMatch('final') : null} isFinal />
        ) : (
          <div style={{
            background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: 18,
            border: '2px dashed rgba(255,215,0,.15)', textAlign: 'center', color: '#444', fontSize: 13,
          }}>🏅 Esperando semifinales...</div>
        )}

        <button onClick={() => { playClick(); onReset(); }} style={{
          background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 10,
          padding: '10px 20px', color: '#777', fontSize: 13, cursor: 'pointer', marginTop: 20, width: '100%',
        }}>🏠 Menú Principal</button>
      </div>
    </div>
  );
}

function MatchCard({ match, matchNum, onPlay, isFinal }) {
  return (
    <div style={{
      background: isFinal ? 'rgba(255,215,0,.05)' : 'rgba(255,255,255,.03)', borderRadius: 12, padding: '14px 16px',
      border: isFinal ? '2px solid rgba(255,215,0,.25)' : '1px solid rgba(255,255,255,.06)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
        <span style={{ color: '#444', fontSize: 11, minWidth: 24 }}>#{matchNum}</span>
        <span style={{ color: match.winner === match.p1 ? '#00ff88' : 'white', fontWeight: 700, fontSize: 14 }}>{match.p1 || '?'}</span>
        <span style={{ color: '#333', fontSize: 12 }}>vs</span>
        <span style={{ color: match.winner === match.p2 ? '#00ff88' : 'white', fontWeight: 700, fontSize: 14 }}>{match.p2 || '?'}</span>
        {match.winner && <span style={{ color: '#ffd700', fontSize: 13 }}>→ {match.winner} 👑</span>}
      </div>
      {onPlay && (
        <button onClick={onPlay} style={{
          background: isFinal ? 'linear-gradient(135deg,#ffd700,#ff8c00)' : 'linear-gradient(135deg,#667eea,#764ba2)',
          border: 'none', borderRadius: 8, padding: '7px 14px', color: isFinal ? '#000' : 'white',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          boxShadow: isFinal ? '0 0 12px rgba(255,215,0,.3)' : '0 0 12px rgba(102,126,234,.3)',
        }}>▶ Jugar</button>
      )}
    </div>
  );
}

function TournamentMatch({ players, matchKey, goal, ruleset, onMatchEnd, soundEnabled, timerEnabled }) {
  const [scores, setScores] = useState({ [players[0]]: 0, [players[1]]: 0 });
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [choices, setChoices] = useState({});
  const [turnPhase, setTurnPhase] = useState('confirm');
  const [showResults, setShowResults] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [result, setResult] = useState('');
  const [resultColor, setResultColor] = useState('#ffd700');
  const [done, setDone] = useState(false);
  const [buttonOrder, setButtonOrder] = useState(() => shuffle(ids(ruleset)));
  const [particles, burstParticles] = useParticles();
  const [count, runCountdown] = useCountdown();

  const TIMER_SECONDS = 10;
  const currentPlayer = players[currentPlayerIndex];

  const handleTimerExpire = useCallback(() => {
    const randomChoice = ids(ruleset)[Math.floor(Math.random() * ids(ruleset).length)];
    pickChoice(randomChoice);
  }, [ruleset, done, turnPhase, currentPlayerIndex, choices]);

  const timer = useTurnTimer(timerEnabled, TIMER_SECONDS, handleTimerExpire);

  useEffect(() => {
    if (timerEnabled && !done && !showResults && !count && turnPhase === 'choosing') timer.start();
    return () => timer.stop();
  }, [turnPhase, done, showResults, count, timerEnabled]);

  function confirmTurn() {
    if (soundEnabled) playClick();
    setButtonOrder(shuffle(ids(ruleset)));
    setTurnPhase('choosing');
  }

  function pickChoice(choice) {
    if (done || turnPhase !== 'choosing') return;
    timer.stop();
    if (soundEnabled) playClick();
    const newChoices = { ...choices, [currentPlayer]: choice };
    setChoices(newChoices);
    if (currentPlayerIndex === 0) {
      setCurrentPlayerIndex(1);
      setTurnPhase('confirm');
    } else {
      setTurnPhase('confirm');
      runCountdown(() => resolveRound(newChoices), soundEnabled);
    }
  }

  function resolveRound(c) {
    const w = determineWinner(ruleset, c[players[0]], c[players[1]]);
    let text, color, rWinner = null;
    const newScores = { ...scores };
    if (w === 'tie') {
      text = '¡Empate! 🤝'; color = '#ffcc00';
      if (soundEnabled) playTie();
    } else {
      rWinner = players[w === 'p1' ? 0 : 1];
      newScores[rWinner]++;
      if (newScores[rWinner] >= goal) {
        text = `🎉 ¡${rWinner} avanza!`; color = '#00ff88'; setDone(true);
        if (soundEnabled) playVictory(); vibrate([80, 40, 80, 40, 160]);
        burstParticles(true);
        setTimeout(() => onMatchEnd(matchKey, rWinner), 3000);
      } else {
        text = `¡${rWinner} ganó! 🏆`; color = '#00ff88';
        if (soundEnabled) playWin(); vibrate(60);
        burstParticles(true);
      }
    }
    setScores(newScores); setRoundWinner(rWinner); setResult(text); setResultColor(color); setShowResults(true);
    setTimeout(() => { setShowResults(false); setChoices({}); setCurrentPlayerIndex(0); setRoundWinner(null); setTurnPhase('confirm'); }, 2500);
  }

  return (
    <div style={{ ...BG_STYLE, padding: '20px 12px', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <Particles particles={particles} />
      <CountdownOverlay count={count} />

      {turnPhase === 'confirm' && !showResults && !done && !count && (
        <ConfirmTurnOverlay playerName={currentPlayer} colorIndex={currentPlayerIndex} onReady={confirmTurn} />
      )}

      {showResults && (
        <Overlay>
          <div style={{ textAlign: 'center', color: resultColor, fontSize: 26, fontWeight: 700, marginBottom: 24, textShadow: `0 0 25px ${resultColor}` }}>{result}</div>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center' }}>
            {players.map((p, i) => (
              <div key={p} style={{
                textAlign: 'center', padding: '14px 18px',
                background: p === roundWinner ? 'rgba(0,255,136,.12)' : 'rgba(255,255,255,.04)',
                borderRadius: 14, border: p === roundWinner ? '2px solid #00ff88' : '2px solid rgba(255,255,255,.08)', minWidth: 100,
              }}>
                <div style={{ color: PLAYER_SOLIDS[i], fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{p}</div>
                <div style={{ fontSize: 46 }}>{emojiOf(ruleset, choices[p])}</div>
                {p === roundWinner && <div style={{ marginTop: 6 }}>👑</div>}
              </div>
            ))}
          </div>
        </Overlay>
      )}

      <div style={{
        maxWidth: 540, margin: '0 auto', ...CARD_STYLE, padding: '24px 20px', position: 'relative', zIndex: 1,
        border: '2px solid rgba(255,215,0,.2)',
      }}>
        <div style={{ color: '#ffd700', textAlign: 'center', fontSize: 12, letterSpacing: 2, marginBottom: 12 }}>🏆 TORNEO</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {players.map((p, i) => (
            <ScoreCard key={p} title={p} emoji="" score={scores[p] || 0} color={PLAYER_COLORS[i]}
              highlight={p === currentPlayer && turnPhase === 'choosing' && !showResults && !done} />
          ))}
        </div>
        <div style={{ color: '#666', textAlign: 'center', fontSize: 11, marginBottom: 14 }}>
          Meta: {goal} pts · Turno: <strong style={{ color: PLAYER_SOLIDS[currentPlayerIndex] }}>{currentPlayer}</strong>
        </div>
        <TimerBar timeLeft={timer.timeLeft} maxTime={TIMER_SECONDS} enabled={timerEnabled && turnPhase === 'choosing' && !done && !showResults && !count} />
        <ChoiceGrid ruleset={ruleset} disabled={done || turnPhase !== 'choosing' || showResults} onChoice={pickChoice} order={buttonOrder} />
        {result && !showResults && (
          <div style={{ textAlign: 'center', color: resultColor, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{result}</div>
        )}
      </div>
    </div>
  );
}

// ── ROOT App ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('menu');
  const [mode, setMode] = useState(null);
  const [numPlayers, setNumPlayers] = useState(1);
  const [players, setPlayers] = useState([]);
  const [goal, setGoal] = useState(3);
  const [ruleset, setRuleset] = useState(() => loadRuleset());
  const [gameInstance, setGameInstance] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('ppt-sound') !== 'off'; } catch { return true; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('ppt-theme') === 'retro' ? 'retro' : 'modern'; } catch { return 'modern'; }
  });
  const [timerEnabled, setTimerEnabled] = useState(() => {
    try { return localStorage.getItem('ppt-timer') === 'on'; } catch { return false; }
  });
  const [difficulty, setDifficulty] = useState(() => {
    try { return localStorage.getItem('ppt-difficulty') || 'normal'; } catch { return 'normal'; }
  });

  function toggleSound() {
    setSoundEnabled(v => { const n = !v; try { localStorage.setItem('ppt-sound', n ? 'on' : 'off'); } catch {} return n; });
  }
  function toggleTheme() {
    setTheme(t => { const n = t === 'retro' ? 'modern' : 'retro'; try { localStorage.setItem('ppt-theme', n); } catch {} return n; });
  }
  function toggleTimer() {
    setTimerEnabled(v => { const n = !v; try { localStorage.setItem('ppt-timer', n ? 'on' : 'off'); } catch {} return n; });
  }
  function cycleDifficulty() {
    setDifficulty(d => {
      const order = ['easy', 'normal', 'hard', 'expert'];
      const n = order[(order.indexOf(d) + 1) % order.length];
      try { localStorage.setItem('ppt-difficulty', n); } catch {}
      return n;
    });
  }

  function handleModeSelect(selectedMode, n = 1) { setMode(selectedMode); setNumPlayers(n); setScreen('setup'); }
  function handleSetupStart(names) { setPlayers(names); setScreen(mode === 'tournament' ? 'tournament' : 'game'); }
  function handleReset() { setScreen('menu'); setMode(null); setPlayers([]); }
  function handleGoalChange(newGoal) { setGoal(newGoal); }
  function handleSaveRules(rs) { setRuleset(rs); saveRuleset(rs); setScreen('menu'); }
  function handleRematch() { setGameInstance(n => n + 1); }

  let content;
  if (screen === 'menu') {
    content = <MenuScreen onSelect={handleModeSelect} onEditRules={() => setScreen('rules')}
      onStats={() => setScreen('stats')}
      ruleset={ruleset} soundEnabled={soundEnabled} toggleSound={toggleSound}
      theme={theme} toggleTheme={toggleTheme}
      timerEnabled={timerEnabled} toggleTimer={toggleTimer}
      difficulty={difficulty} cycleDifficulty={cycleDifficulty} />;
  } else if (screen === 'rules') {
    content = <RulesEditor initial={ruleset} onSave={handleSaveRules} onCancel={() => setScreen('menu')} />;
  } else if (screen === 'stats') {
    content = <StatsScreen onBack={() => setScreen('menu')} />;
  } else if (screen === 'setup') {
    content = <SetupScreen mode={mode} numPlayers={numPlayers} onStart={handleSetupStart} onBack={handleReset} />;
  } else if (screen === 'tournament') {
    content = <TournamentScreen key={gameInstance} players={players} ruleset={ruleset}
      onReset={handleReset} onRematch={handleRematch} soundEnabled={soundEnabled} timerEnabled={timerEnabled} />;
  } else {
    content = <GameScreen key={gameInstance} mode={mode} players={players} goal={goal} ruleset={ruleset}
      onGoalChange={handleGoalChange} onReset={handleReset} onRematch={handleRematch}
      soundEnabled={soundEnabled} difficulty={difficulty} timerEnabled={timerEnabled} />;
  }

  return <div className={theme === 'retro' ? 'retro' : undefined}>{content}</div>;
}
