'use client'
// Affiche le bouton 🏠 Home sur TOUTES les pages annexes (vision, hub-enfants, forteresse, scénarios…),
// SAUF l'app principale / la landing / le hub lui-même. Un seul endroit → couvre tout d'un coup.
import { usePathname } from 'next/navigation'
import { HomeFab } from './HomeFab'

const HIDE = ['/', '/app', '/app2', '/proto', '/onboarding', '/hub']

export function HomeFabGate() {
  const p = (usePathname() || '/').replace(/\/$/, '') || '/'
  if (HIDE.includes(p)) return null
  return <HomeFab />
}
