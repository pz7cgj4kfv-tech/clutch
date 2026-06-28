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
| Écran complet (mise en page) | **SVG à calques nommés** ⭐ | plan iPhone ~390×844. Export avec « ID des objets → Noms des calques ». Chaque calque = `carte_presence`, `photo_profil`, `prenom`, `age`… → positions + identités exactes. |
| Écran : cross-check visuel | **PNG** 2×/3× | pour vérifier d'un coup d'œil + rattraper si l'export SVG déforme. |
| (optionnel) source | **.ai** | backup ; Claude ne lit pas l'.ai directement, il bosse sur le SVG. |
| Textes dynamiques (prénom, âge, score) | — | **laissés en texte** dans le SVG (pas vectorisés) → Claude voit que c'est un champ. |

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
