# ✅ AUDIT DE COUVERTURE DE TEST — Clutch (01.07.2026)

> « Qu'est-ce qu'on n'a PAS testé/débuggé ? » — David. Matrice par feature : **codé ?** · **testé bout-en-bout ?** · **comment tester**.
> Légende : ✅ codé+vérifié · 🟦 codé, PAS testé end-to-end · 🟧 partiel/risqué · ⛔ pas fait.
> Méthode de test : **Solo** (1 tél) · **2 tél** (toi + ta mère/2e compte) · **Lab** (Test Lab bots) · **Sim** (Clutch City).

## A. DISPONIBILITÉ / CRÉNEAUX
| Cas | État | Comment tester |
|---|---|---|
| Ouvrir 1 créneau (lieu+rayon+heures) | ✅ | Solo |
| Multi-créneaux 1/2/3 (lieux différents) | 🟦 | Solo — vérifier couleurs + pastille N/3 |
| Moments intelligents (arbre +18h, début+1h) | ✅ | Solo à différentes heures |
| Molette fin suit le début (plus de blocage) | ✅ | Solo |
| Modifier un créneau garde position/heure | 🟦 | Solo — modifier puis re-vérifier |
| Rayon découplé du pin (déplacer loin ≠ rétrécit) | 🟦 | Solo — bouger le pin vers Genève |
| Dérive GPS → « recaler » (sans créneau = pas d'alerte) | 🟦 | 2 tél / se déplacer |

## B. PRÉSENCES / DÉCOUVERTE
| Cas | État | Comment tester |
|---|---|---|
| Voir les autres (intersection forteresse + filtres) | 🟦 | 2 tél |
| Filtres : genre recherché / mode / distance / âge | 🟦 | Solo (régler) + 2 tél (vérifier qui voit qui) |
| Mode réception ♀ (Ouverte/Sélective/Pause) | 🟦 | 2 tél |
| Carte présence Mel (vraies pers.) vs riche (bots) | ✅ | Lab |
| Badge 📅 (a créé un event) | 🟦 | 2 tél — crée event compte 2 |
| Favori · Bloquer · Signaler | 🟦 | 2 tél |

## C. CLUTCH (le cœur) — ⚠️ À TESTER EN PRIORITÉ
| Cas | État | Comment tester |
|---|---|---|
| Envoyer un clutch (lieu+heure+intention) | ✅ | 2 tél |
| **Empilage / plafond simultané** (♀20 · premium5 · free3) | 🟦 | Lab — « N bots me clutchent » jusqu'au plafond → message « déjà X actifs » |
| **5 reçus/jour (♀)** | 🟦 | Lab — bombarder une ♀ de 6 clutchs → le 6e ? |
| **Accepter** (🔒 Verrou) | 🟦 | 2 tél |
| **Refuser** + cooldown 48h | 🟦 | 2 tél — refuser, puis re-clutcher la même → bloqué 48h |
| **Comment la personne refusée le prend** | 🟧 | 2 tél — vérifier le message côté refusé (neutre ? pas vexant ?) |
| Contre-proposer (autre lieu/heure) | 🟦 | 2 tél |
| Anti-doublon (2 clutchs même paire) | ✅ (RPC) | Lab |
| Self-clutch / bloqué / inbox pleine | ✅ (RPC) | Lab |
| **Enchaînement serré** (RDV A puis B loin) | 🟦 | 2 tél — RDV 20h30, proposer 22h30 loin → alerte |

## D. VERROU → RDV → FEEDBACK
| Cas | État | Comment tester |
|---|---|---|
| Verrou (chat ? — manque) | 🟧 | 2 tél |
| J'y suis (check-in GPS ~100m) | 🟦 | 2 tél sur place |
| Terminer (bloqué si pas check-in) | 🟦 | 2 tél |
| Feedback 3 issues (à l'heure/présent/lapin) + ⭐ favori | 🟦 | 2 tél |
| Double feedback caché 3h → fiabilité | 🟧 | 2 tél + attendre |
| Annuler un RDV (recrée un créneau ? pénalité ?) | 🟧 | 2 tél |

## E. ÉVÉNEMENTS — ⚠️ À TESTER
| Cas | État | Comment tester |
|---|---|---|
| Créer un event (titre/lieu/dates/places/prix/âge/desc) | 🟦 | Solo |
| **Places min « ça a lieu dès N » / max / impairs** | 🟦 | Solo — créer pétanque à 3 |
| Rejoindre un event → place décrémentée | 🟦 | 2 tél |
| **Se mettre en LISTE D'ATTENTE (event plein)** | 🟦 | Lab — remplir un event puis tenter de rejoindre |
| Place se libère → la waitlist avance ? | 🟧 | Lab |
| Annuler son event (notifs inscrits ?) | 🟧 | 2 tél |
| Event « trop loin pour l'heure » (grisé) | 🟦 | Solo — se déplacer / event lointain |
| Tag « Créneau N » + carte 🗺️ | 🟦 | Solo + générateur 🧪 |
| Générateur d'events test (🧪) | 🟦 | Solo (mode Démo) |

## F. SÉCURITÉ / EDGE CASES
| Cas | État | Comment tester |
|---|---|---|
| SOS (déclenche / arrête) | 🟦 | Solo |
| Suppression de compte (Edge Function) | ✅ | Solo (compte jetable) |
| Hors-ligne → resync (accepter offline) | ⛔ | 2 tél en avion |
| Push notif (clutch reçu app fermée) | 🟧 | 2 tél — **critique pour le vrai usage** |
| Minuit / changement de jour | 🟦 | Solo à 23h |
| Triangulation (rayon = temps, jamais distance) | ✅ | (revue code) |

## 🎯 LE PLAN DE TEST MINIMAL (avant les amis)
1. **2 téléphones, happy path complet** : dispo → présence → clutch → accept → Verrou → J'y suis → Terminer → feedback. ×2 fois.
2. **Test Lab** : empilage clutchs jusqu'au plafond · 6e reçu ♀ · cooldown 48h · waitlist event plein.
3. **Forteresse** : enchaînement RDV 20h30 → 22h30 loin (alerte) · event qui se grise en se déplaçant.
4. **Push** : un clutch reçu doit **sonner app fermée** (sinon le concept « spontané » ne marche pas).
5. Noter chaque retour en vrac → trier → corriger.

> ⚠️ Le plus gros risque non-testé = **les push notifs** (sans elles, personne ne voit un clutch à temps) et **comment un refus est vécu** (UX émotionnelle — clé pour les femmes).
