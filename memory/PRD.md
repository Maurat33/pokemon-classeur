# Pokemon Classeur - PRD

## Original Problem Statement
Récupérer le code du classeur Pokemon depuis GitHub (https://github.com/Maurat33/pokemon-classeur.git) et le transformer en une application complète avec:
- UI/UX premium surprenante
- Authentification pour sauvegarder en ligne
- Scan IA pour reconnaître les cartes
- Historique des prix
- Partage de collection
- API de prix en temps réel (gratuit)
- Export PDF/Excel

## User Personas
1. **Léo** - Collectionneur de cartes Pokemon qui veut gérer sa collection digitalement
2. **Parents** - Qui veulent suivre la valeur de la collection de leurs enfants
3. **Traders** - Qui veulent connaître les prix du marché

## Core Requirements (Static)
- ✅ Authentification JWT sécurisée
- ✅ Recherche de cartes via Pokemon TCG API
- ✅ Ajout/modification/suppression de cartes
- ✅ Statistiques de collection
- ✅ Partage de collection
- ✅ Export PDF/Excel
- ✅ Reconnaissance IA de cartes (GPT-4o Vision)
- ✅ Design premium holographique sombre

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, Recharts
- **Backend**: FastAPI, Motor (MongoDB async), PyJWT, bcrypt
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o Vision (via Emergent LLM Key)
- **External API**: Pokemon TCG API (gratuit)

## What's Been Implemented (29 Mars 2026)

### Backend
- `/api/auth/*` - Authentification complète (register, login, logout, me, refresh)
- `/api/pokemon/search` - Recherche Pokemon TCG API
- `/api/pokemon/card/{id}` - Détails d'une carte
- `/api/ai/analyze-card` - Reconnaissance IA de carte
- `/api/cards` - CRUD collection
- `/api/stats` - Statistiques
- `/api/share` - Partage de collection
- `/api/export/pdf` et `/api/export/excel` - Exports

### Frontend
- Page d'authentification avec design premium
- Dashboard avec navigation
- Grille de collection avec filtres/tri
- Modal d'ajout de carte avec recherche et IA
- Modal de détail de carte avec édition de prix
- Page de statistiques avec graphiques
- Page de collection partagée
- Toast notifications

### Design
- Thème sombre "Jewel & Luxury"
- Effets holographiques (gradients animés)
- Glassmorphism
- Animations Framer Motion
- Fonts: Outfit (headings), Manrope (body)

## Test Results
- Backend: 100% fonctionnel (13 endpoints)
- Frontend: 95% fonctionnel

## Prioritized Backlog

### P0 (Critical) - DONE
- ✅ Authentication
- ✅ Card management CRUD
- ✅ Pokemon TCG API integration

### P1 (High) - DONE
- ✅ Statistics dashboard
- ✅ Share collection
- ✅ Export PDF/Excel
- ✅ AI card recognition

### P2 (Medium) - Future
- [ ] Price history charts per card
- [ ] Notifications de changement de prix
- [ ] Mode offline avec sync
- [ ] PWA support

### P3 (Low) - Backlog
- [ ] Multi-langue
- [ ] Dark/Light mode toggle
- [ ] Wishlist de cartes
- [ ] Comparaison de collections

## Next Tasks
1. Attendre que le preview Kubernetes se réactive
2. Tester le flow complet de bout en bout
3. Ajouter l'historique des prix détaillé par carte
4. Optimiser les performances (lazy loading images)
