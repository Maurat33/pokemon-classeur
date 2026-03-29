import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, Moon, LogOut, Camera, Share2, Download, 
  ChevronDown, FileText, FileSpreadsheet, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as api from '../services/api';
import GamesPage from './GamesPage';

// Components
import { Pokeball, StatChip } from '../components/StatChip';
import CollectionView from '../components/CollectionView';
import SetsView from '../components/SetsView';
import { BindersView, BinderCreateModal } from '../components/BindersView';
import StatsView from '../components/StatsView';
import AddCardModal from '../components/AddCardModal';
import CardDetailModal from '../components/CardDetailModal';
import AvatarUploadModal from '../components/AvatarUploadModal';
import { ShareModal, VitrineModal } from '../components/ShareModal';
import { CheckCircle, AlertCircle } from 'lucide-react';

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

  const allTypes = [...new Set(cards.flatMap(c => c.types || []))].sort();

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

  if (showGames) {
    return <GamesPage onBack={() => setShowGames(false)} isDark={isDark} />;
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`${isDark ? 'header-dark' : 'header-light'} py-6 px-4 relative`}>
        {isDark && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-64 h-32 bg-pink-500/10 rounded-full blur-3xl" />
            <div className="absolute top-0 right-1/4 w-64 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
          </div>
        )}
        
        <div className="max-w-6xl mx-auto relative z-10">
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
