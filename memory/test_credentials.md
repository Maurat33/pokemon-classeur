# Test Credentials - Pokemon Classeur

## Admin User
- **Email**: admin@pokemon.com
- **Password**: Admin123!
- **Role**: admin

## Test User
- **Email**: test@pokemon.com
- **Password**: Test123!
- **Role**: user

## Auth Endpoints
- POST `/api/auth/register` - Créer un compte
- POST `/api/auth/login` - Se connecter
- POST `/api/auth/logout` - Se déconnecter
- GET `/api/auth/me` - Obtenir l'utilisateur courant
- POST `/api/auth/refresh` - Rafraîchir le token

## API Endpoints
- GET `/api/pokemon/search?q={query}` - Rechercher des cartes
- GET `/api/pokemon/card/{id}` - Détails d'une carte
- POST `/api/ai/analyze-card` - Analyser une image de carte
- GET `/api/cards` - Liste des cartes de l'utilisateur
- POST `/api/cards` - Ajouter une carte
- PUT `/api/cards/{id}` - Modifier une carte
- DELETE `/api/cards/{id}` - Supprimer une carte
- GET `/api/stats` - Statistiques de collection
- GET `/api/stats/top-cards` - Top 5 cartes
- POST `/api/share` - Créer un lien de partage
- GET `/api/share/{token}` - Voir une collection partagée
- GET `/api/export/pdf` - Exporter en PDF
- GET `/api/export/excel` - Exporter en Excel
