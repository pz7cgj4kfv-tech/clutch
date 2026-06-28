'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /audits — Page d'audits IA du hub. Des ENTRÉES datées, cliquables (accordéon ouvre/ferme).
// On en ajoute au fil du temps (chaque challenge GPT/Grok croisé par Claude = une entrée datée).
// 1re entrée : Audit méta (28.06.2026) — synthèse GPT + Grok : concurrents, complexité, adoption,
// PROJECTIONS DE REVENUS, stratégies de lancement, pourquoi ça pourrait mourir.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react'

const C = {
  bg: '#2a1020', card: '#3a1a2e', cardSoft: 'rgba(51,22,38,0.5)', border: 'rgba(255,191,158,0.18)',
  orange: '#E27C00', salmon: '#FFBF9E', text: '#f5e8de', textMid: 'rgba(245,232,222,0.62)',
  green: '#77BC1F', amber: '#FFB300', red: '#E5736B',
}

type Entry = { id: string; date: string; title: string; sub: string; body: React.ReactNode }

const Tag = ({ children, color }: { children: React.ReactNode; color: string }) =>
  <span style={{ fontSize: 11, fontWeight: 800, color, background: `${color}1e`, border: `1px solid ${color}44`, borderRadius: 7, padding: '1px 8px' }}>{children}</span>

const H = ({ children }: { children: React.ReactNode }) =>
  <div style={{ fontSize: 13, fontWeight: 900, color: C.salmon, letterSpacing: '.04em', textTransform: 'uppercase', margin: '20px 0 8px' }}>{children}</div>

const P = ({ children }: { children: React.ReactNode }) =>
  <p style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text, margin: '0 0 8px' }}>{children}</p>

