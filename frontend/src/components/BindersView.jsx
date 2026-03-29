import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, FolderPlus } from 'lucide-react';

export function BindersView({ binders, cards, onCreateBinder, onSelectBinder, onDeleteBinder }) {
  const getBinderCardCount = (binderId) => cards.filter(c => c.binder_id === binderId).length;
  const getBinderValue = (binderId) => cards.filter(c => c.binder_id === binderId).reduce((sum, c) => sum + c.price * c.quantity, 0);
  const unassignedCount = cards.filter(c => !c.binder_id).length;

  return (
    <div className="card-pokemon p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 
          className="text-2xl font-bold holographic-text"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          📂 Mes Classeurs
        </h2>
        <button
          onClick={onCreateBinder}
          className="btn-pokemon btn-pokemon-gold text-sm"
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="create-binder-btn"
        >
          <FolderPlus size={16} className="inline mr-2" />
          Nouveau
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Unassigned cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onSelectBinder(null)}
          className="cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-cyan-500/30 transition-all hover:scale-[1.02]"
          data-testid="binder-unassigned"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-2xl mb-3 shadow-lg">
            📋
          </div>
          <h3 className="font-bold text-adaptive text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>Non classées</h3>
          <p className="text-sm text-muted-adaptive">{unassignedCount} carte{unassignedCount > 1 ? 's' : ''}</p>
        </motion.div>

        {binders.map((binder, index) => {
          const count = getBinderCardCount(binder._id);
          const value = getBinderValue(binder._id);
          return (
            <motion.div
              key={binder._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.05 }}
              className="relative cursor-pointer bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-yellow-500/30 transition-all hover:scale-[1.02] group"
              data-testid={`binder-${binder._id}`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onDeleteBinder(binder._id); }}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                data-testid={`delete-binder-${binder._id}`}
              >
                <Trash2 size={16} />
              </button>
              <div 
                onClick={() => onSelectBinder(binder._id)}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center text-2xl mb-3 shadow-lg"
                style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${binder.color} flex items-center justify-center text-2xl shadow-lg`}>
                  📂
                </div>
              </div>
              <div onClick={() => onSelectBinder(binder._id)}>
                <h3 className="font-bold text-adaptive text-lg" style={{ fontFamily: "'Fredoka One', cursive" }}>{binder.name}</h3>
                {binder.description && <p className="text-xs text-muted-adaptive mb-1">{binder.description}</p>}
                <p className="text-sm text-muted-adaptive">{count} carte{count > 1 ? 's' : ''} • {value.toFixed(2)}€</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function BinderCreateModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('from-purple-500 to-pink-500');

  const colorOptions = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-orange-500 to-yellow-500',
    'from-green-500 to-emerald-500',
    'from-red-500 to-pink-500',
    'from-indigo-500 to-purple-500',
  ];

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
        className="card-pokemon p-6 w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 holographic-text" style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="binder-modal-title"
        >
          📂 Nouveau Classeur
        </h2>
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du classeur..."
            className="w-full input-pokemon"
            maxLength={50}
            data-testid="binder-name-input"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optionnel)..."
            className="w-full input-pokemon"
            data-testid="binder-desc-input"
          />
          <div>
            <label className="text-xs font-bold text-gray-400 mb-2 block">Couleur</label>
            <div className="flex gap-2">
              {colorOptions.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full bg-gradient-to-br ${c} ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => name.trim() && onSuccess({ name: name.trim(), description, color })}
              disabled={!name.trim()}
              className="flex-1 btn-pokemon btn-pokemon-gold disabled:opacity-50"
              style={{ fontFamily: "'Fredoka One', cursive" }}
              data-testid="binder-create-submit"
            >
              Créer
            </button>
            <button onClick={onClose} className="flex-1 btn-pokemon btn-pokemon-outline">
              Annuler
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
