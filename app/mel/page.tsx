'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /mel — L'ATELIER DE MEL. Sa page perso : UN prompt général (écrans + TOUTES les animations
// qu'on a déjà + à créer) à coller dans ChatGPT (Canvas, elle a l'abo), un bouton Copier, et
// les liens vers les pages existantes pour qu'elle voie/refasse tout. Elle anime dans un cadre
// iPhone, valide, copie le code → David → Claude intègre. Zéro donnée à envoyer : prompt auto-suffisant.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'

const C = {
  studio: '#F4F1F4', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink60: '#6b6670', border: '#E6E3E6',
}

const PROMPT = `Tu es le designer & motion designer de CLUTCH, une app de rencontre spontanée EN PERSONNE (Suisse). On travaille dans le CANVAS de ChatGPT. Je décris un ÉCRAN ou une ANIMATION, tu le construis en HTML / Canvas / CSS DANS LE CANVAS, et tu l'affiches DANS UN CADRE IPHONE (~375×812, coins très arrondis, encoche en haut), centré sur un fond gris clair — pour que je voie le rendu réel (et les animations qui BOUGENT en boucle) comme sur un vrai téléphone.

CHARTE GRAPHIQUE (toujours) :
- Couleurs : rose #EB6BAF (accents, CTA) · vert #77BC1F (validations) · prune #532943 (texte fort, onglet actif) · fond studio #F4F1F4 · cartes BLANCHES #FFFFFF · encre #1a1418.
- Cartes blanches séparées par des lignes fines gris clair (#E6E3E6), JAMAIS de fonds teintés.
- Police système/SF, coins arrondis (12-16px), ombres très douces.
- Vocabulaire : « Clutch », « Verrou », « Rendez-vous ». Jamais « match / swipe / like ».
- Esprit : beau, chaleureux, VIVANT, féminin-friendly. Subtil > clinquant. Toujours une référence derrière une anim (sonar, effet Doppler, battement de cœur, cône de lumière…).

RÈGLES :
- Tu fais UNIQUEMENT du visuel (mise en page, couleurs, formes, textes, animations canvas/SVG/CSS). Pas de données, pas de logique, pas de sécurité.
- Animations en BOUCLE fluide (requestAnimationFrame ou CSS infinite). Quand c'est pertinent, donne-moi des curseurs/boutons pour régler vitesse / taille / intensité.
- Code propre et autonome (un seul composant) pour que je clique « Copier » et l'envoie à David.
- Si je te demande des données, de la logique ou de la sécurité → préviens-moi que ça sort du design (à voir avec David).

L'APP — LES PAGES & ONGLETS (pour que tu comprennes où vivent les écrans) :
- Onglets du bas : Présences · Clutchs · Événements · Contacts · Profil.
- Présences = carte de Lausanne (étoiles qui s'allument) + liste de gens dispos maintenant.
- Clutchs = mes rendez-vous : Clutch envoyé / reçu, le Verrou (RDV confirmé), « J'y suis », fin de RDV.
- Le flow « ouvrir un créneau » : carte + un rayon réglable + des heures (le Cône de la Forteresse).
- Pages vitrine : le Cône de la Forteresse, Clutch Live (immersion boussole), Clutch Night.

CE QU'ON A DÉJÀ (à refaire / améliorer — tu peux t'en inspirer) :
- ÉCRANS : Présences (carte + liste) · Clutchs (RDV, Verrou) · Événements · Contacts · Profil · onboarding · le flow créneau (carte + rayon + heures).
- ANIMATIONS : 🌌 le Cône de la Forteresse (cône 3D + nuage de points qui tourne) · 📡 radar d'immersion « Tesla » (boussole + blips autour de toi) · 🔒 le Verrou qui se referme · 💓 battement de cœur Clutch · 🌊 onde Doppler du radar · ⭐ présences qui s'allument · 🌙 lune Clutch Night · ⚡ éclat Clutch Live · ⏳ splash sablier.

À CRÉER / RAFFINER (une à la fois — demande-moi laquelle) :
1. Le VERROU qui se referme (cadenas, confirmation d'un RDV) ✦ la signature
2. Le RADAR de proximité — ondes Doppler + battement de cœur qui s'accélère en approchant
3. Célébration « Clutch envoyé / Verrou créé » (éclat, cœur, étincelles)
4. Le « J'y suis » réussi (épingle qui se pose, halo de validation)
5. Les présences qui s'allument sur la carte (étoiles)
6. Deux orbes qui s'attirent (le moment connexion, sans dire « match »)
7. Splash de lancement (sablier qui se vide → logo CLUTCH)
8. Clutch Night — ambiance nuit (lune, étoiles qui scintillent, dégradé prune)
9. Transitions entre écrans (slide doux, fondu)
10. Micro-interactions boutons (tap, pulse, retour visuel)
11. Pastille de notification qui pulse
12. Fin de RDV / feedback (cœur, étoiles de fiabilité qui se remplissent)

Commence par me demander : « tu veux un écran ou une animation ? », puis lequel, et propose-moi une première version.`

const LINKS: [string, string, string][] = [
  ['Le Cône (Forteresse)', 'https://pz7cgj4kfv-tech.github.io/forteresse', '🌌 cône 3D + tension'],
  ['Clutch Live (immersion)', 'https://pz7cgj4kfv-tech.github.io/clutchlive', '📡 radar boussole Tesla'],
  ["L'app (le vrai produit)", 'https://pz7cgj4kfv-tech.github.io/app2', '📱 les écrans à refaire'],
  ['Le Hub (toutes les pages)', 'https://pz7cgj4kfv-tech.github.io/hub', '🗺️ tout est là'],
]

export default function MelAtelier() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(PROMPT); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    catch { /* fallback : la zone de texte est sélectionnable à la main */ }
  }
  return (
    <div style={{ minHeight: '100vh', background: C.studio, color: C.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro",Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '34px 18px 64px' }}>

        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: C.pink, marginBottom: 6 }}>CLUTCH · ATELIER</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 33, fontWeight: 900, color: C.plum }}>L'atelier de Mel 🎨</h1>
          <p style={{ margin: '0 auto', maxWidth: 500, fontSize: 14.5, lineHeight: 1.55, color: C.ink60 }}>
            Tu crées les écrans et les animations de Clutch directement dans <strong>ton ChatGPT</strong>, tu les vois bouger dans un faux iPhone, et tu copies le code. <strong>Aucune donnée à m'envoyer</strong> — le prompt ci-dessous se suffit à lui-même.
          </p>
        </div>

        {/* Mode d'emploi */}
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 18px', marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.plum, marginBottom: 10 }}>Comment faire (5 étapes)</div>
          {[
            'Ouvre chatgpt.com et démarre un nouveau chat (ton abo Plus suffit, le Canvas est inclus).',
            'Clique « Copier le prompt » ci-dessous, et colle-le dans ChatGPT.',
            "Demande un écran ou une animation (ex. « le Verrou qui se referme »). Ça s'affiche dans l'iPhone.",
            'Ajuste avec tes mots (« plus lent », « le rose plus doux », « ajoute un cœur »…).',
            'Quand c\'est validé : fais « Copier » le code dans le Canvas → envoie-le-moi (David).',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: C.pink, color: '#fff', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: C.ink, paddingTop: 1 }}>{s}</span>
            </div>
          ))}
        </div>

        {/* Le prompt + Copier */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.plum }}>📋 Ton prompt (à coller dans ChatGPT)</div>
          <button onClick={copy} style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, padding: '9px 18px', borderRadius: 999, border: 'none', background: copied ? C.green : C.plum, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', transition: 'background .2s' }}>
            {copied ? '✓ Copié !' : 'Copier le prompt'}
          </button>
        </div>
        <textarea readOnly value={PROMPT} onFocus={e => e.currentTarget.select()}
          style={{ width: '100%', height: 340, resize: 'vertical', background: '#1a1018', color: '#f3e8f0', border: 'none', borderRadius: 12, padding: '14px 16px', fontSize: 11.5, lineHeight: 1.5, fontFamily: 'ui-monospace,SFMono-Regular,Menlo,monospace', boxSizing: 'border-box' }} />

        {/* Comment m'envoyer ton travail */}
        <div style={{ fontSize: 14, fontWeight: 800, color: C.plum, margin: '26px 0 10px' }}>📤 Comment me l'envoyer (à David)</div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 12 }}>
          {/* Cas 1 : une animation / un écran */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.pink, marginBottom: 8 }}>🎬 Une animation / un écran</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6, color: C.ink }}>
              <li>Dans le Canvas, clique <strong>« Copier »</strong> (tout le code).</li>
              <li>Colle-le dans ton message à David (WhatsApp/mail — c'est juste du texte).</li>
              <li>Ajoute une <strong>petite vidéo d'écran</strong> de l'anim qui bouge + son <strong>nom</strong> (« le Verrou », « célébration »…).</li>
            </ol>
          </div>

          {/* Cas 2 : un bouton / une icône en SVG */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.pink, marginBottom: 8 }}>🔘 Un bouton / une icône</div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6, color: C.ink }}>
              <li>Exporte-le en <strong>SVG</strong> (parfait : net à toutes les tailles, recolorable).</li>
              <li>Si ça <strong>remplace</strong> un bouton existant → <strong>garde le même nom</strong> (échange direct).</li>
              <li>Si c'est <strong>nouveau</strong> → un <strong>nom clair</strong> (ex. <code>bouton-verrou</code>, <code>icone-event</code>).</li>
              <li>Dis-moi juste : « ça remplace X » ou « c'est un nouveau ».</li>
            </ol>
          </div>
        </div>

        {/* Filet de sécurité : on ne perd jamais une version */}
        <div style={{ background: 'linear-gradient(135deg,rgba(119,188,31,0.10),rgba(235,107,175,0.07))', border: `1px solid ${C.green}`, borderRadius: 14, padding: '14px 16px', marginTop: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🛟</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.plum, marginBottom: 3 }}>On ne perd JAMAIS une version</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink }}>
              Chaque fichier que tu m'envoies est archivé pour toujours côté David. Si un nouveau bouton crée un bug, on remet l'ancien <strong>en 10 secondes</strong>. Tu n'as pas à gérer de numéros de version ni à garder les vieux fichiers — <strong>envoie sans stress</strong>, c'est mon filet.
            </div>
          </div>
        </div>

        {/* Liens vers ce qui existe */}
        <div style={{ fontSize: 13, fontWeight: 800, color: C.plum, margin: '24px 0 10px' }}>👀 Regarde ce qui existe déjà (pour t'inspirer / refaire)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
          {LINKS.map(([t, href, sub]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'block' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{t}</div>
              <div style={{ fontSize: 11.5, color: C.ink60, marginTop: 2 }}>{sub}</div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: C.ink60, marginTop: 26, lineHeight: 1.7 }}>
          Il te faut juste <strong>ton abonnement ChatGPT</strong> (le Canvas est inclus). Rien à installer.<br />
          Tu touches UNIQUEMENT au visuel — si ChatGPT se met à parler de données/logique, dis-le à David.
        </div>
      </div>
    </div>
  )
}
