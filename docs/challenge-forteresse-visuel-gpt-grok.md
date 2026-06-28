# 🎨 CHALLENGE DESIGN — Intégrer la Forteresse VISUELLEMENT sur le curseur (sans texte) · 28.06.2026

> Auto-suffisant. Question PUREMENT design/UX. On veut que l'utilisateur SENTE, rien qu'au visuel, qu'il pousse une
> config peu crédible — **sans gros message texte « trop loin »**. À coller dans GPT puis Grok.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 designers (interaction · motion · accessibilité), sans complaisance, qui proposent puis tranchent.

## Contexte
App de rencontre spontanée. Sur l'écran « ouvrir une dispo », l'utilisateur règle un **rayon** avec un **curseur
horizontal** (slider, de 1 km à 50 km). Derrière, un moteur interne (« la Forteresse ») calcule si la config est
physiquement **crédible** (pourra-t-il être au point de RDV à temps depuis sa position, selon le rayon et l'heure). Plus
le rayon est grand pour l'heure choisie, **plus la config devient peu crédible** → on a une « tension » continue de 0
(large, sûr) à 10 (impossible).

## Ce qu'on veut
On NE veut **PAS** de gros texte d'alerte (« trop loin pour cette heure »). On veut que l'utilisateur **sente
visuellement**, rien qu'en bougeant le curseur, qu'il s'approche de la limite — et qu'il s'auto-régule sans qu'on le lui
explique. Idée du fondateur : **toute la course du fader rougit progressivement** + une **résistance** ressentie quand on
pousse trop loin.

## Les questions
1. **Couleur** : quelle est la meilleure façon d'utiliser la couleur du fader (et/ou de toute la track) pour signaler la
   tension 0→10, de façon CONTINUE et lisible ? (track qui passe vert→ambre→rouge ? le thumb qui rougit ? un dégradé sur
   la portion « au-delà du crédible » ? un point de bascule visible ?). Donne la meilleure direction + 1-2 alternatives.
2. **Résistance / feedback haptique** : comment rendre la « résistance » sensible (le curseur qui freine, accroche,
   vibre légèrement aux seuils) sans frustrer ni donner l'impression d'un bug ?
3. **Anti-texte** : si on s'autorise UN micro-signal non-textuel (une icône, un pictogramme, un micro-mouvement),
   lequel marche le mieux sans alourdir ?
4. **Accessibilité** : la couleur seule ne suffit pas (daltonisme) — quel signal redondant minimal (forme, position,
   intensité) ?
5. **Le piège** : qu'est-ce qui rendrait ce signal visuel agaçant ou anxiogène plutôt qu'aidant ? Comment l'éviter
   (rester encourageant, jamais punitif) ?

## FORMAT
1. La direction visuelle RECOMMANDÉE (décrite précisément : couleurs, où, comment ça évolue) + 1-2 alternatives.
2. Le modèle de résistance/haptique.
3. Le garde-fou accessibilité.
4. Le piège à éviter.
Concret, implémentable en CSS/JS (slider custom). Pas de blabla.

---

FIN DU BLOC ☝️
