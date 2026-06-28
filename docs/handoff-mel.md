# 🎨 Handoff design Mel → code — le process (28.06.2026)

> Page côté Mel (à lui partager) : **pz7cgj4kfv-tech.github.io/mel**
> Ce doc = le process côté David + Claude. Objectif : que ça marche du premier coup, sans GPT qui « redessine ».

## Le principe
- **Mel** dessine sur Illustrator + **exporte** (SVG + PNG). Aucune IA de son côté, **aucun abonnement nécessaire**.
- **David** transmet les fichiers à Claude (les dépose / copie-colle).
- **Claude** reconstruit l'écran **au pixel** dans le vrai code, montre le rendu réel, ajuste selon les retours.

GPT n'intervient **plus** dans la conversion (c'était la cause des bugs : son moteur d'image regénère la mise en page → tout bouge). Au mieux, Mel le garde pour brainstormer des idées.

## Ce que Mel exporte
| Type | Format | Détail |
|------|--------|--------|
| Icône · bouton · petit graphisme | **SVG** | 1 fichier/élément, nom clair. Même nom = remplace l'existant. |
| Écran complet (mise en page) | **PNG** 2× ou 3× | plan de travail iPhone ~390×844. C'est la cible visuelle. |
| (optionnel) éléments de l'écran | **SVG** | pour les poser pile (photo-cadre, icônes…) |
| (optionnel) valeurs précises | texte | hex, police, espacements si elle les a ; sinon Claude mesure sur le PNG. |

## Côté David — quoi faire en recevant les fichiers
1. **Les SVG** → les déposer dans `public/icons/mel/` (la convention actuelle ; déjà ~30 icônes Mel là).
   - Si ça remplace un existant → **même nom de fichier** (échange direct, git garde l'ancien).
2. **Le PNG de l'écran** → me le montrer (capture / fichier) en disant quel écran c'est.
3. Me dire en une phrase : « nouvel écran X » ou « remplace le bouton Y ».

## Côté Claude — l'intégration
- SVG → posé tel quel (`<img src="/icons/mel/...">` ou inline), pixel-perfect.
- Écran → composant React reconstruit à partir du PNG (positions absolues = « rien ne bouge »), avec les vraies données, vérifié sur l'app qui tourne (preview/screenshot).
- N'ajuster QUE ce que Mel demande à chaque tour. Itérer jusqu'au « parfait ».

## Filet de sécurité
- Tout est versionné dans git → un design qui casse, on remet l'ancien en 10 s.
- Mel n'a aucun numéro de version à gérer : elle envoie, c'est archivé.

## Limite connue (assumée)
- Pas d'auto-preview live pour Mel (elle passe par David/Claude pour voir le rendu). Si ce confort devient nécessaire → **Figma** (handoff dev natif + preview), plus tard. Pas un bloquant aujourd'hui.
