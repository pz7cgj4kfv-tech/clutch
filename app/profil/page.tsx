'use client'
/**
 * CLUTCH — Profil v2 (prototype)
 * Philosophie Apple : simple en surface, profondeur infinie en dessous.
 * Architecture drill-down : Accueil épuré → on tape une ligne → sous-écran détaillé → back.
 * Page proto ISOLÉE (n'affecte pas /app2). Données mockées.
 */
import { useState } from 'react'
import { brand as C } from '../../lib/brand'

// ─── Données mockées ─────────────────────────────────────────────────────────
const ME = {
  name: 'David', age: 47, city: 'Lausanne',
  photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  level: 3, // 0 Nouveau · 1 Fiable · 2 Très fiable · 3 Exemplaire
  verrous: 24, sorties: 31, honored: 0.92,
  modes: ['Romantique', 'Amical', 'Pro'],
  bio: 'Ingénieur, batteur de jazz, boxeur. Spontané par nature.',
  interets: ['Jazz', 'Boxe', 'Astrophysique', 'Café', 'Cinéma', 'Rando'],
}
const LEVELS = ['Nouveau', 'Fiable', 'Très fiable', 'Exemplaire']
const SUBSCORES = [
  { label: 'Ponctualité', val: 0.95 },
  { label: 'Bienveillance', val: 0.88 },
  { label: 'Respect', val: 1.0 },
  { label: 'Régularité', val: 0.7 },
]
const CONTACTS = [
  { name: 'Camille', last: 'Café · il y a 3j', photo: 'https://i.pravatar.cc/100?img=5' },
  { name: 'Sofia', last: 'Apéro · la semaine passée', photo: 'https://i.pravatar.cc/100?img=9' },
  { name: 'Lucas', last: 'Boxe · il y a 2 sem', photo: 'https://i.pravatar.cc/100?img=12' },
]
const QUOTAS = [
  { label: 'Clutchs aujourd\'hui', used: 1, max: 3, premiumMax: 5 },
  { label: 'Super-Clutch (semaine)', used: 0, max: 0, premiumMax: 1 },
  { label: 'Events créés (mois)', used: 1, max: 1, premiumMax: 5 },
  { label: 'Favoris', used: 4, max: 5, premiumMax: 999 },
]
const PLANS = [
  { f: 'Lancer & recevoir des Clutchs', free: true, prem: true },
  { f: 'Verrou, RDV, feedback, SOS', free: true, prem: true },
  { f: 'Clutchs simultanés', free: '3', prem: '5' },
  { f: 'Choisir dans ma file', free: false, prem: true },
  { f: 'Voir qui m\'a consulté', free: false, prem: true },
  { f: 'Favoris', free: '5', prem: '∞' },
  { f: 'Super-Clutch', free: false, prem: '1 / sem' },
  { f: 'Invisible / fantôme étendu', free: false, prem: true },
  { f: 'Stats détaillées', free: false, prem: true },
]

