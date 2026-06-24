'use client'
// ─────────────────────────────────────────────────────────────────────────────
// TUTORIEL — /tutoriel. Aide pour COMPRENDRE l'app (≠ onboarding = inscription).
// Charte MEL officielle (thème blanc, rose #EB6BAF, prune #532943, vert #77BC1F).
// Affiché dans un CADRE TÉLÉPHONE fixe. Démo web.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

// Charte Mel (= lib/brand.ts mel / app2 C)
const M = {
  studio: '#ECE7EB', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#4A2A3D', ink70: '#6F6F6E', ink40: '#B2B2B2', border: '#E3E3E3',
}
const LINKS: [string, string][] = [
  ['/tutoriel', '📖 Tutoriel'], ['/onboarding', '🚀 Onboarding'], ['/clutchlive', '⚡ Clutch Live'],
  ['/clutchnight', '🌙 Night'], ['/eventsmap', '🗺️ Events'], ['/vision2', '📖 Vision 2'],
]
const CH = [
  { n: '01', icon: '🧭', t: 'La philosophie', sub: 'Pourquoi Clutch n\'est pas Tinder', pts: [
    ['Le concurrent, c\'est le canapé.', 'Clutch transforme une envie molle (« je devrais sortir ») en vraie rencontre dans les 2 heures. Accro à la vraie vie, pas à l\'app.'],
    ['Une app qu\'on est fier de fermer.', 'Tu ouvres, tu vérifies, tu décides, tu y vas. Le produit vit dans la notification, pas dans le temps d\'écran.'],
    ['Clutch · Verrou · Rendez-vous.', 'Jamais « match », « swipe » ou « like ». Le mot, c\'est la promesse.'],
    ['Les femmes au centre.', 'Tout est conçu pour qu\'une femme se sente en sécurité et aux commandes à chaque étape.'],
  ] },
  { n: '02', icon: '📍', t: 'Les Présences', sub: 'Qui est dispo autour de toi', pts: [
    ['Tu vois qui est disponible.', 'Triés intelligemment : goûts communs, proximité et fiabilité remontent en premier.'],
    ['Tu envoies un Clutch.', 'Une invitation à se voir en vrai. 2 heures pour répondre. Accepté → le Verrou se referme.'],
    ['Verrou → RDV → J\'y suis.', 'Lieu + heure. « J\'y suis » (GPS) confirme ta présence. Puis un retour → ça construit la fiabilité.'],
    ['Les places.', 'Chacun choisit combien de Clutchs il accepte. Plein = « complet ce soir ». Ça se libère en répondant ou après 2h.'],
  ] },
  { n: '03', icon: '🎉', t: 'Les Événements', sub: 'Sortir, en groupe ou à deux', pts: [
    ['Des sorties créées par les gens.', 'Apéro, jazz, rando… visibles sur une carte interactive, tu t\'inscris.'],
    ['Clutch Live & Night.', 'La ville s\'allume autour de toi, de jour comme de nuit.'],
    ['Inscription simple.', 'Places limitées, liste d\'attente, notifs à chaque étape. La porte d\'entrée la plus douce.'],
  ] },
  { n: '04', icon: '🟢', t: 'Se mettre en ligne', sub: 'Comment tu deviens disponible', pts: [
    ['Tu choisis ta fenêtre.', 'Jusqu\'à quand tu es dispo (18h max). Pendant ce temps tu apparais.'],
    ['Tu choisis ta zone.', 'Une zone, pas ta position exacte en direct. Ta vie privée est protégée.'],
    ['Tu choisis ton mode.', 'Romance, Amitié, Pro ou Famille — tu croises les bonnes personnes.'],
    ['Quick Clutch.', 'Un bouton pour te rendre clutchable instantanément.'],
  ] },
  { n: '05', icon: '⚙️', t: 'Ce que tu peux régler', sub: 'Être malin, rester maître', pts: [
    ['Tes filtres.', 'Âge, genre, distance, mode.'],
    ['Ta réception.', 'Combien de Clutchs, mode sélectif (compatibles / vérifiés / fiables).'],
    ['Mood & notifs.', 'Ton humeur du moment, le niveau de notifications.'],
    ['Premium = confort.', 'Jamais la fiabilité ni passer devant. La fiabilité se mérite.'],
    ['Sécurité.', 'SOS, blocage, signalement, certification — toujours à un geste.'],
  ] },
]

