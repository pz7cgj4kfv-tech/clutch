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
    id: 'challenge-panels-0107',
    date: '01.07.2026',
    title: 'Challenge GPT + Grok — synthèse tranchée',
    sub: 'Ce qu\'on garde, ce qu\'on vire · la Forteresse reste cachée',
    body: (
      <div>
        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: '.06em', marginBottom: 4 }}>LE FIL ROUGE DES 2 PANELS</div>
          <P>« Vous pensez tester Clutch, mais vous risquez de tester <strong>le vide</strong>. Au cold-start, les gens pardonnent les bugs techniques, <strong>pas le vide social</strong>. » → le 1er test doit être <strong>chorégraphié</strong>.</P>
        </div>
        <p style={{ fontSize: 11.5, color: C.textMid, lineHeight: 1.55, margin: '4px 0 8px' }}>Doc complète : <strong>docs/challenge-panels-01jul-synthese.md</strong>.</p>

        <H>✅ On garde (les 2 d'accord)</H>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li><strong>1er test chorégraphié</strong> : 1 soir, 2h précises, centre Lausanne, rayon 2-5 km, « tout le monde ouvre une dispo à 19h30 » + groupe WhatsApp.</li>
          <li><strong>Zéro bot d'ambiance romantique</strong> (LPD + confiance). Bots = Test Lab « BOT TEST » uniquement.</li>
          <li><strong>Forteresse = moat interne</strong> (qualité/sécurité), <strong>pas</strong> un argument d'acquisition. Active mais jamais pitchée.</li>
          <li>Avant le test : <strong>cycle humain complet qui tient</strong> + notifs fiables + <strong>jamais « rien ne se passe »</strong> + blocage/signalement/refus doux.</li>
        </ul>

        <H>🗑️ On vire (bluff / hors-sujet pour CE test)</H>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li><strong>Modération texte serveur</strong> → over-engineering pour 30 amis (vrai pour le public, pas le test).</li>
          <li><strong>Grok/CTO « forteresse GPS + i18n + premium stub » comme manques</strong> → se contredit avec sa propre liste « ne pas faire » + GPT. Rien de ça n'est requis pour tester.</li>
          <li><strong>NPS après event</strong> → trop corporate ; feedback verbatim en vrac capte mieux.</li>
        </ul>

        <div style={{ background: C.cardSoft, border: `1px solid ${C.salmon}55`, borderRadius: 12, padding: '12px 14px', margin: '8px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.salmon, letterSpacing: '.06em', marginBottom: 4 }}>🔒 DÉCISION DAVID — LA FORTERESSE RESTE CACHÉE</div>
          <P>Le moteur (forteresse/cône) reste <strong>sous le capot</strong>, jamais mis en avant (défendabilité + non-vendeur). Côté user, on n'affiche <strong>QUE le RESSENTI</strong> : quand une situation <strong>devient impossible</strong>, il le <strong>SENT</strong> — sans voir l'algo ni les mots « forteresse/cône ».</P>
          <P>Ce ressenti <strong>existe déjà</strong> = le <strong>cône vivant</strong> (slider qui se resserre + tension + boussole + haptique). Reste : le <strong>nommer sans jargon</strong> (« ta fenêtre se referme », souffle visuel) → 2-3 directions design Mel.</P>
        </div>
      </div>
    ),
  },
  {
    id: 'finance-0107',
    date: '01.07.2026',
    title: 'Audit financier & stratégie de lancement',
    sub: 'Vrais chiffres marché CH · cold-start · funding · ville→pays',
    body: (
      <div>
        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: '.06em', marginBottom: 4 }}>VERDICT</div>
          <P>Le marché CH est réel et il paie (Tinder ~$1.5M/mois rien qu'en Suisse), mais <strong>dominé</strong>. La seule porte d'entrée = <strong>hyper-local saturé</strong> (Lausanne-étudiants), pas la pub large. Lausanne-first ne sert pas à <em>gagner de l'argent</em>, il sert à <strong>prouver densité + rétention + monétisation</strong> → c'est ÇA qui finance la suite (levée).</P>
        </div>
        <p style={{ fontSize: 11.5, color: C.textMid, lineHeight: 1.55, margin: '4px 0 8px' }}>⚠️ Benchmarks réels sourcés (industrie/marché CH), pas de la data Clutch. Doc complète : <strong>docs/audit-financier-strategie.md</strong>.</p>

        <H>Marché (réel)</H>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li>CH dating : pénétration ~<strong>11.8 %</strong>. Tinder ~<strong>120-133K</strong> users actifs/sem (~<strong>$1.5M/mois</strong> rev CH), Bumble ~70K, Hinge ~34K.</li>
          <li>Lausanne : ~<strong>140K habitants</strong>, ~<strong>35 000 étudiants</strong> (EPFL+UNIL, plus grand campus CH) → densité idéale.</li>
          <li>Tendance 2026 : <strong>fatigue du swipe</strong>, montée du IRL/intentionnel → l'angle Clutch est <strong>dans le sens du vent</strong>.</li>
        </ul>

        <H>Unit economics (benchmarks)</H>
        <P>CPI iOS <strong>$4.70</strong> / Android $3.70 · CAC blended ~<strong>$29</strong> (dating = plus cher). CPM Insta ~$8 / TikTok ~$6 (CH ~$9-13). Règle viable : <strong>LTV:CAC ≥ 3:1</strong>. → acheter sa croissance trop tôt = <strong>brûler du cash</strong>.</P>

        <H>3 scénarios de lancement (coûts réels)</H>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li><strong style={{ color: C.green }}>A — Bootstrap hyper-local</strong> (CHF 2-8K) : 1 campus, 1 soirée de lancement, ambassadeurs. <strong>Recommandé pour démarrer.</strong> Rapporte peu de cash mais la donnée qui vaut de l'or.</li>
          <li><strong>B — Paid growth Lausanne</strong> (CHF 10-40K) : ~1-4K installs, ~10-20 % actifs. <strong>Après</strong> la preuve A, jamais avant.</li>
          <li><strong>C — Levée</strong> : <strong>Venture Kick</strong> (non-dilutif, jusqu'à ~CHF 150K, EPFL-friendly) en priorité · angels CH 25-500K · valo seed CHF 1-5M. Après traction.</li>
        </ul>

        <H>« Lausanne peut-il financer la suite ? »</H>
        <P>1 000 actifs × 5 % premium × CHF 19.90 ≈ <strong>CHF 1 000/mois</strong> → <strong>non</strong>, ça ne paie pas une expansion. Mais ça <strong>prouve la monétisation</strong> = le signal que les investisseurs achètent. On réinvestit <strong>la preuve, pas le cash</strong>.</P>

        <H>Se faire connaître sans se faire piquer l'idée</H>
        <P>L'idée est copiable, le moat ne l'est pas : (a) la <strong>forteresse</strong> (mois de R&D), (b) la <strong>densité locale + communauté</strong>, (c) la <strong>marque</strong> (Clutch/Verrou, déposable IGE). Être secret = suicide pour une app sociale. Parade = <strong>vitesse + lock-in local + marque déposée</strong>.</P>

        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 14px', margin: '8px 0' }}>
          <div style={{ fontSize: 12.5, color: C.text, lineHeight: 1.6 }}><strong>Séquence :</strong> finir produit testable → bootstrap Lausanne (preuve densité) → déposer marque + candidater Venture Kick → paid/levée → Genève → Romandie → CH. <strong>Jamais « toute la Suisse » d'un coup</strong> (densité diluée). Le prompt de challenge expert (panel 4 voix, données incluses) est dans la doc.</div>
        </div>
      </div>
    ),
  },
  {
    id: 'qa-couverture-0107',
    date: '01.07.2026',
    title: 'Couverture de test — qu\'est-ce qu\'on n\'a PAS testé ?',
    sub: 'Matrice par feature · plan de test minimal avant les amis',
    body: (
      <div>
        <div style={{ background: C.cardSoft, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.orange, letterSpacing: '.06em', marginBottom: 4 }}>LES 2 PLUS GROS RISQUES NON-TESTÉS</div>
          <P><strong>Push notifs</strong> (sans elles, personne ne voit un clutch à temps → le concept « spontané » meurt) · <strong>comment un refus est vécu</strong> (UX émotionnelle, clé pour les femmes).</P>
        </div>
        <p style={{ fontSize: 11.5, color: C.textMid, lineHeight: 1.55, margin: '4px 0 8px' }}>Doc complète (matrice ✅/🟦/🟧/⛔ par feature) : <strong>docs/qa-couverture-test.md</strong>.</p>

        <H>Codé mais PAS testé bout-en-bout (🟦) — tes points</H>
        <ul style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: 13, lineHeight: 1.65, color: C.text }}>
          <li><strong>Création d'event</strong> (titre/lieu/dates/places min-max impairs/prix/âge) → tester Solo.</li>
          <li><strong>Empilage / plafond simultané</strong> (♀20 · premium5 · free3) → Test Lab : N bots me clutchent jusqu'au plafond.</li>
          <li><strong>5 reçus/jour (♀)</strong> → bombarder une ♀ de 6 clutchs, vérifier le 6e.</li>
          <li><strong>Liste d'attente event plein</strong> + place qui se libère → Test Lab.</li>
          <li><strong>Accepter / Refuser + cooldown 48h + message côté refusé</strong> → 2 téléphones.</li>
          <li><strong>Enchaînement serré</strong> (RDV 20h30 puis 22h30 loin → alerte forteresse) → 2 tél.</li>
        </ul>

        <H>Le plan de test minimal (avant les amis)</H>
        <ol style={{ margin: '0 0 4px', paddingLeft: 20, fontSize: 13, lineHeight: 1.7, color: C.text }}>
          <li><strong>2 téléphones, happy path complet</strong> ×2 : dispo → présence → clutch → accept → Verrou → J'y suis → Terminer → feedback.</li>
          <li><strong>Test Lab</strong> : empilage plafond · 6e reçu ♀ · cooldown 48h · waitlist event plein.</li>
          <li><strong>Forteresse</strong> : enchaînement 20h30→22h30 loin · event qui se grise en se déplaçant.</li>
          <li><strong>Push</strong> : un clutch reçu doit sonner <strong>app fermée</strong>.</li>
        </ol>
      </div>
    ),
  },
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
