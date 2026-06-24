'use client'
// ─────────────────────────────────────────────────────────────────────────────
// CLUTCH SIMULATOR — cockpit opérateur (admin/test). Page ISOLÉE, 100% client,
// AUCUNE écriture en base. Tout est factice (flag SIMU). Effaçable d'un bouton.
// But : rendre le surhumain compréhensible. Réf : project-simulator-cockpit-spec
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react'
import {
  generatePopulation, scoreProfile, isClutchable, thermostat, effectiveWeights,
  DEFAULT_WEIGHTS, DEFAULT_CAP, type SimPerson, type Weights,
} from '@/lib/clutch-algo'

const C = {
  bg: '#0B1020', panel: '#141B2E', panel2: '#1B2540', border: '#2A3550',
  text: '#E6ECF7', dim: '#8A97B5', accent: '#532943', good: '#77BC1F',
  warn: '#FBBF24', bad: '#F87171', pink: '#EB6BAF', track: '#243150',
}
const CENTER: [number, number] = [46.5197, 6.6323] // Lausanne

function Slider({ label, value, min, max, step = 1, onChange, suffix = '' }: any) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: C.dim, marginBottom: 3 }}>
        <span>{label}</span><span style={{ color: C.text, fontWeight: 700 }}>{value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: C.accent }} />
    </div>
  )
}

const MY_INTERESTS_DEFAULT = ['Jazz', 'Café', 'Randonnée', 'Cinéma']
const POOL = ['Café','Jazz','Randonnée','Yoga','Cinéma','Cuisine','Voyage','Art','Musique','Sport','Lecture','Photo','Danse','Tech','Nature','Vin','Théâtre','Running']

