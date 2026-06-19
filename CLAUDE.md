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
- Dans `app/app2/page.tsx` vers les lignes 80-220

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
- ⏳ Apple Developer account — en attente activation (email attendu)
  → Quand reçu : Xcode → Signing & Capabilities → "Try Again" → Build Archive → Upload TestFlight
- ⏳ Screenshots App Store iPhone 6.9" × 5 (Mel doit fournir)

---

## 🔁 COMMANDES DEPLOY

```bash
# Depuis /Users/saugydavid/Documents/clutch
npm run build

# Copier dans le repo GitHub Pages
cp -r out/. /Users/saugydavid/Documents/pz7cgj4kfv-tech.github.io/

# Commit + push
cd /Users/saugydavid/Documents/pz7cgj4kfv-tech.github.io
git add -A && git commit -m "deploy vXX.XX-X" && git push
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
