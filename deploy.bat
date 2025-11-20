@echo off
REM Script de déploiement automatisé pour Windows
REM Usage: deploy.bat

echo.
echo 🚀 Script de Deploiement Click Earn PWA
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Couleurs (simulées pour Windows)
set "GREEN=[OK]"
set "RED=[ERREUR]"
set "YELLOW=[STEP]"

REM Vérifier les prérequis
echo %YELLOW% [1/5] Verification des prerequis...

where node >nul 2>nul
if errorlevel 1 (
    echo %RED% Node.js n'est pas installe
    exit /b 1
)

where git >nul 2>nul
if errorlevel 1 (
    echo %RED% Git n'est pas installe
    exit /b 1
)

where firebase >nul 2>nul
if errorlevel 1 (
    echo %RED% Firebase CLI n'est pas installe
    echo Installez avec: npm install -g firebase-tools --legacy-peer-deps
    exit /b 1
)

echo %GREEN% Tous les prerequis sont presents
echo.

REM Installer les dépendances
echo %YELLOW% [2/5] Installation des dependances...
call npm install --legacy-peer-deps
if errorlevel 1 (
    echo %RED% Echec de l'installation des dependances
    exit /b 1
)
echo %GREEN% Dependances installees
echo.

REM Vérifier les variables d'environnement
echo %YELLOW% [3/5] Verification des variables d'environnement...
if not exist .env.local (
    echo %RED% Fichier .env.local non trouve
    echo Creez .env.local avec vos variables Firebase
    exit /b 1
)

findstr "VITE_FIREBASE_API_KEY" .env.local >nul
if errorlevel 1 (
    echo %RED% VITE_FIREBASE_API_KEY manquante dans .env.local
    exit /b 1
)

echo %GREEN% Variables d'environnement OK
echo.

REM Build
echo %YELLOW% [4/5] Build du projet...
call npm run build
if errorlevel 1 (
    echo %RED% Build echoue
    exit /b 1
)
echo %GREEN% Build reussi
echo.

REM Déploiement
echo %YELLOW% [5/5] Deploiement sur Firebase Hosting...
call firebase deploy
if errorlevel 1 (
    echo %RED% Deploiement Firebase echoue
    exit /b 1
)
echo %GREEN% Deploiement Firebase reussi
echo.

echo %GREEN% Deploiement complet!
echo.
echo Prochaines etapes:
echo 1. Verifiez que le site est en ligne:
echo    https://console.firebase.google.com
echo.
echo 2. Testez votre application
echo.
echo 3. Verifiez les logs:
echo    firebase functions:log
echo.

pause