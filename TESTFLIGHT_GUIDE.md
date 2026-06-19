# 🚀 Guide TestFlight — Clutch (du Air → iPhone)

> Préparé par Claude la nuit du 19.06.2026 pendant que tu dormais.
> Objectif : app **DÉMO de test** à partager avec les potes via TestFlight.
> ⚠️ PAS une soumission App Store. Bugs + design pas fini = TOTALEMENT OK.
> Temps estimé le matin : ~1h (dont ~45 min de téléchargement Xcode passif).

---

## 🎯 RAPPEL : c'est une BETA, pas une sortie App Store

| | **Interne** | **Externe** |
|---|---|---|
| Testeurs | 100 max | jusqu'à 10 000 |
| Partage | par email | **lien public** |
| Revue Apple | AUCUNE (~15 min) | Beta Review légère (~1 jour) |
| Bugs / design WIP | ✅ OK | ✅ OK |

**Reco : commence par l'Interne** (zéro revue, dispo en 15 min) pour tester avec tes
potes proches. Active l'Externe (lien public) seulement quand tu veux élargir.
Tes bugs internes / design pas fini n'intéressent pas Apple pour une beta —
ils vérifient juste que l'app se lance sans crasher.

---

## ✅ CE QUI EST DÉJÀ FAIT (par Claude, cette nuit)

- `npm run build` → build web **v18.06-Z35** OK
- `npx cap sync ios` → build injecté dans la coquille native iOS (`ios/App/App/public`)
- Plugin push **OneSignal** détecté et inclus
- Bundle ID confirmé : `app.clutch.lausanne`
- Équipe de signature déjà configurée : `ZSB6YMMZSJ`
- Version : `1.0` · Build : `1`
- Permissions iOS en français : ✅ position, caméra, galerie, micro, notifications
- `PrivacyInfo.xcprivacy` présent ✅
- App icon présente ✅

➡️ **Le projet est prêt à être ouvert dans Xcode. Il ne manque qu'Xcode lui-même + tes étapes Apple.**

---

## 🔴 PRÉREQUIS BLOQUANT : installer Xcode

Sur le Air il n'y a que les « Command Line Tools », pas le vrai Xcode.

### Option A (recommandée pour toi — la plus simple)
1. Ouvre le **Mac App Store**
2. Cherche **Xcode** → clique **Obtenir / Installer**
3. ~7 Go à télécharger, ~40 Go installés. Laisse tourner (tu as 236 Go libres, OK).
4. Une fois installé, **ouvre Xcode une fois** → il va demander d'installer des composants additionnels → accepte (ton mot de passe Mac).

