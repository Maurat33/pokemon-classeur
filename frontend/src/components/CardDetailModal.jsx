import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit3, TrendingUp, Folder } from 'lucide-react';
import { CONDITION_LABELS, TYPE_COLORS, TYPE_ICONS, TYPE_LABELS_FR } from './constants';

export default function CardDetailModal({ card, onClose, onDelete, onUpdatePrice, onUpdateBinder, isChild = false, binders = [] }) {
  const [editing, setEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(card.price.toString());
  const [currentBinder, setCurrentBinder] = useState(card.binder_id || '');

  const handleSavePrice = () => {
    onUpdatePrice(card._id, newPrice);
    setEditing(false);
  };

  const handleBinderChange = (binderId) => {
    const val = binderId || null;
    setCurrentBinder(binderId);
    onUpdateBinder(card._id, val);
  };

  const priceHistory = card.price_history || [];
  const hasHistory = priceHistory.length > 1;
  const prices = priceHistory.map(p => p.price);
  const maxPrice = Math.max(...prices, 0.01);
  const minPrice = Math.min(...prices, 0);
  const range = maxPrice - minPrice || 1;

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
        className="card-pokemon p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-xl font-bold holographic-text"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            {card.card_name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl" data-testid="close-detail-modal">✕</button>
        </div>

        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <img src={card.image_url} alt={card.card_name} className="w-32 rounded-xl border border-white/20" />
            {card.types && card.types.length > 0 && (
              <div className="flex gap-1 mt-2 justify-center">
                {card.types.map(t => (
                  <span key={t} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TYPE_COLORS[t] || 'bg-gray-500'} text-white`}>
                    {TYPE_ICONS[t] || ''} {TYPE_LABELS_FR[t] || t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Extension</div>
              <div className="font-semibold text-adaptive">{card.set_name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Condition</div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${CONDITION_LABELS[card.condition]?.bg}`}>
                {CONDITION_LABELS[card.condition]?.label || card.condition}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Quantité</div>
              <div className="font-semibold text-adaptive">{card.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Valeur</div>
              {editing && !isChild ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-20 input-pokemon text-sm py-1"
                    autoFocus
                    data-testid="edit-price-input"
                  />
                  <button onClick={handleSavePrice} className="btn-pokemon text-sm py-1 px-3" data-testid="save-price-btn">✓</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span 
                    className="text-2xl font-bold text-yellow-400"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    {card.price.toFixed(2)}€
                  </span>
                  {!isChild && (
                    <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-cyan-400" data-testid="edit-price-btn">
                      <Edit3 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Binder selector */}
        {!isChild && binders.length > 0 && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-xs text-gray-500 font-bold uppercase mb-2 flex items-center gap-1">
              <Folder size={12} /> Classeur
            </div>
            <select
              value={currentBinder}
              onChange={(e) => handleBinderChange(e.target.value)}
              className="w-full input-pokemon text-sm"
              data-testid="binder-select"
            >
              <option value="">Aucun classeur</option>
              {binders.map(b => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Price History Chart */}
        {hasHistory && (
          <div className="mt-4 p-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="text-xs text-gray-500 font-bold uppercase mb-3 flex items-center gap-1">
              <TrendingUp size={12} /> Historique des prix
            </div>
            <div className="h-24 flex items-end gap-1">
              {priceHistory.map((point, i) => {
                const height = ((point.price - minPrice) / range) * 100;
                const isLast = i === priceHistory.length - 1;
                return (
                  <div 
                    key={i} 
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                      {point.price.toFixed(2)}€
                      <br />
                      {new Date(point.date).toLocaleDateString('fr-FR')}
                    </div>
                    <div
                      className={`w-full rounded-t transition-all ${
                        isLast ? 'bg-gradient-to-t from-yellow-500 to-yellow-400' : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                      }`}
                      style={{ height: `${Math.max(height, 4)}%`, minHeight: '4px' }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500">
                {new Date(priceHistory[0]?.date).toLocaleDateString('fr-FR')}
              </span>
              <span className="text-[10px] text-gray-500">
                {new Date(priceHistory[priceHistory.length - 1]?.date).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {!isChild && (
            <button
              onClick={() => onDelete(card._id)}
              className="flex-1 btn-pokemon flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
              data-testid="delete-card-btn"
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          )}
          <button onClick={onClose} className={`${isChild ? 'w-full' : 'flex-1'} btn-pokemon btn-pokemon-outline`}>
            {isChild ? '👍 Super carte !' : 'Fermer'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
