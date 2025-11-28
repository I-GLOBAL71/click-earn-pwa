# Règle de Limitation des Functions Vercel

## Contexte
Notre formule actuelle chez Vercel limite le nombre de functions serverless à **12 maximum**. Le dépassement de cette limite entraînera des échecs de déploiement.

## Règle Obligatoire

**Le projet ne doit JAMAIS dépasser 12 functions serverless déployées simultanément.**

## Directives de Développement

### 1. Avant de créer une nouvelle function
- Vérifier le nombre actuel de functions dans le projet
- Si on approche de la limite (10+), chercher des opportunités de consolidation
- Documenter la raison de la création dans un commentaire

### 2. Consolidation des functions similaires
Unifier les functions qui ont des objectifs similaires ou connexes :

**❌ À éviter :**
```
/api/users/create
/api/users/update
/api/users/delete
/api/users/get
```

**✅ Recommandé :**
```
/api/users (gère POST, PUT, DELETE, GET selon la méthode HTTP)
```

### 3. Utilisation des routes dynamiques
Utiliser `[...slug]` ou `[id]` pour regrouper les endpoints :

```
/api/users/[id]
/api/products/[action]
```

### 4. Vérification avant chaque commit
Exécuter la commande suivante pour compter les functions :
```bash
find pages/api -type f -name "*.js" -o -name "*.ts" | wc -l
# ou pour Next.js 13+
find app/api -type f -name "route.js" -o -name "route.ts" | wc -l
```

### 5. Audit mensuel
- Revoir l'architecture des functions
- Identifier les candidates à la fusion
- Documenter les décisions de consolidation

## En cas de dépassement imminent

1. **Prioriser** : Identifier les functions critiques vs non-critiques
2. **Regrouper** : Fusionner les functions par domaine fonctionnel
3. **Middleware** : Utiliser des middlewares pour mutualiser la logique commune
4. **Edge Functions** : Évaluer si certaines functions peuvent être migrées vers Edge

## Validation du Pull Request

Avant de merger, vérifier :
- [ ] Le nombre total de functions ≤ 12
- [ ] Les nouvelles functions sont justifiées
- [ ] Aucune opportunité évidente de consolidation n'a été ignorée

---

**⚠️ Cette règle est NON-NÉGOCIABLE et doit être respectée pour garantir la stabilité des déploiements.**