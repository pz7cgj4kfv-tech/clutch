# 🛰️ SPEC POUR DOM — « Le moteur de causalité » (estimateur de temps de trajet)

> Document auto-suffisant. Dom code ce module SEUL, en local, sans accès au repo Clutch.
> Il livre un **module PUR** (`lib/travel-estimate.ts` + tests) → David le passe à Claude → Claude le branche.
> Synthèse validée après challenge GPT + Grok (28.06.2026).

---

## 1. Le contexte (pour comprendre ce qu'on construit)

**Clutch** = app de rencontre spontanée EN PERSONNE (Suisse, démarrage Lausanne). On se déclare dispo, quelqu'un
propose un RDV lieu+heure, on accepte → RDV confirmé. Au cœur : **« le Cône »**, notre modèle de crédibilité
espace-temps. Une règle : ma dispo doit être **physiquement crédible** — je dois pouvoir VRAIMENT être au point de
RDV à l'heure, depuis ma position réelle.

**Ton module est la brique manquante** : combien de temps, AU MAXIMUM, pour aller de A à B en partant maintenant ?
Tout le reste (le cône, la tension 0→10, les nudges) c'est Claude qui le code DANS l'app, en appelant ta fonction.

**Principe directeur : on veut le temps de trajet MAXIMUM plausible (conservateur).** Mieux vaut surestimer
(« pars un peu plus tôt ») que sous-estimer (« t'arriveras jamais »). On protège la fiabilité d'un vrai RDV.

---

## 2. Ton livrable : un module PUR

Une fonction pure (entrée → sortie, zéro état, zéro réseau bloquant côté app, pas de logs de coordonnées).

```ts
// lib/travel-estimate.ts

export type LatLng = { lat: number; lng: number }
export type TravelMode = 'walk' | 'bike' | 'ebike' | 'car' | 'transit'

export type TravelEstimate = {
  minutes: number            // temps de trajet MAX plausible, en minutes (arrondi sup.)
  modeUsed: TravelMode       // le mode retenu pour ce minutes (le plus rapide raisonnable)
  confidence: 'high' | 'medium' | 'low'  // high = vraie donnée API ; low = fallback distance×vitesse
}

/**
 * Estime le temps de trajet MAX (conservateur) entre deux points, en partant `now`.
 * @param from   position de départ
 * @param to     destination (lieu de RDV)
 * @param now    instant de départ (Date) — pour trafic/horaires si dispo
 * @param modes  modes autorisés (défaut: tous). Ex: piéton seul si pas de voiture.
 * @returns      estimation conservatrice + niveau de confiance
 */
export function estimateTravelMax(
  from: LatLng,
  to: LatLng,
  now: Date,
  modes?: TravelMode[]
): TravelEstimate
```

**Contraintes dures :**
- **Fonction pure / déterministe** à signaux constants (mêmes entrées + même horaire → même sortie). Testable hors-ligne.
- **Aucun log de position.** Tu ne stockes, n'imprimes, ne transmets jamais `from`/`to` ailleurs que pour le calcul (vie privée — c'est sacré chez nous).
- **Toujours renvoyer un résultat** (jamais throw). Si tu ne sais pas → fallback conservateur + `confidence:'low'`.
- TypeScript pur, zéro dépendance lourde non justifiée. Si tu appelles une API (OSRM/CFF), encapsule-la derrière cette fonction avec un **fallback hors-ligne** intégré.

---

## 3. Le modèle de calcul (validé)

