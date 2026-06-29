# 🌳 Molettes & 4 moments — arbre de décision (David 30.06, build 229)

## Constantes
- Plancher absolu : **maintenant + 15 min** (rayon 1 km).
- Défaut à l'ouverture : **maintenant + 1h**, rayon **3 km**.
- Fin max : **maintenant + 18h** (dur).
- 4 moments : **Matin [6–12] · Après-midi [12–18] · Soir [18–24] · Nuit [0–6]**.

## Règle unique (bouton moment)
- `début = max(maintenant + 1h, début du moment)`
- `fin = min(fin du moment, maintenant + 18h)`
- Le bouton **n'apparaît que s'il reste ≥ 30 min** entre début et fin (sinon il disparaît).
- Implémenté via `dayParts(now, 18, 30, 60)` dans `lib/feasibility.ts` (param `leadMin=60`).

## Vérifié (sorties réelles)
| Il est | Moments proposés |
|---|---|
| 10h | ce matin [11–12] · aprèm [12–18] · soir [18–00] · nuit [00–04] |
| 11h | ~~matin~~ · aprèm [12–18] · soir · nuit |
| 17h | ~~aprèm~~ · soir [18–00] · nuit · demain matin [06–11] |
| 20h | soir [21–00] · nuit · demain matin · demain aprèm [12–14] |
| 23h | ~~soir~~ · nuit [00–06] · demain matin · demain aprèm [12–17] |

## Molettes — fix du « monstre bug »
Quand on bouge le **début**, la **fin suit** en gardant la **durée** de la fenêtre (gère le passage de minuit,
bornée 30 min … 18h). → le début bouge librement, la fin n'est jamais bloquée. Pour changer la durée :
molette de **fin** (ses options démarrent toujours après le début, donc fin > début par construction).
