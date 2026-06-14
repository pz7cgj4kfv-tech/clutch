'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  'https://fnucdicfcjoxbozpfdau.supabase.co',
  'sb_publishable_TXWkldkILlJ5G9OTOfiCLg_NYZLVMTZ'
)

const PWD = 'clutch2026!'

function Lock({ onUnlock }: { onUnlock: () => void }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)
  const check = () => {
    if (val === PWD) { try { localStorage.setItem('hq_ok', '1') } catch(e) {}; onUnlock() }
    else { setErr(true); setVal(''); setTimeout(() => setErr(false), 1000) }
  }
  return (
    <div style={{ minHeight:'100vh', background:'#2A0F22', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.05em', marginBottom:32 }}><span style={{color:'#FFBF9E'}}>CLU</span><span style={{ color:'#E27C00' }}>TCH</span> <span style={{ fontSize:14, color:'rgba(255,191,158,.4)', fontWeight:500 }}>QG</span></div>
        <input autoFocus type="password" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="mot de passe"
          style={{ background: err ? '#450a0a' : '#3D1A33', border:`1px solid ${err ? '#ef4444' : '#333'}`, borderRadius:12, padding:'12px 20px', fontSize:16, color:'#F5F5F5', outline:'none', textAlign:'center', width:200, fontFamily:'inherit', transition:'all 0.2s' }} />
        <div style={{ marginTop:16 }}>
          <button onClick={check} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:10, padding:'10px 28px', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Entrer</button>
        </div>
        {err && <div style={{ color:'#f87171', fontSize:12, marginTop:12 }}>Code incorrect</div>}
      </div>
    </div>
  )
}

// Palette officielle Clutch — cohérente avec /app2
const C = {
  bg: '#2A0F22',          // bordeaux profond (= fond app)
  card: '#3D1A33',        // bordeaux moyen (= cards app)
  border: 'rgba(255,191,158,0.2)',
  text: '#FAFAFA',
  textMid: 'rgba(250,250,250,0.6)',
  // Clutch brand colors:
  salmon: '#FFBF9E',      // CLU — couleur principale logo
  orange: '#E27C00',      // TCH — accent logo
  primary: '#E27C00',     // boutons CTA
  primaryLight: '#FFBF9E',
  green: '#2DBD7E',
  red: '#ef4444',
  pink: '#FF6B9D',        // genre F
  blue: '#4FC3F7',        // genre M
  purple: '#B39DDB',      // genre X
  sage: '#22c55e',        // succès
  gold: '#f59e0b',        // warning
}

type Status = 'done' | 'in-progress' | 'todo' | 'blocked'
type Severity = 'critical' | 'high' | 'medium' | 'low'

const statusStyle: Record<Status, { bg: string; color: string; label: string }> = {
  'done':        { bg: '#14532d', color: '#4ade80', label: '✅ Fait' },
  'in-progress': { bg: '#1c1917', color: '#f59e0b', label: '🔄 En cours' },
  'todo':        { bg: '#1e1b4b', color: '#818cf8', label: '📋 À faire' },
  'blocked':     { bg: '#450a0a', color: '#f87171', label: '🚫 Bloqué' },
}

const severityStyle: Record<Severity, { bg: string; color: string; label: string }> = {
  'critical': { bg: '#450a0a', color: '#f87171', label: '🔴 Critique' },
  'high':     { bg: '#431407', color: '#fb923c', label: '🟠 Haute' },
  'medium':   { bg: '#1c1917', color: '#f59e0b', label: '🟡 Moyenne' },
  'low':      { bg: '#0f172a', color: '#60a5fa', label: '🔵 Faible' },
}

const tasks: { cat: string; emoji: string; items: { label: string; status: Status; note?: string }[] }[] = [
  {
    cat: 'App Web — Core', emoji: '📱',
    items: [
      { label: 'Login / Logout / Register', status: 'done' },
      { label: 'Onboarding (nom, genre, âge, intérêts)', status: 'done' },
      { label: 'Discover — liste des profils', status: 'done' },
      { label: 'Scroll iOS Safari', status: 'done', note: 'v06.06-F' },
      { label: 'Login → Discover direct (pas onboarding)', status: 'done', note: 'v06.06-J' },
      { label: 'Envoyer / Recevoir un Clutch', status: 'done' },
      { label: 'Expiry clutches visible dans Inbox', status: 'done' },
      { label: 'Upload photo profil (galerie + caméra)', status: 'done' },
      { label: 'Modifier profil (bio, job, quartier)', status: 'done' },
      { label: 'Recadrage photo (haut/centre/bas)', status: 'done' },
      { label: 'Counter-proposal (contre-offre)', status: 'done', note: 'v08.06-A' },
      { label: 'Expiry automatique 2h (Edge Function)', status: 'done', note: 'pg_cron 15min' },
      { label: 'Multiple photos profil', status: 'todo' },
      { label: 'Suppression de compte (LPD + App Store)', status: 'done', note: 'v12.06 — Modal 2 étapes + Edge Fn delete-account déployée sur Supabase' },
      { label: 'Intérêts éditables (chips, sauvés en DB)', status: 'done', note: 'v12.06-C — 18 chips, max 8, profiles.interests JSONB' },
      { label: 'Âge éditable une seule fois si vide, puis immuable', status: 'done', note: 'v14.06 — input numérique 18-99, sauvé en DB, locked après' },
      { label: 'Auto-expiration clutchs 18h côté client', status: 'done', note: 'v12.06-C — guard .eq(status,pending) pour éviter double update' },
      { label: 'Auto-reward +5pts après RDV honoré', status: 'done', note: 'v12.06-C — guard localStorage par clutch_id' },
      { label: 'Block double clutch même paire', status: 'done', note: 'v12.06-A — vérifie pending/confirmed/accepted avant insert' },
      { label: 'Bannière lieu RDV dans le chat + bouton rappel', status: 'done', note: 'v12.06-B — prérempli le message avec lieu+heure' },
      { label: 'Simulation Clutch entrant (ClutchIncoming modal)', status: 'done', note: 'v14.06 — modal animée CLU/TCH + accepter/refuser wirés' },
      { label: 'Anti-replay animation Verrou au reload', status: 'done', note: 'v14.06 — guard localStorage verrou_shown_{id}' },
      { label: 'Créneaux minimum +15min dans le futur', status: 'done', note: 'v14.06 — makeSlots() toujours ≥15min, fix le slot "maintenant"' },
      { label: 'ProfileSheet + EventSheet hauteur 96vh (plein écran)', status: 'done', note: 'v14.06 — maxHeight→height:96vh' },
      { label: 'Pinch-zoom carte débloqué (iOS)', status: 'done', note: 'v14.06 — userScalable retiré du viewport, font-size:16px sur inputs' },
      { label: 'Alerte distance GPS avant envoi Clutch', status: 'todo', note: 'Si A et B sont à >50km → pop-up confirmation' },
      { label: 'No-show signalé par l\'autre → -10pts', status: 'todo', note: 'Avec cooldown 24h anti-abus' },
    ]
  },
  {
    cat: 'Géolocalisation & Carte', emoji: '🗺️',
    items: [
      { label: 'Permission GPS + stocker lat/lng', status: 'done' },
      { label: 'Distance affichée sur les cartes profil', status: 'done' },
      { label: 'Filtre serveur available_until dans loadProfiles', status: 'done' },
      { label: 'Filtre "dans X km" sur Discover', status: 'todo' },
      { label: 'Vraie carte interactive (Mapbox/Leaflet) avec étoiles', status: 'todo', note: 'Voir section Timeline' },
    ]
  },
  {
    cat: 'Fiabilité & Feedback', emoji: '⭐',
    items: [
      { label: 'Score fiabilité affiché (étoiles ★)', status: 'done' },
      { label: 'Feedback post-RDV', status: 'done' },
      { label: 'Score dynamique après RDV (+3/-15)', status: 'done' },
      { label: 'Score -10pts à l\'annulation', status: 'done' },
      { label: 'Suspension automatique (score < 60)', status: 'done' },
      { label: 'Historique RDV sur profil', status: 'todo' },
      { label: 'Badge automatique selon score', status: 'todo' },
    ]
  },
  {
    cat: 'Sécurité', emoji: '🛡️',
    items: [
      { label: 'Bouton SOS UI + GPS + contacts confiance', status: 'done' },
      { label: 'Badges sécurité lieux (🛡/👁/⚠️)', status: 'done' },
      { label: 'Report + Block + Modération admin', status: 'done' },
      { label: 'CGU & Charte éthique (/legal)', status: 'done' },
      { label: 'SOS — envoi réel SMS/email', status: 'todo', note: 'Edge Function Supabase' },
    ]
  },
  {
    cat: 'Premium & Paiement', emoji: '💎',
    items: [
      { label: 'Stripe CHF 19.90/mois', status: 'done' },
      { label: 'Gate premium (clutches illimités)', status: 'done' },
      { label: 'Gratuit pour les femmes', status: 'done' },
      { label: 'Favoris (table + UI + gate)', status: 'done' },
      { label: 'Dashboard admin revenus', status: 'todo' },
      { label: 'LÉGAL — activités payantes : Stripe Connect ou lien externe', status: 'todo', note: '⚖️ Si Clutch perçoit argent pour tiers → FINMA + TVA + déclaration revenus. Solution : rediriger vers Eventbrite/lien externe SANS transaction via Clutch pour la v1.' },
      { label: '"Voir qui m\'a consulté" (premium)', status: 'todo', note: 'PAS "qui t\'a cloché" — ça c\'est visible pour tous (base du concept)' },
      { label: 'Read receipts messages (✓✓ bleus) — premium', status: 'todo' },
      { label: 'Boost visibilité 1x/jour — premium', status: 'todo' },
      { label: 'Super-Clutch prioritaire (badge doré) — premium', status: 'todo', note: '1 par semaine max' },
      { label: 'Mode incognito — premium', status: 'todo', note: 'Visible uniquement par ses clutchés passés' },
    ]
  },
  {
    cat: '📲 App Native (Capacitor)', emoji: '📲',
    items: [
      { label: 'Capacitor init dans le projet React', status: 'done', note: 'v10.06-A — @capacitor/core + cli installés' },
      { label: 'iOS platform (npx cap add ios)', status: 'done', note: 'v12.06 — déjà initialisé, projet Xcode ouvert' },
      { label: 'Build Next.js → Capacitor sync', status: 'done', note: 'v12.06 — npm run build && npx cap sync OK, OneSignal plugin détecté' },
      { label: 'Icône app 1024×1024 PNG générée', status: 'done', note: 'v12.06 — resources/icon.png via sharp depuis logo_apli.svg' },
      { label: 'Edge Functions déployées (delete-account + expire-clutches)', status: 'done', note: 'v12.06 — npx supabase functions deploy' },
      { label: 'Plausible Analytics', status: 'done', note: 'v12.06-A — script dans layout.tsx' },
      { label: '🔴 Payer Apple Developer $99/an', status: 'blocked', note: 'DEMAIN MATIN — developer.apple.com/enroll → débloquer TestFlight' },
      { label: '🔴 Build + Archive Xcode → TestFlight', status: 'blocked', note: 'DEMAIN — après paiement Apple. Product → Archive → Upload' },
      { label: 'Android platform (npx cap add android)', status: 'todo', note: 'Phase 3 — Android Studio requis' },
      { label: 'GPS natif via @capacitor/geolocation', status: 'todo' },
      { label: 'Caméra native via @capacitor/camera', status: 'todo' },
      { label: 'Haptic feedback @capacitor/haptics', status: 'todo' },
      { label: 'App Store iOS public', status: 'todo', note: 'Après TestFlight — review Apple 1-3j' },
      { label: 'Google Play public', status: 'todo', note: 'Phase 3' },
    ]
  },
  {
    cat: 'Infrastructure', emoji: '⚙️',
    items: [
      { label: 'GitHub Pages auto deploy', status: 'done' },
      { label: 'Supabase Auth + Realtime + Storage', status: 'done' },
      { label: 'Notifications push (VAPID + Realtime)', status: 'done' },
      { label: 'Invisible pendant RDV actif (±90min)', status: 'done' },
      { label: 'Plausible Analytics', status: 'done', note: 'v12.06-A — live sur pz7cgj4kfv-tech.github.io' },
      { label: 'Poll clutches 20s (remonter depuis 8s)', status: 'todo' },
      { label: 'Scheduler expire-clutches toutes 15min', status: 'blocked', note: 'Nécessite Supabase Pro $25/mois — pas urgent car expiration côté client déjà active' },
    ]
  },
  {
    cat: 'Marketing & Lancement', emoji: '🚀',
    items: [
      { label: 'Landing page + Proto 3 pages', status: 'done', note: 'v10.06-A' },
      { label: 'Démo interactive', status: 'done' },
      { label: 'Flyer A4 + Legal', status: 'done' },
      { label: 'Waitlist Supabase', status: 'done' },
      { label: 'Email confirmation waitlist (Resend)', status: 'todo' },
      { label: 'TestFlight beta — 50 testeurs Lausanne', status: 'in-progress', note: '🔴 DEMAIN — après paiement Apple Developer' },
      { label: 'Compte créateur d\'événements', status: 'todo', note: 'DEMAIN — profil différent, organise événements, pas de clutch direct' },
      { label: 'Préférences de recherche (genre, âge, distance)', status: 'todo', note: 'DEMAIN — filtre qui tu veux voir dans Présences' },
      { label: 'Recadrage photo à l\'upload (pinch/zoom)', status: 'todo', note: 'Évite les photos mal cadrées' },
      { label: 'Onboarding 3 écrans (1ère connexion)', status: 'todo' },
      { label: 'Partage de profil /u/david', status: 'todo' },
      { label: 'Mode Incognito (visible par clutchés seulement)', status: 'todo' },
      { label: 'Rapport d\'activité hebdo (RDV, score, stats)', status: 'todo' },
      { label: 'Lancement public Lausanne', status: 'todo', note: 'Cible : oct 2026' },
    ]
  },
]

const audit: { cat: string; emoji: string; items: { label: string; severity: Severity; note?: string; fix?: string }[] }[] = [
  {
    cat: 'UX & Ergonomie', emoji: '🎨',
    items: [
      { label: 'Pas de retour visuel si clutch déjà envoyé', severity: 'high', fix: 'Griser le bouton "Clutcher" si clutch en cours' },
      { label: 'Pas de message si Discover est vide', severity: 'medium', fix: '"Personne de disponible — sois le·la premier·e →"' },
      { label: 'Moment acceptation clutch sous-exploité', severity: 'critical', fix: 'Confetti + vibration + animation plein écran — THE moment' },
      { label: 'Voix app trop fonctionnelle, pas de caractère', severity: 'medium', fix: 'Rewriter tous les micro-textes avec une voix humaine forte' },
      { label: 'Photo profil coupée en haut sur cartes', severity: 'medium', note: '✅ Réglé v08.06-A' },
    ]
  },
  {
    cat: 'Bugs connus', emoji: '🐛',
    items: [
      { label: 'PATCH 400 sur profiles (available_from:null)', severity: 'high', fix: 'available_from:null viole constraint — vérifier schema' },
      { label: 'Poll clutches 8s trop agressif pour prod', severity: 'medium', fix: 'Remonter à 20s une fois realtime stable' },
      { label: 'SOS — pas d\'envoi réel', severity: 'high', fix: 'SMS/email via Supabase Edge Function' },
    ]
  },
  {
    cat: 'Sécurité & Légal', emoji: '🔒',
    items: [
      { label: 'Suppression compte v1 OK dans /app2 (pas auth.users)', severity: 'medium', fix: 'Créer Edge Fn delete-account → supprime auth.users avec service role key — ~30min' },
      { label: 'Vérification âge déclarative seulement', severity: 'high', fix: 'Beta : avertissement légal renforcé. Long terme : ID check' },
      { label: 'CGU non validée par juriste suisse', severity: 'medium', fix: 'Consultation ~2h avocat numérique CH' },
      { label: 'SOS ne log pas les incidents', severity: 'high', fix: 'Notif équipe + log horodaté en base' },
      { label: 'RÈGLE PERMANENTE — Mindset malveillant', severity: 'critical', note: '⚠️ Toujours coder en pensant : homme qui traque une femme, faux comptes, extraction GPS, screenshot partagé, ghost premium, agresseur potentiel. Si "rien ne l\'en empêche" → bloquer avant de coder.' },
      { label: 'GPS — positions étoiles floutées 50m (fuzzPosition)', severity: 'medium', note: '✅ Réglé v10.06-K — offset stable par userId, étoiles non cliquables, Supabase ne stocke que available_city' },
    ]
  },
  {
    cat: 'Performance & Tech', emoji: '⚡',
    items: [
      { label: 'Discover — charge tous les profils sans limit', severity: 'medium', fix: 'Limit 20 + pagination' },
      { label: 'Analytics absentes — pilotage à l\'aveugle', severity: 'critical', fix: 'Plausible.io — 5min à installer' },
      { label: '9 étapes avant le premier RDV (trop long)', severity: 'high', fix: 'Photo optionnelle au début, à compléter plus tard' },
      { label: 'Zéro referral intégré dans le produit', severity: 'high', fix: '"Invite un·e ami·e à être dispo ce soir" — in-app' },
    ]
  },
  {
    cat: 'Avant App Store', emoji: '🍎',
    items: [
      { label: 'Suppression de compte v1 ✅ — Edge Fn delete auth.users restante', severity: 'high', fix: 'Profil anonymisé + signOut OK. Reste: Edge Fn pour delete auth.users complet (~30min)' },
      { label: 'Politique confidentialité conforme App Store', severity: 'critical', fix: 'Déjà sur /legal mais vérifier les champs requis par Apple' },
      { label: 'Capacitor init + iOS platform', severity: 'critical', fix: 'Voir onglet Roadmap — section App Native' },
      { label: 'TestFlight setup (Apple Developer $99/an)', severity: 'high', fix: 'Créer compte developer.apple.com' },
      { label: 'Icône app 1024×1024 + splash screens', severity: 'high', fix: 'Mel crée le .svg → on génère toutes les tailles' },
    ]
  },
  {
    cat: 'App2 — Audit v10.06-P (10 juin)', emoji: '🔬',
    items: [
      { label: '✅ Authentification + Register + Login', severity: 'low', note: 'Supabase Auth, fonctionnel' },
      { label: '✅ Carte Leaflet day/night + étoiles colorées par genre', severity: 'low', note: 'fitBounds auto-zoom, 1 seul cercle, couleurs ♀♂◇' },
      { label: '✅ Créneaux 15min, rayon 1→100km', severity: 'low', note: 'v10.06-O' },
      { label: '✅ Page 1/2 → 2/2, bouton Next orange', severity: 'low', note: 'v10.06-O' },
      { label: '✅ Fenêtre disponible ouvre Supabase update', severity: 'low', note: 'is_available=true, available_until' },
      { label: '✅ Présences avec filtre genre ♀♂◇', severity: 'low', note: 'Filtre temps réel, couleurs cohérentes carte+liste' },
      { label: '✅ ClutchSent (envoyer) + VerrouExplosion (confirmer)', severity: 'low', note: 'v10.06-P — 2 animations séparées, vibration multi-pulse' },
      { label: '✅ ActiveVerrouBar — bandeau orange permanent countdown', severity: 'low', note: 'v10.06-P — affiché sur toutes les pages en mode app' },
      { label: '✅ Events : scroll fixé, filtres, M\'inscrire fonctionnel', severity: 'low', note: 'v10.06-P — sheet flex column, CTA fixe en bas' },
      { label: '✅ Profil : upload photo, édition bio/genre, enfants mode ami', severity: 'low', note: 'v10.06-O' },
      { label: '✅ Favoris + Bloqués avec actions', severity: 'low', note: 'v10.06-O' },
      { label: '✅ Sim Verrou bouton test (profil tab)', severity: 'low', note: 'v10.06-P — pour tester les animations sans vrai clutch' },
      { label: '🔴 Paiement événements — aucun flux implémenté', severity: 'critical', fix: 'Stripe Payment Links pour événements payants. Commission Clutch : 0% beta, 5-10% phase prod. À décider avec David.' },
      { label: '🔴 Chat post-Verrou inexistant', severity: 'critical', fix: 'Table messages Supabase + vue chat dans onglet Clutchs après confirmation. Limit 5 messages × 300 chars.' },
      { label: '🟠 Mode Rencontre vs Amitié non implémenté', severity: 'high', fix: 'Champ mode sur profil, filtre dans Présences. Enfants/famille visible MODE AMI uniquement.' },
      { label: '🟠 Liste d\'amis (gens déjà rencontrés)', severity: 'high', fix: 'Table friends/connections après Verrou confirmé. Partage d\'activités entre amis.' },
      { label: '🟠 Proximity Meter (radar RDV -30min)', severity: 'high', fix: 'Détecte quand les 2 GPS sont à <500m, countdown visuel, Verrou auto-confirmé à <50m.' },
      { label: '🟡 Plausible Analytics', severity: 'medium', fix: 'Script 1 ligne — PRIORITÉ pour piloter les tests' },
      { label: '🟡 Edge Function delete-account', severity: 'medium', fix: 'service_role key → auth.users delete complet' },
      { label: '🟡 Notifications push (notif limites)', severity: 'medium', note: 'Max 5 notifs/jour/user pour ne pas submerger. Voir liste types ci-dessous.' },
    ]
  },
  {
    cat: 'Notifications — types définis', emoji: '🔔',
    items: [
      { label: 'P1 🔴 Clutch reçu', severity: 'critical', note: 'Vibration forte + son. "X veut te rencontrer ce soir au Café Romand à 20h — 2h pour répondre"' },
      { label: 'P1 🔴 Verrou confirmé', severity: 'critical', note: 'Explosion VerrouExplosion + vibration multi-pulse. "🔒 VERROU ! RDV ce soir à 20h"' },
      { label: 'P2 🟠 Clutch expire bientôt (-30min)', severity: 'high', note: '"⏰ Ton Clutch avec X expire dans 30 min — réponds vite !"' },
      { label: 'P2 🟠 Nouveau profil dans rayon', severity: 'high', note: '"✦ Camille vient de se mettre dispo à 400m" — max 1 par 15min' },
      { label: 'P3 🟡 Rappel RDV -60min', severity: 'medium', note: '"🔒 Ton Verrou avec X dans 1h — Café Romand, 20h"' },
      { label: 'P3 🟡 Inscription à ton événement', severity: 'medium', note: '"👋 Sophie s\'est inscrite à ton yoga du matin" — max 3 notifs/événement' },
      { label: 'P3 🟡 Score fiabilité changé', severity: 'medium', note: '"★ Ton score vient de monter à 97" (montée seulement, pas descente)' },
      { label: 'P4 🔵 Clutch refusé', severity: 'low', note: '"X n\'est pas dispo ce soir" — subtil, pas d\'humiliation' },
      { label: 'P4 🔵 Nouveau·elle membre certifié·e crée un événement', severity: 'low', note: '"🎵 Nouveau jazz ce soir au MAD" — max 1/semaine' },
      { label: '⚠️ LIMITE ABSOLUE', severity: 'critical', note: 'Max 5 push/jour/user. Si dépassement → silencieux. Respecter la sérénité de l\'utilisateur.' },
    ]
  },
]

const design: { cat: string; emoji: string; items: { label: string; status: 'done'|'todo'|'review'; note?: string }[] }[] = [
  {
    cat: 'Identité visuelle Mel', emoji: '🎨',
    items: [
      { label: 'Palette : bordeaux #542A44, saumon #FFBF9E, orange #E27C00', status: 'done', note: 'Fichiers Illustrator Mel' },
      { label: 'Logo sablier vectoriel (SVG) — Mel', status: 'done', note: 'ecran0_dissos-01 à 07' },
      { label: 'Splash screen animé /proto', status: 'done', note: 'v09.06-A — sablier + sable + CLUTCH' },
      { label: 'Landing 3 pages prototype', status: 'done', note: 'v10.06-A — carte + types + profils' },
      { label: 'Favicon ✦ sablier', status: 'todo' },
      { label: 'Guidelines brand document (PDF)', status: 'todo' },
      { label: 'Icône app 1024×1024 pour App Store', status: 'todo', note: 'Mel fait en Illustrator' },
      { label: 'Splash screens iOS/Android (Capacitor)', status: 'todo' },
    ]
  },
  {
    cat: 'Écrans à prototyper (priorité)', emoji: '📱',
    items: [
      { label: 'Écran HOME — carte présences pulsantes', status: 'done', note: 'Version proto /proto — vraie carte à venir' },
      { label: 'Vraie carte Mapbox avec étoiles + position', status: 'todo', note: 'Leaflet OSM gratuit ou Mapbox $49/mois' },
      { label: 'Geste "Je suis là" — appui long pour s\'ouvrir', status: 'todo' },
      { label: 'Verrou confirmé — wow moment confetti plein écran', status: 'todo', note: 'THE moment manquant' },
      { label: 'Proximity Meter 30min avant RDV', status: 'done', note: 'v08.06-K' },
      { label: 'Dark mode', status: 'todo', note: 'Phase 2' },
    ]
  },
]

const pages = [
  { label: '🏠 Accueil', href: '/', desc: 'Landing page publique', color: '#7A9E8A' },
  { label: '📱 App réelle', href: '/app', desc: 'App avec vrai compte', color: '#8b5cf6' },
  { label: '🎬 Démo', href: '/demo', desc: 'Demo sans compte', color: '#f59e0b' },
  { label: '✦ Proto', href: '/proto', desc: 'Splash animation logo', color: '#E27C00' },
  { label: '📄 Flyer', href: '/flyer', desc: 'Flyer A4 imprimable', color: '#60a5fa' },
  { label: '⚙️ Admin', href: '/admin', desc: 'Modération & admin', color: '#f87171' },
  { label: '📋 Legal', href: '/legal', desc: 'CGU & confidentialité', color: '#999' },
  { label: '🔍 Audit', href: '/audit', desc: 'Audit expert PDF', color: '#D4A853' },
  { label: '🧪 Guide Mel', href: '/mel', desc: 'Procédure de test', color: '#2DBD7E' },
]

// ─── TIMELINE DATA ──────────────────────────────────────────────
const timeline = [
  {
    phase: 'MAINTENANT — Semaine 1-2 · v11.06-M',
    date: 'Juin 2026 · semaines 1-2',
    color: '#ef4444',
    urgent: true,
    tasks: [
      { label: '✅ Suppression de compte v1 (modal 2 étapes + LPD anonymisation) dans /app2', done: true, critical: false },
      { label: '✅ Flow verrou temps réel David↔Tafit (fix CHECK constraint + RLS clutches_update_v2)', done: true, critical: false },
      { label: '✅ Chat temps réel avec badges non lus (polling 4s + filtre clutchs actifs)', done: true, critical: false },
      { label: '⚠️ Suppression compte — TODO Edge Fn delete auth.users (complet)', done: false, critical: true },
      { label: '🔴 Plausible Analytics (5min — piloter à l\'aveugle = danger)', done: false, critical: true },
      { label: '📋 Bloquer double clutch vers même personne', done: false, critical: false },
      { label: '📋 Trigger expiration 18h Supabase (pg_cron ou DB trigger)', done: false, critical: false },
      { label: '✅ Capacitor init dans le projet', done: true },
      { label: 'Icône app 1024×1024 (Mel, Illustrator → SVG)', done: false, critical: false },
      { label: 'Confetti / wow moment à l\'acceptation d\'un Clutch', done: false, critical: false },
      { label: 'Empty state Discover animé', done: false, critical: false },
    ]
  },
  {
    phase: 'PHASE 1 — App Native',
    date: 'Juin-Juillet 2026 · semaines 3-6',
    color: '#f59e0b',
    urgent: false,
    tasks: [
      { label: 'npx cap add ios (Xcode obligatoire sur Mac)', done: false, critical: true },
      { label: 'npx cap add android (Android Studio)', done: false, critical: false },
      { label: 'Remplacer VAPID push par @capacitor/push-notifications', done: false, critical: false },
      { label: 'GPS natif @capacitor/geolocation (plus fiable qu\'API browser)', done: false, critical: false },
      { label: 'Caméra native @capacitor/camera', done: false, critical: false },
      { label: 'Haptic feedback @capacitor/haptics (vibration à l\'acceptation)', done: false, critical: false },
      { label: 'Splash screens iOS/Android auto-générés depuis SVG', done: false, critical: false },
      { label: 'Test sur iPhone physique (cable + Xcode)', done: false, critical: true },
    ]
  },
  {
    phase: 'PHASE 2 — TestFlight Beta',
    date: 'Juillet-Août 2026 · semaines 7-10',
    color: '#2DBD7E',
    urgent: false,
    tasks: [
      { label: 'Créer compte Apple Developer ($99/an)', done: false, critical: true },
      { label: 'Soumettre à Apple pour review TestFlight (1-3 jours)', done: false, critical: false },
      { label: 'Inviter 20-50 testeurs Lausanne (lien privé TestFlight)', done: false, critical: false },
      { label: 'Vraie carte Mapbox/Leaflet avec étoiles animées', done: false, critical: false },
      { label: 'Referral in-app "Invite un·e ami·e"', done: false, critical: false },
      { label: 'A/B test prix CHF 14.90 / 19.90 / 24.90', done: false, critical: false },
      { label: 'Collecte feedback beta + itérations rapides', done: false, critical: false },
    ]
  },
  {
    phase: 'PHASE 3 — Lancement Public',
    date: 'Octobre 2026',
    color: '#8b5cf6',
    urgent: false,
    tasks: [
      { label: 'App Store iOS public (Lausanne only)', done: false, critical: false },
      { label: 'Google Play Android public', done: false, critical: false },
      { label: 'Campagne activation Lausanne (flyers, événements, presse locale)', done: false, critical: false },
      { label: '500 utilisatrices actives = masse critique minimum', done: false, critical: true },
      { label: 'Score de fiabilité moyen > 80 (communauté saine)', done: false, critical: false },
    ]
  },
]

// ─── VISION DATA ──────────────────────────────────────────────
const visionSections = [
  {
    id: 'identite',
    title: 'Identité profonde',
    icon: '✦',
    color: '#D4A853',
    content: [
      {
        q: 'Ce que Clutch est vraiment',
        a: `Clutch n'est pas une app de rencontres. Ce n'est pas un Tinder suisse.\n\nClutch est une infrastructure de spontanéité urbaine — un réseau de personnes physiquement disponibles maintenant, dans un rayon donné, pour partager un moment réel dans les 18 prochaines heures.\n\nLe cas d'usage "dating" est un parmi d'autres : café, balade, concert, yoga, billet en trop, networking, amitié. Le cœur = spontanéité + présence + réel.`,
      },
      {
        q: 'La phrase définitive',
        a: `"Quelqu'un t'attend. Tu ne le savais pas encore."\n\nOu plus court, plus brutal : "Disponible maintenant. Pour de vrai."`,
      },
      {
        q: 'Vocabulaire propriétaire',
        a: `À GARDER : Clutch (verbe + nom) · Verrou · Disponible · Fenêtre (créneau)\nÀ CRÉER : Présence · Lancer un Clutch · Ouvrir une fenêtre · Fermer le Verrou\nÀ BANNIR : match · swipe · like · feed · story · boost · super-like`,
      },
    ],
  },
  {
    id: 'philosophie',
    title: 'Philosophie & Transparence',
    icon: '🫀',
    color: '#f472b6',
    content: [
      {
        q: "L'âme de Clutch — ce qu'on ne compromet jamais",
        a: `Clutch est construite sur une conviction : les gens se rencontrent mieux en vrai qu'en ligne.\n\nNotre contrat avec les membres :\n→ On ne truque rien. Les étoiles sur la carte = des vrais membres disponibles maintenant.\n→ L'algorithme sera transparent : les critères de qui apparaît en premier seront documentés et accessibles.\n→ On ne crée pas d'addiction. Pas de gamification perverse. Pas de "vous avez failli avoir un match".\n→ On protège les femmes en premier. Pas parce que c'est légal — parce que c'est juste.\n→ Gratuit pour les femmes = permanent. Ce n'est pas une promo, c'est un principe.`,
      },
      {
        q: "Transparence algorithme — questions ouvertes (à décider)",
        a: `CRITÈRES EN DISCUSSION pour l'ordre d'affichage :\n- Fiabilité (score) — les gens qui se présentent en premier\n- Proximité géo — plus proche = plus haut ?\n- Fenêtre de dispo compatible — chevauche la tienne ?\n- Nouveaux membres — boost pendant 7 jours pour éviter le cold start\n- Variété — ne pas toujours montrer les mêmes\n- Activités communes — si tu veux "café" et elle aussi\n\nQUESTIONS OUVERTES :\n- Est-ce qu'on documente l'algo publiquement (page /algo) ?\n- Est-ce qu'on donne un "why you see this" sur chaque profil ?\n- Boost premium : les hommes premium apparaissent-ils plus haut ? (risque = pay-to-play)`,
      },
      {
        q: "Étoiles = vrais membres, pas du faux",
        a: `Les étoiles sur la carte représentent de vrais membres disponibles en ce moment.\nLeurs positions sont POSITIONNÉES ALÉATOIREMENT dans ton rayon d'action.\n→ Tu vois "3 étoiles" = 3 vraies personnes disponibles dans ta zone\n→ Tu ne vois PAS OÙ elles sont exactement (anti-harcèlement, LPD)\n→ Les profils sont dans la liste "Présences"\n\nOn sera transparent sur ça dans l'onboarding et la FAQ.`,
      },
    ],
  },
  {
    id: 'lieux',
    title: 'Lieux — questions ouvertes',
    icon: '📍',
    color: '#34d399',
    content: [
      {
        q: "Comment proposer les lieux de RDV intelligemment ?",
        a: `PROBLÈME : on ne peut pas référencer tous les cafés/bars/parcs de Suisse romande.\n\nSOLUTIONS ENVISAGÉES :\n1. Champ libre (implémenté) — l'utilisateur écrit ce qu'il veut, modéré\n2. Suggestions contextuelles — lieux partenaires mis en avant discrètement\n3. API OpenStreetMap/Overpass — cherche les cafés/bars dans le rayon choisi (gratuit)\n4. Favoris personnels — chaque user peut sauvegarder ses lieux habituels\n\nSI RAYON LARGE (10km, ville dense) : trop de lieux → champ libre + recherche.\nSI RAYON PETIT (1km) : 5-10 suggestions pertinentes via OSM.\n\nPRIOCITÉ : implémenter la recherche OSM dans les 2 prochaines semaines.`,
      },
    ],
  },
  {
    id: 'modes',
    title: 'Modes — Rencontre / Amitié',
    icon: '👥',
    color: '#34d399',
    content: [
      {
        q: 'Pourquoi deux modes distincts ?',
        a: `Clutch peut servir deux besoins très différents :\n\n🔴 MODE RENCONTRE — romantique/dating\n→ Profil épuré, pas d\'infos sensibles\n→ Filtre genre, âge, disponibilité\n→ Pas de mention des enfants\n→ Score fiabilité visible\n\n💚 MODE AMITIÉ — activités / famille\n→ Infos visibles : enfants (oui/non + âges), activités préférées, langues\n→ Filtres : "avec enfants", "pour parents", activités compatibles\n→ Pas de filtre genre romantique\n→ Événements "👶 Parents" accessibles\n\n⚠️ RÈGLE ABSOLUE : Les infos mode Amitié (enfants, situation familiale) ne sont JAMAIS visibles en mode Rencontre.\n\nIMPLÉMENTATION :\n- Champ mode sur profil (F/A)\n- Filtre dans Présences : n\'affiche que les profils en même mode\n- Événements filtrés selon mode actif`,
      },
      {
        q: 'Liste d\'amis — après les Verrous',
        a: `Idée : après un Verrou confirmé qui a bien eu lieu (GPS confirmé), les deux personnes se retrouvent dans une "liste d\'amis" → accès à leurs disponibilités à l\'avance.\n\nUsage famille : "Ana (yoga, 2 enfants 4/7 ans) est dispo mercredi matin" → tu peux lui proposer directement sans passer par Discover.\n\nTECH : table friends (user_a, user_b, created_at, from_clutch_id). Affichage dans profil tab.`,
      },
    ],
  },
  {
    id: 'paiement',
    title: 'Paiement événements',
    icon: '💰',
    color: '#f59e0b',
    content: [
      {
        q: 'Modèle de commission — encore à décider',
        a: `SITUATIONS POSSIBLES :\n\n1. Événement gratuit → aucun flux financier\n2. Événement payant (yoga 15 CHF, concert 25 CHF)\n   → Stripe Payment Links (le plus simple à implémenter)\n   → Commission Clutch : 0% beta | 5-10% en prod (à décider)\n   → Paiement sur place aussi possible (mention dans fiche)\n\nPRINCIPE DÉCIDÉ :\n→ Beta (juin 2026) : paiement sur place uniquement, Clutch = intermédiaire de mise en relation seulement\n→ Phase 2 : Stripe intégré avec split automatique (créateur reçoit X%, Clutch Y%)\n\nQUESTIONS OUVERTES :\n- On prend une commission ? Combien ?\n- Responsabilité légale si événement annulé ?\n- Remboursement via Clutch ou direct avec le créateur ?`,
      },
    ],
  },
  {
    id: 'carte',
    title: 'Carte réelle — faisabilité',
    icon: '🗺️',
    color: '#60a5fa',
    content: [
      {
        q: 'Peut-on faire une vraie carte comme dans la vraie app ?',
        a: `OUI — et c'est même mieux qu'une fausse carte simulée.\n\nDEUX OPTIONS :\n\n1. Leaflet + OpenStreetMap (GRATUIT)\n→ Tiles de carte réelles de Lausanne, pas d'API key, open source\n→ On ajoute les étoiles pulsantes + ta position + ondes par-dessus via Canvas ou SVG overlay\n→ Idéal pour la landing et le proto\n\n2. Mapbox GL JS ($49/mois au-delà de 50 000 vues)\n→ Plus beau visuellement (style nuit personnalisé)\n→ Plus lourd à intégrer\n→ Pour la vraie app, pas le proto\n\nPOUR LA LANDING (/proto ou /) :\n→ Leaflet suffit largement\n→ On met le style "nuit" (CartoDB Dark Matter ou Stamen Toner)\n→ On superpose les étoiles animées via CSS/canvas\n→ Ta position = orange qui pulse\n→ Résultat : identique à ce que tu vois dans les vraies apps\n\nCOMPATIBILITÉ CAPACITOR :\n→ Leaflet fonctionne dans une WebView Capacitor sans modification\n→ Même code = PWA + iOS + Android`,
      },
      {
        q: 'Comment ça marche techniquement ?',
        a: `import L from 'leaflet'\n\n1. Créer la carte sur un <div ref={mapRef}>\n2. Charger les tiles CartoDB Dark Matter (nuit, gratuit)\n3. Ta position → L.circleMarker() en orange avec pulse CSS\n4. Les "étoiles" → L.circleMarker() en saumon pour chaque user dispo\n5. Animation scintillement → className CSS avec @keyframes pulse\n6. Ondes → L.circle() transparent avec animation scale\n\nRésultat en ~100 lignes. À coder dans la landing en 2h.`,
      },
    ],
  },
]

const stats = {
  done: tasks.flatMap(t => t.items).filter(i => i.status === 'done').length,
  total: tasks.flatMap(t => t.items).length,
}

type Tab = 'todo' | 'audit' | 'timeline' | 'design' | 'vision' | 'questions' | 'principes'

// ─── DANGER BANNER ─────────────────────────────────────────────
function DangerBanner() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{ background: 'linear-gradient(135deg, #1a0000, #2d0000)', border: '2px solid #ef4444', borderRadius: 16, padding: '20px 24px', marginBottom: 32, position: 'relative', overflow: 'hidden' }}>
      {/* Effet scanline */}
      <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(239,68,68,0.03) 2px, rgba(239,68,68,0.03) 4px)', pointerEvents:'none' }} />

      <div style={{ display:'flex', gap:16, alignItems:'flex-start', position:'relative' }}>
        <div style={{ fontSize:32, flexShrink:0 }}>🚨</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:900, color:'#ef4444', letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:8 }}>
            ALERTE COMPÉTITION — DANGER RÉEL
          </div>
          <p style={{ fontSize:14, color:'#fca5a5', lineHeight:1.7, margin:0 }}>
            <strong>Tinder a 75 millions d'utilisateurs et 500 ingénieurs.</strong> S'ils voient Clutch fonctionner à Lausanne avec 500 users actifs, ils peuvent copier la feature en <strong>3 mois</strong>. Thursday (app UK identique) est déjà à <strong>1 million d'utilisateurs</strong> à Londres. La fenêtre de domination est maintenant.
          </p>

          <button onClick={() => setExpanded(!expanded)} style={{ background:'transparent', border:'1px solid #ef4444', color:'#ef4444', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:700, cursor:'pointer', marginTop:12, fontFamily:'inherit' }}>
            {expanded ? '▲ Masquer' : '▼ Voir le plan de protection complet'}
          </button>

          {expanded && (
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:12 }}>

              <div style={{ background:'rgba(239,68,68,0.1)', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#ef4444', marginBottom:8, textTransform:'uppercase' }}>☠️ Les 5 menaces réelles</div>
                {[
                  ['Tinder/Hinge copie la feature "disponible maintenant"', 'Probable si Clutch dépasse 5 000 users actifs — ils ont les moyens en 3 mois'],
                  ['Thursday.co (UK) s\'étend en Suisse', 'Déjà 1M users. Lausanne = cible naturelle pour eux'],
                  ['Bumble lance "Bumble Now"', 'Bumble expérimente déjà des formats spontanés. Budget illimité.'],
                  ['Clone local suisse avec capitaux', 'Un dev lausannois peut faire la même chose en 6 semaines'],
                  ['Absence de masse critique = mort lente', 'Sans 200+ femmes actives à Lausanne, l\'app devient une ville fantôme'],
                ].map(([threat, detail], i) => (
                  <div key={i} style={{ borderBottom: i < 4 ? '1px solid rgba(239,68,68,0.2)' : 'none', padding:'8px 0' }}>
                    <div style={{ fontSize:13, color:'#fca5a5', fontWeight:600 }}>⚠ {threat}</div>
                    <div style={{ fontSize:12, color:'#999', marginTop:2 }}>{detail}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(34,197,94,0.1)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(34,197,94,0.2)' }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#4ade80', marginBottom:8, textTransform:'uppercase' }}>🛡️ Comment se protéger — La seule vraie défense c'est LA VITESSE</div>
                {[
                  ['1. Dominer Lausanne AVANT d\'en parler', 'Ne pas pitcher en public avant 500 users actifs à Lausanne. La discrétion est une arme.'],
                  ['2. Le score de fiabilité = moat défendable', 'Un score construit sur des mois de vraies interactions ne se copie pas en 3 mois. C\'est du capital social réel.'],
                  ['3. Gratuit femmes = différentiateur légal et éthique', 'Tinder ne peut pas faire ça — leur modèle économique l\'interdit. C\'est notre avantage structurel.'],
                  ['4. Contrainte 18h = brevettable et défendable', 'La contrainte temporelle stricte peut être protégée. Contacter un avocat en propriété intellectuelle CH.'],
                  ['5. App Store avant tout concurrent local', 'Une vraie app native est plus difficile à copier qu\'un site web. Priorité absolue.'],
                  ['6. Communauté avant produit', 'Les premiers 200 users loyaux sont votre vraie barrière à l\'entrée. Investissez du temps humain.'],
                ].map(([action, detail], i) => (
                  <div key={i} style={{ borderBottom: i < 5 ? '1px solid rgba(34,197,94,0.2)' : 'none', padding:'8px 0' }}>
                    <div style={{ fontSize:13, color:'#4ade80', fontWeight:700 }}>{action}</div>
                    <div style={{ fontSize:12, color:'#999', marginTop:2 }}>{detail}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(245,158,11,0.1)', borderRadius:10, padding:'14px 16px', border:'1px solid rgba(245,158,11,0.2)' }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#f59e0b', marginBottom:6, textTransform:'uppercase' }}>⏱️ La fenêtre de domination</div>
                <p style={{ fontSize:13, color:'#fcd34d', lineHeight:1.7, margin:0 }}>
                  Vous avez <strong>6 à 12 mois</strong> avant qu'un concurrent sérieux arrive sur Lausanne.
                  Après ça, il faudra de l'argent (financement) pour rivaliser.
                  <strong> L'App Store en août 2026, c'est le bon timing.</strong>
                  Chaque semaine de retard = une semaine de moins sur la concurrence.
                </p>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── BOT MAP PICKER — mini carte Leaflet pour positionner un bot ──────────────
const LAUSANNE = [46.5197, 6.6323] as [number, number]

function BotMapPicker({ lat, lng, onChange }: { lat: number; lng: number; onChange: (lat: number, lng: number) => void }) {
  const divRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (mapRef.current || !divRef.current) return
    let mounted = true

    if (!document.getElementById('leaflet-css')) {
      const lk = document.createElement('link')
      lk.id = 'leaflet-css'; lk.rel = 'stylesheet'
      lk.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(lk)
    }

    import('leaflet').then(mod => {
      if (!mounted || !divRef.current) return
      const L = mod.default
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({ iconUrl: '', shadowUrl: '' })

      const initLat = lat || LAUSANNE[0]
      const initLng = lng || LAUSANNE[1]

      const map = L.map(divRef.current!, {
        center: [initLat, initLng], zoom: 13,
        zoomControl: true, attributionControl: false,
        scrollWheelZoom: false,
      })
      mapRef.current = map

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)

      // Marker draggable
      const icon = L.divIcon({
        html: `<div style="width:18px;height:18px;border-radius:50%;background:#B39DDB;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);"></div>`,
        className: '', iconSize: [18, 18], iconAnchor: [9, 9],
      })
      const marker = L.marker([initLat, initLng], { icon, draggable: true }).addTo(map)
      markerRef.current = marker

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        onChange(pos.lat, pos.lng)
      })

      // Clic sur la carte → déplace le marker
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng)
        onChange(e.latlng.lat, e.latlng.lng)
      })

      setTimeout(() => { map.invalidateSize() }, 100)
    })

    return () => { mounted = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync marker si coords changent de l'extérieur (reset)
  useEffect(() => {
    if (markerRef.current && lat && lng) markerRef.current.setLatLng([lat, lng])
  }, [lat, lng])

  const displayLat = (lat || LAUSANNE[0]).toFixed(4)
  const displayLng = (lng || LAUSANNE[1]).toFixed(4)

  return (
    <div>
      <div ref={divRef} style={{ height: 180, width: '100%', borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }} />
      <div style={{ fontSize: 10, color: C.textMid, marginTop: 4, fontFamily: 'monospace', textAlign: 'center' }}>
        📍 {displayLat}, {displayLng} — <span style={{ color: '#B39DDB' }}>clic ou drag pour déplacer</span>
      </div>
    </div>
  )
}

