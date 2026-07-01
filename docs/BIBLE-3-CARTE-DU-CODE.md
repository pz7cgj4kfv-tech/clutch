# 🗺️ CLUTCH — CARTE DU CODE (bible de handoff)

> App de rencontre spontanée (Lausanne). **Next.js `output:'export'` (zéro serveur) + Supabase (client-side, RLS, RPC gardées, Edge Functions) + Capacitor iOS.** Build web statique → GitHub Pages ; app native via Capacitor. Version : `V='0x1f4'`, `BUILD=240`.
> Fait partie de la BIBLE CLUTCH (voir `BIBLE-0-MAITRE.md`). Généré le 02.07.2026.

> ⚠️ Le repo contient partout des doublons `« … 2 »` (`app 2/`, `page 2.tsx`… jusqu'à `page 9.tsx`) : copies iCloud/Dropbox parasites. **Le fichier de travail est celui SANS suffixe.** Les ignorer.

---

## 1. Arborescence commentée
| Dossier | Rôle |
|---|---|
| `app/` | Toutes les routes Next.js (App Router). Chaque sous-dossier avec `page.tsx` = une URL. Cœur = `app/app2/`. |
| `lib/` | Logique métier PURE et réutilisable (moteurs testables sans UI) + client Supabase + palette. |
| `lib/sim/` | Moteur de simulation « Clutch City / SimCity » (agents, invariants « Coq »). |
| `scripts/` | Outils CLI hors-app : preuves de moteurs, audits i18n, seed/reset, icônes, pont GPT. |
| `supabase/` | `migrations/` (schéma + RPC gardées) + `functions/` (Edge Functions Deno) + `config.toml`. |
| `ios/` | Projet natif Capacitor/Xcode (App.xcodeproj, Info.plist, PrivacyInfo.xcprivacy). |
| `public/` | Statique : `scenario-frame.html`, `manifest.json`, `sw.js`, icônes. |
| `docs/` | ~45 docs produit/stratégie/challenge (non-code). |
| `out/` | **Build généré** (ne pas éditer). `.next/` cache. |

---

## 2. Routes (★ = principales)
### Application réelle
| URL | Lignes | Rôle |
|---|---|---|
| **★ `/app2`** | **14187** | Flow COMPLET Supabase (le cœur — §3). splash→login→onboarding→présences→clutchs→events→profil. |
| `/app` | 3839 | Ancien proto carte Lausanne, flow SIMULÉ. |
| `/` | 494 | Landing publique (pitch + waitlist). |

### Hubs / QG
| URL | Rôle |
|---|---|
| **★ `/hub`** | Page centrale d'accueil (point d'entrée à partager). |
| **★ `/hq`** | QG interne password (`clutch2026!`), branché Supabase. |
| **★ `/audits`** | Journal d'audits IA datés (accordéon). |
| **★ `/codex`** | Doc technique dense (forteresse & COQ). |
| `/collab` | Équipe : hiérarchie code + procédures Mel/Dom. |

### Simulateurs & cockpits
| URL | Rôle |
|---|---|
| **★ `/clutch-city`** | Cockpit « SimCity » : N agents sur la VRAIE logique (`lib/sim`). |
| **★ `/clutch-test`** | « Clutch Test v1 » : cockpit soirée chorégraphiée. |
| `/cockpit`, `/sim`, `/lab` | Cockpits de test/opérateur. |
| `/clutchlive`, `/clutchnight` | Immersion boussole / mode sorties. |

### Forteresse
| URL | Rôle |
|---|---|
| **★ `/forteresse`** | Page vision du Cône de causalité. |
| `/forteresse-lab` | « La Coque » : énumère les possibilités du moteur. |

### Docs / investisseurs
| URL | Rôle |
|---|---|
| **★ `/plan-lancement`** | Document d'investissement v2 (fond blanc, PDF, chiffré/sourcé). |
| `/vision` (3932 l), `/vision2`, `/manifeste`, `/rapport`, `/demo` (1498 l), `/tutoriel` | Vision & pédagogie. |
| `/scenario` | iframe → `public/scenario-frame.html` (5 onglets). |