### a) Distance
`d = haversine(from, to)` en km (distance à vol d'oiseau). En ville, le réseau routier rallonge → applique un
**facteur de détour** : `d_route ≈ d × 1.3` (urbain) ou `× 1.15` (interurbain). (OSRM donne la vraie distance routière
si tu l'intègres — c'est mieux, garde le facteur en fallback.)

### b) Table des vitesses (CONSERVATRICE — on veut le MAX de temps)
Valeurs tranchées après challenge (on prend les plus lentes réalistes) :

| Mode | Vitesse effective | Domaine |
|---|---|---|
| **walk** (à pied) | **4.5 km/h** | < 5 km |
| **bike** (vélo) | **13 km/h** | < 15 km |
| **ebike** (vélo élec) | **18 km/h** | < 20 km |
| **car** (voiture) | **25 km/h** urbain · **70 km/h** interurbain (>20 km, autoroute) | tout |
| **transit** (transports publics / train) | **8 km/h** commercial urbain (TL Lausanne ≈ 7.6) · **70 km/h** longue distance (train CFF) | tout |

→ Le `minutes` retenu = celui du **mode le plus rapide raisonnable** parmi `modes`, pour cette distance. Ex. 100 km
sans voiture → transit longue distance ~70 km/h. 3 km en ville → vélo/voiture urbaine, prends le plus rapide ~13-25.

### c) Marge / buffer
**Ne l'ajoute PAS dans ton module.** Claude ajoute la marge sécurité (15 min) côté app. Toi tu renvoies le trajet pur.

### d) Dégradé (zone inconnue / pas de données)
- Suisse romande connue → confidence `medium`/`high`.
- Zone inconnue / pas d'API → **vitesse mixte prudente `25 km/h` + facteur détour 1.3**, `confidence:'low'`.
- Mondialisation (plus tard) : table de vitesses par région.

---

## 4. Les signaux — V1 vs Phase 2

**V1 (ce qu'on a besoin MAINTENANT, cold-start Lausanne) :**
- ✅ Haversine × facteur détour × table de vitesses ci-dessus. **Suffit pour démarrer.**
- ✅ Optionnel si rapide : **OSRM** (open source, gratuit) pour la vraie distance/temps routier voiture.
- ✅ Heuristique train : distance > 20 km → mode `transit` à ~70 km/h (approxime le train CH sans API).

**Phase 2 (enrichissements, pas bloquants) :**
- 🔜 **CFF / SBB GTFS + GTFS-RT** (horaires + temps réel trains/bus suisses) — le « gold » pour le multimodal CH.
- 🔜 Trafic temps réel (TomTom/Waze/HERE) pour la voiture.
- 🔜 Multimodal fin (ORS / OpenRouteService : pied + vélo + TP combinés).
- 🔜 Stats réelles : temps observés des trajets de RDV acceptés dans l'app (anonymisés).

→ **Architecture demandée :** code V1 maintenant (fallback distance×vitesse), mais **isole les sources derrière des
adaptateurs** (`getRoadTime()`, `getTransitTime()`) pour brancher CFF/OSRM/trafic plus tard SANS réécrire le cœur.

---

## 5. Cas de test à livrer (avec le module)

Donne-nous des tests qui couvrent au moins :

| Cas | Entrée | Attendu (ordre de grandeur) |
|---|---|---|
| Intra-ville Lausanne | ~2 km, modes tous | walk ~25 min / vélo ~10 min / voiture ~6-8 min → renvoie le plus rapide, confidence medium |
| Lausanne → Sion (~100 km) | modes tous | transit/voiture ~85-100 min, confidence medium |
| Lausanne → Sion, **à pied seulement** | modes=['walk'] | énorme (~20h+) → de fait infaisable côté app |
| Bord de rayon urbain | 5 km, modes tous | ~15-25 min selon mode |
| **Zone inconnue** (pas de données) | coords exotiques | renvoie quand même un résultat, `confidence:'low'`, vitesse prudente |
| Distance ~0 | from ≈ to | ~1-2 min (jamais 0) |

---

## 6. Ce que tu NE fais PAS (c'est le job de Claude, dans l'app)

- ❌ Le calcul de la **tension 0→10** (Claude le fait avec ton `minutes`).
- ❌ Le **couplage rayon ↔ heure**, les **nudges GPS**, l'annulation, l'UX.
- ❌ Toute notion de cône / forteresse / utilisateurs. Toi = boîte noire « 2 points + heure → minutes max ».

Tu livres : `lib/travel-estimate.ts` + `travel-estimate.test.ts` (ou tes tests), peu importe l'outil (Antigravity, autre).
On branche. Merci Dom 🙏

---

## ANNEXE — la formule côté app (pour que tu voies où va ton `minutes`)
Claude calcule, à partir de ton retour :
```
slack   = T_rdv - now - estimateTravelMax(...).minutes - 15min(marge)
faisable = slack >= 0
tension  = clamp( 10 * (1 - slack / 60min), 0, 10 )   // 0=large, 10=hors cône
Tmin(R)  = R / V + buffer     // couplage rayon↔heure
```
Ton seul rôle : que `estimateTravelMax().minutes` soit **juste et conservateur**. Tout le cône en dépend.

---

## ANNEXE 2 — où ton module se branche (mise à jour archi 29.06)
Décision d'architecture (challenge GPT+Grok) : la forteresse s'applique **côté serveur** (Postgres), via des RPC
gardées. Le Cône est désormais une **fonction DB** : `check_cone_feasibility()` (cf migration
`20260629_cone_feasibility.sql`) qui, pour l'instant, utilise une estimation grossière `distance × 1.35 ÷ 30 km/h`.
**Ton moteur la remplace** : quand tu livres `estimateTravelMax()`, on porte sa logique dans cette fonction DB (ou on
l'appelle via un service), pour que les vraies minutes multimodales pilotent la faisabilité. Donc : continue de livrer
le **module pur** (TS + tests) comme prévu ; nous, on le branche dans la couche serveur. Rien ne change pour toi.
