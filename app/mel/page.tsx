'use client'
export default function MelDoc() {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Clutch · Guide test Mel — v08.06-I</title>
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #fafafa; color: #111; }
          .page { max-width: 794px; margin: 0 auto; background: white; padding: 60px 64px; min-height: 100vh; }
          @media print {
            body { background: white; }
            .page { padding: 48px 56px; box-shadow: none; }
            .no-print { display: none !important; }
            @page { margin: 0; size: A4; }
          }
          h1 { font-size: 42px; font-weight: 900; letter-spacing: -0.04em; line-height: 1; }
          h1 span { color: #8B1A4A; }
          h2 { font-size: 18px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 14px; color: #111; }
          h3 { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 10px; }
          p { font-size: 14px; line-height: 1.65; color: #444; }
          .tag { display: inline-block; background: #F5E0EA; color: #8B1A4A; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
          .tag.green { background: #D4F0E4; color: #1a6b45; }
          .tag.dark { background: #111; color: white; }
          .divider { height: 1px; background: #f0f0f0; margin: 32px 0; }
          .section { margin-bottom: 36px; }
          .box { background: #fafafa; border: 1px solid #eee; border-radius: 14px; padding: 20px 24px; margin-bottom: 14px; }
          .box.accent { background: #F5E0EA; border-color: #e8c5d4; }
          .box.dark { background: #0d0d0d; color: white; border-color: #222; }
          .box.dark p { color: #aaa; }
          .box.dark h2 { color: white; }
          .cred { background: #111; color: white; border-radius: 10px; padding: 14px 18px; font-family: 'SF Mono', 'Courier New', monospace; font-size: 13px; margin-bottom: 10px; }
          .cred .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 4px; }
          .cred .val { color: #fff; font-weight: 700; }
          .cred .val span { color: #8B1A4A; }
          .step { display: flex; gap: 16px; align-items: flex-start; margin-bottom: 14px; }
          .step-num { width: 28px; height: 28px; border-radius: 50%; background: #8B1A4A; color: white; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
          .step-text { flex: 1; }
          .step-text strong { display: block; font-size: 14px; font-weight: 700; margin-bottom: 2px; color: #111; }
          .step-text span { font-size: 13px; color: #666; }
          .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
          .score-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
          .score-row:last-child { border-bottom: none; }
          .score-row .name { color: #555; }
          .score-row .val { font-weight: 700; color: #111; }
          .score-row .val.red { color: #C0392B; }
          .score-row .val.orange { color: #e07b39; }
          .score-row .badge { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
          .badge-warn { background: #FDF0E6; color: #c0612b; }
          .badge-pause { background: #fadadf; color: #C0392B; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; display: flex; justify-content: space-between; align-items: flex-end; }
          .footer-left p { font-size: 11px; color: #bbb; line-height: 1.8; }
          .print-btn { background: #8B1A4A; color: white; border: none; border-radius: 10px; padding: 10px 20px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; }
        `}}/>
      </head>
      <body>
        <div className="page">

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <div style={{ width:44, height:44, background:'#8B1A4A', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:22, fontWeight:900 }}>✦</div>
              <div>
                <h1>CLU<span>TCH</span></h1>
              </div>
            </div>
            <p style={{ fontSize:16, color:'#555', lineHeight:1.5 }}>
              Guide de test — version <strong style={{ color:'#8B1A4A' }}>v08.06-I</strong> · 8 juin 2026
            </p>
            <p style={{ fontSize:13, color:'#aaa', marginTop:4 }}>Document préparé pour Mélanie · Confidentiel équipe</p>
          </div>

          <div className="divider"/>

          {/* Tes comptes */}
          <div className="section">
            <h3>Tes accès</h3>
            <div className="grid2">
              <div>
                <div className="cred">
                  <div className="label">Compte principal (toi)</div>
                  <div className="val">mel<span>@clutch.app</span></div>
                  <div className="val" style={{ marginTop:4, fontSize:14 }}>Mel2026!</div>
                </div>
                <div className="tag green">Admin — clutches illimités</div>
              </div>
              <div>
                <div className="cred">
                  <div className="label">Compte test "autre personne"</div>
                  <div className="val">ami<span>@clutch.app</span></div>
                  <div className="val" style={{ marginTop:4, fontSize:14 }}>Ami2026!</div>
                </div>
                <div className="tag">User normal</div>
              </div>
            </div>
            <p style={{ marginTop:12, fontSize:12, color:'#aaa' }}>
              → App : <strong>pz7cgj4kfv-tech.github.io/app</strong> · Démo sans compte : <strong>pz7cgj4kfv-tech.github.io/demo</strong>
            </p>
          </div>

          <div className="divider"/>

          {/* Procédure */}
          <div className="section">
            <h3>Procédure de test — flow complet</h3>

            <div className="box accent" style={{ marginBottom:20 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'#8B1A4A' }}>
                💡 Astuce : utilise Safari sur ton iPhone pour le compte Mel, et un onglet privé Chrome (ou ton ordi) pour le compte Ami. Les deux en même temps.
              </p>
            </div>

            {[
              { n:'1', t:'Se connecter (compte Mel)', d:'Safari → pz7cgj4kfv-tech.github.io/app → email mel@clutch.app / Mel2026!' },
              { n:'2', t:'Compléter l\'onboarding', d:'Prénom déjà rempli. Genre → Âge → Photo (optionnel pour tester) → Intérêts' },
              { n:'3', t:'Se mettre disponible', d:'Choisir heure + lieu à Lausanne. Le toggle "Disponible" s\'allume. Tu apparais dans Discover.' },
              { n:'4', t:'Ouvrir l\'onglet Ami', d:'Onglet privé Chrome → même URL → ami@clutch.app / Ami2026! → onboarding → se mettre dispo aussi' },
              { n:'5', t:'Envoyer un Clutch (depuis Mel)', d:'Discover → profil Ami → Clutcher → choisir café Lausanne → heure → message → Envoyer' },
              { n:'6', t:'Recevoir le Clutch (depuis Ami)', d:'Inbox → "Nouveau Clutch de Mel" → voir lieu/heure → Accepter (ou contre-proposer une autre heure)' },
              { n:'7', t:'Chat entre les deux', d:'Après acceptation → Chat → max 5 messages chacun avant le RDV. Compter combien ça suffit.' },
              { n:'8', t:'Annuler (tester le score)', d:'RDV → Annuler → score de Mel baisse -10pts. Vérifier dans Profil.' },
              { n:'9', t:'Feedback post-RDV', d:'Après la durée du RDV → écran Feedback → Super / OK / Lapin / Fantôme → voir impact sur score.' },
            ].map(s => (
              <div key={s.n} className="step">
                <div className="step-num">{s.n}</div>
                <div className="step-text">
                  <strong>{s.t}</strong>
                  <span>{s.d}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="divider"/>

          {/* Score & Suspension */}
          <div className="section">
            <h3>Système de fiabilité — à tester</h3>
            <div className="box">
              <h2 style={{ fontSize:15, marginBottom:12 }}>Score de fiabilité (0–100%)</h2>
              <div className="score-row"><span className="name">⭐ Super RDV (feedback positif)</span><span className="val">+3 pts</span></div>
              <div className="score-row"><span className="name">🐇 Lapin (retard, prévenu tard)</span><span className="val red">−5 pts</span></div>
              <div className="score-row"><span className="name">👻 Fantôme (no-show sans prévenir)</span><span className="val red">−15 pts</span></div>
              <div className="score-row"><span className="name">❌ Annulation directe du RDV</span><span className="val red">−10 pts</span></div>
            </div>
            <div className="box" style={{ marginTop:8 }}>
              <h2 style={{ fontSize:15, marginBottom:12 }}>Paliers de suspension automatique</h2>
              <div className="score-row"><span className="name">Score &lt; 60%</span><span><span className="badge badge-warn">Pause 3 jours</span></span></div>
              <div className="score-row"><span className="name">Score &lt; 40%</span><span><span className="badge badge-warn">Pause 14 jours</span></span></div>
              <div className="score-row"><span className="name">Score &lt; 20%</span><span><span className="badge badge-pause">Pause 60 jours</span></span></div>
              <div className="score-row"><span className="name">Score = 0%</span><span><span className="badge badge-pause">Ban permanent</span></span></div>
              <p style={{ marginTop:12, fontSize:12, color:'#999' }}>
                → Pendant la suspension : profil invisible dans Discover, impossible de se remettre disponible. Un banner rouge le signale dans l'app.
                Comptes admin (Mel, TestClutch) sont exempts.
              </p>
            </div>
          </div>

          <div className="divider"/>

          {/* Ce qu'il faut regarder */}
          <div className="section">
            <h3>Points à observer / questions pour Mel</h3>
            <div className="grid2">
              {[
                { emoji:'🎨', t:'Design', q:'Est-ce que l\'app est belle ? Qu\'est-ce qui choque ou manque visuellement ?' },
                { emoji:'📱', t:'iPhone', q:'Y a-t-il des bugs sur ton iPhone spécifiquement ? Scrolls, zooms, lag ?' },
                { emoji:'⚡', t:'Fluidité', q:'Les transitions sont-elles fluides ? Où ça "accroche" ?' },
                { emoji:'💬', t:'Wording', q:'Les textes sonnent-ils naturel ? Qu\'est-ce qui est ambigu ou froid ?' },
                { emoji:'🔔', t:'Notifs', q:'Reçois-tu les notifications push ? Claires ? Trop nombreuses ?' },
                { emoji:'😊', t:'Ressenti', q:'Après 10 min d\'utilisation, t\'as envie de revenir ou pas ? Pourquoi ?' },
                { emoji:'😰', t:'Anxiété', q:'Y a-t-il des moments où tu te sens dépassée ou perdue dans l\'app ?' },
                { emoji:'✨', t:'Wow moment', q:'Y a-t-il un moment où tu te dis "c\'est trop bien ça" ? Lequel ?' },
              ].map(item => (
                <div key={item.t} className="box" style={{ padding:'14px 16px' }}>
                  <div style={{ fontSize:20, marginBottom:6 }}>{item.emoji}</div>
                  <strong style={{ fontSize:13, display:'block', marginBottom:4 }}>{item.t}</strong>
                  <p style={{ fontSize:12 }}>{item.q}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="divider"/>

          {/* Version */}
          <div className="section">
            <h3>Fonctionnalités actuelles (v08.06-I)</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {[
                'Auth Supabase','Onboarding','Discover','Envoi/réception Clutch','Chat 5 msgs/personne',
                'Contre-proposition','Événements Lausanne','Score ★ dynamique','Upload photo',
                'Badges sécurité lieux','OSM venue search','Bouton SOS','Feedback post-RDV',
                'Carte Leaflet dispo','Gate dispo obligatoire','Blocage/déblocage','Favoris (premium)',
                'Stripe CHF 19.90','Realtime clutches','Toasts in-app','Proximity Meter',
                'Créneaux 18h','Push notifications OneSignal','Auto-nav accepted→RDV',
                'Invisible pendant RDV actif','Suspension fantômes/lapins','Badge version+timestamp',
              ].map(f => (
                <span key={f} className="tag green" style={{ fontSize:11 }}>{f}</span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="footer-left">
              <p><strong>Clutch</strong> — L&apos;app de rencontres spontanées à Lausanne</p>
              <p>David · Mélanie · Claude · v08.06-I · 8 juin 2026</p>
              <p>david.saugy@gmail.com · Confidentiel équipe</p>
            </div>
            <button className="print-btn no-print" onClick={() => window.print()}>
              ⬇ Imprimer PDF
            </button>
          </div>

        </div>
      </body>
    </html>
  )
}
