'use client'
import { useState, useEffect } from 'react'

const PWD = 'md'

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)
  const check = () => {
    if (val.toLowerCase() === PWD) { try { localStorage.setItem('hq_ok', '1') } catch(e) {}; onUnlock() }
    else { setErr(true); setVal(''); setTimeout(() => setErr(false), 1000) }
  }
  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.05em', color:'#F5F5F5', marginBottom:32 }}>CLU<span style={{ color:'#ef4444' }}>TCH</span> <span style={{ fontSize:14, color:'#555', fontWeight:500 }}>QG</span></div>
        <input
          autoFocus
          type="password"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="mot de passe"
          style={{ background: err ? '#450a0a' : '#141414', border:`1px solid ${err ? '#ef4444' : '#333'}`, borderRadius:12, padding:'12px 20px', fontSize:16, color:'#F5F5F5', outline:'none', textAlign:'center', width:200, fontFamily:'inherit', transition:'all 0.2s' }}
        />
        <div style={{ marginTop:16 }}>
          <button onClick={check} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:10, padding:'10px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Entrer</button>
        </div>
        {err && <div style={{ color:'#f87171', fontSize:12, marginTop:12 }}>Code incorrect</div>}
      </div>
    </div>
  )
}

const C = {
  bg: '#0A0A0A', card: '#141414', border: '#222', text: '#F5F5F5',
  textMid: '#999', primary: '#ef4444', primaryLight: '#fca5a5',
  sage: '#22c55e', gold: '#f59e0b', purple: '#8b5cf6',
}

type Status = 'done' | 'in-progress' | 'todo' | 'blocked'
type Severity = 'critical' | 'high' | 'medium' | 'low'

const statusStyle: Record<Status, { bg: string; color: string; label: string }> = {
  'done':        { bg: '#14532d', color: '#4ade80', label: '✅ Fait' },
  'in-progress': { bg: '#1c1917', color: '#f59e0b', label: '🔄 En cours' },
  'todo':        { bg: '#1e1b4b', color: '#818cf8', label: '📋 À faire' },
  'blocked':     { bg: '#450a0a', color: '#f87171', label: '🚫 Bloqué' },
}

const severityStyle: Record<Severity, { bg: string; color: string; label: string }> = {
  'critical': { bg: '#450a0a', color: '#f87171', label: '🔴 Critique' },
  'high':     { bg: '#431407', color: '#fb923c', label: '🟠 Haute' },
  'medium':   { bg: '#1c1917', color: '#f59e0b', label: '🟡 Moyenne' },
  'low':      { bg: '#0f172a', color: '#60a5fa', label: '🔵 Faible' },
}

