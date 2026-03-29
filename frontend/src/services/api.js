import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Pokemon TCG Search
export const searchPokemon = async (query) => {
  const { data } = await api.get(`/api/pokemon/search?q=${encodeURIComponent(query)}`);
  return data;
};

export const getPokemonCard = async (cardId) => {
  const { data } = await api.get(`/api/pokemon/card/${cardId}`);
  return data;
};

// AI Analysis
export const analyzeCard = async (imageBase64) => {
  const { data } = await api.post('/api/ai/analyze-card', { image_base64: imageBase64 });
  return data;
};

// Cards CRUD
export const getCards = async () => {
  const { data } = await api.get('/api/cards');
  return data;
};

export const createCard = async (cardData) => {
  const { data } = await api.post('/api/cards', cardData);
  return data;
};

export const updateCard = async (cardId, updates) => {
  const { data } = await api.put(`/api/cards/${cardId}`, updates);
  return data;
};

export const deleteCard = async (cardId) => {
  const { data } = await api.delete(`/api/cards/${cardId}`);
  return data;
};

// Stats
export const getStats = async () => {
  const { data } = await api.get('/api/stats');
  return data;
};

export const getTopCards = async (limit = 5) => {
  const { data } = await api.get(`/api/stats/top-cards?limit=${limit}`);
  return data;
};

// Share
export const createShareLink = async () => {
  const { data } = await api.post('/api/share');
  return data;
};

export const getSharedCollection = async (token) => {
  const { data } = await api.get(`/api/share/${token}`);
  return data;
};

// Export
export const exportPDF = () => `${API_URL}/api/export/pdf`;
export const exportExcel = () => `${API_URL}/api/export/excel`;

export const formatApiError = (detail) => {
  if (detail == null) return "Une erreur est survenue. Veuillez réessayer.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
};
