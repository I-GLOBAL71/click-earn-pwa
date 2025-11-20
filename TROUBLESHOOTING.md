# 🆘 Guide de Dépannage - Migration Firebase, Vercel, Neon

Ce guide aide à résoudre les problèmes courants lors de la migration.

---

## 🔴 ERREUR NEON: "schema 'auth' does not exist"

### Symptôme
```
ERROR: schema "auth" does not exist (SQLSTATE 3F000)
```

### Cause
Vous utilisez la mauvaise migration. La migration standard utilise Supabase Auth (qui crée le schema `auth`), mais vous utilisez **Firebase Auth**.

### Solution ✅

**Utilisez la bonne migration:**

1. **Supprimez:** `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql`
   - Cette migration est pour Supabase Auth
   - Elle génère l'erreur "schema auth does not exist"

2. **Utilisez:** `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql` ✅
   - Cette migration est pour Firebase Auth + Neon
   - Pas de dépendance Supabase
   - Crée table `users` avec Firebase UIDs

**Étapes:**
1. Allez à https://console.neon.tech
2. SQL Editor
3. Ouvrez `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql`
4. Copiez TOUT
5. Collez dans Neon SQL Editor
6. Exécutez
7. ✅ Pas d'erreur!

**Voir:** [NEON_FIREBASE_SETUP.md](./NEON_FIREBASE_SETUP.md) pour plus de détails

---

## 🔴 ERREUR NEON: "type 'app_role' already exists"

### Symptôme
```
ERROR: type "app_role" already exists (SQLSTATE 42710)
```

### Cause
La migration a été exécutée partiellement. Le type `app_role` existe déjà, mais pas les tables.

### Solution 1: Exécuter à nouveau la migration (RECOMMANDÉ)
La migration a été mise à jour pour gérer ce cas:
1. Allez à Neon SQL Editor
2. Exécutez à nouveau `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql`
3. Cette fois ça devrait fonctionner! ✅

Pourquoi? La nouvelle version inclut `IF NOT EXISTS` et gère les doublons.

### Solution 2: Créer une nouvelle base de données
1. Allez à https://console.neon.tech
2. Sélectionnez "Databases"
3. Supprimez l'ancienne base
4. Créez une nouvelle
5. Exécutez les migrations depuis le début

**Voir:** [NEON_SETUP.md](./NEON_SETUP.md) pour plus de détails

---

## 🔴 ERREUR: "Function Runtimes must have a valid version"

### Symptôme
```
Error: Function Runtimes must have a valid version, for example `now-php@1.0.0`.
```

### Cause
Le fichier `vercel.json` est mal configuré ou manquant.

### Solution
1. Vérifiez que `vercel.json` existe à la racine du projet
2. Vérifiez le contenu:
   ```json
   {
     "functions": {
       "api/**/*.ts": {
         "runtime": "nodejs20.x"
       }
     }
   }
   ```
3. Si le problème persiste:
   ```bash
   rm vercel.json
   # Recréez-le avec le bon format
   ```

---

## 🔴 ERREUR: "Cannot find module"

### Symptôme
```
Error: Cannot find module '@supabase/supabase-js'
Module not found
```

### Cause
Les dépendances ne sont pas installées.

### Solution
```bash
# Windows
del package-lock.json
rmdir /s node_modules
npm install --legacy-peer-deps

# Mac/Linux
rm package-lock.json
rm -rf node_modules
npm install --legacy-peer-deps
```

---

## 🔴 ERREUR: "ENOENT: no such file or directory"

### Symptôme
```
Error: ENOENT: no such file or directory, stat 'C:\...\dist'
```

### Cause
Le build n'a pas généré le dossier `dist`.

### Solution
```bash
# Nettoyez et rebuildiez
npm run build --legacy-peer-deps

# Si ça échoue, cherchez l'erreur
npm run build
# Lisez l'erreur complète
```

---

## 🔴 ERREUR: Build échoue sur Vercel

### Comment voir les logs
1. Allez à https://vercel.com/dashboard
2. Cliquez sur `click-earn-pwa`
3. Cliquez sur le déploiement en rouge (FAILED)
4. Allez à l'onglet "Logs"
5. Lisez l'erreur complète

### Erreurs courantes du build

#### "Missing environment variable"
```
Error: NEON_DATABASE_URL is not defined
```

**Solution:**
1. Allez à Vercel Dashboard
2. Settings → Environment Variables
3. Vérifiez que `NEON_DATABASE_URL` est présent
4. Redéployez

#### "TypeScript compilation error"
```
error TS2307: Cannot find module
```

**Solution:**
```bash
# Vérifiez localement d'abord
npm run build

# Fixez l'erreur TypeScript
# Puis poussez sur GitHub
```

#### "Port already in use"
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Trouvez le process qui utilise le port
# Windows
netstat -ano | findstr :3000

# Mac/Linux
lsof -i :3000

# Puis kill-le
# Windows
taskkill /PID [PID] /F

# Mac/Linux
kill -9 [PID]
```

---

## 🔴 ERREUR: Firebase deployment échoue

### Symptôme
```
firebase deploy --project click-earn-pwa
# Échoue avec une erreur
```

### Solution 1: Vérifier l'authentification
```bash
firebase logout
firebase login
firebase deploy --project click-earn-pwa
```

### Solution 2: Vérifier firebase.json
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Solution 3: Reconstruire
```bash
npm run build
firebase deploy --project click-earn-pwa
```

---

## 🔴 ERREUR: Variables d'environnement non trouvées

### Localement

**Problème:** `.env.local` manquant ou mal configuré

**Solution:**
```bash
# Créez le fichier
touch .env.local

