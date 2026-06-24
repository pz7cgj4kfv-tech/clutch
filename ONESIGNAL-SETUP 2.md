# Configuration OneSignal pour Clutch iOS

## Étapes (une seule fois)

### 1. Créer un compte OneSignal
→ https://onesignal.com → Sign Up gratuit

### 2. Créer une app
- New App → "Clutch"
- Platform: Apple iOS
- Configurer APNs : utiliser une **Auth Key (.p8)** (recommandé vs certificat)
  - Dans Apple Developer → Certificates, Identifiers & Profiles → Keys → +
  - Cocher "Apple Push Notifications service (APNs)"
  - Télécharger le fichier .p8 (ne peut être téléchargé qu'une fois)
  - Renseigner dans OneSignal : Key ID + Team ID + fichier .p8

### 3. Récupérer l'App ID
- Dashboard OneSignal → Settings → Keys & IDs
- Copier **"OneSignal App ID"** (format UUID ex: `a1b2c3d4-...`)

### 4. Mettre à jour le code
Dans `/Users/uzic/Documents/clutch/lib/onesignal.ts` :
```ts
export const ONESIGNAL_APP_ID = 'a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
```

### 5. Configurer les capabilities dans Xcode
Après `npx cap add ios` :
- Xcode → Projet Clutch → Signing & Capabilities
- **+ Capability → Push Notifications**
- **+ Capability → Background Modes → cocher "Remote notifications"**

### 6. Rebuild et sync
```bash
cd /Users/uzic/Documents/clutch
npm run build
npx cap sync
npx cap open ios
```

### 7. Tester
- Dans OneSignal Dashboard → Messages → New Push
- Envoyer une notification test à "All Users"

---

## Envoyer une notification depuis Supabase Edge Function

Pour notifier un user lors d'un nouveau clutch, appeler l'API REST OneSignal :

```ts
await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    app_id: ONESIGNAL_APP_ID,
    include_aliases: { external_id: [receiverUserId] },
    target_channel: 'push',
    headings: { fr: '🔒 Nouveau Clutch !' },
    contents: { fr: `${senderName} veut te rencontrer ce soir` },
    data: { type: 'new_clutch', clutch_id: clutchId },
  }),
})
```

La **REST API Key** se trouve dans OneSignal → Settings → Keys & IDs → "REST API Key".
Stocker en secret Supabase : `ONESIGNAL_REST_API_KEY`.
