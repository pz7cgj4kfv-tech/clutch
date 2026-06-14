'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SplashScreen() {
  const router = useRouter()
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),   // sablier
      setTimeout(() => setPhase(2), 750),   // sable orange
      setTimeout(() => setPhase(3), 1400),  // CLUTCH + tagline
      setTimeout(() => setPhase(6), 3400),  // fade out
      setTimeout(() => router.push('/'), 4000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [router])

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; height: 100%; overflow: hidden; background: #542A44; }

        .splash {
          position: fixed; inset: 0;
          background: #542A44;
          display: flex; align-items: center; justify-content: center;
          opacity: ${phase === 6 ? 0 : 1};
          transition: opacity 0.6s ease;
        }


        /* ── SVG logo ── */
        .logo-svg {
          position: relative; z-index: 2;
          width: min(245px, 82vw);
          height: auto;
        }

        .hourglass-body {
          opacity: ${phase >= 1 ? 1 : 0};
          transform-origin: 143px 220px;
          transform: scale(${phase >= 1 ? 1 : 0.5});
          transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
        }
        .sand-top {
          opacity: ${phase >= 2 ? 1 : 0};
          transform: translateY(${phase >= 2 ? 0 : -10}px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.2,0.64,1);
        }
        .sand-bottom {
          opacity: ${phase >= 2 ? 1 : 0};
          transform: translateY(${phase >= 2 ? 0 : 10}px);
          transition: opacity 0.7s ease 0.1s, transform 0.7s cubic-bezier(0.34,1.2,0.64,1) 0.1s;
        }
        .text-clu {
          opacity: ${phase >= 3 ? 1 : 0};
          transform: translateX(${phase >= 3 ? 0 : -14}px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }
        .text-tch {
          opacity: ${phase >= 3 ? 1 : 0};
          transform: translateX(${phase >= 3 ? 0 : 14}px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.22,1,0.36,1);
        }

        .tagline {
          font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(255,191,158,0.6);
          opacity: ${phase >= 3 ? 1 : 0};
          transition: opacity 0.8s ease 0.1s;
          white-space: nowrap;
          margin-top: 8px;
          text-align: center;
        }
      `}</style>

      <div className="splash" style={{ flexDirection:'column' }}>
        {/* Logo SVG inline */}
        <svg className="logo-svg" viewBox="30 140 230 210" xmlns="http://www.w3.org/2000/svg">
          <g className="hourglass-body">
            <path fill="#FFBF9E" d="M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29
              l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691
              c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696
              l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938
              l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089
              l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"/>
          </g>
          <g className="sand-top">
            <polygon fill="#E27C00" points="153.217,202.325 183.263,201.578 188.846,195.994 182.948,190.122 153.521,190.121"/>
          </g>
          <g className="sand-bottom">
            <polygon fill="#E27C00" points="127.452,257.386 133.035,251.803 133.422,236.09 106.192,236.09"/>
          </g>
          <g className="text-clu">
            <path fill="#FFBF9E" d="M58.82,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877
              c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855
              c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C63.997,332.266,58.82,326.489,58.82,317.094z"/>
            <path fill="#FFBF9E" d="M109.315,331.526h-18.87v-28.845h6.037v23.588h12.833V331.526z"/>
            <path fill="#FFBF9E" d="M120.391,320.952c0,3.638,2.179,5.956,6.037,5.956c3.877,0,6.057-2.318,6.057-5.956v-18.271h6.036
              v18.891c0,6.396-4.697,10.693-12.093,10.693c-7.376,0-12.074-4.297-12.074-10.693v-18.891h6.037V320.952z"/>
          </g>
          <g className="text-tch">
            <path fill="#E27C00" d="M152.555,331.526V307.84h-8.655v-5.158h23.348v5.158h-8.655v23.687H152.555z"/>
            <path fill="#E27C00" d="M170.207,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877
              c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855
              c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C175.384,332.266,170.207,326.489,170.207,317.094z"/>
            <path fill="#E27C00" d="M220.861,331.526v-12.054h-12.992v12.054h-6.037v-28.845h6.037v11.635h12.992v-11.635h6.037v28.845H220.861z"/>
          </g>
        </svg>

        <div className="tagline">Quelqu'un t'attend</div>
      </div>
    </>
  )
}
