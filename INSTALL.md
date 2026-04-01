# Installation sur Synology DS224+

## Ce dont tu as besoin
- Synology DS224+ avec **Container Manager** installé (via Centre de paquets)
- Accès SSH activé (Panneau de config > Terminal & SNMP > Activer SSH)
- Un domaine pointant vers ta box (ex: `pokemon.equiptoi.fr`)

---

## Étape 1 — Copier les fichiers sur le NAS

### Option A : Via File Station
1. Ouvre **File Station** sur le DSM
2. Va dans `docker/` (ou crée le dossier)
3. Crée un dossier `pokemon`
4. Upload tout le projet dedans (tu peux zipper et dézipper)

### Option B : Via SSH + Git
```bash
ssh ton-user@IP-DU-NAS
cd /volume1/docker
git clone https://github.com/TON_USER/pokemon-classeur.git pokemon
cd pokemon
```

---

## Étape 2 — Configurer

Le fichier `.env` à la racine contient toute la config. Modifie-le :

```bash
cd /volume1/docker/pokemon
nano .env
```

**Ce qu'il faut vérifier/changer :**

| Variable | Valeur | À changer ? |
|----------|--------|-------------|
| `DOMAIN` | `pokemon.equiptoi.fr` | Mets ton domaine |
| `HTTP_PORT` | `8880` | Change si ce port est déjà pris |
| `JWT_SECRET` | (pré-rempli) | Idéalement, régénère avec `openssl rand -hex 32` |
| `ADMIN_PASSWORD` | `Admin123!` | Change si tu veux |
| `CHILD_PASSWORD` | `Facile33` | Déjà configuré pour Léo |
| `EMERGENT_LLM_KEY` | (pré-rempli) | Ta clé pour le scan IA |

---

## Étape 3 — Lancer l'app

```bash
cd /volume1/docker/pokemon
sudo docker compose up -d --build
```

Le premier build prend 3-5 min (téléchargement des images + compilation React).

Vérifie que tout tourne :
```bash
sudo docker compose ps
```

Tu dois voir 3 conteneurs `running` :
- `pokemon-mongo`
- `pokemon-backend`
- `pokemon-frontend`

Test rapide :
```bash
curl http://localhost:8880/api/health
# → {"status":"healthy",...}
```

---

## Étape 4 — Reverse Proxy Synology (HTTPS)

C'est ce qui fait que `https://pokemon.equiptoi.fr` arrive sur ton app.

### 4.1 — DNS chez ton registrar
Ajoute un enregistrement DNS :
- **Type** : `A` (ou `CNAME` si IP dynamique avec DDNS)
- **Nom** : `pokemon`
- **Valeur** : L'IP publique de ta box (ou `ton-nom.synology.me` pour CNAME)

### 4.2 — Ouvrir les ports sur ta box internet
Dans l'interface de ta box (Livebox, Freebox, etc.) :
- Redirige le port **443** (externe) → **443** (interne, IP du NAS)
- Redirige le port **80** (externe) → **80** (interne, IP du NAS)

### 4.3 — Certificat HTTPS (Let's Encrypt)
1. DSM > **Panneau de configuration** > **Sécurité** > **Certificat**
2. Clique **Ajouter** > **Ajouter un nouveau certificat**
3. Choisis **Obtenir un certificat de Let's Encrypt**
4. Nom de domaine : `pokemon.equiptoi.fr`
5. Email : ton email
6. Valide — le certificat se génère automatiquement

### 4.4 — Configurer le Reverse Proxy
1. DSM > **Panneau de configuration** > **Portail de connexion** > **Avancé** > **Proxy inversé**
2. Clique **Créer** et remplis :

| Champ | Valeur |
|-------|--------|
| **Nom** | `Pokemon Classeur` |
| **Source** | |
| Protocole | `HTTPS` |
| Nom d'hôte | `pokemon.equiptoi.fr` |
| Port | `443` |
| Activer HSTS | ✅ |
| **Destination** | |
| Protocole | `HTTP` |
| Nom d'hôte | `localhost` |
| Port | `8880` |

3. Clique sur **En-tête personnalisé** > **Créer** > **WebSocket**
   (Ça ajoute automatiquement les headers Upgrade et Connection)

4. **OK** pour sauvegarder

### 4.5 — Assigner le certificat
1. DSM > **Panneau de configuration** > **Sécurité** > **Certificat**
2. Clique **Configurer**
3. Pour `pokemon.equiptoi.fr`, sélectionne le certificat Let's Encrypt créé à l'étape 4.3

---

## Étape 5 — Tester

Ouvre `https://pokemon.equiptoi.fr` dans ton navigateur.

**Comptes :**

| Qui | Email | Mot de passe |
|-----|-------|-------------|
| Parent (Admin) | `admin@pokemon.com` | `Admin123!` |
| Léo (Enfant) | `maurat.leo@gmail.com` | `Facile33` |

---

## Installer sur l'iPad de Léo (PWA)

1. Ouvre **Safari** sur l'iPad
2. Va sur `https://pokemon.equiptoi.fr`
3. Connecte-toi avec le compte de Léo
4. Appuie sur **Partager** (carré avec flèche ↑)
5. Choisis **Sur l'écran d'accueil**
6. L'icône Pokéball apparaît sur l'écran d'accueil !

---

## Commandes utiles

```bash
# Se connecter en SSH
ssh ton-user@IP-DU-NAS

# Aller dans le dossier
cd /volume1/docker/pokemon

# Voir les logs en temps réel
sudo docker compose logs -f

# Logs du backend seulement
sudo docker compose logs -f backend

# Redémarrer l'app
sudo docker compose restart

# Mettre à jour après un changement
sudo docker compose up -d --build

# Arrêter l'app
sudo docker compose down

# Sauvegarder la base de données
sudo docker exec pokemon-mongo mongodump --archive=/data/backup.archive
sudo docker cp pokemon-mongo:/data/backup.archive ./backup-$(date +%Y%m%d).archive

# Restaurer une sauvegarde
sudo docker cp ./backup-20260330.archive pokemon-mongo:/data/restore.archive
sudo docker exec pokemon-mongo mongorestore --archive=/data/restore.archive
```

---

## Mise à jour de l'app

```bash
cd /volume1/docker/pokemon
git pull
sudo docker compose up -d --build
```

---

## Dépannage

### L'app ne se lance pas
```bash
sudo docker compose logs backend
# Vérifie les erreurs (souvent un problème de clé ou de connexion MongoDB)
```

### Erreur CORS
Vérifie que `DOMAIN` dans `.env` correspond exactement à ton domaine (sans `https://`).

### Le scan IA ne fonctionne pas
Vérifie que `EMERGENT_LLM_KEY` est valide. Tu peux la régénérer sur https://emergentagent.com > Profil > Universal Key.

### MongoDB ne démarre pas
Le DS224+ a un processeur Intel x86_64 (J4125), MongoDB 7 est compatible. Si problème :
```bash
sudo docker compose logs mongo
```

### Espace disque
```bash
sudo docker system df        # Voir l'espace utilisé par Docker
sudo docker system prune -a   # Nettoyer les images inutilisées
```
