'use client'
// ─────────────────────────────────────────────────────────────────────────────
// 🌌 LA FORTERESSE — page vision (le Cône de causalité).
// Explique les 2 Graals (Exclusion + Causalité) + animation 3D interactive du cône.
// « Simple devant, machine de guerre derrière. » Réf : relativité (cône de lumière) / Janus.
// Les formules suivent lib/cone.ts (travel ≈ km×2.7 min, buffer 15 min).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from 'react'

// Palette (cohérente Mel + panneau espace-temps sombre)
const COL = {
  ink: '#2a1020', prune: '#532943', pruneSoft: '#6E3A5C',
  green: '#77BC1F', pink: '#EB6BAF', salmon: '#FFBF9E',
  paper: '#FFFFFF', cloud: '#FBF7F9', line: '#EFE4EC',
  space: '#160a14', spaceEdge: '#0c050b',
}

const KM_TO_MIN = 2.7        // 1 km ≈ 2.7 min de trajet (vol d'oiseau ×1.35 ÷ 30 km/h)
const BUFFER_MIN = 15        // marge sécurité
const RAYON_MAX = 50

function ConeCanvas({ rayon, temps }: { rayon: number; temps: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null)
  const rk = useRef(rayon), tk = useRef(temps)
  rk.current = rayon; tk.current = temps

  useEffect(() => {
    const cv = ref.current; if (!cv) return
    const ctx = cv.getContext('2d'); if (!ctx) return
    let raf = 0, rot = 0, t0 = 0, alive = true
    // nuage de points stable (semis déterministe dans un disque de 50 km)
    const N = 140
    const pts = Array.from({ length: N }, (_, i) => {
      const a = (i * 2.399963) % (Math.PI * 2)        // angle d'or → réparti
      const d = Math.sqrt(((i + 0.5) / N)) * RAYON_MAX // densité ~uniforme dans le disque
      const ph = (i % 7) / 7
      return { a, d, ph }
    })

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const w = cv.clientWidth, h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const onR = () => resize(); window.addEventListener('resize', onR)

    const draw = (ts: number) => {
      if (!alive) return
      if (!t0) t0 = ts
      const time = (ts - t0) / 1000
      rot += 0.0042
      const w = cv.clientWidth, h = cv.clientHeight
      const cx = w / 2, cy = h * 0.66
      const scale = (w * 0.40) / RAYON_MAX
      const tilt = 0.46
      const reachR = Math.max(0, (tk.current - BUFFER_MIN)) / KM_TO_MIN  // rayon crédible (km)
      const coneH = 132                                                  // hauteur visuelle du cône (px)

      // projeté sol (km) → écran, avec rotation
      const proj = (xk: number, yk: number, lift = 0) => {
        const rx = xk * Math.cos(rot) - yk * Math.sin(rot)
        const ry = xk * Math.sin(rot) + yk * Math.cos(rot)
        return { x: cx + rx * scale, y: cy + ry * scale * tilt - lift, depth: ry }
      }
      const ringPath = (rkm: number, lift: number) => {
        ctx.beginPath()
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2
          const p = proj(Math.cos(a) * rkm, Math.sin(a) * rkm, lift)
          i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)
        }
        ctx.closePath()
      }

      // fond espace-temps
      const g = ctx.createRadialGradient(cx, cy - 20, 20, cx, cy, w * 0.85)
      g.addColorStop(0, COL.space); g.addColorStop(1, COL.spaceEdge)
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h)
      // étoiles discrètes
      ctx.globalAlpha = 1
      for (let i = 0; i < 46; i++) {
        const sx = (i * 97.13 % w), sy = (i * 53.7 % (h * 0.5))
        const tw = 0.25 + 0.25 * Math.sin(time * 1.5 + i)
        ctx.fillStyle = `rgba(255,225,245,${0.10 + tw * 0.18})`
        ctx.fillRect(sx, sy, 1.4, 1.4)
      }

      // TENSION 0→10 (rayon vs cône) — pilote toutes les couleurs et le rythme
      const travelEdge = rk.current * KM_TO_MIN
      const slack = tk.current - travelEdge - BUFFER_MIN
      const tension = slack < 0 ? 10 : Math.max(0, Math.min(10, 10 * (1 - slack / 60)))
      const tc = tension >= 7 ? [83, 41, 67] : tension >= 4 ? [235, 107, 175] : [119, 188, 31]
      const tHex = `rgb(${tc[0]},${tc[1]},${tc[2]})`
      const hot = tension / 10
      const pulse = 0.5 + 0.5 * Math.sin(time * (2 + hot * 4))   // pulse plus rapide quand ça chauffe
      const rr = Math.min(reachR, RAYON_MAX)

      // disque de dispo (le rayon choisi) — la zone HORS CÔNE s'allume en tension (pulse)
      ringPath(rk.current, 0)
      ctx.fillStyle = `rgba(${tc[0]},${tc[1]},${tc[2]},${0.10 + (rk.current > rr ? hot * 0.16 * (0.55 + 0.45 * pulse) : 0)})`; ctx.fill()
      ringPath(rk.current, 0)
      ctx.strokeStyle = tHex; ctx.lineWidth = 2 + hot * 1.5; ctx.stroke()

      // disque crédible (atteignable) — toujours vert, par-dessus → l'anneau restant = hors cône
      if (rr > 0.3) {
        ringPath(rr, 0)
        ctx.fillStyle = `rgba(119,188,31,${0.16 + pulse * 0.05})`; ctx.fill()
        ringPath(rr, 0)
        ctx.strokeStyle = COL.green; ctx.lineWidth = 1.5; ctx.stroke()
      }

      // LE CÔNE — apex (toi) → anneau crédible levé à coneH
      const apex = proj(0, 0, 0)
      const lifted = Math.min(rr, RAYON_MAX)
      // surface latérale (quelques génératrices) — teintée par la tension
      ctx.strokeStyle = `rgba(${tc[0]},${tc[1]},${tc[2]},.30)`; ctx.lineWidth = 1
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2
        const p = proj(Math.cos(a) * lifted, Math.sin(a) * lifted, coneH)
        ctx.beginPath(); ctx.moveTo(apex.x, apex.y); ctx.lineTo(p.x, p.y); ctx.stroke()
      }
      // anneau haut du cône
      ringPath(lifted, coneH)
      ctx.strokeStyle = tHex; ctx.lineWidth = 2 + hot * 1.5; ctx.stroke()
      ringPath(lifted, coneH)
      ctx.fillStyle = `rgba(${tc[0]},${tc[1]},${tc[2]},${0.10 + pulse * 0.05})`; ctx.fill()

      // nuage de points (RDV possibles) — vert si dans le cône, bordeaux sinon
      const all = pts.map(pt => {
        const xk = Math.cos(pt.a) * pt.d, yk = Math.sin(pt.a) * pt.d
        const p = proj(xk, yk, 0)
        const inRayon = pt.d <= rk.current + 0.001
        const reach = pt.d <= reachR
        return { ...p, pt, inRayon, reach }
      }).sort((a, b) => a.depth - b.depth)
      for (const o of all) {
        if (!o.inRayon) continue
        const tw = 0.6 + 0.4 * Math.sin(time * 2.4 + o.pt.ph * 6.28)
        if (o.reach) {
          ctx.beginPath(); ctx.arc(o.x, o.y, 5.5, 0, 6.28)
          ctx.fillStyle = `rgba(119,188,31,${0.16 * tw})`; ctx.fill()
          ctx.beginPath(); ctx.arc(o.x, o.y, 2.4, 0, 6.28)
          ctx.fillStyle = COL.green; ctx.fill()
        } else {
          ctx.beginPath(); ctx.arc(o.x, o.y, 2, 0, 6.28)
          ctx.fillStyle = 'rgba(180,120,150,.55)'; ctx.fill()
        }
      }

      // apex « toi » — point qui pulse
      ctx.beginPath(); ctx.arc(apex.x, apex.y, 9 + pulse * 3, 0, 6.28)
      ctx.fillStyle = 'rgba(255,191,158,.18)'; ctx.fill()
      ctx.beginPath(); ctx.arc(apex.x, apex.y, 4.5, 0, 6.28)
      ctx.fillStyle = COL.salmon; ctx.fill()

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onR) }
  }, [])

  return <canvas ref={ref} style={{ width: '100%', height: 340, display: 'block', borderRadius: 18 }} />
}

