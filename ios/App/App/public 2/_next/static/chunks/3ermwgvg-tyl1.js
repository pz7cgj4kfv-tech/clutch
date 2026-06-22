(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,50844,e=>{"use strict";let t=(0,e.i(27795).createClient)("https://fnucdicfcjoxbozpfdau.supabase.co","sb_publishable_TXWkldkILlJ5G9OTOfiCLg_NYZLVMTZ");e.s(["supabase",0,t])},84112,e=>{"use strict";var t=e.i(63846),i=e.i(93524),n=e.i(50844);e.s(["default",0,function(){let[e,r]=(0,i.useState)(""),[a,s]=(0,i.useState)(!1),[o,l]=(0,i.useState)(!1),[d,c]=(0,i.useState)(""),[p,g]=(0,i.useState)(null),[m,x]=(0,i.useState)(!1),f=(0,i.useRef)(null);(0,i.useEffect)(()=>{window.Capacitor?.isNativePlatform?.()&&(x(!0),window.location.replace("app2.html"))},[]),(0,i.useEffect)(()=>{n.supabase.from("waitlist").select("id",{count:"exact",head:!0}).then(({count:e})=>{null!=e&&g(e)},()=>{})},[]);let h=async()=>{if(!e.trim()||!e.includes("@"))return void c("Email invalide");l(!0),c("");let{error:t}=await n.supabase.from("waitlist").insert({email:e.trim().toLowerCase()});(l(!1),t&&"23505"===t.code)?s(!0):t?c("Erreur — réessaie"):(s(!0),g(e=>null!=e?e+1:null))};return m?null:(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("style",{children:`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          background: #2a1020;
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
          color: #f5e8de;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }
        input { font-family: inherit; }
        ::-webkit-scrollbar { width: 0; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: .3; }
          50%       { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.06); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        .anim { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
        .d1 { animation-delay: .05s; }
        .d2 { animation-delay: .18s; }
        .d3 { animation-delay: .32s; }
        .d4 { animation-delay: .46s; }
        .d5 { animation-delay: .60s; }

        .btn-red {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 16px 28px;
          background: #C8860A; color: #1a0a14;
          border: none; border-radius: 12px;
          font-size: 16px; font-weight: 800;
          cursor: pointer; text-decoration: none;
          transition: background .15s, transform .15s;
          letter-spacing: -.02em; line-height: 1;
          white-space: nowrap;
        }
        .btn-red:hover { background: #a06d08; transform: translateY(-1px); }
        .btn-red:active { transform: scale(.98); }

        .btn-outline {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 16px 28px;
          background: transparent; color: #FFBF9E;
          border: 1px solid rgba(245,232,222,0.25); border-radius: 12px;
          font-size: 16px; font-weight: 700;
          cursor: pointer; text-decoration: none;
          transition: border-color .15s, transform .15s;
          letter-spacing: -.02em; line-height: 1;
          white-space: nowrap;
        }
        .btn-outline:hover { border-color: rgba(245,232,222,0.6); transform: translateY(-1px); }

        .stat-card {
          text-align: center;
          padding: 28px 20px;
          border: 1px solid rgba(255,191,158,0.08);
          border-radius: 16px;
          background: rgba(255,191,158,0.05);
        }

        .step-dot {
          width: 40px; height: 40px;
          border-radius: 50%;
          background: #C8860A;
          color: #1a0a14;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 900;
          flex-shrink: 0;
        }

        .feat-card {
          padding: 20px;
          border: 1px solid rgba(255,191,158,0.08);
          border-radius: 14px;
          background: rgba(255,191,158,0.05);
          transition: border-color .2s;
        }
        .feat-card:hover { border-color: rgba(200,134,10,0.3); }

        .ticker-wrap {
          overflow: hidden;
          padding: 16px 0;
          background: rgba(255,191,158,0.05);
          border-top: 1px solid rgba(255,191,158,0.08);
          border-bottom: 1px solid rgba(255,191,158,0.08);
          white-space: nowrap;
          user-select: none;
        }
        .ticker-inner {
          display: inline-block;
          animation: ticker 24s linear infinite;
        }
        .ticker-item {
          display: inline-block;
          padding: 0 32px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: rgba(245,232,222,0.35);
        }
        .ticker-item span { color: #C8860A; margin-right: 32px; }

        .waitlist-input {
          width: 100%;
          padding: 15px 18px;
          background: rgba(255,191,158,0.07);
          border: 1px solid rgba(255,191,158,0.12);
          border-radius: 12px;
          font-size: 16px;
          color: #f5e8de;
          outline: none;
          caret-color: #C8860A;
          transition: border-color .15s;
        }
        .waitlist-input:focus { border-color: rgba(200,134,10,0.5); }
        .waitlist-input.error { border-color: #C8860A; }
        .waitlist-input::placeholder { color: rgba(245,232,222,0.3); }

        .pill-nav {
          display: inline-flex; align-items: center;
          padding: 7px 14px;
          border: 1px solid rgba(255,191,158,0.12);
          border-radius: 999px;
          font-size: 12px; font-weight: 600;
          color: rgba(245,232,222,0.5);
          text-decoration: none;
          transition: border-color .15s, color .15s;
        }
        .pill-nav:hover { border-color: rgba(200,134,10,0.4); color: #C8860A; }

        @media (min-width: 600px) {
          .hero-title { font-size: 72px !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .feat-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}),(0,t.jsxs)("nav",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"18px 24px",borderBottom:"1px solid rgba(255,191,158,0.08)",position:"sticky",top:0,zIndex:100,background:"rgba(42,16,32,0.92)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)"},children:[(0,t.jsxs)("div",{style:{fontSize:20,fontWeight:900,letterSpacing:"-.06em",color:"#f5e8de"},children:["CLUTCH",(0,t.jsx)("span",{style:{color:"#C8860A",marginLeft:2},children:"."})]}),(0,t.jsxs)("div",{style:{display:"flex",gap:8,alignItems:"center"},children:[(0,t.jsx)("a",{href:"/app2",className:"btn-red",style:{padding:"9px 16px",fontSize:13},children:"Tester →"}),(0,t.jsx)("a",{href:"/hq",className:"pill-nav",children:"QG 🔒"})]})]}),(0,t.jsxs)("section",{style:{minHeight:"calc(100svh - 61px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"64px 24px 48px",textAlign:"center",maxWidth:700,margin:"0 auto"},children:[(0,t.jsxs)("div",{className:"anim d1",style:{display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",border:"1px solid rgba(200,134,10,0.3)",borderRadius:"999px",fontSize:12,fontWeight:700,color:"#C8860A",marginBottom:32,letterSpacing:".04em"},children:[(0,t.jsx)("span",{style:{animation:"pulse 2s ease-in-out infinite",display:"inline-block"},children:"🇨🇭"}),"Lausanne · Beta juin 2026"]}),(0,t.jsxs)("h1",{className:"anim d2 hero-title",style:{fontSize:52,fontWeight:900,letterSpacing:"-.05em",lineHeight:1.05,marginBottom:24},children:["Finis de swiper",(0,t.jsx)("br",{}),(0,t.jsx)("span",{style:{color:"#C8860A"},children:"dans le vide."})]}),(0,t.jsxs)("p",{className:"anim d3",style:{fontSize:18,color:"rgba(245,232,222,0.6)",lineHeight:1.65,marginBottom:40,maxWidth:480},children:["Clutch = un match → un RDV réel → ",(0,t.jsx)("strong",{style:{color:"#f5e8de",fontWeight:700},children:"dans les 18h"}),".",(0,t.jsx)("br",{}),"Ou ça expire."]}),(0,t.jsxs)("div",{className:"anim d4",style:{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center",marginBottom:20},children:[(0,t.jsx)("a",{href:"/app2",className:"btn-red",style:{fontSize:17,padding:"17px 32px"},children:"Tester l'app →"}),(0,t.jsx)("a",{href:"/app2?preview=onboarding",className:"btn-outline",style:{fontSize:17,padding:"17px 32px",textDecoration:"none",display:"inline-flex",alignItems:"center"},children:"Voir le flow d'inscription"})]}),(0,t.jsx)("div",{className:"anim d5",style:{fontSize:12,color:"rgba(245,232,222,0.3)",letterSpacing:".03em"},children:"Gratuit pour les femmes · Toujours"})]}),(0,t.jsx)("div",{className:"ticker-wrap",children:(0,t.jsx)("div",{className:"ticker-inner",children:[void 0,void 0].map((e,i)=>(0,t.jsx)("span",{children:["MATCH RÉEL","PAS DE GHOSTING","RDV EN 18H","LAUSANNE FIRST","ZÉRO BULLSHIT","100% GRATUIT ♀","SCORE FIABILITÉ","BOUTON SOS","PROFILS VÉRIFIÉS","MATCH RÉEL"].map(e=>(0,t.jsxs)("span",{className:"ticker-item",children:[e,(0,t.jsx)("span",{children:"✦"})]},e))},i))})}),(0,t.jsx)("section",{style:{padding:"80px 24px",maxWidth:900,margin:"0 auto"},children:(0,t.jsx)("div",{className:"stats-grid",style:{display:"grid",gridTemplateColumns:"1fr",gap:16},children:[{n:"0",label:"apps de rencontres qui forcent un vrai RDV"},{n:"18h",label:"max entre le match et le rendez-vous"},{n:"CHF 0",label:"pour les femmes — toujours"}].map(e=>(0,t.jsxs)("div",{className:"stat-card",children:[(0,t.jsx)("div",{style:{fontSize:56,fontWeight:900,letterSpacing:"-.04em",color:"#C8860A",lineHeight:1,marginBottom:10},children:e.n}),(0,t.jsx)("div",{style:{fontSize:14,color:"rgba(245,232,222,0.5)",lineHeight:1.5},children:e.label})]},e.n))})}),(0,t.jsxs)("section",{style:{padding:"0 24px 80px",maxWidth:640,margin:"0 auto"},children:[(0,t.jsx)("div",{style:{fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"rgba(245,232,222,0.3)",marginBottom:40,textAlign:"center"},children:"Comment ça marche"}),(0,t.jsx)("div",{style:{display:"flex",flexDirection:"column",gap:32},children:[{n:"01",title:"Tu matches avec quelqu'un de disponible MAINTENANT",desc:"Tu indiques que tu es dispo ce soir à Lausanne. Seules les personnes disponibles maintenant apparaissent — pas de profils dormants."},{n:"02",title:"Tu proposes : lieu + heure + message (dans les 2h)",desc:'Tu choisis un endroit réel. Tu envoies une proposition concrète. Pas de "on verra". Dans les 2h, c\'est confirmé ou expiré.'},{n:"03",title:"Tu y vas — score de fiabilité si tu ne viens pas",desc:"Le Verrou se referme. RDV réel dans les 18h. Si tu ghostes, ton score de fiabilité chute. Le respect, c'est un feature."}].map((e,i)=>(0,t.jsxs)("div",{style:{display:"flex",gap:20,alignItems:"flex-start"},children:[(0,t.jsxs)("div",{style:{position:"relative"},children:[(0,t.jsx)("div",{className:"step-dot",children:e.n}),i<2&&(0,t.jsx)("div",{style:{position:"absolute",top:"100%",left:"50%",transform:"translateX(-50%)",width:1,height:32,background:"linear-gradient(to bottom, rgba(200,134,10,0.4), transparent)",marginTop:0}})]}),(0,t.jsxs)("div",{style:{paddingTop:8},children:[(0,t.jsx)("div",{style:{fontSize:15,fontWeight:800,marginBottom:6,letterSpacing:"-.02em",lineHeight:1.3},children:e.title}),(0,t.jsx)("div",{style:{fontSize:13,color:"rgba(245,232,222,0.5)",lineHeight:1.65},children:e.desc})]})]},e.n))})]}),(0,t.jsxs)("section",{style:{padding:"0 24px 80px",maxWidth:900,margin:"0 auto"},children:[(0,t.jsx)("div",{style:{fontSize:11,fontWeight:700,letterSpacing:".14em",textTransform:"uppercase",color:"rgba(245,232,222,0.3)",marginBottom:32,textAlign:"center"},children:"Ce qui rend Clutch différent"}),(0,t.jsx)("div",{className:"feat-grid",style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[{icon:"🔒",title:"Profils certifiés",desc:"Score de fiabilité public. Ghosting = pénalité réelle."},{icon:"⚡",title:"Disponible maintenant",desc:"Seules les personnes dispo ce soir apparaissent."},{icon:"🎯",title:"Score de compatibilité",desc:"Pas de scroll infini. Des suggestions pertinentes."},{icon:"🚨",title:"Bouton SOS",desc:"Un contact reçoit ta position en un tap."},{icon:"📅",title:"Événements Lausanne",desc:"Concerts, bars, expos — RDV avec contexte."},{icon:"♀",title:"Gratuit pour les femmes",desc:"Toujours. Par choix éthique, pas marketing."}].map(e=>(0,t.jsxs)("div",{className:"feat-card",children:[(0,t.jsx)("div",{style:{fontSize:22,marginBottom:10},children:e.icon}),(0,t.jsx)("div",{style:{fontSize:13,fontWeight:800,marginBottom:4,letterSpacing:"-.02em"},children:e.title}),(0,t.jsx)("div",{style:{fontSize:12,color:"rgba(245,232,222,0.45)",lineHeight:1.55},children:e.desc})]},e.title))})]}),(0,t.jsx)("section",{ref:f,style:{padding:"80px 24px",background:"rgba(20,8,16,0.7)",borderTop:"1px solid rgba(255,191,158,0.08)",borderBottom:"1px solid rgba(255,191,158,0.08)"},children:(0,t.jsxs)("div",{style:{maxWidth:480,margin:"0 auto",textAlign:"center"},children:[(0,t.jsxs)("div",{style:{fontSize:32,fontWeight:900,letterSpacing:"-.04em",marginBottom:10,lineHeight:1.1},children:["Sois parmi les premiers",(0,t.jsx)("br",{}),"à ",(0,t.jsx)("span",{style:{color:"#C8860A"},children:"Lausanne"})]}),(0,t.jsxs)("p",{style:{fontSize:14,color:"rgba(245,232,222,0.5)",marginBottom:32,lineHeight:1.6},children:["On ouvre la beta bientôt. Laisse ton email,",(0,t.jsx)("br",{}),"on te contacte dès que c'est live.",null!=p&&(0,t.jsxs)("span",{style:{display:"block",marginTop:8,color:"rgba(245,232,222,0.3)",fontSize:12},children:[(0,t.jsx)("span",{style:{animation:"blink 2s ease-in-out infinite",display:"inline-block",width:6,height:6,borderRadius:"50%",background:"#22c55e",marginRight:6,verticalAlign:"middle"}}),p," personne",1!==p?"s":""," déjà inscrite",1!==p?"s":""]})]}),a?(0,t.jsxs)("div",{style:{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:16,padding:"28px 24px"},children:[(0,t.jsx)("div",{style:{fontSize:32,marginBottom:10},children:"✓"}),(0,t.jsx)("div",{style:{fontSize:18,fontWeight:800,color:"#22c55e",marginBottom:6},children:"Tu es sur la liste !"}),(0,t.jsx)("div",{style:{fontSize:13,color:"rgba(245,232,222,0.5)"},children:"On te contacte dès que c'est live. En attendant —"}),(0,t.jsx)("a",{href:"/app2",className:"btn-red",style:{display:"inline-flex",marginTop:16,fontSize:14},children:"Tester la démo →"})]}):(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{style:{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"},children:[(0,t.jsx)("input",{type:"email",value:e,onChange:e=>{r(e.target.value),c("")},onKeyDown:e=>"Enter"===e.key&&h(),placeholder:"ton@email.com",className:`waitlist-input${d?" error":""}`,style:{flex:1,minWidth:220}}),(0,t.jsx)("button",{className:"btn-red",onClick:h,disabled:o,style:{opacity:o?.6:1,cursor:o?"default":"pointer",width:"auto",padding:"15px 24px"},children:o?"…":"Je veux accès"})]}),d&&(0,t.jsx)("div",{style:{fontSize:12,color:"#FFBF9E",textAlign:"left"},children:d})]})]})}),(0,t.jsxs)("footer",{style:{padding:"28px 24px",borderTop:"1px solid rgba(255,191,158,0.06)",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12},children:[(0,t.jsxs)("div",{style:{fontSize:13,fontWeight:900,letterSpacing:"-.04em",color:"rgba(245,232,222,0.4)"},children:["CLUTCH",(0,t.jsx)("span",{style:{color:"#C8860A"},children:"."})]}),(0,t.jsx)("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:[{href:"/app2",label:"App"},{href:"/privacy",label:"Confidentialité"},{href:"/terms",label:"CGU"},{href:"mailto:david.saugy@gmail.com",label:"Contact"},{href:"/hq",label:"QG 🔒"}].map(e=>(0,t.jsx)("a",{href:e.href,style:{fontSize:12,color:"rgba(245,232,222,0.3)",textDecoration:"none"},onMouseOver:e=>e.currentTarget.style.color="rgba(245,232,222,0.7)",onMouseOut:e=>e.currentTarget.style.color="rgba(245,232,222,0.3)",children:e.label},e.href))}),(0,t.jsxs)("div",{style:{fontSize:11,color:"rgba(245,232,222,0.2)"},children:["Construit à Lausanne 🇨🇭 · 2026 · ","v11.06-V"]})]})]})}])}]);