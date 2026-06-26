# 📍 PROMPT GPT — « J'y suis : robustesse du check-in + Plan B sans GPS » (à coller à GPT)

> Le check-in est une brique critique (preuve de présence, déblocage du « Terminer », score de fiabilité). Le GPS
> peut FAILLIR (intérieur, immeuble, mauvais signal) — le fondateur l'a vécu en test réel. Trouvez le bon Plan B.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (designer produit anti-friction · spécialiste sécurité/anti-fraude · ingénieur mobile/géoloc),
sans complaisance, divergent puis convergent.

## Contexte — « Clutch »
App de rencontre spontanée EN PERSONNE. Deux personnes ont un RDV confirmé (« Verrou »). À l'arrivée, chacune
appuie sur **« J'y suis »**. Aujourd'hui : on confirme via **GPS** (≤100 m du lieu). Le check-in sert à :
1) **débloquer le bouton « Terminer »** le RDV,
2) **compter le RDV réussi** (+ score de fiabilité, anti-lapin),
3) **prouver la présence** (anti-triche : ne pas valider depuis chez soi).
Contrainte forte : on n'expose JAMAIS la position/distance à l'autre (anti-triangularisation). Le calcul de distance
reste local au téléphone.

## Le problème (vécu en test)
Au 1er test, GPS OK, check-in validé. Au 2e, **les deux** personnes, au MÊME endroit, **n'ont pas de signal GPS**
(intérieur / réception faible) → `distance = inconnue` → **impossible de dire « j'y suis »** → tout le flow est bloqué.
Le fondateur veut un **Plan B** : on ne doit JAMAIS rester coincé parce que le GPS ne capte pas.

## Pistes à évaluer (et challenger)
- **Confirmation mutuelle** : si les DEUX appuient « j'y suis » dans une courte fenêtre, ça compte (ils se vouchent),
  même sans GPS. (Risque : 2 complices qui mentent — mais quel intérêt ? + le feedback post-RDV punit le mensonge.)
- **Délai de grâce** : après X secondes sans accroche GPS, autoriser une **confirmation manuelle** (marquée « non
  vérifiée GPS » → pèse moins dans la fiabilité, mais débloque le flow).
- **Code de proximité** : une personne montre un **code court** (4 chiffres / QR) que l'autre saisit → prouve qu'ils
  sont physiquement ensemble (marche en intérieur, sans GPS). (Friction ? acceptable ?)
- **Bluetooth/UWB de proximité** (les 2 tels se « voient ») — Phase 2 ? trop lourd ?
- **Découpler** : « Terminer » ne devrait peut-être PAS dépendre d'un check-in GPS dur. Le GPS = bonus de confiance,
  pas un mur (cohérent avec la philosophie « gradient, jamais bloquer »).

## Les questions à trancher
1. **Quel est le bon défaut** quand le GPS ne capte pas ? (manuel après délai · mutuel · code · combinaison)
2. **Niveaux de confiance** : comment distinguer un check-in « GPS-vérifié » d'un « auto-déclaré » dans le score de
   fiabilité, SANS punir injustement quelqu'un dont le tél a un mauvais GPS ?
3. **Anti-fraude** : quel est le risque réel d'un faux « j'y suis » et quelle est la parade la moins frictionnelle
   (le feedback mutuel post-RDV suffit-il ?) ?
4. **Le « code de proximité »** : bonne idée robuste ou friction de trop pour un 1er RDV ?
5. **Vie privée** : tout ça reste-t-il sans exposer la position de l'un à l'autre ?
6. Le **piège** que le fondateur sous-estime.

## FORMAT DE SORTIE
1. **Le modèle de check-in recommandé** (étapes + Plan B), décrit simplement.
2. **Hiérarchie des preuves** (GPS > code > mutuel > manuel) et impact sur la fiabilité.
3. **Verdict « le GPS doit-il bloquer ? »** (mur vs bonus).
4. **Garde anti-fraude** minimale et anti-friction.
5. Les **3 pièges**.
Concret, chiffré (délais en secondes, rayons en mètres). Challengez le fondateur s'il a tort.

---

FIN DU BLOC ☝️
