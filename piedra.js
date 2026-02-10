import React, { useState, useEffect } from 'react';
import { Hand, FileText, Scissors, RotateCcw, Trophy, Skull, Zap, Target, Users, Cpu } from 'lucide-react';

const RockPaperScissors = () => {
  const [gameMode, setGameMode] = useState(null); // null, 'cpu', 'multi'
  const [players, setPlayers] = useState([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState({});
  const [cpuScore, setCpuScore] = useState(0);
  const [goal, setGoal] = useState(3);
  const [history, setHistory] = useState({});
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [cpuChoice, setCpuChoice] = useState(null);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [result, setResult] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [resultColor, setResultColor] = useState("#ffd700");
  const [showBattle, setShowBattle] = useState(false);
  const [particles, setParticles] = useState([]);
  const [showVsScreen, setShowVsScreen] = useState(false);
  const [waitingForChoice, setWaitingForChoice] = useState(false);
  const [multiPlayerChoices, setMultiPlayerChoices] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [roundWinner, setRoundWinner] = useState(null);

  const options = ["piedra", "papel", "tijera"];
  
  const emojis = {
    piedra: "🪨",
    papel: "📄",
    tijera: "✂️"
  };

  const playerColors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #2af598 0%, #009efd 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  ];

  const cpuChoose = (playerName) => {
    if (roundsPlayed < 2) {
      return options[Math.floor(Math.random() * 3)];
    }

    const playerHistory = history[playerName] || { piedra: 0, papel: 0, tijera: 0 };
    const total = playerHistory.piedra + playerHistory.papel + playerHistory.tijera;
    
    if (total === 0) {
      return options[Math.floor(Math.random() * 3)];
    }

    if (Math.random() < 0.7) {
      let prediction = "piedra";
      if (playerHistory.papel > playerHistory.piedra && playerHistory.papel > playerHistory.tijera) {
        prediction = "papel";
      } else if (playerHistory.tijera > playerHistory.piedra && playerHistory.tijera > playerHistory.papel) {
        prediction = "tijera";
      }

      const counters = {
        piedra: "papel",
        papel: "tijera",
        tijera: "piedra"
      };
      return counters[prediction];
    } else {
      return options[Math.floor(Math.random() * 3)];
    }
  };

  const createParticles = (isWin) => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Math.random(),
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        emoji: isWin ? ['✨', '🎉', '⭐', '💫'][Math.floor(Math.random() * 4)] : ['💥', '💨', '😢'][Math.floor(Math.random() * 3)]
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 2000);
  };

  const determineWinner = (choice1, choice2) => {
    if (choice1 === choice2) return 'tie';
    if (
      (choice1 === "piedra" && choice2 === "tijera") ||
      (choice1 === "papel" && choice2 === "piedra") ||
      (choice1 === "tijera" && choice2 === "papel")
    ) {
      return 'player1';
    }
    return 'player2';
  };

  // Modo vs CPU
  const playVsCPU = (choice) => {
    if (gameOver) return;

    const currentPlayer = players[0];
    setPlayerChoice(choice);
    setShowBattle(true);
    setCpuChoice(null);

    setTimeout(() => {
      const cpu = cpuChoose(currentPlayer);
      setCpuChoice(cpu);

      const newHistory = { ...history };
      if (!newHistory[currentPlayer]) {
        newHistory[currentPlayer] = { piedra: 0, papel: 0, tijera: 0 };
      }
      newHistory[currentPlayer][choice]++;
      setHistory(newHistory);
      setRoundsPlayed(prev => prev + 1);

      const winner = determineWinner(choice, cpu);
      let resultText = "";
      let color = "#ffd700";
      let isWin = false;

      if (winner === 'tie') {
        resultText = "¡Empate! 🤝";
        color = "#ffcc00";
      } else if (winner === 'player1') {
        resultText = "¡Ganaste esta ronda! 🏆";
        color = "#00ff00";
        isWin = true;
        createParticles(true);
        const newScore = (playerScores[currentPlayer] || 0) + 1;
        setPlayerScores({ ...playerScores, [currentPlayer]: newScore });
        
        if (newScore === goal) {
          setResult(`🎉 ¡${currentPlayer} GANÓ LA PARTIDA! 🎉`);
          setResultColor("#00ff00");
          setGameOver(true);
        }
      } else {
        resultText = "CPU ganó esta ronda 💀";
        color = "#ff3333";
        createParticles(false);
        const newScore = cpuScore + 1;
        setCpuScore(newScore);
        
        if (newScore === goal) {
          setResult("💀 LA CPU GANÓ LA PARTIDA 💀");
          setResultColor("#ff3333");
          setGameOver(true);
        }
      }

      if (!gameOver) {
        setResult(resultText);
        setResultColor(color);
      }

      setTimeout(() => setShowBattle(false), 1500);
    }, 1000);
  };

  // Modo Multijugador
  const playMultiplayer = (choice) => {
    if (gameOver || waitingForChoice) return;

    const currentPlayer = players[currentPlayerIndex];
    const newChoices = { ...multiPlayerChoices, [currentPlayer]: choice };
    setMultiPlayerChoices(newChoices);

    // Actualizar historial
    const newHistory = { ...history };
    if (!newHistory[currentPlayer]) {
      newHistory[currentPlayer] = { piedra: 0, papel: 0, tijera: 0 };
    }
    newHistory[currentPlayer][choice]++;
    setHistory(newHistory);

    // Si es el último jugador
    if (currentPlayerIndex === players.length - 1) {
      setWaitingForChoice(true);
      setShowVsScreen(true);
      
      setTimeout(() => {
        processMultiplayerRound(newChoices);
      }, 1500);
    } else {
      // Siguiente jugador
      setCurrentPlayerIndex(prev => prev + 1);
      setShowVsScreen(true);
      setTimeout(() => setShowVsScreen(false), 1500);
    }
  };

  const processMultiplayerRound = (choices) => {
    setRoundsPlayed(prev => prev + 1);
    const playerChoicesArray = players.map(p => ({ name: p, choice: choices[p] }));
    
    // Determinar ganador entre todos
    let winners = [];
    const choiceTypes = [...new Set(Object.values(choices))];
    
    if (choiceTypes.length === 1) {
      setResult("¡EMPATE TOTAL! 🤝");
      setResultColor("#ffcc00");
      setRoundWinner(null);
    } else if (choiceTypes.length === 3) {
      setResult("¡EMPATE! Todos eligieron diferente 🤷");
      setResultColor("#ffcc00");
      setRoundWinner(null);
    } else {
      // Determinar qué elección gana
      let winningChoice = null;
      if (choiceTypes.includes("piedra") && choiceTypes.includes("tijera")) {
        winningChoice = "piedra";
      } else if (choiceTypes.includes("papel") && choiceTypes.includes("piedra")) {
        winningChoice = "papel";
      } else if (choiceTypes.includes("tijera") && choiceTypes.includes("papel")) {
        winningChoice = "tijera";
      }

      winners = players.filter(p => choices[p] === winningChoice);
      
      if (winners.length === 1) {
        const winner = winners[0];
        setRoundWinner(winner);
        createParticles(true);
        
        const newScores = { ...playerScores };
        newScores[winner] = (newScores[winner] || 0) + 1;
        setPlayerScores(newScores);

        if (newScores[winner] === goal) {
          setResult(`🎉 ¡${winner} GANÓ LA PARTIDA! 🎉`);
          setResultColor("#00ff00");
          setGameOver(true);
        } else {
          setResult(`¡${winner} ganó esta ronda! 🏆`);
          setResultColor("#00ff00");
        }
      } else {
        setResult(`¡${winners.join(' y ')} empataron! 🤝`);
        setResultColor("#ffcc00");
        setRoundWinner(null);
      }
    }

    setShowResults(true);
    
    setTimeout(() => {
      setShowResults(false);
      setShowVsScreen(false);
      setWaitingForChoice(false);
      setMultiPlayerChoices({});
      setCurrentPlayerIndex(0);
      setRoundWinner(null);
    }, 3000);
  };

  const startGame = (mode, numPlayers = 1) => {
    setGameMode(mode);
    const playerNames = [];
    
    if (mode === 'cpu') {
      playerNames.push('Jugador 1');
    } else {
      for (let i = 1; i <= numPlayers; i++) {
        playerNames.push(`Jugador ${i}`);
      }
    }
    
    setPlayers(playerNames);
    const initialScores = {};
    const initialHistory = {};
    playerNames.forEach(name => {
      initialScores[name] = 0;
      initialHistory[name] = { piedra: 0, papel: 0, tijera: 0 };
    });
    setPlayerScores(initialScores);
    setHistory(initialHistory);
    setResult(mode === 'cpu' ? '¡Buena suerte! 🍀' : '¡Que comience la batalla! ⚔️');
  };

  const resetGame = () => {
    setGameMode(null);
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setPlayerScores({});
    setCpuScore(0);
    setHistory({});
    setRoundsPlayed(0);
    setCpuChoice(null);
    setPlayerChoice(null);
    setResult("");
    setGameOver(false);
    setResultColor("#ffd700");
    setShowBattle(false);
    setParticles([]);
    setShowVsScreen(false);
    setWaitingForChoice(false);
    setMultiPlayerChoices({});
    setShowResults(false);
    setRoundWinner(null);
  };

  const changeGoal = (newGoal) => {
    setGoal(newGoal);
    if (gameMode) {
      const initialScores = {};
      players.forEach(name => {
        initialScores[name] = 0;
      });
      setPlayerScores(initialScores);
      setCpuScore(0);
      setGameOver(false);
      setResult(gameMode === 'cpu' ? '¡Buena suerte! 🍀' : '¡Que comience la batalla! ⚔️');
    }
  };

  // Pantalla de selección de modo
  if (!gameMode) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>

        <div style={{
          maxWidth: '600px',
          width: '100%',
          background: 'rgba(20, 20, 40, 0.95)',
          borderRadius: '30px',
          padding: '50px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{
            textAlign: 'center',
            background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '42px',
            fontWeight: '900',
            marginBottom: '20px',
            animation: 'float 3s ease-in-out infinite'
          }}>
            ⚔️ PIEDRA PAPEL TIJERA ⚔️
          </h1>

          <p style={{
            textAlign: 'center',
            color: '#aaa',
            fontSize: '18px',
            marginBottom: '40px'
          }}>
            Selecciona el modo de juego
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <button
              onClick={() => startGame('cpu')}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '20px',
                padding: '30px',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }}
            >
              <Cpu size={32} />
              <div>
                <div>VS CPU</div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>Juega contra la computadora</div>
              </div>
            </button>

            <div style={{ color: '#666', textAlign: 'center', fontSize: '14px' }}>
              MODO MULTIJUGADOR
            </div>

            {[2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => startGame('multi', num)}
                style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '25px',
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '15px',
                  boxShadow: '0 10px 30px rgba(240, 147, 251, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(240, 147, 251, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(240, 147, 251, 0.4)';
                }}
              >
                <Users size={28} />
                <div>
                  <div>{num} JUGADORES</div>
                  <div style={{ fontSize: '13px', opacity: 0.8 }}>Todos en el mismo dispositivo</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlayer = players[currentPlayerIndex];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
        }
        @keyframes slideIn {
          from {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Partículas */}
      {particles.map(particle => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: `${particle.left}%`,
            top: '-20px',
            fontSize: '30px',
            animation: `fall 2s ease-in forwards`,
            animationDelay: `${particle.delay}s`,
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          {particle.emoji}
        </div>
      ))}

      {/* Pantalla VS entre turnos */}
      {showVsScreen && !showResults && gameMode === 'multi' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s'
        }}>
          <div style={{
            fontSize: '60px',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            {waitingForChoice ? (
              <div>
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
                <div>Procesando ronda...</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '40px', marginBottom: '20px', color: '#ffd700' }}>
                  {currentPlayerIndex > 0 ? '✓' : '🎮'}
                </div>
                <div>Turno de</div>
                <div style={{ 
                  background: playerColors[currentPlayerIndex % playerColors.length],
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginTop: '10px'
                }}>
                  {currentPlayer}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pantalla de resultados multijugador */}
      {showResults && gameMode === 'multi' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.95)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'fadeIn 0.3s',
          padding: '20px'
        }}>
          <div style={{
            fontSize: '40px',
            color: resultColor,
            fontWeight: 'bold',
            marginBottom: '40px',
            textAlign: 'center',
            textShadow: `0 0 30px ${resultColor}`
          }}>
            {result}
          </div>

          <div style={{
            display: 'flex',
            gap: '30px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {players.map((player, idx) => (
              <div key={player} style={{
                textAlign: 'center',
                padding: '20px',
                background: player === roundWinner 
                  ? 'rgba(0, 255, 0, 0.2)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '15px',
                border: player === roundWinner 
                  ? '3px solid #00ff00' 
                  : '2px solid rgba(255, 255, 255, 0.1)',
                minWidth: '120px'
              }}>
                <div style={{ 
                  color: 'white', 
                  fontSize: '18px', 
                  marginBottom: '10px',
                  fontWeight: 'bold'
                }}>
                  {player}
                </div>
                <div style={{ fontSize: '60px' }}>
                  {emojis[multiPlayerChoices[player]]}
                </div>
                {player === roundWinner && (
                  <div style={{ 
                    color: '#ffd700', 
                    marginTop: '10px',
                    fontSize: '24px'
                  }}>
                    👑
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'rgba(20, 20, 40, 0.9)',
        borderRadius: '30px',
        padding: '40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          textAlign: 'center',
          background: 'linear-gradient(45deg, #ff006e, #8338ec, #3a86ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '32px',
          fontWeight: '900',
          marginBottom: '20px'
        }}>
          ⚔️ PIEDRA PAPEL TIJERA ⚔️
        </h1>

        {/* Indicador de turno en multijugador */}
        {gameMode === 'multi' && !waitingForChoice && !gameOver && (
          <div style={{
            textAlign: 'center',
            padding: '15px',
            background: playerColors[currentPlayerIndex % playerColors.length],
            borderRadius: '15px',
            marginBottom: '20px',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.3)'
          }}>
            🎮 Turno de: {currentPlayer}
          </div>
        )}

        {/* Marcadores */}
        {gameMode === 'cpu' ? (
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '30px',
            gap: '20px'
          }}>
            <div style={{
              flex: 1,
              background: playerColors[0],
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
                {players[0]} 👤
              </div>
              <div style={{ color: '#fff', fontSize: '48px', fontWeight: 'bold' }}>
                {playerScores[players[0]] || 0}
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '60px'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '15px',
                padding: '10px 15px',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '20px'
              }}>
                VS
              </div>
            </div>

            <div style={{
              flex: 1,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '20px',
              padding: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(240, 147, 251, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{ color: '#fff', fontSize: '14px', marginBottom: '10px' }}>
                CPU 🤖
              </div>
              <div style={{ color: '#fff', fontSize: '48px', fontWeight: 'bold' }}>
                {cpuScore}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: players.length <= 2 ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gap: '15px',
            marginBottom: '30px'
          }}>
            {players.map((player, idx) => (
              <div key={player} style={{
                background: playerColors[idx % playerColors.length],
                borderRadius: '15px',
                padding: '15px',
                textAlign: 'center',
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
                border: player === currentPlayer && !waitingForChoice && !gameOver
                  ? '3px solid #ffd700' 
                  : '2px solid rgba(255, 255, 255, 0.2)',
                animation: player === currentPlayer && !waitingForChoice && !gameOver
                  ? 'glow 2s infinite'
                  : 'none'
              }}>
                <div style={{ color: '#fff', fontSize: '13px', marginBottom: '8px' }}>
                  {player} {multiPlayerChoices[player] ? '✓' : ''}
                </div>
                <div style={{ color: '#fff', fontSize: '36px', fontWeight: 'bold' }}>
                  {playerScores[player] || 0}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Meta y estadísticas */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          padding: '15px',
          marginBottom: '25px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="#ffd700" />
              <span style={{ fontSize: '14px' }}>Meta: <strong>{goal}</strong> puntos</span>
            </div>
            {gameMode === 'cpu' && (
              <div style={{ color: '#aaa', fontSize: '13px' }}>
                📊 {players[0]}: 🪨{history[players[0]]?.piedra || 0} 📄{history[players[0]]?.papel || 0} ✂️{history[players[0]]?.tijera || 0}
              </div>
            )}
          </div>
        </div>

        {/* Arena de batalla (solo vs CPU) */}
        {showBattle && gameMode === 'cpu' && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '20px',
            padding: '30px',
            marginBottom: '25px',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            border: '2px solid rgba(255, 215, 0, 0.3)',
            animation: 'shake 0.5s'
          }}>
            <div style={{ 
              fontSize: '80px', 
              animation: 'slideIn 0.5s ease-out',
              filter: 'drop-shadow(0 0 10px rgba(102, 126, 234, 0.8))'
            }}>
              {emojis[playerChoice]}
            </div>
            <Zap size={40} color="#ffd700" style={{ animation: 'pulse 0.5s infinite' }} />
            <div style={{ 
              fontSize: '80px',
              animation: cpuChoice ? 'slideIn 0.5s ease-out' : 'none',
              filter: 'drop-shadow(0 0 10px rgba(245, 87, 108, 0.8))'
            }}>
              {cpuChoice ? emojis[cpuChoice] : '❓'}
            </div>
          </div>
        )}

        {/* Botones de juego */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {[
            { name: 'piedra', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', shadow: 'rgba(102, 126, 234, 0.4)' },
            { name: 'papel', gradient: 'linear-gradient(135deg, #2af598 0%, #009efd 100%)', shadow: 'rgba(42, 245, 152, 0.4)' },
            { name: 'tijera', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', shadow: 'rgba(250, 112, 154, 0.4)' }
          ].map((option) => (
            <button
              key={option.name}
              onClick={() => gameMode === 'cpu' ? playVsCPU(option.name) : playMultiplayer(option.name)}
              disabled={gameOver || (gameMode === 'cpu' && showBattle) || (gameMode === 'multi' && waitingForChoice)}
              style={{
                height: '140px',
                background: (gameOver || showBattle || waitingForChoice) ? 'rgba(100, 100, 100, 0.3)' : option.gradient,
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: (gameOver || showBattle || waitingForChoice) ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                opacity: (gameOver || showBattle || waitingForChoice) ? 0.4 : 1,
                boxShadow: (gameOver || showBattle || waitingForChoice) ? 'none' : `0 8px 30px ${option.shadow}`,
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!gameOver && !showBattle && !waitingForChoice) {
                  e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 12px 40px ${option.shadow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!gameOver && !showBattle && !waitingForChoice) {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = `0 8px 30px ${option.shadow}`;
                }
              }}
            >
              <span style={{ fontSize: '50px', position: 'relative' }}>{emojis[option.name]}</span>
              <span style={{ textTransform: 'uppercase', letterSpacing: '1px', position: 'relative' }}>
                {option.name}
              </span>
            </button>
          ))}
        </div>

        {/* Resultado */}
        <div style={{
          textAlign: 'center',
          padding: '25px',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '20px',
          marginBottom: '25px',
          minHeight: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            color: resultColor,
            fontSize: gameOver ? '28px' : '22px',
            fontWeight: 'bold',
            textShadow: `0 0 20px ${resultColor}`,
            animation: gameOver ? 'pulse 1s infinite' : 'none'
          }}>
            {result}
          </div>
        </div>

        {/* Meta selector */}
        <div style={{ marginBottom: '25px' }}>
          <div style={{ 
            color: 'white', 
            fontSize: '16px', 
            marginBottom: '15px',
            textAlign: 'center',
            fontWeight: '600',
            letterSpacing: '1px'
          }}>
            🎯 META DE PUNTOS
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
            {[3, 5, 10].map((g) => (
              <button
                key={g}
                onClick={() => changeGoal(g)}
                style={{
                  width: '80px',
                  height: '60px',
                  background: goal === g 
                    ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' 
                    : 'rgba(255, 255, 255, 0.1)',
                  border: goal === g ? '3px solid #ffd700' : '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '15px',
                  color: goal === g ? '#000' : '#fff',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: goal === g ? '0 8px 25px rgba(255, 215, 0, 0.5)' : 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Botones de control */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button
            onClick={resetGame}
            style={{
              background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              padding: '18px 40px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 8px 30px rgba(245, 87, 108, 0.4)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(245, 87, 108, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(245, 87, 108, 0.4)';
            }}
          >
            <RotateCcw size={22} />
            {gameOver ? 'Nueva Partida' : 'Cambiar Modo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RockPaperScissors;