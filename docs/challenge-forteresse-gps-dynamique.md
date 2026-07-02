# 🥊 PROMPT DE CHALLENGE — Forteresse GPS dynamique & blocage de créneau (02.07.2026)

> David veut que le système de **blocage de créneau injoignable** soit **absolument parfait**. Coller ce prompt à
> GPT-5 / Grok, ramener les réponses, challenger (garder le vrai, virer le bluff), corriger l'implémentation.

```
Tu es un panel de 3 experts qui DOIVENT se contredire et trancher : (1) un ingénieur systèmes temps-réel/GPS mobile,
(2) un chercheur sécurité/anti-abus, (3) un designer UX produit (friction utile vs pénible). Sois brutal.

CONTEXTE — « Clutch », app de rencontre spontanée EN PERSONNE (Lausanne). Différenciateur = « la forteresse » :
 - Graal 1 (EXCLUSION) : impossible d'être à 2 endroits à la fois → contrainte DB (occupancies + EXCLUDE gist). OK.
 - Graal 2 (CAUSALITÉ, DYNAMIQUE) : on doit être CERTAIN de pouvoir honorer un créneau/RDV, sachant que tout bouge.
   → l'app interroge le GPS toutes les ~90 s (foreground), et pour le prochain créneau calcule :
       distance(ma position → ma zone publiée)  vs  portée = reachKm(temps restant avant le créneau)  [~30 km/h, marge 15 min]
     Si distance ≤ portée + rayon → OK (même si loin, je peux y aller). Sinon → INJOIGNABLE.
 - Anti-blip : on ne bloque qu'après 2 lectures GPS consécutives injoignables.
 - Sur INJOIGNABLE confirmé → MODAL BLOQUANT (pas de créneau flottant) : « Le GPS montre que tu es à ~X km de ta
   zone, trop loin pour y être à temps. Éteindre ce créneau / Je le garde (j'y vais) ». « Garde » = snooze 8 min.
 - Contexte technique : app native iOS (Capacitor, geolocation = GPS device), aussi une version web. Pas de serveur
   (Next.js static + Supabase client). Le GPS n'est lu qu'en foreground (batterie + politique app store).

QUESTIONS (réponds précis, pas de bla-bla) :
1. Le seuil « 2 lectures consécutives » (≈3 min à 90 s) est-il bon ? Faut-il 3 ? Une distance-tampon (hystérésis) pour
   éviter le clignotement quand on est PILE à la limite ? Proposez des valeurs chiffrées.
2. Cas où le GPS est indisponible/imprécis (tunnel, intérieur, permission refusée, précision 500 m) : que doit faire
   la forteresse ? Bloquer ? Ignorer ? Comment ne PAS annuler un créneau à cause d'un GPS foireux, SANS laisser
   passer un vrai injoignable ?
3. Le GPS foreground-only suffit-il pour le Graal 2, ou faut-il du background (avec ses coûts batterie + validation
   Apple) ? Compromis ? Que font Uber/Lyft/Life360 pour un besoin proche ?
4. VPN : sur mobile natif, un VPN change-t-il la position GPS de l'appareil (non, c'est l'IP) ? Y a-t-il un cas où un
   utilisateur peut FALSIFIER sa position (GPS spoofing, mock location Android, simulateur) et contourner la
   forteresse ? Est-ce grave pour Clutch ? Quelle parade proportionnée (sans paranoïa) ?
5. UX du modal bloquant : forcer un choix est-il correct, ou risque-t-il d'énerver (ex : je pinne ma zone chez moi et
   je sors 5 min acheter du pain) ? Comment distinguer « je dérive vraiment » de « je bouge un peu mais je reviens » ?
6. Edge cases à couvrir absolument : plusieurs créneaux (lequel on évalue ?), changement de fuseau, minuit, créneau
   qui commence dans 6 h vs en cours, l'utilisateur QUI EST DÉJÀ en RDV, la personne qui a pinné loin exprès.
7. Le pire scénario où ce système fait du tort (annule un créneau à tort → l'user rate une rencontre) et sa parade.

FORMAT : par question, position de CHAQUE expert (1 ligne) → désaccord → synthèse tranchée AVEC des valeurs chiffrées.
Puis « FAIRE MAINTENANT » (≤6) vs « NE PAS FAIRE » (≤6). Puis le piège n°1 qu'on ne voit pas. Si notre design
(2 lectures, foreground-only, modal forcé) est mauvais, dites-le et proposez mieux.
```
→ Ensuite : challenger la réponse (garder le validé, virer le bluff), ranger dans `/codex` + ajuster l'implémentation.

## État de l'implémentation (build 244)
- ✅ Détection forteresse-aware (distance vs reachKm) toutes les 90 s, foreground.
- ✅ Anti-blip : 2 lectures consécutives injoignables avant de bloquer.
- ✅ Modal bloquant (Éteindre / Je le garde → snooze 8 min).
- ✅ Bouton de test dans le Test Lab (« 🛰️ Tester blocage GPS ») pour ouvrir le modal sans se déplacer.
- ⏳ À décider après le challenge : hystérésis, gestion GPS imprécis/indispo, background, anti-spoofing.
