'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /mel — L'ATELIER DE MEL. Refonte 28.06 : Mel DESSINE (Illustrator) + EXPORTE (SVG + PNG).
// Le CODE, c'est David + Claude (dans le vrai projet). Mel n'a PAS besoin d'abonnement IA pour ça :
// le handoff = des FICHIERS, pas un chat. GPT ne convertit plus rien (c'était ça le piège : son
// moteur d'image AI « redessine » et fait tout bouger). Ici : la marche à suivre propre + rassurante.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'

const C = {
  studio: '#F4F1F4', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink60: '#6b6670', border: '#E6E3E6', amber: '#B26A00',
}

const LINKS: [string, string, string][] = [
  ["L'app (le vrai produit)", 'https://pz7cgj4kfv-tech.github.io/app2', '📱 les écrans à habiller'],
  ['Le Cône (Forteresse)', 'https://pz7cgj4kfv-tech.github.io/forteresse', '🌌 cône 3D + tension'],
  ['Clutch Live (immersion)', 'https://pz7cgj4kfv-tech.github.io/clutchlive', '📡 radar boussole'],
  ['Le Hub (toutes les pages)', 'https://pz7cgj4kfv-tech.github.io/hub', '🗺️ tout est là'],
]

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return <div style={{ background: C.white, border: `1px solid ${accent || C.border}`, borderRadius: 14, padding: '16px 18px' }}>{children}</div>
}

