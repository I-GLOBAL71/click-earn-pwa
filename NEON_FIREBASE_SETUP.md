# 🔥 Setup Neon avec Firebase Auth

Guide pour utiliser Neon PostgreSQL avec **Firebase Auth**.

---

## 🎯 Migration recommandée

- Créez une table `users` dans le schema `public`
- Stockez l'UID Firebase en `TEXT` (pas UUID)
- N'utilisez pas le schema `auth`

---

## 🚀 INSTALLATION RAPIDE

### Étape 1: Choisir une migration compatible Neon/Firebase
```
✅ Utilisez un script qui crée `public.users` avec id TEXT
✅ Évitez toute référence au schema `auth`
```

### Étape 2: Copier la Migration
1. Ouvrez votre script de migration Neon
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

## 📊 Comparaison: Ancienne vs Nouvelle

| Aspect | Ancienne stack | Nouvelle stack |
|--------|-----------------|----------------|
| Auth | Legacy | Firebase Auth |
| Database | Legacy PostgreSQL | Neon (PostgreSQL) |
| User ID | UUID | TEXT (Firebase UID) |
| Schema | auth.* | public.* |

---

## ⚠️ Adaptation vers Firebase

### Après (Firebase):
```typescript
const user = auth.currentUser;
user_id = user.uid; // TEXT (Firebase UID)
```

### Mise à jour des Requêtes:
```typescript
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

**Cause:** Votre script référence un schema `auth` absent

**Solution:**
- Utilisez une migration compatible Neon/Firebase (sans `auth.*`)

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

**Cause:** Un script non compatible a été exécuté

**Solution:**
- Supprimez la base si nécessaire
- Créez une nouvelle base
- Exécutez une migration compatible Neon/Firebase

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
- ✅ Script Neon/Firebase (compatibles)

### Code TypeScript
- Retirez tout ancien client legacy
- Mettez à jour `api/*.ts` pour utiliser l'UID Firebase

### Configuration
- `.env.local` → Ajouter Firebase credentials
- `.env.example` → Documenter Firebase vars

---

## 🎯 PROCHAINES ÉTAPES

1. **Exécuter une migration compatible Neon/Firebase**

2. **Configurer Firebase Auth:**
   - Voir [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) Phase 3

3. **Mettre à jour le code:**
   - Remplacer l'ancien client par Firebase partout

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

*Utilisez un script Neon/Firebase compatible*