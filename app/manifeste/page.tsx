'use client'
// ─────────────────────────────────────────────────────────────────────────────
// MANIFESTE / ADN — /manifeste. Rassemblement des slogans & phrases clés qui
// définissent Clutch (ce qu'on EST, ce qu'on n'est PAS). Charte Mel. Pour le pitch.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'

const M = {
  studio: '#F4F1F4', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink70: '#555', ink40: '#9a9a9a', border: '#E6E3E6',
}
const LINKS: [string, string][] = [
  ['/manifeste', '✨ ADN'], ['/hub', '🏠 Accueil'], ['/clutchlive', '⚡ Live'],
  ['/clutchnight', '🌙 Night'], ['/tutoriel', '📖 Tutoriel'], ['/vision2', '📓 Vision 2'],
]

const SECTIONS = [
  {
    h: '🚫 Ce qu\'on n\'est PAS', color: M.pink, items: [
      'Pas une app de rencontre — une app pour se RENCONTRER. En vrai.',
      'Pas de match, pas de swipe, pas de like. Jamais.',
      'On ne te fait pas voir des profils à l\'infini. On te fait sortir.',
      'Le concurrent, ce n\'est ni Tinder ni Instagram : c\'est le canapé.',
    ],
  },
  {
    h: '✅ Ce qu\'on EST', color: M.green, items: [
      'Une app anti-canapé : « je devrais sortir » → vraie rencontre dans les 2 heures.',
      'Un système d\'opportunités sociales en temps réel.',
      'Accro à la vraie vie, pas à l\'app.',
      'Une app qu\'on est fier de FERMER (tu l\'ouvres, tu décides, tu y vas).',
    ],
  },
  {
    h: '💬 Les slogans', color: M.plum, items: [
      'Rencontre-toi en vrai.',
      'La ville s\'allume autour de toi.',
      'Ça bouge ce soir. Sors.',
      'Il peut se passer quelque chose.',
      'Quand quelqu\'un dit oui, il vient.',
    ],
  },
  {
    h: '⚡ Ce qui nous rend uniques', color: M.pink, items: [
      'Le vocabulaire est la promesse : Clutch · Verrou · Rendez-vous.',
      'La fiabilité, c\'est notre fossé : « sur Clutch, quand on dit oui, on vient. »',
      'Le produit vit dans la NOTIFICATION, pas dans le temps d\'écran.',
      'Les femmes au centre : on réduit le coût psychologique de dire oui.',
      'La fiabilité se mérite — elle ne s\'achète jamais.',
    ],
  },
]

export default function Manifeste() {
  return (
    <div style={{ minHeight: '100vh', background: M.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '14px 16px', justifyContent: 'center', background: '#fff', borderBottom: `1px solid ${M.border}` }}>
        {LINKS.map(([href, label], k) => (
          <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: k === 0 ? 800 : 600, textDecoration: 'none', color: k === 0 ? '#fff' : M.plum, background: k === 0 ? M.plum : '#fff', border: `1px solid ${k === 0 ? M.plum : M.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{k === 0 ? ' · ici' : ''}</a>
        ))}
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '34px 18px 70px' }}>
        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: M.pink, letterSpacing: '.2em' }}>L'ADN DE</div>
          <div style={{ fontSize: 46, fontWeight: 900, color: M.plum, letterSpacing: '-1.5px' }}>CLUTCH</div>
        </div>
        <div style={{ background: '#fff', border: `1px solid ${M.border}`, borderLeft: `4px solid ${M.pink}`, borderRadius: 16, padding: '20px 22px', marginBottom: 26, boxShadow: '0 6px 24px rgba(83,41,67,.08)' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: M.ink, lineHeight: 1.5 }}>
            « Clutch n'est pas une app de rencontre. C'est une app <span style={{ color: M.pink }}>anti-canapé</span> : elle transforme « je devrais sortir » en <span style={{ color: M.plum }}>vraie rencontre, dans les deux heures</span>. »
          </div>
        </div>

        {/* LA GRANDE IDÉE — le temps humain disponible */}
        <div style={{ background: '#fff', border: `1px solid ${M.border}`, borderLeft: `4px solid ${M.plum}`, borderRadius: 16, padding: '18px 20px', marginBottom: 26 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: M.plum, letterSpacing: '.08em', marginBottom: 10 }}>🕰️ LA GRANDE IDÉE — LE TEMPS HUMAIN DISPONIBLE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 14.5, color: M.ink, lineHeight: 1.5 }}>
            <div><span style={{ color: M.pink, fontWeight: 900 }}>“</span>Clutch n'est pas une app de rencontre. C'est un <b>système d'exploitation des opportunités sociales en temps réel</b> — un OS <b>anti-inertie</b>.</div>
            <div><span style={{ color: M.pink, fontWeight: 900 }}>“</span>Le carburant, ce n'est pas la photo : c'est la <b>disponibilité</b>. « Je suis libre, là, maintenant. »</div>
            <div><span style={{ color: M.pink, fontWeight: 900 }}>“</span>On ne vend pas des profils. On <b>révèle le temps humain disponible autour de toi</b> — et on le transforme en vraie rencontre.</div>
            <div><span style={{ color: M.pink, fontWeight: 900 }}>“</span>Clutch met en relation les gens selon leur <b>disponibilité réelle</b> : qui est libre, maintenant, près de toi — et prêt à se voir.</div>
          </div>
        </div>

        {/* SECTIONS */}
        {SECTIONS.map((s, i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: s.color, marginBottom: 10 }}>{s.h}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {s.items.map((it, k) => (
                <div key={k} style={{ background: '#fff', border: `1px solid ${M.border}`, borderRadius: 12, padding: '12px 15px', fontSize: 14.5, color: M.ink, lineHeight: 1.45, fontWeight: 600 }}>
                  <span style={{ color: s.color, fontWeight: 900, marginRight: 6 }}>“</span>{it}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* La phrase stratégique */}
        <div style={{ background: M.plum, color: '#fff', borderRadius: 18, padding: '24px 24px', marginTop: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: M.pink, letterSpacing: '.15em', marginBottom: 8 }}>LA PHRASE STRATÉGIQUE</div>
          <div style={{ fontSize: 16, lineHeight: 1.7, fontStyle: 'italic' }}>
            « Le produit n'est ni le matching, ni l'IA, ni les profils. C'est la transformation d'une intention sociale faible (« je devrais sortir ») en rencontre réelle dans les deux heures, avec assez de confiance pour que les femmes aient envie d'appuyer sur Disponible. Gagne cette bataille → le reste est de l'optimisation. Perds-la → aucun algorithme ne te sauve. »
          </div>
        </div>

        {/* Métrique Nord */}
        <div style={{ textAlign: 'center', marginTop: 26 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: M.ink40, letterSpacing: '.1em' }}>NOTRE MÉTRIQUE NORD</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: M.plum, marginTop: 4 }}>Rencontres réelles <span style={{ color: M.ink40 }}>÷</span> temps d'écran</div>
          <div style={{ fontSize: 12.5, color: M.ink40, marginTop: 4 }}>Aucune app de rencontre n'ose maximiser ça. Nous, oui.</div>
        </div>
      </div>
    </div>
  )
}
