import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, BarChart3, Share2, Download, LogOut, Camera, 
  X, Trash2, Edit3, ChevronDown, Sparkles, TrendingUp, Award, 
  Package, Zap, FileSpreadsheet, FileText, ExternalLink, Copy,
  CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { useDropzone } from 'react-dropzone';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CONDITION_LABELS = {
  mint: { label: '✨ Mint', color: 'text-green-400' },
  exc: { label: '💙 Excellent', color: 'text-blue-400' },
  good: { label: '🟡 Bon état', color: 'text-yellow-400' },
  poor: { label: '🔴 Usée', color: 'text-red-400' },
};

export default function Dashboard() {
  const { user, logout } = useAuth();
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
      showToast('Carte supprimée');
      loadData();
      setShowDetailModal(null);
    } catch (err) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const handleUpdatePrice = async (cardId, newPrice) => {
    try {
      await api.updateCard(cardId, { price: parseFloat(newPrice) });
      showToast('Prix mis à jour');
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
    showToast('Lien copié!');
  };

  const handleExport = async (type) => {
    try {
      const url = type === 'pdf' ? api.exportPDF() : api.exportExcel();
      window.open(url, '_blank');
      showToast(`Export ${type.toUpperCase()} lancé`);
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-50 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-accent-tertiary" />
            <h1 className="font-heading text-2xl font-bold holographic-text">Pokemon Classeur</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-gray-400 hidden sm:block">
              Bonjour, <span className="text-white font-semibold">{user?.name}</span>
            </span>
            <button
              onClick={logout}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              data-testid="logout-btn"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-background-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatChip icon={<Package />} label="Cartes" value={stats?.total_cards || 0} />
            <StatChip 
              icon={<TrendingUp />} 
              label="Valeur totale" 
              value={`${(stats?.total_value || 0).toFixed(2)}€`}
              highlight 
            />
            <StatChip icon={<Zap />} label="Pokemon uniques" value={stats?.unique_pokemon || 0} />
            <StatChip 
              icon={<Award />} 
              label="Carte top" 
              value={stats?.top_card?.name ? `${stats.top_card.price}€` : '—'} 
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-2">
        {[
          { id: 'collection', label: 'Ma Collection', icon: <Package size={18} /> },
          { id: 'add', label: 'Ajouter', icon: <Plus size={18} /> },
          { id: 'stats', label: 'Statistiques', icon: <BarChart3 size={18} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.id === 'add' ? setShowAddModal(true) : setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all ${
              activeTab === tab.id 
                ? 'bg-accent-primary text-white' 
                : 'bg-background-surface text-gray-400 hover:text-white border border-border hover:border-accent-primary/50'
            }`}
            data-testid={`nav-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        
        <div className="flex-1" />
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-surface text-gray-400 hover:text-accent-secondary border border-border hover:border-accent-secondary/50 transition-all"
          data-testid="share-btn"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Partager</span>
        </button>
        
        <div className="relative group">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-surface text-gray-400 hover:text-accent-tertiary border border-border hover:border-accent-tertiary/50 transition-all">
            <Download size={18} />
            <span className="hidden sm:inline">Exporter</span>
            <ChevronDown size={16} />
          </button>
          <div className="absolute right-0 top-full mt-2 bg-background-surface border border-border rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button
              onClick={() => handleExport('pdf')}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-background-elevated text-gray-300 hover:text-white"
              data-testid="export-pdf"
            >
              <FileText size={16} />
              PDF
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-background-elevated text-gray-300 hover:text-white"
              data-testid="export-excel"
            >
              <FileSpreadsheet size={16} />
              Excel
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
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
              showToast('Carte ajoutée!');
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
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full flex items-center gap-2 ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white font-semibold shadow-lg z-50`}
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
function StatChip({ icon, label, value, highlight }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl ${
      highlight 
        ? 'bg-gradient-to-r from-accent-primary/20 to-accent-secondary/20 border border-accent-primary/30' 
        : 'bg-background-elevated border border-border'
    }`}>
      <div className={highlight ? 'text-accent-tertiary' : 'text-gray-500'}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wider">{label}</div>
        <div className={`font-heading font-bold text-lg ${highlight ? 'text-accent-tertiary' : 'text-white'}`}>
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
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un Pokemon..."
            className="w-full bg-background-surface border border-border rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-500"
            data-testid="search-input"
          />
        </div>
        
        <select
          value={filterCondition}
          onChange={(e) => setFilterCondition(e.target.value)}
          className="bg-background-surface border border-border rounded-xl px-4 py-2 text-white"
          data-testid="filter-condition"
        >
          <option value="">Toutes conditions</option>
          <option value="mint">Mint</option>
          <option value="exc">Excellent</option>
          <option value="good">Bon état</option>
          <option value="poor">Usée</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="bg-background-surface border border-border rounded-xl px-4 py-2 text-white"
          data-testid="sort-by"
        >
          <option value="date">Plus récent</option>
          <option value="name">A-Z</option>
          <option value="price">Prix</option>
        </select>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-background-surface rounded-2xl aspect-[2/3] shimmer" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <Package size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="font-heading text-2xl text-gray-400 mb-2">Collection vide</h3>
          <p className="text-gray-500 mb-6">Ajoutez votre première carte!</p>
          <button
            onClick={onAddClick}
            className="holographic text-white font-bold py-3 px-6 rounded-xl"
            data-testid="add-first-card"
          >
            <Plus className="inline mr-2" size={20} />
            Ajouter une carte
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
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                    card.condition === 'mint' ? 'bg-green-400' :
                    card.condition === 'exc' ? 'bg-blue-400' :
                    card.condition === 'good' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
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
      )}
    </div>
  );
}

function StatsView({ stats, topCards }) {
  const priceData = topCards.map(card => ({
    name: card.pokemon_name.slice(0, 10),
    value: card.price
  }));

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard emoji="🎴" title="Total cartes" value={stats?.total_cards || 0} />
        <StatCard emoji="💰" title="Valeur totale" value={`${(stats?.total_value || 0).toFixed(2)}€`} large />
        <StatCard emoji="📈" title="Valeur moyenne" value={`${(stats?.avg_value || 0).toFixed(2)}€`} />
        <StatCard emoji="🏆" title="Carte la + chère" value={stats?.top_card?.name || '—'} sub={stats?.top_card?.price ? `${stats.top_card.price}€` : ''} />
        <StatCard emoji="✨" title="En parfait état" value={stats?.mint_count || 0} />
        <StatCard emoji="🎲" title="Pokemon différents" value={stats?.unique_pokemon || 0} />
      </div>

      {/* Chart */}
      {topCards.length > 0 && (
        <div className="bg-background-surface border border-border rounded-2xl p-6">
          <h3 className="font-heading text-xl font-bold mb-4">Top 5 cartes les plus chères</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceData}>
                <XAxis dataKey="name" stroke="#6B6B78" fontSize={12} />
                <YAxis stroke="#6B6B78" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    background: '#121218', 
                    border: '1px solid #2D2D3B',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#FF007F" 
                  strokeWidth={3}
                  dot={{ fill: '#00F0FF', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Cards List */}
      <div className="bg-background-surface border border-border rounded-2xl p-6">
        <h3 className="font-heading text-xl font-bold mb-4">🏅 Mes 5 cartes les plus précieuses</h3>
        <div className="space-y-3">
          {topCards.map((card, index) => (
            <div 
              key={card._id}
              className="flex items-center gap-4 p-3 bg-background-elevated rounded-xl border border-border hover:border-accent-tertiary/50 transition-colors"
            >
              <div className={`font-heading text-2xl font-bold ${
                index === 0 ? 'text-yellow-400' : 
                index === 1 ? 'text-gray-400' : 
                index === 2 ? 'text-orange-400' : 'text-gray-600'
              }`}>
                #{index + 1}
              </div>
              <img src={card.image_url} alt={card.card_name} className="w-12 h-16 object-contain rounded" />
              <div className="flex-1">
                <div className="font-semibold">{card.pokemon_name}</div>
                <div className="text-sm text-gray-500">{card.set_name}</div>
              </div>
              <div className="font-heading text-xl font-bold text-accent-tertiary">
                {card.price.toFixed(2)}€
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ emoji, title, value, sub, large }) {
  return (
    <div className="bg-background-surface border border-border rounded-2xl p-5 text-center">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</div>
      <div className={`font-heading font-bold ${large ? 'text-2xl text-accent-tertiary' : 'text-xl'}`}>
        {value}
      </div>
      {sub && <div className="text-sm text-gray-500">{sub}</div>}
    </div>
  );
}

function AddCardModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: upload/search, 2: select card, 3: confirm
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
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
    try {
      const { cards } = await api.searchPokemon(query);
      setSearchResults(cards || []);
      if (cards?.length > 0) setStep(2);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCard = (card) => {
    setSelectedCard(card);
    // Get market price if available
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
        className="bg-background-surface border border-border rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold">
            {step === 1 && '📷 Ajouter une carte'}
            {step === 2 && '🔍 Sélectionner la carte'}
            {step === 3 && '✅ Confirmer'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white" data-testid="close-modal">
            <X size={24} />
          </button>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            {/* Upload Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                isDragActive ? 'border-accent-primary bg-accent-primary/10' : 'border-border hover:border-accent-secondary'
              }`}
              data-testid="dropzone"
            >
              <input {...getInputProps()} />
              {uploadedImage ? (
                <div className="flex flex-col items-center gap-4">
                  <img src={uploadedImage} alt="Preview" className="max-h-40 rounded-xl" />
                  {analyzing && (
                    <div className="flex items-center gap-2 text-accent-secondary">
                      <div className="w-5 h-5 border-2 border-accent-secondary/30 border-t-accent-secondary rounded-full animate-spin" />
                      Analyse IA en cours...
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Camera size={48} className="mx-auto text-gray-500 mb-4" />
                  <p className="text-gray-300 font-semibold">
                    {isDragActive ? 'Déposez la photo ici' : 'Cliquez ou glissez une photo'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">L'IA reconnaîtra automatiquement la carte</p>
                </>
              )}
            </div>

            {/* Manual Search */}
            <div className="text-center text-gray-500">ou recherchez manuellement</div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                placeholder="Nom du Pokemon (ex: Pikachu, Dracaufeu...)"
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-gray-500"
                data-testid="search-card-input"
              />
              <button
                onClick={() => handleSearch(searchQuery)}
                disabled={loading || searchQuery.length < 2}
                className="holographic text-white font-bold px-6 rounded-xl disabled:opacity-50"
                data-testid="search-card-btn"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={20} />}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} className="text-accent-secondary mb-4 hover:underline">
              ← Retour
            </button>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto">
              {searchResults.map(card => (
                <div
                  key={card.id}
                  onClick={() => selectCard(card)}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                    selectedCard?.id === card.id ? 'border-accent-primary' : 'border-border hover:border-accent-secondary'
                  }`}
                  data-testid={`search-result-${card.id}`}
                >
                  <img src={card.image} alt={card.name} className="w-full aspect-[2/3] object-contain bg-background" />
                  <div className="p-2 bg-background-elevated">
                    <p className="text-xs font-semibold truncate">{card.name}</p>
                    <p className="text-xs text-gray-500 truncate">{card.set}</p>
                  </div>
                </div>
              ))}
            </div>
            {searchResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                Aucun résultat. Essayez un autre nom.
              </div>
            )}
          </div>
        )}

        {step === 3 && selectedCard && (
          <div>
            <button onClick={() => setStep(2)} className="text-accent-secondary mb-4 hover:underline">
              ← Retour
            </button>
            <div className="flex flex-col sm:flex-row gap-6">
              <img 
                src={selectedCard.image_large || selectedCard.image} 
                alt={selectedCard.name}
                className="w-40 rounded-xl mx-auto sm:mx-0"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="font-heading text-xl font-bold">{selectedCard.name}</h3>
                  <p className="text-gray-500">{selectedCard.set} • #{selectedCard.number}</p>
                  {selectedCard.rarity && (
                    <span className="inline-block mt-1 bg-accent-primary/20 text-accent-primary px-2 py-1 rounded text-xs">
                      {selectedCard.rarity}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Prix (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-white"
                      data-testid="price-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Quantité</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-white"
                      data-testid="quantity-input"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Condition</label>
                  <select
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-white"
                    data-testid="condition-select"
                  >
                    <option value="mint">✨ Mint (Parfaite)</option>
                    <option value="exc">💙 Excellent</option>
                    <option value="good">🟡 Bon état</option>
                    <option value="poor">🔴 Usée</option>
                  </select>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full holographic text-white font-bold py-3 rounded-xl disabled:opacity-50"
                  data-testid="add-card-submit"
                >
                  {loading ? 'Ajout en cours...' : '✅ Ajouter au classeur'}
                </button>
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
        className="bg-background-surface border border-border rounded-3xl p-6 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-bold">{card.card_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-6">
          <img src={card.image_url} alt={card.card_name} className="w-32 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div>
              <div className="text-xs text-gray-500 uppercase">Extension</div>
              <div className="font-semibold">{card.set_name}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Condition</div>
              <div className={CONDITION_LABELS[card.condition]?.color}>
                {CONDITION_LABELS[card.condition]?.label || card.condition}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Quantité</div>
              <div className="font-semibold">{card.quantity}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase">Valeur</div>
              {editing ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-20 bg-background border border-border rounded px-2 py-1 text-white text-sm"
                    autoFocus
                  />
                  <button 
                    onClick={handleSavePrice}
                    className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-heading text-2xl text-accent-tertiary">{card.price.toFixed(2)}€</span>
                  <button 
                    onClick={() => setEditing(true)}
                    className="text-gray-500 hover:text-accent-secondary"
                  >
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
            className="flex-1 flex items-center justify-center gap-2 bg-red-500/20 text-red-400 border border-red-500/50 py-2 rounded-xl hover:bg-red-500/30"
            data-testid="delete-card-btn"
          >
            <Trash2 size={18} />
            Supprimer
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-background-elevated border border-border py-2 rounded-xl hover:border-accent-primary/50"
          >
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
        className="bg-background-surface border border-border rounded-3xl p-6 w-full max-w-md text-center"
      >
        <Share2 size={48} className="mx-auto text-accent-secondary mb-4" />
        <h2 className="font-heading text-2xl font-bold mb-2">Partager ma collection</h2>
        <p className="text-gray-400 mb-6">Partagez ce lien avec vos amis!</p>
        
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={link}
            readOnly
            className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-white text-sm"
          />
          <button
            onClick={onCopy}
            className="bg-accent-secondary text-black px-4 rounded-xl font-bold hover:opacity-90"
            data-testid="copy-link-btn"
          >
            <Copy size={20} />
          </button>
        </div>
        
        <button
          onClick={() => window.open(link, '_blank')}
          className="flex items-center justify-center gap-2 w-full bg-background-elevated border border-border py-2 rounded-xl hover:border-accent-primary/50"
        >
          <ExternalLink size={18} />
          Ouvrir
        </button>
      </motion.div>
    </motion.div>
  );
}
