import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import * as api from '../services/api';

export default function AddCardModal({ onClose, onSuccess }) {
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
        
        if (analysis.tcg_matches && analysis.tcg_matches.length > 0) {
          setSearchResults(analysis.tcg_matches);
          const frName = analysis.pokemon_name_fr || analysis.pokemon_name_en || '';
          setSearchQuery(frName);
          setFormData(prev => ({ ...prev, frenchName: frName, condition: analysis.condition || 'good', useOwnPhoto: false }));
          
          if (analysis.tcg_matches.length === 1) {
            selectCardFromAI(analysis.tcg_matches[0], frName, analysis.condition || 'good');
          } else {
            setStep(2);
          }
        } else if (analysis.pokemon_name_en) {
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
      const displayName = formData.frenchName?.trim() || selectedCard.name;
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
