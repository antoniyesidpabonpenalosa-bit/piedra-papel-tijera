// Frases de la CPU según el resultado de la ronda. Le dan personalidad a la
// IA sin depender de ningún servicio externo — solo texto elegido al azar.

const LINES = {
  cpu_win: [
    '¡Te vi venir! 😏',
    'Otra vez lo mismo... qué predecible.',
    '¿Eso es todo lo que tienes?',
    'jaja, gracias por el punto.',
    'Mi circuito lo calculó en milisegundos.',
    '¿Seguro que quieres seguir intentando?',
    'Fácil. Siguiente.',
  ],
  cpu_loss: [
    'Ok, ESO no me lo esperaba.',
    'Suerte de principiante...',
    'Vale, buena jugada. Por ahora.',
    'Recalculando estrategia... 🤖',
    'Un punto no gana la guerra.',
    'Impresionante. No volverá a pasar.',
  ],
  tie: [
    'Grandes mentes piensan igual.',
    'Empate... por ahora.',
    'Mismo cerebro, distinta carcasa.',
  ],
  player_game_win: [
    'Está bien, esta vez ganaste. 🙄',
    'Voy a estudiar tus movimientos para la revancha.',
    'GG. No creas que fue fácil dejarte ganar 😉',
  ],
  cpu_game_win: [
    '¡Otra víctima para la colección! 🏆',
    'La máquina siempre gana al final.',
    'GG, humano. Inténtalo de nuevo.',
  ],
  expert_taunt: [
    'Ya sé lo que vas a jugar...',
    'Tus patrones son un libro abierto para mí.',
    'He visto esta jugada antes. 🧠',
  ],
};

export function cpuLine(event, difficulty) {
  if (event === 'cpu_win' && difficulty === 'expert' && Math.random() < 0.35) {
    return pick(LINES.expert_taunt);
  }
  const pool = LINES[event];
  if (!pool) return null;
  return pick(pool);
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