### Cartes / design / légal
`/map`, `/carte`, `/eventsmap` · `/mel`, `/mel-test` (handoff design Mel) · `/logo`, `/animation`, `/flyer` · `/legal`, `/terms`, `/privacy`, `/confidentialite`, `/nda` · `/admin`, `/profil`, `/onboarding`, `/sos`, `/audit`.

---

## 3. `app/app2/page.tsx` — le cœur (14 187 lignes)
Repères par n° de ligne (indicatifs) :
- **Flags & constantes (l.1–235)** : `EVENTS_CURATED_LIVE=false` (l.24, code mort) · `CONE_RAYON_HEURE_LIVE=true` (l.27) · `V/BUILD` (l.32-33) · `MEL_CARD_FOR_ALL=true` (l.220, bots = vraies personnes) · `C` palette locale (l.122) · `SLOT_COLORS` (l.818) · `BANNED_WORDS` (l.3236).
- **Traductions `TR` (l.347–609)** : fr (l.348) + en (l.472), hook `useT(lang)` (l.597).
- **UI de base** : `MelPresenceCard` (l.237) · `MelClutchCard` (l.279) · `JogWheel` molette (l.666) · `MapLeaflet` (l.880, fuzz position) · `Splash`/`LoginScreen`/`RegisterScreen`/`Toast` · `TabBar` (l.1660).
- **Flow Clutch** : `SendModal` (l.2095) · `ClutchSent` (l.2531) · `ClutchIncoming` (l.2648) · `VerrouExplosion` (l.2566) · `ActiveVerrouBar` (l.2796) · **`ProximityRadar` (l.8652, radar=TEMPS jamais GPS)** · `ChatSheet` (l.4805) · `FeedbackSheet` (l.5246).
- **Events** : `EventsTab` (l.3312) · **`OrganizerRequests` (l.3270, dashboard orga accepter/refuser)** · helpers (l.3226-3258).
- **Profil/onboarding** : `ProfileTab` (l.6326, contient reset_total_qa l.8177) · `ProfileSheet` (l.5383) · `PhotoCropper` (l.5723) · `OnboardingScreen` (l.9078).
- **🎮 Test Lab** : `BotLab` (l.5780) · Ville vivante `cityTick` (l.13753, ~7s), `toggleLive` (l.13797), `putNOnline` (l.13739) · toutes actions via RPC gardées · `incarnate(botId)` (l.13702).
- **Racine** : `export default function App2()` (l.9383) · `setTab` gardé (bloque si feedback en cours) · realtime clutches · gate dispo.

---

## 4. `lib/` — moteurs purs
| Fichier | Rôle & exports clés |
|---|---|
| `brand.ts` | **Palette officielle** (`brand`, `mel`). Toujours importer d'ici. |
| `supabase.ts` | Client (`export const supabase`) + types `Profile`, `Clutch`, `Message`. |
| `cone.ts` | Le Cône : `travelMs`, `earliestCredibleStart`, `credibleRadiusKm`, `coneTension`, `coneHint`. |
| `forteresse-engine.ts` | Forteresse : `evaluate`, `evaluateSchedule`, `reachKm`, `haversineKm`, `HORIZON_H=18`, `DEFAULT_LEAD_MIN=60`. |
| `feasibility.ts` | `freeWindows`, `candidateSlots`, `classifySlot`, `dayParts` (chips ce soir/nuit). |
| `events-engine.ts` | `onRegister`, `canRequest`, `sweepExpired`, `waitlistMax`. Types `EventMode`, `Inscription`. |
| `events-helpers.ts` | `eventKm`, `eventPhotoFor`, `eventCat`. |
| `clutch-algo.ts` | Scoring/matching : `scoreProfile`, `isClutchable`, `RADAR_KM`, thermostat densité. |
| `clutch-config.ts` | `CLUTCH_CONFIG`, `rdvDurationMin`, `refuseCooldownH` (zéro nombre magique). |
| `clutch-states.ts` | Machine à états : `canTransition`, `ALLOWED_REL`, `TERMINAL`. |
| `ranking.ts` | `visibilityWeight`, `reliabilityScore`. |
| `mood.ts` | `deriveMoods(text)`, `MOOD_LABELS`. |
| `intent-moderation.ts` | `checkIntent`, `intentRefusal`. |
| `place-safety.ts` | `placeSafety(name,hour)` (niveaux 0-3). |
| `notifications.ts` | `planNotifications`. |
| `onesignal.ts` | `initOneSignal`, `enableNotifs`, `setOneSignalExternalId`. |
| `haptics.ts` | `hap(style)` (Capacitor). |
| `sim/types.ts` + `sim/engine.ts` | Moteur SimCity : `mulberry32` (PRNG seedé), tick, invariants, `CAPS`, `LAUSANNE`. |

