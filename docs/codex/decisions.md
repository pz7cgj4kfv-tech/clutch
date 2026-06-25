# 🧭 CODEX — REGISTRE DES DÉCISIONS (prises + futures)

> Toutes les décisions de Clutch, avec leur justification. Mis à jour sur « Codex ».
> ✅ = tranché & codé · 🟡 = tranché, pas codé · ⏳ = à trancher.

## 🏰 Forteresse anti-conflit
- ✅ **Un humain ≠ 2 endroits à la fois** → table `occupancies` + contrainte Postgres `EXCLUDE USING gist` (intervalle demi-ouvert `[)`). Impossible par construction, pas en JS.
- ✅ **Occupation = projection dérivée** (trigger), jamais saisie main (sinon « occupation fantôme »).
- ✅ **2 dimensions séparées** : engagement (pending→locked→completed…) vs présence (none→arrived). Évite l'explosion d'états.
- ✅ **Durée RDV** : normal **2h**, Quick **1h** (`duration_minutes`). Auto-terminaison 2h. Terminer dispo dès la minute 0.
- ✅ **Buffer prépa 1h** : on bloque le Verrou dans `[RDV−1h, RDV+durée]`.
- ✅ **« En pause » + revival** : un pending qui chevauche un RDV est calmé (calculé, jamais stocké) → revit seul si le RDV s'annule.
- ✅ **Events dans la forteresse** (même moteur). `starts_at` + durée 3h défaut.
- ✅ **Race « dernier moment »** : 2 confirmations simultanées → 1 gagne, 1 échoue (EXCLUDE atomique).
- ✅ **pending ≠ occupation** : recevoir plusieurs propositions chevauchantes est permis (le receveur choisit).

## 🗓️ Disponibilité & événements
- ✅ **Axe `spontané | planned`**, PAS le type de compte. Spontané = dans une dispo + 18h ; planifié (partenaire) = libre + 7j ; les 2 occupent l'agenda.
- ✅ **18h = horizon glissant** depuis maintenant (midi → 6h demain).
- ✅ **Multi-créneaux** : max 3 actifs, gratuit, non-chevauchants. Persist + feuille « Mes créneaux » + compteur 📍 N/3. **Visibilité multi-slot = `syncCurrentSlot()` (promote-only, aucun site de gate touché, check chaque minute).**
- ⏳ **Horizon de déclaration des créneaux** (18h strict vs ~36h) — résolu par David : on re-déclare au fil de l'eau (18h suffit).
- ⏳ **Créneaux chevauchants dans le temps ?** reco : non.

## 🛡️ Cooldown de refus (anti-harcèlement)
- ✅ **Modèle paliers** 48h · 7j · 30j · 180j (PAS doublement). Fenêtre 90j.
- 🔴 **PAS de blocage auto définitif** (correction David) : après 3 refus → **dé-priorisation** seulement. Le blocage total = décision user, réversible.
- ✅ **Gardien `create_clutch()`** : self / blocage (table `blocks`, 2 sens) / cooldown / doublon. Tout côté serveur.
- ✅ **Anti-sonde** : refus/blocage/cooldown → même message générique « cette proposition n'est pas disponible ». Jamais notifié comme « rejet ».
- 🟡 **Vu/ignoré → signal faible** (besoin accusé de lecture) = Phase 2.

## 🤍 Aide aux sous-exposés
- ✅ **Détecter la SOUS-EXPOSITION, pas l'impopularité** (peu vu/proposé malgré activité, après 14j).
- ✅ **Boost** : pool compatible uniquement, +20% plafonné, dégressif 30j. Jamais une femme = quota pour un homme.
- ✅ **Coaching** non culpabilisant, 1×/sem, jamais de push. **Meilleure aide = orienter vers events de groupe.**
- ✅ **Slice 1 (nudge event)** = bannière douce branchée (onglet Événements, cap 1×/sem localStorage). **🔑 Slice 2 (boost ranking)** = bloquée par l'upgrade Supabase (logging impressions = écritures, pas en over-quota).

## 💰 Coûts une fois opérationnel (estimés)
- Supabase Pro **$25/mois** (>~500 users) · Apple Developer **$99/an** · Google Play **$25 une fois** · OneSignal **gratuit** (<10k) · GitHub Pages **gratuit** · domaine optionnel ~$12/an.
- ⏳ Supabase **over quota** : grâce jusqu'au **24 juillet 2026** → upgrade avant.

## 📐 Règles permanentes (méthode)
- ✅ Tout seuil = **paramètre configurable** (`lib/clutch-config.ts`), jamais de nombre magique.
- ✅ **Vérifier la vraie valeur avant de trancher un défaut** (leçon durée 2h).
- ✅ **Zéro risque** : si une tâche parallèle peut créer un bug, la faire en série.
- ✅ Tout traduit **FR + EN**.

## ⏳ Décisions ouvertes / Phase 2
- ⏳ Logging d'impressions (pour le score de sous-exposition + le boost).
- ⏳ Vérif téléphone / anti-multi-compte (infra, pas MVP).
- ⏳ Visibilité Présences multi-créneaux ; gate de connexion lit tous les créneaux.
- ⏳ Conflit géré sur accept-bot & contre-proposition.
- ⏳ Supabase « over quota » → passer payant avant lancement.
