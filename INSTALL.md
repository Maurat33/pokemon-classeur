# Guide d'installation - Mon Classeur Pokémon

## Prérequis
- Un serveur avec **Docker** et **Docker Compose** installés
  - VPS OVH Starter (~3.50€/mois) : Ubuntu 22.04 recommandé
  - Ou tout PC/Mac/Linux avec Docker Desktop

---

## Installation en 5 minutes

### 1. Clone le repo
```bash
git clone https://github.com/TON_USER/pokemon-classeur.git
cd pokemon-classeur
```

### 2. Configure le backend
```bash
cp backend/.env.example backend/.env.production
nano backend/.env.production
```

Modifie ces valeurs :
- `JWT_SECRET` → une longue chaîne aléatoire (tape `openssl rand -hex 32` dans le terminal)
- `ADMIN_PASSWORD` → ton mot de passe admin
- `EMERGENT_LLM_KEY` → ta clé Emergent (pour le scan IA de cartes)
- `FRONTEND_URL` → ton domaine (ex: `https://pokemon.equiptoi.fr`)

### 3. Lance tout
```bash
# Si tu as un domaine :
DOMAIN_URL=https://pokemon.equiptoi.fr docker compose up -d --build

# Sinon (accès local) :
docker compose up -d --build
```

### 4. C'est prêt !
Ouvre ton navigateur → `http://IP_DU_SERVEUR` (ou ton domaine)

---

## Ajout sur l'iPad de Léo

1. Ouvre **Safari** sur l'iPad
2. Va sur l'adresse de l'app (ex: `http://pokemon.equiptoi.fr`)
3. Appuie sur le bouton **Partager** (carré avec flèche vers le haut)
4. Choisis **"Sur l'écran d'accueil"**
5. L'icône Pokéball apparaît ! C'est comme une vraie app

---

## Configuration domaine OVH (optionnel)

Si tu veux utiliser `pokemon.equiptoi.fr` :

### Sur OVH (espace client → Zone DNS)
Ajoute un enregistrement :
- **Type** : A
- **Sous-domaine** : pokemon
- **Cible** : IP de ton serveur (ex: `51.xx.xx.xx`)

Attends 5-15 min la propagation DNS.

### HTTPS gratuit avec Let's Encrypt (optionnel mais recommandé)
```bash
# Installe Certbot
sudo apt install certbot python3-certbot-nginx -y

# Génère le certificat
sudo certbot --nginx -d pokemon.equiptoi.fr
```

---

## Commandes utiles

```bash
# Voir les logs
docker compose logs -f

# Redémarrer
docker compose restart

# Mettre à jour (après un git pull)
docker compose up -d --build

# Arrêter
docker compose down

# Sauvegarder la base de données
docker exec pokemon-mongo mongodump --out /data/backup
docker cp pokemon-mongo:/data/backup ./backup
```

---

## Comptes par défaut

| Compte | Email | Mot de passe |
|--------|-------|-------------|
| Admin (Parent) | admin@pokemon.com | Admin123! |
| Léo (Enfant) | leo@pokemon.com | Pokemon123 |

⚠️ Change le mot de passe admin dans `.env.production` avant le premier lancement !

---

## VPS OVH - Installation de Docker (si besoin)

```bash
# Connexion SSH
ssh root@IP_DU_VPS

# Installe Docker
curl -fsSL https://get.docker.com | sh

# Installe Docker Compose
sudo apt install docker-compose-plugin -y

# Clone et lance
git clone https://github.com/TON_USER/pokemon-classeur.git
cd pokemon-classeur
cp backend/.env.example backend/.env.production
nano backend/.env.production
DOMAIN_URL=https://pokemon.equiptoi.fr docker compose up -d --build
```

C'est tout ! 🎉