---

## 5. `scripts/` (CLI via `tsx`/`node`)
`test-forteresse.mts` (🏰 preuve invariants forteresse) · `test-cone.mts` · `test-feasibility.mts` · `test-events-engine.mts` · `test-ranking.mts` · `test-notifications.mts` · `test-place-safety.mts` · `fuzz-clutch-states.mts` (`npm run fuzz`) · `clutch-city.mts` (rapport CLI du moteur sim) · `i18n-audit.mts` (parité fr/en) · `i18n-hardcoded.mts` (backlog FR codé en dur) · `reset-test.mjs` · `apply-sql.mjs` · `ask-gpt.mjs` (pont GPT) · `make-icon.mjs`/`svg2png.mjs`.

---

## 6. Config / Build / Deploy
- **`package.json`** : Next 16, React 19, supabase-js, leaflet, Capacitor 8, sharp. Scripts : `dev`, `build`, `start`, `lint`, `fuzz`.
- **`next.config.ts`** : `output:'export'` (**zéro serveur**), `typescript.ignoreBuildErrors:false` (build casse sur erreur TS).
- **`capacitor.config.ts`** : `appId:'app.clutch.lausanne'`, `webDir:'out'`, `backgroundColor:'#2a1020'`.
- **`.github/workflows/deploy.yml`** : **deploy AUTO** sur push `main` → build → publie `./out` sur le repo Pages (branche master). **Ne jamais déployer à la main.**
- **iOS** : `ios/App/App.xcodeproj` → bump version/build → Archive → Upload TestFlight.

---

## 7. `supabase/`
- **RPC gardées** (migrations, SECURITY DEFINER, contrat `{ok,code,message}`) : `create_clutch`, `admin_*`, `join_event`, occupancies + EXCLUDE gist, `check_cone_feasibility`, Test Lab (`create/delete_test_bots`, `reset_*`). ⚠️ `20260630_create_test_bots` et `20260701_delete_test_bots` = **à appliquer en base**.
- **Edge Functions** (Deno) : `delete-account` (RGPD) · `expire-clutches` · `rdv-reminders` · `send-push` (OneSignal) · `create-checkout` (Stripe) · `stripe-webhook`.
- Projet ref : `fnucdicfcjoxbozpfdau`.

---

## 🧭 Repères pour un nouveau dev
1. **Tout le comportement réel vit dans `app/app2/page.tsx`** — commence là.
2. **La logique testable est extraite dans `lib/`** — teste via `scripts/test-*.mts` avant de toucher l'UI.
3. **Zéro serveur** : toute écriture métier passe par une **RPC Supabase gardée** (jamais `.update()` direct sur une table métier).
4. **Couleurs** via `lib/brand.ts` ; **textes** via `t('clé')` (dico TR) ; **radar = temps, pas GPS**.
5. Ignore les fichiers `« … 2 »` (doublons de sync).
