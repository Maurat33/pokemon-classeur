import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star, Trophy, Sparkles, Volume2, VolumeX } from 'lucide-react';
import axios from 'axios';
import confetti from 'canvas-confetti';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Confetti celebration
const celebrate = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#FFD700', '#FF007F', '#00F0FF', '#FF6B6B']
  });
};

// Sound effects (optional, can be muted)
const playSound = (type, muted) => {
  if (muted) return;
  // Sounds would be played here
};

export default function GamesPage({ onBack, isDark }) {
  const [selectedGame, setSelectedGame] = useState(null);
  const [profile, setProfile] = useState(null);
  const [soundMuted, setSoundMuted] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/user/profile`, { withCredentials: true });
      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleGameEnd = async (game, score, won) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/games/score`, 
        { game, score, won },
        { withCredentials: true }
      );
      
      if (won) {
        celebrate();
      }
      
      // Refresh profile
      loadProfile();
      
      return data;
    } catch (err) {
      console.error('Error saving score:', err);
      return null;
    }
  };

  const games = [
    { 
      id: 'memory', 
      name: 'Memory', 
      emoji: '🧠', 
      desc: 'Trouve les paires !',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'quiz', 
      name: 'Quiz Pokémon', 
      emoji: '❓', 
      desc: 'Qui est ce Pokémon ?',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'catch', 
      name: 'Attrape-les !', 
      emoji: '🎯', 
      desc: 'Clique vite !',
      color: 'from-orange-500 to-yellow-500'
    },
  ];

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="btn-pokemon btn-pokemon-outline flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Retour
          </button>
          
          <button
            onClick={() => setSoundMuted(!soundMuted)}
            className="btn-pokemon btn-pokemon-outline p-3"
          >
            {soundMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        <motion.div 
          className="text-center mb-8"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
        >
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            <span className="holographic-text">🎮 Zone de Jeux 🎮</span>
          </h1>
          
          {profile && (
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="stat-chip stat-chip-gold">
                <Star className="text-yellow-500" fill="currentColor" />
                <span className="font-bold text-xl" style={{ fontFamily: "'Fredoka One', cursive" }}>
                  {profile.stars} étoiles
                </span>
              </div>
              <div className="stat-chip">
                <Trophy className="text-purple-500" />
                <span className="font-bold">
                  {profile.badges?.length || 0} badges
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Game Selection or Active Game */}
      <AnimatePresence mode="wait">
        {!selectedGame ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto"
          >
            {/* Games Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {games.map((game, index) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedGame(game.id)}
                  className={`card-pokemon p-6 text-center hover:scale-105 transition-transform cursor-pointer`}
                >
                  <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-4xl shadow-lg`}>
                    {game.emoji}
                  </div>
                  <h3 
                    className="text-2xl font-bold mb-2"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    {game.name}
                  </h3>
                  <p className="text-muted-adaptive">{game.desc}</p>
                </motion.button>
              ))}
            </div>

            {/* Badges Section */}
            {profile?.badges && profile.badges.length > 0 && (
              <div className="card-pokemon p-6">
                <h3 
                  className="text-2xl font-bold mb-4 text-center"
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                >
                  🏅 Mes Badges
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  {profile.badges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl border border-yellow-500/30"
                    >
                      <div className="text-4xl mb-2">{badge.emoji}</div>
                      <div className="font-bold text-sm">{badge.name}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-4xl mx-auto"
          >
            {selectedGame === 'memory' && (
              <MemoryGame 
                onBack={() => setSelectedGame(null)} 
                onGameEnd={handleGameEnd}
                isDark={isDark}
              />
            )}
            {selectedGame === 'quiz' && (
              <QuizGame 
                onBack={() => setSelectedGame(null)} 
                onGameEnd={handleGameEnd}
                isDark={isDark}
              />
            )}
            {selectedGame === 'catch' && (
              <CatchGame 
                onBack={() => setSelectedGame(null)} 
                onGameEnd={handleGameEnd}
                isDark={isDark}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ MEMORY GAME ============
function MemoryGame({ onBack, onGameEnd, isDark }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGame();
  }, []);

  const loadGame = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/games/memory`, { withCredentials: true });
      setCards(data.cards);
      setFlipped([]);
      setMatched([]);
      setMoves(0);
      setGameOver(false);
      setResult(null);
    } catch (err) {
      console.error('Error loading game:', err);
    }
    setLoading(false);
  };

  const handleCardClick = (cardId) => {
    if (flipped.length === 2 || flipped.includes(cardId) || matched.includes(cardId)) return;

    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      
      const [first, second] = newFlipped;
      const card1 = cards.find(c => c.id === first);
      const card2 = cards.find(c => c.id === second);

      if (card1.pairId === card2.pairId) {
        // Match!
        setMatched(m => [...m, first, second]);
        setFlipped([]);
        
        // Check win
        if (matched.length + 2 === cards.length) {
          handleWin();
        }
      } else {
        // No match, flip back
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const handleWin = async () => {
    setGameOver(true);
    const res = await onGameEnd('memory', moves, true);
    setResult(res);
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-bounce">🧠</div>
        <p className="text-xl">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-pokemon btn-pokemon-outline">
          <ArrowLeft size={20} className="inline mr-2" />
          Retour
        </button>
        <div className="stat-chip">
          <span className="font-bold">Coups: {moves}</span>
        </div>
        <button onClick={loadGame} className="btn-pokemon">
          🔄 Rejouer
        </button>
      </div>

      <h2 
        className="text-3xl font-bold text-center mb-6"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        🧠 Memory Pokémon
      </h2>

      {/* Game Grid */}
      <div className="grid grid-cols-4 gap-3 max-w-lg mx-auto mb-6">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.includes(card.id);
          const isMatched = matched.includes(card.id);
          
          return (
            <motion.div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`aspect-square rounded-xl cursor-pointer ${
                isMatched ? 'opacity-50' : ''
              }`}
              whileHover={{ scale: isFlipped ? 1 : 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className={`w-full h-full rounded-xl flex items-center justify-center text-4xl transition-all duration-300 ${
                  isFlipped 
                    ? 'bg-white border-2 border-yellow-400' 
                    : `bg-gradient-to-br from-purple-500 to-pink-500 border-2 ${isDark ? 'border-white/20' : 'border-gray-800'}`
                }`}
              >
                {isFlipped ? (
                  <img src={card.image} alt={card.pokemon} className="w-16 h-16" />
                ) : (
                  <span>❓</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Win Modal */}
      <AnimatePresence>
        {gameOver && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="card-pokemon p-8 text-center max-w-sm"
            >
              <div className="text-6xl mb-4">🎉</div>
              <h3 
                className="text-3xl font-bold mb-4 holographic-text"
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                BRAVO !
              </h3>
              <p className="text-xl mb-2">Tu as gagné en {moves} coups !</p>
              <div className="flex justify-center gap-2 mb-6">
                {[...Array(result.stars_earned)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 w-8 h-8" fill="currentColor" />
                ))}
              </div>
              <p className="text-lg mb-4">+{result.stars_earned} étoiles ⭐</p>
              
              {result.new_badges?.length > 0 && (
                <div className="mb-4 p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl">
                  <p className="font-bold">Nouveau badge !</p>
                  {result.new_badges.map(b => (
                    <div key={b.id} className="text-2xl mt-2">{b.emoji} {b.name}</div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <button onClick={loadGame} className="flex-1 btn-pokemon btn-pokemon-gold">
                  🔄 Rejouer
                </button>
                <button onClick={onBack} className="flex-1 btn-pokemon btn-pokemon-outline">
                  Retour
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============ QUIZ GAME ============
function QuizGame({ onBack, onGameEnd, isDark }) {
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    loadQuestion();
  }, []);

  const loadQuestion = async () => {
    setLoading(true);
    setAnswered(null);
    try {
      const { data } = await axios.get(`${API_URL}/api/games/quiz`, { withCredentials: true });
      setQuestion(data);
    } catch (err) {
      console.error('Error loading question:', err);
    }
    setLoading(false);
  };

  const handleAnswer = async (answer) => {
    if (answered) return;
    
    const isCorrect = answer === question.correct;
    setAnswered({ answer, isCorrect });
    
    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      
      // Save score
      const res = await onGameEnd('quiz', score + 1, true);
      
      // Auto next question after delay
      setTimeout(() => {
        loadQuestion();
      }, 1500);
    } else {
      setStreak(0);
      setTimeout(() => {
        setShowResult(true);
      }, 1500);
    }
  };

  const resetGame = () => {
    setScore(0);
    setStreak(0);
    setShowResult(false);
    loadQuestion();
  };

  if (loading && !question) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4 animate-bounce">❓</div>
        <p className="text-xl">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-pokemon btn-pokemon-outline">
          <ArrowLeft size={20} className="inline mr-2" />
          Retour
        </button>
        <div className="flex gap-4">
          <div className="stat-chip stat-chip-gold">
            <span className="font-bold">Score: {score}</span>
          </div>
          {streak > 1 && (
            <div className="stat-chip">
              <span className="font-bold">🔥 x{streak}</span>
            </div>
          )}
        </div>
      </div>

      <h2 
        className="text-3xl font-bold text-center mb-6"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        ❓ Qui est ce Pokémon ?
      </h2>

      {question && !showResult && (
        <div className="max-w-md mx-auto">
          {/* Pokemon Image */}
          <motion.div
            key={question.image}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card-pokemon p-8 mb-6 text-center"
          >
            <img 
              src={question.image} 
              alt="Pokemon mystère"
              className={`w-32 h-32 mx-auto ${!answered ? 'filter brightness-0' : ''}`}
              style={{ imageRendering: 'pixelated' }}
            />
          </motion.div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, index) => {
              let btnClass = 'btn-pokemon btn-pokemon-outline w-full py-4 text-lg';
              
              if (answered) {
                if (option === question.correct) {
                  btnClass = 'btn-pokemon w-full py-4 text-lg';
                  btnClass += ' !bg-green-500';
                } else if (option === answered.answer && !answered.isCorrect) {
                  btnClass = 'btn-pokemon w-full py-4 text-lg';
                  btnClass += ' !bg-red-500';
                }
              }
              
              return (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                  className={btnClass}
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                >
                  {option}
                </motion.button>
              );
            })}
          </div>

          {answered && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-center mt-6 text-4xl"
            >
              {answered.isCorrect ? '✅ Bravo !' : '❌ Raté !'}
            </motion.div>
          )}
        </div>
      )}

      {/* Game Over */}
      {showResult && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="card-pokemon p-8 text-center max-w-sm mx-auto"
        >
          <div className="text-6xl mb-4">{score >= 5 ? '🏆' : '💪'}</div>
          <h3 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            {score >= 5 ? 'Super !' : 'Bien joué !'}
          </h3>
          <p className="text-xl mb-6">Tu as trouvé {score} Pokémon !</p>
          <div className="flex gap-3">
            <button onClick={resetGame} className="flex-1 btn-pokemon btn-pokemon-gold">
              🔄 Rejouer
            </button>
            <button onClick={onBack} className="flex-1 btn-pokemon btn-pokemon-outline">
              Retour
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ============ CATCH GAME ============
function CatchGame({ onBack, onGameEnd, isDark }) {
  const [pokemon, setPokemon] = useState([]);
  const [activePokemon, setActivePokemon] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadGame();
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          endGame();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, gameOver]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawner = setInterval(() => {
      if (pokemon.length > 0 && activePokemon.length < 5) {
        const randomPoke = pokemon[Math.floor(Math.random() * pokemon.length)];
        const newActive = {
          ...randomPoke,
          id: Date.now() + Math.random(),
          x: Math.random() * 70 + 10,
          y: Math.random() * 60 + 20,
        };
        setActivePokemon(prev => [...prev, newActive]);
        
        // Remove after 2 seconds if not caught
        setTimeout(() => {
          setActivePokemon(prev => prev.filter(p => p.id !== newActive.id));
        }, 2000);
      }
    }, 800);

    return () => clearInterval(spawner);
  }, [gameStarted, gameOver, pokemon, activePokemon.length]);

  const loadGame = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/games/catch`, { withCredentials: true });
      setPokemon(data.pokemon);
      setTimeLeft(data.timeLimit);
    } catch (err) {
      console.error('Error loading game:', err);
    }
  };

  const startGame = () => {
    setGameStarted(true);
    setScore(0);
    setActivePokemon([]);
    setGameOver(false);
    setResult(null);
  };

  const catchPokemon = (pokeId) => {
    setActivePokemon(prev => prev.filter(p => p.id !== pokeId));
    setScore(s => s + 1);
  };

  const endGame = async () => {
    setGameOver(true);
    setGameStarted(false);
    const res = await onGameEnd('catch', score, score >= 5);
    setResult(res);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn-pokemon btn-pokemon-outline">
          <ArrowLeft size={20} className="inline mr-2" />
          Retour
        </button>
        {gameStarted && (
          <div className="flex gap-4">
            <div className={`stat-chip ${timeLeft <= 10 ? 'stat-chip-gold animate-pulse' : ''}`}>
              <span className="font-bold">⏱️ {timeLeft}s</span>
            </div>
            <div className="stat-chip stat-chip-gold">
              <span className="font-bold">🎯 {score}</span>
            </div>
          </div>
        )}
      </div>

      <h2 
        className="text-3xl font-bold text-center mb-6"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        🎯 Attrape-les tous !
      </h2>

      {!gameStarted && !gameOver && (
        <div className="card-pokemon p-8 text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">🎮</div>
          <p className="text-xl mb-6">
            Clique sur les Pokémon avant qu'ils disparaissent !
          </p>
          <button onClick={startGame} className="btn-pokemon btn-pokemon-gold text-xl">
            🚀 Commencer !
          </button>
        </div>
      )}

      {gameStarted && !gameOver && (
        <div 
          className="card-pokemon relative overflow-hidden"
          style={{ height: '400px' }}
        >
          {activePokemon.map((poke) => (
            <motion.button
              key={poke.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => catchPokemon(poke.id)}
              className="absolute w-16 h-16 cursor-pointer hover:scale-125 transition-transform"
              style={{ 
                left: `${poke.x}%`, 
                top: `${poke.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.8 }}
            >
              <img 
                src={poke.image} 
                alt={poke.name}
                className="w-full h-full"
                style={{ imageRendering: 'pixelated' }}
              />
            </motion.button>
          ))}
          
          {activePokemon.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-2xl text-gray-400">
              Attends les Pokémon...
            </div>
          )}
        </div>
      )}

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="card-pokemon p-8 text-center max-w-sm"
            >
              <div className="text-6xl mb-4">{score >= 10 ? '🏆' : score >= 5 ? '🎉' : '💪'}</div>
              <h3 
                className="text-3xl font-bold mb-4"
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                {score >= 10 ? 'Incroyable !' : score >= 5 ? 'Super !' : 'Bien joué !'}
              </h3>
              <p className="text-xl mb-2">Tu as attrapé {score} Pokémon !</p>
              <div className="flex justify-center gap-2 mb-4">
                {[...Array(result.stars_earned)].map((_, i) => (
                  <Star key={i} className="text-yellow-400 w-8 h-8" fill="currentColor" />
                ))}
              </div>
              <p className="text-lg mb-6">+{result.stars_earned} étoiles ⭐</p>
              
              <div className="flex gap-3">
                <button onClick={startGame} className="flex-1 btn-pokemon btn-pokemon-gold">
                  🔄 Rejouer
                </button>
                <button onClick={onBack} className="flex-1 btn-pokemon btn-pokemon-outline">
                  Retour
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
