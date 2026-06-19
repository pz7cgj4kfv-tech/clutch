'use client'
/**
 * CLUTCH — Landing page publique
 * v11.06-Q — redesign ultra-convaincant
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const V = 'v11.06-V'

export default function Landing() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const waitlistRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('waitlist').select('id', { count: 'exact', head: true })
      .then(({ count: c }) => { if (c != null) setCount(c) }, () => {})
  }, [])

  const scrollToWaitlist = () => {
    waitlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const join = async () => {
    if (!email.trim() || !email.includes('@')) { setErr('Email invalide'); return }
    setLoading(true); setErr('')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() })
    setLoading(false)
    if (error && error.code === '23505') { setDone(true); return }
    if (error) { setErr('Erreur — réessaie'); return }
    setDone(true)
    setCount(c => c != null ? c + 1 : null)
  }

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #2a1020;
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
          color: #f5e8de;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        input { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: .3; }
          50%       { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .anim { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .d1 { animation-delay: .05s; }
        .d2 { animation-delay: .18s; }
        .d3 { animation-delay: .32s; }
        .d4 { animation-delay: .46s; }
        .d5 { animation-delay: .60s; }

        .btn-red {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 16px 28px;
          background: #C8860A; color: #1a0a14;
          border: none; border-radius: 12px;
          font-size: 16px; font-weight: 800;
          cursor: pointer; text-decoration: none;
          transition: background .15s, transform .15s;
          letter-spacing: -.02em; line-height: 1;
          white-space: nowrap;
        }
        .btn-red:hover { background: #a06d08; transform: translateY(-1px); }
        .btn-red:active { transform: scale(.98); }

        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 16px 28px;
          background: transparent; color: #FFBF9E;
          border: 1px solid rgba(245,232,222,0.25); border-radius: 12px;
          font-size: 16px; font-weight: 700;
          cursor: pointer; text-decoration: none;
          transition: border-color .15s, transform .15s;
          letter-spacing: -.02em; line-height: 1;
          white-space: nowrap;
        }
        .btn-outline:hover { border-color: rgba(245,232,222,0.6); transform: translateY(-1px); }

        .stat-card {
          text-align: center;
          padding: 28px 20px;
          border: 1px solid rgba(255,191,158,0.08);
          border-radius: 16px;
          background: rgba(255,191,158,0.05);
        }

        .step-dot {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #C8860A;
          color: #1a0a14;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900;
          flex-shrink: 0;
        }

        .feat-card {
          padding: 20px;
          border: 1px solid rgba(255,191,158,0.08);
          border-radius: 14px;
          background: rgba(255,191,158,0.05);
          transition: border-color .2s;
        }
        .feat-card:hover { border-color: rgba(200,134,10,0.3); }

        .ticker-wrap {
          overflow: hidden;
          padding: 16px 0;
          background: rgba(255,191,158,0.05);
          border-top: 1px solid rgba(255,191,158,0.08);
          border-bottom: 1px solid rgba(255,191,158,0.08);
          white-space: nowrap;
          user-select: none;
        }
        .ticker-inner {
          display: inline-block;
          animation: ticker 24s linear infinite;
        }
        .ticker-item {
          display: inline-block;
          padding: 0 32px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(245,232,222,0.35);
        }
        .ticker-item span { color: #C8860A; margin-right: 32px; }

        .waitlist-input {
          width: 100%;
          padding: 15px 18px;
          background: rgba(255,191,158,0.07);
          border: 1px solid rgba(255,191,158,0.12);
          border-radius: 12px;
          font-size: 16px;
          color: #f5e8de;
          outline: none;
          caret-color: #C8860A;
          transition: border-color .15s;
        }
        .waitlist-input:focus { border-color: rgba(200,134,10,0.5); }
        .waitlist-input.error { border-color: #C8860A; }
        .waitlist-input::placeholder { color: rgba(245,232,222,0.3); }

        .pill-nav {
          display: inline-flex; align-items: center;
          padding: 7px 14px;
          border: 1px solid rgba(255,191,158,0.12);
          border-radius: 999px;
          font-size: 12px; font-weight: 600;
          color: rgba(245,232,222,0.5);
          text-decoration: none;
          transition: border-color .15s, color .15s;
        }
        .pill-nav:hover { border-color: rgba(200,134,10,0.4); color: #C8860A; }

        @media (min-width: 600px) {
          .hero-title { font-size: 72px !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .feat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '18px 24px',
        borderBottom: '1px solid rgba(255,191,158,0.08)',
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(42,16,32,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.06em', color: '#f5e8de' }}>
          CLUTCH<span style={{ color: '#C8860A', marginLeft: 2 }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <a href="/app2" className="btn-red" style={{ padding: '9px 16px', fontSize: 13 }}>Tester →</a>
          <a href="/hq" className="pill-nav">QG 🔒</a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: 'calc(100svh - 61px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 24px 48px',
        textAlign: 'center',
        maxWidth: 700, margin: '0 auto',
      }}>
        {/* Badge */}
        <div className="anim d1" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px',
          border: '1px solid rgba(200,134,10,0.3)',
          borderRadius: '999px',
          fontSize: 12, fontWeight: 700,
          color: '#C8860A',
          marginBottom: 32,
          letterSpacing: '.04em',
        }}>
          <span style={{ animation: 'pulse 2s ease-in-out infinite', display: 'inline-block' }}>🇨🇭</span>
          Lausanne · Beta juin 2026
        </div>

        {/* Titre */}
        <h1 className="anim d2 hero-title" style={{
          fontSize: 52, fontWeight: 900,
          letterSpacing: '-.05em', lineHeight: 1.05,
          marginBottom: 24,
        }}>
          Finis de swiper<br />
          <span style={{ color: '#C8860A' }}>dans le vide.</span>
        </h1>

        {/* Sous-titre */}
        <p className="anim d3" style={{
          fontSize: 18, color: 'rgba(245,232,222,0.6)',
          lineHeight: 1.65, marginBottom: 40,
          maxWidth: 480,
        }}>
          Clutch = un match → un RDV réel → <strong style={{ color: '#f5e8de', fontWeight: 700 }}>dans les 18h</strong>.<br />
          Ou ça expire.
        </p>

        {/* CTA buttons */}
        <div className="anim d4" style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          justifyContent: 'center', marginBottom: 20,
        }}>
          <a href="/app2" className="btn-red" style={{ fontSize: 17, padding: '17px 32px' }}>
            Tester l'app →
          </a>
          <a href="/app2?preview=onboarding" className="btn-outline" style={{ fontSize: 17, padding: '17px 32px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            Voir le flow d'inscription
          </a>
        </div>

        <div className="anim d5" style={{ fontSize: 12, color: 'rgba(245,232,222,0.3)', letterSpacing: '.03em' }}>
          Gratuit pour les femmes · Toujours
        </div>
      </section>

      {/* ── TICKER ── */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...Array(2)].map((_, i) => (
            <span key={i}>
              {['MATCH RÉEL', 'PAS DE GHOSTING', 'RDV EN 18H', 'LAUSANNE FIRST', 'ZÉRO BULLSHIT', '100% GRATUIT ♀', 'SCORE FIABILITÉ', 'BOUTON SOS', 'PROFILS VÉRIFIÉS', 'MATCH RÉEL'].map(t => (
                <span key={t} className="ticker-item">{t}<span>✦</span></span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section style={{ padding: '80px 24px', maxWidth: 900, margin: '0 auto' }}>
        <div className="stats-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr',
          gap: 16,
        }}>
          {[
            { n: '0', label: 'apps de rencontres qui forcent un vrai RDV' },
            { n: '18h', label: 'max entre le match et le rendez-vous' },
            { n: 'CHF 0', label: 'pour les femmes — toujours' },
          ].map(s => (
            <div key={s.n} className="stat-card">
              <div style={{
                fontSize: 56, fontWeight: 900,
                letterSpacing: '-.04em',
                color: '#C8860A', lineHeight: 1,
                marginBottom: 10,
              }}>{s.n}</div>
              <div style={{ fontSize: 14, color: 'rgba(245,232,222,0.5)', lineHeight: 1.5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
          color: 'rgba(245,232,222,0.3)',
          marginBottom: 40, textAlign: 'center',
        }}>Comment ça marche</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            {
              n: '01',
              title: 'Tu matches avec quelqu\'un de disponible MAINTENANT',
              desc: 'Tu indiques que tu es dispo ce soir à Lausanne. Seules les personnes disponibles maintenant apparaissent — pas de profils dormants.',
            },
            {
              n: '02',
              title: 'Tu proposes : lieu + heure + message (dans les 2h)',
              desc: 'Tu choisis un endroit réel. Tu envoies une proposition concrète. Pas de "on verra". Dans les 2h, c\'est confirmé ou expiré.',
            },
            {
              n: '03',
              title: 'Tu y vas — score de fiabilité si tu ne viens pas',
              desc: 'Le Verrou se referme. RDV réel dans les 18h. Si tu ghostes, ton score de fiabilité chute. Le respect, c\'est un feature.',
            },
          ].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{ position: 'relative' }}>
                <div className="step-dot">{s.n}</div>
                {i < 2 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    width: 1, height: 32,
                    background: 'linear-gradient(to bottom, rgba(200,134,10,0.4), transparent)',
                    marginTop: 0,
                  }}/>
                )}
              </div>
              <div style={{ paddingTop: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 6, letterSpacing: '-.02em', lineHeight: 1.3 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'rgba(245,232,222,0.5)', lineHeight: 1.65 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: 900, margin: '0 auto' }}>
        <div style={{
          fontSize: 11, fontWeight: 700,
          letterSpacing: '.14em', textTransform: 'uppercase',
          color: 'rgba(245,232,222,0.3)',
          marginBottom: 32, textAlign: 'center',
        }}>Ce qui rend Clutch différent</div>

        <div className="feat-grid" style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 12,
        }}>
          {[
            { icon: '🔒', title: 'Profils certifiés', desc: 'Score de fiabilité public. Ghosting = pénalité réelle.' },
            { icon: '⚡', title: 'Disponible maintenant', desc: 'Seules les personnes dispo ce soir apparaissent.' },
            { icon: '🎯', title: 'Score de compatibilité', desc: 'Pas de scroll infini. Des suggestions pertinentes.' },
            { icon: '🚨', title: 'Bouton SOS', desc: 'Un contact reçoit ta position en un tap.' },
            { icon: '📅', title: 'Événements Lausanne', desc: 'Concerts, bars, expos — RDV avec contexte.' },
            { icon: '♀', title: 'Gratuit pour les femmes', desc: 'Toujours. Par choix éthique, pas marketing.' },
          ].map(f => (
            <div key={f.title} className="feat-card">
              <div style={{ fontSize: 22, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 4, letterSpacing: '-.02em' }}>{f.title}</div>
              <div style={{ fontSize: 12, color: 'rgba(245,232,222,0.45)', lineHeight: 1.55 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WAITLIST ── */}
      <section ref={waitlistRef} style={{
        padding: '80px 24px',
        background: 'rgba(20,8,16,0.7)',
        borderTop: '1px solid rgba(255,191,158,0.08)',
        borderBottom: '1px solid rgba(255,191,158,0.08)',
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-.04em', marginBottom: 10, lineHeight: 1.1 }}>
            Sois parmi les premiers<br />à <span style={{ color: '#C8860A' }}>Lausanne</span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(245,232,222,0.5)', marginBottom: 32, lineHeight: 1.6 }}>
            On ouvre la beta bientôt. Laisse ton email,<br />on te contacte dès que c'est live.
            {count != null && (
              <span style={{ display: 'block', marginTop: 8, color: 'rgba(245,232,222,0.3)', fontSize: 12 }}>
                <span style={{ animation: 'blink 2s ease-in-out infinite', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#22c55e', marginRight: 6, verticalAlign: 'middle' }}/>
                {count} personne{count !== 1 ? 's' : ''} déjà inscrite{count !== 1 ? 's' : ''}
              </span>
            )}
          </p>

          {done ? (
            <div style={{
              background: 'rgba(34,197,94,0.08)',
              border: '1px solid rgba(34,197,94,0.25)',
              borderRadius: 16, padding: '28px 24px',
            }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#22c55e', marginBottom: 6 }}>Tu es sur la liste !</div>
              <div style={{ fontSize: 13, color: 'rgba(245,232,222,0.5)' }}>
                On te contacte dès que c'est live. En attendant —
              </div>
              <a href="/app2" className="btn-red" style={{ display: 'inline-flex', marginTop: 16, fontSize: 14 }}>
                Tester la démo →
              </a>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErr('') }}
                  onKeyDown={e => e.key === 'Enter' && join()}
                  placeholder="ton@email.com"
                  className={`waitlist-input${err ? ' error' : ''}`}
                  style={{ flex: 1, minWidth: 220 }}
                />
                <button
                  className="btn-red"
                  onClick={join}
                  disabled={loading}
                  style={{ opacity: loading ? .6 : 1, cursor: loading ? 'default' : 'pointer', width: 'auto', padding: '15px 24px' }}
                >
                  {loading ? '…' : 'Je veux accès'}
                </button>
              </div>
              {err && <div style={{ fontSize: 12, color: '#FFBF9E', textAlign: 'left' }}>{err}</div>}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '28px 24px',
        borderTop: '1px solid rgba(255,191,158,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-.04em', color: 'rgba(245,232,222,0.4)' }}>
          CLUTCH<span style={{ color: '#C8860A' }}>.</span>
        </div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {[
            { href: '/app2', label: 'App' },
            { href: '/privacy', label: 'Confidentialité' },
            { href: '/terms', label: 'CGU' },
            { href: 'mailto:david.saugy@gmail.com', label: 'Contact' },
            { href: '/hq', label: 'QG 🔒' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{ fontSize: 12, color: 'rgba(245,232,222,0.3)', textDecoration: 'none' }}
              onMouseOver={e => (e.currentTarget.style.color = 'rgba(245,232,222,0.7)')}
              onMouseOut={e => (e.currentTarget.style.color = 'rgba(245,232,222,0.3)')}
            >{l.label}</a>
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(245,232,222,0.2)' }}>
          Construit à Lausanne 🇨🇭 · 2026 · {V}
        </div>
      </footer>
    </>
  )
}
