# 🎯 ANALYSE DE CIBLE — qui vise-t-on au lancement ? (01.07.2026)

> David : « je n'en sais rien justement, il faut faire une analyse de qui on vise. » Voici l'analyse d'experts
> go-to-market : les segments réalistes à Lausanne, notés sur les 4 critères qui comptent pour une app de
> rencontre SPONTANÉE (densité + sécurité + pouvoir d'achat + viralité), avec une reco tranchée + le test terrain
> <30j pour la valider. Méthode maison : challenger, pas se rassurer.

---

## Le principe (à ne jamais perdre de vue)
Une app de rencontre spontanée a **deux besoins différents**, et **ce ne sont pas forcément les mêmes gens** :
- **Le CARBURANT de densité** (cold-start) : il faut des gens **nombreux, au même endroit, au même moment, souvent**.
- **Le REVENU** : il faut des gens qui **paient** (premium, events, VIP).
→ On peut **amorcer avec un segment** (densité) et **monétiser avec un autre** (revenu). C'est l'arbitrage clé.

## Les segments réalistes à Lausanne

| Segment | Taille (Lausanne) | Densité / dispo simultanée | Sécurité (♀) | Pouvoir d'achat | Viralité | Verdict |
|---|---|---|---|---|---|---|
| **Étudiants EPFL/UNIL (18-25)** | ~35 000 | ⭐⭐⭐⭐⭐ (concentrés campus + soirs) | ⭐⭐⭐ (campus = repères) | ⭐⭐ (faible) | ⭐⭐⭐⭐⭐ (bouche-à-oreille fulgurant) | **CARBURANT n°1** |
| **Jeunes actifs (25-32)** | important, dispersé | ⭐⭐⭐ (dispersés, time-poor) | ⭐⭐⭐ | ⭐⭐⭐⭐ (paient) | ⭐⭐ | **REVENU** |
| **Nouveaux arrivants / expats** | élevé (EPFL/recherche, corporates) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ (paient) | ⭐⭐⭐ | **PÉPITE douleur (besoin EN)** |
| **Célibataires 30+** | moyen | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Plus tard (revenu, pas densité) |

## Les 3 insights qui tranchent
1. **Les étudiants sont le CARBURANT, pas le portefeuille.** 35 000 personnes denses + virales = la seule manière
   réaliste d'atteindre le seuil « ~150-200 dispo un soir » sans brûler du cash. Mais faible pouvoir d'achat → ne
   comptez PAS sur eux pour le revenu au début (cohérent avec le prix premium à challenger).
2. **Les expats/nouveaux arrivants = la pépite de DOULEUR.** Quelqu'un qui débarque à Lausanne sans réseau a un
   **besoin aigu** de rencontrer des gens, **paie** volontiers, et est **moins sensible au vide social** (il n'a rien
   d'autre). MAIS il faut l'**anglais** (i18n) → ça rejoint le chantier i18n. Segment à activer en Phase 2.
3. **Le revenu vient des jeunes actifs + expats + 30+**, qu'on touche **une fois la densité créée par les étudiants**.

## ✅ RECO TRANCHÉE
- **Beachhead = étudiants EPFL/UNIL** pour amorcer la densité (carburant cold-start). C'est là qu'on lance la
  soirée chorégraphiée + les events récurrents.
- **Monétisation = jeunes actifs + expats** (et 30+ plus tard), qu'on attire dès que la ville « vit ».
- **Donc** : on ne choisit pas « densité OU revenu », on **séquence** : densité (étudiants) → puis greffer le revenu.
- ⚠️ **Challenge** : si on s'aperçoit que les étudiants **ne reviennent pas** (rétention M1 faible) OU **ne vont pas
  aux vrais RDV** (tout le risque d'une cible « fun mais pas sérieuse »), alors **pivoter vers jeunes actifs + expats**
  comme cible primaire — quitte à une densité plus lente. À surveiller dès le 1er test.

## 🧪 LE TEST TERRAIN <30 JOURS (pour valider QUI on vise)
- Soirée chorégraphiée (Clutch Test v1) sur **un campus** → mesurer : combien ouvrent une dispo, combien envoient un
  Clutch, **combien vont au vrai RDV**, et **combien reviennent la semaine d'après** (rétention M1 brute).
- En parallèle, **5-10 interviews** : étudiants vs jeunes actifs vs un expat → qui a le plus mal au quotidien, qui
  paierait, qui se sent en sécurité. → ça tranche la cible primaire avec des vrais gens, pas une intuition.

---

## 💳 MODÈLE DE PRIX — direction David (01.07)
David : **plusieurs abonnements** — vraisemblablement **2 abos** (entrée + intermédiaire) **+ 1 palier VIP cher**
(« le fameux ») chargé de **fonctionnalités VIP**. → modèle **multi-paliers**, pas un prix unique.
- **RESTE à définir** : le prix de chaque palier (cf. test 9.90/14.90/19.90 pour l'entrée) + **quelles features**
  dans le VIP.
- ⚠️ **GARDE-FOU (règle CLAUDE.md)** : auditer l'impact **équilibre hommes/femmes** de chaque feature VIP **avant**
  de la coder. Le VIP doit vendre du **confort / de la portée / du contrôle**, **jamais** du pay-to-play qui permet
  de **forcer l'attention** d'une femme (sinon dark pattern + fuite des femmes = mort de l'app). Le VIP ne doit pas
  rendre Clutch « plus confortable depuis le canapé » (la friction vers le vrai RDV est un feature).
- → Session dédiée « design des paliers » avec Mel, après le 1er test (le test dira ce que les gens valorisent).
