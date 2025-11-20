#!/bin/bash

# Script de déploiement automatisé
# Usage: ./deploy.sh

set -e

echo "🚀 Script de Déploiement Click Earn PWA"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier les prérequis
echo -e "${YELLOW}[1/5]${NC} Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git n'est pas installé${NC}"
    exit 1
fi

if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI n'est pas installé${NC}"
    echo "   Installez avec: npm install -g firebase-tools --legacy-peer-deps"
    exit 1
fi

echo -e "${GREEN}✅ Tous les prérequis sont présents${NC}"
echo ""

# Installer les dépendances
echo -e "${YELLOW}[2/5]${NC} Installation des dépendances..."
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install --legacy-peer-deps
echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

# Vérifier les variables d'environnement
echo -e "${YELLOW}[3/5]${NC} Vérification des variables d'environnement..."
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Fichier .env.local non trouvé${NC}"
    echo "   Créez .env.local avec vos variables Firebase"
    exit 1
fi

if ! grep -q "VITE_FIREBASE_API_KEY" .env.local; then
    echo -e "${RED}❌ VITE_FIREBASE_API_KEY manquante dans .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables d'environnement OK${NC}"
echo ""

# Build
echo -e "${YELLOW}[4/5]${NC} Build du projet..."
npm run build > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build échoué${NC}"
    npm run build
    exit 1
fi
echo -e "${GREEN}✅ Build réussi${NC}"
echo ""

# Déploiement
echo -e "${YELLOW}[5/5]${NC} Déploiement sur Firebase Hosting..."
firebase deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Déploiement Firebase échoué${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Déploiement Firebase réussi${NC}"
echo ""

echo -e "${GREEN}✅ Déploiement complet!${NC}"
echo ""
echo "Prochaines étapes:"
echo "1. Vérifiez que le site est en ligne:"
echo "   https://console.firebase.google.com"
echo ""
echo "2. Testez votre application"
echo ""
echo "3. Vérifiez les logs:"
echo "   firebase functions:log"