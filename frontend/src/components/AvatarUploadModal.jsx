import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';

export default function AvatarUploadModal({ currentAvatar, onClose, onSave }) {
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