export default function ForteressePage() {
  const [rayon, setRayon] = useState(18)
  const [tempsRaw, setTempsRaw] = useState(38)                       // slider 0-100 (log)
  const temps = Math.round(20 * Math.pow(1080 / 20, tempsRaw / 100)) // minutes, échelle LOG : 20 min … 18 h (horizon Clutch)
  const reachR = Math.max(0, (temps - BUFFER_MIN)) / KM_TO_MIN
  const edgeMin = Math.round(rayon * KM_TO_MIN)
  const slack = Math.round(temps - edgeMin - BUFFER_MIN)
  const tension = slack < 0 ? 10 : Math.max(0, Math.min(10, Math.round(10 * (1 - slack / 60) * 10) / 10))
  const tcol = tension >= 7 ? COL.prune : tension >= 4 ? COL.pink : COL.green
  const tlevel = tension >= 7 ? 'hot' : tension >= 4 ? 'warn' : 'ok'
  const fmtH = (m: number) => m < 60 ? `${m} min` : `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}`

  const Section = ({ tag, color, title, children }: any) => (
    <div style={{ background: COL.paper, border: `1px solid ${COL.line}`, borderRadius: 18, padding: '20px 22px', marginBottom: 16 }}>
      <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', color, background: color + '18', padding: '4px 10px', borderRadius: 999, marginBottom: 10 }}>{tag}</div>
      <h2 style={{ margin: '0 0 8px', fontSize: 19, color: COL.ink, fontWeight: 800 }}>{title}</h2>
      <div style={{ fontSize: 14.5, lineHeight: 1.6, color: COL.prune }}>{children}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: COL.cloud, color: COL.ink, fontFamily: '-apple-system,BlinkMacSystemFont,"SF Pro",Segoe UI,Roboto,sans-serif', WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 18px 64px' }}>

        {/* En-tête */}
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.16em', color: COL.pink, marginBottom: 8 }}>CLUTCH · LE CŒUR DU SYSTÈME</div>
          <h1 style={{ margin: '0 0 6px', fontSize: 38, fontWeight: 900, letterSpacing: '-.02em', color: COL.ink }}>La Forteresse</h1>
          <p style={{ margin: '0 auto', maxWidth: 460, fontSize: 15.5, lineHeight: 1.55, color: COL.pruneSoft }}>
            Le garant invisible que chaque rencontre est <strong>physiquement possible</strong>. Un modèle d’espace-temps : tu ne peux pas être à deux endroits à la fois, ni promettre d’être là où tu ne peux pas arriver à temps.
          </p>
        </div>

        {/* Animation du cône */}
        <div style={{ background: COL.space, borderRadius: 22, padding: 8, marginBottom: 14, boxShadow: '0 18px 50px -20px rgba(83,41,67,.5)' }}>
          <ConeCanvas rayon={rayon} temps={temps} />
          <style>{`@keyframes ftpulse{0%,100%{opacity:1}50%{opacity:.5}}@keyframes ftbar{0%,100%{filter:brightness(1)}50%{filter:brightness(1.35)}}`}</style>
          {/* Curseurs */}
          <div style={{ padding: '6px 14px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: COL.salmon, marginBottom: 4 }}>
              <span>Rayon de dispo</span><span style={{ fontWeight: 800, color: '#fff' }}>{rayon < 10 ? rayon.toFixed(0) : Math.round(rayon)} km</span>
            </div>
            <input type="range" min={1} max={RAYON_MAX} value={rayon} onChange={e => setRayon(+e.target.value)}
              style={{ width: '100%', accentColor: COL.pink }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5, color: COL.salmon, margin: '10px 0 4px' }}>
              <span>Temps avant le RDV <span style={{ opacity: .6 }}>(jusqu’à 18 h)</span></span><span style={{ fontWeight: 800, color: '#fff' }}>{fmtH(temps)}</span>
            </div>
            <input type="range" min={0} max={100} value={tempsRaw} onChange={e => setTempsRaw(+e.target.value)}
              style={{ width: '100%', accentColor: COL.green }} />

            {/* JAUGE DE TENSION 0→10 — le cœur visible de la Forteresse */}
            <div style={{ marginTop: 16, marginBottom: 4, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: '#fff', letterSpacing: '.02em' }}>🌀 Tension de la Forteresse</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: tcol }}>{tension.toFixed(1).replace('.0', '')}<span style={{ fontSize: 12, color: COL.salmon, fontWeight: 700 }}> /10</span></span>
            </div>
            <div style={{ position: 'relative', height: 12, borderRadius: 6, background: 'rgba(255,255,255,.10)', overflow: 'hidden' }}>
              {/* graduations zones */}
              {[40, 70].map(p => <div key={p} style={{ position: 'absolute', left: `${p}%`, top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,.18)' }} />)}
              <div style={{ height: '100%', width: `${tension * 10}%`, borderRadius: 6, background: tcol, transition: 'width .18s, background .18s', animation: tlevel === 'hot' ? 'ftbar 0.7s infinite' : undefined }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: COL.salmon, marginTop: 3, opacity: .8 }}>
              <span>0 · large</span><span>4-6 · serré</span><span>7-9 · tendu</span><span>10 · hors cône</span>
            </div>

            {/* DÉCOMPOSITION pédagogique — d'où sort la tension */}
            <div style={{ marginTop: 12, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,.06)', fontSize: 11.5, color: COL.salmon, lineHeight: 1.7 }}>
              <span style={{ color: '#fff', fontWeight: 700 }}>{fmtH(temps)}</span> de temps
              <span style={{ opacity: .6 }}> − </span><span style={{ color: '#fff', fontWeight: 700 }}>{edgeMin} min</span> de trajet au bord
              <span style={{ opacity: .6 }}> − </span><span style={{ color: '#fff', fontWeight: 700 }}>15 min</span> de marge
              <span style={{ opacity: .6 }}> = </span><span style={{ color: tcol, fontWeight: 900 }}>{slack >= 0 ? '+' : ''}{slack} min</span> de jeu
              <span style={{ opacity: .6 }}> → plus c’est serré, plus la tension monte.</span>
            </div>

            {/* Verdict live — dynamique */}
            <div style={{ marginTop: 10, padding: '11px 14px', borderRadius: 12, background: tcol + '24', border: `1.5px solid ${tcol}`, color: '#fff', fontSize: 13, lineHeight: 1.5, animation: tlevel === 'hot' ? 'ftpulse 1.1s infinite' : undefined }}>
              {tlevel === 'ok'
                ? <>✅ <strong>Crédible (tension {tension.toFixed(0)}).</strong> Tu peux honorer un RDV partout dans ton rayon — le bord est à ~{edgeMin} min, bien dans ton cône.</>
                : tlevel === 'warn'
                  ? <>◑ <strong>Ça se tend (tension {tension.toFixed(0)}).</strong> Un Clutch au bord (~{edgeMin} min) serait juste. Encore jouable, mais prends une marge.</>
                  : <>⚠️ <strong>Au bord du cône (tension {tension.toFixed(0)}).</strong> Le bord de ton rayon (~{edgeMin} min) dépasse ce que tu atteins en {fmtH(temps)}. Donne-toi plus de temps, ou resserre le rayon.</>}
            </div>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12.5, color: COL.pruneSoft, margin: '0 0 26px' }}>
          Le point clair = toi. Le cône = ce que tu peux atteindre à temps. Les points verts sont joignables, les pâles non. Bouge les curseurs.
        </p>

        {/* Graal 1 */}
        <Section tag="GRAAL 1" color={COL.green} title="Exclusion — un seul endroit à la fois">
          Tu ne peux pas avoir deux rendez-vous qui se chevauchent. Quand un Clutch est verrouillé, ce créneau t’appartient — personne ne peut t’en réserver un autre par-dessus. <br /><br />
          <em style={{ color: COL.pruneSoft }}>Exemple : RDV confirmé 19h-20h aux Bains → tu n’apparais plus disponible pour 19h30 ailleurs. Impossible, point.</em>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: COL.green }}>✓ Déjà en place</div>
        </Section>

        {/* Graal 2 */}
        <Section tag="GRAAL 2" color={COL.pink} title="Causalité — promettre seulement ce qui est atteignable">
          Quand tu te déclares disponible quelque part, ça doit être <strong>crédible</strong> : tu dois pouvoir vraiment y être à l’heure, depuis là où tu es. Plus ton rayon est grand, plus le bord est loin — donc plus il te faut de temps pour l’atteindre. C’est le <strong>cône de causalité</strong>.<br /><br />
          <em style={{ color: COL.pruneSoft }}>Exemple : tu te mets dispo à 11h30 avec un rayon de 10 km. Quelqu’un te clutche tout au bord, à 11h30. Il faut ~27 min pour y aller → impossible. La Forteresse le sait, et t’aide doucement à rester dans ton cône.</em>
          <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: COL.pink }}>◐ En construction (couplage rayon↔heure actif · GPS dynamique en Phase 2)</div>
        </Section>

        {/* La punchline */}
        <div style={{ background: COL.space, borderRadius: 18, padding: '22px 24px', color: '#fff', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-.01em', marginBottom: 8 }}>Simple devant. Machine de guerre derrière.</div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: COL.salmon }}>
            La personne ne voit qu’un curseur qui glisse et un message bienveillant. Dessous : un moteur d’espace-temps qui calcule, en continu et sans jamais révéler ta position, si une rencontre tient debout. La confiance vient de là — chaque Clutch est réel.
          </p>
        </div>

      </div>
    </div>
  )
}
