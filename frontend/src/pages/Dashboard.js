import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Plus, BarChart3, Share2, Download, LogOut, Camera, 
  X, Trash2, Edit3, ChevronDown, TrendingUp, Award, 
  Package, Zap, FileSpreadsheet, FileText, ExternalLink, Copy,
  CheckCircle, AlertCircle, Sun, Moon, Gamepad2, Star,
  FolderPlus, Folder, Eye, Flame, Droplets, Leaf, Wind
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';
import { useDropzone } from 'react-dropzone';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import GamesPage from './GamesPage';

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
  const [showGames, setShowGames] = useState(false);
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
  
  const isChild = user?.role === 'child';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [childProfile, setChildProfile] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [binders, setBinders] = useState([]);
  const [selectedBinder, setSelectedBinder] = useState(null);
  const [showBinderModal, setShowBinderModal] = useState(false);
  const [cardsBySet, setCardsBySet] = useState([]);
  const [filterType, setFilterType] = useState('');
  const [showVitrineModal, setShowVitrineModal] = useState(false);
  const [vitrineLink, setVitrineLink] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cardsRes, statsRes, topRes, bindersRes, setsRes] = await Promise.all([
        api.getCards(),
        api.getStats(),
        api.getTopCards(5),
        api.getBinders(),
        api.getCardsBySet()
      ]);
      setCards(cardsRes.cards || []);
      setStats(statsRes);
      setTopCards(topRes.cards || []);
      setBinders(bindersRes.binders || []);
      setCardsBySet(setsRes.sets || []);
      
      // Load child profile if child
      if (user?.role === 'child') {
        try {
          const profileRes = await api.getProfile();
          setChildProfile(profileRes);
        } catch (e) {}
      }
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

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

  const handleCreateVitrine = async () => {
    try {
      const { token } = await api.createVitrine('Ma Collection Pokémon', 'Bienvenue dans ma vitrine !');
      const link = `${window.location.origin}/vitrine/${token}`;
      setVitrineLink(link);
      setShowVitrineModal(true);
    } catch (err) {
      showToast('Erreur lors de la création de la vitrine', 'error');
    }
  };

  // Get unique types from cards
  const allTypes = [...new Set(cards.flatMap(c => c.types || []))].sort();

  // Filter and sort cards
  const filteredCards = cards
    .filter(card => {
      const matchesSearch = card.pokemon_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           card.card_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCondition = !filterCondition || card.condition === filterCondition;
      const matchesBinder = !selectedBinder || card.binder_id === selectedBinder;
      const matchesType = !filterType || (card.types && card.types.includes(filterType));
      return matchesSearch && matchesCondition && matchesBinder && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.pokemon_name.localeCompare(b.pokemon_name);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'set') return (a.set_name || '').localeCompare(b.set_name || '');
      return new Date(b.created_at) - new Date(a.created_at);
    });

  // If showing games page
  if (showGames) {
    return <GamesPage onBack={() => setShowGames(false)} isDark={isDark} />;
  }

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
          {/* Theme toggle + Logout */}
          <div className="absolute right-0 top-0 flex items-center gap-2">
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
            <button
              onClick={logout}
              className={`p-2 rounded-full transition-all ${
                isDark
                  ? 'bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400'
                  : 'bg-white/30 hover:bg-red-500/30 text-gray-800 hover:text-red-600'
              }`}
              title="Déconnexion"
              data-testid="logout-btn"
            >
              <LogOut size={18} />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-4 mb-2">
            <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Pokeball />
            </motion.div>
            
            {/* Avatar for child */}
            {isChild && (
              <motion.div 
                className="relative cursor-pointer"
                whileHover={{ scale: 1.1 }}
                onClick={() => setShowAvatarModal(true)}
              >
                {childProfile?.avatar ? (
                  <img 
                    src={childProfile.avatar} 
                    alt={user?.name}
                    className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-lg">
                    🧒
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-white">
                  <Camera size={14} className="text-gray-800" />
                </div>
              </motion.div>
            )}
            
            <div className="text-center">
              <h1 
                className={`text-3xl md:text-4xl font-bold ${isDark ? 'holographic-text' : 'text-white'}`}
                style={{ fontFamily: "'Fredoka One', cursive", textShadow: isDark ? 'none' : '2px 2px 0 #1a1a2e' }}
              >
                {isChild ? `Bienvenue ${user?.name} !` : 'Mon Classeur Pokémon'}
              </h1>
              {isChild && (
                <p className="text-yellow-300 font-bold text-sm mt-1">
                  ⭐ Mode Explorateur Pokémon ⭐
                </p>
              )}
            </div>
            <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
              <Pokeball />
            </motion.div>
          </div>
          <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-white/90'}`}>
            ✨ {isChild ? 'Regarde tes super cartes et joue !' : 'Scanne tes cartes • Trouve les prix • Suis ta collection !'}
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
        {/* Games button - prominent for children */}
        <button
          onClick={() => setShowGames(true)}
          className={`btn-pokemon ${isChild ? 'btn-pokemon-gold animate-pulse' : 'btn-pokemon-outline'}`}
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="nav-games"
        >
          🎮 Jouer !
        </button>
        
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
          📖 {isChild ? 'Mes Cartes' : 'Mon Classeur'}
        </button>

        <button
          onClick={() => setActiveTab('sets')}
          className={`btn-pokemon ${activeTab === 'sets' ? '' : 'btn-pokemon-outline'}`}
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="nav-sets"
        >
          📦 Extensions
        </button>

        {!isChild && (
          <button
            onClick={() => setActiveTab('binders')}
            className={`btn-pokemon ${activeTab === 'binders' ? '' : 'btn-pokemon-outline'}`}
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="nav-binders"
          >
            📂 Classeurs
          </button>
        )}

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
      {!isChild ? (
        <div className="flex flex-wrap justify-center gap-3 mb-6 px-4">
          <button
            onClick={handleCreateVitrine}
            className="btn-pokemon btn-pokemon-outline text-sm py-2 px-4"
            data-testid="vitrine-btn"
          >
            <Eye size={16} className="inline mr-2" />
            Vitrine
          </button>
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
        </div>
      ) : null}

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
            isChild={isChild}
            filterType={filterType}
            setFilterType={setFilterType}
            allTypes={allTypes}
            binders={binders}
            selectedBinder={selectedBinder}
            setSelectedBinder={setSelectedBinder}
          />
        )}
        
        {activeTab === 'sets' && (
          <SetsView sets={cardsBySet} />
        )}

        {activeTab === 'binders' && !isChild && (
          <BindersView 
            binders={binders} 
            cards={cards}
            onCreateBinder={() => setShowBinderModal(true)}
            onSelectBinder={(id) => { setSelectedBinder(id); setActiveTab('collection'); }}
            onDeleteBinder={async (id) => {
              try {
                await api.deleteBinder(id);
                showToast('Classeur supprimé !');
                loadData();
              } catch (err) {
                showToast('Erreur', 'error');
              }
            }}
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
            onSuccess={(result) => {
              loadData();
              setShowAddModal(false);
              if (result.is_duplicate) {
                showToast('Carte en double ! Quantité mise à jour 🔄');
              } else if (result.auto_binder) {
                showToast(`Carte ajoutée au classeur "${result.auto_binder}" ! 🎉📂`);
              } else {
                showToast('Carte ajoutée ! 🎉');
              }
            }}
          />
        )}
        
        {showDetailModal && (
          <CardDetailModal 
            card={showDetailModal}
            onClose={() => setShowDetailModal(null)}
            onDelete={handleDeleteCard}
            onUpdatePrice={handleUpdatePrice}
            onUpdateBinder={async (cardId, binderId) => {
              try {
                await api.updateCard(cardId, { binder_id: binderId });
                showToast('Classeur mis à jour ! 📂');
                loadData();
              } catch (err) {
                showToast('Erreur', 'error');
              }
            }}
            isChild={isChild}
            binders={binders}
          />
        )}
        
        {showShareModal && (
          <ShareModal 
            link={shareLink}
            onClose={() => setShowShareModal(false)}
            onCopy={copyShareLink}
          />
        )}

        {showAvatarModal && (
          <AvatarUploadModal
            currentAvatar={childProfile?.avatar}
            onClose={() => setShowAvatarModal(false)}
            onSave={async (base64) => {
              try {
                await api.updateAvatar(base64);
                const profileRes = await api.getProfile();
                setChildProfile(profileRes);
                showToast('Photo mise à jour ! 📸');
                setShowAvatarModal(false);
              } catch (err) {
                showToast('Erreur lors de la mise à jour', 'error');
              }
            }}
          />
        )}

        {showBinderModal && (
          <BinderCreateModal
            onClose={() => setShowBinderModal(false)}
            onSuccess={async (data) => {
              try {
                await api.createBinder(data);
                showToast('Classeur créé ! 📂');
                setShowBinderModal(false);
                loadData();
              } catch (err) {
                showToast('Erreur', 'error');
              }
            }}
          />
        )}

        {showVitrineModal && (
          <VitrineModal
            link={vitrineLink}
            onClose={() => setShowVitrineModal(false)}
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

// Pokemon type colors, icons and French labels
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

const TYPE_LABELS_FR = {
  Fire: 'Feu', Water: 'Eau', Grass: 'Plante', Lightning: 'Électrique',
  Psychic: 'Psy', Fighting: 'Combat', Darkness: 'Ténèbres', Metal: 'Métal',
  Dragon: 'Dragon', Fairy: 'Fée', Colorless: 'Incolore',
};

function SetsView({ sets }) {
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

function BindersView({ binders, cards, onCreateBinder, onSelectBinder, onDeleteBinder }) {
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

function BinderCreateModal({ onClose, onSuccess }) {
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

function VitrineModal({ link, onClose }) {
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

function CollectionView({ 
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
    quantity: 1,
    frenchName: '',
    useOwnPhoto: false
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
        
        // If AI found TCG matches, go directly to results
        if (analysis.tcg_matches && analysis.tcg_matches.length > 0) {
          setSearchResults(analysis.tcg_matches);
          // Pre-fill French name
          const frName = analysis.pokemon_name_fr || analysis.pokemon_name_en || '';
          setSearchQuery(frName);
          setFormData(prev => ({ ...prev, frenchName: frName, condition: analysis.condition || 'good', useOwnPhoto: false }));
          
          // If exact match (1 result or first result matches number), auto-select
          if (analysis.tcg_matches.length === 1) {
            selectCardFromAI(analysis.tcg_matches[0], frName, analysis.condition || 'good');
          } else {
            setStep(2);
          }
        } else if (analysis.pokemon_name_en) {
          // Fallback: search by English name
          setSearchQuery(analysis.pokemon_name_fr || analysis.pokemon_name_en);
          handleSearch(analysis.pokemon_name_en);
          if (analysis.condition) {
            setFormData(prev => ({ ...prev, condition: analysis.condition, frenchName: analysis.pokemon_name_fr || '' }));
          }
        }
      } catch (err) {
        console.error('AI analysis failed:', err);
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const selectCardFromAI = (card, frenchName, condition) => {
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
    setFormData(prev => ({ ...prev, price: price.toFixed(2), frenchName: frenchName || prev.frenchName, condition: condition || prev.condition, useOwnPhoto: false }));
    setStep(3);
  };

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
    setFormData(prev => ({ ...prev, price: price.toFixed(2), frenchName: searchQuery || '' }));
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedCard) return;
    setLoading(true);
    try {
      // Use French name if provided, otherwise English
      const displayName = formData.frenchName?.trim() || selectedCard.name;
      // Use uploaded photo if available, otherwise TCG image
      const imageUrl = formData.useOwnPhoto && uploadedImage ? uploadedImage : (selectedCard.image_large || selectedCard.image);
      
      const result = await api.createCard({
        pokemon_name: displayName,
        card_name: displayName,
        set_name: selectedCard.set,
        card_number: selectedCard.number,
        image_url: imageUrl,
        price: parseFloat(formData.price) || 0,
        condition: formData.condition,
        quantity: parseInt(formData.quantity) || 1,
        tcg_id: selectedCard.id,
        rarity: selectedCard.rarity,
        types: selectedCard.types || []
      });
      onSuccess(result);
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
                      Identification de la carte...
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
                Entre le nom du Pokémon (français ou anglais)
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setNoResults(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                  placeholder="Ex: Ectoplasma, Dracaufeu, Pikachu..."
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
                  <p className="text-yellow-400 font-semibold mb-2">Aucun résultat pour "{searchQuery}"</p>
                  <p className="text-yellow-400/80 text-sm">
                    Essaie un nom un peu différent ou le nom anglais.
                  </p>
                  <p className="text-yellow-400/60 text-xs mt-1">
                    Ex: Ectoplasma → Gengar, Dracaufeu → Charizard
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
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all hover:scale-105 relative ${
                    selectedCard?.id === card.id 
                      ? 'border-pink-500 shadow-lg shadow-pink-500/30' 
                      : 'border-white/10 hover:border-cyan-400/50'
                  }`}
                  data-testid={`search-result-${card.id}`}
                >
                  {card.lang && (
                    <span className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10 ${
                      card.lang === 'fr' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {card.lang === 'fr' ? '🇫🇷' : '🇬🇧'}
                    </span>
                  )}
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
              <div className="flex flex-col items-center gap-2">
                <img 
                  src={formData.useOwnPhoto && uploadedImage ? uploadedImage : (selectedCard.image_large || selectedCard.image)} 
                  alt={selectedCard.name}
                  className="w-40 rounded-xl border border-white/20"
                />
                {uploadedImage && (
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={formData.useOwnPhoto}
                      onChange={(e) => setFormData({ ...formData, useOwnPhoto: e.target.checked })}
                      className="rounded border-white/20"
                      data-testid="use-own-photo"
                    />
                    <span className="text-cyan-400 font-semibold">Ma photo</span>
                  </label>
                )}
              </div>
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

                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">🇫🇷 Nom français</label>
                  <input
                    type="text"
                    value={formData.frenchName}
                    onChange={(e) => setFormData({ ...formData, frenchName: e.target.value })}
                    placeholder={selectedCard.name}
                    className="w-full input-pokemon text-sm"
                    data-testid="french-name-input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Laisse vide pour garder le nom anglais</p>
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

function CardDetailModal({ card, onClose, onDelete, onUpdatePrice, onUpdateBinder, isChild = false, binders = [] }) {
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

  // Price history data
  const priceHistory = card.price_history || [];
  const hasHistory = priceHistory.length > 1;

  // Compute min/max for simple chart
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
            {/* Types badges */}
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

        {/* Binder selector (admin only) */}
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

function AvatarUploadModal({ currentAvatar, onClose, onSave }) {
  const [preview, setPreview] = useState(currentAvatar || null);
  const [saving, setSaving] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await onSave(preview);
    } finally {
      setSaving(false);
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
        className="card-pokemon p-6 w-full max-w-sm text-center"
      >
        <h2
          className="text-2xl font-bold mb-4 holographic-text"
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="avatar-modal-title"
        >
          Ma Photo de Profil
        </h2>

        <div className="mb-6">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="w-32 h-32 rounded-full mx-auto border-4 border-yellow-400 object-cover shadow-lg"
              data-testid="avatar-preview"
            />
          ) : (
            <div className="w-32 h-32 rounded-full mx-auto border-4 border-yellow-400 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-5xl shadow-lg">
              🧒
            </div>
          )}
        </div>

        <label
          className="btn-pokemon btn-pokemon-outline cursor-pointer inline-flex items-center gap-2 mb-4"
          style={{ fontFamily: "'Fredoka One', cursive" }}
          data-testid="avatar-choose-file"
        >
          <Camera size={18} />
          Choisir une photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            data-testid="avatar-file-input"
          />
        </label>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleSave}
            disabled={saving || !preview}
            className="flex-1 btn-pokemon btn-pokemon-gold disabled:opacity-50"
            style={{ fontFamily: "'Fredoka One', cursive" }}
            data-testid="avatar-save-btn"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 btn-pokemon btn-pokemon-outline"
            data-testid="avatar-cancel-btn"
          >
            Annuler
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
