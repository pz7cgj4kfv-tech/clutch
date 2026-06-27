# CLAUDE.md — Clutch App — Fichier de persistance inter-sessions

> Ce fichier est lu automatiquement à chaque session Claude Code.
> Il contient TOUT ce qu'il ne faut jamais oublier entre les sessions.
> Mis à jour : 2026-06-15

---

## 👥 ÉQUIPE

- **David** (david.saugy@gmail.com) — chef de projet, non-dev, vision produit
- **Mélanie (Mel)** — co-fondatrice, design, mockups Figma/PDF
- **Claude** — développeur principal (IA)

---

## 🗺️ ARCHITECTURE — NE JAMAIS OUBLIER

### Routes actives
| Route | Description |
|-------|-------------|
| `/` | Landing page publique — pitch + waitlist email |
| `/app` | Proto carte Lausanne + flow simulé (3839 lignes) |
| `/app2` | Flow COMPLET Supabase : splash → login → présences → clutchs → profil |
| `/proto` | Splash sablier → redirige vers `/app` |
| `/hq` | QG interne (password: clutch2026!) |
| `/scenario` | Carte interactive des scénarios + audit (5 onglets) |
| `/flyer` | Flyer pitch A4 imprimable |
| `/legal` | CGU + Politique de confidentialité LPD/RGPD |
| `/demo` | Démo interactive 17 écrans |

### Fichiers critiques
- `app/app2/page.tsx` — ~5850 lignes, tout le flow principal
- `lib/brand.ts` — palette officielle, TOUJOURS importer depuis là
- `public/scenario-frame.html` — HTML interactif du /scenario
- `supabase/functions/delete-account/index.ts` — Edge Function suppression compte
- `ios/App/App/PrivacyInfo.xcprivacy` — requis Apple depuis 2024

### Stack technique
- **Next.js 15** avec `output: 'export'` → ZÉRO code serveur
- **Supabase** client-side uniquement (RLS, Edge Functions, Realtime)
- **GitHub Pages** → `out/` → `/Users/saugydavid/Documents/pz7cgj4kfv-tech.github.io/`
- **Capacitor** → `appId: app.clutch.lausanne`, `webDir: out`
- Source : `/Users/saugydavid/Documents/clutch`
- Deploy repo : `/Users/saugydavid/Documents/pz7cgj4kfv-tech.github.io/`

---

## 🔴 RÈGLES ABSOLUES — BRISER CES RÈGLES = TOUT CASSE

### 1. `output: 'export'` = ZÉRO serveur
Pas d'API routes, pas de server actions, pas de middleware. Tout via Supabase client-side.

### 2. Gate system = DEUX conditions
`isReallyAvail = is_available && available_until > now()`
Vérifié AU LOGIN (routing) ET dans `setTab()`. Toucher l'un sans l'autre = faille.

### 3. iOS Safari = 3 règles obligatoires
- `position:fixed` pour le frame mobile
- `minHeight:0` sur tous les flex scrollables
- `WebkitOverflowScrolling:touch`
Sans ça l'app freeze sur iPhone.

### 4. Capacitor-forward
Chaque choix technique doit fonctionner en natif iOS/Android via Capacitor.
Éviter les service workers custom et les API Safari-only.

### 5. JAMAIS ces couleurs dans l'UI
❌ `#000`, `#0a0a0a`, `#ef4444`, `#dc2626`, `C.gold`, `C.peach`
✅ Utiliser `C.orange`, `C.salmon`, `C.bgBase`, `C.textPrimary` depuis `lib/brand.ts`

### 6. Vocabulaire Clutch = droit
- ✅ Clutch / Verrou / Rendez-vous
- ❌ JAMAIS "match", "swipe", "like"

### 7. Contrainte 18h structurelle
Tout timing (slots, expiry, notifs) respecte la fenêtre 18h max.

