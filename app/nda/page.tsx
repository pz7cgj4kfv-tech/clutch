'use client'
// ─────────────────────────────────────────────────────────────────────────────
// NDA — /nda. Document qui COULE naturellement (pas de hauteur forcée → page 1
// se remplit, pas de page fantôme). Interligne aéré, lignes à remplir hautes.
// Impression propre (seul le contrat sort). @page A4, marges 22mm.
// ⚠️ Pas un conseil juridique ; relecture avocat·e vaudois·e recommandée.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const M = {
  studio: '#ECE7EB', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink70: '#33312f', ink40: '#8a8a8a', border: '#E3E3E3',
}
const LINKS: [string, string][] = [
  ['/nda', '🔒 NDA'], ['/hub', '🏠 Accueil'], ['/tutoriel', '📖 Tutoriel'],
  ['/clutchlive', '⚡ Live'], ['/clutchnight', '🌙 Night'], ['/vision2', '📖 Vision 2'],
]
const VERSIONS = [
  { v: 'v2 · 24 juin 2026', tag: 'À JOUR', note: 'Non-développement, non-contournement, clause pénale. Pour la réunion.' },
  { v: 'v1 · (ancienne)', tag: 'archive', note: 'Interdisait la divulgation mais PAS le développement. Ne plus utiliser.' },
]

function Art({ n, t, children }: any) {
  return (
    <div style={{ marginBottom: 17, breakInside: 'avoid' }}>
      <div style={{ fontSize: '11pt', fontWeight: 700, color: M.ink, marginBottom: 5 }}>Article {n} — {t}</div>
      <div style={{ fontSize: '10.5pt', color: M.ink70, lineHeight: 1.95, textAlign: 'justify' }}>{children}</div>
    </div>
  )
}
const Blank = ({ w = 160 }: any) => <span style={{ display: 'inline-block', borderBottom: '1px solid #777', width: w, height: 15, margin: '0 5px', verticalAlign: 'baseline' }} />

