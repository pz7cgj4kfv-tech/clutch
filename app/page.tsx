'use client'
import { useState } from 'react'

const C = {
  bg: '#FDFAF7',
  bgDeep: '#F5F0EA',
  bgSection: '#F0EBE3',
  primary: '#C4748A',
  primaryDark: '#A85C72',
  primaryLight: '#F2D4DB',
  sage: '#7A9E8A',
  sageLight: '#D4E8DE',
  peach: '#E8A87C',
  peachLight: '#FAEBD7',
  gold: '#C9A96E',
  purple: '#8B7CB8',
  purpleLight: '#EAE6F8',
  text: '#2C1810',
  textMid: '#6B4C3B',
  textLight: '#A08878',
  border: '#EDE8E3',
  shadow: 'rgba(44,24,16,0.07)',
}

export default function Landing() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${C.text};}
        a{color:inherit;text-decoration:none;}
        input,button{font-family:inherit;}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes drift{0%{transform:translate(0,0)}33%{transform:translate(20px,-10px)}66%{transform:translate(-10px,15px)}100%{transform:translate(0,0)}}
        .fadeup{animation:fadeUp .7s ease forwards;opacity:0;}
        .d1{animation-delay:.05s}.d2{animation-delay:.2s}.d3{animation-delay:.35s}.d4{animation-delay:.5s}.d5{animation-delay:.65s}
      `}</style>

      <div style={{ minHeight:'100vh', background:C.bg, overflowX:'hidden', position:'relative' }}>

        {/* Ambient blobs */}
        <div style={{ position:'fixed', top:'5%', right:'-8%', width:320, height:320, borderRadius:'50%', background:`${C.primary}12`, filter:'blur(70px)', animation:'drift 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', bottom:'15%', left:'-8%', width:280, height:280, borderRadius:'50%', background:`${C.peach}12`, filter:'blur(60px)', animation:'drift 18s ease-in-out infinite reverse', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', top:'50%', left:'50%', width:200, height:200, borderRadius:'50%', background:`${C.sage}0A`, filter:'blur(50px)', animation:'drift 22s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />

        {/* NAV */}
        <nav style={{ padding:'16px 28px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, background:`${C.bg}EE`, backdropFilter:'blur(20px)', zIndex:10 }}>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:'-0.05em', color:C.text }}>
            CLU<span style={{ color:C.primary }}>TCH</span>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <span style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase' }}>Lausanne</span>
            <a href="/demo" style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:20, padding:'8px 18px', color:'white', fontSize:12, fontWeight:700 }}>Essayer →</a>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding:'72px 28px 60px', maxWidth:520, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          <div className="fadeup d1" style={{ display:'inline-flex', alignItems:'center', gap:8, background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:20, padding:'6px 16px', marginBottom:32 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:C.sage, animation:'pulse 2s ease infinite', display:'inline-block' }} />
            <span style={{ color:C.sage, fontSize:12, fontWeight:700 }}>Bêta privée · Lausanne</span>
          </div>

          <div className="fadeup d2">
            <div style={{ fontSize:'clamp(52px,14vw,84px)', fontWeight:900, lineHeight:0.9, letterSpacing:'-0.05em', marginBottom:16, color:C.text }}>
              CLU<span style={{ color:C.primary }}>TCH</span>
            </div>
            <div style={{ color:C.textLight, fontSize:12, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:36, fontWeight:600 }}>
              be spontaneous
            </div>
          </div>

          <div className="fadeup d3" style={{ color:C.text, fontSize:'clamp(22px,5vw,30px)', fontWeight:800, lineHeight:1.25, marginBottom:16, letterSpacing:'-0.02em' }}>
            Un vrai café.<br/>Pas un match de plus.
          </div>

          <div className="fadeup d3" style={{ color:C.textMid, fontSize:15, lineHeight:1.8, marginBottom:44, maxWidth:380, margin:'0 auto 44px' }}>
            Clutch propose un rendez-vous physique dans les 18h. Tu réponds en 2h ou le créneau est libéré. Simple. Honnête. Local.
          </div>

          <div className="fadeup d4" style={{ display:'flex', flexDirection:'column', gap:14, maxWidth:400, margin:'0 auto' }}>
            <a href="/demo" style={{ display:'block', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:16, padding:'18px 24px', color:'white', fontSize:16, fontWeight:800, letterSpacing:'-0.01em', boxShadow:`0 8px 32px ${C.primary}44` }}>
              ✦ Essaie la démo interactive
            </a>

            {!submitted ? (
              <form onSubmit={submit} style={{ display:'flex', background:C.bgDeep, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" required style={{ flex:1, background:'none', border:'none', padding:'14px 16px', color:C.text, fontSize:14, outline:'none' }} />
                <button type="submit" style={{ background:C.text, border:'none', padding:'14px 18px', color:'#fff', fontSize:13, fontWeight:700, whiteSpace:'nowrap', cursor:'pointer' }}>
                  Liste d'attente →
                </button>
              </form>
            ) : (
              <div style={{ background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:14, padding:'14px 16px', textAlign:'center' }}>
                <span style={{ color:C.sage, fontSize:14, fontWeight:700 }}>✓ Tu es sur la liste. On te prévient en premier.</span>
              </div>
            )}
            <div style={{ color:C.textLight, fontSize:12 }}>Toujours gratuit pour les femmes 💜</div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section style={{ padding:'56px 28px', background:C.bgDeep, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', textAlign:'center', marginBottom:36 }}>Comment ça marche</div>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {[
                { n:'01', title:'Tu découvres un profil', desc:'Score de compatibilité basé sur tes vraies passions. Pas un algorithme opaque.', color:C.primary },
                { n:'02', title:'Tu proposes un café', desc:'Un lieu public sûr, une heure précise. La femme valide toujours le lieu final.', color:C.peach },
                { n:'03', title:'Elle répond en 2h max', desc:"Passé ce délai, l'invitation expire automatiquement. Fini le ghosting infini.", color:C.sage },
                { n:'04', title:'Vous vous retrouvez', desc:'RDV réel, dans les 18h. Clutch disparaît ensuite. C\'est à vous.', color:C.purple },
              ].map((s,i,arr)=>(
                <div key={i} style={{ display:'flex', gap:20, padding:'22px 0', borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
                  <div style={{ color:s.color, fontSize:11, fontWeight:900, opacity:0.6, minWidth:28, paddingTop:4, fontFamily:'monospace' }}>{s.n}</div>
                  <div>
                    <div style={{ color:C.text, fontSize:17, fontWeight:700, marginBottom:6 }}>{s.title}</div>
                    <div style={{ color:C.textMid, fontSize:13, lineHeight:1.7 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALEURS */}
        <section style={{ padding:'48px 28px', position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:28 }}>Nos engagements</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { icon:'🛡', label:'Sécurité d\'abord', desc:'Lieux publics uniquement. Position partagée optionnelle.', color:C.sage, bg:C.sageLight },
                { icon:'💜', label:'Gratuit pour les femmes', desc:'Toujours. Sans conditions. Égalité réelle.', color:C.primary, bg:C.primaryLight },
                { icon:'⏱', label:'18h maximum', desc:"Un RDV aujourd'hui ou demain. Pas dans 3 semaines.", color:C.peach, bg:C.peachLight },
                { icon:'◎', label:'Qualité > quantité', desc:'3 invitations/semaine. Chaque message compte.', color:C.purple, bg:C.purpleLight },
              ].map(v=>(
                <div key={v.label} style={{ background:v.bg, border:`1px solid ${v.color}33`, borderRadius:18, padding:'18px 14px' }}>
                  <div style={{ fontSize:26, marginBottom:10 }}>{v.icon}</div>
                  <div style={{ color:v.color, fontSize:12, fontWeight:700, marginBottom:6 }}>{v.label}</div>
                  <div style={{ color:C.textMid, fontSize:12, lineHeight:1.55 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TARIFS */}
        <section style={{ padding:'48px 28px', background:C.bgDeep, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:28 }}>Tarifs</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div style={{ background:C.sageLight, border:`1.5px solid ${C.sage}55`, borderRadius:20, padding:'22px 18px' }}>
                <div style={{ color:C.sage, fontSize:26, fontWeight:900, marginBottom:4 }}>Gratuit</div>
                <div style={{ color:C.textMid, fontSize:12, marginBottom:16, fontWeight:500 }}>Pour les femmes · toujours</div>
                {['Accès complet','Invitations illimitées','RDV illimités','SOS intégré'].map(f=>(
                  <div key={f} style={{ color:C.text, fontSize:13, padding:'7px 0', borderBottom:`1px solid ${C.sage}33`, display:'flex', gap:8 }}><span style={{color:C.sage}}>✓</span>{f}</div>
                ))}
              </div>
              <div style={{ background:`linear-gradient(160deg,${C.peachLight},${C.purpleLight})`, border:`1.5px solid ${C.gold}55`, borderRadius:20, padding:'22px 18px' }}>
                <div style={{ color:C.gold, fontSize:22, fontWeight:900, marginBottom:2 }}>CHF 19.90</div>
                <div style={{ color:C.textMid, fontSize:12, marginBottom:16, fontWeight:500 }}>Pour les hommes · /mois</div>
                {['3 invitations/sem.','Voir qui t\'a liké','Affinités détaillées','Priorité découverte'].map(f=>(
                  <div key={f} style={{ color:C.text, fontSize:13, padding:'7px 0', borderBottom:`1px solid ${C.gold}33`, display:'flex', gap:8 }}><span style={{color:C.gold}}>✓</span>{f}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* BADGES FIABILITÉ */}
        <section style={{ padding:'48px 28px', position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:28 }}>Le système de fiabilité</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { emoji:'⭐', label:'Top', desc:'100 RDV honorés consécutifs. Le meilleur badge.', bg:`linear-gradient(135deg,${C.peachLight},${C.purpleLight})`, border:C.gold },
                { emoji:'✓', label:'Fiable', desc:'Tu honores tes RDV. Ton score parle pour toi.', bg:C.sageLight, border:C.sage },
                { emoji:'🐰', label:'Lapin', desc:"Tu as annulé à la dernière minute. -10 pts, -1 crédit d'invitation.", bg:'#FFF8DC', border:'#D4A017' },
                { emoji:'👻', label:'Fantôme', desc:"Tu n'es pas venu·e sans prévenir. -20 pts, cooldown 7 jours.", bg:'#F5F5F5', border:'#999' },
              ].map(b=>(
                <div key={b.label} style={{ display:'flex', gap:14, alignItems:'center', background:b.bg, border:`1.5px solid ${b.border}44`, borderRadius:16, padding:'14px 18px' }}>
                  <span style={{ fontSize:28, minWidth:36, textAlign:'center' }}>{b.emoji}</span>
                  <div>
                    <p style={{ fontWeight:700, color:C.text, fontSize:14 }}>{b.label}</p>
                    <p style={{ fontSize:12, color:C.textMid, marginTop:2, lineHeight:1.5 }}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ padding:'60px 28px 96px', background:C.primaryLight, borderTop:`1px solid ${C.border}`, textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:440, margin:'0 auto' }}>
            <div style={{ fontSize:36, marginBottom:16 }}>☕</div>
            <div style={{ color:C.text, fontSize:26, fontWeight:800, marginBottom:12, letterSpacing:'-0.03em' }}>Prêt(e) à essayer ?</div>
            <div style={{ color:C.textMid, fontSize:15, marginBottom:36, lineHeight:1.75 }}>
              La démo montre tous les écrans.<br/>Aucun compte requis.
            </div>
            <a href="/demo" style={{ display:'inline-block', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:16, padding:'18px 40px', color:'white', fontSize:16, fontWeight:800, boxShadow:`0 8px 32px ${C.primary}44` }}>
              ✦ Voir la démo
            </a>
            <div style={{ color:C.textLight, fontSize:12, marginTop:28 }}>Lausanne · Suisse romande · 2025</div>
          </div>
        </section>

      </div>
    </>
  )
}
