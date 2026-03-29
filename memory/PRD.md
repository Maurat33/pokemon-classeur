# Pokemon Classeur - PRD

## Original Problem Statement
Transformer un classeur Pokemon HTML simple en une application full-stack moderne avec scan IA, prix via Pokemon TCG API, themes personnalises, et un "Mode Enfant" pour Leo (5 ans).

## User Personas
1. **Admin/Parent** - Gere la collection, ajoute/supprime des cartes, voit les prix, partage
2. **Leo (Enfant)** - Consulte les cartes en lecture seule, joue aux mini-jeux, personalise son avatar

## Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend**: FastAPI, Motor (MongoDB async), PyJWT, bcrypt
- **Database**: MongoDB
- **AI**: OpenAI GPT-4o Vision (via Emergent LLM Key)
- **External API**: Pokemon TCG API (gratuit)

## What's Been Implemented

### Phase 1 - Core (DONE - 29 Mars 2026)
- Migration HTML -> React/FastAPI/MongoDB
- Auth JWT securisee (register, login, logout, refresh)
- Recherche Pokemon TCG API avec traduction FR->EN
- CRUD collection de cartes
- Scan IA de cartes (GPT-4o Vision)
- Statistiques de collection
- Export PDF/Excel
- Partage de collection (lien public)

### Phase 2 - Design & Theme (DONE - 29 Mars 2026)
- Theme sombre holographique (Pokeball design)
- Mode clair
- Toggle theme
- Glassmorphism + animations Framer Motion

### Phase 3 - Mode Enfant (DONE - 29 Mars 2026)
- Compte enfant Leo (leo@pokemon.com)
- Dashboard personnalise "Bienvenue Leo !"
- Collection en lecture seule (voit les cartes du parent)
- Mini-jeux: Memory, Quiz Pokemon, Attrape-les !
- Systeme d'etoiles et badges
- Upload d'avatar/photo de profil

### Phase 4 - Organisation & Vitrine (DONE - 29 Mars 2026)
- Classeurs/Dossiers (creer, supprimer, filtrer)
- Vue par Extension/Set (regroupement par extension avec nombre et valeur)
- Filtres par type Pokemon (Feu, Eau, Plante, etc. avec icones)
- Tri par extension
- Mode Vitrine (page publique stylisee pour l'admin)
- Bouton Deconnexion rouge visible sur tous les comptes
- Filtre par classeur dans la collection

### Phase 5 - Detail carte enrichi (DONE - 29 Mars 2026)
- Assigner une carte a un classeur depuis le modal de detail
- Graphique d'historique des prix (barres interactives avec hover)
- Retirer une carte d'un classeur (binder_id = null)
- Badges de types Pokemon dans le modal de detail

## Key API Endpoints
- POST/GET /api/auth/* - Auth
- GET/POST/PUT/DELETE /api/cards - CRUD cartes
- GET /api/cards/by-set - Cartes groupees par extension
- GET/POST/PUT/DELETE /api/binders - CRUD classeurs
- POST /api/vitrine/create - Creer vitrine
- GET /api/vitrine/:token - Page publique vitrine
- POST /api/ai/analyze-card - Scan IA
- GET /api/pokemon/search - Recherche TCG API
- GET/POST /api/user/profile, /api/user/avatar - Profil
- GET/POST /api/games/* - Mini-jeux
- GET /api/stats - Statistiques
- POST /api/share - Partage collection

## DB Schema
- users: {email, password_hash, name, role, avatar, stars, badges, games_played, high_scores, game_stats}
- cards: {user_id, pokemon_name, card_name, set_name, image_url, price, condition, quantity, types, binder_id, rarity, tcg_id, price_history}
- binders: {user_id, name, description, color}
- shares: {user_id, token, user_name}
- vitrines: {user_id, token, title, description, user_name}

## Prioritized Backlog

### P0 (Critical) - ALL DONE
- Auth, CRUD, TCG API, AI, Export, Share, Child mode, Binders, Sets, Types, Vitrine

### P1 (High) - Future
- [ ] Drag & Drop pour deplacer les cartes entre classeurs visuellement
- [ ] Historique des prix plus detaille (avec dates differentes)

### P2 (Medium) - Future
- [ ] Notifications de changement de prix
- [ ] PWA support
- [ ] Mode offline avec sync

### P3 (Low) - Backlog
- [ ] Multi-langue
- [ ] Wishlist de cartes
- [ ] Comparaison de collections
