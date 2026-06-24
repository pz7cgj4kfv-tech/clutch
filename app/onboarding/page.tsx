'use client'
// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING — /onboarding. La vraie INSCRIPTION (≠ tutoriel = aide). Reflète le
// flow existant de l'app : splash → prénom → genre → âge → photo → intérêts →
// bienvenue. Cadre TÉLÉPHONE fixe. Démo (rien n'est enregistré).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const C = {
  studio: '#E9E6EE', bg: '#2a1020', card: 'rgba(255,255,255,0.06)', cream2: '#f5e8de',
  orange: '#E27C00', salmon: '#FFBF9E', dim: 'rgba(245,232,222,0.6)', border: 'rgba(245,232,222,0.22)',
}
const LINKS: [string, string][] = [
  ['/onboarding', '🚀 Onboarding (inscription)'], ['/tutoriel', '📖 Tutoriel'], ['/clutchlive', '⚡ Clutch Live'],
  ['/clutchnight', '🌙 Night'], ['/eventsmap', '🗺️ Events'], ['/vision2', '📖 Vision 2'],
]
const INTERESTS = ['Café', 'Jazz', 'Randonnée', 'Yoga', 'Cinéma', 'Cuisine', 'Voyage', 'Art', 'Musique', 'Sport', 'Lecture', 'Photo', 'Danse', 'Nature', 'Vin', 'Théâtre']

function Phone({ children }: any) {
  return (
    <div style={{ width: 384, maxWidth: '94vw', height: 800, maxHeight: '90vh', background: '#0b0b0d', borderRadius: 46, padding: 12, boxShadow: '0 30px 80px rgba(0,0,0,.35)', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: `radial-gradient(120% 80% at 50% 0%, #3a1830, ${C.bg} 60%)`, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 30, display: 'grid', placeItems: 'center', flexShrink: 0 }}><div style={{ width: 110, height: 22, background: '#0b0b0d', borderRadius: 14 }} /></div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any, display: 'flex', flexDirection: 'column' }}>{children}</div>
      </div>
    </div>
  )
}

const STEPS = ['Prénom', 'Genre', 'Âge', 'Photo', 'Intérêts']

