# 🛡️ LA PROTECTION FORTERESSE — état officiel (build 228, 30.06)

> « Est-ce que la protection est en vigueur, elle marche, elle empêche tout ça ? » — David.
> Réponse précise, par type de trou et par endroit. Source de vérité : `lib/forteresse-engine.ts` (`evaluateSchedule`).

## Ce qui est PROUVÉ (simulateur SimCity 1)
`/clutch-city` en mode « Forteresse CORRIGÉE » → **0 trou** sur 1000+ agents. Prouve que les RÈGLES sont
cohérentes à grande échelle (le comportement des agents est simplifié ; ce sont les règles qui sont réelles).
Headless : `npx tsx scripts/clutch-city.mts 1000 7 50 enforce`.

## Ce qui est EN VIGUEUR dans la VRAIE app
| Trou | À l'ENVOI (je propose) | À l'ACCEPTATION (je verrouille) | Niveau |
|---|---|---|---|
| **Double-booking** (2 RDV même heure) | ⚠️ check existant (retard) | 🔒 **BLOQUÉ** (carte ⏸ en pause + contrainte DB `occ_no_overlap`) | DUR |
| **Enchaînement** (fin RDV A + trajet > début RDV B) | ✅ alerte 2-temps « Enchaînement serré… » (vrai trajet distance, build 228) | ✅ alerte « Enchaînement serré… » (build 226) | PRÉVIENT (gradient) |
| **RDV inatteignable** depuis ma position | (Cône à la pose du créneau) | ✅ inclus dans evaluateSchedule | PRÉVIENT |
| **Horizon 18h** | 🔒 borné par les molettes | — | DUR |
| **Cooldown 48h** | 🔒 RPC `create_clutch` | — | DUR |

## Choix produit (cohérent avec ta charte « jamais bloquer, prévenir »)
- **Double-booking** = bloqué dur (impossible d'être à 2 endroits EN MÊME TEMPS — pas de sens de l'autoriser).
- **Enchaînement serré** = **alerte, pas blocage** (on te fait confiance : peut-être tu pars plus tôt, tu prends un taxi…).
  Si un jour tu veux le bloquer dur → c'est un seul `if`, dis-le.

## Pas encore branché
- **Events** comme engagements dans le check d'envoi/acceptation (ils occupent déjà l'agenda côté DB, mais le
  message d'alerte ne les nomme pas encore distinctement).

## Comment tu le testes
Cf. `docs/comment-tester-build226.md` §B : aie un RDV à 20h30, propose/accepte un 2ᵉ à 22h30 loin → tu dois voir
l'alerte « Enchaînement serré ». Et `/clutch-city` : interrupteur Forteresse → compteurs à 0.
