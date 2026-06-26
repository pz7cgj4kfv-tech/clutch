# 🧩 PROMPT GPT — « Créneaux × Modes × Mood : qui porte quoi ? » (à coller à GPT)

> Le fondateur sent une confusion d'architecture. 3 notions se chevauchent : le CRÉNEAU (où/quand je suis ouvert),
> ce que je CHERCHE (romance/amical/pro/parent), et le MOOD (humeur). Tranchez proprement. Rigoureux, concret.

COLLE À PARTIR D'ICI 👇

---

Panel de 3 experts (architecte produit/données · designer UX mobile · spécialiste matching), sans complaisance,
divergent puis convergent.

## Contexte — « Clutch »
App de rencontre spontanée EN PERSONNE (Lausanne), fenêtre 18h. On peut avoir **jusqu'à 3 CRÉNEAUX de
disponibilité simultanés** (ils PEUVENT se chevaucher) = chacun {heure début–fin, lieu, rayon}. Ex : Morges 18h-19h,
Sion 18h30-19h10. Un créneau = « je suis OUVERT à des rencontres ici, à cette heure ». Seul un RDV confirmé occupe
l'agenda (forteresse).

En PLUS, il existe deux notions GLOBALES sur le profil :
- **« Ce que je cherche en ce moment »** : romance / amical / pro / parent (modes de rencontre).
- **« Mood »** (humeur du moment, ex : apéro, café tranquille, dîner…).

## Le trou relevé par le fondateur
1. **Les modes (romance/amical/pro) sont aujourd'hui GLOBAUX** (un seul réglage pour tout). Le fondateur veut
   peut-être qu'ils soient **PAR CRÉNEAU** : « Morges 18h = pro », « Sion soir = romance ». Question : par créneau ou global ?
2. **Confusion « je mets romance puis un café tranquille, ça ne joue pas »** : le MODE (romance) et le MOOD (café) ne
   sont pas alignés. Comment articuler mode (sérieux, durable) et mood (éphémère, l'activité du moment) ?
3. **Effet de bord à l'enregistrement** : quand on choisit « ce que je cherche » / un mood et qu'on revient en arrière,
   le fondateur se demande si ça **écrase tous les créneaux** ou **en crée/modifie un seul**. Sa proposition : si 0 créneau
   → crée le 1er ; si on en a déjà, **modifie/écrase le plus ancien** ; et **mettre en évidence** quel créneau porte ce
   réglage. Il manque aussi un **bouton ENREGISTRER explicite**.
4. Les **boutons moment de la journée** (matin/aprem/soir/nuit) : quand on choisit « nuit », faut-il **limiter à
   ~3 possibilités** (ex : « marché de nuit ») ou laisser tout ouvrir ?

## Les questions à trancher
1. **Modèle de données** : le mode (romance/amical/pro) et le mood vivent-ils SUR LE CRÉNEAU (par créneau) ou sur le
   PROFIL (global) ? Si par créneau, comment éviter que ça devienne une usine à gaz (3 créneaux × modes × mood) ?
2. **Hiérarchie claire** : créneau = OÙ/QUAND. Mode = AVEC QUI (type de lien). Mood = POUR FAIRE QUOI. Est-ce le bon
   découpage ? Lequel filtre le matching, lequel est juste décoratif/contextuel ?
3. **UX d'édition** : un bouton ENREGISTRER, et quoi écraser quand on règle un mode/mood sans choisir de créneau ?
   La règle « 0→crée, sinon modifie le plus ancien » est-elle bonne, ou faut-il TOUJOURS demander à quel créneau ça
   s'applique ?
4. **Cold-start / simplicité** : au lancement, le minimum vital. Qu'est-ce qu'on COUPE pour ne pas noyer l'utilisateur ?
5. Le **piège** que le fondateur sous-estime.

## FORMAT DE SORTIE
1. **Schéma de données recommandé** (ce qui est par-créneau vs global), justifié.
2. **Hiérarchie créneau / mode / mood** (qui filtre, qui décore).
3. **Règle d'édition + enregistrement** (quoi écraser, bouton, mise en évidence).
4. **Ce qu'on COUPE pour la V1**.
5. Les **3 pièges**.
Concret, schématisé, hiérarchisé. Challenge le fondateur quand il complexifie.

---

FIN DU BLOC ☝️