// ─── TEST LAB ─────────────────────────────────────────────────────────────────
const DEFAULT_BOTS = [
  {id:'38dda77a', name:'Camille', gender:'woman', bio:'Café + vraies conversations ☕', age:27, neighborhood:'Lausanne', job:'Designer UX', interests:['Café','Design','Lectures','Randonnée'], reliability_score:94, is_available:true, rayon:5, scenario:'auto_accept', gradient:'linear-gradient(135deg,#FF6B6B,#FFE4E1)'},
  {id:'6cf880cf', name:'Anaïs', gender:'woman', bio:'Yoga & bonne humeur 🧘', age:29, neighborhood:'Pully', job:'Prof de yoga RYT-500', interests:['Yoga','Méditation','Randonnée'], reliability_score:99, is_available:true, rayon:8, scenario:'auto_accept', gradient:'linear-gradient(135deg,#FF8C69,#FFD4A0)'},
  {id:'c504c886', name:'Sofia', gender:'woman', bio:'Curieuse et spontanée ✨', age:25, neighborhood:'Flon', job:'Marketing', interests:['Art','Concerts','Gastronomie'], reliability_score:97, is_available:false, rayon:3, scenario:'random', gradient:'linear-gradient(135deg,#C8A0FF,#E8D5FF)'},
  {id:'074e38bb', name:'Lucas', gender:'man', bio:'Apéros & sorties culturelles 🎭', age:30, neighborhood:'Paquis', job:'Architecte', interests:['Architecture','Jazz','Escalade'], reliability_score:88, is_available:true, rayon:10, scenario:'auto_refuse', gradient:'linear-gradient(135deg,#4FC3F7,#B3E5FC)'},
  {id:'b1e2cc39', name:'Léa', gender:'woman', bio:'Spontanée & curieuse 🌿', age:26, neighborhood:'Ouchy', job:'Infirmière', interests:['Natation','Lecture','Cuisine'], reliability_score:91, is_available:true, rayon:6, scenario:'random', gradient:'linear-gradient(135deg,#A8E6CF,#DCE775)'},
  {id:'df99921f', name:'Thomas', gender:'man', bio:'Culture & bons vivants 🎭', age:32, neighborhood:'Vieille Ville', job:'Libraire', interests:['Littérature','Cinéma','Vin'], reliability_score:86, is_available:false, rayon:4, scenario:'ghost', gradient:'linear-gradient(135deg,#BCAAA4,#D7CCC8)'},
]
type BotConfig = typeof DEFAULT_BOTS[0] & {[k:string]:any}

