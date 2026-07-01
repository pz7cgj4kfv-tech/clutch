# 🧪 PLAN DE TEST AVEC DOM — du simple au compliqué (30.06.2026)

> Brain-dump David capté. Objectif : tout tester **efficacement**, débugger à chaque étape. Ordre = simple → compliqué.
> Statut de chaque brique : **✅ en base (logique prouvée)** · **🟦 codé, à vérifier en vrai (UI end-to-end)** · **⛔ à construire**.
> Méthode : **Solo** (1 tél) · **2 tél** (toi + Dom) · **Lab** (Test Lab / incarnation) · **Sim** (Clutch City).

---

## 🎁 CE QUI EST DÉJÀ FAIT EN BASE (rassurant — pas à reconstruire, juste à VÉRIFIER)
- **Plafond de clutchs reçus** : colonne `max_received_clutchs` (défaut **5**, réglable par user), **EN TOTAL** (pas
  par créneau) → **la faille « 3 créneaux = 9 clutchs » est déjà bouchée** ✅. Bloque par `INBOX_FULL`.
- **Anti-sonde** : bloqué / cooldown / boîte-pleine → **même message neutre** (on ne devine pas pourquoi) ✅.
- **Occupations (le Verrou occupe l'espace-temps)** : table `occupancies` + contrainte d'exclusion → **impossible
  d'être à 2 endroits** ; se synchronise quand un clutch se verrouille/se termine ✅.
- **Événements** : mode **`open`** (auto → liste d'attente) vs **`curated`** (demande → l'orga tranche) ;
  `requested`/`waitlisted` = **soft hold (n'occupe PAS de place)** ; table `event_waitlist` cross-user ✅.
- **Incarnation** : voir l'app **du point de vue d'un bot** ✅ (partiel — cf. §OUTIL).
- **Resets** : reset total · reset interactions bots · reset cooldowns ✅.

---

## PARTIE 1 — ERGONOMIE & DISPO (le plus simple)
| # | Test | Statut | Comment |
|---|---|---|---|
| 1 | Se mettre en ligne (1 créneau) à ma position | 🟦 | Solo |
| 2 | Ouvrir **2-3 créneaux** (lieux/heures différents) | 🟦 | Solo — vérifier pastille N/3 + couleurs |
| 3 | Créneau **ailleurs** que ma position (pin déplacé) | 🟦 | Solo |
| 4 | Je reste **statique, l'heure avance** → mon cône reste-t-il valable ? | 🟦 | Solo (attendre / avancer l'heure) |
| 5 | **Je bouge** (ex. vers Morges) → l'app détecte que je m'éloigne | 🟦 | 2 tél / se déplacer |
| 6 | **Alerte** quand mon créneau n'est plus atteignable pour l'heure | 🟦 | Solo — pin loin / temps qui passe |
| 7 | **Auto-décalage** de l'heure de début OU disparition du créneau quand plus atteignable | 🟦→⛔ | décision ci-dessous |

## PARTIE 2 — PRÉSENCES & FILTRES
| # | Test | Statut | Comment |
|---|---|---|---|
| 8 | Je vois **seulement les gens dans mes créneaux** (espace × temps) | 🟦 | 2 tél |
| 9 | Filtres communs : **genre / âge** (+ mode, distance) | 🟦 | Solo (régler) + 2 tél (qui voit qui) |
| 10 | Mode réception ♀ (Ouverte / Sélective / Pause) | 🟦 | 2 tél |

## PARTIE 3 — CLUTCH & VERROU (le cœur)
| # | Test | Statut | Comment |
|---|---|---|---|
| 11 | **Tant que rien n'est accepté**, rien ne bouge (clutch envoyé/reçu, inscription event) | 🟦 | 2 tél |
| 12 | **Quelqu'un accepte → Verrou** : l'algo met-il à jour l'espace-temps ? (les créneaux devenus incompatibles avec le RDV verrouillé s'invalident) | ✅ base / 🟦 UI | 2 tél — **le test clé de la forteresse** |
| 13 | **3 créneaux ouverts, 1 Verrou dans l'un** → que deviennent les 2 autres ? | ✅ base / 🟦 UI | 2 tél |
| 14 | **2 Verrous** (les 3 types : j'accepte qqn · qqn m'accepte · un event) → cohérence | 🟦 | 2 tél + Lab |

