'use client'
// ─────────────────────────────────────────────────────────────────────────────
// COLLABORATION — /collab. La page d'équipe : hiérarchie du code + procédures
// extrêmement précises pour Dom (dev) et Mel (design). Imprimable en PDF.
// Règle d'or : un seul détenteur du code (David) ; on n'y touche jamais à distance.
// Page isolée, zéro import de l'app → zéro risque runtime.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react'

const M = {
  studio: '#F4F1F4', white: '#FFFFFF', pink: '#EB6BAF', plum: '#532943', green: '#77BC1F',
  ink: '#1a1418', ink70: '#555', ink40: '#9a9a9a', border: '#E6E3E6', soft: '#FBF7FA',
}

type Tab = 'hierarchie' | 'dom' | 'mel'

export default function Collab() {
  const [tab, setTab] = useState<Tab>('hierarchie')

  const Card = ({ children, accent }: any) => (
    <div className="cc-card" style={{ background: M.white, border: `1px solid ${M.border}`, borderLeft: `3px solid ${accent || M.border}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>{children}</div>
  )
  const H = ({ children }: any) => <h3 style={{ fontSize: 16, fontWeight: 800, color: M.plum, margin: '0 0 8px' }}>{children}</h3>
  const P = ({ children }: any) => <p style={{ fontSize: 14, lineHeight: 1.62, color: M.ink70, margin: '0 0 8px' }}>{children}</p>
  const Step = ({ n, children }: any) => (
    <div style={{ display: 'flex', gap: 11, marginBottom: 10 }}>
      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: M.pink, color: '#fff', fontSize: 12.5, fontWeight: 800, display: 'grid', placeItems: 'center' }}>{n}</span>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: M.ink, paddingTop: 2 }}>{children}</div>
    </div>
  )
  const Rule = ({ children, bad }: any) => (
    <div style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13.5, lineHeight: 1.5, color: M.ink }}>
      <span style={{ flexShrink: 0 }}>{bad ? '🚫' : '✅'}</span><div>{children}</div>
    </div>
  )

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'hierarchie', icon: '🏛️', label: 'Hiérarchie' },
    { id: 'dom', icon: '🛠️', label: 'Dom · dev' },
    { id: 'mel', icon: '🎨', label: 'Mel · design' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: M.studio, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', color: M.ink }}>
      <style>{`
        @media print {
          .no-print{display:none!important}
          .cc-wrap{max-width:none!important;padding:0!important}
          .cc-card{box-shadow:none!important;break-inside:avoid}
          body{background:#fff!important}
        }
        .cc-pre{white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px;line-height:1.5;background:#1a1018;color:#f3e8f0;border-radius:10px;padding:14px 16px;overflow:auto}
      `}</style>

      {/* Barre haut */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: '#fff', borderBottom: `1px solid ${M.border}`, position: 'sticky', top: 0, zIndex: 20, flexWrap: 'wrap' }}>
        <a href="/hub" style={{ fontSize: 12, fontWeight: 700, textDecoration: 'none', color: M.plum }}>← Hub</a>
        <span style={{ fontSize: 14, fontWeight: 900, color: M.plum }}>🤝 Collaboration</span>
        <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: '6px 12px', borderRadius: 999,
              border: `1.5px solid ${tab === t.id ? M.pink : M.border}`, background: tab === t.id ? M.pink : '#fff', color: tab === t.id ? '#fff' : M.plum,
            }}>{t.icon} {t.label}</button>
          ))}
        </div>
        <button onClick={() => window.print()} style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', padding: '6px 14px', borderRadius: 999, border: 'none', background: M.plum, color: '#fff' }}>🖨️ Imprimer / PDF</button>
      </div>

      <div className="cc-wrap" style={{ maxWidth: 760, margin: '0 auto', padding: '26px 18px 70px' }}>

        {/* ───────── HIÉRARCHIE ───────── */}
        {tab === 'hierarchie' && <>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: M.plum, margin: '0 0 6px' }}>Comment on bosse ensemble</h1>
          <P>Une règle simple rend tout fiable : <strong style={{ color: M.ink }}>une seule personne détient le code (David)</strong>, et <strong style={{ color: M.ink }}>on n’y touche jamais à distance</strong>. Dom et Mel livrent des <strong>briques autonomes</strong> ; Claude (le dev IA) les assemble. Moins de mains sur le code = moins de bugs.</P>

          <Card accent={M.pink}>
            <H>Le schéma</H>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, fontSize: 13.5 }}>
              <div style={{ textAlign: 'center', background: M.soft, borderRadius: 10, padding: '10px 12px' }}><strong style={{ color: M.plum }}>🎨 Mel</strong> — composants visuels isolés &nbsp;·&nbsp; <strong style={{ color: M.plum }}>🛠️ Dom</strong> — modules de code purs</div>
              <div style={{ textAlign: 'center', color: M.ink40, fontSize: 18 }}>↓ &nbsp; envoient leurs briques + une mini-doc &nbsp; ↓</div>
              <div style={{ textAlign: 'center', background: M.soft, borderRadius: 10, padding: '10px 12px' }}><strong style={{ color: M.green }}>🤖 Claude (dev)</strong> — vérifie, branche, teste, déploie</div>
              <div style={{ textAlign: 'center', color: M.ink40, fontSize: 18 }}>↓</div>
              <div style={{ textAlign: 'center', background: M.plum, color: '#fff', borderRadius: 10, padding: '10px 12px', fontWeight: 800 }}>📦 LE CODE CENTRAL — David. Source unique de vérité.</div>
            </div>
          </Card>

          <Card>
            <H>Pourquoi cette règle</H>
            <Rule>Chacun travaille <strong>sans accès au repo principal</strong> → impossible de casser le produit par accident.</Rule>
            <Rule>Une brique = <strong>autonome et testable</strong> (un composant, ou une fonction entrée→sortie). On la branche, on vérifie, on garde l’historique.</Rule>
            <Rule>Aucun secret (clés Supabase, etc.) ne circule jamais — ils restent côté CI uniquement.</Rule>
            <Rule>Si une brique pose problème, on la remplace sans toucher au reste.</Rule>
          </Card>
          <P><em style={{ color: M.ink40 }}>Onglets ci-dessus : la marche à suivre détaillée pour Dom et pour Mel. Chaque page s’imprime en PDF (bouton en haut à droite).</em></P>
        </>}

        {/* ───────── DOM ───────── */}
        {tab === 'dom' && <>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: M.plum, margin: '0 0 6px' }}>🛠️ Dom — la marche à suivre (dev)</h1>
          <P>Tu construis des <strong>modules de code isolés et purs</strong>, tout seul chez toi, <strong>sans accès au code de Clutch</strong>. Tu livres un fichier + ses tests ; on le branche de notre côté. Tu peux utiliser <strong>Antigravity</strong> (l’IDE agentique de Google, à base de Gemini) — ou n’importe quel outil : seul le code livré compte.</P>

          <Card accent={M.pink}>
            <H>Ta mission actuelle</H>
            <P>Le <strong>moteur de causalité</strong> de la Forteresse : un estimateur de <strong>temps de trajet maximum</strong> entre deux points GPS. Une boîte noire : 2 points + une heure → combien de minutes pour y aller. C’est tout — tu n’as pas à comprendre l’app.</P>
            <P style={{ margin: 0 }}>📄 La spec complète (signatures, table de vitesses, cas de test) : <strong>fichier <code>spec-dom-moteur-causalite.md</code></strong> que David t’a transmis.</P>
          </Card>

          <Card>
            <H>La procédure, étape par étape</H>
            <Step n={1}>Tu reçois de Claude une <strong>spec d’interface</strong> : la signature exacte de la fonction + les cas attendus.</Step>
            <Step n={2}>Dans Antigravity, crée un <strong>projet vide</strong> : un seul fichier <code>.ts</code> (le module) + un fichier de tests.</Step>
            <Step n={3}>Donne à l’IA la spec <strong>+ les règles d’or ci-dessous</strong>. Demande-lui le module + des tests qui couvrent les cas.</Step>
            <Step n={4}>Fais tourner les tests <strong>chez toi, hors-ligne</strong>, jusqu’au vert. ⚠️ L’IA peut inventer une API qui n’existe pas — vérifie que ça compile et tourne <strong>vraiment</strong>.</Step>
            <Step n={5}>Livre : <strong>le <code>.ts</code> + le fichier de tests + 3 lignes de README</strong> (tes hypothèses, les sources utilisées). Par zip ou lien — jamais dans notre repo.</Step>
            <Step n={6}>Claude branche, teste chez nous, te renvoie les retours. On itère.</Step>
          </Card>

          <Card accent={M.green}>
            <H>Règles d’or — pour ne pas merder</H>
            <Rule>Fonction <strong>PURE</strong> : mêmes entrées → toujours même sortie. Zéro état global.</Rule>
            <Rule>Toujours un <strong>fallback hors-ligne</strong> : si une API ne répond pas, renvoie une estimation conservatrice + un indice de confiance « low ». On ne plante jamais.</Rule>
            <Rule><strong>Conservateur</strong> : on veut le temps de trajet <em>maximum</em> plausible. Mieux vaut « pars 10 min plus tôt » qu’un retard.</Rule>
            <Rule>Tests <strong>obligatoires</strong> et fournis : sans tests, on ne branche pas.</Rule>
            <Rule>Isole les sources (trafic, trains…) derrière de petites fonctions → on en ajoute plus tard sans tout réécrire.</Rule>
            <Rule bad>Ne touche <strong>jamais</strong> au repo principal, ni à la base de données, ni à des secrets/clés.</Rule>
            <Rule bad>Ne <strong>logge jamais</strong> une position GPS où que ce soit (vie privée — c’est sacré).</Rule>
            <Rule bad>Ne fais pas confiance aveuglément à l’IA : si elle « invente » une lib, vérifie qu’elle existe et tourne.</Rule>
          </Card>
        </>}

        {/* ───────── MEL ───────── */}
        {tab === 'mel' && <>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: M.plum, margin: '0 0 6px' }}>🎨 Mel — la marche à suivre (design)</h1>
          <P>Tu crées les écrans et composants de Clutch <strong>en les voyant en direct dans un faux iPhone</strong>, tu itères jusqu’à ce que ça te plaise, puis tu nous envoies le résultat. Claude (le dev) l’intègre <strong>sans rien casser</strong>. Tu n’as <strong>aucun</strong> code de l’app à toucher.</P>

          <Card accent={M.green}>
            <H>1. Ce qu’il te faut (5 min, une fois)</H>
            <Rule><strong>Ton propre compte Claude</strong> sur <strong>claude.ai</strong> — abonnement <strong>Claude Pro (~22 CHF/mois)</strong>. Crée-le toi-même (on ne partage jamais de compte, question de sécurité).</Rule>
            <Rule>C’est tout. Pas de logiciel à installer, pas de code à apprendre. Tout se passe dans le navigateur.</Rule>
            <P style={{ margin: '6px 0 0', fontSize: 13, color: M.ink40 }}>Pourquoi Claude Pro : il sait afficher tes écrans <strong>en direct</strong> (les « Artifacts ») — tu écris, ça se dessine à droite, tu corriges, comme un Figma qui code tout seul.</P>
          </Card>

          <Card>
            <H>2. Comment tu bosses, à chaque fois</H>
            <Step n={1}>Va sur <strong>claude.ai</strong>, ouvre un <strong>nouveau chat</strong>.</Step>
            <Step n={2}>Colle le <strong>PROMPT DE DÉMARRAGE</strong> (ci-dessous) tout en haut. Il contient toute la charte Clutch + un cadre iPhone → tes écrans s’affichent <strong>dans une simulation d’iPhone</strong>.</Step>
            <Step n={3}>Décris ce que tu veux, <strong>avec tes mots</strong> : « un écran de profil avec la photo en grand, le prénom, deux boutons… ». Mets tes idées, tes logos, tes couleurs.</Step>
            <Step n={4}>Claude le dessine. <strong>Tu le vois dans l’iPhone.</strong> Tu n’aimes pas un détail ? Dis-le (« le bouton plus rond, le rose plus doux ») → il corrige en direct.</Step>
            <Step n={5}>Quand c’est validé : clique <strong>« Copier »</strong> sur l’artifact (le code) et <strong>envoie-le à David</strong>. Claude (le dev) l’intègre proprement dans l’app.</Step>
            <Step n={6}>⚠️ <strong>Garde-fou</strong> : si Claude propose de toucher à autre chose que du <strong>visuel</strong> (données, connexion, sécurité), <strong>arrête-toi</strong> et préviens David. Toi = couleurs, formes, textes, animations. Rien d’autre.</Step>
          </Card>

          <Card accent={M.pink}>
            <H>3. La charte Clutch (tes repères)</H>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
              {[['Rose', '#EB6BAF'], ['Vert', '#77BC1F'], ['Prune', '#532943'], ['Studio', '#F4F1F4'], ['Encre', '#1a1418']].map(([n, c]) => (
                <div key={n} style={{ textAlign: 'center', fontSize: 11 }}>
                  <div style={{ width: 52, height: 38, borderRadius: 8, background: c, border: `1px solid ${M.border}` }} />
                  <div style={{ marginTop: 3, color: M.ink70 }}>{n}<br />{c}</div>
                </div>
              ))}
            </div>
            <Rule>Cartes <strong>blanches</strong>, séparées par des lignes fines gris clair (jamais des fonds teintés).</Rule>
            <Rule>Police <strong>SF / system</strong>, coins arrondis, ombres très douces.</Rule>
            <Rule>Vocabulaire : <strong>Clutch · Verrou · Rendez-vous</strong>. Jamais « match / swipe / like ».</Rule>
            <Rule>L’esprit : beau, chaleureux, simple devant — qu’on ait envie de montrer l’écran à une copine.</Rule>
            <P style={{ margin: '6px 0 0', fontSize: 13, color: M.ink40 }}>Pour démarrer avec une base : David t’envoie les écrans actuels de l’app — tu pars de là, tu améliores.</P>
          </Card>

          <Card accent={M.green}>
            <H>4. Ton PROMPT DE DÉMARRAGE — version ChatGPT (Canvas) ⭐</H>
            <P style={{ margin: '0 0 8px', fontSize: 13, color: M.ink40 }}>Sur Firefox → chatgpt.com, abonnement <strong>ChatGPT Plus (~20 $/mois)</strong>. Colle ça dans un nouveau chat :</P>
            <div className="cc-pre">{`Tu es le designer-développeur de CLUTCH, une app de rencontre spontanée EN PERSONNE (Suisse). On travaille dans le CANVAS de ChatGPT.

Je décris des écrans, tu les construis en HTML/React DANS LE CANVAS, et tu les affiches DANS UN CADRE IPHONE (largeur ~375px, hauteur ~812px, coins très arrondis, encoche en haut), centré sur un fond gris clair — pour que je voie le rendu réel d'un téléphone.

CHARTE GRAPHIQUE (toujours) :
- Couleurs : rose #EB6BAF (accents, boutons), vert #77BC1F (validations), prune #532943 (texte fort, onglet actif), fond studio #F4F1F4, cartes BLANCHES #FFFFFF, encre #1a1418.
- Cartes blanches séparées par des lignes fines gris clair (#E6E3E6), JAMAIS de fonds teintés.
- Police système/SF, coins arrondis (12-16px), ombres très douces.
- Vocabulaire : « Clutch », « Verrou », « Rendez-vous ». Jamais « match/swipe/like ».
- Esprit : beau, chaleureux, simple, féminin-friendly. Micro-animations subtiles.

RÈGLES :
- Tu fais UNIQUEMENT du visuel (mise en page, couleurs, formes, textes, animations). Pas de données, pas de logique, pas de sécurité.
- Si je demande de la logique/des données/de la sécurité → préviens-moi que ça sort du design et qu'il faut en parler à David (le dev).
- Travaille DANS LE CANVAS (pas juste dans le chat) pour que je voie le rendu et qu'on itère.
- Garde le code propre et autonome (un seul composant) pour que je puisse cliquer « Copier » et l'envoyer à David.

Commence par me demander quel écran je veux créer en premier.`}</div>
          </Card>

          <Card>
            <H>4 bis. Variante Claude (Artifacts) — si tu préfères Claude</H>
            <P style={{ margin: '0 0 8px', fontSize: 13, color: M.ink40 }}>Même chose sur claude.ai (Claude Pro ~22 CHF/mois). Identique, juste « Artifact » au lieu de « Canvas » :</P>
            <div className="cc-pre">{`Tu es le designer-développeur de CLUTCH, une app de rencontre spontanée EN PERSONNE (Suisse). Je décris des écrans, tu les dessines en React dans un ARTIFACT, et tu les affiches DANS UN CADRE IPHONE (375×812, coins arrondis, encoche en haut) pour que je voie le rendu réel.

CHARTE : rose #EB6BAF · vert #77BC1F · prune #532943 · fond #F4F1F4 · cartes BLANCHES #FFFFFF · encre #1a1418. Cartes séparées par lignes fines #E6E3E6 (jamais de fond teinté). Police SF, coins arrondis, ombres douces. Vocabulaire « Clutch/Verrou/Rendez-vous », jamais « match/swipe/like ». Beau, chaleureux, simple, féminin-friendly.

RÈGLES : tu fais UNIQUEMENT du visuel. Si je demande de la logique/données/sécurité → préviens-moi (voir David). À chaque écran : montre-le dans le cadre iPhone.

Commence par me demander quel écran je veux créer en premier.`}</div>
          </Card>

          <Card accent={M.pink}>
            <H>🎬 5. PROMPT ANIMATIONS (le terrain de jeu de Mel)</H>
            <P style={{ margin: '0 0 8px', fontSize: 13, color: M.ink40 }}>Pour créer les animations (Verrou, radar, célébrations…) et les voir BOUGER dans le cadre iPhone. Colle-le dans un nouveau chat ChatGPT (Canvas) :</P>
            <div className="cc-pre">{`Tu es le motion designer de CLUTCH, app de rencontre spontanée EN PERSONNE (Suisse). On travaille dans le CANVAS de ChatGPT. Je décris une ANIMATION, tu la construis en HTML/Canvas/CSS DANS LE CANVAS, et tu la fais TOURNER EN BOUCLE dans un CADRE IPHONE (~375×812, coins très arrondis, encoche), centré sur fond gris clair — pour que je voie l'animation bouger en vrai.

CHARTE : rose #EB6BAF · vert #77BC1F · prune #532943 · fond studio #F4F1F4 · cartes blanches #FFFFFF · encre #1a1418. Coins arrondis, ombres douces. Vocabulaire « Clutch / Verrou / Rendez-vous » (jamais match/swipe/like). Esprit : beau, chaleureux, VIVANT, féminin-friendly. Subtil > clinquant. Toujours une référence derrière l'anim (sonar, Doppler, battement de cœur, cône de lumière…).

RÈGLES : tu fais UNIQUEMENT du visuel/animation (canvas, SVG, CSS keyframes, particules). Pas de données, pas de logique. Boucle FLUIDE (requestAnimationFrame ou CSS infinite). Quand c'est pertinent, donne-moi des curseurs/boutons pour régler la vitesse, la taille, l'intensité. Code propre et autonome (1 composant) pour que je puisse « Copier » et l'envoyer à David.

LES ANIMATIONS À CRÉER (une à la fois — demande-moi laquelle) :
1. Le VERROU qui se referme (cadenas, confirmation d'un RDV) ✦ la signature
2. Le RADAR de proximité — ondes Doppler + battement de cœur qui s'accélère en approchant
3. Célébration « Clutch envoyé / Verrou créé » (éclat, cœur, étincelles)
4. Le « J'y suis » réussi (épingle qui se pose, halo de validation)
5. Les présences qui s'allument sur la carte (étoiles)
6. Deux orbes qui s'attirent (le moment connexion)
7. Splash de lancement (sablier qui se vide → logo CLUTCH)
8. Clutch Night — ambiance nuit (lune, étoiles qui scintillent)
9. Transitions entre écrans (slide doux, fondu)
10. Micro-interactions boutons (tap, pulse)

Commence par me demander quelle animation je veux créer en premier, et propose-m'en une version de départ.`}</div>
          </Card>
        </>}

      </div>
    </div>
  )
}
