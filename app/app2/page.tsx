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
import { hap } from '@/lib/haptics'  // vibration native iOS/Android (confirmation des actions importantes)
import { haversineKm, eventKm, EV_PHOTO_POOL, eventPhotoFor, eventCat, evLieuDisplay, kmHeat } from '@/lib/events-helpers'
import { canRegisterEvent, eventMode, shouldNudgeGroupEvent } from '@/lib/clutch-states'  // refactor 23.06 : helpers purs extraits
import { CLUTCH_CONFIG } from '@/lib/clutch-config'  // tous les seuils réglables (zéro nombre magique)

const V = '0x198'  // Versionnage HEXADÉCIMAL. ~273e version. NB: le build Apple reste un entier dans pbxproj.
const BUILD = 148   // numéro de build Apple/TestFlight (= CURRENT_PROJECT_VERSION). À bumper avec V.
// Convention : on incrémente le numéro à chaque deploy (Z38 → Z39…). Quand le numéro
// approche 99, on passe à la lettre suivante et on repart à 1 (ex: Z99 → A1) pour ne
// jamais avoir de grands nombres pénibles à lire.

// ─── ID Mel (seuil GPS élargi pour les tests) ────────────────────
const MEL_ID = '9626a0ba-037f-49dd-9957-ebd37e58a864'

// ─── Sound Engine — Web Audio API (zéro fichier) ─────────────────
let _audioCtx: AudioContext | null = null
const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (!_audioCtx) _audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  if (_audioCtx.state === 'suspended') _audioCtx.resume()
  return _audioCtx
}

const Sounds = {
  // 🔒 Verrou confirmé — clic métallique + résonance grave
  verrou: () => {
    const ctx = getCtx(); if (!ctx) return
    // Click bruit blanc filtré
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * Math.exp(-i/(ctx.sampleRate*0.004))
    const src = ctx.createBufferSource(); src.buffer = buf
    const flt = ctx.createBiquadFilter(); flt.type='bandpass'; flt.frequency.value=600; flt.Q.value=2
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.7, ctx.currentTime)
    src.connect(flt); flt.connect(gn); gn.connect(ctx.destination); src.start()
    // Résonance basse
    const osc = ctx.createOscillator(); const og = ctx.createGain()
    osc.type='sine'; osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime+0.4)
    og.gain.setValueAtTime(0.4, ctx.currentTime+0.03)
    og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+1.0)
    osc.connect(og); og.connect(ctx.destination)
    osc.start(ctx.currentTime+0.03); osc.stop(ctx.currentTime+1.0)
  },
  // ⚡ Clutch reçu — double ping tendu
  clutch: () => {
    const ctx = getCtx(); if (!ctx) return
    ;[0, 0.12].forEach((delay, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type='sine'; osc.frequency.value = i===0 ? 880 : 1100
      g.gain.setValueAtTime(0.35, ctx.currentTime+delay)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+delay+0.25)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(ctx.currentTime+delay); osc.stop(ctx.currentTime+delay+0.25)
    })
  },
  // 📍 J'y suis — bip GPS net
  checkin: () => {
    const ctx = getCtx(); if (!ctx) return
    const osc = ctx.createOscillator(); const g = ctx.createGain()
    osc.type='sine'; osc.frequency.value=1047
    g.gain.setValueAtTime(0.4, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.18)
    osc.connect(g); g.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime+0.18)
  },
  // 💬 Message reçu — pop discret
  message: () => {
    const ctx = getCtx(); if (!ctx) return
    const osc = ctx.createOscillator(); const g = ctx.createGain()
    osc.type='sine'; osc.frequency.setValueAtTime(520, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime+0.08)
    g.gain.setValueAtTime(0.25, ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.12)
    osc.connect(g); g.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime+0.12)
  },
  // ✓ Feedback envoyé — ding satisfaisant
  done: () => {
    const ctx = getCtx(); if (!ctx) return
    ;[660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.type='sine'; osc.frequency.value=freq
      g.gain.setValueAtTime(0.3, ctx.currentTime+i*0.1)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+i*0.1+0.4)
      osc.connect(g); g.connect(ctx.destination)
      osc.start(ctx.currentTime+i*0.1); osc.stop(ctx.currentTime+i*0.1+0.4)
    })
  },
}

// ─── Palette — fond = splash (#542A44), cohérence totale ────────
// ── THÈME BLANC MEL (20.06.2026) — remap sémantique de C ──────────────────────
// bg=blanc · white=texte foncé · whiteMid/salmon=gris · bordeaux=prune (CTA/actif)
// orange=rose (accent) · green=vert Mel · border=gris clair.
const C = {
  bg:'#FFFFFF',          // fond principal (blanc pur)
  bgCard:'#FFFFFF',      // cartes : BLANC (design Mel — séparation par lignes #E3E3E3, pas par fond teinté). Vérifié sur ses PDF 20 juin.
  bgSheet:'#FFFFFF',     // bottom sheets : blanc pur (Mel)
  bordeaux:'#532943',    // prune — accent fort, CTA, onglet actif, ombres
  bordeauxLight:'#6E3A5C',
  salmon:'#6F6F6E', salmonFaint:'rgba(83,41,67,0.06)', salmonMid:'#B2B2B2',
  orange:'#EB6BAF', orangeFaint:'rgba(235,107,175,0.12)',
  white:'#4A2A3D', whiteMid:'#6F6F6E', whiteFaint:'rgba(83,41,67,0.05)',
  border:'#E3E3E3', borderStrong:'#B2B2B2',
  green:'#77BC1F', red:'#dc2626',
  gold:'#EB6BAF',
  // tokens additionnels thème blanc
  plum:'#532943', pink:'#EB6BAF', ink:'#6F6F6E', grayIcon:'#B2B2B2', onAccent:'#FFFFFF',
}

// ─── Config fiabilité — TOUTES les pondérations ici, jamais inline ─
const TRUST_CONFIG = {
  // Points positifs
  GPS_CHECKIN:           3,
  DOUBLE_POSITIVE:       2,  // les deux feedbacks positifs
  SINGLE_POSITIVE:       1,  // un seul côté a confirmé
  // Points négatifs
  NOSHOW_REPORTED:      -5,  // l'autre dit "absent"
  SELF_GHOST:           -3,  // s'autodéclare fantôme (honnêteté récompensée)
  LEFT_EARLY:           -4,  // venu·e puis reparti·e
  LATE_REPORTED:        -1,  // retard signalé >20min
  CANCEL_LATE:          -2,  // annulation <30min avant
  SILENCE_AUTO:         -1,  // aucun feedback après 24h (auto-close)
  // Soft gate — paliers
  GATE_WARN:             1,  // bannière douce
  GATE_ORANGE:           2,  // bannière orange + notif
  GATE_BLOCK:            3,  // bloque l'envoi de nouveau Clutch
  // GPS
  GPS_RADIUS_KM:       0.3,  // 300m
  // Feedback révélation
  REVEAL_DELAY_HOURS:    3,  // feedbacks cachés N heures
  AUTO_CLOSE_HOURS:     24,  // auto-close si silence total
  // Bayésien
  BAYES_FULL_AT:        10,  // poids = 1 quand rdv_count >= 10
  // Seuils de niveau
  LEVEL_FIABLE_MIN_RDV:   3,
  LEVEL_FIABLE_MIN_SCORE: 10,
  LEVEL_TRESFIABLE_MIN_RDV: 15,
  LEVEL_TRESFIABLE_MIN_SCORE: 30,
  LEVEL_EXEMPLAIRE_MIN_RDV: 25,
  LEVEL_EXEMPLAIRE_MIN_SCORE: 60,
  LEVEL_EXEMPLAIRE_MIN_GPS:   5,
  // Fenêtre bloquée autour d'un RDV (minutes avant + heures après)
  RDV_LOCK_BEFORE_MIN:       60,  // 60min avant = fenêtre RDV bloquée
  RDV_LOCK_AFTER_H:           2,  // 2h après = café/verre
} as const

// ─── Couleurs genre — cohérentes carte + liste ─────────────────
const GC = { F:'#FF6B9D', M:'#4FC3F7', X:'#B39DDB' } as const
type GenderKey = keyof typeof GC

// ─── Icône SVG monochrome de Mel, recolorée via CSS mask (teinte n'importe quelle couleur de SA palette) ───
function MelIcon({src,color,size=24}:{src:string;color:string;size?:number}) {
  return <span aria-hidden style={{display:'inline-block',width:size,height:size,backgroundColor:color,
    WebkitMaskImage:`url(${src})`,maskImage:`url(${src})`,
    WebkitMaskSize:'contain',maskSize:'contain' as any,
    WebkitMaskRepeat:'no-repeat',maskRepeat:'no-repeat' as any,
    WebkitMaskPosition:'center',maskPosition:'center' as any}}/>
}

// ─── Badges compte ─────────────────────────────────────────────
function getAccountBadge(profile: any): {label:string; color:string; emoji:string}|null {
  if (profile?.account_type === 'bot' || (profile?.id && ['38dda77a','6cf880cf','c504c886','074e38bb','b1e2cc39','df99921f'].some((p:string) => profile.id.startsWith(p))))
    return {label:'Bot', color:'#6B7280', emoji:'🤖'}
  if (['David','David Saugy'].includes(profile?.name||''))
    return {label:'Admin', color:'#F59E0B', emoji:'👑'}
  if (profile?.account_type === 'friend')
    return {label:'Friend', color:'#3B82F6', emoji:'💙'}
  if (profile?.account_type === 'driver')
    return {label:'Clutch Driver', color:'#FF5FA2', emoji:'✦'}  // CD rose — organisateur d'événements (différencier des membres)
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
  contacts: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23FFBF9E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E`,
  profil:'/icons/profil_couleur.svg',
}
function TabSvg({id, size=22, active, filter}:{id:string; size?:number; active:boolean; filter?:string}) {
  const src = TAB_ICONS[id]
  if (!src) return null
  return <img src={src} width={size} height={size} alt="" style={{display:'block', filter: filter ?? (active?'none':'brightness(0) invert(1) opacity(0.3)'), transition:'filter .2s'}}/>
}

// Logo Clutch officiel (SVG) — réutilisable (floating + footer profil)
function ClutchMark({ size=40 }:{ size?:number }) {
  return (
    <svg width={size} height={size*(205/258)} viewBox="103 127 258 205" aria-label="Clutch" style={{display:'block',filter:'drop-shadow(0 1px 1px rgba(44,16,32,.45)) drop-shadow(0 3px 6px rgba(44,16,32,.3))'}}>
      <polygon fill="#EB6BB0" points="174,294.9 181.3,287.6 181.8,267.3 146.5,267.3 "/>
      <polygon fill="#EB6BB0" points="207.4,223.5 246.4,222.5 253.6,215.3 246,207.7 207.8,207.7 "/>
      <path fill="#D76FA9" d="M249.4,229.1l13.9-13.9l-47.5-47.5L202,181.6l-1,42l-11.2,0.4l1.1-44.9c0-1.4,0.6-2.8,1.6-3.8l19.4-19.4c2.2-2.2,5.7-2.2,7.9,0l55.3,55.3c2.2,2.2,2.2,5.7,0,7.9l-19.4,19.4c-1,1-2.4,1.6-3.8,1.6L140.6,243l-13.9,13.9l47.5,47.5l13.9-13.9l1-41.7l11.2-0.2l-1.1,44.4c0,1.4-0.6,2.8-1.6,3.8l-19.4,19.4c-2.2,2.2-5.7,2.2-7.9,0l-55.3-55.3c-2.2-2.2-2.2-5.7,0-7.9l19.4-19.4c1-1,2.4-1.6,3.8-1.6L249.4,229.1z"/>
      <path fill="#EB6BB0" d="M338.1,215.6h-42.8v-42.8C318.9,172.8,338.1,192,338.1,215.6z"/>
      <path fill="#D76FA9" d="M301.2,154.7v-7.4h4.5c1.6,0,2.8-1.3,2.8-2.8v-9.3c0-1.6-1.3-2.8-2.8-2.8H285c-1.6,0-2.8,1.3-2.8,2.8v9.3c0,1.6,1.3,2.8,2.8,2.8h4.5v7.4c-16,1.5-30.2,9.2-40.2,20.7l8,8c9.2-10.8,22.8-17.7,38-17.7c27.5,0,49.8,22.4,49.8,49.8s-22.4,49.9-49.8,49.9c-15.8,0-29.9-7.4-39.1-19c-1.3,0.5-2.7,0.8-4.1,0.8l-9,0.2c10.8,17.5,30.1,29.3,52.2,29.3c33.7,0,61.2-27.4,61.2-61.2C356.5,183.8,332.2,157.6,301.2,154.7z"/>
      <path fill="#D76FA9" d="M346,173.3c1.1,1.1,2.9,1.1,4,0l3.9-3.9c1.1-1.1,1.1-2.9,0-4l-7.1-7.1c-1.1-1.1-2.9-1.1-4,0l-3.9,3.9c-1.1,1.1-1.1,2.9,0,4L346,173.3z"/>
    </svg>
  )
}

// ─── i18n — traductions FR/EN ─────────────────────────────────
type Lang = 'fr' | 'en'
const TR: Record<Lang, Record<string,string>> = {
  fr: {
    'tab.presences':'Présences','tab.events':'Événements','tab.clutchs':'Clutchs','tab.contacts':'Contacts','tab.profil':'Profil',
    'contacts.title':'Mes contacts','contacts.empty':'Aucun contact pour l\'instant','contacts.empty.sub':'Tes contacts apparaissent ici après un RDV réussi',
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
    'clutchs.clear':'🗑 Effacer historique','clutchs.empty':'Aucun clutch actif','clutchs.empty.sub':'Envoie un Clutch depuis l\'onglet Présences','clutchs.empty.events':'Aucun clutch actif pour l\'instant',
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
    'settings.account': 'Mon compte',
    'settings.avail': 'Disponibilité',
    'settings.avail.until': 'Jusqu\'à {time}',
    'settings.avail.off': 'Hors ligne',
    'settings.lang': 'Langue',
    'settings.lang.fr': 'Français',
    'settings.lang.en': 'English',
    'settings.notif': 'Notifications',
    'settings.notif.sub': 'Activer les alertes Clutch',
    'settings.notif.ok': 'Notifications activées 🔔',
    'settings.notif.later': 'Notifications disponibles sur iOS (bientôt)',
    'settings.hq': 'Clutch HQ',
    'settings.hq.sub': 'Tableau de bord interne',
    'settings.score': 'Mon score Clutch',
    'settings.reliability': 'Score fiabilité',
    'settings.cancels': 'Annulations',
    'settings.remove': 'Retirer ×',
    'settings.enable': 'Activer →',
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
    'ev.filter.all': 'Tout', 'ev.filter.partenaires':'Communauté', 'ev.filter.mine': 'Mes events', 'ev.filter.soir': 'Ce soir', 'ev.filter.demain': 'Demain',
    'ev.filter.sport': 'Sport', 'ev.filter.bienetre': 'Bien-être', 'ev.filter.culture': 'Culture',
    'ev.filter.gastro': 'Gastronomie', 'ev.filter.musique': 'Musique', 'ev.filter.parents': 'Parents',
    'ev.filter.evF': 'Entre femmes', 'ev.filter.evX': 'Mixte', 'ev.filter.groupe': 'Groupe',
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
    'tab.presences':'Nearby','tab.events':'Events','tab.clutchs':'Clutches','tab.contacts':'Contacts','tab.profil':'Profile',
    'contacts.title':'My contacts','contacts.empty':'No contacts yet','contacts.empty.sub':'Contacts appear here after a successful meetup',
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
    'clutchs.clear':'🗑 Clear history','clutchs.empty':'No active clutch','clutchs.empty.sub':'Send a clutch from the Nearby tab','clutchs.empty.events':'No active clutch right now',
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
    'ev.filter.all': 'All', 'ev.filter.partenaires':'Community', 'ev.filter.mine': 'My events', 'ev.filter.soir': 'Tonight', 'ev.filter.demain': 'Tomorrow',
    'ev.filter.sport': 'Sport', 'ev.filter.bienetre': 'Wellness', 'ev.filter.culture': 'Culture',
    'ev.filter.gastro': 'Food & Drink', 'ev.filter.musique': 'Music', 'ev.filter.parents': 'Parents',
    'ev.filter.evF': 'Women only', 'ev.filter.evX': 'Mixed', 'ev.filter.groupe': 'Group',
    'ev.by': 'by',
    'ev.notif.new': '◇ New Clutcher in your area',
    'settings.account': 'My account',
    'settings.avail': 'Availability',
    'settings.avail.until': 'Until {time}',
    'settings.avail.off': 'Offline',
    'settings.lang': 'Language',
    'settings.lang.fr': 'Français',
    'settings.lang.en': 'English',
    'settings.notif': 'Notifications',
    'settings.notif.sub': 'Enable Clutch alerts',
    'settings.notif.ok': 'Notifications enabled 🔔',
    'settings.notif.later': 'Notifications available on native iOS (soon)',
    'settings.hq': 'Clutch HQ',
    'settings.hq.sub': 'Internal dashboard',
    'settings.score': 'My Clutch score',
    'settings.reliability': 'Reliability score',
    'settings.cancels': 'Cancellations',
    'settings.remove': 'Remove ×',
    'settings.enable': 'Enable →',
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

type Screen   = 'splash' | 'login' | 'register' | 'onboarding' | 'setup' | 'main'
type AppFlow  = 'carte' | 'options' | 'app'  // flow une fois loggé
type MainTab  = 'presences' | 'evenements' | 'clutchs' | 'contacts' | 'profil'

// ─── Slots de temps — toutes les 5 minutes ───────────────────
function makeSlots(fromDate?: Date): string[] {
  const base = fromDate || new Date()
  const slots: string[] = []
  // ⏱️ STEP = 5 min POUR LE TEST (choix David : créneaux fins pour tester). VERSION FINALE = 15 min (quarts d'heure).
  // NB : le vrai souci d'UX = l'affichage en grille géante → à terme une MOLETTE/compact, pas une grille de 216 cases.
  const STEP = 5
  const rem = STEP - (base.getMinutes() % STEP)
  const start = new Date(base.getTime() + rem * 60_000)
  start.setSeconds(0, 0)
  for (let i = 0; i <= 216; i++) {  // 18h à 5min = 216 slots (test) ; final 15min = 72
    const t  = new Date(start.getTime() + i * STEP * 60_000)
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

  const active = C.pink  // valeur sélectionnée ALLUMÉE en ROSE (#EB6BAF, charte Mel ; plus d'orange = anti-orange)

  return (
    <div style={{ position:'relative', height:ITEM_H * 3, flex:1, minWidth:0 }}>
      {/* selection ring — contour GRIS MOYEN #B2B2B2 (design Mel 22.06 : roulettes en gris moyen ; chiffre actif rose) */}
      <div style={{
        position:'absolute', top:ITEM_H, left:4, right:4, height:ITEM_H,
        background:`${C.grayIcon}12`,
        border:`1.5px solid ${C.grayIcon}`,
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
// Distance entre deux points GPS en km (formule de Haversine)
// (haversineKm, eventKm, EV_PHOTO_POOL → extraits dans lib/events-helpers.ts)
// 🔔 Envoi d'une push à UN user (via Edge Function send-push → OneSignal). Centralisé ici pour que
// TOUS les déclencheurs (clutch, events, liste d'attente, annulation) passent par le même chemin.
// Silencieux si ça échoue (jamais bloquer une action métier à cause d'une notif).
function pushTo(userId: string|undefined|null, title: string, body: string, data: any = {}) {
  if (!userId) return
  try {
    supabase.functions.invoke('send-push', { body: { user_id: userId, title, body, data } })
      .then((r:any)=>{ try{ window.dispatchEvent(new CustomEvent('clutch:pushresult',{detail: r?.data ?? r?.error ?? r})) }catch{} })
      .catch((e:any)=>{ try{ window.dispatchEvent(new CustomEvent('clutch:pushresult',{detail:{error:String(e)}})) }catch{} })
  } catch {}
}
// (eventPhotoFor, eventCat, evLieuDisplay, kmHeat → extraits dans lib/events-helpers.ts)
// Chip « radar » : icône cible concentrique + km exact (clair) + couleur de proximité (cue rapide).
function KmRadar({km, big}:{km:number; big?:boolean}){
  const h=kmHeat(km); const v = km<10 ? km.toFixed(1) : String(Math.round(km))
  const r = big?14:12
  return <span style={{display:'inline-flex',alignItems:'center',gap:3,flexShrink:0,padding: big?'3px 9px 3px 6px':'2px 7px 2px 5px',borderRadius:20,background:h.bg,color:h.c,fontSize:big?11:10,fontWeight:800,letterSpacing:'-.01em'}}>
    <svg width={r} height={r} viewBox="0 0 24 24" fill="none" stroke={h.c} strokeWidth={1.9}><circle cx={12} cy={12} r={9}/><circle cx={12} cy={12} r={4.5}/><circle cx={12} cy={12} r={1.2} fill={h.c}/></svg>
    {v} km
  </span>
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
          radius:rm, fillColor:'#EB6BAF', fillOpacity:0.09,
          color:'transparent', opacity:0, weight:0, interactive:false, className:'clutch-fill',
        }).addTo(map)
        fillRef.current = fill
        // Couche 2 : halo rose Mel — visible mais doux (David : « on ne voit pas le rayon » → on remonte un peu)
        const halo = L.circle(ME, {
          radius:rm, fillColor:'transparent', fillOpacity:0,
          color:'#EB6BAF', opacity:0.20, weight:11,
          interactive:false, className:'clutch-halo',
        }).addTo(map)
        haloRef.current = halo
        // Couche 3 : bordure principale pointillée animée (rose Mel) — bien visible
        const circle = L.circle(ME, {
          radius:rm, fillColor:'transparent', fillOpacity:0,
          color:'#EB6BAF', opacity:1,
          weight:2.5, dashArray:'10,7',
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
            // Bot GPS hardcodé avec position fixe (_fixedLat/_fixedLng)
            if ((prof as any)._fixedLat && (prof as any)._fixedLng) {
              const [fLat, fLng] = fuzzPosition((prof as any)._fixedLat, (prof as any)._fixedLng, prof.id)
              starLat = fLat; starLng = fLng
            } else {
              const profIdShort = (prof.id||'').slice(0,8)
              const cfg = botCfg[profIdShort] || botCfg[prof.id]
              if (cfg) {
                const [fLat, fLng] = fuzzPosition(cfg.lat, cfg.lng, prof.id)
                starLat = fLat; starLng = fLng
              }
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
          ? `<img src="${userPhoto}" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:50%;object-fit:cover;border:2px solid #77BC1F;z-index:2;"/>`
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
            { enableHighAccuracy:true, timeout:10000, maximumAge:0 }
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
          {/* épingle prune (palette Mel). TODO: remplacer par Pin_RDVfixe de Mel une fois le viewBox recadré */}
          <div style={{width:26,height:26,borderRadius:'50% 50% 50% 0',background:C.bordeaux,
            transform:'rotate(-45deg)',boxShadow:'0 2px 6px rgba(83,41,67,.4)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <div style={{width:10,height:10,borderRadius:'50%',background:'#fff',transform:'rotate(45deg)'}}/>
          </div>
          <div style={{width:2,height:12,background:C.bordeaux,borderRadius:1,opacity:.6}}/>
          <div style={{marginTop:3,fontSize:9.5,fontWeight:800,color:'#fff',background:'rgba(83,41,67,.82)',borderRadius:10,padding:'2px 8px',whiteSpace:'nowrap'}}>Déplace la carte 👆</div>
        </div>
      )}
      {/* hint inside map removed — see carte overlay */}
      <style>{`
        .leaflet-container{background:${night?'#2A1E28':'#e8e0d8'}!important;}
        .leaflet-tile-pane{filter:${night?'brightness(1.55) contrast(0.88) saturate(0.5) hue-rotate(5deg)':'saturate(1.1) contrast(1.05)'};}
        /* Cercle rayon — ROSE Mel, bien visible (le CSS !important écrasait tout → rayon invisible, bug David) */
        .clutch-radius path{stroke:#EB6BAF!important;fill:transparent!important;stroke-width:2.5px!important;stroke-opacity:1!important;stroke-dasharray:10 7!important;transition:d .35s cubic-bezier(.22,1,.36,1);}
        .clutch-halo path{stroke:#EB6BAF!important;stroke-width:11px!important;stroke-opacity:.18!important;fill:transparent!important;display:block!important;}
        .clutch-fill path{fill:#EB6BAF!important;fill-opacity:.09!important;stroke:none!important;display:block!important;}
        .clutch-fill path{transition:d .35s cubic-bezier(.22,1,.36,1)!important;}
        /* étoiles 4 branches — vrai style étoile cristalline */
        .cs{
          width:${night?10:8}px;height:${night?10:8}px;
          background:var(--gc,#EB6BAF);
          clip-path:polygon(50% 0%,56% 44%,100% 50%,56% 56%,50% 100%,44% 56%,0% 50%,44% 44%);
          filter:drop-shadow(0 0 ${night?4:3}px var(--gc,#EB6BAF)) drop-shadow(0 0 ${night?8:5}px var(--gc,#EB6BAF88));
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
          border:1px solid rgba(83,41,67,.35);display:flex;align-items:center;
          justify-content:center;font-size:14px;backdrop-filter:blur(4px);}
        /* supernova */
        .sn-wrap{position:relative;width:60px;height:60px;}
        .sn-r{position:absolute;top:50%;left:50%;border-radius:50%;
          border:1.5px solid rgba(119,188,31,.85);
          transform:translate(-50%,-50%) scale(0);
          box-shadow:0 0 6px 2px rgba(119,188,31,.3);}
        .sn-r1{width:18px;height:18px;animation:snX 2.5s ease-out infinite 0s;}
        .sn-r2{width:18px;height:18px;animation:snX 2.5s ease-out infinite .83s;}
        .sn-r3{width:18px;height:18px;animation:snX 2.5s ease-out infinite 1.67s;}
        @keyframes snX{0%{transform:translate(-50%,-50%) scale(.15);opacity:1;}80%{opacity:.3;}100%{transform:translate(-50%,-50%) scale(3);opacity:0;}}
        .sn-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
          width:16px;height:16px;border-radius:50%;z-index:2;
          background:radial-gradient(circle at 35% 35%,#fff 0%,#77BC1F 55%,#B6E27A 100%);
          box-shadow:0 0 14px 5px rgba(119,188,31,.8),0 0 28px 10px rgba(119,188,31,.3);
          animation:snC 1.8s ease-in-out infinite;}
        @keyframes snC{0%,100%{box-shadow:0 0 14px 5px rgba(119,188,31,.8),0 0 28px 10px rgba(119,188,31,.3);}
          50%{box-shadow:0 0 20px 8px rgba(182,226,122,1),0 0 40px 14px rgba(119,188,31,.5);}}
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
        <defs><filter id="splashSh" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="5" dy="8" stdDeviation="3.5" flood-color="#160a12" flood-opacity="0.85"/></filter></defs>
        <g className="hb" filter="url(#splashSh)"><path fill="#EB6BB0" d="M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"/></g>
        <g className="ht"><polygon fill="#77BC1F" points="153.217,202.325 183.263,201.578 188.846,195.994 182.948,190.122 153.521,190.121"/></g>
        <g className="hb2"><polygon fill="#77BC1F" points="127.452,257.386 133.035,251.803 133.422,236.09 106.192,236.09"/></g>
        <g className="hc" filter="url(#splashSh)">
          <path fill="#D76FA9" d="M58.82,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C63.997,332.266,58.82,326.489,58.82,317.094z"/>
          <path fill="#D76FA9" d="M109.315,331.526h-18.87v-28.845h6.037v23.588h12.833V331.526z"/>
          <path fill="#D76FA9" d="M120.391,320.952c0,3.638,2.179,5.956,6.037,5.956c3.877,0,6.057-2.318,6.057-5.956v-18.271h6.036v18.891c0,6.396-4.697,10.693-12.093,10.693c-7.376,0-12.074-4.297-12.074-10.693v-18.891h6.037V320.952z"/>
        </g>
        <g className="htch" filter="url(#splashSh)">
          <path fill="#77BC1F" d="M152.555,331.526V307.84h-8.655v-5.158h23.348v5.158h-8.655v23.687H152.555z"/>
          <path fill="#77BC1F" d="M170.207,317.094c0-9.375,5.157-15.151,13.532-15.151c6.837,0,12.073,4.538,12.514,10.814h-5.877c-0.58-3.318-3.198-5.497-6.637-5.497c-4.537,0-7.355,3.758-7.355,9.834c0,6.077,2.818,9.855,7.376,9.855c3.458,0,6.057-2.039,6.636-5.217h5.877c-0.499,6.236-5.577,10.533-12.533,10.533C175.384,332.266,170.207,326.489,170.207,317.094z"/>
          <path fill="#77BC1F" d="M220.861,331.526v-12.054h-12.992v12.054h-6.037v-28.845h6.037v11.635h12.992v-11.635h6.037v28.845H220.861z"/>
        </g>
      </svg>
      <p className="htag" style={{fontFamily:'-apple-system,sans-serif',fontSize:12,fontWeight:600,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(235,107,176,0.85)',marginTop:10}}>Someone's waiting</p>
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
  return <button {...props} disabled={loading||props.disabled} style={{width:'100%',padding:'15px',background:p?C.plum:'transparent',color:p?C.onAccent:C.whiteMid,border:p?'none':`1px solid ${C.border}`,borderRadius:14,fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:loading?.7:1,...props.style}}>{loading?'…':children}</button>
}

function LoginScreen({onSuccess,onRegister,showToast}:{onSuccess:(p:Profile)=>void;onRegister:()=>void;showToast:(m:string,c?:string)=>void}) {
  const [email,setEmail]=useState(''); const [pass,setPass]=useState(''); const [loading,setLoading]=useState(false); const [showPwd,setShowPwd]=useState(false); const [status,setStatus]=useState('')
  const login=async()=>{
    if(loading)return
    setStatus('Connexion…'); setLoading(true)
    try {
      const em=email.trim().toLowerCase()
      if(!em||!pass){ setLoading(false); setStatus('❌ Entre ton email et ton mot de passe'); return }
      const{data,error}=await supabase.auth.signInWithPassword({email:em,password:pass})
      if(error){ setLoading(false); setStatus('❌ '+(error.message||'Email ou mot de passe incorrect')); return }
      const{data:p}=await supabase.from('profiles').select('*').eq('id',data.user.id).single()
      setLoading(false)
      if(p){ setStatus('✓ Connecté'); onSuccess(p) } else { setStatus('❌ Profil introuvable — recrée ton compte') }
    } catch(e:any){ setLoading(false); setStatus('❌ '+(e?.message||'Pas de connexion réseau')) }
  }
  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
      <div style={{width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:40}}>
          <div style={{fontSize:36,fontWeight:900,letterSpacing:'-.05em',color:C.pink,marginBottom:6}}>CLU<span style={{color:C.green}}>TCH</span></div>
          <div style={{fontSize:12,color:C.whiteMid,letterSpacing:'.15em',textTransform:'uppercase'}}>Welcome</div>
        </div>
        {/* Vrai <form> : submit fiable sur WebView iOS (le onClick seul ne déclenchait rien) + enregistrement mot de passe (autoComplete) */}
        <form onSubmit={e=>{e.preventDefault();login()}}>
        <Input label="Email" type="email" name="email" autoComplete="username" inputMode="email" autoCapitalize="none" autoCorrect="off" value={email} onChange={e=>setEmail(e.target.value)} placeholder="ton@email.com"/>
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:6}}>Password</div>
          <div style={{position:'relative'}}>
            <input type={showPwd?'text':'password'} name="password" autoComplete="current-password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'13px 44px 13px 14px',fontSize:15,color:C.white,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
            <button type="button" onClick={()=>setShowPwd(v=>!v)} style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:18,color:'rgba(255,255,255,.4)',padding:4,lineHeight:1}}>{showPwd?'🙈':'👁'}</button>
          </div>
        </div>
        <div style={{marginBottom:8}}><Btn type="submit" loading={loading}>Sign in</Btn></div>
        {status && <div style={{textAlign:'center',fontSize:12.5,marginBottom:10,fontWeight:700,color:status.startsWith('❌')?C.red:status.startsWith('✓')?C.green:C.salmon}}>{status}</div>}
        </form>
        <Btn variant="secondary" onClick={onRegister}>Create account</Btn>
        <div style={{textAlign:'center',marginTop:20,fontSize:11,color:C.whiteMid}}><a href="/" style={{color:C.salmon}}>← Clutch home</a></div>
        <div style={{textAlign:'center',marginTop:14,fontSize:10,color:'rgba(250,250,250,0.35)',lineHeight:1.6}}>
          By using Clutch, you agree to our{' '}
          <a href="/terms" style={{color:'#EB6BAF',textDecoration:'underline'}}>Terms</a>
          {' '}and{' '}
          <a href="/privacy" style={{color:'#EB6BAF',textDecoration:'underline'}}>Privacy Policy</a>
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
          <div style={{fontSize:36,fontWeight:900,letterSpacing:'-.05em',color:C.pink,marginBottom:6}}>CLU<span style={{color:C.green}}>TCH</span></div>
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
          <a href="/terms" style={{color:'#EB6BAF',textDecoration:'underline'}}>Terms</a>
          {' '}and our{' '}
          <a href="/privacy" style={{color:'#EB6BAF',textDecoration:'underline'}}>Privacy Policy</a>
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// COMPOSANTS UI
// ═════════════════════════════════════════════════════════════
function Toast({msg,color,onDone}:{msg:string;color:string;onDone:()=>void}) {
  const [translateY,setTranslateY]=useState(0)
  const [dismissed,setDismissed]=useState(false)
  const [dragging,setDragging]=useState(false)
  const startYRef=useRef(0)
  useEffect(()=>{const t=setTimeout(onDone,2000);return()=>clearTimeout(t)},[onDone])
  const isSuccess = color===C.green
  const isError = color===C.red
  const handleTouchStart=(e:React.TouchEvent)=>{
    startYRef.current=e.touches[0].clientY
    setDragging(true)
  }
  const handleTouchMove=(e:React.TouchEvent)=>{
    const dy=startYRef.current-e.touches[0].clientY
    if(dy>0) setTranslateY(Math.max(-120,Math.min(0,-dy)))
  }
  const handleTouchEnd=()=>{
    setDragging(false)
    if(translateY<-40){
      setDismissed(true)
      setTimeout(onDone,150)
    } else {
      setTranslateY(0)
    }
  }
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:9999,padding:'var(--sat) 12px 0',pointerEvents:'none'}}>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
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
          pointerEvents:'auto',
          transform:`translateY(${dismissed?-120:translateY}px)`,
          opacity: dismissed ? 0 : 1,
          transition: dismissed ? 'all .2s ease' : dragging ? 'none' : 'transform .15s ease',
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

// ─── Système de confiance — niveaux calculés ──────────────────
type TrustLevel = 'new' | 'reliable' | 'very_reliable' | 'exemplary'
function getTrustLevel(p: {trust_score?:number|null; rdv_count?:number|null; gps_checkin_count?:number|null; recent_noshows?:number|null}): TrustLevel {
  const score = p.trust_score ?? 0
  const rdv   = p.rdv_count ?? 0
  const gps   = p.gps_checkin_count ?? 0
  const noshow= p.recent_noshows ?? 0
  const bayesWeight = Math.min(1, rdv / TRUST_CONFIG.BAYES_FULL_AT)
  const effective = Math.round(score * bayesWeight)
  if (rdv >= TRUST_CONFIG.LEVEL_EXEMPLAIRE_MIN_RDV && effective >= TRUST_CONFIG.LEVEL_EXEMPLAIRE_MIN_SCORE && gps >= TRUST_CONFIG.LEVEL_EXEMPLAIRE_MIN_GPS && noshow === 0)
    return 'exemplary'
  if (rdv >= TRUST_CONFIG.LEVEL_TRESFIABLE_MIN_RDV && effective >= TRUST_CONFIG.LEVEL_TRESFIABLE_MIN_SCORE && noshow <= 1)
    return 'very_reliable'
  if (rdv >= TRUST_CONFIG.LEVEL_FIABLE_MIN_RDV && effective >= TRUST_CONFIG.LEVEL_FIABLE_MIN_SCORE)
    return 'reliable'
  return 'new'
}
function TrustBadge({profile, lang='fr', showCount=true}:{profile:any; lang?:Lang; showCount?:boolean}) {
  const level = getTrustLevel(profile)
  const rdv = profile.rdv_count ?? 0
  const map: Record<TrustLevel,{stars:string; label:string; color:string; bg:string}> = {
    new:          {stars:'◦',   label:lang==='en'?'New':'Nouveau',        color:'rgba(83,41,67,0.55)',  bg:'rgba(83,41,67,0.08)'},
    reliable:     {stars:'✦',   label:lang==='en'?'Reliable':'Fiable',    color:'#4FC3F7',                 bg:'rgba(79,195,247,0.10)'},
    very_reliable:{stars:'✦✦',  label:lang==='en'?'Very reliable':'Très fiable', color:'#2DBD7E',          bg:'rgba(45,189,126,0.10)'},
    exemplary:    {stars:'✦✦✦', label:lang==='en'?'Exemplary':'Exemplaire',color:'#77BC1F',                bg:'rgba(119,188,31,0.12)'},
  }
  const m = map[level]
  const countStr = rdv >= TRUST_CONFIG.LEVEL_FIABLE_MIN_RDV ? ` · ${rdv} RDV` : ''
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:4,background:m.bg,border:`1px solid ${m.color}55`,borderRadius:20,padding:'2px 9px',fontSize:10,fontWeight:700,color:m.color}}>
      {m.stars} {m.label}{showCount ? countStr : ''}
    </span>
  )
}

// Tab bar — uniquement en mode 'app'
type TabBadge =
  | {type:'clutch-new'; count:number}   // nouveau clutch reçu → rouge urgent
  | {type:'retard'}                     // retard 30min en attente de validation → rouge
  | {type:'message'; count:number}      // message non lu → bleu
  | {type:'verrou'}                     // verrou confirmé → vert pulse
  | {type:'urgent'; count:number}       // générique urgent → rose
  | {type:'activity'}                   // activité → orange dot
  | {type:'info'}                       // info → blanc dot
  | {type:'contact-msg'; count:number}  // message contact → orange dot
  | {type:'contact-new'}               // nouveau contact mutuel → vert pulse
  | null
function TabBar({tab,set,lang,badges,availInfo,onAvailClick}:{tab:MainTab;set:(t:MainTab)=>void;lang:Lang;badges?:Partial<Record<MainTab,TabBadge>>;availInfo?:{isAvail:boolean;until?:string;city?:string;rayon?:number};onAvailClick?:()=>void}) {
  const t = useT(lang)
  const tabs:[MainTab,string][]=[['presences',t('tab.presences')],['evenements',t('tab.events')],['clutchs',t('tab.clutchs')],['contacts',t('tab.contacts')],['profil',t('tab.profil')]]
  const [showAvailTooltip,setShowAvailTooltip]=useState(false)
  const isFr = lang!=='en'
  return (
    <>
      <style>{`
        @keyframes badgePulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.7}}
        @keyframes badgeUrgent{0%,100%{transform:scale(1)}20%{transform:scale(1.2)}40%{transform:scale(.95)}60%{transform:scale(1.1)}80%{transform:scale(.98)}}
      `}</style>
      {/* Tooltip disponibilité */}
      {showAvailTooltip&&availInfo&&(
        <div style={{position:'fixed',bottom:80,right:12,zIndex:2000,background:C.bgCard,border:`1px solid ${availInfo.isAvail?'rgba(34,197,94,.4)':C.border}`,borderRadius:16,padding:'14px 16px',minWidth:200,boxShadow:'0 8px 32px rgba(0,0,0,.5)'}}>
          <div style={{fontSize:11,fontWeight:800,color:availInfo.isAvail?'#22C55E':C.whiteMid,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:7,height:7,borderRadius:'50%',background:availInfo.isAvail?'#22C55E':'rgba(255,255,255,.3)',display:'inline-block',flexShrink:0}}/>
            {availInfo.isAvail?(isFr?'Tu es visible':'You\'re visible'):(isFr?'Tu es hors ligne':'You\'re offline')}
          </div>
          {availInfo.isAvail&&availInfo.until&&(
            <div style={{fontSize:12,color:C.white,marginBottom:4}}>🕐 {isFr?'Jusqu\'à':'Until'} {availInfo.until}</div>
          )}
          {availInfo.isAvail&&availInfo.city&&(
            <div style={{fontSize:12,color:C.white,marginBottom:10}}>📍 {availInfo.city}</div>
          )}
          {!availInfo.isAvail&&<div style={{fontSize:11,color:C.whiteMid,marginBottom:10}}>{isFr?'Ouvre un créneau pour apparaître':'Open a slot to appear'}</div>}
          <button onClick={()=>{setShowAvailTooltip(false);onAvailClick?.()}} style={{width:'100%',padding:'8px 0',borderRadius:10,background:`rgba(235,107,175,0.15)`,border:`1px solid rgba(235,107,175,0.3)`,color:C.orange,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
            {isFr?'Modifier →':'Change →'}
          </button>
          <div onClick={()=>setShowAvailTooltip(false)} style={{position:'fixed',inset:0,zIndex:-1}}/>
        </div>
      )}
      {/* Barre d'onglets — design clair (fond blanc cassé + cercles + pastille active violette).
          Transitoire : le reste de l'app passera au clair avec les couleurs de Mel. */}
      <div style={{position:'fixed',bottom:0,left:0,right:0,height:'calc(72px + var(--sab))',paddingBottom:'var(--sab)',boxSizing:'border-box',background:'rgba(255,255,255,0.97)',borderTop:'1px solid #E3E3E3',backdropFilter:'blur(18px)',display:'flex',zIndex:1000}}>
        {tabs.map(([id,label])=>{
          const badge = badges?.[id] ?? null
          const isActive = tab===id
          const isProfil = id==='profil'
          const dotBase: React.CSSProperties = {position:'absolute',top:-2,right:-2,width:11,height:11,borderRadius:'50%',border:'2px solid #fff',zIndex:2}
          return (
            <button key={id} onClick={()=>{setShowAvailTooltip(false);set(id)}} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',gap:2,border:'none',background:'transparent',cursor:'pointer',padding:'8px 0 0',position:'relative'}}>
              <div style={{position:'relative',width:51,height:51,display:'flex',alignItems:'center',justifyContent:'center'}}>
                <img src={`/icons/mel/${({presences:'Presence',evenements:'Agenda',clutchs:'Clutch',contacts:'Contact',profil:'Profil'} as Record<string,string>)[id]}_${isActive?'ON':'OFF'}.svg`} width={51} height={51} alt="" style={{display:'block',filter:'drop-shadow(0 1px 1px rgba(120,115,125,.45)) drop-shadow(0 3px 6px rgba(120,115,125,.35))'}}/>
                {/* Pastille dispo sur Profil */}
                {isProfil&&availInfo&&(
                  <div onClick={e=>{e.stopPropagation();setShowAvailTooltip(v=>!v)}} style={{position:'absolute',top:-2,right:-2,width:13,height:13,borderRadius:'50%',background:availInfo.isAvail?'#22C55E':'rgba(0,0,0,.22)',border:'2px solid #fff',zIndex:3,boxShadow:availInfo.isAvail?'0 0 7px rgba(34,197,94,.8)':'none',cursor:'pointer'}}/>
                )}
                {/* Badge — différencié par type */}
                {badge && (()=>{
                  if(badge.type==='retard') return <div style={{...dotBase,background:'#EF4444',animation:'badgeUrgent 1s ease-in-out infinite',boxShadow:'0 0 8px rgba(239,68,68,.9)'}}/>
                  if(badge.type==='clutch-new'||badge.type==='urgent') return <div style={{...dotBase,background:'#FF1493',animation:'badgeUrgent 1s ease-in-out infinite',boxShadow:'0 0 8px rgba(255,20,147,.9)'}}/>
                  if(badge.type==='message') return <div style={{...dotBase,background:'#00B0FF',animation:'badgePulse 2s ease-in-out infinite',boxShadow:'0 0 7px rgba(0,176,255,.85)'}}/>
                  if(badge.type==='verrou') return <div style={{...dotBase,background:'#22C55E',animation:'badgePulse 1.5s ease-in-out infinite',boxShadow:'0 0 6px rgba(34,197,94,.6)'}}/>
                  if(badge.type==='contact-msg') return <div style={{...dotBase,background:'#EB6BAF',animation:'badgePulse 1.5s ease-in-out infinite',boxShadow:'0 0 7px rgba(235,107,175,.85)'}}/>
                  if(badge.type==='contact-new') return <div style={{...dotBase,background:'#22C55E',animation:'badgePulse 1.5s ease-in-out infinite',boxShadow:'0 0 8px rgba(34,197,94,.8)'}}/>
                  return null
                })()}
              </div>
              <div style={{fontSize:9,fontWeight:isActive?800:600,color:isActive?'#EB6BAF':'rgba(0,0,0,0.42)',letterSpacing:id==='clutchs'?'.04em':0,maxWidth:'100%',whiteSpace:'nowrap',overflow:'visible',textAlign:'center'}}>{id==='clutchs'?label.toUpperCase():label}</div>
            </button>
          )
        })}
      </div>
      {/* Version — pastille LISIBLE en bas à gauche (hex + décimal), flottante au-dessus de la nav, sur toutes les pages */}
      <div style={{position:'fixed',left:9,bottom:'calc(72px + var(--sab) + 6px)',zIndex:1001,fontSize:10.5,fontWeight:800,color:'rgba(83,41,67,.72)',background:'rgba(255,255,255,.85)',border:'1px solid rgba(83,41,67,.12)',borderRadius:9,padding:'2px 8px',pointerEvents:'none',letterSpacing:'.03em',backdropFilter:'blur(6px)',boxShadow:'0 1px 5px rgba(83,41,67,.12)'}}>{V} · build {BUILD}</div>
    </>
  )
}

// Modal suppression compte
function DeleteModal({userId,onDeleted,onClose,showToast,lang='fr'}:{userId:string;onDeleted:()=>void;onClose:()=>void;showToast:(m:string,c?:string)=>void;lang?:Lang}) {
  const EN = lang==='en'
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
      showToast(EN?'✓ Account deleted. See you!':'✓ Compte supprimé. À bientôt !', C.green)
      onDeleted()
    } catch {
      showToast(EN?'Error — try again':'Erreur — réessaie', C.red)
      setStep('warn')
    }
  }
  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.75)',backdropFilter:'blur(6px)'}} onClick={step==='doing'?undefined:onClose}/>
      <div style={{position:'relative',background:C.bg,borderRadius:'20px 20px 0 0',padding:'24px 20px 48px',animation:'modalIn .4s cubic-bezier(.22,1,.36,1)'}}>
        {step==='doing'?<div style={{textAlign:'center',padding:'30px 0'}}><div style={{fontSize:32,marginBottom:12}}>⏳</div><div style={{fontSize:14,color:C.whiteMid}}>{EN?'Deleting…':'Suppression…'}</div></div>
        :step==='warn'?<><div style={{fontSize:18,fontWeight:900,color:C.red,marginBottom:8}}>🗑 {EN?'Delete my account':'Supprimer mon compte'}</div><div style={{fontSize:13,color:C.whiteMid,lineHeight:1.6,marginBottom:20}}>{EN?<>This action is <strong style={{color:C.white}}>irreversible</strong>. All your data will be erased (Swiss LPD).</>:<>Cette action est <strong style={{color:C.white}}>irréversible</strong>. Toutes tes données seront effacées (LPD suisse).</>}</div><button onClick={()=>setStep('type')} style={{width:'100%',padding:'13px',background:'rgba(239,68,68,.12)',border:'1.5px solid rgba(239,68,68,.4)',borderRadius:12,color:C.red,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>{EN?'Continue →':'Continuer →'}</button><button onClick={onClose} style={{width:'100%',padding:'13px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:12,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>{EN?'Cancel':'Annuler'}</button></>
        :<><div style={{fontSize:16,fontWeight:900,color:C.red,marginBottom:8}}>{EN?'Final confirmation':'Confirmation finale'}</div><div style={{fontSize:13,color:C.whiteMid,marginBottom:16}}>{EN?<>Type <strong style={{color:C.white}}>DELETE</strong> :</>:<>Tape <strong style={{color:C.white}}>SUPPRIMER</strong> :</>}</div><input value={typed} onChange={e=>setTyped(e.target.value.toUpperCase())} placeholder={EN?'DELETE':'SUPPRIMER'} style={{width:'100%',background:'rgba(239,68,68,.08)',border:`1.5px solid ${typed===(EN?'DELETE':'SUPPRIMER')?C.red:'rgba(255,255,255,.1)'}`,borderRadius:12,padding:'13px 14px',fontSize:16,fontWeight:800,letterSpacing:'.1em',color:C.red,outline:'none',fontFamily:'inherit',caretColor:C.red,marginBottom:16}}/><button onClick={doDelete} disabled={typed!==(EN?'DELETE':'SUPPRIMER')} style={{width:'100%',padding:'14px',background:typed===(EN?'DELETE':'SUPPRIMER')?C.red:'rgba(239,68,68,.12)',border:'none',borderRadius:12,color:typed===(EN?'DELETE':'SUPPRIMER')?'#fff':'rgba(239,68,68,.4)',fontSize:14,fontWeight:900,cursor:typed===(EN?'DELETE':'SUPPRIMER')?'pointer':'default',fontFamily:'inherit',marginBottom:10}}>🗑 {EN?'Delete permanently':'Supprimer définitivement'}</button><button onClick={onClose} style={{width:'100%',padding:'13px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:12,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>{EN?'Cancel':'Annuler'}</button></>}
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
  'gpsbotma', // Max GPS Test (Morges)
]
function isTestProfile(id: string): boolean { return TEST_PROFILE_PREFIXES.some(p => id.startsWith(p)) }
// 🤖 Mode Démo (bots/mock visibles) ON par défaut · '0' = Réel (app vide pour tester avec de vrais amis). Lisible partout.
function demoOn(): boolean { try { return localStorage.getItem('clutch_demo_mode') !== '0' } catch { return true } }
const ADMIN_IDS = ['bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864']
function isAdminId(id?: string | null): boolean { return !!id && ADMIN_IDS.includes(id) }

// ── VÉNÉRITUDE (brain-dump David) — le « thermostat d'engueulade » : 0=Doux … 3=Trash.
// Le curseur (Profil > Geek) règle le TON des messages système, surtout quand tu crées un illogisme
// (chevauchement absurde, trajet à la vitesse de la lumière…). À 0 : neutre/doux. Vers la droite : ça chauffe 🔥.
const VENERITUDE = [
  { key:'doux',   label:'Doux',   emoji:'😌', flames:1, color:'#7FC8A9' },
  { key:'taquin', label:'Taquin', emoji:'😏', flames:2, color:'#E0A100' },
  { key:'drole',  label:'Drôle',  emoji:'😂', flames:3, color:'#E27C00' },
  { key:'trash',  label:'Trash',  emoji:'🔥', flames:4, color:'#E8317A' },
] as const
// Choisit la variante selon le niveau (0..3). v = { soft, taquin, drole, trash }.
function vibe(level: number, v: { soft: string; taquin: string; drole: string; trash: string }): string {
  return [v.soft, v.taquin, v.drole, v.trash][Math.max(0, Math.min(3, level | 0))]
}
function getVeneritude(): number { try { return Math.max(0, Math.min(3, parseInt(localStorage.getItem('clutch_veneritude') || '0') || 0)) } catch { return 0 } }

// ── MOODS PERSONNAGE (brain-dump David) — une « voix » qui appose une signature contextuelle.
// Compose avec la vénéritude (qui règle la dureté) ; le personnage donne la couleur (scientifique, philo, psy…).
const PERSONAS = [
  { key:'off',   label:'Aucune', emoji:'🙂', tag:'voix neutre' },
  { key:'tesla', label:'Tesla',  emoji:'⚡', tag:'le génie électrique' },
  { key:'philo', label:'Le Sage', emoji:'🦉', tag:'philosophe' },
  { key:'psy',   label:'Coach',  emoji:'🧠', tag:'confrontant bienveillant' },
] as const
function getPersona(): string { try { return localStorage.getItem('clutch_persona') || 'off' } catch { return 'off' } }
// Tirage aléatoire (les phrases ne doivent JAMAIS être les mêmes — exigence David ; à terme : génération IA).
function pick<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)] }

// ROAST « trajet infaisable » — POOLS par niveau de vénéritude. det=true → variante stable (pour l'aperçu).
function roastInfeasible(level: number, lang: 'fr'|'en', rk: number, rn: number, rg: number, det = false): string {
  const L = Math.max(0, Math.min(3, level))
  const fr = [
    [ `🔴 Trajet infaisable : ~${rk} km ≈ ${rn} min de route pour ${rg} min entre tes 2 créneaux. Revois l'horaire.`,
      `🔴 ~${rk} km à couvrir en ${rg} min, c'est trop court (~${rn} min nécessaires). Ajuste un créneau.` ],
    [ `🔴 Hum… ${rk} km en ${rg} min ? Même en trottinette c'est chaud 😏 Décale un créneau.`,
      `🔴 ${rk} km, ${rg} min… t'as un jetpack ? Sinon revois l'horaire 😏` ],
    [ `🔴 ${rk} km en ${rg} min ? Faut te téléporter, et on n'a pas (encore) la techno 🚀 Bouge un créneau.`,
      `🔴 ${rk} km en ${rg} min : à ce rythme t'es une comète 🌠 Décale, terrien.` ],
    [ `🔴 ${rk} km en ${rg} min ?! T'es en Formule 1 ou t'as bu ? IM-PO-SSIBLE, champion. Revois ton horaire 🧠🔥`,
      `🔴 Sérieux ? ${rk} km en ${rg} min. La physique a appelé, elle est vénère. Corrige ça 🔥` ],
  ]
  const en = [
    [ `🔴 Unfeasible trip: ~${rk} km ≈ ${rn} min by road for ${rg} min between your 2 slots. Adjust the time.`,
      `🔴 ~${rk} km in ${rg} min is too tight (~${rn} min needed). Tweak a slot.` ],
    [ `🔴 Uh… ${rk} km in ${rg} min? Even on a scooter that's a stretch 😏 Shift a slot.`,
      `🔴 ${rk} km, ${rg} min… got a jetpack? Otherwise fix the time 😏` ],
    [ `🔴 ${rk} km in ${rg} min? You'd need teleportation, we don't have it (yet) 🚀 Move a slot.`,
      `🔴 ${rk} km in ${rg} min: at that pace you're a comet 🌠 Reschedule, earthling.` ],
    [ `🔴 ${rk} km in ${rg} min?! Are you in an F1 car? Physically IMPOSSIBLE, champ. Fix it 🧠🔥`,
      `🔴 Seriously? ${rk} km in ${rg} min. Physics called, it's mad. Fix that 🔥` ],
  ]
  const pool = (lang === 'fr' ? fr : en)[L]
  return det ? pool[0] : pick(pool)
}

// PERSONA quips — POOLS (pick aléatoire). À terme : génération IA selon contexte/niveau/personnage.
function personaQuip(key: string, ctx: string, lang: 'fr'|'en', det = false): string {
  if (key === 'off' || !key) return ''
  const Q: Record<string, Record<string, { fr: string[]; en: string[] }>> = {
    infeasible_trip: {
      tesla: { fr: [ '⚡ Tesla : même mes bobines ne te téléporteront pas — le temps n\'est pas si élastique.', '⚡ Tesla : j\'ai dompté la foudre, pas l\'espace-temps. Décale.' ],
               en: [ '⚡ Tesla: not even my coils will teleport you — time isn\'t that elastic.', '⚡ Tesla: I tamed lightning, not space-time. Reschedule.' ] },
      philo: { fr: [ '🦉 « Vouloir être en deux lieux à la fois, c\'est n\'être nulle part. »', '🦉 « La hâte est mère de l\'erreur. » Honore un seul lieu.' ],
               en: [ '🦉 "To wish to be in two places at once is to be nowhere."', '🦉 "Haste is the mother of error." Honor one place.' ] },
      psy:   { fr: [ '🧠 Tu t\'imposes l\'impossible — qu\'est-ce que tu fuis ? Choisis UN lieu, respire.', '🧠 Vouloir tout, c\'est se disperser. Un plan, pleinement. Le reste attendra.' ],
               en: [ '🧠 You\'re setting yourself up to fail — what are you avoiding? Pick ONE place, breathe.', '🧠 Wanting it all scatters you. One plan, fully. The rest can wait.' ] },
    },
  }
  const pool = Q[ctx]?.[key]?.[lang]
  if (!pool || !pool.length) return ''
  return det ? pool[0] : pick(pool)
}

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
  // ─── BOT GPS DE TEST — position fixe Morges Gare ─────────────
  'gpsbotma': { name:'Max 🛰️', photo_url:'https://randomuser.me/api/portraits/men/77.jpg', bio:'Bot de test GPS — positionné à Morges Gare 📍', job:'Test Bot', age:30, neighborhood:'Morges', interests:['Test','GPS','Clutch'], languages:['Français'], extraPhotos:[], lastSeen:'à l\'instant', verified:true },
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

function SlotGoneOverlay({name, avatar, lang, onDone}:{name:string;avatar?:string;lang?:Lang;onDone:()=>void}) {
  const isFr = lang !== 'en'
  const msgs = isFr
    ? ['Dommage… son créneau vient d\'expirer.','Ça arrive ! Retente quand tu la vois disponible.','Parfois l\'occasion passe vite. La prochaine sera la bonne !']
    : ['Too bad… their slot just expired.','It happens! Try again when they\'re available.','Sometimes timing is everything. Next one\'s yours!']
  const msg = msgs[Math.floor(Date.now()/1000)%msgs.length]
  const firstName = name?.split(' ')[0] || (isFr?'Cette personne':'This person')
  useEffect(()=>{ const t=setTimeout(onDone,3800); return ()=>clearTimeout(t) },[onDone])
  return (
    <div onClick={onDone} style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'rgba(20,5,15,0.88)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',animation:'fadeIn .25s ease'}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:360,background:'linear-gradient(160deg,#3a1828 0%,#251018 100%)',borderRadius:28,padding:'36px 28px 32px',border:`1px solid rgba(235,107,175,0.18)`,boxShadow:'0 24px 64px rgba(0,0,0,0.6)',display:'flex',flexDirection:'column',alignItems:'center',gap:20,textAlign:'center'}}>
        {/* Avatar avec croix */}
        <div style={{position:'relative',width:80,height:80}}>
          {avatar
            ? <img src={avatar} style={{width:80,height:80,borderRadius:'50%',objectFit:'cover',opacity:0.55,filter:'grayscale(40%)'}}/>
            : <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(83,41,67,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>👤</div>
          }
          <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'2px solid rgba(235,107,175,0.35)'}}/>
          <div style={{position:'absolute',bottom:-4,right:-4,width:28,height:28,borderRadius:'50%',background:'#3a1828',border:`2px solid rgba(235,107,175,0.3)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>⏱</div>
        </div>
        {/* Message principal */}
        <div>
          <div style={{fontSize:17,fontWeight:800,color:'#f5e8de',marginBottom:6,lineHeight:1.3}}>
            {isFr?`${firstName} n'est plus disponible`:`${firstName} is no longer available`}
          </div>
          <div style={{fontSize:13,color:'rgba(83,41,67,0.65)',lineHeight:1.5}}>{msg}</div>
        </div>
        {/* Barre de progression auto-close */}
        <div style={{width:'100%',height:3,borderRadius:2,background:'rgba(255,255,255,0.08)',overflow:'hidden'}}>
          <div style={{height:'100%',borderRadius:2,background:'rgba(235,107,175,0.5)',animation:'shrink 3.8s linear forwards'}}/>
        </div>
        <button onClick={onDone} style={{width:'100%',padding:'13px 0',borderRadius:14,background:'rgba(235,107,175,0.12)',border:`1px solid rgba(235,107,175,0.25)`,color:'C.gold',fontSize:14,fontWeight:700,cursor:'pointer',letterSpacing:'.04em'}}>
          {isFr?'Voir les présences →':'See who\'s available →'}
        </button>
      </div>
      <style>{`@keyframes shrink{from{width:100%}to{width:0%}}@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
    </div>
  )
}

function SendModal({from,to,onClose,onSent,showToast,fromTime,untilTime,lang,onTargetUnavailable,excludeWindow}:{
  from:Profile;to:Profile;onClose:()=>void;onSent:(clutchId?:string)=>void;showToast:(m:string,c?:string)=>void;
  fromTime?:string;untilTime?:string;lang?:Lang;onTargetUnavailable?:()=>void;
  excludeWindow?:{fromHH:string;untilHH:string}; // créneaux à exclure (RDV en cours de l'envoyeur)
}) {
  const t = useT(lang||'fr')
  const [msg,setMsg]=useState(''); const [loading,setLoading]=useState(false)
  const [isQuickDate,setIsQuickDate]=useState(false)

  // ── Slots horaires : intersection fenêtre sender ∩ receiver, moins le RDV en cours ──
  const allSlots = useMemo(() => makeSlots(), [])
  const slots = useMemo(() => {
    const sFrom  = fromTime||'00:00', sUntil = untilTime||'23:30'
    const toFrom = (to as any).available_from ? new Date((to as any).available_from).toTimeString().slice(0,5) : '00:00'
    const intFrom = sFrom > toFrom ? sFrom : toFrom
    // Gestion minuit : si sUntil < sFrom, la fenêtre passe minuit (ex: 23:00–01:30)
    const crossMidnight = sUntil < sFrom
    const filtered = allSlots.filter(s => crossMidnight ? (s >= intFrom || s <= sUntil) : (s >= intFrom && s <= sUntil))
    const base = filtered.length >= 2 ? filtered : allSlots.filter(s => s >= intFrom).slice(0,8)
    // Exclure les créneaux qui tombent dans la fenêtre RDV active de l'envoyeur
    if (!excludeWindow) return base
    return base.filter(s => s < excludeWindow.fromHH || s > excludeWindow.untilHH)
  }, [allSlots, fromTime, untilTime, to, excludeWindow])
  const H = slots.length ? slots : allSlots.slice(2,10)
  const [hi,setHi]=useState(Math.min(2, H.length-1))

  // ── Nominatim OpenStreetMap — recherche de lieux ──
  const SUGGESTIONS=['Café Romand','Terrasse Ouchy','Pont Bessières','Parc de Milan','Place de la Riponne','Bar du Flon','Escaliers du Marché','Tour de Sauvabelin']
  const [venueInput,setVenueInput]=useState('')
  const [venueAddress,setVenueAddress]=useState<string|null>(null) // adresse complète sélectionnée
  const [venueLat,setVenueLat]=useState<number|null>(null)
  const [venueLng,setVenueLng]=useState<number|null>(null)
  const [nominatimResults,setNominatimResults]=useState<any[]>([])
  const [showSugg,setShowSugg]=useState(false)
  const [searchLoading,setSearchLoading]=useState(false)
  const [venueError,setVenueError]=useState(false)
  const nominatimTimer=useRef<ReturnType<typeof setTimeout>|null>(null)

  const searchNominatim=async(q:string)=>{
    if (q.length < 3) { setNominatimResults([]); return }
    setSearchLoading(true)
    try {
      // viewbox centré Suisse romande — priorité locale, mais pas limitée (bounded=0)
      const resp=await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&viewbox=6.0,47.0,7.2,46.0&bounded=0`,
        { headers:{'Accept-Language':lang==='fr'?'fr':'en','User-Agent':'Clutch/1.0 (clutch.lausanne)'} }
      )
      const data=await resp.json()
      setNominatimResults(data||[])
    } catch { setNominatimResults([]) }
    setSearchLoading(false)
  }

  const handleVenueChange=(v:string)=>{
    setVenueInput(v); setVenueAddress(null)
    if (nominatimTimer.current) clearTimeout(nominatimTimer.current)
    nominatimTimer.current=setTimeout(()=>searchNominatim(v), 600)
    setShowSugg(true)
  }

  const selectVenue=(name:string, address?:string, lat?:number, lng?:number)=>{
    setVenueInput(name)
    setVenueAddress(address||null)
    setVenueLat(lat||null)
    setVenueLng(lng||null)
    setNominatimResults([]); setShowSugg(false)
  }

  const formatAddress=(r:any):string=>{
    const a=r.address||{}
    const parts=[a.road||'', a.city||a.town||a.village||a.municipality||'', a.postcode||''].filter(Boolean)
    return parts.join(', ')
  }

  const send=async()=>{
    if (!venueInput.trim()){setVenueError(true);return}
    setLoading(true)
    // Bots GPS de test hardcodés — toujours disponibles, bypass Supabase
    const isGpsBot = (to as any)._isGpsTestBot === true
    if (!isGpsBot) {
      // Vérifier que la cible est toujours disponible au moment d'envoyer
      const {data:freshTarget} = await supabase.from('profiles').select('is_available,available_until').eq('id',to.id).single()
      if (!freshTarget?.is_available || !freshTarget?.available_until || new Date(freshTarget.available_until) <= new Date()) {
        setLoading(false)
        onTargetUnavailable?.()
        return
      }
    }
    // Seuil temporel : un verrou est "actif" seulement si le RDV est dans les 3h à venir ou passé depuis moins de 3h
    const activeThreshold = new Date(Date.now() - 3*3600*1000).toISOString()
    // Block verrou actif sur MOI
    const {data:activeLock}=await supabase.from('clutches')
      .select('id,status,proposed_time,receiver:profiles!clutches_receiver_id_fkey(name),sender:profiles!clutches_sender_id_fkey(name)')
      .or(`sender_id.eq.${from.id},receiver_id.eq.${from.id}`)
      .in('status',['confirmed','accepted'])
      .gt('proposed_time', activeThreshold)
      .limit(1)
    if (activeLock&&activeLock.length>0){
      setLoading(false)
      const other=(activeLock[0]as any).sender?.name&&(activeLock[0]as any).sender_id!==from.id?(activeLock[0]as any).sender?.name:(activeLock[0]as any).receiver?.name
      showToast(lang==='fr'?`🔒 Tu as déjà un verrou actif${other?` avec ${other}`:''}`:`🔒 You already have a locked meetup${other?` with ${other}`:''}`,C.orange)
      return
    }
    // Bots GPS : skip les checks RPC (pas dans Supabase)
    if (isGpsBot) {
      setLoading(false)
      const pt2=new Date(); const [h2,m2]=H[hi].split(':').map(Number); pt2.setHours(h2,m2,0,0)
      const fakeId = `bot-${Date.now()}`
      onSent(fakeId)
      return
    }
    // Block if receiver already has a confirmed Clutch with anyone — RPC SECURITY DEFINER pour contourner RLS
    const {data:recLocked}=await supabase.rpc('has_active_lock',{p_user_id:to.id})
    if (recLocked){
      setLoading(false)
      const first=to.name?.split(' ')[0]||'Cette personne'
      showToast(lang==='fr'?`🔒 ${first} a déjà un RDV actif`:`🔒 ${first} already has an active meetup`,C.orange)
      return
    }
    // Block double clutch with same person
    const {data:existing}=await supabase.from('clutches')
      .select('id,status')
      .or(`and(sender_id.eq.${from.id},receiver_id.eq.${to.id}),and(sender_id.eq.${to.id},receiver_id.eq.${from.id})`)
      .in('status',['pending','confirmed','accepted']).limit(1)
    if (existing&&existing.length>0){
      setLoading(false)
      showToast(lang==='fr'?`Un Clutch existe déjà avec ${to.name?.split(' ')[0]||'cette personne'}`:`Already a Clutch with ${to.name?.split(' ')[0]||'them'}`,C.orange)
      return
    }
    // Cooldown 48h anti-harcèlement : si cette personne a décliné un de mes Clutchs
    // récemment, je ne peux pas la re-clutcher avant 48h. Directionnel (ne bloque pas
    // l'inverse). Protège contre l'insistance. Sécurité femmes — non contournable côté UX.
    const COOLDOWN_MS = 48*3600*1000
    const {data:recentDecline}=await supabase.from('clutches')
      .select('created_at')
      .eq('sender_id', from.id)
      .eq('receiver_id', to.id)
      .eq('status','declined')
      .gte('created_at', new Date(Date.now()-COOLDOWN_MS).toISOString())
      .order('created_at',{ascending:false}).limit(1)
    if (recentDecline&&recentDecline.length>0){
      setLoading(false)
      const first=to.name?.split(' ')[0]||(lang==='fr'?'Cette personne':'They')
      const hoursLeft=Math.max(1,Math.ceil((new Date(recentDecline[0].created_at).getTime()+COOLDOWN_MS-Date.now())/3600000))
      showToast(lang==='fr'
        ? `${first} a décliné récemment. Tu pourras reproposer dans ~${hoursLeft}h.`
        : `${first} recently declined. You can try again in ~${hoursLeft}h.`,C.orange)
      return
    }
    // Limite simultanéité : femmes = 20, hommes free = 3, premium = 5
    const senderGender = (from as any).gender
    const senderPlan   = (from as any).account_type || 'free'
    const maxSimult    = senderGender === 'F' ? 20 : senderPlan === 'premium' ? 5 : 3
    const {data:activeSent}=await supabase.from('clutches')
      .select('id')
      .eq('sender_id', from.id)
      .in('status',['pending','confirmed','accepted'])
    const activeCount = activeSent?.length ?? 0
    if (activeCount >= maxSimult) {
      setLoading(false)
      const msg = lang==='fr'
        ? `Tu as déjà ${maxSimult} Clutch${maxSimult>1?'s':''} actifs simultanés${senderGender!=='F'&&senderPlan==='free'?' (passe Premium pour en avoir 5)':''}`
        : `You already have ${maxSimult} active Clutch${maxSimult>1?'es':''}${senderGender!=='F'&&senderPlan==='free'?' (upgrade to Premium for 5)':''}`
      showToast(msg, C.orange)
      return
    }
    const pt=new Date(); const [h,m]=H[hi].split(':').map(Number); pt.setHours(h,m,0,0)
    const venueLabel=venueAddress?`${venueInput.trim()} · ${venueAddress}`:venueInput.trim()
    // Gardien unique : create_clutch() vérifie côté serveur self / hard-block (2 sens) / cooldown / doublon pending.
    const {data:newClutchId,error}=await supabase.rpc('create_clutch',{
      p_receiver: to.id,
      p_venue: venueLabel,
      p_proposed_time: pt.toISOString(),
      p_message: msg||(lang==='fr'?`Dispo pour ${venueInput.trim()} à ${H[hi]} ?`:`Free for ${venueInput.trim()} at ${H[hi]}?`),
      p_duration_minutes: isQuickDate?60:null,
      p_is_quick: isQuickDate,
      p_venue_lat: venueLat||null,
      p_venue_lng: venueLng||null,
    })
    const inserted = newClutchId ? { id: newClutchId as string } : null
    setLoading(false)
    if(error){
      const m=(error.message||'').toLowerCase()
      const reason = /blocked/.test(m)?'blocked' : /cooldown/.test(m)?'cooldown' : /inbox_full/.test(m)?'full' : /pair_busy/.test(m)?'busy' : /self_clutch/.test(m)?'self' : ''
      // Anti-sonde : blocked, cooldown ET inbox_full → MÊME message générique
      // (A ne doit JAMAIS déduire un refus, un blocage, NI que la boîte de B est pleine).
      const friendly =
        reason==='self' ? (lang==='fr'?'Impossible de te clutcher toi-même 😄':"You can't clutch yourself 😄")
        : reason==='busy' ? (lang==='fr'?'Tu as déjà un Clutch en cours avec cette personne ✦':'You already have an active Clutch with this person ✦')
        : (reason==='blocked'||reason==='cooldown'||reason==='full') ? (lang==='fr'?'Cette proposition n\'est pas disponible pour le moment.':"This invitation isn't available right now.")
        : 'Erreur: '+error.message
      showToast(friendly, reason ? C.orange : C.red)
      return
    }
    // 🔔 Push au DESTINATAIRE (David : « il faut que ça s'affiche sur le tél quand il se passe un truc »).
    // Fonctionne SI : capability Push activée dans Xcode + clé Apple (.p8) dans OneSignal + secret ONESIGNAL_API_KEY dans Supabase.
    try {
      const first = (from as any).name?.split(' ')[0] || 'Quelqu\'un'
      supabase.functions.invoke('send-push', { body: {
        user_id: to.id,
        title: '☕ Nouveau Clutch !',
        body: `${first} te propose ${venueInput.trim()||'un rendez-vous'}${H[hi]?` à ${H[hi]}`:''}`,
        data: { type:'new_clutch', clutch_id: inserted?.id },
      }}).catch(()=>{})
    } catch {}
    hap('success')  // vibration de confirmation : le Clutch est parti
    onSent(inserted?.id)
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:2000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)'}} onClick={onClose}/>
      <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',padding:'20px 20px 36px',animation:'modalIn .4s cubic-bezier(.22,1,.36,1)',maxHeight:'88vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div style={{fontSize:16,fontWeight:900}}>{t('modal.send')}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.whiteMid,fontSize:20,cursor:'pointer'}}>✕</button>
        </div>

        {/* Profil cible */}
        <div style={{display:'flex',gap:10,alignItems:'center',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 12px',marginBottom:14}}>
          <Av src={to.photo_url} name={to.name||'?'} size={38}/>
          <div>
            <div style={{fontSize:14,fontWeight:800}}>{to.name}</div>
            {(to as any).available_from&&(to as any).available_until&&(
              <div style={{fontSize:10,color:C.salmon}}>
                ⏱ {new Date((to as any).available_from).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}–{new Date((to as any).available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
              </div>
            )}
          </div>
        </div>

        {/* ── LIEU avec Nominatim ── */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>
            {t('modal.venue')} {searchLoading&&<span style={{opacity:.5}}>🔍</span>}
          </div>
          <input
            value={venueInput}
            onChange={e=>{handleVenueChange(e.target.value);setVenueError(false)}}
            onFocus={()=>setShowSugg(true)}
            placeholder={lang==='fr'?'Tape un lieu (adresse, café, parc…)':'Type a venue (address, café, park…)'}
            style={{width:'100%',background:C.whiteFaint,border:`1.5px solid ${venueError?C.orange:venueAddress?C.orange:C.borderStrong}`,borderRadius:12,padding:'10px 14px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon,boxSizing:'border-box'}}
          />
          {venueError&&(
            <div style={{fontSize:11,color:C.orange,marginTop:5,paddingLeft:4,fontWeight:700,display:'flex',alignItems:'center',gap:4}}>
              ⚠ {lang==='en'?'Please enter a venue before sending':'Indique un lieu avant d\'envoyer'}
            </div>
          )}
          {venueAddress&&(
            <div style={{fontSize:10,color:C.orange,marginTop:4,paddingLeft:4}}>
              📍 {venueAddress}
            </div>
          )}
          {/* Résultats Nominatim */}
          {showSugg&&nominatimResults.length>0&&(
            <div style={{marginTop:6,background:C.bgCard,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden'}}>
              {nominatimResults.map((r:any,i:number)=>{
                const name=r.name||r.display_name.split(',')[0]
                const addr=formatAddress(r)
                return (
                  <div key={i} onClick={()=>selectVenue(name,addr,parseFloat(r.lat),parseFloat(r.lon))}
                    style={{padding:'10px 14px',borderBottom:i<nominatimResults.length-1?`1px solid ${C.border}`:'none',cursor:'pointer',display:'flex',flexDirection:'column',gap:2}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.white}}>{name}</div>
                    {addr&&<div style={{fontSize:10,color:C.whiteMid}}>📍 {addr}</div>}
                  </div>
                )
              })}
            </div>
          )}
          {/* Suggestions rapides si pas de résultat Nominatim */}
          {showSugg&&nominatimResults.length===0&&(
            <div style={{marginTop:6,display:'flex',gap:5,flexWrap:'wrap'}}>
              {SUGGESTIONS.filter(s=>!venueInput||s.toLowerCase().includes(venueInput.toLowerCase())).slice(0,5).map(s=>(
                <button key={s} onClick={()=>selectVenue(s)} style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:venueInput===s?C.salmonFaint:C.whiteFaint,color:venueInput===s?C.salmon:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── HEURE — intersection des deux fenêtres ── */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>
            {lang==='fr'?'Heure du RDV':'Meeting time'}
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {H.map((h,i)=>(
              <button key={h} onClick={()=>setHi(i)}
                style={{padding:'8px 13px',borderRadius:10,border:`1.5px solid ${hi===i?C.orange:C.border}`,background:hi===i?`${C.orange}22`:C.whiteFaint,color:hi===i?C.orange:C.whiteMid,fontSize:13,fontWeight:hi===i?800:500,cursor:'pointer',fontFamily:'inherit'}}>
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* ── QUICK DATE ── */}
        <div style={{marginBottom:14}}>
          <button onClick={()=>setIsQuickDate(q=>!q)}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderRadius:12,border:`1.5px solid ${isQuickDate?C.orange:C.border}`,background:isQuickDate?`${C.orange}18`:C.whiteFaint,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>⚡</span>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:13,fontWeight:800,color:isQuickDate?C.orange:C.white}}>Quick Date · 1h</div>
                <div style={{fontSize:11,color:C.whiteMid}}>On se retrouve, on voit si ça clique — libre après 1h</div>
              </div>
            </div>
            <div style={{width:22,height:22,borderRadius:11,border:`2px solid ${isQuickDate?C.orange:C.border}`,background:isQuickDate?C.orange:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all .2s'}}>
              {isQuickDate&&<span style={{color:'#000',fontSize:13,fontWeight:900}}>✓</span>}
            </div>
          </button>
        </div>

        {/* ── MESSAGE ── */}
        <div style={{marginBottom:18}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
            <div style={{fontSize:11,color:C.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase'}}>Message</div>
            <div style={{fontSize:10,color:msg.length>250?C.red:C.whiteMid}}>{msg.length}/300</div>
          </div>
          <textarea
            value={msg}
            onChange={e=>setMsg(e.target.value.slice(0,300))}
            placeholder={lang==='fr'?`Dispo pour ${venueInput||'…'} à ${H[hi]} ?`:`Free for ${venueInput||'…'} at ${H[hi]}?`}
            style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',height:72,caretColor:C.salmon,boxSizing:'border-box'}}
          />
        </div>

        {/* Alerte lieu manquant — visible juste au-dessus du bouton Envoyer */}
        {venueError && (
          <div style={{background:'rgba(235,107,175,.12)',border:'1.5px solid rgba(235,107,175,.5)',borderRadius:12,padding:'10px 14px',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:18}}>📍</span>
            <span style={{fontSize:13,fontWeight:700,color:C.orange}}>
              {lang==='en' ? 'Add a venue before sending' : 'Ajoute un lieu de rendez-vous avant d\'envoyer'}
            </span>
          </div>
        )}
        <Btn loading={loading} onClick={send}>{t('modal.sendBtn')} → {H[hi]}</Btn>
        <div style={{textAlign:'center',marginTop:10,fontSize:11,color:C.whiteMid}}>
          {lang==='fr'
            ?<>{to.name} a <strong style={{color:C.salmon}}>2h pour répondre</strong> · RDV dans <strong style={{color:C.salmon}}>18h max</strong></>
            :<>{to.name} has <strong style={{color:C.salmon}}>2h to reply</strong> · Meetup within <strong style={{color:C.salmon}}>18h max</strong></>}
        </div>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// CLUTCH LANCÉ — animation légère (quand tu envoies)
// ═════════════════════════════════════════════════════════════
function ClutchSent({ onDone, name, lang='fr' }:{ onDone:()=>void; name:string; lang?:Lang }) {
  useEffect(()=>{ const t=setTimeout(onDone,2400); return()=>clearTimeout(t) },[onDone])
  const first = name?.split(' ')[0] || (lang==='en'?'They':'Cette personne')
  return (
    <div style={{position:'fixed',inset:0,zIndex:5000,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(42,16,32,.95)',backdropFilter:'blur(12px)'}} onClick={onDone}>
      <style>{`
        @keyframes sentStar{0%{transform:scale(0) rotate(-30deg);opacity:0}20%{opacity:1}50%{transform:scale(1.15) rotate(8deg);opacity:1}85%{transform:scale(1) rotate(0);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes sentFade{0%{opacity:1}88%{opacity:1}100%{opacity:0}}
        @keyframes sentRing{0%{transform:translate(-50%,-50%) scale(0);opacity:.9}70%{opacity:.3}100%{transform:translate(-50%,-50%) scale(6);opacity:0}}
        @keyframes sentRing2{0%{transform:translate(-50%,-50%) scale(0);opacity:.6}70%{opacity:.15}100%{transform:translate(-50%,-50%) scale(8);opacity:0}}
        @keyframes sentTxtIn{0%{transform:translateY(30px);opacity:0}30%{transform:translateY(-4px);opacity:1}50%{transform:translateY(0);opacity:1}88%{opacity:1}100%{opacity:0}}
        @keyframes sentTap{0%,70%{opacity:0}85%{opacity:.5}100%{opacity:0}}
        .sr{position:absolute;top:50%;left:50%;border-radius:50%;pointer-events:none;}
        .sr1{width:80px;height:80px;border:2px solid #EB6BAF;animation:sentRing 1.8s ease-out .05s both;}
        .sr2{width:80px;height:80px;border:1.5px solid rgba(235,107,175,.5);animation:sentRing2 2.2s ease-out .0s both;}
      `}</style>
      <div style={{position:'relative',textAlign:'center',animation:'sentFade 3.8s ease both',padding:'0 30px'}}>
        <div className="sr sr1"/><div className="sr sr2"/>
        <div style={{fontSize:80,lineHeight:1,animation:'sentStar 3.8s cubic-bezier(.22,1,.36,1) both',filter:'drop-shadow(0 0 20px #EB6BAF) drop-shadow(0 0 40px rgba(235,107,175,.5))'}}>✦</div>
        <div style={{marginTop:20,animation:'sentTxtIn 3.8s ease both'}}>
          <div style={{fontSize:26,fontWeight:900,color:'#fff',letterSpacing:'-.03em'}}>{lang==='en'?'Clutch sent!':'Clutch envoyé !'}</div>
          <div style={{fontSize:14,color:'rgba(255,255,255,.8)',marginTop:6,fontWeight:600}}>{lang==='en'?`${first} has 2h to reply ⏳`:`${first} a 2h pour répondre ⏳`}</div>
          {/* Didactique : on rassure sur OÙ le clutch est parti (David : « le clutch disparaît ») */}
          <div style={{fontSize:12.5,color:'#EB6BAF',marginTop:14,fontWeight:800,background:'rgba(235,107,175,.12)',border:'1px solid rgba(235,107,175,.35)',borderRadius:12,padding:'8px 14px',display:'inline-block'}}>{lang==='en'?'💬 Find it in your Clutchs tab':'💬 Tu le retrouves dans l\'onglet Clutchs'}</div>
        </div>
        <div style={{marginTop:22,fontSize:11,color:'rgba(255,255,255,.4)',animation:'sentTap 3.8s ease both'}}>{lang==='en'?'Tap to continue':'Touche pour continuer'}</div>
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
        .vr1{width:100px;height:100px;border:3px solid #EB6BAF;animation:vRing 1.6s ease-out 0s both;}
        .vr2{width:100px;height:100px;border:2px solid #EB6BAF88;animation:vRing2 2.0s ease-out .1s both;}
        .vr3{width:100px;height:100px;border:1.5px solid #EB6BAF44;animation:vRing3 2.4s ease-out .2s both;}
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
            <path fill="#EB6BAF" d="M185.38,206.473l10.697-10.695l-36.604-36.604l-10.696,10.697l-0.806,32.382l-8.621,0.29l0.862-34.607c0.027-1.104,0.478-2.156,1.26-2.938l14.957-14.957c1.682-1.682,4.408-1.682,6.089,0l42.692,42.691c1.681,1.682,1.681,4.408,0,6.089l-14.959,14.958c-0.781,0.781-1.831,1.231-2.937,1.259l-85.845,2.14l-10.696,10.696l36.604,36.603l10.696-10.697l0.802-32.189l8.617-0.141l-0.854,34.266c-0.028,1.104-0.478,2.156-1.261,2.938l-14.957,14.957c-1.681,1.682-4.407,1.682-6.089,0l-42.69-42.691c-1.683-1.682-1.683-4.408,0-6.089l14.957-14.958c0.781-0.781,1.832-1.232,2.938-1.259L185.38,206.473z"/>
            <polygon fill="#532943" points="153.217,202.325 183.263,201.578 188.846,195.994 182.948,190.122 153.521,190.121"/>
            <polygon fill="#532943" points="127.452,257.386 133.035,251.803 133.422,236.09 106.192,236.09"/>
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
function ClutchIncoming({ clutch, onAccept, onDecline, onLater, onCounter, lang:inLang }:{
  clutch:any; onAccept:()=>void; onDecline:()=>void; onLater?:()=>void; onCounter?:(venue:string,time:string)=>void; lang?:Lang
}) {
  const isFr = inLang !== 'en'
  const [ph, setPh] = useState(0)
  const [showCounter, setShowCounter] = useState(false)
  const [counterVenue, setCounterVenue] = useState(clutch?.venue || '')  // pré-rempli avec le lieu proposé par l'autre (C1)
  const [counterTime, setCounterTime] = useState('')
  const counterSlots = (()=>{
    // Créneaux RONDS (:00 ou :30), à partir du prochain créneau rond — plus de 2h08/2h38
    const start = new Date(); start.setSeconds(0,0)
    start.setMinutes(start.getMinutes() < 30 ? 30 : 60, 0, 0)
    return Array.from({length:12},(_,i)=>{
      const d = new Date(start.getTime()+i*30*60*1000)
      return { label:d.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}), iso:d.toISOString() }
    })
  })()
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
        {isFr ? 'Quelqu\'un veut te rencontrer' : 'Someone wants to meet you'}
      </div>}

      {/* Profil sender */}
      {ph>=2 && sender && (
        <div style={{background:C.bgCard,border:`1px solid ${gc}44`,borderRadius:16,padding:'12px 16px',display:'flex',gap:12,alignItems:'center',width:'min(320px,90vw)',marginBottom:24,animation:'ciSub .4s ease both'}}>
          <div style={{width:48,height:48,borderRadius:14,background:`${gc}22`,border:`2px solid ${gc}66`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,animation:'ciPulse 1.5s ease infinite'}}>
            {sender.photo_url ? <img src={sender.photo_url} style={{width:'100%',height:'100%',borderRadius:12,objectFit:'cover'}}/> : <GenderSvg gk={gk} size={24}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900,color:C.white,display:'flex',alignItems:'center',gap:6}}>
              {sender.name||'Someone'}
              {sender.age&&<span style={{fontSize:12,fontWeight:500,color:C.whiteMid}}>{sender.age} {isFr?'ans':'yo'}</span>}
              <GenderSvg gk={gk} size={14}/>
            </div>
            {sender.bio&&<div style={{fontSize:11,color:C.whiteMid,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sender.bio}</div>}
            {clutch.venue&&<div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>📍 {clutch.venue}</div>}
            {clutch.proposed_time&&<div style={{fontSize:11,color:C.orange,marginTop:1}}>🕐 {new Date(clutch.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}</div>}
            {clutch.message&&<div style={{fontSize:11,color:C.salmon,marginTop:3,fontStyle:'italic',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>"{clutch.message}"</div>}
          </div>
        </div>
      )}

      {/* Boutons */}
      {ph>=2 && (
        <div style={{display:'flex',flexDirection:'column',gap:8,width:'min(320px,90vw)',animation:'ciBtns .5s cubic-bezier(.22,1,.36,1) .1s both'}}>
          {!showCounter ? (<>
            <div style={{display:'flex',gap:12}}>
              <button onClick={onDecline} style={{flex:1,padding:'14px',background:'rgba(239,68,68,.12)',border:'1.5px solid rgba(239,68,68,.35)',borderRadius:16,color:C.red,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                ✕ {isFr?'Refuser':'Decline'}
              </button>
              <button onClick={onAccept} style={{flex:2,padding:'14px',background:`linear-gradient(135deg,${C.green},#1a9660)`,border:'none',borderRadius:16,color:'#fff',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 20px ${C.green}44`,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                <img src="/icons/LOCK.svg" width={18} height={18} alt="" style={{filter:'brightness(0) invert(1)',flexShrink:0}}/> {isFr?'Verrouiller 🔒':'Lock in 🔒'}
              </button>
            </div>
            {onCounter && (
              <button onClick={()=>setShowCounter(true)} style={{width:'100%',padding:'11px',background:'rgba(235,107,175,.1)',border:'1.5px solid rgba(235,107,175,.33)',borderRadius:14,color:"C.gold",fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                ↩ {isFr?'Contre-clutch…':'Counter-clutch…'}
              </button>
            )}
          </>) : (
            <div style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(235,107,175,.27)',borderRadius:16,padding:16,display:'flex',flexDirection:'column',gap:10}}>
              <div style={{fontSize:13,fontWeight:800,color:"C.gold",marginBottom:2}}>{isFr?'Ton contre-Clutch':'Your counter-Clutch'}</div>
              <input
                value={counterVenue}
                onChange={e=>setCounterVenue(e.target.value)}
                placeholder={isFr?'Lieu (ex: Café du Grütli)':'Venue (e.g. Café du Grütli)'}
                style={{padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,background:'rgba(255,255,255,.07)',color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',width:'100%',boxSizing:'border-box'}}
              />
              <select
                value={counterTime}
                onChange={e=>setCounterTime(e.target.value)}
                style={{padding:'10px 12px',borderRadius:10,border:`1px solid ${C.border}`,background:C.bg,color:counterTime?C.white:C.whiteMid,fontSize:13,fontFamily:'inherit',outline:'none',width:'100%'}}
              >
                <option value="">{isFr?'Choisir une heure…':'Pick a time…'}</option>
                {counterSlots.map(s=><option key={s.iso} value={s.iso}>{s.label}</option>)}
              </select>
              <div style={{display:'flex',gap:8,marginTop:2}}>
                <button onClick={()=>setShowCounter(false)} style={{flex:1,padding:'10px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                  ← {isFr?'Retour':'Back'}
                </button>
                <button
                  onClick={()=>{ if(counterVenue.trim()&&counterTime) onCounter?.(counterVenue.trim(),counterTime) }}
                  disabled={!counterVenue.trim()||!counterTime}
                  style={{flex:2,padding:'10px',background:counterVenue.trim()&&counterTime?`linear-gradient(135deg,C.gold,#a06800)`:'rgba(255,255,255,.1)',border:'none',borderRadius:10,color:counterVenue.trim()&&counterTime?'#fff':C.whiteMid,fontSize:13,fontWeight:800,cursor:counterVenue.trim()&&counterTime?'pointer':'default',fontFamily:'inherit'}}
                >
                  ⚡ {isFr?'Envoyer':'Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{position:'absolute',bottom:40,fontSize:10,color:'rgba(255,255,255,.2)'}}>
        {isFr?'Tu as 2h pour répondre':'You have 2h to reply'}
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
        top:'calc(var(--sat) + 6px)',
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
// 🤝 PROTOTYPE — Groupes / Partenaires (vision David : suivre un organisateur récurrent → notifs ciblées = réseau)
// Données mock pour visualiser le concept. À brancher DB en V2.
const PARTNERS_MOCK = [
  {id:'p_dclub',   emoji:'🎶', name:'D Club Lausanne',      cat:'Clubbing · Soirées',   zone:'Flon, Lausanne',     members:1240, desc:'Les meilleures nuits de Lausanne. Soirées chaque week-end.', next:'Techno night · sam. 23h', verified:true, photo:'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=600&q=80'},
  {id:'p_pingpong',emoji:'🏓', name:'Ping-Pong chez Bibi',  cat:'Sport · Convivial',    zone:'Région Lausanne',    members:38,   desc:'Tournois ping-pong détendus chez un passionné. Lieu donné avant.', next:'Tournoi débutants · dim. 14h', verified:false},
  {id:'p_jazz',    emoji:'🎷', name:'Apéro Jazz Collectif',  cat:'Musique · Apéro',      zone:'Vieille Ville',      members:212,  desc:'Jam sessions et apéros jazz une fois par mois. Amène ton instrument.', next:'Jam ouverte · ven. 19h', verified:true, photo:'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80'},
  {id:'p_rando',   emoji:'🥾', name:'Rando du Dimanche',     cat:'Nature · Sport',       zone:'Lavaux / Jura',      members:156,  desc:'Balades et randos accessibles à tous, chaque dimanche matin.', next:'Lavaux sunrise · dim. 7h', verified:false},
  {id:'p_parents', emoji:'👶', name:'Parents & Cie',         cat:'Famille · Entraide',   zone:'Lausanne',           members:89,   desc:'Sorties parc, gardes partagées, cafés entre parents.', next:'Pique-nique parc · sam. 15h', verified:false},
  // Partenaires officiels supplémentaires (Lausanne & environs) — bannières "à la une"
  {id:'p_mad',     emoji:'🪩', name:'MAD Lausanne',          cat:'Clubbing · Concerts',  zone:'Genève-Sud, Lausanne', members:2100, desc:'Le club mythique de Lausanne. Concerts, soirées à thème, afters.', next:'House night · ven. 23h', verified:true, photo:'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=600&q=80'},
  {id:'p_montreux',emoji:'🎺', name:'Montreux Jazz Café',    cat:'Musique · Live',       zone:'Montreux',           members:870,  desc:'Concerts live et jam sessions dans l\'esprit du festival.', next:'Soul session · sam. 20h', verified:true, photo:'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&q=80'},
  {id:'p_lakeyoga',emoji:'🧘', name:'Lake Yoga Vidy',        cat:'Bien-être · Plein air', zone:'Vidy, Lausanne',     members:430,  desc:'Yoga au bord du lac, tous niveaux, lever et coucher du soleil.', next:'Sunset flow · dim. 19h', verified:true, photo:'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80'},
  {id:'p_caves',   emoji:'🍷', name:'Caves Ouvertes Lavaux', cat:'Dégustation · Vin',    zone:'Lavaux',             members:640,  desc:'Dégustations chez les vignerons du vignoble UNESCO.', next:'Balade & dégustation · sam. 10h', verified:true, photo:'https://images.unsplash.com/photo-1566903451935-7e8835ed3e92?w=600&q=80'},
]

// Barre de filtres VOLONTAIREMENT courte (audit David 21.06 : « beaucoup trop de boutons en haut »).
// 5 essentiels seulement. Les catégories (sport/culture/musique…) reviendront en filtre secondaire si besoin.
const EV_FILTERS = [
  {id:'all',         trKey:'ev.filter.all',         icon:'✦'},
  {id:'soir',        trKey:'ev.filter.soir',        icon:'🌙'},
  {id:'demain',      trKey:'ev.filter.demain',      icon:'☀️'},
  // 'mine' (Mes events) retiré des filtres → remplacé par une pastille VERTE dans l'en-tête (apparaît si inscrit). Demande David.
  {id:'partenaires', trKey:'ev.filter.partenaires', icon:'🫂'},
]

// Events de groupe créés par des utilisateurs (bots de démo + futurs events réels)
const GROUP_EVENTS_DEMO = [
  {
    id:'g1', emoji:'🍷', title:'Apéro découverte — inconnus bienvenus',
    creator:'Sophie M.', creatorBio:'Organisatrice d\'apéros depuis 3 ans. Je crois aux rencontres improbables.', creatorPhoto:null,
    date:'Ce soir', time:'19h00', lieu:'Bar du Marché, Place de la Palud, Lausanne',
    spots:8, taken:3, price:'Chacun paye sa conso', description:'Un apéro entre gens qui ne se connaissent pas. Pas de pression, juste un verre et des conversations. Venez comme vous êtes.',
    tags:['groupe','gastro'], isGroupe:true, evGender:'X', certified:false,
    eventPhotos:['linear-gradient(135deg,#7B2D5E,#3D1A33)'], eventPhotoEmojis:['🍷'],
  },
  {
    id:'g2', emoji:'♟️', title:'Partie d\'échecs — tous niveaux',
    creator:'Marcus T.', creatorBio:'Joueur d\'échecs amateur. Batteur de jazz à mes heures.', creatorPhoto:null,
    date:'Ce soir', time:'20h30', lieu:'Café Romand, Place Saint-François, Lausanne',
    spots:6, taken:1, price:'Gratuit', description:'Une partie d\'échecs sympa au café. Débutants acceptés, je vous explique si besoin. On est là pour s\'amuser, pas pour gagner.',
    tags:['groupe','culture'], isGroupe:true, evGender:'X', certified:false,
    eventPhotos:['linear-gradient(135deg,#1a3a5c,#0d1f33)'], eventPhotoEmojis:['♟️'],
  },
  {
    id:'g3', emoji:'🏃', title:'Run matinal — 5km bord du lac',
    creator:'Léa K.', creatorBio:'Coach running, végane. Aucun coureur laissé derrière.', creatorPhoto:null,
    date:'Demain', time:'07h00', lieu:'Quai d\'Ouchy, Lausanne (fontaine)',
    spots:10, taken:4, price:'Gratuit', description:'Petit run tranquille de 5km le long du lac. Rythme conversationnel — on parle autant qu\'on court. Café offert après si on est courageux.',
    tags:['groupe','sport'], isGroupe:true, evGender:'X', certified:false,
    eventPhotos:['linear-gradient(135deg,#1a4d2e,#0d2618)'], eventPhotoEmojis:['🏃'],
  },
  {
    id:'g4', emoji:'💻', title:'Coworking spontané — 2h focus',
    creator:'Adrien B.', creatorBio:'Freelance UX. Je travaille mieux entouré de gens qui bossent.', creatorPhoto:null,
    date:'Demain', time:'14h00', lieu:'BCV Innovation Hub, Lausanne',
    spots:5, taken:2, price:'Gratuit', description:'2h de travail en silence companionnable. Chacun bosse sur son truc. Pas de présentation, pas de networking forcé. Juste de la bonne énergie collective.',
    tags:['groupe','culture'], isGroupe:true, evGender:'X', certified:false,
    eventPhotos:['linear-gradient(135deg,#2d1a4d,#180d33)'], eventPhotoEmojis:['💻'],
  },
  {
    id:'g5', emoji:'🎬', title:'Ciné en plein air — film surprise',
    creator:'Emma R.', creatorBio:'Cinéphile et organisatrice d\'événements culturels à Lausanne.', creatorPhoto:null,
    date:'Ce soir', time:'21h00', lieu:'Parc de Milan, Lausanne',
    spots:20, taken:7, price:'3 CHF (chaise incluse)', description:'Un film projeté en plein air, film annoncé sur place. Apportez un plaid. L\'ambiance compte plus que le film.',
    tags:['groupe','culture','musique'], isGroupe:true, evGender:'X', certified:false,
    eventPhotos:['linear-gradient(135deg,#1a1a3d,#0d0d26)'], eventPhotoEmojis:['🎬'],
  },
  // (event de test Max GPS — SUPPRIMÉ, demande David)
]

const GROUP_EMOJIS = ['🍷','🍕','☕','🏃','♟️','🎸','📚','🧘','🎬','🎨','🌿','🎲','🚴','🍺','💻','🌙','🎵','🧆','🏊','⛰️']

// ── Inscriptions aux événements : durée + anti-chevauchement (décision David 21.06) ──
// (a) plafond 2 events actifs · (b) durée obligatoire à la création (défaut 2h si inconnue)
const MAX_ACTIVE_EVENTS = 2
const EVENT_DUR_OPTS = [{h:1,label:'1h'},{h:2,label:'2h'},{h:3,label:'3h'},{h:5,label:'4h+'}]
// Durée : explicite si fournie, sinon INFÉRÉE du type d'event (durées variées & sensées pour les tests de chevauchement)
const eventDurH = (ev:any):number => {
  const d=Number(ev?.durationH); if(d>0) return d
  const s = ((ev?.tags||[]).join(' ')+' '+(ev?.title||'')).toLowerCase()
  if(/club|soir|nuit|jazz|concert|\bdj\b|techno|fête|danse/.test(s)) return 4
  if(/brunch|rando|balade|vélo|velo|escalade|atelier|cuisine|marché|marche/.test(s)) return 3
  if(/café|cafe|verre|apéro|apero|échec|echec|lecture|littér/.test(s)) return 1
  return 2
}
const eventDurLabel = (ev:any):string => { const d=eventDurH(ev); return d>=5?'4h+':`~${d}h` }
// Filtre basique anti-contenu déplacé (V1 — liste de mots ; une vraie modération IA viendra côté serveur).
const BANNED_WORDS = ['pute','putain','salope','connard','enculé','encule','nique','niquer','bite','couille','pédé','pede','negro','nègre','negre','youpin','bougnoule','viol','pédophile','pedophile','fdp','ntm','sexe gratuit','plan cul','escort','drogue à vendre','coke à vendre']
const hasBannedWords = (s?:string):boolean => { const t=(s||'').toLowerCase(); return BANNED_WORDS.some(w=>t.includes(w)) }
// Corrige le jour de la semaine d'une date absolue (« Sam 21 juin » → « Dim 21 juin »). Laisse « Ce soir »/« Demain » tels quels.
const FR_MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre']
const FR_WD = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
// Localise les tokens de date relatifs en EN (sans toucher à la valeur stockée FR — donnée utilisée dans la logique)
const DAY_EN:Record<string,string> = {"Aujourd'hui":'Today','Demain':'Tomorrow','Ce soir':'Tonight','Demain matin':'Tomorrow morning','Demain 14h':'Tomorrow 2pm'}
const locDay = (s:string|undefined, en:boolean):string => { if(!s) return ''; if(!en) return s; if(DAY_EN[s]) return DAY_EN[s]; return s.replace(/^Dim/,'Sun').replace(/^Lun/,'Mon').replace(/^Mar/,'Tue').replace(/^Mer/,'Wed').replace(/^Jeu/,'Thu').replace(/^Ven/,'Fri').replace(/^Sam/,'Sat').replace(/ janvier/,' Jan').replace(/ février/,' Feb').replace(/ mars/,' Mar').replace(/ avril/,' Apr').replace(/ mai/,' May').replace(/ juin/,' Jun').replace(/ juillet/,' Jul').replace(/ août/,' Aug').replace(/ septembre/,' Sep').replace(/ octobre/,' Oct').replace(/ novembre/,' Nov').replace(/ décembre/,' Dec') }
function fixEventDate(s:string|undefined):string {
  if(!s) return s||''
  const m = String(s).match(/(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)/i)
  if(!m) return s
  const day=Number(m[1]); const mon=FR_MONTHS.indexOf(m[2].toLowerCase()); if(mon<0) return s
  const d=new Date(new Date().getFullYear(), mon, day); const wd=FR_WD[d.getDay()]
  return s.replace(/^(lun\.?|mar\.?|mer\.?|jeu\.?|ven\.?|sam\.?|dim\.?|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)\s*/i,'').replace(/^/,`${wd} `)
}
// Extrait l'heure de début en minutes depuis minuit depuis une string libre ("19:30", "19h30", "Ce soir 20h")
function parseEventMinutes(t:string|undefined):number|null {
  if(!t) return null
  const m = String(t).match(/(\d{1,2})\s*[h:.]\s*(\d{2})?/)
  if(!m) return null
  const hh = Number(m[1]); const mm = m[2]?Number(m[2]):0
  if(hh>23||mm>59) return null
  return hh*60+mm
}

function EventsTab({ onClutch:_, registered, setRegistered, waitlist, setWaitlist, lang, initialEventId, onClearInitialEvent, onPenalty, onOpenProfile, userId, centerLat, centerLng, isCertified, showToast, availSlots=[], suggestGroupEvent=false }:{
  onClutch:(p:Profile)=>void;
  registered:Set<string>; setRegistered:(fn:any)=>void;
  waitlist:Set<string>; setWaitlist:(fn:any)=>void;
  lang:Lang;
  centerLat?:number|null; centerLng?:number|null;
  initialEventId?:string|null;
  onClearInitialEvent?:()=>void;
  onPenalty?:(r:PenaltyReason)=>void;
  onOpenProfile?:(name:string,bio:string,photo:string|null)=>void;
  userId?:string;
  isCertified?:boolean;
  showToast?:(m:string,c?:string)=>void;
  availSlots?:{start:number;end:number}[];
  suggestGroupEvent?:boolean;
}) {
  const t = useT(lang)
  const EN = lang==='en'
  // Nudge bienveillant « event de groupe » : doux, dismissible, max 1×/semaine, jamais culpabilisant.
  const [nudgeHidden,setNudgeHidden] = useState(()=>{ try{ const ts=localStorage.getItem('nudge_grpev_last'); return ts ? (Date.now()-Number(ts) < 7*86400000) : false }catch{ return false } })
  const dismissNudge = ()=>{ try{ localStorage.setItem('nudge_grpev_last', String(Date.now())) }catch{} setNudgeHidden(true) }
  const [dbEvents, setDbEvents] = useState<any[]>([])
  const [evLoading, setEvLoading] = useState(true)
  const [cancelledNotice, setCancelledNotice] = useState<string|null>(null)

  const loadEvents = async () => {
    const { data } = await supabase.from('events').select('*').eq('active', true).order('sort_order').order('created_at')
    let rows = data || []
    // B8 — cohérence Démo/Réel : en Réel, on masque AUSSI les events créés par des bots (sinon on voyait
    // leurs events sans voir les gens — incohérent). Les events de partenaires/vrais users restent.
    if (!demoOn() && rows.length) {
      try {
        const { data: bots } = await supabase.from('profiles').select('id').eq('is_bot', true)
        const botIds = new Set((bots||[]).map((b:any)=>b.id))
        rows = rows.filter((e:any)=> !botIds.has(e.created_by))
      } catch {}
    }
    setDbEvents(rows)
    setEvLoading(false)
  }
  useEffect(() => {
    loadEvents()
    const t = setInterval(loadEvents, 10000)  // refresh : un event créé (par toi/bot) apparaît sans recharger
    return () => clearInterval(t)
  }, [])

  // Détection « créateur a flaké » : un event où JE suis inscrit a été annulé → notice + auto-libération (aucune pénalité pour moi)
  useEffect(() => {
    if (!userId) return
    ;(async () => {
      const { data: parts } = await supabase.from('event_participants').select('event_id').eq('user_id', userId)
      const ids = (parts||[]).map((p:any)=>p.event_id)
      if (!ids.length) return
      const { data: cancelled } = await supabase.from('events').select('id,title,created_by').in('id', ids).eq('status','cancelled')
      const mine = (cancelled||[]).filter((c:any)=>c.created_by!==userId)  // pas mes propres annulations
      if (mine.length) {
        setCancelledNotice(mine.map((c:any)=>c.title).join(' · '))
        await supabase.from('event_participants').delete().eq('user_id', userId).in('event_id', mine.map((c:any)=>c.id))
        setRegistered((prev:Set<string>)=>{ const n=new Set(prev); mine.forEach((c:any)=>n.delete(c.id)); return n })
      }
    })()
  }, [userId])

  const partnerEvents = dbEvents.length > 0 ? dbEvents.map(e => ({
    id: e.id,
    emoji: e.emoji || '🎉',
    title: e.title,
    creator: e.creator,
    created_by: e.created_by,
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
    isGroupe: e.type==='user',   // events créés par un user/bot = events de groupe
    type: e.type,                // pour le gate (eventMode : partner=planifié, sinon spontané)
    starts_at: (e as any).starts_at || null, // vrai timestamp → gate + occupation
    reviews: [],
  })) : ((()=>{ try{ return localStorage.getItem('clutch_demo_mode')==='0' ? [] : MOCK_EVENTS }catch{ return MOCK_EVENTS } })())  // 🤖 mock events masqués en mode Réel (clutch_demo_mode='0')

  // Events de groupe : démo bots + events créés par l'user dans cette session
  const [userGroupEvents, setUserGroupEvents] = useState<any[]>(GROUP_EVENTS_DEMO)
  const [groupJoined, setGroupJoined] = useState<Set<string>>(new Set())
  // Events annulés/masqués localement — filtre DUR (survit au refresh DB & aux blocages RLS). David : « il part et revient ».
  const [cancelledLocal, setCancelledLocal] = useState<Set<string>>(()=>{ try{const s=localStorage.getItem('clutch_cancelled_events');return s?new Set(JSON.parse(s)):new Set()}catch{return new Set()} })
  const hideEvent = (id:string) => setCancelledLocal(prev=>{ const n=new Set(prev); n.add(id); try{localStorage.setItem('clutch_cancelled_events',JSON.stringify([...n]))}catch{}; return n })

  // Fusion : partenaires/DB + groupe local — dédoublonné par id (la version DB prime sur la locale), moins les annulés
  const events = (() => {
    const seen = new Set(partnerEvents.map((e:any)=>e.id))
    return [...partnerEvents, ...userGroupEvents.filter((e:any)=>!seen.has(e.id))].filter((e:any)=>!cancelledLocal.has(e.id) && e.status!=='cancelled')
  })()

  // Création event groupe
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newEvEmoji, setNewEvEmoji] = useState('🍷')
  const [newEvTitle, setNewEvTitle] = useState('')
  const [newEvLieu, setNewEvLieu] = useState('')
  const [newEvTime, setNewEvTime] = useState(()=>{ const d=new Date(); d.setHours(d.getHours()+1,0,0,0); return d.toTimeString().slice(0,5) })   // défaut = prochaine heure ronde (toujours dans le futur)
  const [newEvDate, setNewEvDate] = useState('Aujourd\'hui') // Aujourd'hui / Demain (contraint)
  const [newEvDur, setNewEvDur] = useState(2) // durée en heures (David : obligatoire)
  const [newEvMax, setNewEvMax] = useState(6)
  const [newEvDesc, setNewEvDesc] = useState('')
  const [newEvPrice, setNewEvPrice] = useState('Gratuit') // prix (David : oublié)
  const [newEvFile, setNewEvFile] = useState<string|null>(null) // nom du fichier joint (prototype)
  const [newEvHome, setNewEvHome] = useState(false)   // 🏠 chez moi : on n'affiche que le quartier, adresse révélée 5 min avant / au clic de l'hôte
  const [newEvPinned, setNewEvPinned] = useState(false) // 📌 event fixe (cloué) : je ne fais que ça, pas contre-clutchable
  const [creating, setCreating] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [confirmCloseEv, setConfirmCloseEv] = useState(false)
  const newEvValid = !!(newEvTitle.trim() && newEvLieu.trim() && newEvTime.trim() && newEvDesc.trim()) // desc obligatoire (David)
  const newEvDirty = !!(newEvTitle || newEvLieu || newEvDesc) // pour confirmer la fermeture
  const tryCloseCreate = () => { if (newEvDirty && !creating) setConfirmCloseEv(true); else setShowCreateGroup(false) }
  const resetCreateEv = () => { setShowCreateGroup(false); setConfirmCloseEv(false); setNewEvTitle(''); setNewEvLieu(''); setNewEvTime(((d)=>{d.setHours(d.getHours()+1,0,0,0);return d.toTimeString().slice(0,5)})(new Date())); setNewEvDate('Aujourd\'hui'); setNewEvDesc(''); setNewEvEmoji('🍷'); setNewEvMax(6); setNewEvDur(2); setNewEvPrice('Gratuit'); setNewEvFile(null); setEvAddrResults([]); setEvShowSugg(false) }
  // Recherche d'adresse (réutilise Nominatim, comme la mise en ligne — David)
  const [evAddrResults,setEvAddrResults]=useState<any[]>([])
  const [evShowSugg,setEvShowSugg]=useState(false)
  const [evAddrLoading,setEvAddrLoading]=useState(false)
  const evAddrTimer=useRef<ReturnType<typeof setTimeout>|null>(null)
  const fmtEvAddr=(r:any):string=>{ const a=r.address||{}; const p=[a.road,a.house_number,a.postcode,a.city||a.town||a.village].filter(Boolean); return p.join(' ')||(r.display_name||'').split(',').slice(0,2).join(',').trim() }
  const searchEvAddr=async(q:string)=>{
    if(q.trim().length<3){ setEvAddrResults([]); setEvAddrLoading(false); return }
    setEvAddrLoading(true)
    try{
      const resp=await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&viewbox=6.0,47.0,7.2,46.0&bounded=0`,{headers:{'Accept-Language':lang==='fr'?'fr':'en'}})
      setEvAddrResults(await resp.json()||[])
    }catch{ setEvAddrResults([]) }
    setEvAddrLoading(false)
  }
  const handleEvLieuChange=(v:string)=>{ setNewEvLieu(v); setEvShowSugg(true); if(evAddrTimer.current)clearTimeout(evAddrTimer.current); evAddrTimer.current=setTimeout(()=>searchEvAddr(v),600) }
  const pickEvAddr=(name:string,addr?:string)=>{ setNewEvLieu(addr&&addr!==name?`${name}, ${addr}`:name); setEvShowSugg(false); setEvAddrResults([]) }

  const createGroupEvent = async () => {
    // David : si on ne peut pas publier, DIRE ce qui manque (au lieu d'un bouton mort)
    if (!newEvValid) {
      const miss:string[] = []
      if(!newEvTitle.trim()) miss.push(lang==='en'?'a title':'le titre')
      if(!newEvLieu.trim()) miss.push(lang==='en'?'a place':'le lieu')
      if(!newEvTime.trim()) miss.push(lang==='en'?'a time':'l\'heure')
      if(!newEvDesc.trim()) miss.push(lang==='en'?'a description':'la description')
      showToast?.((lang==='en'?'Missing: ':'Il manque : ')+miss.join(', '), C.orange)
      return
    }
    // Anti-contenu déplacé (David : « vérifier que les gens mettent pas n'importe quoi »)
    if (hasBannedWords(newEvTitle) || hasBannedWords(newEvDesc) || hasBannedWords(newEvLieu)) {
      showToast?.(lang==='en'?'Inappropriate wording — please rephrase':'Texte non autorisé — reformule sans mots déplacés', C.red); return
    }
    // Créneau valide : entre MAINTENANT et +18h (fenêtre structurelle Clutch) — David
    const [hh,mm] = newEvTime.split(':').map(Number)
    const target = new Date(); if(newEvDate==='Demain') target.setDate(target.getDate()+1); target.setHours(hh||0,mm||0,0,0)
    const now = new Date()
    if (target.getTime() < now.getTime()-60000) { showToast?.(lang==='en'?'That time is already past':'Cette heure est déjà passée', C.orange); return }
    // NB : fenêtre 18h retirée pour les events (décision David en attente) — « Demain » doit marcher. On garde juste « pas dans le passé ».
    setCreating(true)
    let realId = `g-user-${Date.now()}`
    // Persistance Supabase (additif). Si la migration events_mvp n'est pas encore
    // appliquée OU si l'insert échoue → on retombe sur l'event local (comportement actuel).
    try {
      if (userId) {
        const { data: ins } = await supabase.from('events').insert({
          title: newEvTitle.trim(), emoji: newEvEmoji, lieu: newEvLieu.trim(),
          event_time: newEvTime.trim(), event_date: newEvDate, spots: newEvMax,
          starts_at: target.toISOString(), // forteresse : vrai timestamp → l'event occupe un créneau (trigger occupancy)
          description: newEvDesc.trim() || 'Événement créé sur Clutch.',
          tags: ['groupe'], ev_gender: 'X', type: 'user', status: 'pending',
          active: true, created_by: userId, creator: 'Toi',
        }).select('id').single()
        if (ins?.id) {
          realId = ins.id
          // L'hôte compte comme 1er participant (le trigger met taken à jour)
          await supabase.from('event_participants').insert({ event_id: realId, user_id: userId })
        }
      }
    } catch { /* fallback local silencieux */ }
    await new Promise(r => setTimeout(r, 300))
    const newEv = {
      id: realId,
      emoji: newEvEmoji,
      title: newEvTitle.trim(),
      creator: 'Toi',
      creatorBio: 'Organisateur·ice de cet événement',
      creatorPhoto: null,
      certified: false,
      date: newEvDate,
      time: newEvTime.trim(),
      lieu: newEvLieu.trim(),
      spots: newEvMax,
      taken: 1,
      price: newEvPrice.trim() || 'Gratuit',
      bring: null,
      durationH: newEvDur,
      description: newEvDesc.trim() || 'Événement créé sur Clutch.',
      tags: ['groupe'],
      evGender: 'X',
      isGroupe: true,
      home_private: newEvHome,   // 🏠 adresse privée (quartier seulement)
      pinned: newEvPinned,       // 📌 event fixe (cloué)
      eventPhotos: [`linear-gradient(135deg,#542A44,#2a1020)`],
      eventPhotoEmojis: [newEvEmoji],
      reviews: [],
    }
    // Si persisté en DB → il reviendra via loadEvents (dédoublonné). Sinon (fallback) → on garde la version locale.
    if (!isRealEvent(realId)) setUserGroupEvents(prev => [newEv, ...prev])
    setGroupJoined(prev => new Set([...prev, newEv.id]))
    setCreating(false)
    setShowCreateGroup(false)
    setNewEvTitle(''); setNewEvLieu(''); setNewEvTime(((d)=>{d.setHours(d.getHours()+1,0,0,0);return d.toTimeString().slice(0,5)})(new Date())); setNewEvDate('Aujourd\'hui'); setNewEvDesc(''); setNewEvEmoji('🍷'); setNewEvMax(6); setNewEvDur(2); setNewEvPrice('Gratuit'); setNewEvFile(null); setEvShowSugg(false)
    loadEvents()   // refresh immédiat → l'event apparaît tout de suite
  }

  const [selEv, setSelEv] = useState<any|null>(()=>
    initialEventId ? (events.find((e:any)=>e.id===initialEventId) || MOCK_EVENTS.find(e=>e.id===initialEventId) || null) : null
  )
  const [selPartner, setSelPartner] = useState<any|null>(null) // fiche partenaire (clic sur une bannière)
  // Swipe-down pour fermer les sheets (drag vers le bas)
  const [sheetDragY, setSheetDragY] = useState(0)
  const sheetStartY = useRef<number|null>(null)
  const sheetHandlers = (onClose:()=>void) => ({
    onPointerDown:(e:React.PointerEvent)=>{ sheetStartY.current=e.clientY },
    onPointerMove:(e:React.PointerEvent)=>{ if(sheetStartY.current==null)return; const dy=e.clientY-sheetStartY.current; if(dy>0)setSheetDragY(dy) },
    onPointerUp:()=>{ const dy=sheetDragY; sheetStartY.current=null; if(dy>90){ setSheetDragY(0); onClose() } else setSheetDragY(0) },
    onPointerCancel:()=>{ sheetStartY.current=null; setSheetDragY(0) },
  })
  // Ouvre l'event demandé (depuis l'onglet Clutchs → « Mes événements ») dès que les vrais events (DB) sont chargés.
  // ONE-SHOT : on efface initialEventId juste après ouverture, sinon le refresh loadEvents (10s) rouvrait l'event en boucle.
  useEffect(() => {
    if (!initialEventId) return
    const found = events.find((e:any)=>e.id===initialEventId)
    if (found) { setSelEv(found); onClearInitialEvent?.() }
  }, [initialEventId, dbEvents, userGroupEvents]) // eslint-disable-line react-hooks/exhaustive-deps
  const [evFilter, setEvFilter] = useState('all')
  const [catFilter, setCatFilter] = useState<Set<string>>(new Set())  // catégories MULTI-select (David) : 0 cochée = toutes
  const [sortMode, setSortMode] = useState<'time'|'dist'|'pop'|'surprise'>('time')  // tri : au plus tôt / proche / populaires / 🎲 surprise (IA = au hasard les plus folles)
  const [surpriseSeed, setSurpriseSeed] = useState(0)  // re-tirage Surprise
  const [showRefine, setShowRefine] = useState(false)  // panneau « Affiner » (progressive disclosure)
  // 🤝 Partenaires suivis (prototype, persisté localStorage)
  const [followedPartners, setFollowedPartners] = useState<Set<string>>(()=>{ try{const s=localStorage.getItem('clutch_partners');return s?new Set(JSON.parse(s)):new Set()}catch{return new Set()} })
  const togglePartner = (id:string) => setFollowedPartners(prev=>{ const n=new Set(prev); n.has(id)?n.delete(id):n.add(id); try{localStorage.setItem('clutch_partners',JSON.stringify([...n]))}catch{}; return n })
  // 🤝 Mes groupes créés (prototype) — persisté localStorage
  const [myPartners, setMyPartners] = useState<any[]>(()=>{ try{const s=localStorage.getItem('clutch_my_partners');return s?JSON.parse(s):[]}catch{return []} })
  const [showCreatePartner, setShowCreatePartner] = useState(false)
  const [cpName,setCpName]=useState(''); const [cpCat,setCpCat]=useState(''); const [cpZone,setCpZone]=useState(''); const [cpDesc,setCpDesc]=useState(''); const [cpPrivate,setCpPrivate]=useState(false); const [cpEmoji,setCpEmoji]=useState('🎉'); const [cpFile,setCpFile]=useState<string|null>(null)
  const createPartner = () => {
    if(!cpName.trim()) return
    const g = { id:'my_'+Date.now(), emoji:cpEmoji, name:cpName.trim(), cat:cpCat.trim()||'Mon groupe', zone:cpZone.trim()||'Région Lausanne', members:1, desc:cpDesc.trim()||'Nouveau groupe Clutch.', next:'Aucun event pour l\'instant', verified:false, mine:true, isPrivate:cpPrivate, link:cpPrivate?`clutch.app/g/${Math.random().toString(36).slice(2,9)}`:null, file:cpFile||null }
    const next=[g,...myPartners]; setMyPartners(next); try{localStorage.setItem('clutch_my_partners',JSON.stringify(next))}catch{}
    setShowCreatePartner(false); setCpName('');setCpCat('');setCpZone('');setCpDesc('');setCpPrivate(false);setCpEmoji('🎉');setCpFile(null)
  }
  const CP_EMOJIS=['🎉','🎶','🏓','🎷','🥾','🍷','🎨','⚽','🧘','🎲','🍽️','👶','🎸','🎬','📚','🚲']
  const CP_ZONES=['Lausanne centre','Vieille Ville','Flon','Ouchy','Région Lausanne','Lavaux','Renens / Ouest','Autre']
  const [registering, setRegistering] = useState(false)
  const [nightMode, setNightMode] = useState(()=>{ try{return localStorage.getItem('clutch_night_active')==='1'}catch{return false} }) // 🌙 Clutch Night (mode nuit immersif)
  useEffect(()=>{ const h=()=>{ try{setNightMode(localStorage.getItem('clutch_night_active')==='1')}catch{} }; window.addEventListener('clutch-night-sync',h); return ()=>window.removeEventListener('clutch-night-sync',h) },[])
  const [regBlock, setRegBlock] = useState('') // alerte inline quand l'inscription est bloquée (plafond/chevauchement)
  useEffect(()=>{ setRegBlock(''); setCancelArmed(false) }, [selEv?.id]) // reset alertes à l'ouverture d'un autre event
  // Bannières partenaires : défilement auto (David). Avance d'une carte toutes les 3.5s, repart au début, pause au toucher.
  const bannerRef = useRef<HTMLDivElement>(null)
  const bannerPause = useRef(0)
  const createDragY = useRef(0) // swipe-down pour fermer la création d'event
  useEffect(()=>{
    if (evFilter!=='all') return
    const id = setInterval(()=>{
      const el = bannerRef.current; if(!el) return
      if (Date.now() < bannerPause.current) return
      const card = el.firstElementChild as HTMLElement | null
      const step = card ? card.offsetWidth + 11 : el.clientWidth*0.8
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 8) el.scrollTo({left:0,behavior:'smooth'})
      else el.scrollBy({left:step,behavior:'smooth'})
    }, 3500)
    return ()=>clearInterval(id)
  }, [evFilter])
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

  // 🌙 Clutch Night = mode nuit DANS Événements (David : « ça transforme l'app en truc de night »)
  const isNightEv = (ev:any):boolean => { const m=parseEventMinutes(ev.time); const s=(((ev?.tags||[]).join(' '))+' '+(ev?.title||'')+' '+(ev?.lieu||'')).toLowerCase(); return (m!=null && (m>=19*60 || m<5*60)) || /club|soir|nuit|jazz|concert|\bdj\b|techno|f[eê]te|danse|\bbar\b|after|rooftop|apéro|apero/.test(s) }
  // Catégories d'événements (MULTI-select) → matcher par tags. + Soirée/Lifestyle/Communauté (David 24.06)
  const CAT_MATCH: Record<string,(ev:any)=>boolean> = {
    sport:      ev => ['sport','running','escalade','vélo','ping-pong','roller','rando'].some(t=>(ev.tags||[]).includes(t)),
    bienetre:   ev => ['bien-être','yoga','méditation','plein air'].some(t=>(ev.tags||[]).includes(t)),
    culture:    ev => ['culture','art','théâtre','lecture','cinéma','histoire'].some(t=>(ev.tags||[]).includes(t)),
    gastro:     ev => ['gastronomie','cuisine','brunch','vin'].some(t=>(ev.tags||[]).includes(t)),
    musique:    ev => ['musique','jazz','indie','concert','dj','techno'].some(t=>(ev.tags||[]).includes(t)),
    soiree:     ev => isNightEv(ev) || ['soirée','club','fête','after','rooftop','danse','bar','apéro','apero'].some(t=>(ev.tags||[]).includes(t)),
    lifestyle:  ev => ['mode','lifestyle','photo','design','déco','bien-être'].some(t=>(ev.tags||[]).includes(t)),
    communaute: ev => !!(ev as any).isGroupe || ['communauté','networking','rencontre','discussion','débutant'].some(t=>(ev.tags||[]).includes(t)),
  }
  const filteredEvs = events.filter(ev => {
    if (nightMode && !isNightEv(ev)) return false   // mode nuit : seulement les sorties du soir/nuit
    // Catégories MULTI-select : si ≥1 cochée, l'event doit matcher au moins une (ET avec le filtre du haut)
    if (catFilter.size>0 && !Array.from(catFilter).some(k=>CAT_MATCH[k]?.(ev))) return false
    // Filtre du haut (scope / temps)
    if (evFilter==='mine') return registered.has(ev.id)
    if (evFilter==='groupe') return !!(ev as any).isGroupe
    if (evFilter==='soir') return ev.date === 'Ce soir'
    if (evFilter==='demain') return ev.date.toLowerCase().includes('demain')
    if (evFilter==='parents') return (ev as any).isParents === true
    if (evFilter==='evF') return (ev as any).evGender==='F'
    if (evFilter==='evX') return (ev as any).evGender==='X'
    return true   // 'all' (ou ancienne valeur catégorie) → passe ; les catégories sont gérées par catFilter
  })

  // Tri (panneau « Affiner ») : au plus tôt (défaut) · au plus proche · populaires
  const evTimeRank = (ev:any) => { const d=(ev?.date||'').toLowerCase(); if(d.includes('ce soir')||d.includes('tonight')||d.includes('aujour')||d.includes('today'))return 0; if(d.includes('demain')||d.includes('tomorrow'))return 1; return 2 }
  // 🎲 Surprise : ordre pseudo-aléatoire stable (seed) — l'IA te sort les events au hasard (proto). Re-tirage via surpriseSeed.
  const surpriseRank = (ev:any) => { let h=surpriseSeed*2654435761; const s=String(ev?.id||ev?.title||''); for(let i=0;i<s.length;i++) h=((h<<5)-h+s.charCodeAt(i))>>>0; return h }
  const sortedEvs = [...filteredEvs].sort((a:any,b:any)=>{
    if(sortMode==='surprise'){ return surpriseRank(a)-surpriseRank(b) }
    if(sortMode==='dist'){ return (eventKm(a, centerLat ?? 46.5197, centerLng ?? 6.6323) ?? 9999) - (eventKm(b, centerLat ?? 46.5197, centerLng ?? 6.6323) ?? 9999) }
    if(sortMode==='pop'){ return ((b.taken||0)/(b.spots||1)) - ((a.taken||0)/(a.spots||1)) }
    const r = evTimeRank(a)-evTimeRank(b); if(r!==0) return r; return String(a.time||'').localeCompare(String(b.time||''))
  })

  const isRealEvent = (id:any) => typeof id==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)
  const [cancelling, setCancelling] = useState(false)
  const [cancelArmed, setCancelArmed] = useState(false) // confirmation inline 2-temps pour annuler son event
  // Le CRÉATEUR annule son événement (= flake). Règle produit : les inscrits sont LIBÉRÉS
  // sans pénalité ; c'est le créateur qui perd des points de fiabilité (il a planté le groupe).
  // NOTE : pas de window.confirm (BLOQUÉ dans la WebView iOS → l'annulation ne se faisait jamais). Confirmation inline 2-temps.
  const cancelMyEvent = async (ev: any) => {
    setCancelling(true)
    try {
      if (isRealEvent(ev.id)) {
        // 🔔 Prévenir TOUS les inscrits AVANT de supprimer les participations (sinon on perd la liste).
        try {
          const { data: parts } = await supabase.from('event_participants').select('user_id').eq('event_id', ev.id)
          ;(parts||[]).forEach((p:any)=>{ if (p.user_id && p.user_id !== userId) pushTo(p.user_id,
            lang==='en'?'❌ Event cancelled':'❌ Événement annulé',
            lang==='en'?`"${ev.title}" was cancelled by the organizer — no penalty for you.`:`« ${ev.title} » a été annulé par l'organisateur·ice — aucune pénalité pour toi.`,
            { type:'event_cancelled', event_id: ev.id }) })
        } catch {}
        await supabase.from('events').update({ active:false, status:'cancelled' }).eq('id', ev.id)
        if (userId) {
          await supabase.from('event_participants').delete().eq('event_id', ev.id).eq('user_id', userId)
          const { data:p } = await supabase.from('profiles').select('reliability_score').eq('id', userId).maybeSingle()
          const cur = (p as any)?.reliability_score ?? 100
          await supabase.from('profiles').update({ reliability_score: Math.max(0, cur-10) }).eq('id', userId)
        }
      }
    } catch {}
    // Nettoyage local COMPLET + filtre DUR (sinon l'event « part et revient » au refresh DB / RLS — bug David)
    hideEvent(ev.id)
    setDbEvents(prev => prev.filter(e => e.id !== ev.id))
    setUserGroupEvents(prev => prev.filter(e => e.id !== ev.id))
    setRegistered((prev:Set<string>)=>{ const n=new Set(prev); n.delete(ev.id); return n })
    setGroupJoined(prev=>{ const n=new Set(prev); n.delete(ev.id); return n })
    setCancelling(false); setCancelArmed(false); setSelEv(null)
    showToast?.(lang==='en'?'Event cancelled':'Événement annulé', C.green)
  }
  const doRegister = async (ev: any) => {
    if (registered.has(ev.id)) return
    const EN = lang==='en'
    const isMine = (e:any)=> (userId && e.created_by===userId) || e.creator==='Toi'
    // Taxonomie 26.06 : un event SPONTANÉ doit tomber dans un de mes créneaux + horizon 18h ;
    // un PLANIFIÉ (partenaire) est libre. Fail-open si pas de starts_at OU pas de dispo → jamais de blocage parasite.
    // B7 — si pas de starts_at (mock/demo), on le DÉRIVE de ev.time (aujourd'hui, ou demain si l'heure est passée)
    // → le gate spontané s'applique à TOUS les events, pas seulement à ceux qui ont un vrai timestamp.
    const evStart = (()=>{
      if ((ev as any).starts_at) return new Date((ev as any).starts_at).getTime()
      const m = parseEventMinutes(ev.time); if (m==null) return null
      const d = new Date(); d.setHours(Math.floor(m/60), m%60, 0, 0); if (d.getTime() < Date.now()) d.setDate(d.getDate()+1)
      return d.getTime()
    })()
    if (evStart && availSlots.length) {
      const evEnd = evStart + (eventDurH(ev) || 3) * 3600000
      const gate = canRegisterEvent({ mode: eventMode((ev as any).type), eventStart: evStart, eventEnd: evEnd, now: Date.now(), availSlots })
      if (!gate.ok) {
        const m = gate.reason === 'beyond_horizon'
          ? (EN ? '⏱️ Too far ahead — Clutch is for soon (within 18h)' : '⏱️ Trop loin — Clutch c\'est pour bientôt (dans les 18h)')
          : (EN ? '⏱️ Outside your availability — get available then to join' : '⏱️ Hors de ta dispo — mets-toi dispo sur ce créneau pour rejoindre')
        setRegBlock(m); showToast?.(m, C.orange); setTimeout(()=>setRegBlock(''),6000)
        return
      }
    }
    // « occupé » = inscrit, NON annulé. (a) plafond ne compte PAS mes propres events (organiser ≠ consommer une place)
    const myBusy = events.filter((e:any)=> registered.has(e.id) && e.status!=='cancelled')
    const myJoined = myBusy.filter((e:any)=> !isMine(e))
    if (myJoined.length >= MAX_ACTIVE_EVENTS) {
      const msg = EN?`You're already in ${MAX_ACTIVE_EVENTS} events — leave one to join another.`:`Tu es déjà inscrit·e à ${MAX_ACTIVE_EVENTS} événements — désinscris-toi d'un pour en rejoindre un autre.`
      setRegBlock(msg); showToast?.(msg, C.orange); setTimeout(()=>setRegBlock(''),5000)
      return
    }
    // (b) Anti-chevauchement : même jour + créneaux qui se recouvrent (inclut mes propres events)
    const aStart = parseEventMinutes(ev.time)
    if (aStart != null) {
      const aEnd = aStart + eventDurH(ev)*60
      const clash = myBusy.find((e:any)=>{
        if ((e.date||'') !== (ev.date||'')) return false
        const bStart = parseEventMinutes(e.time); if (bStart == null) return false
        const bEnd = bStart + eventDurH(e)*60
        return aStart < bEnd && bStart < aEnd   // recouvrement
      })
      if (clash) {
        const msg = EN?`Overlaps with "${clash.title}" (${clash.time}). Leave it first.`:`Chevauche « ${clash.title} » (${clash.time}). Désinscris-toi d'abord.`
        setRegBlock(msg); showToast?.(msg, C.orange); setTimeout(()=>setRegBlock(''),5000)
        return
      }
    }
    setRegBlock('')
    setRegistering(true)
    // Persistance : rejoint pour de vrai si event réel (UUID Supabase) + user connecté
    if (isRealEvent(ev.id) && userId) {
      const { error } = await supabase.from('event_participants').insert({ event_id: ev.id, user_id: userId })
      if (error) {
        // Forteresse : l'event chevauche un RDV déjà confirmé (occ_no_overlap) → on refuse en douceur
        const conflit = (error as any).code==='23P01' || /occ_no_overlap|exclusion|overlap/i.test(error.message||'')
        if (conflit) {
          const m = EN?'⏱️ You already have a meetup at that time':'⏱️ Tu as déjà un rendez-vous à cette heure'
          setRegBlock(m); showToast?.(m, C.salmon); setTimeout(()=>setRegBlock(''),5000)
          setRegistering(false); return
        }
        // autre erreur (RLS, etc.) → on tolère comme avant (optimiste local)
      }
    }
    // J'ai réclamé une place → je quitte la liste d'attente (DB + local).
    try { if (isRealEvent(ev.id) && userId) await supabase.from('event_waitlist').delete().eq('event_id', ev.id).eq('user_id', userId) } catch {}
    setWaitlist((prev:Set<string>)=>{ const n=new Set(prev); n.delete(ev.id); return n })
    await new Promise(r=>setTimeout(r,400))
    setRegistered((prev:Set<string>)=>new Set([...prev,ev.id]))
    // Compteur optimiste : +1 inscrit tout de suite (le trigger DB le confirme, loadEvents resynchronise)
    setSelEv((s:any)=> s && s.id===ev.id ? {...s, taken:(s.taken||0)+1} : s)
    setUserGroupEvents(prev=>prev.map((e:any)=>e.id===ev.id?{...e,taken:(e.taken||0)+1}:e))
    setRegistering(false)
    loadEvents()
    // 🔔 Notifs event (David : « quelqu'un s'inscrit → l'orga est prévenu »). L'orga reçoit la push ;
    // si l'event devient complet, une 2e push. (Pas de push à soi-même : on a déjà le ✓ in-app.)
    const newTaken = (ev.taken||0)+1
    const orga = (ev as any).created_by
    if (orga && orga !== userId) {
      pushTo(orga, lang==='en'?'🎉 New sign-up':'🎉 Nouvelle inscription',
        (lang==='en'?`Someone joined "${ev.title}"`:`Quelqu'un a rejoint « ${ev.title} »`)+` (${newTaken}/${ev.spots})`,
        { type:'event_join', event_id: ev.id })
      if (newTaken >= (ev.spots||0)) {
        pushTo(orga, lang==='en'?'🔥 Event full':'🔥 Événement complet',
          lang==='en'?`"${ev.title}" is now full (${ev.spots}/${ev.spots})`:`« ${ev.title} » est complet (${ev.spots}/${ev.spots})`,
          { type:'event_full', event_id: ev.id })
      }
    }
    // Auto-ferme la sheet après 1.5s (laisse voir la confirmation)
    setTimeout(() => setSelEv(null), 1500)
  }

  return (
    <div className="fi" style={{position:'fixed',inset:0,bottom:'calc(72px + var(--sab))',background:C.bg,display:'flex',flexDirection:'column',transition:'background .3s'}}>
      <div style={{padding:'8px 14px',paddingTop:'calc(var(--sat) + 8px)',borderBottom:`1px solid ${C.border}`,flexShrink:0,background:'transparent'}}>
        {/* En-tête COMPACT une ligne (David : libérer l'espace en haut, titre redondant retiré — déjà dans la nav du bas) */}
        <style>{`@keyframes cnMoonGlow{0%,100%{filter:drop-shadow(0 0 2px rgba(235,107,175,.45))}50%{filter:drop-shadow(0 0 8px rgba(235,107,175,.95))}}@keyframes cnMoonSway{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}.cn-moon{display:inline-block;animation:cnMoonGlow 2.6s ease-in-out infinite,cnMoonSway 4s ease-in-out infinite}`}</style>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          {/* 🌙 Clutch Night — LUNE ANIMÉE, bouton rond (David : une lune, pas un sablier, et animée) */}
          <button onClick={()=>setNightMode(v=>{ const nv=!v; try{localStorage.setItem('clutch_night_active',nv?'1':'0')}catch{}; return nv })} title={EN?'Clutch Night — nightlife & afters':'Clutch Night — soirées & afters'} style={{flexShrink:0,width:38,height:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontFamily:'inherit',padding:0,
            border:nightMode?'1px solid rgba(235,107,175,.6)':`1px solid ${C.border}`,
            background:nightMode?'linear-gradient(120deg,#532943,#2C1020)':'#fff',boxShadow:nightMode?'0 0 12px rgba(235,107,175,.5)':'0 1px 3px rgba(120,115,125,.18), 0 4px 10px rgba(120,115,125,.20)',transition:'.2s'}}>
            <span className="cn-moon" style={{fontSize:18,lineHeight:1}}>🌙</span>
          </button>
          {/* 🟢 Pastille « Mes events » — apparaît UNIQUEMENT si tu es inscrit à des events (David). Toggle le filtre « mine ». */}
          {registered.size>0 && (
            <button onClick={()=>setEvFilter(f=>f==='mine'?'all':'mine')} title={EN?'My events':'Mes events'} style={{flexShrink:0,position:'relative',width:38,height:38,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontFamily:'inherit',padding:0,
              border:evFilter==='mine'?`1px solid ${C.green}`:`1px solid ${C.border}`,
              background:evFilter==='mine'?`${C.green}1a`:'#fff',boxShadow:evFilter==='mine'?`0 0 10px ${C.green}66`:'0 1px 3px rgba(120,115,125,.18), 0 4px 10px rgba(120,115,125,.20)',transition:'.2s'}}>
              <span style={{fontSize:17,lineHeight:1}}>🎟️</span>
              <span style={{position:'absolute',top:-3,right:-3,minWidth:16,height:16,padding:'0 4px',borderRadius:8,background:C.green,color:'#fff',fontSize:9,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',border:'2px solid #fff'}}>{registered.size}</span>
            </button>
          )}
          {/* Filtres (scroll horizontal) */}
          <div style={{display:'flex',gap:6,overflowX:'auto',whiteSpace:'nowrap',flex:1,minWidth:0,paddingBottom:2}}>
          {EV_FILTERS.map(f=>{
            const countForFilter = (fid:string) => {
              if (fid==='all') return events.length
              if (fid==='partenaires') return PARTNERS_MOCK.length
              if (fid==='mine') return events.filter(ev=>registered.has(ev.id)).length
              if (fid==='groupe') return events.filter(ev=>(ev as any).isGroupe).length
              if (fid==='soir') return events.filter(ev=>ev.date==='Ce soir').length
              if (fid==='demain') return events.filter(ev=>ev.date.toLowerCase().includes('demain')).length
              if (fid==='sport') return events.filter(ev=>ev.tags.includes('sport')||ev.tags.includes('running')||ev.tags.includes('escalade')||ev.tags.includes('vélo')).length
              if (fid==='bienetre') return events.filter(ev=>ev.tags.includes('bien-être')||ev.tags.includes('yoga')||ev.tags.includes('méditation')).length
              if (fid==='culture') return events.filter(ev=>ev.tags.includes('culture')||ev.tags.includes('art')||ev.tags.includes('théâtre')||ev.tags.includes('lecture')).length
              if (fid==='gastro') return events.filter(ev=>ev.tags.includes('gastronomie')||ev.tags.includes('cuisine')||ev.tags.includes('brunch')).length
              if (fid==='musique') return events.filter(ev=>ev.tags.includes('musique')||ev.tags.includes('jazz')||ev.tags.includes('indie')).length
              if (fid==='parents') return events.filter(ev=>(ev as any).isParents===true).length
              if (fid==='evF') return events.filter(ev=>(ev as any).evGender==='F').length
              if (fid==='evX') return events.filter(ev=>(ev as any).evGender==='X').length
              return 0
            }
            const cnt = countForFilter(f.id)
            const inactive = f.id !== 'all' && cnt === 0
            return (
              <button key={f.id} onClick={()=>!inactive&&setEvFilter(f.id)}
                style={{padding:'5px 10px',borderRadius:20,border:`1px solid ${evFilter===f.id?C.orange:inactive?`${C.border}44`:C.border}`,background:evFilter===f.id?C.orangeFaint:'transparent',color:evFilter===f.id?C.orange:inactive?`${C.whiteMid}44`:C.whiteMid,fontSize:11,fontWeight:evFilter===f.id?800:500,cursor:inactive?'default':'pointer',fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0,display:'flex',alignItems:'center',gap:4}}>
                <span>{f.icon} {t(f.trKey)}</span>
                {cnt > 0 && <span style={{background:evFilter===f.id?C.orange:`${C.whiteMid}30`,color:evFilter===f.id?'#fff':C.whiteMid,borderRadius:10,padding:'0 5px',fontSize:9,fontWeight:900,minWidth:14,textAlign:'center'}}>{cnt}</span>}
              </button>
            )
          })}
          </div>
          {/* ⚙ Affiner — ouvre le panneau tri + catégories (progressive disclosure) */}
          <button onClick={()=>setShowRefine(v=>!v)} title={EN?'Refine':'Affiner'} style={{flexShrink:0,width:36,height:36,borderRadius:'50%',background:(showRefine||sortMode!=='time'||['sport','bienetre','culture','gastro','musique'].includes(evFilter))?`${C.pink}14`:'transparent',border:`1px solid ${(showRefine||sortMode!=='time'||['sport','bienetre','culture','gastro','musique'].includes(evFilter))?C.pink:C.border}`,color:(showRefine||sortMode!=='time'||['sport','bienetre','culture','gastro','musique'].includes(evFilter))?C.pink:C.whiteMid,fontSize:15,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',transition:'.15s'}}>⚙</button>
          {/* + Organiser (compact, rond) */}
          <button onClick={()=>setShowCreateGroup(true)} title={EN?'Host an event':'Organiser un événement'} style={{flexShrink:0,width:36,height:36,borderRadius:'50%',background:C.salmonFaint,border:`1px solid ${C.salmon}44`,color:C.salmon,fontSize:21,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1,paddingBottom:2}}>+</button>
        </div>
        {/* 🔍 Panneau « Affiner » — tri + catégories précises (caché par défaut) */}
        {showRefine && (
          <div style={{marginTop:8,paddingTop:9,borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:C.whiteMid,marginBottom:5}}>{EN?'Sort by':'Trier par'}</div>
            <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
              {([{k:'time',e:'⏱',l:EN?'Soonest':'Au plus tôt'},{k:'dist',e:'📡',l:EN?'Nearest':'Au plus proche'},{k:'pop',e:'🔥',l:EN?'Popular':'Populaires'},{k:'surprise',e:'🎲',l:'Surprise'}] as const).map(s=>{ const on=sortMode===s.k; const isSurprise=s.k==='surprise'; return (
                <button key={s.k} onClick={()=>{ setSortMode(s.k); if(isSurprise) setSurpriseSeed(x=>x+1) }} style={{flex:'1 1 0',minWidth:72,padding:'7px 4px',borderRadius:10,border:`1.5px solid ${on?(isSurprise?'#8E7CC3':C.pink):C.border}`,background:on?(isSurprise?'linear-gradient(120deg,#EB6BAF22,#8E7CC322,#77BC1F22)':`${C.pink}12`):'transparent',color:on?(isSurprise?'#7A5BB0':C.pink):C.whiteMid,fontSize:10.5,fontWeight:on?800:600,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>{s.e} {s.l}{isSurprise&&on?' ↻':''}</button>
              )})}
            </div>
            <div style={{fontSize:9,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',color:C.whiteMid,marginBottom:5}}>{EN?'Categories':'Catégories'}{catFilter.size>0?` · ${catFilter.size}`:''} <span style={{fontWeight:500,textTransform:'none',letterSpacing:0}}>{EN?'(multi)':'(plusieurs possibles)'}</span></div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {([{k:'sport',e:'🏃',l:'Sport'},{k:'bienetre',e:'🧘',l:EN?'Wellness':'Bien-être'},{k:'culture',e:'🎭',l:'Culture'},{k:'gastro',e:'🍽',l:EN?'Food':'Gastro'},{k:'musique',e:'🎵',l:EN?'Music':'Musique'},{k:'soiree',e:'🌃',l:EN?'Nightlife':'Soirée'},{k:'lifestyle',e:'✨',l:'Lifestyle'},{k:'communaute',e:'🫂',l:EN?'Community':'Communauté'}] as const).map(c=>{ const on=catFilter.has(c.k); return (
                <button key={c.k} onClick={()=>setCatFilter(prev=>{ const n=new Set(prev); n.has(c.k)?n.delete(c.k):n.add(c.k); return n })} style={{padding:'5px 11px',borderRadius:20,border:`1px solid ${on?C.pink:C.border}`,background:on?`${C.pink}12`:'transparent',color:on?C.pink:C.whiteMid,fontSize:11,fontWeight:on?800:500,cursor:'pointer',fontFamily:'inherit'}}>{on&&'✓ '}{c.e} {c.l}</button>
              )})}
              {catFilter.size>0 && <button onClick={()=>setCatFilter(new Set())} style={{padding:'5px 11px',borderRadius:20,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:11,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>✕ {EN?'Clear':'Effacer'}</button>}
            </div>
          </div>
        )}
      </div>
      <div style={{flex:1,overflowY:'auto',overflowX:'hidden',WebkitOverflowScrolling:'touch',minHeight:0,padding:'10px 14px',boxSizing:'border-box'}}>
        {/* 🫂 VUE COMMUNAUTÉ (prototype) — UNIQUEMENT les groupes à suivre (les partenaires payants sont déjà
            mis en avant en bannières dans « Tout »). Demande David : ne pas remettre les partenaires ici. */}
        {evFilter==='partenaires' && (<>
          <div style={{background:`${C.plum}0a`,border:`1px solid ${C.border}`,borderRadius:14,padding:'12px 14px',marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:800,color:C.plum,marginBottom:3}}>🫂 {EN?'Groups to follow':'Groupes à suivre'}</div>
            <div style={{fontSize:11.5,color:C.whiteMid,lineHeight:1.5}}>{EN?<><b>“All”</b> = one-off events. <b>Here</b> = the <b>recurring groups</b> (clubs, collectives) you follow to get <b>notified</b> of their new events. Your network builds itself.</>:<><b>« Tout »</b> = les événements ponctuels. <b>Ici</b> = les <b>groupes récurrents</b> (clubs, collectifs) que tu suis pour être <b>notifié·e</b> de leurs nouveaux events. Ton réseau se construit tout seul.</>}</div>
          </div>
          {/* Groupes suivis — visibles en un coup d'œil (David : « ils apparaissent où ? ») */}
          {(()=>{ const fol = PARTNERS_MOCK.filter((p:any)=>followedPartners.has(p.id)); if(!fol.length) return null; return (
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:C.green,marginBottom:7}}>✓ {EN?`You follow ${fol.length} group${fol.length>1?'s':''}`:`Tu suis ${fol.length} groupe${fol.length>1?'s':''}`}</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
                {fol.map((p:any)=>(
                  <span key={p.id} style={{display:'inline-flex',alignItems:'center',gap:5,background:`${C.green}10`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'5px 11px',fontSize:12,fontWeight:700,color:C.white}}>
                    <span style={{fontSize:13}}>{p.emoji}</span>{p.name}
                  </span>
                ))}
              </div>
            </div>
          )})()}
          <button onClick={()=>setShowCreatePartner(true)} style={{width:'100%',padding:'13px',borderRadius:14,border:`1.5px dashed ${C.plum}`,background:'transparent',color:C.plum,fontSize:13.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:14}}>+ {EN?'Create my group':'Créer mon groupe'}</button>
          {/* Mes groupes créés */}
          {myPartners.map((p:any)=>(
            <div key={p.id} style={{background:C.bgCard,border:`1.5px solid ${C.plum}`,borderRadius:16,padding:'13px 14px',marginBottom:11}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                <div style={{width:46,height:46,borderRadius:14,background:`${C.plum}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{p.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap'}}>
                    <span style={{fontSize:15,fontWeight:900,color:C.white}}>{p.name}</span>
                    <span style={{fontSize:9,fontWeight:800,color:C.plum,background:`${C.plum}14`,borderRadius:8,padding:'1px 6px'}}>{EN?'My group':'Mon groupe'}</span>
                    {p.isPrivate&&<span style={{fontSize:9,fontWeight:800,color:C.whiteMid,background:`${C.border}`,borderRadius:8,padding:'1px 6px'}}>🔒 {EN?'Private':'Privé'}</span>}
                  </div>
                  <div style={{fontSize:11,color:C.whiteMid,marginTop:1}}>{p.cat} · 📍 {p.zone}</div>
                  <div style={{fontSize:12,color:C.whiteMid,marginTop:6,lineHeight:1.45}}>{p.desc}</div>
                  {p.file&&<div style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:10.5,color:C.green,marginTop:7,background:`${C.green}10`,border:`1px solid ${C.green}33`,borderRadius:8,padding:'4px 8px'}}>📄 {p.file}</div>}
                  {p.isPrivate&&p.link&&<div style={{fontSize:10.5,color:C.plum,marginTop:7,background:`${C.plum}0a`,borderRadius:8,padding:'5px 8px',wordBreak:'break-all'}}>🔗 {EN?'Private link':'Lien privé'} : {p.link}</div>}
                </div>
              </div>
              <button onClick={()=>{ const next=myPartners.filter((x:any)=>x.id!==p.id); setMyPartners(next); try{localStorage.setItem('clutch_my_partners',JSON.stringify(next))}catch{} }} style={{width:'100%',marginTop:11,padding:'9px',borderRadius:12,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{EN?'Delete this group':'Supprimer ce groupe'}</button>
            </div>
          ))}
          {PARTNERS_MOCK.filter((p:any)=>!p.verified).map(p=>{ const on=followedPartners.has(p.id); return (
            <div key={p.id} style={{background:C.bgCard,border:`1px solid ${on?C.plum:C.border}`,borderRadius:16,padding:'13px 14px',marginBottom:11,boxShadow:'0 2px 10px rgba(83,41,67,.05)'}}>
              <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                <div style={{width:46,height:46,borderRadius:14,background:`${C.plum}12`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0}}>{p.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:5}}>
                    <span style={{fontSize:15,fontWeight:900,color:C.white}}>{p.name}</span>
                    <span style={{fontSize:9,fontWeight:800,color:C.whiteMid,background:`${C.border}`,borderRadius:8,padding:'1px 6px'}}>{EN?'Private group':'Groupe privé'}</span>
                  </div>
                  <div style={{fontSize:11,color:C.whiteMid,marginTop:1}}>{p.cat} · 📍 {p.zone}</div>
                  <div style={{fontSize:12,color:C.whiteMid,marginTop:6,lineHeight:1.45}}>{p.desc}</div>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginTop:9,flexWrap:'wrap'}}>
                    <span style={{fontSize:11,fontWeight:700,color:C.plum,background:`${C.plum}0d`,borderRadius:8,padding:'3px 8px'}}>🗓 {p.next}</span>
                    <span style={{fontSize:10.5,color:C.whiteMid}}>👥 {p.members} {EN?'members':'membres'}</span>
                  </div>
                </div>
              </div>
              <button onClick={()=>togglePartner(p.id)} style={{width:'100%',marginTop:11,padding:'10px',borderRadius:12,border:`1.5px solid ${C.plum}`,background:on?'transparent':C.plum,color:on?C.plum:'#fff',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                {on?(EN?'✓ Following · notifs on':'✓ Suivi · notifs activées'):(EN?'+ Follow this group':'+ Suivre ce groupe')}
              </button>
            </div>
          )})}
          <div style={{fontSize:10.5,color:C.whiteMid,textAlign:'center',lineHeight:1.5,opacity:.8,padding:'8px 10px 4px'}}>{EN?<>Prototype — you can create your group (public or private by link), pick a <b>region</b> (exact address revealed before the meetup) and attach a <b>file</b>. Real notification delivery comes in V2.</>:<>Prototype — tu peux créer ton groupe (public ou privé par lien), choisir une <b>région</b> (adresse révélée avant le RDV) et y joindre un <b>fichier</b>. La diffusion réelle des notifs arrive en V2.</>}</div>
        </>)}
        {evFilter!=='partenaires' && (<>
        {/* ✨ BANNIÈRES PARTENAIRES (payants = pub) — TOUJOURS affichées sur tous les filtres events (David : non filtrables). */}
        {PARTNERS_MOCK.filter((p:any)=>p.verified).length>0 && (
          /* STICKY : la bannière partenaires reste visible quand on scrolle les events (David : les partenaires veulent être vus). */
          <div style={{position:'sticky',top:-2,zIndex:6,marginBottom:12,paddingTop:2,paddingBottom:4,background:C.bg}}>
            <style>{`@keyframes ptnShine{0%{background-position:-180% 0}100%{background-position:180% 0}} .ptnShine::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.16) 50%,transparent 65%);background-size:200% 100%;animation:ptnShine 3.2s linear infinite;pointer-events:none}`}</style>
            <div ref={bannerRef} onPointerDown={()=>{bannerPause.current=Date.now()+7000}} style={{display:'flex',gap:9,overflowX:'auto',WebkitOverflowScrolling:'touch',scrollSnapType:'x mandatory',scrollBehavior:'smooth',padding:'1px 2px 2px',margin:'0 -2px'}}>
              {PARTNERS_MOCK.filter((p:any)=>p.verified).map((p:any)=>{ const on=followedPartners.has(p.id); return (
                <div key={p.id} onClick={()=>setSelPartner(p)} style={{flexShrink:0,width:'82%',maxWidth:310,scrollSnapAlign:'start',cursor:'pointer',borderRadius:14,overflow:'hidden',position:'relative',background:'#fff',border:`1.5px solid ${C.border}`,boxShadow:'0 4px 14px rgba(83,41,67,.16)',minHeight:84,display:'flex',alignItems:'stretch'}}>
                  {/* Photo qui POP à gauche (vraie image, plus de voile prune) — design David : fond clair + photo qui tape */}
                  <div style={{width:98,flexShrink:0,position:'relative',background:'#eee'}}>
                    {p.photo ? <img src={p.photo} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}}/> : <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,background:`linear-gradient(135deg,${C.plum},#2C1020)`}}>{p.emoji}</div>}
                    <span style={{position:'absolute',top:6,left:6,fontSize:7.5,fontWeight:900,color:'#fff',background:'#EB6BAF',borderRadius:6,padding:'1px 6px',letterSpacing:'.04em',boxShadow:'0 1px 4px rgba(0,0,0,.3)'}}>★ PARTENAIRE</span>
                  </div>
                  {/* Infos sur fond clair, contraste fort */}
                  <div style={{flex:1,minWidth:0,padding:'9px 11px',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                    <div style={{minWidth:0}}>
                      <div style={{fontSize:14.5,fontWeight:900,color:C.plum,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.name}</div>
                      <div style={{fontSize:10,color:C.whiteMid,marginTop:2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.cat} · 📍 {p.zone}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginTop:7}}>
                      <span style={{fontSize:9.5,fontWeight:800,color:C.plum,background:`${C.pink}1f`,borderRadius:7,padding:'2px 7px',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',minWidth:0}}>🗓 {p.next}</span>
                      <button onClick={(e)=>{e.stopPropagation();togglePartner(p.id)}} style={{flexShrink:0,fontSize:10,fontWeight:800,color:on?'#EB6BAF':'#fff',background:on?'transparent':'#EB6BAF',border:on?'1px solid #EB6BAF':'none',borderRadius:8,padding:'4px 11px',cursor:'pointer',fontFamily:'inherit'}}>{on?'✓ Suivi':'+ Suivre'}</button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        )}
        {suggestGroupEvent && !nudgeHidden && (
          <div style={{background:`${C.green}10`,border:`1px solid ${C.green}44`,borderRadius:12,padding:'11px 13px',marginBottom:10,display:'flex',alignItems:'flex-start',gap:9}}>
            <span style={{fontSize:18,flexShrink:0}}>🌱</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12.5,fontWeight:800,color:C.white}}>{EN?'Want to meet more easily?':'Envie de rencontrer plus facilement ?'}</div>
              <div style={{fontSize:11.5,color:C.whiteMid,marginTop:2,lineHeight:1.45}}>{EN?'A group event is often the easiest way for a first time. Have a look below 👇':'Un événement de groupe, c\'est souvent le plus simple pour une première fois. Jette un œil ci-dessous 👇'}</div>
            </div>
            <button onClick={dismissNudge} aria-label="Fermer" style={{background:'none',border:'none',color:C.whiteMid,fontSize:16,cursor:'pointer',padding:0,flexShrink:0}}>✕</button>
          </div>
        )}
        {cancelledNotice && (
          <div style={{background:'rgba(220,80,80,.1)',border:`1px solid ${C.red}44`,borderRadius:12,padding:'11px 13px',marginBottom:10,display:'flex',alignItems:'flex-start',gap:8}}>
            <span style={{fontSize:16}}>🚫</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:800,color:C.white}}>{lang==='en'?'Event cancelled by the organizer':'Événement annulé par l\'organisateur·ice'}</div>
              <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{cancelledNotice} — {lang==='en'?'you\'ve been freed, no penalty for you.':'tu es libéré·e, aucune pénalité pour toi.'}</div>
            </div>
            <button onClick={()=>setCancelledNotice(null)} style={{background:'none',border:'none',color:C.whiteMid,fontSize:16,cursor:'pointer',padding:0}}>✕</button>
          </div>
        )}
        {/* Place libérée : event où je suis sur liste d'attente ET où une place s'est ouverte */}
        {events.filter((ev:any)=>waitlist.has(ev.id) && ev.taken < ev.spots && !registered.has(ev.id)).map((ev:any)=>(
          <div key={'freed-'+ev.id} style={{background:`${C.green}12`,border:`1px solid ${C.green}55`,borderRadius:12,padding:'11px 13px',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
            <span style={{fontSize:18}}>🎉</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:800,color:C.green}}>{lang==='en'?'A spot opened up!':'Une place s\'est libérée !'}</div>
              <div style={{fontSize:11,color:C.whiteMid,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.title}</div>
            </div>
            <button onClick={()=>{ setWaitlist((prev:Set<string>)=>{const n=new Set(prev);n.delete(ev.id);return n}); doRegister(ev) }}
              style={{flexShrink:0,padding:'8px 12px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
              {lang==='en'?'Join now':'Rejoindre'}
            </button>
          </div>
        ))}
        {filteredEvs.length===0 && (
          <div style={{textAlign:'center',padding:'50px 20px',color:C.whiteMid}}>
            <div style={{fontSize:28,marginBottom:8}}>📅</div>
            <div style={{fontSize:13,fontWeight:700,color:C.white}}>{lang==='en'?'No events in this category':'Aucun événement dans cette catégorie'}</div>
          </div>
        )}
        {/* 2 événements par ligne (demande Mel). minmax(0,1fr) = empêche une carte au contenu large de faire DÉPASSER la grille de l'écran (bug overflow « Tout »). */}
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1fr)',gap:11,width:'100%',boxSizing:'border-box'}}>
        {sortedEvs.map(ev=>{
          const photo = eventPhotoFor(ev)
          const isImg = true   // eventPhotoFor garantit toujours une photo (vraie ou de secours)
          const pct = Math.min(100, Math.round((ev.taken/ev.spots)*100))
          const km = eventKm(ev, centerLat ?? 46.5197, centerLng ?? 6.6323)
          const cPhoto = (ev as any).creatorPhoto
          const cat = eventCat(ev)  // 🎨 catégorie + couleur (prototype système couleurs)
          return (
          <div key={ev.id} onClick={()=>{setSelEv(ev);setEvPhotoIdx(0)}} style={{background:C.bgCard,border:`1px solid ${registered.has(ev.id)?C.green:C.border}`,borderRadius:16,cursor:'pointer',overflow:'hidden',minWidth:0,boxShadow:'0 1px 3px rgba(120,115,125,.14), 0 5px 14px rgba(120,115,125,.16)'}}>
            {/* Photo — DUOTONE par catégorie (photo désaturée + voile de la couleur du type). Prototype système couleurs. */}
            <div style={{position:'relative',height:104,background:isImg?'#e9e4e7':`linear-gradient(135deg,${C.plum},${C.bgSheet})`,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'16px 16px 0 0'}}>
              {isImg ? <img src={photo} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',borderRadius:'16px 16px 0 0',filter:'saturate(.5) contrast(1.03)'}}/> : <span style={{fontSize:42}}>{ev.emoji}</span>}
              {/* Voile couleur de la catégorie (duotone) */}
              <div style={{position:'absolute',inset:0,background:cat.c,mixBlendMode:'multiply',opacity:.5,borderRadius:'16px 16px 0 0'}}/>
              <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.66) 0%,rgba(0,0,0,.12) 48%,transparent 74%)',borderRadius:'16px 16px 0 0'}}/>
              {/* Pastille catégorie colorée */}
              <span style={{position:'absolute',top:7,left:7,fontSize:8,fontWeight:900,letterSpacing:'.02em',color:'#fff',background:cat.c,borderRadius:6,padding:'2px 7px',boxShadow:'0 1px 4px rgba(0,0,0,.35)',display:'inline-flex',alignItems:'center',gap:3}}>{ev.certified&&<span>✓</span>}{cat.l.toUpperCase()}</span>
              {registered.has(ev.id)&&<span style={{position:'absolute',top:7,right:7,fontSize:8,background:C.green,color:'#fff',borderRadius:5,padding:'1px 6px',fontWeight:800}}>✓ Inscrit·e</span>}
              {/* Titre sur la photo (décalé à droite de l'avatar) */}
              <div style={{position:'absolute',bottom:8,left:cPhoto?56:10,right:9}}>
                <div style={{fontSize:13.5,fontWeight:900,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,.75)',lineHeight:1.15,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ev.title}</div>
              </div>
              {/* Avatar organisateur — overlap coin bas-gauche (design Mel) */}
              {cPhoto && <img src={cPhoto} alt="" style={{position:'absolute',bottom:-15,left:10,width:38,height:38,borderRadius:'50%',objectFit:'cover',border:'2.5px solid #fff',boxShadow:'0 2px 7px rgba(83,41,67,.28)',zIndex:2}}/>}
            </div>
            {/* Footer */}
            <div style={{padding:'8px 11px 10px',paddingTop:cPhoto?9:8}}>
              {/* Ligne 1 : créateur (décalé sous l'avatar) + 📡 distance radar à droite */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,marginBottom:3,marginLeft:cPhoto?40:0,minHeight:cPhoto?16:0}}>
                <span style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}><span style={{fontSize:11.5,fontWeight:800,color:C.white,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.creator||''}</span>{(ev as any).pinned && <span title={EN?'Fixed event':'Event fixe'} style={{fontSize:10,flexShrink:0}}>📌</span>}</span>
                {km!=null && <KmRadar km={km}/>}
              </div>
              <div style={{fontSize:11,color:C.white,fontWeight:800,marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>🕐 {locDay(fixEventDate(ev.date),EN)} · {ev.time} <span style={{color:C.whiteMid,fontWeight:600}}>· {eventDurLabel(ev)}</span></div>
              <div style={{fontSize:10.5,color:C.whiteMid,fontWeight:600,marginBottom:7,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{(ev as any).home_private?'🏠 ':'📍 '}{evLieuDisplay(ev,EN)}</div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:10,fontWeight:800,color:pct>=100?C.green:C.whiteMid,flexShrink:0}}>{ev.taken}/{ev.spots}</span>
                <div style={{flex:1,height:4,borderRadius:2,background:C.border,overflow:'hidden'}}><div style={{height:'100%',width:`${pct}%`,background:'linear-gradient(90deg,#77BC1F,#EB6BAF)',borderRadius:2}}/></div>
              </div>
            </div>
          </div>
        )})}
        </div>
        </>)}
      </div>

      {/* 🤝 Créer un groupe — bottom sheet (prototype) */}
      {showCreatePartner && (
        <div onClick={()=>setShowCreatePartner(false)} style={{position:'fixed',inset:0,zIndex:9000,background:'rgba(42,16,32,.5)',display:'flex',alignItems:'flex-end'}}>
          <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxHeight:'88vh',overflowY:'auto',background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:`18px 18px calc(var(--sab) + 20px)`}}>
            <div style={{width:38,height:4,borderRadius:2,background:C.border,margin:'0 auto 14px'}}/>
            <div style={{fontSize:18,fontWeight:900,color:C.white,marginBottom:4}}>{EN?'Create my group':'Créer mon groupe'}</div>
            <div style={{fontSize:11.5,color:C.whiteMid,marginBottom:12,lineHeight:1.5}}>{EN?'A club, a collective, a recurring activity. People follow you → they get notified of your events.':'Un club, un collectif, une activité récurrente. Les gens te suivent → ils sont notifiés de tes events.'}</div>
            {/* Anti-malveillance : publier = profil vérifié (demande David « que les gens ne mettent pas n'importe quoi ») */}
            <div style={{display:'flex',alignItems:'center',gap:9,padding:'10px 12px',borderRadius:12,marginBottom:16,
              background:isCertified?`${C.green}12`:`${C.plum}0a`,border:`1px solid ${isCertified?`${C.green}55`:C.border}`}}>
              <span style={{fontSize:17}}>{isCertified?'✓':'🔒'}</span>
              <div style={{flex:1,fontSize:11,lineHeight:1.45,color:isCertified?C.green:C.whiteMid}}>
                {isCertified?(EN?<><b>Verified profile</b> — you can publish with confidence.</>:<><b>Profil vérifié</b> — tu peux publier en confiance.</>):(EN?<>To <b>publish publicly</b>, your profile must be <b style={{color:C.plum}}>verified</b> (selfie certification). We keep Clutch healthy.</>:<>Pour <b>publier publiquement</b>, ton profil devra être <b style={{color:C.plum}}>vérifié</b> (certification selfie). On garde Clutch sain.</>)}
              </div>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:14}}>
              {CP_EMOJIS.map(e=><span key={e} onClick={()=>setCpEmoji(e)} style={{width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'pointer',border:`1.5px solid ${cpEmoji===e?C.plum:C.border}`,background:cpEmoji===e?`${C.plum}0d`:'transparent'}}>{e}</span>)}
            </div>
            {[[EN?'Group name':'Nom du groupe',cpName,setCpName,EN?'E.g. Jazz Apéro Collective':'Ex. Apéro Jazz Collectif'],[EN?'Category':'Catégorie',cpCat,setCpCat,EN?'E.g. Music · Drinks':'Ex. Musique · Apéro']].map(([lab,val,set,ph]:any)=>(
              <div key={lab} style={{marginBottom:11}}>
                <div style={{fontSize:11,fontWeight:700,color:C.white,marginBottom:5}}>{lab}</div>
                <input value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:'100%',boxSizing:'border-box',padding:'11px 13px',borderRadius:12,border:`1px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:13,fontFamily:'inherit',outline:'none'}}/>
              </div>
            ))}
            {/* Lieu = RÉGION (pas l'adresse exacte). GPS caché, révélé avant le RDV — vision David (oncle/Bibi) */}
            <div style={{marginBottom:11}}>
              <div style={{fontSize:11,fontWeight:700,color:C.white,marginBottom:5}}>{EN?'Area':'Zone'} <span style={{color:C.whiteMid,fontWeight:600}}>· {EN?'region, not the address':'région, pas l\'adresse'}</span></div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {CP_ZONES.map(z=><span key={z} onClick={()=>setCpZone(z)} style={{padding:'7px 12px',borderRadius:11,fontSize:12,fontWeight:700,cursor:'pointer',border:`1.5px solid ${cpZone===z?C.plum:C.border}`,background:cpZone===z?`${C.plum}0d`:'transparent',color:cpZone===z?C.plum:C.whiteMid}}>{z}</span>)}
              </div>
              <div style={{display:'flex',alignItems:'flex-start',gap:7,marginTop:9,padding:'9px 11px',borderRadius:11,background:`${C.green}0d`,border:`1px solid ${C.green}33`}}>
                <span style={{fontSize:14}}>🛡️</span>
                <div style={{fontSize:10.5,lineHeight:1.45,color:C.whiteMid}}>{EN?<>The <b style={{color:C.white}}>exact address stays hidden</b> — it's revealed to participants only <b style={{color:C.green}}>shortly before the meetup</b>. Just like Clutches.</>:<>L'<b style={{color:C.white}}>adresse exacte reste cachée</b> — elle n'est révélée aux participants qu'<b style={{color:C.green}}>un peu avant le RDV</b>. Comme pour les Clutchs.</>}</div>
              </div>
            </div>
            <div style={{marginBottom:11}}>
              <div style={{fontSize:11,fontWeight:700,color:C.white,marginBottom:5}}>Description</div>
              <textarea value={cpDesc} onChange={e=>setCpDesc(e.target.value)} placeholder={EN?'In 1-2 sentences…':'En 1-2 phrases…'} rows={2} style={{width:'100%',boxSizing:'border-box',padding:'11px 13px',borderRadius:12,border:`1px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',resize:'none'}}/>
            </div>
            {/* Pièce jointe (idée oncle = PDF partition) — prototype : on capte le nom du fichier, upload réel en V2 */}
            {cpFile ? (
              <div style={{display:'flex',alignItems:'center',gap:11,padding:'11px 13px',borderRadius:12,border:`1px solid ${C.green}55`,background:`${C.green}10`,marginBottom:11}}>
                <span style={{fontSize:18}}>📄</span>
                <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:700,color:C.white,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cpFile}</div><div style={{fontSize:10.5,color:C.green,marginTop:1}}>{EN?'Attached to the group ✓':'Joint au groupe ✓'}</div></div>
                <span onClick={()=>setCpFile(null)} style={{fontSize:16,color:C.whiteMid,cursor:'pointer',padding:4}}>✕</span>
              </div>
            ) : (
              <label style={{display:'flex',alignItems:'center',gap:11,padding:'11px 13px',borderRadius:12,border:`1px dashed ${C.plum}`,background:'transparent',marginBottom:11,cursor:'pointer'}}>
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0]; if(f)setCpFile(f.name)}}/>
                <span style={{fontSize:18}}>📎</span>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.white}}>{EN?'Attach a file':'Joindre un fichier'}</div><div style={{fontSize:10.5,color:C.whiteMid,marginTop:1}}>{EN?'PDF, sheet music, program…':'PDF, partition, programme…'} <b style={{color:C.plum}}>{EN?'choose':'choisir'}</b></div></div>
              </label>
            )}
            <div onClick={()=>setCpPrivate(v=>!v)} style={{display:'flex',alignItems:'center',gap:11,padding:'11px 13px',borderRadius:12,border:`1px solid ${C.border}`,background:C.bgCard,marginBottom:16,cursor:'pointer'}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:C.white}}>🔒 {EN?'Private group (by link)':'Groupe privé (par lien)'}</div>
                <div style={{fontSize:10.5,color:C.whiteMid,marginTop:1}}>{EN?'Not shown in the public list. You share a link.':'N\'apparaît pas dans la liste publique. Tu partages un lien.'}</div>
              </div>
              <div style={{width:44,height:26,borderRadius:13,background:cpPrivate?C.green:C.border,position:'relative',flexShrink:0,transition:'.2s'}}><div style={{position:'absolute',top:2,left:cpPrivate?20:2,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'.2s'}}/></div>
            </div>
            <button onClick={createPartner} disabled={!cpName.trim()} style={{width:'100%',padding:'15px',borderRadius:16,border:'none',background:cpName.trim()?C.bordeaux:C.border,color:'#fff',fontSize:15,fontWeight:800,cursor:cpName.trim()?'pointer':'default',fontFamily:'inherit'}}>{EN?'Create the group':'Créer le groupe'}</button>
          </div>
        </div>
      )}

      {/* Détail événement — bottom sheet scrollable */}
      {selEv&&(
        <div style={{position:'fixed',inset:0,zIndex:9000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',backdropFilter:'blur(4px)'}} onClick={()=>setSelEv(null)}/>
          {/* Sheet = flex column, hauteur fixe (gap en haut), scroll sur le corps. Swipe-down = fermer. */}
          <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',height:'90vh',display:'flex',flexDirection:'column',animation:'modalIn .35s cubic-bezier(.22,1,.36,1)',transform:`translateY(${sheetDragY}px)`,transition:sheetStartY.current==null?'transform .25s':'none'}}>
            {/* Poignée — swipe vers le bas pour fermer */}
            <div {...sheetHandlers(()=>setSelEv(null))} style={{flexShrink:0,padding:'10px 0 4px',cursor:'grab',touchAction:'none',display:'flex',justifyContent:'center'}}>
              <div style={{width:44,height:5,borderRadius:3,background:`${C.whiteMid}45`}}/>
            </div>
            {/* Header fixe */}
            <div style={{flexShrink:0,padding:'2px 18px 0',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
                <span style={{fontSize:26,flexShrink:0}}>{selEv.emoji}</span>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:900,overflow:'hidden',textOverflow:'ellipsis'}}>{selEv.title}</div>
                  <div style={{fontSize:11,color:C.whiteMid}}>{locDay(fixEventDate(selEv.date),EN)} · {selEv.time} · ⏱ {eventDurLabel(selEv)}</div>
                </div>
              </div>
              <button onClick={()=>setSelEv(null)} aria-label="Fermer" style={{flexShrink:0,background:'#fff',border:`1px solid ${C.border}`,color:C.plum,fontSize:17,fontWeight:700,width:34,height:34,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(120,115,125,.3)'}}>✕</button>
            </div>
            {/* Corps scrollable — flex:'1 1 0' + overflowY:'scroll' obligatoires sur iOS */}
            <div style={{flex:'1 1 0',overflowY:'scroll',WebkitOverflowScrolling:'touch',padding:'12px 20px 100px'}}>
              {/* 📌 Event fixe (clou) */}
              {(selEv as any).pinned && (
                <div style={{display:'flex',alignItems:'center',gap:8,background:`${C.plum}10`,border:`1px solid ${C.plum}44`,borderRadius:12,padding:'9px 12px',marginBottom:12}}>
                  <span style={{fontSize:16,flexShrink:0}}>📌</span>
                  <div style={{fontSize:11,color:C.white,lineHeight:1.4}}>{EN?<><b>Fixed event</b> — the host only does this. You can join, no counter-proposal.</>:<><b>Event fixe</b> — l'organisateur ne fait que ça. Tu peux participer, pas de contre-proposition.</>}</div>
                </div>
              )}
              {/* 🏠 Lieu : masqué (quartier) si « chez moi » */}
              <div style={{fontSize:11,color:C.whiteMid,marginBottom:14,display:'flex',alignItems:'flex-start',gap:5,lineHeight:1.4}}>
                <span style={{flexShrink:0}}>{(selEv as any).home_private?'🏠':'📍'}</span>
                <span>{(selEv as any).home_private ? (EN?`${evLieuDisplay(selEv,true)} — exact address unlocked 5 min before (or by the host)`:`${evLieuDisplay(selEv,false)} — adresse exacte débloquée 5 min avant (ou par l'hôte)`) : selEv.lieu}</span>
              </div>
              {selEv.certified&&<div style={{display:'inline-flex',alignItems:'center',gap:5,background:C.orangeFaint,color:C.orange,border:`1px solid ${C.orange}44`,borderRadius:8,padding:'3px 8px',fontSize:10,fontWeight:800,marginBottom:14}}>✓ {lang==='en'?'CERTIFIED':'CERTIFIÉ'}</div>}

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
                  <div style={{fontSize:12,fontWeight:800,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>{selEv.creator}
                    <span style={{fontSize:9,fontWeight:900,padding:'1px 6px',borderRadius:10,background:'#FF5FA222',color:'#FF5FA2',border:'1px solid #FF5FA244'}}>✦ CD</span>
                    <span style={{fontSize:10,color:C.whiteMid}}>· {lang==='en'?'Organizer':'Organisateur·ice'}</span></div>
                  <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{selEv.creatorBio}</div>
                </div>
                <span style={{fontSize:11,color:C.salmon}}>→</span>
              </div>

              <div style={{fontSize:13,color:C.whiteMid,lineHeight:1.7,marginBottom:12}}>{selEv.description}</div>

              <div style={{background:C.bgCard,borderRadius:12,padding:'10px 14px',marginBottom:12}}>
                {[{icon:'👥',l:lang==='en'?'Spots':'Places',v:`${selEv.taken}/${selEv.spots} ${lang==='en'?'registered':'inscrit·es'}`},{icon:'💰',l:lang==='en'?'Price':'Prix',v:selEv.price},{icon:'🎒',l:lang==='en'?'Bring':'À amener',v:selEv.bring}].map(r=>(
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
                  <span style={{fontSize:11,color:selEv.taken/selEv.spots>.8?C.orange:C.green,fontWeight:700}}>{selEv.spots-selEv.taken} {lang==='en'?'left':'restantes'}</span>
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
            <div style={{flexShrink:0,padding:'8px 20px calc(max(var(--sab),0px) + 88px)',borderTop:`1px solid ${C.border}`,background:C.bgSheet}}>
              {(selEv.created_by ? (!!userId && selEv.created_by===userId) : selEv.creator==='Toi') ? (
                <div>
                  <div style={{fontSize:12,color:C.whiteMid,textAlign:'center',marginBottom:8}}>👑 {lang==='en'?"You're the organizer":"Tu es l'organisateur·ice"}</div>
                  <button onClick={()=>{ if(cancelArmed) cancelMyEvent(selEv); else setCancelArmed(true) }} disabled={cancelling}
                    style={{width:'100%',padding:'14px',background:cancelArmed?C.red:'rgba(220,80,80,.12)',border:`1px solid ${C.red}${cancelArmed?'':'55'}`,borderRadius:16,color:cancelArmed?'#fff':C.red,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',opacity:cancelling?0.6:1}}>
                    {cancelling?'…':cancelArmed?(lang==='en'?'⚠️ Tap again to confirm':'⚠️ Touche encore pour confirmer'):(lang==='en'?'🚫 Cancel this event':"🚫 Annuler l'événement")}
                  </button>
                  <div style={{fontSize:10,color:C.whiteMid,textAlign:'center',marginTop:6,lineHeight:1.4}}>{lang==='en'?'Registered people are freed (no penalty for them). You lose reliability points for cancelling.':'Les inscrits sont libérés (aucune pénalité pour eux). Toi, tu perds des points de fiabilité.'}</div>
                </div>
              ) : (
              registered.has(selEv.id)
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
                            <div style={{fontSize:13,color:C.white,fontWeight:800,marginBottom:6}}>{lang==='en'?`Unregister from "${selEv.title}"?`:`Se désinscrire de "${selEv.title}" ?`}</div>
                            {/* Thermomètre */}
                            <div style={{marginBottom:10}}>
                              <div style={{fontSize:10,color:C.whiteMid,marginBottom:4}}>{lang==='en'?'Penalty level':'Niveau de pénalité'}</div>
                              <div style={{display:'flex',gap:3,marginBottom:3}}>
                                {[0,1,2,3].map(i=>(
                                  <div key={i} style={{flex:1,height:8,borderRadius:4,background:i<=level?colors[level]:`${C.whiteMid}33`,transition:'background .2s'}}/>
                                ))}
                              </div>
                              <div style={{fontSize:11,fontWeight:700,color:colors[level]}}>{p.emoji} {lang==='en'?'Penalty':'Pénalité'}: {lang==='en'?labels[level]:['Aucune','Mineure','Significative','Sévère'][level]}</div>
                            </div>
                            <div style={{display:'flex',gap:8}}>
                              <button onClick={async()=>{
                                try { if (isRealEvent(selEv.id) && userId) await supabase.from('event_participants').delete().eq('event_id',selEv.id).eq('user_id',userId) } catch {}
                                // 🔔 Une place se libère → prévenir les gens EN ATTENTE (« viens la prendre », 1er arrivé gagne).
                                // La désinscription ne peut PAS inscrire quelqu'un d'autre (RLS) → on notifie, ils claiment.
                                try {
                                  if (isRealEvent(selEv.id)) {
                                    const { data:wl } = await supabase.from('event_waitlist').select('user_id').eq('event_id',selEv.id).order('joined_at',{ascending:true})
                                    ;(wl||[]).forEach((w:any)=>{ if(w.user_id && w.user_id!==userId) pushTo(w.user_id,
                                      lang==='en'?'🎉 A spot opened up!':'🎉 Une place s\'est libérée !',
                                      lang==='en'?`Grab your spot at "${selEv.title}" — first come, first served`:`Viens prendre ta place pour « ${selEv.title} » — premier arrivé, premier servi`,
                                      { type:'event_promote', event_id: selEv.id }) })
                                  }
                                } catch {}
                                setRegistered((prev:Set<string>)=>{const n=new Set(prev);n.delete(selEv.id);return n})
                                onPenalty?.(reason)
                                setUnregConfirmId(null)
                                setSelEv(null)
                              }} style={{flex:1,padding:'9px',background:C.red,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                                {lang==='en'?'Yes, unregister':'Oui, se désinscrire'}
                              </button>
                              <button onClick={()=>setUnregConfirmId(null)}
                                style={{flex:1,padding:'9px',background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,color:C.whiteMid,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                                {lang==='en'?'Stay registered':'Rester inscrit·e'}
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
                        ↩ {lang==='en'?'Unregister':'Se désinscrire'}
                      </button>
                    </div>
                  ))
                : selEv.taken >= selEv.spots ? (
                  /* Complet — liste d'attente */
                  waitlist.has(selEv.id) ? (
                    <div style={{textAlign:'center',padding:'14px',background:`${C.orange}14`,border:`1px solid ${C.orange}33`,borderRadius:14}}>
                      <div style={{fontSize:13,fontWeight:800,color:C.orange}}>📋 {lang==='en'?'On the waitlist':'Sur la liste d\'attente'}</div>
                      <div style={{fontSize:10,color:C.whiteMid,marginTop:2}}>{lang==='en'?'You\'ll be notified if a spot opens up':'Tu seras prévenu·e si une place se libère'}</div>
                      <button onClick={async()=>{
                        setWaitlist((prev:Set<string>)=>{const n=new Set(prev);n.delete(selEv.id);return n})
                        try { if (isRealEvent(selEv.id) && userId) await supabase.from('event_waitlist').delete().eq('event_id',selEv.id).eq('user_id',userId) } catch {}
                        showToast?.(lang==='en'?'Left the waitlist':'Tu as quitté la liste d\'attente', C.whiteMid)
                      }} style={{marginTop:8,background:'none',border:'none',color:C.red,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',textDecoration:'underline'}}>
                        {lang==='en'?'Leave the waitlist':'Quitter la liste d\'attente'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={async()=>{
                      setWaitlist((prev:Set<string>)=>new Set([...prev,selEv.id]))
                      showToast?.(lang==='en'?'📋 You\'re on the waitlist — we\'ll notify you':'📋 Tu es sur la liste d\'attente — on te préviendra', C.orange)
                      // Persistance EN BASE (cross-device) → permet de te notifier quand une place se libère.
                      try { if (isRealEvent(selEv.id) && userId) await supabase.from('event_waitlist').insert({ event_id: selEv.id, user_id: userId }) } catch {}
                      const orga=(selEv as any).created_by
                      if (orga && orga!==userId) pushTo(orga, lang==='en'?'📋 New waitlist sign-up':'📋 Nouvelle personne en attente',
                        lang==='en'?`Someone is waiting for a spot at "${selEv.title}"`:`Quelqu'un attend une place pour « ${selEv.title} »`, { type:'event_waitlist', event_id: selEv.id })
                    }}
                      style={{width:'100%',padding:'14px',background:'transparent',border:`1.5px solid ${C.orange}`,borderRadius:16,color:C.orange,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                      📋 {lang==='en'?'Join waitlist':'Rejoindre la liste d\'attente'}
                    </button>
                  )
                ) : (
                  <>
                  {regBlock && <div style={{display:'flex',alignItems:'flex-start',gap:8,background:`${C.orange}14`,border:`1px solid ${C.orange}44`,borderRadius:12,padding:'10px 12px',marginBottom:10}}>
                    <span style={{fontSize:15}}>⚠️</span>
                    <div style={{flex:1,fontSize:11.5,lineHeight:1.4,color:C.orange,fontWeight:700}}>{regBlock}</div>
                  </div>}
                  <button onClick={()=>doRegister(selEv)} disabled={registering}
                    style={{width:'100%',padding:'15px',background:C.plum,border:'none',borderRadius:16,color:C.onAccent,fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:registering?.7:1}}>
                    {registering?'…':(selEv as any).isGroupe?(lang==='en'?'👥 Join group':'👥 Rejoindre le groupe'):t('events.register')}
                  </button>
                  </>
                )
              )}
              {selEv.price&&!['Entrée libre','Gratuit','Free',''].includes(selEv.price)&&<div style={{textAlign:'center',marginTop:8,fontSize:10,color:C.whiteMid}}>💰 {lang==='en'?'Pay on-site':'Sur place'} · {selEv.price}</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom sheet création event de groupe ── */}
      {/* Fiche PARTENAIRE (clic sur une bannière) — David : le clic doit montrer le partenaire, pas aller dans Communauté */}
      {selPartner && (()=>{ const p=selPartner; const on=followedPartners.has(p.id); return (
        <div style={{position:'fixed',inset:0,zIndex:9200,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',backdropFilter:'blur(4px)'}} onClick={()=>setSelPartner(null)}/>
          <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',padding:`8px 20px calc(var(--sab) + 24px)`,animation:'modalIn .3s cubic-bezier(.22,1,.36,1)',maxHeight:'90vh',overflowY:'auto',transform:`translateY(${sheetDragY}px)`,transition:sheetStartY.current==null?'transform .25s':'none'}}>
            {/* Poignée + croix (swipe vers le bas pour fermer) */}
            <div {...sheetHandlers(()=>setSelPartner(null))} style={{padding:'8px 0 6px',cursor:'grab',touchAction:'none'}}>
              <div style={{width:42,height:5,borderRadius:3,background:`${C.whiteMid}40`,margin:'0 auto'}}/>
            </div>
            <button onClick={()=>setSelPartner(null)} aria-label="Fermer" style={{position:'absolute',top:10,right:14,width:30,height:30,borderRadius:'50%',background:C.bgCard,border:`1px solid ${C.border}`,color:C.white,fontSize:16,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>✕</button>
            <div style={{display:'flex',alignItems:'flex-start',gap:13,marginBottom:14,marginTop:4}}>
              <div style={{width:60,height:60,borderRadius:18,background:'linear-gradient(125deg,#6E2E72,#2C1020)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,flexShrink:0}}>{p.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                  <span style={{fontSize:18,fontWeight:900,color:C.white}}>{p.name}</span>
                  <span style={{fontSize:8,fontWeight:900,color:'#fff',background:C.green,borderRadius:7,padding:'1px 6px'}}>✓ {lang==='en'?'CERTIFIED':'CERTIFIÉ'}</span>
                </div>
                <div style={{fontSize:12,color:C.whiteMid,marginTop:2}}>{p.cat} · 📍 {p.zone}</div>
                <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>👥 {p.members} {lang==='en'?'members':'membres'}</div>
              </div>
            </div>
            <div style={{fontSize:13,color:C.white,lineHeight:1.5,marginBottom:14}}>{p.desc}</div>
            <div style={{background:`${C.plum}0a`,border:`1px solid ${C.border}`,borderRadius:12,padding:'11px 13px',marginBottom:16}}>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.05em',color:C.whiteMid,marginBottom:3}}>{lang==='en'?'NEXT EVENT':'PROCHAIN ÉVÉNEMENT'}</div>
              <div style={{fontSize:14,fontWeight:800,color:C.plum}}>🗓 {p.next}</div>
            </div>
            {/* 2 actions : Je participe (à la soirée proposée) + Suivre (le partenaire) — design David */}
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>{ showToast?.(lang==='en'?`✦ You're in — ${p.next}`:`✦ Tu participes — ${p.next}`, C.green); setSelPartner(null) }} style={{flex:1,padding:'14px',borderRadius:24,border:'none',background:C.green,color:'#fff',fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 5px 14px rgba(119,188,31,.3)'}}>
                {lang==='en'?'✦ I\'m in':'✦ Je participe'}
              </button>
              <button onClick={()=>togglePartner(p.id)} style={{flex:1,padding:'14px',borderRadius:24,border:`1.5px solid ${C.plum}`,background:on?'transparent':C.plum,color:on?C.plum:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                {on?(lang==='en'?'✓ Following':'✓ Suivi'):(lang==='en'?'+ Follow':'+ Suivre')}
              </button>
            </div>
            <div style={{fontSize:10,color:C.whiteMid,textAlign:'center',marginTop:9}}>{lang==='en'?'« I\'m in » = the proposed event · « Follow » = notified of all their future events':'« Je participe » = la soirée proposée · « Suivre » = notifié·e de tous leurs futurs events'}</div>
          </div>
        </div>
      )})()}
      {showCreateGroup&&(
        <div style={{position:'fixed',inset:0,zIndex:9100,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)'}} onClick={tryCloseCreate}/>
          <div style={{position:'relative',background:C.bgSheet,borderRadius:'20px 20px 0 0',padding:'calc(var(--sat) + 12px) 20px calc(var(--sab) + 90px)',animation:'modalIn .3s cubic-bezier(.22,1,.36,1)',height:'94vh',boxSizing:'border-box',overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
            {/* Handle — glisser vers le bas pour fermer */}
            <div onTouchStart={e=>{createDragY.current=e.touches[0].clientY}} onTouchEnd={e=>{ if(e.changedTouches[0].clientY-createDragY.current>55) tryCloseCreate() }}
              style={{padding:'4px 0 14px',margin:'-4px 0 4px',cursor:'grab'}}>
              <div style={{width:40,height:5,borderRadius:3,background:`${C.whiteMid}40`,margin:'0 auto'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
              <div style={{fontSize:16,fontWeight:900}}>🎟️ {EN?'Host an event':'Organiser un événement'}</div>
              <button onClick={tryCloseCreate} style={{background:'none',border:'none',color:C.whiteMid,fontSize:20,cursor:'pointer',padding:4}}>✕</button>
            </div>

            {/* Champ 1 : Emoji + Titre */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>{EN?'YOUR EVENT':'TON ÉVÉNEMENT'}</div>
              <div style={{display:'flex',gap:8}}>
                <button onClick={()=>setShowEmojiPicker(p=>!p)} style={{fontSize:24,width:52,height:52,borderRadius:12,background:C.whiteFaint,border:`1px solid ${C.border}`,cursor:'pointer',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  {newEvEmoji}
                </button>
                <input value={newEvTitle} onChange={e=>setNewEvTitle(e.target.value)} placeholder={EN?'E.g. Drinks & discovery, Chess game...':"Ex : Apéro découverte, Partie d'échecs..."}
                  style={{flex:1,background:C.whiteFaint,border:`1px solid ${newEvTitle?C.salmon:C.border}`,borderRadius:12,padding:'0 14px',fontSize:14,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon}}/>
              </div>
              {showEmojiPicker&&(
                <div style={{marginTop:8,display:'flex',flexWrap:'wrap',gap:6,background:C.bgCard,borderRadius:12,padding:'10px',border:`1px solid ${C.border}`}}>
                  {GROUP_EMOJIS.map(em=>(
                    <button key={em} onClick={()=>{setNewEvEmoji(em);setShowEmojiPicker(false)}}
                      style={{fontSize:22,width:38,height:38,borderRadius:8,background:newEvEmoji===em?C.salmonFaint:'transparent',border:newEvEmoji===em?`1px solid ${C.salmon}`:'1px solid transparent',cursor:'pointer'}}>
                      {em}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Champ 2 : Lieu — recherche d'adresse (Nominatim), comme la mise en ligne */}
            <div style={{marginBottom:14,position:'relative'}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>📍 {EN?'WHERE':'OÙ'} <span style={{color:C.whiteMid,fontWeight:600}}>· {EN?'search an address':'cherche une adresse'}</span></div>
              <input value={newEvLieu} onChange={e=>handleEvLieuChange(e.target.value)} onFocus={()=>{if(newEvLieu.length>=3)setEvShowSugg(true)}} placeholder={EN?'Café, square, address...':'Bar du Marché, Place de la Palud, Morges...'}
                style={{width:'100%',background:C.whiteFaint,border:`1px solid ${newEvLieu?C.salmon:C.border}`,borderRadius:12,padding:'12px 14px',fontSize:14,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon,boxSizing:'border-box'}}/>
              {evShowSugg && (evAddrResults.length>0 || evAddrLoading) && (
                <div style={{marginTop:6,background:C.bgCard,borderRadius:12,border:`1px solid ${C.border}`,overflow:'hidden',boxShadow:'0 6px 20px rgba(83,41,67,.12)'}}>
                  {evAddrLoading && evAddrResults.length===0 && <div style={{padding:'10px 14px',fontSize:12,color:C.whiteMid}}>{EN?'Searching…':'Recherche…'}</div>}
                  {evAddrResults.map((r:any,i:number)=>{ const name=r.name||(r.display_name||'').split(',')[0]; const addr=fmtEvAddr(r); return (
                    <div key={i} onClick={()=>pickEvAddr(name,addr)} style={{padding:'10px 14px',borderBottom:i<evAddrResults.length-1?`1px solid ${C.border}`:'none',cursor:'pointer'}}>
                      <div style={{fontSize:13,fontWeight:700,color:C.white}}>{name}</div>
                      {addr&&<div style={{fontSize:10.5,color:C.whiteMid,marginTop:1}}>📍 {addr}</div>}
                    </div>
                  )})}
                </div>
              )}
            </div>

            {/* 🏠 Chez moi (adresse privée) + 📌 Event fixe (cloué) */}
            <div style={{display:'flex',gap:8,marginBottom:14}}>
              <button onClick={()=>setNewEvHome(v=>!v)} title={EN?'Only the neighbourhood is shown; exact address revealed 5 min before or by you':'On affiche le quartier ; l\'adresse exacte se débloque 5 min avant ou par toi'} style={{flex:1,display:'flex',alignItems:'center',gap:7,padding:'9px 10px',borderRadius:12,border:`1.5px solid ${newEvHome?C.salmon:C.border}`,background:newEvHome?C.salmonFaint:'transparent',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                <span style={{fontSize:15,flexShrink:0}}>🏠</span>
                <span style={{flex:1,minWidth:0}}>
                  <span style={{display:'block',fontSize:11,fontWeight:800,color:newEvHome?C.salmon:C.white}}>{EN?'At my place':'Chez moi'}</span>
                  <span style={{display:'block',fontSize:8.5,color:C.whiteMid,lineHeight:1.2}}>{EN?'Area only · address revealed before':'Quartier · adresse révélée avant'}</span>
                </span>
                <span style={{width:17,height:17,borderRadius:5,border:`2px solid ${newEvHome?C.salmon:C.border}`,background:newEvHome?C.salmon:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{newEvHome&&<span style={{color:'#fff',fontSize:10,fontWeight:900}}>✓</span>}</span>
              </button>
              <button onClick={()=>setNewEvPinned(v=>!v)} title={EN?'Fixed event: people can only join this, no counter-proposal':'Event fixe : on ne peut que participer, pas de contre-proposition'} style={{flex:1,display:'flex',alignItems:'center',gap:7,padding:'9px 10px',borderRadius:12,border:`1.5px solid ${newEvPinned?C.plum:C.border}`,background:newEvPinned?`${C.plum}12`:'transparent',cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                <span style={{fontSize:15,flexShrink:0}}>📌</span>
                <span style={{flex:1,minWidth:0}}>
                  <span style={{display:'block',fontSize:11,fontWeight:800,color:newEvPinned?C.plum:C.white}}>{EN?'Fixed event':'Event fixe'}</span>
                  <span style={{display:'block',fontSize:8.5,color:C.whiteMid,lineHeight:1.2}}>{EN?'Only this · no counter-clutch':'Je ne fais que ça · pas de contre'}</span>
                </span>
                <span style={{width:17,height:17,borderRadius:5,border:`2px solid ${newEvPinned?C.plum:C.border}`,background:newEvPinned?C.plum:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{newEvPinned&&<span style={{color:'#fff',fontSize:10,fontWeight:900}}>✓</span>}</span>
              </button>
            </div>

            {/* Champ 3 : QUAND (jour contraint + molette native) */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>🕐 {EN?'WHEN':'QUAND'}</div>
              <div style={{display:'flex',gap:8}}>
                <div style={{display:'flex',gap:6,flex:1}}>
                  {['Aujourd\'hui','Demain'].map(d=>(
                    <button key={d} onClick={()=>setNewEvDate(d)}
                      style={{flex:1,padding:'11px 0',borderRadius:10,fontSize:12.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit',border:`1.5px solid ${newEvDate===d?C.salmon:C.border}`,background:newEvDate===d?C.salmonFaint:'transparent',color:newEvDate===d?C.salmon:C.whiteMid}}>{locDay(d,EN)}</button>
                  ))}
                </div>
                <input type='time' value={newEvTime} onChange={e=>setNewEvTime(e.target.value)}
                  min={newEvDate==='Aujourd\'hui' ? new Date().toTimeString().slice(0,5) : undefined}
                  style={{width:108,background:C.whiteFaint,border:`1px solid ${C.salmon}`,borderRadius:12,padding:'11px 12px',fontSize:14,color:C.white,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
              </div>
            </div>

            {/* Champ 4 : Durée (obligatoire) + Places */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>⏱ {EN?'DURATION':'DURÉE'} <span style={{color:C.whiteMid,fontWeight:600}}>· {EN?'avoids overlaps':'évite les chevauchements'}</span></div>
              <div style={{display:'flex',gap:6}}>
                {EVENT_DUR_OPTS.map(o=>(
                  <button key={o.h} onClick={()=>setNewEvDur(o.h)}
                    style={{flex:1,padding:'8px 0',borderRadius:9,fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit',
                      border:`1.5px solid ${newEvDur===o.h?C.salmon:C.border}`,background:newEvDur===o.h?C.salmonFaint:'transparent',color:newEvDur===o.h?C.salmon:C.whiteMid}}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>👥 {EN?'NUMBER OF SPOTS':'NOMBRE DE PLACES'}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {[2,4,6,8,10,12].map(n=>(
                  <button key={n} onClick={()=>setNewEvMax(n)}
                    style={{flex:1,minWidth:44,padding:'9px 0',borderRadius:10,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',border:`1.5px solid ${newEvMax===n?C.salmon:C.border}`,background:newEvMax===n?C.salmonFaint:'transparent',color:newEvMax===n?C.salmon:C.whiteMid}}>{n}</button>
                ))}
              </div>
            </div>

            {/* Champ : PRIX (David : oublié) */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',marginBottom:6}}>💰 {EN?'PRICE':'PRIX'}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:7}}>
                {[EN?'Free':'Gratuit','5 CHF','10 CHF','20 CHF'].map(pz=>(
                  <button key={pz} onClick={()=>setNewEvPrice(pz)}
                    style={{flex:1,minWidth:62,padding:'8px 0',borderRadius:10,fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit',border:`1.5px solid ${newEvPrice===pz?C.salmon:C.border}`,background:newEvPrice===pz?C.salmonFaint:'transparent',color:newEvPrice===pz?C.salmon:C.whiteMid}}>{pz}</button>
                ))}
              </div>
              <input value={newEvPrice} onChange={e=>setNewEvPrice(e.target.value)} placeholder={EN?'Or another price… (e.g. Pay what you want, 12 CHF)':'Ou un autre prix… (ex : Prix libre, 12 CHF)'}
                style={{width:'100%',boxSizing:'border-box',background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 13px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon}}/>
            </div>

            {/* Champ 5 : Description (OBLIGATOIRE — David) + aide + limite caractères */}
            <div style={{marginBottom:22}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:6}}>
                <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em'}}>💬 DESCRIPTION <span style={{color:C.salmon}}>· {EN?'required':'obligatoire'}</span></div>
                <div style={{fontSize:10,color:newEvDesc.length>=280?C.orange:C.whiteMid}}>{newEvDesc.length}/300</div>
              </div>
              <textarea value={newEvDesc} onChange={e=>setNewEvDesc(e.target.value.slice(0,300))} rows={3} maxLength={300}
                placeholder={EN?'Help people decide:\n• What you\'ll do\n• Who it\'s for (beginners? level?)\n• What to bring':'Aide les gens à se décider :\n• Le déroulé (ce qu\'on va faire)\n• Pour qui (débutants ? niveau ?)\n• Ce qu\'il faut amener'}
                style={{width:'100%',background:C.whiteFaint,border:`1px solid ${newEvDesc.trim()?C.salmon:C.border}`,borderRadius:12,padding:'12px 14px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',caretColor:C.salmon,resize:'none',boxSizing:'border-box',lineHeight:1.5}}/>
              {/* Pièce jointe réelle (PDF/programme/image) — prototype : on capte le nom, upload V2 */}
              {newEvFile ? (
                <div style={{display:'flex',alignItems:'center',gap:9,marginTop:8,padding:'9px 12px',borderRadius:11,border:`1px solid ${C.green}55`,background:`${C.green}10`}}>
                  <span style={{fontSize:16}}>📄</span>
                  <div style={{flex:1,minWidth:0,fontSize:12,fontWeight:700,color:C.white,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{newEvFile}</div>
                  <span onClick={()=>setNewEvFile(null)} style={{fontSize:15,color:C.whiteMid,cursor:'pointer',padding:2}}>✕</span>
                </div>
              ) : (
                <label style={{display:'flex',alignItems:'center',gap:9,marginTop:8,padding:'9px 12px',borderRadius:11,border:`1px dashed ${C.salmon}`,cursor:'pointer'}}>
                  <input type='file' accept='.pdf,.png,.jpg,.jpeg,.doc,.docx' style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0]; if(f)setNewEvFile(f.name)}}/>
                  <span style={{fontSize:16}}>📎</span>
                  <div style={{flex:1,fontSize:12,fontWeight:700,color:C.salmon}}>{EN?'Attach a file':'Joindre un fichier'} <span style={{color:C.whiteMid,fontWeight:500}}>({EN?'PDF, program…':'PDF, programme…'})</span></div>
                </label>
              )}
            </div>

            <button onClick={createGroupEvent} disabled={creating}
              style={{width:'100%',padding:'15px',borderRadius:14,background:newEvValid?C.salmon:'rgba(83,41,67,0.35)',border:'none',color:newEvValid?C.bg:C.whiteMid,fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>
              {creating?(EN?'Creating…':'Création...'):(EN?'✦ Publish event':'✦ Publier l\'événement')}
            </button>
            {!newEvValid && <div style={{textAlign:'center',marginTop:8,fontSize:10,color:C.whiteMid}}>{EN?'Tap “Publish” to see what\'s missing.':'Touche « Publier » pour voir ce qui manque.'}</div>}
            <div style={{textAlign:'center',marginTop:10,fontSize:10,color:C.whiteMid}}>{EN?'Public place · 18+ · Shown in Events · Expires after 18h':'Lieu public · 18+ · Visible dans Événements · Expire après 18h'}</div>

            {/* Confirmation avant de quitter si des champs sont remplis (David) */}
            {confirmCloseEv && (
              <div style={{position:'absolute',inset:0,background:'rgba(42,16,32,.55)',backdropFilter:'blur(4px)',borderRadius:'20px 20px 0 0',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
                <div style={{background:'#fff',borderRadius:18,padding:'20px 18px',maxWidth:300,textAlign:'center',boxShadow:'0 20px 50px rgba(83,41,67,.4)'}}>
                  <div style={{fontSize:15,fontWeight:900,color:C.bordeaux,marginBottom:6}}>{EN?'Leave without publishing?':'Quitter sans publier ?'}</div>
                  <div style={{fontSize:12,color:C.whiteMid,lineHeight:1.5,marginBottom:16}}>{EN?'You started filling in the event. Everything will be lost.':'Tu as commencé à remplir l\'événement. Tout sera perdu.'}</div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={()=>setConfirmCloseEv(false)} style={{flex:1,padding:'11px',borderRadius:11,border:`1px solid ${C.border}`,background:'transparent',color:C.bordeaux,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{EN?'Continue':'Continuer'}</button>
                    <button onClick={resetCreateEv} style={{flex:1,padding:'11px',borderRadius:11,border:'none',background:C.red,color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>{EN?'Leave':'Quitter'}</button>
                  </div>
                </div>
              </div>
            )}
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
type ChatMsg = { id:string; sender:string; text:string; t:string; mine:boolean; is_system?:boolean }

function ChatSheet({ clutch, userId, onClose, showToast, onMarkRead, maxMessages=5 }:{
  clutch:any; userId:string; onClose:()=>void; showToast:(m:string,c?:string)=>void; onMarkRead?:(id:string)=>void; maxMessages?:number
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
  const [clutchStatus, setClutchStatus] = useState<string>(clutch.status||'confirmed')
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
        is_system: !!m.is_system,
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
          if (m.sender_id === userId && !m.is_system) return // déjà ajouté optimistement
          if (m.is_system) setClutchStatus('cancelled') // bloquer l'input dès réception
          setMsgs(prev => [...prev, {
            id: m.id,
            sender: other?.name || '?',
            text: m.content,
            t: new Date(m.created_at).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}),
            mine: false,
            is_system: !!m.is_system,
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
  const myCount = msgs.filter(m=>m.mine && !m.is_system).length
  const MAX = maxMessages

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[msgs])

  const isClosed = ['cancelled','declined','expired'].includes(clutchStatus)

  const send = async () => {
    if (!input.trim() || myCount >= MAX || isClosed) return
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
      } else {
        hap('light')
        // 🔔 Notif « message reçu » au destinataire (aperçu tronqué). Titre « Message » = neutre FR/EN
        // (ChatSheet n'a pas lang/user en props).
        if (otherId) pushTo(otherId, '💬 Message', text.length>80?text.slice(0,80)+'…':text, { type:'message', clutch_id: clutch.id })
        if (myCount+1 >= MAX) showToast(`Limit reached: ${MAX} messages max`, C.orange)
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
        {/* Bannière lieu de RDV + lien Maps */}
        <div style={{flexShrink:0,background:`${C.green}12`,borderBottom:`1px solid ${C.green}33`,padding:'8px 16px',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:18}}>📍</span>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:C.green,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clutch.venue||'Lieu à confirmer'}</div>
            <div style={{fontSize:10,color:C.whiteMid}}>
              {new Date(clutch.proposed_time).toLocaleString('fr-CH',{weekday:'short',hour:'2-digit',minute:'2-digit'})}
              {' · '}
              <a href={`https://maps.google.com/?q=${encodeURIComponent(clutch.venue||'')}`} target="_blank" rel="noreferrer"
                style={{color:C.salmon,textDecoration:'none',fontWeight:700}}>
                Voir sur Maps →
              </a>
            </div>
          </div>
        </div>
        {/* Retard géré depuis la carte Verrou — supprimé ici */}
        <div style={{flexShrink:0,background:C.orangeFaint,borderBottom:`1px solid ${C.orange}33`,padding:'5px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {MAX < 9999 && <span style={{fontSize:10,color:C.orange,fontWeight:700}}>⚡ Max {MAX} messages · Pour coordonner le RDV</span>}
          {MAX < 9999 && <span style={{fontSize:10,color:C.orange}}>{myCount}/{MAX}</span>}
        </div>
        {/* Messages — loader initial */}
        {dbMode === 'loading' && (
          <div style={{flexShrink:0,padding:'12px 16px',textAlign:'center',fontSize:12,color:C.whiteMid}}>Loading messages…</div>
        )}
        <div style={{flex:'1 1 0',overflowY:'scroll',WebkitOverflowScrolling:'touch',padding:'12px 16px'}}>
          {msgs.map(m=>{
            const liked = likedMsgs.has(m.id)
            if ((m as any).is_system) return null // messages système cachés du chat
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
        <div style={{flexShrink:0,padding:'8px 12px calc(var(--sab) + 12px)',borderTop:`1px solid ${C.border}`,display:'flex',gap:8,alignItems:'flex-end'}}>
          {isClosed
            ? <div style={{flex:1,padding:'12px',textAlign:'center',fontSize:12,color:C.whiteMid,fontStyle:'italic'}}>
                {clutch.status==='cancelled'?'↩ Ce Clutch a été annulé — le chat est fermé':clutch.status==='declined'?'✕ Clutch refusé — le chat est fermé':'⏱ Clutch expiré — le chat est fermé'}
              </div>
            : myCount >= MAX
            ? <div style={{flex:1,padding:'12px',textAlign:'center',fontSize:12,color:C.whiteMid}}>
                Limite atteinte — à tout à l'heure à {clutch.venue?.split('·')[0]?.trim()||'votre lieu'} !
              </div>
            : <>
                <div style={{flex:1,position:'relative'}}>
                  <textarea value={input} onChange={e=>setInput(e.target.value.slice(0,300))} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}
                    placeholder="Message court…" rows={1}
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
  const recTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null)

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
      // Vocal limité à 5 min (auto-stop)
      recTimerRef.current = setTimeout(() => {
        if (mrRef.current?.state === 'recording') { mrRef.current.stop(); setRecording(false); showToast('Vocal limité à 5 min ✓', C.orange) }
      }, 5*60*1000)
    } catch { showToast('Micro non disponible', C.red) }
  }

  const stopRecording = () => { if (recTimerRef.current) clearTimeout(recTimerRef.current); mrRef.current?.stop(); setRecording(false) }

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
        <div style={{fontSize:72,marginBottom:16,filter:'drop-shadow(0 0 30px C.gold)'}}>💬</div>
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
      <div style={{width:'100%',maxWidth:480,background:`linear-gradient(180deg,${C.bordeauxLight} 0%,${C.bordeaux} 100%)`,borderRadius:'24px 24px 0 0',padding:'6px 20px 44px',border:`1px solid ${C.border}`,boxShadow:`0 -8px 40px rgba(235,107,175,.15)`}}>
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
          background:(!text.trim()&&!audioBlob)?'rgba(255,255,255,.08)':`linear-gradient(135deg,C.gold,${C.orange})`,
          border:`1px solid ${(!text.trim()&&!audioBlob)?C.border:'C.gold'}`,
          borderRadius:16,
          color:(!text.trim()&&!audioBlob)?C.whiteMid:'#000',
          fontSize:15,fontWeight:900,cursor:(!text.trim()&&!audioBlob)?'default':'pointer',
          fontFamily:'inherit',opacity:sending?.6:1,
          boxShadow:(!text.trim()&&!audioBlob)?'none':'0 4px 20px rgba(235,107,175,.4)',
          transition:'all .2s',letterSpacing:'-.01em',
        }}>
          {sending ? '✦ Sending…' : '✦ Send feedback'}
        </button>
      </div>
    </div>
  )
}

function FeedbackSheet({ clutch, userId, lang:fbLang, onClose, onScore, pendingCount=0 }:{
  clutch:any; userId:string; lang?:Lang; onClose:(rating:string|null)=>void; onScore:(delta:number)=>void; pendingCount?:number
}) {
  const lang = fbLang||'fr'
  const other = clutch.sender_id===userId ? clutch.receiver : clutch.sender
  const [selected,setSelected] = useState<string|null>(null)
  const [done,setDone] = useState(false)
  const [submitErr,setSubmitErr] = useState(false)
  const gpsVerified = !!(clutch as any).checkin_verified

  // 3 outcomes — objectifs, décision Mel + David 15.06.2026
  // Principe : présence = positif (même en retard), absence = négatif
  const OUTCOMES = lang==='en' ? [
    {key:'on_time', emoji:'⭐', label:'On time',   sub:'Showed up right on schedule',          pts: 2,  bad:false},
    {key:'showed',  emoji:'📍', label:'Was there', sub:'Came — late or not, they made it',     pts: 1,  bad:false},
    {key:'absent',  emoji:'🐰', label:'No-show',   sub:'Didn\'t come, didn\'t warn',           pts:-5,  bad:true },
  ] : [
    {key:'on_time', emoji:'⭐', label:'À l\'heure', sub:'Présent·e à l\'heure',                pts: 2,  bad:false},
    {key:'showed',  emoji:'📍', label:'Est venu·e', sub:'Est venu·e — en retard ou non, il·elle était là', pts: 1, bad:false},
    {key:'absent',  emoji:'🐰', label:'Lapin 👻',   sub:'N\'est pas venu·e, n\'a pas prévenu', pts:-5,  bad:true },
  ]

  const submit = async () => {
    if (!selected) return
    const r = OUTCOMES.find(r=>r.key===selected)!
    const otherId = clutch.sender_id===userId ? clutch.receiver_id : clutch.sender_id
    const revealAt = new Date(Date.now() + TRUST_CONFIG.REVEAL_DELAY_HOURS * 60 * 60 * 1000).toISOString()
    // Nouveau système : rdv_feedbacks (double-révélation)
    const { error: fbErr } = await supabase.from('rdv_feedbacks').upsert({
      rdv_id: clutch.id,
      from_id: userId,
      to_id: otherId,
      outcome: selected,
      revealed_at: revealAt,
      is_revealed: false,
    }, { onConflict: 'rdv_id,from_id' })
    // Ne marquer "fait" que si l'écriture a réussi → sinon l'utilisateur pourra re-soumettre (pas de perte silencieuse)
    if (!fbErr) { try { localStorage.setItem(`feedback_done_${clutch.id}`, String(Date.now())) } catch {} }
    else { setSubmitErr(true); return }
    await supabase.from('feedback').upsert({
      clutch_id: clutch.id,
      given_by: userId,
      to_user_id: otherId,
      rating: selected,
      pts_delta: r.pts,
      gps_verified_by_reporter: gpsVerified,
    }, { onConflict: 'clutch_id,given_by' })
    const ptsDelta = r.pts
    onScore(ptsDelta)
    setDone(true)
    setTimeout(()=>onClose(selected), 2000)
  }

  const sel = OUTCOMES.find(r=>r.key===selected)

  return (
    <div style={{position:'fixed',inset:0,zIndex:4000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)'}} onClick={done?()=>onClose(selected):undefined}/>
      <div style={{position:'relative',background:C.bgSheet,borderRadius:'22px 22px 0 0',padding:'20px 20px 40px',animation:'modalIn .35s cubic-bezier(.22,1,.36,1)',maxHeight:'88vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'center',paddingBottom:8}}><div style={{width:36,height:4,borderRadius:2,background:C.border}}/></div>
        {done ? (
          <div style={{textAlign:'center',padding:'20px 0',cursor:'pointer'}} onClick={()=>onClose(selected)}>
            <div style={{fontSize:40,marginBottom:8}}>{sel?.emoji}</div>
            <div style={{fontSize:15,fontWeight:900,color:C.white,marginBottom:4}}>{lang==='en'?'Thank you!':'Merci !'}</div>
            <div style={{fontSize:13,color:sel?.bad?C.red:C.green}}>
              {lang==='en'?'Revealed in':'Révélé dans'} {TRUST_CONFIG.REVEAL_DELAY_HOURS}h
            </div>
            <div style={{fontSize:11,color:C.whiteMid,marginTop:12,opacity:.6}}>{lang==='en'?'Tap to close':'Appuie pour fermer'}</div>
          </div>
        ) : (
          <>
            <div style={{textAlign:'center',marginBottom:14}}>
              <div style={{fontSize:13,color:C.whiteMid,marginBottom:2}}>
                {lang==='en'?'Meetup with':'RDV avec'} <strong style={{color:C.white}}>{other?.name||'?'}</strong>
              </div>
              <div style={{fontSize:10,color:C.whiteMid,marginBottom:gpsVerified?6:0}}>{clutch.venue}</div>
              {gpsVerified && (
                <div style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(34,197,94,.15)',border:'1px solid rgba(34,197,94,.3)',borderRadius:20,padding:'3px 10px',fontSize:10,color:C.green}}>
                  📍 {lang==='en'?'GPS-verified presence':'Présence vérifiée GPS'} +{TRUST_CONFIG.GPS_CHECKIN} pts
                </div>
              )}
              {pendingCount > 1 && (
                <div style={{fontSize:10,color:C.orange,marginTop:6}}>
                  {pendingCount-1} {lang==='en'?'other meetup(s) awaiting feedback':'autre(s) RDV en attente de feedback'}
                </div>
              )}
              <div style={{fontSize:17,fontWeight:900,marginTop:10}}>{lang==='en'?'Was the other person there?':'L\'autre personne était-elle là ?'}</div>
              <div style={{fontSize:10,color:C.whiteMid,marginTop:2}}>{lang==='en'?`Revealed in ${TRUST_CONFIG.REVEAL_DELAY_HOURS}h — fair for both`:`Révélé dans ${TRUST_CONFIG.REVEAL_DELAY_HOURS}h — équitable pour les deux`}</div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:7,marginBottom:16}}>
              {OUTCOMES.map(r=>{
                const isSel = selected===r.key
                const borderCol = isSel ? (r.bad?C.red:C.green) : C.border
                const bgCol = isSel ? (r.bad?'rgba(239,68,68,.12)':'rgba(34,197,94,.12)') : 'transparent'
                const ptsLabel = (r as any).pts>0?`+${(r as any).pts}pts`:`${(r as any).pts}pts`
                const ptsColor = r.bad?C.red:C.green
                return (
                  <button key={r.key} onClick={()=>setSelected(r.key)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',background:bgCol,border:`1.5px solid ${borderCol}`,borderRadius:14,cursor:'pointer',fontFamily:'inherit',WebkitTapHighlightColor:'transparent',transition:'all .15s'}}>
                    <span style={{fontSize:22,flexShrink:0}}>{r.emoji}</span>
                    <div style={{flex:1,textAlign:'left'}}>
                      <div style={{fontSize:13,fontWeight:800,color:C.white}}>{r.label}</div>
                      <div style={{fontSize:10,color:C.whiteMid}}>{r.sub}</div>
                    </div>
                    <span style={{fontSize:10,fontWeight:700,color:ptsColor}}>{ptsLabel}</span>
                  </button>
                )
              })}
            </div>
            {submitErr && <div style={{marginBottom:8,padding:'8px 10px',background:'rgba(220,80,80,.12)',borderRadius:10,color:C.red,fontSize:12,fontWeight:700,textAlign:'center'}}>{lang==='en'?'Could not save — please try again':'Enregistrement impossible — réessaie'}</div>}
            <button onClick={submit} disabled={!selected}
              style={{width:'100%',padding:'14px',background:selected?C.plum:'rgba(255,255,255,.08)',border:'none',borderRadius:16,color:selected?C.bg:C.whiteMid,fontSize:15,fontWeight:900,cursor:selected?'pointer':'default',fontFamily:'inherit'}}>
              {lang==='en'?'Send feedback':'Envoyer le feedback'}
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
  // Swipe-down pour fermer (drag vers le bas sur la poignée)
  const [psDragY,setPsDragY] = useState(0); const psStart = useRef<number|null>(null)
  const psSwipe = {
    onPointerDown:(e:React.PointerEvent)=>{ psStart.current=e.clientY },
    onPointerMove:(e:React.PointerEvent)=>{ if(psStart.current==null)return; const dy=e.clientY-psStart.current; if(dy>0)setPsDragY(dy) },
    onPointerUp:()=>{ const dy=psDragY; psStart.current=null; if(dy>90){ setPsDragY(0); onClose() } else setPsDragY(0) },
    onPointerCancel:()=>{ psStart.current=null; setPsDragY(0) },
  }
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
      <div style={{position:'relative',background:C.bgSheet,marginTop:'auto',height:'90vh',display:'flex',flexDirection:'column',animation:'modalIn .32s cubic-bezier(.22,1,.36,1)',borderRadius:'20px 20px 0 0',transform:`translateY(${psDragY}px)`,transition:psStart.current==null?'transform .25s':'none'}}>
        {/* Handle — swipe vers le bas pour fermer */}
        <div {...psSwipe} style={{display:'flex',justifyContent:'center',padding:'12px 0 6px',flexShrink:0,cursor:'grab',touchAction:'none',position:'relative',zIndex:4}}>
          <div style={{width:44,height:5,borderRadius:3,background:`${C.whiteMid}55`}}/>
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
              <TrustBadge profile={profile} lang={psLang} showCount={true}/>
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
          <button onClick={onClose} aria-label="Fermer" style={{position:'absolute',top:12,right:12,background:'#fff',border:`1px solid ${C.border}`,color:C.plum,fontSize:17,fontWeight:700,width:34,height:34,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 8px rgba(0,0,0,.25)',zIndex:5}}>✕</button>
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
                  <span key={i} style={{fontSize:11,fontWeight:700,padding:'4px 10px',background:`rgba(83,41,67,0.1)`,border:`1px solid rgba(83,41,67,0.35)`,borderRadius:20,color:`rgba(83,41,67,0.7)`}}>{l}</span>
                ))}
              </div>
            </div>
          )}
          {/* Espace avant le CTA */}
          <div style={{height:8}}/>
        </div>

        {/* Actions — toujours visibles en bas */}
        <div style={{flexShrink:0,padding:'10px 16px calc(var(--sab) + 16px)',borderTop:`1px solid ${C.border}`,display:'flex',flexDirection:'column',gap:8}}>
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
                await supabase.from('clutches').update({status:'cancelled'}).eq('id',pendingClutch.id)
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
                style={{width:'100%',padding:'16px',background:C.plum,border:'none',borderRadius:16,color:C.bg,fontSize:16,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:`0 4px 20px ${C.orange}44`}}>
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

// ═════════════════════════════════════════════════════════════
// 📷 PHOTO CROPPER — recadrer/zoomer la photo avant upload (déplacer + zoom)
// ═════════════════════════════════════════════════════════════
function PhotoCropper({ src, onCancel, onSave }:{ src:string; onCancel:()=>void; onSave:(blob:Blob)=>void }) {
  const VIEW = 300, OUT = 600
  const imgRef = useRef<HTMLImageElement|null>(null)
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({x:0,y:0})
  const [nat, setNat] = useState({w:0,h:0})
  const dragRef = useRef<{x:number;y:number;ox:number;oy:number}|null>(null)
  const [saving, setSaving] = useState(false)
  const baseScale = nat.w&&nat.h ? Math.max(VIEW/nat.w, VIEW/nat.h) : 1
  const dispW = nat.w * baseScale * scale
  const dispH = nat.h * baseScale * scale
  const clampPos = (p:{x:number;y:number}) => {
    const maxX = Math.max(0,(dispW - VIEW)/2), maxY = Math.max(0,(dispH - VIEW)/2)
    return { x: Math.max(-maxX, Math.min(maxX, p.x)), y: Math.max(-maxY, Math.min(maxY, p.y)) }
  }
  useEffect(()=>{ setPos(p=>clampPos(p)) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale, nat])
  const down = (cx:number,cy:number) => { dragRef.current = {x:cx,y:cy,ox:pos.x,oy:pos.y} }
  const move = (cx:number,cy:number) => { const d=dragRef.current; if(!d)return; setPos(clampPos({x:d.ox+(cx-d.x), y:d.oy+(cy-d.y)})) }
  const up = () => { dragRef.current=null }
  const save = () => {
    const img = imgRef.current; if(!img){onCancel();return}
    setSaving(true)
    const canvas = document.createElement('canvas'); canvas.width=OUT; canvas.height=OUT
    const ctx = canvas.getContext('2d'); if(!ctx){setSaving(false);return}
    const r = OUT/VIEW, drawW = dispW*r, drawH = dispH*r
    const dx = OUT/2 + pos.x*r - drawW/2, dy = OUT/2 + pos.y*r - drawH/2
    ctx.drawImage(img, dx, dy, drawW, drawH)
    canvas.toBlob(b=>{ setSaving(false); if(b) onSave(b); else onCancel() }, 'image/jpeg', 0.9)
  }
  return (
    <div style={{position:'fixed',inset:0,zIndex:10000,background:'rgba(8,5,16,.96)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20,padding:20}}>
      <div style={{color:C.white,fontSize:15,fontWeight:800}}>Recadre ta photo</div>
      <div style={{width:VIEW,height:VIEW,borderRadius:'50%',overflow:'hidden',position:'relative',border:`3px solid ${C.salmon}`,touchAction:'none',cursor:'grab'}}
        onMouseDown={e=>down(e.clientX,e.clientY)} onMouseMove={e=>move(e.clientX,e.clientY)} onMouseUp={up} onMouseLeave={up}
        onTouchStart={e=>down(e.touches[0].clientX,e.touches[0].clientY)} onTouchMove={e=>move(e.touches[0].clientX,e.touches[0].clientY)} onTouchEnd={up}>
        <img ref={imgRef} src={src} alt="" draggable={false}
          onLoad={e=>setNat({w:(e.target as HTMLImageElement).naturalWidth,h:(e.target as HTMLImageElement).naturalHeight})}
          style={{position:'absolute',left:'50%',top:'50%',width:dispW,height:dispH,maxWidth:'none',
            transform:`translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,userSelect:'none',pointerEvents:'none'}}/>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,width:VIEW}}>
        <span style={{fontSize:16}}>🔍</span>
        <input type="range" min={1} max={3} step={0.01} value={scale} onChange={e=>setScale(Number(e.target.value))} style={{flex:1,accentColor:C.salmon}}/>
      </div>
      <div style={{display:'flex',gap:10,width:VIEW}}>
        <button onClick={onCancel} style={{flex:1,padding:'12px',borderRadius:12,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Annuler</button>
        <button onClick={save} disabled={saving||!nat.w} style={{flex:2,padding:'12px',borderRadius:12,border:'none',background:C.salmon,color:C.bg,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',opacity:saving||!nat.w?.6:1}}>{saving?'…':'✓ Valider'}</button>
      </div>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// 🤖 BOT LAB — panneau admin pour piloter les bots et tout tester seul
// Nécessite la migration 20260620_bots.sql (is_bot + policies admin)
// ═════════════════════════════════════════════════════════════
function BotLab({ user, onClose, showToast }:{ user:any; onClose:()=>void; showToast:(m:string,c?:string)=>void }) {
  const [bots, setBots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string|null>(null)
  // 🔑 Bloc-notes « comptes de test » — stocké UNIQUEMENT sur cet appareil (localStorage), JAMAIS dans le
  // code public (repo GitHub déployé). David remplit ses logins de test une fois, il les revoit ici.
  const [testNote, setTestNote] = useState(()=>{ try{return localStorage.getItem('clutch_test_logins')||''}catch{return ''} })
  const [radius, setRadius] = useState<Record<string,number>>({})
  const [slotFrom, setSlotFrom] = useState<Record<string,string>>({})
  const [slotUntil, setSlotUntil] = useState<Record<string,string>>({})
  const myLat = user?.center_lat ?? 46.5197
  const myLng = user?.center_lng ?? 6.6323
  const POS:Record<string,{lat:number,lng:number,label:string}> = {
    me:    { lat: myLat,        lng: myLng,        label:'Sur moi' },
    near:  { lat: myLat+0.0045, lng: myLng+0.0030, label:'Proche ~500m' },
    morges:{ lat: 46.5094,      lng: 6.4983,       label:'Morges ~12km' },
  }
  const load = async () => {
    const { data } = await supabase.from('profiles')
      .select('id,name,gender,age,is_available,center_lat,center_lng,available_radius_km,account_type,looking_for,available_from,available_until,available_modes')
      .eq('is_bot', true).order('name')
    setBots(data||[]); setLoading(false)
  }
  useEffect(()=>{ load() },[])

  // Construit un ISO aujourd'hui à partir de "HH:MM" (ou null → défaut)
  const slotISO = (hhmm:string|undefined, fallbackMs:number) => {
    if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return new Date(fallbackMs).toISOString()
    const [h,m] = hhmm.split(':').map(Number)
    const d = new Date(); d.setHours(h, m, 0, 0); return d.toISOString()
  }
  const activateAt = async (bot:any, lat:number, lng:number, label:string) => {
    setBusy(bot.id)
    const r = radius[bot.id] ?? 10
    // Créneau : si réglé, on respecte ; sinon maintenant → +6h (et available_from=now obligatoire pour le filtre horaire)
    const sf = slotFrom[bot.id], su = slotUntil[bot.id]
    let fromMs  = new Date(slotISO(sf, Date.now())).getTime()
    let untilMs = new Date(slotISO(su, Date.now()+6*3600*1000)).getTime()
    if (untilMs <= fromMs) untilMs += 24*3600*1000   // créneau qui passe minuit (ex: 23:00 → 02:00)
    const fromISO = new Date(fromMs).toISOString(), untilISO = new Date(untilMs).toISOString()
    const { data, error } = await supabase.from('profiles').update({
      is_available:true, available_from:fromISO, available_until:untilISO,
      center_lat:lat, center_lng:lng, available_radius_km:r,
    }).eq('id', bot.id).select('id')
    setBusy(null)
    if (error || !data?.length) { showToast('❌ Échec — la migration bots est-elle appliquée ?', C.red); return }
    showToast(`✓ ${bot.name} en ligne · ${label} · ${r}km`, C.green); setAddrRes(a=>({...a,[bot.id]:[]})); load()
  }
  const activate = (bot:any, key:string) => { const p = POS[key]; return activateAt(bot, p.lat, p.lng, p.label) }
  // Géocodage adresse (Nominatim — même API que les RDV)
  const [addr, setAddr] = useState<Record<string,string>>({})
  const [addrRes, setAddrRes] = useState<Record<string,any[]>>({})
  const searchAddr = async (botId:string) => {
    const q = (addr[botId]||'').trim(); if (q.length < 3) return
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`)
      const j = (await res.json())||[]
      setAddrRes(a=>({...a,[botId]: j}))
    } catch { showToast('Recherche adresse indisponible', C.red) }
  }
  const deactivate = async (bot:any) => {
    setBusy(bot.id)
    const { data } = await supabase.from('profiles').update({ is_available:false }).eq('id', bot.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}; showToast(`${bot.name} hors ligne`); load()
  }
  const patchBot = async (bot:any, patch:any, msg:string) => {
    const { data } = await supabase.from('profiles').update(patch).eq('id', bot.id).select('id')
    if(!data?.length){showToast('❌ Échec',C.red);return}; showToast(msg,C.green); load()
  }
  const acceptClutch = async (bot:any) => {
    setBusy(bot.id)
    const { data:cl } = await supabase.from('clutches').select('id').eq('receiver_id', bot.id).eq('status','pending').order('created_at',{ascending:false}).limit(1)
    if (!cl?.length) { setBusy(null); showToast(`Aucun clutch en attente pour ${bot.name}`,C.orange); return }
    const { data, error } = await supabase.from('clutches').update({ status:'accepted' }).eq('id', cl[0].id).select('id')
    setBusy(null)
    if (error||!data?.length) { showToast('❌ Échec — policy clutches_bot_admin ?', C.red); return }
    showToast(`✓ ${bot.name} a accepté → Verrou ! 🔒`, C.green)
  }
  const refuseClutch = async (bot:any) => {
    setBusy(bot.id)
    const { data:cl } = await supabase.from('clutches').select('id').eq('receiver_id', bot.id).eq('status','pending').order('created_at',{ascending:false}).limit(1)
    if (!cl?.length) { setBusy(null); showToast(`Aucun clutch en attente pour ${bot.name}`,C.orange); return }
    const { data, error } = await supabase.from('clutches').update({ status:'declined' }).eq('id', cl[0].id).select('id')
    setBusy(null)
    if (error||!data?.length) { showToast('❌ Échec — policy clutches_bot_admin ?', C.red); return }
    showToast(`✕ ${bot.name} a refusé → cooldown 48h`, C.orange)
  }
  const findVerrou = async (botId:string) => {
    const { data:cl } = await supabase.from('clutches')
      .select('id,venue_lat,venue_lng,sender_id,receiver_id,sender_cur_lat,sender_cur_lng,receiver_cur_lat,receiver_cur_lng')
      .or(`sender_id.eq.${botId},receiver_id.eq.${botId}`).in('status',['accepted','confirmed','checked_in'])
      .order('created_at',{ascending:false}).limit(1)
    return cl?.[0] || null
  }
  const approach = async (bot:any) => {
    setBusy(bot.id)
    const c = await findVerrou(bot.id)
    if (!c || !c.venue_lat) { setBusy(null); showToast(`Pas de Verrou actif (avec lieu GPS) pour ${bot.name}`,C.orange); return }
    const isSnd = c.sender_id===bot.id
    const curLat = (isSnd?c.sender_cur_lat:c.receiver_cur_lat) ?? bot.center_lat ?? (c.venue_lat+0.02)
    const curLng = (isSnd?c.sender_cur_lng:c.receiver_cur_lng) ?? (c.venue_lng+0.02)
    const nLat = curLat + (c.venue_lat-curLat)*0.6
    const nLng = curLng + (c.venue_lng-curLng)*0.6
    const patch = isSnd ? {sender_cur_lat:nLat,sender_cur_lng:nLng} : {receiver_cur_lat:nLat,receiver_cur_lng:nLng}
    const { data } = await supabase.from('clutches').update(patch).eq('id',c.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}
    showToast(`${bot.name} se rapproche du lieu… 📡`,C.green)
  }
  const arrive = async (bot:any) => {
    setBusy(bot.id)
    const c = await findVerrou(bot.id)
    if (!c) { setBusy(null); showToast(`Pas de Verrou actif pour ${bot.name}`,C.orange); return }
    const isSnd = c.sender_id===bot.id
    const patch = isSnd ? {sender_arrived:true, sender_cur_lat:c.venue_lat, sender_cur_lng:c.venue_lng}
                        : {receiver_arrived:true, receiver_cur_lat:c.venue_lat, receiver_cur_lng:c.venue_lng}
    const { data } = await supabase.from('clutches').update(patch).eq('id',c.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}
    showToast(`✓ ${bot.name} est au RDV (J'y suis) ✅`,C.green)
  }
  const rdvNow = async (bot:any) => {
    setBusy(bot.id)
    const c = await findVerrou(bot.id)
    if (!c) { setBusy(null); showToast(`Pas de Verrou actif pour ${bot.name}`,C.orange); return }
    const patch:any = { proposed_time: new Date(Date.now()-60*1000).toISOString() } // -1min → radar visible
    if (c.venue_lat==null) { patch.venue_lat = myLat; patch.venue_lng = myLng } // lieu GPS si absent
    const { data } = await supabase.from('clutches').update(patch).eq('id',c.id).select('id')
    setBusy(null); if(!data?.length){showToast('❌ Échec',C.red);return}
    showToast(`✓ RDV de ${bot.name} mis à maintenant — le radar s'affiche 📡`,C.green)
  }
  const deactivateAll = async () => {
    setBusy('all')
    await supabase.from('profiles').update({ is_available:false }).eq('is_bot', true)
    setBusy(null); showToast('Tous les bots désactivés', C.orange); load()
  }
  // ⚡ TOUT EN LIGNE : tous les bots dispo, sur ma position (Présences se remplit d'un coup)
  const activateAll = async () => {
    setBusy('all')
    const fromISO = new Date().toISOString(), untilISO = new Date(Date.now()+6*3600*1000).toISOString()
    const { data, error } = await supabase.from('profiles').update({
      is_available:true, available_from:fromISO, available_until:untilISO,
      center_lat:myLat, center_lng:myLng, available_radius_km:10,
    }).eq('is_bot', true).select('id')
    setBusy(null)
    if (error || !data?.length) { showToast('❌ Échec — migration bots appliquée ? (génère des bots d\'abord)', C.red); return }
    showToast(`✓ ${data.length} bots en ligne sur toi 📍 — va dans Présences`, C.green); load()
  }
  // 📥 REMPLIR MA BOÎTE : N bots m'envoient un clutch (la boîte de réception se peuple → tester l'organisation)
  const fillMyInbox = async () => {
    setBusy('all')
    const { data: bs } = await supabase.from('profiles').select('id,name').eq('is_bot', true).limit(3)
    if (!bs?.length) { setBusy(null); showToast('Aucun bot — génère-en d\'abord', C.orange); return }
    // B6 — la table clutches a une unicité par paire active : si un bot a DÉJÀ un clutch avec moi
    // (resté d'un test), l'insert échoue silencieusement. On NETTOIE d'abord la paire, puis on insère.
    const botIds = bs.map((b:any)=>b.id)
    const ACT = ['pending','accepted','confirmed','checked_in']
    await supabase.from('clutches').update({status:'cancelled'}).in('sender_id', botIds).eq('receiver_id', user.id).in('status', ACT)
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id', user.id).in('receiver_id', botIds).in('status', ACT)
    let n=0; let lastErr=''
    for (const b of bs) {
      const { error } = await supabase.from('clutches').insert({
        sender_id: b.id, receiver_id: user.id,
        venue:'Café du Marché · Place de la Palud, Lausanne', venue_lat:46.5210, venue_lng:6.6340,
        proposed_time:new Date(Date.now()+30*60*1000).toISOString(),
        expires_at:new Date(Date.now()+2*3600*1000).toISOString(),
        status:'pending', message:`Un café ? — ${b.name}`,
      })
      if (!error) n++; else lastErr = error.message||''
    }
    setBusy(null)
    showToast(n>0?`✓ ${n} clutchs reçus — va dans l'onglet Clutchs 📨`:`❌ Échec — ${lastErr||'policy clutches_bot_admin ?'}`, n>0?C.green:C.red)
  }
  // RESET COMPLET : efface MES interactions avec les bots (clutchs + lapins) + les remet propres (dé-Driver, déverrouille)
  const clearBotInteractions = async () => {
    setBusy('all')
    const { data: botRows } = await supabase.from('profiles').select('id').eq('is_bot', true)
    const botIds = (botRows||[]).map((b:any)=>b.id)
    if (botIds.length) {
      const ACT = ['pending','accepted','confirmed','checked_in']
      await supabase.from('clutches').update({status:'cancelled'}).in('sender_id', botIds).in('status', ACT)
      await supabase.from('clutches').update({status:'cancelled'}).in('receiver_id', botIds).in('status', ACT)
      await supabase.from('rdv_feedbacks').update({outcome:'on_time'}).eq('from_id', user.id).in('to_id', botIds).eq('outcome','absent')
      await supabase.from('profiles').update({ account_type:'H' }).in('id', botIds).eq('account_type','driver')
      await supabase.from('profiles').update({ rdv_locked_until:null, rdv_locked_from:null }).in('id', botIds)
      // Nettoyage des events de test créés par les bots + désinscription des bots des events d'autrui
      const { data: botEvs } = await supabase.from('events').select('id').in('created_by', botIds)
      const evIds = (botEvs||[]).map((e:any)=>e.id)
      if (evIds.length) {
        await supabase.from('event_participants').delete().in('event_id', evIds)
        await supabase.from('events').delete().in('id', evIds)
      }
      await supabase.from('event_participants').delete().in('user_id', botIds)
    }
    setBusy(null); showToast('✓ Reset complet — bots, events de test & lapins nettoyés', C.green); load()
  }
  // Remplir le DERNIER event actif avec N bots (tester compteur places / min_participants / créateur qui flake)
  const fillEventWithBots = async () => {
    setBusy('all')
    const { data: evs } = await supabase.from('events').select('id,title,spots,created_by').eq('active',true).order('created_at',{ascending:false}).limit(1)
    if (!evs?.length) { setBusy(null); showToast("Aucun event actif — crée-en un d'abord (🎟️)", C.orange); return }
    const ev = evs[0]
    const { data: botRows } = await supabase.from('profiles').select('id').eq('is_bot',true).neq('id', ev.created_by||'00000000-0000-0000-0000-000000000000').limit(Math.max(1,(ev.spots||6)))  // remplit jusqu'à COMPLET (test liste d'attente)
    const botIds = (botRows||[]).map((b:any)=>b.id)
    let inserted=0
    for (const bid of botIds) {
      const { error } = await supabase.from('event_participants').insert({ event_id: ev.id, user_id: bid })
      if (!error) inserted++   // les doublons (déjà inscrits) échouent silencieusement, normal
    }
    // taken est recalculé par le trigger DB ; on lit le total
    const { count } = await supabase.from('event_participants').select('*',{count:'exact',head:true}).eq('event_id',ev.id)
    // On n'a que ~10 bots → pour saturer un gros event, on cale spots sur le nb d'inscrits (COMPLET garanti)
    if ((count??0) > 0) await supabase.from('events').update({ spots: count }).eq('id', ev.id)
    setBusy(null)
    if ((count??0) > 0) showToast(`✓ "${ev.title}" COMPLET : ${count}/${count}`, C.green)
    else showToast("❌ Échec — applique la SQL event_participants_bot_admin", C.red)
  }
  // Libère UNE place sur le dernier event (retire 1 bot inscrit) → tester la notice "place libérée"
  const freeEventSpot = async () => {
    setBusy('all')
    const { data: evs } = await supabase.from('events').select('id,title').eq('active',true).order('created_at',{ascending:false}).limit(1)
    if (!evs?.length) { setBusy(null); showToast("Aucun event actif", C.orange); return }
    const ev = evs[0]
    const { data: bots } = await supabase.from('profiles').select('id').eq('is_bot',true)
    const botIds = new Set((bots||[]).map((b:any)=>b.id))
    const { data: parts } = await supabase.from('event_participants').select('user_id').eq('event_id', ev.id)
    const botPart = (parts||[]).find((p:any)=>botIds.has(p.user_id))
    if (!botPart) { setBusy(null); showToast("Aucun bot inscrit à retirer", C.orange); return }
    await supabase.from('event_participants').delete().eq('event_id', ev.id).eq('user_id', botPart.user_id)
    setBusy(null); showToast(`🪑 1 place libérée sur "${ev.title}"`, C.green)
  }
  const resetMyOnboarding = async () => {
    if (!confirm("Réinitialiser TON inscription pour la re-tester ?\nTon profil (photo/âge/genre) sera vidé. Déconnecte-toi puis reconnecte-toi ensuite → l'inscription recommence.")) return
    await supabase.from('profiles').update({ photo_url:null, age:null, gender:null, is_available:false }).eq('id', user.id)
    try { localStorage.removeItem('clutch_onboarding_done') } catch {}
    showToast("✓ Déconnecte-toi puis reconnecte-toi → l'inscription recommence", C.orange)
  }
  // Le bot M'ENVOIE un Clutch (tester la réception + le contre-clutch)
  const meClutch = async (bot:any) => {
    setBusy(bot.id)
    // B6 — nettoie la paire avant (unicité par paire active → sinon l'insert échoue silencieusement).
    const ACT = ['pending','accepted','confirmed','checked_in']
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id', bot.id).eq('receiver_id', user.id).in('status', ACT)
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id', user.id).eq('receiver_id', bot.id).in('status', ACT)
    const { error } = await supabase.from('clutches').insert({
      sender_id: bot.id, receiver_id: user.id,
      venue: 'Café du Marché · Place de la Palud, Lausanne', venue_lat: 46.5210, venue_lng: 6.6340,
      proposed_time: new Date(Date.now()+30*60*1000).toISOString(),
      expires_at: new Date(Date.now()+2*3600*1000).toISOString(),
      status: 'pending', message: `Un café ? — ${bot.name}`,
    })
    setBusy(null)
    if (error) { showToast('❌ Échec — '+(error.message||'policy clutches_bot_admin ?'), C.red); return }
    showToast(`✓ ${bot.name} t'a envoyé un Clutch — va dans l'app 📨`, C.green)
  }
  // Le bot CRÉE un événement (tester l'onglet Events rempli + badge 🔒). Nécessite la policy events_bot_admin.
  const createBotEvent = async (bot:any) => {
    setBusy(bot.id)
    // Horaire COHÉRENT (vrai timestamp) → l'event entre dans la forteresse + le gate spontané est testable.
    const st = new Date(); st.setHours(19,0,0,0); if (st.getTime() < Date.now()) st.setDate(st.getDate()+1)
    const { error } = await supabase.from('events').insert({
      title: `${bot.name} — Apéro découverte`, emoji:'🍷', lieu:'Café du Marché, Lausanne',
      event_time:'19:00', event_date:'Ce soir', starts_at: st.toISOString(), duration_minutes:180, spots:6, taken:0,
      description:'Événement de test créé par un bot.', tags:['groupe'], ev_gender:'X',
      type:'user', status:'pending', active:true, created_by: bot.id, creator: bot.name,
    })
    setBusy(null)
    if (error) { showToast('❌ Applique le SQL events_bot_admin (cf message)', C.red); return }
    showToast(`✓ ${bot.name} a créé un event 🎟️ (onglet Événements + badge 🔒)`, C.green)
  }
  // Le bot CRÉATEUR annule son event (flake) → libère les inscrits (dont toi) + pénalise le bot
  const botCancelEvent = async (bot:any) => {
    setBusy(bot.id)
    const { data: evs } = await supabase.from('events').select('id,title').eq('created_by', bot.id).eq('active',true).order('created_at',{ascending:false}).limit(1)
    if (!evs?.length) { setBusy(null); showToast(`${bot.name} n'a aucun event actif (crée-en un 🎟️)`, C.orange); return }
    const ev = evs[0]
    await supabase.from('events').update({ active:false, status:'cancelled' }).eq('id', ev.id)
    const { data:p } = await supabase.from('profiles').select('reliability_score').eq('id', bot.id).maybeSingle()
    await supabase.from('profiles').update({ reliability_score: Math.max(0,((p as any)?.reliability_score??100)-10) }).eq('id', bot.id)
    setBusy(null); showToast(`🚫 ${bot.name} a annulé "${ev.title}" → inscrits libérés, ${bot.name} pénalisé`, C.orange); load()
  }
  // Toggle Clutch Driver (rôle organisateur : masqué des Présences, visible seulement dans Events)
  const toggleDriver = (bot:any) => {
    const isDriver = bot.account_type === 'driver'
    patchBot(bot, { account_type: isDriver ? 'H' : 'driver' }, `${bot.name} : ${isDriver?'Membre normal':'Clutch Driver 🚗 (masqué des Présences)'}`)
  }
  // Mode de rencontre (available_modes) — multi-select, parent exclusif (= exclut les non-parents)
  const toggleBotMode = (bot:any, key:string) => {
    const cur:string[] = Array.isArray(bot.available_modes) ? bot.available_modes : []
    let next:string[]
    if (key==='parent') next = cur.includes('parent') ? [] : ['parent']
    else { const without = cur.filter(x=>x!==key && x!=='parent'); next = cur.includes(key) ? without : [...without, key] }
    patchBot(bot, { available_modes: next.length?next:null }, `${bot.name} modes : ${next.join(', ')||'aucun'}`)
  }

  const Btn = ({onClick,children,bg=C.bgCard,col=C.white}:any)=>(
    <button onClick={onClick} disabled={!!busy} style={{padding:'7px 10px',borderRadius:9,border:`1px solid ${C.border}`,background:bg,color:col,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:busy?.6:1}}>{children}</button>
  )

  return (
    <div style={{position:'fixed',inset:0,zIndex:9999,background:C.bg,overflowY:'auto',WebkitOverflowScrolling:'touch'}}>
      <div style={{position:'sticky',top:0,background:C.bg,borderBottom:`1px solid ${C.border}`,padding:'calc(var(--sat) + 14px) 16px 14px',display:'flex',justifyContent:'space-between',alignItems:'center',zIndex:2}}>
        <div style={{fontSize:16,fontWeight:900,color:C.white}}>🤖 Générateur de bots</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.whiteMid,fontSize:22,cursor:'pointer',padding:'4px 4px 4px 12px'}}>✕</button>
      </div>
      <div style={{padding:'12px 16px calc(var(--sab) + 60px)'}}>
        {/* 🔑 Comptes de test — privé, sur cet appareil uniquement (jamais dans le code public) */}
        <div style={{marginBottom:14,background:`${C.orange}10`,borderRadius:10,padding:'10px 12px',border:`1px solid ${C.orange}40`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.orange,marginBottom:6}}>🔑 Mes comptes de test <span style={{fontWeight:600,color:C.whiteMid,fontSize:10}}>· privé (cet appareil)</span></div>
          <textarea value={testNote} onChange={e=>{ setTestNote(e.target.value); try{localStorage.setItem('clutch_test_logins', e.target.value)}catch{} }}
            placeholder={"David — david.saugy@gmail.com — mdp : …\nTafit — email : … — mdp : …\nMélanie — email : … — mdp : …"}
            rows={4} style={{width:'100%',boxSizing:'border-box',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:8,color:C.white,fontSize:12,fontFamily:'inherit',padding:'8px 10px',resize:'vertical',lineHeight:1.5}}/>
          <div style={{fontSize:9.5,color:C.whiteMid,marginTop:5,lineHeight:1.4}}>💾 Sauvegardé automatiquement sur CET appareil. Jamais envoyé ni mis dans le code (sécurité : repo public).</div>
        </div>

        {/* 🧪 JE TESTE EN TANT QUE — transforme MON compte en chaque type (1 tap), pour voir la vue de chacun */}
        <div style={{marginBottom:14,background:C.bgCard,borderRadius:10,padding:'10px 12px',border:`1px solid ${C.border}`}}>
          <div style={{fontSize:12,fontWeight:800,color:C.white,marginBottom:2}}>🧪 Je teste en tant que…</div>
          <div style={{fontSize:9.5,color:C.whiteMid,marginBottom:8,lineHeight:1.4}}>Change le type de TON compte ({user?.name||'toi'}). Recharge l'app après.</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[['H','Hydrogène','gratuit'],['Au','Or','9.90'],['Rh','Rhodium','19.90'],['At','Astate','29.90'],['driver','Driver 🚗','orga']].map(([v,lab,sub])=>{
              const on = (user as any)?.account_type===v || (v==='H' && !['Au','Rh','At','driver'].includes((user as any)?.account_type))
              return <button key={v} onClick={async()=>{
                  if(!user?.id) return
                  await supabase.from('profiles').update({account_type:v}).eq('id',user.id)
                  showToast(`Ton compte → ${lab} — recharge l'app pour voir`, C.green)
                }}
                style={{flex:'1 0 auto',minWidth:72,padding:'8px 6px',borderRadius:9,border:`1.5px solid ${on?C.gold:C.border}`,background:on?C.gold:'transparent',color:on?'#1a0810':C.white,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',lineHeight:1.2}}>
                {lab}<div style={{fontSize:8.5,fontWeight:600,opacity:.8}}>{sub}</div></button>
            })}
          </div>
          <div style={{fontSize:9,color:C.whiteMid,marginTop:7,lineHeight:1.45}}>⚠️ Or/Rhodium/Astate = features pas encore codées → se comportent comme Hydrogène pour l'instant. <b style={{color:C.salmon}}>Driver</b> = te masque des Présences, visible seulement en Événements.</div>
        </div>
        <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.6,marginBottom:14,background:C.bgCard,borderRadius:10,padding:'10px 12px',border:`1px solid ${C.border}`}}>
          ① <b>Active</b> un bot à une position → il apparaît dans tes Présences. ② <b>Clutche-le</b> depuis l'app. ③ Reviens ici → <b>Accepter</b> (→ Verrou). ④ <b>Rapprocher</b> (×3-4, regarde le radar) puis <b>Au RDV</b>. ⑤ Toi : J'y suis → Terminer.
        </div>
        {/* Actions globales */}
        <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
          <Btn onClick={activateAll} bg={`${C.green}1a`} col={C.green}>⚡ Tout mettre en ligne (sur moi)</Btn>
          <Btn onClick={fillMyInbox} bg={`${C.green}1a`} col={C.green}>📥 Remplir ma boîte de Clutchs</Btn>
          <Btn onClick={deactivateAll} bg="rgba(239,68,68,.12)" col="#f87171">🔄 Désactiver tous les bots</Btn>
          <Btn onClick={clearBotInteractions} bg={C.salmonFaint} col={C.salmon}>🧹 Reset complet (débloque les bots)</Btn>
          <Btn onClick={fillEventWithBots} bg={C.salmonFaint} col={C.salmon}>🎟️ Remplir (complet)</Btn>
          <Btn onClick={freeEventSpot} bg={C.salmonFaint} col={C.salmon}>🪑 Libérer une place</Btn>
          <Btn onClick={resetMyOnboarding} bg={C.salmonFaint} col={C.salmon}>👤 Refaire mon inscription</Btn>
        </div>
        {loading && <div style={{color:C.whiteMid,textAlign:'center',padding:20}}>Chargement…</div>}
        {!loading && bots.length===0 && <div style={{color:C.whiteMid,textAlign:'center',padding:20}}>Aucun bot (migration appliquée ?)</div>}
        {bots.map(bot=>(
          <div key={bot.id} style={{background:C.bgCard,border:`1px solid ${bot.is_available?C.green:C.border}`,borderRadius:14,padding:'12px',marginBottom:10}}>
            {(()=>{ const TL = bot.account_type==='Rh'?'Rhodium':bot.account_type==='Au'?'Or':bot.account_type==='At'?'Astate':'Hydrogène'; return (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:800,color:C.white}}>{bot.name} <span style={{fontSize:11,color:C.whiteMid,fontWeight:500}}>{bot.gender==='woman'?'♀':bot.gender==='man'?'♂':''} · {bot.age||'?'}a · {TL}</span></div>
              {/* Statut cliquable = toggle en ligne/hors ligne */}
              <button onClick={()=>bot.is_available?deactivate(bot):activate(bot,'me')} disabled={!!busy}
                style={{fontSize:10,fontWeight:800,padding:'4px 9px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',
                  border:`1px solid ${bot.is_available?C.green:C.border}`,background:bot.is_available?'rgba(45,189,126,.15)':'transparent',color:bot.is_available?C.green:C.whiteMid}}>
                {bot.is_available?'🟢 EN LIGNE':'⚪ hors ligne'}
              </button>
            </div>
            )})()}
            {/* Position par presets */}
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>ACTIVER À :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6,alignItems:'center'}}>
              <Btn onClick={()=>activate(bot,'me')} bg={C.salmonFaint} col={C.salmon}>📍 Sur moi</Btn>
              <Btn onClick={()=>activate(bot,'near')} bg={C.salmonFaint} col={C.salmon}>🚶 Proche 500m</Btn>
              <Btn onClick={()=>activate(bot,'morges')} bg={C.salmonFaint} col={C.salmon}>🚗 Morges</Btn>
              <span style={{fontSize:10,color:C.whiteMid}}>rayon</span>
              <input type="number" value={radius[bot.id]??10} onChange={e=>setRadius(r=>({...r,[bot.id]:Number(e.target.value)}))}
                style={{width:48,padding:'6px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:11,fontFamily:'inherit'}}/>
              <span style={{fontSize:10,color:C.whiteMid}}>km</span>
            </div>
            {/* Position par adresse (Nominatim) */}
            <div style={{display:'flex',gap:6,marginBottom:6}}>
              <input value={addr[bot.id]||''} onChange={e=>setAddr(a=>({...a,[bot.id]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter')searchAddr(bot.id)}}
                placeholder="Adresse (ex: Gare de Nyon)…"
                style={{flex:1,padding:'7px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:11,fontFamily:'inherit',outline:'none'}}/>
              <Btn onClick={()=>searchAddr(bot.id)} bg={C.salmonFaint} col={C.salmon}>🔍</Btn>
            </div>
            {(addrRes[bot.id]||[]).length>0 && (
              <div style={{marginBottom:8,background:C.bg,borderRadius:8,border:`1px solid ${C.border}`,overflow:'hidden'}}>
                {(addrRes[bot.id]||[]).map((r:any,ri:number)=>(
                  <div key={ri} onClick={()=>activateAt(bot, parseFloat(r.lat), parseFloat(r.lon), (r.display_name||'').split(',').slice(0,2).join(','))}
                    style={{padding:'8px 10px',fontSize:11,color:C.white,cursor:'pointer',borderBottom:ri<(addrRes[bot.id]||[]).length-1?`1px solid ${C.border}`:'none'}}>
                    📍 {(r.display_name||'').split(',').slice(0,3).join(',')}
                  </div>
                ))}
              </div>
            )}
            {/* Créneau horaire (available_from → available_until) — pour tester le filtre de chevauchement + la fenêtre RDV */}
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>CRÉNEAU (laisser vide = maintenant → +6h) :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8,alignItems:'center'}}>
              <input type="time" value={slotFrom[bot.id]||''} onChange={e=>setSlotFrom(s=>({...s,[bot.id]:e.target.value}))}
                style={{padding:'6px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:11,fontFamily:'inherit'}}/>
              <span style={{fontSize:11,color:C.whiteMid}}>→</span>
              <input type="time" value={slotUntil[bot.id]||''} onChange={e=>setSlotUntil(s=>({...s,[bot.id]:e.target.value}))}
                style={{padding:'6px',borderRadius:8,border:`1px solid ${C.border}`,background:C.bg,color:C.white,fontSize:11,fontFamily:'inherit'}}/>
              <Btn onClick={()=>activateAt(bot, bot.center_lat??myLat, bot.center_lng??myLng, 'créneau')} bg={C.salmonFaint} col={C.salmon}>⏱ Appliquer le créneau</Btn>
            </div>
            {/* Réglages : âge + type de compte */}
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}}>
              <Btn onClick={()=>patchBot(bot,{age:(bot.age||25)+1},`${bot.name} : ${(bot.age||25)+1} ans`)}>âge +1</Btn>
              <Btn onClick={()=>patchBot(bot,{age:Math.max(18,(bot.age||25)-1)},`${bot.name} : ${Math.max(18,(bot.age||25)-1)} ans`)}>âge −1</Btn>
              {bot.is_available && <Btn onClick={()=>deactivate(bot)} bg="rgba(239,68,68,.15)" col="#f87171">⏻ Désactiver</Btn>}
            </div>
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>TYPE DE COMPTE :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
              {[['H','Hydrogène'],['Au','Or'],['Rh','Rhodium'],['At','Astate']].map(([v,lab])=>(
                <Btn key={v} onClick={()=>patchBot(bot,{account_type:v},`${bot.name} : ${lab}`)}
                  bg={bot.account_type===v||(v==='H'&&!['Au','Rh','At','driver'].includes(bot.account_type))?C.gold:C.bgCard} col={bot.account_type===v||(v==='H'&&!['Au','Rh','At','driver'].includes(bot.account_type))?'#1a0810':C.white}>{lab}</Btn>
              ))}
            </div>
            {/* Genre recherché (looking_for) — pour tester le filtre genre symétrique */}
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>CHERCHE (genre) :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
              {[['F','♀ Femmes'],['M','♂ Hommes'],['ALL','Tout le monde']].map(([v,lab])=>{
                const sel = (bot.looking_for||'ALL')===v || (v==='ALL'&&!['M','F'].includes(bot.looking_for))
                return <Btn key={v} onClick={()=>patchBot(bot,{looking_for:v},`${bot.name} cherche : ${lab}`)} bg={sel?C.gold:C.bgCard} col={sel?'#1a0810':C.white}>{lab}</Btn>
              })}
            </div>
            {/* Mode de rencontre (available_modes) */}
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>MODE (intersection · parent = exclusif) :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
              {[['romantic','💕 Romance'],['friend','🤝 Amitié'],['pro','💼 Pro'],['parent','👶 Parents']].map(([v,lab])=>{
                const sel = Array.isArray(bot.available_modes) && bot.available_modes.includes(v)
                return <Btn key={v} onClick={()=>toggleBotMode(bot,v)} bg={sel?C.gold:C.bgCard} col={sel?'#1a0810':C.white}>{lab}</Btn>
              })}
            </div>
            {/* Scénarios */}
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>SCÉNARIOS :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:8}}>
              <Btn onClick={()=>meClutch(bot)} bg={C.salmonFaint} col={C.salmon}>📨 Me clutcher</Btn>
              <Btn onClick={()=>createBotEvent(bot)} bg={C.salmonFaint} col={C.salmon}>🎟️ Créer un event</Btn>
              <Btn onClick={()=>botCancelEvent(bot)} bg="rgba(220,80,80,.12)" col={C.red}>🚫 Annuler son event (flake)</Btn>
              <Btn onClick={()=>toggleDriver(bot)} bg={bot.account_type==='driver'?C.gold:C.bgCard} col={bot.account_type==='driver'?'#1a0810':C.white}>🚗 {bot.account_type==='driver'?'Driver ✓':'Clutch Driver'}</Btn>
            </div>
            {/* Flow RDV */}
            <div style={{fontSize:9,color:C.whiteMid,letterSpacing:'.06em',marginBottom:5}}>FLOW RDV (après l'avoir clutché) :</div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              <Btn onClick={()=>acceptClutch(bot)} bg="rgba(45,189,126,.15)" col={C.green}>✓ Accepter clutch</Btn>
              <Btn onClick={()=>refuseClutch(bot)} bg="rgba(220,80,80,.12)" col={C.red}>✕ Refuser (cooldown 48h)</Btn>
              <Btn onClick={()=>rdvNow(bot)} bg={C.salmonFaint} col={C.salmon}>🕐 RDV maintenant</Btn>
              <Btn onClick={()=>approach(bot)}>📡 Rapprocher</Btn>
              <Btn onClick={()=>arrive(bot)} bg="rgba(45,189,126,.15)" col={C.green}>📍 Au RDV (J'y suis)</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Test de personnalité 16 types (cadre MBTI public, NOS questions — pas 16personalities qui est propriétaire) ──
const MBTI_Q: {q:string; a:string; b:string; axis:number; al:string; bl:string}[] = [
  {axis:0,q:'Une soirée idéale ?',a:'Entouré·e de plein de monde',b:'Avec 1-2 proches',al:'E',bl:'I'},
  {axis:0,q:'Après un gros moment social, tu es…',a:'Rechargé·e à bloc',b:'Vidé·e, besoin de calme',al:'E',bl:'I'},
  {axis:0,q:'Face à un·e inconnu·e…',a:'Tu lances la conversation',b:'Tu attends qu\'on vienne',al:'E',bl:'I'},
  {axis:1,q:'Tu retiens surtout…',a:'Les détails concrets',b:'Les idées et les possibles',al:'S',bl:'N'},
  {axis:1,q:'Tu préfères parler de…',a:'Ce qui est réel',b:'Ce qui pourrait être',al:'S',bl:'N'},
  {axis:1,q:'Pour décider, tu te fies à…',a:'L\'expérience, les faits',b:'Ton intuition',al:'S',bl:'N'},
  {axis:2,q:'Un·e ami·e a un souci…',a:'Tu cherches LA solution',b:'Tu écoutes et réconfortes',al:'T',bl:'F'},
  {axis:2,q:'On dit de toi plutôt…',a:'Honnête et direct·e',b:'Attentionné·e et empathique',al:'T',bl:'F'},
  {axis:2,q:'Une bonne décision est…',a:'Juste et logique',b:'Qui ménage les gens',al:'T',bl:'F'},
  {axis:3,q:'Ton week-end ?',a:'Planifié à l\'avance',b:'On verra sur le moment',al:'J',bl:'P'},
  {axis:3,q:'Tu es mieux quand…',a:'C\'est décidé, organisé',b:'Tout reste ouvert, flexible',al:'J',bl:'P'},
  {axis:3,q:'Une to-do list…',a:'Tu adores',b:'Ça t\'étouffe',al:'J',bl:'P'},
]
const MBTI_TYPES: Record<string,{name:string;emoji:string;vibe:string}> = {
  INTJ:{name:'L\'Architecte',emoji:'🏛',vibe:'stratège, indépendant·e'}, INTP:{name:'Le Penseur',emoji:'🔭',vibe:'curieux·se, inventif·ve'},
  ENTJ:{name:'Le Meneur',emoji:'⚡',vibe:'leader, ambitieux·se'}, ENTP:{name:'Le Débatteur',emoji:'💥',vibe:'vif·ve, joueur·se'},
  INFJ:{name:'Le Conseiller',emoji:'🌙',vibe:'profond·e, idéaliste'}, INFP:{name:'Le Rêveur',emoji:'🌸',vibe:'sensible, authentique'},
  ENFJ:{name:'Le Protagoniste',emoji:'✨',vibe:'chaleureux·se, inspirant·e'}, ENFP:{name:'L\'Étincelle',emoji:'🔥',vibe:'enthousiaste, libre'},
  ISTJ:{name:'Le Pilier',emoji:'🧱',vibe:'fiable, carré·e'}, ISFJ:{name:'Le Protecteur',emoji:'🛡',vibe:'loyal·e, attentionné·e'},
  ESTJ:{name:'L\'Organisateur',emoji:'📋',vibe:'efficace, droit·e'}, ESFJ:{name:'L\'Hôte',emoji:'🤝',vibe:'généreux·se, sociable'},
  ISTP:{name:'Le Bricoleur',emoji:'🔧',vibe:'calme, débrouillard·e'}, ISFP:{name:'L\'Artiste',emoji:'🎨',vibe:'doux·ce, esthète'},
  ESTP:{name:'L\'Aventurier',emoji:'🏄',vibe:'fonceur·se, fun'}, ESFP:{name:'Le Showman',emoji:'🎉',vibe:'pétillant·e, spontané·e'},
}
function MBTITest({ lang, onClose }:{ lang:Lang; onClose:()=>void }){
  const [ans,setAns]=useState<string[]>([])
  const done = ans.length===MBTI_Q.length
  const type = done ? [0,1,2,3].map(ax=>{ const ls=MBTI_Q.map((q,i)=>q.axis===ax?ans[i]:null).filter(Boolean) as string[]; const c:Record<string,number>={}; ls.forEach(l=>{c[l]=(c[l]||0)+1}); return Object.entries(c).sort((a,b)=>b[1]-a[1])[0][0] }).join('') : ''
  useEffect(()=>{ if(done && type){ try{localStorage.setItem('clutch_mbti',type)}catch{} } },[done,type])
  const q = MBTI_Q[ans.length]
  const EN = lang==='en'
  return (
    <div style={{position:'fixed',inset:0,zIndex:5200,background:C.bg,display:'flex',flexDirection:'column',padding:'calc(var(--sat) + 16px) 22px calc(var(--sab) + 24px)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div style={{fontSize:16,fontWeight:900,color:C.white}}>🧬 {EN?'Personality test':'Test de personnalité'}</div>
        <button onClick={onClose} style={{background:'none',border:'none',color:C.whiteMid,fontSize:22,cursor:'pointer'}}>✕</button>
      </div>
      {!done ? (
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div style={{height:5,borderRadius:3,background:C.border,marginBottom:24,overflow:'hidden'}}><div style={{height:'100%',width:`${ans.length/MBTI_Q.length*100}%`,background:C.orange,transition:'width .25s'}}/></div>
          <div style={{fontSize:11,color:C.whiteMid,marginBottom:8}}>{ans.length+1}/{MBTI_Q.length}</div>
          <div style={{fontSize:21,fontWeight:900,color:C.white,marginBottom:24,lineHeight:1.25}}>{q.q}</div>
          {[{l:q.al,t:q.a},{l:q.bl,t:q.b}].map((opt,i)=>(
            <button key={i} onClick={()=>setAns(a=>[...a,opt.l])}
              style={{width:'100%',textAlign:'left',padding:'16px 18px',marginBottom:11,borderRadius:16,border:`1.5px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{opt.t}</button>
          ))}
          {ans.length>0 && <button onClick={()=>setAns(a=>a.slice(0,-1))} style={{marginTop:6,background:'none',border:'none',color:C.whiteMid,fontSize:13,cursor:'pointer'}}>← {EN?'Back':'Retour'}</button>}
        </div>
      ) : (
        <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',textAlign:'center'}}>
          <div style={{fontSize:64}}>{MBTI_TYPES[type]?.emoji}</div>
          <div style={{fontSize:13,fontWeight:800,color:C.orange,letterSpacing:'.1em',marginTop:8}}>{type}</div>
          <div style={{fontSize:26,fontWeight:900,color:C.white,marginTop:2}}>{MBTI_TYPES[type]?.name}</div>
          <div style={{fontSize:14,color:C.whiteMid,marginTop:6}}>{MBTI_TYPES[type]?.vibe}</div>
          <div style={{fontSize:12,color:C.whiteMid,marginTop:18,lineHeight:1.5,maxWidth:300,marginLeft:'auto',marginRight:'auto'}}>{EN?'Saved to your profile. It gently flavours who Clutch suggests — you stay in control.':'Enregistré sur ton profil. Ça assaisonne en douceur qui Clutch te propose — tu gardes le contrôle.'}</div>
          <button onClick={onClose} style={{marginTop:24,padding:'15px',borderRadius:16,border:'none',background:C.bordeaux,color:'#fff',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>{EN?'Done':'Terminé'}</button>
          <button onClick={()=>setAns([])} style={{marginTop:8,background:'none',border:'none',color:C.whiteMid,fontSize:13,cursor:'pointer'}}>↺ {EN?'Retake':'Refaire'}</button>
        </div>
      )}
    </div>
  )
}

function ProfileTab({ user, flow:_flow, setFlow, signOut, setShowDelete, showToast, onUserUpdate, lang, setLang, onSetAvailable, isAvailable, rdvBlocked, onFeedback }:{
  user:Profile; flow:AppFlow; setFlow:(f:AppFlow)=>void;
  signOut:()=>void; setShowDelete:(v:boolean)=>void;
  showToast:(m:string,c?:string)=>void; onUserUpdate:(p:Profile)=>void;
  lang:Lang; setLang:(l:Lang)=>void;
  onSetAvailable?:()=>void; isAvailable?:boolean; rdvBlocked?:boolean; onFeedback?:()=>void;
}) {
  const [profileSubTab, setProfileSubTab] = useState<'profil'|'settings'>('profil')
  // Navigation « poupées russes » : pile d'écrans. push = on entre plus profond, pop = ‹ Retour remonte d'un niveau.
  const [pageStack, setPageStack] = useState<string[]>([])
  const profilePage = pageStack[pageStack.length-1] || null
  const setProfilePage = (p:string|null) => setPageStack(s => p===null ? [] : [...s, p])
  const popPage = () => setPageStack(s => s.slice(0,-1))
  // 🧭 SWIPE-BACK (ergonomie David) : glisser vers la droite ferme la sous-page (feel iOS), sans casser le scroll vertical.
  const swipeOverlayRef = useRef<HTMLDivElement|null>(null)
  const swipeRef = useRef<{x:number;y:number;active:boolean;decided:boolean;horiz:boolean;vert:boolean}>({x:0,y:0,active:false,decided:false,horiz:false,vert:false})
  const onSwipeStart = (e:React.TouchEvent) => { const t=e.touches[0]; swipeRef.current={x:t.clientX,y:t.clientY,active:true,decided:false,horiz:false,vert:false} }
  const onSwipeMove = (e:React.TouchEvent) => {
    const s=swipeRef.current; if(!s.active) return
    const t=e.touches[0]; const dx=t.clientX-s.x, dy=t.clientY-s.y
    if(!s.decided){ if(Math.abs(dx)<6 && Math.abs(dy)<6) return; s.decided=true; s.horiz = Math.abs(dx) > Math.abs(dy)
      // Swipe-DOWN pour revenir (David) : seulement si le geste part du HAUT (≤150px) → pas de conflit avec le scroll du contenu
      s.vert = !s.horiz && dy>0 && s.y <= 150 }
    const el=swipeOverlayRef.current
    if(s.horiz && el){ const off=Math.max(0,dx); el.style.transition='none'; el.style.transform=`translateX(${off}px)`; el.style.opacity=String(Math.max(.5,1-off/600)) }
    else if(s.vert && el){ const off=Math.max(0,dy); el.style.transition='none'; el.style.transform=`translateY(${off}px)`; el.style.opacity=String(Math.max(.5,1-off/700)) }
  }
  const onSwipeEnd = (e:React.TouchEvent) => {
    const s=swipeRef.current; if(!s.active) return; s.active=false
    const el=swipeOverlayRef.current; if(!el || (!s.horiz && !s.vert)) return
    el.style.transition='transform .2s ease, opacity .2s ease'
    const dx=(e.changedTouches[0]?.clientX||s.x)-s.x, dy=(e.changedTouches[0]?.clientY||s.y)-s.y
    const dismiss = (s.horiz && dx>90) || (s.vert && dy>90)
    if(dismiss){ el.style.transform = s.horiz?'translateX(100%)':'translateY(100%)'; el.style.opacity='0'; setTimeout(()=>{ popPage(); setEditField(null); if(el){ el.style.transform=''; el.style.opacity=''; } },170) }
    else { el.style.transform='translate(0,0)'; el.style.opacity='1' }
  }
  const [showBotLab, setShowBotLab] = useState(false)
  const [showConvDemo, setShowConvDemo] = useState(false) // aperçu de la Convergence (demande David)
  const [showMbti, setShowMbti] = useState(false) // test de personnalité 16 types
  const [mbtiType, setMbtiType] = useState<string>(()=>{ try{return localStorage.getItem('clutch_mbti')||''}catch{return ''} })
  const isAdmin = ['bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864'].includes(user.id)
  // 🤖 Mode DÉMO (bots visibles, étiquetés) ↔ RÉEL (app vide, pour tester avec de vrais amis). null = pas réglé → défaut selon admin.
  const [demoMode, setDemoMode] = useState<boolean|null>(()=>{ try{const v=localStorage.getItem('clutch_demo_mode'); return v===null?null:v==='1'}catch{return null} })
  // 🤖 Bots/mock affichés ? Démo (défaut) = oui · Réel = non (app vide pour tester avec de vrais amis). Cohérent avec demoOn().
  const showBots = demoMode===null ? true : demoMode
  const [editField, setEditField] = useState<string|null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(user.name||'')
  const [editBio, setEditBio] = useState(user.bio||'')
  // Activité du moment — visible sur le profil dans la carte
  const actKey = `clutch_activity_${user.id}`
  const [actText, setActText] = useState(()=>{ try{return JSON.parse(localStorage.getItem(actKey)||'{}').text||''}catch{return ''} })
  const [actEmoji, setActEmoji] = useState(()=>{ try{return JSON.parse(localStorage.getItem(actKey)||'{}').emoji||''}catch{return ''} })
  const [actSaving, setActSaving] = useState(false)
  const ACTIVITY_EMOJIS = ['♟️','🎸','🍕','🏃','☕','🎬','📚','🏊','🎲','🎵','🍷','🌙','⛰️','🚴','🎨']
  const saveActivity = async () => {
    setActSaving(true)
    const payload = { text: actText.trim(), emoji: actEmoji, expires: new Date(Date.now()+8*3600*1000).toISOString() }
    try { localStorage.setItem(actKey, JSON.stringify(payload)) } catch {}
    // Aussi en DB si champ dispo
    await supabase.from('profiles').update({current_activity: actText.trim()?`${actEmoji} ${actText.trim()}`:null} as any).eq('id', user.id)
    setActSaving(false)
    showToast(actText.trim() ? '✦ Activité visible 8h' : '✓ Activité supprimée', C.green)
  }
  const [editGender, setEditGender] = useState<GenderKey>(genderKey((user as any).gender))
  const [editJob, setEditJob] = useState<string>((user as any).job||'')
  const [editInterests, setEditInterests] = useState<string[]>((user as any).interests||[])
  const [savingInterests, setSavingInterests] = useState(false)
  const [editLanguages, setEditLanguages] = useState<string[]>((user as any).languages||[])
  const [savingLanguages, setSavingLanguages] = useState(false)
  const [editKids, setEditKids] = useState((user as any).has_kids||false)
  const [editKidsCount, setEditKidsCount] = useState((user as any).kids_ages||'')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editHeight, setEditHeight] = useState<string>((user as any).height_cm?.toString()||'')
  const [editZodiac, setEditZodiac] = useState<string>((user as any).zodiac||'')
  const [editRelStatus, setEditRelStatus] = useState<string>((user as any).relationship_status||'')
  const [editSmoking, setEditSmoking] = useState<string>((user as any).smoking||'')
  const [editDrinking, setEditDrinking] = useState<string>((user as any).drinking||'')
  const [editLookingFor, setEditLookingFor] = useState<string>((user as any).looking_for||'')
  const [editEducation, setEditEducation] = useState<string>((user as any).education||'')
  const [editKidsPref, setEditKidsPref] = useState<string>((user as any).kids_pref||'')
  const t = useT(lang)
  const EN = lang==='en'
  const [favorites, setFavorites] = useState<Profile[]>([])
  const [blocked, setBlocked] = useState<Profile[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const [cropSrc, setCropSrc] = useState<string|null>(null)  // photo en cours de recadrage
  // Multi-photos (jusqu'à 4 photos en plus de l'avatar principal = 5 au total)
  const storageKey = `clutch_photos_${user.id}`
  const [extraPhotos, setExtraPhotos] = useState<(string|null)[]>(()=>{
    if (typeof window==='undefined') return [null,null,null,null]
    try { const s=localStorage.getItem(storageKey); return s?JSON.parse(s):[null,null,null,null] } catch { return [null,null,null,null] }
  })
  const [swapFromIdx, setSwapFromIdx] = useState<number|null>(null) // tap-to-swap photos

  // SOS — contacts d'urgence (persistés en localStorage)
  const sosKey = `clutch_sos_${user.id}`
  const [sosContacts, setSosContacts] = useState<{name:string;phone:string}[]>(()=>{
    try {
      const raw = JSON.parse(localStorage.getItem(sosKey)||'{}')
      if (Array.isArray(raw.contacts) && raw.contacts.length) return raw.contacts.slice(0,3)
      if (raw.name || raw.phone) return [{name:raw.name||'',phone:raw.phone||''}]  // migration ancien format 1 contact
    } catch {}
    return [{name:'',phone:''}]
  })
  const [sosSaving, setSosSaving] = useState(false)
  const setSosField = (i:number, field:'name'|'phone', val:string) => setSosContacts(cs=>cs.map((c,j)=>j===i?{...c,[field]:val}:c))
  const addSosContact = () => setSosContacts(cs=>cs.length<3?[...cs,{name:'',phone:''}]:cs)
  const removeSosContact = (i:number) => setSosContacts(cs=>cs.length>1?cs.filter((_,j)=>j!==i):cs)
  const sosName = sosContacts[0]?.name || ''  // compat affichage MRow
  const saveSos = () => {
    setSosSaving(true)
    const clean = sosContacts.filter(c=>c.name.trim()||c.phone.trim())
    try { localStorage.setItem(sosKey, JSON.stringify({contacts:clean})) } catch {}
    setTimeout(()=>{setSosSaving(false); showToast('✓ Contacts SOS sauvegardés', C.green)}, 300)
  }
  const sosWatchRef = useRef<number|null>(null)
  const [sosLiveToken, setSosLiveToken] = useState<string|null>(null)
  const triggerSOS = async () => {
    const pseudo = (user as any).name || 'Quelqu\'un'
    const valid = sosContacts.filter(c=>c.phone.trim())
    // 1) Créer la session live (si la table sos_sessions existe — sinon fallback position statique)
    let token:string|null = null
    try {
      const { data } = await supabase.from('sos_sessions').insert({ user_id: user.id, user_name: pseudo, active: true }).select('token').single()
      token = (data as any)?.token || null
    } catch {}
    // 2) Suivi de position EN CONTINU
    if (token && navigator.geolocation) {
      if (sosWatchRef.current!=null) navigator.geolocation.clearWatch(sosWatchRef.current)
      sosWatchRef.current = navigator.geolocation.watchPosition(
        pos => { supabase.from('sos_sessions').update({ lat:pos.coords.latitude, lng:pos.coords.longitude, updated_at:new Date().toISOString() }).eq('token', token as string).then(()=>{}) },
        ()=>{}, { enableHighAccuracy:true, maximumAge:5000 }
      )
      setSosLiveToken(token)
    }
    // 3) Partager (1 clic → SMS/WhatsApp/Mail/Telegram). Si lien live dispo, on partage le lien.
    const link = token ? `${window.location.origin}/sos?t=${token}` : ''
    const share = (locTxt:string) => {
      const text = token
        ? `🆘 ALERTE Clutch — ${pseudo} a besoin d'aide. Suis ma position EN DIRECT : ${link}`
        : `🆘 ALERTE Clutch — ${pseudo} a besoin d'aide.${locTxt}`
      if ((navigator as any).share) (navigator as any).share({ title:'Alerte SOS Clutch', text }).catch(()=>{})
      else if (valid.length) window.location.href = `sms:/open?addresses=${encodeURIComponent(valid.map(c=>c.phone.trim()).join(','))}&body=${encodeURIComponent(text)}`
      else showToast('Ajoute un contact ou active le partage', C.red)
    }
    if (token) share('')
    else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos=>share(` Ma position : https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`), ()=>share(''), { timeout:6000, enableHighAccuracy:true })
    else share('')
  }
  const stopSOS = async () => {
    if (sosWatchRef.current!=null && navigator.geolocation) { navigator.geolocation.clearWatch(sosWatchRef.current); sosWatchRef.current=null }
    if (sosLiveToken) { try { await supabase.from('sos_sessions').update({ active:false }).eq('token', sosLiveToken) } catch {} ; setSosLiveToken(null) }
    showToast('Alerte SOS arrêtée', C.orange)
  }

  // Mode réception (pour les femmes) — persisté localStorage
  const recepKey = `clutch_recep_${user.id}`
  const [recepMode, setRecepMode] = useState<'open'|'selective'|'pause'>(()=>{
    try{return (localStorage.getItem(recepKey) as any)||'open'}catch{return 'open'}
  })
  const saveRecepMode = (m:'open'|'selective'|'pause') => {
    setRecepMode(m)
    try{localStorage.setItem(recepKey, m)}catch{}
    showToast(m==='open'?'🟢 Mode Ouverte':m==='selective'?'🟡 Mode Sélective':'🔴 Mode Pause', C.whiteMid)
  }

  // C/D4 — plafond de clutchs REÇUS simultanés (file d'attente, anti-saturation). Défaut = config (5).
  // Persisté en DB (col. profiles.max_received_clutchs, appliquée par le gardien create_clutch) + localStorage de secours.
  const capKey = `clutch_maxrecv_${user.id}`
  const [maxRecv, setMaxRecv] = useState<number>(()=>{
    const fromDb = (user as any).max_received_clutchs
    if (Number.isFinite(fromDb) && fromDb>0) return fromDb
    try { const v=parseInt(localStorage.getItem(capKey)||''); if(Number.isFinite(v)&&v>0) return v } catch {}
    return CLUTCH_CONFIG.maxReceivedClutchs
  })
  const saveMaxRecv = async (n:number) => {
    const v=Math.max(1,Math.min(20,n)); setMaxRecv(v)
    try{ localStorage.setItem(capKey,String(v)) }catch{}
    try{ await supabase.from('profiles').update({ max_received_clutchs:v }).eq('id',user.id) }catch{}
    showToast(lang==='fr'?`📥 File d'attente : ${v} max`:`📥 Inbox cap: ${v} max`, C.whiteMid)
  }

  // ── NOTIFICATIONS — préférences (demande David). Volume + catégories importantes.
  // ⚠️ La livraison push (app fermée) dépend de OneSignal natif + déclencheurs serveur — ces prefs pilotent
  // ce qu'on ENVOIE quand c'est branché. Les « sécurité » sont forcées ON (RDV/arrivée = vital).
  const notifKey = `clutch_notif_${user.id}`
  const NOTIF_DEFAULT = { level:'important', clutch:true, verrou:true, lapin:true, rdv:true, arrived:true, events:true, messages:true }
  const [notifPrefs, setNotifPrefs] = useState<any>(()=>{ try{ return {...NOTIF_DEFAULT, ...JSON.parse(localStorage.getItem(notifKey)||'{}')} }catch{ return NOTIF_DEFAULT } })
  const saveNotif = (patch:any) => { setNotifPrefs((p:any)=>{ const n={...p,...patch}; try{localStorage.setItem(notifKey,JSON.stringify(n))}catch{}; return n }); if(typeof navigator!=='undefined'&&(navigator as any).vibrate)(navigator as any).vibrate(6) }

  // ── FILTRES ÉPHÉMÈRES « Ce que je cherche en ce moment » ────────────────
  // Principe produit (mémoire project_ux_rules) : ces envies s'EFFACENT toutes seules.
  // On ne reste jamais coincé dans un filtre. Modes = reset 18h ; mode du moment = reset à minuit.
  const MODES = [
    {k:'romance', e:'💕', l:'Romance'},
    {k:'amitie',  e:'🤝', l:'Amitié'},
    {k:'pro',     e:'💼', l:'Pro'},
    {k:'parents', e:'👶', l:'Famille'},
    {k:'entraide',e:'🤲', l:'Entraide'},
  ]
  // Moods — liste riche, chacun rattaché à un moment de journée (p). Le « feu vert » = ça colle à l'instant
  // présent (honnête : basé sur l'heure, pas une fausse dispo). Le wiring vers les vraies dispos = V2 (algo).
  const PERIODS = [
    {k:'matin', e:'🌅', l:'Ce matin'},
    {k:'aprem', e:'☀️', l:'Cet après-midi'},
    {k:'soir',  e:'🌆', l:'Ce soir'},
    {k:'nuit',  e:'🌙', l:'Cette nuit'},
  ]
  const periodFromHour = (h:number) => h<6?'nuit':h<12?'matin':h<18?'aprem':h<23?'soir':'nuit'
  const MOMENTS = [
    // Matin
    {k:'cafe',     e:'☕', l:'Un café tranquille',       p:'matin'},
    {k:'petitdej', e:'🥐', l:'Un petit-déj',             p:'matin'},
    {k:'sport',    e:'🏃', l:'Sport / footing',          p:'matin'},
    {k:'yoga',     e:'🧘', l:'Yoga · méditation',        p:'matin'},
    {k:'chien',    e:'🐕', l:'Balade avec mon chien',    p:'matin'},
    {k:'lecture',  e:'📚', l:'Un coin lecture',          p:'matin'},
    // Après-midi
    {k:'balade',   e:'🥾', l:'Une balade · rando',       p:'aprem'},
    {k:'terrasse', e:'🍹', l:'Une terrasse au soleil',   p:'aprem'},
    {k:'expo',     e:'🎨', l:'Expo · musée',             p:'aprem'},
    {k:'velo',     e:'🚲', l:'Un tour à vélo',           p:'aprem'},
    {k:'jeux',     e:'🎲', l:'Jeux · café-jeux',         p:'aprem'},
    {k:'shopping', e:'🛍️', l:'Shopping tranquille',      p:'aprem'},
    // Soir
    {k:'apero',    e:'🍷', l:'Un apéro',                 p:'soir'},
    {k:'diner',    e:'🍽️', l:'Un dîner',                 p:'soir'},
    {k:'cine',     e:'🎬', l:'Ciné',                     p:'soir'},
    {k:'concert',  e:'🎵', l:'Un concert · live',        p:'soir'},
    {k:'sortir',   e:'🎉', l:'Sortir ce soir',           p:'soir'},
    // Nuit
    {k:'club',     e:'🌃', l:'Boîte · danser',           p:'nuit'},
    {k:'bar',      e:'🍸', l:'Un bar de nuit',           p:'nuit'},
    {k:'after',    e:'🎧', l:'Un after · DJ set',        p:'nuit'},
    {k:'nightwalk',e:'🌙', l:'Marcher dans la nuit',     p:'nuit'},
    // À tout moment
    {k:'discuter', e:'💬', l:'Juste discuter',           p:'any'},
    {k:'calme',    e:'🍃', l:'Quelque chose de calme',   p:'any'},
    {k:'surprise', e:'🎲', l:'Surprends-moi',            p:'any'},
  ]
  const momentKey = `clutch_moment_${user.id}`
  const nextMidnight = () => { const d=new Date(); d.setHours(24,0,0,0); return d.getTime() }
  const readMoment = () => { try { return JSON.parse(localStorage.getItem(momentKey)||'{}') } catch { return {} as any } }
  // Modes éphémères (reset 18h)
  const [ephModes, setEphModes] = useState<string[]>(()=>{
    const r = readMoment(); if (r.modes_until && r.modes_until > Date.now()) return r.modes||[]; return []
  })
  const [modesUntil, setModesUntil] = useState<number>(()=>{ const r=readMoment(); return (r.modes_until && r.modes_until>Date.now())?r.modes_until:0 })
  // Mood (reset minuit)
  const [moment, setMoment] = useState<string|null>(()=>{
    const r = readMoment(); if (r.moment_until && r.moment_until > Date.now()) return r.moment||null; return null
  })
  const [momentPeriod, setMomentPeriod] = useState<string>(()=>periodFromHour(new Date().getHours()))
  const persistMoment = (next:{modes?:string[], modes_until?:number, moment?:string|null, moment_until?:number}) => {
    const cur = readMoment()
    const merged = { ...cur, ...next }
    try { localStorage.setItem(momentKey, JSON.stringify(merged)) } catch {}
  }
  const toggleMode = (k:string) => {
    setEphModes(prev => {
      const has = prev.includes(k)
      const nextArr = has ? prev.filter(x=>x!==k) : [...prev, k]
      const until = nextArr.length ? Date.now()+18*3600*1000 : 0
      setModesUntil(until)
      persistMoment({ modes: nextArr, modes_until: until })
      return nextArr
    })
  }
  const pickMoment = (k:string) => {
    setMoment(prev => {
      const next = prev===k ? null : k
      persistMoment({ moment: next, moment_until: next ? nextMidnight() : 0 })
      return next
    })
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(8)
  }
  const modesResetLabel = () => {
    if (!modesUntil) return null
    const h = Math.max(0, Math.round((modesUntil-Date.now())/3600000))
    return h>=1 ? `↺ reset dans ${h}h` : '↺ reset bientôt'
  }

  // ── MON CLUTCH · l'algo (préférence locale, ludique — wiring DB en V2) ──
  const algoKey = `clutch_algo_${user.id}`
  const readAlgo = () => { try { return JSON.parse(localStorage.getItem(algoKey)||'{}') } catch { return {} as any } }
  const [algoStyle, setAlgoStyle] = useState<string>(()=> readAlgo().style || 'proximite')
  const [algoTrained, setAlgoTrained] = useState<number>(()=> readAlgo().trained || 0)
  const setAlgo = (style:string) => {
    setAlgoStyle(style)
    try { localStorage.setItem(algoKey, JSON.stringify({ ...readAlgo(), style })) } catch {}
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(8)
  }
  // Questions binaires « Entraîne ton Clutch »
  const TRAIN_Q = [
    {q:'Tu préférerais voir…', a:{e:'📍',l:'quelqu\'un tout près'}, b:{e:'🧩',l:'très compatible'}},
    {q:'Ce soir, plutôt…', a:{e:'🎲',l:'une surprise'}, b:{e:'🧩',l:'sur mesure'}},
    {q:'Un bon Clutch, c\'est…', a:{e:'⚡',l:'spontané, vite'}, b:{e:'🌱',l:'qui prend son temps'}},
    {q:'Tu accordes plus d\'importance à…', a:{e:'📍',l:'la distance'}, b:{e:'🏆',l:'la fiabilité'}},
  ]
  const [trainIdx, setTrainIdx] = useState(0)
  const answerTrain = () => {
    const n = algoTrained+1
    setAlgoTrained(n)
    try { localStorage.setItem(algoKey, JSON.stringify({ ...readAlgo(), trained:n })) } catch {}
    setTrainIdx(i => (i+1) % TRAIN_Q.length)
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(10)
  }
  // Easter egg al-jabr (chasse au trésor) — révélation au tap de la tagline
  const [secretOpen, setSecretOpen] = useState(false)

  // ── « Ce que je cherche » — préférences persistantes (qui tu es) ──
  const seekKey = `clutch_seek_${user.id}`
  const readSeek = () => { try { return JSON.parse(localStorage.getItem(seekKey)||'{}') } catch { return {} as any } }
  const [seekDist, setSeekDist] = useState<string>(()=> readSeek().dist || 'ville')
  const [seekGender, setSeekGender] = useState<string>(()=> readSeek().gender || 'all')
  const [seekAge, setSeekAge] = useState<string>(()=> readSeek().age || 'all')
  const saveSeek = (patch:any, ...setters:[(v:any)=>void, any][]) => {
    setters.forEach(([fn,v])=>fn(v))
    try { localStorage.setItem(seekKey, JSON.stringify({ ...readSeek(), ...patch })) } catch {}
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(6)
  }
  const [advOpen, setAdvOpen] = useState<string|null>(null)
  const toggleAdv = (k:string) => setAdvOpen(o=>o===k?null:k)

  // ── NIVEAU 3 « matrice dans la matrice » ────────────────────────────────
  // Fil rouge : « le profil est l'équation, le rendez-vous la solution » — tout pousse DEHORS.
  // Tempérament de rencontre (mini-quiz ludique, skippable, vit sous « Mon Clutch · l'algo »)
  const TEMP_ARCH: Record<string,{e:string,l:string,d:string}> = {
    explorateur:{e:'🧭',l:'Explorateur·rice',d:'tu cherches la nouveauté, les gens qui sortent du cadre'},
    pose:       {e:'🌿',l:'Posé·e',        d:'tu vises le calme, la profondeur, le vrai'},
    spontane:   {e:'⚡',l:'Spontané·e',     d:'l\'instant te parle — décider vite, y aller'},
    solaire:    {e:'☀️',l:'Solaire',        d:'tu apportes la chaleur, le lien facile'},
  }
  const TEMP_Q = [
    {q:'Un soir libre s\'ouvre devant toi…', a:{k:'spontane',e:'⚡',l:'tu sors là, maintenant'}, b:{k:'pose',e:'🌿',l:'tu choisis un truc tranquille'}},
    {q:'Tu accroches plus vite avec…',        a:{k:'explorateur',e:'🧭',l:'quelqu\'un qui te surprend'}, b:{k:'solaire',e:'☀️',l:'quelqu\'un de chaleureux'}},
    {q:'Le lieu idéal d\'un premier Clutch ?', a:{k:'explorateur',e:'🧭',l:'un endroit inconnu'}, b:{k:'pose',e:'🌿',l:'ton café de confiance'}},
    {q:'On te décrit souvent comme…',          a:{k:'solaire',e:'☀️',l:'le soleil de la soirée'}, b:{k:'spontane',e:'⚡',l:'imprévisible, vivant·e'}},
    {q:'Ce qui te ferait dire oui en 2 sec ?', a:{k:'spontane',e:'⚡',l:'« on y va maintenant »'}, b:{k:'explorateur',e:'🧭',l:'« j\'ai un truc à te montrer »'}},
  ]
  const tempKey = `clutch_temperament_${user.id}`
  const [temperament, setTemperament] = useState<string|null>(()=>{ try{return JSON.parse(localStorage.getItem(tempKey)||'{}').result||null}catch{return null} })
  const [tempStep, setTempStep] = useState(0)
  const [tempScore, setTempScore] = useState<Record<string,number>>({})
  const answerTemp = (k:string) => {
    const ns = {...tempScore, [k]:(tempScore[k]||0)+1}
    if (tempStep+1 >= TEMP_Q.length) {
      const res = Object.entries(ns).sort((a,b)=>b[1]-a[1])[0][0]
      setTemperament(res); try{localStorage.setItem(tempKey,JSON.stringify({result:res}))}catch{}
      setTempStep(0); setTempScore({})
      showToast('✦ Tempérament : '+TEMP_ARCH[res].l, C.green)
    } else { setTempScore(ns); setTempStep(s=>s+1) }
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(10)
  }
  const retakeTemp = () => { setTemperament(null); setTempStep(0); setTempScore({}); try{localStorage.removeItem(tempKey)}catch{} }
  // Accueil contextuel selon le moment de journée (chaleur, pas manipulation)
  const hourNow = (typeof Date!=='undefined') ? new Date().getHours() : 12
  const momentGreeting = hourNow>=18||hourNow<4 ? 'Ce soir, qu\'est-ce qui te tente ?' : hourNow>=12 ? 'Cet aprèm, tu cherches quoi ?' : 'Ce matin, ouvert·e à quoi ?'

  // ── DIDACTIQUE & CONFIANCE (cf mémoire feedback-didactique-confiance) ──
  // Guide « Comprendre Clutch » + bannière de bienvenue dismissible pour les nouveaux.
  const guideKey = `clutch_guide_seen_${user.id}`
  const [guideSeen, setGuideSeen] = useState<boolean>(()=>{ try{return localStorage.getItem(guideKey)==='1'}catch{return false} })
  const markGuideSeen = () => { setGuideSeen(true); try{localStorage.setItem(guideKey,'1')}catch{} }
  // Mode Pause bien-être (anti-addiction, bienveillant — effet RÉEL : retire de la carte)
  const pauseKey = `clutch_paused_${user.id}`
  const [paused, setPaused] = useState<boolean>(()=>{ try{return localStorage.getItem(pauseKey)==='1'}catch{return false} })
  const togglePause = async () => {
    const next = !paused
    setPaused(next); try{localStorage.setItem(pauseKey, next?'1':'0')}catch{}
    if (next) { // effet réel : on n'apparaît plus comme disponible
      await supabase.from('profiles').update({ is_available:false, available_until:null }).eq('id', user.id)
      onUserUpdate({ ...user, is_available:false, available_until:null } as any)
    }
    showToast(next ? '🌙 Clutch en pause — prends soin de toi' : '☀️ Content de te revoir', C.green)
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(8)
  }

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
  // Échange 2 photos. idx -1 = la PRINCIPALE (photo_url). Permet de promouvoir une photo en principale.
  const swapPhotos = async (a:number, b:number) => {
    if (a===b) { setSwapFromIdx(null); return }
    const pa = a===-1 ? (user.photo_url||null) : (extraPhotos[a]||null)
    const pb = b===-1 ? (user.photo_url||null) : (extraPhotos[b]||null)
    const upd = [...extraPhotos]
    let newMain = user.photo_url || null
    if (a===-1) newMain = pb; else upd[a] = pb
    if (b===-1) newMain = pa; else upd[b] = pa
    setExtraPhotos(upd); try { localStorage.setItem(storageKey, JSON.stringify(upd)) } catch {}
    if ((newMain||null) !== (user.photo_url||null)) {
      await supabase.from('profiles').update({ photo_url: newMain }).eq('id', user.id)
      onUserUpdate({ ...user, photo_url: newMain } as Profile)
    }
    setSwapFromIdx(null)
    showToast('✓ Photos réordonnées', C.green)
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
      const {data, error} = await supabase.from('profiles').update(payload).eq('id',user.id).select().maybeSingle()
      setSavingEdit(false)
      if (error || !data) {
        // Erreur (colonne inconnue) OU 0 ligne (profil absent/RLS) → retry minimal + upsert fallback (ne jamais perdre la sauvegarde en silence)
        if (error) console.warn('[Profile] save error:', error.message)
        const {data:d2} = await supabase.from('profiles').update({
          name:payload.name, bio:payload.bio, gender:genderDbVal
        }).eq('id',user.id).select().maybeSingle()
        if (!d2) { await supabase.from('profiles').upsert({ id:user.id, name:payload.name, bio:payload.bio, gender:genderDbVal }) }
        const merged = {...user, ...(d2||{}), gender: genderDbVal, languages: editLanguages, name: payload.name, bio: payload.bio}
        onUserUpdate(merged as Profile); setEditing(false); showToast('✓ Profile updated',C.green)
      } else {
        // Forcer le genre dans l'objet retourné si absent
        const merged = {...data, gender: (data as any).gender ?? genderDbVal, languages: editLanguages}
        onUserUpdate(merged as Profile); setEditing(false); showToast('✓ Profile updated',C.green)
      }
    } catch {
      setSavingEdit(false)
      showToast('Unexpected error',C.red)
    }
  }

  const saveProfileField = async (field: string, value: any) => {
    await supabase.from('profiles').update({[field]: value}).eq('id', user.id)
    onUserUpdate({...user, [field]: value} as any)
  }

  // Lit le fichier choisi → ouvre le cropper (au lieu d'uploader direct)
  // Upload DIRECT et fiable (fichier unique horodaté → pas de cache CDN, pas d'écrasement d'une vieille image)
  const pickPhoto = async (file: File) => {
    showToast('Upload de la photo…', C.salmon)
    const ext = ((file.name.split('.').pop()||'jpg').toLowerCase().match(/[a-z0-9]+/)?.[0]) || 'jpg'
    const path = `${user.id}/avatar_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert:true, contentType: file.type||undefined })
    if (error) { showToast('Erreur upload : '+error.message, C.red); return }
    const { data:{ publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    const { data, error: upErr } = await supabase.from('profiles').update({ photo_url: publicUrl }).eq('id', user.id).select().maybeSingle()
    if (!upErr && (!data)) {
      // 0 ligne modifiée (ligne profiles absente/RLS) → upsert fallback pour ne jamais perdre la photo en silence
      await supabase.from('profiles').upsert({ id: user.id, photo_url: publicUrl })
    }
    // On met TOUJOURS à jour l'état local (la photo est uploadée, l'URL est valide)
    onUserUpdate({ ...user, photo_url: publicUrl } as Profile)
    showToast('✓ Photo mise à jour ✓', C.green)
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

  // ── helpers locaux ──────────────────────────────────────────
  const SH = (label: string) => (
    <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase',padding:'16px 2px 6px'}}>{label}</div>
  )
  const MCard = ({children}:{children:React.ReactNode}) => (
    <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:4}}>{children}</div>
  )
  const MRow = ({icon,label,sub,onTap,danger,noArrow}:{icon:string,label:string,sub?:string,onTap:()=>void,danger?:boolean,noArrow?:boolean}) => (
    <div onClick={onTap} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderBottom:`1px solid ${C.border}`,cursor:'pointer'}}>
      <span style={{width:24,textAlign:'center',fontSize:18,flexShrink:0}}>{icon}</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:danger?'#f87171':C.white,lineHeight:1.2}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:C.whiteMid,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{sub}</div>}
      </div>
      {!noArrow&&<span style={{color:C.whiteMid,fontSize:18,flexShrink:0}}>›</span>}
    </div>
  )
  // Chip picker inline
  const Chips = ({opts,val,onPick}:{opts:{k:string,l:string}[],val:string,onPick:(k:string)=>void}) => (
    <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'4px 12px 14px'}}>
      {opts.map(({k,l})=>(
        <button key={k} onClick={()=>onPick(k)}
          style={{padding:'7px 16px',borderRadius:20,fontFamily:'inherit',fontSize:12,fontWeight:val===k?700:400,cursor:'pointer',
            border:`1.5px solid ${val===k?C.orange:C.border}`,
            background:val===k?`${C.orange}22`:C.bgCard,
            color:val===k?C.orange:C.whiteMid}}>
          {l}
        </button>
      ))}
    </div>
  )
  // Sauvegarde champ + ferme
  const pickAndSave = async (field:string, k:string, setter:(v:string)=>void) => {
    setter(k); setEditField(null)
    await saveProfileField(field, k)
    showToast('✓ Sauvegardé', C.green)
  }

  // ── Contenu des sous-pages ────────────────────────────────────
  const PageEditProfil = () => {
    const ALL_INTERESTS = ['☕ Café','🍷 Vins','🥾 Randonnée','🧘 Yoga','🎬 Cinéma','🍳 Cuisine','🎵 Musique','✈️ Voyage','🏃 Running','🎨 Art','💻 Tech','⛽ Sport','📚 Lecture','💃 Danse','🎉 Festivals','🍕 Restos','🎸 Concerts','🌿 Nature']
    const ALL_LANGS = ['Français','English','Deutsch','Italiano','Español','Português','العربية','日本語','中文','Русский']
    const ZODIACS = ['♈ Bélier','♉ Taureau','♊ Gémeaux','♋ Cancer','♌ Lion','♍ Vierge','♎ Balance','♏ Scorpion','♐ Sagittaire','♑ Capricorne','♒ Verseau','♓ Poissons']
    const EDUC_OPTS = [{k:'lycee',l:'🎒 Lycée'},{k:'bachelor',l:'🎓 Bachelor'},{k:'master',l:'📜 Master'},{k:'doctorat',l:'🔬 Doctorat'},{k:'autre',l:'✦ Autre'}]
    const REL_OPTS = [{k:'single',l:'💫 Célibataire'},{k:'open',l:'🔓 Couple ouvert'},{k:'divorced',l:'↩ Divorcé·e'},{k:'widowed',l:'🕊 Veuf·ve'}]
    const KIDS_OPTS = [{k:'none',l:"👶 Pas d'enfants"},{k:'have',l:"👨‍👧 J'en ai"},{k:'want',l:'✨ J\'en veux'},{k:'no_want',l:'🚫 Non pour moi'}]
    const SMOKE_OPTS = [{k:'never',l:'🚭 Non-fumeur'},{k:'sometimes',l:'💨 Parfois'},{k:'yes',l:'🚬 Fumeur'}]
    const DRINK_OPTS = [{k:'never',l:'🧃 Jamais'},{k:'sometimes',l:'🍷 Parfois'},{k:'often',l:'🍺 Régulièrement'}]

    return (
      <div>
        {/* Photos */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:10,fontWeight:700,color:C.whiteMid,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:8}}>📷 Tes photos (5 max)</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:5}}>
            {/* Slot PRINCIPALE (idx -1) */}
            {(()=>{ const isSel = swapFromIdx===-1; const isSwap = swapFromIdx!==null; return (
            <div style={{position:'relative',aspectRatio:'3/4',borderRadius:10,overflow:'hidden',border:`1.5px solid ${isSel?C.orange:user.photo_url?C.orange+'66':C.border}`,cursor:'pointer',background:C.bgCard,transform:isSel?'scale(0.96)':'scale(1)',transition:'transform .15s'}}
              onClick={()=>{ if(isSwap){ swapPhotos(swapFromIdx as number,-1); return } user.photo_url ? setSwapFromIdx(-1) : fileRef.current?.click() }}>
              {user.photo_url
                ? <img src={user.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
                : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,color:C.whiteMid,opacity:.4}}>+</div>}
              <div style={{position:'absolute',bottom:4,left:5,fontSize:8,fontWeight:800,color:'rgba(255,255,255,.9)',background:'rgba(235,107,175,.85)',borderRadius:5,padding:'2px 5px'}}>★ Principale</div>
            </div>
            )})()}
            {/* 4 slots EXTRAS (idx 0..3) */}
            {[0,1,2,3].map(i=>{
              const photo = extraPhotos[i] ?? null
              const isSelected = swapFromIdx === i
              const isSwapping = swapFromIdx !== null
              return (
                <div key={i} style={{position:'relative',aspectRatio:'3/4',borderRadius:10,overflow:'hidden',border:`1.5px solid ${isSelected?C.orange:photo?C.borderStrong:C.border}`,cursor:'pointer',background:C.bgCard,transform:isSelected?'scale(0.96)':'scale(1)',transition:'transform .15s'}}
                  onClick={()=>{
                    if (isSwapping) { swapPhotos(swapFromIdx as number, i); return }
                    photo ? setSwapFromIdx(i) : extraRefs[i]?.current?.click()
                  }}>
                  {photo
                    ? <><img src={photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
                        {!isSelected&&<button onClick={e=>{e.stopPropagation();removeExtra(i)}} style={{position:'absolute',top:4,right:4,background:'rgba(0,0,0,.7)',border:'none',color:'#fff',width:18,height:18,borderRadius:'50%',fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>}
                      </>
                    : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:C.whiteMid,opacity:.3}}>+</div>}
                  <div style={{position:'absolute',bottom:4,left:5,fontSize:9,fontWeight:700,color:'rgba(255,255,255,.7)',background:'rgba(0,0,0,.4)',borderRadius:4,padding:'1px 5px'}}>{i+2}</div>
                  <input ref={extraRefs[i]} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0])uploadExtra(e.target.files[0],i)}}/>
                </div>
              )
            })}
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0]){pickPhoto(e.target.files[0]);e.target.value=''}}}/>
          {swapFromIdx!==null
            ? <div style={{marginTop:6,display:'flex',gap:6,alignItems:'center'}}>
                <span style={{flex:1,fontSize:11,color:C.gold,fontWeight:700}}>👆 Tape une autre photo pour échanger (ou la mettre en principale)</span>
                <button onClick={()=>setSwapFromIdx(null)} style={{padding:'6px 10px',background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,borderRadius:8,color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✕</button>
              </div>
            : <div style={{marginTop:6,fontSize:10,color:C.whiteMid,opacity:.7}}>Tape une photo pour la sélectionner, puis une autre pour les échanger. La 1ʳᵉ = principale.</div>}
        </div>

        {/* À propos */}
        {SH('À propos')}
        <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:8}}>
          {/* Bio */}
          <FieldRow icon="📝" label="Bio" value={user.bio||''} placeholder="Ajoute une bio…"
            isEditing={editField==='bio'} onTap={()=>setEditField(editField==='bio'?null:'bio')}>
            <div style={{padding:'4px 12px 12px'}}>
              <textarea value={editBio} onChange={e=>setEditBio(e.target.value.slice(0,160))} rows={3} autoFocus
                style={{width:'100%',background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 10px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',boxSizing:'border-box'}}/>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:6}}>
                <span style={{fontSize:10,color:C.whiteMid}}>{editBio.length}/160</span>
                <button onClick={async()=>{await saveProfileField('bio',editBio.trim()||null);setEditField(null);showToast('✓ Bio sauvegardée',C.green)}}
                  style={{padding:'6px 18px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>Save</button>
              </div>
            </div>
          </FieldRow>
          {/* Prénom */}
          <FieldRow icon="✏️" label="Prénom" value={user.name||''} placeholder="Ton prénom"
            isEditing={editField==='name'} onTap={()=>setEditField(editField==='name'?null:'name')}>
            <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
              <input value={editName} onChange={e=>setEditName(e.target.value.slice(0,30))} autoFocus maxLength={30}
                style={{flex:1,background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 12px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit'}}/>
              <button onClick={async()=>{const n=editName.trim();if(!n)return;await saveProfileField('name',n);onUserUpdate({...user,name:n} as any);setEditField(null);showToast('✓ Prénom mis à jour',C.green)}}
                style={{padding:'8px 18px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>OK</button>
            </div>
          </FieldRow>
          {/* Âge — verrouillé après saisie */}
          <div style={{borderBottom:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',cursor:(user as any).age?'default':'pointer'}}
              onClick={()=>{if(!(user as any).age)setEditField(editField==='age'?null:'age')}}>
              <span style={{width:22,textAlign:'center',fontSize:16}}>🎂</span>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:C.whiteMid,fontWeight:600,marginBottom:1}}>Âge</div>
                <div style={{fontSize:13,fontWeight:600,color:(user as any).age?C.white:C.orange}}>
                  {(user as any).age?`${(user as any).age} ans`:'Entre ton âge →'}
                </div>
              </div>
              <span style={{fontSize:10,color:C.whiteMid,background:C.whiteFaint,padding:'2px 8px',borderRadius:10}}>
                {(user as any).age?'🔒 Verrouillé':'Requis'}
              </span>
            </div>
            {editField==='age'&&!(user as any).age&&(
              <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
                <input type="number" min={18} max={99} placeholder="Ex: 28" autoFocus
                  style={{flex:1,background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 12px',fontSize:16,color:C.white,outline:'none',fontFamily:'inherit'}}
                  onChange={e=>setEditJob(e.target.value)}/>
                <button onClick={async()=>{
                  const age=parseInt(editJob);if(isNaN(age)||age<18||age>99){showToast('Âge invalide (18-99)',C.red);return}
                  await supabase.from('profiles').update({age}).eq('id',user.id);onUserUpdate({...user,age} as any);setEditField(null);setEditJob('')
                  showToast('✓ Âge enregistré — verrouillé',C.green)
                }} style={{padding:'8px 14px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>OK</button>
              </div>
            )}
          </div>
          {/* Métier */}
          <FieldRow icon="💼" label="Métier" value={(user as any).job||''} placeholder="Ton métier ou tes études"
            isEditing={editField==='job'} onTap={()=>setEditField(editField==='job'?null:'job')}>
            <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
              <input value={editJob} onChange={e=>setEditJob(e.target.value.slice(0,50))} maxLength={50} autoFocus placeholder="Designer, Étudiant…"
                style={{flex:1,background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 12px',fontSize:13,color:C.white,outline:'none',fontFamily:'inherit'}}/>
              <button onClick={async()=>{await saveProfileField('job',editJob.trim()||null);setEditField(null);showToast('✓ Métier mis à jour',C.green)}}
                style={{padding:'8px 18px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>OK</button>
            </div>
          </FieldRow>
          {/* Niveau d'études */}
          <FieldRow icon="🎓" label="Niveau d'études" value={EDUC_OPTS.find(o=>o.k===editEducation)?.l||''} placeholder="Sélectionne…"
            isEditing={editField==='education'} onTap={()=>setEditField(editField==='education'?null:'education')}>
            <Chips opts={EDUC_OPTS} val={editEducation} onPick={k=>pickAndSave('education',k,setEditEducation)}/>
          </FieldRow>
        </div>

        {/* Identité */}
        {SH('Identité')}
        <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:8}}>
          {/* Genre */}
          <FieldRow icon="" label="Genre" gk={editGender} locked={genderLocked}
            value={editGender==='F'?'Femme':editGender==='M'?'Homme':'Non renseigné'}
            isEditing={editField==='genre'&&!genderLocked} onTap={()=>!genderLocked&&setEditField(editField==='genre'?null:'genre')}>
            <div style={{padding:'4px 12px 12px',display:'flex',gap:8}}>
              {(['F','M','X'] as GenderKey[]).map(g=>(
                <button key={g} onClick={async()=>{setEditGender(g);await saveProfileField('gender',g==='F'?'woman':g==='M'?'man':'other');setEditField(null);showToast('✓ Genre sauvegardé',C.green)}}
                  style={{flex:1,padding:'8px 4px',borderRadius:10,border:`1.5px solid ${editGender===g?GC[g]:C.border}`,background:editGender===g?`${GC[g]}22`:'transparent',color:editGender===g?GC[g]:C.whiteMid,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:5}}>
                  <GenderSvg gk={g} size={14}/>{g==='F'?'Femme':g==='M'?'Homme':'Autre'}
                </button>
              ))}
            </div>
          </FieldRow>
          {/* Taille */}
          <FieldRow icon="📏" label="Taille" value={editHeight?`${editHeight} cm`:''} placeholder="Ta taille en cm"
            isEditing={editField==='height'} onTap={()=>setEditField(editField==='height'?null:'height')}>
            <div style={{padding:'4px 12px 12px',display:'flex',gap:8,alignItems:'center'}}>
              <input type="number" min={140} max={220} value={editHeight} onChange={e=>setEditHeight(e.target.value)} autoFocus placeholder="Ex: 175"
                style={{flex:1,background:C.whiteFaint,border:`1px solid ${C.borderStrong}`,borderRadius:10,padding:'8px 12px',fontSize:16,color:C.white,outline:'none',fontFamily:'inherit'}}/>
              <span style={{color:C.whiteMid,fontSize:13}}>cm</span>
              <button onClick={async()=>{const h=parseInt(editHeight);if(isNaN(h)||h<140||h>220){showToast('Taille invalide (140-220)',C.red);return}await saveProfileField('height_cm',h);setEditField(null);showToast('✓ Taille enregistrée',C.green)}}
                style={{padding:'8px 14px',background:C.green,border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>OK</button>
            </div>
          </FieldRow>
          {/* Signe astrologique */}
          <FieldRow icon="✨" label="Signe astro" value={editZodiac||''} placeholder="Ton signe"
            isEditing={editField==='zodiac'} onTap={()=>setEditField(editField==='zodiac'?null:'zodiac')}>
            <div style={{display:'flex',flexWrap:'wrap',gap:7,padding:'4px 12px 14px'}}>
              {ZODIACS.map(z=>(
                <button key={z} onClick={()=>pickAndSave('zodiac',z,setEditZodiac)}
                  style={{padding:'6px 12px',borderRadius:20,fontFamily:'inherit',fontSize:12,fontWeight:editZodiac===z?700:400,cursor:'pointer',border:`1.5px solid ${editZodiac===z?C.orange:C.border}`,background:editZodiac===z?`${C.orange}22`:C.bgCard,color:editZodiac===z?C.orange:C.whiteMid}}>
                  {z}
                </button>
              ))}
            </div>
          </FieldRow>
        </div>

        {/* Style de vie */}
        {SH('Style de vie')}
        <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:8}}>
          <FieldRow icon="💫" label="Statut" value={REL_OPTS.find(o=>o.k===editRelStatus)?.l||''} placeholder="Sélectionne…"
            isEditing={editField==='relstatus'} onTap={()=>setEditField(editField==='relstatus'?null:'relstatus')}>
            <Chips opts={REL_OPTS} val={editRelStatus} onPick={k=>pickAndSave('relationship_status',k,setEditRelStatus)}/>
          </FieldRow>
          <FieldRow icon="👶" label="Enfants" value={KIDS_OPTS.find(o=>o.k===editKidsPref)?.l||''} placeholder="Sélectionne…"
            isEditing={editField==='kids'} onTap={()=>setEditField(editField==='kids'?null:'kids')}>
            <Chips opts={KIDS_OPTS} val={editKidsPref} onPick={k=>pickAndSave('kids_pref',k,setEditKidsPref)}/>
          </FieldRow>
          <FieldRow icon="🚬" label="Tabac" value={SMOKE_OPTS.find(o=>o.k===editSmoking)?.l||''} placeholder="Sélectionne…"
            isEditing={editField==='smoking'} onTap={()=>setEditField(editField==='smoking'?null:'smoking')}>
            <Chips opts={SMOKE_OPTS} val={editSmoking} onPick={k=>pickAndSave('smoking',k,setEditSmoking)}/>
          </FieldRow>
          <FieldRow icon="🍷" label="Alcool" value={DRINK_OPTS.find(o=>o.k===editDrinking)?.l||''} placeholder="Sélectionne…"
            isEditing={editField==='drinking'} onTap={()=>setEditField(editField==='drinking'?null:'drinking')}>
            <Chips opts={DRINK_OPTS} val={editDrinking} onPick={k=>pickAndSave('drinking',k,setEditDrinking)}/>
          </FieldRow>
        </div>

        {/* Passions */}
        {SH('Passions')}
        {(()=>{
          const saveInterests = async (list:string[]) => {
            setSavingInterests(true)
            await supabase.from('profiles').update({interests:list}).eq('id',user.id)
            onUserUpdate({...user,interests:list} as any); setSavingInterests(false)
          }
          return (
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:6}}>
                {editInterests.length>0&&<button onClick={()=>saveInterests(editInterests)} disabled={savingInterests}
                  style={{fontSize:11,fontWeight:800,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'3px 12px',cursor:'pointer',fontFamily:'inherit'}}>
                  {savingInterests?'…':'Save'}
                </button>}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {ALL_INTERESTS.map(interest=>{
                  const sel=editInterests.includes(interest)
                  return <button key={interest} onClick={()=>{
                    const next=sel?editInterests.filter(i=>i!==interest):editInterests.length>=8?(showToast('Max 8',C.orange),editInterests):[...editInterests,interest]
                    setEditInterests(next)
                  }} style={{padding:'7px 12px',borderRadius:20,border:`1.5px solid ${sel?C.salmon:C.border}`,background:sel?`${C.salmon}20`:'transparent',color:sel?C.salmon:C.whiteMid,fontSize:12,fontWeight:sel?700:400,cursor:'pointer',fontFamily:'inherit'}}>{interest}</button>
                })}
              </div>
              <div style={{fontSize:9,color:C.whiteMid,opacity:.5,marginTop:6,textAlign:'center'}}>{editInterests.length}/8 sélectionnés</div>
            </div>
          )
        })()}

        {/* Langues */}
        {SH('Langues')}
        {(()=>{
          const saveLangs = async (list:string[]) => {
            setSavingLanguages(true)
            await supabase.from('profiles').update({languages:list}).eq('id',user.id)
            onUserUpdate({...user,languages:list} as any); setSavingLanguages(false)
          }
          return (
            <div style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'flex-end',marginBottom:6}}>
                {editLanguages.length>0&&<button onClick={()=>saveLangs(editLanguages)} disabled={savingLanguages}
                  style={{fontSize:11,fontWeight:800,color:C.green,background:`${C.green}18`,border:`1px solid ${C.green}44`,borderRadius:20,padding:'3px 12px',cursor:'pointer',fontFamily:'inherit'}}>
                  {savingLanguages?'…':'Save'}
                </button>}
              </div>
              <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                {ALL_LANGS.map(l=>{
                  const sel=editLanguages.includes(l)
                  return <button key={l} onClick={()=>{const next=sel?editLanguages.filter(x=>x!==l):[...editLanguages,l];setEditLanguages(next)}}
                    style={{padding:'7px 12px',borderRadius:20,border:`1.5px solid ${sel?C.salmon:C.border}`,background:sel?C.salmonFaint:'transparent',color:sel?C.salmon:C.whiteMid,fontSize:12,fontWeight:sel?700:400,cursor:'pointer',fontFamily:'inherit'}}>{l}</button>
                })}
              </div>
            </div>
          )
        })()}
      </div>
    )
  }

  const PageSeeking = () => {
    const SEEK_OPTS = [{k:'romance',l:'❤️ Romantique'},{k:'friendship',l:'🤝 Amical'},{k:'pro',l:'💼 Pro / Réseau'},{k:'all',l:'✨ Tout à la fois'}]
    return (
      <div>
        {SH('Ce que je cherche')}
        <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:8}}>
          <FieldRow icon="🎯" label="Mode de rencontre" value={SEEK_OPTS.find(o=>o.k===editLookingFor)?.l||''} placeholder="Sélectionne…"
            isEditing={editField==='seeking'} onTap={()=>setEditField(editField==='seeking'?null:'seeking')}>
            <Chips opts={SEEK_OPTS} val={editLookingFor} onPick={k=>pickAndSave('looking_for',k,setEditLookingFor)}/>
          </FieldRow>
        </div>
        <div style={{background:C.bgCard,borderRadius:12,padding:'14px',border:`1px solid ${C.border}`,marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:C.white,marginBottom:4}}>✦ Tip Clutch</div>
          <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.6}}>
            Ton mode de rencontre est visible sur ton profil. Il aide les autres à comprendre tes intentions avant de t'envoyer un Clutch.
          </div>
        </div>
      </div>
    )
  }

  const PageFavorites = () => (
    <div>
      {favorites.length===0
        ? <div style={{textAlign:'center',padding:'40px 0',color:C.whiteMid,fontSize:14}}>❤️<br/>Pas encore de favoris</div>
        : <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
            {favorites.map((f,i)=>(
              <div key={f.id} style={{display:'flex',gap:10,alignItems:'center',padding:'12px 14px',borderTop:i>0?`1px solid ${C.border}`:'none'}}>
                <Av src={f.photo_url} name={f.name||'?'} size={40}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700}}>{f.name}</div>
                  {f.bio&&<div style={{fontSize:11,color:C.whiteMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.bio.slice(0,50)}</div>}
                </div>
                <button onClick={()=>unfav(f.id)} style={{background:'none',border:`1px solid ${C.border}`,color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit',padding:'5px 10px',borderRadius:8,flexShrink:0}}>✕</button>
              </div>
            ))}
          </div>
      }
    </div>
  )

  const PageGhosted = () => (
    <div>
      <div style={{background:C.bgCard,borderRadius:12,padding:'12px 14px',border:`1px solid ${C.border}`,marginBottom:12}}>
        <div style={{fontSize:12,fontWeight:700,color:C.white,marginBottom:4}}>👻 Personnes ghostées</div>
        <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.6}}>Ces personnes ne verront plus ton profil et ne pourront plus t'envoyer de Clutch.</div>
      </div>
      {blocked.length===0
        ? <div style={{textAlign:'center',padding:'40px 0',color:C.whiteMid,fontSize:14}}>👻<br/>Personne de ghosté</div>
        : <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
            {blocked.map((b,i)=>(
              <div key={b.id} style={{display:'flex',gap:10,alignItems:'center',padding:'12px 14px',borderTop:i>0?`1px solid ${C.border}`:'none'}}>
                <Av src={b.photo_url} name={b.name||'?'} size={40}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700}}>{b.name}</div>
                </div>
                <button onClick={()=>unblock(b.id)} style={{background:`${C.green}18`,border:`1px solid ${C.green}44`,color:C.green,fontSize:11,cursor:'pointer',fontFamily:'inherit',padding:'5px 10px',borderRadius:8,fontWeight:700,flexShrink:0}}>Dé-ghoster</button>
              </div>
            ))}
          </div>
      }
    </div>
  )

  const PageSubscription = () => {
    // 4 paliers CONSO nommés par éléments rares (structure validée David 23.06). Driver = compte SÉPARÉ (voir note en bas).
    const _en = lang==='en'
    const tiers = [
      {id:'free',  label:t('sub.h.name'),  sub:t('sub.h.sub'),  price:'CHF 0',         color:'#9AA0A6', note:t('sub.h.note'),  features:_en?['3 Clutchs / day','Presences & events','Standard profile']:['3 Clutchs / jour','Présences & événements','Profil standard']},
      {id:'au',    label:t('sub.au.name'), sub:t('sub.au.sub'), price:'CHF 9.90/mois', color:'#C8860A', note:t('sub.au.note'), features:_en?['Unlimited Clutchs','👀 See who\'s online','Featured profile']:['Clutchs illimités','👀 Voir qui est en ligne','Profil mis en avant']},
      {id:'rh',    label:t('sub.rh.name'), sub:t('sub.rh.sub'), price:'CHF 19.90/mois',color:'#8E7CC3', note:t('sub.rh.note'), features:_en?['Everything in Gold, +','🔔 Alert when someone comes back online','See who favourited you','Bigger events']:['Tout Or, +','🔔 Notif quand quelqu\'un revient en ligne','Voir qui t\'a mis en favori','Événements plus grands']},
      {id:'at',    label:t('sub.at.name'), sub:t('sub.at.sub'), price:'CHF 29.90/mois',color:'#532943', note:t('sub.at.note'), features:_en?['Everything in Rhodium, +','Advanced fine preferences','Early access to events','Elite badge ✦']:['Tout Rhodium, +','Préférences fines avancées','Accès anticipé aux événements','Badge Élite ✦']},
    ]
    const current = (user as any)?.account_type==='Au'?'au':(user as any)?.account_type==='Rh'?'rh':(user as any)?.account_type==='At'?'at':'free'
    return (
      <div>
        <div style={{fontSize:10.5,color:C.whiteMid,textAlign:'center',lineHeight:1.5,marginBottom:14,fontStyle:'italic'}}>{_en?'« Elements heavier than iron are only born in supernovae ✦ »':'« Les éléments plus lourds que le fer ne naissent que dans les supernovae ✦ »'}</div>
        {tiers.map(tier=>(
          <div key={tier.id} style={{background:C.bgCard,borderRadius:16,padding:'16px',border:`2px solid ${tier.id===current?tier.color:C.border}`,marginBottom:12,position:'relative',overflow:'hidden'}}>
            {tier.id===current&&<div style={{position:'absolute',top:0,right:0,background:tier.color,padding:'4px 12px',borderBottomLeftRadius:10,fontSize:10,fontWeight:800,color:'#fff'}}>ACTUEL</div>}
            <div style={{display:'flex',alignItems:'baseline',gap:7,marginBottom:1}}>
              <div style={{fontSize:17,fontWeight:900,color:tier.id===current?tier.color:C.white}}>{tier.label}</div>
              <div style={{fontSize:10,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:tier.color}}>{tier.sub}</div>
            </div>
            <div style={{fontSize:9.5,color:C.whiteMid,fontStyle:'italic',marginBottom:8,lineHeight:1.3}}>{tier.note}</div>
            <div style={{fontSize:14,fontWeight:800,color:tier.id===current?tier.color:C.white,marginBottom:12}}>{tier.price}</div>
            {tier.features.map((f,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <span style={{color:tier.color,fontSize:13}}>✓</span>
                <span style={{fontSize:12,color:tier.id===current?C.white:C.whiteMid}}>{f}</span>
              </div>
            ))}
            {tier.id!==current&&<button style={{width:'100%',marginTop:12,padding:'12px',borderRadius:12,border:'none',background:tier.color,color:'#fff',fontSize:13,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
              {_en?`Get ${tier.label}`:`Passer à ${tier.label}`}
            </button>}
          </div>
        ))}
        {/* Le Clutch Driver est un compte À PART (business), pas un palier premium */}
        <div onClick={()=>showToast?.(_en?'🚗 Clutch Driver — soon: create events for your activity':'🚗 Clutch Driver — bientôt : crée des events pour ton activité',C.green)} style={{background:`${C.plum}0a`,border:`1.5px solid ${C.plum}33`,borderRadius:14,padding:'13px 14px',marginBottom:12,cursor:'pointer',display:'flex',alignItems:'center',gap:11}}>
          <span style={{fontSize:22}}>🚗</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:900,color:C.plum}}>{_en?'Do you organise for your activity?':'Tu organises pour ton activité ?'}</div>
            <div style={{fontSize:10.5,color:C.whiteMid,marginTop:1,lineHeight:1.4}}>{_en?<>The <b>Clutch Driver</b> account (yoga, workshops…) is <b>separate</b> from the plans above. CD ★ badge + quality feedback.</>:<>Le compte <b>Clutch Driver</b> (yoga, ateliers…) est <b>séparé</b> des abonnements ci-dessus. Badge CD ★ + feedback qualité.</>}</div>
          </div>
          <span style={{color:C.plum,fontSize:16}}>→</span>
        </div>
        <div style={{fontSize:10,color:C.whiteMid,textAlign:'center',opacity:.5,lineHeight:1.6}}>
          Abonnement mensuel · Résiliable à tout moment<br/>Prix en CHF · Suisse uniquement pour l'instant
        </div>
      </div>
    )
  }

  const PagePreferences = () => (
    <div>
      {SH('🔔 Notifications')}
      <div style={{background:C.bgCard,borderRadius:14,padding:'14px',border:`1px solid ${C.border}`,marginBottom:8}}>
        <div style={{fontSize:11,color:C.whiteMid,marginBottom:10,lineHeight:1.5}}>Choisis ce qui te dérange… et ce qui ne doit JAMAIS t'échapper.</div>
        <div style={{display:'flex',gap:7,marginBottom:14}}>
          {[{k:'low',e:'🔕',l:'Faible'},{k:'important',e:'🔔',l:'Important'},{k:'all',e:'📣',l:'Tout'}].map(o=>{const on=notifPrefs.level===o.k;return(
            <div key={o.k} onClick={()=>saveNotif({level:o.k})} style={{flex:1,textAlign:'center',padding:'10px 4px',borderRadius:12,cursor:'pointer',border:`1.5px solid ${on?C.orange:C.border}`,background:on?`${C.orange}12`:'transparent'}}>
              <div style={{fontSize:18}}>{o.e}</div><div style={{fontSize:10.5,fontWeight:800,color:on?C.orange:C.whiteMid,marginTop:3}}>{o.l}</div>
            </div>
          )})}
        </div>
        <div style={{fontSize:10,fontWeight:800,color:C.whiteMid,letterSpacing:'.05em',textTransform:'uppercase',marginBottom:6}}>Ne jamais manquer (sécurité)</div>
        {[{k:'clutch',e:'⚡',l:'Un Clutch reçu'},{k:'verrou',e:'🔒',l:'Un Verrou (RDV confirmé)'},{k:'rdv',e:'🕐',l:'L\'heure du RDV approche'},{k:'arrived',e:'📍',l:'« Il/elle est arrivé·e »'},{k:'lapin',e:'🐰',l:'Un lapin / une annulation'}].map((row,i)=>{
          const locked = row.k==='rdv'||row.k==='arrived' // vital sécurité → forcé ON
          const val = locked ? true : !!notifPrefs[row.k]
          return (
            <div key={row.k} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderTop:i>0?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:17}}>{row.e}</span>
              <span style={{flex:1,fontSize:13,fontWeight:600,color:C.white}}>{row.l}{locked&&<span style={{fontSize:9,color:C.green,marginLeft:6,fontWeight:800}}>essentiel</span>}</span>
              {locked
                ? <div style={{width:44,height:26,borderRadius:13,background:C.green,opacity:.55,position:'relative',flexShrink:0}}><div style={{position:'absolute',top:2,left:20,width:22,height:22,borderRadius:'50%',background:'#fff'}}/></div>
                : <Tog on={val} onTap={()=>saveNotif({[row.k]:!val})}/>}
            </div>
          )
        })}
        <div style={{fontSize:10,color:C.whiteMid,marginTop:10,lineHeight:1.5,opacity:.85}}>🔒 Les notifs de sécurité (heure du RDV, arrivée) restent toujours actives — c'est vital.</div>
      </div>
      {SH('Langue')}
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:8}}>
        <div style={{display:'flex',gap:8,padding:'12px 14px'}}>
          {(['fr','en'] as Lang[]).map(l=>(
            <button key={l} onClick={()=>setLang(l)}
              style={{flex:1,padding:'9px',borderRadius:10,border:`1.5px solid ${lang===l?C.orange:C.border}`,background:lang===l?`${C.orange}22`:C.bgCard,color:lang===l?C.orange:C.whiteMid,fontSize:13,fontWeight:lang===l?800:400,cursor:'pointer',fontFamily:'inherit'}}>
              {l==='fr'?'🇨🇭 Français':'🇬🇧 English'}
            </button>
          ))}
        </div>
      </div>

      {SH('Qui peut m\'envoyer un Clutch')}
      <div style={{background:C.bgCard,borderRadius:14,padding:'14px',border:`1px solid ${C.border}`,marginBottom:8}}>
        <div style={{fontSize:11,color:C.whiteMid,marginBottom:10,lineHeight:1.5}}>Contrôle qui peut t'envoyer un Clutch quand tu es disponible.</div>
        {([['open','🟢 Ouverte','Tout le monde peut t\'envoyer un Clutch'],['selective','🟡 Sélective','Seulement les profils compatibles'],['pause','🔴 Pause','Personne ne peut t\'envoyer de Clutch']] as [typeof recepMode,string,string][]).map(([m,label,desc])=>(
          <div key={m} onClick={()=>saveRecepMode(m)} style={{display:'flex',alignItems:'center',gap:10,padding:'10px',borderRadius:12,border:`1.5px solid ${recepMode===m?C.orange:C.border}`,background:recepMode===m?`${C.orange}11`:C.bgCard,marginBottom:6,cursor:'pointer'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:recepMode===m?800:500,color:recepMode===m?C.orange:C.white}}>{label}</div>
              <div style={{fontSize:11,color:C.whiteMid}}>{desc}</div>
            </div>
            {recepMode===m&&<div style={{width:18,height:18,borderRadius:'50%',background:C.orange,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,color:'#000',fontWeight:900}}>✓</div>}
          </div>
        ))}
      </div>

      {/* C/D4 — file d'attente : plafond de clutchs reçus simultanés (anti-saturation) */}
      {SH(lang==='en'?'Inbox limit':'File d\'attente — Clutchs reçus')}
      <div style={{background:C.bgCard,borderRadius:14,padding:'14px',border:`1px solid ${C.border}`,marginBottom:8}}>
        <div style={{fontSize:11,color:C.whiteMid,marginBottom:14,lineHeight:1.5}}>
          {lang==='en'
            ? 'Max number of pending Clutchs in your inbox at once. Beyond that, new ones don\'t get through — you stay in control of your pace.'
            : 'Nombre maximum de Clutchs en attente dans ta boîte EN MÊME TEMPS. Au-delà, les nouveaux ne passent pas — tu gardes la main sur ton rythme.'}
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:22}}>
          <button onClick={()=>saveMaxRecv(maxRecv-1)} disabled={maxRecv<=1}
            style={{width:42,height:42,borderRadius:21,border:`1.5px solid ${C.border}`,background:C.bg,color:maxRecv<=1?C.whiteMid:C.white,fontSize:22,fontWeight:900,cursor:maxRecv<=1?'default':'pointer',fontFamily:'inherit',opacity:maxRecv<=1?.4:1}}>−</button>
          <div style={{minWidth:52,textAlign:'center'}}>
            <div style={{fontSize:30,fontWeight:900,color:C.orange,lineHeight:1}}>{maxRecv}</div>
            <div style={{fontSize:10,color:C.whiteMid,marginTop:2}}>{lang==='en'?'max':'max'}</div>
          </div>
          <button onClick={()=>saveMaxRecv(maxRecv+1)} disabled={maxRecv>=20}
            style={{width:42,height:42,borderRadius:21,border:`1.5px solid ${C.border}`,background:C.bg,color:maxRecv>=20?C.whiteMid:C.white,fontSize:22,fontWeight:900,cursor:maxRecv>=20?'default':'pointer',fontFamily:'inherit',opacity:maxRecv>=20?.4:1}}>+</button>
        </div>
      </div>

      {SH('Activité du moment')}
      <div style={{background:C.bgCard,border:`1px solid ${actText.trim()?C.gold:C.border}`,borderRadius:14,padding:'14px',marginBottom:8}}>
        <div style={{fontSize:11,color:C.whiteMid,marginBottom:10,lineHeight:1.5}}>Visible sur ton profil pendant 8h. Les autres peuvent te rejoindre.</div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:10}}>
          {ACTIVITY_EMOJIS.map(e=>(
            <button key={e} onClick={()=>setActEmoji(actEmoji===e?'':e)}
              style={{width:34,height:34,borderRadius:10,border:`1.5px solid ${actEmoji===e?C.gold:C.border}`,background:actEmoji===e?`${C.gold}22`:C.bgCard,fontSize:16,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {e}
            </button>
          ))}
        </div>
        <input value={actText} onChange={e=>setActText(e.target.value)} placeholder={`${actEmoji||'♟️'} Décris ton activité…`} maxLength={60}
          style={{width:'100%',padding:'10px 14px',borderRadius:12,border:`1.5px solid ${C.border}`,background:'rgba(0,0,0,.2)',color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',marginBottom:8}}/>
        <div style={{display:'flex',gap:8}}>
          <button onClick={saveActivity} disabled={actSaving}
            style={{flex:1,padding:'10px',borderRadius:12,border:'none',background:C.gold,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:actSaving?.6:1}}>
            {actSaving?'…':actText.trim()?'✦ Partager':'Effacer'}
          </button>
          {actText.trim()&&<button onClick={()=>{setActText('');setActEmoji('');saveActivity()}} style={{padding:'10px 14px',borderRadius:12,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>✕</button>}
        </div>
      </div>
    </div>
  )

  const PageSecurity = () => (
    <div>
      {/* Didactique : expliquer en douceur ce qui se passe, pour rassurer (cf mémoire didactique) */}
      <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,padding:'14px',marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:800,color:C.white,marginBottom:10}}>Comment marche ta sécurité 🛡️</div>
        {[{n:'1',t:'Tu choisis tes proches',d:'jusqu\'à 3 personnes de confiance, gardées sur ton téléphone'},{n:'2',t:'En un geste, tu alertes',d:'un message part avec ta position en direct — tu n\'as rien à taper'},{n:'3',t:'Tu gardes le contrôle',d:'tu arrêtes l\'alerte quand tu veux. C\'est toi qui décides, toujours'}].map((s,i)=>(
          <div key={i} style={{display:'flex',gap:11,alignItems:'flex-start',marginBottom:i<2?9:0}}>
            <span style={{width:22,height:22,borderRadius:'50%',background:`${C.green}22`,color:C.green,fontSize:12,fontWeight:800,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{s.n}</span>
            <div><span style={{fontSize:13,fontWeight:700,color:C.white}}>{s.t}</span> <span style={{fontSize:12,color:C.whiteMid}}>— {s.d}</span></div>
          </div>
        ))}
      </div>
      <div style={{background:'rgba(248,113,113,0.06)',border:'1.5px solid rgba(248,113,113,0.25)',borderRadius:14,padding:'16px',marginBottom:12}}>
        <div style={{fontSize:14,fontWeight:800,color:'#f87171',marginBottom:8}}>🆘 Contacts d'urgence <span style={{fontSize:11,color:C.whiteMid,fontWeight:500}}>({sosContacts.length}/3)</span></div>
        <div style={{fontSize:12,color:C.whiteMid,lineHeight:1.6,marginBottom:14}}>
          En cas de problème, déclenche l'alerte → un SMS part vers tes contacts avec ta position GPS. Jusqu'à 3 contacts de confiance.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {sosContacts.map((c,i)=>(
            <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
              <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                <input value={c.name} onChange={e=>setSosField(i,'name',e.target.value)} placeholder={`Nom (ex: ${i===0?'Maman':i===1?'Amie':'Frère'})`}
                  style={{width:'100%',padding:'10px 13px',borderRadius:11,border:'1.5px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.05)',color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
                <input value={c.phone} onChange={e=>setSosField(i,'phone',e.target.value)} placeholder="Numéro (+41…)" type="tel"
                  style={{width:'100%',padding:'10px 13px',borderRadius:11,border:'1.5px solid rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.05)',color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
              </div>
              {sosContacts.length>1 && (
                <button onClick={()=>removeSosContact(i)} title="Retirer"
                  style={{flexShrink:0,width:32,height:32,borderRadius:'50%',border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:16,cursor:'pointer',fontFamily:'inherit'}}>×</button>
              )}
            </div>
          ))}
          {sosContacts.length<3 && (
            <button onClick={addSosContact}
              style={{padding:'9px',borderRadius:11,border:`1px dashed ${C.salmon}66`,background:'transparent',color:C.salmon,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
              + Ajouter un contact
            </button>
          )}
          <button onClick={saveSos} disabled={sosSaving}
            style={{width:'100%',padding:'12px',borderRadius:12,border:`1px solid ${C.border}`,background:'transparent',color:C.white,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',opacity:sosSaving?.5:1}}>
            {sosSaving?'Sauvegarde…':'💾 Sauvegarder les contacts'}
          </button>
          <button onClick={triggerSOS}
            style={{width:'100%',padding:'14px',borderRadius:12,border:'none',background:'#ef4444',color:'#fff',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 12px rgba(239,68,68,.4)',letterSpacing:.3}}>
            🆘 Alerter mes contacts (1 clic)
          </button>
          {sosLiveToken && (
            <button onClick={stopSOS}
              style={{width:'100%',padding:'11px',borderRadius:12,border:`1px solid ${C.border}`,background:'rgba(239,68,68,.12)',color:'#f87171',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
              ⏹ Arrêter le suivi en direct (SOS actif 🔴)
            </button>
          )}
          <button onClick={()=>{window.location.href='tel:117'}}
            style={{width:'100%',padding:'12px',borderRadius:12,border:'1.5px solid #ef4444',background:'transparent',color:'#ef4444',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
            📞 Police (117)
          </button>
          <div style={{fontSize:10,color:C.whiteMid,textAlign:'center',lineHeight:1.5}}>
            « Alerter » → partage natif (SMS, WhatsApp, Mail…) ton message + ta position GPS. Tu choisis l'app et valides l'envoi.
          </div>
        </div>
      </div>
      {(()=>{
        const rs = user.reliability_score ?? 100
        const clamp = (n:number)=>Math.max(0,Math.min(100,Math.round(n)))
        const level = rs>=90?'Exemplaire ✦':rs>=75?'Très fiable':rs>=50?'Fiable':'Nouveau·elle'
        const tip = rs>=90?'Les gens te font confiance. Continue !':rs>=70?'Bon score — honore tes RDV pour grimper.':'À améliorer — sois ponctuel·le et honore tes RDV.'
        const dims = [
          {emoji:'⏱️',name:lang==='en'?'Punctuality':'Ponctualité',  val:clamp(rs)},
          {emoji:'💛',name:lang==='en'?'Kindness':'Bienveillance',    val:clamp(rs+3)},
          {emoji:'🤝',name:lang==='en'?'Respect':'Respect',           val:clamp(rs-2)},
          {emoji:'🔄',name:lang==='en'?'Consistency':'Régularité',    val:clamp(rs-5)},
        ]
        return (
          <div style={{background:C.bgCard,borderRadius:12,padding:'16px',border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <div style={{fontSize:40,fontWeight:900,color:rs>=80?C.green:C.orange,lineHeight:1}}>{rs}</div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:C.white}}>{level}</div>
                <div style={{fontSize:10,color:C.whiteMid}}>{lang==='en'?'Reliability score /100':'Score de fiabilité /100'}</div>
              </div>
            </div>
            {dims.map(d=>(
              <div key={d.name} style={{marginBottom:10}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                  <span style={{fontSize:12,fontWeight:600,color:C.whiteMid}}>{d.emoji} {d.name}</span>
                  <span style={{fontSize:12,fontWeight:800,color:C.white}}>{d.val}</span>
                </div>
                <div style={{height:6,background:C.border,borderRadius:3,overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${d.val}%`,background:d.val>=80?C.green:d.val>=60?C.orange:'#f87171',borderRadius:3,transition:'width .5s'}}/>
                </div>
              </div>
            ))}
            <div style={{fontSize:10,color:C.whiteMid,marginTop:8,lineHeight:1.5}}>{tip}</div>
          </div>
        )
      })()}
    </div>
  )

  const PageLegal = () => (
    <div>
      {[
        {icon:'📋',label:'Conditions d\'utilisation',href:'/terms'},
        {icon:'🔒',label:'Politique de confidentialité',href:'/privacy'},
        {icon:'⚖️',label:'Mentions légales',href:'/legal'},
      ].map(({icon,label,href})=>(
        <div key={href} onClick={()=>window.open(href,'_blank')} style={{display:'flex',alignItems:'center',gap:12,padding:'14px',background:C.bgCard,borderRadius:12,border:`1px solid ${C.border}`,marginBottom:8,cursor:'pointer'}}>
          <span style={{fontSize:20}}>{icon}</span>
          <span style={{flex:1,fontSize:13,fontWeight:600,color:C.white}}>{label}</span>
          <span style={{color:C.whiteMid,fontSize:16}}>↗</span>
        </div>
      ))}
      <div style={{fontSize:10,color:C.whiteMid,textAlign:'center',opacity:.5,marginTop:16,lineHeight:1.6}}>
        Clutch — Lausanne 🇨🇭<br/>
        Données hébergées en Suisse · Conformité LPD<br/>
        Version beta · david.saugy@gmail.com
      </div>
    </div>
  )

  const PageContact = () => (
    <div>
      <div style={{background:C.bgCard,borderRadius:14,padding:'20px',border:`1px solid ${C.border}`,marginBottom:12,textAlign:'center'}}>
        <div style={{fontSize:32,marginBottom:8}}>📩</div>
        <div style={{fontSize:15,fontWeight:800,color:C.white,marginBottom:4}}>Nous contacter</div>
        <div style={{fontSize:12,color:C.whiteMid,lineHeight:1.6,marginBottom:16}}>
          Un bug ? Une idée ? Une question ?<br/>On répond dans les 24h.
        </div>
        <button onClick={()=>window.open('mailto:david.saugy@gmail.com?subject=Clutch feedback','_blank')}
          style={{width:'100%',padding:'13px',borderRadius:12,border:'none',background:C.orange,color:'#fff',fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
          ✉️ Envoyer un email
        </button>
      </div>
      <div style={{background:C.bgCard,borderRadius:12,padding:'14px',border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,fontWeight:700,color:C.white,marginBottom:4}}>Beta tester</div>
        <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.6}}>Tu fais partie des premiers à tester Clutch. Ton feedback est précieux — n'hésite pas à tout nous dire.</div>
      </div>
    </div>
  )

  // ── Helpers visuels des nouvelles sous-pages (poupées russes) ───────────
  // ⚠️ Pas de hooks ici — ce sont de simples fonctions appelées au rendu.
  const NoteBox = ({children,tone='soft'}:{children:React.ReactNode,tone?:'soft'|'green'}) => (
    <div style={{background:tone==='green'?`${C.green}14`:C.bgCard,border:`1px solid ${tone==='green'?`${C.green}44`:C.border}`,borderRadius:14,padding:'12px 14px',margin:'4px 0 14px',fontSize:12,color:tone==='green'?C.green:C.whiteMid,lineHeight:1.55}}>{children}</div>
  )
  const Tog = ({on,onTap}:{on:boolean,onTap:()=>void}) => (
    <div onClick={onTap} style={{width:44,height:26,borderRadius:13,background:on?C.green:C.border,position:'relative',cursor:'pointer',transition:'.2s',flexShrink:0}}>
      <div style={{position:'absolute',top:2,left:on?20:2,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'.2s',boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}/>
    </div>
  )
  const DRow = ({label,value,badge,onTap,danger,right}:{label:string,value?:string,badge?:string,onTap?:()=>void,danger?:boolean,right?:React.ReactNode}) => (
    <div onClick={onTap} style={{display:'flex',alignItems:'center',gap:10,padding:'14px 14px',borderBottom:`1px solid ${C.border}`,cursor:onTap?'pointer':'default'}}>
      <span style={{flex:1,fontSize:14,fontWeight:600,color:danger?'#f87171':C.white}}>{label}{badge&&<span style={{fontSize:9,fontWeight:800,color:C.green,background:`${C.green}1c`,borderRadius:8,padding:'1px 6px',marginLeft:6}}>{badge}</span>}</span>
      {right || <span style={{fontSize:13,color:C.whiteMid,display:'flex',alignItems:'center',gap:4}}>{value}{onTap&&<span style={{fontSize:17,color:'#c9c2c7'}}>›</span>}</span>}
    </div>
  )
  const PickRow = ({label,opts,val,onPick,badge}:{label:string,opts:{k:string,l:string}[],val:string,onPick:(k:string)=>void,badge?:string}) => (
    <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
      <div style={{fontSize:13,fontWeight:600,color:C.white,marginBottom:9}}>{label}{badge&&<span style={{fontSize:9,fontWeight:800,color:C.green,background:`${C.green}1c`,borderRadius:8,padding:'1px 6px',marginLeft:6}}>{badge}</span>}</div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
        {opts.map(o=>(
          <span key={o.k} onClick={()=>onPick(o.k)} style={{fontSize:12,fontWeight:700,padding:'6px 12px',borderRadius:20,cursor:'pointer',border:`1.5px solid ${val===o.k?C.orange:C.border}`,color:val===o.k?'#fff':C.whiteMid,background:val===o.k?C.orange:'transparent'}}>{o.l}</span>
        ))}
      </div>
    </div>
  )

  // ÉCRAN : Mood 🌙 (éphémère, reset minuit) — riche, par moment de journée, avec « feu vert » de pertinence
  const PageMoment = () => {
    const nowP = periodFromHour(new Date().getHours())
    const list = MOMENTS.filter(m => m.p===momentPeriod || m.p==='any')
    return (
    <div>
      <NoteBox>Une envie <b style={{color:C.white}}>ponctuelle</b>, juste pour aujourd'hui. Ça <b style={{color:C.white}}>disparaît à minuit</b> — aucune pression. Le point <span style={{color:C.green,fontWeight:800}}>vert</span> = ce qui colle le mieux à l'instant.</NoteBox>
      {/* Sélecteur moment de journée */}
      <div style={{display:'flex',gap:7,marginBottom:14}}>
        {PERIODS.map(p=>{const on=momentPeriod===p.k; const isNow=nowP===p.k; return(
          <div key={p.k} onClick={()=>setMomentPeriod(p.k)} style={{flex:1,textAlign:'center',padding:'9px 4px',borderRadius:13,cursor:'pointer',border:`1.5px solid ${on?C.orange:C.border}`,background:on?`${C.orange}12`:'transparent',position:'relative'}}>
            <div style={{fontSize:17}}>{p.e}</div>
            <div style={{fontSize:9.5,fontWeight:800,color:on?C.orange:C.whiteMid,marginTop:2,lineHeight:1.1}}>{p.l.replace('Cet ','').replace('Ce ','').replace('Cette ','')}</div>
            {isNow&&<div style={{position:'absolute',top:5,right:5,width:6,height:6,borderRadius:'50%',background:C.green}} title="maintenant"/>}
          </div>
        )})}
      </div>
      {/* Moods du moment sélectionné */}
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {list.map(m=>{const on=moment===m.k; const fits=m.p===nowP||m.p==='any'; return(
          <div key={m.k} onClick={()=>pickMoment(m.k)} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:14,cursor:'pointer',border:`1.5px solid ${on?C.orange:C.border}`,background:on?`${C.orange}12`:C.bgCard}}>
            <span style={{fontSize:22}}>{m.e}</span>
            <span style={{flex:1,fontSize:14,fontWeight:on?800:600,color:on?C.orange:C.white}}>{m.l}</span>
            <span style={{width:9,height:9,borderRadius:'50%',background:fits?C.green:C.borderStrong,flexShrink:0}} title={fits?'ça bouge à cette heure':'plutôt à un autre moment'}/>
            {on&&<span style={{fontSize:15,color:C.orange}}>✓</span>}
          </div>
        )})}
      </div>
      <NoteBox>À minuit, ton mode du moment s'efface. Demain, tu en choisis un autre — ou pas. ↺<br/><span style={{fontSize:10.5,opacity:.8}}>Bientôt : le vert te montrera où il y a le plus de monde dispo, en vrai.</span></NoteBox>
    </div>
  )}

  // ÉCRAN : Ce que je cherche (éphémère vs persistant)
  const PageCherche = () => (
    <div>
      <NoteBox tone="green">↺ <b>Tes filtres « du moment » s'effacent après 18h.</b> Tu repars ouvert·e à chaque fois — jamais coincé·e.</NoteBox>
      <div style={{fontSize:11,fontWeight:800,color:C.green,padding:'2px 2px 8px'}}>⚡ ÉPHÉMÈRE (se réinitialise)</div>
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:14}}>
        <div style={{padding:'12px 14px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontSize:13,fontWeight:600,color:C.white,marginBottom:9}}>Modes <span style={{fontSize:9,fontWeight:800,color:C.green,background:`${C.green}1c`,borderRadius:8,padding:'1px 6px'}}>↺ 18h</span></div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {MODES.map(m=>{const on=ephModes.includes(m.k);return(
              <span key={m.k} onClick={()=>toggleMode(m.k)} style={{fontSize:12,fontWeight:700,padding:'6px 11px',borderRadius:20,cursor:'pointer',border:`1.5px solid ${on?C.orange:C.border}`,color:on?'#fff':C.whiteMid,background:on?C.orange:'transparent'}}>{m.e} {m.l}</span>
            )})}
          </div>
        </div>
        <PickRow label="Distance" badge="↺ souple" val={seekDist} onPick={k=>saveSeek({dist:k},[setSeekDist,k])}
          opts={[{k:'quartier',l:'🚶 Mon quartier'},{k:'ville',l:'🏙 Dans la ville'},{k:'region',l:'🚆 Toute la région'}]}/>
        <DRow label="🛡️ Comment marchent les zones" value="Sécurité" onTap={()=>setProfilePage('distance_zones')}/>
      </div>
      <div style={{fontSize:11,fontWeight:800,color:C.whiteMid,padding:'2px 2px 8px'}}>📌 PERSISTANT (qui tu es)</div>
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:14}}>
        <PickRow label="Genre recherché" val={seekGender} onPick={k=>saveSeek({gender:k},[setSeekGender,k])}
          opts={[{k:'women',l:'♀ Femmes'},{k:'men',l:'♂ Hommes'},{k:'all',l:'✨ Tout le monde'}]}/>
        <PickRow label="Âge" val={seekAge} onPick={k=>saveSeek({age:k},[setSeekAge,k])}
          opts={[{k:'18-25',l:'18–25'},{k:'25-35',l:'25–35'},{k:'35-50',l:'35–50'},{k:'all',l:'Tout'}]}/>
      </div>
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
        <div onClick={()=>toggleAdv('cherche')} style={{padding:'13px 14px',display:'flex',justifyContent:'space-between',cursor:'pointer',fontSize:13,fontWeight:800,color:C.salmon}}><span>⚙️ Avancé — filtres fins</span><span>{advOpen==='cherche'?'⌃':'⌄'}</span></div>
        {advOpen==='cherche' && <div style={{borderTop:`1px solid ${C.border}`}}>
          <DRow label="Que des profils certifiés" right={<Tog on={!!readSeek().certOnly} onTap={()=>saveSeek({certOnly:!readSeek().certOnly})}/>}/>
          <DRow label="Que des profils avec photo" right={<Tog on={readSeek().photoOnly!==false} onTap={()=>saveSeek({photoOnly:readSeek().photoOnly===false})}/>}/>
        </div>}
      </div>
    </div>
  )

  // ÉCRAN : Mon Clutch · l'algo (la pièce fun + éthique)
  const PageAlgo = () => { const Q=TRAIN_Q[trainIdx]; return (
    <div>
      <NoteBox>Tu choisis <b style={{color:C.white}}>comment Clutch te propose des gens</b>. Par défaut on optimise pour toi — mais tu peux régler.</NoteBox>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[{k:'proximite',e:'📍',t:'Proximité'},{k:'compatibilite',e:'🧩',t:'Compatibilité'},{k:'decouverte',e:'🎲',t:'Découverte'}].map(o=>{const on=algoStyle===o.k;return(
          <div key={o.k} onClick={()=>setAlgo(o.k)} style={{flex:1,border:`1.5px solid ${on?C.orange:C.border}`,borderRadius:14,padding:'14px 6px',textAlign:'center',cursor:'pointer',background:on?`${C.orange}14`:'transparent'}}>
            <div style={{fontSize:24}}>{o.e}</div><div style={{fontSize:11,fontWeight:800,color:on?C.orange:C.white,marginTop:5}}>{o.t}</div>
          </div>
        )})}
      </div>
      <div style={{fontSize:11,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:C.whiteMid,marginBottom:8}}>Entraîne ton Clutch</div>
      <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px 16px',textAlign:'center',marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:14}}>« {Q.q} »</div>
        <div style={{display:'flex',gap:12,justifyContent:'center'}}>
          {[Q.a,Q.b].map((opt,i)=>(
            <button key={i} onClick={answerTrain} style={{flex:1,maxWidth:130,padding:'14px 8px',borderRadius:16,border:`1.5px solid ${C.border}`,background:'transparent',cursor:'pointer',fontFamily:'inherit'}}>
              <div style={{fontSize:24}}>{opt.e}</div><div style={{fontSize:11,color:C.whiteMid,marginTop:6,lineHeight:1.3}}>{opt.l}</div>
            </button>
          ))}
        </div>
        <div style={{fontSize:10,color:C.whiteMid,marginTop:14,opacity:.8}}>{algoTrained>0?`🪄 ${algoTrained} réponse${algoTrained>1?'s':''} — Clutch te comprend mieux`:'Plus tu réponds, mieux Clutch te comprend 🪄'}</div>
      </div>
      {/* ✦ Aperçu Convergence (demande David : pouvoir voir l'animation du rapprochement) */}
      <button onClick={()=>setShowConvDemo(true)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:'14px',borderRadius:16,border:`1px solid ${C.border}`,background:`linear-gradient(135deg,${C.bordeaux}0a,${C.green}08)`,cursor:'pointer',fontFamily:'inherit',marginBottom:14,textAlign:'left'}}>
        <span style={{fontSize:22}}>✦</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:800,color:C.white}}>Voir la Convergence</div>
          <div style={{fontSize:11.5,color:C.whiteMid,marginTop:1}}>L'animation quand vous vous rapprochez du lieu du RDV</div>
        </div>
        <span style={{color:'#c9c2c7',fontSize:18}}>›</span>
      </button>
      {/* Avancé — pondérations & tests (Test de personnalité dedans, comme la maquette validée) */}
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:14}}>
        <div onClick={()=>toggleAdv('algo')} style={{padding:'13px 14px',display:'flex',justifyContent:'space-between',cursor:'pointer',fontSize:13,fontWeight:800,color:C.salmon}}><span>⚙️ {EN?'Advanced — weights & tests':'Avancé — pondérations & tests'}</span><span>{advOpen==='algo'?'⌃':'⌄'}</span></div>
        {advOpen==='algo' && <div style={{borderTop:`1px solid ${C.border}`}}>
          <DRow label={EN?'Meetup temperament':'Tempérament de rencontre'} value={temperament?`${TEMP_ARCH[temperament].e} ${EN?'Done':'Fait'}`:(EN?'Not done':'Non fait')} onTap={()=>setProfilePage('temperament')}/>
          <DRow label={EN?'🧬 Personality test (16 types)':'🧬 Test de personnalité (16 types)'} value={mbtiType?`${MBTI_TYPES[mbtiType]?.emoji||''} ${mbtiType}`:(EN?'To do':'À faire')} onTap={()=>setShowMbti(true)}/>
          <DRow label={EN?'Reliability weight':'Poids de la fiabilité'} value={EN?'High':'Élevé'}/>
          <DRow label={EN?'Reset my algo':'Réinitialiser mon algo'} danger onTap={()=>{ setAlgo('proximite'); setAlgoTrained(0); try{localStorage.setItem(algoKey,JSON.stringify({style:'proximite',trained:0}))}catch{}; showToast(EN?'↺ Algo reset':'↺ Algo réinitialisé',C.orange) }} right={<span style={{color:C.salmon,fontSize:15}}>↺</span>}/>
        </div>}
      </div>
      <NoteBox>🔒 Éthique : ton algo ne sert jamais à te rendre accro pour rien — il sert à te faire <b style={{color:C.white}}>sortir voir des gens</b>.</NoteBox>
      {/* 👁 NOTE ÉQUIPE — visible David + Mel uniquement */}
      {isAdmin && (
        <div style={{margin:'2px 0 8px',border:'1px dashed #dc2626',background:'rgba(220,38,38,.06)',borderRadius:12,padding:'10px 12px'}}>
          <div style={{fontSize:9,fontWeight:800,color:'#f87171',letterSpacing:'.06em'}}>👁 POURQUOI CE CHOIX (toi + Mel)</div>
          <div style={{fontSize:11,color:'#fca5a5',marginTop:4,lineHeight:1.45}}>« Entraîne ton Clutch » en <b>questions binaires</b> (ça ou ça) plutôt qu'en curseurs/réglages techniques : <b>ludique</b>, sans jargon, <b>dopamine éthique</b> (le user joue à affiner), et l'algo apprend sans qu'il comprenne la mécanique. Alternative écartée : des curseurs % = froid, intimidant, personne ne touche. → À valider : on garde 3 styles (Proximité/Compatibilité/Découverte) ou on en ajoute (« Nouveauté », « Mes affinités ») ?</div>
        </div>
      )}
    </div>
  )}

  // ÉCRAN : Sécurité & confidentialité (groupe → SOS / bloqués / certif)
  const PageSecu = () => (
    <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
      <DRow label="Qui peut m'envoyer un Clutch" value={recepMode==='open'?'🟢 Ouverte':recepMode==='selective'?'🟡 Sélective':'🔴 Pause'} onTap={()=>setProfilePage('preferences')}/>
      <DRow label="Mode invisible" right={<Tog on={recepMode==='pause'} onTap={()=>saveRecepMode(recepMode==='pause'?'open':'pause')}/>}/>
      <DRow label="Contacts SOS" value={`${sosContacts.filter(c=>c.name.trim()||c.phone.trim()).length} configuré${sosContacts.filter(c=>c.name.trim()||c.phone.trim()).length>1?'s':''}`} onTap={()=>setProfilePage('security')}/>
      <DRow label="Personnes ghostées" value={blocked.length?`${blocked.length}`:'0'} onTap={()=>setProfilePage('ghosted')}/>
      <DRow label="Certification selfie" right={(user as any).is_certified?<span style={{color:C.green,fontWeight:800,fontSize:13}}>✓ Fait</span>:<span style={{color:C.whiteMid,fontSize:13}}>À faire ›</span>} onTap={()=>showToast('Certification selfie — bientôt',C.whiteMid)}/>
    </div>
  )

  // ÉCRAN : Mon compte (groupe → abonnement / fiabilité / favoris / légal…)
  const PageCompte = () => {
    const rs = user.reliability_score ?? 100
    const lvl = rs>=90?'🏆 Exemplaire':rs>=75?'⭐ Très fiable':rs>=50?'🟢 Fiable':rs>=30?'🌿 En construction':'🌱 Nouveau'
    return (
    <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
      <DRow label="🤍 Comprendre Clutch" value="Guide 1 min" onTap={()=>setProfilePage('guide')}/>
      <DRow label="Faire une pause" value={paused?'🌙 En pause':'Bien-être'} onTap={()=>setProfilePage('pause')}/>
      <DRow label="Abonnement" value="Gratuit · Premium" onTap={()=>setProfilePage('subscription')}/>
      <DRow label="Ma fiabilité" value={lvl} onTap={()=>setProfilePage('fiabilite')}/>
      <DRow label="Préférences & notifications" value="Langue, réception…" onTap={()=>setProfilePage('preferences')}/>
      <DRow label="🧪 Geek Setup" value="Réglages fins" onTap={()=>setProfilePage('geek')}/>
      <DRow label="Favoris" value={favorites.length?`${favorites.length}`:'0'} onTap={()=>setProfilePage('favorites')}/>
      <DRow label="Langue" value={lang==='fr'?'🇨🇭 Français':'🇬🇧 English'} onTap={()=>setLang(lang==='fr'?'en':'fr')}/>
      <DRow label="Légal & données" value="CGU · LPD" onTap={()=>setProfilePage('legal')}/>
      <DRow label="Nous contacter" onTap={()=>setProfilePage('contact')}/>
      <DRow label={logoutArmed?'Confirmer la déconnexion ?':'Se déconnecter'} value={logoutArmed?'Appuie encore':undefined} danger onTap={()=>{ if(logoutArmed){ signOut() } else { setLogoutArmed(true); setTimeout(()=>setLogoutArmed(false),4000) } }}/>
      <DRow label="Supprimer mon compte" danger onTap={()=>setShowDelete(true)}/>
    </div>
  )}

  // ════ NIVEAU 3 (poupées russes profondes) ════

  // Mon compte → Ma fiabilité → « Comment elle se construit » (pédagogique, jamais punitif)
  const PageFiabilite = () => {
    const rs = user.reliability_score ?? 100
    const lvl = rs>=90?{e:'🏆',t:'Exemplaire',c:C.green}:rs>=75?{e:'⭐',t:'Très fiable',c:C.green}:rs>=50?{e:'🟢',t:'Fiable',c:C.green}:rs>=30?{e:'🌿',t:'En construction',c:C.orange}:{e:'🌱',t:'Nouveau membre',c:C.orange}
    const pillars = [
      {e:'⏱️',t:'Ponctualité',d:'arriver à l\'heure à tes rendez-vous'},
      {e:'📍',t:'Présence',d:'venir vraiment — ne jamais poser de lapin 🐰'},
      {e:'💛',t:'Respect',d:'prévenir tôt si tu dois annuler, rester correct·e'},
    ]
    return (
      <div>
        <div style={{textAlign:'center',padding:'8px 0 16px'}}>
          <div style={{fontSize:40}}>{lvl.e}</div>
          <div style={{fontSize:18,fontWeight:900,color:lvl.c,marginTop:4}}>{lvl.t}</div>
          <div style={{maxWidth:240,margin:'10px auto 0',height:6,background:C.border,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${rs}%`,background:lvl.c,borderRadius:3}}/></div>
        </div>
        <NoteBox>Ta fiabilité, c'est la <b style={{color:C.white}}>confiance</b> que les autres peuvent te faire. Elle se construit à chaque rendez-vous — <b style={{color:C.white}}>elle n'est jamais une punition</b>, juste le reflet de ta parole tenue.</NoteBox>
        <div style={{fontSize:11,fontWeight:800,color:C.whiteMid,letterSpacing:'.06em',textTransform:'uppercase',margin:'4px 2px 8px'}}>Elle repose sur 3 choses</div>
        <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:14}}>
          {pillars.map((p,i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'13px 14px',borderBottom:i<2?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:20}}>{p.e}</span>
              <div><div style={{fontSize:14,fontWeight:700,color:C.white}}>{p.t}</div><div style={{fontSize:12,color:C.whiteMid,marginTop:1}}>{p.d}</div></div>
            </div>
          ))}
        </div>
        <NoteBox tone="green">↑ <b>Pour monter :</b> honore tes rendez-vous, arrive à l'heure, et préviens dès que possible si un imprévu arrive. C'est tout. La régularité fait le reste.</NoteBox>
      </div>
    )
  }

  // Mon Clutch → Mon tempérament de rencontre (mini-quiz ludique)
  const PageTemperament = () => {
    if (temperament) { const a=TEMP_ARCH[temperament]; return (
      <div>
        <div style={{textAlign:'center',padding:'14px 0'}}>
          <div style={{fontSize:48}}>{a.e}</div>
          <div style={{fontSize:20,fontWeight:900,color:C.white,marginTop:6}}>{a.l}</div>
          <div style={{fontSize:13,color:C.whiteMid,maxWidth:260,margin:'8px auto 0',lineHeight:1.5}}>{a.d}</div>
        </div>
        <NoteBox>Ton tempérament colore subtilement la façon dont Clutch te présente — et comment il choisit qui te proposer. <b style={{color:C.white}}>Aucune étiquette imposée</b> : c'est une nuance, pas une boîte.</NoteBox>
        <button onClick={retakeTemp} style={{width:'100%',padding:'13px',borderRadius:14,border:`1.5px solid ${C.border}`,background:'transparent',color:C.salmon,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>↺ Refaire le test</button>
      </div>
    )}
    const Q = TEMP_Q[tempStep]
    return (
      <div>
        <div style={{display:'flex',gap:5,justifyContent:'center',marginBottom:18}}>
          {TEMP_Q.map((_,i)=><div key={i} style={{width:i===tempStep?22:8,height:8,borderRadius:4,background:i<=tempStep?C.orange:C.border,transition:'all .2s'}}/>)}
        </div>
        <div style={{fontSize:18,fontWeight:800,color:C.white,textAlign:'center',padding:'0 10px 22px',lineHeight:1.35}}>{Q.q}</div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {[Q.a,Q.b].map((opt,i)=>(
            <button key={i} onClick={()=>answerTemp(opt.k)} style={{display:'flex',alignItems:'center',gap:13,padding:'16px 16px',borderRadius:16,border:`1.5px solid ${C.border}`,background:C.bgCard,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
              <span style={{fontSize:24}}>{opt.e}</span><span style={{fontSize:14,fontWeight:600,color:C.white,lineHeight:1.3}}>{opt.l}</span>
            </button>
          ))}
        </div>
        <div style={{textAlign:'center',marginTop:18}}><span onClick={()=>{setProfilePage(null)}} style={{fontSize:12,color:C.whiteMid,cursor:'pointer',textDecoration:'underline'}}>Passer pour l'instant</span></div>
      </div>
    )
  }

  // Mon Clutch → « Pourquoi on te propose des gens » (transparence anti-boîte-noire)
  const PageWhy = () => {
    const reasons = [
      {e:'📍',t:'Vous êtes proches',d:'dans la même zone de la ville, là, maintenant'},
      {e:'🕐',t:'Au même moment',d:'vos fenêtres de disponibilité se croisent (la règle des 18h)'},
      {e:'🧩',t:'Un terrain commun',d:'un intérêt, un mode, une envie qui se répondent'},
      {e:'🏆',t:'La confiance',d:'une fiabilité qui rend le vrai rendez-vous probable'},
    ]
    return (
      <div>
        <NoteBox>Clutch ne te montre jamais quelqu'un « au hasard » ni pour te <b style={{color:C.white}}>garder sur l'écran</b>. Voici les seules choses qui comptent :</NoteBox>
        <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`,marginBottom:14}}>
          {reasons.map((r,i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'13px 14px',borderBottom:i<3?`1px solid ${C.border}`:'none'}}>
              <span style={{fontSize:20}}>{r.e}</span>
              <div><div style={{fontSize:14,fontWeight:700,color:C.white}}>{r.t}</div><div style={{fontSize:12,color:C.whiteMid,marginTop:1}}>{r.d}</div></div>
            </div>
          ))}
        </div>
        <NoteBox tone="green">🔒 Ce qu'on ne fait <b>jamais</b> : te rendre accro, te cacher des gens pour te faire payer, ou jouer sur ta solitude. L'algo a un seul but — <b>t'envoyer dehors, vers quelqu'un de vrai.</b></NoteBox>
      </div>
    )
  }

  // Ce que je cherche → « Comment marchent les zones » (rassurance sécurité)
  const PageDistanceZones = () => (
    <div>
      <NoteBox tone="green">🛡️ <b>On ne montre JAMAIS où sont les gens.</b> Jamais une position, jamais une distance à une personne. Seulement des <b style={{color:C.white}}>zones de la ville</b>. Personne ne peut te pister.</NoteBox>
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
        {[{e:'🚶',t:'Mon quartier',d:'à quelques minutes à pied — pour du vraiment spontané'},{e:'🏙',t:'Dans la ville',d:'tout Lausanne — le bon équilibre'},{e:'🚆',t:'Toute la région',d:'plus large, pour ne rien rater autour'}].map((z,i)=>(
          <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start',padding:'13px 14px',borderBottom:i<2?`1px solid ${C.border}`:'none'}}>
            <span style={{fontSize:20}}>{z.e}</span>
            <div><div style={{fontSize:14,fontWeight:700,color:C.white}}>{z.t}</div><div style={{fontSize:12,color:C.whiteMid,marginTop:1}}>{z.d}</div></div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:C.whiteMid,textAlign:'center',marginTop:14,lineHeight:1.5,opacity:.85}}>Le radar d'un rendez-vous montre le <b style={{color:C.salmon}}>temps</b> qui te sépare du lieu — jamais la distance à la personne.</div>
    </div>
  )

  // « Comprendre Clutch » — guide didactique doux (mise en confiance, cf mémoire didactique)
  const PageGuide = () => {
    const cards = [
      {e:'✦',t:'C\'est quoi Clutch ?',d:'Pas du swipe, pas un jeu pour rester sur ton téléphone. Tu te rends disponible, et tu rencontres quelqu\'un en vrai, dans les heures qui suivent. C\'est tout.'},
      {e:'🕐',t:'Ta disponibilité (18h max)',d:'Quand tu veux, tu t\'ouvres un créneau : tu apparais sur la carte, au maximum 18h. Après, ça s\'efface tout seul. Tu n\'es jamais « en ligne » en permanence — tu choisis tes moments.'},
      {e:'⚡',t:'Le Clutch & le Verrou',d:'Tu envoies un Clutch à quelqu\'un qui te plaît. S\'iel accepte, c\'est un Verrou : votre rendez-vous est posé, à une heure, dans un lieu. Doux et clair.'},
      {e:'🏆',t:'La fiabilité',d:'Une confiance qui se construit simplement, en tenant ta parole : venir, être à l\'heure, prévenir si besoin. Ce n\'est jamais une punition — juste le reflet de ton respect des autres.'},
      {e:'🛡️',t:'Ta sécurité, ton contrôle',d:'On ne montre jamais où tu es. Tu as un bouton SOS, le blocage, la certification. À chaque étape, c\'est TOI qui décides. Tu peux faire une pause quand tu veux.'},
    ]
    return (
      <div>
        <NoteBox>Bienvenue 🤍 Voici Clutch en 1 minute, tout en douceur. Aucune question piège, aucune pression.</NoteBox>
        {cards.map((c,i)=>(
          <div key={i} style={{display:'flex',gap:13,alignItems:'flex-start',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:'15px 15px',marginBottom:10}}>
            <span style={{fontSize:24,flexShrink:0}}>{c.e}</span>
            <div><div style={{fontSize:15,fontWeight:800,color:C.white,marginBottom:4}}>{c.t}</div><div style={{fontSize:13,color:C.whiteMid,lineHeight:1.55}}>{c.d}</div></div>
          </div>
        ))}
        <div style={{textAlign:'center',padding:'14px 10px 4px'}}>
          <div style={{fontSize:13,fontStyle:'italic',color:C.salmon,marginBottom:14}}>« Réunir ce qui était séparé. »<br/><span style={{fontSize:11,color:C.whiteMid,fontStyle:'normal'}}>Clutch te ramène vers le vrai, en douceur.</span></div>
          <button onClick={()=>{ markGuideSeen(); setProfilePage(null) }} style={{padding:'13px 26px',borderRadius:14,border:'none',background:C.orange,color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 5px 16px rgba(235,107,175,.35)'}}>J'ai compris ✦</button>
        </div>
      </div>
    )
  }

  // Mode Pause bien-être — bienveillant, anti-addiction, effet réel
  const PagePause = () => (
    <div>
      <div style={{textAlign:'center',padding:'10px 0 18px'}}>
        <div style={{fontSize:46}}>{paused?'🌙':'☀️'}</div>
        <div style={{fontSize:19,fontWeight:900,color:C.white,marginTop:8}}>{paused?'Tu es en pause':'Faire une pause'}</div>
      </div>
      <NoteBox>Prendre du recul, c'est <b style={{color:C.white}}>sain</b>. Pendant ta pause, tu n'apparais plus comme disponible et personne ne peut t'envoyer de Clutch. <b style={{color:C.white}}>Tout est gardé</b> — tes préférences, tes contacts, ton profil. Tu reviens quand tu veux, sans rien perdre.</NoteBox>
      <button onClick={togglePause} style={{width:'100%',padding:'15px',borderRadius:16,border:`1.5px solid ${paused?C.orange:C.border}`,background:paused?C.orange:C.bgCard,color:paused?'#fff':C.white,fontSize:14.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
        {paused?'☀️ Revenir sur Clutch':'🌙 Mettre Clutch en pause'}
      </button>
      <div style={{fontSize:11,color:C.whiteMid,textAlign:'center',marginTop:14,lineHeight:1.5,opacity:.85}}>Aucune culpabilité, aucune notification pour te faire revenir. C'est ton rythme.</div>
    </div>
  )

  const [logoutArmed,setLogoutArmed] = useState(false)  // confirmation 2-temps déconnexion (window.confirm bloqué iOS)
  // 🧪 Geek Setup — l'utilisateur fabrique sa propre ergonomie (afficher/masquer les boutons flottants).
  const [geekPrefs,setGeekPrefs] = useState(()=>{ const r=(k:string)=>{ try{return localStorage.getItem(k)!=='0'}catch{return true} }; return { live:r('clutch_show_live'), night:r('clutch_show_night') } })
  const setFabPref = (k:'live'|'night', v:boolean) => {
    try{ localStorage.setItem(k==='live'?'clutch_show_live':'clutch_show_night', v?'1':'0') }catch{}
    setGeekPrefs(p=>({...p,[k]:v}))
    try{ window.dispatchEvent(new Event('clutch-fab-prefs')) }catch{}
  }
  // 🔥 VÉNÉRITUDE — le thermostat d'engueulade (brain-dump David). 0=Doux … 3=Trash.
  const [veneritude,setVeneritude] = useState<number>(()=>getVeneritude())
  const saveVeneritude = (n:number) => {
    const v=Math.max(0,Math.min(3,n)); setVeneritude(v)
    try{ localStorage.setItem('clutch_veneritude', String(v)) }catch{}
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate(v>=3?[8,30,8]:8)
  }
  // 🎭 MOOD PERSONNAGE — la « voix » qui signe les messages (Tesla, philosophe, coach psy…)
  const [persona,setPersona] = useState<string>(()=>getPersona())
  const savePersona = (k:string) => { setPersona(k); try{ localStorage.setItem('clutch_persona', k) }catch{}; if((navigator as any)?.vibrate)(navigator as any).vibrate(6) }
  const PageGeek = () => (
    <div style={{display:'flex',flexDirection:'column',gap:14}}>
      <div style={{fontSize:12,color:C.whiteMid,lineHeight:1.55,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px'}}>
        🧪 Ici tu fabriques <strong style={{color:C.white}}>ton</strong> Clutch. Tu n'utilises jamais un bouton flottant ? Masque-le. Tu pourras toujours le rallumer ici.
      </div>

      {/* 🔥 Curseur VÉNÉRITUDE — le ton des messages quand tu crées un illogisme */}
      <div style={{background:C.bgCard,borderRadius:14,border:`1px solid ${C.border}`,padding:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <span style={{fontSize:16}}>🔥</span>
          <div style={{fontSize:14,fontWeight:800,color:C.white}}>Vénéritude</div>
          <span style={{marginLeft:'auto',fontSize:12,fontWeight:800,color:VENERITUDE[veneritude].color}}>{VENERITUDE[veneritude].emoji} {VENERITUDE[veneritude].label}</span>
        </div>
        <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.5,marginBottom:12}}>
          Le ton que Clutch prend quand tu fais une connerie (créneaux absurdes, trajet à la vitesse de la lumière…). À gauche = doux. À droite, ça t'allume.
        </div>
        <div style={{display:'flex',gap:6,marginBottom:12}}>
          {VENERITUDE.map((v,i)=>(
            <button key={v.key} onClick={()=>saveVeneritude(i)}
              style={{flex:1,padding:'9px 4px',borderRadius:10,border:`1.5px solid ${veneritude===i?v.color:C.border}`,background:veneritude===i?`${v.color}22`:C.bg,cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
              <span style={{fontSize:17,filter:veneritude===i?'none':'grayscale(.6)',opacity:veneritude===i?1:.65}}>{v.emoji}</span>
              <span style={{fontSize:10,fontWeight:veneritude===i?800:500,color:veneritude===i?v.color:C.whiteMid}}>{v.label}</span>
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4,marginBottom:12,justifyContent:'center'}}>
          {[0,1,2,3].map(i=>(
            <span key={i} style={{fontSize:18,opacity:i<=veneritude?1:.22,filter:i<=veneritude?'none':'grayscale(1)',transform:i<=veneritude?`scale(${1+veneritude*0.05})`:'scale(1)',transition:'.2s'}}>🔥</span>
          ))}
        </div>
        <div style={{background:C.bg,border:`1px dashed ${VENERITUDE[veneritude].color}66`,borderRadius:10,padding:'10px 12px'}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:'.08em',color:C.whiteMid,marginBottom:4}}>APERÇU — TON CRÉNEAU EST INFAISABLE :</div>
          <div style={{fontSize:12,color:C.white,lineHeight:1.45}}>{roastInfeasible(veneritude,'fr',18,49,10,true)}{persona!=='off' && <span style={{display:'block',marginTop:6,color:C.salmon,fontStyle:'italic'}}>{personaQuip(persona,'infeasible_trip','fr',true)}</span>}</div>
        </div>
      </div>

      {/* 🎭 Mood PERSONNAGE — la « voix » de Clutch */}
      <div style={{background:C.bgCard,borderRadius:14,border:`1px solid ${C.border}`,padding:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
          <span style={{fontSize:16}}>🎭</span>
          <div style={{fontSize:14,fontWeight:800,color:C.white}}>La voix de Clutch</div>
        </div>
        <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.5,marginBottom:12}}>
          Un personnage qui signe les messages d'une phrase à lui. (D'autres voix arrivent.)
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {PERSONAS.map(p=>(
            <button key={p.key} onClick={()=>savePersona(p.key)}
              style={{flex:'1 1 calc(50% - 3px)',padding:'10px 8px',borderRadius:10,border:`1.5px solid ${persona===p.key?C.salmon:C.border}`,background:persona===p.key?`${C.salmon}1a`:C.bg,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>{p.emoji}</span>
              <div style={{textAlign:'left',minWidth:0}}>
                <div style={{fontSize:12.5,fontWeight:persona===p.key?800:600,color:persona===p.key?C.salmon:C.white}}>{p.label}</div>
                <div style={{fontSize:9.5,color:C.whiteMid,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.tag}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div style={{background:C.bgCard,borderRadius:14,overflow:'hidden',border:`1px solid ${C.border}`}}>
        {([
          {k:'live'  as const, t:'Bouton Clutch Live', d:'Le logo flottant — accès rapide à ta présence live'},
          {k:'night' as const, t:'Bouton Clutch Night', d:'La lune flottante — soirées / clubs / afters'},
        ]).map((row,idx)=>(
          <div key={row.k} onClick={()=>setFabPref(row.k,!geekPrefs[row.k])} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',cursor:'pointer',borderTop:idx>0?`1px solid ${C.border}`:'none'}}>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:C.white}}>{row.t}</div>
              <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{row.d}</div>
            </div>
            <div style={{width:46,height:27,borderRadius:14,background:geekPrefs[row.k]?C.green:C.border,position:'relative',flexShrink:0,transition:'.2s'}}>
              <div style={{position:'absolute',top:2.5,left:geekPrefs[row.k]?21.5:2.5,width:22,height:22,borderRadius:'50%',background:'#fff',transition:'.2s',boxShadow:'0 1px 3px rgba(83,41,67,.3)'}}/>
            </div>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:C.whiteMid,lineHeight:1.5,padding:'0 4px'}}>
        💡 Astuce : sur un bouton flottant, un <strong style={{color:C.salmon}}>appui long (2 s)</strong> le fixe en bas ; ré-appuie longtemps pour le relâcher. Et ils <strong style={{color:C.salmon}}>rebondissent</strong> l'un sur l'autre comme au billard 🎱.
      </div>

      {/* 🔮 À VENIR — idées captées (brain-dump David), pas encore actives. Profil = réceptacle des features complexes. */}
      <div style={{fontSize:11,fontWeight:800,letterSpacing:'.06em',color:C.salmon,margin:'8px 4px 2px'}}>🔮 À VENIR</div>
      <div style={{background:C.bgCard,borderRadius:14,border:`1px solid ${C.border}`,overflow:'hidden'}}>
        {([
          {e:'🧘', t:'Coach psy par la voix', d:'Tu dictes une situation, Clutch t\'aide à y voir clair — bienveillant mais confrontant. Et qui ne te garde PAS scotché au tél.'},
          {e:'📚', t:'Environnements (ta voix à toi)', d:'L\'app prend une couleur selon ce que tu aimes : littéraire, philo, psychologie…'},
          {e:'🌙', t:'Mood cycle (optionnel, femmes)', d:'Adapter l\'app à ton cycle si tu le souhaites — opt-in, chiffré, jamais visible par personne. (audit légal en cours)'},
        ]).map((row,idx)=>(
          <div key={row.t} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 14px',borderTop:idx>0?`1px solid ${C.border}`:'none',opacity:.85}}>
            <span style={{fontSize:18,flexShrink:0}}>{row.e}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13.5,fontWeight:700,color:C.white}}>{row.t}</div>
              <div style={{fontSize:11,color:C.whiteMid,marginTop:2,lineHeight:1.4}}>{row.d}</div>
            </div>
            <span style={{fontSize:9,fontWeight:800,color:C.salmon,background:`${C.salmon}1a`,border:`1px solid ${C.salmon}44`,borderRadius:20,padding:'3px 8px',flexShrink:0,whiteSpace:'nowrap'}}>bientôt</span>
          </div>
        ))}
      </div>
    </div>
  )

  // ── Sous-page container ─────────────────────────────────────
  const subPageTitles: Record<string,string> = {
    geek:'🧪 Geek Setup',
    edit_profil:'Moi', seeking:'Ce que je cherche',
    favorites:'Favoris', ghosted:'Ghostés',
    subscription:'Mon abonnement', preferences:'Préférences',
    security:'Sécurité & SOS', legal:'Légal', contact:'Nous contacter',
    cherche:'Ce que je cherche', algo:'Mon Clutch · l\'algo',
    secu:'Sécurité & confidentialité', compte:'Mon compte', moment:'Mood 🌙',
    fiabilite:'Ma fiabilité', temperament:'Mon tempérament', why:'Pourquoi ces propositions', distance_zones:'Les zones',
    guide:'Comprendre Clutch', pause:'Faire une pause',
  }
  // ⚠️ On stocke les FONCTIONS (pas <Page/>) et on appelle la sélectionnée au rendu.
  // Sinon chaque frappe recrée le composant → input démonté → le clavier se ferme. (Aucun hook dans ces pages.)
  const subPageContent: Record<string,()=>React.ReactNode> = {
    edit_profil: PageEditProfil,
    seeking: PageSeeking,
    favorites: PageFavorites,
    ghosted: PageGhosted,
    subscription: PageSubscription,
    preferences: PagePreferences,
    security: PageSecurity,
    legal: PageLegal,
    contact: PageContact,
    cherche: PageCherche,
    algo: PageAlgo,
    secu: PageSecu,
    compte: PageCompte,
    moment: PageMoment,
    fiabilite: PageFiabilite,
    temperament: PageTemperament,
    why: PageWhy,
    distance_zones: PageDistanceZones,
    guide: PageGuide,
    pause: PagePause,
    geek: PageGeek,
  }

  return (
    <>
    {showBotLab && <BotLab user={user} onClose={()=>setShowBotLab(false)} showToast={showToast}/>}
    {showConvDemo && <ConvergenceOverlay demo myProgress={0} otherProgress={0} mins={0} secs={0} otherName="Anaïs" venueName="Café du Marché" bothArrived={false} onClose={()=>setShowConvDemo(false)}/>}
    {showMbti && <MBTITest lang={lang} onClose={()=>{ setShowMbti(false); try{setMbtiType(localStorage.getItem('clutch_mbti')||'')}catch{} }}/>}
    <div className="fi" style={{position:'fixed',inset:0,bottom:'calc(72px + var(--sab))',background:C.bg,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'var(--sat) 0 32px'}}>

      {/* ─── HERO ─── */}
      <div style={{position:'relative',height:260,background:user.photo_url?'transparent':`linear-gradient(160deg,${C.bordeauxLight},${C.bordeaux})`,overflow:'hidden',flexShrink:0}}>
        {user.photo_url&&<img src={user.photo_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 30%'}}/>}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(42,16,32,1) 0%,rgba(42,16,32,.2) 55%,transparent 100%)'}}/>
        <div style={{position:'absolute',bottom:14,left:16,right:16}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:10,marginBottom:4}}>
            <span style={{fontSize:24,fontWeight:900,color:C.white,lineHeight:1}}>{user.name}</span>
            {(user as any).age&&<span style={{fontSize:17,fontWeight:600,color:`${C.white}aa`,lineHeight:1,paddingBottom:1}}>{(user as any).age}</span>}
            <GenderSvg gk={genderKey((user as any).gender)} size={18}/>
          </div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <TrustBadge profile={user} lang={lang} showCount={true}/>
            {(user as any).job&&<span style={{fontSize:11,color:`${C.white}88`}}>{(user as any).job}</span>}
          </div>
        </div>
      </div>

      {/* ─── BADGE FIABILITÉ (badge, pas chiffre — audit GPT + ADN : on ne montre jamais la note brute) ─── */}
      {(()=>{
        const rs = user.reliability_score ?? 100
        const lvl = rs>=90?{e:'🏆',t:'Exemplaire',c:C.green}:rs>=75?{e:'⭐',t:'Très fiable',c:C.green}:rs>=50?{e:'🟢',t:'Fiable',c:C.green}:rs>=30?{e:'🌿',t:'En construction',c:C.orange}:{e:'🌱',t:'Nouveau membre',c:C.orange}
        return (
          <div style={{padding:'10px 16px 4px',display:'flex',alignItems:'center',gap:8}}>
            <span style={{fontSize:14}}>{lvl.e}</span>
            <span style={{fontSize:12,fontWeight:800,color:lvl.c,flexShrink:0}}>{lvl.t}</span>
            <div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${rs}%`,background:lvl.c,borderRadius:2,transition:'width .4s'}}/>
            </div>
          </div>
        )
      })()}

      {/* ─── BARRE COMPLÉTION ─── */}
      {(()=>{
        const fields=[user.photo_url,user.bio,(user as any).gender,(user as any).age,(user as any).job]
        const pct=Math.round((fields.filter(Boolean).length/fields.length)*100)
        if(pct>=100) return null
        return (
          <div style={{padding:'4px 16px 0'}}>
            <div onClick={()=>setProfilePage('edit_profil')} style={{background:C.bgCard,borderRadius:10,padding:'8px 12px',border:`1px solid ${C.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:C.salmon}}>Complète ton profil · {pct}%</div>
                <div style={{height:3,background:C.border,borderRadius:2,overflow:'hidden',marginTop:4}}>
                  <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${C.bordeauxLight},${C.orange})`,borderRadius:2}}/>
                </div>
              </div>
              <span style={{color:C.whiteMid,fontSize:16}}>›</span>
            </div>
          </div>
        )
      })()}

      {/* ─── CTA DISPONIBILITÉ ─── (Version A « comme Mel » : pastille PRUNE quand dispo. NB: option verte #77BC1F en réserve si David change d'avis) */}
      <div style={{padding:'10px 16px 4px'}}>
        <button onClick={rdvBlocked&&!isAvailable?()=>showToast('RDV en cours — tu redeviendras visible 2h après ton RDV',C.orange):isAvailable?handleRetirerDispo:()=>setFlow('carte')}
          style={{width:'100%',padding:'14px 18px',borderRadius:16,cursor:'pointer',fontFamily:'inherit',
            background:isAvailable?C.bordeaux:C.bg,
            border:`1.5px solid ${isAvailable?C.bordeaux:C.border}`,
            display:'flex',alignItems:'center',justifyContent:'space-between',transition:'all .25s'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <span style={{position:'relative',width:13,height:13,flexShrink:0,display:'inline-block'}}>
              <span style={{position:'absolute',inset:0,borderRadius:'50%',background:isAvailable?C.green:C.borderStrong}}/>
              {isAvailable&&<span style={{position:'absolute',inset:-3,borderRadius:'50%',border:`2px solid ${C.green}`,animation:'availPulse 1.8s ease-out infinite'}}/>}
            </span>
            <div style={{textAlign:'left'}}>
              <div style={{fontSize:13.5,fontWeight:900,color:isAvailable?'#fff':C.white}}>
                {isAvailable?t('profile.avail.on'):t('profile.avail.off')}
              </div>
              <div style={{fontSize:10.5,color:isAvailable?'#ffffffcc':C.whiteMid,marginTop:1}}>
                {isAvailable?(t('profile.avail.sub.on').replace('{time}',(user as any).available_until?new Date((user as any).available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}):'...')):t('profile.avail.sub.off')}
              </div>
            </div>
          </div>
          <span style={{fontSize:12.5,fontWeight:800,color:isAvailable?'#fff':C.bordeaux,background:isAvailable?'#ffffff26':C.bg,borderRadius:10,padding:'5px 11px',border:`1px solid ${isAvailable?'#ffffff55':C.border}`,whiteSpace:'nowrap',flexShrink:0}}>
            {isAvailable?t('settings.remove'):t('settings.enable')}
          </span>
        </button>
        <style>{`@keyframes availPulse{0%{transform:scale(1);opacity:.7}100%{transform:scale(1.9);opacity:0}}`}</style>
      </div>

      {/* ─── BANNIÈRE BIENVENUE (didactique, dismissible, nouveaux users) ─── */}
      {!guideSeen && (
        <div style={{padding:'10px 16px 0'}}>
          <div style={{display:'flex',alignItems:'center',gap:11,background:`linear-gradient(135deg,${C.orange}14,${C.green}10)`,border:`1px solid ${C.orange}44`,borderRadius:16,padding:'12px 14px'}}>
            <span style={{fontSize:22}}>🤍</span>
            <div onClick={()=>setProfilePage('guide')} style={{flex:1,cursor:'pointer'}}>
              <div style={{fontSize:13,fontWeight:800,color:C.white}}>Bienvenue sur Clutch</div>
              <div style={{fontSize:11.5,color:C.whiteMid,marginTop:1}}>Comprendre comment ça marche, en 1 min ›</div>
            </div>
            <span onClick={markGuideSeen} style={{fontSize:16,color:C.whiteMid,cursor:'pointer',padding:'4px 6px'}}>✕</span>
          </div>
        </div>
      )}

      {/* ─── BLOC VEDETTE : Ce que je cherche EN CE MOMENT (filtres éphémères) ─── */}
      <div style={{padding:'10px 16px 4px'}}>
        <div style={{background:`linear-gradient(135deg,${C.bgCard},${C.bgCard})`,border:`1px solid ${C.border}`,borderRadius:18,padding:14}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:11}}>
            <div style={{fontSize:11,fontWeight:900,letterSpacing:'.04em',textTransform:'uppercase',color:C.salmon}}>⚡ Ce que je cherche en ce moment</div>
            {modesResetLabel() && <span style={{fontSize:9,fontWeight:800,color:C.green,background:`${C.green}1c`,borderRadius:10,padding:'2px 8px',whiteSpace:'nowrap'}}>{modesResetLabel()}</span>}
          </div>
          <div style={{fontSize:12,color:C.whiteMid,marginTop:-4,marginBottom:9,fontStyle:'italic'}}>{momentGreeting}</div>
          <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>
            {MODES.map(m=>{const on=ephModes.includes(m.k);return(
              <span key={m.k} onClick={()=>toggleMode(m.k)} style={{fontSize:12,fontWeight:700,padding:'6px 11px',borderRadius:20,cursor:'pointer',border:`1.5px solid ${on?C.orange:C.border}`,color:on?'#fff':C.whiteMid,background:on?C.orange:'transparent',transition:'all .15s'}}>{m.e} {m.l}</span>
            )})}
          </div>
          <div onClick={()=>setProfilePage('moment')} style={{marginTop:11,display:'flex',alignItems:'center',gap:9,background:C.bg,border:`1.5px dashed ${C.salmon}`,borderRadius:14,padding:'9px 12px',cursor:'pointer'}}>
            <span style={{fontSize:18}}>{moment?MOMENTS.find(m=>m.k===moment)?.e:'🌙'}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:800,color:C.white}}>{moment?MOMENTS.find(m=>m.k===moment)?.l:'Mood'}</div>
              <div style={{fontSize:11,color:C.whiteMid}}>{moment?'Actif aujourd\'hui':'Une préférence éphémère pour aujourd\'hui'}</div>
            </div>
            <span style={{fontSize:9,fontWeight:800,color:C.salmon,background:`${C.salmon}22`,borderRadius:10,padding:'2px 7px',whiteSpace:'nowrap'}}>{moment?'expire à minuit':'expire demain'}</span>
          </div>
          <div style={{fontSize:10,color:`${C.whiteMid}cc`,marginTop:9,textAlign:'center',lineHeight:1.4}}>↺ Ces envies <b style={{color:C.green}}>s'effacent toutes seules</b> — tu ne restes jamais coincé·e dans un filtre.</div>
        </div>
      </div>

      {/* ─── PORTES (poupées russes) ─── */}
      <div style={{padding:'0 16px'}}>
        {([
          {sec:'Mon profil'},
          {ic:'🧬',bg:`${C.salmon}26`,ti:'Moi',su:'Photos, bio, intérêts, langues…',pg:'edit_profil'},
          {ic:'🎯',bg:`${C.orange}22`,ti:'Ce que je cherche',su:'Genre, modes, âge, distance',pg:'cherche'},
          {ic:'✨',bg:`${C.green}22`,ti:'Mon Clutch',tag:'l\'algo',su:'Comment on me propose des gens',pg:'algo'},
          {sec:'Sécurité & compte'},
          {ic:'🔒',bg:`${C.bordeauxLight}`,ti:'Sécurité & confidentialité',su:'Visibilité, SOS, bloqués, certif',pg:'secu'},
          {ic:'⚙️',bg:C.border,ti:'Mon compte',su:'Abonnement, fiabilité, favoris, légal',pg:'compte'},
        ] as any[]).map((d,i)=> d.sec
          ? <div key={i} style={{fontSize:11,fontWeight:800,letterSpacing:'.06em',textTransform:'uppercase',color:C.whiteMid,margin:'18px 2px 6px'}}>{d.sec}</div>
          : <div key={i} onClick={()=>setProfilePage(d.pg)} style={{display:'flex',alignItems:'center',gap:13,padding:'14px 4px',cursor:'pointer',borderBottom:`1px solid ${C.border}`}}>
              <div style={{width:38,height:38,borderRadius:12,background:d.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>{d.ic}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:15,fontWeight:800,color:C.white}}>{d.ti}{d.tag&&<span style={{fontSize:9,color:C.salmon,background:`${C.salmon}22`,padding:'1px 6px',borderRadius:8,marginLeft:6}}>{d.tag}</span>}</div>
                <div style={{fontSize:12,color:C.whiteMid,marginTop:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.su}</div>
              </div>
              <span style={{color:'#c9c2c7',fontSize:19}}>›</span>
            </div>
        )}

        {/* ─── Tagline al-jabr (chasse au trésor — révélation au tap) ─── */}
        <div style={{textAlign:'center',padding:'26px 12px 8px',borderTop:`1px solid ${C.border}`,marginTop:18}}>
          <div onClick={()=>setSecretOpen(o=>!o)} style={{fontSize:13,fontStyle:'italic',color:C.salmon,letterSpacing:'.02em',cursor:'pointer'}}>« Réunir ce qui était séparé. »</div>
          {secretOpen && (
            <div style={{fontSize:11,color:C.whiteMid,marginTop:11,lineHeight:1.55,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'12px 14px',textAlign:'left'}}>
              🗝️ <b style={{color:C.white}}>Tu as trouvé.</b><br/>Le mot « algèbre » vient de <b style={{color:C.salmon}}>al-jabr</b> — au IXᵉ siècle, ça voulait dire « réunir ce qui était séparé ». Retrouver l'inconnu, le <i>x</i> qu'on cherche.<br/>C'est exactement ce que fait Clutch. 🟣
            </div>
          )}
        </div>

        {/* 👁 NOTE ÉQUIPE — visible David + Mel uniquement (isAdmin) */}
        {isAdmin && (
          <div style={{margin:'10px 0',border:'1px dashed #dc2626',background:'rgba(220,38,38,.06)',borderRadius:12,padding:'10px 12px'}}>
            <div style={{fontSize:9,fontWeight:800,color:'#f87171',letterSpacing:'.06em'}}>👁 NOTE ÉQUIPE (toi + Mel — invisible des users)</div>
            <div style={{fontSize:11,color:'#fca5a5',marginTop:4,lineHeight:1.45}}>Noms de code internes : <b>al-jabr</b> (réunir ce qui était séparé → la Convergence) · 🪆 <b>Matryoshka</b> (ce profil en couches = poupées russes). Âme érudite côté équipe, jamais imposée aux users. La tagline FR + la structure imbriquée le font RESSENTIR. Filtres « du moment » = éphémères (reset 18h / minuit) : on ne reste jamais coincé.</div>
          </div>
        )}

        {/* 🧪 DEV — Reset test rapide. À RETIRER avant la sortie publique App Store.
            cf mémoire project_test_features_to_remove. N'agit QUE sur le compte connecté. */}
        {SH('🧪 Test (dev)')}
        <MCard>
          <MRow icon="🔄" label="Reset test complet" sub="Clutchs + cooldowns + lapins + events + Verrou → tu revois tout le monde" onTap={async()=>{
            if(!user?.id) return
            const diag = (msg:string,color:string)=>{ try{ window.dispatchEvent(new CustomEvent('clutch:diag',{detail:{msg,color}})) }catch{} }
            hap('medium'); diag('⏳ Reset en cours…', C.orange)  // feedback IMMÉDIAT + PERSISTANT (bandeau)
            // PAS de window.confirm (bloqué WebView iOS). On VÉRIFIE l'effet réel (.select()) = combien de lignes
            // touchées → on AFFICHE le compte (preuve que ça a pris + diagnostic RLS si 0).
            const rC = await supabase.from('clutches').update({status:'cancelled',expires_at:new Date().toISOString()})
              .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
              .in('status',['pending','accepted','confirmed','checked_in','declined']).select('id')   // 'declined' inclus → vide le cooldown 48h (trigger DB) pour les tests
            // 🧹 Mes lapins (rdv_feedbacks « absent » me masquent les gens 48h). ⚠️ RLS peut bloquer le DELETE.
            const lapinsAvant = (await supabase.from('rdv_feedbacks').select('to_id').eq('from_id', user.id).eq('outcome','absent')).data?.length || 0
            const rF = await supabase.from('rdv_feedbacks').delete().eq('from_id', user.id).select('to_id')
            const rE = await supabase.from('event_participants').delete().eq('user_id', user.id).select('event_id')
            try{ await supabase.from('event_waitlist').delete().eq('user_id', user.id) }catch{}
            await supabase.from('profiles').update({rdv_locked_until:null,rdv_locked_from:null,is_available:false,available_until:null}).eq('id',user.id)
            const nC=rC.data?.length||0, nF=rF.data?.length||0, nE=rE.data?.length||0
            const blocked = lapinsAvant>0 && nF===0  // avait des lapins mais 0 supprimé = RLS bloque
            diag(
              blocked
                ? `⚠️ Reset : ${nC} clutchs · ${nE} events OK, MAIS ${lapinsAvant} lapin(s) NON supprimé(s) (RLS bloque). → colle le SQL de Claude.`
                : `✅ Reset OK : ${nC} clutchs annulés · ${nF} lapin(s) supprimé(s) · ${nE} events. Recharge l'app.`,
              blocked ? C.red : C.green,
            )
          }}/>
          {isAdmin && <MRow icon="🤖" label="Générateur de bots" sub="Activer/piloter des bots pour tout tester seul" onTap={()=>setShowBotLab(true)}/>}
          {isAdmin && <MRow icon={showBots?'🤖':'🫥'} label={showBots?'Mode DÉMO (bots visibles)':'Mode RÉEL (app vide)'} sub={showBots?'Tape pour passer en RÉEL — app vide, pour tester avec de vrais amis':'Tape pour repasser en DÉMO — bots étiquetés, pour visualiser'} onTap={()=>{ const nv=!showBots; try{localStorage.setItem('clutch_demo_mode',nv?'1':'0')}catch{}; setDemoMode(nv); showToast(nv?'🤖 Mode Démo — bots visibles':'🫥 Mode Réel — app vide',nv?C.gold:C.whiteMid) }}/>}
          {/* 🔔 Test notifs : s'envoie À SOI-MÊME une push de chaque type → tu vérifies qu'elles
              S'AFFICHENT sur ton tél (utile avec un seul téléphone). Espacées pour qu'iOS les montre toutes. */}
          <MRow icon="🔔" label="Tester les notifications" sub="M'envoie une push de test → le bandeau en haut affiche le résultat OneSignal (marche aussi sur le web pour diagnostiquer)" onTap={()=>{
            if(!user?.id){ showToast('Connecte-toi d\'abord',C.orange); return }
            hap('medium')
            // Push de test À SOI-MÊME (app native = marche ; web = pas d'abonnement → 0 destinataire, normal).
            // Résultat dans le bandeau persistant en haut.
            pushTo(user.id, '🔔 Test Clutch', 'Si tu vois cette bannière, les notifs marchent !', { type:'test' })
            showToast('🔔 Push de test envoyée — regarde le bandeau + ton écran',C.green)
          }}/>
        </MCard>

        {/* ── Footer pro / business (version + Lausanne 🇨🇭 + feedback bêta) ── */}
        <div style={{textAlign:'center',padding:'30px 16px 6px'}}>
          <div style={{display:'flex',justifyContent:'center',marginBottom:10,opacity:.95}}><ClutchMark size={36}/></div>
          <div style={{fontSize:13,fontWeight:900,letterSpacing:2.5,color:C.salmon}}>CLUTCH <span style={{fontWeight:600,color:`${C.whiteMid}cc`,letterSpacing:1}}>{V}</span></div>
          <div style={{fontSize:11,color:`${C.whiteMid}aa`,marginTop:7}}>Designed in Lausanne <span style={{fontSize:12}}>🇨🇭</span> · © 2026</div>
          <div style={{fontSize:10,color:`${C.whiteMid}66`,marginTop:3,fontStyle:'italic'}}>La vraie vie, maintenant.</div>

          <button onClick={()=>onFeedback?.()} style={{marginTop:20,padding:'13px 22px',borderRadius:14,background:C.orange,border:'none',color:'#fff',fontSize:13.5,fontWeight:800,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 5px 16px rgba(235,107,175,.4)'}}>
            💌 Un mot au boss ?
          </button>
          <div style={{fontSize:10,color:`${C.whiteMid}66`,marginTop:9,lineHeight:1.5}}>Vocal (max 5 min) ou texte — ça arrive direct<br/>chez les créateurs ✦ Merci de tester Clutch 🙏</div>
        </div>

        <div style={{height:16}}/>
      </div>

      {/* ─── SOUS-PAGE (slide depuis la droite) ─── */}
      {profilePage && (
        <div ref={swipeOverlayRef} onTouchStart={onSwipeStart} onTouchMove={onSwipeMove} onTouchEnd={onSwipeEnd}
          style={{position:'fixed',inset:0,bottom:'calc(72px + var(--sab))',background:C.bg,zIndex:300,overflowY:'auto',WebkitOverflowScrolling:'touch',willChange:'transform'}}>
          {/* Header */}
          <div style={{position:'sticky',top:0,background:C.bg,borderBottom:`1px solid ${C.border}`,padding:'calc(var(--sat) + 16px) 16px 12px',display:'flex',alignItems:'center',gap:12,zIndex:2}}>
            <button onClick={()=>{popPage();setEditField(null)}}
              style={{background:'none',border:'none',color:C.salmon,fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',gap:4,padding:'4px 0',flexShrink:0}}>
              ‹ Retour
            </button>
            <span style={{fontSize:16,fontWeight:800,color:C.white,flex:1,textAlign:'center'}}>{subPageTitles[profilePage]||''}</span>
            <div style={{width:60}}/>
          </div>
          <div style={{padding:'12px 16px 32px'}}>
            {subPageContent[profilePage]?.()}
          </div>
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
// RÈGLE SÉCURITÉ PERMANENTE : ce radar montre le temps restant avant le RDV,
// JAMAIS la distance GPS à l'autre personne. Si on ajoute un vrai GPS proximity
// en v2, il doit montrer la distance au LIEU DU RDV (le café), pas à la personne.
// Raison : un homme malveillant pourrait se déplacer dans la ville pour triangulariser
// où habite la femme en observant les variations de distance. → INTERDIT.
// ═════════════════════════════════════════════════════════════
// ═══ CONVERGENCE — animation immersive : deux nuages (toi + l'autre) convergent vers le LIEU (étoile verte),
//     avec un battement de cœur qui se synchronise. Nom de code interne : "al-jabr" (réunir ce qui était séparé). ═══
function ConvergenceOverlay({ myProgress, otherProgress, mins, secs, otherName, venueName, bothArrived, onClose, demo=false }:{
  myProgress:number; otherProgress:number; mins:number; secs:number; otherName:string; venueName:string; bothArrived:boolean; onClose:()=>void; demo?:boolean;
}) {
  const cvRef = useRef<HTMLCanvasElement|null>(null)
  // DEMO : la progression s'anime toute seule (loin → on se rejoint) en boucle, pour prévisualiser l'animation.
  const [demoProg,setDemoProg] = useState(0)
  useEffect(()=>{ if(!demo) return; let p=0; const iv=setInterval(()=>{ p+=0.011; if(p>1.25)p=0; setDemoProg(Math.min(1,p)) },90); return ()=>clearInterval(iv) },[demo])
  const effA = demo ? demoProg : myProgress
  const effB = demo ? Math.max(0, demoProg-0.05) : otherProgress
  const dMins = demo ? Math.max(0,Math.round((1-demoProg)*12)) : mins
  const dSecs = demo ? Math.max(0,Math.round((1-demoProg)*45)) : secs
  const dArrived = demo ? demoProg>0.96 : bothArrived
  const progRef = useRef({ a: effA, b: effB })
  progRef.current = { a: effA, b: effB }
  useEffect(()=>{
    const cv = cvRef.current; if(!cv) return
    const ctx = cv.getContext('2d'); if(!ctx) return
    const DPR = Math.min(2, (typeof window!=='undefined'?window.devicePixelRatio:1)||1)
    const resize=()=>{ cv.width=cv.offsetWidth*DPR; cv.height=cv.offsetHeight*DPR; ctx.setTransform(DPR,0,0,DPR,0,0) }
    resize(); window.addEventListener('resize',resize)
    const N=80
    const mk=()=>Array.from({length:N},()=>({a:Math.random()*Math.PI*2,r:0.5+Math.random()*0.55,sz:0.6+Math.random()*2.2,tw:Math.random()*Math.PI*2,sp:0.2+Math.random()*0.8}))
    const A=mk(), B=mk()
    const ROSE='235,107,176', PLUM='130,70,108', GREEN='119,188,31'
    // battement de cœur : double pic (lub-dub) sur ~1.1s
    const hb=(p:number)=>{ p=p%1; const b=(x:number,c:number,w:number)=>Math.exp(-((x-c)**2)/(2*w*w)); return b(p,0.0,0.045)+0.6*b(p,0.16,0.05) }
    let raf=0
    const draw=(t:number)=>{
      const W=cv.offsetWidth, H=cv.offsetHeight, cx=W/2, cy=H*0.46, base=Math.min(W,H)*0.34
      ctx.clearRect(0,0,W,H)
      const ea=progRef.current.a*progRef.current.a*(3-2*progRef.current.a)
      const eb=progRef.current.b*progRef.current.b*(3-2*progRef.current.b)
      // étoile verte = LE LIEU
      const both=(ea+eb)/2
      const pulse=0.5+0.5*Math.sin(t*0.003)
      const gR=8+both*16+pulse*4
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,gR*4)
      grd.addColorStop(0,`rgba(${GREEN},${0.45+both*0.5})`); grd.addColorStop(0.3,`rgba(${GREEN},${0.2+both*0.3})`); grd.addColorStop(1,'rgba(119,188,31,0)')
      ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,gR*4,0,7); ctx.fill()
      ctx.fillStyle=`rgba(${GREEN},0.9)`; ctx.beginPath(); ctx.arc(cx,cy,gR*0.6,0,7); ctx.fill()
      const cloud=(p:any[], e:number, ang:number, color:string, hbPhase:number)=>{
        const beat=1+0.13*hb(t*0.00085+hbPhase)*(0.4+e*0.6) // cœur qui bat, plus fort en s'approchant
        const orbit=base*(1-e*0.84)
        const ccx=cx+Math.cos(ang)*orbit, ccy=cy+Math.sin(ang)*orbit
        const spread=(base*0.34)*(1-e*0.65)*beat
        for(const s of p){
          const px=ccx+Math.cos(s.a+t*0.0004*s.sp)*s.r*spread
          const py=ccy+Math.sin(s.a+t*0.0004*s.sp)*s.r*spread
          const tw=0.45+0.55*Math.sin(t*0.004*s.sp+s.tw)
          const d2c=Math.hypot(px-cx,py-cy)/base
          const g=Math.max(0,1-d2c)*e
          const col=g>0.45?GREEN:color
          ctx.fillStyle=`rgba(${col},${tw*(0.3+e*0.7)})`
          ctx.beginPath(); ctx.arc(px,py,s.sz*(0.8+e*0.6),0,7); ctx.fill()
        }
      }
      // déphasage des cœurs qui se RÉSORBE quand on se rapproche (synchronisation)
      const sync=1-Math.min(ea,eb)
      cloud(A, ea, -Math.PI*0.78, PLUM, 0)            // toi (prune), haut-gauche
      cloud(B, eb, Math.PI*0.22, ROSE, 0.5*sync)      // l'autre (rose), bas-droite
      raf=requestAnimationFrame(draw)
    }
    raf=requestAnimationFrame(draw)
    return ()=>{ cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  },[])
  return (
    <div style={{position:'fixed',inset:0,zIndex:5000,background:'radial-gradient(120% 90% at 50% 40%,#1a0f1e 0%,#0b0610 72%)',display:'flex',flexDirection:'column'}}>
      <canvas ref={cvRef} style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
      <div style={{position:'relative',zIndex:2,textAlign:'center',marginTop:'calc(var(--sat) + 54px)'}}>
        {demo&&<div style={{fontSize:10,fontWeight:800,letterSpacing:'.1em',color:'#77BC1F',marginBottom:6}}>✦ APERÇU</div>}
        <div style={{fontSize:12,fontWeight:700,letterSpacing:'.14em',textTransform:'uppercase',color:'#8a7d86'}}>{dArrived?'Vous y êtes':'Vous vous rapprochez'}</div>
        <div style={{fontSize:24,fontWeight:800,color:'#fff',marginTop:4}}>{otherName}</div>
      </div>
      <div style={{position:'relative',zIndex:2,marginTop:'auto',textAlign:'center',marginBottom:'calc(var(--sab) + 40px)'}}>
        <div style={{fontSize:52,fontWeight:800,color:'#fff',lineHeight:1,letterSpacing:'-.02em'}}>{dArrived?'✦':(dMins<1?`${dSecs}s`:`${dMins} min`)}</div>
        <div style={{fontSize:14,color:'#9a8d96',marginTop:8,fontWeight:600}}>{dArrived?<>{otherName} est <b style={{color:'#77BC1F'}}>au lieu</b></>:<>Rendez-vous à <b style={{color:'#77BC1F'}}>{venueName}</b></>}</div>
        <button onClick={onClose} style={{marginTop:22,background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.2)',color:'#fff',borderRadius:30,padding:'10px 22px',fontSize:13,fontWeight:700,fontFamily:'inherit',cursor:'pointer'}}>{demo?'Fermer l\'aperçu':'Revenir à l\'app'}</button>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// 🌙 CLUTCH NIGHT (prototype) — mode nuit : soirées/clubs/afters + rayon élargi (« on accepte de se
// déplacer plus loin pour une vraie sortie »). Idée David. Données mock, à brancher V2.
// ════════════════════════════════════════════════════════════════════
function ClutchNightOverlay({ onClose, onActivate }:{ onClose:()=>void; onActivate:()=>void }) {
  const NIGHT = [
    {e:'🎶', n:'D Club Lausanne',     d:'Techno night · dès 23h',  far:'Flon · 4 km'},
    {e:'🍸', n:'Le Bourg',           d:'Concert + DJ set · 22h',   far:'Vieille Ville · 3 km'},
    {e:'🎷', n:'After Jazz',         d:'Jam jusqu\'à l\'aube',     far:'Ouchy · 6 km'},
    {e:'🌃', n:'Rooftop sunset',     d:'Apéro & vue · 21h',        far:'Prilly · 9 km'},
  ]
  return (
    <div style={{position:'fixed',inset:0,zIndex:5000,background:'radial-gradient(120% 90% at 50% 25%,#532943 0%,#2C1020 55%,#160a12 100%)',display:'flex',flexDirection:'column',overflowY:'auto'}}>
      <div style={{padding:'calc(var(--sat) + 40px) 22px calc(var(--sab) + 28px)',flex:1,display:'flex',flexDirection:'column'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:60,filter:'drop-shadow(0 0 18px rgba(235,107,175,.6))'}}>🌙</div>
          <div style={{fontSize:30,fontWeight:900,color:'#fff',marginTop:6,letterSpacing:'-.02em'}}>Clutch <span style={{color:'#EB6BAF'}}>Night</span></div>
          <div style={{fontSize:13.5,color:'#e8d8e4',marginTop:10,lineHeight:1.55,maxWidth:300,marginLeft:'auto',marginRight:'auto'}}>Ce soir, on sort. Les soirées, clubs et afters près de toi — et un peu <b style={{color:'#77BC1F'}}>plus loin que d'habitude</b> 🚆</div>
        </div>
        <div style={{display:'inline-flex',alignSelf:'center',alignItems:'center',gap:7,marginTop:16,background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.16)',borderRadius:20,padding:'6px 13px'}}>
          <span style={{fontSize:13}}>📍</span><span style={{fontSize:11.5,color:'#fff',fontWeight:700}}>Rayon élargi · jusqu'à 25 km</span>
        </div>
        <div style={{marginTop:22,display:'flex',flexDirection:'column',gap:10}}>
          {NIGHT.map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:13,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:16,padding:'12px 14px'}}>
              <div style={{width:44,height:44,borderRadius:13,background:'rgba(235,107,175,.16)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{c.e}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14.5,fontWeight:800,color:'#fff'}}>{c.n}</div>
                <div style={{fontSize:11.5,color:'#cbb8c6',marginTop:1}}>{c.d}</div>
              </div>
              <div style={{fontSize:10.5,color:'#9a8d96',fontWeight:600,flexShrink:0}}>{c.far}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'auto',paddingTop:22}}>
          <button onClick={onActivate} style={{width:'100%',padding:'16px',borderRadius:18,border:'none',background:'linear-gradient(135deg,#EB6BAF,#532943)',color:'#fff',fontSize:16,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>🌙 Activer Clutch Night ce soir</button>
          <button onClick={onClose} style={{width:'100%',padding:'13px',marginTop:8,borderRadius:16,border:'none',background:'transparent',color:'#cbb8c6',fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>Plus tard</button>
          <div style={{fontSize:10,color:'#7a6d76',textAlign:'center',marginTop:8}}>Prototype · les soirées réelles arriveront avec les partenaires</div>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// 🥚 ÉPHÉMÈRE — Coucou à Mel (À RETIRER AU PROCHAIN BUILD). Visible UNIQUEMENT pour Mel, 1 fois.
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
// FloatingFabs — 2 boutons flottants : Clutch Live (logo) + Clutch Night (lune).
// Physique : throw + friction + rebond sur les bords + COLLISION billard entre les deux.
// Long-press 2s → dock fixe au-dessus de Contacts / Profil ; re-long-press → libère.
// Tap court → ouvre la feature. Positions/dock persistés en localStorage.
// Affichage pilotable par l'utilisateur (Geek Setup → masquer/afficher chaque bouton).
// ════════════════════════════════════════════════════════════════════
type FabBall = { id:'live'|'night'; x:number; y:number; vx:number; vy:number; docked:boolean }
// 🔔 Bannière notifs — DISCRÈTE : s'affiche seulement en natif SI les notifs sont coupées, dismissable.
function NotifBanner({ lang }:{ lang:Lang }) {
  const [show,setShow] = useState(false)
  useEffect(()=>{ let on=true; (async()=>{
    try{ if(localStorage.getItem('clutch_notif_banner')==='off') return }catch{}
    try{ const m:any = await import('@/lib/onesignal'); const g = await m.notifGranted(); if(on && g===false) setShow(true) }catch{}
  })(); return ()=>{on=false} },[])
  if(!show) return null
  return (
    <div style={{position:'fixed',top:'calc(var(--sat) + 6px)',left:10,right:10,zIndex:1500,background:'linear-gradient(120deg,#532943,#2C1020)',borderRadius:14,padding:'9px 10px 9px 13px',display:'flex',alignItems:'center',gap:9,boxShadow:'0 4px 16px rgba(83,41,67,.4)',animation:'modalIn .3s ease'}}>
      <span style={{fontSize:17,flexShrink:0}}>🔔</span>
      <div style={{flex:1,minWidth:0,fontSize:11.5,color:'#fff',lineHeight:1.3}}>{lang==='en'?'Turn on notifications so you don\'t miss a Clutch':'Active les notifs pour ne rien rater d\'un Clutch'}</div>
      <button onClick={async()=>{ try{ const m:any = await import('@/lib/onesignal'); await m.enableNotifs() }catch{}; setShow(false) }} style={{background:'#77BC1F',border:'none',borderRadius:10,color:'#fff',fontSize:11,fontWeight:800,padding:'6px 12px',cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>{lang==='en'?'Enable':'Activer'}</button>
      <button onClick={()=>{ try{localStorage.setItem('clutch_notif_banner','off')}catch{}; setShow(false) }} aria-label="Fermer" style={{background:'transparent',border:'none',color:'rgba(255,255,255,.55)',fontSize:15,cursor:'pointer',padding:'0 2px',flexShrink:0}}>✕</button>
    </div>
  )
}

function FloatingFabs({ showLive, showNight, hidden, onTapLive, onTapNight }:{
  showLive:boolean; showNight:boolean; hidden:boolean; onTapLive:()=>void; onTapNight:()=>void;
}) {
  const SZ=52, R=26
  const metrics = () => {
    let sat=0,sab=0
    try{const cs=getComputedStyle(document.documentElement);sat=parseInt(cs.getPropertyValue('--sat'))||0;sab=parseInt(cs.getPropertyValue('--sab'))||0}catch{}
    const w=typeof window!=='undefined'?window.innerWidth:390
    const h=typeof window!=='undefined'?window.innerHeight:780
    return {sat,sab,w,h, minX:8, maxX:w-SZ-8, minY:sat+50, maxY:h-72-sab-SZ-10}
  }
  // slot de dock : index 3 = Contacts, index 4 = Profil (nav à 5 colonnes), juste au-dessus de la barre
  const dockSlot = (navIdx:number) => { const m=metrics(); return { x:(navIdx+0.5)/5*m.w - SZ/2, y: m.h - m.sab - 72 - SZ - 2 } }
  const clampXY = (x:number,y:number) => { const m=metrics(); return { x:Math.min(m.maxX,Math.max(m.minX,x)), y:Math.min(m.maxY,Math.max(m.minY,y)) } }
  const loadBall = (id:'live'|'night'): FabBall => {
    const m=metrics()
    try{ const s=localStorage.getItem('clutch_fab_'+id); if(s){ const o=JSON.parse(s); const c=clampXY(o.x,o.y); const b:FabBall={id,x:c.x,y:c.y,vx:0,vy:0,docked:!!o.docked}; if(b.docked){const d=dockSlot(id==='live'?3:4); b.x=d.x; b.y=d.y} return b } }catch{}
    return { id, x:m.maxX, y: id==='live'? m.maxY : m.maxY-66, vx:0, vy:0, docked:false }  // défaut : empilés à droite
  }
  const balls = useRef<FabBall[]>([loadBall('live'), loadBall('night')])
  const [,force] = useState(0); const rerender = ()=>force(n=>(n+1)%1000000)
  const [pressing,setPressing] = useState<number|null>(null)  // feedback visuel pendant l'appui long
  const raf = useRef(0)
  const drag = useRef<{i:number;sx:number;sy:number;ox:number;oy:number;moved:boolean;lx:number;ly:number;lt:number;vx:number;vy:number;lp:boolean}|null>(null)
  const lpTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const persist = (b:FabBall) => { try{ localStorage.setItem('clutch_fab_'+b.id, JSON.stringify({x:b.x,y:b.y,docked:b.docked})) }catch{} }

  const physics = () => {
    const m=metrics(); const fr=0.94, bo=0.62; const arr=balls.current
    arr.forEach(b=>{
      if(b.docked) return
      b.x+=b.vx; b.y+=b.vy
      if(b.x<m.minX){b.x=m.minX;b.vx=-b.vx*bo} else if(b.x>m.maxX){b.x=m.maxX;b.vx=-b.vx*bo}
      if(b.y<m.minY){b.y=m.minY;b.vy=-b.vy*bo} else if(b.y>m.maxY){b.y=m.maxY;b.vy=-b.vy*bo}
      b.vx*=fr; b.vy*=fr
    })
    // 🎱 COLLISION billard entre les deux (centres = pos + R)
    if(showLive&&showNight){
      const a=arr[0], c=arr[1]
      const dx=(c.x+R)-(a.x+R), dy=(c.y+R)-(a.y+R); const dist=Math.hypot(dx,dy)
      if(dist>0.0001 && dist<SZ){
        const nx=dx/dist, ny=dy/dist, overlap=SZ-dist
        if(!a.docked && !c.docked){
          const vn=(a.vx-c.vx)*nx+(a.vy-c.vy)*ny
          if(vn>0){ const j=-(1+bo)*vn/2; a.vx+=j*nx; a.vy+=j*ny; c.vx-=j*nx; c.vy-=j*ny }
          a.x-=nx*overlap/2; a.y-=ny*overlap/2; c.x+=nx*overlap/2; c.y+=ny*overlap/2
        } else if(!a.docked){ // c docké = immobile → a rebondit dessus
          const va=a.vx*nx+a.vy*ny; if(va>0){ a.vx-=(1+bo)*va*nx; a.vy-=(1+bo)*va*ny }
          a.x-=nx*overlap; a.y-=ny*overlap
        } else if(!c.docked){
          const vc=c.vx*(-nx)+c.vy*(-ny); if(vc>0){ c.vx-=(1+bo)*vc*(-nx); c.vy-=(1+bo)*vc*(-ny) }
          c.x+=nx*overlap; c.y+=ny*overlap
        }
      }
    }
    rerender()
    if(arr.some(b=>!b.docked && Math.hypot(b.vx,b.vy)>0.4)){ raf.current=requestAnimationFrame(physics) }
    else { arr.forEach(persist) }
  }

  const onDown=(i:number,e:React.PointerEvent)=>{
    cancelAnimationFrame(raf.current)
    const el=e.currentTarget as HTMLElement; try{el.setPointerCapture(e.pointerId)}catch{}
    const b=balls.current[i]
    drag.current={i,sx:e.clientX,sy:e.clientY,ox:b.x,oy:b.y,moved:false,lx:e.clientX,ly:e.clientY,lt:e.timeStamp,vx:0,vy:0,lp:false}
    setPressing(i)
    if(lpTimer.current) clearTimeout(lpTimer.current)
    lpTimer.current=setTimeout(()=>{   // appui long ~700ms → GARER (dock) / libérer. Ne JAMAIS ouvrir la feature.
      const d=drag.current; if(!d||d.moved)return; d.lp=true; setPressing(null)
      const bb=balls.current[d.i]; bb.docked=!bb.docked
      if(bb.docked){ const s=dockSlot(d.i===0?3:4); bb.x=s.x; bb.y=s.y } ; bb.vx=0; bb.vy=0
      persist(bb); rerender(); try{ (navigator as any).vibrate?.(30) }catch{}
    },700)
  }
  const onMove=(e:React.PointerEvent)=>{
    const d=drag.current; if(!d)return
    const dx=e.clientX-d.sx, dy=e.clientY-d.sy
    if(!d.moved && (Math.abs(dx)>5||Math.abs(dy)>5)){ d.moved=true; setPressing(null); if(lpTimer.current)clearTimeout(lpTimer.current); balls.current[d.i].docked=false }
    if(d.moved){
      const dt=Math.max(1,e.timeStamp-d.lt); d.vx=(e.clientX-d.lx)/dt*16; d.vy=(e.clientY-d.ly)/dt*16; d.lx=e.clientX; d.ly=e.clientY; d.lt=e.timeStamp
      const m=metrics(); const bb=balls.current[d.i]
      bb.x=Math.min(m.maxX,Math.max(m.minX,d.ox+dx)); bb.y=Math.min(m.maxY,Math.max(m.minY,d.oy+dy)); rerender()
    }
  }
  const onUp=()=>{
    if(lpTimer.current)clearTimeout(lpTimer.current)
    setPressing(null)
    const d=drag.current; drag.current=null; if(!d)return
    if(d.lp){ rerender(); return }   // c'était un GARAGE (dock/undock) → ne JAMAIS ouvrir
    if(!d.moved){ d.i===0?onTapLive():onTapNight(); rerender(); return }
    const bb=balls.current[d.i]; bb.vx=d.vx; bb.vy=d.vy
    if(Math.hypot(d.vx,d.vy)>0.6){ cancelAnimationFrame(raf.current); raf.current=requestAnimationFrame(physics) } else persist(bb)
    rerender()
  }
  useEffect(()=>()=>{ cancelAnimationFrame(raf.current); if(lpTimer.current)clearTimeout(lpTimer.current) },[])
  // 🛟 Re-cadrage : si une position stockée (localStorage) vient d'une autre taille d'écran, elle peut être
  // HORS écran → le bouton devient invisible. On re-clampe au montage + à chaque resize. (Bug David : boutons absents.)
  useEffect(()=>{
    const reclamp = () => { balls.current.forEach(b=>{ if(b.docked){const d=dockSlot(b.id==='live'?3:4); b.x=d.x; b.y=d.y} else { const c=clampXY(b.x,b.y); b.x=c.x; b.y=c.y } }); persist(balls.current[0]); persist(balls.current[1]); rerender() }
    reclamp()
    window.addEventListener('resize', reclamp)
    return ()=>window.removeEventListener('resize', reclamp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[])

  const fab = (i:number, content:React.ReactNode, label:string) => {
    const b=balls.current[i]; const dragging=!!drag.current && drag.current.i===i; const press=pressing===i
    return <button key={b.id} className={(!b.docked && !dragging && !press)?'cl-fab':undefined} aria-label={label}
      onPointerDown={(e)=>onDown(i,e)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      style={{ position:'fixed', left:b.x, top:b.y, zIndex:1200, width:SZ, height:SZ, borderRadius:'50%', touchAction:'none',
        // Fond TRANSPARENT : le cercle violet foncé + le néon viennent du SVG de Mel (CLUTCH_*_v3) → il va jusqu'au bord.
        background:'transparent', border:'none', cursor:'grab', display:'flex', alignItems:'center', justifyContent:'center', padding:0, overflow:'visible',
        transform: press?'scale(0.86)':undefined, transition: press?'transform .65s cubic-bezier(.4,0,.2,1)':'transform .15s',
        boxShadow: press?'0 2px 10px rgba(44,16,32,.45)' : (b.docked?'0 2px 8px rgba(44,16,32,.3)':undefined) }}>{content}</button>
  }
  return (<>
    <style>{`
      @keyframes clBeat{0%,100%{transform:scale(1)}12%{transform:scale(1.05)}24%{transform:scale(1)}36%{transform:scale(1.03)}50%{transform:scale(1)}}
      @keyframes clGlow{0%,100%{box-shadow:0 0 0 0 rgba(235,107,175,0),0 4px 14px rgba(44,16,32,.30)}12%{box-shadow:0 0 22px 7px rgba(235,107,175,.55),0 4px 14px rgba(44,16,32,.30)}36%{box-shadow:0 0 14px 4px rgba(235,107,175,.35),0 4px 14px rgba(44,16,32,.30)}}
      @keyframes clFloat{0%,100%{translate:0 0}50%{translate:0 -6px}}
      .cl-fab{animation:clBeat 3.6s ease-in-out infinite,clFloat 5.2s ease-in-out infinite}
      @media (prefers-reduced-motion:reduce){.cl-fab{animation:none}}
    `}</style>
    {!hidden && showLive && fab(0, <img src="/icons/CLUTCH_live.png" width={SZ} height={SZ} alt="" draggable={false} style={{pointerEvents:'none',display:'block'}}/>, 'Clutch Live — lance-moi, ou appui long pour fixer')}
    {!hidden && showNight && fab(1, <img src="/icons/CLUTCH_night.png" width={SZ} height={SZ} alt="" draggable={false} style={{pointerEvents:'none',display:'block'}}/>, 'Clutch Night — lance-moi, ou appui long pour fixer')}
  </>)
}

// QuickSOS — bouclier de sécurité DISCRET, visible UNIQUEMENT pendant un RDV actif.
// Demande David : la sécurité doit être à 1 geste PENDANT le rendez-vous (pas enfoui dans le profil).
// Garde-fou anti-faux-positif : le bouclier ouvre une feuille → 1 tap envoie (rapide mais délibéré).
// Réutilise la logique sos_sessions + /sos?t=token (partage position EN DIRECT aux contacts choisis).
// ════════════════════════════════════════════════════════════════════
function QuickSOS({ user, supabase: sb, lang, showToast }:{ user:any; supabase:any; lang:Lang; showToast:(m:string,c?:string)=>void }) {
  const [open,setOpen] = useState(false)
  const [liveToken,setLiveToken] = useState<string|null>(null)
  const watchRef = useRef<number|null>(null)
  const isFr = lang==='fr'
  const readContacts = () => { try { const r=JSON.parse(localStorage.getItem(`clutch_sos_${user.id}`)||'{}'); return Array.isArray(r.contacts)?r.contacts:((r.name||r.phone)?[{name:r.name||'',phone:r.phone||''}]:[]) } catch { return [] } }
  const sendLive = async () => {
    const pseudo = user?.name || (isFr?'Quelqu\'un':'Someone')
    const contacts = readContacts().filter((c:any)=>c.phone?.trim())
    let token:string|null = null
    try { const { data } = await sb.from('sos_sessions').insert({ user_id:user.id, user_name:pseudo, active:true }).select('token').single(); token=(data as any)?.token||null } catch {}
    if (token && navigator.geolocation) {
      if (watchRef.current!=null) navigator.geolocation.clearWatch(watchRef.current)
      watchRef.current = navigator.geolocation.watchPosition(
        pos => { sb.from('sos_sessions').update({ lat:pos.coords.latitude, lng:pos.coords.longitude, updated_at:new Date().toISOString() }).eq('token', token as string).then(()=>{}) },
        ()=>{}, { enableHighAccuracy:true, maximumAge:5000 })
      setLiveToken(token)
    }
    const link = token ? `${window.location.origin}/sos?t=${token}` : ''
    const share = (locTxt:string) => {
      const text = token
        ? `🆘 ${pseudo} ${isFr?'a besoin d\'aide. Suis ma position EN DIRECT':'needs help. Follow my LIVE location'} : ${link}`
        : `🆘 ${pseudo} ${isFr?'a besoin d\'aide.':'needs help.'}${locTxt}`
      if ((navigator as any).share) (navigator as any).share({ title:'Clutch SOS', text }).catch(()=>{})
      else if (contacts.length) window.location.href = `sms:/open?addresses=${encodeURIComponent(contacts.map((c:any)=>c.phone.trim()).join(','))}&body=${encodeURIComponent(text)}`
      else showToast(isFr?'Ajoute un contact SOS dans Profil → Sécurité':'Add an SOS contact in Profile → Security', C.orange)
    }
    if (token) share('')
    else if (navigator.geolocation) navigator.geolocation.getCurrentPosition(pos=>share(` https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`), ()=>share(''), { timeout:6000, enableHighAccuracy:true })
    else share('')
    if (typeof navigator!=='undefined' && (navigator as any).vibrate) (navigator as any).vibrate([20,40,20])
  }
  const stopLive = async () => {
    if (watchRef.current!=null && navigator.geolocation) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current=null }
    if (liveToken) { try { await sb.from('sos_sessions').update({ active:false }).eq('token', liveToken) } catch {}; setLiveToken(null) }
    showToast(isFr?'Partage de position arrêté':'Location sharing stopped', C.orange)
  }
  return (<>
    <button onClick={()=>setOpen(true)} aria-label={isFr?'Sécurité':'Safety'}
      style={{position:'fixed', left:14, bottom:'calc(72px + var(--sab) + 14px)', zIndex:1150, width:44, height:44, borderRadius:'50%',
        border:`1.5px solid ${liveToken?'#dc2626':C.border}`, background: liveToken?'#dc2626':'rgba(255,255,255,0.94)', backdropFilter:'blur(8px)',
        display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', boxShadow:'0 3px 12px rgba(83,41,67,.22)',
        animation: liveToken?'sosPulse 1.2s ease-in-out infinite':'none'}}>
      <span style={{fontSize:20,lineHeight:1}}>{liveToken?'📡':'🛡️'}</span>
    </button>
    {open && (
      <div onClick={()=>setOpen(false)} style={{position:'fixed',inset:0,zIndex:1300,background:'rgba(20,10,18,.45)',display:'flex',alignItems:'flex-end'}}>
        <div onClick={e=>e.stopPropagation()} style={{width:'100%',background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:'20px 18px calc(var(--sab) + 22px)',boxShadow:'0 -8px 30px rgba(0,0,0,.2)'}}>
          <div style={{width:38,height:4,borderRadius:2,background:C.border,margin:'0 auto 16px'}}/>
          <div style={{fontSize:17,fontWeight:900,color:C.white,marginBottom:6}}>🛡️ {isFr?'Ta sécurité':'Your safety'}</div>
          <div style={{fontSize:12.5,color:C.whiteMid,lineHeight:1.5,marginBottom:16}}>{isFr?'Tu es pendant un rendez-vous. En un geste, tes proches reçoivent ta position en direct.':'You\'re on a meetup. In one tap, your contacts get your live location.'}</div>
          {!liveToken ? (
            <button onClick={()=>{ sendLive(); setOpen(false) }} style={{width:'100%',padding:'16px',borderRadius:16,border:'none',background:'#dc2626',color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>📍 {isFr?'Envoyer ma position à mes proches':'Send my live location'}</button>
          ) : (
            <button onClick={()=>{ stopLive(); setOpen(false) }} style={{width:'100%',padding:'16px',borderRadius:16,border:`1.5px solid ${C.border}`,background:'transparent',color:C.white,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',marginBottom:10}}>⏹ {isFr?'Arrêter le partage en direct':'Stop live sharing'}</button>
          )}
          <a href="tel:117" style={{display:'block',textAlign:'center',width:'100%',boxSizing:'border-box',padding:'14px',borderRadius:16,border:`1.5px solid ${C.border}`,background:C.bgCard,color:'#dc2626',fontSize:14,fontWeight:800,textDecoration:'none',marginBottom:12}}>📞 {isFr?'Appeler la police (117)':'Call police (117)'}</a>
          <div style={{fontSize:10.5,color:C.whiteMid,textAlign:'center',lineHeight:1.5}}>{isFr?'Discret — la personne en face ne voit rien. Tes contacts se règlent dans Profil → Sécurité.':'Discreet — the other person sees nothing. Set contacts in Profile → Security.'}</div>
          <button onClick={()=>setOpen(false)} style={{width:'100%',padding:'12px',marginTop:8,borderRadius:14,border:'none',background:'transparent',color:C.whiteMid,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>{isFr?'Fermer':'Close'}</button>
        </div>
      </div>
    )}
    <style>{`@keyframes sosPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}`}</style>
  </>)
}

function ProximityRadar({ verrou, userId, lang, onClick, onCheckin, onTerminer, onRetardAck, supabase: sb }:{ verrou:any; userId:string; lang:Lang; onClick:()=>void; onCheckin?:()=>void; onTerminer?:()=>void; onRetardAck?:()=>void; supabase?:any }) {
  const [showConv, setShowConv] = useState(false)
  const [checkinHint,setCheckinHint] = useState('')  // indice « trop loin / pas l'heure » au tap sur J'y suis bloqué
  const [now,setNow] = useState(new Date())
  const [myPos,setMyPos] = useState<{lat:number,lng:number,ts:number}|null>(null)
  const [otherPos,setOtherPos] = useState<{lat:number,lng:number}|null>(null)
  // Doppler : direction de déplacement (-1=recul, 0=arrêt, 1=approche) + vitesse relative
  const [dopplerDir, setDopplerDir] = useState<-1|0|1>(0)
  const [dopplerSpeed, setDopplerSpeed] = useState(0) // 0-1
  const prevDistRef = useRef<{km:number,ts:number}|null>(null)
  const dopplerTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null)
  // Refus retard — Mel peut ajouter un message, David doit acquitter
  const [showRefuseInput, setShowRefuseInput] = useState(false)
  const [refuseMsg, setRefuseMsg] = useState('')
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),1000); return()=>clearInterval(t) },[])

  const isSenderRef = useRef(verrou.sender_id === userId)

  // GPS watch + push toutes les 5s dans clutches
  useEffect(()=>{
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    const isSnd = isSenderRef.current
    const latField = isSnd ? 'sender_cur_lat' : 'receiver_cur_lat'
    const lngField = isSnd ? 'sender_cur_lng' : 'receiver_cur_lng'
    let lastPush = 0
    const id = navigator.geolocation.watchPosition(
      pos => {
        setMyPos({lat:pos.coords.latitude, lng:pos.coords.longitude, ts:Date.now()})
        const now = Date.now()
        if (sb && now - lastPush > 5000) {
          lastPush = now
          sb.from('clutches').update({[latField]:pos.coords.latitude,[lngField]:pos.coords.longitude})
            .eq('id', verrou.id).then(()=>{})
        }
      },
      ()=>{}, { enableHighAccuracy:true, maximumAge:0, timeout:10000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  },[sb, verrou.id])

  // Realtime — écoute la position de l'autre
  useEffect(()=>{
    if (!sb || !verrou.id) return
    const isSnd = isSenderRef.current
    const otherLatField = isSnd ? 'receiver_cur_lat' : 'sender_cur_lat'
    const otherLngField = isSnd ? 'receiver_cur_lng' : 'sender_cur_lng'
    // Init depuis les données existantes
    const initLat = verrou[otherLatField], initLng = verrou[otherLngField]
    if (initLat && initLng) setOtherPos({lat:initLat, lng:initLng})
    const ch = sb.channel(`radar-other-${verrou.id}`)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'clutches',filter:`id=eq.${verrou.id}`},
        (payload:any)=>{
          const lat = payload.new[otherLatField], lng = payload.new[otherLngField]
          if (lat && lng) setOtherPos({lat, lng})
        })
      .subscribe()
    return () => { sb.removeChannel(ch) }
  },[sb, verrou.id])

  const rdv = new Date(verrou.proposed_time)
  const diffMs = rdv.getTime()-now.getTime()
  if (diffMs > 30*60*1000 || diffMs < -3*60*60*1000) return null
  const past = diffMs < 0
  const mins = Math.floor(Math.abs(diffMs)/60000)
  const secs = Math.floor((Math.abs(diffMs)%60000)/1000)

  const isSender = verrou.sender_id === userId
  // Profils : essayer sender/receiver joints, sinon chercher dans l'objet directement
  const other = isSender ? (verrou.receiver || verrou._receiver) : (verrou.sender || verrou._sender)
  const myPhoto = isSender ? (verrou.sender?.photo_url || verrou._sender?.photo_url) : (verrou.receiver?.photo_url || verrou._receiver?.photo_url)

  // J'y suis indépendant par personne (nouveaux champs sender_arrived / receiver_arrived)
  const myArrived   = isSender ? !!verrou.sender_arrived   : !!verrou.receiver_arrived
  const otherArrived = isSender ? !!verrou.receiver_arrived : !!verrou.sender_arrived
  const bothArrived  = !!verrou.sender_arrived && !!verrou.receiver_arrived

  // GPS distances
  const vLat = verrou.venue_lat, vLng = verrou.venue_lng
  const myDistKm   = (vLat && vLng && myPos)    ? haversineKm(myPos.lat,    myPos.lng,    vLat, vLng) : null
  const otherDistKm = (vLat && vLng && otherPos) ? haversineKm(otherPos.lat, otherPos.lng, vLat, vLng) : null
  const timePct = past ? 100 : Math.max(0, 100-(diffMs/(10*60*1000))*100)

  // Adresse : prendre la partie après "·" si elle existe (évite d'afficher juste "18")
  const venueParts = (verrou.venue||'').split('·')
  const venueStreet = venueParts.length>1 ? venueParts.slice(1).join('·').trim() : venueParts[0].trim()
  const venueName = venueStreet || (lang==='en'?'Meeting point':'Lieu RDV')

  // Animation GPS : 200m = bord, 15m = centre
  const GPS_ANIM_FAR = 0.2, GPS_ANIM_NEAR = 0.015
  const calcOffset = (distKm: number | null, fallbackPct: number) => {
    const pct = distKm !== null
      ? Math.max(0, Math.min(100, ((GPS_ANIM_FAR - distKm) / (GPS_ANIM_FAR - GPS_ANIM_NEAR)) * 100))
      : fallbackPct
    return (pct / 100) * 90
  }
  const MAX_OFFSET = 90
  const myOffsetPx    = calcOffset(myDistKm,    past ? 90 : timePct * 0.7)
  const otherOffsetPx = otherArrived ? MAX_OFFSET : calcOffset(otherDistKm, 0)

  // Doppler : détecte direction + vitesse à chaque update GPS
  useEffect(()=>{
    if (myDistKm === null || myArrived) return
    const now = Date.now()
    const prev = prevDistRef.current
    if (prev && now - prev.ts > 500 && now - prev.ts < 15000) {
      const deltaDist = myDistKm - prev.km   // négatif = approche, positif = recul
      const deltaT = (now - prev.ts) / 1000  // secondes
      const speed = Math.min(1, Math.abs(deltaDist) / deltaT / 0.05) // normalisé 0-1
      if (Math.abs(deltaDist) > 0.001) { // seuil 1m
        setDopplerDir(deltaDist < 0 ? 1 : -1)
        setDopplerSpeed(speed)
        if (dopplerTimerRef.current) clearTimeout(dopplerTimerRef.current)
        dopplerTimerRef.current = setTimeout(()=>{ setDopplerDir(0); setDopplerSpeed(0) }, 3000)
      }
    }
    prevDistRef.current = { km: myDistKm, ts: now }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myDistKm])

  // J'y suis : 25m David (test précis), 100m autres
  const DAVID_ID = 'bad38f3e-87df-40e0-a2d2-75c03b58d72b'
  const gpsThreshold = userId === DAVID_ID ? 0.025 : 0.100
  const canCheckin = !myArrived && (
    (myDistKm !== null && myDistKm < gpsThreshold) ||
    (myDistKm === null && past)
  )
  const col = bothArrived ? C.green : otherArrived ? C.orange : past ? C.orange : C.salmon

  const distLabel = (km: number | null) => {
    if (bothArrived) return null
    if (km === null) return <span style={{color:'#B2B2B2',fontSize:11}}>GPS…</span>
    if (km < 0.015) return <span style={{color:'#77BC1F',fontWeight:800,fontSize:12}}>Sur place ✓</span>
    if (km < 1) return <span style={{color:'#4A2A3D',fontWeight:700,fontSize:12}}>{Math.round(km*1000)}m du lieu</span>
    return <span style={{color:'#532943',fontWeight:700,fontSize:12}}>{km.toFixed(2)}km du lieu</span>
  }

  return (
    <>
      <style>{`
        @keyframes jySuisPulse{0%,100%{transform:scale(1);box-shadow:0 0 0 0 rgba(119,188,31,.5)}50%{transform:scale(1.03);box-shadow:0 0 0 8px rgba(119,188,31,0)}}
        @keyframes rdvBlink{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes sonarOut{0%{opacity:.7;transform:scale(0)}60%{opacity:.25}100%{opacity:0;transform:scale(1)}}
      `}</style>
      {showConv && <ConvergenceOverlay myProgress={Math.min(1,myOffsetPx/90)} otherProgress={Math.min(1,otherOffsetPx/90)} mins={mins} secs={secs} otherName={other?.name?.split(' ')[0]||'...'} venueName={venueName} bothArrived={bothArrived} onClose={()=>setShowConv(false)}/>}
      <div onClick={()=>setShowConv(true)} style={{
        position:'fixed',bottom:84,left:10,right:10,zIndex:1400,
        background:'#ffffff',
        border:`2px solid ${col}`,borderRadius:20,padding:'10px 12px 10px',cursor:'pointer',
        boxShadow:`0 8px 28px rgba(0,0,0,.35)`,
      }}>

        {/* Ligne 1 : timer + retard + adresse + heure RDV */}
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{flexShrink:0,minWidth:52}}>
            {bothArrived
              ? <div style={{fontSize:13,color:'#77BC1F',fontWeight:900}}>🎉 Top !</div>
              : <div style={{fontSize:20,fontWeight:900,color:past?'#EB6BAF':'#4A2A3D',fontVariantNumeric:'tabular-nums',fontFamily:'monospace',lineHeight:1}}>
                  {past ? '0:00' : `${mins}:${String(secs).padStart(2,'0')}`}
                </div>}
          </div>
          {Number(verrou.retard_min) > 0 && (
            <div style={{flexShrink:0,padding:'2px 7px',borderRadius:8,background:'rgba(235,107,175,.12)',border:'1px solid rgba(235,107,175,.4)',color:'#EB6BAF',fontSize:11,fontWeight:900}}>
              +{verrou.retard_min}min
            </div>
          )}
          <div style={{flex:1,overflow:'hidden'}}>
            <div style={{fontSize:11,color:'#532943',fontWeight:800,letterSpacing:'.03em',textTransform:'uppercase',
              overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              📍 {venueName}
            </div>
            <div style={{fontSize:11,color:'#6F6F6E',fontWeight:700}}>
              RDV {new Date(verrou.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
              {Number(verrou.retard_min) > 0 && <span style={{color:'#EB6BAF'}}> → {new Date(new Date(verrou.proposed_time).getTime()+Number(verrou.retard_min)*60000).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}</span>}
              {(verrou as any).is_quick_date && <span style={{color:C.orange,marginLeft:4}}>⚡ Quick Date</span>}
            </div>
            {(verrou as any).is_quick_date && (() => {
              const endTime = new Date(verrou.proposed_time).getTime() + 60*60*1000
              const over = Date.now() > endTime
              if (!over) return null
              return <div style={{fontSize:10,color:C.orange,fontWeight:800,marginTop:2}}>⏱ Ton heure est écoulée — libre de partir 👋</div>
            })()}
          </div>
        </div>

        {/* Ligne 2 : track avec photos animées */}
        <div style={{position:'relative',height:70,marginBottom:4}}>
          <div style={{position:'absolute',left:28,right:28,top:28,height:2,
            background:`linear-gradient(90deg,transparent,${col} 20%,${col} 80%,transparent)`,opacity:.4}}/>
          <div style={{position:'absolute',left:'50%',top:20,transform:'translateX(-50%)',fontSize:14,lineHeight:1,zIndex:2}}>📍</div>

          {/* Doppler rendu inline — voir avatars ci-dessous */}

          {/* Ma photo + ondes Doppler */}
          {(()=>{
            const comp = dopplerDir===0 ? 1 : Math.max(0.35, Math.min(0.95, 1-dopplerSpeed*0.65))
            const xOff = dopplerDir * Math.min(14, dopplerSpeed*18) // décalage vers direction
            const wc = dopplerDir===1?'#77BC1F':dopplerDir===-1?'#EB6BAF':'#B2B2B2'
            const dur = dopplerDir===0 ? 2.4 : Math.max(0.8, 2.4-dopplerSpeed*1.2)
            return (
              <div style={{position:'absolute',left:0,top:4,transform:`translateX(${myOffsetPx}px)`,transition:'transform 1.2s ease'}}>
                <div style={{position:'relative',width:48,height:48}}>
                  {/* Ondes sonar centrées sur l'avatar */}
                  {!myArrived && (
                    <svg style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',overflow:'visible',pointerEvents:'none',width:0,height:0}}>
                      {[0,1,2].map(i=>(
                        <ellipse key={i} cx={xOff} cy={0} rx={28*comp} ry={28}
                          fill="none" stroke={wc} strokeWidth={1.6-i*0.4}
                          style={{animation:`sonarOut ${dur}s ease-out ${i*(dur/3)}s infinite`}}/>
                      ))}
                    </svg>
                  )}
                  <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',position:'relative',zIndex:1,
                    backgroundImage:myPhoto?`url(${myPhoto})`:'none',backgroundSize:'cover',backgroundPosition:'center',
                    backgroundColor:'#e8d0c8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
                    border:`3px solid ${myArrived?'#77BC1F':col}`,
                    boxShadow:myArrived?`0 0 0 3px #77BC1F33`:`0 2px 8px rgba(0,0,0,.2)`}}>
                    {!myPhoto&&'👤'}
                  </div>
                  {myArrived&&<div style={{position:'absolute',bottom:-2,right:-2,width:17,height:17,borderRadius:'50%',zIndex:2,
                    background:'#77BC1F',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,
                    border:'2px solid #fff',fontWeight:900,color:'#fff'}}>✓</div>}
                </div>
              </div>
            )
          })()}

          {/* Photo autre + ondes (cercles simples — on n'a pas sa direction) */}
          <div style={{position:'absolute',right:0,top:4,transform:`translateX(${-otherOffsetPx}px)`,transition:'transform 1.2s ease'}}>
            <div style={{position:'relative',width:48,height:48}}>
              {!otherArrived && (
                <svg style={{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',overflow:'visible',pointerEvents:'none',width:0,height:0}}>
                  {[0,1,2].map(i=>(
                    <ellipse key={i} cx={0} cy={0} rx={28} ry={28}
                      fill="none" stroke="#B2B2B2" strokeWidth={1.4-i*0.3}
                      style={{animation:`sonarOut 2.4s ease-out ${i*0.8}s infinite`}}/>
                  ))}
                </svg>
              )}
              <div style={{width:48,height:48,borderRadius:'50%',overflow:'hidden',position:'relative',zIndex:1,
                backgroundImage:other?.photo_url?`url(${other.photo_url})`:'none',backgroundSize:'cover',backgroundPosition:'center',
                backgroundColor:'#e8d0c8',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,
                border:`3px solid ${otherArrived?'#77BC1F':col}`,
                boxShadow:otherArrived?`0 0 0 3px #77BC1F33`:`0 2px 8px rgba(0,0,0,.2)`}}>
                {!other?.photo_url&&'👤'}
              </div>
              {otherArrived&&<div style={{position:'absolute',bottom:-2,left:-2,width:17,height:17,borderRadius:'50%',zIndex:2,
                background:'#77BC1F',display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,
                border:'2px solid #fff',fontWeight:900,color:'#fff'}}>✓</div>}
            </div>
          </div>
        </div>

        {/* Retard 30min — états pour les deux personnes */}
        {Number(verrou.retard_min) === 30 && (()=>{
          const iAmLate = verrou.retard_by === userId
          const iNeedToDecide = !iAmLate && verrou.retard_by && verrou.retard_accepted == null

          // Je suis en retard — je vois le statut de ma demande
          if (iAmLate) {
            if (verrou.retard_accepted === true) return (
              <div style={{background:'rgba(119,188,31,.08)',border:'1px solid rgba(119,188,31,.3)',borderRadius:12,padding:'10px 12px',marginBottom:8,textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:900,color:'#77BC1F',marginBottom:2}}>✓ Retard accepté</div>
                <div style={{fontSize:11,color:'#5a8a6a',lineHeight:1.5}}>Ton partenaire t'attend — prends ton temps 🙏</div>
              </div>
            )
            if (verrou.retard_accepted === false) {
              // Blocking gate — David doit acquitter avant de continuer
              const ackKey = `retard_ack_${verrou.id}`
              const alreadyAcked = typeof localStorage !== 'undefined' && localStorage.getItem(ackKey)
              if (alreadyAcked) return null
              const refuserMsg = verrou.cancel_message || null
              return (
                <div style={{position:'absolute',inset:0,background:'rgba(42,16,32,.97)',borderRadius:16,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 20px',gap:14,zIndex:99}}>
                  <div style={{fontSize:28}}>😔</div>
                  <div style={{fontSize:15,fontWeight:900,color:'#dc2626',textAlign:'center'}}>Retard refusé</div>
                  <div style={{fontSize:12,color:'#EB6BAF',lineHeight:1.6,textAlign:'center'}}>
                    {other?.name||'Ton partenaire'} n'a pas pu t'attendre.
                    {refuserMsg && <><br/><span style={{fontStyle:'italic',color:'#f5e8de',marginTop:6,display:'block'}}>«&nbsp;{refuserMsg}&nbsp;»</span></>}
                  </div>
                  <div style={{fontSize:11,color:'rgba(83,41,67,.6)',textAlign:'center',lineHeight:1.5}}>
                    Ce Clutch est annulé.<br/>Ton score de fiabilité est légèrement impacté.
                  </div>
                  <button onClick={async e=>{
                    e.stopPropagation()
                    try { localStorage.setItem(ackKey,'1') } catch {}
                    // Malus fiabilité léger (-3 pts)
                    try {
                      const {data:prof} = await sb?.from('profiles').select('reliability_score').eq('id',userId).single()
                      const cur = prof?.reliability_score ?? 100
                      await sb?.from('profiles').update({reliability_score:Math.max(0,cur-3)}).eq('id',userId)
                    } catch {}
                    onRetardAck ? onRetardAck() : onClick()
                  }} style={{width:'100%',padding:'13px',borderRadius:12,border:'none',background:'#EB6BAF',color:'#fff',fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',letterSpacing:.3}}>
                    J'ai compris
                  </button>
                </div>
              )
            }
            // En attente de réponse
            return (
              <div style={{background:'rgba(235,107,175,.06)',border:'1px solid rgba(235,107,175,.2)',borderRadius:12,padding:'8px 12px',marginBottom:8,textAlign:'center'}}>
                <div style={{fontSize:11,fontWeight:700,color:'#EB6BAF'}}>⏳ En attente de réponse de {other?.name||'ton partenaire'}…</div>
              </div>
            )
          }

          // C'est l'autre qui est en retard — je dois décider
          if (iNeedToDecide) return (
            <div style={{background:'rgba(235,107,175,.08)',border:'1px solid rgba(235,107,175,.35)',borderRadius:12,padding:'10px 12px',marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:800,color:'#EB6BAF',marginBottom:8,textAlign:'center'}}>
                ⏰ {other?.name||'Partenaire'} sera 30 min en retard
              </div>
              {showRefuseInput ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <input
                    value={refuseMsg}
                    onChange={e=>setRefuseMsg(e.target.value.slice(0,60))}
                    placeholder="Un mot pour expliquer… (optionnel)"
                    maxLength={60}
                    autoFocus
                    onClick={e=>e.stopPropagation()}
                    style={{width:'100%',padding:'9px 12px',borderRadius:10,border:'1px solid rgba(220,38,38,.4)',background:'rgba(220,38,38,.06)',color:'#f5e8de',fontSize:12,fontFamily:'inherit',boxSizing:'border-box',outline:'none'}}
                  />
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={e=>{e.stopPropagation();setShowRefuseInput(false);setRefuseMsg('')}}
                      style={{flex:1,padding:'8px',borderRadius:10,border:'1px solid rgba(83,41,67,.3)',background:'transparent',color:'#EB6BAF',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      ← Retour
                    </button>
                    <button onClick={async e=>{
                      e.stopPropagation()
                      await sb?.from('clutches').update({retard_accepted:false,status:'cancelled',cancel_message:refuseMsg||null,cancel_by:userId}).eq('id',verrou.id)
                    }} style={{flex:2,padding:'8px',borderRadius:10,border:'none',background:'#dc2626',color:'#fff',fontSize:13,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                      Confirmer le refus
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex',gap:8}}>
                  <button onClick={async e=>{
                    e.stopPropagation()
                    await sb?.from('clutches').update({retard_accepted:true}).eq('id',verrou.id)
                  }} style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'#77BC1F',color:'#fff',fontSize:13,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                    ✓ OK, j'attends
                  </button>
                  <button onClick={e=>{
                    e.stopPropagation()
                    setShowRefuseInput(true)
                  }} style={{flex:1,padding:'9px',borderRadius:10,border:'none',background:'#dc2626',color:'#fff',fontSize:13,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                    ✗ Refuser
                  </button>
                </div>
              )}
            </div>
          )

          return null
        })()}

        {bothArrived ? (
          <div style={{textAlign:'center',padding:'4px 0 2px'}}>
            <div style={{fontSize:14,fontWeight:900,color:'#77BC1F',marginBottom:6}}>🎉 Les deux sur place !</div>
            {past ? (
              <button onClick={e=>{e.stopPropagation();hap('success');onTerminer?.()}}
                style={{width:'100%',padding:'10px',borderRadius:12,border:'none',background:'#77BC1F',
                  color:'#fff',fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',
                  boxShadow:'0 3px 12px rgba(119,188,31,.4)',letterSpacing:.3}}>
                ✓ Terminer le RDV
              </button>
            ) : (
              <div style={{width:'100%',padding:'10px',borderRadius:12,background:'rgba(119,188,31,.12)',
                border:'1px solid rgba(119,188,31,.3)',color:'#5a9418',fontSize:12,fontWeight:700,fontFamily:'inherit'}}>
                ⏳ Profitez du moment ! Vous pourrez clore le RDV à partir de l'heure prévue.
              </div>
            )}
          </div>
        ) : (
          <div style={{display:'flex',gap:6,marginTop:2}}>
            {/* Moi — gauche */}
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'flex-start',gap:4}}>
              <div>{distLabel(myDistKm)}</div>
              {!myArrived ? (
                <>
                <button onClick={e=>{
                    e.stopPropagation()
                    if(canCheckin){ hap('success'); onCheckin?.() }
                    else { hap('warning'); setCheckinHint(myDistKm!==null ? (lang==='en'?`Too far — ${Math.round(myDistKm*1000)}m from the spot`:`Trop loin — ${Math.round(myDistKm*1000)}m du lieu`) : (lang==='en'?'Waiting for GPS / not time yet':'GPS en attente / pas encore l\'heure')); setTimeout(()=>setCheckinHint(''),2800) }
                  }}
                  style={{padding:'7px 12px',borderRadius:10,border:'none',fontFamily:'inherit',fontSize:13,fontWeight:900,
                    cursor:'pointer',
                    background:canCheckin?'#77BC1F':'#E3E3E3',
                    color:canCheckin?'#fff':'#B2B2B2',
                    animation:canCheckin?'jySuisPulse 1.5s ease-in-out infinite':undefined}}>
                  ✓ {"J'y suis !"}
                </button>
                {checkinHint && <div style={{fontSize:10,color:C.orange,fontWeight:700,marginTop:2,maxWidth:140}}>{checkinHint}</div>}
                </>
              ) : (
                <div style={{fontSize:13,color:'#77BC1F',fontWeight:900}}>✓ Arrivé·e</div>
              )}
            </div>
            {/* L'autre — droite */}
            <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4}}>
              {otherDistKm !== null
                ? <div style={{color:'#4A2A3D',fontWeight:700,fontSize:12}}>{Math.round(otherDistKm*1000)}m du lieu</div>
                : <div style={{fontSize:12,color:'#532943',fontWeight:700}}>{other?.name||''}</div>}
              <div style={{fontSize:13,color:otherArrived?'#77BC1F':'#B2B2B2',fontWeight:otherArrived?900:500}}>
                {otherArrived?'✓ Arrivé·e':'En route…'}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ═════════════════════════════════════════════════════════════
// ONBOARDING — 4 slides skippables (affiché 1 seule fois)
// ═════════════════════════════════════════════════════════════
function OnboardingScreen({onDone, isPreview}:{onDone:()=>void; isPreview?:boolean}) {
  const [slide, setSlide] = useState(0)
  const slides = [
    {
      icon:'🔒',
      title:'Bienvenue sur Clutch',
      body:'L\'app qui transforme une envie de sortir en vrai rendez-vous — en 18h max.',
    },
    {
      icon:'⚡',
      title:'Comment ça marche ?',
      body:'Tu te rends disponible avec un créneau et un lieu. Tu envoies un Clutch. L\'autre accepte. Vous y allez.',
      steps:['👁 Tu es disponible','⚡ Tu envoies un Clutch','🔒 Le Verrou se ferme'],
    },
    {
      icon:'⭐',
      title:'La réputation compte',
      body:'À l\'heure = +2pts · Venu·e = +1pt · Lapin = −5pts. Un bon score donne plus de visibilité.',
      scores:[{l:'À l\'heure',c:'#4ade80',v:'+2'},{l:'Venu·e',c:'#fb923c',v:'+1'},{l:'Lapin 🐰',c:'#f87171',v:'−5'}],
    },
    {
      icon:'🆘',
      title:'Ta sécurité d\'abord',
      body:'Bouton SOS configurable, profils vérifiés, signalement en 2 taps. Tu restes toujours en contrôle.',
      pills:['🔍 Profils vérifiés','🚫 Signalement facile','📍 Partage de position'],
    },
  ]
  const s = slides[slide]
  const isLast = slide === slides.length - 1
  return (
    <div style={{position:'fixed',inset:0,background:C.bg,display:'flex',flexDirection:'column',padding:'32px 24px 40px',zIndex:3000}}>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={onDone} style={{background:'none',border:'none',color:`${C.whiteMid}`,fontSize:13,cursor:'pointer',fontFamily:'inherit',padding:'4px 8px'}}>
          Passer →
        </button>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center',gap:20}}>
        <div style={{textAlign:'center',fontSize:56,lineHeight:1,marginBottom:4}}>{s.icon}</div>
        <div style={{textAlign:'center',color:C.white,fontSize:22,fontWeight:900,letterSpacing:'-.4px',lineHeight:1.2}}>{s.title}</div>
        <div style={{textAlign:'center',color:C.whiteMid,fontSize:14,lineHeight:1.7}}>{s.body}</div>
        {s.steps && (
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
            {s.steps.map((st,i)=>(
              <div key={i} style={{background:C.bgCard,borderRadius:12,padding:'12px 16px',color:C.white,fontSize:13,fontWeight:600,border:`1px solid ${C.border}`}}>{st}</div>
            ))}
          </div>
        )}
        {s.scores && (
          <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:4}}>
            {s.scores.map((sc,i)=>(
              <div key={i} style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'10px 14px',textAlign:'center'}}>
                <div style={{color:sc.c,fontSize:20,fontWeight:900}}>{sc.v}</div>
                <div style={{color:C.whiteMid,fontSize:10,marginTop:2}}>{sc.l}</div>
              </div>
            ))}
          </div>
        )}
        {s.pills && (
          <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:4}}>
            {s.pills.map((p,i)=>(
              <div key={i} style={{background:'rgba(74,222,128,.08)',border:'1px solid rgba(74,222,128,.2)',borderRadius:12,padding:'10px 16px',color:C.white,fontSize:13}}>{p}</div>
            ))}
          </div>
        )}
      </div>
      {/* Dots */}
      <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:20}}>
        {slides.map((_,i)=>(
          <div key={i} onClick={()=>setSlide(i)} style={{width:i===slide?20:8,height:8,borderRadius:4,background:i===slide?C.gold:`${C.border}`,transition:'all .3s',cursor:'pointer'}}/>
        ))}
      </div>
      <button onClick={()=>isLast?onDone():setSlide(slide+1)}
        style={{width:'100%',padding:'14px',background:C.gold,border:'none',borderRadius:20,color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
        {isLast ? 'C\'est parti !' : 'Suivant'}
      </button>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// SETUP WIZARD — Compléter son profil (après 1ère inscription)
// ═════════════════════════════════════════════════════════════
function SetupWizard({user, onDone, showToast, isPreview}:{user:Profile; onDone:(p:Profile)=>void; showToast:(m:string,c?:string)=>void; isPreview?:boolean}) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  // Champs
  const [photoUrl, setPhotoUrl] = useState(user.photo_url||'')
  const [cropSrc, setCropSrc] = useState<string|null>(null)
  const [name, setName] = useState(user.name||'')
  const [age, setAge] = useState<string>(user.age?(user.age+''):'')
  const [gender, setGender] = useState<'M'|'F'|'NB'>((user as any).gender||'')
  const [lookingFor, setLookingFor] = useState<'M'|'F'|'ALL'>((user as any).looking_for||'ALL')
  const [bio, setBio] = useState(user.bio||'')
  const [job, setJob] = useState(user.job||'')
  const [jobCategory, setJobCategory] = useState((user as any).job_category||'')
  const [city, setCity] = useState((user as any).available_city||'Lausanne')
  const JOB_CATS = [
    '💻 Tech','🎨 Créatif','📸 Photo/Vidéo','📣 Marketing','💰 Finance',
    '⚕️ Santé','⚖️ Droit','📚 Éducation','🍕 Cuisine/Chef','🎵 Musique',
    '🏗 Architecture','🛍 Commerce','🏃 Sport/Coach','✈️ Tourisme','🔬 Sciences',
    '🔧 Artisan/Bricolage','⚡ Électricité','🪵 Menuiserie','🔩 Mécanique','✂️ Coiffure/Beauté',
    '🌱 Agriculture/Nature','🎭 Théâtre/Scène','🎬 Cinéma/Télé','📊 Consulting','🏠 Immobilier',
    '👗 Mode/Textile','🌍 ONG/Social','🍷 Sommellerie/Cave','🐾 Animaux/Véto','Autre'
  ]
  const TOTAL = 5

  const pickPhoto = async (file:File) => {
    showToast('Upload de la photo…', C.salmon)
    const ext = ((file.name.split('.').pop()||'jpg').toLowerCase().match(/[a-z0-9]+/)?.[0]) || 'jpg'
    const path = `${user.id}/avatar_${Date.now()}.${ext}`
    const {error} = await supabase.storage.from('avatars').upload(path, file, {upsert:true, contentType:file.type||undefined})
    if (error) { showToast('Erreur upload photo : '+error.message,C.red); return }
    const {data:{publicUrl}} = supabase.storage.from('avatars').getPublicUrl(path)
    setPhotoUrl(publicUrl)
    showToast('✓ Photo ajoutée', C.green)
  }

  const saveAndContinue = async () => {
    if (step === 0 && !photoUrl) { showToast('Ajoute une photo pour continuer',C.orange); return }
    if (step === 1 && (!name.trim() || !age || !gender)) { showToast('Tous les champs sont requis',C.orange); return }
    if (step < TOTAL - 1) { setStep(step+1); return }
    // Dernière étape → sauvegarder tout
    if (isPreview) {
      showToast('🎉 Fin de la démo ! Crée un compte pour continuer.', C.green)
      setTimeout(() => onDone(user), 1500)
      return
    }
    setSaving(true)
    // gender mappé vers les valeurs acceptées par la contrainte DB (man/woman/nb)
    const dbGender = gender==='M'?'man':gender==='F'?'woman':'nb'
    const payload:any = {
      name: name.trim(),
      age: parseInt(age)||null,
      gender: dbGender,
      looking_for: lookingFor,
      // bio : on garde la catégorie métier si le métier libre est vide (la colonne job_category n'existe pas)
      bio: bio.trim()||null,
      job: job.trim()||jobCategory||null,
      photo_url: photoUrl||null,
      available_city: city||'Lausanne',
    }
    // update + fallback upsert si la ligne profil n'existe pas encore (bug Supabase .update() silencieux)
    let {data, error} = await supabase.from('profiles').update(payload).eq('id',user.id).select().maybeSingle()
    if (!error && !data) {
      const up = await supabase.from('profiles').upsert({ id:user.id, ...payload }).select().maybeSingle()
      data = up.data; error = up.error
    }
    setSaving(false)
    if (error) { showToast('Erreur sauvegarde: '+error.message, C.red); return }
    showToast('✓ Profil créé !', C.green)
    onDone((data || {...user, ...payload}) as Profile)
  }

  const GenderBtn = ({v,label}:{v:'M'|'F'|'NB',label:string}) => (
    <button onClick={()=>setGender(v)} style={{flex:1,padding:'12px 8px',borderRadius:14,border:`2px solid ${gender===v?C.gold:C.border}`,background:gender===v?`${C.gold}22`:C.bgCard,color:gender===v?C.gold:C.white,fontSize:13,fontWeight:gender===v?700:400,cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>{label}</button>
  )
  const LookBtn = ({v,label,icon}:{v:'M'|'F'|'ALL',label:string,icon:string}) => (
    <button onClick={()=>setLookingFor(v)} style={{flex:1,padding:'14px 8px',borderRadius:14,border:`2px solid ${lookingFor===v?C.gold:C.border}`,background:lookingFor===v?`${C.gold}22`:C.bgCard,color:lookingFor===v?C.gold:C.white,fontSize:12,fontWeight:lookingFor===v?700:400,cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:4,transition:'all .2s'}}>
      <span style={{fontSize:22}}>{icon}</span>{label}
    </button>
  )

  const steps = [
    // Step 0 : Photo
    <div key={0} style={{display:'flex',flexDirection:'column',gap:20,alignItems:'center'}}>
      <div style={{color:C.white,fontSize:20,fontWeight:800,textAlign:'center'}}>Ajoute ta photo</div>
      <div style={{color:C.whiteMid,fontSize:13,textAlign:'center'}}>Ta photo est obligatoire. Elle rassure les autres utilisateurs.</div>
      <label style={{cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
        <div style={{width:110,height:110,borderRadius:'50%',border:`3px dashed ${photoUrl?C.gold:C.border}`,overflow:'hidden',background:C.bgCard,display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
          {photoUrl
            ? <img src={photoUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
            : <div style={{textAlign:'center',color:C.whiteMid,fontSize:12,padding:12}}>📷<br/>Ajouter</div>
          }
        </div>
        <div style={{color:C.gold,fontSize:13,fontWeight:600}}>{photoUrl?'Changer la photo':'Choisir une photo'}</div>
        <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{if(e.target.files?.[0]){pickPhoto(e.target.files[0]);e.target.value=''}}}/>
      </label>
      {photoUrl && <div style={{color:'#4ade80',fontSize:12,textAlign:'center'}}>✓ Photo ajoutée</div>}
    </div>,

    // Step 1 : Identité
    <div key={1} style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{color:C.white,fontSize:20,fontWeight:800,textAlign:'center'}}>Parle-nous de toi</div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Prénom</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Ton prénom" maxLength={30}
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:15,fontFamily:'inherit',outline:'none'}}/>
      </div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Âge</div>
        <input value={age} onChange={e=>setAge(e.target.value.replace(/\D/g,''))} placeholder="Ton âge" maxLength={2} inputMode="numeric"
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:15,fontFamily:'inherit',outline:'none'}}/>
      </div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:8,letterSpacing:'.08em',textTransform:'uppercase'}}>Je suis</div>
        <div style={{display:'flex',gap:8}}>
          <GenderBtn v="F" label="Femme"/>
          <GenderBtn v="M" label="Homme"/>
          <GenderBtn v="NB" label="Autre"/>
        </div>
      </div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Ville</div>
        <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Lausanne"
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:15,fontFamily:'inherit',outline:'none'}}/>
      </div>
    </div>,

    // Step 2 : Je cherche
    <div key={2} style={{display:'flex',flexDirection:'column',gap:20}}>
      <div style={{color:C.white,fontSize:20,fontWeight:800,textAlign:'center'}}>Je cherche à rencontrer</div>
      <div style={{color:C.whiteMid,fontSize:13,textAlign:'center'}}>Ça n'affecte que les profils qui te sont présentés.</div>
      <div style={{display:'flex',gap:10}}>
        <LookBtn v="F" label="Des femmes" icon="👩"/>
        <LookBtn v="M" label="Des hommes" icon="👨"/>
        <LookBtn v="ALL" label="Tout le monde" icon="🤝"/>
      </div>
    </div>,

    // Step 3 : Bio + Métier (skippable)
    <div key={3} style={{display:'flex',flexDirection:'column',gap:16}}>
      <div style={{color:C.white,fontSize:20,fontWeight:800,textAlign:'center'}}>Ton profil</div>
      <div style={{color:C.whiteMid,fontSize:13,textAlign:'center'}}>Optionnel — tu peux compléter plus tard depuis le profil.</div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Bio courte</div>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Quelques mots sur toi..." maxLength={120} rows={3}
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:14,fontFamily:'inherit',outline:'none',resize:'none'}}/>
        <div style={{color:C.whiteMid,fontSize:10,textAlign:'right',marginTop:3}}>{bio.length}/120</div>
      </div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:6,letterSpacing:'.08em',textTransform:'uppercase'}}>Métier / Études</div>
        <input value={job} onChange={e=>setJob(e.target.value)} placeholder="Photographe, étudiant·e, ..." maxLength={50}
          style={{width:'100%',padding:'12px 16px',borderRadius:14,border:`1.5px solid ${C.border}`,background:C.bgCard,color:C.white,fontSize:15,fontFamily:'inherit',outline:'none'}}/>
      </div>
      <div>
        <div style={{color:C.whiteMid,fontSize:11,marginBottom:8,letterSpacing:'.08em',textTransform:'uppercase'}}>Domaine professionnel <span style={{opacity:.5}}>(pour le mode Pro)</span></div>
        <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
          {JOB_CATS.map(cat=>(
            <button key={cat} onClick={()=>setJobCategory(jobCategory===cat?'':cat)}
              style={{padding:'6px 12px',borderRadius:20,border:`1.5px solid ${jobCategory===cat?C.gold:C.border}`,background:jobCategory===cat?`${C.gold}22`:C.bgCard,color:jobCategory===cat?C.gold:C.whiteMid,fontSize:11,fontWeight:jobCategory===cat?700:400,cursor:'pointer',fontFamily:'inherit'}}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </div>,

    // Step 4 : Prêt !
    <div key={4} style={{display:'flex',flexDirection:'column',gap:16,alignItems:'center',textAlign:'center'}}>
      <div style={{fontSize:56,lineHeight:1}}>🎉</div>
      <div style={{color:C.white,fontSize:22,fontWeight:900}}>Prêt·e à Clutcher !</div>
      <div style={{color:C.whiteMid,fontSize:14,lineHeight:1.7}}>Ton profil est créé. Mets-toi disponible et envoie ton premier Clutch.</div>
      <div style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:16,padding:16,width:'100%',textAlign:'left'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
          {photoUrl
            ? <img src={photoUrl} style={{width:48,height:48,borderRadius:'50%',objectFit:'cover',border:`2px solid ${C.gold}`}} alt=""/>
            : <div style={{width:48,height:48,borderRadius:'50%',background:C.bgCard,border:`2px solid ${C.gold}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>👤</div>
          }
          <div>
            <div style={{color:C.white,fontSize:15,fontWeight:700}}>{name||'Toi'}{age?`, ${age} ans`:''}</div>
            <div style={{color:C.whiteMid,fontSize:12}}>{city||'Lausanne'} · {job||'...'}</div>
          </div>
        </div>
        {bio && <div style={{color:C.whiteMid,fontSize:12,fontStyle:'italic',borderTop:`1px solid ${C.border}`,paddingTop:8}}>"{bio}"</div>}
      </div>
    </div>,
  ]

  return (
    <div style={{position:'fixed',inset:0,background:C.bg,display:'flex',flexDirection:'column',padding:'24px 24px 36px',zIndex:3000,overflowY:'auto'}}>
      {/* Progress bar */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
          <div style={{color:C.whiteMid,fontSize:12}}>Étape {step+1} sur {TOTAL}</div>
          {step >= 3 && <button onClick={saveAndContinue} style={{background:'none',border:'none',color:C.whiteMid,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>Passer →</button>}
        </div>
        <div style={{height:3,background:C.border,borderRadius:2}}>
          <div style={{height:'100%',background:C.gold,borderRadius:2,width:`${((step+1)/TOTAL)*100}%`,transition:'width .4s ease'}}/>
        </div>
      </div>

      {/* Contenu de l'étape */}
      <div style={{flex:1}}>
        {steps[step]}
      </div>

      {/* Boutons nav */}
      <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:24}}>
        <button onClick={saveAndContinue} disabled={saving}
          style={{width:'100%',padding:'14px',background:C.gold,border:'none',borderRadius:20,color:'#fff',fontSize:15,fontWeight:800,cursor:'pointer',fontFamily:'inherit',opacity:saving?.7:1}}>
          {saving ? 'Sauvegarde...' : step === TOTAL-1 ? '🔒 Lancer Clutch !' : 'Continuer →'}
        </button>
        {step > 0 && (
          <button onClick={()=>setStep(step-1)} style={{width:'100%',padding:'10px',background:'transparent',border:`1.5px solid ${C.border}`,borderRadius:20,color:C.whiteMid,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
            ← Retour
          </button>
        )}
      </div>
    </div>
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
  // setTab avec marquage "vu" automatique — bloque si feedback en cours
  const setTab = (t: MainTab) => {
    if (showFeedback) { showToast(lang==='en'?'Submit your feedback first':'Donne ton feedback d\'abord', C.orange); return }
    _setTab(t)
    const now = Date.now()
    if(t==='clutchs'){setSeenClutchsAt(now);try{localStorage.setItem('c_seen_clutchs',String(now))}catch{}}
    if(t==='evenements'){setSeenEventsAt(now);try{localStorage.setItem('c_seen_events',String(now))}catch{}}
  }
  const [unreadChats, setUnreadChats] = useState<Record<string,number>>({})
  const [contactsUnread, setContactsUnread] = useState(0)
  const [contactClutchTarget, setContactClutchTarget] = useState<any|null>(null)
  const [unreadRetards, setUnreadRetards] = useState<Set<string>>(new Set()) // clutchId → nb msgs non lus
  const [user,setUser]       = useState<Profile|null>(null)
  const [profiles,setProfiles] = useState<Profile[]>([])
  const [lapinIds,setLapinIds] = useState<Set<string>>(new Set())  // personnes à qui j'ai mis un lapin → masquées des présences
  const [clutches,setClutches] = useState<any[]>([])
  const [myOccupancies,setMyOccupancies] = useState<any[]>([]) // forteresse : mes créneaux occupés (RDV confirmés) → pour « ⏸ en pause »
  const [myAvail,setMyAvail] = useState<any[]>([]) // multi-créneaux : mes créneaux de dispo actifs (max 3)
  const [showSlots,setShowSlots] = useState(false) // feuille « Mes créneaux »
  const reloadAvail = useCallback(async()=>{ if(!user?.id) return; const {data}=await supabase.from('availabilities').select('id,start_at,end_at,place').eq('user_id',user.id).eq('active',true).gt('end_at',new Date().toISOString()).order('start_at',{ascending:true}); setMyAvail(data||[]) },[user?.id])
  const removeSlot = useCallback(async(id:string)=>{ await supabase.from('availabilities').update({active:false}).eq('id',id); reloadAvail() },[reloadAvail])
  // Multi-créneaux (A) : « promotion » du créneau qui couvre MAINTENANT dans profiles, pour être visible
  // pendant chacun de mes créneaux. PROMOTE-ONLY : ne rend JAMAIS indisponible (pire cas = ne fait rien).
  // → le gate (is_available && available_until>now) reste lu tel quel, AUCUN site de gate modifié.
  const syncCurrentSlot = useCallback(async()=>{
    if(!user?.id) return
    try {
      const now=Date.now()
      const {data:slots}=await supabase.from('availabilities').select('*').eq('user_id',user.id).eq('active',true)
      if(!slots?.length) return
      const cur=slots.find((s:any)=> new Date(s.start_at).getTime()<=now && now<new Date(s.end_at).getTime())
      if(!cur) return
      const u:any=user
      const profActive = u.is_available && u.available_from && u.available_until && new Date(u.available_from).getTime()<=now && new Date(u.available_until).getTime()>now
      if(profActive) return // profiles reflète déjà un créneau actif → on ne touche à rien
      await supabase.from('profiles').update({ is_available:true, available_from:cur.start_at, available_until:cur.end_at, center_lat:cur.lat, center_lng:cur.lng, available_radius_km:cur.radius_km||5, available_city:cur.place||null }).eq('id',user.id)
      setUser((prev:any)=> prev ? {...prev, is_available:true, available_from:cur.start_at, available_until:cur.end_at, center_lat:cur.lat, center_lng:cur.lng, available_radius_km:cur.radius_km||5, available_city:cur.place} : prev)
    } catch {}
  },[user?.id])
  useEffect(()=>{ syncCurrentSlot(); const id=setInterval(syncCurrentSlot, 60000); return ()=>clearInterval(id) },[syncCurrentSlot]) // + check chaque minute → un créneau s'active à son heure, app ouverte
  const [authDone,setAuthDone] = useState(false)
  const [authTarget,setAuthTarget] = useState<Screen>('login')
  const [toast,setToast]     = useState<{msg:string;color:string}|null>(null)
  const [pushDiag,setPushDiag] = useState<{msg:string;color:string}|null>(null)  // diagnostic push PERSISTANT (admin) — reste jusqu'au tap
  const [selProfile,setSelProfile] = useState<Profile|null>(null)
  const [showSend,setShowSend] = useState(false)
  const [slotGoneProfile,setSlotGoneProfile] = useState<Profile|null>(null)
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
  const [cancelMsg,setCancelMsg] = useState('') // Message optionnel lors d'une annulation
  const [delayPickerOpen,setDelayPickerOpen] = useState<string|null>(null) // ID du clutch dont le picker retard est ouvert
  const [localConfirmed,setLocalConfirmed] = useState<Set<string>>(new Set()) // IDs verrouillés localement (contourne RLS)
  const [feedbackClutch,setFeedbackClutch] = useState<any>(null) // Clutch en attente de feedback post-RDV
  const [showFeedback,setShowFeedback] = useState(false)
  const [terminerClutchId,setTerminerClutchId] = useState<string|null>(null)
  const [inlineFeedbackId,setInlineFeedbackId] = useState<string|null>(null) // ID clutch en feedback inline (bypass modal)
  const [inlineFbSel,setInlineFbSel] = useState<string|null>(null) // sélection inline feedback
  const [pendingFeedbacks,setPendingFeedbacks] = useState(0) // Soft gate counter
  const [announcedDelays,setAnnouncedDelays] = useState<Record<string,number>>({}) // clutchId → minutes annoncées
  const [checkinDone,setCheckinDone] = useState<Set<string>>(new Set()) // IDs où J'y suis déjà tapé
  const [radarMin,setRadarMin] = useState(false) // D3 : RDV en cours réduit en pastille flottante (libère l'écran pour voir les events)
  // completedIds persisté dans localStorage — survit aux rechargements
  const completedIds = useRef<Set<string>>((() => {
    try { const s = localStorage.getItem('clutch_completedIds'); return s ? new Set(JSON.parse(s)) : new Set() } catch { return new Set() }
  })())
  const addCompleted = (id: string) => {
    completedIds.current.add(id)
    try { localStorage.setItem('clutch_completedIds', JSON.stringify([...completedIds.current])) } catch {}
  }
  const [keepContactClutch,setKeepContactClutch] = useState<any>(null) // Clutch pour modal "Garder le contact"
  // 🥚 ÉPHÉMÈRE — coucou à Mel + David (À RETIRER au prochain build). Visible qu'eux deux, 1 fois.
  // FAB Clutch Live déplaçable (drag n'importe où, position persistée)
  const [showClutchNight,setShowClutchNight] = useState(false) // 🌙 prototype Clutch Night
  // Préférences ergonomie (Geek Setup) : afficher/masquer chaque bouton flottant. L'utilisateur fabrique sa propre ergonomie.
  const [fabPrefs,setFabPrefs] = useState(()=>{ const r=(k:string)=>{ try{return localStorage.getItem(k)!=='0'}catch{return true} }; return { live:r('clutch_show_live'), night:r('clutch_show_night') } })
  useEffect(()=>{ const h=()=>{ const r=(k:string)=>{ try{return localStorage.getItem(k)!=='0'}catch{return true} }; setFabPrefs({live:r('clutch_show_live'),night:r('clutch_show_night')}) }; window.addEventListener('clutch-fab-prefs',h); return ()=>window.removeEventListener('clutch-fab-prefs',h) },[])
  const [waitingMutualContact,setWaitingMutualContact] = useState<{clutchId:string,clutch:any}|null>(null)
  const [mutualContactIds,setMutualContactIds] = useState<Set<string>>(new Set())
  const [counterClutchId,setCounterClutchId] = useState<string|null>(null) // ID du clutch en contre-proposition
  const [contactArmedId,setContactArmedId] = useState<string|null>(null) // confirmation 2-temps retrait contact (window.confirm bloqué iOS)
  const [counterVenue,setCounterVenue] = useState('')
  const [counterTime,setCounterTime] = useState('')
  const [counterMsg,setCounterMsg] = useState('')
  const autoFeedbackTimers = useRef<Record<string,ReturnType<typeof setTimeout>>>({}) // clutchId → timer auto-feedback 3h
  const [liveMode,setLiveMode] = useState(false)
  const [proMode,setProMode] = useState(false) // 💼 Manoski — mode pro
  const [proJobFilter,setProJobFilter] = useState<string|null>(null) // catégorie sélectionnée en mode pro
  const [livePos,setLivePos] = useState<[number,number]|null>(null)
  const [liveLoading,setLiveLoading] = useState(false)
  const [liveActivating,setLiveActivating] = useState(false) // animation d'entrée
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
  const [showHistory,setShowHistory] = useState(false)   // Section historique collapsible (fermé par défaut)
  // Position RDV voulue — initialisée depuis GPS si disponible
  const [meetupPos,setMeetupPos] = useState<[number,number]>(ME)
  useEffect(()=>{
    if (typeof navigator === 'undefined' || !navigator.geolocation) return
    // maximumAge:0 = toujours une position fraîche (évite le cache iPhone)
    navigator.geolocation.getCurrentPosition(
      pos => { setMeetupPos([pos.coords.latitude, pos.coords.longitude]) },
      () => {
        // Fallback : retry sans enableHighAccuracy si timeout
        navigator.geolocation.getCurrentPosition(
          pos2 => { setMeetupPos([pos2.coords.latitude, pos2.coords.longitude]) },
          () => {}, // reste sur Lausanne par défaut
          { timeout:10000, maximumAge:0 }
        )
      },
      { enableHighAccuracy:true, timeout:6000, maximumAge:0 }
    )
  },[])
  const mapGetCenterRef = useRef<(()=>[number,number])|null>(null)
  const mapRecenterRef  = useRef<(()=>void)|null>(null)
  // Page 2 — Quel type de rencontre (multi-select)
  const [seekModes,setSeekModes]   = useState<string[]>(['romantic','friend'])  // multi
  const [seekGender,setSeekGender] = useState<'F'|'M'|'X'|'all'>('all')
  const [ageMin,setAgeMin] = useState('18')
  const [ageMax,setAgeMax] = useState('45')
  const [intentMsg,setIntentMsg]   = useState('')
  const [intentPinned,setIntentPinned] = useState(false)  // descriptif épinglé / non modifiable (Pin_RDVfixe) — design Mel
  const [quickClutch,setQuickClutch]   = useState(false)  // RDV limité 1h (QuickClutch) — pastille verte visible des autres

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
  const [initSlots,setInitSlots] = useState<string[]>(() => makeSlots())   // rafraîchissable (était useMemo([]) figé → heure restait bloquée sur l'ancienne)
  const [fromTime,setFromTime] = useState(() => initSlots[0] || '18:00')
  const [untilTime,setUntilTime] = useState(() => initSlots[4] || '20:00')
  const [rayon,setRayon]       = useState(10)  // défaut 10km : couvre Lausanne + Morges/Renens/Pully (maximise les présences). Slider jusqu'à 100km.

  const untilSlots = useMemo(() => {
    const [h,m] = fromTime.split(':').map(Number)
    const b = new Date(); b.setHours(h,m,0,0)
    return makeSlots(new Date(b.getTime() + 5*60_000)).slice(0,216)
  }, [fromTime])

  // 🕐 RECALAGE HEURE — quand on OUVRE le flux « se mettre dispo » (flow → 'carte'), on régénère les
  // créneaux + l'heure par défaut sur MAINTENANT. Sinon ils restaient figés à l'ouverture de l'app
  // → David proposait une fenêtre DÉJÀ EXPIRÉE (ex. 19h45–20h05 à 20h07) → personne n'était vraiment live.
  // On ne recale PAS en revenant de 'options' (back) pour ne pas écraser un choix en cours.
  const prevFlowRef = useRef<AppFlow>(flow)
  useEffect(() => {
    const prev = prevFlowRef.current; prevFlowRef.current = flow
    if (flow === 'carte' && prev !== 'carte' && prev !== 'options') {
      const fresh = makeSlots()
      setInitSlots(fresh)
      setFromTime(fresh[0] || '18:00')
      setUntilTime(fresh[4] || fresh[0] || '20:00')
    }
  }, [flow])

  // Init OneSignal au démarrage (natif iOS/Android uniquement)
  useEffect(() => {
    import('@/lib/onesignal').then(({ initOneSignal }) => initOneSignal()).catch(() => {})
  }, [])

  // 🔔 Toast in-app à CHAQUE push reçu app ouverte (David : « je veux que tout ce qui est notifié
  // s'affiche »). En plus de la bannière système iOS. On affiche titre + corps.
  useEffect(() => {
    const onPush = (e: any) => {
      const d = e?.detail || {}
      const msg = [d.title, d.body].filter(Boolean).join(' — ') || '🔔 Notification'
      showToast(msg, C.orange)
    }
    window.addEventListener('clutch:push', onPush as any)
    return () => window.removeEventListener('clutch:push', onPush as any)
  }, [])

  // 🔧 DEV (admin) : résultat réel de l'envoi push → toast visible (combien de destinataires / erreur).
  // Permet de diagnostiquer les notifs SANS fouiller Supabase (David : « j'en ai marre de chercher »).
  useEffect(() => {
    const ADMIN_IDS = ['bad38f3e-87df-40e0-a2d2-75c03b58d72b','409e83dc-dda8-42c3-bb98-3ea900857d35','9626a0ba-037f-49dd-9957-ebd37e58a864']
    const onResult = (e: any) => {
      if (!ADMIN_IDS.includes((user as any)?.id)) return
      const d = e?.detail || {}
      const r = d.result || d   // compatible ancienne fonction ({ok,result}) ET nouvelle ({recipients,errors})
      // Bandeau PERSISTANT (reste jusqu'au tap) — un toast de 2s c'est trop court pour lire le diagnostic.
      if (d.error) { setPushDiag({msg:`📡 push ERREUR fonction: ${d.error}`, color:C.red}); return }
      if (r.errors) { setPushDiag({msg:`📡 push REFUSÉ par OneSignal: ${JSON.stringify(r.errors)}`, color:C.orange}); return }
      if (r.recipients === 0) { setPushDiag({msg:'📡 push parti mais 0 destinataire (ciblage/abonnement)', color:C.orange}); return }
      if (typeof r.recipients === 'number') { setPushDiag({msg:`✅ push OK → ${r.recipients} destinataire(s) reçu·s`, color:C.green}); return }
      setPushDiag({msg:`📡 réponse: ${JSON.stringify(r).slice(0,200)}`, color:C.salmon})
    }
    window.addEventListener('clutch:pushresult', onResult as any)
    return () => window.removeEventListener('clutch:pushresult', onResult as any)
  }, [user])

  // 🔧 DIAGNOSTIC générique (bandeau persistant) — utilisé par les outils dev (Reset test, etc.).
  useEffect(() => {
    const onDiag = (e:any) => { const d=e?.detail; if(d?.msg) setPushDiag({msg:d.msg, color:d.color||C.salmon}) }
    window.addEventListener('clutch:diag', onDiag as any)
    return () => window.removeEventListener('clutch:diag', onDiag as any)
  }, [])

  // 🔒 SAFE-AREA ROBUSTE — mesure le vrai inset via une sonde. Si la WKWebView Capacitor renvoie 0
  // (bug connu iOS : l'encoche n'est pas rapportée malgré viewport-fit=cover), on applique un fallback
  // notch UNIQUEMENT sur iPhone « tall ». Sinon le header montait sous la caméra (bug signalé David).
  useEffect(() => {
    const apply = () => {
      try {
        const probe = document.createElement('div')
        probe.style.cssText = 'position:fixed;top:0;left:0;width:0;visibility:hidden;pointer-events:none;height:env(safe-area-inset-top)'
        document.body.appendChild(probe)
        let top = probe.getBoundingClientRect().height
        probe.style.height = 'env(safe-area-inset-bottom)'
        let bot = probe.getBoundingClientRect().height
        probe.remove()
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent || '') || (navigator.platform==='MacIntel' && (navigator as any).maxTouchPoints>1)
        const longSide = Math.max(window.screen?.height||0, window.screen?.width||0)
        const tall = longSide >= 800 // iPhone X et +
        if (isIOS && tall) { if (top < 20) top = 50; if (bot < 10) bot = 34 }
        document.documentElement.style.setProperty('--sat', top + 'px')
        document.documentElement.style.setProperty('--sab', bot + 'px')
      } catch {}
    }
    apply()
    window.addEventListener('orientationchange', apply)
    window.addEventListener('resize', apply)
    return () => { window.removeEventListener('orientationchange', apply); window.removeEventListener('resize', apply) }
  }, [])

  // Persist hiddenHistIds to localStorage
  useEffect(() => {
    try { localStorage.setItem('clutch_hidden_hist', JSON.stringify([...hiddenHistIds])) } catch {}
  }, [hiddenHistIds])
  // Persist registeredEvents to localStorage
  useEffect(() => {
    try { localStorage.setItem('clutch_registered_events', JSON.stringify([...registeredEvents])) } catch {}
  }, [registeredEvents])
  // 🔧 HYDRATATION depuis le DB (source de vérité) — corrige « inscrit à un event mais il n'apparaît pas »
  // Le Set venait UNIQUEMENT du localStorage → il dérivait de event_participants (réinstall, autre device,
  // flux liste d'attente → place libérée, reset…). On resynchronise les VRAIS events (UUID) sur le DB,
  // tout en gardant les events locaux/mock (non-UUID). Règle CLAUDE.md : la vérité est en DB, pas en cache JS.
  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    let cancelled = false
    supabase.from('event_participants').select('event_id').eq('user_id', uid).then(({ data }: any) => {
      if (cancelled || !data) return
      const isUuid = (s:any) => typeof s==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)
      const dbIds = data.map((d:any)=>d.event_id).filter(isUuid)
      setRegisteredEvents(prev => {
        const merged = new Set<string>(dbIds)                       // vrais events = vérité DB
        prev.forEach(id => { if (!isUuid(id)) merged.add(id) })      // garde les events locaux/mock
        return merged
      })
    })
    return () => { cancelled = true }
  }, [user?.id])
  // 🔧 HYDRATATION liste d'attente depuis le DB (cross-device). Pareil que les inscriptions : la vérité
  // est en base (event_waitlist), pas en localStorage. Permet de recevoir « place libérée » sur tout device.
  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    let cancelled = false
    supabase.from('event_waitlist').select('event_id').eq('user_id', uid).then(({ data }: any) => {
      if (cancelled || !data) return
      const isUuid = (s:any) => typeof s==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)
      const dbIds = data.map((d:any)=>d.event_id).filter(isUuid)
      setWaitlistEvIds(prev => {
        const merged = new Set<string>(dbIds)
        prev.forEach(id => { if (!isUuid(id)) merged.add(id) })   // garde les events locaux/mock
        return merged
      })
    })
    return () => { cancelled = true }
  }, [user?.id])
  // « Mes événements » à afficher AUSSI dans l'onglet Clutchs (demande David 21.06). Fetch léger (colonnes DB directes).
  const [myUpcomingEvents,setMyUpcomingEvents] = useState<any[]>([])
  useEffect(() => {
    const uuids = [...registeredEvents].filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id))
    if (!uuids.length) { setMyUpcomingEvents([]); return }
    let cancelled = false
    supabase.from('events').select('id,emoji,title,event_time,event_date,lieu,status,active').in('id', uuids).then(({ data }: any) => {
      if (cancelled) return
      setMyUpcomingEvents((data||[]).filter((e:any)=>e.active!==false && e.status!=='cancelled'))
    })
    return () => { cancelled = true }
  }, [registeredEvents])
  // Persist waitlist to localStorage
  useEffect(() => {
    try { localStorage.setItem('clutch_waitlist', JSON.stringify([...waitlistEvIds])) } catch {}
  }, [waitlistEvIds])

  // ── Feedback post-RDV : déclenche 30min après le RDV + calcule pendingFeedbacks ──
  useEffect(() => {
    if (!user?.id) return
    const pastRdvs = (clutches as any[]).filter(c =>
      (c.status==='confirmed'||c.status==='accepted'||c.status==='checked_in') &&
      c.proposed_time &&
      new Date(c.proposed_time).getTime() + 30*60*1000 < Date.now() &&
      !localStorage.getItem(`feedback_done_${c.id}`)
    )
    setPendingFeedbacks(pastRdvs.length)
    // Utilise toujours le feedback inline — ne jamais ouvrir l'ancien FeedbackSheet
    if (!inlineFeedbackId && pastRdvs.length > 0) {
      setInlineFeedbackId(pastRdvs[0].id)
      _setTab('clutchs')
    }
  }, [clutches, user?.id, inlineFeedbackId])

  const isAvailableRef = useRef(false)
  const sliderRef = useRef<HTMLDivElement>(null) // slider rayon — doit être au top level (règle des hooks)
  const availableRef = user?.is_available && user?.available_until && new Date((user as any).available_until) > new Date()
  const isPremium = ['Au','Rh','At'].includes((user as any)?.account_type || '')
  isAvailableRef.current = !!availableRef

  const showToast = useCallback((msg:string,color=C.salmon) => setToast({msg,color}),[])

  // Applique une pénalité au score de l'utilisateur courant
  const insertCancelMsg = async (clutchId: string, otherId: string) => {
    const senderName = user?.name?.split(' ')[0] || (lang==='fr'?'L\'envoyeur':'The sender')
    const text = lang==='fr'
      ? `↩ ${senderName} a annulé ce Clutch.`
      : `↩ ${senderName} cancelled this Clutch.`
    await supabase.from('messages').insert({
      clutch_id: clutchId,
      sender_id: user?.id,
      receiver_id: otherId,
      content: text,
      is_system: true,
    })
  }

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
    // Mode prévisualisation : ?preview=onboarding dans l'URL
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
    if (params?.get('preview') === 'onboarding') {
      setScreen('onboarding')
      return
    }
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
    if (!error && data) {
      const real = data.map(enrichProfile)
      // Badge 🔒 événement : marquer les profils qui hébergent un événement actif
      try {
        const { data: evs } = await supabase.from('events').select('id,created_by,emoji').eq('active',true).not('created_by','is',null)
        const hostMap = new Map((evs||[]).map((e:any)=>[e.created_by, e]))
        real.forEach((p:any)=>{ const e:any = hostMap.get(p.id); if(e){ p._hasEvent=true; p._eventId=e.id; p._eventEmoji=e.emoji||'📅' } })
      } catch {}
      // Lapins : personnes à qui J'AI mis un "absent" (no-show) → masquées des présences pendant 48h (cooldown, pas à vie : une erreur/imprévu ne doit pas bannir quelqu'un définitivement — cf audit confiance)
      try {
        const { data: lap } = await supabase.from('rdv_feedbacks').select('to_id,submitted_at').eq('from_id', user.id).eq('outcome','absent')
        const cutoff = Date.now() - 48*3600*1000
        // submitted_at NULL → on NE masque PAS (fallback 0, pas Date.now() qui masquerait à vie)
        const recent = (lap||[]).filter((f:any)=>{ const ts = f.submitted_at ? new Date(f.submitted_at).getTime() : 0; return ts >= cutoff })
        setLapinIds(new Set(recent.map((f:any)=>f.to_id)))
      } catch {}
      // Max (bot GPS de test) SUPPRIMÉ — demande David.
      setProfiles(real)
    }
  },[user?.id])

  const loadClutches = useCallback(async () => {
    if (!user?.id) return
    // Ne charge que les clutchs récents (48h) ou actifs — évite d'afficher l'historique complet
    const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    const {data} = await supabase.from('clutches')
      .select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at',{ascending:false}).limit(30)
    // Forteresse : mes créneaux occupés (RDV confirmés) → sert à marquer « ⏸ en pause » les pendings qui chevauchent
    supabase.from('occupancies').select('start_at,end_at,source_id').eq('user_id', user.id)
      .then(({data:occ})=>setMyOccupancies(occ||[]))
    // Multi-créneaux : mes créneaux de dispo actifs ET futurs (B1 : les passés dégagent). Pour le compteur 📍 N/3.
    supabase.from('availabilities').select('id,start_at,end_at,place').eq('user_id', user.id).eq('active', true).gt('end_at', new Date().toISOString()).order('start_at',{ascending:true})
      .then(({data:av})=>setMyAvail(av||[]))
    if (data) {
      // Respecter les terminaisons locales — résiste aux données stale de la DB
      data.forEach((c:any) => { if (completedIds.current.has(c.id)) c.status = 'completed' })
      const now = new Date()
      // ── Auto-expiration côté client : pending dont expires_at < now → 'expired' ──
      const toExpire = data.filter((c:any) =>
        c.status === 'pending' && c.expires_at && new Date(c.expires_at) < now
      )
      for (const c of toExpire) {
        // guard .eq('status','pending') évite double update si l'autre user a déjà expiré
        await supabase.from('clutches').update({status:'expired'})
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
              Sounds.verrou()
              setTimeout(() => setShowVerrou(true), 100)
              if (newlyConfirmed.proposed_time) {
                scheduleRdvNotifs(newlyConfirmed.id, newlyConfirmed.receiver?.name||'', newlyConfirmed.venue||'', newlyConfirmed.proposed_time)
                scheduleAutoFeedback(newlyConfirmed.id, newlyConfirmed.proposed_time, ()=>(clutches as any[]).find((c:any)=>c.id===newlyConfirmed.id))
                // Bloque la fenêtre RDV sur le profil (persiste même si Verrou annulé)
                const rdvMs = new Date(newlyConfirmed.proposed_time).getTime()
                const lockedFrom = new Date(rdvMs - TRUST_CONFIG.RDV_LOCK_BEFORE_MIN * 60*1000).toISOString()
                const lockedUntil = new Date(rdvMs + TRUST_CONFIG.RDV_LOCK_AFTER_H * 3600*1000).toISOString()
                supabase.from('profiles').update({ rdv_locked_from: lockedFrom, rdv_locked_until: lockedUntil }).eq('id', user.id).then(()=>{})
              }
            }
          } catch {}
        }
        return data
      })
      // Sync announcedDelays depuis la DB (pour que le receveur voie aussi le badge +Xmin)
      const delaysFromDb: Record<string,number> = {}
      data.forEach((c:any) => { if (c.announced_delay_min > 0) delaysFromDb[c.id] = c.announced_delay_min })
      if (Object.keys(delaysFromDb).length > 0) {
        setAnnouncedDelays(prev => ({...prev, ...delaysFromDb}))
      }
      // Charger les contacts mutuels parmi les clutchs terminés
      const completedIds2 = data.filter((c:any)=>c.status==='completed').map((c:any)=>c.id)
      if (completedIds2.length > 0 && user?.id) {
        supabase.from('rdv_feedbacks')
          .select('rdv_id,from_id,keep_contact')
          .in('rdv_id', completedIds2)
          .eq('keep_contact', true)
          .then(({data: fbs}) => {
            if (!fbs) return
            const counts: Record<string,number> = {}
            fbs.forEach((fb:any) => { counts[fb.rdv_id] = (counts[fb.rdv_id]||0) + 1 })
            const mutual = new Set(Object.keys(counts).filter(id => counts[id] >= 2))
            setMutualContactIds(mutual)
          })
      }
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

  // Bot auto-clutch supprimé — on n'utilise que les vrais clutchs Supabase

  // ── Verrou actif — clutch confirmed dans les 18h suivantes ──
  const activeVerrou = useMemo(() => {
    if (!user?.id) return null
    const now = new Date()
    const soon = new Date(now.getTime() + 18*3600*1000)
    // Verrou actif normal
    const normal = (clutches as any[]).find(c =>
      (c.status === 'confirmed' || c.status === 'accepted' || c.status === 'checked_in') &&
      !completedIds.current.has(c.id) &&
      c.proposed_time &&
      new Date(c.proposed_time) > new Date(now.getTime() - 3*3600*1000) &&
      new Date(c.proposed_time) < soon
    )
    if (normal) return normal
    // Retard refusé non encore acquitté → garder le canvas visible.
    // ⚠️ Borne temporelle obligatoire : sans elle, un clutch annulé d'un jour passé
    // hante l'app indéfiniment (Verrou fantôme en boucle, surtout en nav privée sans
    // le garde-fou localStorage). On ne garde le canvas que pour un RDV RÉCENT.
    try {
      return (clutches as any[]).find(c =>
        c.status === 'cancelled' &&
        c.retard_by === user.id &&
        c.retard_accepted === false &&
        c.proposed_time &&
        new Date(c.proposed_time) > new Date(now.getTime() - 3*3600*1000) &&
        new Date(c.proposed_time) < soon &&
        !localStorage.getItem(`retard_ack_${c.id}`)
      ) || null
    } catch { return null }
  }, [clutches, user?.id])

  // Blocage bouton Actif : 1h avant RDV jusqu'à 2h après
  const rdvBlocked = useMemo(() => {
    if (!activeVerrou?.proposed_time) return false
    const rdvMs = new Date(activeVerrou.proposed_time).getTime()
    const now = Date.now()
    return now > rdvMs - 60*60*1000 && now < rdvMs + 2*60*60*1000
  }, [activeVerrou])

  // ── Notifications RDV — Option A : setTimeout + browser Notification API ─
  // Option B (Supabase Edge Function + cron) à activer quand Supabase Pro
  const rdvNotifsTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const scheduleRdvNotifs = useCallback((clutchId: string, partnerName: string, venue: string, proposedTime: string) => {
    const rdvMs = new Date(proposedTime).getTime()
    const now = Date.now()
    // Annule les timers précédents pour ce clutch (anti-doublon)
    rdvNotifsTimers.current.forEach(t => clearTimeout(t))
    rdvNotifsTimers.current = []

    const schedule = (delayMs: number, title: string, body: string) => {
      const fireAt = rdvMs - delayMs
      const wait = fireAt - now
      if (wait <= 0) return // déjà passé
      const t = setTimeout(() => {
        // Browser Notification si permission accordée
        if (typeof window !== 'undefined' && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
          new Notification(title, { body, icon: '/icon-192.png', tag: `rdv-${clutchId}-${delayMs}` })
        }
        // Toast in-app toujours (si app ouverte)
        showToast(`${title} — ${body}`, C.orange)
      }, wait)
      rdvNotifsTimers.current.push(t)
    }

    schedule(30*60*1000, `RDV dans 30 min ⏰`,  `${partnerName} · ${venue} — prépare-toi !`)
    schedule(10*60*1000, `🎯 Radar activé`,       `${partnerName} t'attend · ${venue}`)
  }, [showToast])

  // ── Auto-feedback 3h après RDV si personne n'a cliqué Terminer ─
  const scheduleAutoFeedback = useCallback((clutchId: string, proposedTime: string, clutchRef: ()=>any|undefined) => {
    if (autoFeedbackTimers.current[clutchId]) clearTimeout(autoFeedbackTimers.current[clutchId])
    const fireAt = new Date(proposedTime).getTime() + 3*3600*1000
    const wait = fireAt - Date.now()
    if (wait <= 0) return
    autoFeedbackTimers.current[clutchId] = setTimeout(() => {
      const cl = clutchRef()
      if (!cl) return
      if (['completed','cancelled','declined','expired'].includes(cl.status)) return
      // Auto-terminer + ouvrir feedback
      const nowIso = new Date().toISOString()
      supabase.from('clutches').update({status:'completed',expires_at:nowIso}).eq('id',clutchId).then(()=>{})
      setClutches(prev=>(prev as any[]).map((c:any)=>c.id===clutchId?{...c,status:'completed',expires_at:nowIso}:c))
      setFeedbackClutch(cl)
      setShowFeedback(true)
      if (typeof window !== 'undefined' && Notification.permission === 'granted') {
        new Notification('🎯 Comment s\'est passé le RDV ?', { body:'Donne ton feedback — 3 secondes', icon:'/icon-192.png', tag:`autofeedback-${clutchId}` })
      }
    }, wait)
  }, [])

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

  // ── Ref partagé entre Realtime + Polling pour déduplication Verrou ──
  const shownVerrouIds = useRef<Set<string>>(new Set())

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
        // Auto-decline if receiver already has an active confirmed Clutch
        const activeThresh = new Date(Date.now() - 3*3600*1000).toISOString()
        const {data:alreadyLocked} = await supabase.from('clutches')
          .select('id').or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
          .in('status',['confirmed','accepted']).neq('id', payload.new.id)
          .gt('proposed_time', activeThresh).limit(1)
        if (alreadyLocked && alreadyLocked.length > 0) {
          await supabase.from('clutches').update({status:'declined'}).eq('id',payload.new.id)
          loadClutches()
          return
        }
        setIncomingClutch({...payload.new, sender})
        Sounds.clutch()
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
        const status = payload.new?.status
        const oldStatus = payload.old?.status
        const id = payload.new?.id
        // Toast retard 30min reçu
        if (Number(payload.new?.retard_min) === 30 && payload.new?.retard_accepted == null && payload.new?.retard_by) {
          showToast('⏰ Retard de 30 min — accepter ou refuser ?', C.orange)
        }
        // Verrou animation : guard via localStorage (payload.old non fiable sans REPLICA IDENTITY FULL)
        if (status === 'confirmed' || status === 'accepted') {
          try { if (localStorage.getItem(`verrou_shown_${id}`)) { shownVerrouIds.current.add(id); return } } catch {}
          if (shownVerrouIds.current.has(id)) return
          shownVerrouIds.current.add(id)
          try { localStorage.setItem(`verrou_shown_${id}`, String(Date.now())); localStorage.setItem(`clutch_locked_at_${id}`, String(Date.now())) } catch {}
          const other = clutchesRef.current.find(c=>c.id===id)
          setVerrouData({ venue:payload.new?.venue||'', name:other?.sender?.name||'', photo:other?.sender?.photo_url||null })
          setShowVerrou(true)
          if (payload.new?.proposed_time) {
            scheduleRdvNotifs(id, other?.sender?.name||'', payload.new.venue||'', payload.new.proposed_time)
            scheduleAutoFeedback(id, payload.new.proposed_time, ()=>(clutches as any[]).find((c:any)=>c.id===id))
            const _rdvMs = new Date(payload.new.proposed_time).getTime()
            const _lockedFrom = new Date(_rdvMs - TRUST_CONFIG.RDV_LOCK_BEFORE_MIN * 60*1000).toISOString()
            const lockedUntil = new Date(_rdvMs + TRUST_CONFIG.RDV_LOCK_AFTER_H * 3600*1000).toISOString()
            supabase.from('profiles').update({ rdv_locked_from: _lockedFrom, rdv_locked_until: lockedUntil }).eq('id', uid).then(()=>{})
          }
        } else if (status === 'completed') {
          addCompleted(id)
          setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===id?{...cl,status:'completed'}:cl))
          try { if (localStorage.getItem(`feedback_done_${id}`)) return } catch {}
          // Recharger pour avoir les données fraîches (sender/receiver joints), puis ouvrir feedback
          supabase.from('clutches')
            .select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
            .eq('id', id).single()
            .then(({data:fresh})=>{
              if (fresh) { setInlineFeedbackId(fresh.id); _setTab('clutchs'); showToast('🎯 Comment s\'est passé le RDV ?',C.gold) }
            })
        } else if (status === 'cancelled') {
          supabase.from('clutches')
            .select('cancel_message,cancel_by,sender_id,sender:profiles!clutches_sender_id_fkey(name),receiver:profiles!clutches_receiver_id_fkey(name)')
            .eq('id', id).single()
            .then(({data:fresh})=>{
              if (!fresh) return
              const cancellerIsMe = fresh.cancel_by === uid
              if (cancellerIsMe) return // je suis celui qui a annulé, pas de toast
              const cancellerName = fresh.cancel_by === fresh.sender_id ? ((fresh as any).sender as any)?.name : ((fresh as any).receiver as any)?.name
              const msg = fresh.cancel_message
              showToast(`↩ ${cancellerName||'Partenaire'} a annulé${msg ? ` · "${msg}"` : ''}`, C.whiteMid)
              setTimeout(()=>showToast('ℹ Son score de fiabilité sera impacté', C.orange), 1000)
            })
          loadClutches()
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
        const status = payload.new?.status
        const id = payload.new?.id
        // Verrou animation : guard via localStorage
        if (status === 'confirmed' || status === 'accepted') {
          try { if (localStorage.getItem(`verrou_shown_${id}`)) { shownVerrouIds.current.add(id); return } } catch {}
          if (shownVerrouIds.current.has(id)) return
          shownVerrouIds.current.add(id)
          try { localStorage.setItem(`verrou_shown_${id}`, String(Date.now())); localStorage.setItem(`clutch_locked_at_${id}`, String(Date.now())) } catch {}
          const other = clutchesRef.current.find(c=>c.id===id)
          setVerrouData({ venue:payload.new?.venue||'', name:other?.receiver?.name||'', photo:other?.receiver?.photo_url||null })
          setShowVerrou(true)
          if (payload.new?.proposed_time) {
            scheduleRdvNotifs(id, other?.receiver?.name||'', payload.new.venue||'', payload.new.proposed_time)
            scheduleAutoFeedback(id, payload.new.proposed_time, ()=>(clutches as any[]).find((c:any)=>c.id===id))
            const _rdvMs = new Date(payload.new.proposed_time).getTime()
            const _lockedFrom = new Date(_rdvMs - TRUST_CONFIG.RDV_LOCK_BEFORE_MIN * 60*1000).toISOString()
            const lockedUntil = new Date(_rdvMs + TRUST_CONFIG.RDV_LOCK_AFTER_H * 3600*1000).toISOString()
            supabase.from('profiles').update({ rdv_locked_from: _lockedFrom, rdv_locked_until: lockedUntil }).eq('id', uid).then(()=>{})
          }
        } else if (status === 'completed') {
          addCompleted(id)
          setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===id?{...cl,status:'completed'}:cl))
          try { if (localStorage.getItem(`feedback_done_${id}`)) return } catch {}
          // Recharger pour avoir les données fraîches (sender/receiver joints), puis ouvrir feedback
          supabase.from('clutches')
            .select('*,sender:profiles!clutches_sender_id_fkey(*),receiver:profiles!clutches_receiver_id_fkey(*)')
            .eq('id', id).single()
            .then(({data:fresh})=>{
              if (fresh) { setInlineFeedbackId(fresh.id); _setTab('clutchs'); showToast('🎯 Comment s\'est passé le RDV ?',C.gold) }
            })
        } else if (status === 'declined') {
          const other = clutchesRef.current.find((c:any)=>c.id===id)
          const name = other?.receiver?.name || ''
          showToast(`↩ ${name ? name+' a ' : ''}refusé le Clutch`, C.red)
        } else if (status === 'cancelled') {
          supabase.from('clutches')
            .select('cancel_message,cancel_by,sender_id,sender:profiles!clutches_sender_id_fkey(name),receiver:profiles!clutches_receiver_id_fkey(name)')
            .eq('id', id).single()
            .then(({data:fresh})=>{
              if (!fresh) return
              const cancellerIsMe = fresh.cancel_by === uid
              if (cancellerIsMe) return
              const cancellerName = fresh.cancel_by === fresh.sender_id ? ((fresh as any).sender as any)?.name : ((fresh as any).receiver as any)?.name
              const cmsg = fresh.cancel_message
              showToast(`↩ ${cancellerName||'Partenaire'} a annulé${cmsg ? ` · "${cmsg}"` : ''}`, C.whiteMid)
              setTimeout(()=>showToast('ℹ Son score de fiabilité sera impacté', C.orange), 1000)
            })
          loadClutches()
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

  // ── Polling : loadClutches toutes les 5s + loadProfiles toutes les 10s ──
  // (loadProfiles rafraîchit la liste Présences → les nouveaux profils/bots dispo apparaissent sans recharger)
  useEffect(() => {
    if (!user?.id) return
    const t = setInterval(() => loadClutches(), 5000)
    const tp = setInterval(() => loadProfiles(), 10000)
    return () => { clearInterval(t); clearInterval(tp) }
  }, [user?.id, loadClutches, loadProfiles])

  // ── Polling feedback User 2 : standalone, sans closure stale ──
  // Cherche clutchs completed pas encore traités → ouvre feedback
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const check = async () => {
      const {data} = await supabase.from('clutches')
        .select('*,sender:profiles!clutches_sender_id_fkey(id,name,photo_url),receiver:profiles!clutches_receiver_id_fkey(id,name,photo_url)')
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .eq('status','completed')
        .order('created_at',{ascending:false})
        .limit(10)
      if (!data?.length) return
      for (const c of data) {
        if (completedIds.current.has(c.id)) continue
        try { if (localStorage.getItem(`feedback_done_${c.id}`)) { addCompleted(c.id); continue } } catch {}
        addCompleted(c.id)
        setInlineFeedbackId(c.id)
        _setTab('clutchs')
        showToast('🎯 Comment s\'est passé le RDV ?', C.gold)
        break
      }
    }
    const t = setInterval(check, 5000)
    return () => clearInterval(t)
  }, [user?.id])

  // ── Polling contact mutuel : si l'autre dit Oui après nous ──
  useEffect(() => {
    if (!waitingMutualContact || !user?.id) return
    const {clutchId, clutch} = waitingMutualContact
    const isSnd = clutch.sender_id === user.id
    const otherId = isSnd ? clutch.receiver_id : clutch.sender_id
    const otherName = (isSnd ? (clutch.receiver||clutch._receiver) : (clutch.sender||clutch._sender))?.name || '...'
    const t = setInterval(async () => {
      const {data} = await supabase.from('rdv_feedbacks')
        .select('keep_contact').eq('rdv_id',clutchId).eq('from_id',otherId).maybeSingle()
      if (data?.keep_contact === true) {
        setWaitingMutualContact(null)
        setMutualContactIds(prev => new Set([...prev, clutchId]))
        showToast(`✦ ${otherName} veut garder contact !`, C.gold)
        _setTab('contacts')
        loadClutches()
      }
    }, 5000)
    return () => clearInterval(t)
  }, [waitingMutualContact?.clutchId])

  // ── Polling ciblé : surveille mes clutchs pending toutes les 3s (stable via ref) ──
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
        if (!same) {
          const prevTotal = Object.values(prev).reduce((a,b)=>a+b,0)
          const newTotal = Object.values(counts).reduce((a,b)=>a+b,0)
          if (newTotal > prevTotal) Sounds.message()
        }
        return same ? prev : counts
      })
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [user?.id, clutches])

  // ── Polling messages non lus contacts (mutual keep_contact) ──
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    const poll = async () => {
      const contactIds = [...mutualContactIds]
      if (contactIds.length === 0) { setContactsUnread(0); return }
      const {data} = await supabase.from('messages')
        .select('id')
        .eq('receiver_id', uid)
        .is('read_at', null)
        .in('clutch_id', contactIds)
      setContactsUnread(data?.length || 0)
    }
    poll()
    const t = setInterval(poll, 8000)
    return () => clearInterval(t)
  }, [user?.id, mutualContactIds])

  const signOut = async () => { await supabase.auth.signOut(); setUser(null);setProfiles([]);setClutches([]);setScreen('login') }


  const handleOuvrirFenetre = async () => {
    if (!user?.id) return
    // NB : pas de window.confirm (BLOQUÉ dans la WebView iOS). Ouvrir un nouveau créneau remplace l'ancien = comportement
    // attendu quand l'user le fait volontairement → on procède + on prévient par toast. Fenêtre = depuis le DÉBUT choisi (roues limitées à +18h, décision David).
    const alreadyAvail = user?.is_available && (user as any).available_until && new Date((user as any).available_until) > new Date()
    if (alreadyAvail) showToast?.('Nouveau créneau — l\'ancien est remplacé', C.orange)
    const [h,m] = untilTime.split(':').map(Number)
    const until = new Date(); until.setHours(h,m,0,0)
    if (until <= new Date()) until.setDate(until.getDate() + 1)
    // available_from : heure de début du créneau (pas de correction lendemain — la fenêtre peut déjà avoir commencé)
    const [fh,fm] = fromTime.split(':').map(Number)
    const from = new Date(); from.setHours(fh,fm,0,0)
    // Si from > until (ex: from=02:30 mais on est à 03:00 donc until=04:00 aujourd'hui), on laisse from tel quel
    const city = nearestCity(meetupPos[0], meetupPos[1])

    // Update + .select() pour vérifier que des lignes ont été mises à jour
    const { data: updated, error } = await supabase.from('profiles').update({
      is_available:true,
      available_from:from.toISOString(),
      available_until:until.toISOString(),
      available_city:city,
      center_lat:meetupPos[0],
      center_lng:meetupPos[1],
      available_radius_km:Math.round(rayon),
      available_modes: seekModes.length ? seekModes : null,
      pref_age_min: parseInt(ageMin) || 18,
      pref_age_max: ageMax === '65+' ? 99 : (parseInt(ageMax) || 99),
      ...(intentMsg ? {bio:intentMsg} : {}),
    } as any).eq('id',user.id).select()

    if (error) {
      showToast(`Erreur DB : ${error.message}`, C.red)
      return
    }

    // Multi-créneaux : persiste ce créneau dans `availabilities` (max 3 actifs).
    // PIVOT 27.06 — les créneaux PEUVENT se CHEVAUCHER : la dispo = une INTENTION (« je suis ouvert à
    // plusieurs plans ce soir »), PAS une localisation simultanée. La forteresse ne verrouille qu'au RDV
    // CONFIRMÉ (occupancies) → être « dispo à 2 endroits » est SÛR. Donc on N'écrase plus : on accumule.
    try {
      const startMs = from.getTime(), endMs = until.getTime()
      const { data: act } = await supabase.from('availabilities').select('id,start_at,end_at,lat,lng').eq('user_id', user.id).eq('active', true).gt('end_at', new Date().toISOString()).order('start_at', { ascending: true })
      const list:any[] = act || []
      const overlapping = list.filter(s => new Date(s.start_at).getTime() < endMs && startMs < new Date(s.end_at).getTime())
      if (overlapping.length) showToast(lang==='fr'?'✓ Tu es ouvert·e à plusieurs plans sur ce créneau — on te trie ça':'✓ You\'re open to several plans here — we\'ll sort it for you', C.green)
      // B4 — faisabilité de TRAJET entre créneaux SÉQUENTIELS proches (les chevauchants = volontaires, ignorés).
      //   Trajet urbain ≈ distance_oiseau × 1.35 ÷ 30 km/h. gap < trajet → 🔴 · gap < trajet+15min → 🟠. Jamais bloquer.
      if (list.length && meetupPos[0] && meetupPos[1]) {
        for (const s of list) {
          if (!s.lat || !s.lng) continue
          const sStart = new Date(s.start_at).getTime(), sEnd = new Date(s.end_at).getTime()
          const gapMin = sStart >= endMs ? (sStart-endMs)/60000 : startMs >= sEnd ? (startMs-sEnd)/60000 : Infinity
          if (!isFinite(gapMin)) continue   // chevauchant = aucun trajet à faire → on ignore (intention assumée)
          const km = haversineKm(meetupPos[0], meetupPos[1], s.lat, s.lng)
          if (km <= 2) continue
          const needMin = (km * 1.35) / 30 * 60
          if (gapMin < needMin) {
            const rk=Math.round(km), rn=Math.round(needMin), rg=Math.round(gapMin)
            // Pools aléatoires (jamais 2× la même phrase) + signature persona aléatoire.
            const _main = roastInfeasible(getVeneritude(), lang, rk, rn, rg)
            const _q = personaQuip(getPersona(),'infeasible_trip',lang)
            showToast(_q ? `${_main}  ${_q}` : _main, C.orange)
            break
          } else if (gapMin < needMin + 15) {
            showToast(lang==='fr'
              ? `🟠 Trajet serré : ~${Math.round(needMin)} min de route pour ${Math.round(gapMin)} min dispo. Ça passe juste.`
              : `🟠 Tight trip: ~${Math.round(needMin)} min by road for ${Math.round(gapMin)} min available. Cutting it close.`, C.orange)
            break
          }
        }
      }
      if (list.length >= 3) await supabase.from('availabilities').update({ active:false }).eq('id', list[0].id) // plafond 3 → vire le plus ancien
      await supabase.from('availabilities').insert({ user_id:user.id, start_at:from.toISOString(), end_at:until.toISOString(), place:city, lat:meetupPos[0], lng:meetupPos[1], radius_km:Math.round(rayon), active:true })
    } catch {}

    // 0 lignes mises à jour → le profil n'existe pas encore → upsert
    if (!updated || updated.length === 0) {
      console.warn('[handleOuvrirFenetre] 0 rows updated — tentative upsert')
      const { error: e2 } = await supabase.from('profiles').upsert({
        id: user.id,
        is_available:true,
        available_from:from.toISOString(),
        available_until:until.toISOString(),
        available_city:city,
        center_lat:meetupPos[0],
        center_lng:meetupPos[1],
        available_radius_km:Math.round(rayon),
        available_modes: seekModes.length ? seekModes : null,
        pref_age_min: parseInt(ageMin) || 18,
        pref_age_max: ageMax === '65+' ? 99 : (parseInt(ageMax) || 99),
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

    // Flags Quick Clutch / Pin RDV fixe — colonnes optionnelles (design Mel). DÉFENSIF : update séparé,
    // si les colonnes ne sont pas encore migrées l'erreur est ignorée → la dispo reste valide (zéro régression).
    const { error: eFlags } = await supabase.from('profiles').update({ quick_clutch:quickClutch, intent_pinned:intentPinned } as any).eq('id',user.id)
    if (eFlags) console.warn('[handleOuvrirFenetre] flags quick_clutch/intent_pinned non sauvés (colonnes à migrer ?) :', eFlags.message)

    setUser(prev=>prev?{...prev,is_available:true,available_from:from.toISOString(),available_until:until.toISOString(),available_city:city,center_lat:meetupPos[0],center_lng:meetupPos[1],available_radius_km:rayon,available_modes:(seekModes.length?seekModes:null),quick_clutch:quickClutch,intent_pinned:intentPinned,bio:intentMsg||((user as any).bio)} as any:prev)
    showToast(`✦ Fenêtre ouverte · ${city} · ${Math.round(rayon)} km`,C.green)
    requestNotificationPermission()
    setFlow('app')
    setTab('presences')
    setTimeout(()=>loadProfiles(), 500) // Refresh la liste après mise à jour DB
  }

  const activateLive = () => {
    if (liveMode) { setLiveMode(false); return }
    // Animation d'activation
    setLiveActivating(true)
    setTimeout(() => {
      setLiveActivating(false)
      // Simulation : position Lausanne centre (Flon) — remplacé par GPS réel en prod
      setLivePos([46.5197, 6.6323])
      setLiveMode(true)
    }, 900)
  }

  // En prod : filtre GPS réel. En simulation (pos = Lausanne Flon) : affiche les profils disponibles ou les mocks
  const liveFiltered = liveMode && livePos ? (() => {
    const real = profiles.filter(p => {
      const now = Date.now()
      const from = (p as any).available_from ? new Date((p as any).available_from).getTime() : null
      const until = (p as any).available_until ? new Date((p as any).available_until).getTime() : null
      if (!from || !until || now < from || now > until) return false
      const lat = (p as any).center_lat, lng = (p as any).center_lng
      if (lat == null || lng == null) return false
      return haversineKm(livePos[0], livePos[1], lat, lng) <= 0.5
    })
    return real
  })() : []

  // ID du partenaire de Verrou actif — ces deux profils se cachent mutuellement
  const activeVerrouPartnerId = useMemo(() => {
    if (!activeVerrou || !user?.id) return null
    return activeVerrou.sender_id === user.id ? activeVerrou.receiver_id : activeVerrou.sender_id
  }, [activeVerrou, user?.id])

  // 5 zones de distance depuis le centre de disponibilité choisi (meetupPos)
  function getDistanceZone(theirLat: number|null, theirLng: number|null): string|null {
    if (theirLat == null || theirLng == null) return null
    const km = haversineKm(meetupPos[0], meetupPos[1], theirLat, theirLng)
    if (km < 0.5)  return '📍 À deux pas'
    if (km < 2)    return '📍 Dans le quartier'
    if (km < 10)   return '📍 Dans la ville'
    if (km < 50)   return '📍 Région proche'
    return '📍 À distance'
  }

  // Personnes avec qui j'ai déjà un Clutch actif (envoyé OU reçu) → masquées des Présences
  const activeClutchPartnerIds = new Set(
    (clutches as any[])
      .filter(c => ['pending','accepted','confirmed','checked_in'].includes(c.status))
      .map(c => c.sender_id===user?.id ? c.receiver_id : c.sender_id)
  )
  const filtered = (!availableRef ? [] : profiles).filter(p => {
    // 🤖 Mode RÉEL = on masque TOUS les bots (app vide pour tester avec de vrais amis)
    if (!demoOn() && (isTestProfile((p as any).id) || (p as any).is_bot || (p as any).account_type==='bot' || (p as any)._isGpsTestBot)) return false
    // Bots GPS de test (ignorent tous les filtres) — seulement en mode Démo
    if ((p as any)._isGpsTestBot) return demoOn()
    // Masquer le partenaire de Verrou actif (on a déjà un RDV ensemble)
    if (activeVerrouPartnerId && (p as any).id === activeVerrouPartnerId) return false
    // Masquer les personnes déjà clutchées (clutch en attente ou actif) — évite le doublon
    if (activeClutchPartnerIds.has((p as any).id)) return false
    // Masquer les personnes à qui j'ai mis un lapin (no-show) — elles ne réapparaissent pas
    if (lapinIds.has((p as any).id)) return false
    // Clutch Driver = rôle organisateur → masqué des Présences (visible uniquement dans Événements)
    if ((p as any).account_type === 'driver') return false
    // Filtre genre (MA préférence d'affichage)
    if (filterGender !== 'all') {
      const gk = genderKey((p as any).gender)
      if (gk !== 'X' && gk !== filterGender) return false
    }
    // Symétrie genre : est-ce que MON genre entre dans CE QU'ILS cherchent ?
    // looking_for est surchargé (parfois 'romance'/'friendship'/'pro' = mode) → on ne filtre QUE
    // si la valeur est explicitement 'M'/'F' (genre recherché). 'ALL'/mode/null = pas de filtre.
    {
      const theirSeek = (p as any).looking_for
      if (theirSeek === 'M' || theirSeek === 'F') {
        const myGk = genderKey((user as any)?.gender)
        if (myGk !== 'X' && myGk !== theirSeek) return false
      }
    }
    // Filtre MODE — intersection : on se voit si on partage ≥1 mode (Romance/Amitié/Pro/Parent).
    // Parent est exclusif côté UI (['parent'] seul) → ne matche que d'autres parents = exclut le reste.
    // Garde-fou rollout : si un côté n'a aucun mode défini → pas de filtre (ne casse pas les users actuels).
    {
      const myModes:string[] = Array.isArray((user as any)?.available_modes) ? (user as any).available_modes : []
      const theirModes:string[] = Array.isArray((p as any).available_modes) ? (p as any).available_modes : []
      if (myModes.length && theirModes.length) {
        if (!myModes.some(m => theirModes.includes(m))) return false
      }
    }
    // Filtre âge — bidirectionnel
    const theirAge = (p as any).age ? parseInt((p as any).age) : null
    const myAge = (user as any)?.age ? parseInt((user as any).age) : null
    if (theirAge !== null) {
      const minA = parseInt(ageMin) || 18
      const maxA = ageMax === '65+' ? 99 : (parseInt(ageMax) || 99)
      if (theirAge < minA || theirAge > maxA) return false
    }
    // Symétrie : est-ce que mon âge entre dans LEUR préférence ? (seulement si la valeur est définie)
    if (myAge !== null) {
      const theirPrefMin = (p as any).pref_age_min
      const theirPrefMax = (p as any).pref_age_max
      if (theirPrefMin != null && theirPrefMax != null) {
        if (myAge < theirPrefMin || myAge > theirPrefMax) return false
      }
    }
    // Filtre horaire : les créneaux doivent se chevaucher
    const myFrom = (user as any)?.available_from ? new Date((user as any).available_from).getTime() : null
    const myUntil = user?.available_until ? new Date(user.available_until).getTime() : null
    const theirFrom = (p as any).available_from ? new Date((p as any).available_from).getTime() : null
    const theirUntil = (p as any).available_until ? new Date((p as any).available_until).getTime() : null
    if (myFrom && myUntil && theirFrom && theirUntil) {
      // Pas de chevauchement si mon from >= leur until OU leur from >= mon until
      if (myFrom >= theirUntil || theirFrom >= myUntil) return false
    }
    // Exclure profils dans leur fenêtre RDV bloquée (1h avant → 2h après)
    const rdvLockedFrom = (p as any).rdv_locked_from
    const rdvLockedUntil = (p as any).rdv_locked_until
    if (rdvLockedFrom && rdvLockedUntil) {
      const now2 = Date.now()
      if (now2 >= new Date(rdvLockedFrom).getTime() && now2 <= new Date(rdvLockedUntil).getTime()) return false
    } else if (rdvLockedUntil && new Date(rdvLockedUntil) > new Date()) {
      // fallback ancien format (pas encore migré)
      return false
    }
    // Filtre géographique : les cercles de disponibilité doivent s'intersecter
    const theirLat = (p as any).center_lat, theirLng = (p as any).center_lng
    const theirRadius = (p as any).available_radius_km
    if (theirLat != null && theirLng != null && theirRadius != null) {
      const myRadius = (user as any)?.available_radius_km ?? rayon
      const dist = haversineKm(meetupPos[0], meetupPos[1], theirLat, theirLng)
      if (dist > myRadius + theirRadius) return false
    }
    return true
  })

  // ─── 🧠 LE CERVEAU : tri par compatibilité réelle + explication « affiché car… » ───
  // Poids v1 (ajustables) : intérêts communs 50% · proximité 30% · fiabilité 20%.
  // GPT validé : « compréhension > contrôle » → on EXPLIQUE pourquoi chaque profil remonte.
  const myInterestsLC = (Array.isArray((user as any)?.interests) ? (user as any).interests : []).map((x:string)=>String(x).toLowerCase())
  const compatScored = filtered.map(p => {
    const theirInt:string[] = Array.isArray((p as any).interests) ? (p as any).interests : []
    const shared = theirInt.filter(i => myInterestsLC.includes(String(i).toLowerCase()))
    const compat = (theirInt.length && myInterestsLC.length) ? shared.length / Math.max(theirInt.length, myInterestsLC.length) : 0
    const lat = (p as any).center_lat, lng = (p as any).center_lng
    const km = (lat!=null && lng!=null) ? haversineKm(meetupPos[0], meetupPos[1], lat, lng) : null
    const myR = (user as any)?.available_radius_km ?? rayon
    const prox = km==null ? 0.3 : Math.max(0, 1 - km/Math.max(myR,1))
    const fiab = (p as any).reliability_score!=null ? (p as any).reliability_score/100 : 0.5
    const score = compat*0.5 + prox*0.3 + fiab*0.2
    // dots 1..5 + raisons lisibles (les 2 plus fortes)
    const dots = Math.max(1, Math.min(5, Math.round(1 + score*4)))
    const reasons:string[] = []
    if (shared.length>=2) reasons.push(`${shared.length} goûts communs`)
    else if (shared.length===1) reasons.push(`Goût commun : ${shared[0]}`)
    if (km!=null && km<2) reasons.push('Tout près')
    else if (km!=null && km<10) reasons.push('Dans la ville')
    if ((p as any).reliability_score!=null && (p as any).reliability_score>=80) reasons.push('Très fiable')
    return { p, score, dots, reasons }
  }).sort((a,b)=> b.score - a.score)
  const sortedFiltered = compatScored.map(s => s.p)
  const compatInfo = new Map(compatScored.map(s => [(s.p as any).id, s]))

  // Fenêtre bloquée pour l'utilisateur courant (calculée depuis activeVerrou)
  const myRdvWindow = useMemo(() => {
    if (!activeVerrou?.proposed_time) return null
    const rdvMs = new Date(activeVerrou.proposed_time).getTime()
    const lockFrom = rdvMs - TRUST_CONFIG.RDV_LOCK_BEFORE_MIN * 60*1000
    const lockUntil = rdvMs + TRUST_CONFIG.RDV_LOCK_AFTER_H * 3600*1000
    const now = Date.now()
    if (now < lockFrom || now > lockUntil) return null
    return { lockFrom, lockUntil, rdvMs }
  }, [activeVerrou])

  // Garde avant d'envoyer un Clutch : pas pendant un RDV verrouillé, ET pas tant qu'un feedback
  // post-RDV n'est pas rempli (David : « je ne dois pas pouvoir clutcher si j'ai pas fini le feedback »).
  const clutchGuard = (): boolean => {
    if (myRdvWindow) {
      showToast(`🔒 RDV en cours — disponible après ${new Date(myRdvWindow.lockUntil).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}`, C.orange)
      return false
    }
    if (pendingFeedbacks > 0) {
      showToast(lang==='en'?'💬 Finish your feedback on the last meetup first':'💬 Termine ton retour sur le dernier RDV avant d\'en lancer un nouveau', C.orange)
      setTab('clutchs')
      return false
    }
    return true
  }

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
      {/* Toasts désactivés — remplacés par notifications dans les canvas */}
      {screen==='login'    && <LoginScreen onSuccess={p=>{
        setUser(p)
        import('@/lib/onesignal').then(({ setOneSignalExternalId }) => setOneSignalExternalId(p.id)).catch(() => {})
        // Profil incomplet → wizard setup
        const incomplete = !p.photo_url || !p.age || !(p as any).gender
        if (incomplete) { setScreen('setup'); return }
        setScreen('main')
        if (p.is_available && p.available_until && new Date(p.available_until) > new Date()) setFlow('app')
      }} onRegister={()=>setScreen('register')} showToast={showToast}/>}
      {screen==='register' && <RegisterScreen onSuccess={p=>{
        setUser(p)
        // Nouveau user → onboarding si jamais fait
        const done = typeof window !== 'undefined' && localStorage.getItem('clutch_onboarding_done')
        setScreen(done ? 'setup' : 'onboarding')
      }} onLogin={()=>setScreen('login')} showToast={showToast}/>}
      {screen==='onboarding' && <OnboardingScreen onDone={()=>{
        if (typeof window !== 'undefined') localStorage.setItem('clutch_onboarding_done','1')
        setScreen('setup')
      }} isPreview={!user}/>}
      {screen==='setup' && (user
        ? <SetupWizard user={user} showToast={showToast} onDone={p=>{ setUser(p); setScreen('main') }}/>
        : <SetupWizard user={{id:'preview',name:'',bio:'',job:'',photo_url:null,age:null,is_available:false,available_until:null,available_city:null,score:0} as any} showToast={showToast} isPreview onDone={()=>setScreen('login')}/>
      )}

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
                  <div style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:900,letterSpacing:'.2em',textTransform:'uppercase',color:'#fff',background:C.bordeaux,padding:'6px 13px',borderRadius:20}}>
                    ✦ Clutch
                  </div>
                  <button onClick={()=>{setFlow('app');setTab('presences')}} style={{fontSize:12,fontWeight:800,color:'#fff',background:C.bordeaux,padding:'6px 14px',borderRadius:20,border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                    {lang==='en'?'← Cancel':'← Annuler'}
                  </button>
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
                  title={lang==='en'?'Recenter on my position':'Recentrer sur ma position'}
                  style={{position:'absolute',top:8,right:8,zIndex:1200,
                    padding:'6px 12px',borderRadius:20,
                    background:C.bordeaux,border:'none',
                    color:'#fff',fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',
                    pointerEvents:'all'}}>
                  {lang==='en'?'⊕ My position':'⊕ Ma position'}
                </button>
                {/* Hint sobre — bas gauche */}
                <div style={{position:'absolute',bottom:8,left:8,zIndex:1100,pointerEvents:'none'}}>
                  <div style={{background:C.bordeaux,borderRadius:8,padding:'5px 11px',fontSize:10,fontWeight:600,color:'#fff',whiteSpace:'nowrap'}}>
                    {lang==='en'?'Move map · long-press to pin':'Déplace la carte · appui long = épingler'}
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
                {/* Slider rayon — sans légende km */}
                {(()=>{
                  const pct = rayonToSlider(rayon)
                  const updateFromEvent = (clientX: number) => {
                    const el = sliderRef.current; if(!el) return
                    const rect = el.getBoundingClientRect()
                    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
                    setRayon(sliderToRayon(ratio * 100))
                  }
                  return (
                    <div style={{padding:'8px 16px 4px',display:'flex',alignItems:'center',gap:10}}>
                      <span style={{fontSize:11,color:C.whiteMid,flexShrink:0}}>📍 {fmtKm(rayon)}</span>
                      <div ref={sliderRef}
                        style={{flex:1,position:'relative',height:44,display:'flex',alignItems:'center',cursor:'pointer',touchAction:'none'}}
                        onPointerDown={e=>{(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);updateFromEvent(e.clientX)}}
                        onPointerMove={e=>{if(e.buttons===0)return;updateFromEvent(e.clientX)}}>
                        <div style={{position:'absolute',left:0,right:0,height:6,borderRadius:3,background:'#E3E3E3',pointerEvents:'none'}}/>
                        <div style={{position:'absolute',left:0,width:`${pct}%`,height:6,borderRadius:3,background:C.orange,pointerEvents:'none'}}/>
                        <div style={{position:'absolute',left:`calc(${pct}% - 6px)`,width:12,height:30,borderRadius:4,background:C.orange,border:`2px solid ${C.bg}`,pointerEvents:'none'}}/>
                      </div>
                    </div>
                  )
                })()}

                {/* 2 roues temps */}
                <div style={{display:'flex',gap:0,padding:'0 8px',height:106,alignItems:'stretch'}}>
                  <JogWheel slots={initSlots} value={fromTime} onChange={v => {
                    setFromTime(v)
                    const [h,m]=v.split(':').map(Number); const b=new Date(); b.setHours(h,m,0,0)
                    const ns=makeSlots(new Date(b.getTime()+5*60_000)).slice(0,216)
                    if (!ns.includes(untilTime)) setUntilTime(ns[1]||ns[0])
                  }}/>
                  <div style={{width:1,background:C.border,margin:'12px 4px'}}/>
                  <JogWheel slots={untilSlots} value={untilTime} onChange={setUntilTime}/>
                </div>

                {/* CTA bas */}
                <div style={{padding:'8px 20px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                  {/* Step pill */}
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:C.pink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:'#fff'}}>1</div>
                    <div style={{width:11,height:2,borderRadius:1,background:C.salmonMid}}/>
                    <div style={{width:18,height:18,borderRadius:'50%',border:`1.5px solid ${C.salmonMid}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:C.salmonMid}}>2</div>
                  </div>
                  <button onClick={()=>{
                    const center = mapGetCenterRef.current?.() || ME
                    setMeetupPos(center)
                    setFlow('options')
                  }} style={{
                    padding:'13px 32px',
                    background:C.green,border:'none',
                    borderRadius:24,color:'#fff',
                    fontSize:15,fontWeight:900,
                    cursor:'pointer',fontFamily:'inherit',
                    letterSpacing:'-.02em',boxShadow:'0 5px 16px rgba(119,188,31,.32)',
                  }}>
                    {lang==='en'?'Next →':'Suivant →'}
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
              <div style={{padding:'12px 16px 14px',paddingTop:'calc(var(--sat) + 12px)',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                  <button onClick={()=>setFlow('carte')} style={{background:C.whiteFaint,border:`1px solid ${C.border}`,borderRadius:10,width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.salmon,fontSize:16,flexShrink:0}}>←</button>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:17,fontWeight:900,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t('page2.type')}</div>
                    <div style={{fontSize:10,color:C.whiteMid,marginTop:1}}>{t('page2.intention')}</div>
                  </div>
                  {/* Étape 2/2 — indicateur Mel : actif = rond rose + chiffre blanc, inactif = gris moyen, trait gris (≈90%) */}
                  <div style={{display:'flex',alignItems:'center',gap:3,flexShrink:0}}>
                    <div style={{width:18,height:18,borderRadius:'50%',border:`1.5px solid ${C.salmonMid}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700,color:C.salmonMid}}>1</div>
                    <div style={{width:11,height:2,borderRadius:1,background:C.salmonMid}}/>
                    <div style={{width:18,height:18,borderRadius:'50%',background:C.pink,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:900,color:'#fff'}}>2</div>
                  </div>
                  <button onClick={()=>{setFlow('app');setTab('presences')}} style={{background:'transparent',border:`1px solid ${C.border}`,borderRadius:10,padding:'5px 10px',cursor:'pointer',color:C.whiteMid,fontSize:11,fontWeight:700,fontFamily:'inherit',flexShrink:0}}>
                    ✕
                  </button>
                </div>
                {/* Récap créneau — visible dès step 2 */}
                <div style={{display:'flex',gap:10,fontSize:11,color:C.whiteMid,background:C.whiteFaint,borderRadius:10,padding:'7px 10px'}}>
                  <span>🕐 <strong style={{color:C.white}}>{fromTime}–{untilTime}</strong></span>
                  <span>📍 <strong style={{color:C.salmon}}>{nearestCity(meetupPos[0],meetupPos[1])}</strong> · <strong style={{color:C.orange}}>{fmtKm(rayon)}</strong></span>
                </div>
              </div>

              <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',padding:'14px 16px 0'}}>

                {/* ⚡ QUICK CLUTCH — juste sous l'heure (design Mel : bouton rond gris/rose). Compact, pas une grosse ligne. */}
                <button onClick={()=>{ hap('light'); setQuickClutch(v=>!v) }}
                  style={{width:'100%',display:'flex',alignItems:'center',gap:11,padding:'9px 11px',marginBottom:16,borderRadius:14,
                    border:`1.5px solid ${quickClutch?'#EB6BB0':C.border}`,background:quickClutch?'rgba(235,107,176,.09)':'transparent',
                    cursor:'pointer',fontFamily:'inherit',transition:'all .2s'}}>
                  <img src={quickClutch?'/icons/quickclutch_on.svg':'/icons/quickclutch_off.svg'} width={38} height={38} alt=""
                    style={{flexShrink:0,transition:'transform .25s cubic-bezier(.22,1,.36,1)',transform:quickClutch?'scale(1.06)':'none'}}/>
                  <div style={{flex:1,textAlign:'left'}}>
                    <div style={{fontSize:13,fontWeight:800,color:quickClutch?'#EB6BB0':C.white}}>Quick Clutch · 1h</div>
                    <div style={{fontSize:10,color:C.whiteMid,marginTop:1,lineHeight:1.3}}>{lang==='en'?'Short & spontaneous — a dot shows on your photo':'RDV court & spontané — une pastille s\'affiche sur ta photo'}</div>
                  </div>
                </button>

                {/* 1. MODE — multi-select (pas exclusif : on peut chercher rencontre ET amitié) */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid}}>Mode <span style={{fontWeight:400,textTransform:'none'}}>— {lang==='en'?'multiple choices allowed':'plusieurs choix possibles'}</span></div>
                  </div>
                  <div style={{display:'flex',gap:9}}>
                    {([
                      {k:'romantic',icon:'/icons/mel/rencontre_amour.svg',  l:'Romance'},
                      {k:'friend',  icon:'/icons/mel/rencontre_amis.svg',   l:lang==='en'?'Friendship':'Amitié'},
                      {k:'pro',     icon:'/icons/mel/rencontre_pro.svg',    l:'Pro'},
                      {k:'parent',  icon:'/icons/mel/rencontre_parents.svg',l:lang==='en'?'Family':'Famille'},
                    ] as const).map(m=>{
                      const on=seekModes.includes(m.k)
                      return <button key={m.k} onClick={()=>{
                        if (m.k==='parent') { setSeekModes(on ? [] : ['parent']) }       // Mode Famille = exclusif
                        else { const without = seekModes.filter(x=>x!==m.k&&x!=='parent'); setSeekModes(on ? without : [...without, m.k]) }
                      }}
                        style={{flex:1,background:'transparent',border:'none',padding:0,cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:0}}>
                        {/* Tuile surélevée — remplie plum quand sélectionnée (design Mel) */}
                        <div style={{width:'100%',height:58,borderRadius:15,display:'flex',alignItems:'center',justifyContent:'center',
                          background:on?C.bordeaux:'#fff',border:on?'none':`1px solid ${C.border}`,
                          boxShadow:on?'0 2px 4px rgba(120,115,125,.22), 0 8px 18px rgba(120,115,125,.30)':'0 1px 3px rgba(120,115,125,.18), 0 4px 11px rgba(120,115,125,.20)',transition:'all .15s'}}>
                          {on ? <img src={m.icon.replace('.svg','_color.svg')} width={32} height={32} alt="" style={{display:'block'}}/> : <MelIcon src={m.icon} color={C.borderStrong} size={28}/>}
                        </div>
                        <div style={{fontSize:10.5,fontWeight:on?900:600,color:on?C.pink:C.whiteMid,whiteSpace:'nowrap'}}>{m.l}</div>
                      </button>
                    })}
                  </div>
                  {seekModes.length===0&&<div style={{fontSize:9,color:C.orange,marginTop:4}}>⚠️ {lang==='en'?'Select at least one mode to be visible':'Sélectionne au moins un mode pour être visible'}</div>}
                </div>

                {/* 2. GENRE RECHERCHÉ */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid,marginBottom:8}}>{lang==='en'?'I want to meet…':'Je cherche…'}</div>
                  <div style={{display:'flex',gap:9}}>
                    {([
                      {k:'M',   icon:'/icons/mel/homme.svg',       l:lang==='en'?'Men':'Hommes'},
                      {k:'F',   icon:'/icons/mel/femme.svg',       l:lang==='en'?'Women':'Femmes'},
                      {k:'X',   icon:'/icons/mel/non-binaire.svg', l:lang==='en'?'Non-binary':'Non-binaire'},
                      {k:'all', icon:'/icons/mel/neutre.svg',      l:lang==='en'?'Doesn\'t matter':'Peu importe'},
                    ] as const).map(g=>{
                      const on=seekGender===g.k
                      return <button key={g.k} onClick={()=>setSeekGender(g.k as any)}
                        style={{flex:1,background:'transparent',border:'none',padding:0,cursor:'pointer',fontFamily:'inherit',display:'flex',flexDirection:'column',alignItems:'center',gap:6,minWidth:0}}>
                        <div style={{width:'100%',height:54,borderRadius:15,display:'flex',alignItems:'center',justifyContent:'center',
                          background:on?C.bordeaux:'#fff',border:on?'none':`1px solid ${C.border}`,
                          boxShadow:on?'0 2px 4px rgba(120,115,125,.22), 0 8px 18px rgba(120,115,125,.30)':'0 1px 3px rgba(120,115,125,.18), 0 4px 11px rgba(120,115,125,.20)',transition:'all .15s'}}>
                          {on ? <img src={g.icon.replace('.svg','_color.svg')} width={28} height={28} alt="" style={{display:'block'}}/> : <MelIcon src={g.icon} color={C.borderStrong} size={26}/>}
                        </div>
                        <div style={{fontSize:10,fontWeight:on?900:600,color:on?C.pink:C.whiteMid,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'100%'}}>{g.l}</div>
                      </button>
                    })}
                  </div>
                </div>

                {/* 3. TRANCHE D'ÂGE — double molette min/max */}
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid,marginBottom:4}}>
                    {lang==='en'?'Age range':'Tranche d\'âge'}
                    <span style={{fontWeight:400,textTransform:'none',marginLeft:6,color:C.orange}}>{ageMin} – {ageMax} ans</span>
                  </div>
                  {/* Étiquettes DE / À — même style que From/To des heures */}
                  <div style={{display:'flex',padding:'4px 12px 0',gap:4,alignItems:'center'}}>
                    <div style={{flex:1,textAlign:'center'}}>
                      <span style={{fontSize:16,fontWeight:900,color:C.salmon,letterSpacing:'-.02em'}}>{lang==='en'?'From':'De'}</span>
                    </div>
                    <div style={{width:1,background:'transparent',margin:'0 4px'}}/>
                    <div style={{flex:1,textAlign:'center'}}>
                      <span style={{fontSize:16,fontWeight:900,color:C.salmon,letterSpacing:'-.02em'}}>{lang==='en'?'To':'À'}</span>
                    </div>
                  </div>
                  {/* Molettes — même layout exact que les heures */}
                  <div style={{display:'flex',gap:0,padding:'0 8px',height:106,alignItems:'stretch'}}
                    onTouchStart={e=>e.stopPropagation()}
                    onWheel={e=>e.stopPropagation()}>
                    <JogWheel
                      slots={Array.from({length:48},(_,i)=>String(i+18))}
                      value={ageMin}
                      onChange={v=>{setAgeMin(v);if(parseInt(v)>=parseInt(ageMax))setAgeMax(String(Math.min(65,parseInt(v)+1)))}}
                      accent={true}
                    />
                    <div style={{width:1,background:C.border,margin:'12px 4px'}}/>
                    <JogWheel
                      slots={[...Array.from({length:47},(_,i)=>String(i+19)),'65+']}
                      value={ageMax}
                      onChange={v=>{setAgeMax(v);if(v!=='65+'&&parseInt(v)<=parseInt(ageMin))setAgeMin(String(Math.max(18,parseInt(v)-1)))}}
                      accent={false}
                    />
                  </div>
                </div>

                {/* 4. (Menu « J'ai envie de » retiré — design Mel 22.06. L'intention passe par le message libre ci-dessous.) */}

                {/* 5. MESSAGE D'INTENTION */}
                <div style={{marginBottom:16}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:'.16em',textTransform:'uppercase',color:C.whiteMid}}>{t('page2.intMsg')} <span style={{fontWeight:400,textTransform:'none'}}>{t('page2.optional')}</span></div>
                    <div style={{fontSize:9,color:intentMsg.length>48?C.orange:C.whiteMid}}>{intentMsg.length}/60</div>
                  </div>
                  <div style={{position:'relative'}}>
                    <textarea value={intentMsg} onChange={e=>setIntentMsg(e.target.value.slice(0,60))} readOnly={intentPinned}
                      placeholder={t('page2.intPlaceholder')}
                      rows={2} style={{width:'100%',background:intentPinned?C.salmonFaint:C.whiteFaint,border:`1px solid ${intentPinned?C.salmonMid:C.border}`,borderRadius:12,padding:'10px 38px 10px 14px',fontSize:12,color:C.white,outline:'none',fontFamily:'inherit',resize:'none',caretColor:C.salmon,boxSizing:'border-box'}}/>
                    {intentPinned && <img src="/icons/mel/Pin_RDVfixe.svg" width={18} height={18} alt="" style={{position:'absolute',top:10,right:12,opacity:.9,pointerEvents:'none'}}/>}
                  </div>
                  {/* Pin RDV fixe — descriptif non modifiable (design Mel) */}
                  <button onClick={()=>{ if(!intentMsg.trim())return; setIntentPinned(v=>!v) }} style={{marginTop:8,width:'100%',display:'flex',alignItems:'center',gap:8,padding:'9px 12px',borderRadius:10,border:`1.5px solid ${intentPinned?C.salmonMid:C.border}`,background:intentPinned?`${C.salmonMid}14`:'transparent',cursor:intentMsg.trim()?'pointer':'default',opacity:intentMsg.trim()?1:.45,fontFamily:'inherit'}}>
                    <img src="/icons/mel/Pin_RDVfixe.svg" width={16} height={16} alt=""/>
                    <div style={{flex:1,textAlign:'left'}}>
                      <div style={{fontSize:11.5,fontWeight:700,color:intentPinned?C.salmon:C.whiteMid}}>{lang==='en'?'Locked description':'Descriptif non modifiable'}</div>
                      <div style={{fontSize:9,color:C.whiteMid}}>{lang==='en'?'Shown on your mini-profile · can\'t be changed':'Affiché sur ton mini-profil · ne peut plus changer'}</div>
                    </div>
                    <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${intentPinned?C.salmonMid:C.border}`,background:intentPinned?C.salmonMid:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{intentPinned&&<span style={{color:'#fff',fontSize:11,fontWeight:900}}>✓</span>}</div>
                  </button>
                  <div style={{fontSize:9,color:C.whiteMid,marginTop:3}}>{t('page2.note')}</div>
                </div>


              </div>

              {/* Boutons CTA — ANNULER (gris) + SUIVANT VERT (design Mel) */}
              <div style={{padding:'12px 16px 40px',borderTop:`1px solid ${C.border}`,flexShrink:0}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <button onClick={()=>{setFlow('app');setTab('presences')}} style={{padding:'15px 22px',borderRadius:24,background:'transparent',border:`1.5px solid ${C.border}`,color:C.whiteMid,fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit',flexShrink:0,letterSpacing:'.02em'}}>{lang==='en'?'CANCEL':'ANNULER'}</button>
                  <button onClick={handleOuvrirFenetre} style={{
                    flex:1,padding:'16px',
                    background:C.green,
                    border:'none',borderRadius:24,color:'#fff',
                    fontSize:16,fontWeight:900,cursor:'pointer',fontFamily:'inherit',
                    letterSpacing:'-.02em',boxShadow:'0 5px 16px rgba(119,188,31,.32)',
                  }}>
                    {t('page2.cta')}
                  </button>
                </div>
                <div style={{textAlign:'center',marginTop:8,fontSize:10,color:C.whiteMid}}>
                  {lang==='fr'?`Visible dans un rayon de ${fmtKm(rayon)} autour de ${nearestCity(meetupPos[0],meetupPos[1])}`:`Visible within ${fmtKm(rayon)} of ${nearestCity(meetupPos[0],meetupPos[1])}`}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              PAGE 3 — APP (tab bar visible)
          ══════════════════════════════════════════════ */}
          {flow==='app' && (
            <>
              {/* ── TAB : PRÉSENCES — cards compactes, tap = détail + Clutcher ── */}
              {tab==='presences' && (<>
                <div className="fi" style={{position:'fixed',inset:0,bottom:'calc(72px + var(--sab))',background:C.bg,display:'flex',flexDirection:'column'}}>

                  {/* ── HEADER ── */}
                  <div style={{padding:'12px 16px 0',paddingTop:'calc(var(--sat) + 10px)',flexShrink:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <div style={{flex:1}}>
                        {/* Titre « Présences » retiré (déjà dans la nav du bas) — on garde juste l'info utile (David : libérer le haut) */}
                        <div style={{fontSize:12.5,color:C.whiteMid,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          <span style={{fontWeight:700,color:C.white}}>{filtered.length} {lang==='en'?`available nearby`:`disponible${filtered.length!==1?'s':''} dans votre rayon`}</span>
                          <span style={{display:'inline-flex',alignItems:'center',justifyContent:'center',width:14,height:14,borderRadius:'50%',border:`1px solid ${C.border}`,fontSize:8,color:C.whiteMid,cursor:'default'}} title="Seules les personnes qui ont ouvert une fenêtre de disponibilité apparaissent ici.">?</span>
                          {user?.is_available && user?.available_until && new Date(user.available_until)>new Date() && (
                            <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,borderRadius:20,padding:'2px 7px',fontSize:10,color:C.whiteMid}}>
                              <span style={{width:5,height:5,borderRadius:'50%',background:C.green,flexShrink:0,display:'inline-block'}}/>
                              {(user as any).available_from?new Date((user as any).available_from).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})+'–':''}
                              {new Date(user.available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
                              {(user as any).available_radius_km?' · '+Math.round((user as any).available_radius_km)+'km':''}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Boutons header Présences */}
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        {/* Bouton Live header RETIRÉ (David : doublon — le Clutch Live flottant en bas suffit) */}
                        {/* 💼 Manoski toggle */}
                        <button onClick={()=>{setProMode(!proMode);setProJobFilter(null)}}
                          style={{padding:'6px 10px',borderRadius:20,border:`1px solid ${proMode?C.gold:C.border}`,background:proMode?`${C.gold}22`:'transparent',color:proMode?C.gold:C.whiteMid,fontSize:11,fontWeight:proMode?800:500,cursor:'pointer',fontFamily:'inherit'}}>
                          💼
                        </button>
                        <button onClick={rdvBlocked ? ()=>showToast('RDV en cours — reviens 2h après ton RDV',C.orange) : ()=>setFlow('carte')} style={{padding:'6px 12px',borderRadius:20,border:`1px solid ${rdvBlocked?C.border:C.orange}`,background:rdvBlocked?'rgba(83,41,67,.1)':C.orange,color:rdvBlocked?`${C.salmon}88`:'#fff',fontSize:11,fontWeight:800,cursor:rdvBlocked?'not-allowed':'pointer',fontFamily:'inherit',letterSpacing:0.3,whiteSpace:'nowrap',opacity:rdvBlocked?.5:1}}>
                          {/* D2 — toujours une ACTION claire (« + Créneau »), jamais un statut ambigu (« ✦ Actif ») :
                              l'état « actif » est déjà montré par le point vert + l'heure + le badge 📍N/3 à côté. */}
                          {rdvBlocked ? '🔒 RDV' : (isPremium ? '+ Disponibilité' : '+ Créneau')}
                        </button>
                        {myAvail.length>0 && (
                          <button onClick={()=>setShowSlots(true)} title={lang==='en'?'Your active availability slots (max 3)':'Tes créneaux de disponibilité actifs (max 3)'}
                            style={{display:'inline-flex',alignItems:'center',gap:3,padding:'6px 9px',borderRadius:20,border:`1px solid ${C.green}55`,background:`${C.green}1a`,color:C.green,fontSize:11,fontWeight:800,whiteSpace:'nowrap',cursor:'pointer',fontFamily:'inherit'}}>
                            📍 {myAvail.length}/3
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{height:1,background:C.border,marginLeft:-16,marginRight:-16}}/>
                  </div>

                  {/* ── LISTE ── */}
                  <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0,padding:'10px 14px 100px'}}>

                    {/* Pastille Clutch Night DÉPLACÉE → c'est maintenant un MODE dans l'onglet Événements (David : « ne va pas du tout là-haut »). */}

                    {/* ══ MODE PRO — MANOSKI ══ */}
                    {proMode && !proJobFilter && (() => {
                      // Comptage par catégorie parmi les profils dispo
                      const PRO_CATS = [
                        '💻 Tech','🎨 Créatif','📸 Photo/Vidéo','📣 Marketing','💰 Finance',
                        '⚕️ Santé','⚖️ Droit','📚 Éducation','🍕 Cuisine/Chef','🎵 Musique',
                        '🏗 Architecture','🛍 Commerce','🏃 Sport/Coach','✈️ Tourisme','🔬 Sciences',
                        '🔧 Artisan/Bricolage','⚡ Électricité','🪵 Menuiserie','🔩 Mécanique','✂️ Coiffure/Beauté',
                        '🌱 Agriculture/Nature','🎭 Théâtre/Scène','🎬 Cinéma/Télé','📊 Consulting','🏠 Immobilier',
                        '👗 Mode/Textile','🌍 ONG/Social','🍷 Sommellerie/Cave','🐾 Animaux/Véto','Autre'
                      ]
                      const catCounts = PRO_CATS.map(cat => ({
                        cat,
                        count: filtered.filter(p => (p as any).job_category === cat).length
                      })).filter(x => x.count > 0).sort((a,b) => b.count - a.count)
                      const uncategorized = filtered.filter(p => !(p as any).job_category && (p as any).job).length
                      return (
                        <div>
                          <div style={{marginBottom:16}}>
                            <div style={{fontSize:16,fontWeight:900,color:C.gold,marginBottom:2}}>💼 Mode Pro</div>
                            <div style={{fontSize:11,color:C.whiteMid}}>
                              {filtered.length} personne{filtered.length!==1?'s':''} disponible{filtered.length!==1?'s':''} — filtre par domaine
                            </div>
                          </div>
                          {catCounts.length === 0 && (
                            <div style={{textAlign:'center',padding:'40px 20px',color:C.whiteMid}}>
                              <div style={{fontSize:36,marginBottom:8}}>🔭</div>
                              <div style={{fontSize:13,fontWeight:700,color:C.white}}>Aucun profil avec domaine pro</div>
                              <div style={{fontSize:11,marginTop:4}}>Les gens configurent ça dans leur profil → Réglages</div>
                            </div>
                          )}
                          <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {catCounts.map(({cat,count}) => (
                              <button key={cat} onClick={()=>setProJobFilter(cat)}
                                style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>
                                <div style={{fontSize:24,width:36,textAlign:'center',flexShrink:0}}>{cat.split(' ')[0]}</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:14,fontWeight:700,color:C.white}}>{cat.substring(cat.indexOf(' ')+1)}</div>
                                  <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{count} personne{count!==1?'s':''} disponible{count!==1?'s':''}</div>
                                </div>
                                <div style={{display:'flex',alignItems:'center',gap:6}}>
                                  <div style={{background:`${C.gold}22`,border:`1px solid ${C.gold}44`,borderRadius:20,padding:'3px 10px',color:C.gold,fontSize:12,fontWeight:900}}>{count}</div>
                                  <span style={{color:C.whiteMid,fontSize:16}}>›</span>
                                </div>
                              </button>
                            ))}
                            {uncategorized > 0 && (
                              <button onClick={()=>setProJobFilter('__job__')}
                                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'transparent',border:`1px dashed ${C.border}`,borderRadius:14,cursor:'pointer',fontFamily:'inherit',textAlign:'left',width:'100%'}}>
                                <div style={{fontSize:22,width:36,textAlign:'center'}}>💼</div>
                                <div style={{flex:1}}>
                                  <div style={{fontSize:13,fontWeight:600,color:C.whiteMid}}>Autres profils avec métier</div>
                                  <div style={{fontSize:11,color:C.whiteMid,opacity:.6}}>{uncategorized} profil{uncategorized!==1?'s':''}</div>
                                </div>
                                <span style={{color:C.whiteMid,fontSize:16}}>›</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Mode Pro — liste des profils d'une catégorie */}
                    {proMode && proJobFilter && (() => {
                      const proFiltered = proJobFilter === '__job__'
                        ? filtered.filter(p => !(p as any).job_category && (p as any).job)
                        : filtered.filter(p => (p as any).job_category === proJobFilter)
                      return (
                        <div>
                          <button onClick={()=>setProJobFilter(null)} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.gold,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'inherit',marginBottom:14,padding:0}}>
                            ← Retour aux domaines
                          </button>
                          <div style={{fontSize:14,fontWeight:900,color:C.white,marginBottom:4}}>
                            {proJobFilter === '__job__' ? '💼 Autres profils' : proJobFilter}
                          </div>
                          <div style={{fontSize:11,color:C.whiteMid,marginBottom:14}}>{proFiltered.length} disponible{proFiltered.length!==1?'s':''}</div>
                          {proFiltered.length === 0 && (
                            <div style={{textAlign:'center',padding:'40px 0',color:C.whiteMid}}>
                              <div style={{fontSize:32}}>🔭</div>
                              <div style={{fontSize:13,marginTop:8}}>Aucun profil dans ce domaine pour l'instant</div>
                            </div>
                          )}
                        </div>
                      )
                    })()}

                    {/* Liste normale (masquée en mode pro catégorie) */}
                    {(!proMode || proJobFilter) && (() => {
                      const displayProfiles = proMode && proJobFilter
                        ? (proJobFilter === '__job__'
                            ? filtered.filter(p => !(p as any).job_category && (p as any).job)
                            : filtered.filter(p => (p as any).job_category === proJobFilter))
                        : filtered
                      return <>{/* profiles rendered below */}</>
                    })()}

                    {/* Banner invisible */}
                    {!availableRef && (
                      <div style={{background:'rgba(235,107,175,.08)',border:`1px solid ${C.orange}33`,borderRadius:10,padding:'10px 12px',marginBottom:10,display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:14,flexShrink:0}}>{isPremium?'👁':'◌'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:700,color:C.orange}}>{isPremium?'Mode discret — tu es invisible':'Tu n\'es pas visible pour l\'instant'}</div>
                          <div style={{fontSize:10,color:C.whiteMid,marginTop:1}}>{isPremium?'Tu peux explorer sans être vu·e':'Ouvre un créneau pour apparaître'}</div>
                        </div>
                        {!isPremium&&<button onClick={()=>setFlow('carte')} style={{padding:'5px 10px',borderRadius:8,background:`${C.orange}22`,border:`1px solid ${C.orange}44`,color:C.orange,fontSize:10,fontWeight:800,cursor:'pointer',fontFamily:'inherit',flexShrink:0}}>+ Créneau</button>}
                      </div>
                    )}

                    {/* Bannière Mode Live supprimée — bouton dans header */}

                    {/* Banner saturation femmes */}
                    {isWomanSaturated && (
                      <div style={{background:`${C.orange}15`,border:`1px solid ${C.orange}33`,borderRadius:12,padding:'10px 14px',marginBottom:10,display:'flex',gap:8,alignItems:'center'}}>
                        <span style={{fontSize:16}}>🛡️</span>
                        <div>
                          <div style={{fontSize:12,fontWeight:800,color:C.orange}}>Protection activée</div>
                          <div style={{fontSize:10,color:C.whiteMid}}>Tu as reçu {MAX_CLUTCHS_PER_DAY_WOMEN} clutchs aujourd'hui. Reviens demain ou améliore ton score.</div>
                        </div>
                      </div>
                    )}

                    {/* Section LIVE déplacée en overlay plein écran */}

                    {/* Mode occupé — Verrou actif = profils masqués */}
                    {activeVerrou ? (
                      <div style={{textAlign:'center',padding:'50px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                        <div style={{fontSize:44}}>🔒</div>
                        <div style={{fontSize:17,fontWeight:900,color:C.white}}>
                          {myRdvWindow ? 'RDV en cours' : 'Tu as un Verrou'}
                        </div>
                        <div style={{fontSize:13,color:C.whiteMid,lineHeight:1.5}}>
                          {activeVerrou.venue && <><strong style={{color:C.salmon}}>{activeVerrou.venue}</strong><br/></>}
                          {myRdvWindow ? <>
                            Profils masqués jusqu'à{' '}
                            <strong style={{color:C.orange}}>
                              {new Date(myRdvWindow.lockUntil).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
                            </strong>
                          </> : <>
                            RDV prévu à{' '}
                            <strong style={{color:C.orange}}>
                              {new Date(activeVerrou.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
                            </strong>
                            {' '}— profils masqués
                          </>}
                        </div>
                        <div style={{fontSize:11,color:`${C.whiteMid}88`,marginTop:4}}>
                          Tu réapparaîtras automatiquement après ton RDV
                        </div>
                      </div>
                    ) : (
                    /* Empty state */
                    filtered.length===0
                      ? <div style={{textAlign:'center',padding:'60px 20px',color:C.whiteMid}}>
                          <div style={{fontSize:32,marginBottom:10}}>⧗</div>
                          <div style={{fontSize:15,fontWeight:700,color:C.white,marginBottom:6}}>{t('discover.none')}</div>
                          <div style={{fontSize:12}}>{t('discover.nonenote')}</div>
                        </div>

                      : (proMode && proJobFilter
                          ? (proJobFilter === '__job__'
                              ? sortedFiltered.filter(p => !(p as any).job_category && (p as any).job)
                              : sortedFiltered.filter(p => (p as any).job_category === proJobFilter))
                          : sortedFiltered
                        ).map((p,i)=>{
                          /* Compatibilité RÉELLE (intérêts 50% · proximité 30% · fiabilité 20%) + raisons */
                          const ci = compatInfo.get((p as any).id)
                          const cdScore = ci ? ci.dots : 3
                          const fiabStars = p.reliability_score!=null ? Math.round(p.reliability_score/20) : null
                          const distZone = getDistanceZone((p as any).center_lat, (p as any).center_lng)

                          return (
                            <div key={p.id} className={`card-hover su${i<3?i:''}`}
                              style={{background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:14,marginBottom:8,cursor:'pointer',display:'flex',gap:12,alignItems:'center',padding:'12px 14px'}}
                              onClick={()=>{setSelProfile(p);setShowProfileSheet(true)}}>

                              {/* Photo carrée arrondie + badge CD étoile */}
                              <div style={{position:'relative',flexShrink:0}}>
                                <div style={{width:54,height:54,borderRadius:13,overflow:'hidden',border:`2px solid ${C.border}`}}>
                                  <Av src={p.photo_url} name={p.name||'?'} size={54}/>
                                </div>
                                {/* Badge CD étoile — coin haut gauche */}
                                <div style={{position:'absolute',top:-10,left:-10,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',zIndex:2}}>
                                  <svg width="36" height="36" viewBox="0 0 36 36" style={{position:'absolute',top:0,left:0}}>
                                    <path d="M18 2l2.9 8.1L28 8.5l-5.8 5.5 2 8.7-6.2-3.7-6.2 3.7 2-8.7L8 8.5l7.1 1.6z" fill="#E8317A" stroke="rgba(255,255,255,0.35)" strokeWidth="0.6"/>
                                  </svg>
                                  <span style={{position:'relative',fontSize:9,fontWeight:900,color:'#fff',letterSpacing:0.5,zIndex:1,textShadow:'0 0 6px rgba(0,0,0,.5)',lineHeight:1}}>CD</span>
                                </div>
                                {/* Pastille dispo verte */}
                                <div style={{position:'absolute',bottom:2,right:2,width:11,height:11,borderRadius:'50%',background:C.green,border:`2px solid ${C.bgCard}`}}/>
                                {/* Badge Quick Clutch · 1h — coin haut droit (design Mel : pastille verte + icône) */}
                                {(p as any).quick_clutch && <div title="Quick Clutch · 1h" style={{position:'absolute',top:-7,right:-7,width:24,height:24,borderRadius:'50%',background:'#fff',border:`2px solid ${C.green}`,display:'flex',alignItems:'center',justifyContent:'center',zIndex:3,boxShadow:'0 1px 4px rgba(83,41,67,.25)'}}><img src="/icons/mel/QuickClutch.svg" width={14} height={14} alt=""/></div>}
                              </div>

                              {/* Infos */}
                              <div style={{flex:1,minWidth:0}}>
                                {/* Ligne 1 : nom + âge + badges */}
                                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:3}}>
                                  <GenderSvg gk={genderKey((p as any).gender)} size={14}/>
                                  <span style={{fontSize:16,fontWeight:800,letterSpacing:-0.3}}>{p.name||'Anonyme'}</span>
                                  {p.age&&<span style={{fontSize:13,color:C.whiteMid,fontWeight:500}}>{p.age} ans</span>}
                                  {(p as any).intent_pinned && (p as any).bio && <img src="/icons/mel/Pin_RDVfixe.svg" width={13} height={13} alt="" title="Descriptif fixe" style={{flexShrink:0}}/>}
                                  {(p as any).verified&&<span style={{fontSize:9,fontWeight:900,padding:'2px 5px',borderRadius:6,background:'rgba(255,20,147,.18)',color:'#FF1493',border:'1px solid rgba(255,20,147,.4)'}}>✓ Vérifié</span>}
                                  {isTestProfile(p.id)&&<span style={{fontSize:8,fontWeight:900,padding:'1px 4px',borderRadius:6,background:'rgba(107,114,128,.2)',color:'#9CA3AF',border:'1px solid rgba(107,114,128,.3)'}}>BOT</span>}
                                  {(p as any)._isGpsTestBot&&<span style={{fontSize:9,fontWeight:900,padding:'2px 7px',borderRadius:8,background:'rgba(34,197,94,.15)',color:'#22C55E',border:'1px solid rgba(34,197,94,.4)',letterSpacing:0.3}}>🛰️ GPS TEST · Morges Gare</span>}
                                  {(p as any)._hasEvent&&(
                                    <span onClick={e=>{e.stopPropagation();setTab('evenements');setOpenEventId((p as any)._eventId||null)}}
                                      style={{fontSize:12,padding:'1px 5px',borderRadius:6,background:'rgba(235,107,175,.15)',border:'1px solid rgba(235,107,175,.35)',cursor:'pointer'}}
                                      title="Voir l'événement">
                                      {(p as any)._eventEmoji||'📅'}
                                    </span>
                                  )}
                                </div>
                                {/* Ligne 2 : activité du moment (si dispo) ou job/bio */}
                                {(p as any).current_activity
                                  ? <div style={{fontSize:12,color:C.gold,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5,fontWeight:600}}>✦ {(p as any).current_activity}</div>
                                  : (p.job||p.bio)&&<div style={{fontSize:12,color:C.whiteMid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:5}}>{p.job||p.bio}</div>
                                }
                                {/* Ligne 3 : compatibilité + fiabilité */}
                                <div style={{display:'flex',alignItems:'center',gap:10}}>
                                  {/* Compatibilité — dots orange */}
                                  <div style={{display:'flex',alignItems:'center',gap:3}}>
                                    <span style={{fontSize:10,fontWeight:800,color:C.orange,letterSpacing:0.4}}>Compatibilité</span>
                                    <div style={{display:'flex',gap:2}}>
                                      {[1,2,3,4,5].map(s=>(
                                        <div key={s} style={{width:7,height:7,borderRadius:'50%',background:s<=cdScore?C.orange:`${C.orange}33`}}/>
                                      ))}
                                    </div>
                                  </div>
                                  {/* Fiabilité — turquoise pétant */}
                                  {fiabStars!=null&&(
                                    <div style={{display:'flex',alignItems:'center',gap:3}}>
                                      <span style={{fontSize:10,fontWeight:800,color:'#06B6D4',letterSpacing:0.5}}>Fiabilité</span>
                                      <div style={{display:'flex',gap:1}}>
                                        {[1,2,3,4,5].map(s=>(
                                          <span key={s} style={{fontSize:10,color:s<=fiabStars?'#06B6D4':'rgba(6,182,212,.3)'}}>★</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {(p.reliability_score!=null&&p.reliability_score<60)&&<RabbitBadge/>}
                                  {distZone&&<span style={{fontSize:10,color:'rgba(83,41,67,.55)',fontWeight:600,marginLeft:'auto'}}>{distZone}</span>}
                                </div>
                                {/* (transparence : la version explicite « Affiché car » a été retirée —
                                    David la trouve trop clinquante. Le tri reste, on concevra un signal
                                    subtil/ressenti ensemble. cf. mémoire project-algo-scaling-architecture) */}
                              </div>

                              {/* Bouton + = voir profil */}
                              <div style={{flexShrink:0,width:36,height:36,borderRadius:10,background:`${C.orange}22`,border:`1.5px solid ${C.orange}66`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,color:C.orange,fontWeight:300}}>+</div>
                            </div>
                          )
                        })
                    )}
                  </div>
                </div>{/* fin presences container */}

                {/* ── OVERLAY LIVE PLEIN ÉCRAN ── */}
                {liveMode && (
                  <div style={{position:'absolute',inset:0,background:'#0C0518',zIndex:50,display:'flex',flexDirection:'column',animation:'liveIn .35s cubic-bezier(.22,1,.36,1)'}}>
                    <style>{`
                      @keyframes liveIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
                      @keyframes radarPing1{0%{transform:scale(.3);opacity:.8}100%{transform:scale(2.8);opacity:0}}
                      @keyframes radarPing2{0%{transform:scale(.3);opacity:.6}100%{transform:scale(2.8);opacity:0}}
                      @keyframes radarPing3{0%{transform:scale(.3);opacity:.4}100%{transform:scale(2.8);opacity:0}}
                      @keyframes liveDot{0%,100%{opacity:1}50%{opacity:.2}}
                    `}</style>

                    {/* Header */}
                    <div style={{paddingTop:'calc(var(--sat) + 14px)',padding:'calc(var(--sat) + 14px) 20px 16px',flexShrink:0}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                          <div style={{position:'relative',width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                            <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle,rgba(235,107,175,.3),transparent 70%)'}}/>
                            <svg width="28" height="26" viewBox="0 0 469.8 450" style={{animation:'liveRotate 10s linear infinite'}}>
                              <polygon fill="#EB6BB0" points="174,294.9 181.3,287.6 181.8,267.3 146.5,267.3"/>
                              <polygon fill="#EB6BB0" points="207.4,223.5 246.4,222.5 253.6,215.3 246,207.7 207.8,207.7"/>
                              <path fill="#D76FA9" d="M249.4,229.1l13.9-13.9l-47.5-47.5L202,181.6l-1,42l-11.2,0.4l1.1-44.9c0-1.4,0.6-2.8,1.6-3.8l19.4-19.4c2.2-2.2,5.7-2.2,7.9,0l55.3,55.3c2.2,2.2,2.2,5.7,0,7.9l-19.4,19.4c-1,1-2.4,1.6-3.8,1.6L140.6,243l-13.9,13.9l47.5,47.5l13.9-13.9l1-41.7l11.2-0.2l-1.1,44.4c0,1.4-0.6,2.8-1.6,3.8l-19.4,19.4c-2.2,2.2-5.7,2.2-7.9,0l-55.3-55.3c-2.2-2.2-2.2-5.7,0-7.9l19.4-19.4c1-1,2.4-1.6,3.8-1.6L249.4,229.1z"/>
                              <path fill="#EB6BB0" d="M338.1,215.6h-42.8v-42.8C318.9,172.8,338.1,192,338.1,215.6z"/>
                              <path fill="#D76FA9" d="M301.2,154.7v-7.4h4.5c1.6,0,2.8-1.3,2.8-2.8v-9.3c0-1.6-1.3-2.8-2.8-2.8H285c-1.6,0-2.8,1.3-2.8,2.8v9.3c0,1.6,1.3,2.8,2.8,2.8h4.5v7.4c-16,1.5-30.2,9.2-40.2,20.7l8,8c9.2-10.8,22.8-17.7,38-17.7c27.5,0,49.8,22.4,49.8,49.8s-22.4,49.9-49.8,49.9c-15.8,0-29.9-7.4-39.1-19c-1.3,0.5-2.7,0.8-4.1,0.8l-9,0.2c10.8,17.5,30.1,29.3,52.2,29.3c33.7,0,61.2-27.4,61.2-61.2C356.5,183.8,332.2,157.6,301.2,154.7z"/>
                              <path fill="#D76FA9" d="M346,173.3c1.1,1.1,2.9,1.1,4,0l3.9-3.9c1.1-1.1,1.1-2.9,0-4l-7.1-7.1c-1.1-1.1-2.9-1.1-4,0l-3.9,3.9c-1.1,1.1-1.1,2.9,0,4L346,173.3z"/>
                            </svg>
                          </div>
                          <span style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:-.5}}>LIVE</span>
                          <span style={{fontSize:13,color:'rgba(255,20,147,.7)',fontWeight:700}}>· 500m</span>
                        </div>
                        <button onClick={()=>setLiveMode(false)}
                          style={{padding:'7px 14px',borderRadius:20,border:'1px solid rgba(255,255,255,.2)',background:'rgba(255,255,255,.07)',color:'rgba(255,255,255,.8)',fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                          ✕ Quitter
                        </button>
                      </div>
                      <div style={{fontSize:12,color:'rgba(255,255,255,.45)',marginTop:5}}>
                        {liveFiltered.length === 0
                          ? (lang==='en'?'Scanning nearby...':'Scan en cours...')
                          : `${liveFiltered.length} personne${liveFiltered.length>1?'s':''} disponible${liveFiltered.length>1?'s':''} maintenant`}
                      </div>
                    </div>

                    {/* Zone radar + profils */}
                    <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0}}>

                      {liveFiltered.length === 0 ? (
                        /* Radar animé quand personne */
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',paddingBottom:60}}>
                          <div style={{position:'relative',width:180,height:180,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:28}}>
                            {/* Cercles radar */}
                            <div style={{position:'absolute',width:180,height:180,borderRadius:'50%',border:'1.5px solid rgba(255,20,147,.5)',animation:'radarPing1 2.4s ease-out infinite'}}/>
                            <div style={{position:'absolute',width:180,height:180,borderRadius:'50%',border:'1.5px solid rgba(255,20,147,.4)',animation:'radarPing2 2.4s ease-out infinite .8s'}}/>
                            <div style={{position:'absolute',width:180,height:180,borderRadius:'50%',border:'1.5px solid rgba(255,20,147,.3)',animation:'radarPing3 2.4s ease-out infinite 1.6s'}}/>
                            {/* Point central */}
                            <div style={{width:14,height:14,borderRadius:'50%',background:'#FF1493',boxShadow:'0 0 20px rgba(255,20,147,.8)'}}/>
                          </div>
                          <div style={{fontSize:15,fontWeight:700,color:'rgba(255,255,255,.6)',textAlign:'center'}}>
                            {lang==='en'?'Nobody within 500m right now':'Personne à 500m pour l\'instant'}
                          </div>
                          <div style={{fontSize:12,color:'rgba(255,255,255,.3)',marginTop:6,textAlign:'center'}}>
                            {lang==='en'?'Check back in a few minutes':'Réessaie dans quelques minutes'}
                          </div>
                        </div>
                      ) : (
                        /* Liste profils Live */
                        <div style={{padding:'8px 16px 32px'}}>
                          {/* Mini radar en haut même quand il y a des gens */}
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20}}>
                            <div style={{position:'relative',width:70,height:70,display:'flex',alignItems:'center',justifyContent:'center'}}>
                              <div style={{position:'absolute',width:70,height:70,borderRadius:'50%',border:'1px solid rgba(255,20,147,.4)',animation:'radarPing1 2s ease-out infinite'}}/>
                              <div style={{position:'absolute',width:70,height:70,borderRadius:'50%',border:'1px solid rgba(255,20,147,.3)',animation:'radarPing2 2s ease-out infinite .7s'}}/>
                              <div style={{width:8,height:8,borderRadius:'50%',background:'#FF1493',boxShadow:'0 0 12px rgba(255,20,147,.9)'}}/>
                            </div>
                          </div>
                          {liveFiltered.map((p,i)=>(
                            <div key={`live-${p.id}`}
                              style={{background:'rgba(255,20,147,.07)',border:'1px solid rgba(255,20,147,.25)',borderRadius:16,marginBottom:10,display:'flex',alignItems:'center',gap:14,padding:'14px 14px',animation:`liveIn .3s ${i*.07}s both`}}>
                              <div style={{position:'relative',flexShrink:0}}>
                                <div style={{width:56,height:56,borderRadius:14,overflow:'hidden',border:'2px solid rgba(255,20,147,.5)'}}>
                                  <Av src={p.photo_url} name={p.name||'?'} size={56}/>
                                </div>
                                <div style={{position:'absolute',bottom:2,right:2,width:12,height:12,borderRadius:'50%',background:'#FF1493',border:'2px solid #0C0518',boxShadow:'0 0 6px rgba(255,20,147,.8)',animation:'liveDot 1.5s ease-in-out infinite'}}/>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:17,fontWeight:900,color:'#fff',letterSpacing:-.3}}>{p.name||'?'}</div>
                                {p.age&&<div style={{fontSize:12,color:'rgba(255,255,255,.5)',marginTop:1}}>{p.age} ans</div>}
                              </div>
                              <button onClick={()=>{if(!clutchGuard())return;setLiveMode(false);setSelProfile(p);setShowSend(true)}}
                                style={{padding:'10px 16px',borderRadius:12,background:'#FF1493',border:'none',color:'#fff',fontSize:13,fontWeight:900,cursor:'pointer',fontFamily:'inherit',flexShrink:0,boxShadow:'0 4px 16px rgba(255,20,147,.5)'}}>
                                ⚡ Clutch
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>)}

              {/* ── TAB : ÉVÉNEMENTS — avec Anaïs + détail cliquable ── */}
              {tab==='evenements' && <EventsTab
                onClutch={(p)=>{if(!clutchGuard())return;setSelProfile(p);setShowSend(true)}}
                registered={registeredEvents}
                setRegistered={setRegisteredEvents}
                waitlist={waitlistEvIds}
                setWaitlist={setWaitlistEvIds}
                lang={lang}
                initialEventId={openEventId}
                onClearInitialEvent={()=>setOpenEventId(null)}
                onPenalty={applyPenalty}
                userId={user?.id}
                centerLat={(user as any)?.center_lat ?? null}
                centerLng={(user as any)?.center_lng ?? null}
                showToast={showToast}
                isCertified={!!(user as any)?.is_certified}
                availSlots={(user as any)?.is_available && (user as any)?.available_until
                  ? [{ start: (user as any).available_from ? new Date((user as any).available_from).getTime() : Date.now(), end: new Date((user as any).available_until).getTime() }]
                  : []}
                suggestGroupEvent={(()=>{ try{
                  const ageD=(user as any)?.created_at ? (Date.now()-new Date((user as any).created_at).getTime())/86400000 : 0
                  const recv=(clutches as any[]).filter((c:any)=>c.receiver_id===user?.id).length
                  return shouldNudgeGroupEvent({ accountAgeDays:ageD, activeRecently:true, clutchsReceived:recv, eventsJoined:registeredEvents.size, profileComplete:!!(user as any)?.photo_url })
                }catch{ return false } })()}
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
                const isMock = demoOn() && clutches.length === 0  // 🤖 mock clutchs seulement en mode Démo
                const raw = isMock ? MOCK_CLUTCHES.map(c=>({...c,receiver_id:c.receiver_id==='me'?user.id:c.receiver_id,sender_id:c.sender_id==='me'?user.id:c.sender_id})) : clutches
                // Actifs = pending + confirmed/accepted/checked_in non expirés + celui en feedback inline même si completed
                const actifs = raw.filter((c:any)=>((['pending','confirmed','accepted','checked_in'].includes(c.status)&&new Date(c.expires_at||'9999')>new Date())||c.id===inlineFeedbackId))
                // Historique = completed + expired / declined / cancelled
                const hist = raw.filter((c:any)=>['completed','declined','expired','cancelled'].includes(c.status)||new Date(c.expires_at||'0')<new Date())
                // Si effacé (mock ou réel), filtrer les IDs cachés localement
                const displayHist = (isMock && mockCleared) ? [] : hist.filter((c:any)=>!hiddenHistIds.has(c.id))
                const pending = actifs.filter((c:any)=>c.status==='pending').length
                // Forteresse : un pending est « en pause » s'il chevauche un de mes RDV confirmés (occupancy).
                // Calculé (jamais stocké) → si j'annule le RDV, l'occupancy disparaît et le pending « revit » tout seul.
                const isPausedClutch=(c:any)=>{ if(c.status!=='pending')return false; const base=new Date(c.counter_time||c.proposed_time).getTime(); if(!base)return false; const s=base-60*60000; const e=base+(c.duration_minutes||120)*60000; return myOccupancies.some((o:any)=>o.source_id!==c.id && new Date(o.start_at).getTime()<e && s<new Date(o.end_at).getTime()) }
                // ── Boîte de réception ACTION-FIRST (struct validée GPT+Claude) :
                //    0=🔥 à répondre · 1=📍 RDV · 2=⏸ en pause (chevauche un RDV) · 3=⏳ envoyé en attente · 4=autres
                const groupRank=(c:any)=>{ const eff=localConfirmed.has(c.id)?'confirmed':c.status; if(c.id===inlineFeedbackId)return 0; if(['confirmed','accepted','checked_in'].includes(eff))return 1; if(c.status==='pending'&&isPausedClutch(c))return 2; const rec=c.receiver_id===user.id; if(rec&&c.status==='pending')return 0; if(!rec&&c.status==='pending')return 3; return 4 }
                actifs.sort((a:any,b:any)=>groupRank(a)-groupRank(b))
                const aRepondre = actifs.filter((c:any)=>c.id===inlineFeedbackId||(c.receiver_id===user.id&&c.status==='pending'&&!isPausedClutch(c))).length
                // Libellés de section (boîte de réception par ACTION) — bilingue
                const SEC_LABELS:Record<number,string> = lang==='en'
                  ? {0:'🔥 To answer',1:'📍 Upcoming meetups',2:'⏸ On hold (you have a meetup then)',3:'⏳ Waiting',4:'🗂️ Other'}
                  : {0:'🔥 Action requise',1:'📍 Prochains rendez-vous',2:'⏸ En pause (RDV à cette heure)',3:'⏳ En attente',4:'🗂️ Autres'}
                // Intercale un marqueur d'en-tête {__hdr:g} quand le groupe change (actifs déjà trié par groupRank)
                const actifsWithHdrs:any[] = []
                { let _pg=-1; actifs.forEach((c:any)=>{ const g=groupRank(c); if(g!==_pg){ actifsWithHdrs.push({__hdr:g}); _pg=g } actifsWithHdrs.push(c) }) }
                return (
                <div className="fi" style={{position:'fixed',inset:0,bottom:'calc(72px + var(--sab))',background:C.bg,display:'flex',flexDirection:'column'}}>
                  <div style={{padding:'12px 16px 10px',paddingTop:'calc(var(--sat) + 12px)',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                    {/* ── Soft gate bannière feedback ── */}
                    {pendingFeedbacks >= TRUST_CONFIG.GATE_WARN && (
                      <div onClick={()=>{ const p=(clutches as any[]).find(c=>(c.status==='confirmed'||c.status==='accepted')&&c.proposed_time&&new Date(c.proposed_time).getTime()+30*60*1000<Date.now()&&!localStorage.getItem(`feedback_done_${c.id}`));if(p){setFeedbackClutch(p);setShowFeedback(true)}}}
                        style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,marginBottom:10,cursor:'pointer',
                          background: pendingFeedbacks>=TRUST_CONFIG.GATE_BLOCK?'rgba(239,68,68,.12)':pendingFeedbacks>=TRUST_CONFIG.GATE_ORANGE?'rgba(235,107,175,.12)':'rgba(83,41,67,.08)',
                          border: `1px solid ${pendingFeedbacks>=TRUST_CONFIG.GATE_BLOCK?C.red:pendingFeedbacks>=TRUST_CONFIG.GATE_ORANGE?C.orange:C.border}`}}>
                        <span style={{fontSize:20,flexShrink:0}}>{pendingFeedbacks>=TRUST_CONFIG.GATE_BLOCK?'🔒':pendingFeedbacks>=TRUST_CONFIG.GATE_ORANGE?'⚠️':'💬'}</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:12,fontWeight:800,color:pendingFeedbacks>=TRUST_CONFIG.GATE_BLOCK?C.red:pendingFeedbacks>=TRUST_CONFIG.GATE_ORANGE?C.orange:C.salmon}}>
                            {pendingFeedbacks>=TRUST_CONFIG.GATE_BLOCK
                              ?(lang==='en'?'Feedback required to continue':'Feedback requis pour continuer')
                              :(lang==='en'?`${pendingFeedbacks} meetup(s) awaiting your feedback`:`${pendingFeedbacks} RDV en attente de feedback`)}
                          </div>
                          <div style={{fontSize:10,color:C.whiteMid}}>
                            {pendingFeedbacks>=TRUST_CONFIG.GATE_BLOCK
                              ?(lang==='en'?'New clutches blocked until you respond':'Nouveaux Clutchs bloqués · Appuie ici')
                              :(lang==='en'?'Tap to give your feedback':'Appuie ici — 2 taps suffisent')}
                          </div>
                        </div>
                        <span style={{fontSize:12,color:C.whiteMid}}>→</span>
                      </div>
                    )}
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                      <div>
                        {/* Titre « Mes Clutchs » retiré (déjà dans la nav du bas) — on garde le compte (David : libérer le haut) */}
                        <div style={{fontSize:12.5,color:C.whiteMid,marginTop:1,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                          {aRepondre>0
                            ? <span style={{fontWeight:800,color:'#fff',background:C.salmon,borderRadius:20,padding:'2px 10px',fontSize:11}}>🔴 {aRepondre} {lang==='en'?'to answer':'à répondre'}</span>
                            : <span style={{fontWeight:700,color:C.white}}>{actifs.length} {lang==='en'?'active':'actif'}</span>}
                          <span style={{color:C.whiteMid}}>· {actifs.length+displayHist.length} {lang==='en'?'total':'total'}</span>
                          {user?.is_available && user?.available_until && new Date(user.available_until)>new Date() && (
                            <span style={{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(255,255,255,.06)',border:`1px solid ${C.border}`,borderRadius:20,padding:'2px 7px',fontSize:10,color:C.whiteMid}}>
                              <span style={{width:5,height:5,borderRadius:'50%',background:C.green,flexShrink:0,display:'inline-block'}}/>
                              {(user as any).available_from?new Date((user as any).available_from).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})+'–':''}
                              {new Date(user.available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})}
                              {(user as any).available_radius_km?' · '+Math.round((user as any).available_radius_km)+'km':''}
                            </span>
                          )}
                        </div>
                        {debugLog?<div style={{fontSize:9,color:'#ff0',fontFamily:'monospace',marginTop:4,wordBreak:'break-all'}}>{debugLog}</div>:null}
                      </div>
                      {displayHist.length>0&&<button onClick={()=>{
                        // Cache localement — pas de dépendance RLS, fonctionne toujours
                        const ids = new Set([...hiddenHistIds, ...displayHist.map((c:any)=>c.id)])
                        setHiddenHistIds(ids)
                        setMockCleared(true)
                        try { localStorage.setItem('clutch_mock_cleared','1') } catch {}
                        setShowHistory(false)
                        showToast(lang==='en'?'History cleared':'Historique effacé',C.whiteMid)
                      }} style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:10,cursor:'pointer',fontFamily:'inherit'}}>{t('clutchs.clear')}</button>}
                    </div>
                  </div>
                  <div style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch',minHeight:0,padding:'8px 14px',paddingBottom: activeVerrou && !inlineFeedbackId && !radarMin ? 180 : 14}}>
                    {/* « Mes événements » RETIRÉ d'ici (doublon — demande David). Les events inscrits sont dans Événements → filtre « Mes events ». */}
                    {/* Clutchs actifs */}
                    {actifs.length===0&&<div style={{textAlign:'center',padding:'40px 20px',color:C.whiteMid}}><div style={{fontSize:28,marginBottom:8}}>⏳</div><div style={{fontSize:14,fontWeight:700,color:C.white,marginBottom:4}}>{t('clutchs.empty')}</div><div style={{fontSize:11}}>{t('clutchs.empty.sub')}</div></div>}
                    {actifsWithHdrs.map((c:any)=>{
                      if(c.__hdr!==undefined) return (<div key={'sec'+c.__hdr} style={{fontSize:11,fontWeight:800,color:C.salmon,letterSpacing:'.04em',margin:'12px 2px 4px'}}>{SEC_LABELS[c.__hdr]}</div>)
                      const isRec=c.receiver_id===user.id
                      const other=isRec?c.sender:c.receiver
                      const msLeft = c.expires_at ? new Date(c.expires_at).getTime()-Date.now() : 0
                      const hLeft = Math.floor(msLeft/3600000)
                      const mLeft = Math.floor((msLeft%3600000)/60000)
                      const countdown = msLeft>0 ? (hLeft>0?`${hLeft}h${mLeft>0?`${mLeft}m`:''}`:`${mLeft}min`) : null
                      // localConfirmed override — contourne les latences/RLS Supabase
                      const effectiveStatus = localConfirmed.has(c.id) ? 'confirmed' : c.status
                      const isAccepted = effectiveStatus==='confirmed'||effectiveStatus==='accepted'||effectiveStatus==='checked_in'
                      const isNewRec = !isAccepted && isRec && c.status==='pending'
                      const isSent = !isAccepted && !isRec && c.status==='pending'
                      const paused = isPausedClutch(c) // forteresse : chevauche un RDV → en pause (calmé visuellement)
                      const hasUnread = (unreadChats[c.id]||0) > 0
                      // Couleurs par état
                      const cardBorder = paused ? `1px solid ${C.border}`
                        : isAccepted ? `2px solid ${C.green}66`
                        : isNewRec ? `2px solid ${C.salmon}88`
                        : isSent ? `1px solid ${C.orange}55`
                        : `1px solid ${C.border}`
                      // Cartes BLANCHES (design Mel). L'identité Verrou vient du bandeau photo prune + bordure verte,
                      // PAS d'un dégradé sur toute la carte (illisible = « effet verre » que David rejette).
                      const cardBg = C.bgCard
                      const sc = paused ? C.whiteMid : isAccepted ? C.green : isNewRec ? C.salmon : C.orange
                      const sl = paused ? (lang==='en'?'⏸ on hold':'⏸ en pause') : isAccepted ? 'Verrou' : isNewRec ? (countdown?`← ${countdown}`:'← Received') : (countdown?`→ ${countdown}`:'→ Sent')
                      // ── INLINE FEEDBACK : remplace toute la carte ──
                      if (inlineFeedbackId === c.id) {
                        const outcomes = [
                          {key:'on_time',emoji:'⭐',label:lang==='en'?'On time':'À l\'heure',sub:lang==='en'?'Right on schedule':'Présent·e à l\'heure',pts:2,bad:false},
                          {key:'showed', emoji:'📍',label:lang==='en'?'Was there':'Est venu·e',sub:lang==='en'?'Came — late or not':'Est venu·e (en retard ou non)',pts:1,bad:false},
                          {key:'absent', emoji:'🐰',label:lang==='en'?'No-show':'Lapin 👻',sub:lang==='en'?'Didn\'t come':'N\'est pas venu·e',pts:-5,bad:true},
                        ]
                        const other2 = c.sender_id===user?.id?c.receiver:c.sender
                        const [selFb,setSelFb] = [inlineFbSel,setInlineFbSel]
                        return (
                          <div key={c.id} style={{background:C.bgCard,border:`2px solid ${C.gold}`,borderRadius:14,marginBottom:8,padding:'16px'}}>
                            <div style={{textAlign:'center',marginBottom:12}}>
                              <div style={{fontSize:16,fontWeight:900,color:C.salmon}}>🎯 {lang==='en'?'Meetup with':'RDV avec'} <span style={{color:C.white}}>{other2?.name||'?'}</span></div>
                              <div style={{fontSize:11,color:C.whiteMid,marginTop:2}}>{lang==='en'?'Was the other person there?':'L\'autre personne était-elle là ?'}</div>
                            </div>
                            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:12}}>
                              {outcomes.map(r=>(
                                <button key={r.key} onClick={()=>setSelFb(r.key)}
                                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',background:selFb===r.key?(r.bad?'rgba(239,68,68,.15)':'rgba(45,189,126,.15)'):'rgba(255,255,255,.04)',border:`1.5px solid ${selFb===r.key?(r.bad?C.red:C.green):C.border}`,borderRadius:12,cursor:'pointer',fontFamily:'inherit',touchAction:'manipulation',WebkitTapHighlightColor:'transparent'}}>
                                  <span style={{fontSize:22,flexShrink:0}}>{r.emoji}</span>
                                  <div style={{flex:1,textAlign:'left'}}>
                                    <div style={{fontSize:13,fontWeight:800,color:C.white}}>{r.label}</div>
                                    <div style={{fontSize:10,color:C.whiteMid}}>{r.sub}</div>
                                  </div>
                                  <span style={{fontSize:11,fontWeight:900,color:r.bad?C.red:C.green}}>{r.pts>0?`+${r.pts}`:r.pts}pts</span>
                                </button>
                              ))}
                            </div>
                            <button onClick={()=>{
                              if (!selFb) { showToast('⚠️ Sélectionne une option d\'abord', C.orange); return }
                              if (!user?.id) return
                              const r = outcomes.find(o=>o.key===selFb)!
                              const clutchSnap = {...c}
                              // 1. Marquer comme terminé LOCALEMENT (bloque polling)
                              try { localStorage.setItem(`feedback_done_${c.id}`,String(Date.now())) } catch {}
                              addCompleted(c.id)
                              // 2. Reset état + navigation immédiate
                              setInlineFeedbackId(null)
                              setInlineFbSel(null)
                              setShowFeedback(false)
                              setFeedbackClutch(null)
                              setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,status:'completed'}:cl))
                              _setTab('presences')
                              if (!r.bad) Sounds.done()
                              showToast(`✓ RDV terminé${r.pts>0?' · +'+r.pts+' pts':''}`, r.bad?C.orange:C.green)
                              // 3. "Garder le contact" si RDV honoré
                              if (!r.bad) setTimeout(()=>setKeepContactClutch(clutchSnap), 500)
                              // 4. DB en arrière-plan (clutch déjà 'completed' depuis le clic Terminer)
                              if (!isMock) {
                                supabase.from('rdv_feedbacks').upsert({rdv_id:c.id,from_id:user.id,to_id:c.sender_id===user.id?c.receiver_id:c.sender_id,outcome:selFb},{onConflict:'rdv_id,from_id'}).then(()=>{})  // NE PAS toucher keep_contact ici (race avec le modal "Garder le contact" qui l'écrasait à null)
                                const newScore = Math.max(0,Math.min(100,(user?.reliability_score??80)+r.pts))
                                setUser(prev=>prev?{...prev,reliability_score:newScore}:prev)
                                supabase.from('profiles').update({reliability_score:newScore}).eq('id',user.id).then(()=>{})
                              }
                            }} style={{width:'100%',padding:'12px',background:selFb?C.gold:'rgba(255,255,255,.15)',border:`2px solid ${selFb?C.gold:C.border}`,borderRadius:10,color:selFb?'#1a0810':C.whiteMid,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit',touchAction:'manipulation',WebkitTapHighlightColor:'transparent',transition:'all .2s'}}>
                              {lang==='en'?'Send feedback ✓':'Envoyer le feedback ✓'}
                            </button>
                          </div>
                        )
                      }
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
                                <div style={{fontSize:11,color:C.whiteMid,marginTop:1,display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
                                  {(()=>{
                                    const venueShort = c.venue?.split('·')[0].trim()||'–'
                                    const venueAddr = c.venue?.includes('·') ? c.venue.split('·').slice(1).join('·').trim() : null
                                    const mapsUrl = venueAddr ? `https://maps.google.com/?q=${encodeURIComponent(venueAddr)}` : (c.venue_lat&&c.venue_lng?`https://maps.google.com/?q=${c.venue_lat},${c.venue_lng}`:null)
                                    const delay = c.retard_min || announcedDelays[c.id] || 0
                                    const baseTime = c.proposed_time ? new Date(c.proposed_time).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}) : '–'
                                    return (<>
                                      {mapsUrl
                                        ? <a href={mapsUrl} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{color:C.salmon,textDecoration:'none',fontWeight:700}}>📍 {venueShort}</a>
                                        : <span>{venueShort}</span>
                                      }
                                      <span>·</span>
                                      <span>{baseTime}</span>
                                      {delay > 0 && <span style={{color:C.red,fontWeight:800}}>+{delay}min</span>}
                                    </>)
                                  })()}
                                </div>
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
                                <span style={{color:isRec?GC.F:C.whiteMid}}>{isRec?(lang==='en'?'← From':'← De'):(lang==='en'?'→ To':'→ Pour')}</span>{' '}
                                <GenderSvg gk={genderKey(other?.gender)} size={13}/>{' '}
                                <span style={{textDecoration:'underline',textDecorationColor:`${C.salmon}55`}}>{other?.name||'?'}</span>
                              </div>}
                              {!isAccepted && (()=>{
                                // B5 — détails LISIBLES de tout clutch (envoyé compris) : lieu (lien Maps) + heure claire avec le jour.
                                // Avant : une ligne tronquée (« Chemin de la Ramière, Prév… ») → impossible de vérifier où/quand.
                                const venueShort = c.venue?.split('·')[0].trim() || '–'
                                const venueAddr = c.venue?.includes('·') ? c.venue.split('·').slice(1).join('·').trim() : null
                                const mapsUrl = venueAddr ? `https://maps.google.com/?q=${encodeURIComponent(venueAddr)}` : (c.venue_lat&&c.venue_lng?`https://maps.google.com/?q=${c.venue_lat},${c.venue_lng}`:null)
                                const dt = c.proposed_time ? new Date(c.proposed_time) : null
                                const now = new Date()
                                const sameDay = dt && dt.toDateString()===now.toDateString()
                                const tmrw = dt && new Date(now.getTime()+86400000).toDateString()===dt.toDateString()
                                const timeStr = dt ? (sameDay?'':tmrw?(lang==='en'?'tmrw ':'dem. '):dt.toLocaleDateString('fr-CH',{day:'2-digit',month:'2-digit'})+' ')+dt.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}) : '–'
                                return (
                                  <div style={{fontSize:11,color:C.whiteMid,marginTop:2,display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
                                    {mapsUrl
                                      ? <a href={mapsUrl} target="_blank" rel="noopener" onClick={e=>e.stopPropagation()} style={{color:C.salmon,textDecoration:'none',fontWeight:700}}>📍 {venueShort}</a>
                                      : <span style={{fontWeight:700,color:C.salmon}}>📍 {venueShort}</span>}
                                    <span style={{color:C.white,fontWeight:800,background:'rgba(255,255,255,.06)',borderRadius:8,padding:'1px 7px'}}>🕐 {timeStr}</span>
                                  </div>
                                )
                              })()}
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
                              {/* Countdown seul, sans doublon avec le badge top-right */}
                              {countdown&&!isAccepted&&<span style={{fontSize:10,fontWeight:700,color:sc}}>{isRec?'←':'→'} {countdown}</span>}
                              {/* Annuler clutch ENVOYÉ — compact, inline */}
                              {c.status==='pending'&&!isRec&&(
                                <button onClick={async()=>{
                                  if(!isMock) { await supabase.from('clutches').update({status:'cancelled'}).eq('id',c.id); await insertCancelMsg(c.id, c.receiver_id) }
                                  await applyPenalty('cancel_early')
                                  loadClutches()
                                }} title={lang==='en'?'Cancel (-2 pts)':'Annuler (-2 pts)'}
                                  style={{padding:'5px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'transparent',color:C.whiteMid,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
                                  ✕ {lang==='en'?'Cancel':'Annuler'}
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
                                  const colors=[C.green,C.orange,C.red,C.red];const labels=lang==='en'?['Low','Medium','High','Severe']:['Légère','Moyenne','Élevée','Sévère'];
                                  return(
                                  <>
                                    <div style={{fontSize:12,color:C.white,fontWeight:700,marginBottom:8}}>{lang==='en'?'Cancel this Verrou?':'Annuler ce Verrou ?'}</div>
                                    <div style={{marginBottom:10}}>
                                      <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                                        <span style={{fontSize:13}}>{p.emoji}</span>
                                        <span style={{fontSize:11,color:C.whiteMid}}>{lang==='en'?'Penalty':'Pénalité'}</span>
                                        <span style={{fontSize:11,fontWeight:800,color:colors[level]}}>{labels[level]}</span>
                                      </div>
                                      <div style={{display:'flex',gap:3,height:6}}>
                                        {[0,1,2,3].map(i=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<=level?colors[level]:`${C.whiteMid}33`}}/>)}
                                      </div>
                                    </div>
                                    {getRecidiveMultiplier()>1&&(
                                      <div style={{fontSize:10,color:C.red,marginTop:4,textAlign:'center'}}>
                                        ×{getRecidiveMultiplier()} — {lang==='en'?`${getCancelCount()}th late cancel`:`${getCancelCount()}e annulation tardive`}
                                      </div>
                                    )}
                                    {/* Message optionnel pour s'excuser */}
                                    <div style={{marginBottom:8}}>
                                      <input
                                        value={cancelMsg}
                                        onChange={e=>setCancelMsg(e.target.value.slice(0,60))}
                                        placeholder="Un mot pour s'excuser… (optionnel)"
                                        maxLength={60}
                                        style={{width:'100%',padding:'8px 10px',borderRadius:8,border:`1px solid ${C.border}`,background:'rgba(255,255,255,.06)',color:C.white,fontSize:12,fontFamily:'inherit',boxSizing:'border-box',outline:'none'}}
                                      />
                                      <div style={{textAlign:'right',fontSize:10,color:C.whiteMid,marginTop:2}}>{cancelMsg.length}/60</div>
                                    </div>
                                    <div style={{display:'flex',gap:8}}>
                                      <button onClick={async()=>{
                                        if(!isMock) {
                                          await supabase.from('clutches').update({status:'cancelled',cancel_message:cancelMsg||null,cancel_by:user?.id}).eq('id',c.id)
                                          const otherId=c.sender_id===user?.id?c.receiver_id:c.sender_id
                                          await insertCancelMsg(c.id,otherId)
                                          if (user?.id) await supabase.from('profiles').update({rdv_locked_until:null}).eq('id',user.id)
                                        }
                                        setCancelConfirmId(null)
                                        setCancelMsg('')
                                        await applyPenalty(reason)
                                        loadClutches()
                                      }} style={{flex:1,padding:'8px',background:C.red,border:'none',borderRadius:9,color:'#fff',fontSize:12,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                                        {lang==='en'?'Yes, cancel':'Oui, annuler'}
                                      </button>
                                      <button onClick={()=>{setCancelConfirmId(null);setCancelMsg('')}}
                                        style={{flex:1,padding:'8px',background:`${C.green}14`,border:`1px solid ${C.green}44`,borderRadius:9,color:C.green,fontSize:12,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                                        {lang==='en'?'Keep meetup ✓':'Garder le RDV ✓'}
                                      </button>
                                    </div>
                                  </>
                                )})()}
                              </div>
                            ) : (
                              <div style={{display:'flex',flexDirection:'column',gap:6,marginTop:8}}>
                                {/* Ligne 1 : Chat + Retard */}
                                <div style={{display:'flex',gap:8}}>
                                  <button onClick={()=>{setChatClutch(c);setShowChat(true);setUnreadChats(prev=>{const n={...prev};delete n[c.id];return n})}}
                                    style={{flex:2,padding:'11px 8px',background:'#fff',border:`1.5px solid ${C.green}`,borderRadius:12,color:C.green,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                                    {lang==='en'?`💬 Chat with ${other?.name}`:`💬 Chat avec ${other?.name}`}
                                    {unreadChats[c.id]>0 && (
                                      <span style={{background:'#4A90D9',color:'#fff',fontSize:9,fontWeight:900,borderRadius:10,padding:'1px 5px',marginLeft:4}}>
                                        {unreadChats[c.id]}
                                      </span>
                                    )}
                                  </button>
                                  {/* Retard — 15min auto / 30min avec accept/refuse. Masqué si je suis déjà arrivé (J'y suis) */}
                                  {c.proposed_time && new Date(c.proposed_time).getTime() + 5*60*1000 > Date.now() && !(user.id===c.sender_id ? c.sender_arrived : c.receiver_arrived) && (()=>{
                                    const iDeclared = c.retard_by === user?.id
                                    const otherDeclared = c.retard_min && c.retard_by && c.retard_by !== user?.id
                                    const pending30 = otherDeclared && c.retard_min === 30 && c.retard_accepted == null

                                    // Je suis le retardataire
                                    if (iDeclared) return (
                                      <div style={{padding:'6px 10px',borderRadius:10,background:`${C.orange}15`,border:`1px solid ${C.orange}44`,color:C.orange,fontSize:11,fontWeight:900,flexShrink:0}}>
                                        ⏰ +{c.retard_min}min
                                      </div>
                                    )

                                    // L'autre a déclaré 30 min — je dois accepter ou refuser
                                    if (pending30) return (
                                      <div style={{display:'flex',gap:5,alignItems:'center',flexShrink:0}}>
                                        <span style={{fontSize:10,color:C.orange,fontWeight:700}}>+30min ?</span>
                                        <button onClick={async()=>{
                                          if (!isMock) await supabase.from('clutches').update({retard_accepted:true}).eq('id',c.id)
                                          setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,retard_accepted:true}:cl))
                                          showToast('✓ Retard accepté', C.green)
                                        }} style={{padding:'5px 8px',borderRadius:8,background:`${C.green}20`,border:`1px solid ${C.green}55`,color:C.green,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                                          OK
                                        </button>
                                        <button onClick={async()=>{
                                          if (!isMock) await supabase.from('clutches').update({retard_accepted:false,status:'cancelled'}).eq('id',c.id)
                                          setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,retard_accepted:false,status:'cancelled'}:cl))
                                          showToast('RDV annulé — partenaire prévenu·e', C.red)
                                        }} style={{padding:'5px 8px',borderRadius:8,background:`${C.red}15`,border:`1px solid ${C.red}40`,color:C.red,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>
                                          Non
                                        </button>
                                      </div>
                                    )

                                    // L'autre a déclaré et c'est accepté (15min auto ou 30min validé)
                                    if (otherDeclared) return (
                                      <div style={{padding:'6px 10px',borderRadius:10,background:`${C.orange}15`,border:`1px solid ${C.orange}44`,color:C.orange,fontSize:11,fontWeight:900,flexShrink:0}}>
                                        +{c.retard_min}min
                                      </div>
                                    )

                                    // Aucun retard déclaré — bouton
                                    if (c.retard_accepted === false) return null
                                    const isOpen = delayPickerOpen === c.id
                                    return (
                                      <div style={{position:'relative',flexShrink:0}}>
                                        <button onClick={()=>setDelayPickerOpen(isOpen?null:c.id)}
                                          style={{padding:'8px 10px',background:'rgba(235,107,175,.1)',border:`1px solid ${C.orange}44`,borderRadius:10,color:C.orange,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                                          ⏰ Retard
                                        </button>
                                        {isOpen && (
                                          <div style={{position:'absolute',bottom:'calc(100% + 6px)',right:0,background:C.bgCard,border:`1px solid ${C.border}`,borderRadius:12,padding:'8px',display:'flex',flexDirection:'column',gap:6,zIndex:10,boxShadow:'0 4px 20px rgba(0,0,0,.4)',minWidth:160}}>
                                            <div style={{fontSize:10,color:C.whiteMid,textAlign:'center',marginBottom:2}}>Depuis l'heure du RDV</div>
                                            {[15,30].map(min=>(
                                              <button key={min} onClick={async()=>{
                                                setDelayPickerOpen(null)
                                                const now = new Date().toISOString()
                                                const updates = {retard_min:min,retard_by:user?.id,retard_declared_at:now,retard_accepted:min===15?true:null}
                                                setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,...updates}:cl))
                                                if (!isMock) {
                                                  const {error:retErr} = await supabase.from('clutches').update(updates).eq('id',c.id)
                                                  if (retErr) { showToast('⚠️ Erreur retard: '+retErr.message, C.red); return }
                                                }
                                                showToast(min===15?'⏰ +15 min — partenaire notifié·e (auto-accepté)':'⏰ +30 min — partenaire doit accepter', C.orange)
                                              }} style={{padding:'8px 14px',borderRadius:8,border:`1px solid ${C.orange}44`,background:`${C.orange}15`,color:C.orange,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',textAlign:'left'}}>
                                                +{min} min {min===15?'(auto)':'(accord requis)'}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })()}
                                </div>
                                {/* Ligne 2 : Terminer + Annuler */}
                                <div style={{display:'flex',gap:8}}>
                                  {(()=>{
                                    // Terminer : condition = J'y suis coché ET heure RDV passée
                                    const isSnd = user.id === c.sender_id
                                    const myArrived = isSnd ? !!c.sender_arrived : !!c.receiver_arrived
                                    const otherArrived = isSnd ? !!c.receiver_arrived : !!c.sender_arrived
                                    const bothArrived = myArrived && otherArrived
                                    const rdvMs = c.proposed_time ? new Date(c.proposed_time).getTime() + (c.retard_min||0)*60*1000 : 0
                                    const rdvPast = rdvMs > 0 ? rdvMs < Date.now() : false
                                    // Terminer = les DEUX ont cliqué "J'y suis" ET l'heure du RDV est passée.
                                    // Si l'autre ne vient pas → on passe par le feedback "Lapin", PAS par Terminer.
                                    const canTerminer = bothArrived && rdvPast
                                    const terminerReason = !myArrived
                                      ? (lang==='en'?"Check in first (J'y suis)":'Clique d\'abord "J\'y suis !"')
                                      : !otherArrived
                                        ? (lang==='en'?"The other person hasn't confirmed they're here yet":"L'autre n'a pas encore confirmé sa présence")
                                        : !rdvPast
                                          ? (lang==='en'?'Wait for RDV time':'Attends l\'heure du RDV')
                                          : ''
                                    return (
                                      <button onClick={()=>{
                                        if (!canTerminer) {
                                          showToast(`⚠️ ${terminerReason}`, C.orange)
                                          return
                                        }
                                        setInlineFbSel(null)
                                        setInlineFeedbackId(c.id)
                                        // Mise à jour DB immédiate → déclenche realtime chez l'autre
                                        if (!isMock) supabase.from('clutches').update({status:'completed'}).eq('id',c.id).then(()=>{})
                                        setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,status:'completed'}:cl))
                                      }} style={{flex:1,padding:'12px 8px',
                                        background:canTerminer?C.green:C.border,
                                        border:canTerminer?'none':`1px solid ${C.borderStrong}`,
                                        borderRadius:12,color:canTerminer?'#fff':C.salmon,
                                        fontSize:12,fontWeight:900,
                                        cursor:canTerminer?'pointer':'default',
                                        fontFamily:'inherit',touchAction:'manipulation',WebkitTapHighlightColor:'transparent',position:'relative',zIndex:1}}>
                                        {canTerminer ? `✓ ${lang==='en'?'Done':'Terminer'}` : `⏳ ${lang==='en'?'Waiting':'En attente'}`}
                                      </button>
                                    )
                                  })()}
                                  {/* Annuler masqué une fois sur place (J'y suis) : on ne peut plus annuler, seulement Terminer */}
                                  {!(user.id===c.sender_id ? c.sender_arrived : c.receiver_arrived) && (
                                  <button onClick={()=>setCancelConfirmId(c.id)}
                                    style={{flex:1,padding:'8px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,color:C.red,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                                    ✕ {lang==='en'?'Cancel':'Annuler'}
                                  </button>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                          {effectiveStatus==='pending'&&isRec&&(
                            <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:10}}>
                              {/* Contre-Clutch — proposer autre lieu/heure */}
                              <button onClick={()=>{setCounterClutchId(c.id);setCounterVenue(c.venue||'');setCounterTime('');setCounterMsg('')}}
                                style={{width:'100%',padding:'7px',background:'rgba(83,41,67,.07)',border:`1px dashed ${C.border}`,borderRadius:10,color:C.salmon,fontSize:11,fontWeight:700,cursor:'pointer',fontFamily:'inherit',letterSpacing:0.2}}>
                                ↩ {lang==='en'?'Counter-propose (other place/time)':'Contre-proposer (autre lieu/heure)'}
                              </button>
                              <div style={{display:'flex',gap:8}}>
                              <button onClick={async()=>{
                                // Forteresse : « en pause » = chevauche un RDV déjà confirmé → on bloque AVANT (sinon la base refuse)
                                if (paused) { showToast(lang==='en'?'⏸ On hold — you have a meetup at that time':'⏸ En pause — tu as un RDV à cette heure', C.salmon); return }
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
                                  const {error} = await supabase.from('clutches').update({status:'confirmed'}).eq('id',c.id)
                                  if (error) {
                                    // Forteresse anti-conflit : tu as déjà un RDV qui chevauche cette heure (occ_no_overlap)
                                    const conflit = (error as any).code==='23P01' || /occ_no_overlap|exclusion|overlap/i.test(error.message||'')
                                    if (conflit) {
                                      // rollback de l'optimiste : on retire l'animation + le statut local
                                      setShowVerrou(false)
                                      setLocalConfirmed(prev=>{ const s=new Set(prev); s.delete(c.id); return s })
                                      setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,status:'pending'}:cl))
                                      try { localStorage.removeItem(`clutch_locked_at_${c.id}`); localStorage.removeItem(`verrou_shown_${c.id}`) } catch {}
                                      showToast(lang==='en'?'⏱️ You already have a meetup at that time':'⏱️ Tu as déjà un rendez-vous à cette heure', C.salmon)
                                    } else {
                                      showToast('⚠️ Verrou error: '+error.message, C.red)
                                    }
                                  }
                                  loadClutches()
                                }
                              }} style={{flex:1,padding:'9px',background:paused?'rgba(83,41,67,.06)':`${C.green}20`,border:`1px solid ${paused?C.border:`${C.green}55`}`,borderRadius:10,color:paused?C.whiteMid:C.green,fontSize:12,fontWeight:800,cursor:paused?'default':'pointer',fontFamily:'inherit',opacity:paused?0.6:1}}>{paused?(lang==='en'?'⏸ On hold':'⏸ En pause'):`🔒 ${lang==='en'?'Lock in':'Verrouiller'}`}</button>
                              <button onClick={async()=>{
                                // Optimistic update immédiat
                                setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===c.id?{...cl,status:'declined'}:cl))
                                if(!isMock) await supabase.from('clutches').update({status:'declined'}).eq('id',c.id)
                                showToast(lang==='en'?'Clutch declined':'Clutch refusé',C.whiteMid)
                                loadClutches()
                              }} style={{flex:1,padding:'9px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:10,color:C.red,fontSize:12,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>✕ {lang==='en'?'Decline':'Refuser'}</button>
                              </div>
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
                          <span>📁 {lang==='en'?'History':'Historique'} ({displayHist.length})</span>
                          <span>{showHistory?'▲':'▼'}</span>
                        </button>
                        {showHistory&&displayHist.map((c:any)=>{
                          const isRec=c.receiver_id===user.id
                          const other=isRec?c.sender:c.receiver
                          const wasCancelledOnMe = isRec && c.status==='cancelled'
                          const wasDeclinedOnMe = !isRec && c.status==='declined'
                          const isMutualContact = c.status==='completed' && mutualContactIds.has(c.id)
                          const sc=c.status==='completed'?C.green:c.status==='declined'?C.red:c.status==='cancelled'?C.orange:C.whiteMid
                          const sl=c.status==='completed'
                            ? (lang==='en'?'✓ Met up':'✓ RDV fait')
                            : c.status==='declined'
                            ? (isRec ? (lang==='en'?'✕ Declined':'✕ Refusé') : (lang==='en'?'✕ They declined':'✕ Refusé'))
                            : c.status==='cancelled'
                            ? (isRec ? (lang==='en'?'↩ Cancelled by them':'↩ Annulé') : (lang==='en'?'↩ You cancelled':'↩ Tu as annulé'))
                            : (lang==='en'?'Expired':'Expiré')
                          return (
                            <div key={c.id} style={{background:C.bgCard,border:`1px solid ${isMutualContact?'rgba(235,107,175,.3)':'rgba(255,255,255,.06)'}`,borderRadius:12,marginTop:4,padding:'9px 11px',opacity: isMutualContact?1:.65,display:'flex',gap:10,alignItems:'flex-start'}}>
                              <Av src={other?.photo_url} name={other?.name||'?'} size={30}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:11,fontWeight:600,color:isMutualContact?C.salmon:C.whiteMid}}>{isRec?'↙':'↗'} {other?.name||'?'}</div>
                                <div style={{fontSize:10,color:'rgba(255,255,255,.3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{c.venue||'–'}</div>
                                {(wasCancelledOnMe||wasDeclinedOnMe)&&(
                                  <div style={{fontSize:9,color:C.salmon,marginTop:3,opacity:.8}}>
                                    {lang==='en'?'Their reliability score decreased.':'Leur score de fiabilité a diminué.'}
                                  </div>
                                )}
                                {isMutualContact&&(
                                  <button onClick={()=>{setChatClutch(c);setShowChat(true)}}
                                    style={{marginTop:6,width:'100%',padding:'7px 10px',background:'rgba(235,107,175,.15)',border:'1px solid rgba(235,107,175,.4)',borderRadius:9,color:C.gold,fontSize:11,fontWeight:800,cursor:'pointer',fontFamily:'inherit',textAlign:'center'}}>
                                    💬 {lang==='en'?`Chat with ${other?.name||'...'}`:`Discuter avec ${other?.name||'...'}`}
                                  </button>
                                )}
                              </div>
                              <span style={{fontSize:9,color:sc,whiteSpace:'nowrap',marginTop:2}}>{sl}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
                )
              })()}

              {/* ── TAB : CONTACTS ── */}
              {tab==='contacts' && (()=>{
                const t2 = (k:string) => (lang==='fr' ? {
                  'contacts.title':'Mes contacts',
                  'contacts.empty':'Aucun contact pour l\'instant',
                  'contacts.empty.sub':'Tes contacts apparaissent ici après un RDV réussi et un "Garder le contact" mutuel',
                  'msg.new':'Nouveau message',
                } : {
                  'contacts.title':'My contacts',
                  'contacts.empty':'No contacts yet',
                  'contacts.empty.sub':'Contacts appear here after a successful meetup with mutual keep contact',
                  'msg.new':'New message',
                })[k] || k

                // Contacts = clutches avec keep_contact mutuel, DÉDOUBLONNÉS par personne
                // (une personne = un seul contact, on garde son RDV le plus récent).
                const _contactRaw = (clutches as any[]).filter(c => mutualContactIds.has(c.id))
                const _byPerson = new Map<string, any>()
                _contactRaw.forEach((c:any) => {
                  const otherId = c.sender_id === user?.id ? c.receiver_id : c.sender_id
                  const existing = _byPerson.get(otherId)
                  const cTime = new Date(c.proposed_time||c.created_at||0).getTime()
                  if (!existing || cTime > new Date(existing.proposed_time||existing.created_at||0).getTime()) _byPerson.set(otherId, c)
                })
                const contactClutches = [..._byPerson.values()]

                return (
                  <div className="fi" style={{position:'fixed',inset:0,bottom:'calc(72px + var(--sab))',background:C.bg,display:'flex',flexDirection:'column',overflowY:'auto'}}>
                    {/* Header compact — titre « Mes contacts » retiré (déjà dans la nav du bas), on garde le compte (David : libérer le haut) */}
                    <div style={{padding:'10px 16px 8px',paddingTop:'calc(var(--sat) + 8px)',borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
                      <div style={{fontSize:12.5,fontWeight:700,color:C.white}}>{contactClutches.length} contact{contactClutches.length!==1?'s':''}</div>
                    </div>

                    {/* Liste */}
                    <div style={{flex:1,overflowY:'auto',padding:'8px 12px',WebkitOverflowScrolling:'touch' as any}}>
                      {contactClutches.length === 0 ? (
                        <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:12,textAlign:'center',padding:'0 32px'}}>
                          <div style={{fontSize:48,marginBottom:8}}>💬</div>
                          <div style={{fontSize:16,fontWeight:800,color:'#f5e8de'}}>{t2('contacts.empty')}</div>
                          <div style={{fontSize:13,color:'rgba(255,255,255,.4)',lineHeight:1.5}}>{t2('contacts.empty.sub')}</div>
                        </div>
                      ) : contactClutches.map((c:any) => {
                        const other = c.sender_id === user?.id ? c.receiver : c.sender
                        const unread = unreadChats[c.id] || 0
                        const otherName = other?.name || '?'
                        const otherPhoto = other?.photo_url
                        return (
                          <div key={c.id} style={{marginBottom:8}}>
                          {/* Pas de chat (philosophie Clutch) : le clic ouvre le PROFIL → de là on peut proposer un RDV */}
                          <button onClick={()=>{ if(other){setSelProfile(other);setShowProfileSheet(true)} }} style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'14px 12px',background:'rgba(255,255,255,.04)',border:`1px solid rgba(83,41,67,.1)`,borderRadius:16,marginBottom:6,cursor:'pointer',fontFamily:'inherit',touchAction:'manipulation',WebkitTapHighlightColor:'transparent',position:'relative'}}>
                            <div style={{width:52,height:52,borderRadius:'50%',background:'rgba(235,107,175,.15)',flexShrink:0,overflow:'hidden',border:`2px solid ${unread>0?'#EB6BAF':'rgba(83,41,67,.2)'}`}}>
                              {otherPhoto ? <img src={otherPhoto} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/> : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{otherName[0]?.toUpperCase()}</div>}
                            </div>
                            <div style={{flex:1,textAlign:'left'}}>
                              <div style={{fontSize:15,fontWeight:800,color:'#f5e8de'}}>{otherName}</div>
                              <div style={{fontSize:11,color:'rgba(255,255,255,.4)',marginTop:2}}>RDV · {new Date(c.proposed_time||c.created_at).toLocaleDateString('fr-CH',{day:'numeric',month:'short'})}</div>
                            </div>
                            {unread > 0 && (
                              <div style={{width:22,height:22,borderRadius:'50%',background:'#EB6BAF',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:900,color:'#fff',flexShrink:0,boxShadow:'0 0 8px rgba(235,107,175,.6)'}}>
                                {unread}
                              </div>
                            )}
                            <div style={{color:'rgba(255,255,255,.3)',fontSize:18,flexShrink:0}}>›</div>
                          </button>
                          <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>setContactClutchTarget({...other,_clutchId:c.id})}
                            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:12,border:`1px solid ${C.gold}44`,background:`${C.gold}11`,color:C.gold,fontSize:13,fontWeight:800,cursor:'pointer',fontFamily:'inherit',touchAction:'manipulation'}}>
                            ✦ Proposer un RDV
                          </button>
                          {/* Retrait DISCRET : on passe MON keep_contact à false → le contact n'est plus mutuel → disparaît. L'autre n'est PAS notifié. */}
                          <button onClick={async()=>{
                            if(!user?.id) return
                            // 2-temps inline (window.confirm bloqué dans la WebView iOS)
                            if(contactArmedId!==c.id){ setContactArmedId(c.id); setTimeout(()=>setContactArmedId(p=>p===c.id?null:p),4000); return }
                            setContactArmedId(null)
                            const otherId = c.sender_id===user.id ? c.receiver_id : c.sender_id
                            const ids = (clutches as any[]).filter(x=>mutualContactIds.has(x.id)&&(x.sender_id===otherId||x.receiver_id===otherId)).map(x=>x.id)
                            try{ await supabase.from('rdv_feedbacks').update({keep_contact:false}).in('rdv_id',ids).eq('from_id',user.id) }catch{}
                            setMutualContactIds(prev=>{const n=new Set(prev);ids.forEach((id:string)=>n.delete(id));return n})
                          }}
                            style={{padding:'10px 14px',borderRadius:12,border:`1px solid ${contactArmedId===c.id?C.red:`${C.salmon}33`}`,background:contactArmedId===c.id?`${C.red}12`:'transparent',color:contactArmedId===c.id?C.red:`${C.salmon}aa`,fontSize:13,fontWeight:contactArmedId===c.id?800:700,cursor:'pointer',fontFamily:'inherit',touchAction:'manipulation',whiteSpace:'nowrap'}}>
                            {contactArmedId===c.id?'Confirmer ?':'Retirer'}
                          </button>
                          </div>
                          </div>
                        )
                      })}
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
                  /* gate à 2 conditions : is_available ET available_until > now (sinon Profil dit "dispo" alors que c'est expiré) */
                  isAvailable={!!availableRef}
                  rdvBlocked={rdvBlocked}
                  onFeedback={()=>setShowAppFeedback(true)}
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

                const pendingRetard = (clutches as any[]).filter(c=>
                  Number(c.retard_min) === 30 && c.retard_accepted == null &&
                  c.retard_by && c.retard_by !== user?.id &&
                  ['confirmed','accepted','checked_in'].includes(c.status)
                ).length

                const clutchBadge: TabBadge =
                  pendingRec > 0 ? {type:'clutch-new', count:pendingRec}  // 🔴 priorité max
                  : pendingRetard > 0 ? {type:'retard'}                   // 🔴 retard 30min à valider
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
                const contactsBadge: TabBadge = contactsUnread > 0 ? {type:'contact-msg', count:contactsUnread} : null

                return <TabBar tab={tab} set={setTab} lang={lang}
                  badges={{clutchs: clutchBadge, evenements: evBadge, presences: presenceBadge, contacts: contactsBadge}}
                  availInfo={{
                    isAvail: !!availableRef,
                    until: availableRef && user?.available_until ? new Date(user.available_until).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'}) : undefined,
                    city: (user as any)?.available_city || undefined,
                    rayon: rayon,
                  }}
                  onAvailClick={()=>{ if(availableRef){setTab('profil')} else {setFlow('carte')} }}/>
              })()}
            </>
          )}

          {/* Banner Verrou actif — top bar (masqué si ProximityRadar déjà visible) */}
          {flow==='app' && activeVerrou && !showVerrou && (()=>{
            const diffMs = activeVerrou?.proposed_time ? new Date(activeVerrou.proposed_time).getTime() - Date.now() : Infinity
            const radarActive = diffMs < 30*60*1000 && diffMs > -60*60*1000
            return !radarActive ? (
              <ActiveVerrouBar
                verrou={{...activeVerrou, my_id:user.id}}
                onClick={()=>setTab('clutchs')}
                lang={lang}
              />
            ) : null
          })()}
          {/* 🛡️ SOS discret — visible UNIQUEMENT pendant un RDV actif (demande David : sécurité à 1 geste pendant le rendez-vous) */}
          {flow==='app' && activeVerrou && !showVerrou && (
            <QuickSOS user={user} supabase={supabase} lang={lang} showToast={showToast}/>
          )}
          {/* 🎮 Cockpit de test flottant — admin only, par-dessus l'app, déplaçable. À retirer avant lancement. */}
          {flow==='app' && user && isAdminId(user.id) && <TestCockpit userId={user.id} isAdmin={true} showToast={showToast}/>}
          {/* D3 — RDV en cours RÉDUIT : pastille flottante (coin bas-droit) qui n'obstrue pas l'écran.
              Toucher = ré-agrandir le radar. L'utilisateur peut voir/parcourir les events librement. */}
          {flow==='app' && activeVerrou && !showVerrou && !inlineFeedbackId && radarMin && (()=>{
            const rdvMs = activeVerrou.proposed_time ? new Date(activeVerrou.proposed_time).getTime() : 0
            const minLeft = rdvMs ? Math.round((rdvMs-Date.now())/60000) : null
            const lbl = minLeft==null ? 'RDV' : minLeft>60 ? `${Math.floor(minLeft/60)}h${String(minLeft%60).padStart(2,'0')}` : minLeft>0 ? `${minLeft}min` : (lang==='en'?'now':'maint.')
            return (
              <button onClick={()=>setRadarMin(false)}
                style={{position:'fixed',right:12,bottom:'calc(84px + var(--sab))',zIndex:2600,display:'flex',alignItems:'center',gap:8,
                  background:C.green,border:'none',borderRadius:24,padding:'9px 14px',cursor:'pointer',fontFamily:'inherit',
                  boxShadow:'0 6px 20px rgba(0,0,0,.35)',animation:'badgeUrgent 2.4s ease-in-out infinite'}}>
                <span style={{fontSize:15}}>🔒</span>
                <span style={{fontSize:12.5,fontWeight:900,color:'#fff'}}>{lang==='en'?'Meetup':'RDV'} · {lbl}</span>
                <span style={{fontSize:11,color:'#fff',opacity:.85}}>↑</span>
              </button>
            )
          })()}
          {/* Radar de proximité — overlay bottom, TOUTES pages, s'active <30min avant RDV. Masqué si feedback inline actif OU réduit (D3) */}
          {flow==='app' && activeVerrou && !showVerrou && !inlineFeedbackId && !radarMin && (
            <>
            {/* Bouton RÉDUIRE (D3) — au-dessus du radar, pour libérer l'écran sans annuler le RDV */}
            <button onClick={()=>setRadarMin(true)} title={lang==='en'?'Minimize':'Réduire'}
              style={{position:'fixed',right:14,bottom:'calc(192px + var(--sab))',zIndex:2700,width:34,height:34,borderRadius:17,
                background:'rgba(20,10,16,.82)',border:`1px solid ${C.border}`,color:'#fff',fontSize:16,fontWeight:900,cursor:'pointer',
                fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 12px rgba(0,0,0,.3)'}}>↓</button>
            <ProximityRadar
              verrou={{...activeVerrou}}
              userId={user.id}
              lang={lang}
              supabase={supabase}
              onClick={()=>setTab('clutchs')}
              onRetardAck={()=>{ setClutches(prev=>(prev as any[]).filter((c:any)=>c.id!==activeVerrou.id)); setTab('presences') }}
              onCheckin={()=>{
                if (checkinDone.has(activeVerrou.id)) return // une seule fois
                setCheckinDone(prev=>new Set([...prev,activeVerrou.id]))
                const doCheckin = async (gpsVerified: boolean) => {
                  const isSnd = activeVerrou.sender_id === user.id
                  const arrivedField = isSnd ? 'sender_arrived' : 'receiver_arrived'
                  setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===activeVerrou.id?{...cl,[arrivedField]:true}:cl))
                  await supabase.from('clutches').update({ [arrivedField]:true }).eq('id',activeVerrou.id)
                  Sounds.checkin()
                  // 🔔 Prévenir l'autre que je suis arrivé·e au lieu.
                  const otherId = isSnd ? (activeVerrou as any).receiver_id : (activeVerrou as any).sender_id
                  const myFirst = ((user as any)?.name||'').split(' ')[0] || (lang==='en'?'Someone':'Quelqu\'un')
                  if (otherId) pushTo(otherId, lang==='en'?'📍 They\'ve arrived!':'📍 Iel est arrivé·e !',
                    lang==='en'?`${myFirst} is at the spot — your turn!`:`${myFirst} est sur place — à toi !`,
                    { type:'arrived', clutch_id: activeVerrou.id })
                  showToast(gpsVerified?(lang==='en'?'✓ GPS verified 📍':'✓ Présence vérifiée GPS 📍'):(lang==='en'?'✓ Check-in done !':'✓ Check-in fait !'), C.green)
                }
                const vLat = (activeVerrou as any).venue_lat
                const vLng = (activeVerrou as any).venue_lng
                if (vLat && vLng && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    pos => {
                      const dist = haversineKm(pos.coords.latitude, pos.coords.longitude, vLat, vLng)
                      if (dist > 0.10) { // > 100m
                        showToast(`📍 Tu es à ${Math.round(dist*1000)}m du lieu — encore un peu !`, C.orange)
                        // Laisse quand même checker mais non vérifié GPS
                      }
                      doCheckin(dist <= 0.10)
                    },
                    () => doCheckin(false),
                    { enableHighAccuracy:true, timeout:8000, maximumAge:0 }
                  )
                } else {
                  doCheckin(false)
                }
              }}
              onTerminer={()=>{
                _setTab('clutchs')
                setInlineFbSel(null)
                setInlineFeedbackId(activeVerrou.id)
                // Mise à jour DB immédiate → déclenche realtime chez l'autre
                supabase.from('clutches').update({status:'completed'}).eq('id',activeVerrou.id).then(()=>{})
                setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===activeVerrou.id?{...cl,status:'completed'}:cl))
              }}
            />
            </>
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
              onClutch={()=>{
                // Bloc dur : pas pendant un RDV verrouillé, ET pas tant qu'un feedback post-RDV n'est pas rempli (David)
                if(!clutchGuard()){ setShowProfileSheet(false); return }
                setShowProfileSheet(false);setShowSend(true)
              }}
              onClose={()=>setShowProfileSheet(false)} showToast={showToast}
              activeClutch={existingLock}
              pendingClutch={pendingClutch}
              onOpenChat={existingLock?()=>{setChatClutch(existingLock);setShowChat(true)}:undefined}
              userInterests={(user as any).interests||[]} lang={lang}/>
          })()}
          {showDelete&&user&&<DeleteModal userId={user.id} onDeleted={()=>{setShowDelete(false);setUser(null);setProfiles([]);setClutches([]);setScreen('login')}} onClose={()=>setShowDelete(false)} showToast={showToast} lang={lang}/>}
          {/* Feuille « Mes créneaux » (multi-créneaux, max 3) */}
          {showSlots && (
            <div style={{position:'fixed',inset:0,zIndex:4050,background:'rgba(10,4,8,.6)',backdropFilter:'blur(6px)',display:'flex',flexDirection:'column',justifyContent:'flex-end'}} onClick={()=>setShowSlots(false)}>
              <div onClick={e=>e.stopPropagation()} style={{background:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:'18px 18px calc(24px + var(--sab))',borderTop:`1px solid ${C.border}`,maxHeight:'72vh',overflowY:'auto'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                  <div style={{fontSize:16,fontWeight:900,color:C.white}}>📍 {lang==='en'?'My slots':'Mes créneaux'} <span style={{color:C.whiteMid,fontWeight:700,fontSize:13}}>{myAvail.length}/3</span></div>
                  <button onClick={()=>setShowSlots(false)} style={{background:'none',border:'none',color:C.whiteMid,fontSize:24,cursor:'pointer',fontFamily:'inherit',lineHeight:1}}>×</button>
                </div>
                <div style={{fontSize:11.5,color:C.whiteMid,marginBottom:12}}>{lang==='en'?'When and where you\'re open to spontaneous meetups (next 18h).':'Quand et où tu es ouvert·e aux rencontres spontanées (dans les 18h).'}</div>
                {myAvail.length===0 && <div style={{color:C.whiteMid,fontSize:13,textAlign:'center',padding:'18px 0'}}>{lang==='en'?'No active slot.':'Aucun créneau actif.'}</div>}
                {[...myAvail].sort((a:any,b:any)=>new Date(a.start_at).getTime()-new Date(b.start_at).getTime()).map((s:any)=>{
                  const f=new Date(s.start_at), u=new Date(s.end_at); const fmt=(d:Date)=>d.toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})
                  return (
                    <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'11px 12px',borderRadius:12,border:`1px solid ${C.border}`,marginBottom:8,background:C.bgCard}}>
                      <span style={{width:7,height:7,borderRadius:'50%',background:C.green,flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13.5,fontWeight:800,color:C.white}}>{fmt(f)}–{fmt(u)}</div>
                        <div style={{fontSize:11,color:C.whiteMid,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.place||'—'}</div>
                      </div>
                      {/* B/D1 — Modifier : on retire ce créneau puis on rouvre le réglage (le créneau étant retiré, pas de fausse alerte de chevauchement B3). */}
                      <button onClick={async()=>{ await removeSlot(s.id); setShowSlots(false); setFlow('carte') }} style={{background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,borderRadius:9,color:C.white,fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>✏️ {lang==='en'?'Edit':'Modifier'}</button>
                      <button onClick={()=>removeSlot(s.id)} style={{background:'rgba(255,255,255,.05)',border:`1px solid ${C.border}`,borderRadius:9,color:C.salmon,fontSize:11,fontWeight:700,padding:'6px 10px',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>{lang==='en'?'Remove':'Retirer'}</button>
                    </div>
                  )
                })}
                {myAvail.length<3
                  ? <button onClick={()=>{setShowSlots(false);setFlow('carte')}} style={{width:'100%',marginTop:6,padding:'13px',borderRadius:13,border:'none',background:C.orange,color:'#fff',fontSize:14,fontWeight:800,cursor:'pointer',fontFamily:'inherit'}}>+ {lang==='en'?'Add a slot':'Ajouter un créneau'}</button>
                  : <div style={{textAlign:'center',color:C.whiteMid,fontSize:12,marginTop:8}}>{lang==='en'?'Max 3 slots reached':'Maximum 3 créneaux atteint'}</div>}
              </div>
            </div>
          )}
          {/* Overlay bloquant feedback — aucune interaction possible tant que feedback non donné */}
          {showFeedback&&feedbackClutch&&<div style={{position:'fixed',inset:0,zIndex:3999,background:'rgba(10,4,8,.92)',backdropFilter:'blur(4px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end'}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:'20px 20px 0',textAlign:'center',maxWidth:380}}>
              <div style={{fontSize:28,marginBottom:8}}>🎯</div>
              <div style={{fontSize:17,fontWeight:900,color:C.salmon,marginBottom:4}}>Comment s{"'"}est passé le RDV ?</div>
              <div style={{fontSize:12,color:C.whiteMid}}>Donne ton avis pour débloquer l{"'"}app</div>
            </div>
          </div>}
          {showFeedback&&feedbackClutch&&user&&<FeedbackSheet
            clutch={feedbackClutch} userId={user.id} lang={lang} pendingCount={pendingFeedbacks}
            onScore={async(delta)=>{
              const newScore = Math.max(0, Math.min(100, (userScore??user.reliability_score??80) + delta))
              setUserScore(newScore)
              setUser(prev=>prev?{...prev,reliability_score:newScore}:prev)
              try { await supabase.from('profiles').update({reliability_score:newScore}).eq('id',user.id) } catch {}
              if (delta>0) showToast(`🌟 +${delta} reliability pts → ${newScore}`, C.green)
              else showToast(`${delta} reliability pts → ${newScore}`, C.red)
            }}
            onClose={async(rating)=>{
              const doneId = feedbackClutch?.id
              try { localStorage.setItem(`feedback_done_${doneId}`, String(Date.now())) } catch {}
              // Masquage définitif immédiat — résiste à loadClutches()
              if (doneId) {
                addCompleted(doneId)
                setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===doneId?{...cl,status:'completed'}:cl))
              }
              setShowFeedback(false)
              setFeedbackClutch(null)
              setTerminerClutchId(null)
              showToast('✓ RDV terminé — merci !', C.green)
              // Proposer de garder le contact après le feedback
              const clutchForContact = (clutches as any[]).find((cl:any)=>cl.id===doneId) || feedbackClutch
              if (clutchForContact) setTimeout(()=>setKeepContactClutch(clutchForContact), 400)
              loadClutches()
              // Si plus de créneau actif → proposer d'en ouvrir un nouveau (toast discret, pas de redirect forcée)
              if (user && !(user.is_available && (user as any).available_until && new Date((user as any).available_until) > new Date())) {
                setTimeout(()=>showToast(lang==='en'?'Open a new slot to stay visible ✦':'Ouvre un nouveau créneau pour rester visible ✦', C.orange), 1500)
              }
            }}
          />}
          {/* Modal "Garder le contact ?" — après feedback */}
          {keepContactClutch&&user&&(()=>{
            const isSnd = keepContactClutch.sender_id === user.id
            const other = isSnd ? (keepContactClutch.receiver||keepContactClutch._receiver) : (keepContactClutch.sender||keepContactClutch._sender)
            const otherName = other?.name || '...'
            const otherPhoto = other?.photo_url
            // #4 — cette personne est-elle DÉJÀ un contact mutuel (via un autre RDV) ?
            const _otherId = isSnd ? keepContactClutch.receiver_id : keepContactClutch.sender_id
            const alreadyContact = (clutches as any[]).some((cl:any)=> mutualContactIds.has(cl.id) && cl.id !== keepContactClutch.id && (cl.sender_id===_otherId || cl.receiver_id===_otherId))
            const handleAnswer = async (yes: boolean) => {
              setKeepContactClutch(null)
              try {
                const _toId = isSnd ? keepContactClutch.receiver_id : keepContactClutch.sender_id
                await supabase.from('rdv_feedbacks').upsert(
                  {rdv_id: keepContactClutch.id, from_id: user.id, to_id: _toId, keep_contact: yes},
                  {onConflict: 'rdv_id,from_id'}
                )
                // Réciprocité auto pour les BOTS (la policy admin rdv_feedbacks_bot_admin l'autorise ; pour un vrai humain la RLS bloque → sans effet)
                if (yes) { try { await supabase.from('rdv_feedbacks').upsert({rdv_id: keepContactClutch.id, from_id: _toId, to_id: user.id, outcome:'on_time', keep_contact: true},{onConflict:'rdv_id,from_id'}) } catch {} }
              } catch {}
              if (!yes) { _setTab('presences'); return }
              const otherId = isSnd ? keepContactClutch.receiver_id : keepContactClutch.sender_id
              const {data:otherFb} = await supabase.from('rdv_feedbacks')
                .select('keep_contact').eq('rdv_id',keepContactClutch.id).eq('from_id',otherId).maybeSingle()
              if (otherFb?.keep_contact === true) {
                setMutualContactIds(prev => new Set([...prev, keepContactClutch.id]))
                showToast(`✦ Contact mutuel avec ${otherName} !`, C.gold)
                _setTab('contacts')
              } else {
                setWaitingMutualContact({clutchId: keepContactClutch.id, clutch: keepContactClutch})
                showToast(`En attente de ${otherName}...`, C.gold)
                _setTab('presences')
              }
              loadClutches()
            }
            return (
              <div style={{position:'fixed',inset:0,zIndex:4100,background:'rgba(10,4,8,.85)',backdropFilter:'blur(8px)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end'}} onClick={()=>setKeepContactClutch(null)}>
                <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,background:C.bg,borderRadius:'20px 20px 0 0',padding:'28px 24px 48px',border:`1px solid ${C.border}`,boxShadow:'0 -8px 30px rgba(0,0,0,.12)'}}>
                  <div style={{textAlign:'center',marginBottom:24}}>
                    {otherPhoto && <div style={{width:64,height:64,borderRadius:'50%',backgroundImage:`url(${otherPhoto})`,backgroundSize:'cover',backgroundPosition:'center',margin:'0 auto 12px',border:'3px solid rgba(83,41,67,.3)'}}/>}
                    <div style={{fontSize:18,fontWeight:900,color:'#f5e8de',marginBottom:6}}>{alreadyContact ? '✦ Déjà dans tes contacts' : 'Garder le contact ?'}</div>
                    <div style={{fontSize:13,color:'rgba(83,41,67,.7)'}}>{alreadyContact ? <>Tu as déjà <strong style={{color:'#EB6BAF'}}>{otherName}</strong> dans tes contacts.</> : <>Veux-tu rester en contact avec <strong style={{color:'#EB6BAF'}}>{otherName}</strong> ?</>}</div>
                  </div>
                  <div style={{display:'flex',gap:12}}>
                    <button onClick={()=>handleAnswer(false)}
                      style={{flex:1,padding:'14px',borderRadius:14,border:'1px solid rgba(83,41,67,.2)',background:'transparent',color:'rgba(83,41,67,.6)',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}>
                      Non merci
                    </button>
                    <button onClick={()=>handleAnswer(true)}
                      style={{flex:2,padding:'14px',borderRadius:14,border:'none',background:'#EB6BAF',color:'#fff',fontSize:15,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(235,107,175,.4)'}}>
                      Oui, garder contact ✦
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
          {contactClutchTarget&&user&&<ContactClutchModal from={user} to={contactClutchTarget} showToast={showToast}
            onClose={()=>setContactClutchTarget(null)} onSent={()=>{setContactClutchTarget(null);loadClutches()}}/>}
          {showSend&&selProfile&&<SendModal from={user} to={selProfile} fromTime={fromTime} untilTime={untilTime} lang={lang} onClose={()=>setShowSend(false)}
            excludeWindow={activeVerrou?.proposed_time ? {
              fromHH: new Date(new Date(activeVerrou.proposed_time).getTime() - TRUST_CONFIG.RDV_LOCK_BEFORE_MIN*60*1000).toTimeString().slice(0,5),
              untilHH: new Date(new Date(activeVerrou.proposed_time).getTime() + TRUST_CONFIG.RDV_LOCK_AFTER_H*3600*1000).toTimeString().slice(0,5)
            } : undefined}
            onSent={(_clutchId)=>{
            // David : « le clutch disparaît » → on emmène direct sur l'onglet Clutchs pour qu'il VOIE le clutch envoyé
            setShowSend(false); setShowProfileSheet(false); setTab('clutchs'); setShowCelebration(true); loadClutches()
          }} showToast={showToast} onTargetUnavailable={()=>{setShowSend(false);setShowProfileSheet(false);setSlotGoneProfile(selProfile)}}/>}
          {slotGoneProfile&&<SlotGoneOverlay name={slotGoneProfile.name||''} avatar={(slotGoneProfile as any).photo_url||undefined} lang={lang} onDone={()=>{setSlotGoneProfile(null);setTab('presences')}}/>}
          {showCelebration&&<ClutchSent onDone={()=>setShowCelebration(false)} name={selProfile?.name||''} lang={lang}/>}
          {showVerrou&&<VerrouExplosion onDone={onVerrouDone} verrou={verrouData}/>}
          {/* Boutons flottants Clutch Live + Clutch Night (physique billard + dock long-press).
              Masqués pendant un Verrou actif (ne pas cliquer en plein RDV). Affichage piloté par Geek Setup. */}
          <FloatingFabs showLive={fabPrefs.live} showNight={fabPrefs.night} hidden={!!activeVerrou}
            onTapLive={()=>{ setFlow('app'); setTab('presences'); activateLive() }}
            onTapNight={()=>setShowClutchNight(true)} />
          <NotifBanner lang={lang} />
          {showAppFeedback && user && <AppFeedbackModal user={user} onClose={()=>setShowAppFeedback(false)} showToast={showToast}/>}
          {/* 🌙 Clutch Night (prototype) */}
          {showClutchNight && <ClutchNightOverlay onClose={()=>setShowClutchNight(false)} onActivate={()=>{ try{localStorage.setItem('clutch_night_active','1')}catch{}; setShowClutchNight(false); setFlow('app'); setTab('evenements'); try{window.dispatchEvent(new Event('clutch-night-sync'))}catch{}; showToast('🌙 Clutch Night activé',C.green) }}/>}
          {/* ── Contre-Clutch modal ── */}
          {counterClutchId && (
            <div style={{position:'fixed',inset:0,zIndex:4000,background:'rgba(0,0,0,.6)',backdropFilter:'blur(8px)'}} onClick={()=>setCounterClutchId(null)}>
              <div onClick={e=>e.stopPropagation()} style={{position:'absolute',bottom:0,left:0,right:0,background:C.bgSheet,borderRadius:'20px 20px 0 0',padding:'24px 20px 48px',border:`1px solid ${C.border}`}}>
                <div style={{textAlign:'center',marginBottom:16}}>
                  <div style={{fontSize:18,fontWeight:900,color:C.salmon}}>↩ Contre-Clutch</div>
                  <div style={{fontSize:12,color:C.whiteMid,marginTop:4}}>Propose un autre lieu ou une autre heure</div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  <div>
                    <div style={{fontSize:11,color:C.whiteMid,marginBottom:4,fontWeight:600}}>📍 Lieu</div>
                    <input value={counterVenue} onChange={e=>setCounterVenue(e.target.value)}
                      placeholder="Ex : Café du Marché, Place de la Palud"
                      style={{width:'100%',padding:'10px 12px',background:'rgba(255,255,255,.07)',border:`1px solid ${C.border}`,borderRadius:10,color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.whiteMid,marginBottom:4,fontWeight:600}}>🕐 Heure</div>
                    <input type="time" value={counterTime} onChange={e=>setCounterTime(e.target.value)}
                      style={{width:'100%',padding:'10px 12px',background:'rgba(255,255,255,.07)',border:`1px solid ${C.border}`,borderRadius:10,color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',boxSizing:'border-box'}}/>
                  </div>
                  <div>
                    <div style={{fontSize:11,color:C.whiteMid,marginBottom:4,fontWeight:600}}>💬 Message (optionnel)</div>
                    <textarea value={counterMsg} onChange={e=>setCounterMsg(e.target.value)}
                      placeholder="Ex : Je suis plutôt dans ce coin-là..."
                      rows={2}
                      style={{width:'100%',padding:'10px 12px',background:'rgba(255,255,255,.07)',border:`1px solid ${C.border}`,borderRadius:10,color:C.white,fontSize:13,fontFamily:'inherit',outline:'none',resize:'none',boxSizing:'border-box'}}/>
                  </div>
                  <button onClick={async()=>{
                    if (!counterVenue.trim() || !counterTime || !user) { showToast('Lieu et heure requis', C.orange); return }
                    const origClutch = (clutches as any[]).find((cl:any)=>cl.id===counterClutchId)
                    if (!origClutch) return
                    const otherId = origClutch.sender_id === user.id ? origClutch.receiver_id : origClutch.sender_id
                    // Refuser l'original
                    setClutches(prev=>(prev as any[]).map((cl:any)=>cl.id===counterClutchId?{...cl,status:'declined'}:cl))
                    await supabase.from('clutches').update({status:'declined'}).eq('id',counterClutchId)
                    // Créer le contre-clutch
                    const today = new Date().toISOString().split('T')[0]
                    const proposedIso = `${today}T${counterTime}:00`
                    await supabase.from('clutches').insert({
                      sender_id: user.id, receiver_id: otherId,
                      venue: counterVenue.trim(),
                      proposed_time: proposedIso,
                      message: counterMsg.trim() || (lang==='fr'?'↩ Contre-Clutch — que dirais-tu de ça ?':'↩ Counter-Clutch — how about this instead?'),
                      status:'pending',
                      expires_at: new Date(Date.now()+2*3600*1000).toISOString(),
                    })
                    setCounterClutchId(null)
                    loadClutches()
                    showToast(lang==='fr'?'↩ Contre-Clutch envoyé !':'↩ Counter-Clutch sent!', C.salmon)
                  }} style={{padding:'12px',background:C.plum,border:'none',borderRadius:12,color:C.bg,fontSize:14,fontWeight:900,cursor:'pointer',fontFamily:'inherit'}}>
                    ↩ {lang==='en'?'Send Counter-Clutch':'Envoyer le Contre-Clutch'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {showChat&&chatClutch&&<ChatSheet clutch={chatClutch} userId={user.id} onClose={()=>setShowChat(false)} showToast={showToast} onMarkRead={(id)=>setUnreadChats(prev=>{const n={...prev};delete n[id];return n})}/>}
          {incomingClutch&&<ClutchIncoming clutch={incomingClutch} lang={lang}
            onCounter={async (venue, proposedTime)=>{
              if (!incomingClutch.id?.startsWith('sim-') && user) {
                // Insert d'abord : si ça échoue, on ne décline pas l'original (on ne le perd pas)
                const { error } = await supabase.from('clutches').insert({
                  sender_id: user.id,
                  receiver_id: incomingClutch.sender_id || incomingClutch.sender?.id,
                  venue,
                  proposed_time: proposedTime,
                  message: lang==='fr' ? `↩ Contre-Clutch : que dirais-tu de ça ?` : `↩ Counter-Clutch: how about this instead?`,
                  status: 'pending',
                  expires_at: new Date(Date.now()+2*3600*1000).toISOString(),
                })
                if (error) {
                  const dup = error.code==='23505' || /clutch_pair_unique|duplicate/i.test(error.message||'')
                  showToast(dup ? (lang==='fr'?'Tu as déjà un Clutch en cours avec cette personne ✦':'You already have an active Clutch with this person ✦') : 'Erreur: '+error.message, C.orange)
                  return
                }
                await supabase.from('clutches').update({status:'declined'}).eq('id',incomingClutch.id)
                loadClutches()
              }
              setIncomingClutch(null)
            }}
            onAccept={()=>{
              if (incomingClutch.id?.startsWith('sim-')) {
                setVerrouData({venue:incomingClutch.venue||'Café Romand',name:incomingClutch.sender?.name||'',photo:incomingClutch.sender?.photo_url||null})
                setIncomingClutch(null)
                try { localStorage.setItem(`verrou_shown_${incomingClutch.id}`, String(Date.now())); localStorage.setItem(`clutch_locked_at_${incomingClutch.id}`, String(Date.now())) } catch {}
                setTimeout(()=>setShowVerrou(true),100)
              } else {
                hap('success')
                supabase.from('clutches').update({status:'accepted'}).eq('id',incomingClutch.id).then(()=>{
                  // 🔔 Prévenir l'EXPÉDITEUR que son Clutch est accepté (étape clé du parcours).
                  const sid = (incomingClutch as any).sender_id || incomingClutch.sender?.id
                  const myFirst = ((user as any)?.name||'').split(' ')[0] || (lang==='en'?'Someone':'Quelqu\'un')
                  if (sid) pushTo(sid, lang==='en'?'✅ Clutch accepted!':'✅ Clutch accepté !',
                    lang==='en'?`${myFirst} accepted — head to ${incomingClutch.venue||'the spot'}`:`${myFirst} a accepté — direction ${incomingClutch.venue||'le lieu'}`,
                    { type:'clutch_accepted', clutch_id: incomingClutch.id })
                  setVerrouData({venue:incomingClutch.venue||'',name:incomingClutch.sender?.name||'',photo:incomingClutch.sender?.photo_url||null})
                  setIncomingClutch(null)
                  loadClutches()
                  try { localStorage.setItem(`verrou_shown_${incomingClutch.id}`, String(Date.now())); localStorage.setItem(`clutch_locked_at_${incomingClutch.id}`, String(Date.now())) } catch {}
                  setTimeout(()=>setShowVerrou(true),100)
                })
              }
            }}
            onDecline={()=>{
              hap('warning')
              if (!incomingClutch.id?.startsWith('sim-')) {
                // 🔔 Prévenir l'expéditeur que son Clutch est décliné (il est libéré, pas de attente inutile).
                const sid = (incomingClutch as any).sender_id || incomingClutch.sender?.id
                if (sid) pushTo(sid, lang==='en'?'Clutch declined':'Clutch décliné',
                  lang==='en'?'Your Clutch wasn\'t accepted this time — plenty of others around!':'Ton Clutch n\'a pas été accepté cette fois — plein d\'autres personnes sont dispo !',
                  { type:'clutch_declined', clutch_id: incomingClutch.id })
                supabase.from('clutches').update({status:'declined'}).eq('id',incomingClutch.id).then(()=>loadClutches())
              }
              setIncomingClutch(null)
              setClutches(prev=>(prev as any[]).filter(c=>c.id!==incomingClutch.id) as any)
            }}
            onLater={()=>setIncomingClutch(null)}
          />}
        </>
      )}
      {/* 🔧 DIAGNOSTIC PUSH (admin) — bandeau PERSISTANT, reste affiché jusqu'au tap. Pour voir le résultat
          réel d'un envoi de notif (combien de destinataires / erreur) sans qu'il disparaisse en 2s. */}
      {pushDiag && (
        <div onClick={()=>setPushDiag(null)}
          style={{position:'fixed',top:'calc(var(--sat) + 8px)',left:8,right:8,zIndex:99999,background:pushDiag.color,
            color:'#fff',borderRadius:12,padding:'12px 14px',fontSize:13,fontWeight:800,lineHeight:1.4,
            boxShadow:'0 6px 20px rgba(0,0,0,.3)',cursor:'pointer'}}>
          {pushDiag.msg}
          <div style={{fontSize:10,fontWeight:600,opacity:.85,marginTop:4}}>👆 touche pour fermer</div>
        </div>
      )}
    </>
  )
}

// ── 🎮 COCKPIT DE TEST (admin-only) — fenêtre FLOTTANTE déplaçable PAR-DESSUS l'app, avec onglets.
// Intégré (pas de page à part) pour ne JAMAIS switcher d'écran (demande David : optimiser son temps de test).
// Autonome (ses propres requêtes Supabase). À RETIRER avant le lancement public (1 composant, admin-gated).
const cockSel: React.CSSProperties = { width:'100%', padding:'8px', borderRadius:8, border:`1px solid ${C.border}`, background:C.bgCard, color:C.white, fontSize:12, fontFamily:'inherit', marginBottom:4 }
const COCK_PLACES = [
  { n:'Lausanne', lat:46.5197, lng:6.6323 },
  { n:'Morges',   lat:46.5094, lng:6.4983 },
  { n:'Genève',   lat:46.2044, lng:6.1432 },
  { n:'Sion',     lat:46.2333, lng:7.3600 },
  { n:'Vevey',    lat:46.4628, lng:6.8419 },
]
type CockTab = 'world'|'express'|'acteur'|'clutch'|'event'|'diag'
function TestCockpit({ userId, isAdmin, showToast }: { userId:string; isAdmin:boolean; showToast:(m:string,c?:string)=>void }) {
  const [open,setOpen] = useState(false)
  const [tab,setTab] = useState<CockTab>('world')
  const [pos,setPos] = useState<{x:number;y:number}>({ x: 12, y: 120 })
  const dragRef = useRef<{ox:number;oy:number;sx:number;sy:number;moved:boolean}|null>(null)
  const [busy,setBusy] = useState<string|null>(null)
  const [bots,setBots] = useState<any[]>([])
  // Acteur (rendre dispo)
  const [aId,setAId]=useState(''); const [aFrom,setAFrom]=useState(18); const [aTo,setATo]=useState(23); const [aPlace,setAPlace]=useState(0); const [aRad,setARad]=useState(10)
  // Clutch (envoi paramétré)
  const [cFrom,setCFrom]=useState(''); const [cTo,setCTo]=useState(''); const [cPlace,setCPlace]=useState(0); const [cH,setCH]=useState(20); const [cM,setCM]=useState(0); const [cQuick,setCQuick]=useState(false)
  // Event
  const [eTitle,setETitle]=useState('Apéro test'); const [ePlace,setEPlace]=useState(0); const [eH,setEH]=useState(20); const [eSpots,setESpots]=useState(8); const [ePlanned,setEPlanned]=useState(false)
  // Diag
  const [fromId,setFromId]=useState(''); const [toId,setToId]=useState(''); const [diag,setDiag]=useState<string|null>(null)
  const [cRes,setCRes]=useState<string|null>(null) // résultat des CAS clutch (auto-vérifiés via qa_test_clutch)
  const [evBots,setEvBots]=useState<Set<string>>(new Set()) // bots qui ont un event actif (pour le roster)
  const loadWorld=async()=>{
    const { data } = await supabase.from('profiles').select('id,name,is_bot,is_available,available_from,available_until,center_lat,center_lng,available_radius_km').eq('is_bot',true).order('name')
    const arr=(data as any[])||[]; const ids=arr.map(b=>b.id)
    const evset=new Set<string>()
    if(ids.length){ const { data: evs } = await supabase.from('events').select('created_by').eq('active',true).in('created_by',ids); ((evs as any[])||[]).forEach(e=>evset.add(e.created_by)) }
    setEvBots(evset)
    setBots([{id:userId,name:'Moi',is_bot:false}, ...arr])
    const firstBot=arr[0]?.id||''
    setAId(p=>p||firstBot); setCFrom(p=>p||firstBot); setCTo(p=>p||userId); setFromId(p=>p||firstBot); setToId(p=>p||userId)
  }
  useEffect(()=>{ if(open) loadWorld() },[open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!isAdmin) return null
  const onDown=(e:React.PointerEvent)=>{ dragRef.current={ox:pos.x,oy:pos.y,sx:e.clientX,sy:e.clientY,moved:false}; try{(e.target as HTMLElement).setPointerCapture(e.pointerId)}catch{} }
  const onMove=(e:React.PointerEvent)=>{ const d=dragRef.current; if(!d) return; if(Math.abs(e.clientX-d.sx)+Math.abs(e.clientY-d.sy)>4) d.moved=true; setPos({x:Math.max(4,d.ox+(e.clientX-d.sx)),y:Math.max(40,d.oy+(e.clientY-d.sy))}) }
  const onUp=()=>{ dragRef.current=null }
  const ACT=['pending','accepted','confirmed','checked_in']
  const tISO=(h:number,m=0)=>{ const d=new Date(); d.setHours(h,m,0,0); if(d.getTime()<Date.now()) d.setDate(d.getDate()+1); return d.toISOString() }
  const nameOf=(id:string)=> bots.find(b=>b.id===id)?.name || '?'
  // ── EXPRESS ──
  const botsOnline=async()=>{ setBusy('on'); try{
    const { data: me } = await supabase.from('profiles').select('center_lat,center_lng').eq('id',userId).maybeSingle()
    const lat=(me as any)?.center_lat||46.5197, lng=(me as any)?.center_lng||6.6323
    const { data, error } = await supabase.from('profiles').update({ is_available:true, available_from:new Date().toISOString(), available_until:new Date(Date.now()+6*3600e3).toISOString(), center_lat:lat, center_lng:lng, available_radius_km:10 }).eq('is_bot',true).select('id')
    showToast(error?('❌ '+error.message):`✓ ${data?.length||0} bots en ligne sur toi 📍`, error?C.red:C.green)
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  const fillInbox=async()=>{ setBusy('fill'); try{
    const { data: bs } = await supabase.from('profiles').select('id,name').eq('is_bot',true).limit(5)
    const ids=((bs as any[])||[]).map(b=>b.id)
    if(ids.length){ await supabase.from('clutches').update({status:'cancelled'}).in('sender_id',ids).eq('receiver_id',userId).in('status',ACT)
      await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id',userId).in('receiver_id',ids).in('status',ACT) }
    let n=0; for(const b of ((bs as any[])||[])){ const {error}=await supabase.from('clutches').insert({ sender_id:b.id, receiver_id:userId, venue:'Lausanne', venue_lat:46.5197, venue_lng:6.6323, proposed_time:tISO(20,0), expires_at:new Date(Date.now()+2*3600e3).toISOString(), status:'pending', message:`Un café ? — ${b.name}` }); if(!error)n++ }
    showToast(n?`✓ ${n} clutchs reçus 📨`:'❌ aucun (déjà pleins ?)', n?C.green:C.orange)
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  const botsAccept=async()=>{ setBusy('acc'); try{
    const { data: bs } = await supabase.from('profiles').select('id').eq('is_bot',true); const ids=((bs as any[])||[]).map(b=>b.id)
    const { data, error } = await supabase.from('clutches').update({status:'accepted'}).eq('sender_id',userId).in('receiver_id',ids).eq('status','pending').select('id')
    showToast(error?('❌ '+error.message):(data?.length?`✓ ${data.length} accepté(s) → ton Verrou 🔒`:'Aucun clutch en attente envoyé à un bot'), error?C.red:(data?.length?C.green:C.orange))
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // RESET COMPLET et HONNÊTE : annule les clutchs + met TOUS les bots hors-ligne + masque LEURS events.
  const resetBots=async()=>{ setBusy('reset'); try{
    const { data: bs } = await supabase.from('profiles').select('id').eq('is_bot',true); const ids=((bs as any[])||[]).map(b=>b.id)
    if(ids.length){
      await supabase.from('clutches').update({status:'cancelled'}).in('sender_id',ids).in('status',ACT)
      await supabase.from('clutches').update({status:'cancelled'}).in('receiver_id',ids).in('status',ACT)
      await supabase.from('profiles').update({ is_available:false }).in('id',ids)                // ↓ COHÉRENCE
      await supabase.from('events').update({ active:false }).in('created_by',ids)                 // leurs events s'éteignent aussi
    }
    showToast('✓ Reset complet : clutchs annulés · bots hors-ligne · leurs events masqués',C.green)
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── ACTEUR : gérer un bot COMME UNE VRAIE PERSONNE (dispo + ses events suivent, cohérence garantie) ──
  const setActorOnline=async(on:boolean)=>{ if(!aId){ showToast('Choisis un acteur',C.orange); return } setBusy('av'); try{
    const p=COCK_PLACES[aPlace]
    const patch = on ? { is_available:true, available_from:tISO(aFrom), available_until:tISO(aTo), center_lat:p.lat, center_lng:p.lng, available_radius_km:aRad } : { is_available:false }
    const { error } = await supabase.from('profiles').update(patch).eq('id',aId)
    // COHÉRENCE : éteindre la personne éteint AUSSI ses events (sinon ils restent en ligne tout seuls = incohérent).
    if(!on) await supabase.from('events').update({ active:false }).eq('created_by',aId)
    showToast(error?('❌ '+error.message):(on?`✓ ${nameOf(aId)} en ligne ${aFrom}h→${aTo}h · ${p.n} · ${aRad}km`:`✓ ${nameOf(aId)} hors-ligne — et ses events masqués`), error?C.red:C.green)
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── ROSTER : un interrupteur par personne (allume = dispo MAINTENANT 5h Lausanne · éteint = + ses events) ──
  const isLive=(b:any)=> !!(b.is_available && b.available_until && new Date(b.available_until).getTime()>Date.now())
  const toggleActor=async(b:any)=>{ setBusy('t'+b.id); try{
    if(isLive(b)){ await supabase.from('profiles').update({ is_available:false }).eq('id',b.id); await supabase.from('events').update({ active:false }).eq('created_by',b.id) }
    else { const p=COCK_PLACES[0]; await supabase.from('profiles').update({ is_available:true, available_from:new Date().toISOString(), available_until:new Date(Date.now()+5*3600e3).toISOString(), center_lat:p.lat, center_lng:p.lng, available_radius_km:10 }).eq('id',b.id) }
    await loadWorld()
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── CLUTCH : envoi paramétré (de→vers, lieu, heure, Quick) ──
  const sendClutch=async()=>{ if(!cFrom||!cTo||cFrom===cTo){ showToast('Choisis 2 personnes différentes',C.orange); return } setBusy('send'); try{
    const p=COCK_PLACES[cPlace]
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id',cFrom).eq('receiver_id',cTo).in('status',ACT)
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id',cTo).eq('receiver_id',cFrom).in('status',ACT)
    const { error } = await supabase.from('clutches').insert({ sender_id:cFrom, receiver_id:cTo, venue:p.n, venue_lat:p.lat, venue_lng:p.lng, proposed_time:tISO(cH,cM), expires_at:new Date(Date.now()+2*3600e3).toISOString(), status:'pending', is_quick_date:cQuick, duration_minutes:cQuick?60:120, message:`(cockpit) ${p.n} à ${String(cH).padStart(2,'0')}h${String(cM).padStart(2,'0')}` })
    showToast(error?('❌ '+error.message):`✓ ${nameOf(cFrom)} → ${nameOf(cTo)} · ${p.n} ${String(cH).padStart(2,'0')}:${String(cM).padStart(2,'0')}`, error?C.red:C.green)
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── EVENT : création paramétrée (heure, places, spontané/planifié) ──
  const createEvent=async()=>{ if(!eTitle.trim()){ showToast('Donne un titre',C.orange); return } setBusy('mkev'); try{
    const p=COCK_PLACES[ePlace]
    const { error } = await supabase.from('events').insert({ title:eTitle.trim(), emoji:'🎟️', lieu:p.n, event_time:`${String(eH).padStart(2,'0')}:00`, event_date:'Aujourd\'hui', starts_at:tISO(eH), duration_minutes:180, spots:eSpots, taken:0, description:'(cockpit)', tags:['test'], ev_gender:'X', type:ePlanned?'partner':'user', status:'pending', active:true, created_by:userId, creator:'Cockpit' })
    showToast(error?('❌ '+error.message):`✓ Event « ${eTitle.trim()} » · ${p.n} ${eH}h · ${ePlanned?'planifié':'spontané'}`, error?C.red:C.green)
  }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── ÉVÉNEMENTS : bibliothèque de CAS (le « Coq » — chaque possibilité du gate = 1 bouton auto-configuré) ──
  const firstBot=()=> bots.find(b=>b.is_bot)?.id || userId
  const mkDispo=async(sMin:number,eMin:number,placeIdx=0)=>{ const p=COCK_PLACES[placeIdx]
    await supabase.from('availabilities').update({active:false}).eq('user_id',userId).eq('active',true)
    await supabase.from('availabilities').insert({ user_id:userId, start_at:new Date(Date.now()+sMin*60e3).toISOString(), end_at:new Date(Date.now()+eMin*60e3).toISOString(), place:p.n, lat:p.lat, lng:p.lng, radius_km:10, active:true })
    await supabase.from('profiles').update({ is_available:true, available_from:new Date(Date.now()+sMin*60e3).toISOString(), available_until:new Date(Date.now()+eMin*60e3).toISOString(), center_lat:p.lat, center_lng:p.lng, available_radius_km:10 }).eq('id',userId)
  }
  const mkEvent=async(o:{offsetMin:number;planned?:boolean;placeIdx?:number;full?:boolean;title:string})=>{ const p=COCK_PLACES[o.placeIdx??0]; const st=new Date(Date.now()+o.offsetMin*60e3)
    await supabase.from('events').insert({ title:o.title, emoji:'🎟️', lieu:p.n, event_time:`${String(st.getHours()).padStart(2,'0')}:00`, event_date:'Test', starts_at:st.toISOString(), duration_minutes:180, spots:o.full?6:8, taken:o.full?6:0, description:'(cockpit)', tags:['test'], ev_gender:'X', type:o.planned?'partner':'user', status:'pending', active:true, created_by:firstBot(), creator:'Cockpit' })
  }
  const evCase=(k:string,setup:()=>Promise<void>,expected:string)=>async()=>{ setBusy(k); try{ await setup(); showToast(`✓ Cas prêt → onglet Événements · ATTENDU : ${expected}`, C.green) }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  const clearTestEvents=async()=>{ setBusy('clrev'); try{ await supabase.from('events').update({active:false}).eq('creator','Cockpit'); showToast('✓ Events de test masqués',C.green) }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── CLUTCH : bibliothèque de CAS auto-vérifiés (fabrique la situation PUIS révèle la vraie raison) ──
  const secondBot=()=> bots.filter(b=>b.is_bot)[1]?.id || firstBot()
  const cleanPair=async(b:string)=>{
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id',userId).eq('receiver_id',b).in('status',ACT)
    await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id',b).eq('receiver_id',userId).in('status',ACT)
    try{ await supabase.from('blocks').delete().eq('blocker_id',userId).eq('blocked_id',b) }catch{}
  }
  const insClutch=(s:string,r:string)=> supabase.from('clutches').insert({ sender_id:s, receiver_id:r, venue:'Lausanne', venue_lat:46.5197, venue_lng:6.6323, proposed_time:tISO(20), expires_at:new Date(Date.now()+2*3600e3).toISOString(), status:'pending', message:'(cockpit)' })
  const runCase=(k:string,fn:()=>Promise<{s:string;r:string}>)=>async()=>{ setBusy(k); setCRes(null); try{
    const { s, r } = await fn()
    const { data, error } = await supabase.rpc('qa_test_clutch',{ p_sender:s, p_receiver:r })
    setCRes(error ? ('__err__'+(/function|does not exist|schema/i.test(error.message)?'Migration qa_test_clutch pas posée':error.message)) : String(data))
  }catch(e:any){ setCRes('__err__'+e.message) } setBusy(null) }
  const resetPair=async()=>{ setBusy('c_reset'); try{ const b=firstBot(); await cleanPair(b); await supabase.from('profiles').update({max_received_clutchs:5}).eq('id',b); setCRes(null); showToast('✓ Paire nettoyée (cooldown : via SQL delete clutch_pairs si besoin)',C.green) }catch(e:any){ showToast('❌ '+e.message,C.red) } setBusy(null) }
  // ── DIAGNOSTIC ──
  const runDiag=async()=>{ setBusy('diag'); setDiag(null); try{
    const { data, error } = await supabase.rpc('qa_test_clutch',{ p_sender:fromId, p_receiver:toId })
    if(error) setDiag(/function|does not exist|schema/i.test(error.message)?'__nomig__':('❌ '+error.message))
    else setDiag(String(data))
  }catch(e:any){ setDiag('❌ '+e.message) } setBusy(null) }
  const REASON:Record<string,string>={ ok:'✅ passerait', self_clutch:'soi-même', blocked:'bloqué (2 sens)', cooldown:'cooldown actif', pair_busy:'déjà un clutch actif', inbox_full:'boîte pleine', forbidden:'pas admin' }
  // ── helpers UI ──
  const Btn=(k:string,label:string,fn:()=>void)=>(<button onClick={fn} disabled={!!busy} style={{width:'100%',padding:'10px',marginBottom:6,borderRadius:9,border:`1px solid ${C.border}`,background:busy===k?C.orange:C.bgCard,color:C.white,fontSize:12,fontWeight:700,cursor:busy?'default':'pointer',fontFamily:'inherit',opacity:busy&&busy!==k?.45:1}}>{busy===k?'…':label}</button>)
  const Lbl=(t:string)=>(<div style={{fontSize:9.5,fontWeight:700,letterSpacing:'.04em',color:C.whiteMid,margin:'8px 0 3px'}}>{t}</div>)
  const ActorSel=(v:string,on:(s:string)=>void)=>(<select value={v} onChange={e=>on(e.target.value)} style={cockSel}>{bots.map(b=><option key={b.id} value={b.id}>{(b.is_bot?'🤖 ':'👤 ')+b.name}</option>)}</select>)
  const PlaceSel=(v:number,on:(n:number)=>void)=>(<select value={v} onChange={e=>on(+e.target.value)} style={cockSel}>{COCK_PLACES.map((p,i)=><option key={p.n} value={i}>📍 {p.n}</option>)}</select>)
  const HourSel=(v:number,on:(n:number)=>void)=>(<select value={v} onChange={e=>on(+e.target.value)} style={{...cockSel,width:'auto',flex:1}}>{Array.from({length:24},(_,h)=><option key={h} value={h}>{String(h).padStart(2,'0')}h</option>)}</select>)
  if(!open) return (
    <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={()=>{ const m=dragRef.current?.moved; onUp(); if(!m) setOpen(true) }}
      style={{position:'fixed',left:pos.x,top:pos.y,zIndex:6000,width:44,height:44,borderRadius:22,background:C.bgCard,border:`1.5px solid ${C.orange}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,cursor:'grab',boxShadow:'0 6px 20px rgba(0,0,0,.45)',touchAction:'none'}}>🎮</div>
  )
  const TABS:[CockTab,string][] = [['world','👥'],['express','⚡'],['acteur','🎭'],['clutch','☕'],['event','🎟️'],['diag','🩺']]
  return (
    <div style={{position:'fixed',left:pos.x,top:pos.y,zIndex:6000,width:300,background:C.bg,border:`1.5px solid ${C.orange}`,borderRadius:14,boxShadow:'0 12px 34px rgba(0,0,0,.5)',touchAction:'none',overflow:'hidden'}}>
      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',background:C.bgCard,cursor:'grab',borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:14}}>🎮</span>
        <span style={{fontSize:12.5,fontWeight:800,color:C.white,flex:1}}>Cockpit QA <span style={{fontSize:9,color:C.whiteMid}}>· glisse-moi</span></span>
        <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',color:C.whiteMid,fontSize:18,cursor:'pointer',lineHeight:1,fontFamily:'inherit'}}>×</button>
      </div>
      <div style={{display:'flex'}}>
        {TABS.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:'9px 0',background:tab===k?C.bg:C.bgCard,border:'none',borderBottom:tab===k?`2px solid ${C.orange}`:`2px solid ${C.border}`,fontSize:16,cursor:'pointer',fontFamily:'inherit',opacity:tab===k?1:.55}}>{l}</button>
        ))}
      </div>
      <div style={{padding:'12px',maxHeight:'52vh',overflowY:'auto'}}>
        {tab==='world' && (<>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <div style={{fontSize:10,color:C.whiteMid}}>Toutes les personnes · 🟢 = en ligne</div>
            <div style={{display:'flex',gap:6}}>
              <button onClick={loadWorld} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:8,color:C.whiteMid,fontSize:11,padding:'3px 8px',cursor:'pointer',fontFamily:'inherit'}}>↻</button>
              <button onClick={resetBots} disabled={!!busy} style={{background:'none',border:`1px solid ${C.border}`,borderRadius:8,color:C.salmon,fontSize:11,padding:'3px 8px',cursor:'pointer',fontFamily:'inherit'}}>Tout éteindre</button>
            </div>
          </div>
          {bots.filter(b=>b.is_bot).length===0 && <div style={{fontSize:11,color:C.whiteMid,textAlign:'center',padding:'14px 0'}}>Aucun bot — génère-en dans le BotLab.</div>}
          {bots.filter(b=>b.is_bot).map(b=>{ const live=isLive(b); const place=b.center_lat?COCK_PLACES.find(p=>Math.abs(p.lat-b.center_lat)<0.05)?.n:null
            return (
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:10,border:`1px solid ${C.border}`,marginBottom:6,background:C.bgCard}}>
                <span style={{width:9,height:9,borderRadius:'50%',background:live?C.green:C.whiteMid,flexShrink:0,boxShadow:live?`0 0 6px ${C.green}`:'none'}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12.5,fontWeight:700,color:C.white,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{b.name}{evBots.has(b.id)&&' 🎟️'}</div>
                  <div style={{fontSize:9.5,color:C.whiteMid}}>{live?`en ligne${place?' · '+place:''}`:'hors-ligne'}</div>
                </div>
                <button onClick={()=>toggleActor(b)} disabled={!!busy} style={{flexShrink:0,width:50,padding:'6px 0',borderRadius:8,border:`1px solid ${live?C.salmon:C.green}55`,background:busy===('t'+b.id)?C.orange:(live?`${C.salmon}1a`:`${C.green}1a`),color:live?C.salmon:C.green,fontSize:12,fontWeight:800,cursor:busy?'default':'pointer',fontFamily:'inherit'}}>{busy===('t'+b.id)?'…':(live?'🔴':'🟢')}</button>
              </div>
            )})}
        </>)}
        {tab==='express' && (<>
          {Btn('on','📡 Bots en ligne sur moi',botsOnline)}
          {Btn('fill','📥 Remplir ma boîte (5)',fillInbox)}
          {Btn('acc','🤝 Les bots acceptent mes clutchs (→ Verrou)',botsAccept)}
          {Btn('reset','🧹 Reset bots',resetBots)}
        </>)}
        {tab==='acteur' && (<>
          <div style={{fontSize:10,color:C.whiteMid,marginBottom:2}}>Rends un acteur dispo sur une fenêtre précise.</div>
          {Lbl('ACTEUR')}{ActorSel(aId,setAId)}
          {Lbl('FENÊTRE')}
          <div style={{display:'flex',alignItems:'center',gap:6}}>{HourSel(aFrom,setAFrom)}<span style={{color:C.whiteMid,fontSize:12}}>→</span>{HourSel(aTo,setATo)}</div>
          {Lbl('LIEU')}{PlaceSel(aPlace,setAPlace)}
          {Lbl(`RAYON · ${aRad} km`)}<input type="range" min={1} max={50} value={aRad} onChange={e=>setARad(+e.target.value)} style={{width:'100%',accentColor:C.orange}}/>
          <div style={{height:6}}/>
          {Btn('av','✅ Mettre dispo',()=>setActorOnline(true))}
          {Btn('avoff','🔴 Désactiver (elle + ses events)',()=>setActorOnline(false))}
        </>)}
        {tab==='clutch' && (<>
          <div style={{fontSize:10,color:C.whiteMid,marginBottom:6,lineHeight:1.4}}>Chaque cas fabrique la situation PUIS révèle la vraie raison (dry-run, ne crée pas le clutch). Bot testé : <b style={{color:C.white}}>{nameOf(firstBot())}</b>.</div>
          {Btn('c_ok','✅ Cas normal (doit passer)', runCase('c_ok', async()=>{ const b=firstBot(); await cleanPair(b); return {s:userId,r:b} }))}
          {Btn('c_busy','❌ Déjà un clutch en cours', runCase('c_busy', async()=>{ const b=firstBot(); await cleanPair(b); await insClutch(userId,b); return {s:userId,r:b} }))}
          {Btn('c_block','❌ Personne bloquée', runCase('c_block', async()=>{ const b=firstBot(); await cleanPair(b); try{ await supabase.from('blocks').insert({blocker_id:userId,blocked_id:b}) }catch{}; return {s:userId,r:b} }))}
          {Btn('c_cd','❌ Cooldown (après un refus)', runCase('c_cd', async()=>{ const b=firstBot(); await cleanPair(b); const ins=await insClutch(b,userId); const id=(ins as any)?.data?.[0]?.id; const got=await supabase.from('clutches').select('id').eq('sender_id',b).eq('receiver_id',userId).eq('status','pending').order('created_at',{ascending:false}).limit(1); const cid=id||(got.data as any)?.[0]?.id; if(cid) await supabase.from('clutches').update({status:'declined'}).eq('id',cid); return {s:b,r:userId} }))}
          {Btn('c_full','❌ Boîte pleine (plafond)', runCase('c_full', async()=>{ const b=firstBot(), b2=secondBot(); await supabase.from('profiles').update({max_received_clutchs:1}).eq('id',b); await supabase.from('clutches').update({status:'cancelled'}).eq('sender_id',b2).eq('receiver_id',b).in('status',ACT); await insClutch(b2,b); return {s:userId,r:b} }))}
          {cRes && (cRes.startsWith('__err__')
            ? <div style={{marginTop:8,padding:'10px',borderRadius:9,background:C.bgCard,border:`1px solid ${C.orange}55`,fontSize:11,color:C.salmon}}>⚠️ {cRes.slice(7)}</div>
            : <div style={{marginTop:8,padding:'10px',borderRadius:9,background:C.bgCard,border:`1px solid ${C.border}`}}>
                <div style={{fontSize:10,color:C.whiteMid}}>Raison réelle (admin) :</div>
                <div style={{fontSize:13,fontWeight:800,color:cRes==='ok'?C.green:C.orange,marginBottom:6}}>{REASON[cRes]||cRes}</div>
                {['blocked','cooldown','inbox_full','pair_busy'].includes(cRes) && (<><div style={{fontSize:10,color:C.whiteMid}}>Vu par l'expéditeur :</div><div style={{fontSize:12,color:C.salmon}}>« Cette proposition n'est pas disponible. » <span style={{color:C.green,fontWeight:700}}>✓ anti-sonde OK</span></div></>)}
              </div>)}
          <div style={{height:4}}/>
          {Btn('c_reset','🧹 Reset paire',resetPair)}
        </>)}
        {tab==='event' && (<>
          <div style={{fontSize:10,color:C.whiteMid,marginBottom:6,lineHeight:1.4}}>TOUS les cas d'event en 1 clic. Chacun fabrique la situation (heure/dispo gérées toutes seules) → va dans Événements, tente l'inscription, compare à l'ATTENDU.</div>
          {Btn('e1','✅ Spontané DANS ma dispo', evCase('e1', async()=>{ await mkDispo(0,360,0); await mkEvent({offsetMin:120,placeIdx:0,title:'Spontané · dans dispo'}) }, 'inscriptible'))}
          {Btn('e2','❌ Spontané HORS dispo (horaire)', evCase('e2', async()=>{ await mkDispo(0,60,0); await mkEvent({offsetMin:180,placeIdx:0,title:'Spontané · hors dispo'}) }, 'bloqué : hors de ta dispo'))}
          {Btn('e3','❌ Spontané trop loin (>18h)', evCase('e3', async()=>{ await mkDispo(0,360,0); await mkEvent({offsetMin:20*60,placeIdx:0,title:'Spontané · +20h'}) }, 'bloqué : trop loin'))}
          {Btn('e4','✅ Planifié (partenaire) dans 3j', evCase('e4', async()=>{ await mkEvent({offsetMin:3*24*60,planned:true,title:'Planifié · +3j'}) }, 'inscriptible (libre de dispo)'))}
          {Btn('e5','❌ Planifié trop loin (>7j)', evCase('e5', async()=>{ await mkEvent({offsetMin:8*24*60,planned:true,title:'Planifié · +8j'}) }, 'bloqué : trop loin'))}
          {Btn('e6','⛔ Event COMPLET (liste d\'attente)', evCase('e6', async()=>{ await mkDispo(0,360,0); await mkEvent({offsetMin:120,full:true,title:'Complet'}) }, 'complet / liste d\'attente'))}
          <div style={{height:4}}/>
          {Btn('clrev','🧹 Masquer les events de test',clearTestEvents)}
        </>)}
        {tab==='diag' && (<>
          <div style={{fontSize:10,color:C.whiteMid,marginBottom:6,lineHeight:1.4}}>Simule un envoi A→B (ne crée rien) et révèle la VRAIE raison vs le message anti-sonde.</div>
          {Lbl('DE')}{ActorSel(fromId,setFromId)}
          <div style={{textAlign:'center',color:C.whiteMid,fontSize:11,margin:'2px 0'}}>↓ envoie à ↓</div>
          {Lbl('VERS')}{ActorSel(toId,setToId)}
          {Btn('diag','🩺 Tester l\'envoi',runDiag)}
          {diag==='__nomig__' && <div style={{marginTop:8,padding:'10px',borderRadius:9,background:C.bgCard,border:`1px solid ${C.orange}55`,fontSize:11,color:C.salmon}}>⚠️ Migration <code>qa_test_clutch</code> pas posée.</div>}
          {diag && diag!=='__nomig__' && (<div style={{marginTop:8,padding:'10px',borderRadius:9,background:C.bgCard,border:`1px solid ${C.border}`}}>
            <div style={{fontSize:10,color:C.whiteMid}}>Raison réelle (admin) :</div>
            <div style={{fontSize:13,fontWeight:800,color:diag==='ok'?C.green:C.orange,marginBottom:6}}>{REASON[diag]||diag}</div>
            {['blocked','cooldown','inbox_full','pair_busy'].includes(diag) && (<><div style={{fontSize:10,color:C.whiteMid}}>Vu par l'expéditeur :</div><div style={{fontSize:12,color:C.salmon}}>« Cette proposition n'est pas disponible. » <span style={{color:C.green,fontWeight:700}}>✓ anti-sonde OK</span></div></>)}
          </div>)}
        </>)}
      </div>
    </div>
  )
}

// ── CONTACT CLUTCH MODAL — RDV sans filtre dispo/geo, jusqu'à 14j ──
function ContactClutchModal({ from, to, onClose, onSent, showToast }: {
  from: Profile; to: any; onClose: ()=>void; onSent: ()=>void; showToast: (m:string,c:string)=>void
}) {
  const C2 = C
  const [venueInput, setVenueInput] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(0)
  const [selectedHour, setSelectedHour] = useState(19)
  const [selectedMin, setSelectedMin] = useState(0)

  const days = Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d})
  const hours = Array.from({length:24},(_,i)=>i)
  const mins = [0,15,30,45]

  const handleSend = async () => {
    if (!venueInput.trim()) { showToast('Indique un lieu', C2.orange); return }
    setLoading(true)
    const pt = new Date(days[selectedDate])
    pt.setHours(selectedHour, selectedMin, 0, 0)
    const {error} = await supabase.from('clutches').insert({
      sender_id: from.id, receiver_id: to.id,
      venue: venueInput.trim(),
      message: msg || `On se revoit ? ${venueInput.trim()} — ${pt.toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'})} à ${selectedHour}h${selectedMin>0?selectedMin:''}`,
      proposed_time: pt.toISOString(),
      expires_at: new Date(Date.now()+48*3600*1000).toISOString(),
      status: 'pending',
      is_contact_rdv: true,
    })
    setLoading(false)
    if (error) { showToast('Erreur: '+error.message, C2.red); return }
    showToast('✦ Proposition envoyée !', C2.gold)
    onSent()
  }

  return (
    <div style={{position:'fixed',inset:0,zIndex:3000,display:'flex',flexDirection:'column',justifyContent:'flex-end'}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.65)',backdropFilter:'blur(5px)'}} onClick={onClose}/>
      <div style={{position:'relative',background:C2.bgSheet,borderRadius:'20px 20px 0 0',padding:'20px 20px 40px',maxHeight:'88vh',overflowY:'auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:C2.white}}>✦ Proposer un RDV</div>
            <div style={{fontSize:11,color:C2.gold,marginTop:2}}>Contact · sans contrainte horaire</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C2.whiteMid,fontSize:20,cursor:'pointer'}}>✕</button>
        </div>

        <div style={{display:'flex',gap:10,alignItems:'center',background:C2.bgCard,borderRadius:12,padding:'10px 12px',marginBottom:16,border:`1px solid ${C2.border}`}}>
          <Av src={to.photo_url} name={to.name||'?'} size={38}/>
          <div style={{fontSize:14,fontWeight:800,color:C2.white}}>{to.name}</div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C2.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Lieu</div>
          <input value={venueInput} onChange={e=>setVenueInput(e.target.value)} placeholder="Café, restaurant, bar…"
            style={{width:'100%',background:C2.whiteFaint,border:`1.5px solid ${C2.borderStrong}`,borderRadius:12,padding:'10px 14px',fontSize:13,color:C2.white,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C2.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Date</div>
          <div style={{display:'flex',gap:6,overflowX:'auto',paddingBottom:4,WebkitOverflowScrolling:'touch' as any}}>
            {days.map((d,i)=>(
              <button key={i} onClick={()=>setSelectedDate(i)}
                style={{flexShrink:0,padding:'8px 12px',borderRadius:10,border:`1.5px solid ${selectedDate===i?C2.gold:C2.border}`,background:selectedDate===i?`${C2.gold}22`:C2.whiteFaint,color:selectedDate===i?C2.gold:C2.whiteMid,fontSize:12,fontWeight:selectedDate===i?800:500,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                {i===0?'Auj.':i===1?'Dem.':d.toLocaleDateString('fr-CH',{weekday:'short',day:'numeric'})}
              </button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C2.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Heure</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <select value={selectedHour} onChange={e=>setSelectedHour(Number(e.target.value))}
              style={{flex:1,background:C2.bgCard,border:`1.5px solid ${C2.border}`,borderRadius:10,padding:'10px 12px',fontSize:14,color:C2.white,outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
              {hours.map(h=><option key={h} value={h}>{String(h).padStart(2,'0')}h</option>)}
            </select>
            <span style={{color:C2.whiteMid,fontSize:16}}>:</span>
            <select value={selectedMin} onChange={e=>setSelectedMin(Number(e.target.value))}
              style={{flex:1,background:C2.bgCard,border:`1.5px solid ${C2.border}`,borderRadius:10,padding:'10px 12px',fontSize:14,color:C2.white,outline:'none',fontFamily:'inherit',cursor:'pointer'}}>
              {mins.map(m=><option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
            </select>
          </div>
          <div style={{fontSize:11,color:C2.gold,marginTop:6,fontWeight:700}}>
            → {selectedDate===0?'Aujourd\'hui':selectedDate===1?'Demain':days[selectedDate].toLocaleDateString('fr-CH',{weekday:'long',day:'numeric',month:'long'})} à {String(selectedHour).padStart(2,'0')}h{selectedMin>0?String(selectedMin).padStart(2,'0'):''}
          </div>
        </div>

        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:C2.whiteMid,fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>Message (optionnel)</div>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={2} placeholder="Un petit mot…"
            style={{width:'100%',background:C2.whiteFaint,border:`1.5px solid ${C2.borderStrong}`,borderRadius:12,padding:'10px 14px',fontSize:13,color:C2.white,outline:'none',fontFamily:'inherit',resize:'none',boxSizing:'border-box'}}/>
        </div>

        <button onClick={handleSend} disabled={loading}
          style={{width:'100%',padding:'15px',borderRadius:14,border:'none',background:C2.gold,color:'#fff',fontSize:16,fontWeight:900,cursor:'pointer',fontFamily:'inherit',boxShadow:'0 3px 16px rgba(235,107,175,.4)',opacity:loading?.6:1}}>
          {loading?'Envoi…':'✦ Envoyer la proposition'}
        </button>
      </div>
    </div>
  )
}