const tasks: { cat: string; emoji: string; items: { label: string; status: Status; note?: string }[] }[] = [
  {
    cat: 'App Web — Core', emoji: '📱',
    items: [
      { label: 'Login / Logout / Register', status: 'done' },
      { label: 'Onboarding (nom, genre, âge, intérêts)', status: 'done' },
      { label: 'Discover — liste des profils', status: 'done' },
      { label: 'Scroll iOS Safari', status: 'done', note: 'v06.06-F' },
      { label: 'Double scroll iOS supprimé', status: 'done', note: 'v05.06-U' },
      { label: 'Login → Discover direct (pas onboarding)', status: 'done', note: 'v06.06-J' },
      { label: 'Envoyer un Clutch', status: 'done' },
      { label: 'Recevoir un Clutch', status: 'done' },
      { label: 'Expiry clutches visible dans Inbox', status: 'done', note: 'v05.06-U' },
      { label: 'Upload photo profil (galerie + caméra)', status: 'done', note: 'v05.06-V' },
      { label: 'Modifier son profil (bio, job, quartier)', status: 'done', note: 'v05.06-U' },
      { label: 'Recadrage photo (haut/centre/bas)', status: 'done', note: 'v05.06-V' },
      { label: 'Counter-proposal (contre-offre)', status: 'todo', note: 'Dans démo seulement' },
      { label: 'Expiry automatique 2h (Edge Function)', status: 'done', note: 'v06.06-AM — pg_cron toutes les 15min' },
      { label: 'Multiple photos profil', status: 'todo' },
    ]
  },
  {
    cat: 'Géolocalisation', emoji: '📍',
    items: [
      { label: 'Demande permission GPS', status: 'done', note: 'v05.06-U' },
      { label: 'Stocker lat/lng en base', status: 'done', note: 'v05.06-U + SQL' },
      { label: 'Distance affichée sur les cartes profil', status: 'done', note: 'v05.06-U' },
      { label: 'Mode dispo avec coords GPS réelles', status: 'done', note: 'v05.06-U' },
      { label: 'Filtre "dans X km" sur Discover', status: 'todo' },
    ]
  },
  {
    cat: 'Fiabilité & Feedback', emoji: '⭐',
    items: [
      { label: 'Score fiabilité affiché (étoiles ★)', status: 'done', note: 'v05.06-T' },
      { label: 'Feedback post-RDV (super/ok/lapin/fantôme)', status: 'done', note: 'v05.06-U' },
      { label: 'Score dynamique après RDV (+3/-15)', status: 'done', note: 'v05.06-U' },
      { label: 'Historique RDV sur profil', status: 'todo' },
      { label: 'Badge automatique selon score', status: 'todo' },
    ]
  },
  {
    cat: 'Sécurité', emoji: '🛡️',
    items: [
      { label: 'Bouton SOS UI + GPS + contacts confiance', status: 'done' },
      { label: 'Badges sécurité lieux (🛡/👁/⚠️)', status: 'done', note: 'v05.06-T' },
      { label: 'Report un profil (UI)', status: 'done', note: 'bouton 🚩 dans profil détail' },
      { label: 'Report → action admin', status: 'done', note: 'v06.06-AM — onglet Signalements + bannissement' },
      { label: 'Block un utilisateur', status: 'done', note: 'v06.06-AM — blocks table + filtre Discover' },
      { label: 'Modération admin', status: 'done', note: 'v06.06-AM — événements + signalements + ban' },
      { label: 'CGU & Charte éthique', status: 'done', note: '/legal' },
    ]
  },
  {
    cat: 'Événements', emoji: '🗓️',
    items: [
      { label: 'Liste événements depuis Supabase', status: 'done' },
      { label: 'Création événement par user', status: 'done' },
      { label: 'Type fixe 📌 / flexible 🔄', status: 'done', note: 'v05.06-T' },
      { label: 'Badge 🗓 sur profil si event actif', status: 'done', note: 'v05.06-T' },
      { label: 'Modération événements (admin)', status: 'done' },
      { label: 'Scroll CreateEvent iOS', status: 'done', note: 'v05.06-U' },
      { label: 'Sélecteur date/heure séparés', status: 'done', note: 'v05.06-U' },
      { label: 'Inscription à un événement', status: 'todo' },
    ]
  },
  {
    cat: 'Recherche de lieux', emoji: '📍',
    items: [
      { label: '45+ lieux Lausanne curatés', status: 'done', note: 'v05.06-T' },
      { label: 'Recherche OpenStreetMap live', status: 'done', note: 'v05.06-T' },
      { label: 'Fusion résultats locaux + OSM', status: 'done', note: 'v05.06-T' },
      { label: 'Badges sécurité par lieu', status: 'done', note: 'v05.06-T' },
    ]
  },
  {
    cat: 'Premium & Paiement', emoji: '💎',
    items: [
      { label: 'UI Premium', status: 'done' },
      { label: 'Stripe integration', status: 'done', note: 'v06.06-AL — CHF 19.90/mois, webhook complet' },
      { label: 'Gate premium (clutches illimités)', status: 'done', note: 'v06.06-AM — 1/j free, 5/j premium' },
      { label: 'Gratuit pour les femmes', status: 'done', note: 'v06.06-AL — create-checkout + MSG_LIMIT' },
      { label: 'Dashboard admin revenus', status: 'todo' },
    ]
  },
  {
    cat: 'Infrastructure', emoji: '⚙️',
    items: [
      { label: 'Déploiement GitHub Pages auto', status: 'done' },
      { label: 'Versioning DD.MM-Lettre (suisse)', status: 'done', note: 'v05.06-U' },
      { label: 'Supabase Auth', status: 'done' },
      { label: 'Supabase Realtime (notifs)', status: 'done' },
      { label: 'Supabase Storage avatars (policies)', status: 'done', note: 'v05.06-V' },
      { label: 'Colonnes lat/lng profils', status: 'done', note: 'SQL v05.06-U' },
      { label: 'Colonnes flexible + has_event', status: 'done', note: 'SQL v05.06-T' },
      { label: 'Profils de test en base (7)', status: 'done' },
      { label: 'Notifications push (VAPID Web Push)', status: 'done', note: 'v06.06-AK — SW + VAPID + push in-app' },
      { label: 'App mobile iOS (React Native)', status: 'todo', note: 'Phase 2' },
      { label: 'App mobile Android', status: 'todo', note: 'Phase 2' },
    ]
  },
  {
    cat: 'Marketing & Lancement', emoji: '🚀',
    items: [
      { label: 'Landing page', status: 'done' },
      { label: 'Démo interactive', status: 'done' },
      { label: 'Flyer A4 print-ready', status: 'done', note: 'v05.06-K' },
      { label: 'Waitlist Supabase', status: 'done' },
      { label: 'Flyer en ligne (/flyer)', status: 'done' },
      { label: 'Page QG équipe (/hq)', status: 'done' },
      { label: 'Legal + Charte éthique complète', status: 'done', note: '/legal' },
    ]
  },
]

