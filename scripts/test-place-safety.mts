// Preuve du classifieur de sécurité des lieux. Lancer : node scripts/test-place-safety.mts
import { placeSafety } from '../lib/place-safety.ts'

let ok = 0, ko = 0
const C = (n: string, c: boolean) => { if (c) { ok++; console.log('  ✓', n) } else { ko++; console.log('  ✗ ÉCHEC :', n) } }

console.log('── Lieux publics = sûrs (niveau 0), même tard ──')
C('café 14h → 0', placeSafety('Café du Marché', 14).level === 0)
C('bar 23h → 0 (public fréquenté)', placeSafety('Bar du Flon', 23).level === 0)
C('gare 2h → 0', placeSafety('Gare de Lausanne', 2).level === 0)

console.log('── Lieu inconnu : neutre le jour, attention la nuit ──')
C('lieu inconnu 15h → 1 neutre (pas de message)', placeSafety('Chez Paul', 15).level === 1 && !placeSafety('Chez Paul', 15).advise)
C('lieu inconnu 23h → 2 attention', placeSafety('Chez Paul', 23).level === 2)

console.log('── Lieu isolé : attention le jour, ROUGE la nuit ──')
C('parc 16h → 2 attention', placeSafety('Parc de Milan', 16).level === 2)
C('forêt minuit → 3 rouge', placeSafety('Forêt de Sauvabelin', 0).level === 3)
C('plage 23h → 3 rouge', placeSafety('Plage de Vidy', 23).level === 3)
C('parking 1h → 3 rouge', placeSafety('Parking du centre', 1).level === 3)

console.log('── advise (proposer le bouclier) = niveau ≥ 2 ──')
C('rouge → advise true', placeSafety('Forêt', 0).advise === true)
C('sûr → advise false', placeSafety('Café', 0).advise === false)
C('message rouge non vide', placeSafety('Forêt', 0).fr.length > 0)

console.log(`\n── Résultat : ${ok} OK, ${ko} échec(s) ──`)
if (ko > 0) process.exit(1)
