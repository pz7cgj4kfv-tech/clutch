# 🎮 PROMPT ADVERSE — « Conçois le cockpit de test de Clutch » (à coller à GPT)

> Protocole de challenge externe (David × Claude). Copie TOUT le bloc ci-dessous dans GPT.
> GPT répond → Claude challenge (tri or/bluff) → on renvoie → on implémente.
> Deux sujets : (A) le **cockpit de test**, (B) un **débat de conception** (chevauchement des dispos).

---

COLLE À PARTIR D'ICI 👇

---

Tu es un **panel de 3 experts** qui collaborent ET se challengent à voix haute, sans complaisance, pour résoudre un problème d'outillage. Tu ne flattes pas. Quand un expert dit une bêtise, un autre le reprend. Tu distingues ce qui est *déjà résolu par un outil existant* de ce qu'il faut *construire*.

**Le panel :**
1. **QA / architecte de test automatisé** (model-based testing, property testing, outils de simulation/scénarios).
2. **Designer d'outils internes** (cockpits, « god mode », admin panels ergonomiques — l'opérateur n'est PAS un dev).
3. **Sceptique systèmes distribués / machines à états** (cherche les cas limites, la concurrence, les états impossibles).

## CONTEXTE — le produit « Clutch » (tu n'en sais rien, voici tout)

**Clutch** = appli mobile de **rencontre spontanée EN PERSONNE**, locale (Lausanne, Suisse), pensée femmes-first et sécurité. Ce n'est PAS Tinder : pas de swipe, pas de scroll de profils pour tuer le temps. Vocabulaire propre : un **Clutch** = une invitation à se voir maintenant ; un **Verrou** = quand l'invitation est acceptée (le RDV est scellé) ; puis **Rendez-vous** réel. Le **Graal** : tu n'ouvres presque pas l'app — les **notifications** savent ce que tu cherches ; tu ouvres juste pour dire oui/non, tu as un RDV, tu quittes.

**Contrainte structurelle : tout se joue dans une fenêtre de 18h** (horizon glissant). 

**Stack (important pour les contraintes) :** Next.js en **export statique** (ZÉRO serveur applicatif), **Supabase** (Postgres + RLS + Edge Functions + Realtime) côté client, emballé en app iOS via **Capacitor**. Toute la logique « dure » est donc soit en SQL (RPC/contraintes/triggers), soit en JS client.

### Les briques d'algorithme (le « système » à tester)

