# 🔥 Setup Neon avec Firebase Auth

Guide pour utiliser Neon PostgreSQL avec **Firebase Auth** au lieu de Supabase Auth.

---

## 🎯 POURQUOI DEUX MIGRATIONS?

### Migration 1: `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql`
- ❌ Utilise `auth.users` (Supabase Auth)
- ❌ Référence `auth` schema
- ❌ Génère l'erreur: "schema 'auth' does not exist"

### Migration 2: `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql` ✅
- ✅ Crée table `users` pour Firebase
- ✅ Firebase UID stocké comme TEXT (pas UUID)
- ✅ Pas de dépendance `auth` schema
- ✅ **UTILISEZ CELLE-CI** pour Neon + Firebase

---

## 🚀 INSTALLATION RAPIDE

### Étape 1: Choisir la Bonne Migration
```
❌ N'UTILISEZ PAS: 20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql
✅ UTILISEZ: 20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql
```

### Étape 2: Copier la Migration
1. Ouvrez: `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql`
2. Copiez **TOUT** le contenu

### Étape 3: Exécuter sur Neon
1. Allez à: https://console.neon.tech
2. Allez à: SQL Editor
3. Collez le contenu
4. Cliquez: Execute

**Résultat attendu:** ✅ Pas d'erreur

### Étape 4: Vérifier
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema='public' 
ORDER BY table_name;
```

**Devrait afficher 9 tables:**
- users ← NOUVEAU (pour Firebase)
- user_roles
- profiles
- products
- orders
- referral_links
- click_tracking
- commissions
- payouts

---

## 🔄 INTÉGRATION AVEC FIREBASE AUTH

### Comment ça Marche?

1. **Firebase crée un utilisateur** (avec Firebase Auth)
   ```
   UID Firebase: abc123def456...
   ```

2. **Votre code insère dans Neon**
   ```sql
   INSERT INTO users (id, email, full_name) 
   VALUES ('abc123def456...', 'user@example.com', 'Nom');
   ```

3. **Neon stocke référence Firebase**
   ```
   id (TEXT): abc123def456...
   email: user@example.com
   ```

4. **RLS utilise Firebase UID**
   ```sql
   -- Récupérer l'UID Firebase
   SELECT * FROM orders 
   WHERE user_id = 'abc123def456...';
   ```

---

## 💻 CODE EXEMPLE (TypeScript/Node)

### Créer Utilisateur après Firebase Auth

```typescript
import { getAuth } from 'firebase/auth';
import { neon } from '@neondatabase/serverless';

// Après inscription Firebase
const auth = getAuth();
const user = auth.currentUser;

if (user) {
  const sql = neon(process.env.NEON_DATABASE_URL);
  
  await sql`
    INSERT INTO users (id, email, full_name) 
    VALUES (${user.uid}, ${user.email}, ${user.displayName})
    ON CONFLICT (id) DO NOTHING
  `;
  
  // Assigner rôle ambassador
  await sql`
    INSERT INTO user_roles (user_id, role) 
    VALUES (${user.uid}, 'ambassador')
    ON CONFLICT (user_id, role) DO NOTHING
  `;
}
```

### Récupérer Données Utilisateur

```typescript
const auth = getAuth();
const userId = auth.currentUser?.uid;

if (userId) {
  const sql = neon(process.env.NEON_DATABASE_URL);
  
  const user = await sql`SELECT * FROM users WHERE id = ${userId}`;
  const role = await sql`
    SELECT role FROM user_roles 
    WHERE user_id = ${userId} 
    LIMIT 1
  `;
}
```

---

## 📊 COMPARAISON: SUPABASE vs FIREBASE + NEON

| Aspect | Supabase | Firebase + Neon |
|--------|----------|-----------------|
| Auth | Supabase Auth | Firebase Auth |
| Database | Supabase (PostgreSQL) | Neon (PostgreSQL) |
| User ID | UUID | TEXT (Firebase UID) |
| Schema | auth.users | public.users |
| Coût | Plus cher | Plus économique |
| Contrôle | Moins | Plus de contrôle |

---

## ⚠️ MIGRATION DE SUPABASE À NEON+FIREBASE

Si vous aviez du code Supabase Auth avant:

### Avant (Supabase):
```typescript
const { data: { user } } = await supabase.auth.getUser();
user_id = user.id; // UUID
```

### Après (Firebase):
```typescript
const user = auth.currentUser;
user_id = user.uid; // TEXT (Firebase UID)
```

### Mise à jour des Requêtes:
```typescript
// Avant (Supabase)
const data = await sql`
  SELECT * FROM products 
  WHERE user_id = ${user.id}::uuid
`;

