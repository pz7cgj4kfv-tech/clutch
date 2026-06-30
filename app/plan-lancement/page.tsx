'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /plan-lancement — DOCUMENT D'INVESTISSEMENT (fond blanc, imprimable PDF).
// Un vrai audit long-format : marché, matrices de scénarios, projections financières par géographie
// dans le temps (graphes), business angel vs micro-influenceurs (calcul), plan pub, liste d'attente,
// timeline depuis le 30 juin 2026, erreurs à éviter. Conçu pour être imprimé (Cmd+P → PDF) et démarché.
// Hypothèses TOUJOURS explicites. Chiffres = benchmarks marché à vérifier, modèle transparent.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'

const K = {
  ink: '#1a1a1a', body: '#33373d', muted: '#6b7280', line: '#e5e7eb', soft: '#f7f8fa',
  accent: '#E27C00', green: '#1f9d55', amber: '#d97706', red: '#c0392b', blue: '#2563eb',
}

// ── petits composants document ──────────────────────────────────────────────
const H2 = ({ n, children }: { n?: string; children: React.ReactNode }) => (
  <h2 style={{ fontSize: 22, fontWeight: 800, color: K.ink, margin: '40px 0 6px', paddingTop: 8, borderTop: `2px solid ${K.ink}`, breakAfter: 'avoid' }}>
    {n && <span style={{ color: K.accent, marginRight: 10 }}>{n}</span>}{children}
  </h2>
)
const H3 = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: 15.5, fontWeight: 800, color: K.ink, margin: '22px 0 6px', breakAfter: 'avoid' }}>{children}</h3>
)
const P = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ fontSize: 13.5, lineHeight: 1.62, color: K.body, margin: '0 0 10px', ...style }}>{children}</p>
)
const Li = ({ children }: { children: React.ReactNode }) => (
  <li style={{ fontSize: 13.5, lineHeight: 1.55, color: K.body, margin: '0 0 5px' }}>{children}</li>
)
const Note = ({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'accent' | 'red' | 'green' }) => {
  const c = tone === 'accent' ? K.accent : tone === 'red' ? K.red : tone === 'green' ? K.green : K.muted
  return <div style={{ background: K.soft, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '11px 14px', margin: '12px 0', fontSize: 13, lineHeight: 1.6, color: K.body, breakInside: 'avoid' }}>{children}</div>
}

