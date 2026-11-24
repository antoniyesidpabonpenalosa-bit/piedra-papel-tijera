// IA "Experta": aprendizaje por cadenas de Markov que persiste entre sesiones.
//
// Aprende dos cosas del jugador:
//  1. Transiciones de orden 1 y 2: qué juega después de su(s) última(s) jugada(s).
//  2. Frecuencia global de cada elemento.
//
// Para predecir usa (en orden de preferencia): transición de orden 2 → orden 1
// → frecuencia global → aleatorio. Luego contraataca con un elemento que le
// gane a la predicción. Incluye un 15% de jugada aleatoria para no ser
// completamente explotable si el jugador descubre el patrón inverso.

import { ids } from './ruleset.js';

const KEY = 'ppt-brain';

function blank() {
  return {
    freq: {},        // { choiceId: count }
    trans1: {},      // { prevId: { choiceId: count } }
    trans2: {},      // { "prevPrevId>prevId": { choiceId: count } }
    last: null,      // última jugada del jugador
    prev: null,      // penúltima jugada
    totalMoves: 0,
  };
}

export function loadBrain() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const b = JSON.parse(raw);
      if (b && typeof b === 'object' && b.freq) return b;
    }
  } catch {}
  return blank();
}

function saveBrain(b) {
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {}
}

export function resetBrain() {
  try { localStorage.removeItem(KEY); } catch {}
}

// Registra la jugada del jugador y actualiza el modelo. Llamar DESPUÉS de que
// la CPU ya eligió (para no hacer trampa con la jugada actual).
export function recordPlayerMove(choice) {
  const b = loadBrain();
  b.freq[choice] = (b.freq[choice] || 0) + 1;
  if (b.last) {
    if (!b.trans1[b.last]) b.trans1[b.last] = {};
    b.trans1[b.last][choice] = (b.trans1[b.last][choice] || 0) + 1;
    if (b.prev) {
      const key = `${b.prev}>${b.last}`;
      if (!b.trans2[key]) b.trans2[key] = {};
      b.trans2[key][choice] = (b.trans2[key][choice] || 0) + 1;
    }
  }
  b.prev = b.last;
  b.last = choice;
  b.totalMoves++;
  saveBrain(b);
}

export function brainStats() {
  const b = loadBrain();
  return { totalMoves: b.totalMoves };
}

// Devuelve la clave con más cuenta de un mapa {id: count}, o null si vacío/empatado débil.
function argmax(counts, validIds) {
  if (!counts) return null;
  let best = null, bestC = 0, total = 0;
  for (const id of validIds) {
    const c = counts[id] || 0;
    total += c;
    if (c > bestC) { bestC = c; best = id; }
  }
  // exige un mínimo de evidencia
  if (total < 2 || bestC / total < 0.4) return null;
  return best;
}

// ¿a le gana a b? (misma lógica cíclica que ruleset.beats, replicada para
// evitar dependencia circular con historial dinámico)
function beatsLocal(rs, a, b) {
  if (a === b) return false;
  const list = rs.elements;
  const n = list.length;
  const ia = list.findIndex(e => e.id === a);
  const ib = list.findIndex(e => e.id === b);
  if (ia < 0 || ib < 0) return false;
  const d = ((ia - ib) % n + n) % n;
  return d >= 1 && d <= Math.floor((n - 1) / 2);
}

// Elección de la CPU en modo Experta.
export function expertChoose(rs) {
  const idList = ids(rs);
  const rnd = () => idList[Math.floor(Math.random() * idList.length)];

  // 15% aleatorio para no ser predecible a la inversa
  if (Math.random() < 0.15) return rnd();

  const b = loadBrain();

  // Predicción: orden 2 → orden 1 → frecuencia global
  let prediction = null;
  if (b.prev && b.last) prediction = argmax(b.trans2[`${b.prev}>${b.last}`], idList);
  if (!prediction && b.last) prediction = argmax(b.trans1[b.last], idList);
  if (!prediction) prediction = argmax(b.freq, idList);
  if (!prediction) return rnd();

  const counters = idList.filter(id => beatsLocal(rs, id, prediction));
  if (counters.length === 0) return rnd();
  return counters[Math.floor(Math.random() * counters.length)];
}
