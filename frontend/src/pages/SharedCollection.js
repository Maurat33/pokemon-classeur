import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, TrendingUp, Zap, Sparkles, ExternalLink } from 'lucide-react';
import { getSharedCollection } from '../services/api';

export default function SharedCollection() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCollection = async () => {
      try {
        const result = await getSharedCollection(token);
        setData(result);
      } catch (err) {
        setError('Collection non trouvée');
      } finally {
        setLoading(false);
      }
    };
    loadCollection();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package size={64} className="mx-auto text-gray-600 mb-4" />
          <h2 className="font-heading text-2xl text-gray-400">{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center">
          <motion.div 
            className="inline-flex items-center gap-2 mb-2"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="w-6 h-6 text-accent-tertiary" />
            <span className="text-gray-400">Collection de</span>
            <Sparkles className="w-6 h-6 text-accent-tertiary" />
          </motion.div>
          <h1 className="font-heading text-4xl font-bold holographic-text">
            {data.collector_name}
          </h1>
        </div>
      </header>

      {/* Stats */}
      <div className="bg-background-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated border border-border">
              <Package className="text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Cartes</div>
                <div className="font-heading font-bold text-xl">{data.stats.total_cards}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30">
              <TrendingUp className="text-accent-tertiary" />
              <div>
                <div className="text-xs text-gray-500">Valeur totale</div>
                <div className="font-heading font-bold text-xl text-accent-tertiary">{data.stats.total_value.toFixed(2)}€</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background-elevated border border-border">
              <Zap className="text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Pokemon</div>
                <div className="font-heading font-bold text-xl">{data.stats.unique_pokemon}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.cards.map((card, index) => (
            <motion.div
              key={card._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-3d"
            >
              <div className="bg-background-surface border border-border rounded-2xl overflow-hidden hover:border-accent-primary/50 transition-colors">
                <div className="relative aspect-[2/3] bg-background-elevated">
                  <img 
                    src={card.image_url} 
                    alt={card.card_name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {card.quantity > 1 && (
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold">
                      x{card.quantity}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate">{card.pokemon_name}</h3>
                  <p className="text-xs text-gray-500 truncate">{card.set_name}</p>
                  <div className="mt-2 inline-block bg-accent-tertiary/20 text-accent-tertiary px-2 py-1 rounded-lg text-sm font-bold">
                    {card.price.toFixed(2)}€
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Footer CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <a
          href="/"
          className="holographic text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 shadow-lg hover:opacity-90 transition-opacity"
        >
          <Sparkles size={18} />
          Créer mon classeur
          <ExternalLink size={18} />
        </a>
      </div>
    </div>
  );
}
