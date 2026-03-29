import React from 'react';
import { motion } from 'framer-motion';
import { Folder } from 'lucide-react';
import { TYPE_COLORS, TYPE_ICONS, TYPE_LABELS_FR } from './constants';

export default function CollectionView({ 
  cards, loading, searchQuery, setSearchQuery, 
  filterCondition, setFilterCondition, sortBy, setSortBy,
  onCardClick, onAddClick, isChild = false,
  filterType, setFilterType, allTypes = [],
  binders = [], selectedBinder, setSelectedBinder
}) {
  return (
    <div className="card-pokemon p-6">
      <h2 
        className="text-2xl font-bold mb-4 flex items-center gap-2 holographic-text"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        📖 {isChild ? 'Mes Super Cartes' : 'Mon Classeur'}
      </h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Filtrer par nom..."
            className="w-full input-pokemon"
            data-testid="search-input"
          />
        </div>
        <button
          onClick={() => setSortBy('name')}
          className={`btn-pokemon text-sm py-2 px-4 ${sortBy === 'name' ? '' : 'btn-pokemon-outline'}`}
        >
          A-Z
        </button>
        <button
          onClick={() => setSortBy('price')}
          className={`btn-pokemon text-sm py-2 px-4 ${sortBy === 'price' ? '' : 'btn-pokemon-outline'}`}
        >
          💰 Prix
        </button>
        <button
          onClick={() => setSortBy('set')}
          className={`btn-pokemon text-sm py-2 px-4 ${sortBy === 'set' ? '' : 'btn-pokemon-outline'}`}
        >
          📦 Extension
        </button>
        <button
          onClick={() => setSortBy('date')}
          className={`btn-pokemon text-sm py-2 px-4 ${sortBy === 'date' ? '' : 'btn-pokemon-outline'}`}
        >
          🕐 Récent
        </button>
      </div>

      {/* Type filters */}
      {allTypes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterType('')}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
              !filterType ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            data-testid="filter-type-all"
          >
            Tous
          </button>
          {allTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? '' : type)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                filterType === type 
                  ? `${TYPE_COLORS[type] || 'bg-gray-500'} text-white shadow-lg` 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              data-testid={`filter-type-${type.toLowerCase()}`}
            >
              <span>{TYPE_ICONS[type] || '⚪'}</span>
              {TYPE_LABELS_FR[type] || type}
            </button>
          ))}
        </div>
      )}

      {/* Binder filter */}
      {!isChild && binders.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedBinder(null)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
              !selectedBinder ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
            data-testid="filter-binder-all"
          >
            <Folder size={12} /> Tous les classeurs
          </button>
          {binders.map(b => (
            <button
              key={b._id}
              onClick={() => setSelectedBinder(selectedBinder === b._id ? null : b._id)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1 ${
                selectedBinder === b._id 
                  ? 'bg-yellow-500/30 text-yellow-400 border border-yellow-500/50' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
              data-testid={`filter-binder-${b._id}`}
            >
              <Folder size={12} /> {b.name}
            </button>
          ))}
        </div>
      )}

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="rounded-2xl aspect-[2/3] shimmer" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">🎴</div>
          <h3 
            className="text-2xl font-bold text-gray-400 mb-2"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            {isChild ? 'Pas encore de cartes !' : 'Classeur vide !'}
          </h3>
          <p className="text-gray-500 mb-6">
            {isChild ? 'Demande à tes parents d\'ajouter tes cartes 🙏' : 'Ajoute ta première carte'}
          </p>
          {!isChild && (
            <button 
              onClick={onAddClick} 
              className="btn-pokemon btn-pokemon-gold"
              style={{ fontFamily: "'Fredoka One', cursive" }}
              data-testid="add-first-card"
            >
              + Ajouter une carte
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onCardClick(card)}
              className="card-3d cursor-pointer group"
              data-testid={`card-${card._id}`}
            >
              <div className="pokemon-card-item rounded-2xl overflow-hidden transition-all">
                <div className="relative aspect-[2/3]">
                  <img 
                    src={card.image_url} 
                    alt={card.card_name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                  {card.quantity > 1 && (
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-white">
                      x{card.quantity}
                    </div>
                  )}
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    card.condition === 'mint' ? 'bg-green-400 shadow-lg shadow-green-400/50' :
                    card.condition === 'exc' ? 'bg-blue-400 shadow-lg shadow-blue-400/50' :
                    card.condition === 'good' ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' : 
                    'bg-red-400 shadow-lg shadow-red-400/50'
                  }`} />
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-sm truncate text-adaptive">{card.pokemon_name}</h3>
                  <p className="text-xs text-muted-adaptive truncate">{card.set_name}</p>
                  <div className="mt-2 inline-block price-tag px-3 py-1 rounded-full text-sm font-bold">
                    {card.price.toFixed(2)}€
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