## PARTIE 4 — EMPILEMENT / FILE D'ATTENTE
| # | Test | Statut | Comment |
|---|---|---|---|
| 15 | Je reçois plusieurs clutchs, **jamais plus que mon max (5)** | ✅ base | Lab — bombarder jusqu'au plafond |
| 16 | **Régler le max** dans les réglages (5 gratuit / 10 payant) | 🟦 (réglage existe) | Solo — le brancher sur l'abo |
| 17 | **Boîte pleine → je deviens invisible** en présence | ⛔ à construire | design ci-dessous |
| 18 | **Je décline → je réapparais** en présence | ⛔ à construire | design ci-dessous |
| 19 | **Liste d'attente d'expéditeurs** (payant : envoie dès qu'une place se libère) | ⛔ Phase 2 | nouvelle feature |

## PARTIE 5 — ÉVÉNEMENTS (2 points de vue)
| # | Test | Statut | Comment |
|---|---|---|---|
| 20 | **Créer** un event (titre/lieu/dates/places/prix/âge) | 🟦 | Solo |
| 21 | S'inscrire : l'event **concorde-t-il avec mon cône + mes RDV** ? (grisé si trop loin) | 🟦 | Solo/2 tél |
| 22 | Mode **curated** : je demande → **l'orga choisit** (je passe en « en attente ») | ✅ base / 🟦 UI | 2 tél |
| 23 | **Event plein → liste d'attente** ; une place se libère → la waitlist avance | ✅ base / 🟦 UI | Lab |
| 24 | **POV orga** : je vois les demandes « en attente », j'accepte/refuse | 🟦 | 2 tél |
| 25 | **Refus d'un participant → notif douce** (« complété autrement ») | ⛔ à construire | design ci-dessous |

## PARTIE 6 — ALGORITHME (le plus dur, surtout Lab/Sim)
| # | Test | Statut |
|---|---|---|
| 26 | **Ghoster** : la personne ne me voit plus (sans créer de tension) | 🟦/⛔ |
| 27 | Un refusé (clutch) ne peut pas re-clutcher pendant le **cooldown 48h** | ✅ base |
| 28 | Un refusé (event) **ne revoit plus** l'event (anti-tension) | ⛔ décision |
| 29 | Push notif : clutch reçu / accepté / refusé **app fermée** | 🟧 **le risque #1 non-testé** |

---

## 🔧 L'OUTIL DE TEST — « incarner un robot » (solution simple, on FINIT l'existant)
David veut : cliquer un robot → **être** ce robot dans la **vraie app** (créer dispo/events, envoyer/accepter,
**changer son âge/params**), qui écrit de **vraies données** en base, + des **resets propres**.

**→ Ça existe déjà à moitié (Incarnation Phase 3).** On ne construit pas un truc parallèle, on le **termine** :
1. En incarnant : accès aux **mêmes pages** que le vrai user (dispo, présences, **créer un event**, envoyer/accepter).
2. **Éditer les params du bot** inline (âge, genre, position) comme si c'était son app.
3. Toutes les actions passent par les **RPC admin gardées** (déjà en place) → vraies lignes en base.
4. **Panneau de resets rangé** : `♻️ ce bot` · `♻️ tous les bots` · `♻️ tous les cooldowns` · `🧹 reset total`.
5. **Générateur d'events aléatoires** (existe 🧪) : certains **matchent** mes filtres, d'autres **non** (pour tester le tri).
Les bots portent déjà de vraies fiches ; ajouter un **petit « r » (robot)** dans le nom pour les distinguer.

**Méthode humaine (1 ou 2 pers.) :** partir **simple → compliqué**. Solo pour l'ergonomie (Parties 1-2), **2 tél
(toi + Dom)** pour clutch/verrou/events (Parties 3-5), **Lab/incarnation** pour l'empilement et l'algo (Parties 4-6).
On **ne teste pas tout d'un coup** : un bloc, on débugge, on valide, on avance.

---

## 🧭 DÉCISIONS DE LOGIQUE (mes recommandations, à challenger)
- **Plafond par créneau ou total ?** → **TOTAL** (déjà en base). C'est le bon choix : sinon 3 créneaux = 9 clutchs (faille). ✅
- **Auto-décaler l'heure OU alerter+griser ?** → **Alerter + griser** (ne pas décaler en silence : on ne change jamais
  l'engagement de l'user sans qu'il le voie). Quand plus atteignable → le créneau **s'éteint** avec un message clair.
- **Boîte pleine → invisible ?** → **OUI** (inutile de montrer qqn qui ne peut pas recevoir). **Décline → réapparaît.**
  La **liste d'attente d'expéditeurs** (payant) = Phase 2.
- **Refus d'event → notif ?** → **OUI mais douce et neutre** (« l'orga a complété autrement »), même philosophie que
  le refus de clutch. Et **ne plus remontrer** l'event refusé (anti-tension).
- **Ghosting** → la personne ghostée **ne me voit plus** ; pas de message « tu as été retiré » (silencieux = moins de tension).