// Après (Firebase + Neon)
const data = await sql`
  SELECT * FROM products 
  WHERE user_id = ${user.uid}
`;
```

---

## 🔐 SÉCURITÉ

### RLS avec Firebase UID

Neon RLS utilise `current_setting('app.current_user_id')`:

```typescript
// Avant requête, définir le contexte
await sql.query(
  `SET app.current_user_id = '${userId}'`
);

// Puis faire la requête (RLS automatique)
const orders = await sql`SELECT * FROM orders`;
// Retourne seulement les commandes de l'utilisateur
```

### Ou Simplement Filtrer

```typescript
// Sans RLS, filtrer manuellement
const orders = await sql`
  SELECT * FROM orders 
  WHERE user_id = ${userId}
`;
```

---

## ✅ CHECKLIST SETUP FIREBASE + NEON

### Phase 1: Database
- [ ] Compte Neon créé
- [ ] Base de données créée
- [ ] Migration `_NEON.sql` exécutée
- [ ] 9 tables créées (vérifiées)

### Phase 2: Firebase
- [ ] Compte Firebase créé
- [ ] Projet Firebase créé
- [ ] App web créée
- [ ] Credentials copiées
- [ ] `.env.local` configuré

### Phase 3: Intégration
- [ ] Firebase Auth setup
- [ ] Fonction "créer user dans Neon" écrite
- [ ] Trigger utilisateur créé
- [ ] Test utilisateur créé/vérifié

### Phase 4: Application
- [ ] Frontend utilise Firebase Auth
- [ ] Backend insère users dans Neon
- [ ] Requêtes utilisent Firebase UID
- [ ] RLS/filtering fonctionne

---

## 🆘 ERREURS COURANTES

### Erreur: "schema 'auth' does not exist"

**Cause:** Vous utilisez la mauvaise migration

**Solution:**
- ❌ Supprimez: `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql`
- ✅ Utilisez: `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql`

### Erreur: "user_id mismatch"

**Cause:** Firebase UID ne correspond pas

**Solution:**
```typescript
// Assurez-vous d'insérer le bon UID
const firebaseUID = auth.currentUser.uid;
await sql`
  INSERT INTO users (id, ...) 
  VALUES (${firebaseUID}, ...)
`;
```

### Erreur: "REFERENCES auth.users"

**Cause:** Migration Supabase exécutée

**Solution:**
- Supprimez la base
- Créez nouvelle base
- Exécutez migration `_NEON.sql`

---

## 🔗 INTÉGRATION API VERCEL

Vos APIs Vercel peuvent utiliser Firebase Token:

```typescript
// api/get-user-data.ts
import { initializeApp } from 'firebase/app';
import { getAuth, verifyIdToken } from 'firebase/auth';
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decodedToken = await verifyIdToken(token);
    const userId = decodedToken.uid;
    
    const sql = neon(process.env.NEON_DATABASE_URL);
    const data = await sql`
      SELECT * FROM orders 
      WHERE user_id = ${userId}
    `;
    
    return res.status(200).json(data);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

## 📚 FICHIERS AFFECTÉS

### Migration SQL
- ✅ `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql` (NOUVEAU)
- ⚠️ `20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47.sql` (Ancien - ne pas utiliser)

### Code TypeScript
- `src/integrations/supabase/client.ts` → Remplacer par Firebase
- `api/*.ts` → Mettre à jour user_id references

### Configuration
- `.env.local` → Ajouter Firebase credentials
- `.env.example` → Documenter Firebase vars

---

## 🎯 PROCHAINES ÉTAPES

1. **Exécuter la bonne migration:**
   - Utilisez `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql`

2. **Configurer Firebase Auth:**
   - Voir [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) Phase 3

3. **Mettre à jour le code:**
   - Remplacer Supabase par Firebase partout

4. **Tester:**
   - Créer utilisateur Firebase
   - Vérifier que user créé dans Neon
   - Tester requêtes avec user_id

---

## 📖 RESSOURCES

- [Neon Docs](https://neon.tech/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [PostgreSQL with Firebase](https://firebase.google.com/docs/database/usage)

---

**Vous êtes maintenant prêt! 🚀**

*Utilisez: `supabase/migrations/20251105164030_032e12af-80a2-44e3-b46d-954425c4ff47_NEON.sql`*