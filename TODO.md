# TODO: Migrate to Firebase Auth + Neon DB and Add Auth Popup

## Phase 1: Setup Firebase and Neon Clients
- [ ] Install Firebase SDK (`npm install firebase`)
- [ ] Install Neon SDK (`npm install @neondatabase/serverless`)
- [ ] Create Firebase client in `src/integrations/firebase/client.ts`
- [ ] Create Neon client in `src/integrations/neon/client.ts`
- [ ] Update `.env.example` with Firebase and Neon environment variables

## Phase 2: Update Authentication
- [ ] Update `src/hooks/useAuth.tsx` to use Firebase Auth
- [ ] Create AuthModal component in `src/components/AuthModal.tsx` with Google and magic link options
- [ ] Update `src/App.tsx` to include Firebase Auth provider and AuthModal

## Phase 3: Update Database Queries
- [ ] Update `src/integrations/supabase/types.ts` to reflect Neon schema (if needed)
- [ ] Update any components/pages that query Supabase to use Neon client

## Phase 4: Update APIs
- [ ] Update `api/generate-referral-link.ts` to use Firebase token verification and Neon
- [ ] Update `api/import-alibaba-product.ts` to use Firebase token verification and Neon
- [ ] Update `api/rewrite-product.ts` to use Firebase token verification and Neon
- [ ] Update `api/track-click.ts` to use Firebase token verification and Neon

## Phase 5: Testing and Cleanup
- [ ] Run Neon migration manually using the provided PSQL command
- [ ] Test Firebase auth (Google and magic link)
- [ ] Test Neon DB connections
- [ ] Remove Supabase dependencies and files
- [ ] Update README and docs

## Phase 6: Deployment
- [ ] Update Vercel config if needed
- [ ] Deploy and test on production