function Phone({ children }: any) {
  return (
    <div style={{ width: 384, maxWidth: '94vw', height: 800, maxHeight: '90vh', background: '#1a1418', borderRadius: 46, padding: 12, boxShadow: '0 30px 80px rgba(83,41,67,.28)', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden', background: M.white, position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 30, display: 'grid', placeItems: 'center', flexShrink: 0 }}><div style={{ width: 110, height: 22, background: '#1a1418', borderRadius: 14 }} /></div>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>{children}</div>
      </div>
    </div>
  )
}

export default function Tutoriel() {
  const [i, setI] = useState(0)
  const ch = CH[i]
  return (
    <div style={{ minHeight: '100vh', background: M.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '14px 16px', justifyContent: 'center' }}>
        {LINKS.map(([href, label], k) => (
          <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: k === 0 ? 800 : 600, textDecoration: 'none', color: k === 0 ? '#fff' : M.plum, background: k === 0 ? M.plum : '#fff', border: `1px solid ${k === 0 ? M.plum : M.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{k === 0 ? ' · ici' : ''}</a>
        ))}
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 40px' }}>
        <Phone>
          <div style={{ padding: '8px 18px 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: M.pink, letterSpacing: '.18em' }}>TUTORIEL</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: M.plum, letterSpacing: '-.5px' }}>CLUTCH</div>
            </div>
            <div style={{ display: 'flex', gap: 5, justifyContent: 'center', margin: '14px 0' }}>
              {CH.map((c, k) => <button key={k} onClick={() => setI(k)} style={{ flex: 1, maxWidth: 48, height: 5, borderRadius: 3, border: 'none', cursor: 'pointer', background: k <= i ? M.pink : M.border }} aria-label={c.t} />)}
            </div>

            <div style={{ background: M.white, color: M.ink, borderRadius: 18, padding: '18px 16px', border: `1px solid ${M.border}`, boxShadow: '0 4px 18px rgba(83,41,67,.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <span style={{ fontSize: 28 }}>{ch.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: M.pink, letterSpacing: '.1em' }}>CHAPITRE {ch.n}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-.5px', color: M.ink }}>{ch.t}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: M.ink40, marginBottom: 14 }}>{ch.sub}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {ch.pts.map((p, k) => (
                  <div key={k} style={{ display: 'flex', gap: 9 }}>
                    <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: `${M.pink}1a`, color: M.pink, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800 }}>{k + 1}</span>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 1, color: M.ink }}>{p[0]}</div>
                      <div style={{ fontSize: 12.5, color: M.ink70, lineHeight: 1.5 }}>{p[1]}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
              <button onClick={() => setI(m => Math.max(0, m - 1))} disabled={i === 0} style={{ fontSize: 12.5, fontWeight: 700, padding: '9px 16px', borderRadius: 11, cursor: i === 0 ? 'default' : 'pointer', border: `1px solid ${M.border}`, background: '#fff', color: i === 0 ? M.ink40 : M.ink70 }}>← Retour</button>
              <span style={{ fontSize: 11.5, color: M.ink40 }}>{i + 1} / {CH.length}</span>
              {i < CH.length - 1
                ? <button onClick={() => setI(m => m + 1)} style={{ fontSize: 12.5, fontWeight: 800, padding: '9px 18px', borderRadius: 11, cursor: 'pointer', border: 'none', background: M.plum, color: '#fff' }}>Suivant →</button>
                : <a href="/onboarding" style={{ fontSize: 12.5, fontWeight: 800, padding: '9px 16px', borderRadius: 11, textDecoration: 'none', background: M.pink, color: '#fff' }}>{'S\'inscrire →'}</a>}
            </div>
          </div>
        </Phone>
      </div>
    </div>
  )
}
