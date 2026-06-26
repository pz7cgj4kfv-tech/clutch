# 🎮 PROMPT GPT — « Le cockpit complet : tous les degrés de liberté » (à coller à GPT)

> Round suivant. On a un cockpit FLOTTANT (bulle déplaçable, onglets) mais il ne fait que 3-4 actions.
> David (le fondateur, non-dev) veut TOUT piloter seul pour tester chaque filtre/combinaison.

COLLE À PARTIR D'ICI 👇

---

Même panel de 3 experts (QA / designer d'outils internes / sceptique systèmes), sans complaisance.

## Où on en est
On a construit un **cockpit de test FLOTTANT** dans l'app (bulle 🎮 déplaçable par-dessus l'écran, panneau à onglets, admin-only, retirable avant lancement). Il sait aujourd'hui : mettre des bots en ligne, remplir ma boîte de clutchs, faire accepter les bots, reset, et un diagnostic « pourquoi un envoi A→B est bloqué » (anti-sonde).

**Problème (verdict du fondateur, juste) : « je n'ai aucun contrôle ».** Il ne peut PAS : créer un event à l'heure qu'il veut, fabriquer un acteur avec des paramètres précis (dispo de telle à telle heure, telle activité, tel rayon), choisir l'heure/lieu d'un clutch, forcer une collision de RDV, régler un cooldown, etc. Bref il ne peut pas **reproduire n'importe quelle situation** ni **exercer chaque filtre**.

## Tous les DEGRÉS DE LIBERTÉ de l'app (ce qu'il doit pouvoir piloter)
- **Acteur** : genre (F/H/NB), âge, score de fiabilité, type de compte (gratuit/premium/partenaire), intérêts, langues, **position (lat/lng)**, plafond de boîte reçue.
- **Disponibilité (créneau)** : fenêtre horaire (début/fin), lieu, **rayon**, **modes** (romance/amitié/pro/famille), préférence genre, tranche d'âge. **Plusieurs créneaux, chevauchants permis** (dispo = intention).
- **Événement** : titre, **heure de début**, lieu, places, catégorie, **spontané vs planifié**, prix.
- **Clutch (envoi)** : de→vers, **lieu**, **heure proposée**, message, Quick (1h) vs normal (2h).
- **Réponses** : accepter / refuser / **contre-proposer** (autre lieu+heure) / timeout / expirer.
- **Cycle de vie** : check-in (GPS simulé) / feedback (à l'heure / venu / lapin) / terminer / annuler.
- **Contraintes à provoquer** : cooldown (poser N refus), blocage (2 sens), **collision d'occupation** (forteresse), horizon 18h, boost sous-exposé, plafond reçu.
- **Temps** : on a décidé PAS d'horloge globale (risque prod) → on « voyage » en écrivant les timestamps directement (forçage labo).
- **Mode** : Démo (bots visibles) / Réel (vide).

## La VRAIE question
Conçois la **surface de contrôle COMPLÈTE mais MINIMALE** de ce cockpit flottant. Contraintes : fenêtre **petite** (≈300px), opérée par un **non-dev**, **sans noyer** sous 50 boutons. Réponds :
1. **L'organisation en onglets** (combien, lesquels, quoi dans chacun) pour couvrir TOUS les degrés ci-dessus sans devenir un monstre.
2. **Le « créateur d'acteur »** : quels champs exposer (les essentiels), quels masquer derrière un « avancé ».
3. **Divulgation progressive** : comment garder la fenêtre petite (accordéons ? presets + override ? sliders ?).
4. **Les 6 contrôles à livrer EN PREMIER** (ceux qui débloquent 80% des tests).
5. **Le piège** : qu'est-ce qui transformerait ce cockpit en usine à gaz, et comment l'éviter ?
6. **Forçage labo** : comment marquer clairement les actions « pas un vrai comportement utilisateur » (ex. écrire un cooldown à la main).

Les 3 experts divergent puis convergent. Concret, hiérarchisé. Pas de blabla.

---

FIN DU BLOC ☝️
