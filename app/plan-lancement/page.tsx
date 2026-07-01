'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /plan-lancement — DOCUMENT D'INVESTISSEMENT v2 (fond blanc, imprimable PDF).
// Reconstruit le 30.06.2026 avec de VRAIS chiffres sourcés (4 analystes web) + repositionnement David :
// Clutch = rencontres + ACTIVITÉS en vrai (pas que dating), cœur 25-45. Marché social ~7-10× le dating.
// Inclut : reality-check honnête sur les MAU, monétisation par l'événement (take-rate), mur du paid en CH,
// arborescence des stratégies, timeline avec seeding 3-6 mois, correction Venture Kick. Sources en §13.
// Imprimer : bouton en haut → Cmd+P → Enregistrer en PDF.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'

const K = {
  ink: '#1a1a1a', body: '#33373d', muted: '#6b7280', line: '#e5e7eb', soft: '#f7f8fa',
  accent: '#E27C00', green: '#1f9d55', amber: '#d97706', red: '#c0392b', blue: '#2563eb', violet: '#7c3aed',
}

const H2 = ({ n, children }: { n?: string; children: React.ReactNode }) => (
  <h2 style={{ fontSize: 22, fontWeight: 800, color: K.ink, margin: '40px 0 6px', paddingTop: 8, borderTop: `2px solid ${K.ink}`, breakAfter: 'avoid' }}>
    {n && <span style={{ color: K.accent, marginRight: 10 }}>{n}</span>}{children}
  </h2>
)
const H3 = ({ children }: { children: React.ReactNode }) => <h3 style={{ fontSize: 15.5, fontWeight: 800, color: K.ink, margin: '22px 0 6px', breakAfter: 'avoid' }}>{children}</h3>
const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => <p style={{ fontSize: 13.5, lineHeight: 1.62, color: K.body, margin: '0 0 10px', ...style }}>{children}</p>
const Li = ({ children }: { children: React.ReactNode }) => <li style={{ fontSize: 13.5, lineHeight: 1.55, color: K.body, margin: '0 0 5px' }}>{children}</li>
const Src = ({ children }: { children: React.ReactNode }) => <span style={{ fontSize: 10.5, color: K.muted }}> [{children}]</span>
const Note = ({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'accent' | 'red' | 'green' }) => {
  const c = tone === 'accent' ? K.accent : tone === 'red' ? K.red : tone === 'green' ? K.green : K.muted
  return <div style={{ background: K.soft, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '11px 14px', margin: '12px 0', fontSize: 13, lineHeight: 1.6, color: K.body, breakInside: 'avoid' }}>{children}</div>
}

function Table({ head, rows, accentCol }: { head: string[]; rows: (string | React.ReactNode)[][]; accentCol?: number }) {
  return (
    <div style={{ overflowX: 'auto', margin: '12px 0', breakInside: 'avoid' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.3, minWidth: 560 }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '8px 9px', background: K.ink, color: '#fff', fontWeight: 700, fontSize: 11.5, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, ri) => (
          <tr key={ri} style={{ borderBottom: `1px solid ${K.line}`, background: ri % 2 ? K.soft : '#fff' }}>
            {r.map((c, ci) => <td key={ci} style={{ textAlign: ci === 0 ? 'left' : 'center', padding: '7px 9px', color: ci === accentCol ? K.accent : K.body, fontWeight: ci === 0 || ci === accentCol ? 700 : 400, verticalAlign: 'top' }}>{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

function LineChart({ title, series, xLabels, yMax, yUnit }: { title: string; series: { name: string; color: string; data: number[] }[]; xLabels: string[]; yMax: number; yUnit: string }) {
  const W = 620, Hh = 250, padL = 52, padR = 14, padT = 16, padB = 32, iw = W - padL - padR, ih = Hh - padT - padB
  const x = (i: number) => padL + (i / (xLabels.length - 1)) * iw, y = (v: number) => padT + ih - (v / yMax) * ih, ticks = 4
  return (
    <figure style={{ margin: '14px 0 18px', breakInside: 'avoid' }}>
      <figcaption style={{ fontSize: 12.5, fontWeight: 700, color: K.ink, marginBottom: 4 }}>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: '100%', height: 'auto', border: `1px solid ${K.line}`, borderRadius: 8, background: '#fff' }}>
        {Array.from({ length: ticks + 1 }).map((_, t) => { const v = (yMax / ticks) * t; return <g key={t}><line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={K.line} /><text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize={9.5} fill={K.muted}>{v >= 1000 ? (v / 1000) + 'k' : v}</text></g> })}
        {xLabels.map((l, i) => <text key={i} x={x(i)} y={Hh - 11} textAnchor="middle" fontSize={9.5} fill={K.muted}>{l}</text>)}
        {series.map((s, si) => <g key={si}><polyline fill="none" stroke={s.color} strokeWidth={2.2} points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />{s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.4} fill={s.color} />)}</g>)}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>{series.map((s, i) => <span key={i} style={{ fontSize: 11.5, color: K.body, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 11, height: 3, background: s.color, borderRadius: 2 }} />{s.name}</span>)}</div>
      <div style={{ fontSize: 10.5, color: K.muted, marginTop: 2 }}>{yUnit}</div>
    </figure>
  )
}

function BarChart({ title, bars, unit, fmt }: { title: string; bars: { label: string; value: number; color?: string }[]; unit: string; fmt?: (v: number) => string }) {
  const max = Math.max(...bars.map(b => b.value))
  return (
    <figure style={{ margin: '14px 0 18px', breakInside: 'avoid' }}>
      <figcaption style={{ fontSize: 12.5, fontWeight: 700, color: K.ink, marginBottom: 8 }}>{title}</figcaption>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 150, fontSize: 11.5, color: K.body, textAlign: 'right', flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, background: K.soft, borderRadius: 5, height: 22 }}><div style={{ width: `${Math.max(2, (b.value / max) * 100)}%`, height: '100%', background: b.color || K.accent, borderRadius: 5 }} /></div>
            <span style={{ width: 98, fontSize: 11.5, fontWeight: 700, color: K.ink, flexShrink: 0 }}>{fmt ? fmt(b.value) : b.value.toLocaleString('fr-CH')}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: K.muted, marginTop: 6 }}>{unit}</div>
    </figure>
  )
}

