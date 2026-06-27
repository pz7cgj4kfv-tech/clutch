# 🌍 Guide i18n de Clutch — état, standard, et comment ajouter une langue

> Écrit le 28.06 (session i18n). But : « canaliser » le langage dans l'app pour qu'ajouter une langue
> (allemand, italien, espagnol…) soit **trivial** plus tard. Source de vérité : ce fichier.

## 1. L'état réel (mesuré par les scripts)

Dans `app/app2/page.tsx` (le cœur, 13 400 lignes), le texte vit sous **3 formes** :

| Forme | Exemple | Multi-langue ? | Compte |
|---|---|---|---|
| ✅ **`t('clé')`** (le bon) | `t('page1.cta')` | OUI, illimité (dico TR) | ~41 usages · **218 clés fr/en** |
| 🟠 **Ternaire** | `isFr ? 'Salut' : 'Hi'` · `EN ? 'Hi' : 'Salut'` | OUI mais **2 langues max** | ~227 |
| ❌ **Codé en dur FR** | `'Compte supprimé'` | NON (FR seulement) | ~300-450 user-facing (sur 671 bruts, hors noms propres / admin / données) |

→ **Parité du dico TR : parfaite** (218 clés en fr ET en, 0 trou — vérifié par `scripts/i18n-audit.mts`).
→ Le vrai chantier = **les ternaires (bloquent une 3ᵉ langue) + le codé-en-dur FR**.

**Outils (lance-les avant/après chaque lot) :**
- `node scripts/i18n-audit.mts` → parité fr/en du dico (doit rester ✅).
- `node scripts/i18n-hardcoded.mts` → liste le codé-en-dur FR (le backlog), distingue ce qui est déjà bilingue.

## 2. Le STANDARD (à partir de maintenant — règle dure)

- **Tout nouveau texte user-facing passe par `t('clé')`**, jamais un ternaire `isFr`, jamais du FR brut.
- À chaque nouvelle clé : l'ajouter dans **TR.fr ET TR.en** en même temps (sinon fallback = incohérence).
- Convention de clés : `zone.sousZone.element` (ex. `page2.cta`, `clutch.sent.ok`).
- Le hook : `const t = useT(lang)` en haut du composant, puis `t('clé')`. Si `lang` n'est pas dispo dans le
  composant → le faire passer en prop (c'est ce petit travail de plomberie qui reste à faire partout).
- **Noms propres** (Genève, Évian, CLUTCH…), **emojis**, **nombres** : pas de traduction.

## 3. Comment AJOUTER une langue (ex. allemand 🇩🇪) — la marche à suivre

Une fois le chantier ci-dessous avancé, ajouter une langue = **3 endroits** :

1. **Le type** : `type Lang = 'fr' | 'en' | 'de'` (app2/page.tsx ~ligne 239).
2. **Le dictionnaire** : ajouter un bloc `de: { … }` dans `TR` avec **toutes les clés** traduites
   (copier le bloc `en`, traduire). Le fallback `TR[lang][k] ?? TR['fr'][k]` évite tout crash si une clé manque.
3. **Le sélecteur** : aujourd'hui c'est un toggle fr↔en (clé `profile.lang`). Le remplacer par une petite
   liste (un bouton par langue) — idéalement piloté par un registre :
   ```ts
   const LANGS = [
     { code:'fr', label:'Français', flag:'🇫🇷' },
     { code:'en', label:'English',  flag:'🇬🇧' },
     { code:'de', label:'Deutsch',  flag:'🇩🇪' },
   ] as const
   ```
   → le sélecteur `.map(LANGS)`, et `setLang(code)`. Un seul endroit à éditer pour la prochaine langue.

⚠️ **Tant que les ~227 ternaires `isFr` ne sont pas convertis en `t()`, une 3ᵉ langue affichera du FR/EN
mélangé à ces endroits.** D'où l'ordre du chantier ci-dessous.

## 4. Le plan de migration (phasé, par ordre de valeur)

Migrer = remplacer ternaire/FR-brut par `t('clé')` + ajouter la clé en fr/en. Le FR reste IDENTIQUE
(zéro régression visible côté FR) — on ne fait qu'ouvrir la porte aux autres langues.

1. **Flows user critiques d'abord** : onboarding, dispo (« ouvrir ma fenêtre »), envoi/réception de Clutch,
   Verrou/RDV, feedback post-RDV, événements (inscription/waitlist). C'est là que les vrais users lisent.
2. **Profil & réglages** : déjà beaucoup en ternaire → conversion mécanique.
3. **Sécurité/SOS, légal** : sensibles, à traduire avec soin.
4. **En DERNIER** : outils admin/test (Test Lab, cockpit) — invisibles des users, faible priorité.
5. **Jamais** : noms propres, données de villes, emojis.

**Méthode sûre par lot** : 1 composant à la fois → ajouter ses clés (fr+en) → remplacer → `npx tsc --noEmit`
(le `t` mal placé est attrapé par TS) → relancer les 2 scripts → commit. Le FR ne bouge pas, donc testable sans risque.

## 5. Pourquoi pas tout d'un coup
~300-450 strings à migrer, beaucoup dans des composants sans `lang` en portée (plomberie à faire). C'est un
travail de **plusieurs sessions**, à faire par lots testables — pas un sprint aveugle. Les outils ci-dessus
transforment ça en backlog mesurable : on voit le compteur descendre à chaque lot.
