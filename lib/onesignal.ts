// OneSignal Push Notifications pour Clutch (iOS/Android via Capacitor)
// Package: @onesignal/capacitor-plugin
//
// App ID à configurer : onesignal.com → New App → iOS → copier l'App ID
// Remplacer VOTRE_APP_ID_ICI par le vrai App ID avant de builder en natif

export const ONESIGNAL_APP_ID = '72f8da44-de01-4ad1-b1d8-6d2fbf33daf4'

export async function initOneSignal() {
  if (typeof window === 'undefined') return

  const { Capacitor } = await import('@capacitor/core')
  if (!Capacitor.isNativePlatform()) {
    // Web: les notifications browser natives sont gérées séparément
    return
  }

  try {
    const OneSignal = (await import('@onesignal/capacitor-plugin')).default

    // Initialise le SDK avec notre App ID
    OneSignal.initialize(ONESIGNAL_APP_ID)

    // Demande la permission iOS (affiche la popup système Apple)
    await OneSignal.Notifications.requestPermission(true)

    // ⚠️ CLÉ (OneSignal v5) : forcer l'OPT-IN de la push subscription.
    // Sans ça, le device peut avoir la permission iOS ON mais rester « Never Subscribed »
    // côté OneSignal (bug observé : permission accordée mais pas d'abonnement). optIn() corrige.
    try { (OneSignal as any).User?.pushSubscription?.optIn?.() } catch (e) { console.warn('[OneSignal] optIn:', e) }

    // Handler : notification reçue en foreground — on gère l'affichage nous-mêmes
    // ⚠️ BUG CORRIGÉ (23.06) : on appelait event.preventDefault() → la bannière système était
    // SUPPRIMÉE quand l'app était ouverte, et RIEN n'écoutait l'event de remplacement → David ne
    // voyait AUCUNE notif app ouverte. On NE preventDefault PLUS (la bannière iOS s'affiche), et on
    // dispatche EN PLUS un toast in-app (« je veux que TOUT ce qui est notifié s'affiche »).
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      const notif = event.getNotification()
      console.log('[OneSignal] Notification foreground (affichée):', notif)
      window.dispatchEvent(new CustomEvent('clutch:push', {
        detail: {
          title: notif.title,
          body: notif.body,
          data: notif.additionalData,
        }
      }))
    })

    // Handler : notification cliquée depuis le notification center
    OneSignal.Notifications.addEventListener('click', (event) => {
      const notif = event.notification
      console.log('[OneSignal] Notification cliquée:', notif)

      const data = notif.additionalData as Record<string, unknown> | null
      if (data?.type === 'new_clutch') {
        // Navigue vers l'onglet Clutchs via event custom
        window.dispatchEvent(new CustomEvent('clutch:notification', { detail: data }))
      }
    })

    console.log('[OneSignal] Initialisé avec succès')
  } catch (err) {
    console.warn('[OneSignal] Non disponible (mode web ou erreur):', err)
  }
}

// Renvoie true si les notifs push sont accordées, false sinon, null si non pertinent (web).
export async function notifGranted(): Promise<boolean|null> {
  if (typeof window === 'undefined') return null
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return null
    const OneSignal = (await import('@onesignal/capacitor-plugin')).default as any
    const p = OneSignal?.Notifications?.permission
    if (typeof p === 'boolean') return p
    if (OneSignal?.Notifications?.getPermissionAsync) return await OneSignal.Notifications.getPermissionAsync()
    return null
  } catch { return null }
}
// Redemande la permission / re-opt-in (bouton « Activer » de la bannière).
export async function enableNotifs() {
  try {
    const OneSignal = (await import('@onesignal/capacitor-plugin')).default as any
    await OneSignal?.Notifications?.requestPermission?.(true)
    try { OneSignal?.User?.pushSubscription?.optIn?.() } catch {}
  } catch {}
}

// Lie le player OneSignal à notre user Supabase — à appeler après login réussi
export async function setOneSignalExternalId(userId: string) {
  if (typeof window === 'undefined') return
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (!Capacitor.isNativePlatform()) return
    const OneSignal = (await import('@onesignal/capacitor-plugin')).default
    // login() lie le OneSignal player ID à notre identifiant user Supabase
    await OneSignal.login(userId)
    console.log('[OneSignal] External ID lié:', userId)
  } catch (err) {
    console.warn('[OneSignal] setExternalId failed:', err)
  }
}
