# 📖 CODEX — L'HISTOIRE DE CLUTCH (récit d'historien, append-only)

> Le récit daté de la construction de Clutch, brique par brique. **On n'efface jamais ; on ajoute.**
> Mis à jour sur le mot-déclencheur **« Codex »**. Version navigable : page `/codex`. Source brute : `~/.claude` mémoire + git.

---

## Chapitre I — La nuit de la Forteresse (25–26 juin 2026)

### Le problème qui terrifiait
Tout commence par une angoisse de David, dictée à voix haute : *« Si je verrouille un Clutch et qu'une autre personne m'en envoie un au même moment, qu'est-ce qui se passe ? Il y a une infinité de possibilités, ça devient pénible. Tout seul je n'y arriverai pas. »* Derrière les mots, un problème d'ingénierie réel : une app de rencontre où chacun envoie et reçoit des invitations qui se chevauchent dans le temps fait **exploser le nombre de cas**. Les coder un par un = la garantie d'en oublier.

### La révélation « Coq »
David évoque **Coq** (un prouveur de théorèmes, suggéré par son ami Dom) : formaliser les états et *prouver* qu'un état impossible n'arrive jamais. Coq lui-même = trop lourd pour une équipe de un. La traduction « start-up » retenue : **machine à états + invariants + fuzzer** (un robot qui cherche les failles à notre place).

### Le pivot conceptuel
On arrête de raisonner en « Clutchs » pour raisonner en **engagements temporels**. Un Clutch verrouillé et un événement accepté occupent tous deux un créneau → **même moteur**. L'infini s'effondre en une table et une contrainte.

### Le challenge GPT (panel de 3 experts)
GPT apporte la pièce maîtresse : faire de l'occupation du temps un **objet de premier rang dans Postgres**, avec une contrainte `EXCLUDE USING gist` qui rend le chevauchement **impossible par construction** — la base tranche, pas le JS (contournable). On adopte ; Claude concède que c'était meilleur que son idée de réconciliation en JS.

### Le fuzzer prouve sa valeur — deux fois
D'abord : **800 000 actions aléatoires → 0 faille.** Puis, en ajoutant le « buffer de 1h avant le RDV », il attrape **un vrai bug** qu'on s'apprêtait à livrer (la garde au verrouillage regardait la plage brute, pas la plage occupée bufferisée → un event pouvait chevaucher). Corrigé à la racine via `clutchOccRange()`, source unique. *Le robot pense pour nous.*

### Une erreur, une leçon
Claude invente « 1h » comme durée de RDV au lieu de vérifier le code. David rattrape : `is_quick_date ? 60 : null` → Quick = 1h donc normal = **2h**. Leçon gravée : *une décision déléguée exige PLUS de vérification, pas moins ; grep la vraie valeur avant de trancher un défaut.*

### Ce qui est sorti de cette nuit
Moteur pur testé · 2 migrations en prod (clutchs + events) · conflits gérés en douceur · invitations « en pause » qui revivent seules · le **Codex** (cette doc) né du besoin de *« raconter l'histoire de Clutch comme un roman, sans perdre une miette »*.

---

## Chapitre II — Le banc d'essai & la taxonomie (26 juin 2026)

### Rendre l'app testable
David ne peut pas tester sans données. On bâtit : un **switch Démo/Réel**, des **boutons « tout mettre en ligne / remplir ma boîte »**, et — plus tard — des **events bots avec un vrai horaire** pour que le gate soit enfin testable.

### La grande question : events vs disponibilité
David challenge : *« ça n'a pas de sens de s'inscrire à un event hors de sa dispo. »* Long débat (lui ↔ Claude ↔ GPT). **Révélation** : « event » désigne deux choses opposées — **spontané** (une présence, dans les 18h, lié à la dispo) vs **planifié** (un partenaire annonce jusqu'à 7j avant, libre de dispo). L'axe n'est pas le type de compte, c'est `spontaneous | planned`. Et les **2 horizons** se séparent : déclaration des créneaux vs fenêtre spontanée.

### Multi-créneaux
On peut poser **3 créneaux** (Lausanne, Genève, Sion), dans les 18h glissantes, re-déclarés au fil de l'eau. David résout lui-même l'apparent conflit : *« j'ouvre le créneau Sion ce soir à 18h, et le tour est joué. »*

---

## Chapitre III — Le gardien & la bienveillance (26 juin 2026)

### Le cooldown anti-harcèlement
Challenge GPT. **Révélation** : pas de doublement infini ni de blocage auto définitif. Des **paliers humains** (48h · 7j · 30j · 180j), une **dé-priorisation** (jamais un mur), et le **blocage total = décision de l'utilisateur**, réversible. Anti-sonde absolu : la personne refusée ne le sait jamais.

### Le gardien unique
Tout l'envoi passe désormais par une seule fonction Postgres `create_clutch()` qui vérifie : soi-même, blocage (2 sens), cooldown, doublon. **Elle fusionne le cooldown avec la forteresse** — un seul gardien.

### La forteresse bienveillante
Challenge GPT. **Révélation** : on n'aide pas « les impopulaires » (métrique toxique) mais les **sous-exposés** (peu vus malgré activité). Le boost reste dans le pool compatible (une femme n'est jamais un quota pour un homme). La meilleure aide n'est pas algorithmique : c'est **orienter doucement vers les événements de groupe**. Dignité absolue : personne ne doit pouvoir déduire qu'il est « aidé ».

---

*(Suite au prochain « Codex ».)*
