'use client'
// ─────────────────────────────────────────────────────────────────────────────
// CONFIDENTIALITÉ / NDA — /confidentialite. Accord de confidentialité optimisé
// pour une réunion de présentation du concept Clutch (anti vol d'idée).
// Imprimable + « Enregistrer en PDF » via window.print. Charte Mel pour le chrome,
// document noir sur blanc (doc légal). ⚠️ Pas un conseil juridique : à faire relire
// par un·e avocat·e vaudois·e avant signature à enjeu.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const M = {
  studio: '#ECE7EB', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink70: '#444', ink40: '#8a8a8a', border: '#E3E3E3',
}
const LINKS: [string, string][] = [
  ['/confidentialite', '🔒 Confidentialité'], ['/tutoriel', '📖 Tutoriel'], ['/onboarding', '🚀 Onboarding'],
  ['/clutchlive', '⚡ Live'], ['/clutchnight', '🌙 Night'], ['/vision2', '📖 Vision 2'],
]

const VERSIONS = [
  { v: 'v2 · 24 juin 2026', tag: 'À JOUR', note: 'Ajout des clauses non-développement, non-contournement et clause pénale. Recommandée pour la réunion.' },
  { v: 'v1 · (ancienne)', tag: 'archive', note: 'Version initiale Mélanie/Benjamin — interdisait la divulgation mais PAS le développement par le récipiendaire. À ne plus utiliser.' },
]

function Art({ n, t, children }: any) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, color: M.ink, marginBottom: 4 }}>Article {n} — {t}</div>
      <div style={{ fontSize: 12.5, color: M.ink70, lineHeight: 1.7 }}>{children}</div>
    </div>
  )
}
const Blank = ({ w = 180 }: any) => <span style={{ display: 'inline-block', borderBottom: '1px solid #999', width: w, height: 13, margin: '0 3px' }} />

