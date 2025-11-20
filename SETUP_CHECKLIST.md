# ✅ CHECKLIST DE SETUP - POUR DÉBUTANTS

Suivez cette checklist étape par étape. Ne passez à l'étape suivante que quand la précédente est complétée.

---

## 🔵 PHASE 1: PRÉPARATION (5 minutes)

### A. Préparez vos comptes
- [ ] Créez un compte GitHub (https://github.com/signup)
- [ ] Créez un compte Google (pour Firebase)
- [ ] Préparez un email pour Neon et Vercel

### B. Clonez votre repo localement
```bash
# Sur votre ordinateur, ouvrez le terminal
cd Documents
git clone https://github.com/[votre-username]/click-earn-pwa.git
cd click-earn-pwa
npm install --legacy-peer-deps
```

---

## 🟠 PHASE 2: SETUP NEON (10 minutes)

### Étape 1: Créer le compte et projet
1. Allez sur https://neon.tech
2. Cliquez "Sign Up"
3. Créez un compte
4. Cliquez "New Project"
5. Nom: `click-earn-pwa`
6. Région: Choisissez `Europe (Dublin)` ou `Africa` si disponible
7. Cliquez "Create project"

### Étape 2: Copier la chaîne de connexion
1. Dans votre dashboard Neon, trouvez "Connection String"
2. Cliquez sur le bouton "copy" à côté de la connexion PostgreSQL
3. Collez-la dans un fichier texte (garder pour plus tard)
4. **Format attendu:** `postgresql://user:password@host.neon.tech/db?sslmode=require`

### Étape 3: Créer les tables
1. Dans Neon, cliquez "SQL Editor"
2. Ouvrez le fichier: `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql`
3. Copiez tout le contenu SQL
4. Collez-le dans l'éditeur Neon
5. Cliquez "Execute"
6. Répétez avec le fichier: `supabase/migrations/20251114143445_b264331f-5951-4b6c-aa00-37c3d904c9ad.sql`

✅ **Résultat:** Votre base de données est prête!

---

## 🟡 PHASE 3: SETUP FIREBASE (15 minutes)

### Étape 1: Créer le projet Firebase
1. Allez sur https://firebase.google.com
2. Cliquez "Aller à la console"
3. Connectez-vous avec Google
4. Cliquez "Ajouter un projet"
5. Nom: `click-earn-pwa`
6. Acceptez les conditions
7. Cliquez "Créer un projet"

### Étape 2: Créer l'application Web
1. Dans la console Firebase, cherchez l'icône `</>` (à côté de "Analytics")
2. Cliquez dessus
3. Nom: `click-earn-pwa-web`
4. Cochez "Configurez également Firebase Hosting pour ce projet"
5. Cliquez "Register app"

### Étape 3: Copier la configuration
1. Vous verrez un bloc de code JavaScript avec `firebaseConfig`
2. **Copiez le contenu entre les accolades:** 
   ```javascript
   {
     apiKey: "AIzaSy...",
     authDomain: "...",
     projectId: "...",
     storageBucket: "...",
     messagingSenderId: "...",
     appId: "..."
   }
   ```

### Étape 4: Créer le fichier `.env.local`
1. À la racine de votre projet, créez un fichier nommé `.env.local`
2. Copiez-y ce contenu (remplacez les `[...]` par vos valeurs Firebase):
   ```
   VITE_FIREBASE_API_KEY=[apiKey]
   VITE_FIREBASE_AUTH_DOMAIN=[authDomain]
   VITE_FIREBASE_PROJECT_ID=[projectId]
   VITE_FIREBASE_STORAGE_BUCKET=[storageBucket]
   VITE_FIREBASE_MESSAGING_SENDER_ID=[messagingSenderId]
   VITE_FIREBASE_APP_ID=[appId]
   VITE_API_URL=https://click-earn-pwa.vercel.app
   ```

**Important:** Ne commitez PAS ce fichier! (Il est dans `.gitignore`)

### Étape 5: Activer Firebase Hosting
1. Dans Firebase, cliquez "Hosting" (dans le menu latéral)
2. Cliquez "Commencer"
3. Suivez les instructions
4. Quand ça dit "Install Firebase CLI", ouvrez votre terminal et faites:
   ```bash
   npm install -g firebase-tools --legacy-peer-deps
   firebase login
   ```
5. Continuez les instructions

✅ **Résultat:** Firebase est prêt!

---

## 🟢 PHASE 4: SETUP VERCEL (10 minutes)

### Étape 1: Créer le compte Vercel
1. Allez sur https://vercel.com
2. Cliquez "Sign Up"
3. **Cliquez "Continue with GitHub"** (important!)
4. Autorisez Vercel à accéder à GitHub

### Étape 2: Importer le projet
1. Dans Vercel, cliquez "Add New..." → "Project"
2. Cliquez "Import Git Repository"
3. Cherchez `click-earn-pwa` et cliquez dessus
4. Cliquez "Import"

### Étape 3: Configurer le build
La page vous montre 3 choses à configurer:

**Build Command:**
```
npm run build --legacy-peer-deps
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install --legacy-peer-deps
```

(Si c'est déjà rempli, laissez-le)

### Étape 4: Ajouter les variables d'environnement
1. Cherchez la section "Environment Variables"
2. Cliquez "Add"
3. Ajoutez ces variables (une par une):

| Clé | Valeur |
|-----|--------|
| `NEON_DATABASE_URL` | [Votre chaîne Neon de Phase 2] |
| `APP_PUBLIC_URL` | `https://click-earn-pwa.firebaseapp.com` |
| `NODE_ENV` | `production` |

4. Cliquez "Deploy"

### Étape 5: Attendre le déploiement
1. Vercel va commencer à builder
2. Attendez que le statut passe à "Ready" (vert)
3. Cliquez sur "Visit" pour tester
4. **Notez l'URL:** Elle ressemble à `https://click-earn-pwa.vercel.app`

✅ **Résultat:** Votre backend est déployé!

---

## 🔵 PHASE 5: DÉPLOIEMENT FRONTEND (5 minutes)

### Étape 1: Récupérer l'URL Vercel
1. Depuis Vercel, copiez votre URL (ex: `https://click-earn-pwa.vercel.app`)
2. Allez à votre `.env.local` et mettez à jour `VITE_API_URL` avec cette URL

### Étape 2: Tester localement
```bash
# Dans votre terminal
npm run build
npm run preview
```
Vérifiez que le site fonctionne correctement.

### Étape 3: Déployer sur Firebase
```bash
# Dans votre terminal
firebase deploy --project click-earn-pwa
```

### Étape 4: Vérifier
1. Allez à https://console.firebase.google.com
2. Cliquez "Hosting"
3. Vous devriez voir une "Deployment historique" avec un ✅ vert
4. Cliquez sur le lien de votre site pour le tester

✅ **Résultat:** Tout est déployé!

---

## 🟣 PHASE 6: CONFIGURATION GITHUB (5 minutes)

### Étape 1: Préparer votre repo
```bash
# Dans votre terminal, à la racine du projet
git add .
git commit -m "Setup migration to Firebase, Vercel, and Neon"
git push
```

### Étape 2: Configurer Vercel pour auto-deploy
1. Allez à Vercel Dashboard
2. Cliquez sur `click-earn-pwa`
3. Allez à "Settings" → "Git"
4. Vérifiez que "Vercel for GitHub" est activé
5. Désormais, chaque `git push` va redéployer automatiquement

### Étape 3: Configurer Firebase pour auto-deploy (optionnel)
1. Allez à Firebase Hosting
2. Cliquez "Connect a repository"
3. Sélectionnez GitHub et `click-earn-pwa`
4. Configurez:
   - Branch: `main`
   - Build command: `npm run build --legacy-peer-deps`
   - Output: `dist`

---

## ✅ FINAL CHECKLIST

Vérifiez que tout fonctionne:

### Neon
- [ ] Compte créé
- [ ] Base de données créée
- [ ] Tables créées
- [ ] URL de connexion copiée

### Firebase
- [ ] Compte créé
- [ ] Projet créé
- [ ] App web créée
- [ ] Credentials copiées dans `.env.local`
- [ ] Hosting activé

### Vercel
- [ ] Compte créé
- [ ] Repo connecté
- [ ] Build réussi
- [ ] Variables d'environnement ajoutées
- [ ] URL copiée

### Local
- [ ] `.env.local` créé
- [ ] `npm run build` fonctionne
- [ ] `npm run preview` fonctionne

### Frontend
- [ ] Site Firebase charge correctement
- [ ] API Vercel répond

### GitHub
- [ ] Repo créé
- [ ] Code poussé
- [ ] Auto-deploy configuré

---

## 🆘 AIDE RAPIDE

### "Build échoue sur Vercel"
1. Allez à Vercel Dashboard
2. Cliquez sur le déploiement en rouge
3. Allez à "Logs"
4. Lisez l'erreur et cherchez sur Google

### "Variables d'environnement manquantes"
1. Vercel Dashboard → Settings → Environment Variables
2. Vérifiez que `NEON_DATABASE_URL` est présent
3. Vérifiez qu'il n'y a pas d'espace blanc inutile

### "npm install échoue"
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### "Je ne vois pas mon site sur Firebase"
```bash
firebase logout
firebase login
firebase deploy --project click-earn-pwa
```

---

## 🎯 PROCHAINES ÉTAPES

Une fois tout en place:

1. Testez les APIs:
   - Allez à `https://yourapp.firebaseapp.com`
   - Testez les fonctionnalités

2. Vérifiez les données:
   - Allez à Neon Dashboard
   - Vérifiez que les données s'ajoutent dans les tables

3. Configurez un domaine personnalisé (optionnel):
   - Firebase: Settings → Custom domain
   - Vercel: Settings → Domains

4. Mettez en place le monitoring:
   - Vercel: Analytics
   - Firebase: Analytics
   - Neon: Monitoring

---

**Vous êtes prêt! Bon déploiement! 🚀**