const audit: { cat: string; emoji: string; items: { label: string; severity: Severity; note?: string; fix?: string }[] }[] = [
  {
    cat: 'UX & Ergonomie', emoji: '🎨',
    items: [
      { label: 'Pas de retour visuel si clutch déjà envoyé à ce profil', severity: 'high', fix: 'Griser le bouton "Clutcher" si clutch en cours' },
      { label: 'Aucune confirmation avant d\'envoyer un clutch', severity: 'medium', fix: 'Modal de confirmation avec aperçu lieu/heure' },
      { label: 'Pas de message si Discover est vide', severity: 'medium', fix: '"Personne de disponible maintenant — reviens plus tard"' },
      { label: 'TabBar coupée par Safari iOS → fixed safe-area', severity: 'low', note: 'Réglé v05.06-V' },
      { label: 'Double scroll iOS (externe + interne)', severity: 'medium', note: 'Réglé v05.06-U' },
    ]
  },
  {
    cat: 'Bugs connus', emoji: '🐛',
    items: [
      { label: 'Expiry clutches jamais déclenchée automatiquement', severity: 'critical', fix: 'Edge Function Supabase avec cron 15min' },
      { label: 'Counter-proposal absent de l\'app réelle', severity: 'high', fix: 'Porter depuis la démo' },
      { label: 'Photo : recadrage côté Supabase pas persisté entre sessions', severity: 'medium', note: 'Nécessite colonne photo_pos en base' },
      { label: 'SOS — pas d\'envoi réel (position GPS seulement)', severity: 'high', fix: 'SMS/email via Supabase Edge Function' },
      { label: 'Discover : profils sans photo_pos → objectPosition par défaut', severity: 'low', fix: 'SQL: ALTER TABLE profiles ADD COLUMN photo_pos text DEFAULT \'center top\'' },
    ]
  },
  {
    cat: 'Sécurité & Données', emoji: '🔒',
    items: [
      { label: 'Rate-limiting clutches (max 3/jour)', severity: 'medium', note: 'Partiellement fait côté client' },
      { label: 'Report/Block non implémentés côté admin', severity: 'critical', fix: 'Table reports + action dans /admin' },
      { label: 'Photos profil — aucune vérification contenu', severity: 'high', fix: 'Modération manuelle bêta' },
      { label: 'Pas de modération bio/job', severity: 'medium', fix: 'Liste mots bannis étendue' },
    ]
  },
  {
    cat: 'Performance & Tech', emoji: '⚡',
    items: [
      { label: 'Discover — charge tous les profils sans limit', severity: 'medium', fix: 'Limit 20 + pagination' },
      { label: 'Pas de skeleton loader pendant fetch Discover', severity: 'low', fix: 'Cards grises animées' },
      { label: 'Images Unsplash profils test — lentes en 3G', severity: 'low', fix: 'Ajouter &q=60&w=400 aux URLs' },
    ]
  },
  {
    cat: 'Avant le lancement beta', emoji: '🚀',
    items: [
      { label: 'CGU & Charte éthique', severity: 'high', note: '✅ Réglé — /legal complet (LPD suisse)' },
      { label: 'Analytics visiteurs (démo / app)', severity: 'medium', fix: 'Plausible ou Vercel Analytics (gratuit)' },
      { label: 'Favicon custom Clutch', severity: 'low', fix: 'Icône ✦ rose en favicon' },
      { label: 'Email confirmation waitlist', severity: 'medium', fix: 'Supabase Edge Function → Resend' },
    ]
  },
]

