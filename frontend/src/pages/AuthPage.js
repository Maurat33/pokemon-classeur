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
    <div className="min-h-screen flex flex-col relative">
      {/* Header */}
      <header className="header-gradient text-center py-8 border-b-4 border-[#1a1a2e] relative z-10">
        <motion.h1 
          className="text-4xl md:text-5xl text-white font-bold flex items-center justify-center gap-4"
          style={{ fontFamily: "'Fredoka One', cursive", textShadow: '3px 3px 0 #1a1a2e' }}
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <Pokeball />
          Mon Classeur Pokémon
          <Pokeball />
        </motion.h1>
        <p className="text-white/90 mt-2 font-semibold">
          ✨ Scanne tes cartes • Trouve les prix • Suis ta collection !
        </p>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-pokemon p-8 w-full max-w-md"
        >
          {/* Toggle */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 btn-pokemon ${isLogin ? 'active' : 'btn-pokemon-outline'}`}
              data-testid="login-tab"
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 btn-pokemon ${!isLogin ? 'active' : 'btn-pokemon-outline'}`}
              data-testid="register-tab"
            >
              Inscription
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block font-bold text-gray-700 mb-1">👤 Nom</label>
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
              <label className="block font-bold text-gray-700 mb-1">📧 Email</label>
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
              <label className="block font-bold text-gray-700 mb-1">🔒 Mot de passe</label>
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-2 rounded-xl text-sm font-semibold"
                data-testid="auth-error"
              >
                ❌ {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-pokemon text-lg"
              data-testid="auth-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
                  Chargement...
                </span>
              ) : isLogin ? '🚀 Se connecter' : '✨ Créer mon compte'}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
}