const SCENARIO_LABELS: Record<string,string> = {
  auto_accept: '✓ Auto-accept',
  auto_refuse: '✕ Auto-refuse',
  random: '🎲 Aléatoire',
  ghost: '🐰 Ghost (ne répond pas)',
}

const BOT_PHOTOS: Record<string,string> = {
  '38dda77a': 'https://randomuser.me/api/portraits/women/44.jpg',
  '6cf880cf': 'https://randomuser.me/api/portraits/women/68.jpg',
  'c504c886': 'https://randomuser.me/api/portraits/women/26.jpg',
  '074e38bb': 'https://randomuser.me/api/portraits/men/32.jpg',
  'b1e2cc39': 'https://randomuser.me/api/portraits/women/55.jpg',
  'df99921f': 'https://randomuser.me/api/portraits/men/41.jpg',
}

const DISPO_OPTIONS = ['Dans 1h','Dans 2h','Dans 4h','Personnalisé']

function TestLab() {
  const [bots, setBots] = useState<BotConfig[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_BOTS
    try { const s = localStorage.getItem('clutch_bots_config'); return s ? JSON.parse(s) : DEFAULT_BOTS } catch { return DEFAULT_BOTS }
  })
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [saved, setSaved] = useState(false)

  const save = () => {
    try { localStorage.setItem('clutch_bots_config', JSON.stringify(bots)) } catch {}
    setSaved(true); setTimeout(() => setSaved(false), 1500)
  }
  const reset = () => { setBots(DEFAULT_BOTS); try { localStorage.removeItem('clutch_bots_config') } catch {} }
  const update = (idx: number, key: string, val: any) => {
    setBots(prev => prev.map((b,i) => i===idx ? {...b, [key]:val} : b))
  }

  return (
    <div style={{background:C.card,border:`2px solid rgba(107,53,88,.8)`,borderRadius:16,padding:'20px',marginTop:24,marginBottom:16}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
        <div style={{fontSize:13,fontWeight:900,color:'#B39DDB',letterSpacing:'.08em',textTransform:'uppercase'}}>🤖 Test Lab — Profils robots</div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={reset} style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:8,background:'transparent',border:`1px solid ${C.border}`,color:C.textMid,cursor:'pointer',fontFamily:'inherit'}}>Reset défauts</button>
          <button onClick={save} style={{fontSize:10,fontWeight:700,padding:'4px 10px',borderRadius:8,background:saved?C.green+'33':'#B39DDB33',border:`1px solid ${saved?C.green:'#B39DDB'}`,color:saved?C.green:'#B39DDB',cursor:'pointer',fontFamily:'inherit'}}>{saved?'✓ Sauvegardé':'Sauvegarder tout'}</button>
        </div>
      </div>
      <div style={{fontSize:11,color:C.textMid,marginBottom:16}}>Clique sur un bot pour configurer. Sauvegardé en localStorage.</div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {bots.map((bot,idx) => {
          const isOpen = expandedId === bot.id
          const photo = BOT_PHOTOS[bot.id] || null
          return (
            <div key={bot.id} style={{background:'rgba(255,255,255,.04)',border:`1px solid ${isOpen?'#B39DDB':C.border}`,borderRadius:12,overflow:'hidden',transition:'border-color .2s'}}>
              {/* Header row — toujours visible */}
              <div style={{display:'flex',gap:12,alignItems:'center',padding:'12px 14px',cursor:'pointer'}} onClick={()=>setExpandedId(isOpen?null:bot.id)}>
                {photo
                  ? <img src={photo} alt="" style={{width:40,height:40,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>
                  : <div style={{width:40,height:40,borderRadius:'50%',background:bot.gradient,flexShrink:0}}/>
                }
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                    <span style={{fontSize:13,fontWeight:800,color:C.text}}>{bot.name}</span>
                    <span style={{fontSize:10,color:C.textMid}}>{bot.gender==='woman'?'♀':'♂'} · {bot.age} ans · {bot.neighborhood}</span>
                    <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:4}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:bot.is_available?C.green:C.textMid}}/>
                      <span style={{fontSize:10,color:bot.is_available?C.green:C.textMid,fontWeight:700}}>{bot.is_available?'Dispo':'Hors ligne'}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:C.textMid,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{bot.bio}</div>
                </div>
                <div style={{fontSize:12,color:C.textMid,transition:'transform .2s',transform:isOpen?'rotate(180deg)':'rotate(0)'}}>▼</div>
              </div>

              {/* Panel étendu */}
              {isOpen && (
                <div style={{padding:'0 14px 14px'}}>
                  <div style={{height:1,background:C.border,marginBottom:14}}/>

                  {/* Disponibilité */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Disponibilité</div>
                    <button onClick={()=>update(idx,'is_available',!bot.is_available)}
                      style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:20,border:`2px solid ${bot.is_available?C.green:C.border}`,background:bot.is_available?C.green+'22':'transparent',color:bot.is_available?C.green:C.textMid,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>
                      <div style={{width:10,height:10,borderRadius:'50%',background:bot.is_available?C.green:C.textMid,transition:'background .2s'}}/>
                      {bot.is_available?'● Disponible — cliquer pour désactiver':'○ Hors ligne — cliquer pour activer'}
                    </button>
                  </div>

                  {/* Carte position bot + Rayon */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Position sur la carte</div>
                    <BotMapPicker
                      lat={bot.lat || LAUSANNE[0]}
                      lng={bot.lng || LAUSANNE[1]}
                      onChange={(lat, lng) => { update(idx, 'lat', lat); update(idx, 'lng', lng) }}
                    />
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>Rayon : <span style={{color:'#B39DDB'}}>{bot.rayon}km</span></div>
                    <input type="range" min={1} max={30} value={bot.rayon} onChange={e=>update(idx,'rayon',parseInt(e.target.value))}
                      style={{width:'100%',accentColor:'#B39DDB'}}/>
                  </div>

                  {/* Heure fin de dispo */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Heure de fin de dispo</div>
                    <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                      {DISPO_OPTIONS.map(opt=>(
                        <button key={opt} onClick={()=>update(idx,'dispoOption',opt)}
                          style={{padding:'4px 10px',borderRadius:20,border:`1px solid ${(bot.dispoOption||'Dans 2h')===opt?'#B39DDB':C.border}`,background:(bot.dispoOption||'Dans 2h')===opt?'#B39DDB33':'transparent',color:(bot.dispoOption||'Dans 2h')===opt?'#B39DDB':C.textMid,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                          {opt}
                        </button>
                      ))}
                    </div>
                    {(bot.dispoOption==='Personnalisé') && (
                      <input type="time" value={bot.dispoCustomTime||'22:00'} onChange={e=>update(idx,'dispoCustomTime',e.target.value)}
                        style={{marginTop:6,padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:12,fontFamily:'inherit'}}/>
                    )}
                  </div>

                  {/* Bio */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>Bio</div>
                    <textarea value={bot.bio} onChange={e=>update(idx,'bio',e.target.value)} rows={2}
                      style={{width:'100%',padding:'7px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.text,fontSize:12,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box'}}/>
                  </div>

                  {/* Score fiabilité */}
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>
                      Score fiabilité : <span style={{color:bot.reliability_score>=90?C.green:bot.reliability_score>=70?C.gold:C.red}}>{bot.reliability_score}</span>
                    </div>
                    <input type="range" min={0} max={100} value={bot.reliability_score} onChange={e=>update(idx,'reliability_score',parseInt(e.target.value))}
                      style={{width:'100%',accentColor:bot.reliability_score>=90?C.green:bot.reliability_score>=70?C.gold:C.red}}/>
                    <div style={{fontSize:10,color:C.textMid,marginTop:3}}>
                      {bot.reliability_score>=90?'⭐ Très fiable':bot.reliability_score>=70?'✓ Fiable':bot.reliability_score>=50?'⚠️ Quelques annulations':'🚨 Peu fiable — annule souvent'}
                    </div>
                  </div>

                  {/* Scénario de réponse */}
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,fontWeight:700,color:C.textMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Scénario de réponse</div>
                    <div style={{display:'flex',flexDirection:'column',gap:6}}>
                      {Object.entries(SCENARIO_LABELS).map(([k,v])=>(
                        <button key={k} onClick={()=>update(idx,'scenario',k)}
                          style={{display:'flex',alignItems:'center',gap:8,padding:'7px 12px',borderRadius:10,border:`1px solid ${bot.scenario===k?'#B39DDB':C.border}`,background:bot.scenario===k?'#B39DDB22':'transparent',color:bot.scenario===k?'#B39DDB':C.textMid,fontSize:11,fontWeight:bot.scenario===k?800:500,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                          <div style={{width:8,height:8,borderRadius:'50%',background:bot.scenario===k?'#B39DDB':C.border,flexShrink:0}}/>
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bouton sauvegarder ce bot */}
                  <button onClick={save}
                    style={{width:'100%',padding:'9px',background:saved?C.green+'33':'#B39DDB22',border:`1px solid ${saved?C.green:'#B39DDB'}`,borderRadius:10,color:saved?C.green:'#B39DDB',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>
                    {saved?'✓ Sauvegardé':'Sauvegarder ce bot'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FeedbacksSection() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<string|null>(null)
  const audioRef = useRef<HTMLAudioElement|null>(null)

  const [dbError, setDbError] = useState<string|null>(null)

  useEffect(() => {
    supabase.from('user_feedbacks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (error) setDbError(error.message)
        setFeedbacks(data || [])
        setLoading(false)
      })
  }, [])

  const playAudio = (id: string, url: string) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    if (playingId === id) { setPlayingId(null); return }
    const audio = new Audio(url)
    audioRef.current = audio
    audio.play()
    setPlayingId(id)
    audio.onended = () => setPlayingId(null)
  }

  if (loading) return <div style={{color:C.textMid,padding:'20px',fontSize:13}}>Chargement feedbacks…</div>
  if (dbError) return <div style={{color:C.red,padding:'20px',fontSize:13,fontFamily:'monospace'}}>❌ Erreur DB: {dbError}</div>
  if (feedbacks.length === 0) return (
    <div style={{color:C.textMid,padding:'20px',textAlign:'center',fontSize:13}}>
      Aucun feedback reçu pour l'instant. Le bouton 💬 est dans l'app.
    </div>
  )

  return (
    <div style={{display:'flex',flexDirection:'column',gap:10}}>
      {feedbacks.map(fb => (
        <div key={fb.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{width:32,height:32,borderRadius:'50%',background:'rgba(255,191,158,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>👤</div>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.text}}>{fb.user_name || 'Anonyme'}</div>
                <div style={{fontSize:10,color:C.textMid}}>{new Date(fb.created_at).toLocaleDateString('fr-CH',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              {fb.audio_url && (
                <>
                  <button onClick={()=>playAudio(fb.id,fb.audio_url)} style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:playingId===fb.id?'rgba(255,191,158,.2)':'transparent',color:C.salmon,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                    {playingId===fb.id?'⏹ Stop':'▶ Audio'}
                  </button>
                  <a href={fb.audio_url} download style={{padding:'6px 12px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.textMid,fontSize:12,cursor:'pointer',fontFamily:'inherit',textDecoration:'none'}}>⬇</a>
                </>
              )}
            </div>
          </div>
          {fb.text && <div style={{fontSize:13,color:C.text,lineHeight:1.5,background:'rgba(255,255,255,.04)',borderRadius:8,padding:'10px 12px'}}>{fb.text}</div>}
          {!fb.text && fb.audio_url && <div style={{fontSize:12,color:C.textMid,fontStyle:'italic'}}>Audio uniquement</div>}
        </div>
      ))}
    </div>
  )
}

function EventManager() {
  const [evList, setEvList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm] = useState({
    emoji:'🎉', title:'', creator:'Clutch Officiel', certified:false,
    event_date:'', event_time:'', lieu:'', spots:10, price:'Entrée libre',
    description:'', tags:'', ev_gender:'X', bring:'',
  })

  const loadEvents = async () => {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('sort_order').order('created_at')
    setEvList(data || [])
    setLoading(false)
  }

  useEffect(() => { loadEvents() }, [])

  const resetForm = () => {
    setForm({ emoji:'🎉', title:'', creator:'Clutch Officiel', certified:false, event_date:'', event_time:'', lieu:'', spots:10, price:'Entrée libre', description:'', tags:'', ev_gender:'X', bring:'' })
  }

  const startEdit = (ev: any) => {
    setEditingId(ev.id)
    setForm({
      emoji: ev.emoji || '🎉',
      title: ev.title || '',
      creator: ev.creator || 'Clutch Officiel',
      ev_gender: ev.ev_gender || 'X',
      event_date: ev.event_date || '',
      event_time: ev.event_time || '',
      lieu: ev.lieu || '',
      spots: ev.spots || 10,
      price: ev.price || 'Entrée libre',
      bring: ev.bring || '',
      description: ev.description || '',
      tags: (ev.tags || []).join(', '),
      certified: ev.certified || false,
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      emoji: form.emoji,
      title: form.title,
      creator: form.creator,
      ev_gender: form.ev_gender,
      event_date: form.event_date,
      event_time: form.event_time,
      lieu: form.lieu,
      spots: Number(form.spots),
      price: form.price,
      bring: form.bring || null,
      description: form.description || null,
      tags: form.tags ? form.tags.split(',').map((t:string) => t.trim()).filter(Boolean) : [],
      certified: form.certified,
    }
    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId)
      setEditingId(null)
    } else {
      await supabase.from('events').insert({ ...payload, active: true, sort_order: evList.length })
    }
    resetForm()
    setShowForm(false)
    setSaving(false)
    loadEvents()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('events').update({ active: !current }).eq('id', id)
    loadEvents()
  }

  const deleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Supprimer "${title}" ?`)) return
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  const inputStyle = { background: 'rgba(255,255,255,.06)', border: `1px solid rgba(255,191,158,.2)`, borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fafafa', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const }
  const labelStyle = { fontSize: 10, fontWeight: 700, color: 'rgba(250,250,250,.5)', textTransform: 'uppercase' as const, letterSpacing: '.08em', marginBottom: 4, display: 'block' }

  return (
    <div style={{background:C.card, border:`2px solid ${C.orange}44`, borderRadius:16, padding:'20px', marginTop:24, marginBottom:16}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4}}>
        <div style={{fontSize:13, fontWeight:900, color:C.orange, letterSpacing:'.08em', textTransform:'uppercase'}}>📅 Événements</div>
        <button onClick={() => { if (showForm) { setShowForm(false); setEditingId(null); resetForm() } else { setShowForm(true) } }} style={{fontSize:11, fontWeight:700, padding:'5px 14px', borderRadius:8, background:showForm?`${C.orange}22`:'transparent', border:`1px solid ${C.orange}`, color:C.orange, cursor:'pointer', fontFamily:'inherit'}}>
          {showForm ? '✕ Annuler' : '➕ Nouvel événement'}
        </button>
      </div>
      <div style={{fontSize:11, color:C.textMid, marginBottom:16}}>Gérer les événements affichés dans /app2 · Onglet Events</div>

      {/* Formulaire création / édition */}
      {showForm && (
        <div style={{background:'rgba(255,191,158,.05)', border:`1px solid ${C.orange}33`, borderRadius:12, padding:16, marginBottom:16}}>
          <div style={{fontSize:12, fontWeight:800, color:C.orange, marginBottom:12}}>
            {editingId ? '✏️ Modifier l\'événement' : '➕ Nouvel événement'}
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
            <div><label style={labelStyle}>Emoji</label><input value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} style={{...inputStyle,width:80}} /></div>
            <div style={{gridColumn:'1 / -1'}}><label style={labelStyle}>Titre *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Yoga au lever du soleil..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Créateur</label><input value={form.creator} onChange={e=>setForm(f=>({...f,creator:e.target.value}))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Genre événement</label>
              <select value={form.ev_gender} onChange={e=>setForm(f=>({...f,ev_gender:e.target.value}))} style={{...inputStyle}}>
                <option value="X">◇ Mixte (X)</option>
                <option value="F">♀ Femmes (F)</option>
                <option value="M">♂ Hommes (M)</option>
              </select>
            </div>
            <div><label style={labelStyle}>Date (ex: "Ce soir", "Sam 14 juin")</label><input value={form.event_date} onChange={e=>setForm(f=>({...f,event_date:e.target.value}))} placeholder="Ce soir" style={inputStyle} /></div>
            <div><label style={labelStyle}>Heure (HH:MM)</label><input value={form.event_time} onChange={e=>setForm(f=>({...f,event_time:e.target.value}))} placeholder="19:30" style={inputStyle} /></div>
            <div style={{gridColumn:'1 / -1'}}><label style={labelStyle}>Lieu</label><input value={form.lieu} onChange={e=>setForm(f=>({...f,lieu:e.target.value}))} placeholder="MAD Club, Lausanne" style={inputStyle} /></div>
            <div><label style={labelStyle}>Places</label><input type="number" value={form.spots} onChange={e=>setForm(f=>({...f,spots:+e.target.value}))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Prix</label><input value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="Entrée libre / 15 CHF" style={inputStyle} /></div>
            <div style={{gridColumn:'1 / -1'}}><label style={labelStyle}>Apporter</label><input value={form.bring} onChange={e=>setForm(f=>({...f,bring:e.target.value}))} placeholder="Tapis de yoga · Serviette" style={inputStyle} /></div>
            <div style={{gridColumn:'1 / -1'}}><label style={labelStyle}>Description</label><textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="Description de l'événement..." style={{...inputStyle, resize:'vertical'}} /></div>
            <div style={{gridColumn:'1 / -1'}}><label style={labelStyle}>Tags (virgule-séparés)</label><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="sport, yoga, plein air" style={inputStyle} /></div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <input type="checkbox" id="certified_check" checked={form.certified} onChange={e=>setForm(f=>({...f,certified:e.target.checked}))} />
              <label htmlFor="certified_check" style={{...labelStyle, marginBottom:0, cursor:'pointer'}}>Certifié ✓</label>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button onClick={handleSubmit} disabled={saving || !form.title.trim()} style={{background:C.orange, color:'#fff', border:'none', borderRadius:10, padding:'10px 24px', fontSize:13, fontWeight:800, cursor:'pointer', fontFamily:'inherit', opacity: saving||!form.title.trim()?0.5:1}}>
              {saving ? '⏳ Sauvegarde...' : editingId ? '💾 Sauvegarder les modifications' : '➕ Créer l\'événement'}
            </button>
            <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} style={{background:'transparent', color:C.textMid, border:`1px solid ${C.border}`, borderRadius:10, padding:'10px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit'}}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste events */}
      {loading ? (
        <div style={{textAlign:'center', padding:'20px', color:C.textMid, fontSize:12}}>⏳ Chargement...</div>
      ) : evList.length === 0 ? (
        <div style={{textAlign:'center', padding:'20px', color:C.textMid, fontSize:12}}>Aucun événement · La table est vide ou le schéma n'est pas encore appliqué.</div>
      ) : (
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          {evList.map(ev => (
            <div key={ev.id} style={{display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background: editingId===ev.id ? `${C.orange}11` : 'rgba(255,255,255,.04)', border:`1px solid ${editingId===ev.id ? C.orange : ev.active?C.orange+'33':C.border}`, borderRadius:10}}>
              <span style={{fontSize:22, flexShrink:0}}>{ev.emoji || '🎉'}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12, fontWeight:800, color: ev.active?C.text:C.textMid}}>{ev.title}</div>
                <div style={{fontSize:10, color:C.textMid, marginTop:2}}>
                  {ev.event_date && <span>{ev.event_date} · </span>}
                  {ev.event_time && <span>{ev.event_time} · </span>}
                  {ev.lieu && <span>{ev.lieu.split(',')[0]} · </span>}
                  <span>{ev.taken||0}/{ev.spots||0} inscrits · </span>
                  <span style={{color:ev.ev_gender==='F'?C.pink:ev.ev_gender==='M'?C.blue:C.purple}}>{ev.ev_gender||'X'}</span>
                </div>
              </div>
              {ev.certified && <span style={{fontSize:9, background:`${C.orange}22`, color:C.orange, border:`1px solid ${C.orange}44`, borderRadius:6, padding:'1px 5px', fontWeight:800, flexShrink:0}}>✓</span>}
              <button onClick={() => startEdit(ev)} style={{fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:7, background: editingId===ev.id ? `${C.orange}33` : 'transparent', border:`1px solid ${editingId===ev.id ? C.orange : C.border}`, color: editingId===ev.id ? C.orange : C.textMid, cursor:'pointer', fontFamily:'inherit', flexShrink:0}}>
                ✏️ Modifier
              </button>
              <button onClick={() => toggleActive(ev.id, ev.active)} style={{fontSize:10, fontWeight:700, padding:'4px 10px', borderRadius:7, background:ev.active?`${C.green}22`:'rgba(255,255,255,.05)', border:`1px solid ${ev.active?C.green:C.border}`, color:ev.active?C.green:C.textMid, cursor:'pointer', fontFamily:'inherit', flexShrink:0}}>
                {ev.active ? '✓ Actif' : '○ Inactif'}
              </button>
              <button onClick={() => deleteEvent(ev.id, ev.title)} style={{fontSize:12, fontWeight:700, padding:'4px 8px', borderRadius:7, background:'transparent', border:`1px solid ${C.border}`, color:C.red, cursor:'pointer', fontFamily:'inherit', flexShrink:0}}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function HQ() {
  const [unlocked, setUnlocked] = useState(false)
  const [tab, setTab] = useState<Tab>('timeline')
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [auditFilter, setAuditFilter] = useState<Severity | 'all'>('all')
  const [openFeedbacks, setOpenFeedbacks] = useState(true)
  useEffect(() => { try { if (localStorage.getItem('hq_ok') === '1') setUnlocked(true) } catch(e) {} }, [])
  if (!unlocked) return <Lock onUnlock={() => setUnlocked(true)} />

  const pct = Math.round((stats.done / stats.total) * 100)
  const auditTotal = audit.flatMap(a => a.items).length
  const criticalCount = audit.flatMap(a => a.items).filter(i => i.severity === 'critical').length

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', padding: '40px 20px 80px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.05em' }}>
              <span style={{color:C.salmon}}>CLU</span><span style={{ color: C.orange }}>TCH</span>
            </div>
            <div style={{ background: '#1a1a1a', border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', fontSize: 11, color: C.textMid, fontWeight: 700, letterSpacing: '0.1em' }}>
              QG · ÉQUIPE
            </div>
          </div>
          <p style={{ color: C.textMid, fontSize: 14 }}>Tableau de bord interne — David & Mel · Confidentiel 🔒</p>
          <a href="/" style={{ display:'inline-block', marginTop:8, fontSize:12, color:C.textMid, textDecoration:'none', border:`1px solid ${C.border}`, borderRadius:8, padding:'4px 12px' }}>← Accueil</a>
        </div>

        {/* DANGER BANNER */}
        <DangerBanner />

        {/* ── Section Feedbacks ── */}
        <section style={{marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,cursor:'pointer'}}
            onClick={()=>setOpenFeedbacks(v=>!v)}>
            <h2 style={{fontSize:16,fontWeight:800,color:C.salmon,margin:0}}>💬 Feedbacks utilisateurs</h2>
            <span style={{color:C.textMid,fontSize:14}}>{openFeedbacks?'▲':'▼'}</span>
          </div>
          {openFeedbacks && <FeedbacksSection/>}
        </section>

        {/* Pages rapides */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.textMid, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>🔗 Toutes les pages</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {pages.map(p => (
              <a key={p.href} href={p.href} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px 16px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = p.color)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>{p.label}</div>
                <div style={{ fontSize: 11, color: C.textMid }}>{p.desc}</div>
                <div style={{ fontSize: 11, color: p.color, marginTop: 6, fontFamily: 'monospace' }}>/{p.href === '/' ? '' : p.href.slice(1)}</div>
              </a>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>Avancement global</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {criticalCount > 0 && <span style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>⚠️ {criticalCount} critiques</span>}
              <span style={{ fontWeight: 900, fontSize: 28, color: pct > 60 ? C.sage : C.gold }}>{pct}%</span>
            </div>
          </div>
          <div style={{ height: 8, background: '#222', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.primary}, ${C.gold})`, borderRadius: 4, transition: 'width 0.6s' }} />
          </div>
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span style={{ color: '#4ade80' }}>✅ {stats.done} faits</span>
            <span style={{ color: C.textMid }}>📋 {stats.total - stats.done} restants · {stats.total} total</span>
            <span style={{ color: '#f87171' }}>🐛 {auditTotal} points d'audit</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: '#111', borderRadius: 12, padding: 4, width: 'fit-content', flexWrap:'wrap' }}>
          {([['timeline', '📅 Plan'], ['todo', '📋 Roadmap'], ['audit', '🔍 Audit'], ['design', '🎨 Design'], ['vision', '✦ Vision'], ['questions', '❓ Questions'], ['principes', '📐 Principes']] as const).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: tab === t ? C.card : 'transparent',
              color: tab === t ? C.text : C.textMid,
              fontSize: 13, fontWeight: 700,
              boxShadow: tab === t ? `0 1px 4px rgba(0,0,0,0.4)` : 'none',
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── TIMELINE TAB ── */}
        {tab === 'timeline' && (
          <>
            {/* Estimation de faisabilité */}
            <div style={{ background:'linear-gradient(135deg, #0a1a0a, #0d1f0d)', border:'1px solid #1a3a1a', borderRadius:16, padding:24, marginBottom:28 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#4ade80', marginBottom:12 }}>⚡ ESTIMATION DE FAISABILITÉ — Scénario "à fond"</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
                {[
                  { label: 'App Store iOS', val: '8 semaines', color:'#4ade80', note:'si on commence maintenant' },
                  { label: 'Beta TestFlight', val: '4 semaines', color:'#f59e0b', note:'50 testeurs Lausanne' },
                  { label: 'Lancement public', val: '16 semaines', color:'#60a5fa', note:'Lausanne seulement' },
                ].map(s => (
                  <div key={s.label} style={{ background:'#2A0F22', borderRadius:12, padding:'16px', textAlign:'center' }}>
                    <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.text, marginTop:4 }}>{s.label}</div>
                    <div style={{ fontSize:10, color:C.textMid, marginTop:2 }}>{s.note}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize:12, color:'#666', margin:0 }}>
                ⚠ Hypothèses : David disponible ~10h/semaine · Claude dev full-time · Mel fait les assets quand demandé · Pas de blocage Apple review · Apple Developer account créé cette semaine
              </p>
            </div>

            {/* Timeline phases */}
            {timeline.map((phase, pi) => (
              <div key={pi} style={{ marginBottom:24, position:'relative' }}>
                {/* Ligne verticale */}
                {pi < timeline.length - 1 && (
                  <div style={{ position:'absolute', left:20, top:'100%', width:2, height:24, background:`linear-gradient(${phase.color}, ${timeline[pi+1].color})` }} />
                )}

                <div style={{ border:`1px solid ${phase.color}44`, borderRadius:16, overflow:'hidden' }}>
                  {/* Header phase */}
                  <div style={{ background:`${phase.color}15`, padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:800, color:phase.color }}>{phase.phase}</div>
                      <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>{phase.date}</div>
                    </div>
                    {phase.urgent && (
                      <div style={{ background:'#ef4444', color:'#fff', borderRadius:8, padding:'4px 10px', fontSize:11, fontWeight:800 }}>⚡ URGENT</div>
                    )}
                  </div>

                  {/* Tasks */}
                  <div style={{ background:C.card }}>
                    {phase.tasks.map((t, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 20px', borderTop:'1px solid #1a1a1a' }}>
                        <span style={{ fontSize:16, flexShrink:0 }}>{t.done ? '✅' : t.critical ? '🔴' : '⬜'}</span>
                        <span style={{ fontSize:13, color: t.done ? '#666' : t.critical ? '#fca5a5' : C.text, textDecoration: t.done ? 'line-through' : 'none', flex:1 }}>{t.label}</span>
                        {t.critical && !t.done && <span style={{ fontSize:10, background:'#450a0a', color:'#f87171', borderRadius:4, padding:'2px 6px', fontWeight:700, flexShrink:0 }}>CRITIQUE</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Capacitor expliqué */}
            <div style={{ background:'linear-gradient(135deg, #0a0a1a, #0d0d2a)', border:'1px solid #2a2a5a', borderRadius:16, padding:24, marginTop:8 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#818cf8', marginBottom:12 }}>📲 C'EST QUOI CAPACITOR ? (en français simple)</div>
              <p style={{ fontSize:13, color:'#ccc', lineHeight:1.8, margin:'0 0 12px' }}>
                Capacitor = une coquille native iOS/Android qui <strong>enveloppe ton app web React</strong> et la fait passer pour une vraie app native. Résultat : tu télécharges <strong>la même app</strong> depuis l'App Store qu'on utilise dans le navigateur aujourd'hui.
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                {[
                  { icon:'🔁', label:'Code React = identique', desc:'Pas de réécriture. 100% du code actuel réutilisé.' },
                  { icon:'📲', label:'App Store téléchargeable', desc:'Vraie icône sur l\'écran d\'accueil, pas un raccourci.' },
                  { icon:'🔔', label:'Push notifications native', desc:'Plus fiables qu\'en version web. iOS les affiche même app fermée.' },
                  { icon:'📍', label:'GPS + Caméra natifs', desc:'Accès hardware direct = plus rapide, plus précis, mieux autorisé.' },
                ].map(f => (
                  <div key={f.label} style={{ background:'#2A0F22', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:16, marginBottom:4 }}>{f.icon}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#818cf8' }}>{f.label}</div>
                    <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'#111', borderRadius:8, padding:'10px 14px', fontFamily:'monospace', fontSize:12, color:'#4ade80' }}>
                <div style={{ color:'#666', marginBottom:4 }}># Commandes pour lancer l'app sur iPhone (une fois Xcode installé)</div>
                <div>cd /Users/uzic/Documents/clutch</div>
                <div>npm run build &amp;&amp; npx cap sync</div>
                <div>npx cap open ios</div>
                <div style={{ color:'#666', marginTop:4 }}># → Xcode s'ouvre → Run sur iPhone physique</div>
              </div>
            </div>
          </>
        )}

        {/* ── ROADMAP TAB ── */}
        {tab === 'todo' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['all', 'done', 'in-progress', 'todo', 'blocked'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filter === f ? C.primary : '#1a1a1a',
                  color: filter === f ? '#fff' : C.textMid,
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
                }}>
                  {f === 'all' ? 'Tout' : statusStyle[f].label}
                </button>
              ))}
            </div>
            {tasks.map(cat => {
              const visible = cat.items.filter(i => filter === 'all' || i.status === filter)
              if (visible.length === 0) return null
              return (
                <div key={cat.cat} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {cat.emoji} {cat.cat}
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {visible.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: statusStyle[item.status].bg, color: statusStyle[item.status].color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {statusStyle[item.status].label}
                        </span>
                        <span style={{ fontSize: 14, color: item.status === 'done' ? C.textMid : C.text, textDecoration: item.status === 'done' ? 'line-through' : 'none', flex: 1 }}>
                          {item.label}
                        </span>
                        {item.note && <span style={{ fontSize: 11, color: C.textMid, flexShrink: 0 }}>{item.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── AUDIT TAB ── */}
        {tab === 'audit' && (
          <>
            <div style={{ background: '#1a0a00', border: '1px solid #3a1500', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {(['critical', 'high', 'medium', 'low'] as const).map(s => {
                const n = audit.flatMap(a => a.items).filter(i => i.severity === s).length
                return (
                  <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: severityStyle[s].bg, color: severityStyle[s].color, fontWeight: 700 }}>{severityStyle[s].label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: severityStyle[s].color }}>{n}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
                <button key={f} onClick={() => setAuditFilter(f)} style={{
                  padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: auditFilter === f ? C.primary : '#1a1a1a',
                  color: auditFilter === f ? '#fff' : C.textMid,
                  fontSize: 12, fontWeight: 600, fontFamily: 'inherit'
                }}>
                  {f === 'all' ? 'Tout' : severityStyle[f].label}
                </button>
              ))}
            </div>
            {audit.map(cat => {
              const visible = cat.items.filter(i => auditFilter === 'all' || i.severity === auditFilter)
              if (visible.length === 0) return null
              return (
                <div key={cat.cat} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {cat.emoji} {cat.cat}
                  </div>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                    {visible.map((item, i) => (
                      <div key={i} style={{ padding: '14px 16px', borderBottom: i < visible.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: severityStyle[item.severity].bg, color: severityStyle[item.severity].color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 1 }}>
                            {severityStyle[item.severity].label}
                          </span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, color: C.text, marginBottom: item.fix || item.note ? 6 : 0 }}>{item.label}</div>
                            {item.note && <div style={{ fontSize: 12, color: C.textMid, fontStyle: 'italic' }}>ℹ️ {item.note}</div>}
                            {item.fix && <div style={{ fontSize: 12, color: '#60a5fa' }}>→ {item.fix}</div>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* ── DESIGN TAB ── */}
        {tab === 'design' && (
          <>
            <div style={{ background: '#0a0a1a', border: '1px solid #1a1a3a', borderRadius: 12, padding: '14px 18px', marginBottom: 24 }}>
              <p style={{ color: '#818cf8', fontSize: 13, fontWeight: 700, margin:'0 0 10px' }}>🎨 Palette officielle Clutch (Mel)</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { name: 'Bordeaux', hex: '#542A44' },
                  { name: 'Saumon', hex: '#FFBF9E' },
                  { name: 'Orange sable', hex: '#E27C00' },
                  { name: 'Fond nuit', hex: '#1A0E14' },
                ].map(c => (
                  <div key={c.hex} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3D1A33', borderRadius: 8, padding: '6px 10px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: 4, background: c.hex, border: '1px solid rgba(255,255,255,0.1)' }}/>
                    <div>
                      <div style={{ fontSize: 11, color: C.text, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: C.textMid, fontFamily: 'monospace' }}>{c.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {design.map(cat => (
              <div key={cat.cat} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textMid, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                  {cat.emoji} {cat.cat}
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
                  {cat.items.map((item, i) => {
                    const s = item.status === 'done' ? { bg: '#14532d', color: '#4ade80', label: '✅ Fait' }
                            : item.status === 'review' ? { bg: '#1c1917', color: '#f59e0b', label: '👀 À revoir' }
                            : { bg: '#1e1b4b', color: '#818cf8', label: '📋 À faire' }
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < cat.items.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: s.bg, color: s.color, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{s.label}</span>
                        <span style={{ fontSize: 14, color: item.status === 'done' ? C.textMid : C.text, textDecoration: item.status === 'done' ? 'line-through' : 'none', flex: 1 }}>{item.label}</span>
                        {item.note && <span style={{ fontSize: 11, color: C.textMid, flexShrink: 0 }}>{item.note}</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── VISION TAB ── */}
        {tab === 'vision' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #1a1200, #0d0a00)', border: '1px solid #3a2a00', borderRadius: 16, padding: '20px 24px', marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#D4A853', marginBottom: 8 }}>✦ VISION STRATÉGIQUE — Juin 2026</div>
              <p style={{ fontSize: 13, color: '#999', lineHeight: 1.7, margin: '0 0 12px' }}>Boussole produit — identité, design, architecture, risques, roadmap. À lire avant toute décision.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap:'wrap' }}>
                <a href="/audit" style={{ background: '#D4A853', color: '#000', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>→ Audit PDF complet</a>
                <a href="/mel" style={{ background: '#1a1a1a', color: '#2DBD7E', border: '1px solid #2DBD7E', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>→ Guide test Mel</a>
              </div>
            </div>
            {visionSections.map(section => (
              <div key={section.id} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>{section.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: section.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{section.title}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {section.content.map((item, i) => (
                    <details key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: i === 0 ? '12px 12px 4px 4px' : i === section.content.length - 1 ? '4px 4px 12px 12px' : '4px', overflow: 'hidden' }}>
                      <summary style={{ padding: '14px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: C.text, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                        <span>{item.q}</span>
                        <span style={{ fontSize: 12, color: C.textMid, flexShrink: 0, marginLeft: 12 }}>▼</span>
                      </summary>
                      <div style={{ padding: '0 18px 16px', borderTop: `1px solid ${C.border}` }}>
                        {item.a.split('\n').map((line, j) => (
                          <p key={j} style={{ fontSize: 13, color: line.startsWith('•') || line.startsWith('→') ? '#ccc' : C.textMid, lineHeight: 1.7, marginTop: j === 0 ? 12 : 4, fontWeight: line.startsWith('→') ? 600 : 400 }}>
                            {line}
                          </p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── QUESTIONS OUVERTES — toutes les problématiques non résolues ── */}
        {tab === 'questions' && (
          <div>
            <div style={{background:'#1a0011',border:'1px solid #5a1040',borderRadius:12,padding:'14px 18px',marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:800,color:C.salmon,marginBottom:6}}>❓ Questions Ouvertes — Clutch v10.06-W</div>
              <div style={{fontSize:12,color:C.textMid,lineHeight:1.6}}>
                Toutes les questions stratégiques, produit et techniques non encore résolues. À traiter ensemble David + Mel.
                Mise à jour : <strong style={{color:C.text}}>10.06.2026</strong>
              </div>
            </div>
            {([
              {
                cat:'🔒 Sécurité & Sécurité femmes', color:C.red,
                questions:[
                  {q:'Saturation des femmes par les Clutchs', urgence:'🔴 CRITIQUE', detail:'Une femme populaire peut recevoir des dizaines de Clutchs par jour. La saturation = abandon de l\'app. Options : limite N Clutchs reçus/jour (ex: 10 max) ? File d\'attente ? Priorité par score de fiabilité ? À décider avant launch.', decision:'❌ Non décidé'},
                  {q:'Anti-harcèlement : que faire après un refus ?', urgence:'🔴 CRITIQUE', detail:'Si A refuse le Clutch de B, est-ce que B peut reclutcher A immédiatement ? Proposé : cooldown 72h entre deux Clutchs vers la même personne. Bloquer = permanent. Signaler = review manuelle.', decision:'❌ Non décidé'},
                  {q:'Confirmation QR code ou GPS ?', urgence:'🟠 Haute', detail:'Comment confirmer que le RDV a eu lieu ? Options : (1) GPS auto-confirmation quand les deux sont à <50m au moment du RDV (2) QR code que chacun scanne sur place (3) Les deux doivent cliquer "J\'y suis". Option GPS = objectif mais nécessite consentement explicite. QR code = friction mais certitude. Décision technique à prendre avant launch.', decision:'❌ Non décidé'},
                  {q:'Abonnements Bien-être : risque gourous', urgence:'🟠 Haute', detail:'La catégorie "Bien-être" peut être détournée par des vendeurs de soins pseudo-médicaux, ésotériques ou sectes. Solution proposée : "Bien-être" uniquement pour activités physiques reconnues (yoga, méditation, marche). Interdire toute mention de soins, thérapies, guérisons. Modération à la création. Signalement facilité.', decision:'❌ Non décidé'},
                ]
              },
              {
                cat:'⚡ Produit & Expérience', color:C.orange,
                questions:[
                  {q:'"Surprise moi" — système de notation interne d\'originalité', urgence:'🟡 Moyenne', detail:'"Surprise moi" dans les activités = l\'utilisateur veut quelque chose d\'inattendu (parapente, traversée du lac, événement insolite). IDÉE INTERNE : l\'équipe Clutch devrait noter les événements sur une échelle d\'originalité (1–5) en interne, invisible pour le public. Un événement "Surprise moi" = uniquement les événements avec score originalité ≥ 4. Exemples éligibles : traversée du lac à la nage, pique-nique au château, session d\'impro théâtre, visite des toits de Lausanne. Exemples non-éligibles : café classique, apéro standard. Ce scoring est manuel au début, automatisable ensuite.', decision:'💡 Idée à valider — implémenter dans le dashboard créateur (v2)'},
                  {q:'Couverture des activités : est-ce que 13 options suffisent ?', urgence:'🟡 Moyenne', detail:'Activités actuelles : Café, Apéro, Dîner, Balade, Culture, Sport, Concert, Jeux, Photo, Yoga, Bien-être, Resto, Surprise moi. RÈGLE ABSOLUE : ne jamais filtrer trop → max de gens visibles les uns des autres. Checklist pour vérifier : (1) Activités sportives : Sport + Yoga + Balade = ok. (2) Nourriture/boisson : Café + Apéro + Dîner + Resto = ok (Café vs Resto = nuance utile). (3) Culture/Arts : Culture + Concert + Photo = ok. (4) Jeux/Divertissement : Jeux = ok mais manque cinéma/escape game/bowling ? À surveiller. (5) Bien-être : yoga + bien-être = ok mais attention aux dérives (voir Q sécurité). RECOMMANDATION : garder 13 max, ne pas fragmenter. Mieux vaut "Sport" large que 10 sous-catégories sport.', decision:'💡 13 options = bonne limite. Surveiller si les users demandent des ajouts spécifiques en beta.'},
                  {q:'Carte événements (pas carte personnes)', urgence:'🟢 Basse', detail:'Idée : une carte Leaflet qui affiche uniquement les événements (pas les personnes, jamais). Les événements ont un lieu précis et public (café, parc, club). Les personnes n\'ont jamais de position visible. Avantage : fun, visuel, encourage à s\'inscrire. Pas de risque GPS car les lieux d\'événements sont publics. À implémenter dans l\'onglet Événements : toggle "Vue carte / Vue liste". Feature non-critique pour le MVP mais belle pour la démo.', decision:'📋 Phase 2 — belle feature pour la démo investisseurs'},
                  {q:'Mode Activité vs Mode Amitié : les créateurs d\'événements (yoga Anaïs)', urgence:'🟠 Haute', detail:'Si Anaïs organise du yoga, est-ce "Amitié" ou "Activité" ? Risque de niche : si on crée un mode "Activité" séparé, les gens qui cherchent du yoga ne voient que du yoga. Proposition : garder "Amitié" large (inclut sorties, activités, randos, yoga) ET filtrer par activité souhaitée séparément. Ne pas fragmenter le mode = plus de visibilité pour tout le monde.', decision:'💡 Proposition : Amitié = large, activité = filtre secondaire optionnel'},
                  {q:'Tranches d\'âge précises (ex: 23–27 ans)', urgence:'🟡 Moyenne', detail:'Actuellement : tranches fixes 18-25 / 25-35 / 35-45 / 45+. Le user veut parfois 23-27. Options : (1) Garder les tranches (plus simple, moins niche) (2) Slider âge min/max custom (flexible mais niche) (3) Multi-select des tranches fixes (en place). Recommandation : garder multi-select des tranches — si quelqu\'un veut 23-27, il coche 18-25 ET 25-35.', decision:'💡 Multi-select tranches = bonne approche, noter comme "assez bien"'},
                  {q:'Genre "Peu importe" = inclut non-binaire ?', urgence:'🟡 Moyenne', detail:'"Peu importe" dans la recherche = voir F + M + X. Déjà implémenté. Mais est-ce qu\'on garde 3 genres ou on en ajoute ? Proposé : F / M / X (non-binaire) / Peu importe. Pas de genre "autre" — trop de fragmentation. X = non-binaire, genderfluid, agender, etc.', decision:'✅ Décidé : F/M/X/Peu importe. X = umbrella non-binaire.'},
                  {q:'Rappels Clutch : fréquence et timing', urgence:'🟡 Moyenne', detail:'Un Clutch expire en 2h. Rappels proposés : -90min, -60min, -30min. Mais ça fait 3 notifs en 2h = potentiellement envahissant. Alternative : 1 seul rappel à 30min. Ou : à 90min + à 15min. À tester avec users beta. Format : toast in-app + push notification.', decision:'❌ Non décidé — tester en beta'},
                  {q:'Mode Parent : visible si "Tous" est sélectionné ?', urgence:'🟡 Moyenne', detail:'Un parent qui met "mode parent" doit-il apparaître dans la recherche "Tous" d\'une personne sans enfants ? Prob : quelqu\'un sans enfants peut trouver ça bizarre. Solution : mode parent = opt-in visible UNIQUEMENT si l\'autre cherche aussi des parents OU a coché "peu importe". Sinon : invisible. Décision à prendre.', decision:'❌ Non décidé'},
                  {q:'Commentaires créateurs d\'événements : système doux', urgence:'🟡 Moyenne', detail:'Pas d\'étoiles classiques (1-5) — trop agressif, malveillance possible. Proposé : mots-clés positifs prédéfinis que les participants peuvent cocher ("bonne ambiance", "organisé·e", "reviendrai"). Pas de commentaires libres. Pas de notes négatives. Résultat visible = nuage de mots-clés positifs + nombre de participants. Créateur peut répondre 1 fois.', decision:'💡 Proposition soft ratings — à valider avec Mel'},
                  {q:'Favoris et bloqués depuis la liste Présences', urgence:'🟢 Basse', detail:'Actuellement : cliquer un profil → ouvre SendModal directement. V10.06-T : cliquer → fiche profil → Clutcher / ⭐ Favori / Signaler. Le bouton "Bloquer" doit être formulé doucemment — ex: "Cette personne vous importune ?" → oui = bloqué silencieusement.', decision:'✅ Implémenté en v10.06-W'},
                ]
              },
              {
                cat:'🌍 Scalabilité & Business', color:C.purple,
                questions:[
                  {q:'Traduction EN : quand et comment ?', urgence:'🟡 Moyenne', detail:'Clutch = app suisse romande maintenant. Mais scalable internationalement. Vocabulaire propriétaire (Clutch, Verrou, Fenêtre) = garder en français même en version EN ? Ou traduire tout ? Proposé : garder "Clutch" comme nom propre (comme Tinder, Bumble). "Verrou" = "Lock" en EN. "Fenêtre" = "Window". À noter dans le code : i18n-ready, mais PAS encore à implémenter.', decision:'📋 À faire : Phase 2 (après beta)'},
                  {q:'Mode Activité créateurs certifiés : nom officiel ?', urgence:'🟢 Basse', detail:'Les créateurs d\'événements réguliers (yoga Anaïs) = "Créateur d\'activité" (terme actuel) ou autre ? Écosystème prévu : Utilisateur normal → Certifié (vérif identité) → Créateur d\'activité (badge) → Partenaire (établissement). Noms à finaliser avec Mel.', decision:'📋 À finaliser avec Mel'},
                  {q:'Modèle premium : les hommes premium voient-ils les profils sans être disponibles ?', urgence:'🟠 Haute', detail:'Actuellement : hommes DOIVENT se mettre disponibles pour voir Discover. Premium = browsing sans être dispo. RISQUE : profils voyeurs qui ne viennent jamais. Compteur ? Limite browsing sans dispo = 50 profils/jour même en premium ? À décider.', decision:'❌ Non décidé — à discuter'},
                  {q:'Alerte distance : position RDV très loin du GPS réel', urgence:'🟡 Moyenne', detail:'La carte Page 1 permet de placer l\'épingle n\'importe où (ex: être à Genève et se mettre dispo pour Lausanne). C\'est voulu (design goal). MAIS si l\'écart est > 80km environ, on devrait afficher une bannière douce : "📍 Tu te mets dispo à X — Es-tu sûr·e de pouvoir y être à temps ?" avec confirmation. Objectif : améliorer le taux de réalisation des RDV, pas bloquer. Calcul : distance euclidienne entre GPS réel et position épingle → si > seuil (80km ?) → bannière.', decision:'📋 À implémenter · UX importante pour crédibilité'},
                  {q:'Feature premium : alertes profils inactifs', urgence:'🟢 Basse', detail:'Un utilisateur premium pourrait "suivre" jusqu\'à 5 profils inactifs et être notifié quand ils se remettent disponibles. IMPORTANT LÉGAL : consentement explicite obligatoire. La personne qui revient doit savoir qu\'elle peut être tracée par des abonnés premium. À mettre dans les CGU + case à cocher au moment de l\'opt-in. Format : "⭐ Notifier quand [nom] se remet disponible" → push notification uniquement, pas visible sur la carte.', decision:'📋 Phase 2 — à valider avec Mel + légal LPD'},
                ]
              },
            ] as const).map((section,si)=>(
              <div key={si} style={{marginBottom:28}}>
                <div style={{fontSize:13,fontWeight:800,color:section.color,letterSpacing:'.06em',textTransform:'uppercase',marginBottom:12}}>{section.cat}</div>
                <div style={{display:'flex',flexDirection:'column',gap:4}}>
                  {section.questions.map((q,qi)=>(
                    <details key={qi} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:qi===0?'12px 12px 4px 4px':qi===section.questions.length-1?'4px 4px 12px 12px':'4px',overflow:'hidden'}}>
                      <summary style={{padding:'14px 18px',cursor:'pointer',fontSize:13,fontWeight:700,color:C.text,listStyle:'none',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,userSelect:'none'}}>
                        <span style={{flex:1}}>{q.q}</span>
                        <div style={{display:'flex',gap:6,flexShrink:0,alignItems:'center'}}>
                          <span style={{fontSize:10,padding:'2px 6px',borderRadius:6,background:'rgba(255,255,255,.05)',color:C.textMid}}>{q.urgence}</span>
                          <span style={{fontSize:12,color:C.textMid}}>▼</span>
                        </div>
                      </summary>
                      <div style={{padding:'0 18px 16px',borderTop:`1px solid ${C.border}`}}>
                        <p style={{fontSize:12,color:'#bbb',lineHeight:1.7,marginTop:12,marginBottom:8}}>{q.detail}</p>
                        <div style={{background:'rgba(255,255,255,.04)',borderRadius:8,padding:'8px 12px',fontSize:12,color:q.decision.startsWith('✅')?C.green:q.decision.startsWith('💡')?C.orange:q.decision.startsWith('📋')?'#818cf8':C.red,fontWeight:700}}>
                          {q.decision}
                        </div>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── PRINCIPES TAB ── */}
        {tab === 'principes' && (
          <div>
            <div style={{background:'#0d1a0d',border:'1px solid #2d5a2d',borderRadius:12,padding:'14px 18px',marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:800,color:'#6ee76e',marginBottom:6}}>📐 Les Règles Internes de Clutch</div>
              <div style={{fontSize:12,color:C.textMid,lineHeight:1.6}}>Ce que Claude garde en mémoire à chaque fois qu'il code quelque chose pour Clutch. En français, sans jargon technique.</div>
            </div>
            {([
              {
                emoji:'🎯', title:'L\'âme de Clutch', color:'#FFBF9E',
                rules:[
                  'Clutch n\'est PAS Tinder. Chaque décision doit mener à un vrai RDV en 18h max. Si une feature rend l\'app plus confortable depuis son canapé sans rencontrer personne, c\'est un dark pattern.',
                  'La friction vers le RDV est une feature, pas un bug. Limiter les messages, forcer l\'action, clock visible = voulu.',
                  'Vocabulaire obligatoire : Clutch / Verrou / Fenêtre / Rendez-vous. Jamais "match", "swipe", "like" — c\'est la promesse différenciante.',
                  'La fenêtre de 18h est structurelle. On ne l\'étire jamais.',
                ]
              },
              {
                emoji:'♀', title:'Les femmes sont le cœur de l\'app', color:'#FF6B9D',
                rules:[
                  'Sans femmes, les hommes partent. C\'est une loi, pas une hypothèse.',
                  'Gratuité totale pour les femmes = permanente. On ne remet jamais ça en question.',
                  'À chaque feature, on se demande : "Est-ce qu\'une femme de 23 ans à Lausanne, seule le soir, se sent en sécurité et à l\'aise ?"',
                  'La friction pour les hommes peut être utile (sécurité des femmes). La friction pour les femmes est toujours à supprimer.',
                  'Hommes premium = peuvent browsser sans être disponibles. C\'est un compromis business OK, mais limité pour éviter les voyeurs.',
                ]
              },
              {
                emoji:'🚨', title:'Sécurité — pensée malveillante obligatoire', color:'#ef4444',
                rules:[
                  'À chaque feature, on se pose ces questions : "Que fait un homme qui veut harceler une femme avec ça ?" · "Que fait quelqu\'un qui crée 50 faux comptes ?" · "Que fait quelqu\'un qui veut extraire les positions GPS de tout le monde ?"',
                  'GPS = jamais la vraie position. Les étoiles sur la carte sont floues (50m d\'offset aléatoire mais stable par userId). On stocke uniquement la ville/quartier, jamais lat/lng exacte.',
                  'Si la réponse à une question de sécurité est "rien ne l\'en empêche" → on bloque avant de coder.',
                  'Le bouton "Bloquer" ne s\'appelle pas "Bloquer" — il dit "Cette personne vous importune ?" Le blocage est discret et silencieux.',
                ]
              },
              {
                emoji:'📱', title:'Toujours penser à l\'App Store', color:'#4FC3F7',
                rules:[
                  'Chaque ligne de code doit fonctionner sur iPhone via Capacitor. On n\'utilise pas de features web-only si Capacitor a un plugin équivalent.',
                  'iOS Safari a des règles : position:fixed pour le cadre · minHeight:0 sur tous les flex scrollables · -webkit-overflow-scrolling:touch. Sans ça, l\'app freeze sur iPhone.',
                  'Chemin vers l\'App Store : OneSignal push (fait) → Capacitor natif → Apple Developer $99/an → App Store public.',
                ]
              },
              {
                emoji:'👁', title:'Max de visibilité — ne jamais trop filtrer', color:'#E27C00',
                rules:[
                  'Règle absolue : plus il y a de gens visibles les uns des autres, plus l\'app est vivante.',
                  'Chaque filtre ajouté réduit la visibilité. Avant d\'ajouter un filtre, se demander : "Est-ce que ça vaut le coup de montrer moins de profils ?"',
                  'Les activités (Café, Sport, etc.) sont 13 max. On ne fragmente pas en sous-catégories.',
                  '"Surprise moi" = événements originaux notés en interne par l\'équipe Clutch (score ≥ 4/5). Pas de création free-for-all.',
                  'La tranche d\'âge "Tous" doit rester la sélection par défaut. Les filtres sont optionnels, pas obligatoires.',
                ]
              },
              {
                emoji:'✨', title:'Clutch doit être beau et donner envie', color:'#B39DDB',
                rules:[
                  'Chaque micro-interaction est une occasion de créer de la dopamine éthique (excitation positive vers un vrai RDV).',
                  'Se demander à chaque écran : "Est-ce que quelqu\'un montrerait ça à un ami en disant \'regarde c\'est cool\' ?"',
                  'Animations subtiles > icônes statiques. Le Proximity Meter (radar de rapprochement) doit être une expérience en soi.',
                  'S\'inspirer de : Spotify (fluidité), Duolingo (fun sans puérilité), jeux vidéo (tension + récompense).',
                ]
              },
              {
                emoji:'⚖️', title:'Légal Suisse (LPD) — à appliquer partout', color:'#6ee76e',
                rules:[
                  'La localisation GPS est une donnée sensible en droit suisse. Consentement explicite obligatoire. On ne stocke que la zone de disponibilité choisie, pas le GPS en temps réel.',
                  'Suppression de compte = obligation légale App Store ET LPD. L\'utilisateur peut supprimer son compte à tout moment, toutes ses données anonymisées en 30 jours.',
                  'Les événements créés par des non-vérifiés = interdit (responsabilité civile CH). Seuls les certifiés peuvent créer.',
                  'Feedback et avis : pas de commentaires libres négatifs → risque de diffamation. Seulement des mots-clés positifs prédéfinis.',
                ]
              },
            ]).map((section,si)=>(
              <div key={si} style={{background:C.card,border:`1px solid ${section.color}33`,borderRadius:14,padding:'16px 20px',marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:900,color:section.color,marginBottom:12,display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontSize:20}}>{section.emoji}</span>{section.title}
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {section.rules.map((r,ri)=>(
                    <div key={ri} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                      <span style={{color:section.color,fontSize:14,flexShrink:0,marginTop:1}}>→</span>
                      <span style={{fontSize:12,color:'#ccc',lineHeight:1.7}}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── SPRINT BOARD — 2 jours pour une app qui marche ── */}
        <div style={{background:C.card,border:`2px solid ${C.orange}44`,borderRadius:16,padding:'20px 20px',marginTop:32,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:900,color:C.orange,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>⚡ Sprint — état au 14 juin 2026</div>
          <div style={{fontSize:11,color:C.textMid,marginBottom:16}}>v14.06 · Session du 14 juin · David + Claude</div>
          {([
            {p:'🔴', label:'CRITIQUE — App Store / LPD',items:[
              {s:'✅',t:'Suppression compte v1 (modal + anonymisation LPD)',n:'v10.06-F'},
              {s:'✅',t:'Edge Function delete-account (supprime auth.users)',n:'Supabase déployée'},
              {s:'✅',t:'Edge Function expire-clutches',n:'Supabase déployée'},
              {s:'✅',t:'Icône app 1024×1024 PNG',n:'resources/icon.png via sharp'},
              {s:'📋',t:'Payer Apple Developer $99/an',n:'→ developer.apple.com/enroll'},
              {s:'📋',t:'Build Xcode → Archive → TestFlight',n:'après paiement Apple'},
            ]},
            {p:'🟠', label:'BUGS CORRIGÉS — 14 juin',items:[
              {s:'✅',t:'Simulation Clutch entrant — modal ClutchIncoming wired',n:'v14.06'},
              {s:'✅',t:'Animation Verrou anti-replay au rechargement',n:'v14.06 — localStorage guard'},
              {s:'✅',t:'Créneaux horaires minimum +15min dans le futur',n:'v14.06 — makeSlots()'},
              {s:'✅',t:'ProfileSheet + EventSheet → hauteur 96vh plein écran',n:'v14.06'},
              {s:'✅',t:'Pinch-zoom carte débloqué sur iOS',n:'v14.06 — viewport sans userScalable'},
              {s:'✅',t:'Âge éditable une fois si vide, puis immuable',n:'v14.06'},
              {s:'✅',t:'Version affichée : v14.06 (était v09.06-A)',n:'v14.06'},
            ]},
            {p:'🟡', label:'UX — v11-12 juin (acquis)',items:[
              {s:'✅',t:'VerrouExplosion + ClutchIncoming animations',n:'v11.06'},
              {s:'✅',t:'Profil Bumble-style hero 320px + barre complétion',n:'v12.06'},
              {s:'✅',t:'Intérêts éditables chips (18 choix, max 8)',n:'v12.06-C'},
              {s:'✅',t:'Bannière lieu RDV dans chat + bouton rappel',n:'v12.06-B'},
              {s:'✅',t:'Block double clutch même paire',n:'v12.06-A'},
              {s:'✅',t:'Auto-reward +5pts RDV honoré',n:'v12.06-C'},
              {s:'✅',t:'Plausible Analytics',n:'v12.06-A'},
            ]},
            {p:'🔵', label:'NATIVE — chemin App Store',items:[
              {s:'✅',t:'Capacitor init (appId: app.clutch.lausanne)',n:'v10.06'},
              {s:'✅',t:'iOS platform initialisé, Xcode ouvert',n:'v12.06'},
              {s:'✅',t:'Icône 1024×1024 générée',n:'resources/icon.png'},
              {s:'📋',t:'Payer Apple Developer $99/an',n:'BLOQUANT → developer.apple.com/enroll'},
              {s:'📋',t:'TestFlight beta (David + Mel + 50 testeurs)',n:'après paiement'},
            ]},
            {p:'⚙️', label:'PROCHAINES FEATURES CLÉS',items:[
              {s:'📋',t:'Préférences recherche (genre, âge, distance)',n:'Filtre Présences'},
              {s:'📋',t:'Compte Créateur d\'événements',n:'Profil type distinct'},
              {s:'📋',t:'Alerte GPS distance A↔B avant envoi Clutch',n:'>50km → confirmation'},
              {s:'📋',t:'Read receipts messages ✓✓ (premium)',n:'Phase 2'},
              {s:'📋',t:'No-show signalé → -10pts + suspension x3',n:'Phase 2'},
              {s:'📋',t:'Recadrage photo à l\'upload (pinch/zoom)',n:'Phase 2'},
            ]},
          ] as unknown as {p:string;label:string;items:{s:string;t:string;n:string}[]}[]).map((section,si)=>(
            <div key={si} style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.textMid,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>{section.p} {section.label}</div>
              {(section.items as any[]).map((item:any,ii:number)=>(
                <div key={ii} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'4px 0',borderBottom:`1px solid rgba(255,191,158,.06)`}}>
                  <span style={{fontSize:12,flexShrink:0,width:16}}>{item.s}</span>
                  <span style={{fontSize:11,color:item.s==='✅'?C.textMid:C.text,flex:1,textDecoration:item.s==='✅'?'line-through':undefined}}>{item.t}</span>
                  <span style={{fontSize:9,color:item.s==='✅'?C.green:C.textMid,flexShrink:0}}>{item.n}</span>
                </div>
              ))}
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 12px',background:'rgba(255,191,158,.06)',borderRadius:10,fontSize:11,color:C.salmon}}>
            🎯 <strong>Objectif :</strong> App Store-ready · 1 bloquant restant = icône 1024px (Mel)
          </div>
        </div>

        {/* ── EVENTS MANAGER ── */}
        <EventManager />

        {/* ── TEST LAB ── */}
        <TestLab />

        <p style={{ textAlign: 'center', color: 'rgba(255,191,158,.25)', fontSize: 12, marginTop: 24 }}>
          <span style={{color:'#FFBF9E'}}>CLU</span><span style={{color:'#E27C00'}}>TCH</span> · QG interne · David · Mel · Claude · v11.06-M · 11.06.2026
        </p>
      </div>
    </div>
  )
}
