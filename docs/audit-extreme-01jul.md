# 🔬 AUDIT EXTRÊME — Clutch, état au 01.07.2026

> Demande David : « où on en est par rapport à tout ce qu'on a voulu faire, qu'est-ce qui est bien, pas bien,
> qui manque, et qu'est-ce qui manque pour être pleinement testable avec les amis. » + prêt à challenger avec GPT/Grok.
> Règle maison : challenger, pas complaire. bien=bien, moyen=moyen, pas bien=pas bien.

---

## 1. OÙ ON EN EST (verdict en 3 lignes)
- **Le cerveau logique est solide et prouvé** (forteresse Graal 1+2, le COQ, evaluateSchedule, Clutch City 14 415→0 trous). C'est la partie la plus dure et elle est faite.
- **Le produit est jouable de bout en bout** (dispo → présences → clutch → verrou → RDV → feedback → events) sur TestFlight (build 236).
- **MAIS** : ce n'est pas encore « beau-fini » (graphisme en cours), l'i18n est à moitié, et surtout **le test grandeur réelle avec des amis se heurte au problème de la ville vide** (le vrai enjeu, cf §5).

## 2. CE QUI EST SOLIDE ✅
- **Forteresse / Cône / COQ** : le différenciateur technique. Exclusion dure (DB), causalité (D≤portée), enchaînement multi-engagements (alerte envoi+accept), prouvé par fuzzer + Clutch City. Personne d'autre n'a ça.
- **Flow Clutch complet** : envoi (RPC gardé : cooldown 48h, anti-doublon, blocage, inbox) → accept/refuse/contre → Verrou → J'y suis (GPS) → Terminer → feedback 3 issues + ⭐ favori.
- **Multi-créneaux** (1-3, lieux différents, couleurs 1/2/3), moments intelligents (arbre de décision +18h), molettes (fin suit le début).
- **Events** : création (places min/max impairs, description guidée, dates, prix, âge), liste, carte 🗺️ par créneau, badge 📅, flag « trop loin pour l'heure », générateur de test.
- **Sécurité de base** : SOS, blocage 2 sens, signalement, cooldown, RLS serveur, radar = TEMPS jamais distance GPS (anti-triangulation).
- **Outils de test internes** : Clutch City, Test Lab (bots), /codex, /forteresse-lab.

## 3. CE QUI EST FRAGILE / INCOMPLET 🟧
- **Graphisme** : pas fini (David le sait — cette semaine). Carte présence Mel intégrée, mais cohérence visuelle globale à finir.
- **i18n** : ~moitié. ~640 strings encore FR-only (gros volume = admin/Test Lab). Bloque un lancement EN propre. Chantier multi-sessions (outil + guide existent).
- **Page profil** : David la dit « pas finie ». Les filtres (genre recherché, mode de rencontre, mode réception ♀, distance, âge) SONT implémentés (PageSeeking) — donc le manque est surtout **finition visuelle + clarté**, pas la logique.
- **Post-RDV / favoris** : feedback + ⭐ faits ; « Favoris = gens + events + tout » pas encore unifié.
- **app2 = ~13 800 lignes** dans un seul fichier → dette technique (maintenance lourde, risque de régression). Refactor à prévoir (avec David, testé).
- **Supabase** : à passer en Pro avant le 24.07 (quota) — débloque aussi le boost sous-exposés.

## 4. CE QUI MANQUE (par rapport à la vision)
- **Le chat dans l'event** (discuter avant) — manque.
- **Mes events en avant** dans Clutchs → Prochain RDV + alerte « ton event arrive » + GPS 30min avant.
- **Tri events « fiabilité »** · **paliers de places** (tournoi : 5-8 actives que si pleines).
- **Page event** : icône de Mel (vs emoji) · dates « intelligentes » (dayParts) dans le formulaire.
- **Premium / business** : tiers définis mais flow d'abonnement pas branché. Waitlist clutchs/events + alerte premium « place libérée ».
- **Onboarding / didactique** : l'app est dense ; un premier-lancement guidé manque pour des amis non-initiés.

## 5. 🎯 LE VRAI ENJEU : « testable avec les amis » — la ville vide
> C'est LE point. Une app de rencontre spontanée avec 5 personnes en ligne = **morte** (personne à clutcher, carte vide → l'ami teste 2 min et part). Ce n'est pas un manque de features, c'est un problème de **masse critique / cold-start**.

**Clutch City (simulé) ≠ test réel.** Il prouve la logique, pas l'expérience humaine. On NE peut PAS « lâcher 1000 vrais profils » — ce sont des bots, ils n'iront jamais à un vrai RDV.

**Ce qu'il faut vraiment pour tester avec des amis (recommandation) :**
1. **Un noyau de vrais amis** (10-30) sur une **fenêtre + lieu concentrés** (ex : « jeudi soir, centre Lausanne ») → densité ressentie, pas 30 personnes diluées sur 18h × 50 km.
2. **Une couche « ambiance » optionnelle et HONNÊTE** : des bots qui se mettent en ligne/hors-ligne sur des horaires réalistes pour que la carte ne soit pas vide — **mais clairement étiquetés** (badge « démo ») et **non-clutchables**, sinon dark pattern + risque sécurité (un faux profil qui trompe). Jamais de faux humains crédibles non signalés.
3. **Un mode « événement de lancement »** : 1 vrai event (apéro test) que tout le monde rejoint → tout le monde est co-présent → on teste clutchs/events en conditions réelles.

