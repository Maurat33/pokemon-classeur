import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../services/api';

// Pokeball component
const Pokeball = ({ size = 'normal' }) => (
  <div className={size === 'small' ? 'pokeball pokeball-small' : 'pokeball'} />
);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <motion.div 
        className="text-center mb-8 relative z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <div className="flex items-center justify-center gap-4 mb-4">
          <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Pokeball />
          </motion.div>
          <h1 
            className="text-4xl md:text-5xl font-bold holographic-text"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            Mon Classeur Pokémon
          </h1>
          <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
            <Pokeball />
          </motion.div>
        </div>
        <p className="text-gray-400">
          ✨ Scanne tes cartes • Trouve les prix • Suis ta collection !
        </p>
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-pokemon p-8 w-full max-w-md relative z-10"
      >
        {/* Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-full font-bold transition-all ${
              isLogin 
                ? 'btn-pokemon' 
                : 'btn-pokemon-outline'
            }`}
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="login-tab"
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-full font-bold transition-all ${
              !isLogin 
                ? 'btn-pokemon' 
                : 'btn-pokemon-outline'
            }`}
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="register-tab"
          >
            Inscription
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">👤 Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full input-pokemon"
                placeholder="Ton prénom"
                required={!isLogin}
                data-testid="name-input"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">📧 Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full input-pokemon"
              placeholder="ton@email.com"
              required
              data-testid="email-input"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">🔒 Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full input-pokemon pr-12"
                placeholder="••••••••"
                required
                minLength={6}
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold"
              data-testid="auth-error"
            >
              ❌ {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-pokemon btn-pokemon-gold text-lg py-4"
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="auth-submit"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-gray-800/30 border-t-gray-800 rounded-full animate-spin" />
                Chargement...
              </span>
            ) : isLogin ? '🚀 Se connecter' : '✨ Créer mon compte'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
