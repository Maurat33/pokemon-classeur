import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import * as api from '../services/api';

const TYPE_COLORS = {
  Fire: 'bg-orange-500', Water: 'bg-blue-500', Grass: 'bg-green-500',
  Lightning: 'bg-yellow-500', Psychic: 'bg-purple-500', Fighting: 'bg-red-700',
  Darkness: 'bg-gray-800', Metal: 'bg-gray-500', Dragon: 'bg-indigo-600',
  Fairy: 'bg-pink-400', Colorless: 'bg-gray-400',
};

const TYPE_ICONS = {
  Fire: '🔥', Water: '💧', Grass: '🌿', Lightning: '⚡', Psychic: '🔮',
  Fighting: '👊', Darkness: '🌑', Metal: '⚙️', Dragon: '🐉',
  Fairy: '✨', Colorless: '⭐',
};

const TYPE_FR = {
  Fire: 'Feu', Water: 'Eau', Grass: 'Plante', Lightning: 'Electrique',
  Psychic: 'Psy', Fighting: 'Combat', Darkness: 'Tenebres', Metal: 'Metal',
  Dragon: 'Dragon', Fairy: 'Fee', Colorless: 'Incolore',
};

export default function VitrinePage() {
  const { token } = useParams();
  const [vitrine, setVitrine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getVitrine(token);
        setVitrine(data);
      } catch (err) {
        setError('Vitrine introuvable');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07070A] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !vitrine) {
    return (
      <div className="min-h-screen bg-[#07070A] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Fredoka One', cursive" }}>
            Vitrine introuvable
          </h1>
          <p className="text-gray-400">Le lien est peut-etre invalide ou expire.</p>
        </div>
      </div>
    );
  }

  const { cards, stats } = vitrine;
  const allTypes = Object.keys(stats.type_distribution || {}).sort();
  const filteredCards = filterType ? cards.filter(c => c.types?.includes(filterType)) : cards;

  return (
    <div className="min-h-screen bg-[#07070A] text-white">
      {/* Hero Header */}
      <div className="relative overflow-hidden py-12 px-4">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-48 bg-pink-500/10 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-96 h-48 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 w-64 h-32 bg-yellow-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-block bg-gradient-to-r from-pink-500/20 to-cyan-500/20 border border-white/10 rounded-2xl px-6 py-2 mb-4 backdrop-blur">
              <span className="text-sm font-bold text-gray-300">Vitrine de</span>
            </div>
            <h1 
              className="text-4xl md:text-5xl font-bold mb-2 holographic-text"
              style={{ fontFamily: "'Fredoka One', cursive" }}
              data-testid="vitrine-title"
            >
              {vitrine.title}
            </h1>
            <p className="text-gray-400 mb-6">{vitrine.collector_name}</p>
          </motion.div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur">
              <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Fredoka One', cursive" }}>
                {stats.total_cards}
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase">Cartes</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl px-6 py-3 backdrop-blur">
              <div className="text-2xl font-bold text-yellow-400" style={{ fontFamily: "'Fredoka One', cursive" }}>
                {stats.total_value.toFixed(2)}€
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase">Valeur</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-6 py-3 backdrop-blur">
              <div className="text-2xl font-bold text-cyan-400" style={{ fontFamily: "'Fredoka One', cursive" }}>
                {stats.unique_pokemon}
              </div>
              <div className="text-xs text-gray-400 font-bold uppercase">Pokemon</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {/* Type Distribution */}
        {allTypes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "'Fredoka One', cursive" }}>
              Repartition par type
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setFilterType('')}
                className={`text-sm font-bold px-4 py-2 rounded-full transition-all ${
                  !filterType ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                Tous ({cards.length})
              </button>
              {allTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(filterType === type ? '' : type)}
                  className={`text-sm font-bold px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                    filterType === type 
                      ? `${TYPE_COLORS[type] || 'bg-gray-500'} text-white shadow-lg` 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <span>{TYPE_ICONS[type] || ''}</span>
                  {TYPE_FR[type] || type} ({stats.type_distribution[type]})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Set Distribution */}
        {Object.keys(stats.set_distribution || {}).length > 0 && (
          <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Object.entries(stats.set_distribution).map(([setName, count]) => (
              <div key={setName} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-cyan-400" style={{ fontFamily: "'Fredoka One', cursive" }}>
                  {count}
                </div>
                <div className="text-xs text-gray-400 truncate">{setName}</div>
              </div>
            ))}
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCards.map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-pink-500/30 transition-all hover:scale-105"
            >
              <div className="relative aspect-[2/3]">
                <img
                  src={card.image_url}
                  alt={card.card_name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
                {card.quantity > 1 && (
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold">
                    x{card.quantity}
                  </div>
                )}
                {card.types && card.types.length > 0 && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {card.types.map(t => (
                      <span key={t} className={`w-5 h-5 rounded-full ${TYPE_COLORS[t] || 'bg-gray-500'} flex items-center justify-center text-[10px]`}>
                        {TYPE_ICONS[t]?.charAt(0) || '?'}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-bold text-sm truncate">{card.pokemon_name}</h3>
                <p className="text-xs text-gray-500 truncate">{card.set_name}</p>
                <div className="mt-2 inline-block bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 px-3 py-1 rounded-full text-sm font-bold text-yellow-400">
                  {card.price.toFixed(2)}€
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 py-6 border-t border-white/10">
          <p className="text-gray-500 text-sm">
            Pokemon Classeur &mdash; Collection partagee via Vitrine
          </p>
        </div>
      </div>
    </div>
  );
}