const design: { cat: string; emoji: string; items: { label: string; status: 'done'|'todo'|'review'; note?: string }[] }[] = [
  {
    cat: 'Identité visuelle', emoji: '🎨',
    items: [
      { label: 'Palette couleurs : rose #C4748A, beige #FDFAF7, sauge #7A9E8A', status: 'done' },
      { label: 'Typographie : SF Pro (system font iOS/macOS)', status: 'done', note: '-apple-system, BlinkMacSystemFont' },
      { label: 'Logo CLUTCH — gras, lettrages serrés', status: 'done' },
      { label: 'Logo vectoriel .svg exportable', status: 'todo' },
      { label: 'Favicon ✦ rose', status: 'todo' },
      { label: 'Guidelines brand document', status: 'todo', note: 'Pour Mel ou dev externe' },
    ]
  },
  {
    cat: 'App UI', emoji: '📱',
    items: [
      { label: 'Cards profil : photo + étoiles + tags', status: 'done' },
      { label: 'Photo recadrage haut/centre/bas', status: 'done', note: 'v05.06-V' },
      { label: 'Badges sécurité lieux 🛡/👁/⚠️', status: 'done' },
      { label: 'TabBar avec safe-area iOS', status: 'done', note: 'v05.06-V' },
      { label: 'Étoiles fiabilité ★★★★☆', status: 'done' },
      { label: 'Badge 🗓 si profil propose un event', status: 'done' },
      { label: 'Animation toggle disponibilité', status: 'done' },
      { label: 'Dark mode', status: 'todo', note: 'Phase 2' },
      { label: 'Icônes custom (vs emoji)', status: 'todo', note: 'Phase 2 — Figma' },
      { label: 'Splash screen animé', status: 'todo' },
    ]
  },
  {
    cat: 'Flyer & Print', emoji: '📄',
    items: [
      { label: 'Flyer A4 beige/rose (/flyer)', status: 'done' },
      { label: 'Version dark pour réseaux sociaux', status: 'todo' },
      { label: 'Format story Instagram (9:16)', status: 'todo' },
      { label: 'Format post carré (1:1)', status: 'todo' },
      { label: 'PDF téléchargeable', status: 'todo' },
    ]
  },
  {
    cat: 'À faire — Priorité design', emoji: '🔥',
    items: [
      { label: 'Multiple photos profil (carousel)', status: 'todo', note: 'Demandé par Mel' },
      { label: 'Onboarding : screen photo plus engageant', status: 'review', note: 'Actuellement basique' },
      { label: 'Animation Clutch envoyé (confetti ?)', status: 'todo' },
      { label: 'Empty states illustrés (Discover vide, Inbox vide)', status: 'todo' },
      { label: 'Photo profil — permettre zoom/crop dans l\'app', status: 'todo', note: 'Actuellement haut/centre/bas seulement' },
    ]
  },
]

const pages = [
  { label: '🏠 Accueil', href: '/', desc: 'Landing page publique', color: '#7A9E8A' },
  { label: '📱 App réelle', href: '/app', desc: 'App avec vrai compte', color: '#8b5cf6' },
  { label: '🎬 Démo', href: '/demo', desc: 'Demo sans compte', color: '#f59e0b' },
  { label: '📄 Flyer', href: '/flyer', desc: 'Flyer A4 imprimable', color: '#60a5fa' },
  { label: '⚙️ Admin', href: '/admin', desc: 'Modération & admin', color: '#f87171' },
  { label: '📋 Legal', href: '/legal', desc: 'CGU & confidentialité', color: '#999' },
]