1. **Se mettre en ligne (disponibilité / « créneaux »)** : l'utilisateur déclare un **créneau** = {fenêtre horaire, lieu, rayon}. **Max 3 créneaux actifs**. Aujourd'hui ils ne peuvent **pas se chevaucher** dans le temps (← c'est le DÉBAT B, plus bas).
2. **La « forteresse » anti-conflit** : un humain ≠ 2 endroits à la fois. Implémentée comme un **objet Postgres de premier rang** : table `occupancies` + contrainte `EXCLUDE USING gist` sur `tstzrange` → **chevauchement impossible par construction** (la base refuse, pas le JS). Une occupation est une **projection dérivée** (trigger) d'un **engagement CONFIRMÉ** (Verrou ou event accepté), avec un **buffer de 1h avant** le RDV. **Un Clutch *en attente* (pending) n'occupe PAS** — on peut recevoir plusieurs invitations qui se chevauchent, c'est le receveur qui tranche.
3. **Le gardien unique `create_clutch()`** (RPC SQL) : tout envoi passe par lui. Il refuse si : self-clutch · blocage (table `blocks`, 2 sens = invisibilité mutuelle) · **cooldown** de refus · **doublon** (déjà un Clutch actif avec cette personne) · **boîte pleine** (plafond de N=5 Clutchs reçus en attente, réglable). **Anti-sonde absolu** : tous ces refus renvoient le **MÊME** message générique (« pas disponible ») — l'expéditeur ne doit JAMAIS pouvoir déduire un refus/blocage/boîte pleine.
4. **Cooldown anti-harcèlement** : après un refus, paliers **48h · 7j · 30j · 180j** (fenêtre glissante 90j). **Jamais de blocage automatique** : après 3 refus → simple **dé-priorisation** dans l'algo ; le blocage total reste une **décision de l'utilisateur**, réversible.
5. **Taxonomie d'événements** : un event **spontané** (doit tomber dans un créneau actif + 18h) vs **planifié** (partenaire, libre de dispo, jusqu'à 7j). Les deux créent une occupation.
6. **Bienveillance** : on aide les **sous-exposés** (peu vus malgré activité, après 14j) — JAMAIS « les impopulaires ». Boost ≤ +20% dans le pool compatible, dégressif. Meilleure aide = orienter vers les events de groupe (nudge doux, 1×/sem).
7. **Cycle de vie d'un Clutch (machine à états)** : `pending` → `accepted`/`confirmed`/`checked_in` → `completed` ; ou `declined`/`cancelled`/`timeout`/`expired`. Check-in GPS sur place, feedback post-RDV obligatoire (à l'heure / venu / lapin).
8. **Modes de test existants** : un switch **Démo** (des **bots** visibles, étiquetés) ↔ **Réel** (app vide). Un « BotLab » permet de : générer des bots, les mettre dispo sur ma position, « remplir ma boîte » (des bots m'envoient des Clutchs), faire qu'un bot crée un event, reset.

### Ce qui est DÉJÀ prouvé (ne pas réinventer)
On a un **harnais de test INTERNE** : machine à états pure + **7 invariants** + un **fuzzer** (model-based testing, type QuickCheck) qui a joué **800 000 actions aléatoires → 0 violation** (« aucun humain à 2 endroits », aucun état impossible). **La logique est déjà prouvée côté code.**

## PROBLÈME A — le cockpit de test EXTERNE (la vraie demande)

Le fondateur (**David**, non-codeur) et sa associée (**Mélanie**, designer) doivent **tester l'app en VRAI, à la main**, vite et sans se perdre. Aujourd'hui c'est pénible : pour tester un scénario il faut **naviguer entre 10 menus**, le système de bots est **confus**, et on ne **voit pas pourquoi** une action est bloquée.

Il existe un test *logique* interne (le fuzzer). Il manque l'équivalent **EXTERNE, humain, cliquable** : un **cockpit** où David/Mel **fabriquent n'importe quelle situation en quelques clics** et **voient le résultat ET la raison** (surtout les erreurs — « montre-moi les ratés, pas quand ça marche »).

**Conçois ce cockpit.** Critères : **le plus efficace, sans erreur, le plus rapide, le plus ergonomique** possible, opérable par un **non-dev**. Réponds à :
- **Quelle FORME** ? (un « god mode » dans l'app ? une page admin séparée ? un panneau latéral ? une timeline scrubbable ? des scénarios pré-enregistrés rejouables ?)
- **Quels CONTRÔLES** ? (instancier des acteurs fictifs, leur fixer créneaux/position/genre/scores, déclencher envois/acceptations/refus/annulations, **avancer le temps**, forcer des collisions de RDV…)
- **Quel TABLEAU DE BORD** ? (état live des occupations, conflits, file d'attente, pourquoi-bloqué, cooldowns actifs — sachant que l'anti-sonde cache ça à l'utilisateur normal mais le cockpit doit tout RÉVÉLER à l'opérateur).
- **Scénarios « 1 clic »** à fournir d'office (ex : « 5 femmes + 5 hommes dispos qui se chevauchent », « 2 RDV qui entrent en collision à la dernière seconde », « boîte pleine », « cooldown qui expire »).
- **Contraintes** : ça doit marcher en **export statique + Supabase client + Capacitor iOS** (pas de serveur custom). Dis ce qui est faisable proprement vs ce qui demande un compromis.
- **Anti-sur-ingénierie** : qu'est-ce qu'on NE doit PAS construire (ce que le fuzzer couvre déjà, ou ce qui serait du gold-plating) ?

## PROBLÈME B — DÉBAT de conception : faut-il autoriser les créneaux qui SE CHEVAUCHENT ?

Le fondateur veut **maximiser les chances de rencontre**. Il propose ce modèle (à stress-tester) :

> **Disponibilité = INTENTION** (« je pourrais être à Morges 18-21h ET à Lausanne 20-23h ») → les créneaux **PEUVENT se chevaucher**.
> **Occupation = ENGAGEMENT confirmé** (Verrou/event accepté) → **reste exclusive** (la forteresse). À la confirmation d'un RDV, les dispos devenues impossibles **s'ajustent automatiquement**.

Idées liées : modéliser des **profils « souples » vs « rigides »** (largeur de dispo) ; quand 2 créneaux distants sont rapprochés dans le temps, **calculer la durée de trajet minimale** et **avertir** (sans bloquer) si c'est humainement infaisable (« tu ne peux pas aller de Morges à Lausanne à la vitesse de la lumière »).

**Débattez (panel, sans complaisance) :**
- Ce modèle « dispo = intention / occupation = engagement » est-il **sain** ? Failles ? Cas limites (concurrence, double confirmation, annulation en cascade) ?
- **Ergonomie** : un utilisateur lambda comprend-il qu'il peut être « dispo à 2 endroits » sans être schizophrène ? Comment le présenter ?
- **Sécurité femmes / anti-abus** : autoriser des dispos larges/chevauchantes ouvre-t-il une porte à un usage malveillant (un homme se rend « dispo partout » pour ratisser) ? Comment garder le contrôle côté receveuse ?
- **Algo de présentation** : si on maximise les chances, comment éviter le bruit (trop de propositions) tout en gardant la promesse « tu ouvres l'app juste pour dire oui/non » ?

## FORMAT DE SORTIE IMPOSÉ

1. **Cockpit — design retenu** (forme + 5 écrans/zones max, décrits en ASCII si utile).
2. **Cockpit — contrôles & tableau de bord** (liste concrète).
3. **Cockpit — 6 scénarios « 1 clic »** à livrer en priorité.
4. **Faisabilité technique** (ce qui passe en static+Supabase+Capacitor, les compromis).
5. **À NE PAS construire** (discipline de scope).
6. **Débat B — verdict** : garde-t-on le chevauchement ? sous quelles conditions/garde-fous ? (et les 3 experts doivent avoir explicitement **diverge puis convergé**).
7. **Les 3 plus gros risques** que tu vois dans tout ça.

Sois concret, chiffré quand tu peux, et **challenge le fondateur** quand il a tort.

---

FIN DU BLOC À COLLER ☝️
