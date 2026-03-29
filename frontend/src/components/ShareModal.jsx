import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

export function ShareModal({ link, onClose, onCopy }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="card-pokemon p-6 w-full max-w-md text-center"
      >
        <div className="text-5xl mb-4">🔗</div>
        <h2 
          className="text-2xl font-bold mb-2 holographic-text"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          Partager ma collection
        </h2>
        <p className="text-gray-400 mb-6">Partage ce lien avec tes amis !</p>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 input-pokemon text-sm"
          />
          <button 
            onClick={onCopy} 
            className="btn-pokemon"
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="copy-link-btn"
          >
            📋 Copier
          </button>
        </div>
        
        <button
          onClick={() => window.open(link, '_blank')}
          className="w-full btn-pokemon btn-pokemon-outline flex items-center justify-center gap-2"
        >
          <ExternalLink size={18} />
          Ouvrir le lien
        </button>
      </motion.div>
    </motion.div>
  );
}

export function VitrineModal({ link, onClose }) {
  const copyLink = () => {
    navigator.clipboard.writeText(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="card-pokemon p-6 w-full max-w-md text-center"
      >
        <div className="text-5xl mb-4">🏛️</div>
        <h2 className="text-2xl font-bold mb-2 holographic-text" style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="vitrine-modal-title"
        >
          Ma Vitrine
        </h2>
        <p className="text-gray-400 mb-6">Partage ta vitrine avec le monde !</p>
        <div className="flex gap-2 mb-6">
          <input type="text" value={link} readOnly className="flex-1 input-pokemon text-sm" data-testid="vitrine-link-input" />
          <button onClick={copyLink} className="btn-pokemon" style={{ fontFamily: "'Fredoka One', cursive" }} data-testid="copy-vitrine-link">
            📋 Copier
          </button>
        </div>
        <button
          onClick={() => window.open(link, '_blank')}
          className="w-full btn-pokemon btn-pokemon-outline flex items-center justify-center gap-2"
          data-testid="open-vitrine-btn"
        >
          <ExternalLink size={18} />
          Voir ma vitrine
        </button>
      </motion.div>
    </motion.div>
  );
}