export default function MelAtelier() {
  return (
    <div style={{ minHeight: '100vh', background: C.studio, color: C.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro",Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '34px 18px 64px' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: C.pink, marginBottom: 6 }}>CLUTCH · ATELIER</div>
          <h1 style={{ margin: '0 0 8px', fontSize: 33, fontWeight: 900, color: C.plum }}>L'atelier de Mel 🎨</h1>
          <p style={{ margin: '0 auto', maxWidth: 520, fontSize: 14.5, lineHeight: 1.55, color: C.ink60 }}>
            Tu <strong>dessines</strong> sur Illustrator, tu <strong>exportes</strong>, tu me les donnes (via David) — et <strong>je code les vrais écrans</strong>, au pixel près, dans l'app qui tourne. Le code, c'est nous : <strong>tu n'as besoin d'aucun abonnement.</strong>
          </p>
        </div>

        {/* LE PRINCIPE — la grande clarification */}
        <Card accent={C.green}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.plum, marginBottom: 8 }}>🧭 Qui fait quoi (le truc à retenir)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            {[
              ['🎨 Toi', 'tu crées les maquettes sur Illustrator et tu exportes les fichiers. C\'est tout.'],
              ['📤 David', 'il me transmet tes fichiers (un dossier partagé, ou il me les dépose).'],
              ['💻 Moi (Claude)', 'je reconstruis l\'écran exact dans le code, je te montre le rendu RÉEL, j\'ajuste selon tes retours.'],
            ].map(([who, what]) => (
              <div key={who} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                <span style={{ flexShrink: 0, width: 120, fontSize: 13.5, fontWeight: 800, color: C.pink }}>{who}</span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>{what}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: C.ink60, marginTop: 10, lineHeight: 1.5, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
            👉 Le handoff, c'est des <strong>fichiers</strong>, pas un chat. Tu ne « convertis » jamais ton design toi-même.
          </div>
        </Card>

        {/* POURQUOI GPT TE FAIT GALÉRER */}
        <div style={{ background: 'rgba(178,106,0,0.06)', border: `1px solid rgba(178,106,0,0.25)`, borderRadius: 14, padding: '14px 16px', marginTop: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.amber, marginBottom: 3 }}>Pourquoi ChatGPT te faisait galérer</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink }}>
              GPT essayait de <strong>« redessiner » tes écrans avec son moteur d'image AI</strong>. C'est génératif = il devine → ça ne reste jamais fixe, et dès que tu bouges un élément, ça décale tout le reste. <strong>Ce n'est pas toi, c'est l'outil.</strong> La mise en page → code doit être <strong>déterministe</strong> (du vrai code), pas une image regénérée. C'est exactement ce que je fais. GPT, tu le gardes juste pour <strong>brainstormer des idées</strong> si tu veux.
            </div>
          </div>
        </div>

        {/* LES DEUX EXPORTS */}
        <div style={{ fontSize: 14, fontWeight: 800, color: C.plum, margin: '26px 0 10px' }}>📦 Ce que tu m'exportes (2 cas)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>

          {/* SVG — icônes / boutons */}
          <Card accent={C.pink}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.pink, marginBottom: 8 }}>🔘 Icônes · boutons · petits graphismes → <span style={{ color: C.plum }}>SVG</span></div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.65, color: C.ink }}>
              <li>Sélectionne l'élément dans Illustrator.</li>
              <li><strong>Fichier → Exporter → Exporter pour les écrans</strong> (ou « Exporter sous… » → format <strong>SVG</strong>).</li>
              <li><strong>Un fichier par élément</strong>, nommé clairement (<code>bouton_clutch.svg</code>, <code>icone_event.svg</code>).</li>
              <li>Si ça <strong>remplace</strong> un existant → garde le <strong>même nom</strong>. Si c'est <strong>nouveau</strong> → dis-le-moi.</li>
            </ol>
            <div style={{ fontSize: 11.5, color: C.ink60, marginTop: 8, lineHeight: 1.5 }}>→ Je le pose <strong>tel quel</strong> dans l'app. Net à toutes les tailles, recolorable, zéro réinterprétation.</div>
          </Card>

          {/* PNG — écrans complets */}
          <Card accent={C.plum}>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.plum, marginBottom: 8 }}>🖼️ Écrans complets (mise en page) → <span style={{ color: C.pink }}>PNG</span></div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.65, color: C.ink }}>
              <li>Travaille sur un <strong>plan de travail iPhone</strong> (par ex. <strong>390 × 844</strong>).</li>
              <li>Exporte l'écran en <strong>PNG à 2× ou 3×</strong> → c'est ma <strong>cible visuelle</strong>.</li>
              <li>Si tu as des valeurs précises (un <strong>code couleur</strong>, une <strong>police</strong>, un <strong>espacement</strong>), dis-les-moi ; sinon je <strong>mesure sur l'image</strong>.</li>
              <li>Optionnel mais top : exporte <strong>aussi les éléments en SVG</strong> (icônes, photo-cadre…) pour que je les pose pile.</li>
            </ol>
            <div style={{ fontSize: 11.5, color: C.ink60, marginTop: 8, lineHeight: 1.5 }}>→ Je reconstruis l'écran <strong>au pixel</strong> avec les vraies données, et je ne bouge <strong>que</strong> ce que tu demandes.</div>
          </Card>
        </div>

        {/* LE FIXE */}
        <div style={{ background: 'linear-gradient(135deg,rgba(83,41,67,0.06),rgba(235,107,175,0.05))', border: `1px solid ${C.border}`, borderRadius: 14, padding: '14px 16px', marginTop: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📐</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.plum, marginBottom: 3 }}>« Tout doit être fixe, rien ne bouge »</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink }}>
              En code, c'est <strong>garanti</strong> : chaque texte, chaque icône est posé à un endroit précis (positionnement absolu). Pas besoin de te battre avec GPT pour ça. Tu dessines à la position que tu veux → je la reproduis exactement.
            </div>
          </div>
        </div>

        {/* LE FILET DE SÉCURITÉ */}
        <div style={{ background: 'linear-gradient(135deg,rgba(119,188,31,0.10),rgba(235,107,175,0.07))', border: `1px solid ${C.green}`, borderRadius: 14, padding: '14px 16px', marginTop: 12, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, flexShrink: 0 }}>🛟</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.plum, marginBottom: 3 }}>On ne perd JAMAIS une version</div>
            <div style={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink }}>
              Chaque fichier que tu envoies est archivé pour toujours côté David. Si un nouveau design crée un souci, on remet l'ancien <strong>en 10 secondes</strong>. Pas de numéros de version à gérer — <strong>envoie sans stress</strong>.
            </div>
          </div>
        </div>

        {/* LA BOUCLE */}
        <div style={{ fontSize: 14, fontWeight: 800, color: C.plum, margin: '26px 0 10px' }}>🔁 Comment ça tourne (la boucle)</div>
        <Card>
          {[
            'Tu exportes ton écran (PNG + SVG) et tu donnes le tout à David.',
            'Je reconstruis l\'écran dans le vrai code, avec les vraies données.',
            'David te montre le RENDU RÉEL (capture de l\'app qui tourne).',
            'Tu me dis ce qui bouge (« le prénom 4px plus haut », « le rose plus doux »…).',
            'J\'ajuste seulement ça. On recommence jusqu\'à ce que ce soit parfait.',
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 4 ? 8 : 0 }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: C.pink, color: '#fff', fontSize: 12, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{i + 1}</span>
              <span style={{ fontSize: 13.5, lineHeight: 1.5, color: C.ink, paddingTop: 1 }}>{s}</span>
            </div>
          ))}
        </Card>

        {/* TEST */}
        <div style={{ background: C.plum, color: '#fff', borderRadius: 14, padding: '16px 18px', marginTop: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>🚀 On le prouve sur UN écran</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, opacity: .95 }}>
            Choisis ton écran préféré (ex. la <strong>carte de présence</strong>). Exporte le <strong>PNG</strong> de l'écran + les <strong>SVG</strong> des éléments, envoie à David. Je le reconstruis au pixel et on regarde ensemble. Si ça marche du premier coup, on a notre méthode.
          </div>
        </div>

        {/* Liens */}
        <div style={{ fontSize: 13, fontWeight: 800, color: C.plum, margin: '24px 0 10px' }}>👀 Ce qui existe déjà (pour t'inspirer)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 10 }}>
          {LINKS.map(([t, href, sub]) => (
            <a key={href} href={href} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', display: 'block' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: C.ink }}>{t}</div>
              <div style={{ fontSize: 11.5, color: C.ink60, marginTop: 2 }}>{sub}</div>
            </a>
          ))}
        </div>

        <div style={{ textAlign: 'center', fontSize: 11, color: C.ink60, marginTop: 26, lineHeight: 1.7 }}>
          Tu dessines, tu exportes (SVG + PNG). Le reste, c'est nous.<br />
          Aucun abonnement, rien à installer — juste Illustrator et ton œil de graphiste. 💛
        </div>
      </div>
    </div>
  )
}
