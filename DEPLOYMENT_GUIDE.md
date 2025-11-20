# Guide de Déploiement: Click Earn PWA

Ce guide vous aide à déployer votre application sur Firebase Hosting, Vercel et Neon.

---

## 📋 TABLE DES MATIÈRES
1. [Setup Neon (Base de données)](#setup-neon)
2. [Setup Vercel (Backend)](#setup-vercel)
3. [Setup Firebase (Frontend)](#setup-firebase)
4. [Variables d'environnement](#variables-denvironnement)
5. [Déploiement via GitHub](#déploiement-via-github)
6. [Tests et Vérifications](#tests-et-vérifications)

---

## 🗄️ SETUP NEON

### Étape 1: Créer un compte Neon
1. Allez sur https://neon.tech
2. Cliquez "Sign Up"
3. Créez un compte avec votre email ou GitHub

### Étape 2: Créer un projet Neon
1. Cliquez "New Project"
2. Nom: `click-earn-pwa`
3. Region: Choisissez la plus proche (Europe/Afrique)
4. Cliquez "Create project"

### Étape 3: Récupérer la chaîne de connexion
1. Dans votre dashboard Neon, allez à "Connection String"
2. Copiez la URL PostgreSQL complète (ressemble à):
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
3. **Sauvegardez cette URL** - vous en aurez besoin pour Vercel

### Étape 4: Exécuter les migrations
1. Dans Neon, allez à "SQL Editor"
2. Copiez le contenu de `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql`
3. Exécutez-le dans l'éditeur SQL
4. Copiez le contenu de `supabase/migrations/20251114143445_b264331f-5951-4b6c-aa00-37c3d904c9ad.sql`
5. Exécutez-le aussi

**Résultat:** Vos tables sont créées ✅

---

## ⚡ SETUP VERCEL

### Étape 1: Créer un compte Vercel
1. Allez sur https://vercel.com
2. Cliquez "Sign Up"
3. **Préférez "Continue with GitHub"** (simplifie tout)
4. Autorisez Vercel à accéder à vos repos

### Étape 2: Importer votre repository
1. Dans Vercel, cliquez "Add New..." → "Project"
2. Cliquez "Import Git Repository"
3. Cherchez et sélectionnez `click-earn-pwa`
4. Cliquez "Import"

### Étape 3: Configurer les variables d'environnement
1. Dans le formulaire "Configure Project":
   - **Build Command:** `npm run build --legacy-peer-deps` (déjà rempli normalement)
   - **Output Directory:** `dist`
   - **Install Command:** `npm install --legacy-peer-deps`

2. Cliquez "Environment Variables"
3. Ajoutez ces variables (copier depuis `.env.example`):

| Clé | Valeur |
|-----|--------|
| `NEON_DATABASE_URL` | Votre URL Neon (voir Étape 3 Neon) |
| `SUPABASE_URL` | Votre URL Supabase (si utilisé) |
| `SUPABASE_ANON_KEY` | Votre clé Supabase (si utilisé) |
| `APP_PUBLIC_URL` | `https://yourapp.firebaseapp.com` |

4. Cliquez "Deploy" pour commencer le déploiement

### Étape 4: Récupérer votre URL Vercel
1. Après le déploiement, vous verrez l'URL: `https://xxxxx.vercel.app`
2. **Notez cette URL** - vous en aurez besoin pour Firebase

**Résultat:** Votre backend est déployé ✅

---

## 🔥 SETUP FIREBASE

### Étape 1: Créer un compte Firebase
1. Allez sur https://firebase.google.com
2. Cliquez "Aller à la console"
3. Connectez-vous avec Google

### Étape 2: Créer un projet Firebase
1. Cliquez "Ajouter un projet"
2. Nom: `click-earn-pwa`
3. Acceptez les conditions
4. Cliquez "Créer un projet"

### Étape 3: Créer une application web
1. Dans la console, cliquez l'icône `</>` (Add app)
2. Sélectionnez "Web"
3. Nom: `click-earn-pwa`
4. Cliquez "Register app"
5. **Copiez la configuration** (vous en aurez besoin)

### Étape 4: Activer Firebase Hosting
1. Dans le menu latéral, allez à "Hosting"
2. Cliquez "Commencer"
3. Suivez les étapes (installez Firebase CLI si nécessaire)

### Étape 5: Mettre à jour .env.local
Créez ou mettez à jour `.env.local` avec la configuration Firebase copiée:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=yourapp.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=yourapp
VITE_FIREBASE_STORAGE_BUCKET=yourapp.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
VITE_API_URL=https://xxxxx.vercel.app
```

**Résultat:** Firebase est configuré ✅

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### Sur Vercel (Backend)
Allez à: **Settings** → **Environment Variables**

Ajoutez:
```
NEON_DATABASE_URL = [de Neon]
SUPABASE_URL = [si utilisé]
SUPABASE_ANON_KEY = [si utilisé]
APP_PUBLIC_URL = https://yourapp.firebaseapp.com
NODE_ENV = production
```

### Localement (.env.local)
Créez `.env.local` à la racine du projet:
```
VITE_FIREBASE_API_KEY=[de Firebase]
VITE_FIREBASE_AUTH_DOMAIN=[de Firebase]
VITE_FIREBASE_PROJECT_ID=[de Firebase]
VITE_FIREBASE_STORAGE_BUCKET=[de Firebase]
VITE_FIREBASE_MESSAGING_SENDER_ID=[de Firebase]
VITE_FIREBASE_APP_ID=[de Firebase]
VITE_API_URL=https://xxxxx.vercel.app
```

**⚠️ IMPORTANT:** `.env.local` ne doit JAMAIS être committé (voir `.gitignore`)

---

## 🚀 DÉPLOIEMENT VIA GITHUB

### Étape 1: Préparer votre code
```bash
# Mettez à jour votre .env.local
# Testez localement
npm run build
npm run preview

# Si OK, continuez
```

### Étape 2: Pousser sur GitHub
```bash
# Si premier push
git init
git add .
git commit -m "Setup migration to Firebase, Vercel, and Neon"
git branch -M main
git remote add origin https://github.com/[votre-username]/click-earn-pwa.git
git push -u origin main

# Pushes suivants
git add .
git commit -m "Your message"
git push
```

### Étape 3: Vérifier les déploiements
1. **Vercel:** Allez à https://vercel.com/dashboard, cliquez sur `click-earn-pwa`
   - Vous devriez voir un déploiement "Building"
   - Attendez qu'il devienne "Ready"

2. **Firebase:** Allez à https://console.firebase.google.com
   - Allez à "Hosting"
   - Déployez manuellement:
     ```bash
     npm install -g firebase-tools --legacy-peer-deps
     firebase login
     firebase deploy --project click-earn-pwa
     ```

### Étape 4: Configurer le déploiement automatique Firebase (optionnel)
1. Dans Firebase Hosting, cliquez "Connect repository"
2. Sélectionnez GitHub et votre repo
3. Configurez:
   - **Branch:** main
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install --legacy-peer-deps`

**Résultat:** À chaque push sur main, tout se déploie automatiquement ✅

---

## ✅ TESTS ET VÉRIFICATIONS

### Tester localement
```bash
# Installer les dépendances
npm install --legacy-peer-deps

# Développement
npm run dev

# Vérifier le build
npm run build
npm run preview

# Linting
npm lint
```

### Vérifier après déploiement
1. **Frontend (Firebase):**
   - Ouvrez https://yourapp.firebaseapp.com
   - Vérifiez que la page s'affiche correctement

2. **Backend (Vercel):**
   - Testez une API: `https://xxxxx.vercel.app/api/track-click`
   - Vérifiez les logs: Vercel Dashboard → Deployments → Logs

3. **Database (Neon):**
   - Allez à Neon Dashboard
   - Vérifiez que les données s'ajoutent dans les tables

### Vérifier les variables d'environnement
```bash
# Localement
cat .env.local  # Ne commitez PAS ce fichier!

# Sur Vercel
# Allez à: Dashboard → Settings → Environment Variables
```

---

## 📞 TROUBLESHOOTING

### Erreur: "Function Runtimes must have a valid version"
**Cause:** `vercel.json` mal configuré
**Solution:** Vérifiez que le fichier `vercel.json` existe et contient `"runtime": "nodejs20.x"`

### Erreur: "Cannot find module"
**Solution:** 
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Build échoue sur Vercel
1. Allez à Vercel Dashboard
2. Cliquez sur le déploiement en erreur
3. Allez à "Logs" et lisez les erreurs
4. Fixez le code localement
5. Poussez sur GitHub

### Firebase déploiement échoue
```bash
firebase logout
firebase login
firebase deploy --project click-earn-pwa
```

---

## 🎯 CHECKLIST FINALE

- [ ] Compte Neon créé
- [ ] Base de données Neon prête (URL copiée)
- [ ] Migrations Neon exécutées
- [ ] Compte Vercel créé
- [ ] Repo GitHub connecté à Vercel
- [ ] Variables d'environnement Vercel configurées
- [ ] Vercel déploiement réussi (status "Ready")
- [ ] Compte Firebase créé
- [ ] App web Firebase créée (credentials copiées)
- [ ] `.env.local` créé avec Firebase credentials
- [ ] Code poussé sur GitHub
- [ ] Frontend se charge correctement
- [ ] APIs Vercel répondent correctement
- [ ] Données s'ajoutent dans Neon

---

## 📚 RESSOURCES UTILES

- Neon Docs: https://neon.tech/docs
- Vercel Docs: https://vercel.com/docs
- Firebase Docs: https://firebase.google.com/docs
- GitHub: https://github.com

---

**Bonne chance! 🚀**