### Puis, dans le Terminal (copie-colle ces 2 lignes) :
```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```
(la 1ʳᵉ dit au système d'utiliser le vrai Xcode, la 2ᵉ accepte la licence Apple)

---

## 📲 ÉTAPES POUR FABRIQUER L'APP TEST

### 1. Ouvrir le projet dans Xcode
Dans le Terminal :
```bash
cd /Users/saugydavid/Documents/clutch
npx cap sync ios      # re-synchro par sécurité (rapide)
npx cap open ios      # ouvre le projet dans Xcode
```

### 2. Vérifier la signature (Signing & Capabilities)
- Dans Xcode, panneau gauche : clique sur le projet **App** (icône bleue tout en haut)
- Onglet **Signing & Capabilities**
- Coche **Automatically manage signing**
- **Team** : sélectionne ton équipe Apple Developer (David Saugy)
  - Si Xcode demande de te connecter : **Xcode → Settings → Accounts → +** → connecte ton Apple ID
  - 👉 **C'est ici qu'arrive le 2FA Apple** (code sur ton iPhone). Normal.
- Xcode crée le « provisioning profile » tout seul. Si pas d'erreur rouge → c'est bon.

### 3. Créer la fiche app sur App Store Connect
- Va sur https://appstoreconnect.apple.com → **Apps** → bouton **+** → **Nouvelle app**
- Plateforme : iOS
- Nom : **Clutch**
- Langue principale : Français
- Bundle ID : sélectionne **app.clutch.lausanne** (déjà enregistré normalement)
- SKU : `clutch-001` (n'importe quel identifiant interne)
- Crée.

### 4. Archiver (= fabriquer le .ipa)
- En haut d'Xcode, à côté du bouton ▶️, choisis la cible **« Any iOS Device (arm64) »**
  (PAS un simulateur — sinon "Archive" est grisé)
- Menu **Product → Archive**
- Attends 2-5 min (compilation). Une fenêtre **Organizer** s'ouvre à la fin.

### 5. Envoyer sur TestFlight
- Dans l'Organizer : bouton **Distribute App**
- Choisis **App Store Connect** → **Upload**
- Laisse les options par défaut (signing automatique) → **Upload**
- 👉 **Nouveau 2FA Apple possible ici.** Normal.
- Upload + traitement Apple : **5 à 30 min**. Tu peux fermer Xcode.

### 6. Partager avec tes potes (2 modes)

Sur App Store Connect → ta fiche Clutch → onglet **TestFlight**.
Attends que le build passe de « En cours de traitement » à prêt (~5-30 min).

#### 🟢 Mode INTERNE (commence par ça — instantané, 100 personnes max)
- Section **Testeurs internes** → ajoute les emails (le tien + potes proches)
  - ⚠️ chaque testeur interne doit avoir un accès à ton équipe App Store Connect
    (tu peux les inviter comme « Testeurs » sans leur donner de droits admin)
- **Aucune revue Apple** → dispo en ~15 min
- Chacun installe l'app **TestFlight** sur son iPhone → reçoit l'invitation → **Installer**

#### 🔵 Mode EXTERNE (plus tard — lien public, jusqu'à 10 000)
- Section **Testeurs externes** → crée un groupe (ex. « Potes »)
- Remplis les infos beta demandées : email de contact + « Que tester ? » (1-2 phrases)
- Apple lance une **Beta App Review légère** (souvent < 24h) — bugs/design WIP OK
- Une fois approuvé : tu obtiens un **lien public** → tu l'envoies à qui tu veux
  (WhatsApp, etc.). Ils cliquent → TestFlight → Installer. Pas besoin de leur email.

🎉 Dans les deux cas, Clutch tourne sur de vrais iPhones.

### 7. Mettre à jour l'app (quand tu changes des trucs)
À chaque nouvelle version : incrémente le **build number** (1 → 2 → 3…) dans Xcode,
puis refais `npm run build` → `npx cap sync ios` → Archive → Upload.
Les testeurs reçoivent la mise à jour automatiquement dans TestFlight.

---

## ⚠️ Détail à savoir : "Export Compliance" (chiffrement)
À la 1ʳᵉ soumission, Apple demande si l'app utilise du chiffrement.
Clutch n'utilise que le HTTPS standard → réponse : **"No / Exempt"** (exemption standard).
Pour ne plus jamais voir la question, on pourra ajouter dans `Info.plist` :
`ITSAppUsesNonExemptEncryption = NO`. Dis-le moi et je l'ajoute (c'est une déclaration légale, je ne l'ai pas mise sans ton accord).

---

## 🆘 ERREURS FRÉQUENTES (et solutions)

| Erreur | Solution |
|--------|----------|
| "Archive" grisé | Tu es sur un simulateur → choisis "Any iOS Device" |
| "No account / signing error" | Xcode → Settings → Accounts → connecte ton Apple ID |
| "Bundle ID not available" | La fiche app n'est pas créée → fais l'étape 3 |
| "Cannot find module / public manquant" | relance `npx cap sync ios` |
| Xcode très lent au 1ᵉ lancement | normal, il indexe — laisse-le finir |

---

## 📌 Quand tu reviens vers moi le matin
Dis-moi juste où tu en es ("Xcode installé", "erreur à l'étape X", "build uploadé")
et je te débloque la suite. Je ne peux pas faire les étapes Apple/2FA à ta place,
mais je gère tout ce qui est code, config, build web et synchro native.