// ── Arborescence (nœud d'arbre de décision) ─────────────────────────────────
function Branch({ label, verdict, cond, children, depth = 0 }: { label: string; verdict?: 'go' | 'wait' | 'stop'; cond?: string; children?: React.ReactNode; depth?: number }) {
  const vc = verdict === 'go' ? K.green : verdict === 'wait' ? K.amber : verdict === 'stop' ? K.red : K.muted
  const vt = verdict === 'go' ? 'GARDER' : verdict === 'wait' ? 'PLUS TARD' : verdict === 'stop' ? 'ÉCARTER' : ''
  return (
    <div style={{ marginLeft: depth ? 18 : 0, borderLeft: depth ? `2px solid ${K.line}` : 'none', paddingLeft: depth ? 14 : 0, marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: K.ink }}>{label}</span>
        {vt && <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: vc, borderRadius: 5, padding: '1px 7px' }}>{vt}</span>}
      </div>
      {cond && <div style={{ fontSize: 12, color: K.muted, marginTop: 2 }}>↳ {cond}</div>}
      {children}
    </div>
  )
}

function SourceGroup({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div style={{ margin: '10px 0', breakInside: 'avoid' }}>
      <div style={{ fontSize: 12.5, fontWeight: 800, color: K.ink, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18 }}>
        {links.map(([label, url], i) => (
          <li key={i} style={{ fontSize: 12, lineHeight: 1.5, margin: '0 0 3px' }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: K.blue, textDecoration: 'underline' }}>{label} ↗</a>
          </li>
        ))}
      </ul>
    </div>
  )
}

const fr = (v: number) => v.toLocaleString('fr-CH')
const chf = (v: number) => v >= 1e6 ? 'CHF ' + (v / 1e6).toFixed(1).replace('.0', '') + ' M' : 'CHF ' + fr(v)

