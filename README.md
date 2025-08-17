# My Top Albums - Application de Top 50 Albums

Une application moderne pour créer et partager votre top 50 albums personnels, avec intégration Spotify optionnelle.

## 🎵 Fonctionnalités

### Fonctionnalités principales

- **Recherche d'albums** via l'API Spotify
- **Top 50 personnalisé** avec drag & drop pour réorganiser
- **Tri automatique** par date de sortie ou tri manuel
- **Partage avancé** : texte, lien, QR code, image, JSON
- **Authentification Spotify optionnelle** pour créer des playlists publiques
- **Interface responsive** avec vue par onglets ou panneaux
- **Mode plein écran** pour visualiser votre top 50
- **Thème sombre/clair** avec détection automatique
- **Performance optimisée** avec chargement instantané et skeletons

### Authentification Spotify (optionnelle)

- **Connexion sécurisée** à votre compte Spotify
- **Création de playlists publiques** avec vos albums
- **Partage direct** vers Spotify
- **Toutes les fonctionnalités restent disponibles** sans connexion

### Système de sauvegarde avancé

- **Sauvegardes automatiques** : Votre travail est sauvegardé en continu
- **Sauvegardes manuelles** : Créez des points de restauration avant des changements importants
- **Historique des versions** : Jusqu'à 10 sauvegardes conservées avec horodatage
- **Chargement sécurisé** : Plus de perte de données lors du chargement de playlists externes
- **Restauration facile** : Interface intuitive pour revenir à une version antérieure

## 🚀 Installation

### Prérequis

- Node.js 18+
- npm, yarn ou pnpm
- Compte Spotify (optionnel, pour créer des playlists)

### Installation locale

1. **Cloner le projet**

```bash
git clone <repository-url>
cd my-top-albums
```

2. **Installer les dépendances**

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

3. **Configuration Spotify (optionnelle)**

Pour activer l'authentification Spotify et la création de playlists :

a) Créez une application sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

b) Configurez les URLs de redirection :

- `http://localhost:3000` (développement)
- `https://votre-domaine.vercel.app` (production Vercel)

c) Copiez le fichier d'exemple :

```bash
cp env.example .env.local
```

d) Modifiez `.env.local` avec vos credentials :

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=votre_client_id_spotify
SPOTIFY_CLIENT_SECRET=votre_client_secret_spotify
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
```

4. **Lancer l'application**

### Développement local (HTTP)

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

L'application sera disponible sur `http://localhost:3000`

### Développement avec HTTPS (pour Spotify Auth)

Pour tester l'authentification Spotify en local, vous avez plusieurs options :

**Option 1 : ngrok (Recommandé)**

```bash
# Installer ngrok
npm install -g ngrok

# Démarrer ngrok dans un terminal
ngrok http 3000

# Démarrer l'app dans un autre terminal
npm run dev
```

**Option 2 : localhost.run**

```bash
ssh -R 80:localhost:3000 nokey@localhost.run
```

**Option 3 : Déploiement Vercel Preview**

```bash
npm install -g vercel
vercel
```

Puis configurez l'URL HTTPS dans votre app Spotify.

## 🚀 Déploiement sur Vercel

### Déploiement rapide (Recommandé)

1. **Fork ou clone** ce repository sur GitHub

2. **Connectez-vous à Vercel** et importez votre repository

3. **Configurez les variables d'environnement** dans Vercel :

```env
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=votre_client_id_spotify
SPOTIFY_CLIENT_SECRET=votre_client_secret_spotify
NEXT_PUBLIC_REDIRECT_URI=https://votre-app.vercel.app
```

4. **Déployez !** Vercel détectera automatiquement Next.js et déploiera votre app

### Déploiement via CLI

1. **Installez Vercel CLI**

```bash
npm install -g vercel
```

2. **Connectez-vous à Vercel**

```bash
vercel login
```

3. **Déployez**

```bash
vercel
```

4. **Configurez les variables d'environnement**

```bash
vercel env add NEXT_PUBLIC_SPOTIFY_CLIENT_ID
vercel env add SPOTIFY_CLIENT_SECRET
vercel env add NEXT_PUBLIC_REDIRECT_URI
```

### Configuration Spotify pour Vercel

1. **Allez sur [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**

2. **Sélectionnez votre app**

3. **Ajoutez l'URL de redirection Vercel** :

   - `https://votre-app.vercel.app`
   - `https://votre-app.vercel.app/api/spotify/token`

4. **Mettez à jour votre `.env.local`** avec l'URL Vercel :

```env
NEXT_PUBLIC_REDIRECT_URI=https://votre-app.vercel.app
```

### Avantages du déploiement Vercel

- **HTTPS automatique** (requis pour Spotify)
- **Déploiement automatique** à chaque push
- **Performance optimisée** avec Edge Functions
- **Variables d'environnement** sécurisées
- **Prévisualisation** des pull requests
- **Analytics** intégrés

## 📱 Utilisation

### Sans authentification Spotify

- Recherchez et ajoutez des albums à votre top 50
- Réorganisez avec le drag & drop
- Partagez via texte, lien, QR code ou image
- Toutes les fonctionnalités de base sont disponibles

### Avec authentification Spotify

1. Cliquez sur "Se connecter à Spotify" en haut à droite
2. Autorisez l'application à accéder à votre compte
3. Créez des playlists publiques de votre top 50
4. Partagez directement vers Spotify

## 🛠 Technologies utilisées

- **Framework** : Next.js 14 avec App Router
- **UI** : shadcn/ui + Tailwind CSS
- **Authentification** : Spotify OAuth 2.0
- **API** : Spotify Web API
- **Langage** : TypeScript
- **État** : React Hooks + localStorage
- **Images** : Next.js Image Optimization
- **Partage** : html2canvas pour les images
- **Performance** : Skeletons et chargement optimisé

## 🔧 Configuration avancée

### Variables d'environnement

| Variable                        | Description           | Requis          |
| ------------------------------- | --------------------- | --------------- |
| `NEXT_PUBLIC_SPOTIFY_CLIENT_ID` | Client ID Spotify     | Oui (pour auth) |
| `SPOTIFY_CLIENT_SECRET`         | Client Secret Spotify | Oui (pour auth) |
| `NEXT_PUBLIC_REDIRECT_URI`      | URL de redirection    | Oui (pour auth) |

### Déploiement sur d'autres plateformes

L'application peut être déployée sur :

- **Vercel** (recommandé) - Configuration automatique
- **Netlify** - Support Next.js complet
- **Railway** - Déploiement simple
- **Tout hébergeur** supportant Next.js

N'oubliez pas de configurer les variables d'environnement sur votre plateforme de déploiement.

### 🚨 Important

Spotify exige HTTPS pour les URLs de redirection.

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

- Signaler des bugs
- Proposer des améliorations
- Soumettre des pull requests

## 📄 Licence

Ce projet est sous licence MIT.

## 🙏 Remerciements

- [Spotify Web API](https://developer.spotify.com/documentation/web-api/) pour l'accès aux données musicales
- [shadcn/ui](https://ui.shadcn.com/) pour les composants UI
- [Next.js](https://nextjs.org/) pour le framework
- [Tailwind CSS](https://tailwindcss.com/) pour le styling
- [Vercel](https://vercel.com/) pour l'hébergement et le déploiement
