'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /mel-test — PREUVE du workflow design→code (28.06). Carte « Présence » reconstruite à partir
// du SVG À CALQUES NOMMÉS de Mel (PresenceCard.svg, export Illustrator CS6 réussi 🎉).
// Valeurs EXACTES extraites de son SVG (viewBox 340×70) :
//   avatar #74C3B4 · prénom/âge #706F6F · commentaire #707070 · ♀/lieu #7C7B7C · pin/points/étoiles #B2B2B2
//   police SF UI Text Bold · avatar 56/70 · 4 points pleins +1 vide · 4 étoiles pleines +1 vide.
// Page isolée → on compare au design. Validée → j'intègre dans la vraie liste Présences.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'

const COL = {
  avatar: '#74C3B4', name: '#706F6F', comment: '#707070', accent: '#7C7B7C', grey: '#B2B2B2',
}
const SF = '-apple-system,BlinkMacSystemFont,"SF Pro Text","SF UI Text",Segoe UI,Roboto,sans-serif'

function Dots({ filled = 4, total = 5 }: { filled?: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: 4.5 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ width: 11, height: 11, borderRadius: '50%', boxSizing: 'border-box', background: i < filled ? COL.grey : 'transparent', border: `1.4px solid ${COL.grey}` }} />
      ))}
    </div>
  )
}
function Stars({ filled = 4, total = 5 }: { filled?: number; total?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ fontSize: 15, lineHeight: 1, color: COL.grey }}>{i < filled ? '★' : '☆'}</span>
      ))}
    </div>
  )
}
function Pin() {
  // épingle « RDV fixe » — reprise fidèle du tracé de Mel (contour gris), légèrement inclinée
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={COL.grey} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(18deg)' }}>
      <path d="M9 4.4l5.6 5.6M7.6 11.4l4.7-1.9 3.8 3.8-1.9 4.7M5 19l4-4M12.4 6.4l5 5" />
    </svg>
  )
}

function PresenceCard() {
  return (
    <div style={{
      position: 'relative', display: 'flex', gap: 13, alignItems: 'stretch',
      background: '#fff', borderRadius: 13, padding: '11px 13px',
      boxShadow: '0 1px 3px rgba(120,115,125,.16), 0 6px 16px rgba(120,115,125,.14)',
      width: '100%', maxWidth: 380, boxSizing: 'border-box', fontFamily: SF,
    }}>
      {/* avatar #74C3B4 (placeholder Mel = aplat · dans l'app = vraie photo) */}
      <div style={{ flexShrink: 0, width: 84, height: 84, borderRadius: 11, background: COL.avatar }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* ♀ · prénom · âge */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, paddingRight: 24 }}>
          <span style={{ fontSize: 15, color: COL.accent, fontWeight: 700, transform: 'translateY(1px)' }}>♀</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: COL.name, letterSpacing: '-.01em' }}>Isabella</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: COL.name }}>25 ans</span>
        </div>

        {/* commentaire (2 lignes) */}
        <div style={{ fontSize: 12.5, lineHeight: 1.32, color: COL.comment, fontWeight: 700, marginTop: 5 }}>
          Envie d’aller me baigner, quelqu’un vient avec moi? Merci!
        </div>

        {/* lieu + scores */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 'auto', paddingTop: 7 }}>
          <span style={{ fontSize: 13.5, fontWeight: 700, color: COL.accent }}>À deux pas</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <Dots filled={4} />
            <Stars filled={4} />
          </div>
        </div>
      </div>

      {/* épingle RDV fixe — coin haut droit */}
      <div style={{ position: 'absolute', top: 10, right: 12 }}><Pin /></div>
    </div>
  )
}

export default function MelTest() {
  return (
    <div style={{ minHeight: '100vh', background: '#6E6E6E', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24, fontFamily: SF }}>
      <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, opacity: .9, textAlign: 'center', maxWidth: 460, lineHeight: 1.5 }}>
        ✅ Workflow prouvé — carte « Présence » reconstruite <strong>en code</strong> depuis le SVG à calques de Mel.<br />
        <span style={{ opacity: .7, fontSize: 11.5, fontWeight: 600 }}>Couleurs & police tirées DIRECTEMENT de son export. Retours de Mel → j’ajuste au pixel → j’intègre dans la vraie liste.</span>
      </div>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <PresenceCard />
      </div>
      <div style={{ color: '#fff', fontSize: 10.5, opacity: .55, textAlign: 'center', maxWidth: 460, lineHeight: 1.6 }}>
        Calques lus : avatar #74C3B4 · prénom/âge #706F6F · commentaire #707070 · ♀/lieu #7C7B7C · pin/points/étoiles #B2B2B2 · SF UI Text Bold
      </div>
    </div>
  )
}