export default function Onboarding() {
  const [step, setStep] = useState(0) // 0 = splash, 1..5 = étapes, 6 = bienvenue
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [age, setAge] = useState(27)
  const [ints, setInts] = useState<string[]>([])

  const Btn = ({ onClick, children, primary, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} style={{ width: '100%', padding: '13px', borderRadius: 14, fontSize: 15, fontWeight: 800, cursor: disabled ? 'default' : 'pointer', border: primary ? 'none' : `1px solid ${C.border}`, background: primary ? (disabled ? 'rgba(226,124,0,.4)' : C.orange) : 'transparent', color: primary ? '#fff' : C.cream2, marginTop: 10 }}>{children}</button>
  )
  const Title = ({ k, children }: any) => <div style={{ fontSize: 22, fontWeight: 900, color: C.cream2, marginBottom: 14, letterSpacing: '-.4px' }}>{children}</div>

  return (
    <div style={{ minHeight: '100vh', background: C.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '14px 16px', justifyContent: 'center' }}>
        {LINKS.map(([href, label], k) => (
          <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: k === 0 ? 800 : 600, textDecoration: 'none', color: k === 0 ? '#fff' : '#2a1020', background: k === 0 ? C.orange : '#fff', border: `1px solid ${k === 0 ? C.orange : 'rgba(42,16,32,.12)'}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{k === 0 ? ' · ici' : ''}</a>
        ))}
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 40px' }}>
        <Phone>
          {/* progress (sauf splash & bienvenue) */}
          {step >= 1 && step <= 5 && (
            <div style={{ padding: '4px 20px 0' }}>
              <div style={{ display: 'flex', gap: 5 }}>{STEPS.map((_, k) => <div key={k} style={{ flex: 1, height: 4, borderRadius: 3, background: k < step ? C.orange : 'rgba(245,232,222,.2)' }} />)}</div>
              <div style={{ fontSize: 11, color: C.dim, marginTop: 7 }}>Étape {step} / 5 · {STEPS[step - 1]}</div>
            </div>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '18px 22px 24px' }}>
            {step === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 40, fontWeight: 900, color: C.orange, letterSpacing: '-1.5px' }}>CLUTCH</div>
                <div style={{ fontSize: 15, color: C.salmon, fontWeight: 700, marginTop: 4 }}>Rencontre-toi en vrai.</div>
                <div style={{ fontSize: 13, color: C.dim, marginTop: 10, lineHeight: 1.6 }}>Spontané, en sécurité, dans les deux heures. Pas de swipe — des vraies rencontres.</div>
                <div style={{ marginTop: 28 }}>
                  <Btn primary onClick={() => setStep(1)}>Créer un compte</Btn>
                  <Btn onClick={() => setStep(1)}>J'ai déjà un compte</Btn>
                </div>
              </div>
            )}

            {step === 1 && (<>
              <Title>Comment tu t'appelles ?</Title>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Ton prénom" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', borderRadius: 13, border: `1.5px solid ${C.border}`, background: C.card, color: C.cream2, fontSize: 16, outline: 'none' }} />
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 8 }}>C'est ce que les autres verront. Tu peux mettre juste ton prénom.</div>
              <div style={{ flex: 1 }} />
              <Btn primary disabled={!name.trim()} onClick={() => setStep(2)}>Continuer</Btn>
            </>)}

            {step === 2 && (<>
              <Title>Tu es… ?</Title>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['Femme', '♀'], ['Homme', '♂'], ['Autre', '✦']].map(([g, e]) => (
                  <button key={g} onClick={() => setGender(g)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 13, cursor: 'pointer', border: `1.5px solid ${gender === g ? C.orange : C.border}`, background: gender === g ? `${C.orange}1e` : C.card, color: C.cream2, fontSize: 15, fontWeight: 700 }}><span style={{ fontSize: 20 }}>{e}</span>{g}</button>
                ))}
              </div>
              <div style={{ flex: 1 }} />
              <Btn primary disabled={!gender} onClick={() => setStep(3)}>Continuer</Btn>
            </>)}

            {step === 3 && (<>
              <Title>Ton âge</Title>
              <div style={{ textAlign: 'center', fontSize: 52, fontWeight: 900, color: C.orange }}>{age}</div>
              <input type="range" min={18} max={70} value={age} onChange={e => setAge(parseInt(e.target.value))} style={{ width: '100%', accentColor: C.orange, marginTop: 10 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim }}><span>18</span><span>70</span></div>
              <div style={{ flex: 1 }} />
              <Btn primary onClick={() => setStep(4)}>Continuer</Btn>
            </>)}

            {step === 4 && (<>
              <Title>Une photo de toi</Title>
              <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', border: `2px dashed ${C.border}`, display: 'grid', placeItems: 'center', background: C.card }}>
                  <div style={{ textAlign: 'center', color: C.dim }}><div style={{ fontSize: 34 }}>📷</div><div style={{ fontSize: 12, marginTop: 4 }}>Ajouter</div></div>
                </div>
                <div style={{ fontSize: 11.5, color: C.dim, marginTop: 14, textAlign: 'center', maxWidth: 240 }}>Un vrai visage met en confiance. Tu pourras la certifier par selfie plus tard.</div>
              </div>
              <Btn primary onClick={() => setStep(5)}>Continuer</Btn>
              <Btn onClick={() => setStep(5)}>Plus tard</Btn>
            </>)}

            {step === 5 && (<>
              <Title>Tes centres d'intérêt</Title>
              <div style={{ fontSize: 11.5, color: C.dim, marginBottom: 12 }}>Choisis-en quelques-uns. Ils servent à te proposer les bonnes rencontres.</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INTERESTS.map(it => { const on = ints.includes(it); return (
                  <button key={it} onClick={() => setInts(on ? ints.filter(x => x !== it) : [...ints, it])} style={{ fontSize: 13, fontWeight: 700, padding: '7px 13px', borderRadius: 18, cursor: 'pointer', border: `1.5px solid ${on ? C.orange : C.border}`, background: on ? `${C.orange}22` : 'transparent', color: on ? C.salmon : C.cream2 }}>{on && '✓ '}{it}</button>
                ) })}
              </div>
              <div style={{ flex: 1 }} />
              <Btn primary disabled={ints.length === 0} onClick={() => setStep(6)}>Terminer</Btn>
            </>)}

            {step === 6 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
                <div style={{ fontSize: 46 }}>🎉</div>
                <div style={{ fontSize: 24, fontWeight: 900, color: C.cream2, marginTop: 8 }}>Bienvenue{name ? `, ${name}` : ''} !</div>
                <div style={{ fontSize: 13.5, color: C.dim, marginTop: 10, lineHeight: 1.6 }}>Ton profil est prêt. Mets-toi disponible quand tu veux, et regarde la ville s'allumer autour de toi.</div>
                <div style={{ marginTop: 26 }}>
                  <a href="/clutchlive" style={{ display: 'block', textDecoration: 'none' }}><Btn primary>Découvrir Clutch Live ⚡</Btn></a>
                  <Btn onClick={() => { setStep(0); setName(''); setGender(''); setInts([]) }}>Recommencer la démo</Btn>
                </div>
              </div>
            )}
          </div>
        </Phone>
      </div>
    </div>
  )
}
