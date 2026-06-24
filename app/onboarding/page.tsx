'use client'
// ─────────────────────────────────────────────────────────────────────────────
// ONBOARDING — /onboarding. L'app expliquée en 5 chapitres (les grandes lignes),
// version démo/web à montrer aux gens + lien testable depuis le profil.
// Page isolée, zéro risque. C'est aussi « comprendre toute l'app en 5 pages ».
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const C = {
  bg: '#2a1020', card: '#FFFFFF', cream: '#FAF6F0', border: 'rgba(245,232,222,0.18)',
  ink: '#2a1020', cream2: '#f5e8de', orange: '#E27C00', salmon: '#FFBF9E', dim: 'rgba(245,232,222,0.6)',
}
const LINKS: [string, string][] = [
  ['/onboarding', '🚀 Onboarding'], ['/clutchlive', '⚡ Clutch Live'], ['/clutchnight', '🌙 Night'],
  ['/eventsmap', '🗺️ Events'], ['/cockpit', '🛰️ Cockpit'], ['/vision2', '📖 Vision 2'],
]

const CH = [
  {
    n: '01', icon: '🧭', t: 'La philosophie', sub: 'Pourquoi Clutch n\'est pas Tinder',
    pts: [
      ['Le concurrent, c\'est le canapé.', 'Clutch ne te fait pas scroller des profils : il transforme une envie molle (« je devrais sortir ») en vraie rencontre dans les 2 heures. On est accro à la vraie vie, pas à l\'app.'],
      ['Une app qu\'on est fier de fermer.', 'Tu ouvres, tu vérifies, tu décides, tu y vas. 30 secondes. Le produit vit dans la notification, pas dans le temps d\'écran.'],
      ['Vocabulaire : Clutch · Verrou · Rendez-vous.', 'Jamais « match », « swipe » ou « like ». Le mot, c\'est la promesse.'],
      ['Les femmes au centre.', 'Tout est conçu pour qu\'une femme se sente en sécurité et aux commandes à chaque étape. Sans elles, rien ne marche.'],
    ],
  },
  {
    n: '02', icon: '📍', t: 'Les Présences', sub: 'Qui est dispo autour de toi, maintenant',
    pts: [
      ['Tu vois qui est disponible.', 'Les gens dispo dans ton rayon, triés intelligemment : ceux qui partagent tes goûts, proches de toi, et fiables remontent en premier.'],
      ['Tu envoies un Clutch.', 'Une invitation à se voir en vrai. La personne a 2 heures pour répondre. Si elle accepte → le Verrou se referme.'],
      ['Verrou → Rendez-vous → J\'y suis.', 'Vous fixez un lieu et une heure. Sur place, « J\'y suis » (GPS) confirme que tu es venu. Puis chacun donne un retour → ça construit la fiabilité.'],
      ['Les places.', 'Chacun choisit combien de Clutchs il accepte à la fois. Plein = « complet ce soir » (on n\'est jamais noyé). Ça se libère en répondant, ou tout seul après 2h.'],
    ],
  },
  {
    n: '03', icon: '🎉', t: 'Les Événements', sub: 'Sortir, en groupe ou à deux',
    pts: [
      ['Des sorties créées par les gens.', 'Apéro, jazz, rando, afterwork… Tu vois ce qui se passe sur une carte interactive et tu t\'inscris.'],
      ['Clutch Live & Clutch Night.', 'La ville s\'allume autour de toi : de jour comme de nuit, les opportunités apparaissent là où tu es. Clutch Night = le mode sorties du soir.'],
      ['Inscription simple.', 'Places limitées, liste d\'attente, et des notifications à chaque étape. Les événements sont la porte d\'entrée la plus douce pour rencontrer.'],
    ],
  },
  {
    n: '04', icon: '🟢', t: 'Se mettre en ligne', sub: 'Comment tu deviens disponible',
    pts: [
      ['Tu choisis ta fenêtre.', 'Tu indiques jusqu\'à quand tu es dispo (jusqu\'à 18h max). Pendant ce temps, tu apparais aux autres.'],
      ['Tu choisis ta zone.', 'Une zone de disponibilité, pas ta position exacte en direct. Ta vie privée est protégée (on ne révèle jamais où tu es précisément).'],
      ['Tu choisis ton mode.', 'Romance, Amitié, Pro ou Famille — tu ne croises que des gens qui cherchent la même chose au même moment.'],
      ['Quick Clutch.', 'Un bouton pour te rendre instantanément clutchable, sans réglages. Spontané.'],
    ],
  },
  {
    n: '05', icon: '⚙️', t: 'Ce que tu peux régler', sub: 'Être malin, rester maître',
    pts: [
      ['Tes filtres.', 'Âge, genre, distance, mode : tu ne vois (et n\'es vu·e) que par les bonnes personnes.'],
      ['Ta réception.', 'Combien de Clutchs tu acceptes, mode sélectif (seulement les profils compatibles / vérifiés / fiables). Toi qui décides du flot.'],
      ['Ton mood & tes notifs.', 'Ton humeur du moment, et le niveau de notifications (importantes seulement, ou tout).'],
      ['Premium = confort, jamais le mérite.', 'On peut acheter du confort (historique, alertes, filtres), jamais la fiabilité ni passer devant les autres. La fiabilité se mérite.'],
      ['Ta sécurité.', 'SOS, blocage, signalement, certification selfie. Toujours à un geste.'],
    ],
  },
]