→ **La question à se poser n'est pas « comment simuler 1000 personnes » mais « comment rendre 20 vraies personnes denses et l'app vivante ».**

## 6. AUDIT 7 ANGLES
| Angle | Verdict |
|---|---|
| **Légal** (LPD) | GPS = zone choisie, pas live ; suppression compte ✅ ; CGU ✅. ⚠️ Si ambient-bots : devoir de transparence (pas de faux profils trompeurs). |
| **Éthique** | Radar=temps (anti-triangulation) ✅ · jamais bloquer dur (gradient) ✅. ⚠️ ville-vide ne doit pas pousser à des dark patterns pour « remplir ». |
| **Faisabilité** | Cœur logique fait. Reste = finition + cold-start (pas technique, stratégique). |
| **Scalabilité** | Algo + thermostat densité prêts ; forteresse prouvée à 700 agents. Supabase Pro à brancher. |
| **Ergonomie** | Flow solide mais DENSE → onboarding manquant pour non-initiés. |
| **Business** | Premium défini, pas branché. Modèle freemium cohérent. |
| **Challenger** | Le plus gros risque ≠ technique : c'est **la masse critique au lancement** (cf Thursday, WhatsApp). |

## 7. CE QU'IL FAUT POUR « PLEINEMENT TESTABLE AVEC LES AMIS » (checklist)
- [ ] **Densité** : mode « event de lancement » OU couche ambiance honnête (étiquetée, non-clutchable).
- [ ] **Onboarding** 60s (qui non-initié comprend dispo → clutch → RDV).
- [ ] **Graphisme** cohérent (en cours).
- [ ] **i18n** au moins des écrans du flow principal (events/présences/dispo/profil) — pas tout.
- [ ] **Page profil** finie visuellement.
- [ ] **Push notifs** fiables (un clutch reçu doit sonner même app fermée).
- [ ] **Anti-bug** : 2-3 passes de test à 2 téléphones sur le happy path + edge cases.

---

## 8. 🥊 PROMPT DE CHALLENGE EXTERNE (à coller à GPT-5 / Grok / Claude externe)
> Auto-suffisant. Panel de 3 experts qui se contredisent. Format de sortie imposé. Puis : challenger LEUR réponse (garder le vrai, virer le bluff), ranger dans le Codex.

```
Tu es un panel de 3 experts qui doivent se CONTREDIRE et trancher, pas se faire plaisir :
 (1) un CTO d'app sociale grand public, (2) un growth lead « cold-start marketplace » (style Tinder/Thursday),
 (3) un chercheur sécurité/éthique produit.

CONTEXTE — « Clutch » : app de rencontre SPONTANÉE en personne (Lausanne d'abord), Next.js static export +
Supabase + Capacitor iOS. Vocabulaire : Clutch (invitation), Verrou (RDV confirmé), créneau de dispo (max 3,
sur 18h, lieu + rayon + heures). Différenciateur = « la forteresse » : un moteur espace-temps qui rend
IMPOSSIBLE d'être à 2 endroits à la fois (contrainte DB) ET qui n'autorise un RDV que si on peut physiquement
s'y rendre à temps (D + R ≤ portée(Δt) ; enchaînement fin(A)+trajet ≤ début(B)). Prouvé par un fuzzer (« le COQ »)
et un simulateur de ville (« Clutch City », 1000 agents, 14 415 trous → 0 quand la forteresse est active).
État : flow complet jouable sur TestFlight ; graphisme en cours ; i18n à moitié ; profil à finir ; premium pas branché.

LE PROBLÈME CENTRAL à trancher : comment rendre l'app TESTABLE en conditions réelles avec ~20-30 amis, sachant
qu'une app de rencontre spontanée avec peu de monde en ligne « paraît morte » (cold-start) ? Faut-il une couche
de bots d'ambiance (et alors comment rester éthique/légal — pas de faux profils trompeurs) ? Ou concentrer les
vrais amis dans le temps/lieu ? Ou un « event de lancement » ? Autre ?

QUESTIONS :
1. Le différenciateur « forteresse » est-il un vrai moat ou un gadget d'ingénieur ? Qu'est-ce qui le rendrait
   indispensable pour l'utilisateur (pas juste élégant pour nous) ?
2. Stratégie cold-start MINIMALE pour un premier test crédible avec 20-30 personnes à Lausanne. Bots d'ambiance :
   pour ou contre, et à quelles conditions strictes (légal LPD/RGPD + éthique anti-tromperie) ?
3. Qu'est-ce qui MANQUE absolument avant ce test (et qu'est-ce qui est sur-ingénieré et peut attendre) ?
4. 3 risques qui tueraient le test, et leur parade.

FORMAT DE SORTIE (obligatoire) :
- Pour chaque question : la position de CHAQUE expert (1 ligne), puis le DÉSACCORD principal, puis la SYNTHÈSE tranchée.
- Une liste « FAIRE MAINTENANT » (≤7 items) vs « NE PAS FAIRE / plus tard » (≤7 items).
- Le piège n°1 que des fondateurs comme nous ne voient pas.
Sois brutal. Si une de nos idées (forteresse, Clutch City, bots d'ambiance) est mauvaise, dis-le et explique pourquoi.
```
→ Ensuite : **challenger la réponse** (le panel a souvent raison à 90% mais bluffe à 10% — trier), garder le validé, le ranger dans `/codex` + mémoire.