export default function PlanLancement() {
  const xL = ['M0', 'M6', 'M12', 'M18', 'M24']
  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: K.body, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' }}>
      <div className="noprint" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: `1px solid ${K.line}`, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="/hub" style={{ fontSize: 12.5, fontWeight: 700, color: K.muted, textDecoration: 'none' }}>← Hub</a>
        <span style={{ flex: 1 }} />
        <button onClick={() => window.print()} style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: K.accent, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>🖨️ Imprimer / Enregistrer en PDF</button>
      </div>

      <article style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 90px' }}>
        {/* COUVERTURE */}
        <div style={{ borderBottom: `3px solid ${K.ink}`, paddingBottom: 22, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: K.accent, letterSpacing: '.12em', textTransform: 'uppercase' }}>Clutch · Document confidentiel</div>
          <h1 style={{ fontSize: 35, fontWeight: 900, color: K.ink, margin: '8px 0 6px', lineHeight: 1.1 }}>Plan de lancement & étude de marché</h1>
          <div style={{ fontSize: 15, color: K.muted }}>Rencontres <strong style={{ color: K.body }}>et activités en vrai</strong> — Lausanne → Suisse romande → Suisse → Europe francophone</div>
          <div style={{ fontSize: 12.5, color: K.muted, marginTop: 14 }}>Version 2 · 30 juin 2026 · <span style={{ color: K.body }}>chiffres sourcés (recherche web, sources en §13), marqués RÉEL ou ESTIMÉ ; projections = modèle transparent à hypothèses explicites</span></div>
        </div>

        <Note tone="accent"><strong>Sommaire</strong> — 1. Résumé exécutif · 2. Le repositionnement : rencontres + activités · 3. Le marché (chiffres réels) · 4. Le vrai problème : densité & rétention · 5. Combien d'utilisateurs ? (reality-check honnête) · 6. Modèle de revenus & projections mensuelles · 7. Coûts publicitaires réels & le mur du paid · 8. Arborescence des stratégies de lancement · 9. Cible : qui viser · 10. Timeline (seeding 3-6 mois) · 11. Financement · 12. Les erreurs à éviter · 13. Sources.</Note>

        {/* 1 */}
        <H2 n="1.">Résumé exécutif</H2>
        <P>Clutch transforme l'intention de se voir en <strong>rencontre réelle et immédiate</strong> — pour un verre, une activité, un sport, une sortie. Ce n'est pas une énième app de dating : c'est une app de <strong>lien social IRL</strong> pour les <strong>25-45 ans</strong>, célibataires <em>ou non</em>. Le marché des apps sociales (~98 Md$, +28 %/an) est <strong>7 à 10× plus grand</strong> que le dating seul (~14 Md$, +7,6 %)<Src>TBRC, Grand View</Src>, et l'Europe est la <strong>première région mondiale de l'industrie des événements</strong> (~736 Md$)<Src>Allied/Technavio</Src>.</P>
        <P><strong>Le risque déterminant n'est ni technique ni financier : c'est la liquidité locale</strong> (assez de gens disponibles, au même endroit, au même moment) <strong>et la rétention</strong>. La stratégie en découle : fabriquer la densité par des <strong>événements physiques</strong>, localement, avant toute publicité payante — qui, en Suisse, est prohibitive.</P>
        <Table head={['Issue', 'Probabilité', 'MAU Lausanne (réaliste)']} rows={[
          ['Échec (densité jamais atteinte)', '~60-70 %', '< 250'],
          ['Petite réussite romande', '~20-25 %', '550-2 800'],
          ['Belle société suisse', '~8-12 %', 'expansion CH'],
          ['Succès européen francophone', '~3-5 %', 'multi-pays'],
        ]} accentCol={1} />
        <P style={{ fontSize: 12 }}>Probabilités revues vers le bas vs la 1ʳᵉ version : la base de référence réelle est que <strong>80-90 % des startups consumer meurent en 3 ans</strong>, et le social cold-start est dans le bas de la fourchette<Src>DemandSage, Equidam</Src>. Être lucide est la condition de crédibilité.</P>
        <P><strong>Demande :</strong> CHF 100-150 k pour 12-18 mois de piste. Source : Venture Kick (jalonné, voir §11 — ⚠️ pas « non-dilutif », correction faite) + tour d'amorçage business angel suisse déclenché par la preuve de traction (~1 000-1 500 MAU + événements qui tournent).</P>

        {/* 2 */}
        <H2 n="2.">Le repositionnement : rencontres + activités</H2>
        <P>Limiter Clutch aux célibataires exclut la moitié des gens et nous met en concurrence frontale avec Tinder sur un marché mature qui stagne. En l'élargissant aux <strong>activités en vrai</strong> (sport, yoga, apéros, sorties, networking), on adresse <strong>tout le monde qui veut du lien</strong> — et on change de catégorie de marché.</P>
        <BarChart title="Taille de marché : dating seul vs apps sociales vs événements (Md$)" unit="Le repositionnement fait changer de catégorie. Sources : Grand View (dating), TBRC (social), Allied (events)."
          bars={[{ label: 'Dating (CAGR 7,6 %)', value: 14, color: K.muted }, { label: 'Apps sociales (CAGR 28 %)', value: 98, color: K.accent }, { label: 'Industrie événements', value: 736, color: K.blue }]}
          fmt={v => v + ' Md$'} />
        <H3>Pourquoi c'est validé par les chiffres</H3>
        <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
          <Li><strong>84 % des Suisses font du sport, 20 % sont en fitness, 25 % en club</strong><Src>Sport Suisse 2020, OFSPO</Src> → le volet activités est un bassin massif, pas une niche.</Li>
          <Li><strong>L'amitié/le lien pur se monétise mal</strong> (Bumble BFF, Peanut, Patook restent pré-revenu) — <strong>mais l'événement se monétise très bien</strong> : Timeleft fait <strong>18 M€</strong> de revenus (dîners entre inconnus, cœur 25-50 ans) ; Fever ~724 M$<Src>Substack, Fever</Src>.</Li>
          <Li><strong>L'OMS a fait de la connexion sociale une priorité de santé mondiale (2025)</strong><Src>OMS</Src> — vent de dos narratif crédible (sans jamais pitcher un faux « marché de la solitude »).</Li>
        </ul>
        <Note tone="accent"><strong>Le comparable de référence = Timeleft</strong> : 18 M€ de revenus sur seulement 7 M$ levés, en scalant <em>offline</em> ville par ville. Exactement notre logique « soirée chorégraphiée ».</Note>

        {/* 3 */}
        <H2 n="3.">Le marché (chiffres réels, sourcés)</H2>
        <H3>Démographie — la cible 25-45 (officiel OFS / villes)</H3>
        <Table head={['Zone', 'Population', 'Cible 25-45 (TAM)', 'Adressable « lien + activités » (SAM)']} rows={[
          ['Lausanne', '151 284', '~50 000', '8 500 – 15 000'],
          ['Canton de Vaud', '864 200', '~220-250 000', '~40-75 000'],
          ['Suisse romande', '~2,1 M', '~520-560 000', '90 000 – 165 000'],
          ['Suisse', '9 051 029', '~2,35 M', '400 000 – 700 000'],
        ]} />
        <P style={{ fontSize: 12 }}>Source : OFS (2024), Statistique Lausanne (2025), Statistique Vaud. SAM = part « ouverte au lien/activités » : plancher dur <strong>17 % vivent seuls</strong> (~1,5 M en CH)<Src>OFS ménages</Src>, élargi par le volet activités. Pouvoir d'achat : une personne seule &lt;65 ans dispose de <strong>~4 529 CHF/mois</strong><Src>OFS budget</Src> → un abo 10-40 CHF n'est pas un frein (sauf étudiants &lt;25 ans). Smartphone ~96-100 %.</P>
        <H3>Concurrents & leçons</H3>
        <Table head={['Acteur', 'Échelle', 'Leçon pour Clutch']} rows={[
          ['Timeleft', '18 M€ rev. / 7 M$ levés', '✅ l\'événement monétise ; scale offline ville/ville'],
          ['Fever', '125 M users, ~724 M$', '✅ produire ses propres expériences = marge (take-rate 25-50 %)'],
          ['Tinder', '~1,3 % de la pop CH', 'le leader lui-même ne capte qu\'un faible % → viser un % de ville est un faux objectif'],
          ['Bumble BFF / Peanut', 'pré-revenu', '⚠️ l\'amitié pure ne paie pas — il faut l\'événement'],
          ['Meetup', '60 M membres, stagnant', '⚠️ éviter l\'abo organisateur seul (plafonné, fronde)'],
        ]} />

        {/* 4 */}
        <H2 n="4.">Le vrai problème : densité & rétention</H2>
        <P>La bonne métrique n'est pas « combien d'inscrits » mais <strong>« combien de personnes disponibles en même temps, dans le rayon »</strong>. Et juste après : <strong>est-ce qu'elles reviennent ?</strong></P>
        <BarChart title="Rétention à 30 jours (D30) — le vrai juge" unit="Clutch DOIT viser le profil « app sociale », pas « dating ». Source : a16z (social), Business of Apps (dating)."
          bars={[{ label: 'Dating (réel)', value: 3, color: K.red }, { label: 'App sociale « good »', value: 25, color: K.amber }, { label: 'App sociale « great »', value: 30, color: K.green }]}
          fmt={v => v + ' %'} />
        <Note tone="red"><strong>Le piège du dating :</strong> le dating retient horriblement (D30 ≈ 3 %) car réussir = quitter l'app. En orientant Clutch vers le <strong>lien récurrent + les activités</strong>, on vise le profil « app sociale » (D30 25-30 %) — c'est une question de survie, pas de confort. Une app à D30 = 3 % meurt même avec 12 000 installs.</Note>
        <P><strong>Temps pour la masse critique :</strong> Tinder et Bumble ont mis <strong>3-6 mois de seeding manuel</strong> (campus, soirées, porte-à-porte) <em>avant</em> tout effet de réseau<Src>HBS, How They Grow</Src>. Il n'y a pas de raccourci : on fabrique la densité à la main, localement, d'abord.</P>

        {/* 5 */}
        <H2 n="5.">Combien d'utilisateurs ? (reality-check honnête)</H2>
        <P>Point critique de crédibilité. La cible adressable de Lausanne est ~25-30 000 personnes. Même le leader (Tinder) ne capte que ~1,3 % de la population suisse. Voici ce qui est <strong>réellement atteignable</strong> — pas des chiffres flatteurs.</P>
        <BarChart title="MAU réalistes à Lausanne par scénario (utilisateurs actifs mensuels)" unit="% de la cible adressable (~27 500). « 12 000 MAU » = ~45 % de la cible = irréaliste pour une app nouvelle. Source : Statista, a16z, Sensor Tower."
          bars={[{ label: 'FLOP (<1 %)', value: 250, color: K.red }, { label: 'MOYEN (2-4 %)', value: 825, color: K.amber }, { label: 'BON (6-10 %)', value: 2200, color: K.green }, { label: 'EXCELLENT (15-20 %)', value: 4800, color: K.blue }]}
          fmt={v => v === 250 ? '< 250' : v === 825 ? '550-1 100' : v === 2200 ? '1 600-2 800' : '4 100-5 500'} />
        <Note tone="accent"><strong>Cible « prouver le concept » = 500-1 500 MAU à Lausanne</strong>, pas 12 000. C'est ce niveau (densité + rétention + premiers revenus) qui finance la suite. Et on pilote la <strong>densité instantanée</strong> (disponibles/soir/rayon), pas le MAU global : 300 concentrés un vendredi soir &gt; 3 000 éparpillés.</Note>

        {/* 6 */}
        <H2 n="6.">Modèle de revenus & projections mensuelles</H2>
        <Note><strong>Modèle transparent.</strong> Revenu mensuel par utilisateur actif (ARPMAU) = premium (conversion <strong>3 %</strong> × CHF 14) + <strong>events</strong> (15 % assistent/mois × CHF 25 × take-rate 15 %) + boosts + B2B ≈ <strong>CHF 1,3/MAU/mois</strong> (base) à <strong>CHF 2,6</strong> (haut). Conversion volontairement prudente (dating réel : payants &lt;5-10 %<Src>Statista</Src>). La <strong>nouveauté vs dating</strong> : l'événement ajoute un flux de revenu que l'abo seul n'a pas.</Note>
        <LineChart title="Revenu mensuel récurrent (MRR) à Lausanne sur 24 mois (CHF, base)" xLabels={xL} yMax={8000} yUnit="MRR base (CHF 1,3/MAU). Lausanne seule n'est pas un centre de profit : c'est une PREUVE. Le revenu vient de l'échelle (§suivant)."
          series={[
            { name: 'Flop', color: K.red, data: [0, 200, 290, 320, 325] },
            { name: 'Moyen', color: K.amber, data: [0, 780, 1300, 1365, 1430] },
            { name: 'Bon', color: K.green, data: [0, 1560, 2600, 3250, 3640] },
            { name: 'Excellent', color: K.blue, data: [0, 3250, 5200, 6500, 7150] },
          ]} />
        <BarChart title="Décomposition du revenu (par utilisateur actif/mois, base)" unit="L'événement (take-rate ~15 %) est le 2ᵉ moteur, absent du dating classique."
          bars={[{ label: 'Premium (abos)', value: 0.42, color: K.accent }, { label: 'Events (billets)', value: 0.56, color: K.blue }, { label: 'Boosts / crédits', value: 0.15, color: K.green }, { label: 'Partenaires B2B', value: 0.20, color: K.amber }]}
          fmt={v => 'CHF ' + v.toFixed(2)} />
        <H3>Potentiel à l'échelle (plusieurs années, pénétration « Bon »)</H3>
        <BarChart title="Revenu annuel (ARR) potentiel par géographie (CHF/an, fourchette base→haut)" unit="Lausanne = preuve, pas profit. Le revenu se construit en montant en surface géographique. Hypothèse : densité prouvée à chaque étape."
          bars={[{ label: 'Lausanne', value: 90000, color: K.accent }, { label: 'Suisse romande', value: 800000, color: K.accent }, { label: 'Suisse', value: 2200000, color: K.accent }, { label: 'Europe francophone', value: 12000000, color: K.accent }]}
          fmt={v => v >= 1e6 ? '~CHF ' + (v / 1e6).toFixed(0) + ' M' : '~CHF ' + fr(v)} />
        <P style={{ fontSize: 12 }}><strong>Lecture :</strong> Lausanne au mieux ≈ CHF 50-90 k/an — ça <strong>ne rend pas riche</strong>, ça <strong>prouve</strong> (densité + rétention + des gens paient). C'est cette preuve qui débloque la levée pour financer la Romandie puis la Suisse, où se trouve le vrai revenu.</P>

        {/* 7 */}
        <H2 n="7.">Coûts publicitaires réels & le mur du paid</H2>
        <Table head={['Canal', 'Coût réel (Suisse)', 'Source', 'Verdict']} rows={[
          ['Meta (Insta/FB)', 'CPM 12-17 $ · CPC ~2,40 $', 'AdAmigo 2026', 'CH = marché le + cher d\'Europe (~2× moyenne)'],
          ['TikTok', 'CPM ~13 $ (mondial)', 'Triple Whale', 'pas de chiffre CH ; ~8-14 $ estimé'],
          ['Apple Search Ads (social)', 'CPI ~3,90 $', 'AppTweak', 'le moins cher, mais volume CH minuscule'],
          ['CPI install', 'iOS 4,70 $ / Android 3,70 $', 'Business of Apps', 'install cheap…'],
          ['CAC utilisateur PAYANT', '~CHF 100-230', 'dérivé (2-5 % install→payant)', '…mais le payant coûte une fortune'],
          ['Influence micro CH', '200-800 CHF/post (+15-25 % multilingue)', 'Metromodels', '✅ meilleur ROI local que le paid'],
        ]} />
        <Note tone="red"><strong>Le mur du paid en Suisse :</strong> garde-fou LTV:CAC ≥ 3:1 → avec un premium à CHF 19,90 et ~4 mois de rétention (LTV ~80 CHF), le CAC payant doit rester <strong>sous ~25 CHF</strong>. Or le CAC payant réel en CH est ~100-230 CHF. <strong>Conclusion : la pub payante seule nous ruine.</strong> On amorce par <strong>l'influence micro + les événements + le bouche-à-oreille</strong> ; le paid n'arrive qu'en accélérateur, après la preuve de rétention, et seulement si les chiffres tiennent.</Note>

        {/* 8 ARBORESCENCE */}
        <H2 n="8.">Arborescence des stratégies de lancement</H2>
        <P>Toutes les possibilités, en arbre, avec leur verdict et leur condition de déclenchement. On en mène <strong>plusieurs en parallèle</strong> — mais chaque branche a une porte (« on ne passe à la suivante que si… »).</P>
        <div style={{ border: `1px solid ${K.line}`, borderRadius: 10, padding: '14px 16px', margin: '12px 0', breakInside: 'avoid' }}>
          <Branch label="RACINE — fabriquer la densité locale (offline d'abord)">
            <Branch depth={1} label="A. Événements récurrents (apéros, sport, yoga, dîners)" verdict="go" cond="le pilier : c'est ce qui crée la liquidité. Démarrer dès maintenant.">
              <Branch depth={2} label="A1. Produire NOS propres « Clutch events »" verdict="go" cond="modèle Fever : meilleure marge (take-rate 25-50 %) + contrôle de la densité" />
              <Branch depth={2} label="A2. Lister/relayer les events de partenaires" verdict="go" cond="complète l'offre, take-rate 10-20 %" />
            </Branch>
            <Branch depth={1} label="B. B2B — bars, salles de sport, studios yoga partenaires" verdict="go" cond="liquidité + lieux immédiats ; négo lente → commencer tôt" />
            <Branch depth={1} label="C. Liste d'attente + soirée chorégraphiée" verdict="go" cond="crée un PIC de densité à l'ouverture (tout le monde se met dispo au même moment)" />
            <Branch depth={1} label="D. Micro / nano-influence locale" verdict="go" cond="après C : amplifie quand il y a déjà quelque chose à montrer. Meilleur ROI que le paid en CH">
              <Branch depth={2} label="→ combien : ~10-15 créateurs locaux pour amorcer Lausanne" cond="budget CHF 5-10 k, CPI implicite ~2-3 si ça convertit" />
            </Branch>
            <Branch depth={1} label="E. Publicité payante (Meta / TikTok)" verdict="wait" cond="SEULEMENT après preuve de rétention (≥ M4) ET si LTV:CAC ≥ 3 — sinon brûle le cash (mur du paid CH)" />
            <Branch depth={1} label="F. PR / presse locale & étudiante" verdict="wait" cond="opportuniste : donne de la crédibilité, pas de la densité" />
            <Branch depth={1} label="G. Levée + scale agressif multi-villes" verdict="stop" cond="tant que la densité Lausanne n'est pas prouvée : mauvaise valo, dilution, densité diluée" />
          </Branch>
        </div>
        <P><strong>Séquence dans le temps :</strong> A + B + C en parallèle dès le départ → D quand ça vit → E/F au cas par cas après la preuve → G seulement après une ville prouvée.</P>

        {/* 8bis SCÉNARIO ROMANDIE */}
        <H2 n="8b.">Option ambitieuse : « Romandie villes-phares » — projection mensuelle</H2>
        <P>Variante plus agressive : attaquer la <strong>Suisse romande</strong> comme marché, mais concentrer la densité physique sur <strong>2-3 villes-phares</strong> (Lausanne + Genève, puis Fribourg/Neuchâtel), avec un <strong>gros événement de lancement par ville</strong> et une <strong>liste d'attente Romandie-large</strong>. La Romandie est petite et connectée (Lausanne-Genève 40 min) → un « truc d'événement » y circule bien. Le débordement vers la <strong>France frontalière</strong> (Genève-Annemasse) se fait ensuite naturellement si le produit plaît.</P>
        <Note tone="red"><strong>Le trade-off à assumer :</strong> « partout d'un coup » au sens strict dilue la densité (= mort). La version viable = <strong>marque + waitlist partout</strong> (gratuit) mais <strong>densité concentrée sur les villes-phares</strong> qui s'allument l'une après l'autre. Et surtout : cette option coûte <strong>~CHF 100-150 k d'entrée</strong> (2 gros events + influence multi-villes) → il faut <strong>lever AVANT la preuve</strong> = plus risqué que Lausanne-d'abord.</Note>
        <LineChart title="Revenu mensuel — scénario Romandie villes-phares (CHF, base CHF 1,3/actif)" xLabels={['M0', 'M3', 'M6', 'M9', 'M12', 'M15', 'M18']} yMax={30000} yUnit="Revenu = utilisateurs actifs × CHF 1,3/mois. M0 = début de la campagne Romandie (≈ 2027 après la preuve Lausanne). En haut de fourchette (events forts, CHF 1,8/actif) : +40 %."
          series={[
            { name: 'Flop', color: K.red, data: [0, 390, 780, 1170, 1300, 1430, 1560] },
            { name: 'Moyen', color: K.amber, data: [0, 650, 1950, 3640, 5200, 7150, 9100] },
            { name: 'Bon / viral', color: K.green, data: [0, 1300, 5200, 10400, 15600, 22100, 28600] },
          ]} />
        <Table head={['', 'Flop', 'Moyen', 'Bon / viral']} rows={[
          ['Utilisateurs actifs M6', '~600', '~1 500', '~4 000'],
          ['Utilisateurs actifs M12', '~1 000', '~4 000', '~12 000'],
          ['Utilisateurs actifs M18', '~1 200', '~7 000', '~22 000'],
          ['Revenu / mois à M12', 'CHF ~1 300', 'CHF ~5 200', 'CHF ~15 600'],
          ['Revenu / mois à M18', 'CHF ~1 560', 'CHF ~9 100', 'CHF ~28 600'],
          ['Revenu cumulé année 1', '~CHF 8-10 k', '~CHF 25-35 k', '~CHF 80-110 k'],
          ['Coût de la campagne (12-18 mois)', 'CHF 100-150 k', 'CHF 100-150 k', 'CHF 100-150 k'],
        ]} accentCol={3} />
        <Note tone="accent"><strong>Lecture honnête :</strong> même en scénario « bon/viral », l'<strong>année 1 reste déficitaire</strong> (revenu ~80-110 k vs coût ~130 k) — mais tu sors avec ~<strong>22 000 actifs et ~CHF 29 k/mois de revenu</strong>, une base qui devient rentable en année 2 et qui vaut une vraie valorisation. En « moyen », tu es à ~CHF 9 k/mois à M18 : ça vit, ça ne finance pas encore la Suisse. Cette option <strong>maximise l'upside mais exige de lever ~150 k d'abord</strong> — l'inverse du chemin prudent Lausanne-d'abord.</Note>

        {/* 9 CIBLE */}
        <H2 n="9.">Cible : qui viser</H2>
        <Table head={['Segment', 'Rôle', 'Ce que dit la donnée']} rows={[
          ['25-45 ans (cœur)', 'cible primaire', 'les plus seuls = 18-34 (surtout hommes) ; pouvoir d\'achat OK dès 25+'],
          ['Amateurs d\'activités (sport/yoga/sorties)', 'élargit le bassin', '84 % font du sport → bien plus large que « célibataires »'],
          ['Nouveaux arrivants / expats', 'forte douleur, paient', 'besoin aigu de lien ; nécessite l\'anglais (i18n) → Phase 2'],
          ['Seniors 50+', 'Phase 2 (pas le wedge)', '⚠️ seulement 3 % des 50+ actifs sur apps, stable depuis 2019'],
          ['Étudiants 18-24', 'carburant densité, peu de revenu', 'denses/viraux mais pouvoir d\'achat faible → pas le portefeuille'],
        ]} />
        <Note><strong>Décision :</strong> cœur <strong>25-45</strong> orienté <strong>rencontres + activités</strong> (pas que célibataires). Les étudiants restent un accélérateur de densité, pas la source de revenu. Les seniors = extension Phase 2 (le narratif « activités » leur parle plus que « dating »), <strong>pas</strong> le point de départ.</Note>

        {/* 10 TIMELINE */}
        <H2 n="10.">Timeline (depuis le 30 juin 2026)</H2>
        <P>On ancre sur le <strong>gate de densité</strong>, pas sur une date. Et on intègre la règle réelle : <strong>3-6 mois de seeding manuel</strong> avant tout effet de réseau.</P>
        <Table head={['Période', 'Phase', 'Jalons']} rows={[
          ['Été 2026 (juil.-août)', 'Produit + amorce', 'Finir le cycle humain · liste d\'attente · marque IGE · dossier Venture Kick'],
          ['Automne 2026', 'Bêta + seeding', '20-50 testeurs (amis + Dom) · 1ʳᵉˢ soirées chorégraphiées + events'],
          ['Hiver 2026', 'Densité offline', '~10 événements récurrents · mesurer la rétention D30 (objectif ≥ 20 %)'],
          ['Hiver-Printemps 2027', 'Lancement Lausanne', 'Quand le gate densité tient (~1 000-1 500 MAU concentrés)'],
          ['Été 2027', 'Monétisation', 'Events payants · abos · micro-influence · 1er paid test'],
          ['M6 post-lancement', 'Levée', 'Si rétention + revenus → business angel'],
          ['Fin 2027 / 2028', 'Romandie → Suisse', 'Genève d\'abord ; densité prouvée à chaque étape'],
          ['2029+', 'Europe francophone', 'France/Belgique — tour de financement dédié'],
        ]} />

        {/* 11 FINANCEMENT */}
        <H2 n="11.">Financement</H2>
        <Note tone="red"><strong>Correction importante (vérifiée) :</strong> Venture Kick n'est <strong>PAS « 150 k non-dilutif »</strong>. Seuls les <strong>premiers 10 k</strong> sont un don ; les <strong>40 k + 100 k</strong> suivants sont des <strong>prêts convertibles</strong> (donc dilutifs au prochain tour), et le programme <strong>exige un lien académique</strong> (EPFL/UNIL)<Src>venturekick.ch</Src>. À vérifier : notre éligibilité.</Note>
        <Table head={['Source', 'Montant', 'Conditions']} rows={[
          ['Venture Kick', '10 k don + 140 k prêts convertibles', 'lien académique requis ; étapes jalonnées'],
          ['Business angels (SICTIC)', 'ticket dès 5 k · tours 200 k-2 M', 'valo max 8 M pour éligibilité ; 120+ startups financées 2024'],
          ['Tour d\'amorçage visé', 'CHF 250-450 k à M6', 'déclenché par la preuve de traction'],
        ]} />
        <H3>Use of funds (sur CHF 120 k)</H3>
        <Table head={['Poste', 'Part', 'Montant']} rows={[
          ['Événements + production (densité)', '35 %', 'CHF 42 k'],
          ['Micro-influence + contenu', '20 %', 'CHF 24 k'],
          ['Produit / infra', '15 %', 'CHF 18 k'],
          ['Liste d\'attente + créa + marque', '10 %', 'CHF 12 k'],
          ['Test paid limité (M4+)', '10 %', 'CHF 12 k'],
          ['Réserve', '10 %', 'CHF 12 k'],
        ]} accentCol={2} />

        {/* 12 ERREURS */}
        <H2 n="12.">Les erreurs à éviter</H2>
        <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <Li><strong>Lancer large / une ville vide</strong> — cause n°1 de mort. Concentrer toujours (rayon × créneau).</Li>
          <Li><strong>Viser un % de la population (« 12 000 MAU »)</strong> — faux objectif : même Tinder = 1,3 % de la CH. Piloter la densité.</Li>
          <Li><strong>Se comporter comme une app de dating</strong> — D30 ≈ 3 % = mort. Viser le profil social (lien + activités récurrentes).</Li>
          <Li><strong>Payer de la pub trop tôt en Suisse</strong> — CAC payant ~100-230 CHF, le marché le plus cher d'Europe.</Li>
          <Li><strong>Monétiser l'amitié au lieu de l'événement</strong> — BFF/Peanut le prouvent : c'est le billet qui paie.</Li>
          <Li><strong>Négliger la sécurité / l'expérience des femmes</strong> — elles sont la gravité de l'app.</Li>
          <Li><strong>Partir sur les seniors</strong> — 3 % d'actifs, marché froid. Phase 2, pas wedge.</Li>
          <Li><strong>S'étendre à plusieurs villes trop tôt</strong> — dilue la densité sous le seuil de mort.</Li>
          <Li><strong>Vendre la technologie (« forteresse »)</strong> — invisible ; elle sert la rétention, pas l'acquisition. Garder secrète.</Li>
          <Li><strong>Confondre installs cumulés et MAU</strong>, et <strong>lever trop tôt</strong> (mauvaise valo, rien à montrer).</Li>
        </ol>
        <Note tone="accent"><strong>Les 3 vérités dures :</strong> (1) le produit ne crée pas la liquidité — <strong>les événements la créent</strong> ; (2) la forteresse ne vend pas l'app — <strong>elle améliore la rétention</strong> ; (3) le plus gros risque n'est pas la technologie — <strong>c'est de lancer trop tôt dans une ville vide</strong>.</Note>

        {/* 13 SOURCES */}
        <H2 n="13.">Sources & méthode</H2>
        <P style={{ fontSize: 12 }}><strong>Méthode :</strong> recherche web par 4 analystes (30.06.2026), chiffres marqués RÉEL (sourcé) ou ESTIMÉ (extrapolation explicitée). Les projections sont un <strong>modèle transparent à hypothèses affichées</strong>, pas des garanties. <strong>Toutes les sources ci-dessous sont cliquables.</strong></P>
        <SourceGroup title="Marché (taille & croissance)" links={[
          ['Apps sociales ~98 Md$, CAGR 28 % — TBRC', 'https://www.globenewswire.com/news-release/2025/01/27/3015333/28124/en/Social-Networking-App-Market-Outlook-Global-Social-Networking-App-Market-Projected-to-Reach-207-31-Billion-by-2028-with-a-CAGR-of-28-3.html'],
          ['Industrie des événements ~736 Md$ — Allied Market Research', 'https://www.globenewswire.com/news-release/2025/02/04/3020163/0/en/Events-Industry-Market-to-Reach-2-5-Trillion-Globally-by-2035-at-6-8-CAGR-Allied-Market-Research.html'],
          ['Croissance events Europe — Technavio', 'https://www.prnewswire.com/news-releases/events-industry-market-to-grow-by-usd-1-07-trillion-2025-2029-driven-by-increased-corporate-events-report-highlights-ai-driven-market-transformation---technavio-302358595.html'],
          ['Pénétration dating CH 11,7 % — Statista', 'https://www.statista.com/outlook/emo/dating-services/online-dating/switzerland'],
          ['Tinder ~1,3 % pop CH — Sensor Tower', 'https://sensortower.com/blog/2025-q2-unified-top-5-dating-units-ch-64c9b6bbe1714cfff1c9d0e8'],
        ]} />
        <SourceGroup title="Comparables (Timeleft, Fever, etc.)" links={[
          ['Timeleft 18 M€ ARR — Substack', 'https://timfrin.substack.com/p/inside-timelefts-journey-to-connecting'],
          ['Fever ~724 M$ — Newsroom', 'https://newsroom.feverup.com/en-US/250714-fever-secures-100m-strengthening-its-position-as-the-leading-independent-live-entertainment-tech-platform/'],
          ['Eventbrite 325 M$ FY2024 — SEC', 'https://www.sec.gov/Archives/edgar/data/0001475115/000147511525000025/earningspressrelease-fy2024.htm'],
          ['Strava — Business of Apps', 'https://www.businessofapps.com/data/strava-statistics/'],
        ]} />
        <SourceGroup title="Coûts publicitaires" links={[
          ['Meta CPM par pays (Suisse) — AdAmigo', 'https://www.adamigo.ai/blog/meta-ads-cpm-cpc-benchmarks-by-country-2026'],
          ['Benchmarks Meta — WebFX', 'https://www.webfx.com/blog/social-media/meta-benchmarks/'],
          ['TikTok Ads — Triple Whale', 'https://www.triplewhale.com/blog/tiktok-benchmarks'],
          ['Apple Search Ads (social/lifestyle) — AppTweak', 'https://www.apptweak.com/en/aso-blog/apple-ads-benchmarks'],
          ['Coûts d\'acquisition (CPI/CAC) — Business of Apps', 'https://www.businessofapps.com/marketplace/user-acquisition/research/user-acquisition-costs/'],
          ['CPI dating — Adjust', 'https://www.adjust.com/blog/valentines-day-app-trends-2025/'],
          ['Influence Suisse (tarifs) — Metromodels', 'https://www.metromodels.com/en/news/12142-schweizer-influencer-marketing-aktuelle-preise-und-marktentwicklung-2026/'],
        ]} />
        <SourceGroup title="Rétention, conversion, échec" links={[
          ['Benchmark app sociale (D30) — a16z', 'https://a16z.com/do-you-have-lightning-in-a-bottle-how-to-benchmark-your-social-app/'],
          ['Benchmarks dating (rétention 3 %) — Business of Apps', 'https://www.businessofapps.com/data/dating-app-benchmarks/'],
          ['LTV:CAC — Adapty', 'https://adapty.io/blog/customer-acquisition-cost/'],
          ['Taux d\'échec startups — DemandSage', 'https://www.demandsage.com/startup-failure-rate/'],
        ]} />
        <SourceGroup title="Démographie & société (officiel)" links={[
          ['Population par âge — OFS', 'https://www.bfs.admin.ch/bfs/fr/home/statistiques/population/effectif-evolution/age.html'],
          ['Ménages (17 % vivent seuls) — OFS', 'https://www.bfs.admin.ch/bfs/fr/home/statistiques/population/familles/menages.html'],
          ['Budget des ménages (pouvoir d\'achat) — OFS', 'https://www.bfs.admin.ch/bfs/fr/home/statistiques/situation-economique-sociale-population/revenus-consommation-et-fortune/budget-des-menages.html'],
          ['Statistique Lausanne (151 284 hab)', 'https://www.lausanne.ch/officiel/statistique'],
          ['Statistique Vaud', 'https://www.vd.ch/etat-droit-finances/statistique/statistiques-par-domaine/01-population/etat-et-structure-de-la-population'],
          ['Sport Suisse 2020 (84 % font du sport) — OFSPO', 'https://www.sportobs.ch/inhalte/Downloads/Bro_Sport_Schweiz_2020_f_WEB.pdf'],
          ['Solitude = priorité santé mondiale — OMS 2025', 'https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death'],
          ['Les plus seuls = jeunes hommes — Gallup', 'https://news.gallup.com/poll/690788/younger-men-among-loneliest-west.aspx'],
          ['Seniors 50+ : 3 % actifs — Pew', 'https://www.pewresearch.org/short-reads/2023/07/17/dating-at-50-and-up-older-americans-experiences-with-online-dating/'],
        ]} />
        <SourceGroup title="Financement Suisse" links={[
          ['Venture Kick (10k don + prêts convertibles)', 'https://www.venturekick.ch/fr'],
          ['SICTIC (réseau business angels CH)', 'https://www.sictic.ch/'],
        ]} />
        <P style={{ fontSize: 11.8 }}>Détail complet de la recherche (tous les chiffres + statut RÉEL/ESTIMÉ) : fichier <strong>docs/recherche-marche-30jun.md</strong> du projet.</P>

        <div style={{ borderTop: `2px solid ${K.ink}`, marginTop: 36, paddingTop: 12, fontSize: 11, color: K.muted, textAlign: 'center' }}>Clutch · Plan de lancement & étude de marché · v2 · 30 juin 2026 · document confidentiel</div>
      </article>
      <style>{`@media print { .noprint { display: none !important; } article { max-width: none !important; padding: 0 12px !important; } @page { margin: 14mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  )
}