### 9. Slots horaires — marge volontaire
Le sender peut proposer une heure légèrement en dehors de son propre créneau de dispo (ex: dispo jusqu'à 04h00, clutch proposé à 04h15). C'est une décision produit délibérée : on fait confiance aux gens pour gérer leur propre planning. L'intersection est une aide, pas une contrainte stricte.

### 8. ProximityRadar = temps, JAMAIS GPS
Le radar montre le **temps restant** avant le RDV, JAMAIS la distance GPS à l'autre personne.
Raison : triangularisation de position possible par un homme malveillant qui se déplace.
Si v2 : montrer distance au LIEU (le café), pas à la personne.

---

## 🎨 PALETTE OFFICIELLE — TOUJOURS depuis `lib/brand.ts`

```ts
// Variables réelles dans le code (NE PAS inventer d'autres noms)
C.orange = '#E27C00'      // or/orange, boutons CTA, accents forts
C.salmon = '#FFBF9E'      // pêche/saumon, texte secondaire, bordures
C.bgBase = '#2a1020'      // fond prune/bordeaux foncé
C.textPrimary = '#f5e8de' // texte principal
```

En cas de doute : fond prune + icône pêche + texte or. C'est tout.

---

## 🌍 TRADUCTIONS — Système TR

```ts
const t = (k: string) => TR[lang][k] || TR.fr[k] || k
```

- Toujours ajouter les clés EN ET FR en même temps
- Jamais de strings hardcodées en anglais dans l'UI
- Dico `TR` (fr/en) dans `app/app2/page.tsx` ~lignes 240-487 · hook `useT(lang)`

### STANDARD i18n (gravé 28.06) — voir `docs/i18n-guide.md`
- **Tout nouveau texte user-facing → `t('clé')`**, jamais `isFr ? :` ni FR brut. Clé en fr ET en.
- État mesuré : dico parité PARFAITE (218 clés fr/en). MAIS ~227 ternaires `isFr` (bloquent une 3ᵉ langue) +
  ~300-450 strings FR codées en dur → chantier de **plusieurs sessions**, par lots testables (FR inchangé).
- **Outils** : `node scripts/i18n-audit.mts` (parité) · `node scripts/i18n-hardcoded.mts` (backlog du codé-en-dur).
- **Ajouter une langue** = 3 endroits (type `Lang`, bloc `TR.xx`, registre `LANGS` du sélecteur). Détail dans le guide.
- Méthode sûre : 1 composant/lot → clés fr+en → remplacer → `tsc` (attrape le `t` mal placé) → 2 scripts → commit.

---

## 🛡️ ARCHITECTURE RPC GARDÉE — STANDARD (validé GPT+Grok 29.06)

**Règle d'or :** aucune action métier (clutch, accept, refuse, dispo, create_event, join_event, check-in, finish)
ne doit modifier les tables EN DIRECT. Tout passe par des **RPC SECURITY DEFINER gardées** qui appliquent les vraies
règles (forteresse/exclusion, cooldown, dispo↔event, plafonds) et renvoient un **contrat `{ ok, code, message }`**.
- En prod : `actor = auth.uid()`. En Test Lab : `actor = bot_id` **uniquement si `qa_is_admin()`** (allowlist 3 IDs).
- Migrations en place : `20260629_admin_actor_rpc.sql` (admin_create_clutch/accept/refuse/set_availability),
  `20260629_event_rpc_dispo.sql` (join_event = dispo↔event serveur, admin_create_event = date réelle).
- `create_clutch()` (gardé) existe depuis 20260626 ; `qa_test_clutch()` en est le miroir DRY-RUN.
- **Codes feedback** : NO_COMPATIBLE_AVAILABILITY · OUT_OF_CONE · OVERLAP_OCCUPANCY · COOLDOWN_ACTIVE · INBOX_FULL ·
  EVENT_FULL · WAITLIST_FULL · NOT_EVENT_VISIBLE · INVALID_TIME · RLS_FORBIDDEN. Prod = message neutre · Test = vraie raison.
- **Reste (Phase 4)** : brancher l'APP RÉELLE (SendModal, accept, doRegister) sur ces RPC → feedback clair partout.
- **Le Cône** deviendra une fonction DB `check_cone_feasibility()` appelée par ces RPC, alimentée par le moteur de
  trajet de Dom (lib/travel-estimate → portée serveur). cf docs/spec-dom-moteur-causalite.md + project-forteresse.
- Détail/challenge : docs/challenge-testlab-realiste-gpt-grok.md · mémoire project-braindump-test-29jun.

---

## 🐛 BUGS CONNUS — Solutions validées

### Supabase `.update()` silencieux
**Symptôme :** update retourne `{error:null}` même si 0 lignes modifiées.
**Solution :**
```ts
const { data: updated, error } = await supabase.from('profiles').update({...}).eq('id', user.id).select()
if (!error && (!updated || updated.length === 0)) {
  await supabase.from('profiles').upsert({ id: user.id, ...allFields })
}
```

### Supabase Realtime — 1 seul filtre par channel
**Solution :** Créer un channel séparé par filtre :
```ts
const chInsert = supabase.channel(`clutch-insert-${uid}`).on(...)
const chUpdateRec = supabase.channel(`clutch-upd-rec-${uid}`).on(...)
const chUpdateSend = supabase.channel(`clutch-upd-send-${uid}`).on(...)
```

### Carte Leaflet fragmentée
Appeler `map.invalidateSize()` dans un `requestAnimationFrame` après montage.

---

## ✅ FEATURES IMPLÉMENTÉES (état v14.06-T, 15 juin 2026)

- Auth Supabase (login, register, mot de passe oublié)
- Onboarding 5 étapes (prénom, genre, âge, photo, intérêts)
- Disponibilité avec molette heure (18h max)
- Carte Leaflet avec étoiles DivIcon animées
- Flow Clutch complet : envoi → confirmation/refus → Verrou → RDV → check-in → feedback
- Système de traduction FR/EN (clé `t()`)
- Présences : liste profils avec CD score (dots orange) + fiabilité (étoiles salmon)
- Suppression de compte (modal 2 étapes + Edge Function delete-account ✅ déployée)
- Cron auto-expiry clutches toutes les 10 min (pg_cron ✅)
- Score de compatibilité (CD = Clutch Driver, dots orange)
- Score de fiabilité (étoiles salmon)
- SOS sécurité
- Événements
- Premium CHF 19.90/mois (gratuit femmes)
- Signalement profils
- Certification selfie
- /scenario — carte interactive 5 onglets (scénario nominal, arbre complet, cas limites, sécurité, légal)
- PrivacyInfo.xcprivacy Apple ✅
- Info.plist permissions iOS en français ✅
- App icon 1024×1024 ✅

---

## ⚠️ BUGS NON RÉSOLUS (à traiter en priorité)

| Bug | Priorité | Note |
|-----|----------|------|
| Events "No" au lieu du texte traduit pour les places | Haute | Onglet Événements, texte non traduit |
| Anti-doublon Clutch | Haute | Possible d'envoyer 2 Clutchs à la même personne si un est pending |
| Post-RDV feedback UI | Moyenne | Écran "Comment ça s'est passé ?" manquant dans /app2 |
| /scenario : étape chat/messages manquante | Basse | Après Verrou, avant le RDV dans le happy path |

---

## 📋 BLOQUANTS APP STORE (état 15 juin 2026)

- ✅ Suppression de compte (LPD)
- ✅ Edge Function delete-account déployée
- ✅ PrivacyInfo.xcprivacy
- ✅ Info.plist permissions en français
- ✅ App icon 1024×1024
- ✅ Cron auto-expiry
- ✅ Apple Developer account ACTIF (build 23 déjà uploadé sur TestFlight = preuve). NE PLUS reposer la question.
  → Nouveau build : Xcode → bump version → Build Archive → Upload TestFlight
- ⏳ Screenshots App Store iPhone 6.9" × 5 (Mel doit fournir)

---

## 🔁 DEPLOY = AUTOMATIQUE (GitHub Action)

⚠️ **NE PAS déployer à la main.** Une GitHub Action (`.github/workflows/deploy.yml`) build + déploie tout seul à chaque push sur `main`.

```bash
# Depuis /Users/saugydavid/Documents/clutch — c'est TOUT :
git push origin main
# → l'Action build (secrets Supabase GitHub) + déploie sur pz7cgj4kfv-tech.github.io (branche master)
# → web à jour en ~1-2 min.
# ❌ NE PAS faire cp out/ + commit sur le repo pages → conflits + corruption de refs (master 2).
```

**Routes à vérifier après deploy :**
- `/` → landing page publique (pas le proto)
- `/app` → proto carte étoiles DivIcon animées
- `/app2` → flow complet splash → login → présences → clutchs → profil
- `/scenario` → 5 onglets interactifs
- `/hq` → QG password-protégé

---

## 🧠 RÈGLE MÉTA — AVANT DE CODER

1. Y a-t-il une approche architecturale plus intelligente ?
2. Shadow deploy / feature flag / branch de test serait-il plus sûr ?
3. Est-ce que je résous le bon problème ou juste le symptôme immédiat ?
4. Qu'est-ce qu'un CTO expérimenté ferait à ma place ?

## ⚖️ AUTO-AUDIT 7 ANGLES (avant chaque feature)

1. **Légal** — LPD suisse, responsabilité civile
2. **Éthique** — consentement, sécurité femmes, anti-dark-patterns
3. **Faisabilité** — MVP maintenant vs Phase 2
4. **Scalabilité** — fonctionne hors Lausanne ?
5. **Ergonomie** — friction utile vs inutile, UX femme 18-35
6. **Business** — cohérence freemium/premium CHF 19.90
7. **Challenger** — qu'est-ce qui pourrait mal tourner ?

## 🚨 ANTI-MALVEILLANCE (à appliquer par feature)

- Que fait un homme qui veut harceler une femme ?
- Que fait un utilisateur qui veut créer 50 faux comptes ?
- Que fait quelqu'un qui veut extraire les positions GPS ?
- Que fait un homme premium qui ghoste systématiquement ?
- Que se passe-t-il si quelqu'un partage un screenshot dans un groupe WhatsApp malveillant ?

→ Si "rien ne l'en empêche" → bloquer avant de coder.

---

## 📊 SUPABASE

- Projet ref : `fnucdicfcjoxbozpfdau`
- Edge Functions déployées : `delete-account`
- Cron actif : `expire-clutches` (*/10 * * * *)
- Tables critiques : `profiles`, `clutches`, `messages`, `events`, `favorites`, `blocks`, `feedback`, `reports`

---

## 🔗 LIENS

- App live : https://pz7cgj4kfv-tech.github.io
- Scenario/audit : https://pz7cgj4kfv-tech.github.io/scenario
- QG : https://pz7cgj4kfv-tech.github.io/hq (pw: clutch2026!)
