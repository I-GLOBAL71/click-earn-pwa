# 📚 Guide Git pour la Migration

Ce guide explique comment utiliser Git et GitHub pour déployer votre application.

---

## 🎯 Objectif

Comprendre comment:
1. Initialiser un repository Git
2. Committer votre code
3. Pousser sur GitHub
4. Laisser Vercel et Firebase se déployer automatiquement

---

## 📋 CONCEPTS DE BASE

### Qu'est-ce que Git?
Git est un système de **contrôle de version**. Il permet de:
- Sauvegarder l'historique de votre code
- Travailler en équipe
- Revenir à une version précédente si besoin

### Qu'est-ce que GitHub?
GitHub est une plateforme où vous **stockez votre code en ligne**. Elle permet:
- La sauvegarde cloud
- Le partage avec d'autres
- L'intégration avec Vercel et Firebase

---

## 🚀 DÉMARRAGE RAPIDE

### Étape 1: Initialiser Git (première fois)

```bash
# Naviguez dans votre dossier du projet
cd C:\Users\Administrateur\Documents\project\click-earn-pwa

# Initialisez Git
git init

# Configurez votre identité (une fois)
git config user.name "Votre Nom"
git config user.email "votre.email@example.com"

# Vérifiez la configuration
git config --list
```

### Étape 2: Ajouter et committer votre code

```bash
# Voyez les fichiers modifiés
git status

# Ajoutez TOUS les fichiers
git add .

# Vérifiez les changements
git status

# Créez un "snapshot" (commit)
git commit -m "Setup migration to Firebase, Vercel, and Neon"
```

### Étape 3: Créer un repository sur GitHub

1. Allez sur https://github.com/new
2. Nom: `click-earn-pwa`
3. Description: "Click to Earn PWA - Affiliate Platform"
4. Sélectionnez "Private" (vos données sont sensibles)
5. Cliquez "Create repository"

### Étape 4: Pousser votre code sur GitHub

Après avoir créé le repo GitHub, vous verrez des instructions. Suivez-les:

```bash
# Renommez la branche en "main"
git branch -M main

# Ajoutez l'adresse GitHub
git remote add origin https://github.com/[votre-username]/click-earn-pwa.git

# Poussez votre code
git push -u origin main
```

**Résultat:** Votre code est maintenant sur GitHub! ✅

---

## 📝 WORKFLOW QUOTIDIEN

### Après chaque modification:

```bash
# 1. Voyez ce qui a changé
git status

# 2. Ajoutez les fichiers modifiés
git add .
# Ou ajoutez des fichiers spécifiques:
# git add src/App.tsx api/track-click.ts

# 3. Créez un commit avec un message clair
git commit -m "Add new feature: product filtering"

# 4. Poussez sur GitHub
git push
```

### Messages de commit conseillés

```bash
# Feature (nouvelle fonctionnalité)
git commit -m "Add product filtering feature"

# Bug fix
git commit -m "Fix API CORS issue"

# Configuration
git commit -m "Update Vercel environment variables"

# Documentation
git commit -m "Update deployment guide"

# Refactor
git commit -m "Refactor database queries for performance"
```

---

## 🔐 CE QUE NE PAS COMMITER

### Fichiers à NE JAMAIS pousser:

```
❌ .env.local              # Vos credentials Firebase
❌ serviceAccountKey.json  # Clé de service Firebase
❌ node_modules/           # Trop gros
❌ dist/                   # Généré automatiquement
❌ .DS_Store               # Fichier système Mac
❌ *.log                   # Fichiers logs
```

### Vérifiez que `.gitignore` les contient:

```bash
# Voyez le contenu de .gitignore
cat .gitignore
```

Si manquant, ajoutez:
```
.env.local
.env*.local
serviceAccountKey.json
node_modules/
dist/
.DS_Store
*.log
```

---

## 🔄 INTÉGRATION AVEC VERCEL

### Comment ça marche:

1. Vous poussez sur GitHub: `git push`
2. Vercel voit le changement
3. Vercel rebuild votre app automatiquement
4. Votre app est mise à jour en production ✅

### Vérifier le statut:

```bash
# Allez à https://vercel.com/dashboard
# Vous verrez vos déploiements
```

---

## 🔄 INTÉGRATION AVEC FIREBASE

### Comment ça marche:

**Option 1: Déploiement manuel (recommandé au début)**
```bash
git push                    # Poussez sur GitHub
firebase deploy             # Déployez manuellement sur Firebase
```

**Option 2: Déploiement automatique (optionnel)**
1. Firebase Hosting → "Connect repository"
2. Sélectionnez votre repo GitHub
3. Configurez les paramètres
4. Maintenant, chaque `git push` déclenche un déploiement