// ── TABLE générique ─────────────────────────────────────────────────────────
function Table({ head, rows, accentCol }: { head: string[]; rows: (string | React.ReactNode)[][]; accentCol?: number }) {
  return (
    <div style={{ overflowX: 'auto', margin: '12px 0', breakInside: 'avoid' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.3, minWidth: 560 }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ textAlign: i === 0 ? 'left' : 'center', padding: '8px 9px', background: K.ink, color: '#fff', fontWeight: 700, fontSize: 11.5, whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} style={{ borderBottom: `1px solid ${K.line}`, background: ri % 2 ? K.soft : '#fff' }}>
              {r.map((c, ci) => <td key={ci} style={{ textAlign: ci === 0 ? 'left' : 'center', padding: '7px 9px', color: ci === accentCol ? K.accent : K.body, fontWeight: ci === 0 || ci === accentCol ? 700 : 400, verticalAlign: 'top' }}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── LINE CHART (revenu dans le temps) ───────────────────────────────────────
function LineChart({ title, series, xLabels, yMax, yUnit }: { title: string; series: { name: string; color: string; data: number[] }[]; xLabels: string[]; yMax: number; yUnit: string }) {
  const W = 620, Hh = 260, padL = 52, padR = 14, padT = 16, padB = 34
  const iw = W - padL - padR, ih = Hh - padT - padB
  const x = (i: number) => padL + (i / (xLabels.length - 1)) * iw
  const y = (v: number) => padT + ih - (v / yMax) * ih
  const ticks = 4
  return (
    <figure style={{ margin: '14px 0 18px', breakInside: 'avoid' }}>
      <figcaption style={{ fontSize: 12.5, fontWeight: 700, color: K.ink, marginBottom: 4 }}>{title}</figcaption>
      <svg viewBox={`0 0 ${W} ${Hh}`} style={{ width: '100%', height: 'auto', border: `1px solid ${K.line}`, borderRadius: 8, background: '#fff' }}>
        {Array.from({ length: ticks + 1 }).map((_, t) => {
          const v = (yMax / ticks) * t
          return <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} stroke={K.line} strokeWidth={1} />
            <text x={padL - 6} y={y(v) + 3} textAnchor="end" fontSize={9.5} fill={K.muted}>{v >= 1000 ? (v / 1000) + 'k' : v}</text>
          </g>
        })}
        {xLabels.map((l, i) => <text key={i} x={x(i)} y={Hh - 12} textAnchor="middle" fontSize={9.5} fill={K.muted}>{l}</text>)}
        {series.map((s, si) => (
          <g key={si}>
            <polyline fill="none" stroke={s.color} strokeWidth={2.2} points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
            {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={2.6} fill={s.color} />)}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 4 }}>
        {series.map((s, i) => <span key={i} style={{ fontSize: 11.5, color: K.body, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 11, height: 3, background: s.color, display: 'inline-block', borderRadius: 2 }} />{s.name}</span>)}
      </div>
      <div style={{ fontSize: 10.5, color: K.muted, marginTop: 2 }}>{yUnit}</div>
    </figure>
  )
}

// ── BAR CHART ───────────────────────────────────────────────────────────────
function BarChart({ title, bars, unit, fmt }: { title: string; bars: { label: string; value: number; color?: string }[]; unit: string; fmt?: (v: number) => string }) {
  const max = Math.max(...bars.map(b => b.value))
  return (
    <figure style={{ margin: '14px 0 18px', breakInside: 'avoid' }}>
      <figcaption style={{ fontSize: 12.5, fontWeight: 700, color: K.ink, marginBottom: 8 }}>{title}</figcaption>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 132, fontSize: 11.5, color: K.body, textAlign: 'right', flexShrink: 0 }}>{b.label}</span>
            <div style={{ flex: 1, background: K.soft, borderRadius: 5, height: 22, position: 'relative' }}>
              <div style={{ width: `${Math.max(2, (b.value / max) * 100)}%`, height: '100%', background: b.color || K.accent, borderRadius: 5 }} />
            </div>
            <span style={{ width: 92, fontSize: 11.5, fontWeight: 700, color: K.ink, flexShrink: 0 }}>{fmt ? fmt(b.value) : b.value.toLocaleString('fr-CH')}</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: K.muted, marginTop: 6 }}>{unit}</div>
    </figure>
  )
}

const fr = (v: number) => v.toLocaleString('fr-CH')