export default function SimPage() {
  // ── Contrôles population ──
  const [size, setSize] = useState(200)
  const [pctWomen, setPctWomen] = useState(50)
  const [ageMean, setAgeMean] = useState(30)
  const [ageSpread, setAgeSpread] = useState(7)
  const [diversity, setDiversity] = useState(4)
  const [cityRadius, setCityRadius] = useState(3)
  const [pctReliable, setPctReliable] = useState(70)
  const [pctPremium, setPctPremium] = useState(15)
  const [cap, setCap] = useState(DEFAULT_CAP)
  const [pctFull, setPctFull] = useState(20)
  // ── Boutons algo ──
  const [wCompat, setWCompat] = useState(50)
  const [wProx, setWProx] = useState(30)
  const [wFiab, setWFiab] = useState(20)
  const [thermoOn, setThermoOn] = useState(true)
  // ── Filtres (comme dans l'app réelle) ──
  const [fGender, setFGender] = useState<'all' | 'M' | 'F'>('all')
  const [fAgeMin, setFAgeMin] = useState(18)
  const [fAgeMax, setFAgeMax] = useState(60)
  // ── Moi ──
  const [myInterests, setMyInterests] = useState<string[]>(MY_INTERESTS_DEFAULT)
  // ── État ──
  const [pop, setPop] = useState<SimPerson[]>(() => generatePopulation({
    size: 200, pctWomen: 50, ageMean: 30, ageSpread: 7, interestDiversity: 4,
    cityRadiusKm: 3, pctReliable: 70, pctPremium: 15, capDefault: DEFAULT_CAP,
    pctFull: 20, centerLat: CENTER[0], centerLng: CENTER[1],
  }))
  const [sel, setSel] = useState<SimPerson | null>(null)
  const [showHelp, setShowHelp] = useState(true)

  function regen() {
    setPop(generatePopulation({
      size, pctWomen, ageMean, ageSpread, interestDiversity: diversity,
      cityRadiusKm: cityRadius, pctReliable, pctPremium, capDefault: cap,
      pctFull, centerLat: CENTER[0], centerLng: CENTER[1],
    }))
    setSel(null)
  }

  const baseW: Weights = useMemo(() => {
    const s = wCompat + wProx + wFiab || 1
    return { compat: wCompat / s, proximity: wProx / s, reliability: wFiab / s }
  }, [wCompat, wProx, wFiab])

  const thermo = useMemo(() => thermoOn ? thermostat(pop.length) : { level: 0, label: 'Désactivé manuellement' }, [pop.length, thermoOn])
  const effW = useMemo(() => effectiveWeights(baseW, thermo.level), [baseW, thermo.level])

  const me = useMemo(() => ({ interests: myInterests, lat: CENTER[0], lng: CENTER[1] }), [myInterests])

  // Filtres comme dans la vraie app : genre + tranche d'âge (appliqués AVANT le tri)
  const visible = useMemo(() => pop.filter(p =>
    (fGender === 'all' || p.gender === fGender) && p.age >= fAgeMin && p.age <= fAgeMax
  ), [pop, fGender, fAgeMin, fAgeMax])

  // Tri (le VRAI algo) — sur la population FILTRÉE, on n'affiche que le haut
  const ranked = useMemo(() => {
    const arr = visible.map(p => ({ p, s: scoreProfile(me, p, effW, Math.max(cityRadius * 2, 5)) }))
    arr.sort((a, b) => b.s.score - a.s.score)
    return arr
  }, [visible, me, effW, cityRadius])

  const clutchableCount = useMemo(() => visible.reduce((n, p) => n + (isClutchable(p) ? 1 : 0), 0), [visible])
  const fullCount = visible.length - clutchableCount

  const Stat = ({ label, value, color }: any) => (
    <div style={{ background: C.panel2, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: C.dim }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: color || C.text }}>{value}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: 'ui-sans-serif,system-ui,-apple-system,sans-serif', padding: '18px 16px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>🎛️ Clutch Simulator</span>
          <span style={{ fontSize: 10, fontWeight: 800, color: C.warn, border: `1px solid ${C.warn}55`, borderRadius: 6, padding: '2px 7px' }}>SIMU · données factices</span>
        </div>
        <div style={{ fontSize: 12.5, color: C.dim, marginBottom: 14 }}>Un bac à sable pour <b style={{ color: C.text }}>voir</b> ce que fait l'algorithme — de 5 à 50 000 personnes. Rien n'est réel, rien n'est sauvé en base.</div>

        {/* MODE D'EMPLOI */}
        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, marginBottom: 16 }}>
          <button onClick={() => setShowHelp(h => !h)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', color: C.text, fontSize: 13.5, fontWeight: 800, padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
            <span>📖 Mode d'emploi (lis-moi en premier)</span><span style={{ color: C.dim }}>{showHelp ? '▲' : '▼'}</span>
          </button>
          {showHelp && (
            <div style={{ padding: '0 16px 16px', fontSize: 12.5, color: C.dim, lineHeight: 1.75 }}>
              <p><b style={{ color: C.text }}>L'idée :</b> tu fabriques une fausse ville, et tu regardes comment Clutch trie les gens <b>pour toi</b>. Avec 50 000 personnes, on ne te montre pas 50 000 lignes — on te montre <b style={{ color: C.text }}>ton feed</b> (les mieux classés en haut) + <b style={{ color: C.text }}>la santé de la ville</b> (densité, places). C'est ça, rendre le surhumain lisible.</p>
              <p><b style={{ color: C.accent }}>① Fabrique la ville</b> (colonne gauche) : combien de gens, % de femmes, âges, à quel point ils partagent tes goûts, etc. → clique <b style={{ color: C.text }}>« Régénérer la ville »</b>.</p>
              <p><b style={{ color: C.accent }}>② Règle l'algo</b> : les 3 curseurs <b>Compatibilité / Proximité / Fiabilité</b> = l'importance de chaque critère. Change-les → le feed se <b>re-trie en direct</b>, sans régénérer.</p>
              <p><b style={{ color: C.accent }}>③ Le thermostat</b> : automatique. Peu de monde → éteint (tout le monde se voit pareil). Foule → il <b>remonte les meilleures rencontres</b> (la compatibilité pèse plus). Tu vois son niveau bouger quand tu changes la taille de la ville.</p>
              <p><b style={{ color: C.accent }}>④ Les places</b> : chacun accepte un nombre limité de clutchs. « <b style={{ color: C.good }}>Clutchable</b> » = encore de la place. « <b style={{ color: C.bad }}>Plein</b> » = visible mais on ne peut plus l'inviter (jusqu'à ce qu'une place se libère). C'est ce qui protège les gens populaires d'être noyés.</p>
              <p><b style={{ color: C.accent }}>⑤ Clique une personne</b> dans le feed → tu vois <b style={{ color: C.text }}>POURQUOI</b> elle est classée là (le calcul, en clair).</p>
              <p style={{ marginBottom: 0 }}><b style={{ color: C.text }}>🧹 Tout effacer :</b> bouton « Réinitialiser » en bas. Rien ne reste.</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* COLONNE GAUCHE — contrôles */}
          <div style={{ flex: '1 1 300px', minWidth: 280, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 10, color: C.accent }}>① LA VILLE</div>
            <Slider label="Population en ligne" value={size} min={5} max={50000} step={5} onChange={setSize} />
            <Slider label="% de femmes" value={pctWomen} min={0} max={100} onChange={setPctWomen} suffix="%" />
            <Slider label="Âge moyen" value={ageMean} min={18} max={60} onChange={setAgeMean} suffix=" ans" />
            <Slider label="Étalement des âges" value={ageSpread} min={1} max={20} onChange={setAgeSpread} />
            <Slider label="Goûts communs avec toi" value={diversity} min={1} max={8} onChange={setDiversity} suffix=" /pers" />
            <Slider label="Rayon de la ville" value={cityRadius} min={1} max={30} onChange={setCityRadius} suffix=" km" />
            <Slider label="% de gens fiables" value={pctReliable} min={0} max={100} onChange={setPctReliable} suffix="%" />
            <Slider label="% de premium" value={pctPremium} min={0} max={100} onChange={setPctPremium} suffix="%" />
            <Slider label="Places par personne (cap)" value={cap} min={1} max={50} onChange={setCap} />
            <Slider label="% déjà pleins" value={pctFull} min={0} max={100} onChange={setPctFull} suffix="%" />
            <button onClick={regen} style={{ width: '100%', marginTop: 8, background: C.accent, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>🔄 Régénérer la ville</button>

            <div style={{ fontSize: 12.5, fontWeight: 800, margin: '18px 0 10px', color: C.pink }}>② L'ALGO (tri en direct)</div>
            <Slider label="Poids Compatibilité" value={wCompat} min={0} max={100} onChange={setWCompat} suffix="%" />
            <Slider label="Poids Proximité" value={wProx} min={0} max={100} onChange={setWProx} suffix="%" />
            <Slider label="Poids Fiabilité" value={wFiab} min={0} max={100} onChange={setWFiab} suffix="%" />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.dim, marginTop: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={thermoOn} onChange={e => setThermoOn(e.target.checked)} /> Thermostat automatique
            </label>

            <div style={{ fontSize: 12.5, fontWeight: 800, margin: '18px 0 8px', color: C.pink }}>②bis TES FILTRES (comme dans l'app)</div>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 5 }}>Je veux voir :</div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {([['all', 'Tout le monde'], ['F', '♀ Femmes'], ['M', '♂ Hommes']] as const).map(([g, lab]) => (
                <button key={g} onClick={() => setFGender(g)} style={{ flex: 1, fontSize: 11, fontWeight: 700, padding: '6px 4px', borderRadius: 9, cursor: 'pointer', border: `1px solid ${fGender === g ? C.pink : C.border}`, background: fGender === g ? `${C.pink}22` : 'transparent', color: fGender === g ? C.pink : C.dim }}>{lab}</button>
              ))}
            </div>
            <Slider label="Âge min" value={fAgeMin} min={18} max={fAgeMax} onChange={(v: number) => setFAgeMin(Math.min(v, fAgeMax))} suffix=" ans" />
            <Slider label="Âge max" value={fAgeMax} min={fAgeMin} max={70} onChange={(v: number) => setFAgeMax(Math.max(v, fAgeMin))} suffix=" ans" />

            <div style={{ fontSize: 12.5, fontWeight: 800, margin: '18px 0 8px', color: C.good }}>③ TES GOÛTS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {POOL.map(it => {
                const on = myInterests.includes(it)
                return <button key={it} onClick={() => setMyInterests(on ? myInterests.filter(x => x !== it) : [...myInterests, it])}
                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 14, cursor: 'pointer', border: `1px solid ${on ? C.good : C.border}`, background: on ? `${C.good}22` : 'transparent', color: on ? C.good : C.dim }}>{it}</button>
              })}
            </div>
          </div>

          {/* COLONNE DROITE — résultats */}
          <div style={{ flex: '2 1 480px', minWidth: 320 }}>
            {/* Santé de la ville */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <Stat label="En ligne" value={pop.length.toLocaleString('fr-CH')} />
              <Stat label="Clutchables" value={clutchableCount.toLocaleString('fr-CH')} color={C.good} />
              <Stat label="Pleins" value={fullCount.toLocaleString('fr-CH')} color={C.bad} />
            </div>
            {/* Thermostat */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ fontWeight: 800 }}>🌡️ Thermostat de densité</span>
                <span style={{ color: C.warn, fontWeight: 700 }}>{Math.round(thermo.level * 100)}%</span>
              </div>
              <div style={{ height: 8, background: C.track, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ width: `${thermo.level * 100}%`, height: '100%', background: `linear-gradient(90deg,${C.good},${C.warn},${C.bad})` }} />
              </div>
              <div style={{ fontSize: 11.5, color: C.dim, marginTop: 6 }}>{thermo.label}</div>
              <div style={{ fontSize: 10.5, color: C.dim, marginTop: 4 }}>Poids effectifs : Compat <b style={{ color: C.text }}>{Math.round(effW.compat * 100)}%</b> · Prox <b style={{ color: C.text }}>{Math.round(effW.proximity * 100)}%</b> · Fiab <b style={{ color: C.text }}>{Math.round(effW.reliability * 100)}%</b></div>
            </div>

            {/* Ton feed */}
            <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, marginBottom: 8 }}>📲 Ton feed — les 40 premiers sur {visible.length.toLocaleString('fr-CH')} <span style={{ color: C.dim, fontWeight: 500 }}>après tes filtres (scroll infini en vrai)</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {ranked.slice(0, 40).map((row, i) => {
                  const { p, s } = row
                  const ok = isClutchable(p)
                  return (
                    <div key={p.id} onClick={() => setSel(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: sel?.id === p.id ? C.panel2 : 'transparent', border: `1px solid ${sel?.id === p.id ? C.accent : C.border}`, borderRadius: 9, padding: '7px 10px', cursor: 'pointer' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: C.dim, width: 22 }}>#{i + 1}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{p.gender === 'F' ? '♀' : '♂'} {p.name}</span>
                      <span style={{ fontSize: 11, color: C.dim }}>{p.age} ans</span>
                      <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 800, color: C.pink }}>{s.pct}%</span>
                      <span style={{ fontSize: 10, color: C.dim }}>{s.km != null ? s.km.toFixed(1) + 'km' : ''}</span>
                      <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6, background: ok ? `${C.good}22` : `${C.bad}22`, color: ok ? C.good : C.bad }}>{ok ? 'clutchable' : 'plein'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* PANNEAU « POURQUOI » */}
        {sel && (() => {
          const s = scoreProfile(me, sel, effW, Math.max(cityRadius * 2, 5))
          const Bar = ({ label, val, weight, color }: any) => (
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 3 }}>
                <span style={{ color: C.dim }}>{label} <span style={{ color: C.text }}>{Math.round(val * 100)}%</span> × poids {Math.round(weight * 100)}%</span>
                <span style={{ color: C.text, fontWeight: 700 }}>= {(val * weight * 100).toFixed(1)} pts</span>
              </div>
              <div style={{ height: 7, background: C.track, borderRadius: 4, overflow: 'hidden' }}><div style={{ width: `${val * 100}%`, height: '100%', background: color }} /></div>
            </div>
          )
          return (
            <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: C.panel, borderTop: `1px solid ${C.accent}`, padding: '16px', boxShadow: '0 -10px 30px rgba(0,0,0,.4)' }}>
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 15, fontWeight: 800 }}>🔍 Pourquoi {sel.gender === 'F' ? '♀' : '♂'} {sel.name} est classé·e ici</span>
                  <button onClick={() => setSel(null)} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>✕</button>
                </div>
                <Bar label="Compatibilité (goûts communs)" val={s.compat} weight={effW.compat} color={C.pink} />
                <Bar label="Proximité" val={s.prox} weight={effW.proximity} color={C.accent} />
                <Bar label="Fiabilité" val={s.fiab} weight={effW.reliability} color={C.good} />
                <div style={{ fontSize: 12.5, marginTop: 8, color: C.dim }}>
                  Goûts communs : {s.shared.length ? <b style={{ color: C.text }}>{s.shared.join(', ')}</b> : <span>aucun</span>} · Distance : <b style={{ color: C.text }}>{s.km?.toFixed(1)} km</b> · Fiabilité : <b style={{ color: C.text }}>{sel.reliability}/100</b> · Places : <b style={{ color: isClutchable(sel) ? C.good : C.bad }}>{sel.receivedClutches}/{sel.capSlots}</b>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, marginTop: 8 }}>Score final : <span style={{ color: C.pink }}>{s.pct}%</span></div>
              </div>
            </div>
          )
        })()}

        {/* RESET */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button onClick={() => { setPop([]); setSel(null) }} style={{ background: 'none', border: `1px solid ${C.bad}55`, color: C.bad, borderRadius: 10, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 12.5 }}>🧹 Réinitialiser (tout effacer)</button>
        </div>
      </div>
    </div>
  )
}
