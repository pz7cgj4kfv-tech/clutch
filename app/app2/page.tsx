'use client'
/**
 * CLUTCH — App v2  v10.06-O
 *
 * FLOW COMPLET :
 *   splash → login/register
 *   → PAGE 1 : carte seule (0 menu, 0 liste) + jog wheels [étape 1/2]
 *   → PAGE 2 : options + "Ouvrir ma Fenêtre" [étape 2/2]
 *   → PAGE 3 : app principale (tab bar : Présences | Événements | Clutchs | Profil)
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/supabase'

const V = 'v14.06-P'

// ─── Palette — fond = splash (#542A44), cohérence totale ────────
const C = {
  bg:'#542A44',          // fond principal = même que splash/page-zéro
  bgCard:'#6B3558',      // cartes (plus clair que bg)
  bgSheet:'#5E2E4A',     // bottom sheets
  bordeaux:'#3D1A33',    // accent sombre (boutons, ombres)
  bordeauxLight:'#7A3D65', // accent moyen
  salmon:'#FFBF9E', salmonFaint:'rgba(255,191,158,0.15)', salmonMid:'rgba(255,191,158,0.5)',
  orange:'#E27C00', orangeFaint:'rgba(226,124,0,0.15)',
  white:'#FAFAFA', whiteMid:'rgba(250,250,250,0.65)', whiteFaint:'rgba(255,191,158,0.1)',
  border:'rgba(255,191,158,0.22)', borderStrong:'rgba(255,191,158,0.45)',
  green:'#2DBD7E', red:'#ef4444',
}

// ─── Couleurs genre — cohérentes carte + liste ─────────────────
const GC = { F:'#FF6B9D', M:'#4FC3F7', X:'#B39DDB' } as const
type GenderKey = keyof typeof GC

// ─── Badges compte ─────────────────────────────────────────────
function getAccountBadge(profile: any): {label:string; color:string; emoji:string}|null {
  if (profile?.account_type === 'bot' || (profile?.id && ['38dda77a','6cf880cf','c504c886','074e38bb','b1e2cc39','df99921f'].some((p:string) => profile.id.startsWith(p))))
    return {label:'Bot', color:'#6B7280', emoji:'🤖'}
  if (['David','Mélanie','Mel','David Saugy'].includes(profile?.name||''))
    return {label:'Admin', color:'#F59E0B', emoji:'👑'}
  if (profile?.account_type === 'friend')
    return {label:'Friend', color:'#3B82F6', emoji:'💙'}
  return null
}
function genderKey(g?: string|null): GenderKey {
  if (!g) return 'X'
  if (g==='woman'||g==='F'||g==='f') return 'F'
  if (g==='man'  ||g==='M'||g==='m') return 'M'
  return 'X'
}
// Icônes genre (pas de texte) — fallback texte + SVGs Mel
const GI = { F:'♀', M:'♂', X:'◇' } as const
// Composant icône genre SVG (Mel, 12.06)
function GenderSvg({gk, size=16, style}:{gk:GenderKey; size?:number; style?:React.CSSProperties}) {
  const map:Record<GenderKey,string> = { F:'/icons/femme_couleur.svg', M:'/icons/homme_couleur.svg', X:'/icons/non-binaire_couleur.svg' }
  return <img src={map[gk]} width={size} height={size} alt="" style={{display:'inline-block',verticalAlign:'middle',...style}}/>
}
// Icône tab navigation SVG (Mel, 12.06)
const TAB_ICONS:Record<string,string> = {
  presences:'/icons/presence_couleur.svg',
  evenements:'/icons/events_couleur.svg',
  clutchs:'/icons/clutch_couleur.svg',
  profil:'/icons/profil_couleur.svg',
}
function TabSvg({id, size=22, active}:{id:string; size?:number; active:boolean}) {
  const src = TAB_ICONS[id]
  if (!src) return null
  return <img src={src} width={size} height={size} alt="" style={{display:'block', filter:active?'none':'brightness(0) invert(1) opacity(0.3)', transition:'filter .2s'}}/>
}

// ─── i18n — traductions FR/EN ─────────────────────────────────
type Lang = 'fr' | 'en'
const TR: Record<Lang, Record<string,string>> = {
  fr: {
    'tab.presences':'Présences','tab.events':'Événements','tab.clutchs':'Clutchs','tab.profil':'Profil',
    'page1.title':'Choisis ton moment','page1.cta':'Voir les présences →',
    'page1.step':'Étape 1/2 — Quand ?',
    'page2.title':'Tes envies','page2.cta':'Ouvrir ma Fenêtre ✦',
    'page2.step':'Étape 2/2 — Quoi ?',
    'page2.type':'Quel type de rencontre ?','page2.intention':'Définis ton intention pour ce soir',
    'page2.mode':'Mode — plusieurs choix possibles',
    'page2.seek':'Je cherche à rencontrer…',
    'page2.age':'Tranche d\'âge — cumul possible',
    'page2.activity':'J\'ai envie de…','page2.optional':'optionnel',
    'page2.intMsg':'Message d\'intention','page2.intPlaceholder':'Ex : J\'ai envie d\'une vraie conversation autour d\'un café…',
    'page2.recap.max':'18h max','page2.note':'⚡ Clutch = RDV réel dans les 18h · Pas de tchat infini',
    'page2.visible':'Visible {r} km autour de {city}',
    'discover.dispo':'disponible maintenant','discover.window':'Fenêtre ouverte',
    'discover.title':'Présences','discover.subtitle':'{n} personnes disponibles près de toi',
    'discover.available':'{n} disponible{s}','discover.none':'Aucune présence dans ton rayon pour l\'instant',
    'discover.nonenote':'Ouvre ta fenêtre pour apparaître sur la carte',
    'clutch.send':'⚡ Clutcher','clutch.sent':'Clutch envoyé !',
    'clutch.accept':'✓ Verrouiller 🔒','clutch.decline':'↩ Refuser','clutch.later':'⏸ Mettre de côté',
    'clutch.cancel':'↩ Annuler le clutch',
    'clutch.venue':'Lieu','clutch.time':'Heure proposée','clutch.msg':'Message',
    'clutch.limit':'Max 5 messages · Pour se retrouver',
    'events.title':'Événements','events.register':'✦ M\'inscrire','events.registered':'✓ Inscrit·e',
    'events.myevents':'Mes inscriptions','events.spots':'places restantes',
    'events.unregister':'Se désinscrire','events.free':'Gratuit',
    'clutchs.title':'Mes Clutchs','clutchs.active':'actif','clutchs.history':'Historique',
    'clutchs.clear':'🗑 Effacer historique','clutchs.empty':'Aucun clutch actif',
    'clutchs.sent':'↗ Envoyé à','clutchs.received':'↙ Reçu de',
    'clutchs.chat':'💬 Chat avec {name}','clutchs.accept.btn':'✓ Accepter',
    'profile.title':'Mon profil','profile.edit':'Modifier','profile.save':'Enregistrer',
    'profile.score':'Score de fiabilité','profile.available':'Disponible maintenant',
    'profile.logout':'Se déconnecter','profile.delete':'🗑 Supprimer mon compte',
    'profile.lang':'🇬🇧 Switch to English',
    'label.from':'De','label.to':'À','label.radius':'Rayon',
    'label.seek':'Je cherche','label.mode':'Mode','label.gender':'Genre',
    'label.age':'Tranche d\'âge','label.activities':'Activités',
    'status.pending':'En attente','status.confirmed':'Verrou 🔒','status.accepted':'Verrou 🔒',
    'status.declined':'Refusé','status.expired':'Expiré','status.cancelled':'Annulé',
    'modal.send':'✦ Lancer un Clutch','modal.sendBtn':'⚡ Envoyer le Clutch',
    'modal.venue':'Lieu du RDV','modal.venueHint':'Café Romand, Bar du Flon…',
    'modal.accept.title':'Clutch reçu !','modal.accept.lock':'✓ Verrouiller 🔒',
    'incoming.from':'veut vous rencontrer','incoming.at':'à',
    'verrou.title':'VERROU','verrou.sub':'RDV confirmé · Vous êtes connectés',
    'radar.title':'Verrou actif','radar.detail':'→ Détail',
    'delete.warn':'Supprimer définitivement ?','delete.doing':'Suppression en cours…',
    'delete.confirm':'Supprimer définitivement','delete.cancel':'Annuler',
    'profile.avail.on': 'Disponible · Appuyer pour retirer',
    'profile.avail.off': 'Me mettre disponible',
    'profile.avail.sub.on': 'Visible jusqu\'à {time} · Appuyer pour retirer',
    'profile.avail.sub.off': 'Apparaître sur la carte Clutch',
    'presence.gate.title': 'Tu n\'es pas disponible',
    'presence.gate.body': 'Ouvre un créneau pour voir qui est disponible autour de toi — et être visible par eux.',
    'presence.gate.cta': '✦ Me mettre disponible',
    'presence.gate.premium': 'Ou passe au premium pour voir sans être visible',
    'presence.stealth': '👁 Mode furtif · Tu vois les présences sans être visible',
    'feedback.title': '💬 Feedback Clutch',
    'feedback.sub': 'Ton avis compte énormément. Écris, ou enregistre un audio — tout est lu.',
    'feedback.placeholder': 'Ce qui marche, ce qui ne marche pas, tes idées folles...',
    'feedback.send': 'Envoyer le feedback',
    'feedback.sending': 'Envoi…',
    'feedback.sent': '✓ Feedback envoyé — merci !',
    'sub.section': 'Mon abonnement',
    'sub.tagline': 'Les éléments plus lourds que le fer ne naissent que dans les supernovae ✦',
    'sub.h.name': 'Hydrogène', 'sub.h.sub': 'Gratuit',
    'sub.h.note': 'Le plus abondant de l\'univers — base de tout',
    'sub.h.f1': '3 Clutchs par semaine', 'sub.h.f2': 'Profil de base', 'sub.h.f3': 'Carte des présences',
    'sub.au.name': 'Or', 'sub.au.sub': 'Standard',
    'sub.au.note': 'Forgé dans les étoiles géantes',
    'sub.au.f1': 'Clutchs illimités', 'sub.au.f2': 'Filtres de recherche', 'sub.au.f3': 'Favoris illimités',
    'sub.rh.name': 'Rhodium', 'sub.rh.sub': 'Premium',
    'sub.rh.note': 'Le métal le plus rare et le plus cher',
    'sub.rh.f1': 'Tout Au +', 'sub.rh.f2': 'Voir qui m\'a consulté', 'sub.rh.f3': 'Read receipts ✓✓', 'sub.rh.f4': 'Boost visibilité 1×/jour', 'sub.rh.f5': 'Super-Clutch ⭐',
    'sub.at.name': 'Astante', 'sub.at.sub': 'Élite',
    'sub.at.note': '28g dans toute la croûte terrestre',
    'sub.at.f1': 'Tout Rh +', 'sub.at.f2': 'Mode incognito', 'sub.at.f3': 'Rayon élargi 50km', 'sub.at.f4': 'Stats avancées', 'sub.at.f5': 'Badge Élite sur le profil', 'sub.at.f6': 'Support prioritaire',
    'sub.women': 'Femmes — toujours gratuites, toujours prioritaires ♀',
    'ev.filter.all': 'Tout', 'ev.filter.soir': 'Ce soir', 'ev.filter.demain': 'Demain',
    'ev.filter.sport': 'Sport', 'ev.filter.bienetre': 'Bien-être', 'ev.filter.culture': 'Culture',
    'ev.filter.gastro': 'Gastronomie', 'ev.filter.musique': 'Musique', 'ev.filter.parents': 'Parents',
    'ev.filter.evF': 'Entre femmes', 'ev.filter.evX': 'Mixte',
    'ev.by': 'par',
    'ev.notif.new': '◇ Nouveau·elle Clutcheur·se dans ton quartier',
    'lab.title': '🔬 Ce qu\'on construit',
    'lab.sub': 'Clutch est construit avec ses utilisateurs. Appuie sur une feature pour dire que tu la veux — on écoute.',
    'lab.r1.label': 'Voir qui a consulté mon profil', 'lab.r1.note': 'Pas "qui t\'a cloché" — ça c\'est pour tous',
    'lab.r2.label': 'Accusés de lecture (messages)', 'lab.r2.note': 'Savoir si l\'autre a lu ton message',
    'lab.r3.label': 'Boost visibilité 1×/jour', 'lab.r3.note': 'Apparaître en 1er pendant 30 minutes',
    'lab.r4.label': 'Super-Clutch prioritaire', 'lab.r4.note': 'Badge doré · 1 par semaine max',
    'lab.r5.label': 'Mode Incognito', 'lab.r5.note': 'Visible uniquement par tes clutchés passés',
    'lab.r6.label': 'Alerte distance GPS', 'lab.r6.note': 'Si vous êtes à >50km → confirmation avant envoi',
    'lab.r7.label': 'Recadrage photo à l\'upload', 'lab.r7.note': 'Pinch/zoom pour centrer ton visage',
    'lab.r8.label': 'Préférences de recherche', 'lab.r8.note': 'Genre, âge, distance — filtrer les présences',
    'lab.r9.label': 'Compte Créateur d\'événements', 'lab.r9.note': 'Organise des activités, pas de Clutch direct',
    'lab.r10.label': 'Onboarding 3 écrans', 'lab.r10.note': 'Intro guidée pour les nouveaux',
    'lab.r11.label': 'Partage de profil /u/prenom', 'lab.r11.note': 'Un lien public vers ton profil Clutch',
    'lab.r12.label': 'Rapport d\'activité hebdo', 'lab.r12.note': 'RDV réalisés, score, tes tendances',
    'lab.r13.label': 'Expansion — Genève, Zurich, Berne', 'lab.r13.note': 'D\'abord Lausanne. Puis la Suisse romande.',
    'lab.r14.label': 'Watermark invisible sur photos', 'lab.r14.note': 'Ton ID encodé en pixels — si ça leak, on sait',
    'lab.r15.label': 'Vérification identité (selfie)', 'lab.r15.note': 'Anti-faux-comptes · Selfie vs photo profil',
    'lab.r16.label': 'No-show signalé → pénalité', 'lab.r16.note': 'L\'autre peut signaler si tu n\'es pas venu',
    'profile.languages': 'Langues parlées',
  },
  en: {
    'tab.presences':'Nearby','tab.events':'Events','tab.clutchs':'Clutches','tab.profil':'Profile',
    'page1.title':'Pick your window','page1.cta':'See who\'s around →',
    'page1.step':'Step 1/2 — When?',
    'page2.title':'Your vibe','page2.cta':'Open my Window ✦',
    'page2.step':'Step 2/2 — What?',
    'page2.type':'What kind of meetup?','page2.intention':'Set your intention for tonight',
    'page2.mode':'Mode — multiple choice',
    'page2.seek':'I\'m looking for…',
    'page2.age':'Age range — combine as you like',
    'page2.activity':'I feel like…','page2.optional':'optional',
    'page2.intMsg':'Intention message','page2.intPlaceholder':'E.g. I\'d love a real conversation over coffee…',
    'page2.recap.max':'18h max','page2.note':'⚡ Clutch = real meetup within 18h · No endless chat',
    'page2.visible':'Visible within {r} km around {city}',
    'discover.dispo':'available now','discover.window':'Window open',
    'discover.title':'Nearby','discover.subtitle':'{n} people available near you',
    'discover.available':'{n} available','discover.none':'No one nearby right now',
    'discover.nonenote':'Open your window to appear on the map',
    'clutch.send':'⚡ Clutch them','clutch.sent':'Clutch sent!',
    'clutch.accept':'✓ Lock it in 🔒','clutch.decline':'↩ Decline','clutch.later':'⏸ Decide later',
    'clutch.cancel':'↩ Cancel clutch',
    'clutch.venue':'Venue','clutch.time':'Proposed time','clutch.msg':'Message',
    'clutch.limit':'Max 5 messages · To coordinate',
    'events.title':'Events','events.register':'✦ Join event','events.registered':'✓ Joined',
    'events.myevents':'My events','events.spots':'spots left',
    'events.unregister':'Unregister','events.free':'Free',
    'clutchs.title':'My Clutches','clutchs.active':'active','clutchs.history':'History',
    'clutchs.clear':'🗑 Clear history','clutchs.empty':'No active clutch',
    'clutchs.sent':'↗ Sent to','clutchs.received':'↙ Received from',
    'clutchs.chat':'💬 Chat with {name}','clutchs.accept.btn':'✓ Accept',
    'profile.title':'My profile','profile.edit':'Edit','profile.save':'Save',
    'profile.score':'Reliability score','profile.available':'Available now',
    'profile.logout':'Sign out','profile.delete':'🗑 Delete my account',
    'profile.lang':'🇫🇷 Passer en français',
    'label.from':'From','label.to':'To','label.radius':'Radius',
    'label.seek':'Looking for','label.mode':'Mode','label.gender':'Gender',
    'label.age':'Age range','label.activities':'Activities',
    'status.pending':'Pending','status.confirmed':'Locked 🔒','status.accepted':'Locked 🔒',
    'status.declined':'Declined','status.expired':'Expired','status.cancelled':'Cancelled',
    'modal.send':'✦ Send a Clutch','modal.sendBtn':'⚡ Send Clutch',
    'modal.venue':'Venue','modal.venueHint':'Café Romand, Bar du Flon…',
    'modal.accept.title':'Incoming Clutch!','modal.accept.lock':'✓ Lock it in 🔒',
    'incoming.from':'wants to meet you','incoming.at':'at',
    'verrou.title':'LOCKED IN','verrou.sub':'Meetup confirmed · You\'re connected',
    'radar.title':'Active lock','radar.detail':'→ Details',
    'delete.warn':'Delete permanently?','delete.doing':'Deleting…',
    'delete.confirm':'Delete permanently','delete.cancel':'Cancel',
    'profile.avail.on': 'Available · Tap to remove',
    'profile.avail.off': 'Set myself available',
    'profile.avail.sub.on': 'Visible until {time} · Tap to remove',
    'profile.avail.sub.off': 'Appear on the Clutch map',
    'presence.gate.title': 'You\'re not available',
    'presence.gate.body': 'Open a time window to see who\'s available near you — and be visible to them.',
    'presence.gate.cta': '✦ Set myself available',
    'presence.gate.premium': 'Or go premium to browse without being visible',
    'presence.stealth': '👁 Stealth mode · You see people but you\'re invisible',
    'feedback.title': '💬 Clutch Feedback',
    'feedback.sub': 'Your feedback matters a lot. Write something, or record audio — everything gets read.',
    'feedback.placeholder': 'What works, what doesn\'t, your wildest ideas...',
    'feedback.send': 'Send feedback',
    'feedback.sending': 'Sending…',
    'feedback.sent': '✓ Feedback sent — thank you!',
    'sub.section': 'My subscription',
    'sub.tagline': 'Elements heavier than iron are born only in supernovae ✦',
    'sub.h.name': 'Hydrogen', 'sub.h.sub': 'Free',
    'sub.h.note': 'The most abundant in the universe — the foundation of everything',
    'sub.h.f1': '3 Clutches per week', 'sub.h.f2': 'Basic profile', 'sub.h.f3': 'Presence map',
    'sub.au.name': 'Gold', 'sub.au.sub': 'Standard',
    'sub.au.note': 'Forged in giant stars',
    'sub.au.f1': 'Unlimited Clutches', 'sub.au.f2': 'Search filters', 'sub.au.f3': 'Unlimited favorites',
    'sub.rh.name': 'Rhodium', 'sub.rh.sub': 'Premium',
    'sub.rh.note': 'The rarest and most expensive metal on Earth',
    'sub.rh.f1': 'Everything in Au +', 'sub.rh.f2': 'See who viewed me', 'sub.rh.f3': 'Read receipts ✓✓', 'sub.rh.f4': 'Visibility boost 1×/day', 'sub.rh.f5': 'Super-Clutch ⭐',
    'sub.at.name': 'Astatine', 'sub.at.sub': 'Elite',
    'sub.at.note': '28g in the entire Earth\'s crust',
    'sub.at.f1': 'Everything in Rh +', 'sub.at.f2': 'Incognito mode', 'sub.at.f3': 'Extended radius 50km', 'sub.at.f4': 'Advanced stats', 'sub.at.f5': 'Elite badge on profile', 'sub.at.f6': 'Priority support',
    'sub.women': 'Women — always free, always prioritized ♀',
    'ev.filter.all': 'All', 'ev.filter.soir': 'Tonight', 'ev.filter.demain': 'Tomorrow',
    'ev.filter.sport': 'Sport', 'ev.filter.bienetre': 'Wellness', 'ev.filter.culture': 'Culture',
    'ev.filter.gastro': 'Food & Drink', 'ev.filter.musique': 'Music', 'ev.filter.parents': 'Parents',
    'ev.filter.evF': 'Women only', 'ev.filter.evX': 'Mixed',
    'ev.by': 'by',
    'ev.notif.new': '◇ New Clutcher in your area',
    'lab.title': '🔬 What we\'re building',
    'lab.sub': 'Clutch is built with its users. Tap a feature to say you want it — we\'re listening.',
    'lab.r1.label': 'See who viewed my profile', 'lab.r1.note': 'Not "who clutched you" — that\'s for everyone',
    'lab.r2.label': 'Read receipts (messages)', 'lab.r2.note': 'Know if the other person read your message',
    'lab.r3.label': 'Visibility boost 1×/day', 'lab.r3.note': 'Appear first for 30 minutes',
    'lab.r4.label': 'Priority Super-Clutch', 'lab.r4.note': 'Golden badge · 1 per week max',
    'lab.r5.label': 'Incognito mode', 'lab.r5.note': 'Visible only to your past Clutch matches',
    'lab.r6.label': 'GPS distance alert', 'lab.r6.note': 'If you\'re >50km away → confirmation before sending',
    'lab.r7.label': 'Photo crop on upload', 'lab.r7.note': 'Pinch/zoom to center your face',
    'lab.r8.label': 'Search preferences', 'lab.r8.note': 'Gender, age, distance — filter presences',
    'lab.r9.label': 'Event Creator account', 'lab.r9.note': 'Host activities, no direct Clutch',
    'lab.r10.label': '3-screen onboarding', 'lab.r10.note': 'Guided intro for new users',
    'lab.r11.label': 'Profile sharing /u/firstname', 'lab.r11.note': 'A public link to your Clutch profile',
    'lab.r12.label': 'Weekly activity report', 'lab.r12.note': 'Meetups completed, score, your trends',
    'lab.r13.label': 'Expansion — Geneva, Zurich, Bern', 'lab.r13.note': 'Lausanne first. Then French Switzerland.',
    'lab.r14.label': 'Invisible watermark on photos', 'lab.r14.note': 'Your ID encoded in pixels — if it leaks, we know',
    'lab.r15.label': 'Identity verification (selfie)', 'lab.r15.note': 'Anti-fake-accounts · Selfie vs profile photo',
    'lab.r16.label': 'No-show reported → penalty', 'lab.r16.note': 'The other person can report if you didn\'t show up',
    'profile.languages': 'Languages',
  }
}
function useT(lang: Lang) {
  return (key: string, fallback?: string) => TR[lang][key] ?? TR['fr'][key] ?? fallback ?? key
}

// ─── Heure locale Lausanne → jour ou nuit ──────────────────────
function isNightNow(): boolean {
  const h = new Date().toLocaleString('fr-CH', {
    timeZone:'Europe/Zurich', hour:'numeric', hour12:false
  })
  const hour = parseInt(h)
  return hour >= 20 || hour < 7
}

type Screen   = 'splash' | 'login' | 'register' | 'main'
type AppFlow  = 'carte' | 'options' | 'app'  // flow une fois loggé
type MainTab  = 'presences' | 'evenements' | 'clutchs' | 'profil'

// ─── Slots de temps — toutes les 15 minutes ───────────────────
function makeSlots(fromDate?: Date): string[] {
  const base = fromDate || new Date()
  const slots: string[] = []
  const rem = 15 - (base.getMinutes() % 15)
  // Toujours au moins 15min dans le futur (rem=15 quand pile sur :00/:15/:30/:45)
  const start = new Date(base.getTime() + rem * 60_000)
  start.setSeconds(0, 0)
  for (let i = 0; i <= 72; i++) {  // 18h à 15min = 72 slots
    const t  = new Date(start.getTime() + i * 15 * 60_000)
    const hh = String(t.getHours()).padStart(2, '0')
    const mm = String(t.getMinutes()).padStart(2, '0')
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

// ═════════════════════════════════════════════════════════════
// JOG WHEEL — copie fidèle du proto /app
// Debounce 80ms pour éviter le couplage inter-roues
// ═════════════════════════════════════════════════════════════
const ITEM_H = 36

function JogWheel({ slots, value, onChange, accent = false }: {
  slots: string[]; value: string; onChange:(v:string)=>void; accent?:boolean
}) {
  const ref    = useRef<HTMLDivElement>(null)
  const timer  = useRef<ReturnType<typeof setTimeout>|null>(null)
  const lastV  = useRef(value)

  const scrollToValue = useCallback((v: string, behavior: ScrollBehavior = 'smooth') => {
    const el = ref.current
    if (!el) return
    const idx = slots.indexOf(v)
    if (idx < 0) return
    el.scrollTo({ top: idx * ITEM_H, behavior })
  }, [slots])

  // Scroll to value when it changes externally
  useEffect(() => {
    if (lastV.current !== value) {
      lastV.current = value
      scrollToValue(value)
    }
  }, [value, scrollToValue])

  // Scroll to initial position immediately (no animation)
  useEffect(() => {
    scrollToValue(value, 'instant' as ScrollBehavior)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const el = ref.current
      if (!el) return
      const i = Math.round(el.scrollTop / ITEM_H)
      const clamped = Math.max(0, Math.min(i, slots.length - 1))
      const v = slots[clamped]
      if (v && v !== lastV.current) {
        lastV.current = v
        onChange(v)
        // snap propre
        el.scrollTo({ top: clamped * ITEM_H, behavior: 'smooth' })
      }
    }, 80)
  }

  const active = accent ? C.orange : C.salmon

  return (
    <div style={{ position:'relative', height:ITEM_H * 3, flex:1, minWidth:0 }}>
      {/* selection ring */}
      <div style={{
        position:'absolute', top:ITEM_H, left:4, right:4, height:ITEM_H,
        background:`linear-gradient(90deg,${C.bordeaux}80,${accent?C.orange:C.salmon}28,${C.bordeaux}80)`,
        border:`1px solid ${accent?C.orange+'66':C.borderStrong}`,
        borderRadius:12, pointerEvents:'none', zIndex:2,
      }}/>
      {/* fade top */}
      <div style={{ position:'absolute',top:0,left:0,right:0,height:ITEM_H,
        background:`linear-gradient(${C.bgCard},transparent)`,pointerEvents:'none',zIndex:3 }}/>
      {/* fade bottom */}
      <div style={{ position:'absolute',bottom:0,left:0,right:0,height:ITEM_H,
        background:`linear-gradient(transparent,${C.bgCard})`,pointerEvents:'none',zIndex:3 }}/>

      <div ref={ref} onScroll={onScroll} style={{
        height:'100%', overflowY:'scroll', scrollSnapType:'y mandatory',
        WebkitOverflowScrolling:'touch',
      }}>
        <div style={{ height:ITEM_H }}/>
        {slots.map(s => (
          <div key={s} onClick={() => { lastV.current=s; onChange(s); scrollToValue(s) }}
            style={{
              height:ITEM_H, display:'flex', alignItems:'center', justifyContent:'center',
              scrollSnapAlign:'center', cursor:'pointer',
              fontSize: s===value ? 24 : 16,
              fontWeight: s===value ? 900 : 400,
              color: s===value ? active : C.whiteMid,
              letterSpacing:'-.04em',
              transition:'font-size .1s,color .1s',
            }}>
            {s}
          </div>
        ))}
        <div style={{ height:ITEM_H }}/>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// CARTE LEAFLET
// MAP_H = dynamique selon rayon (auto-zoom + auto-height)
// ═════════════════════════════════════════════════════════════

// ─── GPS PRIVACY (LPD suisse) ─────────────────────────────────
// Jamais afficher la position exacte d'un autre membre sur la carte.
// fuzzPosition() génère un offset STABLE (basé sur userId hash)
// de ±250m max → quartier visible, adresse cachée.
// Utiliser obligatoirement avant d'afficher un marker d'un autre user.
function fuzzPosition(lat: number, lng: number, userId: string): [number,number] {
  // Hash simple mais stable du userId (même offset à chaque render)
  let h = 0
  for (let i = 0; i < userId.length; i++) h = (Math.imul(31, h) + userId.charCodeAt(i)) | 0
  const seed1 = (h & 0xFFFF) / 0xFFFF        // 0..1
  const seed2 = ((h >> 16) & 0xFFFF) / 0xFFFF // 0..1
  const maxDeg = 50 / 111_000                // 50m max — visible quartier, adresse cachée
  const dLat = (seed1 - 0.5) * 2 * maxDeg
  const dLng = (seed2 - 0.5) * 2 * maxDeg / Math.cos(lat * Math.PI / 180)
  return [lat + dLat, lng + dLng]
}
// Reverse geocoding léger — ville la plus proche d'un point lat/lng
const CITIES = [
  {n:'Lausanne',lat:46.5196,lng:6.6323},{n:'Genève',lat:46.2044,lng:6.1432},
  {n:'Montreux',lat:46.4312,lng:6.9121},{n:'Nyon',lat:46.3826,lng:6.2362},
  {n:'Morges',lat:46.5101,lng:6.4995},{n:'Vevey',lat:46.4631,lng:6.8421},
  {n:'Yverdon',lat:46.7785,lng:6.6408},{n:'Fribourg',lat:46.8065,lng:7.1620},
  {n:'Berne',lat:46.9480,lng:7.4474},{n:'Zurich',lat:47.3769,lng:8.5417},
  {n:'Sion',lat:46.2330,lng:7.3590},{n:'Neuchâtel',lat:46.9930,lng:6.9310},
  {n:'Thonon',lat:46.3710,lng:6.4770},{n:'Évian',lat:46.4000,lng:6.5900},
  {n:'Aigle',lat:46.3186,lng:6.9734},{n:'Gland',lat:46.4222,lng:6.2687},
]
const CITIES_NAMES = new Set(CITIES.map(c=>c.n))
function nearestCity(lat:number, lng:number): string {
  let best=CITIES[0], bestD=Infinity
  for (const c of CITIES) {
    const d=Math.hypot(c.lat-lat, c.lng-lng)
    if(d<bestD){bestD=d;best=c}
  }
  return best.n
}

const ME = [46.5196, 6.6323] as [number,number]

const EVTS = [
  { lat:46.5210, lng:6.6340, e:'🍷' },
  { lat:46.5228, lng:6.6360, e:'☕' },
]

function rayonToZoom(km: number): number {
  if (km <= 1)  return 15
  if (km <= 2)  return 14
  if (km <= 4)  return 13
  if (km <= 7)  return 13
  if (km <= 12) return 12
  if (km <= 20) return 11
  if (km <= 35) return 10
  if (km <= 60) return 9
  return 8
}
// Slider logarithmique : val 0-100 → rayon 1-100km (0 = 1km tout à gauche)
function sliderToRayon(v: number): number { return 1 + (v/100)**2 * 99 }  // float, smooth
function rayonToSlider(r: number): number { return Math.sqrt(Math.max(0,(r-1)/99))*100 }
function fmtKm(r: number): string { return r < 10 ? r.toFixed(1)+' km' : Math.round(r)+' km' }

// Lac Léman rough bbox — évite de placer des étoiles dans l'eau
// Lausanne : le lac est au sud (~46.512 et en-dessous), entre lng 6.05 et 7.0
function isInLake(lat: number, lng: number): boolean {
  return lat < 46.513 && lat > 46.35 && lng > 6.05 && lng < 7.0
}

// Génère des positions aléatoires STABLES à l'intérieur du cercle rayon
// anti-triangulation : positions aléatoires, pas les vraies positions membres (LPD)
// genders = tableau des genres des profils présents → couleur par genre sur la carte
function makeStars(centerLat:number, centerLng:number, radiusKm:number, genders:GenderKey[]) {
  return genders.map((gender, i) => {
    const seed = (i * 2654435761) >>> 0
    const angle = (seed % 1000) / 1000 * 2 * Math.PI
    const dist = (((seed >> 10) % 700) + 300) / 1000 * radiusKm
    const dLat = dist * 1000 / 111_000 * Math.cos(angle)
    const dLng = dist * 1000 / 111_000 / Math.cos(centerLat * Math.PI / 180) * Math.sin(angle)
    let lat = centerLat + dLat
    const lng = centerLng + dLng
    // Si dans le lac → décaler vers le nord (on est à Lausanne)
    if (isInLake(lat, lng)) lat += 0.008 + (seed % 100) / 10000
    return { lat, lng, delay:i*0.25, v:i%5, gender }
  })
}

function MapLeaflet({ rayon, userPhoto, profiles=[], showPin=false, onReady, onGpsUpdate }:{
  rayon:number; userPhoto?:string|null; profiles?:Profile[];
  showPin?:boolean; onReady?:(getCenter:()=>[number,number], recenter:()=>void)=>void;
  onGpsUpdate?:(pos:[number,number])=>void;
}) {
  const divRef    = useRef<HTMLDivElement>(null)
  const mapRef    = useRef<any>(null)
  const circleRef  = useRef<any>(null)
  const haloRef    = useRef<any>(null)
  const fillRef    = useRef<any>(null)
  const gpsRef     = useRef<[number,number]>(ME) // Position GPS réelle (màj par geolocation)
  const night = isNightNow()
  const [starTooltip, setStarTooltip] = useState<{profile:Profile;x:number;y:number}|null>(null)
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null)

  useEffect(() => {
    if (mapRef.current || !divRef.current) return
    let mounted = true

    if (!document.getElementById('leaflet-css')) {
      const lk = document.createElement('link')
      lk.id='leaflet-css'; lk.rel='stylesheet'
      lk.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(lk)
    }

    const init = () => {
      import('leaflet').then(mod => {
        if (!mounted || !divRef.current) return
        const L = mod.default
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({ iconUrl:'', shadowUrl:'' })

        const map = L.map(divRef.current!, {
          center:ME, zoom:13,
          zoomControl:false, attributionControl:false,
          dragging:true, scrollWheelZoom:false, doubleClickZoom:false,
          // @ts-expect-error tap exists at runtime
          tap:false,
        })
        mapRef.current = map

        const tileUrl = night
          ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'
        L.tileLayer(tileUrl, { maxZoom:19 }).addTo(map)

        // Cercle RDV — 3 couches : glow fill + border animé + halo pulsant
        const rm = rayon * 1000
        // Couche 1 : fill doux saumon
        const fill = L.circle(ME, {
          radius:rm, fillColor:'#FFBF9E', fillOpacity:0.06,
          color:'transparent', opacity:0, weight:0, interactive:false, className:'clutch-fill',
        }).addTo(map)
        fillRef.current = fill
        // Couche 2 : anneau halo pulsant (orange, plus large)
        const halo = L.circle(ME, {
          radius:rm, fillColor:'transparent', fillOpacity:0,
          color:'#E27C00', opacity:0.18, weight:14,
          interactive:false, className:'clutch-halo',
        }).addTo(map)
        haloRef.current = halo
        // Couche 3 : bordure principale pointillée animée
        const circle = L.circle(ME, {
          radius:rm, fillColor:'transparent', fillOpacity:0,
          color:'#FFBF9E', opacity:1,
          weight:2.5, dashArray:'12,7',
          interactive:false, className:'clutch-radius',
        }).addTo(map)
        circleRef.current = circle
        // Sync cercles sur le centre de la carte
        // ⚠️ iOS: 'move' ne fire pas toujours — on écoute aussi 'moveend' et 'zoomend'
        // ⚠️ Pinch-zoom ne doit PAS déplacer le curseur — on sauvegarde le centre avant zoom
        let lockedCenter: {lat:number,lng:number}|null = null
        const syncCircle = () => {
          const c2 = lockedCenter || map.getCenter()
          const pos: [number,number] = [c2.lat, c2.lng]
          circle.setLatLng(pos)
          halo.setLatLng(pos)
          fill.setLatLng(pos)
        }
        // Verrouiller le centre pendant le zoom (pinch ne déplace pas le curseur)
        map.on('zoomstart', () => { lockedCenter = map.getCenter() })
        map.on('zoomend',   () => {
          if (lockedCenter) map.panTo(lockedCenter, {animate:false})
          lockedCenter = null
          syncCircle()
        })
        map.on('move', syncCircle)
        map.on('moveend', syncCircle)

        // Long-press sur la carte → déplace le point de rencontre
        // user-select:none pour éviter la sélection de texte pendant l'appui long
        if (divRef.current) {
          (divRef.current as HTMLElement).style.userSelect = 'none';
          (divRef.current as HTMLElement).style.webkitUserSelect = 'none';
        }
        let lpTimer: ReturnType<typeof setTimeout>|null = null
        map.on('mousedown touchstart', (e:any) => {
          // Prévenir la sélection de texte du navigateur
          if (e.originalEvent) { try { e.originalEvent.preventDefault() } catch {} }
          const latlng = e.latlng || (e.touches&&e.touches[0]?map.mouseEventToLatLng(e.touches[0]):null)
          if (!latlng) return
          lpTimer = setTimeout(() => {
            map.panTo(latlng, {animate:true})
            syncCircle()
          }, 600)
        })
        map.on('mouseup touchend mousemove touchmove', () => {
          if (lpTimer) { clearTimeout(lpTimer); lpTimer=null }
        })

        // (géolocalisation gérée dans le bloc selfMarker ci-dessus)

        // Zoom initial
        map.setZoom(rayonToZoom(rayon), { animate:false })

        // Étoiles colorées par genre — positions aléatoires (anti-triangulation)
        // Si un profil bot a des coords configurées dans le QG (localStorage), on les utilise
        // avec un fuzz de ±50m pour respecter la règle LPD
        const botCfg: Record<string, {lat:number;lng:number}> = {}
        try {
          const raw = localStorage.getItem('clutch_bots_config')
          if (raw) {
            const cfgs = JSON.parse(raw) as Array<{id:string;lat?:number;lng?:number}>
            cfgs.forEach(c => { if (c.lat && c.lng) botCfg[c.id] = {lat:c.lat, lng:c.lng} })
          }
        } catch {}

        const rawGenders = [
          ...profiles.map(p => genderKey((p as any).gender)),
          'X' as GenderKey,
        ].slice(0, 10) as GenderKey[]
        const genders = rawGenders
        const stars = makeStars(ME[0], ME[1], rayon, genders)
        stars.forEach((s, si) => {
          // Si le profil correspondant a des coords bot configurées, les utiliser (avec fuzz)
          const prof = profiles[si]
          let starLat = s.lat, starLng = s.lng
          if (prof) {
            const profIdShort = (prof.id||'').slice(0,8)
            const cfg = botCfg[profIdShort] || botCfg[prof.id]
            if (cfg) {
              const [fLat, fLng] = fuzzPosition(cfg.lat, cfg.lng, prof.id)
              starLat = fLat; starLng = fLng
            }
          }
          const color = GC[s.gender]
          // Étoiles cliquables si profil bot — taille plus grande + pointer-events actifs
          const clickable = !!prof
          const marker = L.marker([starLat, starLng], { icon: L.divIcon({
            html:`<div class="cs cs${s.v}" style="--gc:${color};animation-delay:${s.delay}s;width:${clickable?16:10}px;height:${clickable?16:10}px;cursor:${clickable?'pointer':'default'}"></div>`,
            className:'', iconSize:[clickable?16:10,clickable?16:10], iconAnchor:[clickable?8:5,clickable?8:5],
          })}).addTo(map)
          if (prof && clickable) {
            marker.on('click', (e:any) => {
              const pt = e.containerPoint
              setStarTooltip({ profile: prof, x: pt.x, y: pt.y })
              if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current)
              tooltipTimerRef.current = setTimeout(() => setStarTooltip(null), 3500)
            })
          }
        })

        // Événements
        EVTS.forEach(e => L.marker([e.lat,e.lng], { icon: L.divIcon({
          html:`<div class="cevt">${e.e}</div>`,
          className:'', iconSize:[28,28], iconAnchor:[14,14],
        })}).addTo(map))

        // Ma position — SUPERNOVA
        const photo = userPhoto
          ? `<img src="${userPhoto}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;object-fit:cover;border:2px solid #E27C00;z-index:2;"/>`
          : `<div class="sn-core"></div>`
        const selfMarker = L.marker(ME, { icon: L.divIcon({
          html:`<div class="sn-wrap"><div class="sn-r sn-r1"></div><div class="sn-r sn-r2"></div><div class="sn-r sn-r3"></div>${photo}</div>`,
          className:'', iconSize:[60,60], iconAnchor:[30,30],
        }), zIndexOffset:1000 }).addTo(map)

        // Géolocalisation → déplacer le marker photo à la vraie position
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!mounted) return
              const loc: [number,number] = [pos.coords.latitude, pos.coords.longitude]
              gpsRef.current = loc
              selfMarker.setLatLng(loc)
              map.panTo(loc, { animate:true })
              onGpsUpdate?.(loc)
            },
            () => {},
            { timeout:8000, maximumAge:60000 }
          )
        }

        // Expose getCenter + recenter → utilise la position GPS réelle (gpsRef)
        if (onReady) onReady(
          () => { const c = map.getCenter(); return [c.lat, c.lng] as [number,number] },
          () => { map.panTo(gpsRef.current, {animate:true}); setTimeout(syncCircle, 400) }
        )

        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (mounted) {
            map.invalidateSize({ pan:false })
            setTimeout(() => { if (mounted) map.invalidateSize({ pan:false }) }, 200)
          }
        }))
      })
    }

    const ex = document.getElementById('leaflet-css') as HTMLLinkElement
    ex?.sheet ? init() : setTimeout(init, 60)

    return () => { mounted=false; mapRef.current?.remove(); mapRef.current=null; circleRef.current=null; haloRef.current=null; fillRef.current=null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Rayon dynamique — zoom calculé via getBoundsZoom (toujours exact)
  useEffect(() => {
    const map = mapRef.current
    const circle = circleRef.current
    if (!map || !circle) return
    const rm = rayon * 1000
    const center = map.getCenter()
    // Mettre à jour rayon sur les 3 couches
    circle.setLatLng(center); circle.setRadius(rm)
    if (haloRef.current) { haloRef.current.setLatLng(center); haloRef.current.setRadius(rm) }
    if (fillRef.current) { fillRef.current.setLatLng(center); fillRef.current.setRadius(rm) }
    // Zoom optimal : Leaflet calcule lui-même le bon niveau pour que le cercle rentre dans l'écran
    try {
      const bounds = circle.getBounds()
      const idealZoom = map.getBoundsZoom(bounds, false, [48, 48]) // 48px de padding
      map.setZoom(idealZoom, { animate:true })
    } catch { map.setZoom(rayonToZoom(rayon), { animate:true }) }
    // Re-sync après animation (iOS)
    setTimeout(() => {
      if (!mapRef.current || !circleRef.current) return
      const c = mapRef.current.getCenter()
      circleRef.current.setLatLng(c)
      haloRef.current?.setLatLng(c)
      fillRef.current?.setLatLng(c)
    }, 500)
  }, [rayon])

  // Map size dynamique — déclenché par un ResizeObserver sur le container
  useEffect(() => {
    if (!divRef.current) return
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => mapRef.current?.invalidateSize({ pan:false }))
    })
    ro.observe(divRef.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden' }}>
      {/* Épingle centrale — montre le lieu de RDV voulu (indépendant du GPS) */}
      {showPin && (
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-100%)',
          zIndex:800,pointerEvents:'none',display:'flex',flexDirection:'column',alignItems:'center',gap:2}}>
          <div style={{width:24,height:24,borderRadius:'50% 50% 50% 0',background:C.orange,
            transform:'rotate(-45deg)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:C.bg,transform:'rotate(45deg)'}}/>
          </div>
          <div style={{width:2,height:12,background:C.orange,borderRadius:1,opacity:.7}}/>
        </div>
      )}
      {/* hint inside map removed — see carte overlay */}
      <style>{`
        .leaflet-container{background:${night?'#2A1E28':'#e8e0d8'}!important;}
        .leaflet-tile-pane{filter:${night?'brightness(1.55) contrast(0.88) saturate(0.5) hue-rotate(5deg)':'saturate(1.1) contrast(1.05)'};}
        /* Cercle RDV — ligne fine seule, sobre */
        .clutch-radius path{stroke:#FFBF9E!important;fill:transparent!important;stroke-width:1px!important;stroke-opacity:.5!important;stroke-dasharray:none!important;transition:d .35s cubic-bezier(.22,1,.36,1);}
        .clutch-halo path{display:none!important;}
        .clutch-fill path{display:none!important;}
        .clutch-fill path{transition:d .35s cubic-bezier(.22,1,.36,1)!important;}
        /* étoiles 4 branches — vrai style étoile cristalline */
        .cs{
          width:${night?10:8}px;height:${night?10:8}px;
          background:var(--gc,#FFBF9E);
          clip-path:polygon(50% 0%,56% 44%,100% 50%,56% 56%,50% 100%,44% 56%,0% 50%,44% 44%);
          filter:drop-shadow(0 0 ${night?4:3}px var(--gc,#FFBF9E)) drop-shadow(0 0 ${night?8:5}px var(--gc,#FFBF9E88));
          opacity:${night?1:.9};}
        .cs0{animation:s0 2.7s ease-in-out infinite;}
        .cs1{animation:s1 3.3s ease-in-out infinite;}
        .cs2{animation:s2 2.1s ease-in-out infinite;}
        .cs3{animation:s3 3.8s ease-in-out infinite;}
        .cs4{animation:s4 2.4s ease-in-out infinite;}
        @keyframes s0{0%,100%{opacity:.2;transform:scale(.4) rotate(0deg)}40%{opacity:1;transform:scale(1.5) rotate(45deg)}80%{opacity:.5;transform:scale(.8) rotate(20deg)}}
        @keyframes s1{0%,100%{opacity:.9;transform:scale(1.1) rotate(45deg)}55%{opacity:.15;transform:scale(.35) rotate(0deg)}}
        @keyframes s2{0%,100%{opacity:.35;transform:scale(.6) rotate(20deg)}30%{opacity:1;transform:scale(1.6) rotate(65deg)}}
        @keyframes s3{0%,100%{opacity:1;transform:scale(1.2) rotate(0deg)}45%{opacity:.05;transform:scale(.25) rotate(45deg)}}
        @keyframes s4{0%,100%{opacity:.55;transform:scale(.85) rotate(30deg)}25%{opacity:1;transform:scale(1.4) rotate(75deg)}}
        /* événements */
        .cevt{width:28px;height:28px;border-radius:8px;background:rgba(26,14,20,.85);
          border:1px solid rgba(255,191,158,.35);display:flex;align-items:center;
          justify-content:center;font-size:14px;backdrop-filter:blur(4px);}
        /* supernova */
        .sn-wrap{position:relative;width:60px;height:60px;}
        .sn-r{position:absolute;top:50%;left:50%;border-radius:50%;
          border:1.5px solid rgba(226,124,0,.85);
          transform:translate(-50%,-50%) scale(0);
          box-shadow:0 0 6px 2px rgba(226,124,0,.3);}
        .sn-r1{width:18px;height:18px;animation:snX 2.5s ease-out infinite 0s;}
        .sn-r2{width:18px;height:18px;animation:snX 2.5s ease-out infinite .83s;}
        .sn-r3{width:18px;height:18px;animation:snX 2.5s ease-out infinite 1.67s;}
        @keyframes snX{0%{transform:translate(-50%,-50%) scale(.15);opacity:1;}80%{opacity:.3;}100%{transform:translate(-50%,-50%) scale(3);opacity:0;}}
        .sn-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:16px;height:16px;border-radius:50%;z-index:2;
          background:radial-gradient(circle at 35% 35%,#fff 0%,#E27C00 55%,#FFBF9E 100%);
          box-shadow:0 0 14px 5px rgba(226,124,0,.8),0 0 28px 10px rgba(226,124,0,.3);
          animation:snC 1.8s ease-in-out infinite;}
        @keyframes snC{0%,100%{box-shadow:0 0 14px 5px rgba(226,124,0,.8),0 0 28px 10px rgba(226,124,0,.3);}
          50%{box-shadow:0 0 20px 8px rgba(255,191,158,1),0 0 40px 14px rgba(226,124,0,.5);}}
      `}</style>
      <div ref={divRef} style={{ position:'absolute',inset:0 }}/>
      {/* Tooltip étoile — mini preview profil */}
      {starTooltip && (()=>{
        const p = enrichProfile(starTooltip.profile)
        const gk = genderKey((p as any).gender)
        const color = GC[gk]
        // Position: décaler si trop à droite
        const x = Math.min(starTooltip.x, (divRef.current?.clientWidth||300) - 180)
        const y = Math.max(starTooltip.y - 80, 10)
        return (
          <div onClick={()=>setStarTooltip(null)} style={{
            position:'absolute', left:x, top:y, zIndex:900,
            background:'rgba(61,26,51,.96)', backdropFilter:'blur(12px)',
            border:`1.5px solid ${color}55`, borderRadius:14,
            padding:'8px 12px', display:'flex', alignItems:'center', gap:10,
            pointerEvents:'auto', cursor:'pointer', minWidth:160, maxWidth:200,
            boxShadow:`0 4px 20px rgba(0,0,0,.5)`,
            animation:'tooltipIn .2s cubic-bezier(.22,1,.36,1)',
          }}>
            <style>{`@keyframes tooltipIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}`}</style>
            {p.photo_url
              ? <img src={p.photo_url} alt="" style={{width:38,height:38,borderRadius:10,objectFit:'cover',objectPosition:'50% 30%',border:`2px solid ${color}66`,flexShrink:0}}/>
              : <div style={{width:38,height:38,borderRadius:10,background:`${color}22`,border:`2px solid ${color}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><GenderSvg gk={gk} size={20}/></div>
            }
            <div style={{minWidth:0}}>
              <div style={{fontSize:13,fontWeight:900,color:'#FAFAFA',display:'flex',alignItems:'center',gap:5}}>
                {p.name} <GenderSvg gk={gk} size={13}/>
              </div>
              {(p as any).age && <div style={{fontSize:11,color:'rgba(250,250,250,.6)'}}>{(p as any).age} ans</div>}
              <div style={{fontSize:10,color:'rgba(250,250,250,.5)',marginTop:1}}>
                📍 ~{(300 + Math.floor(Math.random() * 700))}m
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// SPLASH
// ═════════════════════════════════════════════════════════════
function Splash({ onDone }:{onDone:()=>void}) {
  const [ph,setPh] = useState(0)
  useEffect(()=>{
    const ts=[
      setTimeout(()=>setPh(1),150), setTimeout(()=>setPh(2),550),
      setTimeout(()=>setPh(3),1000), setTimeout(()=>setPh(6),2100),
      setTimeout(onDone,2650),
    ]
    return()=>ts.forEach(clearTimeout)
  },[onDone])
  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,background:C.bordeaux,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',opacity:ph===6?0:1,transition:'opacity .6s ease'}}>
      <style>{`
        .hb{opacity:${ph>=1?1:0};transform-origin:143px 220px;transform:scale(${ph>=1?1:.5});transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1);}
        .ht{opacity:${ph>=2?1:0};transform:translateY(${ph>=2?0:-10}px);transition:opacity .7s ease,transform .7s cubic-bezier(.34,1.2,.64,1);}
        .hb2{opacity:${ph>=2?1:0};transform:translateY(${ph>=2?0:10}px);transition:opacity .7s ease .1s,transform .7s cubic-bezier(.34,1.2,.64,1) .1s;}
        .hc{opacity:${ph>=3?1:0};transform:translateX(${ph>=3?0:-14}px);transition:opacity .6s ease,transform .6s cubic-bezier(.22,1,.36,1);}
        .htch{opacity:${ph>=3?1:0};transform:translateX(${ph>=3?0:14}px);transition:opacity .6s ease,transform .6s cubic-bezier(.22,1,.36,1);}
        .htag{opacity:${ph>=3?1:0};transition:opacity .8s ease .1s;}
      `}</style>
      <svg width="245" viewBox="30 140 230 210" xmlns="http://www.w3.org/2000/svg">
        <g className="hb"><path fill="#FFBF9E" d="M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"/></g>
        <g className="ht"><polygon fill="#E27C00" points="153.217,202.325 183.263,201.578 188.846,195.994 182.948,190.122 153.521,190.121"/></g>
        <g className="hb2"><polygon fill="#E27C00" points="127.452,257.386 133.035,251.803 133.422,236.09 106.192,236.09"/></g>
        <g className="hc">
          <path fill="#FFBF9E" d="M58.82,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C63.997,332.266,58.82,326.489,58.82,317.094z"/>
          <path fill="#FFBF9E" d="M109.315,331.526h-18.87v-28.845h6.037v23.588h12.833V331.526z"/>
          <path fill="#FFBF9E" d="M120.391,320.952c0,3.638,2.179,5.956,6.037,5.956c3.877,0,6.057-2.318,6.057-5.956v-18.271h6.036v18.891c0,6.396-4.697,10.693-12.093,10.693c-7.376,0-12.074-4.297-12.074-10.693v-18.891h6.037V320.952z"/>
        </g>
        <g className="htch">
          <path fill="#E27C00" d="M152.555,331.526V307.84h-8.655v-5.158h23.348v5.158h-8.655v23.687H152.555z"/>
          <path fill="#E27C00" d="M170.207,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C175.384,332.266,170.207,326.489,170.207,317.094z"/>
          <path fill="#E27C00" d="M220.861,331.526v-12.054h-12.992v12.054h-6.037v-28.845h6.037v11.635h12.992v-11.635h6.037v28.845H220.861z"/>
        </g>
      </svg>
      <p className="htag" style={{fontFamily:'-apple-system,sans-serif',fontSize:12,fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(255,191,158,0.6)',marginTop:10}}>Someone's waiting</p>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// LOGIN / REGISTER
// ═════════════════════════════════════════════════════════════
function Input({ label,...props }:{label:string}&React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>{label}</div>
      <input {...props} style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 14px',fontSize:15,color:C.white,outline:'none',fontFamily:'inherit',...props.style}}/>
    </div>
  )
}
function Btn({children,variant='primary',loading,...props}:{children:React.ReactNode;variant?:'primary'|'secondary';loading?:boolean}&React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const p=variant==='primary'
  return <button {...props} disabled={loading||props.disabled} style={{width:'100%',padding:'15px',background:p?C.salmon:'transparent',color:p?C.bg:C.whiteMid,border:p?'none':`1px solid ${C.border}`,borderRadius:14,fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:loading?.7:1,...props.style}}>{loading?'…':children}</button>
}

function LoginScreen({onSuccess,onRegister,showToast}:{onSuccess:(p:Profile)=>void;onRegister:()=>void;showToast:(m:string,c?:string)=>void}) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [showPwd,setShowPwd]=useState(false)
  const login=async()=>{ setLoading(true); const{data,error}=await supabase.auth.signInWithPassword({email:email.trim(),password:pass}); if(error){showToast('Email ou mot de passe incorrect',C.red);setLoading(false);return} const{data:p}=await supabase.from('profiles').select('*').eq('id',data.user.id).single(); setLoading(false); if(p)onSuccess(p) }
  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:'-.05em',color:C.salmon,marginBottom:6}}>CLU<span style={{color:C.orange}}>TCH</span></div>
          <div style={{fontSize:12,color:C.whiteMid,letterSpacing:'.15em',textTransform:'uppercase'}}>Welcome</div>
        </div>
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com" onKeyDown={e=>e.key==='Enter'&&login()}/>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>Password</div>
          <div style={{position:'relative'}}>
            <input type={showPwd?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&login()} style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 44px 13px 14px',fontSize:15,color:C.white,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
            <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:18,color:'rgba(255,255,255,.4)',padding:4,lineHeight:1}}>{showPwd?'🙈':'👁'}</button>
          </div>
        </div>
        <div style={{marginBottom:14}}><Btn loading={loading} onClick={login}>Sign in</Btn></div>
        <Btn variant="secondary" onClick={onRegister}>Create account</Btn>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:C.whiteMid}}><a href="/" style={{color:C.salmon}}>← Clutch home</a></div>
        <div style={{textAlign:'center',marginTop:14,fontSize:10,color:'rgba(250,250,250,0.35)',lineHeight:1.6}}>
          By using Clutch, you agree to our{' '}
          <a href="/terms" style={{color:'#FFBF9E',textDecoration:'underline'}}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{color:'#FFBF9E',textDecoration:'underline'}}>Privacy Policy</a>
        </div>
      </div>
    </div>
  )
}
function RegisterScreen({onSuccess,onLogin,showToast}:{onSuccess:(p:Profile)=>void;onLogin:()=>void;showToast:(m:string,c?:string)=>void}) {
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [showPwd,setShowPwd]=useState(false)
  const [name,setName]=useState('')
  const [gender,setGender]=useState<'woman'|'man'|'other'|''>('')
  const [birthdate,setBirthdate]=useState('')
  const [loading,setLoading]=useState(false)

  const validate18 = (dob: string): boolean => {
    if (!dob) return false
    const birth = new Date(dob)
    const now = new Date()
    const age18 = new Date(birth.getFullYear()+18, birth.getMonth(), birth.getDate())
    return now >= age18
  }

  const computeAge = (dob: string): number => {
    if (!dob) return 0
    const birth = new Date(dob)
    const now = new Date()
    let age = now.getFullYear() - birth.getFullYear()
    const m = now.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
    return age
  }

  const register = async () => {
    if (!email.trim() || !pass || !name.trim()) { showToast('Remplis tous les champs', C.red); return }
    if (!gender) { showToast('Choisis ton genre', C.red); return }
    if (!birthdate) { showToast('Entre ta date de naissance', C.red); return }
    if (!validate18(birthdate)) { showToast('Tu dois avoir au moins 18 ans pour utiliser Clutch', C.red); return }
    if (name.trim().length > 30) { showToast('First name too long (max 30 characters)', C.red); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password: pass })
    if (error) { showToast(error.message, C.red); setLoading(false); return }
    if (data.user) {
      const age = computeAge(birthdate)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email.trim(),
        name: name.trim().slice(0,30),
        gender,
        birth_date: birthdate,
        age,
        account_type: 'free',
        reliability_score: 100,
      })
      const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
      setLoading(false)
      if (p) onSuccess(p)
    }
  }

  const GENDERS: {key:'woman'|'man'|'other'; label:string; gk:GenderKey; color:string}[] = [
    {key:'woman', label:'Woman', gk:'F', color:GC.F},
    {key:'man', label:'Man', gk:'M', color:GC.M},
    {key:'other', label:'Other', gk:'X', color:GC.X},
  ]

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px',overflowY:'auto'}}>
      <div style={{width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:'-.05em',color:C.salmon,marginBottom:6}}>CLU<span style={{color:C.orange}}>TCH</span></div>
          <div style={{fontSize:12,color:C.whiteMid}}>Create your account — 1 minute</div>
        </div>

        {/* Prénom */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.whiteMid,marginBottom:5,letterSpacing:'.06em',textTransform:'uppercase'}}>First name <span style={{color:C.red}}>*</span></div>
          <input
            value={name} onChange={e=>setName(e.target.value.slice(0,30))} placeholder="Sarah" maxLength={30}
            style={{width:'100%',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',fontSize:15,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon,boxSizing:'border-box'}}
          />
          <div style={{fontSize:10,color:C.whiteMid,marginTop:3,textAlign:'right'}}>{name.length}/30 · Locked after signup</div>
        </div>

        {/* Genre — obligatoire */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.whiteMid,marginBottom:8,letterSpacing:'.06em',textTransform:'uppercase'}}>Gender <span style={{color:C.red}}>*</span></div>
          <div style={{display:'flex',gap:8}}>
            {GENDERS.map(g=>(
              <button key={g.key} onClick={()=>setGender(g.key)}
                style={{flex:1,padding:'11px 8px',borderRadius:12,border:`2px solid ${gender===g.key?g.color:C.border}`,background:gender===g.key?`${g.color}18`:'transparent',color:gender===g.key?g.color:C.whiteMid,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',transition:'all .2s',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                <GenderSvg gk={g.gk} size={20} style={{filter:gender===g.key?'none':'brightness(0) invert(1) opacity(0.4)'}}/>
                <span style={{fontSize:11}}>{g.label}</span>
              </button>
            ))}
          </div>
          <div style={{fontSize:10,color:C.whiteMid,marginTop:4}}>Locked after signup · Visible on your profile</div>
        </div>

        {/* Date de naissance */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:C.whiteMid,marginBottom:5,letterSpacing:'.06em',textTransform:'uppercase'}}>Date of birth <span style={{color:C.red}}>*</span></div>
          <input
            type="date" value={birthdate} onChange={e=>setBirthdate(e.target.value)}
            max={new Date(Date.now() - 18*365.25*24*3600*1000).toISOString().split('T')[0]}
            style={{width:'100%',background:C.bgCard,border:`1px solid ${birthdate&&!validate18(birthdate)?C.red:C.border}`,borderRadius:12,padding:'12px 14px',fontSize:15,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon,boxSizing:'border-box',colorScheme:'dark'}}
          />
          {birthdate && !validate18(birthdate) && (
            <div style={{fontSize:11,color:C.red,marginTop:4}}>You must be at least 18 years old to use Clutch</div>
          )}
          <div style={{fontSize:10,color:C.whiteMid,marginTop:3}}>Locked · Your age (not the date) will be visible on your profile</div>
        </div>

        {/* Email */}
        <Input label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com"/>

        {/* Mot de passe */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>Password</div>
          <div style={{position:'relative'}}>
            <input type={showPwd?'text':'password'} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 44px 13px 14px',fontSize:15,color:C.white,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
            <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:18,color:'rgba(255,255,255,.4)',padding:4,lineHeight:1}}>{showPwd?'🙈':'👁'}</button>
          </div>
        </div>

        <div style={{marginBottom:12,marginTop:4}}><Btn loading={loading} onClick={register}>Create my account</Btn></div>
        <Btn variant="secondary" onClick={onLogin}>Already have an account?</Btn>
        <div style={{textAlign:'center',marginTop:14,fontSize:10,color:'rgba(250,250,250,0.35)',lineHeight:1.6}}>
          By creating an account, you agree to our{' '}
          <a href="/terms" style={{color:'#FFBF9E',textDecoration:'underline'}}>Terms</a>
          {' '}and our{' '}
          <a href="/privacy" style={{color:'#FFBF9E',textDecoration:'underline'}}>Privacy Policy</a>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// COMPOSANTS UI
// ═════════════════════════════════════════════════════════════
function Toast({msg,color,onDone}:{msg:string;color:string;onDone:()=>void}) {
  useEffect(()=>{const t=setTimeout(onDone,3200);return()=>clearTimeout(t)},[onDone])
  const isSuccess = color===C.green
  const isError = color===C.red
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,padding:'env(safe-area-inset-top,0px) 12px 0',pointerEvents:'none'}}>
      <div style={{
        background: isSuccess ? `linear-gradient(135deg,rgba(20,60,30,.97),rgba(10,40,20,.97))`
          : isError ? `linear-gradient(135deg,rgba(60,10,10,.97),rgba(40,5,5,.97))`
          : `linear-gradient(135deg,rgba(61,26,51,.97),rgba(42,15,32,.97))`,
        backdropFilter:'blur(20px)',
        border:`1.5px solid ${color}55`,
        borderRadius:16,
        padding:'11px 16px',
        display:'flex', alignItems:'center', gap:10,
        boxShadow:`0 4px 24px ${color}33, 0 1px 0 ${color}22 inset`,
        animation:'toastIn .4s cubic-bezier(.22,1,.36,1)',
        marginTop:6,
      }}>
        <div style={{width:6,height:6,borderRadius:'50%',background:color,flexShrink:0,boxShadow:`0 0 8px ${color}`}}/>
        <span style={{fontSize:13,fontWeight:800,color:C.white,letterSpacing:'-.01em',lineHeight:1.3}}>{msg}</span>
      </div>
    </div>
  )
}
function Av({src,name,size=44}:{src?:string|null;name:string;size?:number}) {
  const [ok,setOk]=useState(!!src); useEffect(()=>setOk(!!src),[src])
  return ok&&src ? <img src={src} alt={name} onError={()=>setOk(false)} style={{width:size,height:size,borderRadius:size*.28,objectFit:'cover',objectPosition:'50% 30%',flexShrink:0}}/> : <div style={{width:size,height:size,borderRadius:size*.28,background:`linear-gradient(135deg,${C.bordeaux},${C.bordeauxLight})`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.35,fontWeight:900,color:C.salmon,flexShrink:0}}>{name?.[0]||'?'}</div>
}
function Score({v}:{v:number}) {
  const color = v >= 80 ? C.green : v >= 60 ? C.orange : C.red
  const [showTip, setShowTip] = useState(false)
  return (
    <span style={{position:'relative',display:'inline-flex',cursor:'pointer'}} onClick={e=>{e.stopPropagation();setShowTip(s=>!s)}}>
      <span style={{background:`${color}18`,border:`1px solid ${color}55`,borderRadius:20,padding:'2px 9px',fontSize:10,fontWeight:800,color}}>{v<60?'🐰':v<80?'⚠️':'★'} {v||'–'}</span>
      {showTip && (
        <div style={{position:'absolute',bottom:'100%',left:'50%',transform:'translateX(-50%)',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,padding:'6px 10px',fontSize:10,color:C.white,whiteSpace:'nowrap',zIndex:10,marginBottom:6,pointerEvents:'none'}}>
          {v>=90?'⭐ Very reliable — always shows up':v>=70?'✓ Reliable — rarely cancels':v>=50?'⚠️ Some recent cancellations':'🚨 Unreliable — cancels often'}
          <div style={{position:'absolute',top:'100%',left:'50%',transform:'translateX(-50%)',borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderTop:`5px solid ${C.bgCard}`}}/>
        </div>
      )}
    </span>
  )
}
// Badge lapin — affiché si score < 60 (ghosteur récidiviste)
function RabbitBadge() {
  return <span title="Has ghosted before" style={{fontSize:12}}>🐰</span>
}

// Tab bar — uniquement en mode 'app'
type TabBadge =
  | {type:'clutch-new'; count:number}   // nouveau clutch reçu → rouge urgent
  | {type:'message'; count:number}      // message non lu → bleu
  | {type:'verrou'}                     // verrou confirmé → vert pulse
  | {type:'urgent'; count:number}       // générique urgent → rose
  | {type:'activity'}                   // activité → orange dot
  | {type:'info'}                       // info → blanc dot
  | null
function TabBar({tab,set,lang,badges}:{tab:MainTab;set:(t:MainTab)=>void;lang:Lang;badges?:Partial<Record<MainTab,TabBadge>>}) {
  const t = useT(lang)
  const tabs:[MainTab,string][]=[['presences',t('tab.presences')],['evenements',t('tab.events')],['clutchs',t('tab.clutchs')],['profil',t('tab.profil')]]
  return (
    <>
      <style>{`
        @keyframes badgePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.7}}
        @keyframes badgeUrgent{0%,100%{transform:scale(1)}20%{transform:scale(1.2)}40%{transform:scale(.95)}60%{transform:scale(1.1)}80%{transform:scale(.98)}}
      `}</style>
      <div style={{position:'fixed',bottom:0,left:0,right:0,height:72,background:`${C.bg}f0`,borderTop:`1px solid ${C.border}`,backdropFilter:'blur(16px)',display:'flex',zIndex:1000}}>
        {tabs.map(([id,label])=>{
          const badge = badges?.[id] ?? null
          const isActive = tab===id
          return (
            <button key={id} onClick={()=>set(id)} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:3,border:'none',background:'transparent',cursor:'pointer',padding:0,position:'relative'}}>
              {/* Badge — différencié par type */}
              {badge && (()=>{
                const base: React.CSSProperties = {position:'absolute',top:3,right:'calc(50% - 18px)',minWidth:16,height:16,borderRadius:8,border:`1.5px solid ${C.bg}`,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2,padding:'0 3px'}
                const dot: React.CSSProperties = {position:'absolute',top:5,right:'calc(50% - 16px)',width:8,height:8,borderRadius:'50%',border:`1.5px solid ${C.bg}`,zIndex:2}
                const num = (n:number) => <span style={{fontSize:9,fontWeight:900,color:'#fff',lineHeight:1}}>{n>9?'9+':n}</span>
                if(badge.type==='clutch-new') return (
                  <div style={{...base,background:'#E8317A',animation:'badgeUrgent 1s ease-in-out infinite',boxShadow:'0 0 10px rgba(232,49,122,.7)'}}>
                    {num(badge.count)}
                  </div>
                )
                if(badge.type==='message') return (
                  <div style={{...base,background:'#4A90D9',animation:'badgePulse 2s ease-in-out infinite',boxShadow:'0 2px 8px rgba(74,144,217,.5)'}}>
                    {num(badge.count)}
                  </div>
                )
                if(badge.type==='verrou') return (
                  <div style={{...dot,background:'#22C55E',animation:'badgePulse 1.5s ease-in-out infinite',boxShadow:'0 2px 6px rgba(34,197,94,.5)'}}/>
                )
                if(badge.type==='urgent') return (
                  <div style={{...base,background:'#E8317A',animation:'badgeUrgent 1.5s ease-in-out infinite',boxShadow:'0 2px 8px rgba(232,49,122,.5)'}}>
                    {num(badge.count)}
                  </div>
                )
                if(badge.type==='activity') return (
                  <div style={{...dot,background:C.orange,animation:'badgePulse 2s ease-in-out infinite',boxShadow:'0 2px 6px rgba(200,134,10,.4)'}}/>
                )
                return <div style={{...dot,width:8,height:8,background:'rgba(255,255,255,.5)'}}/>
              })()}
              <TabSvg id={id} size={32} active={isActive}/>
              <div style={{fontSize:10,fontWeight:isActive?800:500,color:isActive?C.salmon:'rgba(255,255,255,0.28)',letterSpacing:'.04em'}}>{label}</div>
            </button>
          )
        })}
      </div>
    </>
  )
}

// Modal suppression compte
function DeleteModal({userId,onDeleted,onClose,showToast}:{userId:string;onDeleted:()=>void;onClose:()=>void;showToast:(m:string,c?:string)=>void}) {
  const [step,setStep]=useState<'warn'|'type'|'doing'>('warn'); const [typed,setTyped]=useState('')
  const doDelete=async()=>{
    setStep('doing')
    try {
      // Appel Edge Function delete-account (supprime auth.users via service_role)
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      })
      if (!res.ok) {
        // Fallback : anonymisation locale si Edge Function indisponible
        await supabase.from('profiles').update({name:'Compte supprimé',bio:null,photo_url:null,interests:[],is_available:false,available_until:null,deleted_at:new Date().toISOString()}).eq('id',userId)
        await supabase.auth.signOut()
      }
      showToast('✓ Account deleted. See you!', C.green)
      onDeleted()
    } catch {
      showToast('Error — try again', C.red)
      setStep('warn')
    }
  }
  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)'}} onClick={step==='doing'?undefined:onClose}/>
      <div style={{position:'relative',background:C.bg,borderRadius:'20px 20px 0 0',padding:'24px 20px 48px',animation:'modalIn .4s cubic-bezier(.22,1,.36,1)'}}>
        {step==='doing'?<div style={{textAlign:'center',padding:'30px 0'}}><div style={{fontSize:32,marginBottom:12}}>⏳</div><div style={{fontSize:14,color:C.whiteMid}}>Deleting…</div></div>
        :step==='warn'?<><div style={{fontSize:18,fontWeight:900,color:C.red,marginBottom:8}}>🗑 Delete my account</div><div style={{fontSize:13,color:C.whiteMid,lineHeight:1.6,marginBottom:20}}>This action is <strong style={{color:C.white}}>irreversible</strong>. All your data will be erased (Swiss LPD).</div><button onClick={()=>setStep('type')} style={{width:'100%',padding:'13px',background:'rgba(239,68,68,.12)',border:'1.5px solid rgba(239,68,68,.4)',borderRadius:12,color:C.red,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>Continue →</button><button onClick={onClose} style={{width:'100%',padding:'13px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:12,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button></>
        :<><div style={{fontSize:16,fontWeight:900,color:C.red,marginBottom:8}}>Final confirmation</div><div style={{fontSize:13,color:C.whiteMid,marginBottom:16}}>Type <strong style={{color:C.white}}>DELETE</strong> :</div><input value={typed} onChange={e=>setTyped(e.target.value.toUpperCase())} placeholder="DELETE" style={{width:'100%',background:'rgba(239,68,68,.08)',border:`1.5px solid ${typed==='DELETE'?C.red:'rgba(255,255,255,.1)'}`,borderRadius:12,padding:'13px 14px',fontSize:16,fontWeight:800,letterSpacing:'.1em',color:C.red,outline:'none',fontFamily:'inherit',caretColor:C.red,marginBottom:16}}/><button onClick={doDelete} disabled={typed!=='DELETE'} style={{width:'100%',padding:'14px',background:typed==='DELETE'?C.red:'rgba(239,68,68,.12)',border:'none',borderRadius:12,color:typed==='DELETE'?'#fff':'rgba(239,68,68,.4)',fontSize:14,fontWeight:900,cursor:typed==='DELETE'?'pointer':'default',fontFamily:'inherit',marginBottom:10}}>🗑 Delete permanently</button><button onClick={onClose} style={{width:'100%',padding:'13px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:12,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button></>}
      </div>
    </div>
  )
}

// Send Clutch Modal
// IDs partiels des profils TEST (8 premiers chars du UUID)
const TEST_PROFILE_PREFIXES = [
  '6cf880cf', // Anaïs TEST
  '38dda77a', // Camille TEST
  'f3d1b492', // Camille
  'b1e2cc39', // Léa TEST
  '074e38bb', // Lucas TEST
  '1ceb0c71', // Lucas
  'c504c886', // Sofia TEST
  'df99921f', // Thomas TEST
  '04a65be7', // TestClutch
  '6180c714', // TestMeuf
]
function isTestProfile(id: string): boolean { return TEST_PROFILE_PREFIXES.some(p => id.startsWith(p)) }

const BOT_ENRICHMENT: Record<string,{
  name:string; photo_url:string; bio:string; job:string; age:number;
  neighborhood:string; interests:string[]; languages:string[]; extraPhotos:string[];
  lastSeen:string; verified:boolean;
}> = {
  '6cf880cf': { name:'Anaïs', photo_url:'https://randomuser.me/api/portraits/women/68.jpg', bio:'Yoga & bonne humeur 🧘', job:'Prof de yoga RYT-500', age:29, neighborhood:'Pully', interests:['Yoga','Méditation','Randonnée','Cuisine végane','Bien-être'], languages:['Français','Anglais'], extraPhotos:[], lastSeen:'à l\'instant', verified:true },
  '38dda77a': { name:'Camille', photo_url:'https://randomuser.me/api/portraits/women/44.jpg', bio:'Café + vraies conversations ☕', job:'Designer UX', age:27, neighborhood:'Lausanne', interests:['Café','Design','Lectures','Randonnée','Musique'], languages:['Français','Anglais','Allemand'], extraPhotos:[], lastSeen:'il y a 5min', verified:true },
  'b1e2cc39': { name:'Léa', photo_url:'https://randomuser.me/api/portraits/women/55.jpg', bio:'Spontanée & curieuse 🌿', job:'Infirmière', age:26, neighborhood:'Ouchy', interests:['Natation','Lecture','Cuisine','Yoga','Musique'], languages:['Français'], extraPhotos:[], lastSeen:'il y a 3min', verified:true },
  '074e38bb': { name:'Lucas', photo_url:'https://randomuser.me/api/portraits/men/32.jpg', bio:'Apéros & sorties culturelles 🎭', job:'Architecte', age:30, neighborhood:'Paquis', interests:['Architecture','Jazz','Escalade','Cinéma','Design'], languages:['Français','Anglais'], extraPhotos:[], lastSeen:'il y a 12min', verified:true },
  'c504c886': { name:'Sofia', photo_url:'https://randomuser.me/api/portraits/women/26.jpg', bio:'Curieuse et spontanée ✨', job:'Marketing', age:25, neighborhood:'Flon', interests:['Art','Concerts','Gastronomie','Mode','Voyages'], languages:['Français','Espagnol'], extraPhotos:[], lastSeen:'à l\'instant', verified:true },
  'df99921f': { name:'Thomas', photo_url:'https://randomuser.me/api/portraits/men/41.jpg', bio:'Lecteur compulsif & bon vivant 📚', job:'Libraire', age:32, neighborhood:'Vieille Ville', interests:['Littérature','Vin','Cinéma','Histoire','Jazz'], languages:['Français','Anglais'], extraPhotos:[], lastSeen:'il y a 8min', verified:false },
  '04a65be7': { name:'Nathan', photo_url:'https://randomuser.me/api/portraits/men/22.jpg', bio:'Entrepreneur & explorateur 🚀', job:'Startup founder', age:28, neighborhood:'EPFL', interests:['Tech','Entrepreneuriat','Running','Voyage','Coffee'], languages:['Français','Anglais'], extraPhotos:[], lastSeen:'il y a 20min', verified:false },
  '6180c714': { name:'Emma', photo_url:'https://randomuser.me/api/portraits/women/33.jpg', bio:'Photographe & amoureuse du Léman 📷', job:'Photographe', age:24, neighborhood:'Lausanne', interests:['Photo','Art','Randonnée','Café','Musique'], languages:['Français','Anglais'], extraPhotos:[], lastSeen:'il y a 2min', verified:true },
  'f3d1b492': { name:'Nora', photo_url:'https://randomuser.me/api/portraits/women/62.jpg', bio:'Danseuse & épicurienne 💃', job:'Chorégraphe', age:31, neighborhood:'Prilly', interests:['Danse','Gastronomie','Théâtre','Yoga','Musique'], languages:['Français','Arabe'], extraPhotos:[], lastSeen:'il y a 15min', verified:false },
  '1ceb0c71': { name:'Hugo', photo_url:'https://randomuser.me/api/portraits/men/55.jpg', bio:'Médecin & coureur du dimanche 🏃', job:'Médecin interne', age:29, neighborhood:'CHUV', interests:['Running','Médecine','Lecture','Vélo','Cuisine'], languages:['Français','Anglais'], extraPhotos:[], lastSeen:'il y a 7min', verified:false },
}

// ─── Réponses bots contextuelles par prénom ────────────────────
const BOT_REPLY_BANK: Record<string, string[]> = {
  'Anaïs': [
    "Haha oui avec plaisir ! 😊 Je suis libre à partir de {time}",
    "Super idée {venue} ! J'adore cet endroit",
    "Ok parfait, à tout à l'heure ! 🙏",
    "Tu arrives comment ? Je serai près de l'entrée",
    "Trop bien, j'ai hâte ! ✨",
    "Parfait pour moi ! Je finis ma séance de yoga à {time} 🧘",
  ],
  'Camille': [
    "Oui ça me va ! Je passe par là de toute façon",
    "Cool, {venue} c'est sympa. À {time} ?",
    "Je confirme, à tout' !",
    "J'arrive dans 10min, je prends un café d'abord 😄",
    "Parfait, on se fait signe en arrivant",
    "Top ! J'apporte mon carnet de croquis 🎨",
  ],
  'Thomas': [
    "Carrément, bonne idée {venue}",
    "Je suis partant. {time} ça me va bien",
    "Top, à tout à l'heure alors",
    "Je serai là, pas de souci",
    "Ok, à +",
    "J'en profite pour finir mon chapitre 📚 à {time} c'est parfait",
  ],
  'Léa': [
    "Génial ! J'adore {venue} ☕",
    "Oui super, à {time} c'est parfait pour moi",
    "J'arrive ! Tu es comment habillé·e ?",
    "Trop contente ! À tout à l'heure 🎉",
    "Je confirme, rdv {venue} à {time}",
  ],
  'Lucas': [
    "Ouais cool, je suis dans le coin",
    "{venue} ça marche. À {time} ?",
    "Ok je valide, à +",
    "Bonne idée, j'y serai",
    "Nickel, à tout'",
    "Je passe devant le chantier de toute façon 🏗️ à {time} c'est bon",
  ],
  'Sofia': [
    "Oui oui ! {venue} c'est adorable 💕",
    "À {time} parfait, j'arrive direct",
    "J'ai hâte de te rencontrer !",
    "Super clutch ! On se fait signe en arrivant",
    "Génial, à tout à l'heure ✨",
    "Je prépare un pitch de 3min sur la vie 😂 à {time} alors",
  ],
  'Emma': [
    "Oh super {venue} ! Il y a une super lumière là-bas le soir 📷",
    "À {time} parfait, j'ai fini mes shootings",
    "Trop bien ! On se retrouve à l'entrée ?",
    "Super, j'apporte mon appareil si ça te dérange pas 😊",
  ],
  'Nathan': [
    "Let's go {venue} 🚀",
    "À {time} c'est ok, j'ai une call avant",
    "Top, on se capte là-bas",
    "Nickel, à {time} au {venue}",
  ],
  'Nora': [
    "Adorable {venue} ! J'y vais après répétition 💃",
    "Oui yes ! À {time} c'est parfait",
    "On se retrouve là-bas, j'ai hâte !",
  ],
  'Hugo': [
    "Ok parfait, j'ai une fin de garde à {time} 🏥",
    "{venue} top, j'y serai",
    "À {time} ça me va, je viens direct de l'hôpital",
  ],
}

function getBotReply(botProfile: any, _userMessage: string, venue: string, time: string): string {
  const name = botProfile?.name || 'Bot'
  const pool = BOT_REPLY_BANK[name] || BOT_REPLY_BANK['Thomas']
  const reply = pool[Math.floor(Math.random() * pool.length)]
  return reply
    .replace(/\{venue\}/g, venue || 'ce café')
    .replace(/\{time\}/g, time || 'tout à l\'heure')
}

function enrichProfile(p: any): any {
  const key = Object.keys(BOT_ENRICHMENT).find(k => (p.id||'').startsWith(k))
  if (!key) return p
  const e = BOT_ENRICHMENT[key]
  return {
    ...p,
    name: e.name,
    photo_url: p.photo_url || e.photo_url,
    bio: e.bio,  // Always use enriched bio for bots, never Supabase raw "TEST · ..." value
    job: (p.job && p.job !== 'Test Profile') ? p.job : e.job,
    age: p.age || e.age,
    neighborhood: (p.neighborhood && p.neighborhood !== 'Test Location') ? p.neighborhood : e.neighborhood,
    interests: (p.interests && p.interests.length > 0) ? p.interests : e.interests,
    languages: (p.languages && p.languages.length > 0) ? p.languages : e.languages,
    extraPhotos: e.extraPhotos,
  }
}

function SendModal({from,to,onClose,onSent,showToast,fromTime,untilTime}:{
  from:Profile;to:Profile;onClose:()=>void;onSent:(clutchId?:string)=>void;showToast:(m:string,c?:string)=>void;
  fromTime?:string;untilTime?:string;
}) {
  const [msg,setMsg]=useState(''); const [loading,setLoading]=useState(false)
  // Heures : intersection fenêtre user avec plage 06h-23h30
  const allSlots = useMemo(() => makeSlots(), [])
  const slots = useMemo(() => {
    const from18 = fromTime||'18:00', until18 = untilTime||'22:00'
    return allSlots.filter(s => s >= from18 && s <= until18).slice(0,12)
  }, [allSlots, fromTime, untilTime])
  const H = slots.length ? slots : allSlots.slice(0,9)
  const [hi,setHi]=useState(Math.min(2, H.length-1))

  // Lieu : suggestions Lausanne + champ libre
  const SUGGESTIONS=['Café Romand','Bar du Flon','Café du Grütli','Blackbird Coffee','Brasserie Lipp','Café de la Paix','Rooftop du MAD','Terrasse Ouchy']
  const [venueInput,setVenueInput]=useState(SUGGESTIONS[0])
  const [showSugg,setShowSugg]=useState(false)

  const send=async()=>{
    if (!venueInput.trim()){showToast('Pick a venue first',C.orange);return}
    setLoading(true)
    // Block si verrou actif avec n'importe qui (une seule rencontre à la fois)
    const {data:activeLock} = await supabase.from('clutches')
      .select('id,status,receiver:profiles!clutches_receiver_id_fkey(name),sender:profiles!clutches_sender_id_fkey(name)')
      .or(`sender_id.eq.${from.id},receiver_id.eq.${from.id}`)
      .in('status',['confirmed','accepted'])
      .limit(1)
    if (activeLock && activeLock.length > 0) {
      setLoading(false)
      const other = (activeLock[0] as any).sender?.id === from.id ? (activeLock[0] as any).receiver?.name : (activeLock[0] as any).sender?.name
      showToast(`🔒 You already have a locked meetup${other ? ` with ${other}` : ''}`,C.orange)
      return
    }
    // Block double clutch — vérifie si un clutch actif existe déjà entre ces deux personnes
    const {data:existing} = await supabase.from('clutches')
      .select('id,status')
      .or(`and(sender_id.eq.${from.id},receiver_id.eq.${to.id}),and(sender_id.eq.${to.id},receiver_id.eq.${from.id})`)
      .in('status',['pending','confirmed','accepted'])
      .limit(1)
    if (existing && existing.length > 0) {
      setLoading(false)
      showToast(`Already a Clutch with ${to.name?.split(' ')[0]||'them'}`,C.orange)
      return
    }
    const pt=new Date(); const [h,m]=H[hi].split(':').map(Number); pt.setHours(h,m,0,0)
    const{data:inserted,error}=await supabase.from('clutches').insert({
      sender_id:from.id, receiver_id:to.id,
      venue:venueInput.trim(),
      venue_safety:'neutral',
      message:msg||`Dispo pour ${venueInput.trim()} à ${H[hi]} ?`,
      proposed_time:pt.toISOString(),
      expires_at:new Date(Date.now()+2*3600*1000).toISOString(),
      status:'pending'
    }).select('id').single()
    setLoading(false)
    if(error){showToast("Erreur: "+error.message,C.red);return}
    onSent(inserted?.id)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:2000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)'}} onClick={onClose}/>
      <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',padding:'20px 20px 36px',animation:'modalIn .4s cubic-bezier(.22,1,.36,1)',maxHeight:'82vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:900}}>✦ Send a Clutch</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.whiteMid,fontSize:20,cursor:'pointer'}}>✕</button>
        </div>

        {/* Profil cible */}
        <div style={{display:'flex',gap:10,alignItems:'center',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 12px',marginBottom:14}}>
          <Av src={to.photo_url} name={to.name||'?'} size={38}/>
          <div><div style={{fontSize:14,fontWeight:800}}>{to.name}</div>{to.bio&&<div style={{fontSize:11,color:C.whiteMid}}>{to.bio.slice(0,55)}</div>}</div>
        </div>

        {/* Lieu — champ libre + suggestions */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Venue</div>
          <input
            value={venueInput}
            onChange={e=>{setVenueInput(e.target.value);setShowSugg(true)}}
            onFocus={()=>setShowSugg(true)}
            placeholder="Café Romand, Bar du Flon…"
            style={{width:'100%',background:C.whiteFaint,border:`1.5px solid ${C.borderStrong}`,borderRadius:12,padding:'10px 14px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon}}
          />
          {showSugg && (
            <div style={{marginTop:6,display:'flex',gap:5,flexWrap:'wrap'}}>
              {SUGGESTIONS.filter(s=>!venueInput||s.toLowerCase().includes(venueInput.toLowerCase())).map(s=>(
                <button key={s} onClick={()=>{setVenueInput(s);setShowSugg(false)}} style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:venueInput===s?C.salmonFaint:C.whiteFaint,color:venueInput===s?C.salmon:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Heure — intersection des deux fenêtres */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Time</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {H.map((h,i)=><button key={h} onClick={()=>setHi(i)} style={{padding:'6px 11px',borderRadius:10,border:`1.5px solid ${hi===i?C.salmon:C.border}`,background:hi===i?C.salmonFaint:C.whiteFaint,color:hi===i?C.salmon:C.whiteMid,fontSize:12,fontWeight:hi===i?800:500,cursor:'pointer',fontFamily:'inherit'}}>{h}</button>)}
          </div>
        </div>

        {/* Message */}
        <div style={{marginBottom:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>Message</div>
            <div style={{fontSize:10,color:msg.length>250?C.red:C.whiteMid}}>{msg.length}/300</div>
          </div>
          <textarea
            value={msg}
            onChange={e=>setMsg(e.target.value.slice(0,300))}
            placeholder={`Free for ${venueInput||'…'} at ${H[hi]}?`}
            style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',height:68,caretColor:C.salmon}}
          />
        </div>

        <Btn loading={loading} onClick={send}>✦ Send Clutch → {H[hi]}</Btn>
        <div style={{textAlign:'center',marginTop:10,fontSize:11,color:C.whiteMid}}>
          {to.name} has <strong style={{color:C.salmon}}>2h to reply</strong> · Meetup within <strong style={{color:C.salmon}}>18h max</strong>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// CLUTCH LANCÉ — animation légère (quand tu envoies)
// ═════════════════════════════════════════════════════════════
function ClutchSent({ onDone, name }:{ onDone:()=>void; name:string }) {
  useEffect(()=>{ const t=setTimeout(onDone,2000); return()=>clearTimeout(t) },[onDone])
  return (
    <div style={{position:'fixed',inset:0,zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(61,26,51,.93)',backdropFilter:'blur(12px)'}} onClick={onDone}>
      <style>{`
        @keyframes sentStar{0%{transform:scale(0) rotate(-30deg);opacity:0}20%{opacity:1}50%{transform:scale(1.15) rotate(8deg);opacity:1}85%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes sentFade{0%{opacity:1}85%{opacity:1}100%{opacity:0}}
        @keyframes sentRing{0%{transform:translate(-50%,-50%) scale(0);opacity:.9}70%{opacity:.3}100%{transform:translate(-50%,-50%) scale(6);opacity:0}}
        @keyframes sentRing2{0%{transform:translate(-50%,-50%) scale(0);opacity:.6}70%{opacity:.15}100%{transform:translate(-50%,-50%) scale(8);opacity:0}}
        @keyframes sentTxtIn{0%{transform:translateY(30px);opacity:0}30%{transform:translateY(-4px);opacity:1}50%{transform:translateY(0);opacity:1}85%{opacity:1}100%{opacity:0}}
        @keyframes sentSubIn{0%,15%{opacity:0;transform:translateY(16px)}40%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0}}
        @keyframes sentTap{0%,70%{opacity:0}85%{opacity:.5}100%{opacity:0}}
        .sr{position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;}
        .sr1{width:80px;height:80px;border:2px solid #E27C00;animation:sentRing 1.8s ease-out .05s both;}
        .sr2{width:80px;height:80px;border:1.5px solid #FFBF9E88;animation:sentRing2 2.2s ease-out .0s both;}
      `}</style>
      <div style={{position:'relative',textAlign:'center',animation:'sentFade 3.6s ease both'}}>
        <div className="sr sr1"/><div className="sr sr2"/>
        <div style={{fontSize:80,lineHeight:1,animation:'sentStar 3.6s cubic-bezier(.22,1,.36,1) both',filter:'drop-shadow(0 0 20px #E27C00) drop-shadow(0 0 40px #FFBF9E88)'}}>✦</div>
        <div style={{marginTop:20,animation:'sentTxtIn 3.6s ease both'}}>
          <div style={{fontSize:26,fontWeight:900,color:'#FFBF9E',letterSpacing:'-.03em'}}>Clutch sent!</div>
          <div style={{fontSize:14,color:'rgba(255,191,158,.75)',marginTop:6,fontWeight:600}}>{name} has 2h to reply ⏳</div>
        </div>
        <div style={{marginTop:24,fontSize:11,color:'rgba(255,191,158,.35)',animation:'sentTap 3.6s ease both'}}>Tap to continue</div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// VERROU EXPLOSION — animation BRUTALE (quand clutch confirmé)
// Full screen takeover. Logo. Shake. Rings. Ça pète.
// ═════════════════════════════════════════════════════════════
function VerrouExplosion({ onDone, verrou }:{ onDone:()=>void; verrou?:{venue?:string;name?:string;photo?:string|null} }) {
  useEffect(()=>{ const t=setTimeout(onDone,3400); return()=>clearTimeout(t) },[onDone])
  // Vibration multi-pulse
  useEffect(()=>{
    if('vibrate' in navigator) {
      navigator.vibrate([100,50,100,50,300,80,300,80,600])
    }
  },[])
  const pts = Array.from({length:14},(_,i)=>({
    dx: Math.round(Math.cos(i/14*2*Math.PI)*280),
    dy: Math.round(Math.sin(i/14*2*Math.PI)*280),
    del: (i*0.06).toFixed(2),
    sym: i%3===0?'✦':i%3===1?'🔒':'★',
  }))
  return (
    <div style={{position:'fixed',inset:0,zIndex:6000,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:C.bg}} onClick={onDone}>
      <style>{`
        @keyframes vLockIn{0%{transform:scale(0) rotate(-180deg);opacity:0}35%{transform:scale(1.4) rotate(8deg);opacity:1}55%{transform:scale(.92) rotate(-3deg)}75%{transform:scale(1.06) rotate(1deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes vLockOut{0%{transform:scale(1);opacity:1}100%{transform:scale(12);opacity:0}}
        @keyframes vText{0%{transform:translateY(-80px) scaleY(2);opacity:0}25%{transform:translateY(6px) scaleY(.97);opacity:1}40%{transform:translateY(-3px) scaleY(1.01)}60%{transform:translateY(0) scaleY(1)}100%{transform:translateY(0);opacity:1}}
        @keyframes vSub{0%{opacity:0;transform:translateY(20px)}50%{opacity:0}100%{opacity:1;transform:translateY(0)}}
        @keyframes vRing{0%{transform:translate(-50%,-50%) scale(0);opacity:1}100%{transform:translate(-50%,-50%) scale(10);opacity:0}}
        @keyframes vRing2{0%{transform:translate(-50%,-50%) scale(0);opacity:.7}100%{transform:translate(-50%,-50%) scale(14);opacity:0}}
        @keyframes vRing3{0%{transform:translate(-50%,-50%) scale(0);opacity:.4}100%{transform:translate(-50%,-50%) scale(18);opacity:0}}
        @keyframes vBg{0%{background:${C.bg}}15%{background:#7A3D65}30%{background:#542A44}100%{background:${C.bg}}}
        @keyframes vShake{0%,100%{transform:translateX(0)}10%{transform:translateX(-8px)}20%{transform:translateX(8px)}30%{transform:translateX(-6px)}40%{transform:translateX(6px)}50%{transform:translateX(-3px)}60%{transform:translateX(3px)}}
        @keyframes vPart{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx,0px),var(--dy,0px)) scale(0)}}
        .vr{position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;}
        .vr1{width:100px;height:100px;border:3px solid #E27C00;animation:vRing 1.6s ease-out 0s both;}
        .vr2{width:100px;height:100px;border:2px solid #FFBF9E88;animation:vRing2 2.0s ease-out .1s both;}
        .vr3{width:100px;height:100px;border:1.5px solid #FF6B9D44;animation:vRing3 2.4s ease-out .2s both;}
      `}</style>
      {/* Background flash */}
      <div style={{position:'absolute',inset:0,animation:'vBg 1.2s ease both,vShake .5s ease .1s both'}}/>
      {/* Rings */}
      <div className="vr vr1"/><div className="vr vr2"/><div className="vr vr3"/>
      {/* Particles */}
      {pts.map((p,i)=>(
        <div key={i} style={{position:'absolute',top:'50%',left:'50%',fontSize:i%3===1?20:16,animation:`vPart 1.2s ease-out ${p.del}s both`,pointerEvents:'none',
          ...({'--dx':`${p.dx}px`,'--dy':`${p.dy}px`} as any)}}>
          {p.sym}
        </div>
      ))}
      {/* Photo de l'autre personne — centrée, animée, au-dessus du sablier */}
      {verrou?.photo&&(
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%, -185px)',zIndex:3,
          animation:'vSub .55s cubic-bezier(.22,1,.36,1) .2s both',textAlign:'center'}}>
          <div style={{position:'relative',display:'inline-block'}}>
            <img src={verrou.photo} alt="" style={{width:88,height:88,borderRadius:'50%',objectFit:'cover',
              border:`3px solid ${C.green}`,boxShadow:`0 0 0 6px ${C.green}22, 0 0 32px ${C.green}55`}}/>
            <div style={{position:'absolute',inset:0,borderRadius:'50%',border:`2px solid ${C.green}`,
              animation:'vRing 1.8s ease-out 0s both'}}/>
          </div>
          <div style={{fontSize:11,color:C.green,fontWeight:700,marginTop:6,letterSpacing:'.05em'}}>{verrou.name}</div>
        </div>
      )}
      {/* Sablier SVG — brutal entrance */}
      <div style={{position:'relative',textAlign:'center',zIndex:2}}>
        <div style={{animation:'vLockIn .9s cubic-bezier(.22,1,.36,1) both',filter:`drop-shadow(0 0 30px ${C.orange}) drop-shadow(0 0 60px ${C.salmon}66)`}}>
          <svg width="90" viewBox="30 140 230 110" xmlns="http://www.w3.org/2000/svg">
            <path fill="#FFBF9E" d="M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"/>
            <polygon fill="#E27C00" points="153.217,202.325 183.263,201.578 188.846,195.994 182.948,190.122 153.521,190.121"/>
            <polygon fill="#E27C00" points="127.452,257.386 133.035,251.803 133.422,236.09 106.192,236.09"/>
          </svg>
        </div>
        <div style={{fontSize:36,fontWeight:900,color:C.white,letterSpacing:'-.04em',marginTop:12,animation:'vText .7s cubic-bezier(.22,1,.36,1) .15s both',textTransform:'uppercase',textShadow:`0 0 40px ${C.orange}`}}>VERROU</div>
        <div style={{fontSize:15,color:C.salmon,marginTop:10,animation:'vSub .6s ease .8s both',fontWeight:700}}>
          {verrou?.venue||'RDV confirmé'} · {verrou?.name||''}
        </div>
        <div style={{fontSize:12,color:C.whiteMid,marginTop:6,animation:'vSub .6s ease 1.0s both'}}>
          Tap to continue
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// CLUTCH INCOMING — animation plein écran quand ON REÇOIT un clutch
// "CLU" vient de la gauche, "TCH" de la droite → SLAM au centre
// L'app s'estompe derrière. Boutons Accepter / Décliner.
// ═════════════════════════════════════════════════════════════
function ClutchIncoming({ clutch, onAccept, onDecline, onLater }:{
  clutch:any; onAccept:()=>void; onDecline:()=>void; onLater?:()=>void
}) {
  const [ph, setPh] = useState(0)
  useEffect(()=>{
    if ('vibrate' in navigator) navigator.vibrate([150,80,150,80,300])
    const t1 = setTimeout(()=>setPh(1), 80)
    const t2 = setTimeout(()=>setPh(2), 900)
    return ()=>{ clearTimeout(t1); clearTimeout(t2) }
  },[])

  const sender = clutch?.sender
  const gk = genderKey(sender?.gender)
  const gc = GC[gk]

  return (
    <div style={{position:'fixed',inset:0,zIndex:7000,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'rgba(26,10,22,.97)',backdropFilter:'blur(20px)'}}>
      <style>{`
        @keyframes ciClu{from{transform:translateX(-120vw) skewX(-8deg);opacity:0}to{transform:translateX(0) skewX(0);opacity:1}}
        @keyframes ciTch{from{transform:translateX(120vw) skewX(8deg);opacity:0}to{transform:translateX(0) skewX(0);opacity:1}}
        @keyframes ciShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-10px)}30%{transform:translateX(10px)}45%{transform:translateX(-6px)}60%{transform:translateX(6px)}75%{transform:translateX(-3px)}}
        @keyframes ciSub{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ciBtns{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ciPulse{0%,100%{box-shadow:0 0 0 0 ${gc}44}50%{box-shadow:0 0 0 16px transparent}}
        .ci-slam{animation:ciShake .45s ease .85s both;}
      `}</style>

      {/* Sablier logo centré (apparaît pendant le slam) */}
      <div style={{position:'absolute',opacity:ph>=1?0.12:0,transition:'opacity .4s ease .6s',pointerEvents:'none'}}>
        <svg width="200" viewBox="30 100 230 250" xmlns="http://www.w3.org/2000/svg">
          <path fill={gc} d="M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"/>
        </svg>
      </div>

      {/* CLU → TCH slam */}
      <div className="ci-slam" style={{display:'flex',alignItems:'baseline',gap:0,marginBottom:8,position:'relative',zIndex:2}}>
        <span style={{
          fontSize:72,fontWeight:900,letterSpacing:'-.05em',color:C.salmon,lineHeight:1,
          display:'inline-block',
          animation:ph>=1?'ciClu .65s cubic-bezier(.22,1,.36,1) both':'none',
        }}>CLU</span>
        <span style={{
          fontSize:72,fontWeight:900,letterSpacing:'-.05em',color:C.orange,lineHeight:1,
          display:'inline-block',
          animation:ph>=1?'ciTch .65s cubic-bezier(.22,1,.36,1) .05s both':'none',
        }}>TCH</span>
      </div>

      {/* Sous-titre */}
      {ph>=1&&<div style={{fontSize:13,color:C.whiteMid,fontWeight:600,marginBottom:24,animation:'ciSub .5s ease .7s both'}}>
        Someone wants to meet you
      </div>}

      {/* Profil sender */}
      {ph>=2 && sender && (
        <div style={{background:C.bgCard,border:`1px solid ${gc}44`,borderRadius:16,padding:'12px 16px',display:'flex',gap:12,alignItems:'center',width:'min(320px,90vw)',marginBottom:24,animation:'ciSub .4s ease both'}}>
          <div style={{width:48,height:48,borderRadius:14,background:`${gc}22`,border:`2px solid ${gc}66`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,animation:'ciPulse 1.5s ease infinite'}}>
            {sender.photo_url ? <img src={sender.photo_url} style={{width:'100%',height:'100%',borderRadius:12,objectFit:'cover'}}/> : <GenderSvg gk={gk} size={24}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900,color:C.white,display:'flex',alignItems:'center',gap:6}}>{sender.name||'Someone'} <GenderSvg gk={gk} size={14}/></div>
            {clutch.venue&&<div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>📍 {clutch.venue}</div>}
            {clutch.proposed_time&&<div style={{fontSize:11,color:C.orange,marginTop:1}}>🕐 {new Date(clutch.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}</div>}
            {clutch.message&&<div style={{fontSize:11,color:C.whiteMid,marginTop:3,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>"{clutch.message}"</div>}
          </div>
        </div>
      )}

      {/* Boutons */}
      {ph>=2 && (
        <div style={{display:'flex',flexDirection:'column',gap:8,width:'min(320px,90vw)',animation:'ciBtns .5s cubic-bezier(.22,1,.36,1) .1s both'}}>
          <div style={{display:'flex',gap:12}}>
            <button onClick={onDecline} style={{flex:1,padding:'14px',background:'rgba(239,68,68,.12)',border:'1.5px solid rgba(239,68,68,.35)',borderRadius:16,color:C.red,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
              ✕ Decline
            </button>
            <button onClick={onAccept} style={{flex:2,padding:'14px',background:`linear-gradient(135deg,${C.green},#1a9660)`,border:'none',borderRadius:16,color:'#fff',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 20px ${C.green}44`,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              <img src="/icons/LOCK.svg" width={18} height={18} alt="" style={{filter:'brightness(0) invert(1)',flexShrink:0}}/> Lock in
            </button>
          </div>
          <button onClick={()=>{ if(onLater) onLater() }} style={{width:'100%',padding:'10px',background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,borderRadius:16,color:C.whiteMid,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            ⏸ Set aside · I'll reply later
          </button>
        </div>
      )}

      <div style={{position:'absolute',bottom:40,fontSize:10,color:'rgba(255,255,255,.2)'}}>
        You have 2h to reply
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// ACTIVE VERROU BAR — bandeau orange en haut, visible partout
// Compte à rebours jusqu'au RDV confirmé
// ═════════════════════════════════════════════════════════════
function ActiveVerrouBar({ verrou, onClick, lang }:{ verrou:any; onClick:()=>void; lang?:Lang }) {
  const t = useT(lang||'fr')
  const [now,setNow] = useState(new Date())
  useEffect(()=>{ const ti=setInterval(()=>setNow(new Date()),10000); return()=>clearInterval(ti) },[])
  const rdv = new Date(verrou.proposed_time)
  const diffMs = rdv.getTime()-now.getTime()
  const past = diffMs < 0
  const h = Math.floor(Math.abs(diffMs)/3600000)
  const m = Math.floor((Math.abs(diffMs)%3600000)/60000)
  const urgency = !past && diffMs < 30*60*1000 // < 30min = urgent
  const when = past ? (lang==='en'?'Meetup happening now 🔥':'RDV en cours 🔥')
    : h>0 ? (lang==='en'?`in ${h}h${m>0?`${m}m`:''}`:`dans ${h}h${m>0?`${m}min`:''}`)
    : (lang==='en'?`in ${m} min ⚡`:`dans ${m} min ⚡`)
  const other = verrou.sender_id === verrou.my_id ? verrou.receiver : verrou.sender
  return (
    <>
      <style>{`
        @keyframes lockPulse{0%,100%{opacity:.9}50%{opacity:1}}
        @keyframes lockDot{0%,100%{transform:scale(1)}50%{transform:scale(1.3)}}
        .lock-pill{animation:lockPulse ${urgency?'1s':'3s'} ease-in-out infinite;}
      `}</style>
      {/* Pill compacte — discret mais visible */}
      <div onClick={onClick} className="lock-pill" style={{
        position:'fixed',
        top:'calc(env(safe-area-inset-top,0px) + 6px)',
        left:'50%',transform:'translateX(-50%)',
        zIndex:1500,cursor:'pointer',
        background:urgency?'rgba(180,0,0,.92)':'rgba(140,60,0,.9)',
        backdropFilter:'blur(12px)',
        borderRadius:24,
        padding:'5px 12px 5px 8px',
        display:'flex',alignItems:'center',gap:6,
        boxShadow:urgency?`0 2px 16px rgba(239,68,68,.5)`:`0 2px 10px rgba(200,90,0,.4)`,
        border:`1px solid rgba(255,255,255,.15)`,
        maxWidth:'calc(100vw - 48px)',
        whiteSpace:'nowrap',
        overflow:'hidden',
      }}>
        <span style={{fontSize:12,animation:`lockDot ${urgency?'1s':'2s'} ease-in-out infinite`,display:'inline-block'}}>🔒</span>
        <span style={{fontSize:11,fontWeight:800,color:'#fff',letterSpacing:'.02em'}}>
          {other?.name} · {rdv.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
        </span>
        <span style={{fontSize:10,color:'rgba(255,255,255,.8)',fontWeight:600,flexShrink:0}}>
          {when}
        </span>
        <span style={{fontSize:9,color:'rgba(255,255,255,.5)',marginLeft:2}}>›</span>
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════════════
// EVENTS TAB — Anaïs + événements réels cliquables
// ═════════════════════════════════════════════════════════════
const MOCK_EVENTS = [
  {
    id:'ev1', emoji:'🧘', title:'Yoga au lever du soleil + Brunch',
    creator:'Anaïs', creatorBio:'Prof de yoga certifiée RYT-500 · Amoureuse du Léman',
    creatorPhoto:'https://randomuser.me/api/portraits/women/68.jpg', certified:true,
    date:'Samedi 14 juin', time:'08:00', lieu:'Plage de Vidy, Lausanne',
    spots:12, taken:7, price:'Libre (suggestion 15 CHF)', bring:'Tapis de yoga · Serviette · Appétit',
    description:'Séance de yoga flow au bord du Léman au lever du soleil, suivie d\'un brunch partagé sur la plage. Débutants bienvenus. On se retrouve sous les peupliers près du parking.',
    tags:['yoga','bien-être','matin','plein air'],
    evGender:'F',
    eventPhotos:[
      'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    ],
    eventPhotoEmojis:['🌅','🧘','🥣'],
    reviews:[
      {emoji:'💛',text:'Anaïs crée une ambiance super bienveillante, on se sent à l\'aise dès les premières minutes.', author:'Léa'},
      {emoji:'🌅',text:'Le lever de soleil sur le Léman + brunch partagé = combo parfait. Je reviens à chaque édition !', author:'Sofia'},
      {emoji:'🧘',text:'Niveau accessible, Anaïs s\'adapte à tout le monde. Débutante et déjà accro.', author:'Camille'},
    ],
  },
  {
    id:'ev2', emoji:'🍷', title:'Apéro littéraire — Camus',
    creator:'Thomas', creatorBio:'Libraire · Lecteur compulsif',
    creatorPhoto:'https://randomuser.me/api/portraits/men/41.jpg', certified:false,
    date:'Vendredi 13 juin', time:'19:30', lieu:'Café de l\'Évêché, Vieille Ville',
    spots:8, taken:3, price:'Consommation sur place', bring:'Un passage de Camus préféré',
    description:'Discussion autour de "L\'Étranger" et "La Peste". Ambiance décontractée, on refait le monde avec un verre. Pas besoin d\'être expert, juste curieux.',
    tags:['culture','lecture','apéro','discussion'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80',
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80',
    ],
    eventPhotoEmojis:['📚','🍷'],
    reviews:[
      {emoji:'📖',text:'Super discussion, Thomas connaît Camus par cœur et sait entraîner tout le monde.', author:'Marie'},
      {emoji:'🍷',text:'Ambiance intime, on a refait le monde jusqu\'à minuit. J\'y retourne !', author:'Paul'},
    ],
  },
  {
    id:'ev3', emoji:'🎵', title:'Session impro jazz — open mic',
    creator:'Clutch Officiel', creatorBio:'Événements officiels Clutch',
    creatorPhoto:null, certified:true,
    date:'Ce soir', time:'21:00', lieu:'MAD Club, Lausanne',
    spots:40, taken:22, price:'Entrée libre', bring:'Ton instrument (optionnel)',
    description:'Open mic jazz & impro. Que tu joues ou que tu écoutes, tu es le bienvenu. Ambiance feutrée, bières locales.',
    tags:['musique','jazz','soirée','impro'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80',
    ],
    eventPhotoEmojis:['🎷','🎹','🎺'],
    reviews:[
      {emoji:'🎷',text:'Niveau incroyable, même les impros débutantes sonnaient bien grâce à l\'énergie du groupe.', author:'Julien'},
      {emoji:'🎵',text:'Bière locale + jazz = soirée parfaite. On y était 4 clutcheurs et c\'était génial.', author:'Emma'},
    ],
  },
  {
    id:'ev4', emoji:'👗', title:'Vide-dressing printemps',
    creator:'Léa', creatorBio:'Mode circulaire & style éthique · Lausanne',
    creatorPhoto:'https://randomuser.me/api/portraits/women/55.jpg', certified:false,
    date:'Samedi 14 juin', time:'10:00', lieu:'Salle du Faubourg, Lausanne',
    spots:30, taken:18, price:'Gratuit', bring:'Tes vêtements à vendre',
    description:'Échange et vente de vêtements entre femmes. Ambiance chaleureuse, café offert. Chaque vendeuse apporte max 20 pièces.',
    tags:['shopping','mode','bien-être','entre femmes'],
    evGender:'F',
    eventPhotos:[
      'https://images.unsplash.com/photo-1558171813-d6a699030c3c?w=600&q=80',
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80',
    ],
    eventPhotoEmojis:['👗','☕'],
    reviews:[
      {emoji:'👚',text:'J\'ai trouvé des pépites à 5 CHF. Organisé, convivial, le café offert c\'est le top !', author:'Nathalie'},
      {emoji:'♻️',text:'Belle initiative mode durable. On s\'y retrouve à chaque saison.', author:'Cécile'},
    ],
  },
  {
    id:'ev5', emoji:'🧗', title:'Escalade débutants — salle SAC',
    creator:'Marco', creatorBio:'Guide de montagne · SAC Lausanne',
    creatorPhoto:'https://randomuser.me/api/portraits/men/22.jpg', certified:true,
    date:'Dimanche 15 juin', time:'09:00', lieu:'Salle d\'escalade Montelly, Lausanne',
    spots:10, taken:4, price:'15 CHF', bring:'Chaussures de sport',
    description:'Initiation à l\'escalade en salle pour vrais débutants. Marco explique les techniques de base, assurance, communication. Matériel de location disponible sur place.',
    tags:['sport','escalade','débutants'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80',
    ],
    eventPhotoEmojis:['🧗','🏔️'],
    reviews:[
      {emoji:'💪',text:'Marco est patient et pédagogue, j\'ai grimpé mon premier 4a en 2h !', author:'Théo'},
      {emoji:'🧗',text:'Parfait pour débuter, ambiance groupe très sympa.', author:'Isabelle'},
    ],
  },
  {
    id:'ev6', emoji:'🎨', title:'Aquarelle urbaine en plein air',
    creator:'Sophie', creatorBio:'Illustratrice freelance · Lausanne',
    creatorPhoto:'https://randomuser.me/api/portraits/women/33.jpg', certified:false,
    date:'Demain 14h', time:'14:00', lieu:'Escaliers du Marché, Lausanne',
    spots:12, taken:5, price:'10 CHF (matériel)', bring:'Envie de peindre !',
    description:'Sortie aquarelle dans la Vieille-Ville. Sophie fournit papier et pinceaux, tu apportes ton enthousiasme. Niveau débutant bienvenu, l\'objectif c\'est de voir la ville différemment.',
    tags:['art','culture','plein air','créativité'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80',
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80',
    ],
    eventPhotoEmojis:['🎨','🖌️','🏙️'],
    reviews:[
      {emoji:'🖌️',text:'Sophie transmet sa passion avec beaucoup de bienveillance. Résultat bluffant pour un débutant.', author:'Romain'},
      {emoji:'🎨',text:'Vue sur la cathédrale en aquarelle, je l\'ai encadrée ! Merci Sophie.', author:'Valérie'},
    ],
  },
  {
    id:'ev7', emoji:'🧆', title:'Brunch oriental — swap recettes',
    creator:'Fatima', creatorBio:'Cuisine du monde · Maroc & Liban',
    creatorPhoto:'https://randomuser.me/api/portraits/women/62.jpg', certified:false,
    date:'Dimanche 15 juin', time:'11:00', lieu:'Quartier du Vallon, Lausanne',
    spots:8, taken:2, price:'25 CHF', bring:'Un plat sucré',
    description:'Brunch convivial autour des cuisines du Maroc et du Liban. Fatima prépare salé (msemmen, labneh, zaatar), chaque participante apporte un plat sucré. Échange de recettes entre femmes de cultures variées.',
    tags:['gastronomie','culture','entre femmes','brunch'],
    evGender:'F',
    eventPhotos:[
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    ],
    eventPhotoEmojis:['🧆','🍋','🫖'],
    reviews:[
      {emoji:'🍋',text:'Msemmen maison + thé à la menthe = on se croirait à Marrakech. Fatima est adorable.', author:'Julie'},
      {emoji:'🤝',text:'Super concept d\'échange de recettes. J\'ai appris à faire le zaatar !', author:'Sandra'},
    ],
  },
  {
    id:'ev8', emoji:'🏃', title:'Running sunset — bord du Léman',
    creator:'Club Run&Meet', creatorBio:'Running group Lausanne · Tous niveaux',
    creatorPhoto:'https://randomuser.me/api/portraits/men/44.jpg', certified:true,
    date:'Ce soir', time:'19:00', lieu:'Quai d\'Ouchy, Lausanne',
    spots:20, taken:11, price:'Gratuit', bring:'Tenues de running',
    description:'Run de 5 ou 8km au coucher du soleil le long du Léman. Départ et arrivée Ouchy. Groupes de niveau séparés. Verre au bar après pour les volontaires !',
    tags:['sport','running','plein air','coucher de soleil'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    ],
    eventPhotoEmojis:['🏃','🌅','💧'],
    reviews:[
      {emoji:'🌅',text:'Courir au coucher du soleil sur le Léman, je ne m\'en lasse pas. Groupe super motivant.', author:'Clément'},
      {emoji:'🏃',text:'Même si tu es débutant, il y a un groupe pour toi. J\'y vais tous les vendredis maintenant.', author:'Aurélie'},
    ],
  },
  {
    id:'ev9', emoji:'🎭', title:'Impro théâtre — session découverte',
    creator:'Collectif Scène Ouverte', creatorBio:'Troupe d\'impro lausannoise depuis 2018',
    creatorPhoto:'https://randomuser.me/api/portraits/women/77.jpg', certified:true,
    date:'Vendredi 13 juin', time:'19:00', lieu:'Salle Paderewski, Lausanne',
    spots:16, taken:9, price:'12 CHF', bring:'Ton énergie !',
    description:'Session d\'initiation à l\'improvisation théâtrale. Exercices de lâcher-prise, jeux collectifs, mini-scènes. Aucune expérience requise. Les plus timides sont souvent les plus surprenants.',
    tags:['culture','théâtre','créativité','impro'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80',
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
    ],
    eventPhotoEmojis:['🎭','🎪','🎬'],
    reviews:[
      {emoji:'🎭',text:'J\'ai ri comme jamais et surmonté ma timidité en 2h. Les animateurs sont géniaux.', author:'Camille'},
      {emoji:'🌟',text:'Exercices bien choisis, progression naturelle. On est reparti avec l\'envie de revenir.', author:'Antoine'},
    ],
  },
  {
    id:'ev10', emoji:'🌿', title:'Atelier fermentation — kombucha & kefir',
    creator:'Anaïs', creatorBio:'Zéro déchet & bien-être · Fermentation enthousiaste',
    creatorPhoto:'https://randomuser.me/api/portraits/women/68.jpg', certified:false,
    date:'Samedi 14 juin', time:'15:00', lieu:'Espace Vaudoise, Lausanne',
    spots:8, taken:3, price:'35 CHF (kit inclus)', bring:'Un bocal en verre',
    description:'Atelier pratique fermentation : tu repars avec ta propre SCOBY kombucha et un grain de kefir. Anaïs explique la science derrière, les ratés possibles, et comment entretenir tes cultures.',
    tags:['bien-être','gastronomie','zéro déchet','atelier'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&q=80',
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80',
    ],
    eventPhotoEmojis:['🌿','🫙','🍵'],
    reviews:[
      {emoji:'🫙',text:'Je n\'ai plus acheté de kombucha depuis l\'atelier. Mon kefir est parfait !', author:'Laura'},
      {emoji:'🌿',text:'Anaïs explique super bien, même la science derrière. On repart avec tout le nécessaire.', author:'Bastien'},
    ],
  },
  {
    id:'ev11', emoji:'👶', title:'Pique-nique parents & enfants',
    creator:'Clutch Famille', creatorBio:'Événements Clutch pour les familles',
    creatorPhoto:null, certified:true,
    date:'Dimanche 15 juin', time:'11:00', lieu:'Parc Mon-Repos, Lausanne',
    spots:15, taken:6, price:'Gratuit', bring:'Ton pique-nique + une activité pour les enfants',
    description:'Pique-nique décontracté pour parents et enfants. Aire de jeux à côté, grande pelouse. Venez tels que vous êtes, sans pression. Objectif : que les parents aient aussi du bon temps entre adultes.',
    tags:['parents','enfants','plein air','pique-nique'],
    evGender:'X',
    isParents:true,
    eventPhotos:[
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80',
    ],
    eventPhotoEmojis:['👶','🌳','☀️'],
    reviews:[
      {emoji:'👨‍👩‍👧',text:'Super initiative ! Les enfants ont joué ensemble, on a enfin parlé adultes pendant 2h.', author:'Marc & Lisa'},
      {emoji:'🌳',text:'Parc magnifique, ambiance détendue. On revient le mois prochain !', author:'Carine'},
    ],
  },
  {
    id:'ev12', emoji:'🎸', title:'Afterwork indie — écoute collective',
    creator:'Bar du Flon Staff', creatorBio:'Le Bar du Flon · Musique live & bonne ambiance',
    creatorPhoto:'https://randomuser.me/api/portraits/men/66.jpg', certified:false,
    date:'Vendredi 13 juin', time:'18:30', lieu:'Bar du Flon, Lausanne',
    spots:25, taken:14, price:'Consommation sur place', bring:'Tes oreilles',
    description:'Écoute collective d\'albums indie et shoegaze autour d\'un verre. Le staff sélectionne un album par semaine, on écoute ensemble, on discute. Cette semaine : Broadcast — Tender Buttons.',
    tags:['musique','afterwork','indie'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1514362453360-8f94243c9996?w=600&q=80',
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
    ],
    eventPhotoEmojis:['🎸','🍺','🎧'],
    reviews:[
      {emoji:'🎧',text:'Concept unique à Lausanne. On écoute vraiment la musique, sans bruit de fond. Génial.', author:'Kevin'},
      {emoji:'🍺',text:'Broadcast était parfait pour ce format. Bonne sélection, bonnes conversations après.', author:'Noémie'},
    ],
  },
  {
    id:'ev13', emoji:'🧘‍♂️', title:'Méditation guidée — pleine conscience',
    creator:'Centre Pleine Présence', creatorBio:'Méditation & mindfulness · Lausanne',
    creatorPhoto:'https://randomuser.me/api/portraits/women/48.jpg', certified:true,
    date:'Demain matin', time:'07:30', lieu:'Salle Brahmane, Lausanne',
    spots:10, taken:3, price:'20 CHF', bring:'Coussin de méditation (si dispo)',
    description:'Séance de 45 minutes de méditation guidée pleine conscience, suivie de 15 minutes de partage en groupe. Technique MBSR adaptée. Convient aux débutants comme aux pratiquants réguliers.',
    tags:['bien-être','méditation','matin'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=600&q=80',
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
    ],
    eventPhotoEmojis:['🧘‍♂️','🕯️','🌙'],
    reviews:[
      {emoji:'🕯️',text:'La meilleure façon de commencer la journée. Je suis sorti transformé, l\'esprit clair.', author:'Patrick'},
      {emoji:'🧘‍♂️',text:'Voix apaisante, technique MBSR bien expliquée pour les débutants. Je reviens.', author:'Marion'},
    ],
  },
  {
    id:'ev14', emoji:'🍕', title:'Soirée pizza pâte fraîche maison',
    creator:'Lorenzo', creatorBio:'Chef amateur napolitain · Lausanne depuis 8 ans',
    creatorPhoto:'https://randomuser.me/api/portraits/men/55.jpg', certified:false,
    date:'Samedi 14 juin', time:'18:00', lieu:'Atelier de cuisine du Belvédère, Lausanne',
    spots:6, taken:2, price:'40 CHF', bring:'Tablier',
    description:'Lorenzo enseigne la vraie pizza napolitaine : pâte fraîche fermentée 48h, sauce San Marzano, cuisson au four à bois. Tu repars avec la recette et beaucoup trop mangé.',
    tags:['gastronomie','cuisine','soirée','convivial'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
      'https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=600&q=80',
    ],
    eventPhotoEmojis:['🍕','🍷','👨‍🍳'],
    reviews:[
      {emoji:'🍕',text:'La meilleure pizza que j\'ai mangée à Lausanne, et je l\'ai faite moi-même. Lorenzo est passionné.', author:'Elisa'},
      {emoji:'🫴',text:'Atelier intimiste à 6 personnes, on a ri, on a mangé, on a bu. Parfait.', author:'Simon'},
    ],
  },
  {
    id:'ev15', emoji:'🚴', title:'Balade vélo — vignoble de Lavaux',
    creator:'Vélo Club Romandie', creatorBio:'Balades vélo tous niveaux · Vaud',
    creatorPhoto:'https://randomuser.me/api/portraits/men/77.jpg', certified:true,
    date:'Demain matin', time:'09:00', lieu:'Départ gare de Lutry',
    spots:15, taken:8, price:'5 CHF (vélo personnel requis)', bring:'Ton vélo + casque',
    description:'Balade de 25km dans les vignobles de Lavaux classés UNESCO. Départ Lutry, arrêt dégustation à Epesses, retour Vevey en train. Dénivelé modéré, accessible à tous. Paysages à couper le souffle.',
    tags:['sport','nature','vélo','paysage'],
    evGender:'X',
    eventPhotos:[
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
      'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=600&q=80',
    ],
    eventPhotoEmojis:['🚴','🍇','🏔️'],
    reviews:[
      {emoji:'🍇',text:'Lavaux en vélo c\'est magique. La dégustation à Epesses était un plus inattendu !', author:'François'},
      {emoji:'🚴',text:'Groupe sympa, rythme accessible. Le retour en train depuis Vevey est parfaitement organisé.', author:'Stéphanie'},
    ],
  },
]

// evGender : 'F'=entre femmes · 'X'=mixte · 'M'=entre hommes
// NOTE LÉGALE CH : discrimination tolérée pour événements sociaux privés (art. 8 Cst) ;
// mais à documenter dans CGU. Pas de filtrage automatique = utilisateur choisit.
const EV_FILTERS = [
  {id:'all',      trKey:'ev.filter.all',      icon:'✦'},
  {id:'soir',     trKey:'ev.filter.soir',     icon:'🌙'},
  {id:'demain',   trKey:'ev.filter.demain',   icon:'☀️'},
  {id:'sport',    trKey:'ev.filter.sport',    icon:'🏃'},
  {id:'bienetre', trKey:'ev.filter.bienetre', icon:'🧘'},
  {id:'culture',  trKey:'ev.filter.culture',  icon:'🎨'},
  {id:'gastro',   trKey:'ev.filter.gastro',   icon:'🍽'},
  {id:'musique',  trKey:'ev.filter.musique',  icon:'🎵'},
  {id:'parents',  trKey:'ev.filter.parents',  icon:'👶'},
  {id:'evF',      trKey:'ev.filter.evF',      icon:'♀'},
  {id:'evX',      trKey:'ev.filter.evX',      icon:'◇'},
]

function EventsTab({ onClutch:_, registered, setRegistered, waitlist, setWaitlist, lang, initialEventId, onClearInitialEvent, onPenalty, onOpenProfile }:{
  onClutch:(p:Profile)=>void;
  registered:Set<string>; setRegistered:(fn:any)=>void;
  waitlist:Set<string>; setWaitlist:(fn:any)=>void;
  lang:Lang;
  initialEventId?:string|null;
  onClearInitialEvent?:()=>void;
  onPenalty?:(r:PenaltyReason)=>void;
  onOpenProfile?:(name:string,bio:string,photo:string|null)=>void;
}) {
  const t = useT(lang)
  const [dbEvents, setDbEvents] = useState<any[]>([])
  const [evLoading, setEvLoading] = useState(true)

  useEffect(() => {
    supabase.from('events').select('*').eq('active', true).order('sort_order').order('created_at')
      .then(({ data }) => {
        setDbEvents(data || [])
        setEvLoading(false)
      })
  }, [])

  const events = dbEvents.length > 0 ? dbEvents.map(e => ({
    id: e.id,
    emoji: e.emoji || '🎉',
    title: e.title,
    creator: e.creator,
    creatorBio: e.creator_bio,
    creatorPhoto: e.creator_photo,
    certified: e.certified,
    date: e.event_date,
    time: e.event_time,
    lieu: e.lieu,
    spots: e.spots,
    taken: e.taken || 0,
    price: e.price,
    bring: e.bring,
    description: e.description,
    tags: e.tags || [],
    evGender: e.ev_gender || 'X',
    eventPhotos: e.event_photos || [],
    eventPhotoEmojis: e.event_photo_emojis || [],
    reviews: [],
  })) : MOCK_EVENTS  // fallback sur les mocks si DB vide

  const [selEv, setSelEv] = useState<any|null>(()=>
    initialEventId ? MOCK_EVENTS.find(e=>e.id===initialEventId)||null : null
  )
  const [evFilter, setEvFilter] = useState('all')
  const [registering, setRegistering] = useState(false)
  const [evPhotoIdx, setEvPhotoIdx] = useState(0)
  const evTouchStartX = useRef<number|null>(null)
  const [unregConfirmId, setUnregConfirmId] = useState<string|null>(null)
  // Chat groupe — messages locaux par événement
  const [groupMsgs, setGroupMsgs] = useState<Record<string,{name:string;text:string;t:string;mine:boolean}[]>>({
    ev1:[
      {name:'Anaïs',text:lang==='en'?'Looking forward to seeing everyone Saturday! 🧘':'Hâte de vous voir samedi ! 🧘',t:'08:12',mine:false},
      {name:'Léa TEST',text:lang==='en'?'Same! Should we bring yoga mats?':'Pareil ! On apporte les tapis ?',t:'08:15',mine:false},
    ]
  })
  const [groupInput, setGroupInput] = useState('')

  const filteredEvs = events.filter(ev => {
    if (evFilter==='all') return true
    if (evFilter==='soir') return ev.date === 'Ce soir'
    if (evFilter==='demain') return ev.date.toLowerCase().includes('demain')
    if (evFilter==='sport') return ev.tags.includes('sport') || ev.tags.includes('running') || ev.tags.includes('escalade') || ev.tags.includes('vélo')
    if (evFilter==='bienetre') return ev.tags.includes('bien-être') || ev.tags.includes('yoga') || ev.tags.includes('méditation')
    if (evFilter==='culture') return ev.tags.includes('culture') || ev.tags.includes('art') || ev.tags.includes('théâtre') || ev.tags.includes('lecture')
    if (evFilter==='gastro') return ev.tags.includes('gastronomie') || ev.tags.includes('cuisine') || ev.tags.includes('brunch')
    if (evFilter==='musique') return ev.tags.includes('musique') || ev.tags.includes('jazz') || ev.tags.includes('indie')
    if (evFilter==='parents') return (ev as any).isParents === true
    if (evFilter==='evF') return (ev as any).evGender==='F'
    if (evFilter==='evX') return (ev as any).evGender==='X'
    return true
  })

  const doRegister = async (ev: any) => {
    if (registered.has(ev.id)) return
    setRegistering(true)
    await new Promise(r=>setTimeout(r,600))
    setRegistered((prev:Set<string>)=>new Set([...prev,ev.id]))
    setRegistering(false)
    // Auto-ferme la sheet après 1.5s (laisse voir la confirmation)
    setTimeout(() => setSelEv(null), 1500)
  }

  return (
    <div className="fi" style={{position:'fixed',inset:0,bottom:72,background:C.bg,display:'flex',flexDirection:'column'}}>
      <div style={{padding:'52px 16px 10px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
        <div style={{fontSize:19,fontWeight:900,marginBottom:8}}>Events</div>
        {/* Filtres */}
        <div style={{display:'flex',gap:6,overflowX:'auto',whiteSpace:'nowrap',paddingBottom:8,padding:'0 0 8px'}}>
          {EV_FILTERS.map(f=>(
            <button key={f.id} onClick={()=>setEvFilter(f.id)}
              style={{padding:'5px 12px',borderRadius:20,border:`1px solid ${evFilter===f.id?C.orange:C.border}`,background:evFilter===f.id?C.orangeFaint:'transparent',color:evFilter===f.id?C.orange:C.whiteMid,fontSize:11,fontWeight:evFilter===f.id?800:500,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
              {f.icon} {t(f.trKey)}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0,padding:'10px 14px'}}>
        {filteredEvs.length===0 && (
          <div style={{textAlign:'center',padding:'50px 20px',color:C.whiteMid}}>
            <div style={{fontSize:28,marginBottom:8}}>📅</div>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>No events in this category</div>
          </div>
        )}
        {filteredEvs.map(ev=>(
          <div key={ev.id} onClick={()=>{setSelEv(ev);setEvPhotoIdx(0)}} style={{background:C.bgCard,border:`1px solid ${registered.has(ev.id)?C.green:C.border}`,borderRadius:16,marginBottom:10,cursor:'pointer',overflow:'hidden'}}>
            <div style={{padding:'13px 14px',display:'flex',gap:12,alignItems:'center'}}>
              <div style={{fontSize:28,width:44,height:44,borderRadius:12,background:C.salmonFaint,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{ev.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                  <span style={{fontSize:13,fontWeight:800}}>{ev.title}</span>
                  {ev.certified&&<span style={{fontSize:9,background:C.orangeFaint,color:C.orange,border:`1px solid ${C.orange}44`,borderRadius:6,padding:'1px 5px',fontWeight:800,flexShrink:0}}>✓ CERTIFIED</span>}
                </div>
                <div style={{fontSize:11,color:C.whiteMid,display:'flex',alignItems:'center',gap:3,flexWrap:'wrap'}}>
                  {(ev as any).creatorPhoto && <img src={(ev as any).creatorPhoto} alt="" style={{width:16,height:16,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>}
                  <span>{t('ev.by')} <strong style={{color:C.salmon}}>{ev.creator}</strong> · {ev.time} · {(ev.lieu||'').split(',')[0]}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
                  <div style={{fontSize:11,color:ev.taken/ev.spots>.8?C.orange:C.whiteMid}}>{ev.taken}/{ev.spots} registered</div>
                  <div style={{flex:1,height:3,borderRadius:2,background:`${C.whiteFaint}`,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${ev.taken/ev.spots*100}%`,background:ev.taken/ev.spots>.8?C.orange:C.green,borderRadius:2}}/>
                  </div>
                </div>
              </div>
              {(ev as any).eventPhotos?.[0] && (
                <div style={{width:52,height:52,borderRadius:8,flexShrink:0,overflow:'hidden',border:`1px solid ${C.border}`}}>
                  {(ev as any).eventPhotos[0].startsWith('http')
                    ? <img src={(ev as any).eventPhotos[0]} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                    : <div style={{width:'100%',height:'100%',background:(ev as any).eventPhotos[0]}}/>
                  }
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Détail événement — bottom sheet scrollable */}
      {selEv&&(
        <div style={{position:'fixed',inset:0,zIndex:9000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',backdropFilter:'blur(4px)'}} onClick={()=>setSelEv(null)}/>
          {/* Sheet = flex column, hauteur fixe, scroll sur le corps uniquement */}
          <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',height:'96vh',display:'flex',flexDirection:'column',animation:'modalIn .35s cubic-bezier(.22,1,.36,1)'}}>
            {/* Header fixe */}
            <div style={{flexShrink:0,padding:'14px 20px 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:26}}>{selEv.emoji}</span>
                <div>
                  <div style={{fontSize:15,fontWeight:900}}>{selEv.title}</div>
                  <div style={{fontSize:11,color:C.whiteMid}}>{selEv.date} · {selEv.time}</div>
                </div>
              </div>
              <button onClick={()=>setSelEv(null)} style={{background:'none',border:'none',color:C.whiteMid,fontSize:20,cursor:'pointer',padding:4}}>✕</button>
            </div>
            {/* Corps scrollable — flex:'1 1 0' + overflowY:'scroll' obligatoires sur iOS */}
            <div style={{flex:'1 1 0',overflowY:'scroll',WebkitOverflowScrolling:'touch',padding:'12px 20px 100px'}}>
              <div style={{fontSize:11,color:C.whiteMid,marginBottom:14}}>{selEv.lieu}</div>
              {selEv.certified&&<div style={{display:'inline-flex',alignItems:'center',gap:5,background:C.orangeFaint,color:C.orange,border:`1px solid ${C.orange}44`,borderRadius:8,padding:'3px 8px',fontSize:10,fontWeight:800,marginBottom:14}}>✓ CERTIFIED</div>}

              {/* Photos de l'événement — galerie si disponible */}
              {/* ── Galerie photos événement — full-width avec navigation ── */}
              {(selEv as any).eventPhotos?.length > 0 && (() => {
                const evPhotos: string[] = (selEv as any).eventPhotos
                const evEmojis: string[] = (selEv as any).eventPhotoEmojis || []
                const cur: string = evPhotos[evPhotoIdx] || evPhotos[0]
                const isGrad = cur.startsWith('linear') || cur.startsWith('#')
                return (
                  <div
                    onTouchStart={e=>{ evTouchStartX.current = e.touches[0].clientX }}
                    onTouchEnd={e=>{
                      if (evTouchStartX.current === null) return
                      const dx = e.changedTouches[0].clientX - evTouchStartX.current
                      if (dx < -50) setEvPhotoIdx(i=>Math.min(evPhotos.length-1, i+1))
                      else if (dx > 50) setEvPhotoIdx(i=>Math.max(0, i-1))
                      evTouchStartX.current = null
                    }}
                    style={{position:'relative',width:'100%',height:220,borderRadius:16,overflow:'hidden',marginBottom:14,flexShrink:0}}>
                    {isGrad
                      ? <div style={{width:'100%',height:'100%',background:cur,display:'flex',alignItems:'center',justifyContent:'center',fontSize:80}}>{evEmojis[evPhotoIdx]||selEv.emoji}</div>
                      : <img src={cur} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                    }
                    <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(61,26,51,.7) 0%,transparent 50%)',pointerEvents:'none'}}/>
                    {evPhotoIdx>0&&<button onClick={()=>setEvPhotoIdx(i=>i-1)} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',background:'rgba(61,26,51,.65)',border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>}
                    {evPhotoIdx<evPhotos.length-1&&<button onClick={()=>setEvPhotoIdx(i=>i+1)} style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',background:'rgba(61,26,51,.65)',border:'none',color:'#fff',width:32,height:32,borderRadius:'50%',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>}
                    <div style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5}}>
                      {evPhotos.map((_,i)=>(
                        <button key={i} onClick={()=>setEvPhotoIdx(i)}
                          style={{width:i===evPhotoIdx?18:6,height:6,borderRadius:3,background:i===evPhotoIdx?'#fff':'rgba(255,255,255,.45)',border:'none',cursor:'pointer',padding:0,transition:'width .2s'}}/>
                      ))}
                    </div>
                    <div style={{position:'absolute',top:10,right:10,background:'rgba(61,26,51,.7)',borderRadius:20,padding:'3px 9px',fontSize:10,fontWeight:700,color:'#fff'}}>
                      {evPhotoIdx+1}/{evPhotos.length}
                    </div>
                  </div>
                )
              })()}

              {/* Carte créateur — cliquable pour voir son profil */}
              <div onClick={()=>onOpenProfile?.(selEv.creator, selEv.creatorBio||'', selEv.creatorPhoto||null)}
                style={{background:C.bgCard,borderRadius:12,padding:'10px 14px',marginBottom:12,display:'flex',gap:10,alignItems:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent',border:`1px solid ${C.border}`}}>
                <Av src={selEv.creatorPhoto} name={selEv.creator} size={44}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:800}}>{selEv.creator} <span style={{fontSize:10,color:C.whiteMid}}>· Organizer</span></div>
                  <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{selEv.creatorBio}</div>
                </div>
                <span style={{fontSize:11,color:C.salmon}}>→</span>
              </div>

              <div style={{fontSize:13,color:C.whiteMid,lineHeight:1.7,marginBottom:12}}>{selEv.description}</div>

              <div style={{background:C.bgCard,borderRadius:12,padding:'10px 14px',marginBottom:12}}>
                {[{icon:'👥',l:'Spots',v:`${selEv.taken}/${selEv.spots} registered`},{icon:'💰',l:'Price',v:selEv.price},{icon:'🎒',l:'Bring',v:selEv.bring}].map(r=>(
                  <div key={r.icon} style={{display:'flex',gap:8,alignItems:'flex-start',padding:'3px 0'}}>
                    <span style={{fontSize:13,width:18}}>{r.icon}</span>
                    <span style={{fontSize:11,color:C.whiteMid,width:56,flexShrink:0}}>{r.l}</span>
                    <span style={{fontSize:11,color:C.white,flex:1}}>{r.v}</span>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:12}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:11,color:C.whiteMid}}>Places</span>
                  <span style={{fontSize:11,color:selEv.taken/selEv.spots>.8?C.orange:C.green,fontWeight:700}}>{selEv.spots-selEv.taken} left</span>
                </div>
                <div style={{height:5,borderRadius:3,background:C.whiteFaint,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${selEv.taken/selEv.spots*100}%`,background:`linear-gradient(90deg,${C.green},${C.orange})`,borderRadius:3}}/>
                </div>
              </div>

              <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:16}}>
                {selEv.tags.map((t:string)=><span key={t} style={{padding:'3px 9px',borderRadius:20,background:C.whiteFaint,color:C.whiteMid,fontSize:10}}>#{t}</span>)}
              </div>

              {/* Avis participants — seulement pour créateurs certifiés */}
              {(selEv as any).reviews?.length > 0 && (
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.orange,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>
                    💬 What attendees are saying
                  </div>
                  {(selEv as any).reviews.map((r:any,i:number)=>(
                    <div key={i} style={{background:C.bgCard,borderRadius:12,padding:'10px 14px',marginBottom:6,display:'flex',gap:10}}>
                      <span style={{fontSize:18,flexShrink:0}}>{r.emoji}</span>
                      <div>
                        <div style={{fontSize:12,color:C.white,lineHeight:1.6}}>"{r.text}"</div>
                        <div style={{fontSize:10,color:C.whiteMid,marginTop:3}}>— {r.author}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat groupé événement — visible une fois inscrit·e */}
              {registered.has(selEv.id) && (
                <div style={{marginBottom:8}}>
                  <div style={{fontSize:10,fontWeight:800,color:C.green,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>
                    💬 {lang==='en'?'Group chat':'Chat du groupe'}
                  </div>
                  <div style={{background:C.bgCard,border:`1px solid ${C.green}33`,borderRadius:12,padding:'10px 12px',marginBottom:6,maxHeight:220,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
                    {(groupMsgs[selEv.id]||[]).map((m,i)=>{
                      const isCreator = m.name===selEv.creator
                      return (
                        <div key={i} style={{display:'flex',justifyContent:m.mine?'flex-end':'flex-start',marginBottom:7}}>
                          <div style={{maxWidth:'82%',background:m.mine?C.salmon:isCreator?`${C.orange}22`:C.bgSheet,color:m.mine?C.bordeaux:C.white,borderRadius:10,padding:'6px 10px',border:isCreator?`1px solid ${C.orange}44`:'none'}}>
                            {!m.mine&&<div style={{fontSize:9,fontWeight:800,color:isCreator?C.orange:C.salmonFaint,marginBottom:2}}>
                              {m.name}{isCreator&&<span style={{marginLeft:4,fontSize:8,background:C.orange,color:'#fff',borderRadius:4,padding:'0 4px',fontWeight:900}}>Host</span>}
                            </div>}
                            <div style={{fontSize:12}}>{m.text}</div>
                            <div style={{fontSize:9,color:m.mine?'rgba(61,26,51,.5)':C.whiteMid,marginTop:2,textAlign:'right'}}>{m.t}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {/* Saisie message groupe — pas de limite artificielle */}
                  <div style={{display:'flex',gap:6}}>
                    <input
                      value={groupInput}
                      onChange={e=>setGroupInput(e.target.value.slice(0,300))}
                      onKeyDown={e=>{
                        if(e.key==='Enter'&&groupInput.trim()){
                          const msg={name:'Moi',text:groupInput.trim(),t:new Date().toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),mine:true}
                          setGroupMsgs(prev=>({...prev,[selEv.id]:[...(prev[selEv.id]||[]),msg].slice(-50)}))
                          setGroupInput('')
                        }
                      }}
                      placeholder={lang==='en'?'Write a message…':'Écrire un message…'}
                      style={{flex:1,padding:'9px 12px',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:10,color:C.white,fontSize:12,outline:'none',fontFamily:'inherit'}}
                    />
                    <button onClick={()=>{
                      if(!groupInput.trim()) return
                      const msg={name:'Moi',text:groupInput.trim(),t:new Date().toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),mine:true}
                      setGroupMsgs(prev=>({...prev,[selEv.id]:[...(prev[selEv.id]||[]),msg].slice(-50)}))
                      setGroupInput('')
                    }} style={{padding:'9px 14px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
                      ↑
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* CTA fixe en bas — padding-bottom = tab bar (72) + safe area + marge */}
            <div style={{flexShrink:0,padding:'8px 20px calc(max(env(safe-area-inset-bottom,0px),0px) + 88px)',borderTop:`1px solid ${C.border}`,background:C.bgSheet}}>
              {registered.has(selEv.id)
                ? (unregConfirmId===selEv.id ? (
                    /* ── Confirmation inline désinscription — même style que annulation clutch ── */
                    <div style={{background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',borderRadius:14,padding:'12px 14px'}}>
                      {(()=>{
                        const reason: PenaltyReason = 'event_cancel_early'
                        const p = getPenalty(reason)
                        // Thermomètre niveau pénalité (pas le chiffre exact)
                        const level = Math.abs(p.pts)<=5?0:Math.abs(p.pts)<=10?1:Math.abs(p.pts)<=15?2:3
                        const colors=['#22c55e','#f59e0b','#ef4444','#7f1d1d']
                        const labels=['None','Minor','Significant','Severe']
                        return (
                          <>
                            <div style={{fontSize:13,color:C.white,fontWeight:800,marginBottom:6}}>Unregister from "{selEv.title}"?</div>
                            {/* Thermomètre */}
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:10,color:C.whiteMid,marginBottom:4}}>Penalty level</div>
                              <div style={{display:'flex',gap:3,marginBottom:3}}>
                                {[0,1,2,3].map(i=>(
                                  <div key={i} style={{flex:1,height:8,borderRadius:4,background:i<=level?colors[level]:`${C.whiteMid}33`,transition:'background .2s'}}/>
                                ))}
                              </div>
                              <div style={{fontSize:11,fontWeight:700,color:colors[level]}}>{p.emoji} Penalty: {labels[level]}</div>
                            </div>
                            <div style={{display:'flex',gap:8}}>
                              <button onClick={()=>{
                                setRegistered((prev:Set<string>)=>{const n=new Set(prev);n.delete(selEv.id);return n})
                                onPenalty?.(reason)
                                setUnregConfirmId(null)
                                setSelEv(null)
                              }} style={{flex:1,padding:'9px',background:C.red,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                                Yes, unregister
                              </button>
                              <button onClick={()=>setUnregConfirmId(null)}
                                style={{flex:1,padding:'9px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,color:C.whiteMid,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                                Stay registered
                              </button>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  ) : (
                    <div style={{display:'flex',gap:8}}>
                      <div style={{flex:1,textAlign:'center',padding:'14px',color:C.green,fontWeight:700,fontSize:13}}>✓ {t('events.registered')}</div>
                      <button onClick={()=>setUnregConfirmId(selEv.id)}
                        style={{padding:'10px 14px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,color:C.red,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                        ↩ Unregister
                      </button>
                    </div>
                  ))
                : selEv.taken >= selEv.spots ? (
                  /* Complet — liste d'attente */
                  waitlist.has(selEv.id) ? (
                    <div style={{textAlign:'center',padding:'14px',background:`${C.orange}14`,border:`1px solid ${C.orange}33`,borderRadius:14}}>
                      <div style={{fontSize:13,fontWeight:800,color:C.orange}}>📋 On the waitlist</div>
                      <div style={{fontSize:10,color:C.whiteMid,marginTop:2}}>You'll be notified if a spot opens up</div>
                    </div>
                  ) : (
                    <button onClick={()=>setWaitlist((prev:Set<string>)=>new Set([...prev,selEv.id]))}
                      style={{width:'100%',padding:'14px',background:'transparent',border:`1.5px solid ${C.orange}`,borderRadius:16,color:C.orange,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                      📋 Join waitlist
                    </button>
                  )
                ) : (
                  <button onClick={()=>doRegister(selEv)} disabled={registering}
                    style={{width:'100%',padding:'15px',background:`linear-gradient(135deg,${C.salmon},${C.orange})`,border:'none',borderRadius:16,color:C.bordeaux,fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:registering?.7:1}}>
                    {registering?'…':t('events.register')}
                  </button>
                )
              }
              {selEv.price!=='Entrée libre'&&<div style={{textAlign:'center',marginTop:8,fontSize:10,color:C.whiteMid}}>💰 Pay on-site · {selEv.price}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// PROFILE TAB — complet avec édition, favoris, enfants
// ═════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════
// CHAT POST-VERROU — 5 messages max par personne, 300 car max
// S'ouvre depuis l'onglet Clutchs sur un Verrou confirmé
// Supabase realtime si vrai profil, mock si bot
// ═════════════════════════════════════════════════════════════
type ChatMsg = { id:string; sender:string; text:string; t:string; mine:boolean }

function ChatSheet({ clutch, userId, onClose, showToast, onMarkRead }:{
  clutch:any; userId:string; onClose:()=>void; showToast:(m:string,c?:string)=>void; onMarkRead?:(id:string)=>void
}) {
  const other = clutch.sender_id === userId ? clutch.receiver : clutch.sender
  const otherId = clutch.sender_id === userId ? clutch.receiver_id : clutch.sender_id
  const gk = genderKey(other?.gender)

  // Détecter si c'est un chat bot (pas de vraie table Supabase)
  const isBotChat = !!(clutch._botMessages || other?.account_type === 'bot' || isTestProfile(other?.id || ''))

  // Mock messages pour les bots
  const botInitMsgs: ChatMsg[] = clutch._botMessages
    ? clutch._botMessages.map((m:any,i:number)=>({id:'b'+i,sender:other?.name||'?',text:m.content,t:new Date(m.created_at).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),mine:false}))
    : [{id:'m1',sender:other?.name||'?',text:`Super, j'ai hâte ! ☕`,t:'14:32',mine:false},{id:'m2',sender:'Moi',text:'Parfait, je réserve une table pour 2 ✓',t:'14:33',mine:true},{id:'m3',sender:other?.name||'?',text:`J'arrive dans 15min, je viens à vélo 🚴`,t:'14:45',mine:false}]

  const [msgs, setMsgs] = useState<ChatMsg[]>(isBotChat ? botInitMsgs : [])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [likedMsgs, setLikedMsgs] = useState<Set<string>>(new Set())
  const [dbMode, setDbMode] = useState<'loading'|'ok'|'fallback'>(isBotChat ? 'ok' : 'loading')
  const [botTyping, setBotTyping] = useState(false)

  // Marquer comme lu à l'ouverture
  useEffect(() => { onMarkRead?.(clutch.id) }, [clutch.id, onMarkRead])
  const tapTimers = useRef<Record<string,ReturnType<typeof setTimeout>>>({})
  const bottomRef = useRef<HTMLDivElement>(null)

  // ── Chargement initial + realtime (vrai profil uniquement) ──
  useEffect(() => {
    if (isBotChat) return

    let channel: any = null

    const init = async () => {
      // 1. Chargement initial
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('clutch_id', clutch.id)
        .order('created_at')

      if (error) {
        if ((error as any).code === '42P01' || error.message?.includes('does not exist')) {
          // Table pas encore créée → fallback gracieux
          showToast('💬 Chat DB not configured — demo mode', C.orange)
          setMsgs(botInitMsgs)
          setDbMode('fallback')
        } else {
          setDbMode('fallback')
          setMsgs(botInitMsgs)
        }
        return
      }

      const loaded: ChatMsg[] = (data||[]).map((m:any) => ({
        id: m.id,
        sender: m.sender_id === userId ? 'Moi' : (other?.name || '?'),
        text: m.content,
        t: new Date(m.created_at).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),
        mine: m.sender_id === userId,
      }))
      setMsgs(loaded)
      setDbMode('ok')

      // 2. Marquer les messages reçus non lus comme lus
      const unreadIds = (data||[])
        .filter((m:any) => m.receiver_id === userId && !m.read_at)
        .map((m:any) => m.id)
      if (unreadIds.length > 0) {
        await supabase.from('messages').update({ read_at: new Date().toISOString() }).in('id', unreadIds)
      }

      // 3. Subscription realtime
      channel = supabase
        .channel(`chat_${clutch.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `clutch_id=eq.${clutch.id}`,
        }, (payload: any) => {
          const m = payload.new
          if (m.sender_id === userId) return // déjà ajouté optimistement
          setMsgs(prev => [...prev, {
            id: m.id,
            sender: other?.name || '?',
            text: m.content,
            t: new Date(m.created_at).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),
            mine: false,
          }])
          // Marquer comme lu immédiatement
          supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id)
        })
        .subscribe()
    }

    init()

    // Polling fallback toutes les 4s pour les messages (Realtime pas toujours fiable)
    const pollInterval = isBotChat ? null : setInterval(async () => {
      const { data } = await supabase.from('messages').select('*').eq('clutch_id', clutch.id).order('created_at')
      if (!data) return
      const loaded: ChatMsg[] = data.map((m:any) => ({
        id: m.id, sender: m.sender_id === userId ? 'Moi' : (other?.name || '?'),
        text: m.content, t: new Date(m.created_at).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),
        mine: m.sender_id === userId,
      }))
      setMsgs(prev => {
        if (loaded.length === prev.length) return prev
        return loaded
      })
      if (dbMode === 'loading') setDbMode('ok')
    }, 4000)

    return () => {
      if (channel) supabase.removeChannel(channel)
      if (pollInterval) clearInterval(pollInterval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clutch.id, isBotChat])

  const handleMsgTap = (id:string) => {
    if (tapTimers.current[id]) {
      clearTimeout(tapTimers.current[id])
      delete tapTimers.current[id]
      setLikedMsgs(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n})
    } else {
      tapTimers.current[id] = setTimeout(()=>{ delete tapTimers.current[id] }, 350)
    }
  }
  const myCount = msgs.filter(m=>m.mine).length
  const MAX = 5

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  const send = async () => {
    if (!input.trim() || myCount >= MAX) return
    setSending(true)
    const t0 = new Date().toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})
    const text = input.trim()
    setInput('')

    if (isBotChat || dbMode === 'fallback') {
      // Mode mock/bot
      const msg: ChatMsg = {id:'m'+Date.now(),sender:'Moi',text,t:t0,mine:true}
      setMsgs(prev=>[...prev,msg])
      setSending(false)
      if (myCount+1 >= MAX) showToast(`Limit reached: ${MAX} messages max`,C.orange)
      if (myCount+1 < MAX) {
        const delay = 3000 + Math.random() * 5000
        setBotTyping(true)
        setTimeout(()=>{
          setBotTyping(false)
          const venue = clutch.venue || 'ce café'
          const time = clutch.proposed_time
            ? new Date(clutch.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})
            : 'tout à l\'heure'
          const reply = getBotReply(other, text, venue, time)
          setMsgs(prev=>[...prev,{id:'br'+Date.now(),sender:other?.name||'?',text:reply,t:new Date().toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),mine:false}])
        }, delay)
      }
    } else {
      // Mode Supabase réel — insert optimiste puis DB
      const optimisticMsg: ChatMsg = {id:'opt'+Date.now(),sender:'Moi',text,t:t0,mine:true}
      setMsgs(prev=>[...prev,optimisticMsg])
      const { error } = await supabase.from('messages').insert({
        clutch_id: clutch.id,
        sender_id: userId,
        receiver_id: otherId,
        content: text,
      })
      setSending(false)
      if (error) {
        showToast('⚠️ ' + error.message, C.red)
        setMsgs(prev => prev.filter(m => m.id !== optimisticMsg.id))
      } else if (myCount+1 >= MAX) {
        showToast(`Limit reached: ${MAX} messages max`, C.orange)
      }
    }
  }

  const rdv = new Date(clutch.proposed_time)
  const past = rdv < new Date()

  return (
    <div style={{position:'fixed',inset:0,zIndex:3500,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)'}} onClick={onClose}/>
      <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',height:'82vh',display:'flex',flexDirection:'column',animation:'modalIn .35s cubic-bezier(.22,1,.36,1)'}}>
        {/* Header */}
        <div style={{flexShrink:0,padding:'14px 16px 10px',borderBottom:`1px solid ${C.border}`,display:'flex',gap:10,alignItems:'center'}}>
          <Av src={other?.photo_url} name={other?.name||'?'} size={38}/>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:900,display:'flex',alignItems:'center',gap:6}}>
              <GenderSvg gk={gk} size={14}/>{other?.name||'?'}
              <span style={{fontSize:10,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'1px 7px',fontWeight:800}}>🔒 Verrou</span>
            </div>
            <div style={{fontSize:10,color:C.whiteMid,display:'flex',alignItems:'center',gap:6}}>
              {clutch.venue} · {rdv.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})} {past?'· Past meetup':''}
              {isBotChat || (other?.account_type==='bot')
                ? <span style={{fontSize:9,color:'#6B7280',background:'rgba(107,114,128,.15)',borderRadius:10,padding:'1px 6px',fontWeight:700}}>🤖 Bot</span>
                : <span style={{fontSize:9,color:C.green,background:`${C.green}15`,borderRadius:10,padding:'1px 6px',fontWeight:700}}>💬 Real profile</span>
              }
            </div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.whiteMid,fontSize:20,cursor:'pointer'}}>✕</button>
        </div>
        {/* Règle claire / indicateur mode */}
        {(isBotChat || dbMode === 'fallback') && (
          <div style={{flexShrink:0,background:'rgba(107,114,128,.12)',borderBottom:'1px solid rgba(107,114,128,.25)',padding:'5px 16px',fontSize:10,color:'#9CA3AF',fontWeight:700,textAlign:'center'}}>
            {dbMode === 'fallback' ? '💬 Chat DB not configured — demo mode' : '🤖 Bot mode — simulated messages'}
          </div>
        )}
        {/* Bannière lieu de RDV */}
        <div style={{flexShrink:0,background:`${C.green}12`,borderBottom:`1px solid ${C.green}33`,padding:'7px 16px',display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:16}}>📍</span>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:800,color:C.green}}>{clutch.venue||'Venue TBD'}</div>
            <div style={{fontSize:9,color:C.whiteMid}}>{new Date(clutch.proposed_time).toLocaleString('fr-CH',{weekday:'short',hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <button onClick={()=>{
            const txt = `📍 See you at ${clutch.venue||'our spot'} at ${new Date(clutch.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}`
            setInput(txt)
          }} style={{background:`${C.green}20`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'4px 10px',color:C.green,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>
            Confirm venue
          </button>
        </div>
        <div style={{flexShrink:0,background:C.orangeFaint,borderBottom:`1px solid ${C.orange}33`,padding:'5px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:10,color:C.orange,fontWeight:700}}>⚡ Max {MAX} messages · To coordinate your meetup</span>
          <span style={{fontSize:10,color:C.orange}}>{myCount}/{MAX}</span>
        </div>
        {/* Messages — loader initial */}
        {dbMode === 'loading' && (
          <div style={{flexShrink:0,padding:'12px 16px',textAlign:'center',fontSize:12,color:C.whiteMid}}>Loading messages…</div>
        )}
        <div style={{flex:'1 1 0',overflowY:'scroll',WebkitOverflowScrolling:'touch',padding:'12px 16px'}}>
          {msgs.map(m=>{
            const liked = likedMsgs.has(m.id)
            return (
              <div key={m.id} style={{display:'flex',justifyContent:m.mine?'flex-end':'flex-start',marginBottom:10,position:'relative'}}>
                <div onClick={()=>handleMsgTap(m.id)}
                  style={{maxWidth:'75%',background:m.mine?C.salmon:C.bgCard,color:m.mine?C.bordeaux:C.white,borderRadius:m.mine?'16px 16px 4px 16px':'16px 16px 16px 4px',padding:'9px 12px',cursor:'pointer',userSelect:'none',WebkitUserSelect:'none',position:'relative'}}>
                  <div style={{fontSize:13,lineHeight:1.4}}>{m.text}</div>
                  <div style={{fontSize:9,color:m.mine?'rgba(61,26,51,.6)':C.whiteMid,marginTop:3,textAlign:'right'}}>{m.t}</div>
                  {liked&&(
                    <div style={{position:'absolute',bottom:-8,right:m.mine?4:undefined,left:m.mine?undefined:4,fontSize:14,lineHeight:1,animation:'heartPop .2s ease-out'}}>
                      ❤️
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {/* Typing indicator bot */}
          {botTyping && isBotChat && (
            <div style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0 8px',opacity:0.75}}>
              {other?.photo_url && <img src={other.photo_url} style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',flexShrink:0}} alt=""/>}
              <div style={{background:C.bgCard,borderRadius:'16px 16px 16px 4px',padding:'8px 12px',display:'flex',alignItems:'center',gap:4}}>
                <span style={{fontSize:11,color:C.whiteMid,fontStyle:'italic'}}>{other?.name} is typing</span>
                <style>{`@keyframes typingDot{0%,80%,100%{opacity:.2}40%{opacity:1}}`}</style>
                <span style={{fontSize:14,color:C.orange,animation:'typingDot 1.4s ease-in-out 0s infinite'}}>•</span>
                <span style={{fontSize:14,color:C.orange,animation:'typingDot 1.4s ease-in-out 0.2s infinite'}}>•</span>
                <span style={{fontSize:14,color:C.orange,animation:'typingDot 1.4s ease-in-out 0.4s infinite'}}>•</span>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        {/* Input */}
        <div style={{flexShrink:0,padding:'8px 12px calc(env(safe-area-inset-bottom,0px) + 12px)',borderTop:`1px solid ${C.border}`,display:'flex',gap:8,alignItems:'flex-end'}}>
          {myCount >= MAX
            ? <div style={{flex:1,padding:'12px',textAlign:'center',fontSize:12,color:C.whiteMid}}>
                Limit reached — see you at {clutch.venue}!
              </div>
            : <>
                <div style={{flex:1,position:'relative'}}>
                  <textarea value={input} onChange={e=>setInput(e.target.value.slice(0,300))} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                    placeholder="Short message…" rows={1}
                    style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:16,padding:'10px 12px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',caretColor:C.salmon,lineHeight:1.4}}/>
                  {input.length>0&&<div style={{position:'absolute',bottom:4,right:8,fontSize:9,color:input.length>250?C.orange:C.whiteMid}}>{input.length}/300</div>}
                </div>
                <button onClick={send} disabled={!input.trim()||sending}
                  style={{width:40,height:40,borderRadius:'50%',background:input.trim()?C.salmon:'transparent',border:`1px solid ${input.trim()?C.salmon:C.border}`,color:C.bordeaux,fontSize:17,cursor:input.trim()?'pointer':'default',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  ↑
                </button>
              </>
          }
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// FEEDBACK POST-RDV — noter son RDV + gagner des points fiabilité
// S'ouvre automatiquement ~5min après l'heure du RDV
// ═════════════════════════════════════════════════════════════
// ── Feedback général (bouton flottant sur tous les onglets) ──
function AppFeedbackModal({ user, onClose, showToast }: { user: any; onClose: ()=>void; showToast: (msg:string,color:string)=>void }) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob|null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const mrRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => { if (sent) { const t = setTimeout(onClose, 2200); return () => clearTimeout(t) } }, [sent, onClose])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mrRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e: BlobEvent) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t: MediaStreamTrack) => t.stop())
      }
      mr.start()
      setRecording(true)
    } catch { showToast('Micro non disponible', C.red) }
  }

  const stopRecording = () => { mrRef.current?.stop(); setRecording(false) }

  const send = async () => {
    if (!text.trim() && !audioBlob) return
    setSending(true)
    try {
      let audio_url: string|null = null
      if (audioBlob) {
        const safeName = (user.name||'user').replace(/[^a-zA-Z0-9]/g,'_').toLowerCase()
        const path = `feedbacks/${safeName}_${user.id.slice(0,8)}_${Date.now()}.webm`
        const { error: upErr } = await supabase.storage.from('feedbacks').upload(path, audioBlob, { upsert: true })
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('feedbacks').getPublicUrl(path)
          audio_url = publicUrl
        }
      }
      const { error: insertErr } = await supabase.from('user_feedbacks').insert({
        user_id: user.id, user_name: user.name || null,
        text: text.trim() || null, audio_url, created_at: new Date().toISOString(),
      })
      if (insertErr) { showToast('Send error: '+insertErr.message, C.red); setSending(false); return }
      setSent(true)
    } catch(e:unknown) { showToast('Send error: '+(e instanceof Error ? e.message : String(e)), C.red) }
    setSending(false)
  }

  // Écran succès
  if (sent) return (
    <div style={{position:'fixed',inset:0,zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,.75)',backdropFilter:'blur(8px)'}}>
      <div style={{textAlign:'center',animation:'verrouPop .5s cubic-bezier(.22,1,.36,1)'}}>
        <div style={{fontSize:72,marginBottom:16,filter:'drop-shadow(0 0 30px #C8860A)'}}>💬</div>
        <div style={{fontSize:22,fontWeight:900,color:C.white,letterSpacing:'-.02em',marginBottom:8}}>Thank you!</div>
        <div style={{fontSize:14,color:C.salmon,opacity:.8}}>Your feedback is received · Mel &amp; David will read it ❤️</div>
        <div style={{marginTop:20,display:'flex',gap:6,justifyContent:'center'}}>
          {['✦','✦','✦'].map((s,i)=>(
            <span key={i} style={{fontSize:10,color:C.orange,opacity:.6,animation:`pulse ${1+i*.2}s infinite`}}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <div style={{position:'fixed',inset:0,zIndex:9000,display:'flex',alignItems:'flex-end',justifyContent:'center',background:'rgba(0,0,0,.65)',backdropFilter:'blur(6px)'}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{width:'100%',maxWidth:480,background:`linear-gradient(180deg,${C.bordeauxLight} 0%,${C.bordeaux} 100%)`,borderRadius:'24px 24px 0 0',padding:'6px 20px 44px',border:`1px solid ${C.border}`,boxShadow:`0 -8px 40px rgba(200,134,10,.15)`}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'10px 0 16px'}}>
          <div style={{width:36,height:4,borderRadius:2,background:C.border}}/>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
          <div style={{fontSize:18,fontWeight:900,color:C.white,letterSpacing:'-.02em'}}>💬 Feedback</div>
          <button onClick={onClose} style={{background:'rgba(255,255,255,.08)',border:'none',color:C.whiteMid,fontSize:16,cursor:'pointer',lineHeight:1,width:28,height:28,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        </div>
        <div style={{fontSize:12,color:C.salmon,opacity:.7,marginBottom:16}}>Your opinion matters. Write or record audio — everything is read by David.</div>
        <textarea value={text} onChange={e=>setText(e.target.value.slice(0,500))} rows={4}
          placeholder="What works, what doesn't, your wild ideas..."
          style={{width:'100%',background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,borderRadius:14,padding:'12px 14px',fontSize:14,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',boxSizing:'border-box',marginBottom:6,lineHeight:1.5}}/>
        <div style={{fontSize:10,color:C.whiteMid,opacity:.4,marginBottom:14,textAlign:'right'}}>{text.length}/500</div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {!recording && !audioBlob && (
            <button onClick={startRecording} style={{flex:1,padding:'10px',background:'rgba(255,255,255,.07)',border:`1px solid ${C.border}`,borderRadius:12,color:C.salmon,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              🎤 Record audio
            </button>
          )}
          {recording && (
            <button onClick={stopRecording} style={{flex:1,padding:'10px',background:'rgba(239,68,68,.2)',border:'1px solid rgba(239,68,68,.4)',borderRadius:12,color:C.red,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              ⏹ Stop recording
            </button>
          )}
          {audioBlob && !recording && (
            <button onClick={()=>setAudioBlob(null)} style={{flex:1,padding:'10px',background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,borderRadius:12,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
              🗑 Delete audio ✓
            </button>
          )}
        </div>
        <button onClick={send} disabled={sending||(!text.trim()&&!audioBlob)} style={{
          width:'100%',padding:'14px',
          background:(!text.trim()&&!audioBlob)?'rgba(255,255,255,.08)':`linear-gradient(135deg,#C8860A,${C.orange})`,
          border:`1px solid ${(!text.trim()&&!audioBlob)?C.border:'#C8860A'}`,
          borderRadius:16,
          color:(!text.trim()&&!audioBlob)?C.whiteMid:'#000',
          fontSize:15,fontWeight:900,cursor:(!text.trim()&&!audioBlob)?'default':'pointer',
          fontFamily:'inherit',opacity:sending?.6:1,
          boxShadow:(!text.trim()&&!audioBlob)?'none':'0 4px 20px rgba(200,134,10,.4)',
          transition:'all .2s',letterSpacing:'-.01em',
        }}>
          {sending ? '✦ Sending…' : '✦ Send feedback'}
        </button>
      </div>
    </div>
  )
}

function FeedbackSheet({ clutch, userId, onClose, onScore }:{
  clutch:any; userId:string; onClose:(rating:'super'|'ok'|'rabbit'|'ghost'|null)=>void; onScore:(delta:number)=>void
}) {
  const other = clutch.sender_id===userId ? clutch.receiver : clutch.sender
  const [selected,setSelected] = useState<'super'|'ok'|'rabbit'|'ghost'|null>(null)
  const [done,setDone] = useState(false)

  const RATINGS:{key:'super'|'ok'|'rabbit'|'ghost';emoji:string;label:string;sub:string;pts:number}[] = [
    {key:'super', emoji:'🌟', label:'Great meetup',  sub:'We really connected',          pts:5},
    {key:'ok',    emoji:'👍', label:'OK',            sub:'Nice, nothing special',         pts:3},
    {key:'rabbit',emoji:'🐰', label:'No-show',       sub:'The person didn\'t show up',   pts:-20},
    {key:'ghost', emoji:'👻', label:'I didn\'t go',  sub:'I admit, I ghosted',            pts:-15},
  ]

  const submit = () => {
    if (!selected) return
    const r = RATINGS.find(r=>r.key===selected)!
    localStorage.setItem(`feedback_done_${clutch.id}`, '1')
    if (selected==='super'||selected==='ok') onScore(r.pts)
    else onScore(r.pts)
    setDone(true)
    setTimeout(()=>onClose(selected), 1800)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:4000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)'}}/>
      <div style={{position:'relative',background:C.bgSheet,borderRadius:'22px 22px 0 0',padding:'20px 20px 40px',animation:'modalIn .35s cubic-bezier(.22,1,.36,1)'}}>
        <div style={{display:'flex',justifyContent:'center',paddingBottom:8}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>
        {done ? (
          <div style={{textAlign:'center',padding:'20px 0'}}>
            <div style={{fontSize:40,marginBottom:8}}>{RATINGS.find(r=>r.key===selected)?.emoji}</div>
            <div style={{fontSize:15,fontWeight:900,color:C.white,marginBottom:4}}>Thank you!</div>
            {(selected==='super'||selected==='ok') && <div style={{fontSize:13,color:C.green}}>+{RATINGS.find(r=>r.key===selected)?.pts} reliability pts</div>}
            {(selected==='rabbit'||selected==='ghost') && <div style={{fontSize:13,color:C.red}}>{RATINGS.find(r=>r.key===selected)?.pts} reliability pts</div>}
          </div>
        ) : (
          <>
            <div style={{textAlign:'center',marginBottom:16}}>
              <div style={{fontSize:13,color:C.whiteMid,marginBottom:4}}>Meetup with <strong style={{color:C.white}}>{other?.name||'?'}</strong> · {clutch.venue}</div>
              <div style={{fontSize:17,fontWeight:900}}>How did it go?</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:16}}>
              {RATINGS.map(r=>(
                <button key={r.key} onClick={()=>setSelected(r.key)}
                  style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:selected===r.key?`${r.key==='super'||r.key==='ok'?C.green:C.red}18`:'transparent',border:`1.5px solid ${selected===r.key?r.key==='super'||r.key==='ok'?C.green:C.red:C.border}`,borderRadius:14,cursor:'pointer',fontFamily:'inherit',WebkitTapHighlightColor:'transparent'}}>
                  <span style={{fontSize:24,flexShrink:0}}>{r.emoji}</span>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.white}}>{r.label}</div>
                    <div style={{fontSize:11,color:C.whiteMid}}>{r.sub}</div>
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:r.pts>0?C.green:C.red}}>{r.pts>0?'+':''}{r.pts} pts</span>
                </button>
              ))}
            </div>
            <button onClick={submit} disabled={!selected}
              style={{width:'100%',padding:'14px',background:selected?`linear-gradient(135deg,${C.salmon},${C.orange})`:'rgba(255,255,255,.08)',border:'none',borderRadius:16,color:selected?C.bg:C.whiteMid,fontSize:15,fontWeight:900,cursor:selected?'pointer':'default',fontFamily:'inherit'}}>
              Submit feedback
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// PROFILE SHEET — fiche détaillée d'un profil
// Ouvre depuis Présences — 3 actions : Clutcher · ⭐ Favori · 🚫 Block
// ═════════════════════════════════════════════════════════════
function ProfileSheet({ profile, userId, onClutch, onClose, showToast, activeClutch, pendingClutch, onOpenChat, userInterests, lang:psLang }:{
  profile:Profile; userId:string; onClutch:()=>void;
  onClose:()=>void; showToast:(m:string,c?:string)=>void
  activeClutch?:any; pendingClutch?:any; onOpenChat?:()=>void; userInterests?:string[]; lang?:Lang
}) {
  const t = useT(psLang||'fr')
  const gk = genderKey((profile as any).gender)
  const [faved,setFaved] = useState(false)
  const [blocked,setBlocked] = useState(false)
  const [loading,setLoading] = useState(false)
  const isCreator = !!(profile as any).isCreator
  const allowClutch: boolean = isCreator ? !!(profile as any).allowClutch : true
  const creatorPhotos: string[] = (profile as any).creatorPhotos || []
  const eventsHosted: string[] = (profile as any).eventsHosted || []
  const [photoIdx,setPhotoIdx] = useState(0)
  const touchStartX = useRef<number|null>(null)
  const handleTouchStart = (e:React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const handleTouchEnd = (e:React.TouchEvent, total:number) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) {
      if (dx < 0) setPhotoIdx(i => Math.min(total-1, i+1))
      else setPhotoIdx(i => Math.max(0, i-1))
    }
    touchStartX.current = null
  }

  const handleFav = async () => {
    setLoading(true)
    if (!faved) {
      try { await supabase.from('favorites').upsert({user_id:userId, profile_id:profile.id},{onConflict:'user_id,profile_id'}) } catch{}
      setFaved(true)
      showToast(`⭐ ${profile.name} added to favorites`,C.salmon)
    } else {
      try { await supabase.from('favorites').delete().eq('user_id',userId).eq('profile_id',profile.id) } catch{}
      setFaved(false)
      showToast('Removed from favorites',C.whiteMid)
    }
    setLoading(false)
  }

  const handleBlock = async () => {
    if (blocked) { onClose(); return }
    setLoading(true)
    try { await supabase.from('blocks').upsert({blocker_id:userId, blocked_id:profile.id},{onConflict:'blocker_id,blocked_id'}) } catch{}
    setBlocked(true)
    setLoading(false)
    showToast(`🚫 ${profile.name} won't see you anymore`,C.whiteMid)
    setTimeout(onClose, 1200)
  }

  const interests: string[] = (profile as any).interests || []
  const languages: string[] = (profile as any).languages || []
  const job: string|null = (profile as any).job || null
  const neighborhood: string|null = (profile as any).neighborhood || (profile as any).available_city || null
  const firstName = profile.name?.split(' ')[0] || ''
  // Score de compatibilité basé sur intérêts communs
  const myInterests: string[] = userInterests || []
  const sharedInterests = interests.filter(i=>myInterests.map(x=>x.toLowerCase()).includes(i.toLowerCase()))
  const compatScore: number|null = (interests.length>0&&myInterests.length>0)
    ? Math.round(50 + (sharedInterests.length/Math.max(interests.length,myInterests.length))*50)
    : null
  // Extra photos : viennent du profil (mock ou upload)
  const profileExtraPhotos: string[] = (profile as any).extraPhotos || []
  // Combine creatorPhotos et extraPhotos pour la galerie
  const allPhotos: string[] = creatorPhotos.length ? creatorPhotos : profileExtraPhotos

  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',flexDirection:'column'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.5)'}} onClick={onClose}/>
      <div style={{position:'relative',background:C.bgSheet,marginTop:'auto',height:'96vh',display:'flex',flexDirection:'column',animation:'modalIn .32s cubic-bezier(.22,1,.36,1)',borderRadius:'20px 20px 0 0'}}>
        {/* Handle */}
        <div style={{display:'flex',justifyContent:'center',padding:'10px 0 4px',flexShrink:0}}>
          <div style={{width:36,height:4,borderRadius:2,background:C.border}}/>
        </div>
        {/* Photo banner — photo entière visible, pas de crop */}
        <div onTouchStart={handleTouchStart} onTouchEnd={e=>handleTouchEnd(e,allPhotos.length||1)} style={{position:'relative',flexShrink:0,margin:'0 14px 0',borderRadius:16,overflow:'hidden',
          background:`linear-gradient(160deg,${C.bordeauxLight},${C.bordeaux})`,
          minHeight:220, maxHeight:340,
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          {profile.photo_url && !allPhotos.length
            ? <img src={profile.photo_url} alt={profile.name||''} style={{width:'100%',maxHeight:340,objectFit:'contain',display:'block'}}/>
            : (allPhotos[photoIdx]&&!allPhotos[photoIdx].startsWith('linear')&&!allPhotos[photoIdx].startsWith('#'))
              ? <img src={allPhotos[photoIdx]} alt="" style={{width:'100%',maxHeight:340,objectFit:'contain',display:'block'}}/>
              : null
          }
          {/* Gradient bas */}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(61,26,51,.95) 0%,transparent 55%)'}}/>

          {/* Mini galerie dots */}
          {allPhotos.length>1&&(
            <div style={{position:'absolute',top:10,left:'50%',transform:'translateX(-50%)',display:'flex',gap:5,zIndex:2}}>
              {allPhotos.map((_,i)=>(
                <button key={i} onClick={()=>setPhotoIdx(i)}
                  style={{width:i===photoIdx?18:6,height:6,borderRadius:3,background:i===photoIdx?C.white:`${C.white}55`,border:'none',cursor:'pointer',transition:'width .2s',padding:0}}/>
              ))}
            </div>
          )}
          {/* Flèches galerie */}
          {allPhotos.length>1&&(
            <>
              <button onClick={()=>setPhotoIdx(i=>Math.max(0,i-1))} style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',background:'rgba(61,26,51,.6)',border:'none',color:C.white,width:28,height:28,borderRadius:'50%',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>‹</button>
              <button onClick={()=>setPhotoIdx(i=>Math.min(allPhotos.length-1,i+1))} style={{position:'absolute',right:44,top:'50%',transform:'translateY(-50%)',background:'rgba(61,26,51,.6)',border:'none',color:C.white,width:28,height:28,borderRadius:'50%',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>›</button>
            </>
          )}

          {/* Infos en bas de la photo */}
          <div style={{position:'absolute',bottom:12,left:14,right:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              {isCreator&&<span style={{fontSize:10,fontWeight:900,background:`${C.orange}22`,color:C.orange,border:`1px solid ${C.orange}55`,borderRadius:20,padding:'2px 8px'}}>✦ Organizer</span>}
              <span style={{fontSize:20,fontWeight:900,color:C.white}}>{profile.name||'Anonyme'}</span>
              {(()=>{ const b=getAccountBadge(profile); return b ? (
                <span style={{fontSize:9,fontWeight:900,padding:'2px 6px',borderRadius:10,background:`${b.color}22`,color:b.color,border:`1px solid ${b.color}44`}}>
                  {b.emoji} {b.label}
                </span>
              ) : null })()}
              {(profile as any).age&&<span style={{fontSize:14,color:C.whiteMid,fontWeight:600}}>{(profile as any).age} ans</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
              {profile.reliability_score!=null&&<Score v={profile.reliability_score}/>}
              {compatScore!==null&&(
                <span style={{fontSize:11,fontWeight:800,padding:'2px 8px',borderRadius:20,
                  background:compatScore>=80?`${C.green}22`:compatScore>=60?`${C.orange}22`:`${C.whiteMid}11`,
                  color:compatScore>=80?C.green:compatScore>=60?C.orange:C.whiteMid,
                  border:`1px solid ${compatScore>=80?C.green+'44':compatScore>=60?C.orange+'44':C.border}`}}>
                  🎯 {compatScore}% match
                </span>
              )}
              {neighborhood&&<span style={{fontSize:11,color:C.whiteMid}}>📍 {neighborhood}</span>}
              {job&&<span style={{fontSize:11,color:C.whiteMid}}>· {job}</span>}
            </div>
          </div>
          {/* Close */}
          <button onClick={onClose} style={{position:'absolute',top:10,right:10,background:'rgba(61,26,51,.75)',border:'none',color:C.white,fontSize:18,width:32,height:32,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(4px)',zIndex:3}}>✕</button>
          {/* Badge disponible */}
          <div style={{position:'absolute',top:10,left:10,display:'flex',alignItems:'center',gap:5,background:'rgba(61,26,51,.75)',backdropFilter:'blur(4px)',padding:'3px 8px',borderRadius:20,zIndex:2}}>
            <div style={{width:8,height:8,borderRadius:'50%',background:C.green}}/>
            <span style={{fontSize:10,fontWeight:700,color:C.green}}>Available</span>
          </div>
        </div>

        {/* Corps scrollable */}
        <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0,padding:'14px 16px 8px'}}>
          {/* Verified + lastSeen (bots enrichis) */}
          {(()=>{
            const key = Object.keys(BOT_ENRICHMENT).find(k => ((profile as any).id||'').startsWith(k))
            const enr = key ? BOT_ENRICHMENT[key] : null
            if (!enr) return null
            return (
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12,flexWrap:'wrap'}}>
                {enr.verified && (
                  <span style={{fontSize:11,fontWeight:800,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'3px 10px',display:'flex',alignItems:'center',gap:4}}>
                    ✓ Verified profile
                  </span>
                )}
                <span style={{fontSize:11,color:C.whiteMid,background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:20,padding:'3px 10px'}}>
                  👁 Vu·e {enr.lastSeen}
                </span>
              </div>
            )
          })()}
          {/* Bio */}
          {profile.bio&&(
            <div style={{fontSize:13,color:C.whiteMid,lineHeight:1.6,fontStyle:'italic',marginBottom:14,padding:'10px 14px',background:C.whiteFaint,borderRadius:12,border:`1px solid ${C.border}`}}>
              "{profile.bio}"
            </div>
          )}
          {/* Événements créés — si créateur */}
          {isCreator&&eventsHosted.length>0&&(
            <div style={{marginBottom:12,padding:'10px 12px',background:C.orangeFaint,border:`1px solid ${C.orange}22`,borderRadius:12}}>
              <div style={{fontSize:10,fontWeight:800,color:C.orange,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Events hosted</div>
              {eventsHosted.map((ev,i)=>(
                <div key={i} style={{fontSize:12,color:C.white,marginBottom:3}}>✦ {ev}</div>
              ))}
            </div>
          )}
          {/* Centres d'intérêt */}
          {interests.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Interests</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {interests.map((int,i)=>{const shared=myInterests.map(x=>x.toLowerCase()).includes(int.toLowerCase());return(
                  <span key={i} style={{fontSize:11,fontWeight:700,padding:'4px 10px',
                    background:shared?`${C.green}20`:C.salmonFaint,
                    border:`1px solid ${shared?C.green+'55':C.border}`,
                    borderRadius:20,color:shared?C.green:C.salmon}}>
                    {shared&&'✓ '}{int}
                  </span>
                )})}
              </div>
            </div>
          )}
          {/* Langues */}
          {languages.length>0&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>🗣 {t('profile.languages')}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {languages.map((l,i)=>(
                  <span key={i} style={{fontSize:11,fontWeight:700,padding:'4px 10px',background:`rgba(255,191,158,0.1)`,border:`1px solid rgba(255,191,158,0.35)`,borderRadius:20,color:`rgba(255,191,158,0.7)`}}>{l}</span>
                ))}
              </div>
            </div>
          )}
          {/* Espace avant le CTA */}
          <div style={{height:8}}/>
        </div>

        {/* Actions — toujours visibles en bas */}
        <div style={{flexShrink:0,padding:'10px 16px calc(env(safe-area-inset-bottom,0px) + 16px)',borderTop:`1px solid ${C.border}`,display:'flex',flexDirection:'column',gap:8}}>
          {activeClutch ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{textAlign:'center',padding:'12px',background:`${C.green}14`,border:`1px solid ${C.green}44`,borderRadius:14,color:C.green,fontSize:13,fontWeight:800}}>
                🔒 Verrou actif · {activeClutch.venue||'Café Romand'}
                {activeClutch.proposed_time && (
                  <span style={{fontSize:11,color:C.whiteMid,display:'block',marginTop:2}}>🕐 {new Date(activeClutch.proposed_time).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                )}
              </div>
              {onOpenChat&&<button onClick={()=>{onClose();onOpenChat()}}
                style={{width:'100%',padding:'13px',background:`${C.green}20`,border:`1px solid ${C.green}55`,borderRadius:14,color:C.green,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                💬 Open chat
              </button>}
            </div>
          ) : pendingClutch ? (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <div style={{textAlign:'center',padding:'14px',background:C.orangeFaint,border:`1px solid ${C.orange}44`,borderRadius:14}}>
                <div style={{fontSize:13,fontWeight:800,color:C.orange,marginBottom:2}}>⏳ Clutch sent</div>
                <div style={{fontSize:11,color:C.whiteMid}}>Waiting for {firstName} to reply…</div>
              </div>
              <button onClick={async()=>{
                await supabase.from('clutches').update({status:'cancelled',updated_at:new Date().toISOString()}).eq('id',pendingClutch.id)
                showToast('Clutch cancelled',C.whiteMid)
                onClose()
              }} style={{width:'100%',padding:'10px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:12,color:C.red,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                ↩ Cancel clutch
              </button>
            </div>
          ) : !allowClutch ? (
            /* Créateur qui n'accepte pas d'être clutché */
            <div style={{textAlign:'center',padding:'14px 16px',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:14}}>
              <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:4}}>👤 Organizer Profile</div>
              <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.5}}>{firstName} hosts events but doesn't want to be Clutched directly.</div>
              <div style={{marginTop:8,fontSize:11,color:C.salmon}}>Join one of their events to meet them ✦</div>
            </div>
          ) : (
            <>
              <button onClick={onClutch}
                style={{width:'100%',padding:'16px',background:`linear-gradient(135deg,${C.salmon},${C.orange})`,border:'none',borderRadius:16,color:C.bg,fontSize:16,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 20px ${C.orange}44`}}>
                ⚡ Clutcher {firstName}
              </button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={handleFav} disabled={loading}
                  style={{flex:1,padding:'11px',background:faved?`${C.salmon}15`:'transparent',border:`1.5px solid ${faved?C.salmon:C.border}`,borderRadius:14,color:faved?C.salmon:C.whiteMid,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                  {faved?'★ Saved':'☆ Save'}
                </button>
                <button onClick={handleBlock} disabled={loading}
                  style={{flex:1,padding:'11px',background:blocked?'rgba(239,68,68,.08)':'transparent',border:`1.5px solid ${blocked?'rgba(239,68,68,.3)':C.border}`,borderRadius:14,color:blocked?C.red:C.whiteMid,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                  {blocked?'🚫 Blocked':'⚠️ Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Mock clutchs pour demo (quand pas de vrais clutchs en DB)
const now = new Date()
const MOCK_CLUTCHES = [
  { id:'mc1', sender_id:'camille', receiver_id:'me', status:'pending',
    proposed_time:new Date(now.getTime()+2*3600*1000).toISOString(),
    expires_at:new Date(now.getTime()+2*3600*1000).toISOString(),
    venue:'Café Romand', message:'Dispo pour un café ?',
    sender:{name:'Camille',gender:'F',photo_url:null,reliability_score:94},receiver:null },
  { id:'mc2', sender_id:'me', receiver_id:'leo', status:'pending',
    proposed_time:new Date(now.getTime()+1.5*3600*1000).toISOString(),
    expires_at:new Date(now.getTime()+1.5*3600*1000).toISOString(),
    venue:'Bar du Flon', message:'Apéro ce soir ?',
    sender:null,receiver:{name:'Léo',gender:'M',photo_url:null,reliability_score:82} },
  { id:'mc3', sender_id:'sofia', receiver_id:'me', status:'confirmed',
    proposed_time:new Date(now.getTime()+4*3600*1000).toISOString(),
    expires_at:new Date(now.getTime()+24*3600*1000).toISOString(),
    venue:'Blackbird Coffee', message:'Coffee time !',
    sender:{name:'Sofia',gender:'F',photo_url:null,reliability_score:97},receiver:null },
  { id:'mc4', sender_id:'me', receiver_id:'thomas', status:'declined',
    proposed_time:new Date(now.getTime()-3*3600*1000).toISOString(),
    expires_at:new Date(now.getTime()-1*3600*1000).toISOString(),
    venue:'Brasserie Lipp', message:'Dîner ?',
    sender:null,receiver:{name:'Thomas',gender:'M',photo_url:null,reliability_score:75} },
  { id:'mc6', sender_id:'amandine', receiver_id:'me', status:'confirmed',
    proposed_time:new Date(now.getTime()+3*3600*1000).toISOString(),
    expires_at:new Date(now.getTime()+24*3600*1000).toISOString(),
    venue:'Chez Vanini', message:'Café et une vraie conversation ?',
    sender:{name:'Amandine',gender:'F',photo_url:null,reliability_score:96},receiver:null },
  { id:'mc5', sender_id:'ana', receiver_id:'me', status:'expired',
    proposed_time:new Date(now.getTime()-5*3600*1000).toISOString(),
    expires_at:new Date(now.getTime()-3*3600*1000).toISOString(),
    venue:'Café de la Paix', message:'On se croise ?',
    sender:{name:'Ana',gender:'F',photo_url:null,reliability_score:88},receiver:null },
]

function FieldRow({ icon, label, value, gk, placeholder, isEditing, onTap, locked, children }:{
  icon:string; label:string; value:string; gk?:GenderKey; placeholder?:string;
  isEditing:boolean; onTap:()=>void; locked?:boolean; children?:React.ReactNode
}) {
  const display = value || placeholder || 'Add'
  const isEmpty = !value
  return (
    <div style={{borderBottom:`1px solid ${C.border}`}}>
      <div onClick={onTap} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',cursor:locked?'default':'pointer'}}>
        <span style={{width:22,textAlign:'center',fontSize:16}}>{icon||''}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:600,marginBottom:1}}>{label}</div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            {gk && <GenderSvg gk={gk} size={14}/>}
            <div style={{fontSize:13,fontWeight:isEmpty?400:600,color:isEmpty?C.whiteMid:C.white}}>{display}</div>
          </div>
        </div>
        {locked
          ? <span style={{fontSize:12,opacity:.4}}>🔒</span>
          : <span style={{color:C.whiteMid,fontSize:16,transform:isEditing?'rotate(90deg)':'',transition:'transform .15s'}}>›</span>
        }
      </div>
      {isEditing && children}
    </div>
  )
}

function ProfileTab({ user, flow:_flow, setFlow, signOut, setShowDelete, showToast, onUserUpdate, lang, setLang, onSetAvailable, isAvailable }:{
  user:Profile; flow:AppFlow; setFlow:(f:AppFlow)=>void;
  signOut:()=>void; setShowDelete:(v:boolean)=>void;
  showToast:(m:string,c?:string)=>void; onUserUpdate:(p:Profile)=>void;
  lang:Lang; setLang:(l:Lang)=>void;
  onSetAvailable?:()=>void; isAvailable?:boolean;
}) {
  const [profileSubTab, setProfileSubTab] = useState<'profil'|'settings'>('profil')
  const [editField, setEditField] = useState<string|null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(user.name||'')
  const [editBio, setEditBio] = useState(user.bio||'')
  const [editGender, setEditGender] = useState<GenderKey>(genderKey((user as any).gender))
  const [editJob, setEditJob] = useState<string>((user as any).job||'')
  const [editInterests, setEditInterests] = useState<string[]>((user as any).interests||[])
  const [savingInterests, setSavingInterests] = useState(false)
  const [editLanguages, setEditLanguages] = useState<string[]>((user as any).languages||[])
  const [savingLanguages, setSavingLanguages] = useState(false)
  const [editKids, setEditKids] = useState((user as any).has_kids||false)
  const [editKidsCount, setEditKidsCount] = useState((user as any).kids_ages||'')
  const [savingEdit, setSavingEdit] = useState(false)
  const t = useT(lang)
  const [favorites, setFavorites] = useState<Profile[]>([])
  const [blocked, setBlocked] = useState<Profile[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  // Multi-photos (jusqu'à 4 photos en plus de l'avatar principal = 5 au total)
  const storageKey = `clutch_photos_${user.id}`
  const [extraPhotos, setExtraPhotos] = useState<(string|null)[]>(()=>{
    if (typeof window==='undefined') return [null,null,null,null]
    try { const s=localStorage.getItem(storageKey); return s?JSON.parse(s):[null,null,null,null] } catch { return [null,null,null,null] }
  })
  const [swapFromIdx, setSwapFromIdx] = useState<number|null>(null) // tap-to-swap photos

  const handleRetirerDispo = async () => {
    const { error } = await supabase.from('profiles').update({
      is_available: false,
      available_until: null,
      available_from: null,
    }).eq('id', user.id)
    if (error) { showToast('Error: '+error.message, C.red); return }
    onUserUpdate({ ...user, is_available: false, available_until: null } as any)
    showToast('✓ Availability removed', C.whiteMid)
  }
  const extraRefs = [useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null),useRef<HTMLInputElement>(null)]
  const uploadExtra = async (file:File, idx:number) => {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/photo_${idx+2}.${ext}`
    const {error:upErr} = await supabase.storage.from('avatars').upload(path, file, {upsert:true})
    if (upErr) { showToast('Upload error',C.red); return }
    const {data:{publicUrl}} = supabase.storage.from('avatars').getPublicUrl(path)
    const updated = [...extraPhotos]; updated[idx]=publicUrl
    setExtraPhotos(updated)
    try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch {}
    showToast('✓ Photo added',C.green)
  }
  const removeExtra = (idx:number) => {
    const updated = [...extraPhotos]; updated[idx]=null
    setExtraPhotos(updated)
    try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch {}
  }

  useEffect(() => {
    // Charger favoris
    supabase.from('favorites').select('profile_id').eq('user_id', user.id)
      .then(async ({data}) => {
        if (!data?.length) return
        const ids = data.map((d:any) => d.profile_id)
        const {data:profiles} = await supabase.from('profiles').select('*').in('id', ids)
        if (profiles) setFavorites(profiles)
      })
    // Charger bloqués
    supabase.from('blocks').select('blocked_id').eq('blocker_id', user.id)
      .then(async ({data}) => {
        if (!data?.length) return
        const ids = data.map((d:any) => d.blocked_id)
        const {data:profiles} = await supabase.from('profiles').select('*').in('id', ids)
        if (profiles) setBlocked(profiles)
      })
  }, [user.id])

  const saveEdit = async () => {
    setSavingEdit(true)
    try {
      // Colonnes confirmées dans Supabase: name, bio
      // gender peut exister ou non — on tente avec fallback
      const payload: any = {
        name: editName.trim() || user.name,
        bio: editBio.trim() || null,
        ...(editJob.trim() ? {job: editJob.trim()} : {}),
        languages: editLanguages,
      }
      // Mapper GenderKey ('F'/'M'/'X') → valeur DB ('woman'/'man'/'other')
      const genderDbVal = editGender==='F' ? 'woman' : editGender==='M' ? 'man' : 'other'
      payload.gender = genderDbVal
      // NOTE: has_kids / kids_ages n'existent pas encore en DB → ne pas inclure
      // TODO: ajouter ces colonnes dans Supabase quand Mode Amitié sera implémenté
      const {data, error} = await supabase.from('profiles').update(payload).eq('id',user.id).select().single()
      setSavingEdit(false)
      if (error) {
        // Si la colonne gender n'existe pas, retry AVEC gender (Supabase ignore colonnes inconnues parfois)
        // → on loggue l'erreur mais on met quand même à jour l'état local avec le genre
        console.warn('[Profile] save error:', error.message)
        const {data:d2} = await supabase.from('profiles').update({
          name:payload.name, bio:payload.bio, gender:genderDbVal
        }).eq('id',user.id).select().single()
        if (d2) {
          // Forcer le genre dans l'objet retourné si absent
          const merged = {...d2, gender: (d2 as any).gender ?? genderDbVal, languages: editLanguages}
          onUserUpdate(merged as Profile); setEditing(false); showToast('✓ Profile updated',C.green)
        } else showToast('Save error',C.red)
      } else if (data) {
        // Forcer le genre dans l'objet retourné si absent
        const merged = {...data, gender: (data as any).gender ?? genderDbVal, languages: editLanguages}
        onUserUpdate(merged as Profile); setEditing(false); showToast('✓ Profile updated',C.green)
      }
    } catch {
      setSavingEdit(false)
      showToast('Unexpected error',C.red)
    }
  }

  const uploadPhoto = async (file: File) => {
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar.${ext}`
    const {error:upErr} = await supabase.storage.from('avatars').upload(path, file, {upsert:true})
    if (upErr) { showToast('Upload error',C.red); return }
    const {data:{publicUrl}} = supabase.storage.from('avatars').getPublicUrl(path)
    const {data} = await supabase.from('profiles').update({photo_url:publicUrl}).eq('id',user.id).select().single()
    if (data) { onUserUpdate(data as Profile); showToast('✓ Photo updated',C.green) }
  }

  const unblock = async (blockedId:string) => {
    await supabase.from('blocks').delete().eq('blocker_id',user.id).eq('blocked_id',blockedId)
    setBlocked(blocked.filter(b=>b.id!==blockedId))
    showToast('Unblocked',C.green)
  }
  const unfav = async (profileId:string) => {
    await supabase.from('favorites').delete().eq('user_id',user.id).eq('profile_id',profileId)
    setFavorites(favorites.filter(f=>f.id!==profileId))
  }

  const genderLocked = !!(user as any).gender && (user as any).gender !== 'undefined' && (user as any).gender !== null && (user as any).gender !== 'other'

  return (
    <>
    <div className="fi" style={{position:'fixed',inset:0,bottom:72,background:C.bg,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'0 0 32px'}}>

      {/* ─── HERO PHOTO (style Bumble) ─── */}
      <div style={{position:'relative',height:320,background:user.photo_url?'transparent':`linear-gradient(160deg,${C.bordeauxLight},${C.bordeaux})`,overflow:'hidden',flexShrink:0}}>
        {user.photo_url&&<img src={user.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 30%'}}/>}
        {/* Gradient bas */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(42,16,32,.98) 0%,rgba(42,16,32,.3) 50%,transparent 100%)'}}/>
        {/* Settings btn */}
        <button onClick={()=>{setProfileSubTab('settings');setEditField(null)}}
          style={{position:'absolute',top:52,right:14,background:'rgba(42,16,32,.65)',border:`1px solid ${C.border}`,backdropFilter:'blur(6px)',borderRadius:'50%',width:38,height:38,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.whiteMid,fontSize:18,zIndex:2}}>⚙</button>
        {/* Edit photo btn */}
        <button onClick={()=>fileRef.current?.click()}
          style={{position:'absolute',top:52,left:14,background:'rgba(42,16,32,.65)',border:`1px solid ${C.border}`,backdropFilter:'blur(6px)',borderRadius:20,padding:'7px 12px',display:'flex',alignItems:'center',gap:6,cursor:'pointer',color:C.salmon,fontSize:12,fontWeight:700,zIndex:2}}>
          📷 Photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}
          onChange={e=>{if(e.target.files?.[0])uploadPhoto(e.target.files[0])}}/>
        {/* Nom + infos en bas de la photo */}
        <div style={{position:'absolute',bottom:14,left:16,right:16}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:10,marginBottom:6}}>
            <span style={{fontSize:26,fontWeight:900,color:C.white,lineHeight:1}}>{user.name}</span>
            {(user as any).age&&<span style={{fontSize:18,fontWeight:600,color:`${C.white}bb`,lineHeight:1,paddingBottom:1}}>{(user as any).age}</span>}
            <GenderSvg gk={genderKey((user as any).gender)} size={20}/>
          </div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
            {user.reliability_score!=null&&<Score v={user.reliability_score}/>}
            {user.available_city&&CITIES_NAMES.has(user.available_city)&&(
              <span style={{fontSize:11,color:`${C.white}99`,display:'flex',alignItems:'center',gap:3}}>📍 {user.available_city}</span>
            )}
            {(user as any).job&&<span style={{fontSize:11,color:`${C.white}88`}}>· {(user as any).job}</span>}
          </div>
        </div>
      </div>

      {/* ─── BARRE COMPLÉTION PROFIL ─── */}
      {(()=>{
        const fields = [user.photo_url, user.bio, (user as any).gender, user.available_city, (user as any).age, (user as any).job]
        const filled = fields.filter(Boolean).length
        const pct = Math.round((filled/fields.length)*100)
        if (pct >= 100) return null
        return (
          <div style={{padding:'12px 16px 0',flexShrink:0}}>
            <div style={{background:C.bgCard,borderRadius:12,padding:'10px 14px',border:`1px solid ${C.border}`}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <span style={{fontSize:11,fontWeight:700,color:C.salmon}}>Complete your profile</span>
                <span style={{fontSize:11,fontWeight:900,color:C.orange}}>{pct}%</span>
              </div>
              <div style={{height:4,background:C.border,borderRadius:2,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.bordeauxLight},${C.orange})`,borderRadius:2,transition:'width .4s'}}/>
              </div>
              <div style={{fontSize:10,color:C.whiteMid,marginTop:5}}>
                {!user.photo_url&&'📷 Add a photo · '}
                {!(user as any).age&&'🎂 Your age · '}
                {!user.bio&&'📝 A bio'}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ─── BOUTON DISPONIBILITÉ — CTA principal ─── */}
      <div style={{padding:'10px 16px 4px',flexShrink:0}}>
        <button onClick={isAvailable ? handleRetirerDispo : onSetAvailable}
          style={{width:'100%',padding:'13px 20px',borderRadius:16,cursor:'pointer',fontFamily:'inherit',
            background:isAvailable
              ?`linear-gradient(135deg,#0a4a1a,#166534)`
              :`linear-gradient(135deg,${C.bordeauxLight},${C.bordeaux})`,
            border:`1.5px solid ${isAvailable?'#22c55e66':C.border}`,
            display:'flex',alignItems:'center',justifyContent:'space-between',
            boxShadow:isAvailable?'0 0 20px rgba(34,197,94,.25)':'none',
            transition:'all .3s',
          }}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:20,display:'inline-block',animation:isAvailable?'none':'none'}}>
              {isAvailable?'🟢':'⚪'}
            </span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13,fontWeight:900,color:isAvailable?'#4ade80':C.white}}>
                {isAvailable?'Available now':'Set myself available'}
              </div>
              <div style={{fontSize:10,color:isAvailable?'#86efac':C.whiteMid}}>
                {isAvailable?`Visible until ${(user as any).available_until?new Date((user as any).available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}):'...'} · Tap to remove` :'Appear on the Clutch map'}
              </div>
            </div>
          </div>
          <span style={{fontSize:13,fontWeight:700,color:isAvailable?'#4ade80':C.salmon,
            background:isAvailable?'rgba(34,197,94,.15)':'rgba(255,191,158,.1)',
            borderRadius:10,padding:'5px 10px',border:`1px solid ${isAvailable?'rgba(34,197,94,.3)':'rgba(255,191,158,.2)'}`}}>
            {isAvailable?'Remove ×':'Enable →'}
          </span>
        </button>
      </div>

      {/* ─── TABS ─── */}
      <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,margin:'8px 16px 0'}}>
        {(['profil','settings'] as const).map(st=>(
          <button key={st} onClick={()=>{setProfileSubTab(st);setEditField(null)}}
            style={{flex:1,padding:'10px',background:'transparent',border:'none',
              borderBottom:`2.5px solid ${profileSubTab===st?C.orange:'transparent'}`,
              color:profileSubTab===st?C.orange:C.whiteMid,fontSize:13,
              fontWeight:profileSubTab===st?800:500,cursor:'pointer',fontFamily:'inherit',
              transition:'all .15s'}}>
            {st==='profil'?'My Profile':'Settings'}
          </button>
        ))}
      </div>

      {/* ════════════ TAB MON PROFIL ════════════ */}
      {profileSubTab==='profil' && (
        <div style={{padding:'0 16px'}}>

          {/* Photos — grille Bumble-style (3 colonnes, petites, numérotées) */}
          <div style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase'}}>Photos & videos</div>
              <div style={{fontSize:9,color:C.whiteMid,opacity:.6}}>Tap to select · tap again to swap</div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
              {/* Slot 0 = principale */}
              <div style={{position:'relative',aspectRatio:'3/4',borderRadius:10,overflow:'hidden',
                border:`1.5px solid ${user.photo_url?C.orange+`66`:C.border}`,cursor:'pointer',background:C.bgCard}}
                onClick={()=>fileRef.current?.click()}>
                {user.photo_url
                  ? <img src={user.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                  : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
                      <span style={{fontSize:22,color:C.whiteMid,opacity:.4}}>+</span>
                      <span style={{fontSize:8,color:C.whiteMid,opacity:.4}}>Photo</span>
                    </div>
                }
                <div style={{position:'absolute',bottom:4,left:5,fontSize:8,fontWeight:800,color:'rgba(255,255,255,.9)',background:'rgba(0,0,0,.45)',borderRadius:5,padding:'2px 5px'}}>Main photo</div>
              </div>
              {/* Slots 1-5 = extra — tap-to-swap */}
              {[0,1,2,3,4].map(i=>{
                const refIdx = Math.min(i,3)
                const photo = extraPhotos[refIdx] ?? null
                const isSelected = swapFromIdx === i
                const isSwapping = swapFromIdx !== null
                return (
                  <div key={i} style={{position:'relative',aspectRatio:'3/4',borderRadius:10,overflow:'hidden',
                    border:`1.5px solid ${isSelected?C.orange:photo?C.borderStrong:C.border}`,
                    cursor:'pointer',background:C.bgCard,
                    boxShadow:isSelected?`0 0 0 2px ${C.orange}`:undefined,
                    transform:isSelected?'scale(0.96)':'scale(1)',
                    transition:'transform .15s,box-shadow .15s',
                  }}
                  onClick={()=>{
                    if (isSwapping && swapFromIdx !== null) {
                      if (swapFromIdx === i) { setSwapFromIdx(null); return }
                      const updated = [...extraPhotos]
                      const fi = Math.min(swapFromIdx, 3)
                      const ti = Math.min(i, 3)
                      const tmp = updated[fi]; updated[fi] = updated[ti]; updated[ti] = tmp
                      setExtraPhotos(updated)
                      try { localStorage.setItem(storageKey, JSON.stringify(updated)) } catch {}
                      setSwapFromIdx(null)
                      showToast('✓ Photos swapped', C.green)
                    } else {
                      if (photo) {
                        setSwapFromIdx(i)
                      } else {
                        extraRefs[refIdx]?.current?.click()
                      }
                    }
                  }}>
                  {photo
                    ? <>
                        <img src={photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
                        {isSelected && <div style={{position:'absolute',inset:0,background:'rgba(226,124,0,.25)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                          <div style={{background:C.orange,borderRadius:20,padding:'4px 10px',fontSize:10,fontWeight:800,color:'#000'}}>Move here →</div>
                        </div>}
                        {!isSelected && <button onClick={e=>{e.stopPropagation();removeExtra(refIdx)}}
                          style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,.7)',border:'none',color:'#fff',width:18,height:18,borderRadius:'50%',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}}>×</button>}
                      </>
                    : <div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4,fontSize:20,color:C.whiteMid,opacity:isSwapping?.7:.3}}>
                        {isSwapping ? <span style={{fontSize:14,opacity:.9}}>Place here</span> : <span>+</span>}
                      </div>
                  }
                  <div style={{position:'absolute',bottom:4,left:5,fontSize:9,fontWeight:700,color:'rgba(255,255,255,.7)',background:'rgba(0,0,0,.4)',borderRadius:4,padding:'1px 5px'}}>{i+2}</div>
                  <input ref={i<4?extraRefs[i]:undefined} type="file" accept="image/*" style={{display:'none'}}
                    onChange={e=>{if(e.target.files?.[0])uploadExtra(e.target.files[0],refIdx)}}/>
                  </div>
                )
              })}
            </div>
            {swapFromIdx !== null && (
              <button onClick={()=>setSwapFromIdx(null)} style={{width:'100%',marginTop:6,padding:'6px',background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,borderRadius:8,color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                ✕ Cancel selection
              </button>
            )}
            <div style={{fontSize:9,color:C.whiteMid,opacity:.5,marginTop:6,textAlign:'center'}}>
              More photos = more Clutches ✦
            </div>
          </div>

          {/* À propos — champs éditables */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:10,letterSpacing:'.08em',textTransform:'uppercase'}}>About me</div>
            <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>

              {/* Bio */}
              <FieldRow icon="📝" label="Bio" value={user.bio||''} placeholder="Add a bio..."
                isEditing={editField==='bio'} onTap={()=>setEditField(editField==='bio'?null:'bio')}>
                <div style={{padding:'4px 12px 12px'}}>
                  <textarea value={editBio} onChange={e=>setEditBio(e.target.value.slice(0,160))} rows={3}
                    autoFocus
                    style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 10px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',boxSizing:'border-box'}}/>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                    <span style={{fontSize:10,color:C.whiteMid}}>{editBio.length}/160</span>
                    <button onClick={saveEdit} disabled={savingEdit}
                      style={{padding:'6px 18px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit',opacity:savingEdit?.7:1}}>
                      {savingEdit?'…':'Save'}
                    </button>
                  </div>
                </div>
              </FieldRow>

              {/* Âge — éditable une seule fois si vide, sinon immuable */}
              <div style={{borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',cursor:(user as any).age?'default':'pointer'}}
                  onClick={()=>{if(!(user as any).age)setEditField(editField==='age'?null:'age')}}>
                  <span style={{width:22,textAlign:'center',fontSize:16}}>🎂</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:C.whiteMid,fontWeight:600,marginBottom:1}}>Age</div>
                    <div style={{fontSize:13,fontWeight:600,color:(user as any).age?C.white:C.orange}}>
                      {(user as any).age ? `${(user as any).age}` : 'Enter my age →'}
                    </div>
                  </div>
                  <span style={{fontSize:10,color:C.whiteMid,background:C.whiteFaint,padding:'2px 8px',borderRadius:10}}>
                    {(user as any).age ? 'Locked' : 'Required'}
                  </span>
                </div>
                {editField==='age'&&!(user as any).age&&(
                  <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
                    <input type="number" min={18} max={99} value={editJob} onChange={e=>setEditJob(e.target.value)} placeholder="Ex: 28"
                      autoFocus
                      style={{flex:1,background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 12px',fontSize:16,color:C.white,outline:'none',fontFamily:'inherit'}}/>
                    <button onClick={async()=>{
                      const age=parseInt(editJob)
                      if(isNaN(age)||age<18||age>99){showToast('Invalid age (18-99)',C.red);return}
                      setSavingEdit(true)
                      await supabase.from('profiles').update({age}).eq('id',user.id)
                      onUserUpdate({...user, age} as any)
                      setEditField(null);setEditJob('');setSavingEdit(false)
                      showToast('✓ Age saved — locked forever',C.green)
                    }} disabled={savingEdit} style={{padding:'8px 14px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>OK</button>
                  </div>
                )}
              </div>

              {/* Métier */}
              <FieldRow icon="💼" label="Job" value={(user as any).job||''} placeholder="Your job or studies"
                isEditing={editField==='job'} onTap={()=>setEditField(editField==='job'?null:'job')}>
                <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
                  <input type="text" value={editJob} onChange={e=>setEditJob(e.target.value.slice(0,50))} maxLength={50}
                    autoFocus placeholder="e.g. Designer, Student..."
                    style={{flex:1,background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 12px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit'}}/>
                  <button onClick={saveEdit} disabled={savingEdit}
                    style={{padding:'8px 18px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                    {savingEdit?'…':'OK'}
                  </button>
                </div>
              </FieldRow>

              {/* Genre */}
              <div style={{borderBottom:`1px solid ${C.border}`}}>
                <FieldRow icon="" label="Gender"
                  value={editGender==='F'?'Woman':editGender==='M'?'Man':'Not set'}
                  gk={editGender} locked={genderLocked}
                  isEditing={editField==='genre'&&!genderLocked}
                  onTap={()=>!genderLocked&&setEditField(editField==='genre'?null:'genre')}>
                  <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
                    {(['F','M','X'] as GenderKey[]).map(g=>(
                      <button key={g} onClick={()=>{setEditGender(g);saveEdit()}}
                        style={{flex:1,padding:'8px 4px',borderRadius:10,border:`1.5px solid ${editGender===g?GC[g]:C.border}`,background:editGender===g?`${GC[g]}22`:'transparent',color:editGender===g?GC[g]:C.whiteMid,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                        <GenderSvg gk={g} size={14}/>{g==='F'?'Woman':g==='M'?'Man':'Other'}
                      </button>
                    ))}
                  </div>
                </FieldRow>
              </div>

              {/* Disponibilité inline */}
              <div onClick={()=>setFlow('carte')} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',cursor:'pointer'}}>
                <span style={{width:22,textAlign:'center',fontSize:16}}>⏱</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:C.whiteMid,fontWeight:600,marginBottom:1}}>Availability</div>
                  <div style={{fontSize:13,fontWeight:600,color:user.is_available?C.green:C.whiteMid}}>
                    {user.is_available&&user.available_until&&new Date(user.available_until)>new Date()
                      ?`Until ${new Date(user.available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}`
                      :'Offline'}
                  </div>
                </div>
                <span style={{color:C.whiteMid,fontSize:16}}>›</span>
              </div>

            </div>
          </div>

          {/* ─── INTÉRÊTS ─── */}
          {(()=>{
            const ALL_INTERESTS = ['☕ Café','🍷 Vins','🥾 Randonnée','🧘 Yoga','🎬 Cinéma','🍳 Cuisine','🎵 Musique','✈️ Voyage','🏃 Running','🎨 Art','💻 Tech','⚽ Sport','📚 Lecture','💃 Danse','🎉 Festivals','🍕 Restos','🎸 Concerts','🌿 Nature']
            const saveInterests = async (list: string[]) => {
              setSavingInterests(true)
              await supabase.from('profiles').update({interests: list}).eq('id', user.id)
              onUserUpdate({...user, interests: list} as any)
              setSavingInterests(false)
              showToast('✓ Interests updated', C.green)
            }
            const toggle = (interest: string) => {
              const next = editInterests.includes(interest)
                ? editInterests.filter(i=>i!==interest)
                : editInterests.length >= 8 ? (showToast('Max 8 interests', C.orange), editInterests) : [...editInterests, interest]
              setEditInterests(next)
            }
            return (
              <div style={{marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase'}}>Interests ({editInterests.length}/8)</div>
                  {editInterests.length > 0 && (
                    <button onClick={()=>saveInterests(editInterests)} disabled={savingInterests}
                      style={{fontSize:11,fontWeight:800,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'3px 12px',cursor:'pointer',fontFamily:'inherit'}}>
                      {savingInterests?'…':'Save'}
                    </button>
                  )}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {ALL_INTERESTS.map(interest=>{
                    const sel = editInterests.includes(interest)
                    return (
                      <button key={interest} onClick={()=>toggle(interest)}
                        style={{padding:'7px 12px',borderRadius:20,border:`1.5px solid ${sel?C.salmon:C.border}`,background:sel?`${C.salmon}20`:'transparent',color:sel?C.salmon:C.whiteMid,fontSize:12,fontWeight:sel?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                        {interest}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* ─── LANGUES ─── */}
          {(()=>{
            const ALL_LANGS = ['Français','English','Deutsch','Italiano','Español','Português','العربية','日本語','中文','Русский']
            const saveLangs = async (list: string[]) => {
              setSavingLanguages(true)
              await supabase.from('profiles').update({languages: list}).eq('id', user.id)
              onUserUpdate({...user, languages: list} as any)
              setSavingLanguages(false)
              showToast('✓ Languages updated', C.green)
            }
            const toggleLang = (l: string) => {
              const next = editLanguages.includes(l)
                ? editLanguages.filter(x=>x!==l)
                : [...editLanguages, l]
              setEditLanguages(next)
            }
            return (
              <div style={{marginBottom:20}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase'}}>🗣 {t('profile.languages')}</div>
                  {editLanguages.length > 0 && (
                    <button onClick={()=>saveLangs(editLanguages)} disabled={savingLanguages}
                      style={{fontSize:11,fontWeight:800,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'3px 12px',cursor:'pointer',fontFamily:'inherit'}}>
                      {savingLanguages?'…':'Save'}
                    </button>
                  )}
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {ALL_LANGS.map(l=>{
                    const sel = editLanguages.includes(l)
                    return (
                      <button key={l} onClick={()=>toggleLang(l)}
                        style={{padding:'7px 12px',borderRadius:20,border:`1.5px solid ${sel?C.salmon:C.border}`,background:sel?C.salmonFaint:'transparent',color:sel?C.salmon:C.whiteMid,fontSize:12,fontWeight:sel?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
                        {l}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {/* Favoris */}
          {favorites.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:10,letterSpacing:'.08em',textTransform:'uppercase'}}>Favorites ({favorites.length})</div>
              <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
                {favorites.map((f,i)=>(
                  <div key={f.id} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 14px',borderTop:i>0?`1px solid ${C.border}`:'none'}}>
                    <Av src={f.photo_url} name={f.name||'?'} size={36}/>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700}}>{f.name}</div>
                      {f.bio&&<div style={{fontSize:11,color:C.whiteMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.bio.slice(0,50)}</div>}
                    </div>
                    <button onClick={()=>unfav(f.id)} style={{background:'none',border:`1px solid ${C.border}`,color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit',padding:'4px 8px',borderRadius:8}}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ════════════ TAB PARAMÈTRES ════════════ */}
      {profileSubTab==='settings' && (
        <div style={{padding:'0 16px'}}>

          {/* ── Abonnements — Éléments chimiques ── */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:10,letterSpacing:'.08em',textTransform:'uppercase',padding:'0 2px'}}>{t('sub.section')}</div>
            <div style={{fontSize:9,color:C.whiteMid,opacity:.6,marginBottom:10,fontStyle:'italic',paddingLeft:2}}>
              {t('sub.tagline')}
            </div>
            {([
              {
                sym:'H', name:t('sub.h.name'), sub:t('sub.h.sub'), price:'CHF 0',
                color:'#9ca3af', active: true,
                features:[t('sub.h.f1'),t('sub.h.f2'),t('sub.h.f3')],
                note:t('sub.h.note')
              },
              {
                sym:'Au', name:t('sub.au.name'), sub:t('sub.au.sub'), price:'CHF 9.90/mois',
                color:'#f59e0b', active: false,
                features:[t('sub.au.f1'),t('sub.au.f2'),t('sub.au.f3')],
                note:t('sub.au.note')
              },
              {
                sym:'Rh', name:t('sub.rh.name'), sub:t('sub.rh.sub'), price:'CHF 19.90/mois',
                color:'#C8860A', active: false,
                features:[t('sub.rh.f1'),t('sub.rh.f2'),t('sub.rh.f3'),t('sub.rh.f4'),t('sub.rh.f5')],
                note:t('sub.rh.note')
              },
              {
                sym:'At', name:t('sub.at.name'), sub:t('sub.at.sub'), price:'CHF 39.90/mois',
                color:'#FFBF9E', active: false,
                features:[t('sub.at.f1'),t('sub.at.f2'),t('sub.at.f3'),t('sub.at.f4'),t('sub.at.f5'),t('sub.at.f6')],
                note:t('sub.at.note')
              },
            ] as {sym:string;name:string;sub:string;price:string;color:string;active:boolean;features:string[];note:string}[]).map((tier,i)=>(
              <div key={i} onClick={()=>!tier.active&&showToast(`${tier.name} (${tier.sub}) — coming soon ✦`, tier.color)}
                style={{
                  background:tier.active?`${tier.color}15`:`${C.bgCard}`,
                  border:`1.5px solid ${tier.active?tier.color:tier.color+'33'}`,
                  borderRadius:14, padding:'12px 14px', marginBottom:8,
                  cursor:tier.active?'default':'pointer',
                  position:'relative', overflow:'hidden',
                }}>
                {tier.active&&<div style={{position:'absolute',top:8,right:8,fontSize:8,fontWeight:900,background:tier.color,color:'#000',borderRadius:20,padding:'2px 7px',letterSpacing:'.05em'}}>ACTIVE</div>}
                {!tier.active&&<div style={{position:'absolute',top:8,right:8,fontSize:8,fontWeight:800,color:tier.color,background:`${tier.color}22`,border:`1px solid ${tier.color}44`,borderRadius:20,padding:'2px 7px'}}>Soon</div>}
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <div style={{
                    width:36,height:36,borderRadius:10,
                    background:`${tier.color}22`,border:`1.5px solid ${tier.color}55`,
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                  }}>
                    <span style={{fontSize:14,fontWeight:900,color:tier.color,fontFamily:'monospace'}}>{tier.sym}</span>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:900,color:tier.active?tier.color:C.white}}>{tier.name} <span style={{fontSize:10,fontWeight:600,color:C.whiteMid}}>· {tier.sub}</span></div>
                    <div style={{fontSize:11,color:tier.active?tier.color:C.orange,fontWeight:700}}>{tier.price}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:6}}>
                  {tier.features.map(f=>(
                    <span key={f} style={{fontSize:9,color:tier.active?tier.color:C.whiteMid,background:`${tier.color}18`,border:`1px solid ${tier.color}30`,borderRadius:20,padding:'2px 8px'}}>{f}</span>
                  ))}
                </div>
                <div style={{fontSize:9,color:C.whiteMid,opacity:.5,fontStyle:'italic'}}>{tier.note}</div>
              </div>
            ))}
            <div style={{fontSize:9,color:C.whiteMid,opacity:.4,textAlign:'center',marginTop:4}}>
              {t('sub.women')}
            </div>
          </div>

          {/* ── Compte ── */}
          <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:8,letterSpacing:'.08em',textTransform:'uppercase',padding:'0 2px'}}>My account</div>
          <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:16}}>
            {([
              {icon:'⏱', l:'Availability', s:user.is_available?`Until ${new Date(user.available_until||'').toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}`:'Offline', onClick:()=>setFlow('carte')},
              {icon:'🌐', l:'Language', s:lang==='fr'?'Français':'English', onClick:()=>{ const next=lang==='fr'?'en':'fr'; setLang(next); try{localStorage.setItem('clutch_lang',next)}catch{} }},
              {icon:'🔔', l:'Notifications', s:'Enable Clutch alerts', onClick:()=>{
                if ((window as any).OneSignal) {
                  (window as any).OneSignal.showNativePrompt?.()
                  showToast('Notifications enabled 🔔', C.green)
                } else { showToast('Notifications available on native iOS (soon)', C.whiteMid) }
              }},
              {icon:'🏠', l:'Clutch HQ', s:'Internal dashboard', onClick:()=>{ if(typeof window!=='undefined') window.open('/hq','_blank') }},
            ] as {icon:string;l:string;s:string;onClick:()=>void}[]).map((item,i,arr)=>(
              <div key={i} onClick={item.onClick}
                style={{display:'flex',gap:12,alignItems:'center',padding:'13px 14px',borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none',cursor:'pointer'}}>
                <span style={{fontSize:18,width:24,textAlign:'center'}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.white}}>{item.l}</div>
                  {item.s&&<div style={{fontSize:11,color:C.whiteMid}}>{item.s}</div>}
                </div>
                <span style={{color:C.whiteMid,fontSize:16}}>›</span>
              </div>
            ))}
          </div>

          {/* ── Score & Stats ── */}
          <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:8,letterSpacing:'.08em',textTransform:'uppercase',padding:'0 2px'}}>My Clutch score</div>
          <div style={{background:C.bgCard,borderRadius:14,padding:'14px 16px',border:`1px solid ${C.border}`,marginBottom:16}}>
            <div style={{display:'flex',gap:16,marginBottom:12}}>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:900,color:user.reliability_score!=null&&user.reliability_score>=80?C.green:C.orange}}>{user.reliability_score??'—'}</div>
                <div style={{fontSize:10,color:C.whiteMid}}>Reliability score</div>
              </div>
              <div style={{width:1,background:C.border}}/>
              <div style={{flex:1,textAlign:'center'}}>
                <div style={{fontSize:28,fontWeight:900,color:C.salmon}}>{(()=>{try{return JSON.parse(localStorage.getItem(`clutch_cancel_count_${user.id}`)||'0')}catch{return 0}})()}</div>
                <div style={{fontSize:10,color:C.whiteMid}}>Cancellations</div>
              </div>
            </div>
            <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.6,background:C.whiteFaint,borderRadius:10,padding:'8px 12px'}}>
              ★ +5 pts per meetup kept · −20 pts if ghost · −10 if late cancel
            </div>
          </div>

          {/* ══ MINI QG — ADN + LAB ══ */}
          <div style={{marginBottom:20}}>

            {/* Header QG */}
            <div style={{
              background:`linear-gradient(160deg,#1a0a16,#2a0f22)`,
              border:`1px solid ${C.orange}33`,
              borderRadius:16, padding:'18px 16px', marginBottom:12,
              position:'relative', overflow:'hidden',
            }}>
              {/* Fond étoile décorative */}
              <div style={{position:'absolute',top:-20,right:-20,fontSize:80,opacity:.04,pointerEvents:'none',userSelect:'none'}}>✦</div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{
                  width:36,height:36,borderRadius:10,flexShrink:0,
                  background:`${C.orange}18`,border:`1.5px solid ${C.orange}44`,
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,
                }}>🧪</div>
                <div>
                  <div style={{fontSize:14,fontWeight:900,color:C.orange,letterSpacing:'.02em'}}>Headquarters</div>
                  <div style={{fontSize:9,color:C.whiteMid,opacity:.7}}>What's being built. What's being dreamed. What becomes.</div>
                </div>
              </div>

              {/* ADN Clutch */}
              <div style={{fontSize:11,fontWeight:900,color:C.salmon,marginBottom:8,letterSpacing:'.06em',textTransform:'uppercase'}}>Clutch DNA</div>
              {([
                { icon:'⚡', titre:'Spontaneity first', texte:'A Clutch = a meetup within 18h. No endless chatting. Action, now.' },
                { icon:'🔒', titre:'The Lock as a promise', texte:'When both say yes, it\'s a commitment. Not a "maybe".' },
                { icon:'♀', titre:'Women at the center', texte:'Free, protected, prioritized. Without them, Clutch doesn\'t exist.' },
                { icon:'✦', titre:'Friction is a feature', texte:'If it works from the couch without moving, that\'s Tinder. Clutch is about going out.' },
                { icon:'🇨🇭', titre:'Lausanne first', texte:'We build here, we test here. Then we grow. Small, precise, real.' },
              ] as {icon:string;titre:string;texte:string}[]).map((p,i)=>(
                <div key={i} style={{
                  display:'flex',gap:10,padding:'8px 0',
                  borderTop:i>0?`1px solid ${C.border}`:undefined,
                }}>
                  <span style={{fontSize:14,flexShrink:0,width:20,textAlign:'center',marginTop:1}}>{p.icon}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:800,color:C.white,marginBottom:2}}>{p.titre}</div>
                    <div style={{fontSize:10,color:C.whiteMid,lineHeight:1.5,opacity:.8}}>{p.texte}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Lab — ce qu'on construit */}
            <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:'14px 14px',marginBottom:8}}>
              <div style={{fontSize:11,fontWeight:900,color:C.salmon,marginBottom:4,letterSpacing:'.04em'}}>{t('lab.title')}</div>
              <div style={{fontSize:9,color:C.whiteMid,opacity:.6,marginBottom:10,lineHeight:1.5}}>
                {t('lab.sub')}
              </div>

            {([
              { icon:'👁',  label:t('lab.r1.label'),  tier:'Rh', status:'design', note:t('lab.r1.note') },
              { icon:'✓✓', label:t('lab.r2.label'),   tier:'Rh', status:'design', note:t('lab.r2.note') },
              { icon:'🚀', label:t('lab.r3.label'),   tier:'Rh', status:'design', note:t('lab.r3.note') },
              { icon:'⭐', label:t('lab.r4.label'),   tier:'Rh', status:'design', note:t('lab.r4.note') },
              { icon:'🎭', label:t('lab.r5.label'),   tier:'At', status:'design', note:t('lab.r5.note') },
              { icon:'📍', label:t('lab.r6.label'),   tier:'H',  status:'dev',    note:t('lab.r6.note') },
              { icon:'📸', label:t('lab.r7.label'),   tier:'H',  status:'dev',    note:t('lab.r7.note') },
              { icon:'🎛', label:t('lab.r8.label'),   tier:'H',  status:'dev',    note:t('lab.r8.note') },
              { icon:'🎉', label:t('lab.r9.label'),   tier:'H',  status:'dev',    note:t('lab.r9.note') },
              { icon:'👋', label:t('lab.r10.label'),  tier:'H',  status:'dev',    note:t('lab.r10.note') },
              { icon:'🔗', label:t('lab.r11.label'),  tier:'H',  status:'idea',   note:t('lab.r11.note') },
              { icon:'📊', label:t('lab.r12.label'),  tier:'Au', status:'idea',   note:t('lab.r12.note') },
              { icon:'🌍', label:t('lab.r13.label'),  tier:'H',  status:'idea',   note:t('lab.r13.note') },
              { icon:'🔒', label:t('lab.r14.label'),  tier:'H',  status:'idea',   note:t('lab.r14.note') },
              { icon:'✅', label:t('lab.r15.label'),  tier:'H',  status:'idea',   note:t('lab.r15.note') },
              { icon:'💬', label:t('lab.r16.label'),  tier:'H',  status:'idea',   note:t('lab.r16.note') },
            ] as {icon:string;label:string;tier:string;status:'dev'|'design'|'idea';note:string}[]).map((item,i)=>{
              const statusC = item.status==='dev'?'#4ade80':item.status==='design'?C.orange:'#818cf8'
              const tierC   = item.tier==='Rh'?'#C8860A':item.tier==='At'?'#FFBF9E':item.tier==='Au'?'#f59e0b':'#9ca3af'
              return (
                <div key={i} onClick={()=>showToast(`✦ Noted — "${item.label}"`, statusC)}
                  style={{display:'flex',alignItems:'center',gap:9,padding:'8px 0',
                    borderTop:i>0?`1px solid ${C.border}`:undefined,cursor:'pointer'}}>
                  <span style={{fontSize:14,width:20,textAlign:'center',flexShrink:0}}>{item.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:C.white}}>{item.label}</div>
                    <div style={{fontSize:9,color:C.whiteMid,opacity:.6}}>{item.note}</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,flexShrink:0}}>
                    <span style={{fontSize:8,fontWeight:800,color:statusC,background:`${statusC}18`,borderRadius:20,padding:'1px 6px'}}>
                      {item.status==='dev'?'In dev':item.status==='design'?'Design':'Idea'}
                    </span>
                    <span style={{fontSize:8,color:tierC,fontFamily:'monospace',fontWeight:700,opacity:.8}}>{item.tier}</span>
                  </div>
                </div>
              )
            })}
            </div>

            <div style={{fontSize:9,color:C.whiteMid,opacity:.35,textAlign:'center',lineHeight:1.6}}>
              Clutch {V} · Built in Lausanne, one meetup at a time 🇨🇭
            </div>
          </div>

          {/* ── Légal & Aide ── */}
          <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:8,letterSpacing:'.08em',textTransform:'uppercase',padding:'0 2px'}}>Information</div>
          <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:16}}>
            {([
              {icon:'⚖️', l:'Terms & Privacy', s:'Swiss LPD', onClick:()=>window.location.href='/legal'},
              {icon:'🔒', l:'Security & Data', s:'Fuzzy GPS · Anonymized data', onClick:()=>window.location.href='/privacy'},
              {icon:'🏠', l:'Main page', s:'clutch.lausanne', onClick:()=>window.location.href='/'},
              {icon:'💌', l:'Contact the team', s:'david.saugy@gmail.com', onClick:()=>window.location.href='mailto:david.saugy@gmail.com'},
            ] as {icon:string;l:string;s:string;onClick:()=>void}[]).map((item,i,arr)=>(
              <div key={i} onClick={item.onClick}
                style={{display:'flex',gap:12,alignItems:'center',padding:'13px 14px',borderBottom:i<arr.length-1?`1px solid ${C.border}`:'none',cursor:'pointer'}}>
                <span style={{fontSize:18,width:24,textAlign:'center'}}>{item.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.white}}>{item.l}</div>
                  {item.s&&<div style={{fontSize:11,color:C.whiteMid}}>{item.s}</div>}
                </div>
                <span style={{color:C.whiteMid,fontSize:16}}>›</span>
              </div>
            ))}
          </div>


          {/* Bloqués */}
          {blocked.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,marginBottom:10,letterSpacing:'.08em',textTransform:'uppercase'}}>Blocked ({blocked.length})</div>
              <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:'1px solid rgba(239,68,68,.2)'}}>
                {blocked.map((b,i)=>(
                  <div key={b.id} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 14px',borderTop:i>0?'1px solid rgba(239,68,68,.12)':'none'}}>
                    <Av src={b.photo_url} name={b.name||'?'} size={34}/>
                    <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.whiteMid}}>{b.name}</div></div>
                    <button onClick={()=>unblock(b.id)} style={{background:'none',border:`1px solid ${C.green}55`,borderRadius:8,color:C.green,fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'inherit',padding:'4px 10px'}}>Unblock</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={()=>setFlow('carte')}
            style={{width:'100%',padding:'12px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:12,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit',marginBottom:8}}>
            🔁 Replay intro
          </button>
          <button onClick={signOut}
            style={{width:'100%',padding:'13px',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,color:C.white,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:8}}>
            Sign out
          </button>
          <button onClick={()=>setShowDelete(true)}
            style={{width:'100%',padding:'12px',background:'transparent',border:'1px solid rgba(239,68,68,.2)',borderRadius:12,color:'rgba(239,68,68,.6)',fontSize:12,cursor:'pointer',fontFamily:'inherit',marginBottom:20}}>
            Delete my account
          </button>

          <div style={{textAlign:'center',fontSize:10,color:C.whiteMid,marginTop:4}}>Clutch {V} · Lausanne 🇨🇭</div>
        </div>
      )}

    </div>
    </>
  )
}


// ═════════════════════════════════════════════════════════════
// SYSTÈME DE PÉNALITÉS — Score de fiabilité
// ═════════════════════════════════════════════════════════════
// Règles : plus c'est tard, plus ça coûte cher
// ghost/lapin = pire (🐰 visible sur profil)
type PenaltyReason = 'cancel_early'|'cancel_moderate'|'cancel_late'|'cancel_veryLate'|'ghost'|'event_cancel_early'|'event_cancel_late'|'event_ghost'

function getPenalty(reason: PenaltyReason): {pts:number; label:string; emoji:string} {
  switch(reason) {
    case 'cancel_early':      return {pts:-2,  label:'Annulation anticipée',        emoji:'↩'}
    case 'cancel_moderate':   return {pts:-5,  label:'Annulation modérée',           emoji:'⚠️'}
    case 'cancel_late':       return {pts:-6,  label:'Annulation tardive',           emoji:'⚠️'}
    case 'cancel_veryLate':   return {pts:-12, label:'Annulation de dernière minute',emoji:'🚨'}
    case 'ghost':             return {pts:-20, label:'Lapin posé 🐰',                emoji:'🐰'}
    case 'event_cancel_early':return {pts:-1,  label:'Désinscription événement',     emoji:'↩'}
    case 'event_cancel_late': return {pts:-5,  label:'Annulation tardive événement', emoji:'⚠️'}
    case 'event_ghost':       return {pts:-15, label:'Absence événement 🐰',         emoji:'🐰'}
    default:                  return {pts:-2,  label:'Annulation',                   emoji:'↩'}
  }
}

function getCancelCount(): number {
  try { return parseInt(localStorage.getItem('clutch_late_cancels')||'0') } catch { return 0 }
}
function incrementCancelCount() {
  try { localStorage.setItem('clutch_late_cancels', String(getCancelCount()+1)) } catch {}
}
function getRecidiveMultiplier(): number {
  const n = getCancelCount()
  if (n >= 3) return 2.0
  if (n >= 2) return 1.5
  return 1.0
}

// Calcule la raison de pénalité selon le temps restant avant le RDV
function penaltyReasonFromTime(proposedTime: string|null, isGhost=false): PenaltyReason {
  if (isGhost) return 'ghost'
  if (!proposedTime) return 'cancel_early'
  const msLeft = new Date(proposedTime).getTime() - Date.now()
  const hLeft = msLeft / 3600000
  if (hLeft < 0.5) return 'cancel_veryLate'
  if (hLeft < 2)   return 'cancel_late'
  if (hLeft < 6)   return 'cancel_moderate'
  return 'cancel_early'
}

// ═════════════════════════════════════════════════════════════
// RADAR DE PROXIMITÉ — Overlay persistant sur TOUTES les pages
// S'active automatiquement quand RDV dans < 30min
// ═════════════════════════════════════════════════════════════
function ProximityRadar({ verrou, userId, lang, onClick }:{ verrou:any; userId:string; lang:Lang; onClick:()=>void }) {
  const [now,setNow] = useState(new Date())
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t) },[])
  const rdv = new Date(verrou.proposed_time)
  const diffMs = rdv.getTime()-now.getTime()
  if (diffMs > 30*60*1000 || diffMs < -60*60*1000) return null
  const past = diffMs < 0
  const mins = Math.floor(Math.abs(diffMs)/60000)
  const secs = Math.floor((Math.abs(diffMs)%60000)/1000)
  const urgency = !past && diffMs < 10*60*1000
  const other = verrou.sender_id === userId ? verrou.receiver : verrou.sender
  const pct = past ? 100 : Math.max(0, 100 - (diffMs/(30*60*1000))*100)

  return (
    <>
      <style>{`
        @keyframes radarExpand{0%{transform:scale(.6);opacity:.7}100%{transform:scale(2.4);opacity:0}}
        @keyframes radarCore{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
        @keyframes progressGlow{0%,100%{box-shadow:0 0 8px ${urgency?'rgba(239,68,68,.6)':'rgba(226,124,0,.4)'}}50%{box-shadow:0 0 16px ${urgency?'rgba(239,68,68,.9)':'rgba(226,124,0,.7)'}}}
      `}</style>
      <div onClick={onClick} style={{
        position:'fixed',bottom:84,left:12,right:12,zIndex:1400,
        background:urgency?`linear-gradient(135deg,#3D0000,#7A0000)`:`linear-gradient(135deg,${C.bordeaux},#5A2E00)`,
        border:`1.5px solid ${urgency?C.red+'88':C.orange+'66'}`,
        borderRadius:18,padding:'12px 16px',cursor:'pointer',
        boxShadow:urgency?`0 8px 32px rgba(239,68,68,.35)`:`0 8px 32px rgba(226,124,0,.25)`,
        animation:'progressGlow 2s ease-in-out infinite',
      }}>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          {/* Radar animé */}
          <div style={{position:'relative',width:44,height:44,flexShrink:0}}>
            {[0,.5,1].map(d=>(
              <div key={d} style={{position:'absolute',inset:0,borderRadius:'50%',
                border:`2px solid ${urgency?C.red:C.orange}`,
                animation:`radarExpand 2s ease-out ${d}s infinite`,opacity:.6}}/>
            ))}
            <div style={{position:'absolute',inset:'8px',borderRadius:'50%',
              background:urgency?C.red:C.orange,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:15,animation:'radarCore 1.5s ease-in-out infinite',
              boxShadow:`0 0 12px ${urgency?C.red:C.orange}`}}>
              🔒
            </div>
          </div>
          {/* Info */}
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:11,fontWeight:900,color:urgency?C.red:C.orange,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:2}}>
              {past?(lang==='en'?'🔥 Meetup now!':'🔥 RDV en cours !'):urgency?(lang==='en'?'⚡ Almost time':'⚡ C\'est bientôt !'):(lang==='en'?'📍 Upcoming meetup':'📍 Rendez-vous approche')}
            </div>
            <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:3}}>
              {other?.name} · {verrou.venue||'Café Romand'}
            </div>
            {!past&&(
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                {/* Barre de progression */}
                <div style={{flex:1,height:4,background:'rgba(255,255,255,.12)',borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:2,width:`${pct}%`,
                    background:urgency?C.red:C.orange,
                    transition:'width .5s ease'}}/>
                </div>
                <div style={{fontSize:15,fontWeight:900,color:urgency?C.red:C.orange,fontVariantNumeric:'tabular-nums',minWidth:52,textAlign:'right'}}>
                  {mins}:{String(secs).padStart(2,'0')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ═════════════════════════════════════════════════════════════
export default function App2() {
  const [screen,setScreen]   = useState<Screen>('splash')
  const [flow,setFlow]       = useState<AppFlow>('carte')
  const [tab,_setTab]        = useState<MainTab>('presences')
  // Timestamps "vu" par onglet — stockés en localStorage pour persister entre sessions
  const [seenClutchsAt, setSeenClutchsAt] = useState<number>(()=>{try{return parseInt(localStorage.getItem('c_seen_clutchs')||'0')}catch{return 0}})
  const [seenEventsAt,  setSeenEventsAt]  = useState<number>(()=>{try{return parseInt(localStorage.getItem('c_seen_events')||'0')}catch{return 0}})
  // setTab avec marquage "vu" automatique
  const setTab = (t: MainTab) => {
    _setTab(t)
    const now = Date.now()
    if(t==='clutchs'){setSeenClutchsAt(now);try{localStorage.setItem('c_seen_clutchs',String(now))}catch{}}
    if(t==='evenements'){setSeenEventsAt(now);try{localStorage.setItem('c_seen_events',String(now))}catch{}}
  }
  const [unreadChats, setUnreadChats] = useState<Record<string,number>>({}) // clutchId → nb msgs non lus
  const [user,setUser]       = useState<Profile|null>(null)
  const [profiles,setProfiles] = useState<Profile[]>([])
  const [clutches,setClutches] = useState<any[]>([])
  const [authDone,setAuthDone] = useState(false)
  const [authTarget,setAuthTarget] = useState<Screen>('login')
  const [toast,setToast]     = useState<{msg:string;color:string}|null>(null)
  const [selProfile,setSelProfile] = useState<Profile|null>(null)
  const [showSend,setShowSend] = useState(false)
  const [showProfileSheet,setShowProfileSheet] = useState(false)
  const [showDelete,setShowDelete] = useState(false)
  const [showCelebration,setShowCelebration] = useState(false)
  const [showVerrou,setShowVerrou] = useState(false)
  const [verrouData,setVerrouData] = useState<{venue?:string;name?:string;photo?:string|null}|undefined>()
  const onVerrouDone = useCallback(()=>setShowVerrou(false), [])
  const [filterGender,setFilterGender] = useState<'all'|'F'|'M'|'X'>(() => {
    try { return (localStorage.getItem('clutch_filter_gender') as any) || 'all' } catch { return 'all' }
  })
  const [activites,setActivites] = useState<string[]>([])
  const [showIncoming,setShowIncoming] = useState(false)
  const [incomingClutch,setIncomingClutch] = useState<any>(null)
  const [showChat,setShowChat] = useState(false)
  const [cancelConfirmId,setCancelConfirmId] = useState<string|null>(null) // ID du verrou en cours d'annulation
  const [localConfirmed,setLocalConfirmed] = useState<Set<string>>(new Set()) // IDs verrouillés localement (contourne RLS)
  const [feedbackClutch,setFeedbackClutch] = useState<any>(null) // Clutch en attente de feedback post-RDV
  const [showFeedback,setShowFeedback] = useState(false)
  const [showAppFeedback,setShowAppFeedback] = useState(false)
  const [waitlistEvIds,setWaitlistEvIds] = useState<Set<string>>(()=>{
    if(typeof window==='undefined') return new Set()
    try{const s=localStorage.getItem('clutch_waitlist');return s?new Set(JSON.parse(s)):new Set()}catch{return new Set()}
  })
  const [chatClutch,setChatClutch] = useState<any>(null)
  const [openEventId,setOpenEventId] = useState<string|null>(null)
  const [userScore,setUserScore] = useState<number|null>(null) // Score local (sync avec DB)
  const [lang,setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('clutch_lang') as Lang
      if (saved === 'fr' || saved === 'en') return saved
      // Auto-detect: English unless French browser
      return navigator.language?.startsWith('fr') ? 'fr' : 'en'
    } catch { return 'en' }
  })
  const t = useT(lang)
  const [registeredEvents,setRegisteredEvents] = useState<Set<string>>(()=>{
    if (typeof window==='undefined') return new Set<string>()
    try { const s=localStorage.getItem('clutch_registered_events'); return s?new Set(JSON.parse(s)):new Set<string>() } catch { return new Set<string>() }
  }) // IDs événements inscrits (levé au niveau App2) — persisté localStorage
  const [mockCleared,setMockCleared] = useState(() => {
    if (typeof window === 'undefined') return false
    try { return localStorage.getItem('clutch_mock_cleared') === '1' } catch { return false }
  })   // Effacer l'historique mock — persisté localStorage
  const [hiddenHistIds,setHiddenHistIds] = useState<Set<string>>(() => {
    // Persist across reloads via localStorage
    if (typeof window === 'undefined') return new Set<string>()
    try { const s = localStorage.getItem('clutch_hidden_hist'); return s ? new Set(JSON.parse(s)) : new Set<string>() } catch { return new Set<string>() }
  })
  const [showHistory,setShowHistory] = useState(true)    // Section historique collapsible (ouvert par défaut)
  // Position RDV voulue — initialisée depuis GPS si disponible
  const [meetupPos,setMeetupPos] = useState<[number,number]>(ME)
  useEffect(()=>{
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => { setMeetupPos([pos.coords.latitude, pos.coords.longitude]) },
      () => {},
      { timeout:8000, maximumAge:60000 }
    )
  },[])
  const mapGetCenterRef = useRef<(()=>[number,number])|null>(null)
  const mapRecenterRef  = useRef<(()=>void)|null>(null)
  // Page 2 — Quel type de rencontre (multi-select)
  const [seekModes,setSeekModes]   = useState<string[]>(['romantic','friend'])  // multi
  const [seekGender,setSeekGender] = useState<'F'|'M'|'X'|'all'>('all')
  const [seekAges,setSeekAges]     = useState<string[]>(['tous'])   // multi
  const [intentMsg,setIntentMsg]   = useState('')

  // Anti-saturation femmes
  const MAX_CLUTCHS_PER_DAY_WOMEN = 5
  const isWomanSaturated = useMemo(() => {
    if (!user || (user as any).gender !== 'woman') return false
    const today = new Date().toDateString()
    const todayKey = `clutch_daily_received_${user.id}_${today}`
    try {
      const count = parseInt(localStorage.getItem(todayKey)||'0')
      return count >= MAX_CLUTCHS_PER_DAY_WOMEN
    } catch { return false }
  }, [user, clutches])

  // Jog wheel states
  const initSlots = useMemo(() => makeSlots(), [])
  const [fromTime,setFromTime] = useState(() => initSlots[0] || '18:00')
  const [untilTime,setUntilTime] = useState(() => initSlots[4] || '20:00')
  const [rayon,setRayon]       = useState(3)  // nombre, pas string

  const untilSlots = useMemo(() => {
    const [h,m] = fromTime.split(':').map(Number)
    const b = new Date(); b.setHours(h,m,0,0)
    return makeSlots(new Date(b.getTime() + 15*60_000)).slice(0,72)
  }, [fromTime])

  // Init OneSignal au démarrage (natif iOS/Android uniquement)
  useEffect(() => {
    import('@/lib/onesignal').then(({ initOneSignal }) => initOneSignal()).catch(() => {})
  }, [])

  // Persist hiddenHistIds to localStorage
  useEffect(() => {
    try { localStorage.setItem('clutch_hidden_hist', JSON.stringify([...hiddenHistIds])) } catch {}
  }, [hiddenHistIds])
  // Persist registeredEvents to localStorage
  useEffect(() => {
    try { localStorage.setItem('clutch_registered_events', JSON.stringify([...registeredEvents])) } catch {}
  }, [registeredEvents])
  // Persist waitlist to localStorage
  useEffect(() => {
    try { localStorage.setItem('clutch_waitlist', JSON.stringify([...waitlistEvIds])) } catch {}
  }, [waitlistEvIds])

  // ── Feedback post-RDV : déclenche après l'heure du RDV passé ──
  useEffect(() => {
    if (!user?.id || showFeedback || feedbackClutch) return
    const past = (clutches as any[]).find(c =>
      (c.status==='confirmed'||c.status==='accepted') &&
      c.proposed_time &&
      // RDV doit être passé depuis au moins 30min
      new Date(c.proposed_time).getTime() + 30*60*1000 < Date.now() &&
      !localStorage.getItem(`feedback_done_${c.id}`) &&
      // Ne pas demander le feedback si le verrou vient d'être posé (< 2h)
      Date.now() - parseInt(localStorage.getItem(`clutch_locked_at_${c.id}`)||'0') > 2*60*60*1000
    )
    if (past) {
      // Délai 5min après l'heure du RDV pour laisser le temps d'arriver (si déjà passé, delay=0)
      const rdvTime = new Date(past.proposed_time).getTime()
      const delay = Math.max(0, rdvTime + 35*60000 - Date.now()) // 30min + 5min buffer
      const t = setTimeout(() => { setFeedbackClutch(past); setShowFeedback(true) }, delay)
      return () => clearTimeout(t)
    }
  }, [clutches, user?.id, showFeedback, feedbackClutch])

  const isAvailableRef = useRef(false)
  const sliderRef = useRef<HTMLDivElement>(null) // slider rayon — doit être au top level (règle des hooks)
  const availableRef = user?.is_available && user?.available_until && new Date((user as any).available_until) > new Date()
  const isPremium = ['Au','Rh','At'].includes((user as any)?.account_type || '')
  isAvailableRef.current = !!availableRef

  const showToast = useCallback((msg:string,color=C.salmon) => setToast({msg,color}),[])

  // Applique une pénalité au score de l'utilisateur courant
  const applyPenalty = useCallback(async (reason: PenaltyReason) => {
    const p = getPenalty(reason)
    const isLate = reason==='cancel_late'||reason==='cancel_veryLate'||reason==='ghost'
    if (isLate) incrementCancelCount()
    const mult = isLate ? getRecidiveMultiplier() : 1.0
    const finalPts = Math.round(p.pts * mult)
    const newScore = Math.max(0, (userScore ?? user?.reliability_score ?? 80) + finalPts)
    setUserScore(newScore)
    setUser(prev => prev ? {...prev, reliability_score: newScore} : prev)
    // Persiste en DB
    try { await supabase.from('profiles').update({reliability_score: newScore}).eq('id', user!.id) } catch {}
    // Toast explicatif
    const isGhost = reason==='ghost'||reason==='event_ghost'
    const multStr = mult > 1 ? ` ×${mult} récidive` : ''
    showToast(`${p.emoji} ${p.label}${multStr} · Score ${finalPts} pts → ${newScore}`, isGhost ? C.red : C.orange)
  }, [user, userScore, showToast])

  // Auth parallèle au splash
  useEffect(() => {
    supabase.auth.getSession().then(async({data:{session}}) => {
      if (session?.user) {
        const {data:p} = await supabase.from('profiles').select('*').eq('id',session.user.id).single()
        if (p) {
          setUser(p); setAuthTarget('main')
          // Skip onboarding si déjà disponible au refresh — va direct aux présences
          if (p.is_available && p.available_until && new Date(p.available_until) > new Date()) {
            setFlow('app')
          }
        } else setAuthTarget('login')
      } else setAuthTarget('login')
      setAuthDone(true)
    }).catch(() => { setAuthTarget('login'); setAuthDone(true) })
  },[])

  const onSplashDone = useCallback(() => {
    if (authDone) setScreen(authTarget)
    else setTimeout(() => setScreen(authTarget), 300)
  },[authDone,authTarget])

  // Sécurité : si screen='main' et user déjà dispo → toujours aller sur presences
  useEffect(() => {
    if (screen === 'main' && user?.is_available && (user as any).available_until) {
      if (new Date((user as any).available_until) > new Date()) {
        setFlow('app')
      }
    }
  }, [screen, user])

  const loadProfiles = useCallback(async () => {
    if (!user?.id) return
    const nowIso = new Date().toISOString()
    const {data:bd} = await supabase.from('blocks').select('blocker_id,blocked_id').or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)
    const bids = (bd||[]).map((b:any) => b.blocker_id===user.id?b.blocked_id:b.blocker_id)
    let q = supabase.from('profiles').select('*').neq('id',user.id).neq('is_banned',true).eq('is_available',true).or(`available_until.is.null,available_until.gt.${nowIso}`)
    bids.forEach((bid:string) => { q=q.neq('id',bid) })
    const {data, error} = await q
    if (!error && data) setProfiles(data.map(enrichProfile))
  },[user?.id])

  const loadClutches = useCallback(async () => {
    if (!user?.id) return
    // Ne charge que les clutchs récents (48h) ou actifs — évite d'afficher l'historique complet
    const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    const {data} = await supabase.from('clutches')
      .select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at',{ascending:false}).limit(30)
    if (data) {
      const now = new Date()
      // ── Auto-expiration côté client : pending dont expires_at < now → 'expired' ──
      const toExpire = data.filter((c:any) =>
        c.status === 'pending' && c.expires_at && new Date(c.expires_at) < now
      )
      for (const c of toExpire) {
        // guard .eq('status','pending') évite double update si l'autre user a déjà expiré
        await supabase.from('clutches').update({status:'expired', updated_at: new Date().toISOString()})
          .eq('id', c.id).eq('status', 'pending')
        c.status = 'expired'
      }
      // ── Auto-reward score : confirmed dont proposed_time < now − 30min → +5 pts ──
      const toReward = data.filter((c:any) =>
        (c.status === 'confirmed' || c.status === 'accepted') &&
        c.proposed_time && new Date(c.proposed_time) < new Date(now.getTime() - 30 * 60 * 1000)
      )
      for (const c of toReward) {
        const key = `clutch_rewarded_${c.id}`
        try {
          if (localStorage.getItem(key)) continue // déjà récompensé
          localStorage.setItem(key, '1')
          const cur = user?.reliability_score ?? 100
          const newScore = Math.min(100, cur + 5)
          await supabase.from('profiles').update({reliability_score: newScore}).eq('id', user!.id)
          // Update local user state — via callback
          setUser(prev => prev ? {...prev, reliability_score: newScore} : prev)
          showToast(`✦ Meetup kept! +5 pts → Score ${newScore}`, C.green)
        } catch {}
      }
      setClutches(prev => {
        // Détecter un nouveau verrou (statut passe à confirmed sur un clutch envoyé par moi)
        const newlyConfirmed = data.find((c:any) =>
          (c.status === 'confirmed' || c.status === 'accepted') &&
          c.sender_id === user.id &&
          !(prev as any[]).find((p:any) => p.id === c.id && (p.status === 'confirmed' || p.status === 'accepted'))
        )
        if (newlyConfirmed) {
          // Guard anti-replay : si déjà montré (localStorage), ne pas rejouer l'animation
          const shownKey = `verrou_shown_${newlyConfirmed.id}`
          try {
            if (!localStorage.getItem(shownKey)) {
              localStorage.setItem(shownKey, String(Date.now()))
              localStorage.setItem(`clutch_locked_at_${newlyConfirmed.id}`, String(Date.now()))
              setVerrouData({ venue: newlyConfirmed.venue||'', name: newlyConfirmed.receiver?.name||'', photo: newlyConfirmed.receiver?.photo_url||null })
              setTimeout(() => setShowVerrou(true), 100)
            }
          } catch {}
        }
        return data
      })
    }
  },[user?.id])

  useEffect(() => {
    if (!user?.id) return
    // Refresh initial
    loadProfiles(); loadClutches()

    // Realtime: écoute les changements de disponibilité sur profiles
    const profilesChannel = supabase
      .channel('profiles_availability')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        const updated = payload.new as any
        // Ignorer notre propre profil
        if (updated.id === user.id) return
        setProfiles(prev => {
          const exists = prev.find(p => p.id === updated.id)
          const isNowAvailable = updated.is_available && updated.available_until && new Date(updated.available_until) > new Date()
          if (isNowAvailable) {
            const enriched = enrichProfile(updated)
            if (exists) return prev.map(p => p.id === updated.id ? enriched : p)
            else return [...prev, enriched]
          } else {
            // Profil plus disponible → retirer de la carte
            return prev.filter(p => p.id !== updated.id)
          }
        })
      })
      .subscribe()

    // Auto-refresh (fallback si Realtime rate un événement)
    const t = setInterval(loadProfiles, 15 * 1000)
    const tc = setInterval(loadClutches, 5 * 1000) // 5s pour clutchs (verrou temps réel)
    // Refresh immédiat quand l'app revient au premier plan
    const onVisible = () => { if (document.visibilityState === 'visible') { loadProfiles(); loadClutches() } }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      supabase.removeChannel(profilesChannel)
      clearInterval(t)
      clearInterval(tc)
      document.removeEventListener('visibilitychange', onVisible)
    }
  },[user?.id,loadProfiles,loadClutches])

  // ── Bot incoming clutch — un profil test initie un clutch vers David ──
  // Se déclenche 3-5min après ouverture de la fenêtre, puis toutes les 8-12min
  useEffect(()=>{
    if (screen !== 'main' || flow !== 'app') return
    const BOT_PROFILES = [
      {id:'38dda77a', name:'Camille', gender:'woman',
       photo_url:'https://randomuser.me/api/portraits/women/44.jpg',
       reliability_score:94, bio:'Café + vraies conversations ☕',
       age:27, neighborhood:'Lausanne', job:'Designer UX',
       interests:['Café','Design','Lectures','Randonnée','Musique'],
       languages:['Français','Anglais','Allemand'],
       extraPhotos:[],
      },
      {id:'6cf880cf', name:'Anaïs', gender:'woman',
       photo_url:'https://randomuser.me/api/portraits/women/68.jpg',
       reliability_score:99, bio:'Yoga & bonne humeur 🧘',
       age:29, neighborhood:'Pully', job:'Prof de yoga RYT-500',
       interests:['Yoga','Méditation','Randonnée','Cuisine végane'],
       languages:['Français','Anglais'],
       extraPhotos:[],
      },
      {id:'c504c886', name:'Sofia', gender:'woman',
       photo_url:'https://randomuser.me/api/portraits/women/26.jpg',
       reliability_score:97, bio:'Curieuse et spontanée ✨',
       age:25, neighborhood:'Flon', job:'Marketing',
       interests:['Art','Concerts','Gastronomie'],
       languages:['Français','Espagnol'],
       extraPhotos:[],
      },
      {id:'074e38bb', name:'Lucas', gender:'man',
       photo_url:'https://randomuser.me/api/portraits/men/32.jpg',
       reliability_score:88, bio:'Apéros & sorties culturelles 🎭',
       age:30, neighborhood:'Paquis', job:'Architecte',
       interests:['Architecture','Jazz','Escalade','Cinéma'],
       languages:['Français','Anglais'],
       extraPhotos:['https://randomuser.me/api/portraits/men/33.jpg'],
      },
    ]
    const VENUES = ['Café Romand','Blackbird Coffee','Bar du Flon','Terrasse Ouchy','Café de la Paix']
    const MSGS = ['Dispo pour un café ?','On se retrouve ?','Tu es dans le coin ?','Apéro ce soir ?','Envie de discuter ?']
    const delay = 180000 + Math.floor(Math.random()*120000) // 3-5min
    const t = setTimeout(()=>{
      if (showIncoming || showVerrou) return
      const bot = BOT_PROFILES[Math.floor(Math.random()*BOT_PROFILES.length)]
      const venue = VENUES[Math.floor(Math.random()*VENUES.length)]
      const msg = MSGS[Math.floor(Math.random()*MSGS.length)]
      const pt = new Date(Date.now()+2*3600*1000).toISOString()
      setIncomingClutch({id:'bot-'+Date.now(),sender:{...bot},venue,message:msg,proposed_time:pt,expires_at:pt})
      // (popup supprimé — badge rouge sur onglet ⚡ suffit)
      // Compteur anti-saturation femmes
      if (user && (user as any).gender === 'woman') {
        try {
          const today = new Date().toDateString()
          const todayKey = `clutch_daily_received_${user.id}_${today}`
          const current = parseInt(localStorage.getItem(todayKey)||'0')
          localStorage.setItem(todayKey, String(current+1))
        } catch {}
      }
    }, delay)
    return()=>clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[screen, flow, showIncoming, showVerrou])

  // ── Verrou actif — clutch confirmed dans les 18h suivantes ──
  const activeVerrou = useMemo(() => {
    if (!user?.id) return null
    const now = new Date()
    const soon = new Date(now.getTime() + 18*3600*1000)
    return (clutches as any[]).find(c =>
      (c.status === 'confirmed' || c.status === 'accepted') &&
      c.proposed_time &&
      new Date(c.proposed_time) > new Date(now.getTime() - 2*3600*1000) &&
      new Date(c.proposed_time) < soon
    ) || null
  }, [clutches, user?.id])

  // ── Notifications web push (préparation OneSignal) ─────────
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission === 'granted') return
    if (Notification.permission === 'denied') return
    const permission = await Notification.requestPermission()
    if (permission === 'granted') {
      showToast('🔔 Notifications enabled — you\'ll be alerted for every Clutch!', C.green)
    }
  }, [showToast])

  const notifyNewClutch = useCallback((senderName: string, venue: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (document.visibilityState === 'visible') return // app ouverte = pas besoin
    new Notification('🔒 Nouveau Clutch !', {
      body: `${senderName} te propose un RDV à ${venue}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'new-clutch', // remplace la notif précédente si plusieurs
    })
  }, [])

  // ── Ref clutches pour éviter stale closure dans callbacks Realtime ───
  const clutchesRef = useRef<any[]>([])
  useEffect(() => { clutchesRef.current = clutches as any[] }, [clutches])

  // ── Realtime — 3 channels séparés (Supabase = 1 filtre par channel) ───
  useEffect(() => {
    if (!user?.id) return

    const uid = user.id

    // Channel 1 : nouveaux Clutchs reçus (INSERT receiver)
    const chInsert = supabase.channel(`clutch-insert-${uid}`)
      .on('postgres_changes', {
        event:'INSERT', schema:'public', table:'clutches',
        filter:`receiver_id=eq.${uid}`,
      }, async payload => {
        const {data:sender} = await supabase.from('profiles').select('*').eq('id',payload.new.sender_id).single()
        setIncomingClutch({...payload.new, sender})
        loadClutches()
        try { notifyNewClutch(sender?.name || 'Quelqu\'un', payload.new.venue || 'un lieu') } catch {}
        if ((user as any).gender === 'woman') {
          try {
            const today = new Date().toDateString()
            const k = `clutch_daily_received_${uid}_${today}`
            localStorage.setItem(k, String(parseInt(localStorage.getItem(k)||'0')+1))
          } catch {}
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') console.log('[RT] chInsert subscribed')
        else console.warn('[RT] chInsert status:', status)
      })

    // Channel 2 : mise à jour clutch où je suis DESTINATAIRE (ex: envoyeur annule)
    const chUpdateRec = supabase.channel(`clutch-upd-rec-${uid}`)
      .on('postgres_changes', {
        event:'UPDATE', schema:'public', table:'clutches',
        filter:`receiver_id=eq.${uid}`,
      }, payload => {
        loadClutches()
        if (payload.new?.status === 'confirmed' || payload.new?.status === 'accepted') {
          const shownKey = `verrou_shown_${payload.new.id}`
          try {
            if (localStorage.getItem(shownKey)) { loadClutches(); return }
            localStorage.setItem(shownKey, String(Date.now()))
            localStorage.setItem(`clutch_locked_at_${payload.new.id}`, String(Date.now()))
          } catch {}
          const other = clutchesRef.current.find(c=>c.id===payload.new.id)
          setVerrouData({ venue:payload.new?.venue||'', name:other?.sender?.name||'', photo:other?.sender?.photo_url||null })
          setShowVerrou(true)
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') console.log('[RT] chUpdateRec subscribed')
        else console.warn('[RT] chUpdateRec status:', status)
      })

    // Channel 3 : mise à jour clutch où je suis ENVOYEUR (Tafit accepte → David voit le verrou)
    const chUpdateSend = supabase.channel(`clutch-upd-send-${uid}`)
      .on('postgres_changes', {
        event:'UPDATE', schema:'public', table:'clutches',
        filter:`sender_id=eq.${uid}`,
      }, payload => {
        console.log('[RT] chUpdateSend fired:', payload.new?.status)
        loadClutches()
        if (payload.new?.status === 'confirmed' || payload.new?.status === 'accepted') {
          const shownKey = `verrou_shown_${payload.new.id}`
          try {
            if (localStorage.getItem(shownKey)) { loadClutches(); return }
            localStorage.setItem(shownKey, String(Date.now()))
            localStorage.setItem(`clutch_locked_at_${payload.new.id}`, String(Date.now()))
          } catch {}
          const other = clutchesRef.current.find(c=>c.id===payload.new.id)
          setVerrouData({ venue:payload.new?.venue||'', name:other?.receiver?.name||'', photo:other?.receiver?.photo_url||null })
          setShowVerrou(true)
        }
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') console.log('[RT] chUpdateSend subscribed')
        else console.warn('[RT] chUpdateSend status:', status)
      })

    return () => {
      supabase.removeChannel(chInsert)
      supabase.removeChannel(chUpdateRec)
      supabase.removeChannel(chUpdateSend)
    }
  }, [user?.id, loadClutches, notifyNewClutch])

  // ── Polling ciblé : surveille mes clutchs pending toutes les 3s (stable via ref) ──
  const shownVerrouIds = useRef<Set<string>>(new Set())
  const [debugLog] = useState<string>('')
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const t = setInterval(async () => {
      const current = clutchesRef.current
      const pendingIds = current.filter((c:any) => c.sender_id === uid && c.status === 'pending').map((c:any) => c.id)
      if (pendingIds.length === 0) return
      const {data} = await supabase.from('clutches')
        .select('*,receiver:profiles!clutches_receiver_id_fkey(*)')
        .in('id', pendingIds)
        .in('status', ['accepted','confirmed'])
      if (!data || data.length === 0) return
      for (const row of data) {
        if (shownVerrouIds.current.has(row.id)) continue
        try { if (localStorage.getItem(`verrou_shown_${row.id}`)) { shownVerrouIds.current.add(row.id); continue } } catch {}
        shownVerrouIds.current.add(row.id)
        try {
          localStorage.setItem(`verrou_shown_${row.id}`, String(Date.now()))
          localStorage.setItem(`clutch_locked_at_${row.id}`, String(Date.now()))
        } catch {}
        loadClutches()
        setVerrouData({ venue:row.venue||'', name:row.receiver?.name||'', photo:row.receiver?.photo_url||null })
        setShowVerrou(true)
        break
      }
    }, 3000)
    return () => clearInterval(t)
  }, [user?.id, loadClutches])

  // ── Polling messages non lus → badge bleu sur onglet Clutchs ──
  // Seulement sur clutchs ACTIFS (confirmed/accepted) pour éviter les faux positifs
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const poll = async () => {
      // 1. Récupère les clutchs actifs de l'utilisateur
      const activeIds = (clutchesRef.current as any[])
        .filter(c => ['confirmed','accepted'].includes(c.status))
        .map(c => c.id)
      if (activeIds.length === 0) { setUnreadChats({}); return }
      // 2. Compte les messages non lus sur ces clutchs uniquement
      const {data} = await supabase.from('messages')
        .select('clutch_id')
        .eq('receiver_id', uid)
        .is('read_at', null)
        .in('clutch_id', activeIds)
      if (!data) return
      const counts: Record<string,number> = {}
      for (const m of data) { if (m.clutch_id) counts[m.clutch_id] = (counts[m.clutch_id]||0)+1 }
      setUnreadChats(prev => {
        const same = JSON.stringify(prev) === JSON.stringify(counts)
        return same ? prev : counts
      })
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [user?.id, clutches])

  const signOut = async () => { await supabase.auth.signOut(); setUser(null);setProfiles([]);setClutches([]);setScreen('login') }


  const handleOuvrirFenetre = async () => {
    if (!user?.id) return
    // Vérifier si l'utilisateur est déjà disponible
    const alreadyAvail = user?.is_available && (user as any).available_until && new Date((user as any).available_until) > new Date()
    if (alreadyAvail) {
      const existingUntil = new Date((user as any).available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})
      const confirmed = window.confirm(`Tu es déjà disponible jusqu'à ${existingUntil}.\n\nOuvrir un nouveau créneau remplacera celui-ci. Confirmer ?`)
      if (!confirmed) return
    }
    const [h,m] = untilTime.split(':').map(Number)
    const until = new Date(); until.setHours(h,m,0,0)
    // Si l'heure est déjà passée (ex: 22:00 alors qu'il est 23:30) → lendemain
    if (until <= new Date()) until.setDate(until.getDate() + 1)
    const city = nearestCity(meetupPos[0], meetupPos[1])

    // Update + .select() pour vérifier que des lignes ont été mises à jour
    const { data: updated, error } = await supabase.from('profiles').update({
      is_available:true,
      available_until:until.toISOString(),
      available_city:city,
      ...(intentMsg ? {bio:intentMsg} : {}),
    } as any).eq('id',user.id).select()

    if (error) {
      showToast(`Erreur DB : ${error.message}`, C.red)
      return
    }

    // 0 lignes mises à jour → le profil n'existe pas encore → upsert
    if (!updated || updated.length === 0) {
      console.warn('[handleOuvrirFenetre] 0 rows updated — tentative upsert')
      const { error: e2 } = await supabase.from('profiles').upsert({
        id: user.id,
        is_available:true,
        available_until:until.toISOString(),
        available_city:city,
        name: (user as any).name || 'Utilisateur',
        gender: (user as any).gender || null,
        reliability_score: (user as any).reliability_score || 100,
        account_type: (user as any).account_type || 'free',
      })
      if (e2) {
        showToast(`Erreur upsert : ${e2.message}`, C.red)
        return
      }
    }

    setUser(prev=>prev?{...prev,is_available:true,available_until:until.toISOString(),available_city:city}:prev)
    showToast(`✦ Window open · ${city} · ${rayon} km`,C.green)
    requestNotificationPermission()
    setFlow('app')
    setTab('presences')
  }

  const filtered = profiles.filter(p => {
    if (filterGender==='all') return true
    const gk = genderKey((p as any).gender)
    // Inclure aussi les profils sans genre défini (X) pour ne pas les rater
    if (gk === 'X') return true
    return gk === filterGender
  })

  // Swipe supprimé — conflits avec zoom carte sur mobile

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${C.bg};font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',sans-serif;color:${C.white};overflow:hidden;height:100%;width:100%;}
        ::-webkit-scrollbar{display:none;}
        input,textarea,select{font-family:inherit;caret-color:${C.salmon};font-size:16px!important;}
        input::placeholder,textarea::placeholder{color:rgba(250,250,250,0.25);}
        input:focus,textarea:focus{border-color:${C.borderStrong}!important;outline:none;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastIn{from{opacity:0;transform:translateY(-100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes modalIn{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes heartPop{0%{transform:scale(0) rotate(-20deg);opacity:1}60%{transform:scale(1.4) rotate(10deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        .fi{animation:fadeIn .3s ease both;}
        .su{animation:slideUp .35s cubic-bezier(.22,1,.36,1) both;}
        .su1{animation-delay:.07s;} .su2{animation-delay:.14s;} .su3{animation-delay:.21s;}
        .card-hover:active{opacity:.8;transform:scale(.99);}
      `}</style>

      {screen==='splash'   && <Splash onDone={onSplashDone}/>}
      {toast && <Toast msg={toast.msg} color={toast.color} onDone={()=>setToast(null)}/>}
      {screen==='login'    && <LoginScreen onSuccess={p=>{
        setUser(p); setScreen('main')
        // Skip onboarding si déjà dispo — retour direct aux présences (feedback Mel)
        if (p.is_available && p.available_until && new Date(p.available_until) > new Date()) setFlow('app')
        // Lie le player OneSignal à notre user Supabase (natif uniquement)
        import('@/lib/onesignal').then(({ setOneSignalExternalId }) => setOneSignalExternalId(p.id)).catch(() => {})
      }} onRegister={()=>setScreen('register')} showToast={showToast}/>}
      {screen==='register' && <RegisterScreen onSuccess={p=>{setUser(p);setScreen('main')}} onLogin={()=>setScreen('login')} showToast={showToast}/>}

      {screen==='main' && user && (
        <>
          {/* ══════════════════════════════════════════════
              PAGE 1 — CARTE SEULE (0 menu, 0 tab bar)
          ══════════════════════════════════════════════ */}
          {flow==='carte' && (
            <div className="fi" style={{position:'fixed',inset:0,background:C.bg,display:'flex',flexDirection:'column'}}>

              {/* Header flottant — absolu, sans dégradé */}
              <div style={{position:'absolute',top:0,left:0,right:0,zIndex:900,padding:'48px 16px 10px'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:900,letterSpacing:'.2em',textTransform:'uppercase',color:C.salmon,background:'rgba(61,26,51,.82)',backdropFilter:'blur(8px)',padding:'5px 12px',borderRadius:20,border:`1px solid ${C.border}`}}>
                    ✦ Clutch
                    <span style={{fontSize:8,fontWeight:700,color:`${C.salmon}77`,letterSpacing:'.05em',textTransform:'none'}}>{V}</span>
                  </div>
                  {/* Filtres genre avec label visible */}
                  <div style={{display:'flex',gap:5,background:'rgba(61,26,51,.7)',backdropFilter:'blur(8px)',padding:'4px 8px',borderRadius:20,border:`1px solid ${C.border}`}}>
                    {([
                      {k:'all', icon:'◎', txt:'All'},
                      {k:'F',   icon:GI.F, txt:'Women'},
                      {k:'M',   icon:GI.M, txt:'Men'},
                      {k:'X',   icon:GI.X, txt:'Non-binary'},
                      {k:'kids',icon:'👶', txt:'Parents'},
                    ] as const).map(g=>{
                      // 👶 a sa propre couleur verte, indépendante des genres
                      const color = g.k==='all' ? C.salmon : g.k==='kids' ? C.green : GC[g.k as GenderKey]
                      const active = filterGender === (g.k as string)
                      return (
                        <button key={g.k} onClick={()=>{const v=g.k as any;setFilterGender(v);try{localStorage.setItem('clutch_filter_gender',v)}catch{}}} title={g.txt}
                          style={{
                            display:'flex',alignItems:'center',gap:active?4:0,
                            padding:active?'3px 8px':'3px 6px',
                            borderRadius:14,border:`1px solid ${active?color:'transparent'}`,
                            background:active?`${color}22`:'transparent',
                            color:active?color:C.whiteMid,
                            fontSize:12,fontWeight:active?900:500,
                            cursor:'pointer',fontFamily:'inherit',
                            transition:'all .12s',overflow:'hidden',
                            maxWidth:active?80:24,
                            // 👶 emoji est naturellement jaune — on grise quand inactif
                            filter:(!active&&g.k==='kids')?'grayscale(1) opacity(.45)':'none',
                          }}>
                          <span>{g.icon}</span>
                          {active && <span style={{fontSize:9,fontWeight:800,whiteSpace:'nowrap'}}>{g.txt}</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* CARTE — prend tout l'espace libre, flex:1 */}
              <div style={{flex:1,minHeight:0,position:'relative'}}>
                <MapLeaflet rayon={rayon} userPhoto={user.photo_url} profiles={profiles}
                  showPin={true}
                  onReady={(fn,rc)=>{ mapGetCenterRef.current=fn; mapRecenterRef.current=rc }}
                  onGpsUpdate={(loc)=>setMeetupPos(loc)}/>
                {/* Bouton reset position — en haut à droite, compact */}
                <button onClick={(e)=>{e.stopPropagation();mapRecenterRef.current?.()}}
                  title="Recenter on my position"
                  style={{position:'absolute',top:8,right:8,zIndex:1200,
                    padding:'5px 10px',borderRadius:20,
                    background:'rgba(42,16,32,.8)',border:`1px solid ${C.border}`,
                    color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit',
                    backdropFilter:'blur(8px)',pointerEvents:'all'}}>
                  ⊕ My position
                </button>
                {/* Hint sobre — bas gauche */}
                <div style={{position:'absolute',bottom:8,left:8,zIndex:1100,pointerEvents:'none'}}>
                  <div style={{background:'rgba(42,16,32,.75)',backdropFilter:'blur(4px)',borderRadius:8,padding:'4px 9px',fontSize:9,color:C.whiteMid,whiteSpace:'nowrap'}}>
                    Move the map · long press to pin a location
                  </div>
                </div>
              </div>

              {/* Zone roues + CTA — fixe en bas, hauteur compacte
                  onTouchStart/End bloqués ici pour éviter le conflit swipe */}
              <div
                style={{flexShrink:0,background:C.bgCard,borderTop:`1px solid ${C.border}`}}
                onTouchStart={e=>e.stopPropagation()}
                onTouchEnd={e=>e.stopPropagation()}
              >
                {/* ── Slider rayon — style fader table de mixage ── */}
                {/* ── Slider rayon custom — zone de clic 60px, fiable iOS/Android ── */}
                {(()=>{
                  const pct = rayonToSlider(rayon) // 0-100
                  const updateFromEvent = (clientX: number) => {
                    const el = sliderRef.current; if(!el) return
                    const rect = el.getBoundingClientRect()
                    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
                    setRayon(sliderToRayon(ratio * 100))
                  }
                  return (
                    <div style={{padding:'10px 16px 6px'}}>
                      <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:10}}>
                        <span style={{fontSize:12,fontWeight:700,color:C.whiteMid}}>📍 Radius</span>
                        <span style={{fontSize:24,fontWeight:900,color:C.orange,letterSpacing:'-.03em',lineHeight:1}}>{fmtKm(rayon)}</span>
                      </div>
                      {/* Zone cliquable 60px de haut — toute la largeur */}
                      <div ref={sliderRef}
                        style={{position:'relative',height:60,display:'flex',alignItems:'center',cursor:'pointer',touchAction:'none'}}
                        onPointerDown={e=>{
                          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
                          updateFromEvent(e.clientX)
                        }}
                        onPointerMove={e=>{
                          if(e.buttons===0) return
                          updateFromEvent(e.clientX)
                        }}>
                        {/* Track fond */}
                        <div style={{position:'absolute',left:0,right:0,height:8,borderRadius:4,background:'rgba(255,191,158,.18)',pointerEvents:'none'}}/>
                        {/* Track rempli */}
                        <div style={{position:'absolute',left:0,width:`${pct}%`,height:8,borderRadius:4,background:C.orange,pointerEvents:'none'}}/>
                        {/* Thumb fader */}
                        <div style={{position:'absolute',left:`calc(${pct}% - 7px)`,width:14,height:36,borderRadius:5,background:C.orange,border:`2px solid ${C.bg}`,pointerEvents:'none',transition:'left .05s'}}/>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:`${C.whiteMid}66`,marginTop:2}}>
                        <span>1 km</span><span>10 km</span><span>50 km</span><span>100 km</span>
                      </div>
                    </div>
                  )
                })()}

                {/* Séparateur */}
                <div style={{height:1,background:C.border,margin:'2px 0'}}/>

                {/* Étiquettes temps */}
                <div style={{display:'flex',padding:'6px 12px 0',gap:4,alignItems:'center'}}>
                  <div style={{flex:1,textAlign:'center'}}>
                    <div style={{display:'inline-flex',alignItems:'baseline',gap:5}}>
                      <span style={{fontSize:16,fontWeight:900,color:C.salmon,letterSpacing:'-.02em'}}>From</span>
                      <span style={{fontSize:20,fontWeight:900,color:C.white,letterSpacing:'-.03em',lineHeight:1}}>{fromTime}</span>
                    </div>
                  </div>
                  <div style={{color:C.whiteMid,fontSize:14,flexShrink:0}}>→</div>
                  <div style={{flex:1,textAlign:'center'}}>
                    <div style={{display:'inline-flex',alignItems:'baseline',gap:5}}>
                      <span style={{fontSize:16,fontWeight:900,color:C.salmon,letterSpacing:'-.02em'}}>To</span>
                      <span style={{fontSize:20,fontWeight:900,color:C.white,letterSpacing:'-.03em',lineHeight:1}}>{untilTime}</span>
                    </div>
                  </div>
                </div>

                {/* 2 roues temps */}
                <div style={{display:'flex',gap:0,padding:'0 8px',height:106,alignItems:'stretch'}}>
                  <JogWheel slots={initSlots} value={fromTime} onChange={v => {
                    setFromTime(v)
                    const [h,m]=v.split(':').map(Number); const b=new Date(); b.setHours(h,m,0,0)
                    const ns=makeSlots(new Date(b.getTime()+30*60_000)).slice(0,36)
                    if (!ns.includes(untilTime)) setUntilTime(ns[1]||ns[0])
                  }}/>
                  <div style={{width:1,background:C.border,margin:'12px 4px'}}/>
                  <JogWheel slots={untilSlots} value={untilTime} onChange={setUntilTime}/>
                </div>

                {/* CTA bas */}
                <div style={{padding:'8px 20px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  {/* Step pill */}
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <div style={{width:22,height:22,borderRadius:'50%',background:C.orange,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:C.bordeaux}}>1</div>
                    <div style={{display:'flex',gap:4}}>
                      <div style={{width:20,height:3,borderRadius:2,background:C.orange}}/>
                      <div style={{width:20,height:3,borderRadius:2,background:C.border}}/>
                    </div>
                    <div style={{width:22,height:22,borderRadius:'50%',border:`2px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:C.whiteMid}}>2</div>
                  </div>
                  <button onClick={()=>{
                    const center = mapGetCenterRef.current?.() || ME
                    setMeetupPos(center)
                    setFlow('options')
                  }} style={{
                    padding:'13px 32px',
                    background:C.orange,border:'none',
                    borderRadius:14,color:C.bordeaux,
                    fontSize:15,fontWeight:900,
                    cursor:'pointer',fontFamily:'inherit',
                    letterSpacing:'-.02em',
                  }}>
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              PAGE 2 — QUEL TYPE DE RENCONTRE (0 tab bar)
          ══════════════════════════════════════════════ */}
          {flow==='options' && (
            <div className="fi" style={{position:'fixed',inset:0,background:C.bg,display:'flex',flexDirection:'column'}}>
              {/* Header */}
              <div style={{padding:'52px 16px 14px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <button onClick={()=>setFlow('carte')} style={{background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.salmon,fontSize:16,flexShrink:0}}>←</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:17,fontWeight:900,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t('page2.type')}</div>
                    <div style={{fontSize:10,color:C.whiteMid,marginTop:1}}>{t('page2.intention')}</div>
                  </div>
                  {/* Étape 2/2 compact */}
                  <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                    <div style={{width:20,height:20,borderRadius:'50%',border:`2px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:C.whiteMid}}>1</div>
                    <div style={{width:12,height:2,borderRadius:1,background:C.orange}}/>
                    <div style={{width:20,height:20,borderRadius:'50%',background:C.orange,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:C.bordeaux}}>2</div>
                  </div>
                </div>
              </div>

              <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'14px 16px 0'}}>

                {/* 1. MODE — multi-select (pas exclusif : on peut chercher rencontre ET amitié) */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid}}>Mode <span style={{fontWeight:400,textTransform:'none'}}>— multiple choices allowed</span></div>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    {([
                      {k:'romantic',icon:'💕',l:'Romance',   sub:'romantic meetup'},
                      {k:'friend',  icon:'🤝',l:'Friendship',sub:'outing, activity'},
                      {k:'pro',     icon:'💼',l:'Pro',       sub:'network, coworking'},
                      {k:'parent',  icon:'👶',l:'Parents',   sub:'with kids'},
                    ] as const).map(m=>{
                      const on=seekModes.includes(m.k)
                      return <button key={m.k} onClick={()=>{
                        if (m.k==='parent') {
                          // Mode Parents = exclusif (pas compatible autres modes)
                          setSeekModes(on ? [] : ['parent'])
                        } else {
                          // Autres modes = multi-select SAUF si parent était sélectionné
                          const without = seekModes.filter(x=>x!==m.k&&x!=='parent')
                          setSeekModes(on ? without : [...without, m.k])
                        }
                      }}
                        style={{flex:1,padding:'8px 3px',borderRadius:14,
                          border:`1.5px solid ${on?C.salmon:C.border}`,
                          background:on?C.salmonFaint:'transparent',
                          cursor:'pointer',fontFamily:'inherit',transition:'all .12s',
                          position:'relative'}}>
                        {on&&<div style={{position:'absolute',top:4,right:4,width:8,height:8,borderRadius:'50%',background:C.salmon}}/>}
                        <div style={{fontSize:17,marginBottom:2}}>{m.icon}</div>
                        <div style={{fontSize:10,fontWeight:on?900:500,color:on?C.salmon:C.white}}>{m.l}</div>
                        <div style={{fontSize:8,color:C.whiteMid,lineHeight:1.2}}>{m.sub}</div>
                      </button>
                    })}
                  </div>
                  {seekModes.length===0&&<div style={{fontSize:9,color:C.orange,marginTop:4}}>⚠️ Select at least one mode to be visible</div>}
                </div>

                {/* 2. GENRE RECHERCHÉ */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid,marginBottom:8}}>I want to meet…</div>
                  <div style={{display:'flex',gap:8}}>
                    {([
                      {k:'F',   icon:GI.F, l:'Women',        c:GC.F},
                      {k:'M',   icon:GI.M, l:'Men',          c:GC.M},
                      {k:'X',   icon:GI.X, l:'Non-binary',   c:GC.X},
                      {k:'all', icon:'◎',  l:'Doesn\'t matter', c:C.salmon},
                    ] as const).map(g=>{
                      const on=seekGender===g.k
                      return <button key={g.k} onClick={()=>setSeekGender(g.k as any)}
                        style={{flex:1,padding:'9px 3px',borderRadius:14,border:`1.5px solid ${on?g.c:C.border}`,background:on?`${g.c}18`:'transparent',cursor:'pointer',fontFamily:'inherit',transition:'all .12s'}}>
                        <div style={{fontSize:16,color:on?g.c:C.whiteMid,marginBottom:2}}>{g.icon}</div>
                        <div style={{fontSize:10,fontWeight:on?900:500,color:on?g.c:C.white}}>{g.l}</div>
                      </button>
                    })}
                  </div>
                </div>

                {/* 3. TRANCHE D'ÂGE — multi-select (ex: 18–25 ET 25–35) */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid,marginBottom:8}}>Age range <span style={{fontWeight:400,textTransform:'none'}}>— multiple ok</span></div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {['18–25','25–35','35–49','50–64','65+'].map(a=>{
                      const on=seekAges.includes(a)&&!seekAges.includes('tous')
                      return <button key={a} onClick={()=>{
                        setSeekAges(prev=>{
                          const without=prev.filter(x=>x!==a&&x!=='tous')
                          return prev.includes(a)?without:(without.length===3?['tous']:without.concat(a))
                        })
                      }}
                        style={{padding:'7px 14px',borderRadius:20,border:`1.5px solid ${on?C.orange:C.border}`,background:on?C.orangeFaint:'transparent',color:on?C.orange:C.whiteMid,fontSize:12,fontWeight:on?800:500,cursor:'pointer',fontFamily:'inherit'}}>
                        {a}
                      </button>
                    })}
                    <button onClick={()=>setSeekAges(['tous'])}
                      style={{padding:'7px 14px',borderRadius:20,border:`1.5px solid ${seekAges.includes('tous')?C.orange:C.border}`,background:seekAges.includes('tous')?C.orangeFaint:'transparent',color:seekAges.includes('tous')?C.orange:C.whiteMid,fontSize:12,fontWeight:seekAges.includes('tous')?800:500,cursor:'pointer',fontFamily:'inherit'}}>
                      Doesn't matter
                    </button>
                  </div>
                  {seekAges.length>1&&!seekAges.includes('tous')&&<div style={{fontSize:9,color:C.orange,marginTop:3}}>✓ {seekAges.join(' + ')}</div>}
                </div>

                {/* 4. ACTIVITÉ */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid,marginBottom:8}}>I feel like… <span style={{fontWeight:400,textTransform:'none',fontSize:9,color:C.whiteMid}}>(optional)</span></div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {[{e:'☕',l:'Café'},{e:'🍷',l:'Apéro'},{e:'🍕',l:'Dîner'},{e:'🚶',l:'Balade'},{e:'🎭',l:'Culture'},{e:'🏃',l:'Sport'},{e:'🎵',l:'Concert'},{e:'🎮',l:'Jeux'},{e:'📸',l:'Photo'},{e:'🧘',l:'Yoga'},{e:'🌿',l:'Bien-être'},{e:'🍜',l:'Resto'},{e:'✨',l:'Surprise moi'}].map(a=>{
                      const on=activites.includes(a.l)
                      const isSurprise = a.l==='Surprise moi'
                      return <button key={a.l} onClick={()=>{
                        if(isSurprise) {
                          // Surprise moi = exclusif, efface tout le reste
                          setActivites(on ? [] : ['Surprise moi'])
                        } else {
                          // Désélectionner Surprise si on choisit autre chose
                          const without = activites.filter(x=>x!==a.l&&x!=='Surprise moi')
                          setActivites(on ? without : [...without,a.l])
                        }
                      }}
                        style={{padding:'5px 10px',borderRadius:20,border:`1.5px solid ${on?C.salmon:C.border}`,background:on?C.salmonFaint:'transparent',color:on?C.salmon:C.whiteMid,fontSize:11,fontWeight:on?800:500,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:3}}>
                        <span>{a.e}</span>{a.l}
                      </button>
                    })}
                  </div>
                </div>

                {/* 5. MESSAGE D'INTENTION */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid}}>{t('page2.intMsg')} <span style={{fontWeight:400,textTransform:'none'}}>{t('page2.optional')}</span></div>
                    <div style={{fontSize:9,color:intentMsg.length>120?C.orange:C.whiteMid}}>{intentMsg.length}/150</div>
                  </div>
                  <textarea value={intentMsg} onChange={e=>setIntentMsg(e.target.value.slice(0,150))}
                    placeholder={`e.g. I'd love a real conversation over coffee…`}
                    rows={2} style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 14px',fontSize:12,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',caretColor:C.salmon}}/>
                  <div style={{fontSize:9,color:C.whiteMid,marginTop:3}}>{t('page2.note')}</div>
                </div>

                {/* Récap fenêtre */}
                <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:'11px 14px',marginBottom:20}}>
                  <div style={{display:'flex',flexWrap:'wrap',gap:10,fontSize:11,color:C.whiteMid}}>
                    <span>🕐 <strong style={{color:C.white}}>{fromTime}–{untilTime}</strong></span>
                    <span>📍 <strong style={{color:C.salmon}}>{nearestCity(meetupPos[0],meetupPos[1])}</strong> · <strong style={{color:C.orange}}>{fmtKm(rayon)}</strong></span>
                    <span>⏱ <strong style={{color:C.white}}>18h max</strong></span>
                  </div>
                </div>
              </div>

              {/* Grand bouton CTA */}
              <div style={{padding:'12px 16px 40px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
                <button onClick={handleOuvrirFenetre} style={{
                  width:'100%',padding:'20px',
                  background:`linear-gradient(135deg,${C.salmon} 0%,${C.orange} 100%)`,
                  border:'none',borderRadius:20,color:C.bg,
                  fontSize:17,fontWeight:900,cursor:'pointer',fontFamily:'inherit',
                  letterSpacing:'-.03em',
                  boxShadow:`0 8px 32px rgba(226,124,0,.35)`,
                }}>
                  ✦ Open my Window
                </button>
                <div style={{textAlign:'center',marginTop:8,fontSize:10,color:C.whiteMid}}>
                  Visible within {fmtKm(rayon)} of {nearestCity(meetupPos[0],meetupPos[1])}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              PAGE 3 — APP (tab bar visible)
          ══════════════════════════════════════════════ */}
          {flow==='app' && (
            <>
              {/* Version chip — visible sur toutes les pages */}
              <div style={{position:'fixed',top:'env(safe-area-inset-top,6px)',left:8,zIndex:900,pointerEvents:'none'}}>
                <span style={{fontSize:8,fontWeight:700,color:`${C.salmon}55`,letterSpacing:'.05em',fontFamily:'inherit'}}>{V}</span>
              </div>

              {/* ── TAB : PRÉSENCES — cards compactes, tap = détail + Clutcher ── */}
              {tab==='presences' && (
                <div className="fi" style={{position:'fixed',inset:0,bottom:72,background:C.bg,display:'flex',flexDirection:'column'}}>
                  {/* Bandeau créneau actif */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 16px',background:`${C.bg}ee`,borderBottom:`1px solid #C8860A44`,flexShrink:0,paddingTop:'env(safe-area-inset-top,8px)'}}>
                    <div style={{fontSize:11,color:'#FFBF9E',opacity:0.8}}>
                      {(user as any)?.is_available && (user as any)?.available_until
                        ? `✦ Visible until ${new Date((user as any).available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}`
                        : '◌ Not visible'}
                    </div>
                    <button onClick={()=>setFlow('carte')} style={{padding:'4px 12px',borderRadius:20,border:`1px solid #C8860A`,background:'#C8860A22',color:'#C8860A',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',letterSpacing:0.3}}>
                      + Window
                    </button>
                  </div>
                  <div style={{padding:'8px 16px 10px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1}}>
                        <div style={{fontSize:19,fontWeight:900}}>{t('tab.presences')}</div>
                        <div style={{fontSize:11,color:C.whiteMid,marginTop:1}}>{filtered.length} {lang==='en'?'available':'disponible'+(filtered.length!==1?'s':'')} · Lausanne</div>
                      </div>
                      {(['all','F','M','X'] as const).map(g=>{
                        const color = g==='all' ? C.salmon : GC[g as GenderKey]
                        const isSelected = filterGender===g
                        return (
                          <button key={g} onClick={()=>{setFilterGender(g);try{localStorage.setItem('clutch_filter_gender',g)}catch{}}}
                            style={{width:30,height:28,borderRadius:20,border:`1px solid ${isSelected?color:C.border}`,background:isSelected?`${color}22`:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                            {g==='all'
                              ? <span style={{color:isSelected?color:C.whiteMid,fontSize:13,fontWeight:isSelected?900:500}}>◎</span>
                              : <GenderSvg gk={g as GenderKey} size={14} style={{filter:isSelected?'none':'brightness(0) invert(1) opacity(0.4)'}}/>
                            }
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  {/* Soft banner replaces blocking gate */}
                  <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0,padding:'8px 14px'}}>
                    {!availableRef && (
                      <div style={{background:'rgba(200,134,10,.08)',border:`1px solid ${C.orange}33`,borderRadius:10,padding:'10px 12px',marginBottom:8,display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:14,flexShrink:0}}>{isPremium?'👁':'◌'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.orange}}>{isPremium?'Stealth mode — you are invisible':'You are not visible right now'}</div>
                          <div style={{fontSize:10,color:C.whiteMid,marginTop:1}}>{isPremium?'You can browse without being seen':'Open a window to appear on the map'}</div>
                        </div>
                        {!isPremium&&<button onClick={()=>setFlow('carte')} style={{padding:'5px 10px',borderRadius:8,background:`${C.orange}22`,border:`1px solid ${C.orange}44`,color:C.orange,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>+ Créneau</button>}
                      </div>
                    )}
                    {isWomanSaturated && (
                      <div style={{background:`${C.orange}15`,border:`1px solid ${C.orange}33`,borderRadius:12,padding:'10px 14px',marginBottom:8,display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:16}}>🛡️</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:800,color:C.orange}}>Protection enabled</div>
                          <div style={{fontSize:10,color:C.whiteMid}}>You've received {MAX_CLUTCHS_PER_DAY_WOMEN} clutches today. Come back tomorrow or raise your score to receive more.</div>
                        </div>
                      </div>
                    )}
                    {filtered.length===0
                      ?<div style={{textAlign:'center',padding:'60px 20px',color:C.whiteMid}}><div style={{fontSize:32,marginBottom:10}}>✦</div><div style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:6}}>{t('discover.none')}</div><div style={{fontSize:12}}>{t('discover.nonenote')}</div></div>
                      :filtered.map((p,i)=>(
                        /* Card compact — genre coloré, tap ouvre send modal */
                        <div key={p.id} className={`card-hover su${i<3?i:''}`}
                          style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:8,cursor:'pointer',display:'flex',gap:10,alignItems:'center',padding:'11px 13px'}}
                          onClick={()=>{setSelProfile(p);setShowProfileSheet(true)}}>
                          <div style={{position:'relative',flexShrink:0}}>
                            <Av src={p.photo_url} name={p.name||'?'} size={44}/>
                            {/* Dot disponible */}
                            <div style={{position:'absolute',bottom:-1,right:-1,width:11,height:11,borderRadius:'50%',background:C.green,border:`2px solid ${C.bgCard}`}}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:2}}>
                              {/* Icône genre colorée */}
                              <GenderSvg gk={genderKey((p as any).gender)} size={14}/>
                              <span style={{fontSize:14,fontWeight:800}}>{p.name||'Anonyme'}</span>
                              {isTestProfile(p.id)&&<span style={{fontSize:8,fontWeight:900,padding:'1px 4px',borderRadius:6,background:'rgba(107,114,128,.2)',color:'#9CA3AF',border:'1px solid rgba(107,114,128,.3)'}}>BOT</span>}
                              {p.age&&<span style={{fontSize:11,color:C.whiteMid}}>{p.age}a</span>}
                              {(p.reliability_score!=null&&p.reliability_score<60)&&<RabbitBadge/>}
                              {p.reliability_score!=null&&<span style={{marginLeft:'auto'}}><Score v={p.reliability_score}/></span>}
                            </div>
                            {p.bio&&<div style={{fontSize:11,color:C.whiteMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.bio}</div>}
                          </div>
                          {/* Bouton Clutcher */}
                          <div style={{flexShrink:0,width:34,height:34,borderRadius:10,background:C.salmonFaint,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>✦</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* ── TAB : ÉVÉNEMENTS — avec Anaïs + détail cliquable ── */}
              {tab==='evenements' && <EventsTab
                onClutch={(p)=>{setSelProfile(p);setShowSend(true)}}
                registered={registeredEvents}
                setRegistered={setRegisteredEvents}
                waitlist={waitlistEvIds}
                setWaitlist={setWaitlistEvIds}
                lang={lang}
                initialEventId={openEventId}
                onClearInitialEvent={()=>setOpenEventId(null)}
                onPenalty={applyPenalty}
                onOpenProfile={(name,bio,photo)=>{
                  // Profil créateur enrichi (Anaïs = isCreator:true, allowClutch:false par défaut)
                  const isAnais = name.toLowerCase().includes('anaïs')||name.toLowerCase().includes('anais')
                  setSelProfile({
                    id:'creator_'+name, name, bio, photo_url:photo,
                    reliability_score:99, gender:'woman', age:29,
                    neighborhood:'Pully', job:'Prof de yoga certifiée RYT-500',
                    interests:['Yoga','Méditation','Randonnée','Cuisine végane','Musique live'],
                    languages:['Français','Anglais'],
                    badge:'✦ Créatrice',
                    is_available:true, available_city:'Lausanne',
                    available_from:null, available_until:null, available_modes:null,
                    account_type:'creator', invitations_this_week:0, created_at:'',
                    // Custom fields pour créateur
                    isCreator:true,
                    allowClutch: !isAnais, // Anaïs ne veut pas être clutchée pour la démo
                    creatorPhotos:[
                      'linear-gradient(135deg,#FF8C69,#FFD4A0)',
                      'linear-gradient(160deg,#2E8B57,#90EE90)',
                      'linear-gradient(135deg,#FF6B6B,#FFEAA7)',
                    ],
                    eventsHosted:['Yoga au bord du Léman','Atelier respiration'],
                  } as any)
                  setShowProfileSheet(true)
                }}
              />}

              {/* ── TAB : CLUTCHS — avec historique collapsible + fix effacer ── */}
              {tab==='clutchs' && (()=>{
                const isMock = clutches.length === 0
                const raw = isMock ? MOCK_CLUTCHES.map(c=>({...c,receiver_id:c.receiver_id==='me'?user.id:c.receiver_id,sender_id:c.sender_id==='me'?user.id:c.sender_id})) : clutches
                // Actifs = pending + confirmed non expirés
                const actifs = raw.filter((c:any)=>['pending','confirmed','accepted'].includes(c.status)&&new Date(c.expires_at||'9999')>new Date())
                // Historique = expired / declined / cancelled
                const hist = raw.filter((c:any)=>['declined','expired','cancelled'].includes(c.status)||new Date(c.expires_at||'0')<new Date())
                // Si effacé (mock ou réel), filtrer les IDs cachés localement
                const displayHist = (isMock && mockCleared) ? [] : hist.filter((c:any)=>!hiddenHistIds.has(c.id))
                const pending = actifs.filter((c:any)=>c.status==='pending').length
                return (
                <div className="fi" style={{position:'fixed',inset:0,bottom:72,background:C.bg,display:'flex',flexDirection:'column'}}>
                  <div style={{padding:'52px 16px 10px',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        <div style={{fontSize:19,fontWeight:900}}>My Clutches</div>
                        <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{pending} active · {actifs.length+displayHist.length} total</div>
                        {debugLog?<div style={{fontSize:9,color:'#ff0',fontFamily:'monospace',marginTop:4,wordBreak:'break-all'}}>{debugLog}</div>:null}
                      </div>
                      {displayHist.length>0&&<button onClick={()=>{
                        // Cache localement — pas de dépendance RLS, fonctionne toujours
                        const ids = new Set([...hiddenHistIds, ...displayHist.map((c:any)=>c.id)])
                        setHiddenHistIds(ids)
                        setMockCleared(true)
                        try { localStorage.setItem('clutch_mock_cleared','1') } catch {}
                        setShowHistory(false)
                        showToast('History cleared',C.whiteMid)
                      }} style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>🗑 Clear history</button>}
                    </div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0,padding:'8px 14px'}}>
                    {/* Mes inscriptions événements */}
                    {registeredEvents.size > 0 && (
                      <div style={{marginBottom:16,background:`${C.orange}0A`,border:`1px solid ${C.orange}33`,borderRadius:14,padding:'12px 14px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:10}}>
                          <span style={{fontSize:15}}>📅</span>
                          <span style={{fontSize:11,fontWeight:900,color:C.orange,letterSpacing:'.08em',textTransform:'uppercase'}}>My Events</span>
                          <span style={{marginLeft:'auto',fontSize:10,fontWeight:700,color:`${C.orange}88`,background:`${C.orange}15`,padding:'2px 7px',borderRadius:20}}>{registeredEvents.size}</span>
                        </div>
                        {MOCK_EVENTS.filter(ev=>registeredEvents.has(ev.id)).map(ev=>(
                          <div key={ev.id} onClick={()=>{setTab('evenements');setOpenEventId(ev.id)}}
                            style={{background:C.bgCard,border:`1px solid ${C.orange}22`,borderRadius:10,padding:'9px 12px',marginBottom:5,display:'flex',gap:10,alignItems:'center',cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
                            <span style={{fontSize:20,flexShrink:0}}>{ev.emoji}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:12,fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</div>
                              <div style={{fontSize:10,color:C.whiteMid}}>{ev.date} · {ev.time} · {(ev.lieu||'').split(',')[0]}</div>
                            </div>
                            <span style={{fontSize:11,color:`${C.orange}88`,flexShrink:0}}>→</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Séparateur clutchs personnels */}
                    {registeredEvents.size>0&&actifs.length>0&&(
                      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
                        <div style={{flex:1,height:1,background:C.border}}/>
                        <span style={{fontSize:10,fontWeight:900,color:C.salmon,letterSpacing:'.08em',textTransform:'uppercase',opacity:.7}}>⚡ My Clutches</span>
                        <div style={{flex:1,height:1,background:C.border}}/>
                      </div>
                    )}
                    {/* Clutchs actifs */}
                    {actifs.length===0&&registeredEvents.size===0&&<div style={{textAlign:'center',padding:'40px 20px',color:C.whiteMid}}><div style={{fontSize:28,marginBottom:8}}>⏳</div><div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:4}}>{t('clutchs.empty')}</div><div style={{fontSize:11}}>Send a clutch from the Nearby tab</div></div>}
                    {actifs.length===0&&registeredEvents.size>0&&<div style={{textAlign:'center',padding:'16px',color:C.whiteMid,fontSize:11,background:C.bgCard,borderRadius:12,border:`1px solid ${C.border}`}}>No active clutch right now</div>}
                    {actifs.map((c:any)=>{
                      const isRec=c.receiver_id===user.id
                      const other=isRec?c.sender:c.receiver
                      const msLeft = c.expires_at ? new Date(c.expires_at).getTime()-Date.now() : 0
                      const hLeft = Math.floor(msLeft/3600000)
                      const mLeft = Math.floor((msLeft%3600000)/60000)
                      const countdown = msLeft>0 ? (hLeft>0?`${hLeft}h${mLeft>0?`${mLeft}m`:''}`:`${mLeft}min`) : null
                      // localConfirmed override — contourne les latences/RLS Supabase
                      const effectiveStatus = localConfirmed.has(c.id) ? 'confirmed' : c.status
                      const isAccepted = effectiveStatus==='confirmed'||effectiveStatus==='accepted'
                      const isNewRec = !isAccepted && isRec && c.status==='pending'
                      const isSent = !isAccepted && !isRec && c.status==='pending'
                      const hasUnread = (unreadChats[c.id]||0) > 0
                      // Couleurs par état
                      const cardBorder = isAccepted ? `2px solid ${C.green}66`
                        : isNewRec ? `2px solid ${C.salmon}88`
                        : isSent ? `1px solid ${C.orange}55`
                        : `1px solid ${C.border}`
                      const cardBg = isAccepted ? `linear-gradient(135deg,${C.bgCard},${C.bordeaux}88)`
                        : isNewRec ? `linear-gradient(135deg,${C.bgCard},rgba(255,107,107,.06))`
                        : C.bgCard
                      const sc = isAccepted ? C.green : isNewRec ? C.salmon : C.orange
                      const sl = isAccepted ? 'Verrou' : isNewRec ? (countdown?`← ${countdown}`:'← Received') : (countdown?`→ ${countdown}`:'→ Sent')
                      return (
                        <div key={c.id} style={{background:cardBg,border:cardBorder,borderRadius:14,marginBottom:8,overflow:'hidden',position:'relative'}}>
                          {/* Barre colorée gauche selon type */}
                          <div style={{position:'absolute',left:0,top:0,bottom:0,width:4,borderRadius:'14px 0 0 14px',
                            background: isAccepted ? C.green : isNewRec ? C.salmon : isSent ? C.orange : 'transparent'}}/>
                          {/* Badge type flottant en haut à droite */}
                          {isNewRec && <div style={{position:'absolute',top:10,right:10,background:'#E8317A',borderRadius:20,padding:'3px 8px',display:'flex',alignItems:'center',gap:4,animation:'badgeUrgent 1.5s ease-in-out infinite',zIndex:2}}>
                            <span style={{fontSize:9,fontWeight:900,color:'#fff',letterSpacing:'.06em'}}>NEW</span>
                          </div>}
                          {isAccepted && hasUnread && <div style={{position:'absolute',top:10,right:10,background:'#4A90D9',borderRadius:12,padding:'2px 7px',zIndex:2}}>
                            <span style={{fontSize:9,fontWeight:900,color:'#fff'}}>{unreadChats[c.id]}</span>
                          </div>}
                          {isAccepted && !hasUnread && <div style={{position:'absolute',top:10,right:10,background:`${C.green}22`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'3px 8px',zIndex:2}}>
                            <span style={{fontSize:9,fontWeight:900,color:C.green}}>🔒 VERROU</span>
                          </div>}
                          {/* Badge EN ATTENTE retiré quand isSent — le bouton ✕ Annuler suffit */}
                          {/* Verrou actif → bannière photo pleine largeur */}
                          {isAccepted && (
                            <div onClick={()=>{if(other){setSelProfile(other);setShowProfileSheet(true)}}}
                              style={{position:'relative',height:88,background:`linear-gradient(135deg,${C.bordeaux},${C.bgSheet})`,cursor:'pointer',display:'flex',alignItems:'center',gap:14,padding:'0 14px'}}>
                              {/* Grande photo */}
                              <div style={{position:'relative',flexShrink:0}}>
                                <Av src={other?.photo_url} name={other?.name||'?'} size={64}/>
                                <div style={{position:'absolute',inset:0,borderRadius:'50%',border:`2.5px solid ${C.green}`,boxShadow:`0 0 12px ${C.green}66`}}/>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:3}}>
                                  <span style={{fontSize:11,fontWeight:900,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:10,padding:'1px 7px'}}>🔒 VERROU</span>
                                </div>
                                <div style={{fontSize:16,fontWeight:900,color:C.white}}>{other?.name||'?'}</div>
                                <div style={{fontSize:11,color:C.whiteMid,marginTop:1}}>{c.venue||'–'} · {c.proposed_time?new Date(c.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}):'–'}</div>
                              </div>
                              <span style={{fontSize:12,color:C.whiteMid,flexShrink:0}}>→ profile</span>
                            </div>
                          )}
                          <div style={{padding:'10px 13px'}}>
                          <div style={{display:'flex',gap:10,alignItems:'center'}}>
                            {/* Avatar cliquable → fiche profil (si pas verrou) */}
                            {!isAccepted && <div onClick={()=>{if(other){setSelProfile(other);setShowProfileSheet(true)}}} style={{cursor:'pointer',flexShrink:0}}>
                              <Av src={other?.photo_url} name={other?.name||'?'} size={38}/>
                            </div>}
                            <div style={{flex:1,minWidth:0}}>
                              {!isAccepted && <div onClick={()=>{if(other){setSelProfile(other);setShowProfileSheet(true)}}} style={{fontSize:13,fontWeight:700,cursor:'pointer'}}>
                                <span style={{color:isRec?GC.F:C.whiteMid}}>{isRec?'← From':'→ To'}</span>{' '}
                                <GenderSvg gk={genderKey(other?.gender)} size={13}/>{' '}
                                <span style={{textDecoration:'underline',textDecorationColor:`${C.salmon}55`}}>{other?.name||'?'}</span>
                              </div>}
                              {!isAccepted && <div style={{fontSize:11,color:C.whiteMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.venue||'–'} · {c.proposed_time?new Date(c.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}):'–'}</div>}
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                              {/* Countdown seul, sans doublon avec le badge top-right */}
                              {countdown&&!isAccepted&&<span style={{fontSize:10,fontWeight:700,color:sc}}>{isRec?'←':'→'} {countdown}</span>}
                              {/* Annuler clutch ENVOYÉ — compact, inline */}
                              {c.status==='pending'&&!isRec&&(
                                <button onClick={async()=>{
                                  if(!isMock) await supabase.from('clutches').update({status:'cancelled'}).eq('id',c.id)
                                  // Pénalité minimale même pour annulation anticipée (cancel_early = -2 pts)
                                  await applyPenalty('cancel_early')
                                  loadClutches()
                                }} title="Cancel (-2 pts)"
                                  style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                                  ✕ Cancel
                                </button>
                              )}
                            </div>
                          </div>
                          {/* Verrou confirmé → chat + annulation inline (pas de window.confirm = bloqué iOS PWA) */}
                          {isAccepted&&(
                            cancelConfirmId===c.id ? (
                              /* ── Confirmation inline pénalité ── */
                              <div style={{marginTop:8,background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',borderRadius:12,padding:'10px 12px'}}>
                                {(()=>{const reason=penaltyReasonFromTime(c.proposed_time);const p=getPenalty(reason);
                                  const level=Math.abs(p.pts)<=5?0:Math.abs(p.pts)<=10?1:Math.abs(p.pts)<=15?2:3;
                                  const colors=['#2DBD7E','#E27C00','#FF8C00','#ef4444'];const labels=['Low','Medium','High','Severe'];
                                  return(
                                  <>
                                    <div style={{fontSize:12,color:C.white,fontWeight:700,marginBottom:8}}>Cancel this Verrou?</div>
                                    <div style={{marginBottom:10}}>
                                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                                        <span style={{fontSize:13}}>{p.emoji}</span>
                                        <span style={{fontSize:11,color:C.whiteMid}}>Penalty</span>
                                        <span style={{fontSize:11,fontWeight:800,color:colors[level]}}>{labels[level]}</span>
                                      </div>
                                      <div style={{display:'flex',gap:3,height:6}}>
                                        {[0,1,2,3].map(i=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<=level?colors[level]:`${C.whiteMid}33`}}/>)}
                                      </div>
                                    </div>
                                    {getRecidiveMultiplier()>1&&(
                                      <div style={{fontSize:10,color:C.red,marginTop:4,textAlign:'center'}}>
                                        ×{getRecidiveMultiplier()} — {getCancelCount()}th late cancellation
                                      </div>
                                    )}
                                    <div style={{display:'flex',gap:8}}>
                                      <button onClick={async()=>{
                                        if(!isMock) await supabase.from('clutches').update({status:'cancelled'}).eq('id',c.id)
                                        setCancelConfirmId(null)
                                        await applyPenalty(reason)
                                        loadClutches()
                                      }} style={{flex:1,padding:'8px',background:C.red,border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                                        Yes, cancel
                                      </button>
                                      <button onClick={()=>setCancelConfirmId(null)}
                                        style={{flex:1,padding:'8px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:9,color:C.whiteMid,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                                        Keep the meetup
                                      </button>
                                    </div>
                                  </>
                                )})()}
                              </div>
                            ) : (
                              <div style={{display:'flex',gap:8,marginTop:8}}>
                                <button onClick={()=>{setChatClutch(c);setShowChat(true);setUnreadChats(prev=>{const n={...prev};delete n[c.id];return n})}}
                                  style={{flex:2,padding:'8px',background:`${C.green}14`,border:`1px solid ${C.green}44`,borderRadius:10,color:C.green,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                                  💬 Chat with {other?.name}
                                  {unreadChats[c.id]>0 && (
                                    <span style={{background:'#4A90D9',color:'#fff',fontSize:9,fontWeight:900,borderRadius:10,padding:'1px 5px',marginLeft:4}}>
                                      {unreadChats[c.id]}
                                    </span>
                                  )}
                                </button>
                                <button onClick={()=>setCancelConfirmId(c.id)}
                                  style={{flex:1,padding:'8px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,color:C.red,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                                  ✕ Cancel
                                </button>
                              </div>
                            )
                          )}
                          {effectiveStatus==='pending'&&isRec&&(
                            <div style={{display:'flex',gap:8,marginTop:10}}>
                              <button onClick={async()=>{
                                // 1. Marque comme confirmé LOCALEMENT (persiste même si RLS bloque)
                                setLocalConfirmed(prev=>new Set([...prev,c.id]))
                                setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,status:'confirmed'}:cl))
                                // 2. Animation immédiate
                                try { localStorage.setItem(`clutch_locked_at_${c.id}`, String(Date.now())); localStorage.setItem(`verrou_shown_${c.id}`, String(Date.now())) } catch {}
                                setVerrouData({venue:c.venue||'',name:other?.name||'',photo:other?.photo_url||null})
                                setShowVerrou(true)
                                // 3. Supabase (peut échouer si RLS — l'UI reste confirmée grâce à localConfirmed)
                                // SQL fix à coller dans Supabase Dashboard → SQL Editor :
                                // DROP POLICY IF EXISTS "receiver_can_confirm" ON clutches;
                                // CREATE POLICY "users_update_clutches" ON clutches FOR UPDATE
                                //   USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
                                //   WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
                                if(!isMock) {
                                  const {error} = await supabase.from('clutches').update({status:'confirmed', updated_at: new Date().toISOString()}).eq('id',c.id)
                                  if (error) showToast('⚠️ Verrou error: '+error.message, C.red)
                                  loadClutches()
                                }
                              }} style={{flex:1,padding:'9px',background:`${C.green}20`,border:`1px solid ${C.green}55`,borderRadius:10,color:C.green,fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>🔒 Lock in</button>
                              <button onClick={async()=>{
                                // Optimistic update immédiat
                                setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,status:'declined'}:cl))
                                if(!isMock) await supabase.from('clutches').update({status:'declined'}).eq('id',c.id)
                                showToast('Clutch declined',C.whiteMid)
                                loadClutches()
                              }} style={{flex:1,padding:'9px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,color:C.red,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>✕ Decline</button>
                            </div>
                          )}
                          </div>{/* fin padding 10px 13px */}
                        </div>
                      )
                    })}
                    {/* ── HISTORIQUE collapsible ── */}
                    {displayHist.length>0&&(
                      <div style={{marginTop:8}}>
                        <button onClick={()=>setShowHistory(v=>!v)}
                          style={{width:'100%',padding:'8px 12px',background:'rgba(255,255,255,.03)',border:`1px solid ${C.border}`,borderRadius:10,color:C.whiteMid,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                          <span>📁 History ({displayHist.length})</span>
                          <span>{showHistory?'▲':'▼'}</span>
                        </button>
                        {showHistory&&displayHist.map((c:any)=>{
                          const isRec=c.receiver_id===user.id
                          const other=isRec?c.sender:c.receiver
                          const sc=c.status==='declined'?C.red:C.whiteMid
                          const sl=c.status==='declined'?'✕ Declined':c.status==='cancelled'?'↩ Cancelled':'Expired'
                          return (
                            <div key={c.id} style={{background:C.bgCard,border:`1px solid rgba(255,255,255,.06)`,borderRadius:12,marginTop:4,padding:'9px 11px',opacity:.55,display:'flex',gap:10,alignItems:'center'}}>
                              <Av src={other?.photo_url} name={other?.name||'?'} size={30}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:11,fontWeight:600,color:C.whiteMid}}>{isRec?'↙':'↗'} {other?.name||'?'}</div>
                                <div style={{fontSize:10,color:'rgba(255,255,255,.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.venue||'–'}</div>
                              </div>
                              <span style={{fontSize:9,color:sc,whiteSpace:'nowrap'}}>{sl}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )
              })()}

              {/* ── TAB : PROFIL ── */}
              {tab==='profil' && (
                <ProfileTab
                  user={user} flow={flow} setFlow={setFlow}
                  signOut={signOut} setShowDelete={setShowDelete}
                  showToast={showToast} onUserUpdate={setUser}
                  lang={lang} setLang={setLang}
                  onSetAvailable={handleOuvrirFenetre}
                  isAvailable={!!(user as any).is_available}
                />
              )}

              {(()=>{
                // ── Calcul des badges par onglet ──────────────────────
                const allC = clutches as any[]
                const now = new Date()

                // Clutchs : reçus en attente (rouge 🔴) + msgs non lus
                // ── CLUTCHS — badge événementiel (s'efface quand onglet ouvert) ──
                // Nouveaux clutchs reçus arrivés APRÈS la dernière visite de l'onglet
                const pendingRec = allC.filter((c:any)=>
                  c.receiver_id===user.id && c.status==='pending' &&
                  new Date(c.expires_at||'9999')>now &&
                  new Date(c.created_at||0).getTime() > seenClutchsAt
                ).length
                // Verroux confirmés arrivés après dernière visite
                const newVerrou = allC.filter((c:any)=>
                  ['confirmed','accepted'].includes(c.status) &&
                  c.sender_id===user.id &&
                  new Date(c.updated_at||c.created_at||0).getTime() > seenClutchsAt
                ).length
                // Messages non lus (déjà gérés par unreadChats, s'effacent à l'ouverture du chat)
                const totalUnread = Object.values(unreadChats).reduce((a,b)=>a+(b as number),0)

                const clutchBadge: TabBadge =
                  pendingRec > 0 ? {type:'clutch-new', count:pendingRec}  // 🔴 priorité max
                  : totalUnread > 0 ? {type:'message', count:totalUnread} // 💬 messages
                  : newVerrou > 0 ? {type:'verrou'}                       // 🟢 verrou
                  : null  // rien si tout vu

                // ── ÉVÉNEMENTS — badge nouveaux events depuis dernière visite ──
                const newEvCount = MOCK_EVENTS.filter(ev=>
                  (ev as any)._addedAt ? (ev as any)._addedAt > seenEventsAt
                  : seenEventsAt === 0  // 1ère visite = tout est nouveau
                ).length
                // Fallback: si 1ère fois → montre le nb total, sinon rien si tout vu
                const evBadge: TabBadge = seenEventsAt === 0 && MOCK_EVENTS.length > 0
                  ? {type:'urgent', count: MOCK_EVENTS.length}
                  : newEvCount > 0 ? {type:'urgent', count: newEvCount}
                  : null

                // ── PRÉSENCES — pas de chiffre, juste vie/mort ──
                // Point vert = des gens sont dispo. Pas de nombre (c'est info, pas notif)
                const presenceBadge: TabBadge = profiles.length > 0 ? {type:'activity'} : null

                return <TabBar tab={tab} set={setTab} lang={lang}
                  badges={{clutchs: clutchBadge, evenements: evBadge, presences: presenceBadge}}/>
              })()}
            </>
          )}

          {/* Banner Verrou actif — top bar */}
          {flow==='app' && activeVerrou && !showVerrou && (
            <ActiveVerrouBar
              verrou={{...activeVerrou, my_id:user.id}}
              onClick={()=>setTab('clutchs')}
              lang={lang}
            />
          )}
          {/* Radar de proximité — overlay bottom, TOUTES pages, s'active <30min avant RDV */}
          {flow==='app' && activeVerrou && !showVerrou && (
            <ProximityRadar
              verrou={{...activeVerrou}}
              userId={user.id}
              lang={lang}
              onClick={()=>setTab('clutchs')}
            />
          )}

          {/* Modals */}
          {showProfileSheet&&selProfile&&user&&(()=>{
            // Cherche tout clutch actif (pending OU verrou) avec ce profil
            const withProfile = (clutches as any[]).filter((c:any)=>
              ['confirmed','accepted','pending'].includes(c.status) &&
              new Date(c.expires_at||'9999') > new Date() &&  // ignore expirés — permet de re-clutcher
              (c.sender_id===selProfile.id||c.receiver_id===selProfile.id)
            )
            const existingLock = withProfile.find((c:any)=>['confirmed','accepted'].includes(c.status))||null
            const pendingClutch = withProfile.find((c:any)=>c.status==='pending')||null
            return <ProfileSheet
              profile={selProfile} userId={user.id}
              onClutch={()=>{setShowProfileSheet(false);setShowSend(true)}}
              onClose={()=>setShowProfileSheet(false)} showToast={showToast}
              activeClutch={existingLock}
              pendingClutch={pendingClutch}
              onOpenChat={existingLock?()=>{setChatClutch(existingLock);setShowChat(true)}:undefined}
              userInterests={(user as any).interests||[]} lang={lang}/>
          })()}
          {showDelete&&user&&<DeleteModal userId={user.id} onDeleted={()=>{setShowDelete(false);setUser(null);setProfiles([]);setClutches([]);setScreen('login')}} onClose={()=>setShowDelete(false)} showToast={showToast}/>}
          {showFeedback&&feedbackClutch&&user&&<FeedbackSheet
            clutch={feedbackClutch} userId={user.id}
            onScore={async(delta)=>{
              const newScore = Math.max(0, Math.min(100, (userScore??user.reliability_score??80) + delta))
              setUserScore(newScore)
              setUser(prev=>prev?{...prev,reliability_score:newScore}:prev)
              try { await supabase.from('profiles').update({reliability_score:newScore}).eq('id',user.id) } catch {}
              if (delta>0) showToast(`🌟 +${delta} reliability pts → ${newScore}`, C.green)
              else showToast(`${delta} reliability pts → ${newScore}`, C.red)
            }}
            onClose={(rating)=>{
              setShowFeedback(false)
              setFeedbackClutch(null)
            }}
          />}
          {showSend&&selProfile&&<SendModal from={user} to={selProfile} fromTime={fromTime} untilTime={untilTime} onClose={()=>setShowSend(false)} onSent={(_clutchId)=>{
            setShowSend(false); setShowProfileSheet(false); setTab('presences'); setShowCelebration(true); loadClutches()
          }} showToast={showToast}/>}
          {showCelebration&&<ClutchSent onDone={()=>setShowCelebration(false)} name={selProfile?.name||''}/>}
          {showVerrou&&<VerrouExplosion onDone={onVerrouDone} verrou={verrouData}/>}
          {/* Feedback flottant — visible sur tous les onglets */}
          {!showAppFeedback && (
            <button onClick={()=>setShowAppFeedback(true)} style={{
              position:'fixed', bottom:'calc(env(safe-area-inset-bottom,0px) + 76px)', right:16,
              zIndex:1200, width:44, height:44, borderRadius:'50%',
              background:`linear-gradient(135deg,${C.bordeauxLight},${C.bordeaux})`,
              border:`1px solid ${C.border}`, boxShadow:'0 4px 16px rgba(0,0,0,.4)',
              fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            }} title="Donner un feedback">💬</button>
          )}
          {showAppFeedback && user && <AppFeedbackModal user={user} onClose={()=>setShowAppFeedback(false)} showToast={showToast}/>}
          {showChat&&chatClutch&&<ChatSheet clutch={chatClutch} userId={user.id} onClose={()=>setShowChat(false)} showToast={showToast} onMarkRead={(id)=>setUnreadChats(prev=>{const n={...prev};delete n[id];return n})}/>}
          {incomingClutch&&<ClutchIncoming clutch={incomingClutch}
            onAccept={()=>{
              if (incomingClutch.id?.startsWith('sim-')) {
                setVerrouData({venue:incomingClutch.venue||'Café Romand',name:incomingClutch.sender?.name||'',photo:incomingClutch.sender?.photo_url||null})
                setIncomingClutch(null)
                try { localStorage.setItem(`verrou_shown_${incomingClutch.id}`, String(Date.now())); localStorage.setItem(`clutch_locked_at_${incomingClutch.id}`, String(Date.now())) } catch {}
                setTimeout(()=>setShowVerrou(true),100)
              } else {
                supabase.from('clutches').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',incomingClutch.id).then(()=>{
                  setVerrouData({venue:incomingClutch.venue||'',name:incomingClutch.sender?.name||'',photo:incomingClutch.sender?.photo_url||null})
                  setIncomingClutch(null)
                  loadClutches()
                  try { localStorage.setItem(`verrou_shown_${incomingClutch.id}`, String(Date.now())); localStorage.setItem(`clutch_locked_at_${incomingClutch.id}`, String(Date.now())) } catch {}
                  setTimeout(()=>setShowVerrou(true),100)
                })
              }
            }}
            onDecline={()=>{
              if (!incomingClutch.id?.startsWith('sim-')) {
                supabase.from('clutches').update({status:'declined',updated_at:new Date().toISOString()}).eq('id',incomingClutch.id).then(()=>loadClutches())
              }
              setIncomingClutch(null)
              setClutches(prev=>(prev as any[]).filter(c=>c.id!==incomingClutch.id) as any)
            }}
            onLater={()=>setIncomingClutch(null)}
          />}
        </>
      )}
    </>
  )
}
