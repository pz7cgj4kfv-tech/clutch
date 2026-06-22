(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,3654,(t,s,e)=>{s.exports=t.r(81881)},30656,t=>{"use strict";var s=t.i(63846),e=t.i(93524),i=t.i(3654);t.s(["default",0,function(){let t=(0,i.useRouter)(),[a,l]=(0,e.useState)(0);return(0,e.useEffect)(()=>{let s=[setTimeout(()=>l(1),200),setTimeout(()=>l(2),750),setTimeout(()=>l(3),1400),setTimeout(()=>l(6),3400),setTimeout(()=>t.push("/"),4e3)];return()=>s.forEach(clearTimeout)},[t]),(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)("style",{children:`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #542A44; }

        .splash {
          position: fixed; inset: 0;
          background: #542A44;
          display: flex; align-items: center; justify-content: center;
          opacity: ${+(6!==a)};
          transition: opacity 0.6s ease;
        }


        /* ── SVG logo ── */
        .logo-svg {
          position: relative; z-index: 2;
          width: min(245px, 82vw);
          height: auto;
        }

        .hourglass-body {
          opacity: ${+(a>=1)};
          transform-origin: 143px 220px;
          transform: scale(${a>=1?1:.5});
          transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
        }
        .sand-top {
          opacity: ${+(a>=2)};
          transform: translateY(${a>=2?0:-10}px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.2,0.64,1);
        }
        .sand-bottom {
          opacity: ${+(a>=2)};
          transform: translateY(${a>=2?0:10}px);
          transition: opacity 0.7s ease 0.1s, transform 0.7s cubic-bezier(0.34,1.2,0.64,1) 0.1s;
        }
        .text-clu {
          opacity: ${+(a>=3)};
          transform: translateX(${a>=3?0:-14}px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .text-tch {
          opacity: ${+(a>=3)};
          transform: translateX(${a>=3?0:14}px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }

        .tagline {
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,191,158,0.6);
          opacity: ${+(a>=3)};
          transition: opacity 0.8s ease 0.1s;
          white-space: nowrap;
          margin-top: 8px;
          text-align: center;
        }
      `}),(0,s.jsxs)("div",{className:"splash",style:{flexDirection:"column"},children:[(0,s.jsxs)("svg",{className:"logo-svg",viewBox:"30 140 230 210",xmlns:"http://www.w3.org/2000/svg",children:[(0,s.jsx)("g",{className:"hourglass-body",children:(0,s.jsx)("path",{fill:"#FFBF9E",d:"M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29 l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691 c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696 l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938 l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089 l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"})}),(0,s.jsx)("g",{className:"sand-top",children:(0,s.jsx)("polygon",{fill:"#E27C00",points:"153.217,202.325 183.263,201.578 188.846,195.994 182.948,190.122 153.521,190.121"})}),(0,s.jsx)("g",{className:"sand-bottom",children:(0,s.jsx)("polygon",{fill:"#E27C00",points:"127.452,257.386 133.035,251.803 133.422,236.09 106.192,236.09"})}),(0,s.jsxs)("g",{className:"text-clu",children:[(0,s.jsx)("path",{fill:"#FFBF9E",d:"M58.82,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877 c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855 c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C63.997,332.266,58.82,326.489,58.82,317.094z"}),(0,s.jsx)("path",{fill:"#FFBF9E",d:"M109.315,331.526h-18.87v-28.845h6.037v23.588h12.833V331.526z"}),(0,s.jsx)("path",{fill:"#FFBF9E",d:"M120.391,320.952c0,3.638,2.179,5.956,6.037,5.956c3.877,0,6.057-2.318,6.057-5.956v-18.271h6.036 v18.891c0,6.396-4.697,10.693-12.093,10.693c-7.376,0-12.074-4.297-12.074-10.693v-18.891h6.037V320.952z"})]}),(0,s.jsxs)("g",{className:"text-tch",children:[(0,s.jsx)("path",{fill:"#E27C00",d:"M152.555,331.526V307.84h-8.655v-5.158h23.348v5.158h-8.655v23.687H152.555z"}),(0,s.jsx)("path",{fill:"#E27C00",d:"M170.207,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877 c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855 c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C175.384,332.266,170.207,326.489,170.207,317.094z"}),(0,s.jsx)("path",{fill:"#E27C00",d:"M220.861,331.526v-12.054h-12.992v12.054h-6.037v-28.845h6.037v11.635h12.992v-11.635h6.037v28.845H220.861z"})]})]}),(0,s.jsx)("div",{className:"tagline",children:"Quelqu'un t'attend"})]})]})}])}]);