'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  bg: '#FDFAF7', bgDeep: '#F5F0EA', primary: '#C4748A', primaryDark: '#A85C72',
  primaryLight: '#F2D4DB', sage: '#7A9E8A', sageLight: '#D4E8DE', peach: '#E8A87C',
  peachLight: '#FAEBD7', gold: '#C9A96E', purple: '#8B7CB8', purpleLight: '#EAE6F8',
  text: '#2C1810', textMid: '#6B4C3B', textLight: '#A08878', border: '#EDE8E3',
}
const TARGET = 500

export default function Landing() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'already'|'error'>('idle')
  const [count, setCount] = useState<number|null>(null)

  useEffect(() => {
    supabase.from('waitlist').select('id', { count: 'exact', head: true })
      .then(({ count: c }) => { if (c !== null) setCount(c) })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() })
    if (!error) {
      setStatus('done')
      setCount(c => (c ?? 0) + 1)
    } else if (error.code === '23505') {
      setStatus('already') // duplicate
    } else {
      setStatus('error')
    }
  }

  const pct = count !== null ? Math.min(100, Math.round((count / TARGET) * 100)) : 0

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${C.text};overflow-x:hidden;}
        a{color:inherit;text-decoration:none;}
        input,button{font-family:inherit;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:.5;transform:scale(.9)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes drift{0%{transform:translate(0,0)}33%{transform:translate(20px,-10px)}66%{transform:translate(-10px,15px)}100%{transform:translate(0,0)}}
        @keyframes shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
        .fadeup{animation:fadeUp .7s ease forwards;opacity:0;}
        .d1{animation-delay:.05s}.d2{animation-delay:.2s}.d3{animation-delay:.35s}.d4{animation-delay:.5s}
      `}</style>

      <div style={{ minHeight:'100vh', background:C.bg, position:'relative' }}>
        <div style={{ position:'fixed', top:'5%', right:'-8%', width:320, height:320, borderRadius:'50%', background:`${C.primary}12`, filter:'blur(70px)', animation:'drift 14s ease-in-out infinite', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'fixed', bottom:'15%', left:'-8%', width:280, height:280, borderRadius:'50%', background:`${C.peach}12`, filter:'blur(60px)', animation:'drift 18s ease-in-out infinite reverse', pointerEvents:'none', zIndex:0 }} />

        {/* NAV */}
        <nav style={{ padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:`1px solid ${C.border}`, position:'sticky', top:0, background:`${C.bg}EE`, backdropFilter:'blur(20px)', zIndex:10 }}>
          <div style={{ fontSize:20, fontWeight:900, letterSpacing:'-0.05em' }}>CLU<span style={{ color:C.primary }}>TCH</span></div>
          <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
            <a href="/demo" style={{ padding:'6px 14px', borderRadius:20, color:C.textMid, fontSize:12, fontWeight:600 }}>🎬 Démo</a>
            <a href="/app" style={{ padding:'6px 14px', borderRadius:20, color:C.textMid, fontSize:12, fontWeight:600 }}>📱 App</a>
            <a href="/flyer" style={{ padding:'6px 14px', borderRadius:20, color:C.textMid, fontSize:12, fontWeight:600 }}>📄 Flyer</a>
            <a href="/hq" style={{ padding:'6px 14px', borderRadius:20, border:`1px solid ${C.border}`, color:C.textLight, fontSize:12, fontWeight:600 }}>⚙️ QG</a>
            <a href="/app" style={{ background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:20, padding:'8px 18px', color:'white', fontSize:12, fontWeight:700 }}>Rejoindre →</a>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ padding:'60px 28px 52px', maxWidth:520, margin:'0 auto', textAlign:'center', position:'relative', zIndex:1 }}>
          {/* Promo badge */}
          <div className="fadeup d1" style={{ display:'inline-flex', alignItems:'center', gap:8, background:`linear-gradient(135deg,${C.gold}22,${C.peachLight})`, border:`1px solid ${C.gold}55`, borderRadius:20, padding:'7px 18px', marginBottom:20 }}>
            <span style={{ fontSize:14 }}>🎁</span>
            <span style={{ color:C.gold, fontSize:12, fontWeight:800 }}>6 premiers mois GRATUITS pour les 500 premiers inscrits</span>
          </div>

          <div className="fadeup d1" style={{ display:'inline-flex', alignItems:'center', gap:8, background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:20, padding:'6px 16px', marginBottom:28 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:C.sage, animation:'pulse 2s ease infinite', display:'inline-block' }} />
            <span style={{ color:C.sage, fontSize:12, fontWeight:700 }}>Bêta privée · Lausanne</span>
          </div>

          <div className="fadeup d2">
            <div style={{ fontSize:'clamp(52px,14vw,84px)', fontWeight:900, lineHeight:0.9, letterSpacing:'-0.05em', marginBottom:16 }}>
              CLU<span style={{ color:C.primary }}>TCH</span>
            </div>
            <div style={{ color:C.textLight, fontSize:12, letterSpacing:'0.3em', textTransform:'uppercase', marginBottom:32, fontWeight:600 }}>be spontaneous</div>
          </div>

          <div className="fadeup d3" style={{ color:C.text, fontSize:'clamp(20px,5vw,28px)', fontWeight:800, lineHeight:1.25, marginBottom:14, letterSpacing:'-0.02em' }}>
            Un vrai café.<br/>Pas un match de plus.
          </div>
          <div className="fadeup d3" style={{ color:C.textMid, fontSize:15, lineHeight:1.8, marginBottom:40, maxWidth:380, margin:'0 auto 40px' }}>
            Clutch propose un rendez-vous physique dans les 18h. Tu réponds en 2h ou le créneau est libéré. Simple. Honnête. Local.
          </div>

          {/* COMPTEUR */}
          <div className="fadeup d4" style={{ background:C.bgDeep, border:`1px solid ${C.border}`, borderRadius:18, padding:'18px 20px', marginBottom:20, textAlign:'left' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10 }}>
              <span style={{ color:C.text, fontWeight:800, fontSize:15 }}>
                {count !== null ? count : '…'} <span style={{ color:C.textLight, fontWeight:500, fontSize:13 }}>/ {TARGET} inscrits</span>
              </span>
              <span style={{ color:C.primary, fontWeight:800, fontSize:13 }}>{pct}%</span>
            </div>
            <div style={{ background:C.border, borderRadius:99, height:8, overflow:'hidden' }}>
              <div style={{ background:`linear-gradient(90deg,${C.primary},${C.gold})`, height:'100%', width:`${pct}%`, borderRadius:99, transition:'width 1s ease' }} />
            </div>
            <div style={{ color:C.textLight, fontSize:11, marginTop:8 }}>
              {TARGET - (count ?? 0) > 0 ? `Plus que ${TARGET - (count ?? 0)} places pour les 6 mois gratuits` : '🎉 Objectif atteint !'}
            </div>
          </div>

          {/* WAITLIST FORM */}
          <div className="fadeup d4" style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:400, margin:'0 auto' }}>
            <a href="/demo" style={{ display:'block', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:16, padding:'16px 24px', color:'white', fontSize:15, fontWeight:800, boxShadow:`0 8px 32px ${C.primary}44` }}>
              ✦ Essaie la démo interactive
            </a>

            {status === 'done' ? (
              <div style={{ background:C.sageLight, border:`1px solid ${C.sage}44`, borderRadius:14, padding:'16px', textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:6 }}>✅</div>
                <div style={{ color:C.sage, fontSize:14, fontWeight:700 }}>Tu es sur la liste !</div>
                <div style={{ color:C.textLight, fontSize:12, marginTop:4 }}>On te prévient en premier dès l'ouverture.</div>
              </div>
            ) : status === 'already' ? (
              <div style={{ background:C.peachLight, border:`1px solid ${C.peach}44`, borderRadius:14, padding:'16px', textAlign:'center' }}>
                <div style={{ color:C.peach, fontSize:14, fontWeight:700 }}>👋 Tu es déjà inscrit·e !</div>
                <div style={{ color:C.textLight, fontSize:12, marginTop:4 }}>On t'a bien en mémoire. On te prévient bientôt.</div>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display:'flex', background:C.bgDeep, border:`1.5px solid ${C.border}`, borderRadius:14, overflow:'hidden' }}>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" required
                  style={{ flex:1, background:'none', border:'none', padding:'14px 16px', color:C.text, fontSize:14, outline:'none' }} />
                <button type="submit" disabled={status==='loading'}
                  style={{ background:C.text, border:'none', padding:'14px 18px', color:'#fff', fontSize:13, fontWeight:700, whiteSpace:'nowrap', cursor:'pointer', opacity:status==='loading'?0.6:1 }}>
                  {status === 'loading' ? '…' : "M'inscrire →"}
                </button>
              </form>
            )}

            {status === 'error' && <div style={{ color:'#D64545', fontSize:12, textAlign:'center' }}>Erreur — réessaie dans un instant.</div>}
            <div style={{ color:C.textLight, fontSize:12 }}>Gratuit pour commencer. Tes règles, ton contrôle. 🛡</div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section style={{ padding:'48px 28px', background:C.bgDeep, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', textAlign:'center', marginBottom:32 }}>Comment ça marche</div>
            {[
              { n:'01', title:'Tu découvres un profil', desc:'Score de compatibilité basé sur tes vraies passions. Pas un algorithme opaque.', color:C.primary },
              { n:'02', title:'Tu proposes un café', desc:'Un lieu public sûr, une heure précise. Les deux personnes valident le lieu final.', color:C.peach },
              { n:'03', title:'Elle répond en 2h max', desc:"Passé ce délai, l'invitation expire automatiquement. Fini le ghosting infini.", color:C.sage },
              { n:'04', title:'Vous vous retrouvez', desc:"RDV réel, dans les 18h. Clutch disparaît ensuite. C'est à vous.", color:C.purple },
            ].map((s,i,arr)=>(
              <div key={i} style={{ display:'flex', gap:20, padding:'20px 0', borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none' }}>
                <div style={{ color:s.color, fontSize:11, fontWeight:900, opacity:0.6, minWidth:28, paddingTop:4, fontFamily:'monospace' }}>{s.n}</div>
                <div>
                  <div style={{ color:C.text, fontSize:16, fontWeight:700, marginBottom:5 }}>{s.title}</div>
                  <div style={{ color:C.textMid, fontSize:13, lineHeight:1.7 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* VALEURS */}
        <section style={{ padding:'44px 28px', position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:24 }}>Nos engagements</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { icon:'🛡', label:'Sécurité d\'abord', desc:'Lieux publics uniquement. Position partagée optionnelle.', color:C.sage, bg:C.sageLight },
                { icon:'🛡', label:'Sécurité d\'abord', desc:'Filtres avancés & contrôle total inclus par défaut.', color:C.primary, bg:C.primaryLight },
                { icon:'⏱', label:'18h maximum', desc:"Un RDV aujourd'hui ou demain.", color:C.peach, bg:C.peachLight },
                { icon:'◎', label:'Qualité > quantité', desc:'3 invitations/semaine. Chaque message compte.', color:C.purple, bg:C.purpleLight },
              ].map(v=>(
                <div key={v.label} style={{ background:v.bg, border:`1px solid ${v.color}33`, borderRadius:18, padding:'16px 14px' }}>
                  <div style={{ fontSize:24, marginBottom:8 }}>{v.icon}</div>
                  <div style={{ color:v.color, fontSize:12, fontWeight:700, marginBottom:5 }}>{v.label}</div>
                  <div style={{ color:C.textMid, fontSize:12, lineHeight:1.5 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TARIFS */}
        <section style={{ padding:'44px 28px', background:C.bgDeep, borderTop:`1px solid ${C.border}`, borderBottom:`1px solid ${C.border}`, position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:500, margin:'0 auto' }}>
            <div style={{ color:C.textLight, fontSize:11, fontWeight:700, letterSpacing:'0.25em', textTransform:'uppercase', marginBottom:24 }}>Tarifs</div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:C.bgDeep, border:`1.5px solid ${C.border}`, borderRadius:20, padding:'20px 16px' }}>
                <div style={{ color:C.text, fontSize:20, fontWeight:900, marginBottom:3 }}>Gratuit</div>
                <div style={{ color:C.textMid, fontSize:11, marginBottom:14, fontWeight:500 }}>Pour tout le monde · toujours</div>
                {['Profil & découverte de profils','3 clutches par jour','Messagerie sécurisée','Bouton SOS intégré','Événements Lausanne'].map(f=>(
                  <div key={f} style={{ color:C.text, fontSize:12, padding:'6px 0', borderBottom:`1px solid ${C.border}`, display:'flex', gap:7 }}><span style={{color:C.sage}}>✓</span>{f}</div>
                ))}
              </div>
              <div style={{ background:C.sageLight, border:`1.5px solid ${C.sage}55`, borderRadius:20, padding:'20px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <div style={{ color:C.sage, fontSize:18, fontWeight:900 }}>Sécurité+</div>
                  <span style={{ background:C.sage, color:'#fff', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:10 }}>INCLUS</span>
                </div>
                <div style={{ color:C.textMid, fontSize:11, marginBottom:14, fontWeight:500 }}>Outils de contrôle & sécurité avancés — disponibles pour qui en a besoin</div>
                {['Filtres : qui peut te clutcher','Score de fiabilité minimum requis','Mode discret (invisible quand tu veux)','Certifiés uniquement si tu le souhaites'].map(f=>(
                  <div key={f} style={{ color:C.text, fontSize:12, padding:'6px 0', borderBottom:`1px solid ${C.sage}33`, display:'flex', gap:7 }}><span style={{color:C.sage}}>✓</span>{f}</div>
                ))}
              </div>
              <div style={{ background:`linear-gradient(160deg,${C.peachLight},${C.purpleLight})`, border:`1.5px solid ${C.gold}55`, borderRadius:20, padding:'20px 16px' }}>
                <div style={{ color:C.gold, fontSize:20, fontWeight:900, marginBottom:2 }}>CHF 19.90<span style={{ fontSize:12, fontWeight:500, color:C.textMid }}>/mois</span></div>
                <div style={{ color:C.textMid, fontSize:11, marginBottom:14, fontWeight:500 }}>Premium · pour aller plus loin</div>
                {['Clutches illimités','Boost de visibilité','Voir qui a vu ton profil','Affinités & filtres détaillés','Badge Premium sur ton profil'].map(f=>(
                  <div key={f} style={{ color:C.text, fontSize:12, padding:'6px 0', borderBottom:`1px solid ${C.gold}33`, display:'flex', gap:7 }}><span style={{color:C.gold}}>✓</span>{f}</div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section style={{ padding:'56px 28px 80px', background:C.primaryLight, borderTop:`1px solid ${C.border}`, textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ maxWidth:440, margin:'0 auto' }}>
            <div style={{ fontSize:32, marginBottom:14 }}>☕</div>
            <div style={{ color:C.text, fontSize:24, fontWeight:800, marginBottom:10, letterSpacing:'-0.03em' }}>Prêt(e) à essayer ?</div>
            <div style={{ color:C.textMid, fontSize:14, marginBottom:32, lineHeight:1.75 }}>
              La démo montre tous les écrans.<br/>Aucun compte requis.
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:320, margin:'0 auto' }}>
              <a href="/demo" style={{ display:'block', background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`, borderRadius:16, padding:'16px 24px', color:'white', fontSize:15, fontWeight:800, boxShadow:`0 8px 32px ${C.primary}44` }}>
                ✦ Voir la démo
              </a>
              <a href="/app" style={{ display:'block', border:`2px solid ${C.primary}`, borderRadius:16, padding:'14px 24px', color:C.primary, fontSize:14, fontWeight:700 }}>
                + Accéder à l'app réelle
              </a>
            </div>
            <div style={{ color:C.textLight, fontSize:11, marginTop:24 }}>Lausanne · Suisse romande · 2026</div>
            <a href="/hq" style={{ display:'inline-block', marginTop:16, color:'transparent', fontSize:8, userSelect:'none' }}>·</a>
          </div>
        </section>

      </div>
    </>
  )
}