# Ou sous Windows
echo. > .env.local

# Copiez le contenu de .env.example
# Et remplissez avec vos valeurs Firebase
```

### Sur Vercel

**Problème:** Variables d'environnement non définies sur Vercel

**Solution:**
1. Allez à Vercel Dashboard
2. Sélectionnez votre projet
3. Settings → Environment Variables
4. Vérifiez que toutes les variables sont présentes:
   - `NEON_DATABASE_URL`
   - `APP_PUBLIC_URL`
   - Autres si nécessaire

---

## 🔴 ERREUR: Base de données non accessible

### Symptôme
```
Error: connect ECONNREFUSED 127.0.0.1:5432
Error: password authentication failed
```

### Cause
La connexion à Neon échoue.

### Solution

1. **Vérifiez la URL Neon:**
   - Allez à https://console.neon.tech
   - Copier la connection string PostgreSQL
   - Vérifiez qu'elle est correcte

2. **Vérifiez sur Vercel:**
   - La variable `NEON_DATABASE_URL` est définie
   - Elle est exacte (pas d'espace blanc)

3. **Testez localement:**
   ```bash
   # Créez un test simple
   node -e "const { neon } = require('@neondatabase/serverless'); const sql = neon(process.env.NEON_DATABASE_URL); sql('SELECT 1').then(r => console.log('OK')).catch(e => console.error(e))"
   ```

4. **Vérifiez les tables:**
   - Allez à https://console.neon.tech
   - Allez à "SQL Editor"
   - Exécutez: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`
   - Vérifiez que vos tables existent

---

## 🔴 ERREUR: Connexion CORS bloquée

### Symptôme
```
Access to XMLHttpRequest at 'https://api.vercel.app/api/...' from origin 'https://yourapp.firebaseapp.com' has been blocked by CORS policy
```

### Cause
Les CORS ne sont pas configurés sur Vercel.

### Solution

Vérifiez que vos APIs Vercel ont les bons headers:

```typescript
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Votre code...
}
```

---

## 🔴 ERREUR: Les données ne persistent pas

### Symptôme
```
Insert fonctionne localement, mais pas en production
```

### Cause
1. La base de données n'est pas la même localement vs production
2. Les migrations ne sont pas exécutées
3. Les permissions ne sont pas correctes

### Solution

1. **Vérifiez les migrations:**
   ```bash
   # Sur Neon Dashboard → SQL Editor
   SELECT table_name FROM information_schema.tables WHERE table_schema='public';
   ```

2. **Vérifiez la connexion Vercel:**
   - La variable `NEON_DATABASE_URL` sur Vercel
   - Elle pointe vers le bon projet Neon

3. **Testez l'insertion:**
   ```bash
   # Créez une simple fonction de test
   ```

---

## 🟡 AVERTISSEMENT: Dépendances obsolètes

### Symptôme
```
npm WARN deprecated ...
```

### Solution
Ce n'est généralement pas grave pour le déploiement, mais vous pouvez mettre à jour:

```bash
npm update
npm audit fix
```

---

## 🟡 AVERTISSEMENT: Files non commitées

### Symptôme
```
git status
# Montre des fichiers modifiés
```

### Assurez-vous que `.gitignore` contient:
```
.env.local
.env*.local
node_modules/
dist/
.DS_Store
*.log
```

---

## ✅ TESTS DE VÉRIFICATION

### Test 1: Build local fonctionne
```bash
npm run build
# Devrait créer le dossier dist/
```

### Test 2: Preview local fonctionne
```bash
npm run preview
# Devrait servir le site sur http://localhost:4173
```

### Test 3: Variables d'environnement locales
```bash
# Vérifiez que .env.local existe et a les bonnes valeurs
cat .env.local
```

### Test 4: API Vercel répond
```bash
# Une fois déployée, testez l'API
curl https://yourapp.vercel.app/api/track-click
# Devrait retourner une réponse (même une erreur 404 est OK)
```

### Test 5: Firebase hosting charge
```bash
# Une fois déployée, ouvrez
https://yourapp.firebaseapp.com
# Devrait voir votre site
```

### Test 6: Base de données répond
```bash
# Sur Neon Dashboard → SQL Editor
SELECT NOW();
# Devrait retourner l'heure actuelle
```

---

## 🔧 COMMANDES UTILES

### Vérifier les versions
```bash
node --version
npm --version
git --version
firebase --version
```

### Nettoyer le cache npm
```bash
npm cache clean --force
```

### Réinstaller complètement
```bash
# Windows
del package-lock.json
rmdir /s /q node_modules
npm install --legacy-peer-deps

# Mac/Linux
rm package-lock.json
rm -rf node_modules
npm install --legacy-peer-deps
```

### Logs en temps réel
```bash
# Firebase
firebase functions:log

# Vercel (depuis leur dashboard)
# https://vercel.com/dashboard → Deployments → Logs

# Neon (depuis leur dashboard)
# https://console.neon.tech → Monitoring
```

---

## 📞 AIDE ADDITIONNELLE

Si vous êtes toujours bloqué:

1. **Lisez à nouveau:**
   - [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
   - [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)

2. **Cherchez sur:**
   - Google: "Vercel [votre erreur]"
   - StackOverflow: firebase + vercel + neon
   - GitHub Issues: des projets similaires

3. **Documentation officielle:**
   - Neon: https://neon.tech/docs
   - Vercel: https://vercel.com/docs
   - Firebase: https://firebase.google.com/docs
   - React: https://react.dev

4. **Communautés:**
   - Discord Vercel
   - Discord Firebase
   - Reddit r/webdev

---

**Bon courage! 💪 Vous allez y arriver! 🚀**