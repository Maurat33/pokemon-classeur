import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatApiError, forgotPassword, resetPassword } from '../services/api';

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

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false); // 'email', 'code', 'done'
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetHint, setResetHint] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

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

  const handleForgotSubmitEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(resetEmail);
      if (res.hint) setResetHint(res.hint);
      setForgotMode('code');
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(resetEmail, resetCode, newPassword);
      setResetSuccess(true);
      setForgotMode(false);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail) || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setForgotMode(false);
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setResetHint('');
    setError('');
    setResetSuccess(false);
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
        <AnimatePresence mode="wait">
          {/* Reset success message */}
          {resetSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-4"
            >
              <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
                Mot de passe modifié !
              </h3>
              <p className="text-gray-400 mb-6">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
              <button
                onClick={backToLogin}
                className="w-full btn-pokemon btn-pokemon-gold text-lg py-3"
                style={{ fontFamily: "'Fredoka One', cursive" }}
                data-testid="back-to-login-btn"
              >
                Se connecter
              </button>
            </motion.div>
          )}

          {/* Forgot Password - Email step */}
          {forgotMode === 'email' && !resetSuccess && (
            <motion.div
              key="forgot-email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={backToLogin}
                className="flex items-center gap-1 text-gray-400 hover:text-white mb-4 text-sm font-semibold transition-colors"
                data-testid="back-btn"
              >
                <ArrowLeft size={16} /> Retour
              </button>
              <h3 className="text-xl font-bold mb-2 holographic-text" style={{ fontFamily: "'Fredoka One', cursive" }}>
                Mot de passe oublié
              </h3>
              <p className="text-gray-400 text-sm mb-6">Entre ton adresse email pour recevoir un code de réinitialisation.</p>
              <form onSubmit={handleForgotSubmitEmail} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">📧 Email</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full input-pokemon"
                    placeholder="ton@email.com"
                    required
                    data-testid="forgot-email-input"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold">
                    ❌ {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-pokemon btn-pokemon-gold text-lg py-3"
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                  data-testid="forgot-submit-btn"
                >
                  {loading ? 'Envoi...' : 'Envoyer le code'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Forgot Password - Code + New password step */}
          {forgotMode === 'code' && !resetSuccess && (
            <motion.div
              key="forgot-code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button
                onClick={() => setForgotMode('email')}
                className="flex items-center gap-1 text-gray-400 hover:text-white mb-4 text-sm font-semibold transition-colors"
                data-testid="back-to-email-btn"
              >
                <ArrowLeft size={16} /> Retour
              </button>
              <h3 className="text-xl font-bold mb-2 holographic-text" style={{ fontFamily: "'Fredoka One', cursive" }}>
                Entre le code
              </h3>
              {resetHint && (
                <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-4 py-3 rounded-xl text-sm font-bold mb-4">
                  🔑 Ton code : <span className="text-xl tracking-widest">{resetHint}</span>
                </div>
              )}
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">🔑 Code</label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className="w-full input-pokemon text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                    data-testid="reset-code-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">🔒 Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full input-pokemon"
                    placeholder="Minimum 6 caractères"
                    minLength={6}
                    required
                    data-testid="new-password-input"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl text-sm font-semibold">
                    ❌ {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-pokemon btn-pokemon-gold text-lg py-3"
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                  data-testid="reset-submit-btn"
                >
                  {loading ? 'Modification...' : 'Changer le mot de passe'}
                </button>
              </form>
            </motion.div>
          )}

          {/* Normal Login/Register */}
          {!forgotMode && !resetSuccess && (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setForgotMode('email'); setError(''); }}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                    data-testid="forgot-password-link"
                  >
                    Mot de passe oublié ?
                  </button>
                )}

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
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
