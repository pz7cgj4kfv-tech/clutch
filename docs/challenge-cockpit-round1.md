# 🎮 Cockpit de test — Round 1 (réponse GPT + tri Claude)

> Protocole challenge externe. GPT a répondu, Claude trie (or/bluff/manquant). Décisions David en bas.

## ✅ L'OR de GPT (on garde)
- **Console séparée `/qa-cockpit`** (pas dans l'app normale) — 5 zones : scénarios 1-clic · acteurs · **timeline 18h** · actions rapides · **« Pourquoi ça bloque ? »**. Juste.
- **Vérificateur anti-sonde à 2 colonnes** : `raison réelle (admin)` vs `message exposé (user)`. Brillant, pas cher, c'est exactement le « montre-moi les ratés » de David.
- **6 scénarios 1-clic** : boîte pleine · cooldown qui expire · collision RDV · pendings chevauchants · blocage invisible · sous-exposé aidé. Bien ciblés (mappent nos vraies gardes).
- **Discipline de scope** : ne PAS refaire le fuzzer en UI · pas de simulateur parfait de Lausanne · 8-12 archétypes QA (pas 50) · pas de back-office business. D'accord à 100%.
- **Garde-fous chevauchement** (débat B) : surtout **« dispo large = priorité brute PLUS BASSE »** (anti-bruit) + **anti-ratissage** (un homme ne peut pas se mettre « partout ») + contrôle receveuse. = aligné avec notre ADN anti-spam.

## ✂️ LE BLUFF / sur-ingénierie (je coupe pour V1)
- **❌ `qa_clock` / `effective_now()` global injecté dans les vraies RPC.** GPT flague le risque lui-même — je vais plus loin : **on n'y touche pas**. Threader une horloge QA dans `create_clutch()` + le cooldown SQL = **contaminer la logique de prod** = danger. → V1 : le « voyage dans le temps » se fait en **écrivant directement les timestamps** (cooldown_until, expires_at) en mode **FORÇAGE LAB**, sans horloge globale. Le temporel pur est déjà prouvé par le fuzzer.
- **❌ Un monde `qa_*` parallèle** (qa_scenarios, qa_actors, qa_seed, qa_reset, qa_create_actor…). On a **DÉJÀ le BotLab** (génère bots, les met dispo, remplit la boîte). → V1 = **upgrader le BotLab + une page timeline/diagnostic**, PAS un 2e système de test concurrent.
- **❌ `qa_create_clutch_with_explain()`** (2e RPC qui renvoie la raison). Inutile : `create_clutch()` **lève déjà** des exceptions distinctes (self/blocked/cooldown/pair_busy/inbox_full). Le cockpit (admin) lit juste l'**exception brute** au lieu de la masquer. Zéro nouvelle RPC.

## ➕ CE QUE GPT A OUBLIÉ (j'ajoute)
- **Faisabilité de TRAJET sur la timeline** : afficher l'écart entre 2 créneaux + le **temps de trajet nécessaire** (le calcul réel que David veut). C'est le cœur de son test « se mettre en ligne ».
- **Verrou de sécurité au niveau DB, pas JS** : `/qa-cockpit` peut forcer des clutchs/blocages → si la protection est JS-only elle est contournable (notre règle anti-malveillance). → **RLS admin-only au niveau Postgres**, pas juste caché dans l'UI.

## 🎯 LE TRUC OÙ GPT A RAISON ET TE CHALLENGE (David)
> « **Plus de disponibilité ≠ mécaniquement plus de rencontres.** » La largeur crée aussi du **bruit, des attentes déçues, des opportunistes, moins de confiance.
> La vraie promesse n'est pas « sois dispo partout » mais **« dis-nous les plans que tu accepterais VRAIMENT ce soir — Clutch trie »**.
> La vraie métrique = **intentions crédibles → Verrous → rencontres réussies**, PAS le nombre de dispos.

→ C'est cohérent avec le Graal (tu ouvres l'app juste pour dire oui/non). **Adopter ce principe = la dispo large est permise mais PÉNALISÉE en priorité** ; la précision/crédibilité gagne.

## ❓ DÉCISIONS DAVID (pour avancer)
1. **Principe de ranking** : on adopte « **crédibilité > largeur** » (dispo large = moins priorisée) ? (reco Claude : OUI)
2. **Scope cockpit V1** : on **upgrade le BotLab + page timeline/diagnostic** (lean) plutôt que le monde `qa_*` complet de GPT ? (reco : OUI)
3. **Temps simulé** : FORÇAGE LAB par timestamps directs (pas d'horloge globale risquée) ? (reco : OUI)
4. **Round 2 GPT** ? On renvoie ce tri à GPT pour un dernier passage, ou on commence à construire ?
