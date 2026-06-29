'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /test220 — PAGE DE TEST INTERACTIVE (David 30.06). Reprend la checklist du build 220
// mais chaque test a 3 RONDS cliquables (✅ ok · 🟧 bof · ❌ ko) + une note facultative.
// David clique au lieu d'expliquer → bouton « Copier mes retours » génère un texte qu'il
// recolle à Claude → session debug. Tout est gardé en localStorage (rien ne se perd au reload).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react'

const C = {
  bg: '#2a1020', card: '#3a1a2e', ink: '#f5e8de', mid: '#c9a9bd', border: '#5a3048',
  green: '#77BC1F', rose: '#EB6BAF', plum: '#532943', orange: '#E27C00', red: '#E05353',
}

type Verdict = 'ok' | 'meh' | 'ko'
type Item = { id: string; label: string }
type Section = { id: string; icon: string; title: string; sub?: string; items: Item[] }

const SECTIONS: Section[] = [
  { id: 'cone', icon: '🏰', title: 'Forteresse / Cône', sub: 'Le gros morceau — moteur unique recâblé', items: [
    { id: 'start1h', label: 'À l’ouverture, le départ proposé est ~+1h (pas +5 min) → assez de marge pour bouger le curseur' },
    { id: 'fluide', label: 'Curseur fluide, pas anxiogène (pas de pulsations stressantes)' },
    { id: 'couleurs', label: 'Dégradé du curseur = couleurs app (vert→rose→violet), jamais de rouge plein' },
    { id: 'frot-droite', label: '➡️ Vers la DROITE : ça résiste de plus en plus quand on sort de la zone atteignable' },
    { id: 'frot-gauche', label: '⬅️ Vers la GAUCHE : ça glisse libre, on revient à un petit rayon sans frotter' },
    { id: 'large-defaut', label: 'Au défaut (dans 1h, pin sur moi) : je peux pousser large (~25 km) sans blocage' },
    { id: 'resserre', label: 'Quand je rapproche l’heure → le plafond du rayon se resserre tout seul' },
    { id: 'agrandit', label: 'Quand je décale plus tard → le plafond s’agrandit' },
    { id: 'pin-loin', label: 'Pin loin + heure proche → bandeau clair « trop loin » + Suivant bloqué' },
    { id: 'cercle-zone', label: 'Cercle pointillé « zone atteignable » visible, se resserre quand l’heure approche' },
    { id: 'cas-18km', label: 'Cas 18 km à ~1h → possible (avant : « impossible » à tort)' },
    { id: 'cas-2h20', label: 'Cas RDV ~2h20 depuis Morges, loin (Genève) → passe, pas « trop loin »' },
    { id: 'cas-nuit', label: 'Cas « cette nuit » (heure tardive) → ne dit pas « trop loin »' },
    { id: 'phrase-courte', label: 'Le message « trop loin » est court et clair (plus de pavé)' },
    { id: 'moments-excl', label: 'Boutons moments (cet aprèm/ce soir/cette nuit) = exclusifs, aucun > 18h' },
    { id: 'pastille', label: 'Pastille 📍 N/3 toujours visible, y compris 0/3 au départ' },
    { id: 'creneau-affiche', label: 'Le créneau s’affiche dès le départ' },
    { id: 'creneau-save', label: 'Le créneau est bien sauvé, pas effacé au recentrage GPS' },
    { id: 'vivant', label: 'Cône vivant : si je reste, le rayon rétrécit tout seul (~30 s)' },
    { id: 'canevas', label: 'Le bas ne saute pas quand « X créneaux » apparaît' },
    { id: 'intention-opt', label: 'Intention optionnelle : je peux valider sans rien écrire' },
    { id: 'lab', label: '/forteresse-lab s’ouvre (curseurs + matrice), plus de « page can’t load »' },
  ]},
  { id: 'carte', icon: '📍', title: 'Carte & lieu', items: [
    { id: 'recherche', label: 'Recherche de lieu par nom (ex. « Flon ») → résultats près de moi' },
    { id: 'epingle', label: 'Épingler en déplaçant la carte + rayon visible autour du pin' },
    { id: 'pin-generique', label: 'L’épingle 📍 générique a disparu de la carte de présence' },
  ]},
  { id: 'presence', icon: '🎨', title: 'Carte présence de Mel', sub: 'Vraies personnes = carte Mel · bots = carte riche', items: [
    { id: 'vraie-mel', label: 'Une vraie personne → carte épurée de Mel' },
    { id: 'bot-riche', label: 'Un bot (Test Lab) → ancienne carte riche (tous badges/scores)' },
    { id: 'age-espace', label: 'Prénom + âge collés avec un petit espace fixe (pas en colonne)' },
    { id: 'ombre', label: 'Ombre douce sous les cartes' },
    { id: 'intention-2l', label: 'Intention longue → 2 lignes propres, pas de débordement' },
    { id: 'genre-pin', label: 'Icône genre (♀/♂/nb) + pin RDV s’affichent bien' },
  ]},
  { id: 'clutch', icon: '📑', title: 'Onglet Clutch — mini-onglets', sub: 'Test : Test Lab → « Je clutche David »', items: [
    { id: 'mini-onglets', label: '3 mini-onglets en haut : 🔥 À répondre · 📍 Prochain RDV · ⏳ En attente + compteurs' },
    { id: 'filtre-onglet', label: 'Chaque onglet ne montre que ses cartes' },
    { id: 'vide', label: 'Chaque onglet vide a son petit message' },
    { id: 'carte-clutch', label: 'Carte Clutch de Mel : avatar + prénom + âge + lieu 2 lignes + heure + 🔒 + ✕' },
    { id: 'lock', label: 'Tap 🔒 (lock) = accepter → passe en Verrou' },
    { id: 'cancel', label: 'Tap ✕ (cancel) = refuser' },
    { id: 'tap-profil', label: 'Tap ailleurs sur la carte ouvre le profil (sans accepter/refuser)' },
    { id: 'contre', label: 'Lien « contre-proposer » présent sous la carte' },
  ]},
  { id: 'events', icon: '🎟️', title: 'Events', items: [
    { id: 'icones-cat', label: 'Affiner → Catégories : icônes de Mel (on/off) à la place des emojis' },
    { id: 'icone-toggle', label: 'Tap une icône → elle s’allume (prune+couleur) et filtre les events' },
    { id: 'effacer', label: '« Effacer » remet tout à zéro' },
    { id: 'dates', label: 'Dates des events cohérentes avec maintenant (plus de dates passées)' },
    { id: 'bots-visibles', label: 'Les bots restent visibles dans les présences en mode réel' },
  ]},
  { id: 'lab', icon: '🧪', title: 'Test Lab', items: [
    { id: 'age-bots', label: 'Les bots ont un âge affiché' },
    { id: 'online', label: 'Bouton « en ligne » d’un bot change bien d’état' },
    { id: 'thumb-vide', label: 'Le thumb du curseur est vide au départ' },
    { id: 'je-clutche', label: 'Bouton « Je clutche David » fonctionne' },
  ]},
  { id: 'reg', icon: '🔔', title: 'Régressions', items: [
    { id: 'flow-base', label: 'Login → présences → carte → profil : tourne sans crash' },
    { id: 'version', label: 'Version affichée en bas = 0x1e1 / build 221' },
    { id: 'no-load-err', label: 'Aucun « This page couldn’t load » nulle part' },
    { id: 'ios', label: 'iPhone réel : pas de freeze, safe-area OK, swipe-back marche' },
    { id: 'palette', label: 'Couleurs = palette Mel partout (pas d’orange/rouge parasite)' },
  ]},
]

