# 🎮 PROMPT ROUND 2 — réponse de Claude à GPT (à coller à GPT)

> Claude a trié ta réponse. Voici l'accord, les coupes, et 2 points à trancher. Reste le même panel de 3 experts, sans complaisance.

COLLE À PARTIR D'ICI 👇

---

Excellente réponse, panel. Claude (le dev) a trié. **Accord sur ~85%** :
- Console `/qa-cockpit` séparée, 5 zones, timeline 18h, diagnostic « pourquoi bloqué », vérificateur anti-sonde 2 colonnes : **adopté**.
- 6 scénarios 1-clic : **adoptés**.
- Discipline de scope (pas de fuzzer-UI, pas de simulateur de Lausanne, 8-12 archétypes, pas de back-office) : **adopté**.

**Coupes de Claude (justifiez si vous n'êtes pas d'accord) :**
1. **Pas d'horloge QA globale** (`effective_now`/`qa_clock`) injectée dans les vraies RPC : trop risqué, ça contamine la logique de prod. → le « voyage dans le temps » se fait en écrivant les timestamps directement (FORÇAGE LAB). Le temporel pur est déjà couvert par le fuzzer.
2. **Pas de monde `qa_*` parallèle** : il existe déjà un « BotLab » (génère bots, les met dispo, remplit la boîte). On l'upgrade, on ne construit pas un 2e système.

**Concession de Claude (vous aviez 50% raison) :** `create_clutch()` force `sender = auth.uid()`, donc le cockpit ne peut pas tester « A→B » pour un A arbitraire via la vraie RPC. → on ajoute **UNE** RPC admin **dry-run** `qa_test_clutch(sender, receiver)` qui **ne crée rien**, rejoue les mêmes gardes et renvoie la **vraie raison**. (Pas le `qa_create_clutch_with_explain` complet — juste un validateur en lecture.)

## POINT À TRANCHER 1 — le débat « largeur vs crédibilité »

Le fondateur (David) **conteste** votre « plus de dispo ≠ plus de rencontres » : pour l'individu, être plus ouvert augmente VRAIMENT ses chances. Claude propose une **synthèse** :

> **Priorité = largeur × fiabilité.** On ne pénalise pas la largeur en soi ; on **récompense la crédibilité**. Une personne large MAIS fiable (accepte, vient, pas de lapin) reste en haut. Une personne large ET vide (déclare partout, ne convertit jamais) coule. La fiabilité (déjà un score existant dans l'app) devient le **multiplicateur** de visibilité.

**Stress-testez cette formule.** Est-elle juste ? Failles ? Comment l'éviter d'être gamée (faux signaux de fiabilité) ? Comment l'expliquer à un nouvel utilisateur sans historique de fiabilité (cold start) ? Est-ce que ça suffit à protéger les femmes du bruit, ou faut-il un plafond dur de propositions reçues EN PLUS ?

## POINT À TRANCHER 2 — calcul de trajet

On veut, sur la timeline du cockpit ET dans l'app, afficher/avertir quand deux créneaux sont **infaisables** géographiquement (ex : Morges→Lausanne en 10 min). En **static + Supabase + Capacitor** (pas de serveur custom, budget ~0) :
- V1 : distance à vol d'oiseau × un facteur ? quelle vitesse moyenne urbaine crédible ?
- Faut-il une vraie API d'itinéraire (coût, dépendance) ou un modèle approximatif suffit-il pour « avertir sans bloquer » ?
- Donnez une formule concrète et son seuil d'alerte.

## FORMAT DE SORTIE
1. Verdict sur les 2 coupes + la concession de Claude (d'accord / pas d'accord, pourquoi).
2. **Point 1** : la formule `largeur × fiabilité` tient-elle ? amendements ? cold-start ? plafond reçu en plus, oui/non ?
3. **Point 2** : formule de trajet concrète + seuil.
4. Le seul truc que Claude ou David sous-estiment encore.

Les 3 experts doivent diverger puis converger explicitement.

---

FIN DU BLOC ☝️
