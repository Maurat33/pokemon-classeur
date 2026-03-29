import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, BarChart3, Share2, Download, LogOut, Camera, 
  X, Trash2, Edit3, ChevronDown, TrendingUp, Award, 
  Package, Zap, FileSpreadsheet, FileText, ExternalLink, Copy,
  CheckCircle, AlertCircle, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';
import { useDropzone } from 'react-dropzone';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CONDITION_LABELS = {
  mint: { label: '✨ Mint', bg: 'cond-mint' },
  exc: { label: '💙 Excellent', bg: 'cond-exc' },
  good: { label: '🟡 Bon état', bg: 'cond-good' },
  poor: { label: '🔴 Usée', bg: 'cond-poor' },
};

// Pokeball component
const Pokeball = ({ size = 'normal' }) => (
  <div className={size === 'small' ? 'pokeball pokeball-small' : 'pokeball'} />
);

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('collection');
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState(null);
  const [topCards, setTopCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cardsRes, statsRes, topRes] = await Promise.all([
        api.getCards(),
        api.getStats(),
        api.getTopCards(5)
      ]);
      setCards(cardsRes.cards || []);
      setStats(statsRes);
      setTopCards(topRes.cards || []);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteCard = async (cardId) => {
    try {
      await api.deleteCard(cardId);
      showToast('Carte supprimée ! 🗑️');
      loadData();
      setShowDetailModal(null);
    } catch (err) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdatePrice = async (cardId, newPrice) => {
    try {
      await api.updateCard(cardId, { price: parseFloat(newPrice) });
      showToast('Prix mis à jour ! 💰');
      loadData();
    } catch (err) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleShare = async () => {
    try {
      const { share_token } = await api.createShareLink();
      const link = `${window.location.origin}/share/${share_token}`;
      setShareLink(link);
      setShowShareModal(true);
    } catch (err) {
      showToast('Erreur lors du partage', 'error');
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    showToast('Lien copié ! 📋');
  };

  const handleExport = async (type) => {
    try {
      const url = type === 'pdf' ? api.exportPDF() : api.exportExcel();
      window.open(url, '_blank');
      showToast(`Export ${type.toUpperCase()} lancé ! 📥`);
    } catch (err) {
      showToast('Erreur lors de l\'export', 'error');
    }
  };

  // Filter and sort cards
  const filteredCards = cards
    .filter(card => {
      const matchesSearch = card.pokemon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           card.card_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCondition = !filterCondition || card.condition === filterCondition;
      return matchesSearch && matchesCondition;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.pokemon_name.localeCompare(b.pokemon_name);
      if (sortBy === 'price') return b.price - a.price;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`${isDark ? 'header-dark' : 'header-light'} py-6 px-4 relative`}>
        {/* Background glow - only in dark mode */}
        {isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-32 bg-pink-500/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-1/4 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
          </div>
        )}
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Theme toggle */}
          <div className="absolute right-0 top-0">
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                isDark 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-white/30 hover:bg-white/50 text-gray-800'
              }`}
              data-testid="theme-toggle"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              <span className="text-sm font-semibold hidden sm:inline">
                {isDark ? 'Clair' : 'Sombre'}
              </span>
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Pokeball />
            </motion.div>
            <h1 
              className={`text-3xl md:text-4xl font-bold ${isDark ? 'holographic-text' : 'text-white'}`}
              style={{ fontFamily: "'Fredoka One', cursive", textShadow: isDark ? 'none' : '2px 2px 0 #1a1a2e' }}
            >
              Mon Classeur Pokémon
            </h1>
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Pokeball />
            </motion.div>
          </div>
          <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-white/90'}`}>
            ✨ Scanne tes cartes • Trouve les prix • Suis ta collection !
          </p>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar py-4 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4">
          <StatChip icon={<Pokeball size="small" />} label="Cartes" value={stats?.total_cards || 0} isDark={isDark} />
          <StatChip icon={<Pokeball size="small" />} label="Pokémon" value={stats?.unique_pokemon || 0} isDark={isDark} />
          <StatChip 
            icon="💰" 
            label="Valeur totale" 
            value={`${(stats?.total_value || 0).toFixed(2)} €`}
            highlight 
            isDark={isDark}
          />
          <StatChip icon="⭐" label="Carte top" value={stats?.top_card?.name ? `${stats.top_card.price}€` : '—'} isDark={isDark} />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-wrap justify-center gap-3 py-6 px-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-pokemon btn-pokemon-gold"
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="nav-add"
        >
          📷 Ajouter une carte
        </button>
        <button
          onClick={() => setActiveTab('collection')}
          className={`btn-pokemon ${activeTab === 'collection' ? '' : 'btn-pokemon-outline'}`}
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="nav-collection"
        >
          📖 Mon Classeur
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`btn-pokemon ${activeTab === 'stats' ? '' : 'btn-pokemon-outline'}`}
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="nav-stats"
        >
          📊 Mes Stats
        </button>
      </nav>

      {/* Action buttons */}
      <div className="flex justify-center gap-3 mb-6 px-4">
        <button
          onClick={handleShare}
          className="btn-pokemon btn-pokemon-outline text-sm py-2 px-4"
          data-testid="share-btn"
        >
          <Share2 size={16} className="inline mr-2" />
          Partager
        </button>
        <div className="relative group">
          <button className="btn-pokemon btn-pokemon-outline text-sm py-2 px-4">
            <Download size={16} className="inline mr-2" />
            Exporter
            <ChevronDown size={14} className="inline ml-1" />
          </button>
          <div className="absolute left-0 top-full mt-2 card-pokemon overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 min-w-[120px]">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-white/5 font-semibold text-sm"
              data-testid="export-pdf"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-3 w-full text-left hover:bg-white/5 font-semibold text-sm"
              data-testid="export-excel"
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
          </div>
        </div>
        <button
          onClick={logout}
          className="btn-pokemon btn-pokemon-outline text-sm py-2 px-4"
          data-testid="logout-btn"
        >
          <LogOut size={16} className="inline mr-2" />
          {user?.name}
        </button>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pb-8">
        {activeTab === 'collection' && (
          <CollectionView 
            cards={filteredCards}
            loading={loading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterCondition={filterCondition}
            setFilterCondition={setFilterCondition}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onCardClick={setShowDetailModal}
            onAddClick={() => setShowAddModal(true)}
          />
        )}
        
        {activeTab === 'stats' && (
          <StatsView stats={stats} topCards={topCards} />
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddCardModal 
            onClose={() => setShowAddModal(false)} 
            onSuccess={() => {
              loadData();
              setShowAddModal(false);
              showToast('Carte ajoutée ! 🎉');
            }}
          />
        )}
        
        {showDetailModal && (
          <CardDetailModal 
            card={showDetailModal}
            onClose={() => setShowDetailModal(null)}
            onDelete={handleDeleteCard}
            onUpdatePrice={handleUpdatePrice}
          />
        )}
        
        {showShareModal && (
          <ShareModal 
            link={shareLink}
            onClose={() => setShowShareModal(false)}
            onCopy={copyShareLink}
          />
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center gap-2 font-bold shadow-lg z-50 ${
              toast.type === 'error' 
                ? 'bg-red-500 text-white' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-components
function StatChip({ icon, label, value, highlight, isDark = true }) {
  return (
    <div className={`stat-chip ${highlight ? 'stat-chip-gold' : ''}`}>
      <span className="text-xl">{typeof icon === 'string' ? icon : icon}</span>
      <div>
        <div className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{label}</div>
        <div 
          className={`font-bold text-lg ${highlight ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-800'}`}
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function CollectionView({ 
  cards, loading, searchQuery, setSearchQuery, 
  filterCondition, setFilterCondition, sortBy, setSortBy,
  onCardClick, onAddClick 
}) {
  return (
    <div className="card-pokemon p-6">
      <h2 
        className="text-2xl font-bold mb-4 flex items-center gap-2 holographic-text"
        style={{ fontFamily: "'Fredoka One', cursive" }}
      >
        📖 Mon Classeur
      </h2>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
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
          onClick={() => setSortBy('date')}
          className={`btn-pokemon text-sm py-2 px-4 ${sortBy === 'date' ? '' : 'btn-pokemon-outline'}`}
        >
          🕐 Récent
        </button>
      </div>

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
            Classeur vide !
          </h3>
          <p className="text-gray-500 mb-6">Ajoute ta première carte</p>
          <button 
            onClick={onAddClick} 
            className="btn-pokemon btn-pokemon-gold"
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="add-first-card"
          >
            + Ajouter une carte
          </button>
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

function StatsView({ stats, topCards }) {
  return (
    <div className="space-y-6">
      <div className="card-pokemon p-6">
        <h2 
          className="text-2xl font-bold mb-4 holographic-text"
          style={{ fontFamily: "'Fredoka One', cursive" }}
        >
          📊 Statistiques de ma collection
        </h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <StatCard emoji="🎴" title="Total cartes" value={stats?.total_cards || 0} />
          <StatCard emoji="💰" title="Valeur totale" value={`${(stats?.total_value || 0).toFixed(2)}€`} highlight />
          <StatCard emoji="📈" title="Valeur moyenne" value={`${(stats?.avg_value || 0).toFixed(2)}€`} />
          <StatCard emoji="🏆" title="Carte la + chère" value={stats?.top_card?.name || '—'} sub={stats?.top_card?.price ? `${stats.top_card.price}€` : ''} />
          <StatCard emoji="✨" title="En parfait état" value={stats?.mint_count || 0} />
          <StatCard emoji="🎲" title="Pokémon différents" value={stats?.unique_pokemon || 0} />
        </div>
      </div>

      {/* Top Cards */}
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

function AddCardModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [noResults, setNoResults] = useState(false);
  const [formData, setFormData] = useState({
    price: '',
    condition: 'good',
    quantity: 1
  });

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async () => {
      setUploadedImage(reader.result);
      setAnalyzing(true);
      
      try {
        const base64 = reader.result.split(',')[1];
        const analysis = await api.analyzeCard(base64);
        
        if (analysis.pokemon_name) {
          setSearchQuery(analysis.pokemon_name);
          handleSearch(analysis.pokemon_name);
        }
        if (analysis.condition) {
          setFormData(prev => ({ ...prev, condition: analysis.condition }));
        }
      } catch (err) {
        console.error('AI analysis failed:', err);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxFiles: 1
  });

  const handleSearch = async (query) => {
    if (!query || query.length < 2) return;
    setLoading(true);
    setNoResults(false);
    try {
      const { cards } = await api.searchPokemon(query);
      setSearchResults(cards || []);
      if (cards?.length > 0) {
        setStep(2);
      } else {
        setNoResults(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  const selectCard = (card) => {
    setSelectedCard(card);
    let price = 0;
    if (card.prices) {
      const priceKeys = ['holofoil', 'reverseHolofoil', 'normal', 'unlimited'];
      for (const key of priceKeys) {
        if (card.prices[key]?.market) {
          price = card.prices[key].market;
          break;
        }
      }
    }
    setFormData(prev => ({ ...prev, price: price.toFixed(2) }));
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedCard) return;
    setLoading(true);
    try {
      await api.createCard({
        pokemon_name: selectedCard.name,
        card_name: selectedCard.name,
        set_name: selectedCard.set,
        card_number: selectedCard.number,
        image_url: selectedCard.image_large || selectedCard.image,
        price: parseFloat(formData.price) || 0,
        condition: formData.condition,
        quantity: parseInt(formData.quantity) || 1,
        tcg_id: selectedCard.id,
        rarity: selectedCard.rarity
      });
      onSuccess();
    } catch (err) {
      console.error('Create card error:', err);
    } finally {
      setLoading(false);
    }
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
        className="card-pokemon p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-2xl font-bold holographic-text"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            {step === 1 && '📷 Ajouter une carte'}
            {step === 2 && '🔍 Sélectionner la carte'}
            {step === 3 && '✅ Confirmer l\'ajout'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl" data-testid="close-modal">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-gray-400 text-center">
              Prends en photo ta carte ou cherche son nom pour trouver la belle image officielle !
            </p>
            
            {/* Upload Zone */}
            <div
              {...getRootProps()}
              className={`upload-zone text-center ${isDragActive ? 'border-cyan-400 bg-cyan-400/10' : ''}`}
              data-testid="dropzone"
            >
              <input {...getInputProps()} />
              {uploadedImage ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={uploadedImage} alt="Preview" className="max-h-40 rounded-xl border border-white/20" />
                  {analyzing && (
                    <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                      <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
                      Analyse IA en cours...
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="text-5xl mb-3">📸</div>
                  <p className="text-cyan-400 font-bold text-lg">
                    {isDragActive ? 'Dépose la photo ici !' : 'Clique ou glisse une photo ici'}
                  </p>
                  <p className="text-gray-500 text-sm mt-2">JPG, PNG, WEBP acceptés</p>
                </>
              )}
            </div>

            {/* Manual Search */}
            <div className="card-pokemon p-6">
              <h3 
                className="text-xl font-bold mb-3 text-center holographic-text"
                style={{ fontFamily: "'Fredoka One', cursive" }}
              >
                🔍 Chercher la carte
              </h3>
              <p className="text-gray-500 text-center text-sm mb-4">
                Entre le nom du Pokémon (en anglais de préférence)
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setNoResults(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Ex: Charizard, Pikachu, Mewtwo..."
                  className="flex-1 input-pokemon"
                  data-testid="search-card-input"
                />
                <button
                  onClick={() => handleSearch(searchQuery)}
                  disabled={loading || searchQuery.length < 2}
                  className="btn-pokemon disabled:opacity-50"
                  style={{ fontFamily: "'Fredoka One', cursive" }}
                  data-testid="search-card-btn"
                >
                  {loading ? '⏳' : '🔍 Chercher'}
                </button>
              </div>
              
              {noResults && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                  <p className="text-yellow-400 font-semibold mb-2">❌ Aucun résultat pour "{searchQuery}"</p>
                  <p className="text-yellow-400/80 text-sm">
                    💡 <strong>Astuce :</strong> Utilise le <strong>nom anglais</strong> du Pokémon !
                  </p>
                  <p className="text-yellow-400/60 text-xs mt-1">
                    Ex: Dracaufeu → Charizard, Tortank → Blastoise
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-cyan-400 font-bold mb-4 hover:underline">
              ← Retour
            </button>
            <h3 className="font-bold mb-3 text-gray-300">Résultats de recherche</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  onClick={() => selectCard(card)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedCard?.id === card.id 
                      ? 'border-pink-500 shadow-lg shadow-pink-500/30' 
                      : 'border-white/10 hover:border-cyan-400/50'
                  }`}
                  data-testid={`search-result-${card.id}`}
                >
                  <img src={card.image} alt={card.name} className="w-full aspect-[2/3] object-contain bg-black/50" />
                  <div className="p-2 bg-white/5 border-t border-white/5">
                    <p className="text-xs font-bold truncate">{card.name}</p>
                    <p className="text-xs text-gray-500 truncate">{card.set}</p>
                  </div>
                </div>
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Aucun résultat. Essaie un autre nom !
              </div>
            )}
          </div>
        )}

        {step === 3 && selectedCard && (
          <div>
            <button onClick={() => setStep(2)} className="text-cyan-400 font-bold mb-4 hover:underline">
              ← Retour
            </button>
            <div className="flex flex-col sm:flex-row gap-6">
              <img 
                src={selectedCard.image_large || selectedCard.image} 
                alt={selectedCard.name}
                className="w-40 rounded-xl border border-white/20 mx-auto sm:mx-0"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 
                    className="text-xl font-bold holographic-text"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    {selectedCard.name}
                  </h3>
                  <p className="text-gray-500">{selectedCard.set} • #{selectedCard.number}</p>
                  {selectedCard.rarity && (
                    <span className="inline-block mt-1 bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs font-bold border border-purple-500/30">
                      {selectedCard.rarity}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">💰 Prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full input-pokemon text-sm"
                      data-testid="price-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-400 mb-1">🔢 Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full input-pokemon text-sm"
                      data-testid="quantity-input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">📊 Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full input-pokemon"
                    data-testid="condition-select"
                  >
                    <option value="mint">✨ Mint (Parfaite)</option>
                    <option value="exc">💙 Excellent</option>
                    <option value="good">🟡 Bon état</option>
                    <option value="poor">🔴 Usée</option>
                  </select>
                </div>
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 btn-pokemon btn-pokemon-gold disabled:opacity-50"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                    data-testid="add-card-submit"
                  >
                    {loading ? 'Ajout...' : '✅ Ajouter au classeur'}
                  </button>
                  <button 
                    onClick={onClose} 
                    className="btn-pokemon btn-pokemon-outline"
                  >
                    ✖ Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function CardDetailModal({ card, onClose, onDelete, onUpdatePrice }) {
  const [editing, setEditing] = useState(false);
  const [newPrice, setNewPrice] = useState(card.price.toString());

  const handleSavePrice = () => {
    onUpdatePrice(card._id, newPrice);
    setEditing(false);
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
        className="card-pokemon p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="text-xl font-bold holographic-text"
            style={{ fontFamily: "'Fredoka One', cursive" }}
          >
            {card.card_name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        <div className="flex gap-6">
          <img src={card.image_url} alt={card.card_name} className="w-32 rounded-xl border border-white/20" />
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Extension</div>
              <div className="font-semibold">{card.set_name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Condition</div>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${CONDITION_LABELS[card.condition]?.bg}`}>
                {CONDITION_LABELS[card.condition]?.label || card.condition}
              </span>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Quantité</div>
              <div className="font-semibold">{card.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase">Valeur</div>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-20 input-pokemon text-sm py-1"
                    autoFocus
                  />
                  <button onClick={handleSavePrice} className="btn-pokemon text-sm py-1 px-3">✓</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span 
                    className="text-2xl font-bold text-yellow-400"
                    style={{ fontFamily: "'Fredoka One', cursive" }}
                  >
                    {card.price.toFixed(2)}€
                  </span>
                  <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-cyan-400">
                    <Edit3 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => onDelete(card._id)}
            className="flex-1 btn-pokemon flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
            data-testid="delete-card-btn"
          >
            <Trash2 size={18} />
            Supprimer
          </button>
          <button onClick={onClose} className="flex-1 btn-pokemon btn-pokemon-outline">
            Fermer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ShareModal({ link, onClose, onCopy }) {
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
