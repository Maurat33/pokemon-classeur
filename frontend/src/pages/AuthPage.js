import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatApiError } from '../services/api';

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(https://static.prod-images.emergentagent.com/jobs/4706d658-0f8c-4a63-a8e4-cbe9ff9f7e2b/images/53c61e7560f0d057fd16027151647b3e45504b42bc5a8dd420dd156f094e0385.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Floating cards image */}
      <motion.div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 opacity-30 hidden lg:block"
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <img 
          src="https://static.prod-images.emergentagent.com/jobs/4706d658-0f8c-4a63-a8e4-cbe9ff9f7e2b/images/51257735a2770312e5ee20f0124a58f0440ba4dee01a23b1206f9a41adf8831c.png"
          alt="Floating cards"
          className="w-full"
        />
      </motion.div>

      {/* Auth Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div 
            className="inline-flex items-center gap-2 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-8 h-8 text-accent-tertiary" />
            <h1 className="font-heading text-3xl font-bold holographic-text">
              Pokemon Classeur
            </h1>
            <Sparkles className="w-8 h-8 text-accent-tertiary" />
          </motion.div>
          <p className="text-gray-400">
            {isLogin ? 'Connectez-vous à votre collection' : 'Créez votre compte'}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex bg-background-surface rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              isLogin ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
            data-testid="login-tab"
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
              !isLogin ? 'bg-accent-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
            data-testid="register-tab"
          >
            Inscription
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-background-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-500"
                placeholder="Votre nom"
                required={!isLogin}
                data-testid="name-input"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-500"
              placeholder="vous@email.com"
              required
              data-testid="email-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Mot de passe</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background-surface border border-border rounded-xl px-4 py-3 text-white placeholder-gray-500 pr-12"
                placeholder="••••••••"
                required
                minLength={6}
                data-testid="password-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-sm"
              data-testid="auth-error"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full holographic text-white font-bold py-3 px-6 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
            data-testid="auth-submit"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Chargement...
              </span>
            ) : isLogin ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
