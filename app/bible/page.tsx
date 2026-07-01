'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /bible — DOCUMENT DE HANDOFF TOTAL (fond blanc, imprimable PDF, partageable).
// Version lisible/partageable de docs/BIBLE-0-MAITRE.md (+ appendices DB & code condensés).
// Détail complet : docs/BIBLE-0-MAITRE.md · BIBLE-2-BASE-DE-DONNEES.md · BIBLE-3-CARTE-DU-CODE.md.
// Imprimer : bouton en haut → Cmd+P → Enregistrer en PDF.
// ─────────────────────────────────────────────────────────────────────────────
const K = {
  ink: '#1a1a1a', body: '#33373d', muted: '#6b7280', line: '#e5e7eb', soft: '#f7f8fa',
  accent: '#E27C00', green: '#1f9d55', amber: '#d97706', red: '#c0392b', blue: '#2563eb',
}

const H2 = ({ n, children }: { n?: string; children: React.ReactNode }) => (
  <h2 style={{ fontSize: 21, fontWeight: 800, color: K.ink, margin: '38px 0 6px', paddingTop: 8, borderTop: `2px solid ${K.ink}`, breakAfter: 'avoid' }}>
    {n && <span style={{ color: K.accent, marginRight: 9 }}>{n}</span>}{children}
  </h2>
)
const H3 = ({ children }: { children: React.ReactNode }) => <h3 style={{ fontSize: 15, fontWeight: 800, color: K.ink, margin: '18px 0 5px', breakAfter: 'avoid' }}>{children}</h3>
const P = ({ children, s }: { children: React.ReactNode; s?: React.CSSProperties }) => <p style={{ fontSize: 13.5, lineHeight: 1.6, color: K.body, margin: '0 0 9px', ...s }}>{children}</p>
const Li = ({ children }: { children: React.ReactNode }) => <li style={{ fontSize: 13.3, lineHeight: 1.5, color: K.body, margin: '0 0 4px' }}>{children}</li>
const UL = ({ children }: { children: React.ReactNode }) => <ul style={{ margin: '0 0 9px', paddingLeft: 19 }}>{children}</ul>
const Note = ({ children, tone = 'soft' }: { children: React.ReactNode; tone?: 'soft' | 'accent' | 'red' | 'green' }) => {
  const c = tone === 'accent' ? K.accent : tone === 'red' ? K.red : tone === 'green' ? K.green : K.muted
  return <div style={{ background: K.soft, borderLeft: `3px solid ${c}`, borderRadius: 6, padding: '10px 13px', margin: '11px 0', fontSize: 13, lineHeight: 1.55, color: K.body, breakInside: 'avoid' }}>{children}</div>
}
function Table({ head, rows }: { head: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div style={{ overflowX: 'auto', margin: '11px 0', breakInside: 'avoid' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.2, minWidth: 520 }}>
        <thead><tr>{head.map((h, i) => <th key={i} style={{ textAlign: i === 0 ? 'left' : 'left', padding: '7px 9px', background: K.ink, color: '#fff', fontWeight: 700, fontSize: 11.3 }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, ri) => (
          <tr key={ri} style={{ borderBottom: `1px solid ${K.line}`, background: ri % 2 ? K.soft : '#fff' }}>
            {r.map((c, ci) => <td key={ci} style={{ padding: '6px 9px', color: K.body, fontWeight: ci === 0 ? 700 : 400, verticalAlign: 'top' }}>{c}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}

export default function Bible() {
  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: K.body, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif' }}>
      <div className="noprint" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: `1px solid ${K.line}`, padding: '10px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
        <a href="/hub" style={{ fontSize: 12.5, fontWeight: 700, color: K.muted, textDecoration: 'none' }}>← Hub</a>
        <span style={{ flex: 1 }} />
        <button onClick={() => window.print()} style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', background: K.accent, border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}>🖨️ Imprimer / PDF</button>
      </div>

      <article style={{ maxWidth: 820, margin: '0 auto', padding: '38px 26px 90px' }}>
        {/* COUVERTURE */}
        <div style={{ borderBottom: `3px solid ${K.ink}`, paddingBottom: 20, marginBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: K.accent, letterSpacing: '.12em', textTransform: 'uppercase' }}>Clutch · Document confidentiel</div>
          <h1 style={{ fontSize: 34, fontWeight: 900, color: K.ink, margin: '8px 0 6px', lineHeight: 1.1 }}>La Bible — handoff total</h1>
          <div style={{ fontSize: 14.5, color: K.muted }}>Tout le projet en un document : concept, technique, base de données, business, roadmap.</div>
          <div style={{ fontSize: 12.5, color: K.muted, marginTop: 12 }}>02.07.2026 · build 240 (0x1f4) · <span style={{ color: K.body }}>détail complet dans <b>docs/BIBLE-0-MAITRE.md</b>, <b>BIBLE-2-BASE-DE-DONNEES.md</b>, <b>BIBLE-3-CARTE-DU-CODE.md</b> ; code brut = le dépôt (TypeScript/Next.js + SQL)</span></div>
        </div>

        <Note tone="accent"><strong>Si tu ne lis que 3 choses :</strong> §4 (la Forteresse = le moat) · §8 + §15 (les risques & quoi faire ensuite) · l'appendice base de données. Le reste du savoir vit dans <b>docs/</b> et le hub.</Note>

        <H2 n="1.">Le concept en une page</H2>
        <P>Clutch provoque des <strong>rencontres et activités RÉELLES, tout de suite</strong>, à Lausanne d'abord. L'anti-Tinder : au lieu de swiper à l'infini, tu <strong>ouvres une fenêtre de disponibilité</strong> (lieu + rayon + heures, max 18h), tu vois <strong>qui est dispo près de toi maintenant</strong>, tu envoies un <strong>« Clutch »</strong> (invitation à un vrai RDV), et si l'autre accepte, ça se <strong>verrouille</strong> (« Verrou ») en rendez-vous réel — café, verre, sport, yoga, sortie, event de groupe.</P>
        <P><strong>Repositionnement clé :</strong> pas qu'une app de célibataires — du <strong>lien social IRL + des activités</strong>, cœur <strong>25-45 ans</strong>, célibataires ou non. Le marché social/activités est ~7-10× le dating.</P>

        <H2 n="2.">Le vocabulaire (droit)</H2>
        <P>✅ <strong>Clutch</strong> (l'invitation) · <strong>Verrou</strong> (le RDV confirmé) · <strong>Rendez-vous</strong> · <strong>Créneau</strong> (dispo, max 3, sur 18h) · <strong>la Forteresse / le Cône</strong> (le moteur, interne). ❌ JAMAIS « match », « swipe », « like ». Le vocabulaire EST la promesse.</P>

        <H2 n="3.">La vision & l'ADN</H2>
        <UL>
          <Li>« Complexité dedans, simplicité dehors ». Beau, fun, mémorable AVANT fonctionnel-brut.</Li>
          <Li>La friction vers le vrai RDV est un <strong>feature</strong>. Toute feature « plus confortable depuis le canapé » = dark pattern à rejeter.</Li>
          <Li><strong>Sécurité des femmes = la gravité de l'app.</strong> Radar = TEMPS restant, jamais la distance GPS à la personne (anti-triangulation). GPS = zone floue ~1 km.</Li>
          <Li>Anti-tension : refus doux, ghosting silencieux, jamais de message vexant.</Li>
          <Li>Palette (depuis <code>lib/brand.ts</code>) : prune #2a1020, or #E27C00, pêche #FFBF9E. Jamais de rouge vif ni de couleur inventée.</Li>
        </UL>

        <H2 n="4.">La Forteresse — le cœur technique (le vrai moat)</H2>
        <Note tone="accent"><strong>Décision produit : la Forteresse reste CACHÉE.</strong> Jamais un argument marketing. Côté user on n'affiche que le <strong>ressenti</strong> : quand une situation devient impossible, il le <strong>SENT</strong> (le « cône vivant » : slider qui se resserre + tension + haptique).</Note>
        <P><strong>2 garanties :</strong></P>
        <UL>
          <Li><strong>On ne peut pas être à 2 endroits à la fois</strong> (EXCLUSION). Une contrainte de base de données (<code>occupancies</code> + EXCLUDE gist) rend <strong>impossible</strong> 2 RDV qui se chevauchent. Du DUR, pas du JS contournable.</Li>
          <Li><strong>On n'accepte un RDV que si on peut physiquement s'y rendre à temps</strong> (le CÔNE / causalité). Formule <code>distance + rayon ≤ portée(temps)</code> (~30 km/h, marge 15 min). Enchaînement : <code>fin(A) + trajet ≤ début(B)</code>.</Li>
        </UL>
        <P><strong>Preuves :</strong> moteur pur <code>lib/forteresse-engine.ts</code> + <code>lib/cone.ts</code>, testés par <code>scripts/test-forteresse.mts</code> (26/26) et le simulateur Clutch City (1000 agents : 14 415 trous → 0 avec la forteresse).</P>
        <P><strong>État :</strong> l'exclusion est <strong>active en base</strong> ; le CÔNE serveur (<code>check_cone_feasibility</code>) est <strong>écrit mais pas encore branché</strong> (prochain chantier) ; le ressenti UI (cône vivant) est déjà codé.</P>

        <H2 n="5.">Architecture & contraintes dures</H2>
        <UL>
          <Li><strong>Stack :</strong> Next.js <code>output:'export'</code> (ZÉRO serveur) + Supabase client-side (RLS, RPC gardées, Realtime, Edge Functions) + Capacitor iOS.</Li>
          <Li><strong>Deploy AUTO :</strong> <code>git push origin main</code> → l'Action build + déploie (~1-2 min). Jamais à la main.</Li>
          <Li><strong>Règle d'or serveur :</strong> aucune action métier ne touche une table en direct → tout passe par une <strong>RPC gardée</strong> qui renvoie <code>{'{ok, code, message}'}</code>.</Li>
          <Li>iOS Safari : <code>position:fixed</code> + <code>minHeight:0</code> + <code>WebkitOverflowScrolling:touch</code>. Gate dispo = <code>is_available && available_until &gt; now()</code>. Contrainte 18h partout.</Li>
        </UL>

        <H2 n="6.">Ce qui est FAIT ✅</H2>
        <UL>
          <Li>Auth + onboarding · disponibilité (molette, multi-créneaux 1-3, carte Leaflet).</Li>
          <Li><strong>Flow Clutch complet</strong> : envoi (RPC gardé) → accept/refuse/contre → Verrou → check-in GPS → Terminer → feedback + ⭐.</Li>
          <Li><strong>La Forteresse</strong> (exclusion active + enchaînement + cône vivant UI).</Li>
          <Li>Présences (carte Mel, filtres, scores, <strong>boîte pleine → invisible → réapparaît</strong>).</Li>
          <Li><strong>Événements</strong> : création + <strong>mode curated</strong> (demande → dashboard organisateur accepter/refuser) + <strong>refus doux</strong> + liste d'attente.</Li>
          <Li>Sécurité (SOS, blocage, signalement, cooldown, modération intention, radar=temps) · i18n FR/EN · outils de test.</Li>
          <Li>App Store : suppression compte, PrivacyInfo, Info.plist FR, icône. Build courant <strong>240</strong>.</Li>
        </UL>

        <H2 n="7.">Ce qui n'est PAS fait / dette ⛔</H2>
        <UL>
          <Li><strong>Le CÔNE serveur pas branché</strong> (Graal 2 pas encore en dur).</Li>
          <Li>Liste d'attente d'expéditeurs (payant) · premium pas branché en UI (Edge Functions Stripe existent).</Li>
          <Li>i18n complet (~640 strings FR-only) · chat dans l'event · onboarding guidé 60s.</Li>
          <Li><strong>Dette :</strong> <code>app/app2/page.tsx</code> = 14 187 lignes (refactor à prévoir). Forteresse GPS dynamique = Phase 2.</Li>
          <Li><strong>Push notifs app fermée</strong> = le risque #1 non-testé (valider en natif).</Li>
        </UL>

        <H2 n="8.">Les BUGS & risques</H2>
        <Note tone="red"><strong>🔴 URGENT — Supabase over-quota</strong> (sursis dépassé) : passer en <strong>Pro</strong> sinon la base se bride et l'app plante. Le risque le plus immédiat.</Note>
        <UL>
          <Li>Dérives DB (détail dans BIBLE-2) : <code>create_clutch</code> défini 2× · <code>messages</code> 2 schémas · <code>admin_update_event_status</code> sans gate · <code>sos_sessions</code> lecture publique à durcir · <strong>toutes les RPC de test à retirer/verrouiller avant prod</strong>.</Li>
          <Li>Bug Supabase <code>.update()</code> silencieux → toujours <code>.select()</code> + fallback, ou RPC. Realtime = 1 filtre/channel. Leaflet = <code>invalidateSize()</code> en rAF.</Li>
        </UL>

        <H2 n="9.">Les idées en vrac (jamais perdues)</H2>
        <P>Activités-first (yoga/sport/sorties) · SimCity POV (suivre 10 personnes, incarner) · Forteresse GPS dynamique · immersion Tesla boussole · nommer le ressenti du cône (Mel) · prix multi-paliers (2 abos + 1 VIP, garde-fou équilibre H/F) · favoris unifiés · tri events fiabilité · chat event. <em>Historique complet : les <code>docs/project_braindump_*.md</code> et l'index mémoire.</em></P>

        <H2 n="10.">Les décisions tranchées</H2>
        <UL>
          <Li>Forteresse cachée · cible 25-45 + activités (étudiants = carburant, actifs/expats = revenu, seniors = piège 3%).</Li>
          <Li>Monétiser par l'ÉVÉNEMENT (take-rate 10-20%) · offline d'abord, pas de paid au début.</Li>
          <Li>1er test = soirée chorégraphiée (Lausanne, 2h, « tout le monde ouvre sa dispo à 19h30 »). Zéro bot romantique (LPD).</Li>
          <Li>Dispos peuvent se chevaucher (intention) ; l'occupation est exclusive. Plafond boîte = TOTAL (5), pas par créneau.</Li>
          <Li>Boîte pleine → invisible · refus = doux + silencieux · ghosting = la personne ne te voit plus, sans message.</Li>
        </UL>

        <H2 n="11.">Stratégie & business</H2>
        <UL>
          <Li><strong>Risque n°1 = la liquidité simultanée</strong> (assez de gens dispo en même temps), pas la technique.</Li>
          <Li>Seuils densité : &lt;30-50/soir = mort · 100-150 = ça vit · 200-300 = très bon · 400+ = scale.</Li>
          <Li>MAU réalistes Lausanne : FLOP &lt;250 · MOYEN 550-1100 · BON 1600-2800 (« 12 000 » = fantaisiste ; Tinder = 1,3% de la CH).</Li>
          <Li>Coûts pub CH : CAC payant réel <strong>100-230 CHF</strong> → influence + events, pas de paid avant M4.</Li>
          <Li>⚠️ Venture Kick <strong>pas</strong> non-dilutif (10k don + 140k prêts convertibles, lien académique). Levée 250-450k à M6 sur preuve.</Li>
          <Li>Rétention = le vrai juge : dating D30 ≈ 3% vs social 25-30% → viser le profil SOCIAL.</Li>
        </UL>
        <P s={{ fontSize: 12 }}>Détail : page <b>/plan-lancement</b> + <code>docs/audit-financier-strategie.md</code>, <code>lancement-options-tri.md</code>, <code>recherche-marche-30jun.md</code>, <code>cible-analyse.md</code>.</P>

        <H2 n="12.">Les outils de test</H2>
        <P><strong>🎮 Test Lab</strong> (dans /app2, admin) : bots, <strong>🌆 ville vivante</strong> (dynamique aléatoire auto, vraies données), <strong>incarnation</strong>, ➕ créer N bots / 🗑️ vider les 🤖, resets rangés. <strong>2 familles de bots</strong> : originaux (Sophie, Lucas, Jade, Nora, Anaïs, Camille, Thomas — photos) et créés (🤖, 25-45). <strong>Clutch City</strong> (/clutch-city) = simulateur. <strong>Clutch Test v1</strong> (/clutch-test) = cockpit soirée chorégraphiée. Plan de test : <code>docs/qa-couverture-test.md</code>.</P>
        <Note>⚠️ <strong>Migrations à appliquer en base</strong> (SQL Editor) : <code>20260630_create_test_bots</code>, <code>20260701_delete_test_bots</code>, <code>20260627_event_participants_update</code>.</Note>

        <H2 n="13.">Équipe & accès (non-secrets)</H2>
        <UL>
          <Li><strong>David Saugy</strong> (fondateur, vision, non-dev) · <strong>Mel</strong> (design) · <strong>Dom</strong> (moteur trajet) · <strong>Claude</strong> (dev).</Li>
          <Li>QG <code>/hq</code> (pw clutch2026!) · Supabase <code>fnucdicfcjoxbozpfdau</code> · source <code>~/Documents/clutch</code> · deploy <code>~/Documents/pz7cgj4kfv-tech.github.io</code> · live <code>pz7cgj4kfv-tech.github.io</code>.</Li>
          <Li>Aucun secret en clair dans le repo (clé Supabase = publishable/RLS ; service_role jamais committée). Allowlist admin = 3 UUID (David×2 + Mel).</Li>
        </UL>

        <H2 n="14.">Déploiement</H2>
        <UL>
          <Li><strong>Web :</strong> <code>git push origin main</code> → l'Action déploie (~1-2 min).</Li>
          <Li><strong>iOS/TestFlight :</strong> bump V/BUILD + pbxproj ×2 → <code>npm run build</code> → <code>npx cap copy ios</code> → Xcode Archive → Upload.</Li>
          <Li>Build vert obligatoire (<code>tsc --noEmit</code> + <code>npm run build</code>), zéro régression.</Li>
        </UL>

        <H2 n="15.">Roadmap « quoi faire ensuite » (par priorité)</H2>
        <Table head={['#', 'Action']} rows={[
          ['🔴 1', 'Passer Supabase en Pro (sinon la base se bride, l\'app meurt)'],
          ['2', 'Appliquer les 3 migrations en attente'],
          ['3', 'Tester les push notifs app fermée (risque #1) sur TestFlight 240'],
          ['4', 'Brancher le CÔNE serveur (check_cone_feasibility) → Graal 2 en dur'],
          ['5', 'Finir le cycle humain (onboarding 60s, zéro écran muet, notifs fiables)'],
          ['6', '1er test chorégraphié (soirée Lausanne via /clutch-test) → densité + rétention'],
          ['7', 'Avant prod : retirer/verrouiller les RPC de test, durcir sos_sessions, i18n du flow, brancher premium, refactor app2'],
          ['8', 'Business : déposer marque IGE, candidater Venture Kick, levée à M6 sur preuve'],
        ]} />

        <H2 n="A.">Appendice — la base de données (résumé)</H2>
        <P>Tables clés : <code>profiles</code>, <code>clutches</code>, <code>messages</code>, <code>events</code> + <code>event_participants</code> (state requested/accepted/…) + <code>event_waitlist</code>, <code>availabilities</code> (peuvent se chevaucher), <strong><code>occupancies</code></strong> (la forteresse — jamais écrite à la main, EXCLUDE gist), <code>clutch_pairs</code> (cooldowns), <code>push_subscriptions</code>, <code>sos_sessions</code>. RPC gardées : <code>create_clutch</code>, <code>admin_*</code>, <code>join_event</code>, <code>check_cone_feasibility</code>, + Test Lab. Codes de contrat : minuscules (create_clutch) vs MAJUSCULES (admin/join_event : INBOX_FULL, OVERLAP_OCCUPANCY, NO_COMPATIBLE_AVAILABILITY…). <strong>Détail exhaustif (chaque colonne, trigger, policy, cron, 10 dérives) : <code>docs/BIBLE-2-BASE-DE-DONNEES.md</code>.</strong></P>

        <H2 n="B.">Appendice — la carte du code (résumé)</H2>
        <P>Le cœur = <strong><code>app/app2/page.tsx</code> (14 187 lignes)</strong> : tout le flow. Logique pure et testable dans <code>lib/</code> (brand, cone, forteresse-engine, events-engine, clutch-algo, sim/…). Preuves dans <code>scripts/test-*.mts</code>. RPC + Edge Functions dans <code>supabase/</code>. Deploy via <code>.github/workflows/deploy.yml</code>. <strong>Carte détaillée (chaque route, chaque composant par n° de ligne) : <code>docs/BIBLE-3-CARTE-DU-CODE.md</code>.</strong> Le code brut = le dépôt (TypeScript/Next.js + SQL, pas Python).</P>

        <div style={{ borderTop: `2px solid ${K.ink}`, marginTop: 34, paddingTop: 12, fontSize: 11, color: K.muted, textAlign: 'center' }}>Clutch · La Bible · handoff total · 02.07.2026 · document confidentiel</div>
      </article>
      <style>{`@media print { .noprint { display: none !important; } article { max-width: none !important; padding: 0 12px !important; } @page { margin: 14mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  )
}
