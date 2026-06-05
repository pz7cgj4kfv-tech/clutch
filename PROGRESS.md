# Clutch — Journal de progression

## Infos projet
- **App** : pz7cgj4kfv-tech.github.io
- **Repo** : github.com/pz7cgj4kfv-tech/clutch
- **Stack** : Next.js 15 + Supabase + GitHub Pages
- **Équipe** : Sébastien (produit), David (dev/admin), Mel (testeuse)

---

## ✅ SESSION 1 — Fondations
- Landing page `/`
- Auth Supabase (login, register)
- Onboarding 5 étapes (prénom, genre, âge, photo, intérêts)
- Écran Découverte profils (style Tinder)
- Proposition de clutch (lieu, heure, message)
- Inbox / messages temps réel
- RDV actif avec compte à rebours
- Check-in au café
- Événements (Jazz, Expo, Stand-up, Brunch…)
- Profil personnel
- Premium (19.90 CHF/mois, gratuit femmes)
- SOS sécurité (partage position, appel 117)
- Démo interactive 17 écrans (`/demo`)
- Déploiement GitHub Pages

## ✅ SESSION 2 — Qualité & Legal
- **Scroll iOS fixé** : suppression overflow:hidden du Frame (app + demo)
- **Demo mobile** : plein écran sur iPhone (plus de cadre téléphone)
- **Mot de passe oublié** : écran reset par email
- **CGU + Politique de confidentialité** : page `/legal` (LPD + RGPD)
- **Checkbox CGU** à l'inscription
- **Signalement** : bouton 🚩 sur profils, 6 raisons, table `reports`
- **Feedback RDV** : après check-in (super/ok/rabbit/ghost), impact score fiabilité
- **Certification profil** : flow selfie → upload Supabase → statut pending
- **Score compatibilité** : formule (intérêts communs + fiabilité)
- **Carte Découverte redesignée** : photo, score compat, dot disponibilité
- **Rate limiting** : max 3 clutches/jour
- **Modération contenu** : liste mots bannis avant envoi message
- **David en admin** ✅ (SQL exécuté)
- **Photos publiques avatars** ✅ (policy Supabase ajoutée)
- **Tables SQL créées** : reports, feedback, colonnes certified/certif_selfie/certif_status

---

## 🔜 PROCHAINES ÉTAPES

### Priorité haute
- [ ] Tester scroll iPhone sur GitHub Pages (après rebuild)
- [ ] Vérifier photo Mélanie visible
- [ ] Tester flow complet sur iPhone (onboarding → clutch → check-in → feedback)

### Fonctionnalités à venir
- [ ] Push notifications (Android web push + iOS via app native)
- [ ] Admin panel : valider certifications (voir selfie → certified=true)
- [ ] Score fiabilité calculé réellement (actuellement statique 100%)
- [ ] Affichage nb clutches restants aujourd'hui (rate limiting visuel)
- [ ] Modération photos (OpenAI Moderation API)
- [ ] Transitions d'écrans animées
- [ ] Domaine clutch.ch (Infomaniak)

### Infrastructure
- [ ] App native iOS/Android (Expo) — étape suivante après validation web
- [ ] Edge Functions Supabase pour notifications
- [ ] Modération automatique photos

---

## 💰 Coûts actuels
| Service | Coût |
|---------|------|
| GitHub Pages | Gratuit |
| Supabase (Free tier) | Gratuit |
| Domaine clutch.ch | ~15 CHF/an |
| **Total actuel** | **0 CHF/mois** |

---

## 📝 Notes techniques importantes
- `overflow:hidden` sur parent = bloque scroll tactile iOS → **toujours utiliser `overflowY:'scroll'`**
- `isMobile` = `useState(false)` + check `window.innerWidth < 768` dans `useEffect`
- Build : `PATH="/opt/homebrew/opt/node@26/bin:$PATH" npm run build`
- Deploy : `git push origin main` → GitHub Actions rebuild auto (~3-5 min)
- GPS : jamais stocké, converti en quartier via Nominatim (OpenStreetMap)

---

*Dernière mise à jour : 5 juin 2026*
