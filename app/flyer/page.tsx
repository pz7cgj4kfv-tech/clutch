export default function Flyer() {
  return (
    <div style={{ background:'#EDE8E3', minHeight:'100vh', fontFamily:'-apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif', color:'#2C1810', padding:'40px 20px 60px' }}>
      <div style={{ maxWidth:680, margin:'0 auto' }}>

        {/* HEADER */}
        <div style={{ background:'#2C1810', borderRadius:20, padding:'40px 40px 36px', marginBottom:16, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, background:'radial-gradient(circle, rgba(196,116,138,0.3) 0%, transparent 70%)', borderRadius:'50%' }}/>
          <div style={{ fontSize:64, fontWeight:900, color:'#fff', letterSpacing:-4, lineHeight:1, fontStyle:'italic', position:'relative', zIndex:1 }}>CLUTCH<span style={{ color:'#C4748A' }}>.</span></div>
          <div style={{ fontSize:14, fontWeight:700, color:'#C4748A', letterSpacing:'0.2em', textTransform:'uppercase', marginTop:8, position:'relative', zIndex:1 }}>Be Spontaneous</div>
          <div style={{ fontSize:15, color:'rgba(255,255,255,0.6)', marginTop:10, lineHeight:1.5, position:'relative', zIndex:1, maxWidth:420 }}>L'app qui transforme chaque connexion en vrai rendez-vous physique — en 18 heures maximum. Lausanne & Suisse romande.</div>
          <div style={{ display:'flex', gap:8, marginTop:20, flexWrap:'wrap', position:'relative', zIndex:1 }}>
            {['Bêta · Juin 2026','Lausanne 🇨🇭','Freemium','Sécurité incluse 🛡'].map(b => (
              <span key={b} style={{ background:'rgba(196,116,138,0.2)', border:'1px solid rgba(196,116,138,0.4)', borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:700, color:'#C4748A' }}>{b}</span>
            ))}
          </div>
        </div>

        {/* PROBLÈME / SOLUTION */}
        <div style={{ background:'#FDFAF7', borderRadius:16, padding:'28px 32px', marginBottom:12, border:'1px solid #EDE8E3' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#C4748A', marginBottom:16 }}>Le constat</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ background:'#F5F0EA', border:'1px solid #EDE8E3', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:22, marginBottom:8 }}>💀</div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'#A08878', marginBottom:6 }}>Le problème</div>
              <div style={{ fontSize:12.5, color:'#6B4C3B', lineHeight:1.55 }}>Les apps de rencontres sont des cimetières de matchs. On swipe, on tchat des jours. On ne se rencontre jamais vraiment.</div>
            </div>
            <div style={{ background:'rgba(196,116,138,0.08)', border:'1px solid rgba(196,116,138,0.25)', borderRadius:12, padding:16 }}>
              <div style={{ fontSize:22, marginBottom:8 }}>⚡</div>
              <div style={{ fontSize:10, fontWeight:800, letterSpacing:'0.15em', textTransform:'uppercase', color:'#C4748A', marginBottom:6 }}>La solution</div>
              <div style={{ fontSize:12.5, color:'#2C1810', lineHeight:1.55 }}>Clutch force l'action. Un clutch = un RDV proposé dans les 2h. Ou ça expire. Pas de chit-chat infini.</div>
            </div>
          </div>
        </div>

        {/* VOCABULAIRE */}
        <div style={{ background:'#FDFAF7', borderRadius:16, padding:'28px 32px', marginBottom:12, border:'1px solid #EDE8E3' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#C4748A', marginBottom:16 }}>Le vocabulaire Clutch</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {[
              ['Clutcher','Envoyer une proposition de RDV. "Je t\'ai clutché ce soir !"'],
              ['Un clutch','La proposition : lieu + heure + message. Expire si pas de réponse en 2h.'],
              ['Score de fiabilité','Note 0–100. Baisse si tu no-show. Monte si tu viens. Visible sur le profil.'],
              ['Check-in','Tu confirmes ton arrivée au café. Lance le feedback mutuel.'],
              ['Disponible maintenant','Tu actives ta dispo → ton profil apparaît dans les découvertes.'],
              ['Score de compatibilité','Calculé selon intérêts communs + fiabilité. De 60% à 100%.'],
            ].map(([w,d]) => (
              <div key={w} style={{ background:'#F5F0EA', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#C4748A', marginBottom:3 }}>{w}</div>
                <div style={{ fontSize:11.5, color:'#6B4C3B', lineHeight:1.4 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* COMMENT ÇA MARCHE */}
        <div style={{ background:'#FDFAF7', borderRadius:16, padding:'28px 32px', marginBottom:12, border:'1px solid #EDE8E3' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#C4748A', marginBottom:20 }}>Comment ça marche — le flux complet</div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              ['👤','1. Tu crées ton profil','Prénom, photo, âge, ville de dispo (Lausanne, Genève, Fribourg…), quartier, passions. Onboarding en 2 min. Tu peux certifier ton profil avec un selfie pour booster ta visibilité.',''],
              ['🔍','2. Tu découvres des profils disponibles','Seuls les gens disponibles apparaissent — maintenant ou plus tard dans la journée. Tu vois leur score de compatibilité, passions communes, quartier.',''],
              ['⚡','3. Tu clutches','Tu proposes un lieu, une heure, un message personnel. Le clutch arrive à l\'autre.','⏳ L\'autre a 2h pour accepter ou refuser'],
              ['☕','4. Le RDV a lieu','Compte à rebours live. Vous vous retrouvez. Check-in en arrivant.','📍 Maximum 18h après l\'envoi'],
              ['⭐','5. Le feedback mutuel','Super ⭐ / Ok 👍 / Rabbit 🐰 / Ghost 👻. Impacte le score de fiabilité de l\'autre.',''],
            ].map(([icon,title,desc,rule]) => (
              <div key={title} style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{ width:36, height:36, minWidth:36, background:'linear-gradient(135deg,#C4748A,#A85C72)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#2C1810', marginBottom:3 }}>{title}</div>
                  <div style={{ fontSize:12.5, color:'#6B4C3B', lineHeight:1.5 }}>{desc}</div>
                  {rule && <span style={{ display:'inline-block', marginTop:5, background:'rgba(196,116,138,0.1)', border:'1px solid rgba(196,116,138,0.2)', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, color:'#C4748A' }}>{rule}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FONCTIONNALITÉS */}
        <div style={{ background:'#FDFAF7', borderRadius:16, padding:'28px 32px', marginBottom:12, border:'1px solid #EDE8E3' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#C4748A', marginBottom:16 }}>Toutes les fonctionnalités</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['🔒','Profils certifiés','Selfie de vérification. Badge visible. Réduit les faux profils.'],
              ['⚡','Disponibilité flexible','Maintenant, ce soir, demain matin. Tu choisis où tu veux te retrouver — pas où tu es.'],
              ['🎯','Score de compatibilité','Passions communes + fiabilité. Affiché sur chaque profil.'],
              ['💬','Messagerie sécurisée','Chat uniquement après un clutch accepté. Modération auto.'],
              ['🚨','Bouton SOS','Position en direct + appel 117. Pour les premiers RDV.'],
              ['🚩','Signalement','6 catégories. Traitement en 24h. Suspension si grave.'],
              ['🎉','Événements Lausanne','Jazz, expo, brunch, rando… Clutch organise ou partenaires locaux.'],
              ['📊','Score de fiabilité','Tu no-show = tu perds des points. Visible par tous. Crée la confiance.'],
              ['🤝','Partenaires','Cafés, restaurants, salles de sport partenaires avec offres exclusives.'],
              ['🛡','Sécurité avancée','Filtres : qui peut te clutcher, âge, score min. Mode discret.'],
            ].map(([icon,name,desc]) => (
              <div key={name} style={{ background:'#F5F0EA', borderRadius:12, padding:'14px 16px', display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={{ fontSize:20, minWidth:24 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:800, color:'#2C1810', marginBottom:2 }}>{name}</div>
                  <div style={{ fontSize:11, color:'#A08878', lineHeight:1.4 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SÉCURITÉ */}
        <div style={{ background:'#FDFAF7', borderRadius:16, padding:'28px 32px', marginBottom:12, border:'1px solid #EDE8E3' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#C4748A', marginBottom:16 }}>Sécurité & Confiance</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              ['📍','Position GPS jamais stockée — convertie en quartier au moment de l\'activation, puis supprimée. Tu n\'apparais qu\'avec "Lausanne-Flon", jamais ta rue exacte.'],
              ['🔐','Données chiffrées — hébergées sur Supabase (Amazon Frankfurt, UE). Conformité RGPD et loi suisse LPD (sept. 2023).'],
              ['🚨','Bouton SOS intégré — partage ta position en temps réel à un proche + accès direct au 117. Recommandé pour tous les premiers RDV.'],
              ['🤖','Modération automatique — liste de mots bannis vérifiée avant chaque message. Signalements traités en 24h ouvrables.'],
              ['⏱','Max 3 clutches/jour — évite le spam. Chaque clutch doit être intentionnel et réfléchi.'],
            ].map(([icon,text]) => (
              <div key={icon} style={{ display:'flex', gap:12, alignItems:'center', background:'#F5F0EA', borderRadius:10, padding:'10px 14px' }}>
                <div style={{ fontSize:18, minWidth:22 }}>{icon}</div>
                <div style={{ fontSize:12.5, color:'#4A2E20', lineHeight:1.4 }}>{text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MARCHÉ */}
        <div style={{ background:'#FDFAF7', borderRadius:16, padding:'28px 32px', marginBottom:12, border:'1px solid #EDE8E3' }}>
          <div style={{ fontSize:11, fontWeight:800, letterSpacing:'0.2em', textTransform:'uppercase', color:'#C4748A', marginBottom:16 }}>Marché & Modèle économique</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
            {[['500K','personnes 18–35 ans\nSuisse romande'],['2.7Md $','marché mondial\ndating apps 2025'],['0','app spontanéité\nen Suisse romande']].map(([n,l]) => (
              <div key={n} style={{ background:'#F5F0EA', borderRadius:12, padding:14, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:900, color:'#C4748A', letterSpacing:-1 }}>{n}</div>
                <div style={{ fontSize:10, color:'#A08878', marginTop:3, lineHeight:1.3, whiteSpace:'pre-line' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background:'rgba(196,116,138,0.08)', border:'1px solid rgba(196,116,138,0.2)', borderRadius:12, padding:16 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#C4748A', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Modèle Freemium</div>
            {[
              ['Tout le monde — profil, découverte, 3 clutches/jour, SOS','Gratuit'],
              ['Sécurité+ — filtres avancés, mode discret, contrôle des clutches reçus','Inclus'],
              ['Premium — clutches illimités, boost, voir qui a vu le profil','CHF 19.90/mois'],
              ['Partenaires événements — commission sur billets & réservations','Commission'],
            ].map(([u,p]) => (
              <div key={u} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12.5, padding:'6px 0', borderBottom:'1px solid rgba(196,116,138,0.1)' }}>
                <span style={{ color:'#4A2E20' }}>{u}</span>
                <span style={{ fontWeight:800, color: p==='Gratuit'||p==='Inclus' ? '#7A9E8A' : '#2C1810', marginLeft:12, whiteSpace:'nowrap' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA BÊTA */}
        <div style={{ background:'linear-gradient(135deg,#2C1810 0%,#4A2E20 100%)', borderRadius:16, padding:'28px 32px', marginBottom:12 }}>
          <div style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:8 }}>On a besoin de toi 🙏</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.5, marginBottom:20 }}>Clutch est en phase bêta à Lausanne. On cherche des premiers utilisateurs curieux, des amis qui veulent tester et donner leur avis honnête.</div>
          <div style={{ background:'rgba(196,116,138,0.15)', border:'1px solid rgba(196,116,138,0.3)', borderRadius:12, padding:'14px 16px', marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:800, color:'#C4748A', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Ce qu'on te demande</div>
            {['Créer un profil sur la vraie app (2 min)','Envoyer au moins 1 clutch à quelqu\'un cette semaine','Nous dire ce qui t\'a bloqué, ce qui t\'a plu, ce qui manque','Partager l\'app à 2–3 amis lausannois'].map(i => (
              <div key={i} style={{ fontSize:12.5, color:'rgba(255,255,255,0.75)', padding:'4px 0', paddingLeft:16, position:'relative' }}>
                <span style={{ position:'absolute', left:0, color:'#C4748A' }}>→</span>{i}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <a href="/demo" style={{ background:'#C4748A', color:'#fff', borderRadius:10, padding:'12px 20px', fontSize:13, fontWeight:800, textDecoration:'none' }}>🎬 Essaie la démo</a>
            <a href="/app" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', borderRadius:10, padding:'12px 20px', fontSize:13, fontWeight:700, textDecoration:'none' }}>Créer mon profil →</a>
          </div>
        </div>

        <div style={{ textAlign:'center', fontSize:12, color:'#A08878' }}>
          Construit à Lausanne 🇨🇭 · <a href="mailto:david.saugy@gmail.com" style={{ color:'#C4748A', textDecoration:'none', fontWeight:600 }}>david.saugy@gmail.com</a>
        </div>

      </div>
    </div>
  )
}