export default function PlanLancement() {
  const [print, setPrint] = useState(false)
  const xLabels = ['M0', 'M6', 'M12', 'M18', 'M24']

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: K.body, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' }}>
      {/* barre d'action (cachée à l'impression) */}
      <div className="noprint" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: `1px solid ${K.line}`, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="/hub" style={{ fontSize: 12.5, fontWeight: 700, color: K.muted, textDecoration: 'none' }}>← Hub</a>
        <span style={{ flex: 1 }} />
        <button onClick={() => window.print()} style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: K.accent, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>🖨️ Imprimer / Enregistrer en PDF</button>
      </div>

      <article style={{ maxWidth: 820, margin: '0 auto', padding: '40px 28px 90px' }}>
        {/* ── COUVERTURE ── */}
        <div style={{ borderBottom: `3px solid ${K.ink}`, paddingBottom: 22, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: K.accent, letterSpacing: '.12em', textTransform: 'uppercase' }}>Clutch · Document confidentiel</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: K.ink, margin: '8px 0 6px', lineHeight: 1.1 }}>Plan de lancement & audit financier</h1>
          <div style={{ fontSize: 15, color: K.muted }}>Application de rencontre spontanée en personne — Lausanne → Suisse romande → Suisse → Europe francophone</div>
          <div style={{ fontSize: 12.5, color: K.muted, marginTop: 14 }}>Version 1 · 30 juin 2026 · établi par l'équipe Clutch · <span style={{ color: K.body }}>chiffres = benchmarks marché 2025-2026 à vérifier, modèle transparent (hypothèses explicites)</span></div>
        </div>

        {/* ── SOMMAIRE ── */}
        <Note tone="accent">
          <strong>Sommaire</strong> — 1. Résumé exécutif · 2. Le marché & les concurrents · 3. Le vrai problème : la liquidité (seuils chiffrés) ·
          4. Matrice des 7 stratégies de lancement · 5. Projections financières par géographie dans le temps (graphes) ·
          6. Coût pour atteindre chaque palier géographique · 7. Acquisition : business angel vs micro-influenceurs (calcul) ·
          8. Plan publicité & liste d'attente · 9. Business model & prix · 10. Timeline depuis le 30 juin 2026 ·
          11. Les 10 erreurs à éviter · 12. Demande de financement (use of funds) · 13. Sources.
        </Note>

        {/* 1 ── RÉSUMÉ EXÉCUTIF ── */}
        <H2 n="1.">Résumé exécutif</H2>
        <P>Clutch transforme l'intention de rencontre en <strong>rendez-vous réel et immédiat</strong> : on se met disponible (lieu, rayon, horaire, fenêtre 18 h max), on voit qui est disponible à proximité <em>maintenant</em>, on envoie une invitation (« Clutch ») qui se verrouille en vrai RDV. C'est l'anti-swipe : moins de discussions sans fin, plus de vraies rencontres. Le marché suisse du dating est réel et solvable (pénétration ~11,8 %, Tinder ~CHF 1,5 M/mois en Suisse) et traverse une <strong>fatigue du swipe</strong> qui joue en notre faveur.</P>
        <P><strong>Le risque déterminant n'est ni technique ni financier : c'est la liquidité simultanée.</strong> Une app de rencontre spontanée paraît morte si peu de gens sont disponibles en même temps. Toute la stratégie en découle : on <strong>fabrique la densité par des événements physiques</strong> (offline d'abord), localement, avant toute publicité payante.</P>
        <Table
          head={['Issue', 'Probabilité', 'Lecture']}
          rows={[
            ['Échec (< 1 500 MAU stables)', '45 %', 'liquidité jamais atteinte'],
            ['Petite réussite romande', '35 %', 'rentable localement, pas national'],
            ['Belle société suisse', '15 %', 'expansion CH financée'],
            ['Succès européen francophone', '5 %', 'scale multi-pays'],
          ]}
          accentCol={1}
        />
        <P><strong>Demande :</strong> CHF 100–150 k pour 12 mois de piste, dont une part non-dilutive (Venture Kick ~150 k) avant un tour d'amorçage business angel (250–450 k) déclenché par la preuve de traction (~2 000 MAU + événements qui fonctionnent).</P>

        {/* 2 ── MARCHÉ ── */}
        <H2 n="2.">Le marché & les concurrents</H2>
        <H3>Taille de marché (réel, sourcé)</H3>
        <Table
          head={['Zone', 'Population', 'Cible adressable (18-35, célib., open)', 'Note']}
          rows={[
            ['Lausanne', '~140 000', '~25–30 000', '35 000 étudiants (EPFL+UNIL), plus grand campus CH'],
            ['Suisse romande', '~2 000 000', '~250–350 000', 'Genève, Lausanne, Fribourg, Neuchâtel, Valais'],
            ['Suisse', '~8 800 000', '~1–1,3 M', 'CH-allemande = marché/langue distincts'],
            ['Europe francophone', '~70 M+', 'plusieurs millions', 'France, Belgique, Romandie (phase lointaine)'],
          ]}
        />
        <H3>Les concurrents et leurs leçons</H3>
        <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
          <Li><strong>Tinder / Bumble / Hinge</strong> — dominent le swipe (~120-133 k actifs CH pour Tinder), mais c'est précisément le modèle dont les gens se lassent. On ne les affronte pas sur leur terrain.</Li>
          <Li><strong>Thursday</strong> (l'app n'ouvre qu'un jour/semaine) — fort effet FOMO + densité, mais s'effondre hors des très grandes villes. <em>Leçon : la densité concentrée marche, mais ne se transporte pas seule.</em></Li>
          <Li><strong>Timeleft</strong> (dîners entre inconnus) — excellente exécution, mais fréquence faible et peu spontané. <em>Leçon : l'événement réel crée la liquidité.</em></Li>
          <Li><strong>IRL</strong> (énorme levée, puis faillite) — croissance artificielle + fausse activité. <em>Leçon : la liquidité ne se simule pas ; gonfler tue.</em></Li>
        </ul>
        <Note><strong>Conclusion concurrentielle :</strong> il existe un cimetière d'apps sociales <em>et</em> une vraie tendance (fatigue du swipe, envie de réel). Le marché existe ; le problème est l'<strong>exécution de la liquidité locale</strong>, pas l'idée.</Note>

        {/* 3 ── LIQUIDITÉ ── */}
        <H2 n="3.">Le vrai problème : la liquidité (seuils chiffrés)</H2>
        <P>La bonne question n'est pas « combien d'inscrits ? » mais <strong>« combien de personnes disponibles en même temps, au même endroit ? »</strong>. C'est la métrique qui fait vivre ou mourir l'app.</P>
        <BarChart
          title="Personnes disponibles SIMULTANÉMENT un soir (dans la zone) — ressenti utilisateur"
          unit="Seuils indicatifs pour une app de rencontre spontanée."
          bars={[
            { label: '☠️ Mort', value: 40, color: K.red },
            { label: '🙂 Ça vit', value: 125, color: K.amber },
            { label: '😃 Très bon', value: 250, color: K.green },
            { label: '🚀 Scale', value: 450, color: K.blue },
          ]}
          fmt={v => v === 40 ? '< 30-50' : v === 125 ? '100-150' : v === 250 ? '200-300' : '400+'}
        />
        <BarChart
          title="Masse critique en utilisateurs actifs mensuels (MAU) — Lausanne"
          unit="Pour soutenir les seuils de simultanéité ci-dessus, compte tenu des taux de présence."
          bars={[
            { label: 'Minimum viable', value: 1500 },
            { label: 'Agréable', value: 3000 },
            { label: 'Très bon', value: 6000 },
            { label: 'Excellent', value: 12000 },
          ]}
          fmt={v => '~' + fr(v) + ' MAU'}
        />
        <Note tone="accent"><strong>Gate de lancement :</strong> on ne « lance en grand » (pub, presse) qu'une fois capable de tenir <strong>~200-300 disponibles un soir / ~2 000 MAU</strong>. En dessous, chaque franc de pub est gaspillé sur une expérience vide.</Note>

        {/* 4 ── MATRICE ── */}
        <H2 n="4.">Matrice des 7 stratégies de lancement</H2>
        <P>Aucune stratégie unique : on superpose des couches. Budgets indicatifs sur 6 mois (ils supposent un financement ; le <em>premier</em> test entre amis se fait, lui, en quelques milliers).</P>
        <Table
          head={['Stratégie', 'Budget 6 mois', 'CAC', 'MAU M6 / M12', 'Revenu dès', 'Risque', 'Verdict']}
          rows={[
            ['Événements récurrents (apéros, soirées)', '28–50 k', '9–20', '1,5–3 k / 6–10 k', 'M3', 'dépend des orgas', <span style={{ color: K.green, fontWeight: 800 }}>GARDER · pilier</span>],
            ['B2B bars / lieux partenaires', '18–35 k', '13–26', '1,2–2,5 k / 5–9 k', 'M3', 'négo lente', <span style={{ color: K.green, fontWeight: 800 }}>GARDER</span>],
            ['Campus hyper-local (EPFL/UNIL)', '12–22 k', '6–14', '0,7–1,5 k / 3–5 k', 'M4', 'faible pouvoir d\'achat', <span style={{ color: K.green, fontWeight: 800 }}>GARDER · carburant</span>],
            ['Micro / nano-influence locale', '22–40 k', '11–24', '1–2,5 k / 5–9 k', 'M4', 'dépend créateurs', <span style={{ color: K.green, fontWeight: 800 }}>GARDER · phase 3</span>],
            ['Publicité payante (Meta/TikTok)', '55–120 k', '22–38', '2–4,5 k / 8–16 k', 'M5', 'brûle le cash', <span style={{ color: K.amber, fontWeight: 800 }}>PLUS TARD · M4+</span>],
            ['PR / presse étudiante + teaser', '8–18 k', '15–30', '0,6–2 k / 4–7 k', 'M5', 'visibilité limitée', <span style={{ color: K.amber, fontWeight: 800 }}>OPPORTUNISTE</span>],
            ['Levée + scale agressif', '150–350 k', '18–35', '4 k+ / 15 k+', 'M4', 'dilution, pression', <span style={{ color: K.red, fontWeight: 800 }}>ÉCARTER (trop tôt)</span>],
          ]}
        />
        <H3>Séquence d'entrecoupage recommandée</H3>
        <Table
          head={['Période', 'Couche activée', 'Objectif']}
          rows={[
            ['T-3 à T0', 'Événements + B2B bars + teaser/liste d\'attente', 'Fabriquer la liquidité de départ'],
            ['T0', 'Lancement hyper-local campus', 'Atteindre le seuil « ça vit »'],
            ['T+3', 'Micro-influence + 1er test payant limité', 'Amplifier, mesurer le CAC réel'],
            ['T+6 à T+12', 'Paid scalé + expansion Romandie', 'Si densité > 2 000 MAU'],
          ]}
        />

        {/* 5 ── PROJECTIONS ── */}
        <H2 n="5.">Projections financières par géographie dans le temps</H2>
        <Note><strong>Modèle (transparent).</strong> Revenu total mensuel = MAU × taux de conversion payant × ARPU ÷ part du premium. Hypothèses : conversion <strong>4 %</strong> (base) à <strong>7 %</strong> (haut) · ARPU payant <strong>CHF 15</strong> (base) à <strong>22</strong> (haut) · premium = 60 % du revenu total. Soit ≈ <strong>CHF 1,0/MAU/mois</strong> (base) à <strong>CHF 2,6/MAU/mois</strong> (haut). Volontairement plus prudent que les panels IA (qui supposaient conversion + ARPU plus élevés) : un investisseur préfère du défendable.</Note>

        <H3>Trajectoire d'utilisateurs (MAU) — Lausanne, 4 scénarios</H3>
        <LineChart
          title="MAU à Lausanne sur 24 mois"
          xLabels={xLabels} yMax={24000} yUnit="MAU = utilisateurs actifs mensuels. Lausanne sature ~25-30 k (cible adressable) ; le scénario Excellent suppose déjà l'expansion."
          series={[
            { name: 'Flop (45 %)', color: K.red, data: [0, 900, 2000, 2300, 2500] },
            { name: 'Moyen (35 %)', color: K.amber, data: [0, 2500, 5500, 8500, 12000] },
            { name: 'Bon (15 %)', color: K.green, data: [0, 4500, 10000, 16000, 22000] },
            { name: 'Excellent (5 %)', color: K.blue, data: [0, 6000, 14000, 24000, 24000] },
          ]}
        />
        <H3>Revenu mensuel récurrent (MRR) — Lausanne, modèle base vs haut</H3>
        <LineChart
          title="MRR à Lausanne sur 24 mois (CHF) — scénario Moyen et Bon, fourchette base→haut"
          xLabels={xLabels} yMax={60000} yUnit="MRR en CHF. Base = conversion 4 %/ARPU 15 ; Haut = 7 %/ARPU 22."
          series={[
            { name: 'Moyen — base', color: K.amber, data: [0, 2600, 5700, 8800, 12500] },
            { name: 'Moyen — haut', color: '#f0a500', data: [0, 6500, 14300, 22000, 31000] },
            { name: 'Bon — base', color: K.green, data: [0, 4700, 10400, 16600, 22900] },
            { name: 'Bon — haut', color: '#27c06a', data: [0, 11700, 26000, 41600, 57000] },
          ]}
        />
        <Table
          head={['Scénario Lausanne', 'MAU M24', 'MRR base', 'MRR haut', 'ARR (base→haut)']}
          rows={[
            ['Flop', '2 500', 'CHF 2,6 k', 'CHF 6,5 k', '0,03 → 0,08 M'],
            ['Moyen', '12 000', 'CHF 12,5 k', 'CHF 31 k', '0,15 → 0,37 M'],
            ['Bon', '22 000', 'CHF 23 k', 'CHF 57 k', '0,28 → 0,68 M'],
          ]}
          accentCol={3}
        />

        <H3>Potentiel à maturité par géographie (pénétration « Bon »)</H3>
        <BarChart
          title="ARR potentiel à maturité par zone (CHF/an, fourchette base→haut)"
          unit="Multiplicateurs vs Lausanne : Romandie ×5-6, Suisse ×10-12, Europe fr. ×40-50. Hypothèse : plusieurs années de réussite locale d'abord."
          bars={[
            { label: 'Lausanne', value: 480000, color: K.accent },
            { label: 'Suisse romande', value: 2600000, color: K.accent },
            { label: 'Suisse', value: 5500000, color: K.accent },
            { label: 'Europe francophone', value: 22000000, color: K.accent },
          ]}
          fmt={v => v >= 1e6 ? '~CHF ' + (v / 1e6).toFixed(1).replace('.0', '') + ' M' : '~CHF ' + fr(v)}
        />

        {/* 6 ── COÛT PAR GÉOGRAPHIE ── */}
        <H2 n="6.">Coût pour atteindre chaque palier géographique</H2>
        <P>Combien de cash (cumulé) faut-il investir pour amener chaque zone au seuil « agréable » (densité qui tient) ?</P>
        <BarChart
          title="Cash cumulé nécessaire par zone (CHF)"
          unit="Cumulé, marketing + opérations événementielles, hors salaires fondateurs. Croît fortement avec la surface géographique."
          bars={[
            { label: 'Lausanne (viable)', value: 55000, color: K.green },
            { label: '+ Romandie (Genève)', value: 300000, color: K.amber },
            { label: '+ Suisse', value: 1500000, color: K.blue },
            { label: '+ Europe fr.', value: 9000000, color: K.red },
          ]}
          fmt={v => v >= 1e6 ? 'CHF ' + (v / 1e6).toFixed(1) + ' M' : 'CHF ' + fr(v)}
        />
        <Note tone="accent"><strong>Lecture stratégique :</strong> Lausanne est atteignable en <strong>bootstrap (CHF 30-80 k)</strong> et c'est le seul palier finançable sans grosse levée. Chaque palier supérieur exige un saut de financement <strong>×5 à ×6</strong>. D'où la règle : <strong>prouver Lausanne, puis lever pour la zone suivante</strong> — jamais l'inverse.</Note>

        {/* 7 ── ANGEL VS INFLUENCEURS ── */}
        <H2 n="7.">Acquisition : business angel vs micro-influenceurs (le calcul)</H2>
        <P>Ce ne sont pas deux options du même type : <strong>le micro-influenceur est un canal d'acquisition</strong> (il amène des installs) ; <strong>le business angel est un réservoir de carburant</strong> (il finance les canaux). La vraie question : bootstrap via influence/events, ou lever pour scaler ?</P>
        <H3>Le calcul micro-influenceurs (local Lausanne)</H3>
        <Table
          head={['Hypothèse', 'Valeur', 'Commentaire']}
          rows={[
            ['Coût d\'un post micro (10-50 k abonnés) en CH', 'CHF 200–800', 'nano (<10 k) : souvent gratuit / produit'],
            ['Portée moyenne par post', '~30 000', 'audience locale étudiante'],
            ['Taux post → install (optimiste)', '~1 %', 'prudent : 0,3-0,5 % → ×2-3 posts'],
            ['Installs par post', '~300', '30 000 × 1 %'],
            ['CPI implicite', '~CHF 1,7', 'CHF 500 ÷ 300 — moins cher que le paid SI ça convertit'],
          ]}
          accentCol={1}
        />
        <Note tone="green"><strong>Pour amorcer ~3 000 installs à Lausanne :</strong> ~10-15 micro/nano-créateurs locaux (EPFL, UNIL, lifestyle lausannois) → <strong>CHF 5 000–10 000</strong>, CPI implicite ~CHF 2-3. Avantages : warm + local + crédible. Risque : variable (le taux de 1 % peut tomber à 0,3 %).</Note>
        <H3>Combien d'influenceurs par palier géographique</H3>
        <Table
          head={['Zone', 'Installs visés', 'Micro/nano-créateurs', 'Budget influence']}
          rows={[
            ['Lausanne (amorçage)', '~3 000', '10–15', 'CHF 5–10 k'],
            ['Suisse romande', '~15 000', '30–50', 'CHF 25–50 k'],
            ['Suisse (toutes régions)', '~50 000+', '80–120', 'CHF 80–150 k'],
          ]}
          accentCol={2}
        />
        <H3>Le business angel</H3>
        <P>Un angel suisse écrit un chèque de <strong>CHF 25-500 k</strong> (syndicats type SICTIC : 1-3 M). Pour Clutch, viser <strong>250-450 k à M6</strong> (après preuve), valorisation pre-money <strong>2,5-4,5 M</strong>. Ce n'est pas un canal : c'est ~12 mois de piste + la capacité de faire tourner le paid et d'embaucher. <strong>Avant</strong> l'angel : <strong>Venture Kick</strong> (~150 k <em>non-dilutif</em>, réseau EPFL).</P>
        <Note tone="accent"><strong>Verdict :</strong> <strong>micro-influence + événements + B2B bars pour amorcer</strong> (peu cher, chaud, local, sans diluer) → <strong>angel pour scaler</strong> une fois la traction prouvée. Ce n'est pas « l'un ou l'autre » : l'angel finance la phase d'influence/paid d'<em>après</em>.</Note>

        {/* 8 ── PUB & WAITLIST ── */}
        <H2 n="8.">Plan publicité & liste d'attente</H2>
        <H3>Publicité payante — quand et comment</H3>
        <ul style={{ margin: '0 0 10px', paddingLeft: 18 }}>
          <Li><strong>Quand :</strong> jamais avant M4 / la preuve de rétention. Le paid est un <em>accélérateur</em>, pas un amorceur.</Li>
          <Li><strong>Où :</strong> Instagram + TikTok géo-ciblés Lausanne (CPM CH ~9-13). CPI attendu CHF 4-5 (iOS 4,70 / Android 3,70).</Li>
          <Li><strong>Règle d'or :</strong> ne scaler le budget que si <strong>LTV : CAC ≥ 3 : 1</strong>. Sinon, couper. Réinjecter ~40 % du revenu premium/B2B en pub une fois la boucle rentable (~M8-M12).</Li>
        </ul>
        <H3>Liste d'attente — l'arme anti « ville vide »</H3>
        <P>La liste d'attente résout le démarrage : on accumule des inscrits <em>avant</em> l'ouverture, puis on les libère <strong>tous en même temps</strong> sur une zone → un pic de densité instantané (au lieu d'un filet de gens dilués).</P>
        <Table
          head={['Quand', 'Action liste d\'attente']}
          rows={[
            ['Dès maintenant (juin-août 2026)', 'Landing page + capture email, sur les campus (QR, affiches, assos)'],
            ['Mécanique de parrainage', '« invite 3 ami·e·s → monte dans la file / accès anticipé » (viralité gratuite)'],
            ['Pré-lancement (automne)', 'Segmenter par quartier/campus pour libérer par poches denses'],
            ['Jour J par zone', 'Ouvrir une zone quand assez d\'inscrits pour tenir ~200 dispo un soir'],
          ]}
        />

        {/* 9 ── BUSINESS MODEL ── */}
        <H2 n="9.">Business model & prix</H2>
        <H3>Abonnements multi-paliers (à tester)</H3>
        <Table
          head={['Palier', 'Prix/mois (à tester)', 'Pour qui', 'Logique']}
          rows={[
            ['Entrée', 'CHF 9,90', 'étudiants', '19,90 jugé trop cher pour étudiants par tous les panels'],
            ['Intermédiaire', 'CHF 14,90', 'jeunes actifs', 'confort + portée raisonnables'],
            ['VIP', 'CHF 19,90–39,90', 'forte intention / expats', 'fonctionnalités premium (confort, portée, contrôle)'],
          ]}
        />
        <Note tone="red"><strong>Garde-fou éthique (non négociable) :</strong> chaque fonctionnalité VIP doit être auditée sur l'équilibre hommes/femmes <em>avant</em> d'être codée. Le VIP vend du <strong>confort / de la portée / du contrôle</strong> — <strong>jamais</strong> la capacité de forcer l'attention d'une femme (pay-to-play = fuite des femmes = mort de l'app).</Note>
        <H3>Décomposition des revenus (cible)</H3>
        <BarChart
          title="Répartition des revenus à maturité (%)"
          unit="Ne jamais présenter un MRR global sans cette décomposition."
          bars={[
            { label: 'Premium (abos)', value: 60, color: K.accent },
            { label: 'Partenaires / B2B', value: 20, color: K.blue },
            { label: 'Crédits / boosts', value: 15, color: K.green },
            { label: 'Events payants', value: 5, color: K.amber },
          ]}
          fmt={v => v + ' %'}
        />
        <P>Hypothèses retenues : conversion freemium <strong>2-6 %</strong> · ARPU payant <strong>CHF 13-16</strong> · rétention D30 cible <strong>25-38 %</strong>.</P>

        {/* 10 ── TIMELINE ── */}
        <H2 n="10.">Timeline depuis le 30 juin 2026</H2>
        <P>On n'ancre pas sur une date de « lancement » : on ancre sur le <strong>gate de densité</strong>. Le « lancement » Lausanne = le moment où l'on tient ~200-300 disponibles un soir.</P>
        <Table
          head={['Période', 'Phase', 'Jalons']}
          rows={[
            ['Été 2026 (juil.-août)', 'Produit + amorce', 'Finir le cycle humain · liste d\'attente · marque IGE · candidature Venture Kick'],
            ['Automne 2026 (sept.-oct.)', 'Bêta', '20-50 testeurs (amis + Dom) · soirées « Clutch Test »'],
            ['Hiver 2026 (nov.-déc.)', 'Densité offline', '~10 événements physiques récurrents · mesurer la rétention'],
            ['Hiver-Printemps 2027', 'Lancement Lausanne', 'Quand le gate densité tient (~2 000 MAU)'],
            ['Été 2027', 'Monétisation + amplification', 'Micro-influence · 1er paid test · abos activés'],
            ['M6 post-lancement', 'Levée', 'Si ~2 000 MAU + rétention → angel 250-450 k'],
            ['Fin 2027', 'Romandie', 'Genève d\'abord, puis le reste'],
            ['2028 / 2029+', 'Suisse / Europe fr.', 'Uniquement densité prouvée à chaque étape'],
          ]}
        />

        {/* 11 ── ERREURS ── */}
        <H2 n="11.">Les 10 erreurs à éviter</H2>
        <ol style={{ margin: '0 0 10px', paddingLeft: 20 }}>
          <Li><strong>Lancer large / une ville vide</strong> — la cause n°1 de mort. Concentrer, toujours.</Li>
          <Li><strong>Payer de la pub avant la preuve de rétention</strong> — brûle le budget sur une expérience vide.</Li>
          <Li><strong>Traiter les étudiants comme le portefeuille</strong> — ils sont le carburant (densité), pas le revenu.</Li>
          <Li><strong>Vendre la technologie (la « forteresse »)</strong> — invisible pour l'utilisateur ; elle sert la rétention, pas l'acquisition. La garder secrète.</Li>
          <Li><strong>Négliger la sécurité / l'expérience des femmes</strong> — elles sont la gravité de l'app ; sans elles, les hommes partent.</Li>
          <Li><strong>S'étendre à plusieurs villes trop tôt</strong> — dilue la densité sous le seuil de mort.</Li>
          <Li><strong>Suivre des métriques de vanité</strong> (inscrits totaux) au lieu du nombre de <em>disponibles simultanés</em>.</Li>
          <Li><strong>Lancer sans pic de liste d'attente</strong> — on perd l'unique occasion de créer une densité instantanée.</Li>
          <Li><strong>Prix premium trop élevé pour la cible étudiante</strong> — tester 9,90 / 14,90 avant 19,90.</Li>
          <Li><strong>Lever trop tôt</strong> — mauvaise valorisation, dilution, pression, et rien à montrer.</Li>
        </ol>
        <Note tone="accent"><strong>Les 3 vérités dures :</strong> (1) le produit ne crée pas la liquidité — <strong>les événements la créent</strong> ; (2) la forteresse ne vend pas l'app — <strong>elle améliore la rétention</strong> ; (3) le plus gros risque n'est pas la technologie — <strong>c'est de lancer trop tôt dans une ville vide</strong>.</Note>

        {/* 12 ── FINANCEMENT ── */}
        <H2 n="12.">Demande de financement (use of funds)</H2>
        <P>Besoin total : <strong>CHF 100-150 k</strong> pour 12 mois de piste jusqu'au jalon de levée (~2 000 MAU).</P>
        <Table
          head={['Poste', 'Part', 'Montant (sur 120 k)']}
          rows={[
            ['Événements + B2B (fabrique de densité)', '35 %', 'CHF 42 k'],
            ['Micro-influence + contenu', '20 %', 'CHF 24 k'],
            ['Produit / infra / outils', '15 %', 'CHF 18 k'],
            ['Liste d\'attente + créa + marque (IGE)', '10 %', 'CHF 12 k'],
            ['Test paid limité (M4+)', '10 %', 'CHF 12 k'],
            ['Réserve / imprévus', '10 %', 'CHF 12 k'],
          ]}
          accentCol={2}
        />
        <P>Source recommandée : <strong>Venture Kick (~150 k non-dilutif)</strong> en priorité, complété par un tour d'amorçage <strong>business angel (250-450 k)</strong> déclenché à M6 sur preuve de traction. Valorisation pre-money visée : <strong>CHF 2,5-4,5 M</strong>.</P>

        {/* 13 ── SOURCES ── */}
        <H2 n="13.">Sources & méthode</H2>
        <P style={{ fontSize: 12 }}>Marché dating CH : Sensor Tower (CH Q2 2025), Statista, Business of Apps. Coûts d'acquisition : Business of Apps (UA costs), Adaction. Publicité : AdAmigo (CPM par pays), TikTok Ads. Financement CH : Venture Kick, SICTIC, Scalemetrics (Swiss startup funding 2026). Démographie : EPFL, UNIL, Lausanne Tourisme. <strong>Tous les chiffres sont des benchmarks 2025-2026 à revérifier pour la Suisse 2026 ; les projections sont un modèle transparent à hypothèses explicites, pas des garanties.</strong></P>

        <div style={{ borderTop: `2px solid ${K.ink}`, marginTop: 36, paddingTop: 12, fontSize: 11, color: K.muted, textAlign: 'center' }}>
          Clutch · Plan de lancement & audit financier · v1 · 30 juin 2026 · document confidentiel
        </div>
      </article>

      <style>{`@media print { .noprint { display: none !important; } article { max-width: none !important; padding: 0 12px !important; } @page { margin: 14mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  )
}
