# 🔗 HANDOFF — Intégrer le moteur Graal 2 de Dom (Antigravity) dans Clutch

> Dom a codé toute la logique du Graal 2 (causalité forteresse) avec Antigravity : faisabilité d'un créneau selon
> la position changeante, le temps qui passe, distance-temps en **voiture** + **CFF** (transports Suisse), etc.
> Ça marche « parfaitement à la base ». Objectif : l'implémenter dans l'app Clutch. Voici ce qu'il me faut.

## ⚠️ LA CONTRAINTE QUI DÉCIDE DE TOUT : Clutch = ZÉRO serveur
Clutch est un **export statique** (Next.js `output:'export'`) + Supabase client-side. Il n'y a **aucun serveur** où
faire tourner du code, et **aucun secret (clé API) ne peut être mis dans l'app** (public → volable).
→ Donc le moteur de Dom doit tomber dans **une** de ces 3 catégories :

1. **✅ IDÉAL — moteur AUTONOME (formules/tables, zéro réseau)** : il calcule le temps de trajet avec des formules
   et des paramètres (vitesse voiture, détour ×facteur, vitesse CFF moyenne, temps d'attente, etc.), **sans appeler
   d'API en direct**. → je le colle dans `lib/` et ça marche partout, offline, gratuit.
2. **🟡 OK — API PUBLIQUE SANS CLÉ** : ex. l'API CFF publique `transport.opendata.ch` (gratuite, sans clé) → appelable
   directement depuis l'app. Pour la voiture, il n'y a pas d'équivalent gratuit sans clé.
3. **🟠 POSSIBLE mais + de travail — API à CLÉ (Google Directions, etc.)** : il faudrait que J'ajoute une petite
   **Edge Function Supabase** (proxy serveur) qui garde la clé secrète et fait l'appel. Faisable, mais c'est de l'infra
   en plus + du quota. À éviter si le modèle autonome suffit.

## 📦 CE DONT J'AI BESOIN DE LA PART D'ANTIGRAVITY / DOM (5 points)
1. **Le code en JavaScript ou TypeScript.** (Pas Python : je ne peux pas exécuter du Python côté app.) Si Antigravity
   l'a fait en Python, il me faut **la LOGIQUE** (les formules, les seuils, les tables) que je réécris en TS — ou qu'il
   me la sorte directement en JS/TS.
2. **Une FONCTION PURE** (déterministe, sans UI, sans état global, sans I/O caché) avec une **signature claire**, ex :
   ```ts
   feasible(input: {
     fromLat, fromLng,            // ma position actuelle (GPS)
     toLat, toLng,                // la zone / le lieu du créneau
     departAt: number,            // maintenant (epoch ms)
     arriveBy: number,            // début du créneau (epoch ms)
     mode?: 'auto'|'car'|'transit'
   }): {
     reachable: boolean,          // je peux y être à temps ?
     travelMinutes: number,       // temps de trajet estimé
     tension: number,             // 0..10 (marge restante)
     via: 'car'|'transit',        // par quel moyen c'est faisable
   }
   ```
   (les noms exacts, on s'adapte — l'important = **entrées → sortie déterministes**).
3. **La LISTE des critères** qu'il utilise + la **donnée** que chacun demande (temps voiture, temps CFF, temps
   d'attente, marge de sécurité, plage horaire, etc.). Et lesquels ont besoin d'un **appel réseau** (→ catégorie 2/3
   ci-dessus) vs sont **auto-suffisants** (catégorie 1).
4. **Des CAS DE TEST de référence** : ~10-20 lignes « entrée → sortie attendue » qu'il a validées (ex : Lausanne→Sion
   à 14h pour un créneau à 15h = reachable/pas reachable, X min). → je les mets dans `scripts/test-graal2.mts` pour
   **prouver la parité** après intégration (comme mon `test-forteresse` 26/26).
5. **Le fichier isolé**, pas d'edit dans mon repo. Règle maison : Dom livre une **brique autonome + specs**, je
   l'assemble. Un seul fichier `graal2.ts` (ou le pseudo-code + les tables) + les cas de test suffisent.

## 🛠️ CE QUE JE FAIS DE MON CÔTÉ (le plan d'assemblage)
1. Je mets la fonction de Dom dans `lib/graal2-dom.ts` (ou je la transpose depuis sa logique).
2. Je la branche derrière l'interface existante (`foReachKm` / `foEval` / `check_cone_feasibility`) via un **feature
   flag** (`GRAAL2_DOM_LIVE`) → à `false`, rien ne change ; à `true`, tout passe par le moteur de Dom.
3. Je fais tourner `scripts/test-graal2.mts` (ses cas) → **parité prouvée** avant de brancher en réel.
4. Je branche partout où la forteresse décide : ouverture de créneau, envoi/accept de clutch, modal de blocage,
   notifications de tension. (Aujourd'hui c'est mon modèle ~30 km/h ; là ce sera voiture + CFF réels.)
5. Si un critère a besoin d'un appel réseau (ex. CFF live) → je décide : API publique directe (idéal) ou Edge Function.

## ❓ 3 QUESTIONS À POSER À DOM MAINTENANT
- **En quel langage** Antigravity a sorti le code (JS/TS ? Python ?) ?
- Le calcul est-il **auto-suffisant** (formules) ou appelle-t-il des **API en direct** (CFF, Google) ? Si API, lesquelles + faut-il une clé ?
- Peut-il me donner **la fonction isolée + 10-20 cas de test** (entrée → sortie) ?

→ Avec ça, l'intégration est rapide et sûre (feature flag + parité prouvée, zéro régression).
