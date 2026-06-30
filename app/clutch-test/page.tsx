'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /clutch-test — « Clutch Test v1 » : cockpit d'une SOIRÉE CHORÉGRAPHIÉE.
// Né du challenge GPT+Grok (01.07) : le piège n°1 = « tester le vide ». La parade = concentrer 20-30 vrais amis
// sur 1 soir / 1 zone / 1 créneau, avec consigne « tout le monde ouvre sa dispo à HH:MM » + groupe WhatsApp.
// Cette page = l'outil pour orchestrer ça : régler la session, générer la consigne copiable, compte à rebours,
// compteur LIVE de personnes dispo (lit Supabase), et la checklist « cycle humain qui tient » avant de lancer.
// Voir docs/challenge-panels-01jul-synthese.md. AUCUNE écriture DB ici (lecture seule) = sûr.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const C = {
  bg: '#2a1020', card: '#3a1a2e', cardSoft: 'rgba(51,22,38,0.5)', border: 'rgba(255,191,158,0.18)',
  orange: '#E27C00', salmon: '#FFBF9E', text: '#f5e8de', textMid: 'rgba(245,232,222,0.62)',
  green: '#77BC1F', amber: '#FFB300',
}

const APP_URL = 'https://pz7cgj4kfv-tech.github.io/app2'
const LS_KEY = 'clutchTestV1'

type Cfg = { title: string; date: string; start: string; end: string; place: string; radius: number; target: number }

const todayISO = () => new Date().toISOString().slice(0, 10)
const DEFAULT: Cfg = { title: 'Clutch Test v1', date: todayISO(), start: '19:30', end: '21:30', place: 'Centre Lausanne', radius: 3, target: 25 }

function fmtFRDate(iso: string): string {
  try {
    const d = new Date(iso + 'T12:00:00')
    return d.toLocaleDateString('fr-CH', { weekday: 'long', day: 'numeric', month: 'long' })
  } catch { return iso }
}