const stats = {
  done: tasks.flatMap(t => t.items).filter(i => i.status === 'done').length,
  total: tasks.flatMap(t => t.items).length,
}

type Tab = 'todo' | 'audit' | 'design'

export default function HQ() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState<Tab>('todo')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [auditFilter, setAuditFilter] = useState<Severity | 'all'>('all')
  useEffect(() => { try { if (localStorage.getItem('hq_ok') === '1') setUnlocked(true) } catch(e) {} }, [])
  if (!unlocked) return <Lock onUnlock={() => setUnlocked(true)} />

  const pct = Math.round((stats.done / stats.total) * 100)

  const auditTotal = audit.flatMap(a => a.items).length
  const criticalCount = audit.flatMap(a => a.items).filter(i => i.severity === 'critical').length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em' }}>
              CLU<span style={{ color: C.primary }}>TCH</span>
            </div>
            <div style={{ background: '#1a1a1a', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: C.textMid, fontWeight: 700, letterSpacing: '0.1em' }}>
              QG · ÉQUIPE
            </div>
          </div>
          <p style={{ color: C.textMid, fontSize: 14 }}>
            Tableau de bord interne — Sébastien & Mel · Confidentiel 🔒
          </p>
          <a href="/" style={{ display:'inline-block', marginTop:8, fontSize:12, color:C.textMid, textDecoration:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 12px' }}>← Accueil</a>
        </div>

        {/* Pages rapides */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
            🔗 Toutes les pages
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {pages.map(p => (
              <a key={p.href} href={p.href} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = p.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: C.textMid }}>{p.desc}</div>
                <div style={{ fontSize: 11, color: p.color, marginTop: 6, fontFamily: 'monospace' }}>/{ p.href === '/' ? '' : p.href.slice(1) }</div>
              </a>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Avancement global</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {criticalCount > 0 && (
                <span style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>⚠️ {criticalCount} critique{criticalCount > 1 ? 's' : ''}</span>
              )}
              <span style={{ fontWeight: 900, fontSize: 28, color: pct > 60 ? C.sage : C.gold }}>{pct}%</span>
            </div>
          </div>
          <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`, borderRadius: 4, transition: 'width 0.6s' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span style={{ color: '#4ade80' }}>✅ {stats.done} faits</span>
            <span style={{ color: C.textMid }}>📋 {stats.total - stats.done} restants · {stats.total} total</span>
            <span style={{ color: '#f87171' }}>🐛 {auditTotal} points d'audit</span>
          </div>
        </div>

        {/* Sprint actuel */}
        <div style={{ background: '#0f1a0f', border: '1px solid #1a3a1a', borderRadius: 16, padding: 24, marginBottom: 32 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: '#4ade80', marginBottom: 16 }}>🏃 Sprint actuel — Semaine 1</div>
          {[
            'Géolocalisation (filtre Discover)',
            'Counter-proposal dans app réelle',
            'Expiry clutches 2h automatique',
            'Upload photo profil',
            'Multiple photos profil',
          ].map((t, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #1a3a1a' : 'none' }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid #4ade80', flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: C.text }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#111', borderRadius: 12, padding: 4, width: 'fit-content' }}>
          {([['todo', '📋 Roadmap'], ['audit', '🔍 Audit'], ['design', '🎨 Design']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t ? C.card : 'transparent',
              color: tab === t ? C.text : C.textMid,
              fontSize: 13, fontWeight: 700,
              boxShadow: tab === t ? `0 1px 4px rgba(0,0,0,0.4)` : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── ROADMAP TAB ── */}
        {tab === 'todo' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['all', 'done', 'in-progress', 'todo', 'blocked'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filter === f ? C.primary : '#1a1a1a',
                  color: filter === f ? '#fff' : C.textMid,
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
                }}>
                  {f === 'all' ? 'Tout' : statusStyle[f].label}
                </button>
              ))}
            </div>

            {tasks.map(cat => {
              const visible = cat.items.filter(i => filter === 'all' || i.status === filter)
              if (visible.length === 0) return null
              return (
                <div key={cat.cat} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {cat.emoji} {cat.cat}
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {visible.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: statusStyle[item.status].bg, color: statusStyle[item.status].color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {statusStyle[item.status].label}
                        </span>
                        <span style={{ fontSize: 14, color: item.status === 'done' ? C.textMid : C.text, textDecoration: item.status === 'done' ? 'line-through' : 'none', flex: 1 }}>
                          {item.label}
                        </span>
                        {item.note && <span style={{ fontSize: 11, color: C.textMid, flexShrink: 0 }}>{item.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── AUDIT TAB ── */}
        {tab === 'audit' && (
          <>
            <div style={{ background: '#1a0a00', border: '1px solid #3a1500', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {(['critical', 'high', 'medium', 'low'] as const).map(s => {
                const n = audit.flatMap(a => a.items).filter(i => i.severity === s).length
                return (
                  <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: severityStyle[s].bg, color: severityStyle[s].color, fontWeight: 700 }}>{severityStyle[s].label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: severityStyle[s].color }}>{n}</span>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
                <button key={f} onClick={() => setAuditFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: auditFilter === f ? C.primary : '#1a1a1a',
                  color: auditFilter === f ? '#fff' : C.textMid,
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
                }}>
                  {f === 'all' ? 'Tout' : severityStyle[f].label}
                </button>
              ))}
            </div>

            {audit.map(cat => {
              const visible = cat.items.filter(i => auditFilter === 'all' || i.severity === auditFilter)
              if (visible.length === 0) return null
              return (
                <div key={cat.cat} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {cat.emoji} {cat.cat}
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {visible.map((item, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: severityStyle[item.severity].bg, color: severityStyle[item.severity].color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1 }}>
                            {severityStyle[item.severity].label}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: C.text, marginBottom: item.fix || item.note ? 6 : 0 }}>{item.label}</div>
                            {item.note && <div style={{ fontSize: 12, color: C.textMid, fontStyle: 'italic' }}>ℹ️ {item.note}</div>}
                            {item.fix && <div style={{ fontSize: 12, color: '#60a5fa' }}>→ {item.fix}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── DESIGN TAB ── */}
        {tab === 'design' && (
          <>
            <div style={{ background: '#0a0a1a', border: '1px solid #1a1a3a', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ color: '#818cf8', fontSize: 13, fontWeight: 700 }}>🎨 Charte graphique Clutch</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { name: 'Rose primary', hex: '#C4748A' },
                  { name: 'Rose dark', hex: '#A85C72' },
                  { name: 'Beige bg', hex: '#FDFAF7' },
                  { name: 'Sauge', hex: '#7A9E8A' },
                  { name: 'Pêche', hex: '#E8A87C' },
                  { name: 'Texte', hex: '#2C1810' },
                ].map(c => (
                  <div key={c.hex} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#141414', borderRadius: 8, padding: '6px 10px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: c.hex, border: '1px solid rgba(255,255,255,0.1)' }}/>
                    <div>
                      <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: C.textMid, fontFamily: 'monospace' }}>{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: C.textMid }}>
                <span style={{ fontWeight: 700, color: C.text }}>Font :</span> -apple-system, BlinkMacSystemFont (SF Pro sur iOS · Segoe UI sur Windows)
              </div>
            </div>
            {design.map(cat => (
              <div key={cat.cat} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {cat.emoji} {cat.cat}
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  {cat.items.map((item, i) => {
                    const s = item.status === 'done' ? { bg: '#14532d', color: '#4ade80', label: '✅ Fait' }
                            : item.status === 'review' ? { bg: '#1c1917', color: '#f59e0b', label: '👀 À revoir' }
                            : { bg: '#1e1b4b', color: '#818cf8', label: '📋 À faire' }
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < cat.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: s.bg, color: s.color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
                        <span style={{ fontSize: 14, color: item.status === 'done' ? C.textMid : C.text, textDecoration: item.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{item.label}</span>
                        {item.note && <span style={{ fontSize: 11, color: C.textMid, flexShrink: 0 }}>{item.note}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        <p style={{ textAlign: 'center', color: '#333', fontSize: 12, marginTop: 40 }}>
          Clutch · QG interne · Ne pas partager · v06.06-AM
        </p>
      </div>
    </div>
  )
}