const KEY = 'clutch_test220_v1'
const VERDICTS: { v: Verdict; emoji: string; col: string; label: string }[] = [
  { v: 'ok', emoji: '✅', col: C.green, label: 'OK' },
  { v: 'meh', emoji: '🟧', col: C.orange, label: 'Bof' },
  { v: 'ko', emoji: '❌', col: C.red, label: 'KO' },
]

export default function Test220() {
  const [state, setState] = useState<Record<string, { v?: Verdict; note?: string }>>({})
  const [copied, setCopied] = useState(false)
  const [showText, setShowText] = useState(false)

  useEffect(() => { try { const s = localStorage.getItem(KEY); if (s) setState(JSON.parse(s)) } catch {} }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {} }, [state])

  const setV = (id: string, v: Verdict) => setState(s => ({ ...s, [id]: { ...s[id], v: s[id]?.v === v ? undefined : v } }))
  const setNote = (id: string, note: string) => setState(s => ({ ...s, [id]: { ...s[id], note } }))

  const allItems = SECTIONS.flatMap(s => s.items)
  const tested = allItems.filter(i => state[i.id]?.v).length
  const koCount = allItems.filter(i => state[i.id]?.v === 'ko' || state[i.id]?.v === 'meh').length

  const buildReport = () => {
    const lines: string[] = [`# Retours tests build 220 — ${tested}/${allItems.length} testés, ${koCount} à voir`]
    for (const sec of SECTIONS) {
      const rows = sec.items.filter(i => state[i.id]?.v || state[i.id]?.note)
      if (!rows.length) continue
      lines.push(`\n## ${sec.icon} ${sec.title}`)
      for (const it of rows) {
        const st = state[it.id]
        const em = st?.v ? VERDICTS.find(x => x.v === st.v)!.emoji : '⬜️'
        lines.push(`${em} ${it.label}${st?.note ? ` — 📝 ${st.note}` : ''}`)
      }
    }
    const untested = allItems.length - tested
    if (untested > 0) lines.push(`\n(${untested} test(s) non remplis)`)
    return lines.join('\n')
  }

  const copy = async () => {
    const txt = buildReport()
    try { await navigator.clipboard.writeText(txt); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    catch { setShowText(true) }
  }

  const reset = () => { if (confirm('Effacer tous tes retours ?')) setState({}) }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.ink, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', padding: 'max(20px,env(safe-area-inset-top)) 14px calc(120px + env(safe-area-inset-bottom))' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.16em', color: C.rose }}>🧪 TEST INTERACTIF · BUILD 221 (0x1e1)</div>
        <h1 style={{ margin: '4px 0 4px', fontSize: 23, fontWeight: 900 }}>Clique les ronds, je lis tes retours</h1>
        <p style={{ margin: '0 0 6px', fontSize: 13, color: C.mid, lineHeight: 1.5 }}>
          Pour chaque test : <b style={{ color: C.green }}>✅ OK</b> · <b style={{ color: C.orange }}>🟧 bof</b> · <b style={{ color: C.red }}>❌ KO</b>.
          Ajoute une note si besoin. À la fin → <b style={{ color: C.ink }}>« Copier mes retours »</b> et recolle-moi le texte. Tout est sauvé automatiquement.
        </p>

        {SECTIONS.map(sec => (
          <div key={sec.id} style={{ background: C.card, borderRadius: 16, padding: '12px 13px', margin: '12px 0', border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 2 }}>{sec.icon} {sec.title}</div>
            {sec.sub && <div style={{ fontSize: 11.5, color: C.mid, marginBottom: 6 }}>{sec.sub}</div>}
            {sec.items.map(it => {
              const st = state[it.id]
              return (
                <div key={it.id} style={{ padding: '8px 0', borderTop: `1px solid ${C.border}66` }}>
                  <div style={{ fontSize: 13, lineHeight: 1.35, marginBottom: 7, color: st?.v === 'ok' ? C.ink : st?.v ? C.ink : C.ink, opacity: st?.v === 'ok' ? 0.7 : 1 }}>{it.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {VERDICTS.map(vd => {
                      const on = st?.v === vd.v
                      return (
                        <button key={vd.v} onClick={() => setV(it.id, vd.v)} aria-label={vd.label}
                          style={{ width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontFamily: 'inherit',
                            border: on ? `2px solid ${vd.col}` : `1.5px solid ${C.border}`, background: on ? `${vd.col}26` : 'transparent',
                            fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .12s', opacity: on ? 1 : 0.45, transform: on ? 'scale(1.08)' : 'scale(1)' }}>
                          {vd.emoji}
                        </button>
                      )
                    })}
                    <input value={st?.note || ''} onChange={e => setNote(it.id, e.target.value)} placeholder="note (option)"
                      style={{ flex: 1, minWidth: 0, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 10px', color: C.ink, fontSize: 12.5, fontFamily: 'inherit' }} />
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {showText && (
          <textarea readOnly value={buildReport()} onFocus={e => e.currentTarget.select()}
            style={{ width: '100%', height: 220, background: C.card, color: C.ink, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, fontSize: 12, fontFamily: 'ui-monospace,monospace', marginTop: 10 }} />
        )}
      </div>

      {/* Barre fixe en bas : progression + copier + reset */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: C.card, borderTop: `1px solid ${C.border}`, padding: '10px 14px calc(10px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'center', gap: 10, zIndex: 50 }}>
        <div style={{ fontSize: 12, color: C.mid, flexShrink: 0 }}><b style={{ color: C.ink, fontSize: 15 }}>{tested}</b>/{allItems.length}<br />{koCount > 0 && <span style={{ color: C.orange }}>{koCount} à voir</span>}</div>
        <button onClick={copy} style={{ flex: 1, padding: '13px', borderRadius: 13, border: 'none', background: copied ? C.green : C.rose, color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
          {copied ? '✅ Copié — recolle à Claude' : '📋 Copier mes retours'}
        </button>
        <button onClick={reset} style={{ padding: '13px 14px', borderRadius: 13, border: `1px solid ${C.border}`, background: 'transparent', color: C.mid, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>↺</button>
      </div>
    </div>
  )
}