export default function NDA() {
  const [tab, setTab] = useState<'doc' | 'strat'>('doc')
  const sheet: React.CSSProperties = {
    width: 794, maxWidth: '100%', boxSizing: 'border-box', background: '#fff', color: M.ink,
    margin: '0 auto', padding: '54px 64px 60px', boxShadow: '0 6px 24px rgba(83,41,67,.12)',
    fontFamily: 'Georgia, "Times New Roman", serif',
  }

  return (
    <div style={{ minHeight: '100vh', background: M.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <style>{`
        @page { size: A4; margin: 0; }
        @media print {
          html, body { background:#fff !important; }
          .noprint { display:none !important; }
          .print-area { display:block !important; }
          /* Marges DANS le contenu (insensibles à « Ajuster à la largeur ») : 24mm gauche/droite, 18mm haut/bas */
          .sheet { box-shadow:none !important; margin:0 auto !important; width:210mm !important; max-width:none !important; padding:18mm 24mm !important; }
        }
      `}</style>

      <div className="noprint" style={{ display: 'flex', flexWrap: 'wrap', gap: 7, padding: '14px 16px', justifyContent: 'center' }}>
        {LINKS.map(([href, label], k) => (
          <a key={href} href={href} style={{ fontSize: 11.5, fontWeight: k === 0 ? 800 : 600, textDecoration: 'none', color: k === 0 ? '#fff' : M.plum, background: k === 0 ? M.plum : '#fff', border: `1px solid ${k === 0 ? M.plum : M.border}`, borderRadius: 9, padding: '5px 11px', whiteSpace: 'nowrap' }}>{label}{k === 0 ? ' · ici' : ''}</a>
        ))}
      </div>

      <div className="noprint" style={{ maxWidth: 820, margin: '0 auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: M.plum }}>🔒 Contrat de confidentialité</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => setTab('doc')} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${tab === 'doc' ? M.plum : M.border}`, background: tab === 'doc' ? `${M.plum}12` : '#fff', color: M.plum }}>📄 Le contrat</button>
            <button onClick={() => setTab('strat')} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${tab === 'strat' ? M.plum : M.border}`, background: tab === 'strat' ? `${M.plum}12` : '#fff', color: M.plum }}>🛡️ Protection</button>
            <button onClick={() => window.print()} style={{ fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: M.pink, color: '#fff' }}>🖨️ Imprimer / PDF</button>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {VERSIONS.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: i === 0 ? '#fff' : 'transparent', border: `1px solid ${i === 0 ? M.green : M.border}`, borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: M.ink }}>{v.v}</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? M.green : M.ink40, background: i === 0 ? `${M.green}1a` : M.border, borderRadius: 6, padding: '2px 7px' }}>{v.tag}</span>
              <span style={{ fontSize: 11, color: M.ink40 }}>{v.note}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#FFF7DE', border: '1px solid #E8C766', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 11.5, color: '#7a5a00', lineHeight: 1.6 }}>
          ⚠️ <b>Pour un PDF propre :</b> « Imprimer / PDF » → <b>« Enregistrer au format PDF »</b> → décoche <b>« En-têtes et pieds de page »</b>. Le document coule sur 2 pages (page 1 pleine), sans le site. · Modèle solide mais non juridique : relecture avocat·e vaudois·e conseillée. À faire signer AVANT toute présentation.
        </div>
      </div>

      {/* ───────── LE DOCUMENT (coule naturellement) ───────── */}
      <div className="print-area" style={{ display: tab === 'doc' ? 'block' : 'none', paddingBottom: 40 }}>
        <div className="sheet" style={sheet}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: '17pt', fontWeight: 700, color: M.ink, letterSpacing: '.05em' }}>ACCORD DE CONFIDENTIALITÉ</div>
            <div style={{ width: 96, height: 2, background: M.plum, margin: '9px auto 7px' }} />
            <div style={{ fontSize: '9pt', color: M.ink40, fontStyle: 'italic' }}>Non-divulgation · Non-développement · Non-contournement — version 2 du 24 juin 2026</div>
          </div>

          <div style={{ fontSize: '11pt', color: M.ink70, lineHeight: 2.1, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, color: M.ink, marginBottom: 3 }}>ENTRE</div>
            Madame <b>Mélanie Brodard</b>, domiciliée à <Blank w={160} />,<br />
            et Monsieur <b>David Saugy</b>, domicilié à <Blank w={160} />,<br />
            ci-après désignés ensemble «&nbsp;<b>les Transmetteurs</b>&nbsp;», d'une part&nbsp;;
            <div style={{ fontWeight: 700, color: M.ink, margin: '10px 0 3px' }}>ET</div>
            Monsieur / Madame <Blank w={200} />, domicilié·e à <Blank w={160} />,<br />
            né·e le <Blank w={110} />, ci-après «&nbsp;<b>le Récipiendaire</b>&nbsp;», d'autre part.
          </div>

          <div style={{ fontSize: '10.5pt', color: M.ink70, lineHeight: 1.95, marginBottom: 20, textAlign: 'justify' }}>
            <b>Préambule.</b>&nbsp; Les Transmetteurs ont conçu et développent un produit novateur, <b>CLUTCH</b> : une application mobile et un site internet de rencontres réelles (amoureuses, amicales, professionnelles et événementielles) fondés sur la disponibilité en temps réel des utilisateurs et un algorithme de mise en relation. Les Transmetteurs souhaitent présenter ce concept au Récipiendaire afin d'obtenir un avis et/ou d'envisager un partenariat. Cette présentation implique la transmission d'informations confidentielles. Les parties conviennent que la confidentialité de ces échanges est essentielle et arrêtent ce qui suit :
          </div>

          <Art n="1" t="Informations confidentielles">
            Sont confidentielles toutes les informations et données, sous quelque forme que ce soit (écrite, orale, visuelle, numérique ou par démonstration), transmises par les Transmetteurs ou découvertes par le Récipiendaire à l'occasion des présentes&nbsp;: notamment le concept, l'idée et son angle, les fonctionnalités, l'algorithme et sa logique, le design et les maquettes, le modèle économique, la stratégie de lancement, les chiffres, le nom «&nbsp;Clutch&nbsp;», ainsi que tout document, démonstration, site ou application présentés. Sont seules exclues les informations déjà publiques avant leur divulgation, sans faute du Récipiendaire.
          </Art>
          <Art n="2" t="Engagement de non-divulgation">
            Le Récipiendaire s'engage à garder ces informations strictement confidentielles, à les protéger avec le plus grand soin, à ne les divulguer à aucun tiers sans accord écrit préalable des Transmetteurs, à n'en faire aucune présentation, publication ou communication, et à ne les utiliser dans aucun appel d'offre.
          </Art>
          <Art n="3" t="Engagement de non-développement (essentiel)">
            Le Récipiendaire s'interdit, pendant toute la durée du présent accord, de concevoir, développer, faire développer, financer, exploiter, conseiller ou participer, directement ou indirectement, seul ou avec un tiers, à tout produit, application, site ou service identique, similaire ou concurrent qui s'inspirerait, en tout ou en partie, des informations confidentielles reçues. Toute idée, amélioration ou suggestion que le Récipiendaire formulerait sur le concept demeure la propriété exclusive des Transmetteurs et ne lui confère aucun droit.
          </Art>
          <Art n="4" t="Non-contournement">
            Le Récipiendaire s'interdit d'utiliser les informations pour contourner les Transmetteurs, ainsi que de solliciter, débaucher ou contacter, à des fins concurrentes, les partenaires, prestataires, investisseurs ou contacts que les Transmetteurs lui auraient révélés.
          </Art>
          <Art n="5" t="Propriété intellectuelle">
            La transmission n'emporte aucune cession de droit ni de propriété intellectuelle. Toutes les informations demeurent l'entière et exclusive propriété des Transmetteurs. Aucune licence n'est accordée. Le Récipiendaire s'interdit toute reproduction, copie ou rétro-ingénierie.
          </Art>
          <Art n="6" t="Restitution et destruction">
            Au terme des discussions — qu'un partenariat soit conclu ou non — le Récipiendaire restitue sans délai, à première demande, l'ensemble des informations confidentielles et détruit toute copie ou support en sa possession.
          </Art>
          <Art n="7" t="Confidentialité du présent accord">
            L'existence, le contenu et les termes du présent accord, ainsi que l'existence des discussions, sont eux-mêmes confidentiels.
          </Art>
          <Art n="8" t="Clause pénale et mesures urgentes">
            En cas de violation de l'un quelconque des engagements qui précèdent, le Récipiendaire sera redevable envers les Transmetteurs d'une pénalité forfaitaire de <b>CHF 50&nbsp;000.—</b> par violation, sans préjudice de la réparation du dommage effectif supérieur, et sans préjudice du droit des Transmetteurs de requérir en tout temps des mesures provisionnelles urgentes (cessation immédiate).
          </Art>
          <Art n="9" t="Durée">
            Le présent engagement prend effet à la signature et demeure en vigueur pendant <b>cinq (5) ans</b> à compter de la dernière information confidentielle transmise.
          </Art>
          <Art n="10" t="Droit applicable et for">
            Le présent accord est soumis au <b>droit suisse</b>. Tout litige relatif à sa validité, son interprétation ou son exécution relève de la compétence exclusive des <b>tribunaux du canton de Vaud</b>, à Lausanne.
          </Art>

          <div style={{ fontSize: '10.5pt', color: M.ink70, marginTop: 28, lineHeight: 1.9, breakInside: 'avoid' }}>
            Fait à Lausanne, le <Blank w={170} />, en deux (2) exemplaires originaux, chaque partie reconnaissant en avoir reçu un.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 56, gap: 44, breakInside: 'avoid' }}>
            <div style={{ flex: 1 }}>
              <div style={{ borderTop: '1px solid #555', paddingTop: 6, fontSize: '9.5pt', color: M.ink70 }}>Les Transmetteurs<br /><span style={{ color: M.ink40 }}>Mélanie Brodard&nbsp;·&nbsp;David Saugy</span></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ borderTop: '1px solid #555', paddingTop: 6, fontSize: '9.5pt', color: M.ink70 }}>Le Récipiendaire<br /><span style={{ color: M.ink40 }}>Signature précédée de «&nbsp;lu et approuvé&nbsp;»</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── STRATÉGIE ───────── */}
      {tab === 'strat' && (
        <div className="noprint" style={{ maxWidth: 760, margin: '0 auto 50px', padding: '0 16px' }}>
          <div style={{ background: '#fff', border: `1px solid ${M.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: M.plum, marginBottom: 4 }}>🛡️ Stratégie pour ne pas se faire piquer l'idée</div>
            <div style={{ fontSize: 12.5, color: M.ink40, marginBottom: 16 }}>Petit planning concret — temps & coût indicatifs. Une idée seule ne se protège pas ; c'est l'exécution + les preuves + les contrats qui protègent.</div>
            {[
              ['🔴 AUJOURD\'HUI · avant la réunion', '0 CHF · 10 min', 'Faire SIGNER ce NDA (papier) AVANT de montrer quoi que ce soit. Pas de signature = pas de démo. Noter la date et ce qui a été montré.'],
              ['🟠 Cette semaine · preuve d\'antériorité', '~0 CHF', 'Déjà acquis : tout est horodaté (git, /vision2, mémoire). Garde un export daté du concept (PDF). Option i-DEPOT ou recommandé à toi-même (~20-50 CHF).'],
              ['🟡 2-4 semaines · la marque', '~550 CHF', 'Déposer la marque « CLUTCH » à l\'IGE (Institut suisse de la PI), classes 9/42/45. LA protection la plus concrète : nom déposé = personne ne le reprend. ~1-3 mois.'],
              ['🟢 En continu · le vrai fossé', 'temps', 'Code et design protégés par le droit d\'auteur automatiquement (garde-les privés). Vraie protection = vitesse d\'exécution + réputation de fiabilité (incopiable). Détails sensibles → seulement sous NDA, par paliers.'],
              ['⚖️ Si besoin · avocat', '~150-300 CHF', 'Relecture du NDA + d\'un éventuel contrat de partenariat par un·e avocat·e vaudois·e (PI/contrats). 30-60 min suffisent.'],
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '11px 0', borderTop: i ? `1px solid ${M.border}` : 'none' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: M.ink }}>{s[0]}</div>
                  <div style={{ fontSize: 12, color: M.ink70, lineHeight: 1.6, marginTop: 3 }}>{s[2]}</div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: M.pink, whiteSpace: 'nowrap', flexShrink: 0 }}>{s[1]}</div>
              </div>
            ))}
            <div style={{ fontSize: 11.5, color: M.ink40, marginTop: 14, lineHeight: 1.6, borderTop: `1px solid ${M.border}`, paddingTop: 12 }}>
              <b>La vérité :</b> une idée ne vaut rien sans exécution — et l'exécution, vous l'avez déjà. NDA + marque déposée découragent 95 % des gens. Le reste, c'est aller plus vite. Détail dans <b>/vision</b> → Fossé & Danger.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