// ─── Atomes UI ───────────────────────────────────────────────────────────────
const Gauge = ({ used, max, premiumMax }: { used: number; max: number; premiumMax: number }) => {
  const pct = max > 0 ? Math.min(1, used / max) : 0
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ height: 6, borderRadius: 99, background: C.borderSubtle, overflow: 'hidden' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.peach}, ${C.gold})`, transition: 'width .4s' }} />
      </div>
      <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 4 }}>
        {used}/{max > 0 ? max : '—'} {premiumMax > max && <span style={{ color: C.gold }}>· Premium : {premiumMax === 999 ? '∞' : premiumMax}</span>}
      </div>
    </div>
  )
}

const Bar = ({ val }: { val: number }) => (
  <div style={{ height: 8, borderRadius: 99, background: C.borderSubtle, overflow: 'hidden', flex: 1 }}>
    <div style={{ width: `${val * 100}%`, height: '100%', background: `linear-gradient(90deg, ${C.peach}, ${C.gold})` }} />
  </div>
)

const Row = ({ icon, title, sub, onClick }: { icon: string; title: string; sub?: string; onClick: () => void }) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px',
    background: C.bgCard, border: `1px solid ${C.borderSubtle}`, borderRadius: 16, cursor: 'pointer',
    color: C.textPrimary, textAlign: 'left', marginBottom: 10,
  }}>
    <span style={{ fontSize: 22, width: 28, textAlign: 'center' }}>{icon}</span>
    <span style={{ flex: 1 }}>
      <span style={{ display: 'block', fontWeight: 700, fontSize: 15 }}>{title}</span>
      {sub && <span style={{ display: 'block', fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{sub}</span>}
    </span>
    <span style={{ color: C.textTertiary, fontSize: 20 }}>›</span>
  </button>
)

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ProfilV2() {
  const [view, setView] = useState<string>('home')
  const back = () => setView('home')

  const Header = ({ title }: { title: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 16px 8px' }}>
      <button onClick={back} style={{ background: 'none', border: 'none', color: C.gold, fontSize: 26, cursor: 'pointer', lineHeight: 1 }}>‹</button>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.textPrimary }}>{title}</h2>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bgBase, display: 'flex', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: C.bgBase, color: C.textPrimary, position: 'relative', overflowX: 'hidden' }}>

        {/* ───────── HOME : simple en surface ───────── */}
        {view === 'home' && (
          <div>
            {/* Hero */}
            <div style={{ position: 'relative', height: 320 }}>
              <img src={ME.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.bgBase} 6%, transparent 60%)` }} />
              <div style={{ position: 'absolute', bottom: 16, left: 18, right: 18 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', borderRadius: 99, background: 'rgba(200,134,10,0.18)', border: `1px solid ${C.borderAccent}`, marginBottom: 10 }}>
                  <span style={{ fontSize: 13 }}>✦</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.gold }}>{LEVELS[ME.level]}</span>
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{ME.name}, {ME.age}</div>
                <div style={{ fontSize: 14, color: C.textSecondary, marginTop: 4 }}>📍 {ME.city} · {ME.modes.join(' · ')}</div>
              </div>
            </div>

            {/* Stat pills */}
            <div style={{ display: 'flex', gap: 10, padding: '4px 16px 14px' }}>
              {[
                { n: ME.verrous, l: 'Verrous' },
                { n: ME.sorties, l: 'Sorties' },
                { n: Math.round(ME.honored * 100) + '%', l: 'Honorés' },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: 'center', padding: '12px 6px', borderRadius: 14, background: C.bgCard, border: `1px solid ${C.borderSubtle}` }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: C.gold }}>{s.n}</div>
                  <div style={{ fontSize: 11, color: C.textTertiary, marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Sections — la profondeur dessous */}
            <div style={{ padding: '0 16px 40px' }}>
              <Row icon="🪪" title="Mon profil" sub="Photos, bio, intérêts, modes" onClick={() => setView('profil')} />
              <Row icon="🤝" title="Mes Contacts" sub={`${CONTACTS.length} personnes · reclutchables direct`} onClick={() => setView('contacts')} />
              <Row icon="✦" title="Fiabilité" sub={`${LEVELS[ME.level]} · 4 dimensions`} onClick={() => setView('fiabilite')} />
              <Row icon="📊" title="Mes quotas" sub="Clutchs, events, favoris" onClick={() => setView('quotas')} />
              <Row icon="👑" title="Premium" sub="Compare Free / Premium" onClick={() => setView('premium')} />
              <Row icon="🛡️" title="Sécurité" sub="SOS, contacts de confiance, invisible" onClick={() => setView('securite')} />
              <Row icon="⚙️" title="Paramètres" sub="Langue, notifs, compte, légal" onClick={() => setView('params')} />
            </div>
          </div>
        )}

        {/* ───────── MON PROFIL ───────── */}
        {view === 'profil' && (
          <div>
            <Header title="Mon profil" />
            <div style={{ padding: '8px 16px 40px' }}>
              <div style={{ fontSize: 13, color: C.textTertiary, marginBottom: 8 }}>BIO</div>
              <div style={{ padding: 14, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.borderSubtle}`, fontSize: 14, lineHeight: 1.5 }}>{ME.bio}</div>
              <div style={{ fontSize: 13, color: C.textTertiary, margin: '20px 0 8px' }}>INTÉRÊTS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ME.interets.map(i => (
                  <span key={i} style={{ padding: '7px 13px', borderRadius: 99, background: C.bgCard, border: `1px solid ${C.borderLight}`, fontSize: 13 }}>{i}</span>
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.textTertiary, margin: '20px 0 8px' }}>MODES ACTIFS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ME.modes.map(m => (
                  <span key={m} style={{ padding: '7px 13px', borderRadius: 99, background: 'rgba(200,134,10,0.15)', border: `1px solid ${C.borderAccent}`, fontSize: 13, color: C.gold, fontWeight: 600 }}>{m}</span>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 26, padding: 15, borderRadius: 14, background: C.gold, color: C.bgBase, border: 'none', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>Modifier mon profil</button>
            </div>
          </div>
        )}

        {/* ───────── CONTACTS (l'idée que tu adores) ───────── */}
        {view === 'contacts' && (
          <div>
            <Header title="Mes Contacts" />
            <div style={{ padding: '0 16px 40px' }}>
              <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, lineHeight: 1.5 }}>
                Les gens avec qui tu as déjà vécu un Verrou. Tu peux les <b style={{ color: C.gold }}>reclutcher direct</b>, n'importe où, n'importe quand — sans repasser par la carte.
              </div>
              {CONTACTS.map(c => (
                <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: C.bgCard, border: `1px solid ${C.borderSubtle}`, marginBottom: 10 }}>
                  <img src={c.photo} alt="" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: C.textTertiary }}>{c.last}</div>
                  </div>
                  <button style={{ padding: '9px 15px', borderRadius: 99, background: C.gold, color: C.bgBase, border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>Reclutcher</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───────── FIABILITÉ ───────── */}
        {view === 'fiabilite' && (
          <div>
            <Header title="Fiabilité" />
            <div style={{ padding: '0 16px 40px' }}>
              <div style={{ textAlign: 'center', padding: '14px 0 22px' }}>
                <div style={{ fontSize: 13, color: C.textTertiary }}>Ton niveau</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.gold, marginTop: 4 }}>✦ {LEVELS[ME.level]}</div>
              </div>
              {/* échelle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
                {LEVELS.map((l, i) => (
                  <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ height: 6, borderRadius: 99, background: i <= ME.level ? C.gold : C.borderSubtle }} />
                    <div style={{ fontSize: 10, color: i === ME.level ? C.gold : C.textTertiary, marginTop: 6, fontWeight: i === ME.level ? 700 : 400 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: C.textTertiary, marginBottom: 12 }}>TES 4 DIMENSIONS</div>
              {SUBSCORES.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ width: 96, fontSize: 13 }}>{s.label}</span>
                  <Bar val={s.val} />
                </div>
              ))}
              <div style={{ marginTop: 18, padding: 13, borderRadius: 12, background: C.bgSection, fontSize: 12, color: C.textSecondary, lineHeight: 1.5 }}>
                On ne montre jamais un chiffre exact — juste ton niveau. Être à l'heure et honorer tes RDV te fait monter. 🌱
              </div>
            </div>
          </div>
        )}

        {/* ───────── QUOTAS ───────── */}
        {view === 'quotas' && (
          <div>
            <Header title="Mes quotas" />
            <div style={{ padding: '0 16px 40px' }}>
              {QUOTAS.map(q => (
                <div key={q.label} style={{ padding: 14, borderRadius: 14, background: C.bgCard, border: `1px solid ${C.borderSubtle}`, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{q.label}</div>
                  <Gauge used={q.used} max={q.max} premiumMax={q.premiumMax} />
                </div>
              ))}
              <button onClick={() => setView('premium')} style={{ width: '100%', marginTop: 14, padding: 15, borderRadius: 14, background: 'rgba(200,134,10,0.15)', color: C.gold, border: `1px solid ${C.borderAccent}`, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>👑 Débloquer plus avec Premium</button>
            </div>
          </div>
        )}

        {/* ───────── PREMIUM (comparatif façon Tinder) ───────── */}
        {view === 'premium' && (
          <div>
            <Header title="Premium" />
            <div style={{ padding: '0 16px 40px' }}>
              <div style={{ textAlign: 'center', padding: '6px 0 18px' }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: C.gold }}>CHF 19.90<span style={{ fontSize: 14, color: C.textTertiary }}>/mois</span></div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 4 }}>Même prix pour tout le monde.</div>
              </div>
              <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.borderLight}` }}>
                <div style={{ display: 'flex', padding: '12px 14px', background: C.bgSection, fontSize: 12, fontWeight: 700, color: C.textTertiary }}>
                  <span style={{ flex: 1 }}>FONCTIONNALITÉ</span>
                  <span style={{ width: 56, textAlign: 'center' }}>Free</span>
                  <span style={{ width: 56, textAlign: 'center', color: C.gold }}>Premium</span>
                </div>
                {PLANS.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', fontSize: 13, background: i % 2 ? C.bgCard : 'transparent', borderTop: `1px solid ${C.borderSubtle}` }}>
                    <span style={{ flex: 1 }}>{p.f}</span>
                    <span style={{ width: 56, textAlign: 'center', color: C.textTertiary }}>{p.free === true ? '✓' : p.free === false ? '—' : p.free}</span>
                    <span style={{ width: 56, textAlign: 'center', color: C.gold, fontWeight: 700 }}>{p.prem === true ? '✓' : p.prem === false ? '—' : p.prem}</span>
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 14, background: C.gold, color: C.bgBase, border: 'none', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>Passer Premium</button>
              <div style={{ fontSize: 11, color: C.textGhost, textAlign: 'center', marginTop: 10 }}>Sécurité, SOS et le cœur de Clutch restent gratuits pour tous, toujours.</div>
            </div>
          </div>
        )}

        {/* ───────── SÉCURITÉ ───────── */}
        {view === 'securite' && (
          <div>
            <Header title="Sécurité" />
            <div style={{ padding: '0 16px 40px' }}>
              <Row icon="🆘" title="Contacts de confiance" sub="Prévenus en cas de SOS" onClick={() => {}} />
              <Row icon="🙈" title="Mode invisible" sub="Présent sans apparaître" onClick={() => {}} />
              <Row icon="🚫" title="Personnes masquées" sub="Gérer qui ne te voit plus" onClick={() => {}} />
              <Row icon="🔕" title="Rendre invisible une personne" sub="Discret, sans conflit" onClick={() => {}} />
            </div>
          </div>
        )}

        {/* ───────── PARAMÈTRES ───────── */}
        {view === 'params' && (
          <div>
            <Header title="Paramètres" />
            <div style={{ padding: '0 16px 40px' }}>
              <Row icon="🌍" title="Langue" sub="Français" onClick={() => {}} />
              <Row icon="🔔" title="Notifications" sub="Max 5 / jour" onClick={() => {}} />
              <Row icon="📜" title="Confidentialité & CGU" onClick={() => {}} />
              <Row icon="👤" title="Mon compte" onClick={() => {}} />
              <button style={{ width: '100%', marginTop: 18, padding: 14, borderRadius: 14, background: 'transparent', color: C.peach, border: `1px solid ${C.borderMedium}`, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Supprimer mon compte</button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
