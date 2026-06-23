// Haptique unifiée Clutch — vibration de confirmation sur les actions importantes.
// ⚠️ navigator.vibrate NE MARCHE PAS sur iOS (WKWebView ne supporte pas l'API Vibration) →
// sur natif on passe par le plugin Capacitor Haptics (UIImpactFeedbackGenerator natif Apple).
// Sur web/Android navigateur → fallback navigator.vibrate.
//
// Usage : import { hap } from '@/lib/haptics'; hap('medium')  (fire-and-forget, jamais await obligatoire)

type Hap = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select'

let cached: any = null
let isNative: boolean | null = null

async function nativeMod() {
  if (cached) return cached
  try { cached = await import('@capacitor/haptics') } catch { cached = null }
  return cached
}

export function hap(style: Hap = 'light') {
  if (typeof window === 'undefined') return
  // Détection native (mémoïsée)
  const run = async () => {
    if (isNative === null) {
      try { const { Capacitor } = await import('@capacitor/core'); isNative = Capacitor.isNativePlatform() }
      catch { isNative = false }
    }
    if (!isNative) {
      // Web / Android navigateur — durée selon l'intensité (no-op silencieux sur iOS Safari).
      const ms = style === 'heavy' ? 24 : style === 'medium' ? 14 : style === 'error' ? 30
        : style === 'success' ? 12 : 8
      try { (navigator as any).vibrate?.(ms) } catch {}
      return
    }
    const mod = await nativeMod(); if (!mod) return
    try {
      const { Haptics, ImpactStyle, NotificationType } = mod
      if (style === 'success') return Haptics.notification({ type: NotificationType.Success })
      if (style === 'warning') return Haptics.notification({ type: NotificationType.Warning })
      if (style === 'error')   return Haptics.notification({ type: NotificationType.Error })
      if (style === 'select')  return (Haptics.selectionChanged?.() ?? Haptics.impact({ style: ImpactStyle.Light }))
      const s = style === 'heavy' ? ImpactStyle.Heavy : style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light
      return Haptics.impact({ style: s })
    } catch {}
  }
  run()
}
