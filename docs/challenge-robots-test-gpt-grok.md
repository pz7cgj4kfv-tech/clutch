# 🤖 PROMPT GPT / GROK — « Comment tester Clutch : repenser les robots de test » (à coller)

> Pitch AUTO-SUFFISANT (Grok ne connaît pas l'app). David : « ce qu'on a fait jusqu'à présent ne marche pas,
> il faut tout revisiter l'ergonomie de test ». On veut un système de test SIMPLE devant, complet derrière.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (ingénieur QA / test d'apps mobiles · game-designer de systèmes multi-agents · designer
d'outils internes / dev-experience), sans complaisance, divergent puis convergent.

## Le contexte — « Clutch »
App de rencontre **spontanée EN PERSONNE** (Suisse, Lausanne). Tu te déclares **disponible** (position GPS · rayon ·
fenêtre horaire ≤ 18h), quelqu'un t'envoie une invitation lieu+heure (« Clutch »), l'autre accepte → **RDV confirmé**
(« Verrou »). Il y a aussi des **événements** (un organisateur crée, les autres s'inscrivent, liste d'attente,
filtres par mode). Et une **« Forteresse »** : un moteur de crédibilité espace-temps (le « Cône ») qui vérifie qu'on
peut physiquement honorer un RDV, et un système d'**exclusion** (pas 2 RDV qui se chevauchent) + **cooldown** (anti-spam).

## Le problème
Le fondateur (non-dev) teste **seul**. Pour ça il a besoin de **robots** (faux utilisateurs) qui se comportent comme
de vraies personnes. L'outillage actuel est **éparpillé et confus** : un « cockpit » avec joystick, des boutons reset
dispersés dans les réglages, des resets SQL… Résultat : **il se perd** (« qu'est-ce que j'ai ouvert ? quel bot fait
quoi ? »). Il veut **tout repenser**, presque repartir de zéro.

## Ce qu'il veut vraiment (ses mots, remis au propre)
1. **Se mettre à la place d'un robot** : pouvoir « incarner » un bot pour voir l'app de SON point de vue.
2. **Des robots qui ne savent PAS tous la même chose** : caractéristiques différentes (genre, âge, intérêts, position,
   dispo, mode), pour tester de vrais cas — pas des clones.
3. **Crédibilité liée à SON état actuel** : les bots doivent être cohérents avec là où IL en est (sa position, son
   créneau), sinon les scénarios ne tiennent pas debout.
4. **Mettre tous les robots en ligne** avec des profils variés, en un geste, pour peupler l'app.
5. **Les robots créent des événements** auxquels les uns (et lui) peuvent s'inscrire → voir la **liste d'attente**, les
   **filtres**, le comportement de groupe.
6. **Vérifier que la Forteresse / le Cône agit bien** (exclusion, cooldown, faisabilité) avec ces bots.
7. **Des boutons SIMPLES** : « tout mettre en ligne », « 1 bot accepte », et surtout un **RESET TOTAL** quand il est
   perdu (remet bots ET vraies interactions à zéro).
8. **Simple devant, complet derrière** : un seul panneau clair, pas 6 endroits différents.

## Contraintes techniques
- App **Next.js export statique** (zéro serveur) + **Supabase** (Postgres, RLS, Realtime, RPC). Les bots sont de vraies
  lignes en base (profils + dispos + clutches + events), pilotées côté client par le fondateur.
- Tout doit se **déclencher exactement comme avec de vraies personnes** (sinon le test ne prouve rien).
- Avant l'App Store, **tout l'outillage de test doit pouvoir disparaître en 1 bloc** (un seul `if (isAdmin)`).

## Les questions à trancher
1. **Architecture de test** : quel est le bon modèle mental ? (un « panneau de contrôle » unique ? un mode « incarner un
   bot » ? des « scénarios » pré-faits en 1 clic ?) Donnez la structure d'écran concrète.
2. **Personas de bots** : combien, quels archétypes (ex. « femme 25 dispo ce soir 2 km », « homme 30 mode pro »,
   « organisateur d'event »…), et comment les garder cohérents avec l'état réel du fondateur (sa position/heure) ?
3. **« Incarner un bot »** : comment le faire proprement sans usine à gaz (switch de session ? vue dédiée ?) ?
4. **Boutons simples vs puissance** : quel jeu MINIMAL de boutons couvre 90 % des tests ? (mettre en ligne, accepter,
   créer event, s'inscrire, reset total). Que mettre derrière un « mode avancé » ?
5. **Reset total fiable** : que doit-il vraiment effacer (clutches, occupations, cooldown/clutch_pairs, events,
   inscriptions) pour repartir VRAIMENT propre, sans casser le compte réel ?
6. **Tester la Forteresse/Cône** : quels scénarios bots prouvent l'exclusion, le cooldown, la faisabilité (rayon↔heure) ?
7. **Le piège** que le fondateur sous-estime dans sa façon de tester.

## FORMAT DE SORTIE
1. **Le modèle d'outil de test recommandé** (1 écran, sa structure, ses zones) — décrit simplement.
2. **La liste des personas de bots** (tableau : nom, genre, âge, dispo, mode, rôle de test).
3. **Le jeu de boutons simples** (les 5-6 essentiels) + ce qui va en « avancé ».
4. **La spec du RESET TOTAL** (ce qu'il efface, dans quel ordre).
5. **3 scénarios de test clés en main** (étapes) dont un qui prouve le Cône.
6. Les **3 pièges**.
Concret, actionnable, pensé pour un fondateur NON-dev qui teste seul. Challengez-le s'il se complique la vie.

---

FIN DU BLOC ☝️
