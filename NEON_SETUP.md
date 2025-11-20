# 🗄️ Guide de Setup Neon - Résolution des Erreurs de Migration

Ce guide explique comment configurer Neon correctement et résoudre les erreurs de migration.

---

## ⚠️ ERREUR COURANTE: "type 'app_role' already exists"

### Symptôme
```
ERROR: type "app_role" already exists (SQLSTATE 42710)
```

### Cause
La migration a été exécutée partiellement. Le type `app_role` existe déjà dans la base de données, mais les tables ne sont pas créées.

### Solution ✅

#### Option 1: Réutiliser la même base (RECOMMANDÉ)
La migration a été corrigée pour gérer ce cas:

1. Allez à Neon SQL Editor
2. Exécutez à nouveau le fichier migration complet:
   ```
   supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql
   ```
3. Cette fois, ça devrait fonctionner! ✅

**Pourquoi?** La nouvelle version inclut:
- `IF NOT EXISTS` pour tous les éléments
- `DO $$ ... EXCEPTION` pour le type enum
- `DROP POLICY IF EXISTS` avant création
- `CREATE TABLE IF NOT EXISTS`

#### Option 2: Recommencer avec une nouvelle base (Si problème persiste)

Si vous voulez repartir de zéro:

1. **Supprimer la base actuelle:**
   - Allez à https://console.neon.tech
   - Sélectionnez votre projet
   - Allez à "Databases"
   - Cliquez sur votre base de données
   - Cliquez "Delete"

2. **Créer une nouvelle base:**
   - Cliquez "Create Database"
   - Nom: `click_earn_pwa` (ou ce que vous voulez)
   - Cliquez "Create"

3. **Récupérer la nouvelle connection string:**
   - Allez à "Connection string"
   - Copiez l'URL complète

4. **Exécuter les migrations:**
   - Allez à "SQL Editor"
   - Collez la première migration
   - Cliquez "Execute"
   - Collez la deuxième migration
   - Cliquez "Execute"

---

## ✅ ÉTAPES COMPLÈTES DE SETUP NEON

### 1. Créer un compte Neon
```
https://neon.tech → Sign Up
```

### 2. Créer un projet
```
Nom: click-earn-pwa
Region: Europe (Dublin) ou Asia
```

### 3. Récupérer la connection string

**Important:** Assurez-vous d'avoir:
```
postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

**Erreur courante:** Oublier `?sslmode=require` à la fin

### 4. Exécuter les migrations (DANS CET ORDRE)

#### Migration 1:
```sql
-- Fichier: supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql
-- Copier tout le contenu
-- Exécuter dans Neon SQL Editor
```

**Résultat attendu:** Pas d'erreur, tout s'exécute

#### Migration 2:
```sql
-- Fichier: supabase/migrations/20251114143445_b264331f-5951-4b6c-aa00-37c3d904c9ad.sql
-- Copier tout le contenu
-- Exécuter dans Neon SQL Editor
```

**Résultat attendu:** Pas d'erreur, tout s'exécute

### 5. Vérifier que tout est créé

Dans Neon SQL Editor, exécutez:

```sql
-- Vérifier les tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;

-- Devrait retourner:
-- click_tracking
-- commissions
-- orders
-- payouts
-- products
-- profiles
-- referral_links
-- user_roles
```

### 6. Copier l'URL pour Vercel

```
Connection string: postgresql://user:password@host.neon.tech/dbname?sslmode=require
```

Sauvegardez cette URL pour Vercel Environment Variables.

---

## 🔍 VÉRIFICATIONS

### Test 1: Connexion
```bash
# Remplacez [URL] par votre connection string
psql [URL]
# Si vous pouvez vous connecter, c'est bon!
```

### Test 2: Tables existent
```sql
-- Dans Neon SQL Editor
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema='public';
-- Devrait retourner: 8
```

### Test 3: Types existent
```sql
-- Vérifié que le type app_role existe
SELECT typname FROM pg_type WHERE typname='app_role';
-- Devrait retourner une ligne avec: app_role
```

### Test 4: Fonctions existent
```sql
-- Vérifier les fonctions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema='public';
-- Devrait voir: has_role, handle_new_user, update_updated_at_column
```

---

## 📊 STRUCTURE DE DONNÉES CRÉÉE

```
Tables:
├── auth.users (de Firebase, pas créée ici)
├── user_roles
├── profiles
├── products
├── orders
├── referral_links
├── click_tracking
├── commissions
└── payouts

Types:
└── app_role (admin, ambassador, user)

Fonctions:
├── has_role()
├── handle_new_user()
└── update_updated_at_column()

Triggers:
├── on_auth_user_created
├── update_products_updated_at
├── update_orders_updated_at
└── update_profiles_updated_at
```

---

## 🆘 AUTRES ERREURS COURANTES

### "relation 'auth.users' does not exist"

**Cause:** Vous n'utilisez pas Supabase pour l'auth

**Solution:**
Si vous utilisez Firebase Auth au lieu de Supabase:
- Supprimez les références à `auth.users`
- Créez une table `users` simple
- Sauvegardez l'ID Firebase

### "password authentication failed"

**Cause:** La connection string est incorrecte

**Solution:**
1. Allez à Neon Dashboard
2. Copiez la connection string exacte
3. Vérifiez qu'il n'y a pas d'espace blanc inutile

### "SSL connection error"

**Cause:** Vous oubliez `?sslmode=require`

**Solution:**
Votre URL doit être:
```
postgresql://user:password@host.neon.tech/db?sslmode=require
```

### "permission denied"

**Cause:** Votre utilisateur n'a pas les permissions

**Solution:**
1. Allez à Neon Dashboard
2. Roles → Vérifiez que votre role a les permissions

---

## 💡 ASTUCES

### Récupérer tout le schema
```sql
-- Pour sauvegarder votre schema
pg_dump -U [user] -h [host] -d [dbname] --schema=public > schema.sql
```

### Vérifier les indexes
```sql
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';
```

### Voir les policies RLS
```sql
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';
```

### Voir les triggers
```sql
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

---

## ✅ CHECKLIST SETUP NEON

- [ ] Compte Neon créé
- [ ] Projet créé
- [ ] Connection string copiée
- [ ] Migration 1 exécutée sans erreur
- [ ] Migration 2 exécutée sans erreur
- [ ] 8 tables créées vérifiées
- [ ] Type app_role vérifié
- [ ] Fonctions créées vérifiées
- [ ] Triggers créés vérifiés
- [ ] Connection string sauvegardée pour Vercel

---

## 🔗 RESSOURCES

- Neon Docs: https://neon.tech/docs
- PostgreSQL Docs: https://www.postgresql.org/docs
- SQL Tutorial: https://www.w3schools.com/sql

---

**Vous pouvez maintenant continuer avec Vercel! 🚀**