'use client'
// ─────────────────────────────────────────────────────────────────────────────
// HUB — /hub. La page centrale / d'accueil de présentation : logo CLUTCH sobre +
// tous les onglets (slashs) dans l'ordre d'importance. Le point d'entrée à montrer.
// Charte Mel. Depuis l'app on pointera un lien ici (démo, pour ML).
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'

const M = {
  studio: '#F4F1F4', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink70: '#555', ink40: '#9a9a9a', border: '#E6E3E6',
}

// Ordre d'importance demandé par David
const TABS: { href: string; icon: string; t: string; d: string; group: string; accent?: string }[] = [
  { href: '/tutoriel', icon: '📖', t: 'Tutoriel', d: 'Comprendre l\'app en 5 chapitres', group: 'Produit' },
  { href: '/onboarding', icon: '🚀', t: 'Onboarding', d: 'L\'inscription, étape par étape', group: 'Produit' },
  { href: '/clutchlive', icon: '⚡', t: 'Clutch Live', d: 'La ville s\'allume autour de toi', group: 'Produit' },
  { href: '/clutchnight', icon: '🌙', t: 'Clutch Night', d: 'Le mode sorties, le soir', group: 'Produit' },
  { href: '/animation', icon: '✨', t: 'Animation', d: 'Le labo des animations', group: 'Coulisses' },
  { href: '/sim', icon: '🧪', t: 'Simulateur', d: 'L\'algo, de 5 à 50 000 personnes', group: 'Coulisses' },
  { href: '/cockpit', icon: '🛰️', t: 'Cockpit', d: 'Le centre de contrôle de la dynamique', group: 'Coulisses' },
  { href: '/vision', icon: '🧭', t: 'Vision · le Graal', d: 'La stratégie et la philosophie', group: 'Docs' },
  { href: '/vision2', icon: '📓', t: 'Vision 2', d: 'Toutes les idées, en entier', group: 'Docs' },
  { href: '/confidentialite', icon: '🔒', t: 'Confidentialité', d: 'Le contrat (NDA) à signer', group: 'Docs', accent: M.green },
  { href: '/hq', icon: '🗄️', t: 'Archives · QG', d: 'Anciennes versions & QG interne', group: 'Archives' },
]
const GROUPS = ['Produit', 'Coulisses', 'Docs', 'Archives']

export default function Hub() {
  return (
    <div style={{ minHeight: '100vh', background: M.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      {/* bandeau d'onglets en haut */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 16px', justifyContent: 'center', borderBottom: `1px solid ${M.border}`, background: '#fff' }}>
        {TABS.map(t => (
          <a key={t.href} href={t.href} style={{ fontSize: 11, fontWeight: 600, textDecoration: 'none', color: M.plum, background: '#fff', border: `1px solid ${M.border}`, borderRadius: 8, padding: '4px 9px', whiteSpace: 'nowrap' }}>{t.icon} {t.t}</a>
        ))}
      </div>

      {/* Logo sobre */}
      <div style={{ textAlign: 'center', padding: '46px 20px 30px' }}>
        <div style={{ fontSize: 52, fontWeight: 900, color: M.plum, letterSpacing: '-2px' }}>CLUTCH</div>
        <div style={{ fontSize: 14, color: M.pink, fontWeight: 700, marginTop: 2 }}>Rencontre-toi en vrai.</div>
        <div style={{ fontSize: 12.5, color: M.ink40, marginTop: 8 }}>La présentation complète — choisis un espace ci-dessous.</div>
      </div>

      {/* Cartes par groupe */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 16px 60px' }}>
        {GROUPS.map(g => (
          <div key={g} style={{ marginBottom: 26 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: M.ink40, letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>{g}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {TABS.filter(t => t.group === g).map(t => (
                <a key={t.href} href={t.href} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: `1px solid ${t.accent || M.border}`, borderRadius: 14, padding: '14px 16px', boxShadow: '0 2px 10px rgba(83,41,67,.05)' }}>
                  <span style={{ fontSize: 26, flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: t.accent || M.ink }}>{t.t}</div>
                    <div style={{ fontSize: 11.5, color: M.ink70, lineHeight: 1.4 }}>{t.d}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', fontSize: 11, color: M.ink40, marginTop: 10 }}>Clutch · présentation interne · charte Mel</div>
      </div>
    </div>
  )
}