export default function Confidentialite() {
  const [tab, setTab] = useState<'doc' | 'strat'>('doc')
  return (
    <div style={{ minHeight: '100vh', background: M.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif' }}>
      <style>{`@media print { .noprint { display:none !important } .sheet { box-shadow:none !important; margin:0 !important; border:none !important } body { background:#fff } }`}</style>

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
            <button onClick={() => setTab('strat')} style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${tab === 'strat' ? M.plum : M.border}`, background: tab === 'strat' ? `${M.plum}12` : '#fff', color: M.plum }}>🛡️ Stratégie de protection</button>
            <button onClick={() => window.print()} style={{ fontSize: 12, fontWeight: 800, padding: '6px 14px', borderRadius: 8, cursor: 'pointer', border: 'none', background: M.pink, color: '#fff' }}>🖨️ Imprimer / PDF</button>
          </div>
        </div>

        {/* Versions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {VERSIONS.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: i === 0 ? '#fff' : 'transparent', border: `1px solid ${i === 0 ? M.green : M.border}`, borderRadius: 10, padding: '8px 12px' }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: M.ink }}>{v.v}</span>
              <span style={{ fontSize: 9, fontWeight: 900, color: i === 0 ? M.green : M.ink40, background: i === 0 ? `${M.green}1a` : M.border, borderRadius: 6, padding: '2px 7px' }}>{v.tag}</span>
              <span style={{ fontSize: 11, color: M.ink40 }}>{v.note}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#FFF7DE', border: '1px solid #E8C766', borderRadius: 10, padding: '10px 14px', marginBottom: 14, fontSize: 11.5, color: '#7a5a00', lineHeight: 1.6 }}>
          ⚠️ <b>Important :</b> ce document est un modèle solide, mais je ne suis pas avocat. Pour un enjeu réel, fais-le <b>relire 30 min par un·e avocat·e vaudois·e</b> avant la signature. Le faire <b>signer AVANT</b> de montrer quoi que ce soit cet après-midi.
        </div>
      </div>

      {tab === 'doc' ? (
        <div className="sheet" style={{ maxWidth: 760, margin: '0 auto 50px', background: '#fff', border: `1px solid ${M.border}`, borderRadius: 6, padding: '40px 46px', boxShadow: '0 8px 30px rgba(83,41,67,.10)' }}>
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: M.ink, letterSpacing: '.02em' }}>ACCORD DE CONFIDENTIALITÉ</div>
            <div style={{ fontSize: 11, color: M.ink40, marginTop: 3 }}>Non-divulgation · Non-développement · Non-contournement — v2, 24 juin 2026</div>
          </div>

          <div style={{ fontSize: 12.5, color: M.ink70, lineHeight: 1.8, marginBottom: 16 }}>
            <b>ENTRE</b><br />
            Mme <b>Mélanie Brodard</b>, domiciliée à <Blank w={150} />, et<br />
            M. <b>David Saugy</b>, domicilié à <Blank w={150} />,<br />
            ci-après désignés ensemble « <b>les Transmetteurs</b> », d'une part,<br /><br />
            <b>ET</b><br />
            M./Mme <Blank w={200} />, domicilié·e à <Blank w={160} />, né·e le <Blank w={90} />,<br />
            ci-après « <b>le Récipiendaire</b> », d'autre part.
          </div>

          <div style={{ fontSize: 12.5, color: M.ink70, lineHeight: 1.75, marginBottom: 18 }}>
            <b>Préambule.</b> Les Transmetteurs ont conçu et développent un produit novateur : <b>CLUTCH</b> — une application mobile et un site internet de rencontres réelles (amoureuses, amicales, professionnelles et événementielles) fondés sur la disponibilité en temps réel des utilisateurs et un algorithme de mise en relation. Les Transmetteurs souhaitent présenter ce concept au Récipiendaire afin d'obtenir un avis et/ou d'envisager un partenariat. Cette présentation implique la transmission d'informations confidentielles (concept, idée, fonctionnalités, design, algorithme, modèle économique, maquettes, démonstrations, nom). Les parties conviennent que la confidentialité de ces échanges est essentielle. Il est convenu ce qui suit :
          </div>

          <Art n="1" t="Informations confidentielles">
            Sont confidentielles toutes les informations et données, sous quelque forme que ce soit (écrite, orale, visuelle, numérique, démonstration), transmises par les Transmetteurs ou découvertes par le Récipiendaire à l'occasion des présentes : notamment le concept, l'idée et son angle, les fonctionnalités, l'algorithme et sa logique, le design et les maquettes, le modèle économique, la stratégie de lancement, les chiffres, le nom « Clutch », ainsi que tout document, démonstration, site ou application présentés. Sont exclues uniquement les informations déjà publiques avant leur divulgation, sans faute du Récipiendaire.
          </Art>
          <Art n="2" t="Engagement de non-divulgation">
            Le Récipiendaire s'engage à garder ces informations strictement confidentielles, à les protéger avec le plus grand soin, à ne les divulguer à aucun tiers sans accord écrit préalable des Transmetteurs, à n'en faire aucune présentation, publication ou communication, et à ne les utiliser dans aucun appel d'offre.
          </Art>
          <Art n="3" t="Engagement de NON-DÉVELOPPEMENT (clé)">
            Le Récipiendaire s'interdit, pendant toute la durée du présent accord, de <b>concevoir, développer, faire développer, financer, exploiter, conseiller ou participer</b>, directement ou indirectement, seul ou avec un tiers, à <b>tout produit, application, site ou service identique, similaire ou concurrent</b> qui s'inspirerait, en tout ou partie, des informations confidentielles reçues. Toute idée, amélioration ou retour que le Récipiendaire formulerait sur le concept reste la propriété exclusive des Transmetteurs et ne lui confère aucun droit.
          </Art>
          <Art n="4" t="Non-contournement">
            Le Récipiendaire s'interdit d'utiliser les informations pour contourner les Transmetteurs, et de solliciter, débaucher ou contacter, à des fins concurrentes, les partenaires, prestataires, investisseurs ou contacts que les Transmetteurs lui auraient révélés.
          </Art>
          <Art n="5" t="Propriété intellectuelle">
            La transmission n'emporte aucune cession de droit, ni de propriété intellectuelle. Toutes les informations restent l'entière et exclusive propriété des Transmetteurs. Aucune licence n'est accordée. Le Récipiendaire s'interdit toute reproduction, copie ou rétro-ingénierie.
          </Art>
          <Art n="6" t="Restitution et destruction">
            Au terme des discussions — qu'un partenariat soit conclu ou non — le Récipiendaire restitue sans délai, à première demande, l'ensemble des informations confidentielles et détruit toute copie ou support en sa possession.
          </Art>
          <Art n="7" t="Confidentialité du présent accord">
            L'existence, le contenu et les termes du présent accord, ainsi que l'existence des discussions, sont eux-mêmes confidentiels.
          </Art>
          <Art n="8" t="Clause pénale et mesures urgentes">
            En cas de violation de l'un quelconque des engagements ci-dessus, le Récipiendaire sera redevable envers les Transmetteurs d'une pénalité forfaitaire de <b>CHF 50'000.—</b> par violation, sans préjudice de la réparation du dommage effectif supérieur et du droit des Transmetteurs de requérir en tout temps des mesures provisionnelles (cessation immédiate).
          </Art>
          <Art n="9" t="Durée">
            Le présent engagement prend effet à la signature et reste en vigueur <b>cinq (5) ans</b> à compter de la dernière information confidentielle transmise.
          </Art>
          <Art n="10" t="Droit applicable et for">
            Le présent accord est soumis au <b>droit suisse</b>. Tout litige relève de la compétence exclusive des <b>tribunaux du canton de Vaud</b>, à Lausanne.
          </Art>

          <div style={{ fontSize: 12.5, color: M.ink70, marginTop: 24 }}>
            Fait à Lausanne, le <Blank w={140} />, en deux exemplaires originaux.
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 34, gap: 30, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: M.ink40, marginBottom: 26 }}>Les Transmetteurs<br /><span style={{ fontSize: 10 }}>(Mélanie Brodard · David Saugy)</span></div>
              <div style={{ borderTop: '1px solid #999' }} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: M.ink40, marginBottom: 26 }}>Le Récipiendaire<br /><span style={{ fontSize: 10 }}>(signature précédée de « lu et approuvé »)</span></div>
              <div style={{ borderTop: '1px solid #999' }} />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 760, margin: '0 auto 50px', padding: '0 16px' }}>
          <div style={{ background: '#fff', border: `1px solid ${M.border}`, borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: M.plum, marginBottom: 4 }}>🛡️ Stratégie pour ne pas se faire piquer l'idée</div>
            <div style={{ fontSize: 12.5, color: M.ink40, marginBottom: 16 }}>Petit planning concret — temps & coût indicatifs. Une idée seule ne se protège pas ; c'est l'exécution + les preuves + les contrats qui protègent.</div>
            {[
              ['🔴 AUJOURD\'HUI · avant la réunion', '0 CHF · 10 min', 'Faire SIGNER ce NDA (papier) AVANT de montrer quoi que ce soit. Pas de signature = pas de démo. Noter la date et ce qui a été montré.'],
              ['🟠 Cette semaine · preuve d\'antériorité', '~0 CHF', 'Tu l\'as déjà sans le savoir : tout est horodaté (git, /vision2, mémoire). Garde un export daté du concept (PDF) comme preuve que l\'idée est à toi à cette date. Option i-DEPOT (WIPO/Benelux) ou recommandé à toi-même = horodatage fort (~20-50 CHF).'],
              ['🟡 2-4 semaines · la marque', '~550 CHF', 'Déposer la marque « CLUTCH » à l\'IGE (Institut suisse de la propriété intellectuelle) pour la Suisse, classes 9/42/45 (logiciel, app, mise en relation). C\'est LA protection la plus concrète : un nom déposé, personne ne peut le reprendre. ~550 CHF, ~1-3 mois.'],
              ['🟢 En continu · le vrai fossé', 'temps', 'Le code et le design sont protégés par le droit d\'auteur automatiquement (garde-les privés). Mais la VRAIE protection = vitesse d\'exécution + la réputation de fiabilité (incopiable). Ne montre les détails sensibles (algo, chiffres) qu\'aux gens sous NDA, par paliers.'],
              ['⚖️ Si besoin · avocat', '~150-300 CHF', 'Faire relire le NDA + un éventuel contrat de partenariat par un·e avocat·e vaudois·e (PI/contrats). 30-60 min suffisent pour les enjeux courants.'],
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
              <b>La vérité honnête :</b> une idée ne vaut rien sans exécution — c'est ce que vous avez déjà (app qui tourne, vision, design Mel). Le NDA + la marque déposée découragent 95 % des gens. Le reste, c'est d'aller plus vite qu'eux. Détail complet dans <b>/vision</b> → Fossé & Danger.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