export default function ClutchTestPage() {
  const [cfg, setCfg] = useState<Cfg>(DEFAULT)
  const [loaded, setLoaded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [liveCount, setLiveCount] = useState<number | null>(null)
  const [liveErr, setLiveErr] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // charge / persiste la config
  useEffect(() => {
    try { const raw = localStorage.getItem(LS_KEY); if (raw) setCfg({ ...DEFAULT, ...JSON.parse(raw) }) } catch {}
    setLoaded(true)
  }, [])
  useEffect(() => { if (loaded) try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)) } catch {} }, [cfg, loaded])

  // tick horloge (compte à rebours)
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])

  // compteur LIVE de personnes dispo (lecture seule, dégrade en silence si indispo)
  const fetchLive = useCallback(async () => {
    try {
      const nowIso = new Date().toISOString()
      const { count, error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_available', true)
        .gt('available_until', nowIso)
      if (error) { setLiveErr(true); return }
      setLiveErr(false); setLiveCount(count ?? 0)
    } catch { setLiveErr(true) }
  }, [])
  useEffect(() => { fetchLive(); const id = setInterval(fetchLive, 30000); return () => clearInterval(id) }, [fetchLive])

  const set = (k: keyof Cfg, v: string | number) => setCfg(c => ({ ...c, [k]: v }))

  const consigne = `🧪 ${cfg.title}\n\n📅 ${fmtFRDate(cfg.date)}\n🕘 ${cfg.start} → ${cfg.end}\n📍 ${cfg.place} (rayon ${cfg.radius} km)\n\nLe principe : on est tous au même endroit, au même moment, pour que l'app soit VIVANTE.\n\n👉 À ${cfg.start} PILE, ouvre l'app et mets-toi dispo (lieu = ${cfg.place}, jusqu'à ${cfg.end}).\nEnsuite regarde qui est là, envoie un Clutch à quelqu'un, et allez vous voir pour de vrai. 🤝\n\n📲 L'app : ${APP_URL}\n\n(Test privé entre nous — on note tout ce qui bug ou qui est pas clair, on en parle après.)`

  const startTs = (() => { try { return new Date(`${cfg.date}T${cfg.start}:00`).getTime() } catch { return 0 } })()
  const diff = startTs - now
  const countdown = (() => {
    if (!startTs) return '—'
    if (diff <= 0) {
      const endTs = (() => { try { return new Date(`${cfg.date}T${cfg.end}:00`).getTime() } catch { return 0 } })()
      if (now < endTs) return 'EN COURS 🔴'
      return 'Terminé'
    }
    const h = Math.floor(diff / 3.6e6), m = Math.floor((diff % 3.6e6) / 6e4), s = Math.floor((diff % 6e4) / 1e3)
    if (h >= 24) return `dans ${Math.floor(h / 24)} j ${h % 24} h`
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })()
  const live = diff <= 0 && now < ((() => { try { return new Date(`${cfg.date}T${cfg.end}:00`).getTime() } catch { return 0 } })())

  const copy = async () => { try { await navigator.clipboard.writeText(consigne); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {} }

  const checklist = [
    'Notifs fiables : un Clutch reçu sonne même app fermée',
    'Aucun écran muet : chaque blocage affiche une raison',
    'Profil minimal propre (prénom, âge, photo, intention)',
    'Blocage / signalement / refus doux visibles',
    'Consentement GPS clair + lieux publics',
    'Onboarding 60 s pour les non-initiés',
    'Bots « BOT TEST » bien séparés des vraies personnes',
  ]
  const [checked, setChecked] = useState<boolean[]>([])
  useEffect(() => { try { const r = localStorage.getItem(LS_KEY + '_chk'); if (r) setChecked(JSON.parse(r)) } catch {} }, [])
  const toggle = (i: number) => setChecked(c => { const n = [...c]; n[i] = !n[i]; try { localStorage.setItem(LS_KEY + '_chk', JSON.stringify(n)) } catch {}; return n })
  const doneCount = checked.filter(Boolean).length

  const inputStyle: React.CSSProperties = { width: '100%', background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' }
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: C.salmon, letterSpacing: '.04em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro",Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '34px 18px 80px' }}>
        <div style={{ marginBottom: 6 }}>
          <a href="/hub" style={{ fontSize: 12.5, fontWeight: 700, color: C.textMid, textDecoration: 'none' }}>← Hub</a>
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 900 }}>🧪 {cfg.title}</h1>
        <p style={{ margin: '0 0 22px', fontSize: 13.5, color: C.textMid, lineHeight: 1.55 }}>
          Une <strong style={{ color: C.text }}>soirée chorégraphiée</strong> : tout le monde au même endroit, au même moment.
          La parade au piège n°1 (« tester le vide »). Règle ce qui suit, partage la consigne, regarde la densité monter.
        </p>

        {/* ── COMPTE À REBOURS + LIVE ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          <div style={{ background: live ? `${C.green}1e` : C.card, border: `1px solid ${live ? C.green : C.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.salmon, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Départ</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: live ? C.green : C.text, fontVariantNumeric: 'tabular-nums' }}>{countdown}</div>
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: C.salmon, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 6 }}>Dispo maintenant</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.orange, fontVariantNumeric: 'tabular-nums' }}>
              {liveErr ? '—' : liveCount === null ? '…' : liveCount}
              <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid }}> / {cfg.target}</span>
            </div>
            <div style={{ height: 5, background: C.cardSoft, borderRadius: 4, marginTop: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, ((liveCount ?? 0) / Math.max(1, cfg.target)) * 100)}%`, background: C.orange, borderRadius: 4, transition: 'width .5s' }} />
            </div>
          </div>
        </div>

        {/* ── RÉGLAGES ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 900, color: C.salmon, letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 14 }}>Réglages de la soirée</div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Nom du test</label>
            <input style={inputStyle} value={cfg.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={cfg.date} onChange={e => set('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Objectif (pers.)</label>
              <input type="number" min={5} max={200} style={inputStyle} value={cfg.target} onChange={e => set('target', Math.max(1, +e.target.value || 1))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>Début</label>
              <input type="time" style={inputStyle} value={cfg.start} onChange={e => set('start', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Fin</label>
              <input type="time" style={inputStyle} value={cfg.end} onChange={e => set('end', e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Lieu (zone)</label>
            <input style={inputStyle} value={cfg.place} onChange={e => set('place', e.target.value)} placeholder="Centre Lausanne" />
          </div>
          <div>
            <label style={labelStyle}>Rayon : {cfg.radius} km</label>
            <input type="range" min={1} max={8} step={1} value={cfg.radius} onChange={e => set('radius', +e.target.value)} style={{ width: '100%', accentColor: C.orange }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.textMid, marginTop: 2 }}><span>1 km (très dense)</span><span>8 km</span></div>
          </div>
        </div>

        {/* ── CONSIGNE COPIABLE ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.salmon, letterSpacing: '.04em', textTransform: 'uppercase' }}>Consigne à partager (WhatsApp)</div>
            <button onClick={copy} style={{ fontSize: 12.5, fontWeight: 800, color: copied ? C.green : C.bg, background: copied ? 'transparent' : C.orange, border: `1px solid ${copied ? C.green : C.orange}`, borderRadius: 9, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? '✓ Copié' : '📋 Copier'}</button>
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 13, lineHeight: 1.6, color: C.text, fontFamily: 'inherit', background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px' }}>{consigne}</pre>
        </div>

        {/* ── CHECKLIST AVANT ── */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: C.salmon, letterSpacing: '.04em', textTransform: 'uppercase' }}>Avant de lancer — le cycle humain qui tient</div>
            <span style={{ fontSize: 12, fontWeight: 800, color: doneCount === checklist.length ? C.green : C.textMid }}>{doneCount}/{checklist.length}</span>
          </div>
          {checklist.map((item, i) => (
            <button key={i} onClick={() => toggle(i)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '7px 0', cursor: 'pointer', fontFamily: 'inherit' }}>
              <span style={{ flexShrink: 0, width: 19, height: 19, borderRadius: 6, border: `1.5px solid ${checked[i] ? C.green : C.border}`, background: checked[i] ? C.green : 'transparent', color: C.bg, fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{checked[i] ? '✓' : ''}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: checked[i] ? C.textMid : C.text, textDecoration: checked[i] ? 'line-through' : 'none' }}>{item}</span>
            </button>
          ))}
        </div>

        {/* ── RÈGLES D'OR ── */}
        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: '.06em', marginBottom: 6 }}>LES 3 RÈGLES D'OR (challenge GPT + Grok)</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.7, color: C.text }}>
            <li><strong>Concentrer, pas disperser</strong> : 25 personnes sur 1 zone &gt; 25 sur toute la ville.</li>
            <li><strong>Zéro faux profil</strong> : que des vrais. Les bots restent en Test Lab, étiquetés.</li>
            <li><strong>On note tout en vrac</strong> après, on trie ensemble. Le vide se pardonne moins que les bugs.</li>
          </ul>
        </div>

        <p style={{ fontSize: 11, color: C.textMid, textAlign: 'center', marginTop: 22 }}>Clutch Test v1 · lecture seule · aucune donnée modifiée</p>
      </div>
    </div>
  )
}
