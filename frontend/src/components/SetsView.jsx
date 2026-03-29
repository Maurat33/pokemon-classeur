import React from 'react';
import { motion } from 'framer-motion';

export default function SetsView({ sets }) {
  return (
    <div className="card-pokemon p-6">
      <h2 
        className="text-2xl font-bold mb-6 holographic-text"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        📦 Mes Extensions
      </h2>
      {sets.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Aucune carte dans ta collection</p>
      ) : (
        <div className="space-y-4">
          {sets.map((set, index) => (
            <motion.div
              key={set.set_name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-lg font-bold text-white"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    {set.count}
                  </div>
                  <div>
                    <h3 className="font-bold text-adaptive">{set.set_name}</h3>
                    <p className="text-xs text-muted-adaptive">{set.count} carte{set.count > 1 ? 's' : ''} • {set.total_value.toFixed(2)}€</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {set.cards.slice(0, 8).map((card, i) => (
                  <img
                    key={i}
                    src={card.image_url}
                    alt={card.pokemon_name}
                    className="w-16 h-22 rounded-lg border border-white/10 object-contain flex-shrink-0"
                    loading="lazy"
                  />
                ))}
                {set.cards.length > 8 && (
                  <div className="w-16 h-22 rounded-lg border border-white/10 flex items-center justify-center text-sm font-bold text-gray-400 flex-shrink-0">
                    +{set.cards.length - 8}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