---

## 📊 EXEMPLE COMPLET

### Vous modifiez quelque chose:

```bash
# 1. Vous modifiez src/App.tsx
# 2. Vous testez localement
npm run dev

# 3. Vous vérifie que c'est OK
npm run build
npm run preview

# 4. Vous committez
git add .
git commit -m "Update App component with new hero section"

# 5. Vous poussez
git push

# 6. Vercel détecte le changement et redéploie automatiquement
# Vérifiez sur https://vercel.com/dashboard

# 7. Vous testez sur https://yourapp.vercel.app
```

---

## 🔍 COMMANDES GIT UTILES

### Voir l'historique
```bash
# Voir les derniers commits
git log

# Voir les 5 derniers
git log -5

# Format court
git log --oneline
```

### Voir les changements
```bash
# Voir les fichiers modifiés
git status

# Voir les détails des modifications
git diff

# Voir les différences d'un fichier spécifique
git diff src/App.tsx
```

### Annuler des changements
```bash
# Annuler les changements d'un fichier
git checkout -- src/App.tsx

# Annuler TOUS les changements (attention!)
git reset --hard

# Récupérer la version du serveur
git pull
```

### Branches (optionnel, avancé)
```bash
# Créer une nouvelle branche
git checkout -b feature/new-feature

# Voir les branches
git branch -a

# Changer de branche
git checkout main

# Fusionner une branche dans main
git merge feature/new-feature

# Supprimer une branche
git branch -d feature/new-feature
```

---

## 🆘 ERREURS COURANTES

### Erreur: "fatal: not a git repository"

**Cause:** Vous n'êtes pas dans le bon dossier

**Solution:**
```bash
# Naviguez dans le dossier du projet
cd C:\Users\Administrateur\Documents\project\click-earn-pwa

# Vérifiez que .git existe
dir .git

# Si pas .git, initialisez:
git init
```

### Erreur: "Authentication failed"

**Cause:** Vos credentials GitHub sont incorrects

**Solution:**
```bash
# Reconfigurer Git
git config user.name "Votre Nom"
git config user.email "votre.email@gmail.com"

# Ou utilisez un Personal Access Token:
# 1. Allez à GitHub → Settings → Developer settings → Personal access tokens
# 2. Créez un nouveau token (cochez repo)
# 3. Copiez le token
# 4. Quand Git demande le password, collez le token
```

### Erreur: "Updates were rejected"

**Cause:** GitHub a des commits que vous n'avez pas

**Solution:**
```bash
# Récupérez les changements du serveur
git pull

# Puis poussez
git push
```

### Erreur: ".env.local accidentellement committed"

**Cause:** Vous avez committé vos secrets

**Solution:**
```bash
# Supprimez-le de Git (mais pas du disque)
git rm --cached .env.local

# Assurez-vous que .gitignore le contient
# Ajoutez .env.local dans .gitignore

# Committez la suppression
git add .gitignore
git commit -m "Remove .env.local from tracking"

# Poussez
git push
```

### Erreur: "Large file uploaded"

**Cause:** Vous avez uploadé un fichier trop gros (> 100MB)

**Solution:**
```bash
# Utilisez Git LFS pour les gros fichiers
git lfs install
git lfs track "*.mp4"
git add .gitattributes
git commit -m "Add git lfs"
git push
```

---

## 📚 RESSOURCES

### Commandes essentielles à retenir:
```bash
git status          # Voir l'état actuel
git add .           # Ajouter tous les fichiers
git commit -m "..."  # Créer un commit
git push            # Envoyer sur GitHub
git pull            # Récupérer de GitHub
git log             # Voir l'historique
```

### Documentation officielle:
- Git: https://git-scm.com/doc
- GitHub: https://docs.github.com
- GitHub CLI: https://cli.github.com

### Tutoriels:
- GitHub Learning Lab: https://lab.github.com
- Interactive Git Tutorial: https://learngitbranching.js.org

---

## ✅ CHECKLIST

- [ ] Git est installé (`git --version`)
- [ ] Git est configuré (`git config --list`)
- [ ] Vous êtes dans le bon dossier
- [ ] Repository GitHub créé
- [ ] `.gitignore` contient les bons fichiers
- [ ] Code committé localement
- [ ] Code poussé sur GitHub
- [ ] Vercel détecte les changements
- [ ] Firebase peut être lié au repo (optionnel)

---

**Maintenant vous êtes prêt à utiliser Git et GitHub! 🚀**

**Prochaine étape:** [Allez à SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)