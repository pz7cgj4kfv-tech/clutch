// 🏠 Bouton Home/retour — flottant, sur toutes les pages annexes → ramène au Hub (la page centrale).
// David : « il faut un bouton home sur chaque page, navigation simple dans tous les onglets ».
export function HomeFab({ to = '/hub' }: { to?: string }) {
  return (
    <a href={to} aria-label="Accueil (Hub)" title="Accueil"
      style={{
        position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 10px)', left: 10, zIndex: 99999,
        width: 40, height: 40, borderRadius: '50%', background: '#532943', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        textDecoration: 'none', boxShadow: '0 3px 12px rgba(83,41,67,.45)', border: '2px solid #fff',
      }}>🏠</a>
  )
}
