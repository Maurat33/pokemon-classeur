import React from 'react';

function StatCard({ emoji, title, value, sub, highlight }) {
  return (
    <div className={`p-4 rounded-2xl text-center border ${
      highlight 
        ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' 
        : 'bg-white/5 border-white/10'
    }`}>
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{title}</div>
      <div 
        className={`text-xl font-bold ${highlight ? 'text-yellow-400' : 'text-white'}`}
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        {value}
      </div>
      {sub && <div className="text-sm text-gray-500">{sub}</div>}
    </div>
  );
}

export default function StatsView({ stats, topCards }) {
  return (
    <div className="space-y-6">
      <div className="card-pokemon p-6">
        <h2 
          className="text-2xl font-bold mb-4 holographic-text"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          📊 Statistiques de ma collection
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard emoji="🎴" title="Total cartes" value={stats?.total_cards || 0} />
          <StatCard emoji="💰" title="Valeur totale" value={`${(stats?.total_value || 0).toFixed(2)}€`} highlight />
          <StatCard emoji="📈" title="Valeur moyenne" value={`${(stats?.avg_value || 0).toFixed(2)}€`} />
          <StatCard emoji="🏆" title="Carte la + chère" value={stats?.top_card?.name || '—'} sub={stats?.top_card?.price ? `${stats.top_card.price}€` : ''} />
          <StatCard emoji="✨" title="En parfait état" value={stats?.mint_count || 0} />
          <StatCard emoji="🎲" title="Pokémon différents" value={stats?.unique_pokemon || 0} />
        </div>
      </div>

      <div className="card-pokemon p-6">
        <h3 
          className="text-xl font-bold mb-4 holographic-text"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          🏅 Mes 5 cartes les plus précieuses
        </h3>
        <div className="space-y-3">
          {topCards.map((card, index) => (
            <div 
              key={card._id}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-3 hover:border-yellow-500/30 transition-colors"
            >
              <div 
                className={`text-2xl font-bold ${
                  index === 0 ? 'text-yellow-400' : 
                  index === 1 ? 'text-gray-400' : 
                  index === 2 ? 'text-orange-400' : 'text-gray-600'
                }`}
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                #{index + 1}
              </div>
              <img src={card.image_url} alt={card.card_name} className="w-12 h-16 object-contain rounded" />
              <div className="flex-1">
                <div className="font-bold">{card.pokemon_name}</div>
                <div className="text-sm text-gray-500">{card.set_name}</div>
              </div>
              <div 
                className="text-xl font-bold text-yellow-400"
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                {card.price.toFixed(2)}€
              </div>
            </div>
          ))}
          {topCards.length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucune carte dans ta collection</p>
          )}
        </div>
      </div>
    </div>
  );
}
