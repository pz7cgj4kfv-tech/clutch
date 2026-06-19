'use client'
export default function ScenarioPage() {
  return (
    <div style={{width:'100%',height:'100vh',overflow:'hidden',background:'#1a0d14'}}>
      <iframe
        src="/scenario-frame.html"
        style={{width:'100%',height:'100%',border:'none'}}
        title="Clutch — Scénarios & Audit"
      />
    </div>
  )
}