export default function Onboarding() {
  const [i, setI] = useState(0)
  const ch = CH[i]
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.cream2, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 60px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 18 }}>
          {LINKS.map(([href, label], k) => (
            <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: k === 0 ? 800 : 600, textDecoration: 'none', color: k === 0 ? C.bg : C.dim, background: k === 0 ? C.salmon : 'rgba(255,255,255,.06)', border: `1px solid ${k === 0 ? C.salmon : C.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{k === 0 ? ' · ici' : ''}</a>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.salmon, letterSpacing: '.2em' }}>BIENVENUE SUR</div>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-1px', color: C.orange }}>CLUTCH</div>
          <div style={{ fontSize: 13, color: C.dim, marginTop: 2 }}>{'L\'app pour se rencontrer en vrai — en 5 chapitres'}</div>
        </div>

        {/* Progression */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '18px 0 14px' }}>
          {CH.map((c, k) => (
            <button key={k} onClick={() => setI(k)} style={{ flex: 1, maxWidth: 70, height: 5, borderRadius: 3, border: 'none', cursor: 'pointer', background: k <= i ? C.orange : 'rgba(245,232,222,.2)' }} aria-label={c.t} />
          ))}
        </div>

        {/* Carte chapitre */}
        <div style={{ background: C.cream, color: C.ink, borderRadius: 20, padding: '24px 22px', boxShadow: '0 12px 40px rgba(0,0,0,.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <span style={{ fontSize: 34 }}>{ch.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: '.1em' }}>CHAPITRE {ch.n}</div>
              <div style={{ fontSize: 23, fontWeight: 900, letterSpacing: '-.5px' }}>{ch.t}</div>
            </div>
          </div>
          <div style={{ fontSize: 13.5, color: 'rgba(42,16,32,.6)', marginBottom: 18 }}>{ch.sub}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ch.pts.map((p, k) => (
              <div key={k} style={{ display: 'flex', gap: 11 }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: `${C.orange}18`, color: C.orange, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>{k + 1}</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{p[0]}</div>
                  <div style={{ fontSize: 13.5, color: 'rgba(42,16,32,.72)', lineHeight: 1.6 }}>{p[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <button onClick={() => setI(m => Math.max(0, m - 1))} disabled={i === 0} style={{ fontSize: 13, fontWeight: 700, padding: '10px 18px', borderRadius: 12, cursor: i === 0 ? 'default' : 'pointer', border: `1px solid ${C.border}`, background: 'transparent', color: i === 0 ? 'rgba(245,232,222,.3)' : C.cream2 }}>← Retour</button>
          <span style={{ fontSize: 12, color: C.dim }}>{i + 1} / {CH.length}</span>
          {i < CH.length - 1
            ? <button onClick={() => setI(m => m + 1)} style={{ fontSize: 13, fontWeight: 800, padding: '10px 22px', borderRadius: 12, cursor: 'pointer', border: 'none', background: C.orange, color: '#fff' }}>Suivant →</button>
            : <a href="/clutchlive" style={{ fontSize: 13, fontWeight: 800, padding: '10px 22px', borderRadius: 12, textDecoration: 'none', background: C.salmon, color: C.bg }}>Voir la ville ⚡</a>}
        </div>
      </div>
    </div>
  )
}
