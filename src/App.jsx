import React, { useState, useCallback } from 'react';
import { RotateCcw, Trophy, Zap, Target, Users, Cpu, Volume2, VolumeX, Settings, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { playClick, playWin, playLose, playTie, playVictory } from './sounds.js';
import {
  DEFAULT_RULESET, RPSLS_RULESET, ELEMENT_STYLES,
  loadRuleset, saveRuleset,
  ids, emojiOf, nameOf, styleOf, emptyCounts,
  determineWinner, winningChoice, cpuChoose,
} from './ruleset.js';

// ── Constants ────────────────────────────────────────────────────────────────

const PLAYER_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];
const PLAYER_SOLIDS = ['#667eea', '#f093fb', '#2af598', '#fa709a'];

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0f0c29; }
  input:focus { outline: none; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
  @keyframes fall { to{transform:translateY(110vh) rotate(360deg);opacity:0} }
  @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,215,0,.5)} 50%{box-shadow:0 0 40px rgba(255,215,0,.9)} }
  @keyframes slideIn { from{transform:scale(0) rotate(-180deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
  @keyframes fadeIn { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
  @keyframes bounceIn { 0%{transform:scale(0)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
`;

const BG_STYLE = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
        border: 'none', borderRadius: 18, padding: '22px 28px',
        color: 'white', fontSize: 17, fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        boxShadow: hov && !disabled ? `0 14px 38px ${shadow}` : `0 8px 25px ${shadow}`,
        transform: hov && !disabled ? 'translateY(-3px) scale(1.02)' : 'scale(1)',
        transition: 'all .25s', opacity: disabled ? .5 : 1,
        width: '100%', ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── SCREEN: Menu ─────────────────────────────────────────────────────────────

function MenuScreen({ onSelect, onEditRules, ruleset, soundEnabled, toggleSound }) {
  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{
        maxWidth: 560, width: '100%',
        background: 'rgba(20,20,40,.96)', borderRadius: 28, padding: '44px 40px',
        boxShadow: '0 20px 60px rgba(0,0,0,.65)', border: '2px solid rgba(255,255,255,.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
          <button onClick={toggleSound} title="Sonido" style={{
            background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
            borderRadius: 10, padding: '8px 12px', color: 'white', cursor: 'pointer', lineHeight: 0,
          }}>
            {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
        </div>

        <h1 style={{
          textAlign: 'center',
          background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          fontSize: 38, fontWeight: 900, marginBottom: 8,
          animation: 'float 3s ease-in-out infinite',
        }}>
          ⚔️ PIEDRA PAPEL TIJERA
        </h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 15, marginBottom: 28 }}>
          Elige el modo de juego
        </p>

        {/* Ruleset activo */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          background: 'rgba(255,255,255,.05)', borderRadius: 14, padding: '12px 16px',
          border: '1px solid rgba(255,255,255,.1)', marginBottom: 24,
        }}>
          <div style={{ color: '#ccc', fontSize: 13 }}>
            <span style={{ color: '#777' }}>Reglas: </span>
            <strong style={{ color: '#ffd700' }}>{ruleset.name || 'Personalizado'}</strong>
            <span style={{ color: '#666' }}> · {ruleset.elements.map(e => e.emoji).join(' ')}</span>
          </div>
          <button onClick={() => { playClick(); onEditRules(); }} style={{
            background: 'linear-gradient(135deg,#30cfd0,#330867)', border: 'none',
            borderRadius: 10, padding: '8px 14px', color: 'white', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <Settings size={15} /> Editar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <GradBtn onClick={() => { playClick(); onSelect('cpu', 1); }}
            gradient="linear-gradient(135deg,#667eea,#764ba2)" shadow="rgba(102,126,234,.4)">
            <Cpu size={28} />
            <div style={{ textAlign: 'left' }}>
              <div>VS CPU</div>
              <div style={{ fontSize: 13, opacity: .8, fontWeight: 400 }}>Juega contra la computadora inteligente</div>
            </div>
          </GradBtn>

          <div style={{ color: '#555', textAlign: 'center', fontSize: 12, letterSpacing: 2, marginTop: 4 }}>
            ── MULTIJUGADOR ──
          </div>

          {[2, 3, 4].map(n => (
            <GradBtn key={n} onClick={() => { playClick(); onSelect('multi', n); }}
              gradient="linear-gradient(135deg,#f093fb,#f5576c)" shadow="rgba(240,147,251,.4)">
              <Users size={24} />
              <div style={{ textAlign: 'left' }}>
                <div>{n} Jugadores</div>
                <div style={{ fontSize: 13, opacity: .8, fontWeight: 400 }}>Por turnos en el mismo dispositivo</div>
              </div>
            </GradBtn>
          ))}

          <div style={{ color: '#555', textAlign: 'center', fontSize: 12, letterSpacing: 2, marginTop: 4 }}>
            ── TORNEO ──
          </div>

          <GradBtn onClick={() => { playClick(); onSelect('tournament', 4); }}
            gradient="linear-gradient(135deg,#f6d365,#fda085)" shadow="rgba(246,211,101,.4)">
            <Trophy size={28} />
            <div style={{ textAlign: 'left' }}>
              <div>TORNEO — 4 jugadores</div>
              <div style={{ fontSize: 13, opacity: .8, fontWeight: 400 }}>Bracket eliminatorio, semis + final</div>
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
    // Asegurar ids únicos y campos no vacíos
    const seen = new Set();
    const cleaned = elements.map((e, i) => {
      let id = e.id || `el${i}`;
      while (seen.has(id)) id = id + '_' + i;
      seen.add(id);
      return {
        id,
        name: (e.name || '').trim() || `Elemento ${i + 1}`,
        emoji: (e.emoji || '').trim() || '⭐',
      };
    });
    onSave({ name: name.trim() || 'Personalizado', elements: cleaned });
  }

  const n = elements.length;
  const k = Math.floor((n - 1) / 2);
  const balanced = n % 2 === 1;

  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{
        maxWidth: 540, width: '100%',
        background: 'rgba(20,20,40,.96)', borderRadius: 28, padding: '36px 30px',
        boxShadow: '0 20px 60px rgba(0,0,0,.65)', border: '2px solid rgba(255,255,255,.1)',
      }}>
        <h2 style={{ color: 'white', textAlign: 'center', fontSize: 26, fontWeight: 900, marginBottom: 6 }}>
          ⚙️ Editor de Reglas
        </h2>
        <p style={{ textAlign: 'center', color: '#888', fontSize: 13, marginBottom: 22 }}>
          Cada elemento gana a los <strong>{k}</strong> siguiente(s) en el orden (en círculo).
        </p>

        {/* Nombre del set */}
        <label style={{ color: '#aaa', fontSize: 12, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
          NOMBRE DEL SET
        </label>
        <input value={name} maxLength={20} onChange={e => setName(e.target.value)} style={{
          width: '100%', padding: '10px 14px', marginBottom: 20,
          background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,215,0,.3)',
          borderRadius: 10, color: 'white', fontSize: 15,
        }} />

        {/* Plantillas rápidas */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => loadTemplate(DEFAULT_RULESET)} style={tplBtnStyle}>🪨 Clásico (3)</button>
          <button onClick={() => loadTemplate(RPSLS_RULESET)} style={tplBtnStyle}>🖖 Lagarto-Spock (5)</button>
        </div>

        {/* Lista de elementos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {elements.map((e, i) => {
            const next = elements[(i + 1) % n];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '10px 12px',
                border: `1px solid ${ELEMENT_STYLES[i % ELEMENT_STYLES.length].s.replace('.4', '.5')}`,
              }}>
                {/* Orden */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <button onClick={() => move(i, -1)} disabled={i === 0} style={arrowStyle(i === 0)}><ChevronUp size={14} /></button>
                  <button onClick={() => move(i, 1)} disabled={i === n - 1} style={arrowStyle(i === n - 1)}><ChevronDown size={14} /></button>
                </div>
                {/* Emoji */}
                <input value={e.emoji} maxLength={4} onChange={ev => setElem(i, 'emoji', ev.target.value)} style={{
                  width: 50, textAlign: 'center', padding: '8px 4px',
                  background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: 8, color: 'white', fontSize: 22,
                }} />
                {/* Nombre */}
                <input value={e.name} maxLength={14} onChange={ev => setElem(i, 'name', ev.target.value)} style={{
                  flex: 1, padding: '8px 10px',
                  background: 'rgba(0,0,0,.3)', border: '1px solid rgba(255,255,255,.15)',
                  borderRadius: 8, color: 'white', fontSize: 14,
                }} />
                {/* Eliminar */}
                <button onClick={() => removeElem(i)} disabled={n <= 3} style={{
                  background: n <= 3 ? 'rgba(100,100,100,.2)' : 'rgba(245,87,108,.2)',
                  border: 'none', borderRadius: 8, padding: 8,
                  color: n <= 3 ? '#555' : '#f5576c', cursor: n <= 3 ? 'not-allowed' : 'pointer', lineHeight: 0,
                }}><Trash2 size={15} /></button>
              </div>
            );
          })}
        </div>

        {/* Añadir */}
        <button onClick={addElem} disabled={n >= 7} style={{
          width: '100%', padding: 11, marginBottom: 16,
          background: n >= 7 ? 'rgba(100,100,100,.2)' : 'rgba(42,245,152,.12)',
          border: `1px dashed ${n >= 7 ? '#555' : 'rgba(42,245,152,.5)'}`,
          borderRadius: 10, color: n >= 7 ? '#555' : '#2af598',
          fontSize: 14, fontWeight: 700, cursor: n >= 7 ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Plus size={16} /> Añadir elemento {n >= 7 ? '(máx 7)' : `(${n}/7)`}
        </button>

        {/* Vista previa de reglas */}
        <div style={{
          background: 'rgba(0,0,0,.25)', borderRadius: 12, padding: '12px 14px', marginBottom: 8,
          border: '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{ color: '#888', fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>QUIÉN GANA A QUIÉN</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {elements.map((e, i) => {
              const targets = [];
              for (let d = 1; d <= k; d++) targets.push(elements[(i + d) % n]);
              return (
                <div key={i} style={{ color: '#ccc', fontSize: 13 }}>
                  {e.emoji} <strong>{e.name}</strong>
                  <span style={{ color: '#666' }}> gana a </span>
                  {targets.map(t => `${t.emoji} ${t.name}`).join(', ')}
                </div>
              );
            })}
          </div>
        </div>
        {!balanced && (
          <div style={{ color: '#ffcc00', fontSize: 12, marginBottom: 8 }}>
            ⚠️ Con un número par de elementos habrá más empates. Usa 3, 5 o 7 para un juego perfectamente balanceado.
          </div>
        )}

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button onClick={() => { playClick(); onCancel(); }} style={{
            flex: 1, padding: 13, background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, color: '#aaa',
            fontSize: 15, cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={handleSave} style={{
            flex: 2, padding: 13, background: 'linear-gradient(135deg,#667eea,#764ba2)',
            border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>Guardar reglas ✓</button>
        </div>
      </div>
    </div>
  );
}

const tplBtnStyle = {
  flex: 1, padding: '9px 8px', background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)', borderRadius: 10,
  color: '#ddd', fontSize: 12, fontWeight: 600, cursor: 'pointer',
};
const arrowStyle = (disabled) => ({
  background: 'transparent', border: 'none', padding: 1,
  color: disabled ? '#444' : '#999', cursor: disabled ? 'not-allowed' : 'pointer', lineHeight: 0,
});

// ── SCREEN: Setup (player names) ─────────────────────────────────────────────

function SetupScreen({ mode, numPlayers, onStart, onBack }) {
  const count = mode === 'cpu' ? 1 : numPlayers;
  const [names, setNames] = useState(
    Array.from({ length: count }, (_, i) => `Jugador ${i + 1}`)
  );
  const setName = (i, v) => setNames(prev => prev.map((n, j) => j === i ? v : n));

  return (
    <div style={{ ...BG_STYLE, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style>{CSS}</style>
      <div style={{
        maxWidth: 460, width: '100%',
        background: 'rgba(20,20,40,.96)', borderRadius: 28, padding: '40px 36px',
        boxShadow: '0 20px 60px rgba(0,0,0,.65)', border: '2px solid rgba(255,255,255,.1)',
      }}>
        <h2 style={{ color: 'white', textAlign: 'center', fontSize: 26, fontWeight: 900, marginBottom: 28 }}>
          ✏️ Nombres de jugadores
        </h2>
        {names.map((name, i) => (
          <div key={i} style={{ marginBottom: 14 }}>
            <label style={{ color: PLAYER_SOLIDS[i % 4], fontSize: 12, fontWeight: 700, letterSpacing: 1, display: 'block', marginBottom: 6 }}>
              {mode === 'cpu' && i === 0 ? 'TU NOMBRE' : `JUGADOR ${i + 1}`}
            </label>
            <input value={name} maxLength={16} onChange={e => setName(i, e.target.value)} style={{
              width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,.06)',
              border: `2px solid ${PLAYER_SOLIDS[i % 4]}66`, borderRadius: 10, color: 'white', fontSize: 16,
            }} />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          <button onClick={() => { playClick(); onBack(); }} style={{
            flex: 1, padding: 13, background: 'rgba(255,255,255,.08)',
            border: '1px solid rgba(255,255,255,.15)', borderRadius: 12, color: '#aaa', fontSize: 15, cursor: 'pointer',
          }}>← Atrás</button>
          <button onClick={() => { playClick(); onStart(names.map((n, i) => n.trim() || `Jugador ${i + 1}`)); }} style={{
            flex: 2, padding: 13, background: 'linear-gradient(135deg,#667eea,#764ba2)',
            border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
          }}>¡Jugar! 🚀</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function ScoreCard({ title, emoji, score, color, highlight, hasChosen }) {
  return (
    <div style={{
      background: color, borderRadius: 14, padding: '14px 10px', textAlign: 'center',
      border: highlight ? '3px solid #ffd700' : '2px solid rgba(255,255,255,.15)',
      animation: highlight ? 'glow 2s infinite' : 'none', flex: 1,
    }}>
      <div style={{ color: 'rgba(255,255,255,.85)', fontSize: 12, marginBottom: 6 }}>
        {title} {emoji} {hasChosen ? '✓' : ''}
      </div>
      <div style={{ color: 'white', fontSize: 42, fontWeight: 900 }}>{score}</div>
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
        height: 120, background: disabled ? 'rgba(100,100,100,.25)' : st.g,
        border: 'none', borderRadius: 18, color: 'white', fontSize: 13, fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .4 : 1,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: (hov && !disabled) ? `0 12px 36px ${st.s}` : `0 6px 20px ${st.s}`,
        transform: (hov && !disabled) ? 'translateY(-4px) scale(1.04)' : 'scale(1)',
        transition: 'all .25s',
      }}
    >
      <span style={{ fontSize: 40 }}>{emojiOf(ruleset, id)}</span>
      <span style={{ textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', fontSize: 12 }}>
        {nameOf(ruleset, id)}
      </span>
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
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 12, marginBottom: 22 }}>
      {list.map(id => (
        <ChoiceButton key={id} ruleset={ruleset} id={id} disabled={disabled} onClick={() => onChoice(id)} />
      ))}
    </div>
  );
}

// Overlay de confirmación de turno (pasar-y-jugar): el siguiente jugador pulsa
// "Listo" para empezar su turno, evitando que el anterior vea su jugada.
function ConfirmTurnOverlay({ playerName, colorIndex, onReady }) {
  return (
    <Overlay>
      <div style={{ textAlign: 'center', color: 'white', fontWeight: 700, marginBottom: 36 }}>
        <div style={{ fontSize: 50, marginBottom: 14 }}>🔒</div>
        <div style={{ fontSize: 18, color: '#aaa', marginBottom: 8 }}>Pásale el dispositivo a</div>
        <div style={{ fontSize: 44, background: PLAYER_COLORS[colorIndex % 4], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {playerName}
        </div>
      </div>
      <GradBtn onClick={onReady} gradient={PLAYER_COLORS[colorIndex % 4]} shadow="rgba(0,0,0,.4)" style={{ maxWidth: 320 }}>
        ✅ Listo, soy {playerName}
      </GradBtn>
      <div style={{ color: '#666', fontSize: 12, marginTop: 16, textAlign: 'center', maxWidth: 300 }}>
        Las fichas cambian de posición cada turno 🔀
      </div>
    </Overlay>
  );
}

function Overlay({ children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.94)', zIndex: 998,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn .3s', padding: 24,
    }}>
      {children}
    </div>
  );
}

// ── SCREEN: Game (vs CPU + Multiplayer) ──────────────────────────────────────

function GameScreen({ mode, players, goal, ruleset, onGoalChange, onReset, soundEnabled }) {
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
  // Multijugador: 'confirm' = esperando que el jugador pulse "Listo"; 'choosing' = eligiendo
  const [turnPhase, setTurnPhase] = useState(mode === 'multi' ? 'confirm' : 'choosing');
  const [waitingForChoices, setWaitingForChoices] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);
  const [buttonOrder, setButtonOrder] = useState(() => shuffle(ids(ruleset)));
  const [particles, burstParticles] = useParticles();

  const currentPlayer = players[currentPlayerIndex];

  function playVsCPU(choice) {
    if (gameOver || showBattle) return;
    if (soundEnabled) playClick();
    const pName = players[0];
    setPlayerChoice(choice);
    setShowBattle(true);
    setCpuChoice(null);

    setTimeout(() => {
      const cpu = cpuChoose(ruleset, history[pName], roundsPlayed);
      setCpuChoice(cpu);
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
      } else if (winner === 'p1') {
        text = '¡Ganaste esta ronda! 🏆'; color = '#00ff88'; newPScore++;
        if (soundEnabled) playWin();
        burstParticles(true);
        if (newPScore >= goal) { text = `🎉 ¡${pName} GANÓ LA PARTIDA! 🎉`; setGameOver(true); if (soundEnabled) playVictory(); }
      } else {
        text = 'CPU ganó esta ronda 💀'; color = '#ff4444'; newCPUScore++;
        if (soundEnabled) playLose();
        burstParticles(false);
        if (newCPUScore >= goal) { text = '💀 LA CPU GANÓ LA PARTIDA 💀'; setGameOver(true); }
      }

      setPlayerScores({ ...playerScores, [pName]: newPScore });
      setCpuScore(newCPUScore);
      setResult(text); setResultColor(color);
      setTimeout(() => { setShowBattle(false); setButtonOrder(shuffle(ids(ruleset))); }, 1400);
    }, 900);
  }

  // El jugador pulsa "Listo" en el overlay → ve sus fichas (rebarajadas)
  function confirmTurn() {
    if (soundEnabled) playClick();
    setButtonOrder(shuffle(ids(ruleset)));
    setTurnPhase('choosing');
  }

  function playMulti(choice) {
    if (gameOver || waitingForChoices || turnPhase !== 'choosing') return;
    if (soundEnabled) playClick();
    const pName = currentPlayer;
    const newChoices = { ...multiChoices, [pName]: choice };
    setMultiChoices(newChoices);
    setHistory(h => ({ ...h, [pName]: { ...h[pName], [choice]: (h[pName][choice] || 0) + 1 } }));

    if (currentPlayerIndex === players.length - 1) {
      setWaitingForChoices(true);
      setTurnPhase('confirm');
      setTimeout(() => processMultiRound(newChoices), 1000);
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
          text = `🎉 ¡${rWinner} GANÓ LA PARTIDA! 🎉`; color = '#00ff88'; setGameOver(true);
          if (soundEnabled) playVictory();
        } else {
          text = `¡${rWinner} ganó la ronda! 🏆`; color = '#00ff88';
          if (soundEnabled) playWin();
        }
        burstParticles(true);
      } else {
        text = `¡${winners.join(' y ')} empataron! 🤝`; color = '#ffcc00';
        if (soundEnabled) playTie();
      }
    }

    setPlayerScores(newScores);
    setRoundWinner(rWinner);
    setResult(text); setResultColor(color);
    setShowResults(true);

    setTimeout(() => {
      setShowResults(false); setWaitingForChoices(false);
      setMultiChoices({}); setCurrentPlayerIndex(0); setRoundWinner(null);
      setTurnPhase('confirm');
    }, 2800);
  }

  const handleChoice = mode === 'cpu' ? playVsCPU : playMulti;
  const isDisabled = gameOver || (mode === 'cpu' && showBattle) || (mode === 'multi' && (waitingForChoices || turnPhase !== 'choosing'));

  return (
    <div style={{ ...BG_STYLE, padding: '20px 12px', position: 'relative', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <Particles particles={particles} />

      {mode === 'multi' && waitingForChoices && !showResults && (
        <Overlay>
          <div style={{ textAlign: 'center', color: 'white', fontSize: 28, fontWeight: 700 }}>
            <div style={{ fontSize: 50, marginBottom: 16 }}>⏳</div>
            Procesando ronda...
          </div>
        </Overlay>
      )}

      {mode === 'multi' && turnPhase === 'confirm' && !waitingForChoices && !showResults && !gameOver && (
        <ConfirmTurnOverlay playerName={currentPlayer} colorIndex={currentPlayerIndex} onReady={confirmTurn} />
      )}

      {showResults && mode === 'multi' && (
        <Overlay>
          <div style={{ textAlign: 'center', color: resultColor, fontSize: 30, fontWeight: 700, marginBottom: 30, textShadow: `0 0 25px ${resultColor}` }}>
            {result}
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {players.map((p, i) => (
              <div key={p} style={{
                textAlign: 'center', padding: '18px 22px',
                background: p === roundWinner ? 'rgba(0,255,136,.15)' : 'rgba(255,255,255,.05)',
                borderRadius: 16, border: p === roundWinner ? '2px solid #00ff88' : '2px solid rgba(255,255,255,.1)', minWidth: 110,
              }}>
                <div style={{ color: PLAYER_SOLIDS[i % 4], fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{p}</div>
                <div style={{ fontSize: 52 }}>{emojiOf(ruleset, multiChoices[p])}</div>
                {p === roundWinner && <div style={{ marginTop: 8, fontSize: 22 }}>👑</div>}
              </div>
            ))}
          </div>
        </Overlay>
      )}

      <div style={{
        maxWidth: 760, margin: '0 auto', background: 'rgba(20,20,40,.92)', borderRadius: 26, padding: '32px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,.6)', border: '2px solid rgba(255,255,255,.08)', position: 'relative', zIndex: 1,
      }}>
        <h1 style={{
          textAlign: 'center', background: 'linear-gradient(45deg,#ff006e,#8338ec,#3a86ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 26, fontWeight: 900, marginBottom: 18,
        }}>⚔️ PIEDRA PAPEL TIJERA</h1>

        {mode === 'multi' && !waitingForChoices && !gameOver && (
          <div style={{
            textAlign: 'center', padding: '12px 20px', background: PLAYER_COLORS[currentPlayerIndex % 4],
            borderRadius: 14, marginBottom: 18, color: 'white', fontSize: 18, fontWeight: 700,
          }}>🎮 Turno de: {currentPlayer}</div>
        )}

        {mode === 'cpu' ? (
          <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
            <ScoreCard title={players[0]} emoji="👤" score={playerScores[players[0]] || 0} color={PLAYER_COLORS[0]} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 40 }}>
              <span style={{ background: 'linear-gradient(135deg,#f093fb,#f5576c)', borderRadius: 8, padding: '6px 10px', color: 'white', fontWeight: 700, fontSize: 15 }}>VS</span>
            </div>
            <ScoreCard title="CPU" emoji="🤖" score={cpuScore} color="linear-gradient(135deg,#f093fb,#f5576c)" />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22 }}>
            {players.map((p, i) => (
              <ScoreCard key={p} title={p} emoji="" score={playerScores[p] || 0} color={PLAYER_COLORS[i % 4]}
                highlight={p === currentPlayer && !waitingForChoices && !gameOver} hasChosen={!!multiChoices[p]} />
            ))}
          </div>
        )}

        <div style={{
          background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: '12px 16px',
          border: '1px solid rgba(255,255,255,.08)', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={16} color="#ffd700" />
            <span style={{ fontSize: 13 }}>Meta: <strong>{goal}</strong> pts</span>
          </div>
          {mode === 'cpu' && (
            <div style={{ color: '#888', fontSize: 12 }}>
              📊 {ids(ruleset).map(id => `${emojiOf(ruleset, id)}${history[players[0]]?.[id] || 0}`).join(' ')}
            </div>
          )}
          <div style={{ color: '#666', fontSize: 12 }}>Rondas: {roundsPlayed}</div>
        </div>

        {showBattle && mode === 'cpu' && (
          <div style={{
            background: 'rgba(0,0,0,.3)', borderRadius: 18, padding: '24px 16px', marginBottom: 20,
            display: 'flex', justifyContent: 'space-around', alignItems: 'center',
            border: '2px solid rgba(255,215,0,.3)', animation: 'shake .4s',
          }}>
            <div style={{ fontSize: 70, animation: 'slideIn .5s ease-out', filter: 'drop-shadow(0 0 10px rgba(102,126,234,.8))' }}>
              {emojiOf(ruleset, playerChoice)}
            </div>
            <Zap size={36} color="#ffd700" style={{ animation: 'pulse .5s infinite' }} />
            <div style={{ fontSize: 70, animation: cpuChoice ? 'slideIn .5s ease-out' : 'none', filter: 'drop-shadow(0 0 10px rgba(245,87,108,.8))' }}>
              {cpuChoice ? emojiOf(ruleset, cpuChoice) : '❓'}
            </div>
          </div>
        )}

        <ChoiceGrid ruleset={ruleset} disabled={isDisabled} onChoice={handleChoice} order={buttonOrder} />

        <div style={{
          textAlign: 'center', padding: '20px 16px', background: 'rgba(0,0,0,.25)', borderRadius: 16, marginBottom: 22,
          minHeight: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,.08)',
        }}>
          <div style={{
            color: resultColor, fontSize: gameOver ? 24 : 18, fontWeight: 700,
            textShadow: `0 0 18px ${resultColor}`, animation: gameOver ? 'pulse 1s infinite' : 'none',
          }}>{result}</div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ color: '#aaa', fontSize: 12, textAlign: 'center', letterSpacing: 2, marginBottom: 12 }}>🎯 META DE PUNTOS</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            {[3, 5, 10].map(g => (
              <button key={g} onClick={() => { playClick(); onGoalChange(g); }} style={{
                width: 70, height: 52,
                background: goal === g ? 'linear-gradient(135deg,#ffd700,#ffed4e)' : 'rgba(255,255,255,.07)',
                border: goal === g ? '2px solid #ffd700' : '2px solid rgba(255,255,255,.15)',
                borderRadius: 12, color: goal === g ? '#000' : '#fff', fontSize: 22, fontWeight: 700,
                cursor: 'pointer', transition: 'all .2s', boxShadow: goal === g ? '0 6px 20px rgba(255,215,0,.4)' : 'none',
              }}>{g}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => { playClick(); onReset(); }} style={{
            background: 'linear-gradient(135deg,#f5576c,#f093fb)', border: 'none', borderRadius: 14,
            padding: '14px 36px', color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 25px rgba(245,87,108,.4)',
          }}>
            <RotateCcw size={20} />{gameOver ? 'Nueva Partida' : 'Cambiar Modo'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SCREEN: Tournament ────────────────────────────────────────────────────────

function TournamentScreen({ players, ruleset, onReset, soundEnabled }) {
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
          maxWidth: 460, width: '100%', background: 'rgba(20,20,40,.96)', borderRadius: 28, padding: 48,
          boxShadow: '0 20px 60px rgba(0,0,0,.7)', border: '2px solid #ffd700', textAlign: 'center',
        }}>
          <div style={{ fontSize: 80, marginBottom: 16, animation: 'bounceIn .6s' }}>🏆</div>
          <h2 style={{ color: '#ffd700', fontSize: 16, letterSpacing: 3, marginBottom: 8 }}>CAMPEÓN DEL TORNEO</h2>
          <h1 style={{
            background: 'linear-gradient(45deg,#ffd700,#ff8c00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontSize: 44, fontWeight: 900, marginBottom: 28, animation: 'pulse 1.5s infinite',
          }}>{champion}</h1>
          <button onClick={() => { playClick(); onReset(); }} style={{
            background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', borderRadius: 14,
            padding: '14px 36px', color: 'white', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          }}>🏠 Menú Principal</button>
        </div>
      </div>
    );
  }

  if (phase === 'match' && currentMatch) {
    const m = bracket[currentMatch];
    return (
      <TournamentMatch players={[m.p1, m.p2]} matchKey={currentMatch} goal={goal}
        ruleset={ruleset} onMatchEnd={onMatchEnd} soundEnabled={soundEnabled} />
    );
  }

  const semisReady = bracket.semi1.winner && bracket.semi2.winner;

  return (
    <div style={{ ...BG_STYLE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20, minHeight: '100vh' }}>
      <style>{CSS}</style>
      <Particles particles={particles} />
      <div style={{
        maxWidth: 560, width: '100%', background: 'rgba(20,20,40,.96)', borderRadius: 28, padding: '36px 32px',
        boxShadow: '0 20px 60px rgba(0,0,0,.65)', border: '2px solid rgba(255,255,255,.1)',
      }}>
        <h1 style={{
          textAlign: 'center', background: 'linear-gradient(45deg,#ffd700,#ff8c00)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: 28, fontWeight: 900, marginBottom: 6,
        }}>🏆 TORNEO</h1>
        <p style={{ textAlign: 'center', color: '#666', fontSize: 13, marginBottom: 28 }}>Primero a {goal} puntos gana el partido</p>

        <div style={{ color: '#888', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>SEMIFINALES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {['semi1', 'semi2'].map((key, ki) => {
            const m = bracket[key];
            return <MatchCard key={key} match={m} matchNum={ki + 1} onPlay={!m.winner ? () => startMatch(key) : null} />;
          })}
        </div>

        <div style={{ color: '#888', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>FINAL</div>
        {semisReady ? (
          <MatchCard match={bracket.final} matchNum="F" onPlay={!bracket.final.winner ? () => startMatch('final') : null} isFinal />
        ) : (
          <div style={{
            background: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 20,
            border: '2px dashed rgba(255,215,0,.2)', textAlign: 'center', color: '#555', fontSize: 14,
          }}>🏅 Esperando ganadores de semifinales...</div>
        )}

        <button onClick={() => { playClick(); onReset(); }} style={{
          background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12,
          padding: '11px 24px', color: '#aaa', fontSize: 14, cursor: 'pointer', marginTop: 24, width: '100%',
        }}>🏠 Menú Principal</button>
      </div>
    </div>
  );
}

function MatchCard({ match, matchNum, onPlay, isFinal }) {
  return (
    <div style={{
      background: isFinal ? 'rgba(255,215,0,.07)' : 'rgba(255,255,255,.04)', borderRadius: 14, padding: '16px 18px',
      border: isFinal ? '2px solid rgba(255,215,0,.3)' : '1px solid rgba(255,255,255,.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
        <span style={{ color: '#555', fontSize: 12, minWidth: 24 }}>#{matchNum}</span>
        <span style={{ color: match.winner === match.p1 ? '#00ff88' : 'white', fontWeight: 700, fontSize: 15 }}>{match.p1 || '?'}</span>
        <span style={{ color: '#444', fontSize: 13 }}>vs</span>
        <span style={{ color: match.winner === match.p2 ? '#00ff88' : 'white', fontWeight: 700, fontSize: 15 }}>{match.p2 || '?'}</span>
        {match.winner && <span style={{ color: '#ffd700', fontSize: 14 }}>→ {match.winner} 👑</span>}
      </div>
      {onPlay && (
        <button onClick={onPlay} style={{
          background: isFinal ? 'linear-gradient(135deg,#ffd700,#ff8c00)' : 'linear-gradient(135deg,#667eea,#764ba2)',
          border: 'none', borderRadius: 10, padding: '8px 16px', color: isFinal ? '#000' : 'white',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>▶ Jugar</button>
      )}
    </div>
  );
}

function TournamentMatch({ players, matchKey, goal, ruleset, onMatchEnd, soundEnabled }) {
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

  const currentPlayer = players[currentPlayerIndex];

  function confirmTurn() {
    if (soundEnabled) playClick();
    setButtonOrder(shuffle(ids(ruleset)));
    setTurnPhase('choosing');
  }

  function pickChoice(choice) {
    if (done || turnPhase !== 'choosing') return;
    if (soundEnabled) playClick();
    const newChoices = { ...choices, [currentPlayer]: choice };
    setChoices(newChoices);
    if (currentPlayerIndex === 0) {
      setCurrentPlayerIndex(1);
      setTurnPhase('confirm');
    } else {
      resolveRound(newChoices);
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
        burstParticles(true);
        setTimeout(() => onMatchEnd(matchKey, rWinner), 3000);
      } else {
        text = `¡${rWinner} ganó la ronda! 🏆`; color = '#00ff88';
        if (soundEnabled) playWin();
        burstParticles(true);
      }
    }
    setScores(newScores); setRoundWinner(rWinner); setResult(text); setResultColor(color); setShowResults(true);
    setTimeout(() => { setShowResults(false); setChoices({}); setCurrentPlayerIndex(0); setRoundWinner(null); setTurnPhase('confirm'); }, 2500);
  }

  return (
    <div style={{ ...BG_STYLE, padding: '20px 12px', position: 'relative', overflow: 'hidden' }}>
      <style>{CSS}</style>
      <Particles particles={particles} />

      {turnPhase === 'confirm' && !showResults && !done && (
        <ConfirmTurnOverlay playerName={currentPlayer} colorIndex={currentPlayerIndex} onReady={confirmTurn} />
      )}

      {showResults && (
        <Overlay>
          <div style={{ textAlign: 'center', color: resultColor, fontSize: 28, fontWeight: 700, marginBottom: 28, textShadow: `0 0 25px ${resultColor}` }}>{result}</div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
            {players.map((p, i) => (
              <div key={p} style={{
                textAlign: 'center', padding: '16px 20px',
                background: p === roundWinner ? 'rgba(0,255,136,.15)' : 'rgba(255,255,255,.05)',
                borderRadius: 16, border: p === roundWinner ? '2px solid #00ff88' : '2px solid rgba(255,255,255,.1)', minWidth: 110,
              }}>
                <div style={{ color: PLAYER_SOLIDS[i], fontSize: 13, fontWeight: 700, marginBottom: 8 }}>{p}</div>
                <div style={{ fontSize: 50 }}>{emojiOf(ruleset, choices[p])}</div>
                {p === roundWinner && <div style={{ marginTop: 8 }}>👑</div>}
              </div>
            ))}
          </div>
        </Overlay>
      )}

      <div style={{
        maxWidth: 560, margin: '0 auto', background: 'rgba(20,20,40,.92)', borderRadius: 26, padding: '28px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,.6)', border: '2px solid rgba(255,215,0,.2)', position: 'relative', zIndex: 1,
      }}>
        <div style={{ color: '#ffd700', textAlign: 'center', fontSize: 13, letterSpacing: 2, marginBottom: 14 }}>🏆 PARTIDO DE TORNEO</div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          {players.map((p, i) => (
            <ScoreCard key={p} title={p} emoji="" score={scores[p] || 0} color={PLAYER_COLORS[i]}
              highlight={p === currentPlayer && turnPhase === 'choosing' && !showResults && !done} />
          ))}
        </div>
        <div style={{ color: '#888', textAlign: 'center', fontSize: 12, marginBottom: 16 }}>
          Meta: {goal} pts · Turno de <strong style={{ color: PLAYER_SOLIDS[currentPlayerIndex] }}>{currentPlayer}</strong>
        </div>
        <ChoiceGrid ruleset={ruleset} disabled={done || turnPhase !== 'choosing' || showResults} onChoice={pickChoice} order={buttonOrder} />
        {result && !showResults && (
          <div style={{ textAlign: 'center', color: resultColor, fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{result}</div>
        )}
      </div>
    </div>
  );
}

// ── ROOT App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('menu'); // 'menu' | 'rules' | 'setup' | 'game' | 'tournament'
  const [mode, setMode] = useState(null);
  const [numPlayers, setNumPlayers] = useState(1);
  const [players, setPlayers] = useState([]);
  const [goal, setGoal] = useState(3);
  const [ruleset, setRuleset] = useState(() => loadRuleset());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('ppt-sound') !== 'off'; } catch { return true; }
  });

  function toggleSound() {
    setSoundEnabled(v => {
      const next = !v;
      try { localStorage.setItem('ppt-sound', next ? 'on' : 'off'); } catch {}
      return next;
    });
  }

  function handleModeSelect(selectedMode, n = 1) { setMode(selectedMode); setNumPlayers(n); setScreen('setup'); }
  function handleSetupStart(names) { setPlayers(names); setScreen(mode === 'tournament' ? 'tournament' : 'game'); }
  function handleReset() { setScreen('menu'); setMode(null); setPlayers([]); }
  function handleGoalChange(newGoal) { setGoal(newGoal); }
  function handleSaveRules(rs) { setRuleset(rs); saveRuleset(rs); setScreen('menu'); }

  if (screen === 'menu') {
    return <MenuScreen onSelect={handleModeSelect} onEditRules={() => setScreen('rules')}
      ruleset={ruleset} soundEnabled={soundEnabled} toggleSound={toggleSound} />;
  }
  if (screen === 'rules') {
    return <RulesEditor initial={ruleset} onSave={handleSaveRules} onCancel={() => setScreen('menu')} />;
  }
  if (screen === 'setup') {
    return <SetupScreen mode={mode} numPlayers={numPlayers} onStart={handleSetupStart} onBack={handleReset} />;
  }
  if (screen === 'tournament') {
    return <TournamentScreen players={players} ruleset={ruleset} onReset={handleReset} soundEnabled={soundEnabled} />;
  }
  return (
    <GameScreen mode={mode} players={players} goal={goal} ruleset={ruleset}
      onGoalChange={handleGoalChange} onReset={handleReset} soundEnabled={soundEnabled} />
  );
}