const ENTRIES: Entry[] = [
  {
    id: 'meta-2806',
    date: '28.06.2026',
    title: 'Audit méta — marché, revenus, lancement',
    sub: 'Synthèse GPT + Grok, croisée par Claude',
    body: (
      <div>
        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: '.06em', marginBottom: 4 }}>VERDICT</div>
          <P>Le marché existe (fatigue du swipe, manque de rencontres réelles), mais il est <strong>dur à amorcer</strong> : il dépend de la <strong>liquidité locale simultanée</strong> plus que de la qualité du produit. Chance réelle, à conditions strictes.</P>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.salmon, fontStyle: 'italic', marginTop: 6 }}>« Clutch n'est pas un problème technologique — c'est un problème de densité humaine. »</div>
        </div>

        <H>Concurrents (juin 2026)</H>
        <P>Trou de marché réel sur le spontané IRL <strong>ET</strong> cimetière d'apps sociales mortes (les deux à la fois). Personne n'a le « cône de causalité ».</P>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li><strong>Timeleft</strong> (2023) — dîners entre inconnus · ~150k/mois, ~18 M€ ARR 2025. Succès, mais plus amical que dating.</li>
          <li><strong>Thursday</strong> (2021) — dating 1 jour/semaine · pivot events 2025, rétention faible.</li>
          <li><strong>Pie · 222</strong> — events sociaux/curatés · dépendent des organisateurs.</li>
          <li><strong>Happn</strong> — croisements physiques · énorme base mais toujours du swipe.</li>
          <li><strong>IRL</strong> — communautés · forte croissance puis mort (fraude/sécurité).</li>
        </ul>

        <H>Complexité technique</H>
        <P><Tag color={C.amber}>6,5–7,5 / 10</Tag> &nbsp;(Doodle 2 · Tinder 5 · BlaBlaCar 6 · <strong>Clutch ~7</strong> · Uber 9 · Maps 10). Le 8/10 du fondateur = un peu surestimé. <strong>Risque #1</strong> : la cohérence à long terme entre temps + lieux + events + cooldowns + forteresse + exceptions.</P>

        <H>Adoption</H>
        <P>Les gens veulent <strong>les deux</strong> : du vrai RDV ET scroller. Freins : peur du vrai RDV · app vide · sécurité · « jamais prêt maintenant » · charge mentale. Leviers : events de groupe · golden hours · réseau local dense · sécurité très visible.</P>

        <H>💰 Projections de revenus — Lausanne (M24)</H>
        <div style={{ overflowX: 'auto', margin: '0 0 6px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: C.text, minWidth: 380 }}>
            <thead><tr style={{ color: C.textMid, textAlign: 'left' }}>
              <th style={{ padding: '4px 8px 4px 0', fontWeight: 800 }}>Scénario</th>
              <th style={{ padding: '4px 8px', fontWeight: 800 }}>Proba</th>
              <th style={{ padding: '4px 8px', fontWeight: 800 }}>MAU</th>
              <th style={{ padding: '4px 0', fontWeight: 800 }}>MRR / mois</th>
            </tr></thead>
            <tbody>
              {[['Faible','45 %','1 500','~2,5–10k CHF'],['Moyen','30 %','6 000','~12k CHF'],['Bon','18 %','15 000','~40k CHF'],['Excellent','7 %','35 000','~80–110k CHF']].map((r,i)=>(
                <tr key={i} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td style={{ padding: '6px 8px 6px 0', fontWeight: 800, color: i===3?C.green:i===0?C.textMid:C.text }}>{r[0]}</td>
                  <td style={{ padding: '6px 8px', color: C.textMid }}>{r[1]}</td>
                  <td style={{ padding: '6px 8px' }}>{r[2]}</td>
                  <td style={{ padding: '6px 0', fontWeight: 800, color: C.orange }}>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: C.textMid, lineHeight: 1.55, margin: '0 0 8px' }}>Hypothèses : conversion payante 2–8 % des MAU · ARPU 12–18 CHF · partenaires 10–25 % du revenu · crédits/boosts 15–30 %.</p>
        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', margin: '8px 0' }}>
          <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}>
            <strong>Si ça scale</strong> (scénario excellent M24, hypothèses fortes) : Suisse romande ~120k MAU → <strong>400–600k CHF/mois</strong> · Suisse ~300k → <strong>1–1,5 M CHF/mois</strong> · pays francophones ~1M → <strong>3–5 M CHF/mois</strong> · Europe occ. 3–5M → <strong>12–20 M CHF/mois</strong>. <span style={{ color: C.textMid }}>(nécessite plusieurs années de réussite locale d'abord — hypothèse.)</span>
          </div>
        </div>

        <H>Stratégies de lancement (plusieurs)</H>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li><strong>A — Lausanne hyper-dense</strong> (25-35 ans) : densité forte / croissance lente.</li>
          <li><strong>B — Campus & jeunes actifs</strong> : usage fréquent / pouvoir d'achat faible.</li>
          <li><strong>C — Events d'abord</strong> (modèle Timeleft) : résout la page vide / risque de devenir app d'events.</li>
          <li><strong>D — Bars partenaires</strong> : lieux/offres immédiats / complexité commerciale.</li>
          <li><strong>E — Noyau féminin d'abord</strong> : énorme effet réseau / très dur à constituer.</li>
        </ul>
        <P><span style={{ color: C.textMid, fontSize: 12 }}>Reco Grok : mix B2B partenaires + noyau féminin en parallèle. Pas de vérité unique.</span></P>

        <H>La Forteresse</H>
        <P>Valeur perçue utilisateur <strong>faible</strong> · valeur produit interne <strong>forte</strong> (taux de RDV honorés, confiance, moins de lapins). Visuel validé : slider qui rougit + résistance + ticks, <strong>sans texte</strong>.</P>

        <H>Pourquoi Clutch pourrait mourir (par probabilité)</H>
        <ol style={{ margin: '0 0 8px', paddingLeft: 20, fontSize: 13, lineHeight: 1.7, color: C.text }}>
          <li><strong style={{ color: C.red }}>La page vide / liquidité locale</strong> — la plus probable.</li>
          <li>Pas assez de femmes actives.</li>
          <li>Les gens préfèrent le faible effort (scroll).</li>
          <li>CAC trop élevé vs LTV.</li>
          <li>Concurrence indirecte : Instagram, WhatsApp, groupes d'amis.</li>
        </ol>

        <H>Masse critique minimale (hypothèse)</H>
        <P>Pour qu'une ville « vive » : <strong>1 000–3 000 inscrits</strong> et <strong>50–150 dispo simultanément un soir</strong>. En dessous, l'expérience devient très fragile.</P>

        <H>Les 3 vérités dures</H>
        <ol style={{ margin: '0 0 4px', paddingLeft: 20, fontSize: 13, lineHeight: 1.7, color: C.text }}>
          <li>Le produit peut être excellent et mourir quand même.</li>
          <li>Le problème principal n'est plus technique.</li>
          <li>Le succès dépend de <strong>combien de gens sont dispo en même temps</strong>, pas du nombre total d'inscrits.</li>
        </ol>
      </div>
    ),
  },
]

export default function AuditsPage() {
  const [open, setOpen] = useState<string | null>(ENTRIES[0]?.id || null)
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro",Segoe UI,Roboto,sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '34px 18px 64px' }}>
        <div style={{ marginBottom: 6 }}>
          <a href="/hub" style={{ fontSize: 12.5, fontWeight: 700, color: C.textMid, textDecoration: 'none' }}>← Hub</a>
        </div>
        <h1 style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 900, color: C.text }}>📋 Audits Clutch</h1>
        <p style={{ margin: '0 0 22px', fontSize: 13.5, color: C.textMid, lineHeight: 1.55 }}>
          Chaque audit (challenge croisé GPT + Grok, synthétisé) est daté. Clique pour ouvrir / fermer.
        </p>

        {ENTRIES.map(e => {
          const isOpen = open === e.id
          return (
            <div key={e.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, marginBottom: 12, overflow: 'hidden' }}>
              <button onClick={() => setOpen(isOpen ? null : e.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '15px 18px', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: C.orange, background: `${C.orange}1e`, border: `1px solid ${C.orange}44`, borderRadius: 7, padding: '3px 8px' }}>{e.date}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 15, fontWeight: 800, color: C.text }}>{e.title}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: C.textMid, marginTop: 1 }}>{e.sub}</span>
                </span>
                <span style={{ flexShrink: 0, fontSize: 18, color: C.salmon, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>⌄</span>
              </button>
              {isOpen && <div style={{ padding: '0 18px 20px', borderTop: `1px solid ${C.border}` }}>{e.body}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
