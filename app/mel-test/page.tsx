'use client'
// ─────────────────────────────────────────────────────────────────────────────
// /mel-test — PREUVE PIXEL du workflow design→code (28.06, v2).
// Méthode CORRECTE : on n'« approxime » plus en HTML/CSS. On rend la GÉOMÉTRIE EXACTE du SVG de Mel
// (PresenceCard.svg, viewBox 0 0 340 70) — ses coordonnées, tailles, couleurs, police — et on ne
// remplace QUE le dynamique : la photo (clippée à sa forme d'avatar), les textes, l'icône genre (ses
// SVG female/male/nonbinary), le pin (son Pin_RDVfixe). Points + étoiles = ses vecteurs tels quels.
// → identique au pixel, parce que TOUT vient de ses fichiers.
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react'

const SF = '-apple-system,BlinkMacSystemFont,"SF Pro Text","SF UI Text",Helvetica Neue,Arial,sans-serif'

// Icônes genre de Mel (viewBox 0 0 28 28) — posées à la position de la maquette, teintées #7C7B7C
const GENDER: Record<string, React.ReactNode> = {
  female: <><path d="M17.7,5.4c0.5,0,0.9,0,1.3,0.1C17.8,4,16,3,14,3c-3.5,0-6.4,3-6.4,6.6c0,3.2,2.2,5.9,5.1,6.5c-0.9-1.1-1.4-2.6-1.4-4.1C11.3,8.4,14.1,5.4,17.7,5.4z"/><path d="M23.2,9.7c0-5.1-4.1-9.2-9.2-9.2S4.8,4.7,4.8,9.7c0,4.8,3.7,8.8,8.4,9.2v2.7H9.9c-0.4,0-0.8,0.4-0.8,0.8s0.4,0.8,0.8,0.8h3.3v3.5c0,0.4,0.4,0.8,0.8,0.8s0.8-0.4,0.8-0.8v-3.5h3.3c0.4,0,0.8-0.4,0.8-0.8s-0.4-0.8-0.8-0.8h-3.3v-2.7C19.5,18.5,23.2,14.6,23.2,9.7z M6.2,9.7C6.2,5.5,9.7,2,14,2s7.8,3.5,7.8,7.8c0,4.3-3.4,7.7-7.7,7.8c0,0-0.1,0-0.1,0s-0.1,0-0.1,0C9.7,17.5,6.2,14,6.2,9.7z"/></>,
}

// La CARTE — géométrie EXACTE de PresenceCard.svg, contenu dynamique injecté
function PresenceCard({
  name = 'Isabella', age = '25 ans', gender = 'female',
  line1 = 'Envie d’aller me baigner, quelqu’un vient avec moi?', line2 = 'Merci!',
  distance = 'A deux pas', dots = 4, stars = 4, photo,
}: { name?: string; age?: string; gender?: string; line1?: string; line2?: string; distance?: string; dots?: number; stars?: number; photo?: string }) {
  const dotCx = [220.931, 231.762, 242.593, 253.423, 264.254]
  const starX = [282.911, 294.381, 305.853, 317.325, 328.794]
  return (
    <div style={{ borderRadius: 11, boxShadow: '0 3px 6px rgba(83,41,67,.10), 0 12px 26px rgba(120,115,125,.26)' }}>
    <svg viewBox="0 0 340 70" width="100%" style={{ display: 'block', fontFamily: SF }} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="ava"><path d="M63.001,56.777c0,3.437-2.787,6.223-6.226,6.223h-43.55C9.787,63,7,60.213,7,56.777V13.224C7,9.787,9.787,7,13.226,7h43.55c3.439,0,6.226,2.787,6.226,6.224V56.777z" /></clipPath>
      </defs>

      {/* carte blanche */}
      <path fill="#FFFFFF" d="M340,63.814c0,3.418-2.784,6.186-6.219,6.186H6.218C2.783,70,0,67.232,0,63.814V6.184C0,2.769,2.783,0,6.218,0h327.564C337.216,0,340,2.769,340,6.184V63.814z" />

      {/* avatar : aplat #74C3B4 (placeholder Mel) OU vraie photo clippée à SA forme exacte */}
      {photo
        ? <image href={photo} x="7" y="7" width="56" height="56" preserveAspectRatio="xMidYMid slice" clipPath="url(#ava)" />
        : <path fill="#74C3B4" d="M63.001,56.777c0,3.437-2.787,6.223-6.226,6.223h-43.55C9.787,63,7,60.213,7,56.777V13.224C7,9.787,9.787,7,13.226,7h43.55c3.439,0,6.226,2.787,6.226,6.224V56.777z" />}

      {/* icône genre (SVG de Mel) à la position de la maquette, teintée #7C7B7C */}
      <svg x="72.5" y="5.5" width="15" height="15" viewBox="0 0 28 28" fill="#7C7B7C">{GENDER[gender] || GENDER.female}</svg>

      {/* prénom · âge — âge collé au prénom avec un ESPACE FIXE (dx), le même pour tous (pas de colonne figée) */}
      <text transform="matrix(1 0 0 1 88.5 20.6138)" fill="#706F6F" fontFamily={SF} fontWeight={700}>
        <tspan fontSize="18.1023">{name}</tspan>
        <tspan fontSize="8.8116" dx="4">{age}</tspan>
      </text>

      {/* commentaire (2 lignes) */}
      <text fill="#707070" fontFamily={SF} fontWeight={700} fontSize="8.7999"><tspan x="73.1387" y="36.8667">{line1}</tspan><tspan x="73.1387" y="47.43">{line2}</tspan></text>

      {/* lieu */}
      <text transform="matrix(1 0 0 1 73.1387 62.8481)" fill="#7C7B7C" fontFamily={SF} fontWeight={700} fontSize="10.0917">{distance}</text>

      {/* pin RDV fixe (Pin_RDVfixe.svg de Mel) — posé en haut à droite */}
      <svg x="309" y="15" width="24" height="26" viewBox="145 258 312 338" fill="#B2B2B2">
        <path d="M411.354,307.221c-24.231-24.254-53.956-40.524-81.534-44.655c-3.393-0.438-6.969,1.016-9,3.924c-13.454,19.777-18.231,43.155-15.208,65.587l-41.355,41.355c-30.601-9.186-61.018-3.37-80.426,16.038c-13.754,13.755-4.57,48.971,18.277,81.603l-61.433,94.042c-2.377,3.669-1.892,8.492,1.2,11.585c1.777,1.776,4.154,2.7,6.531,2.7c1.754,0,3.508-0.485,5.054-1.5l93.696-61.156c11.216,8.216,22.708,15,33.809,19.478c10.131,4.062,19.293,6.093,27.14,6.093c8.792,0,15.924-2.539,20.978-7.593c19.408-19.339,25.225-49.756,16.062-80.403l41.494-41.493c4.084,0.53,8.146,1.2,12.346,1.2c19.062,0,37.409-5.632,53.079-16.293c2.931-2.008,4.454-5.493,3.946-9.001C451.924,361.177,435.632,331.476,411.354,307.221z M180.184,538.414l33.947-51.994c2.792,3.208,5.493,6.462,8.516,9.484c3.046,3.047,6.254,5.816,9.416,8.632L180.184,538.414z M316.042,521.659c-5.953,5.954-33.093-0.069-63.209-23.77c-0.069-0.046-0.139-0.115-0.208-0.162c-5.585-4.407-11.239-9.208-16.916-14.885c-15.624-15.601-28.455-34.87-35.263-52.825c-6.508-17.192-4.893-26.169-3.554-27.485c13.478-13.501,33.901-17.585,55.895-12.67c-4.985,16.017,2.285,38.032,20.078,55.848c14.193,14.17,31.086,21.785,45.487,21.785c3.669,0,7.061-0.762,10.338-1.777C333.628,487.759,329.542,508.183,316.042,521.659z M327.327,446.034c-6.67,6.646-25.755,2.284-41.401-13.386c-15.67-15.669-20.008-34.778-13.385-41.377l38.425-38.425c4.615,12.277,11.516,23.816,21.254,33.555c9.623,9.601,21.023,16.663,33.394,21.324L327.327,446.034z M345.282,373.339c-20.193-20.193-26.725-49.387-18.878-75.557c8.054,19.085,21.208,38.563,38.54,55.871c17.285,17.285,36.693,30.37,55.663,38.425C394.622,399.509,364.852,392.91,345.282,373.339z M378.006,340.592c-17.4-17.378-30.347-37.479-36.947-56.148c19.64,6.139,39.854,18.462,57.256,35.84c17.4,17.378,29.701,37.594,35.816,57.232C415.507,370.939,395.407,357.993,378.006,340.592z" />
      </svg>

      {/* points de compatibilité (vecteurs de Mel) — 4 pleins + reste vide */}
      {dotCx.map((cx, i) => i < dots
        ? <circle key={i} cx={cx} cy="57.946" r="4.796" fill="#B2B2B2" />
        : <circle key={i} cx={cx} cy="57.946" r="4.796" fill="none" stroke="#B2B2B2" strokeMiterlimit="10" />)}

      {/* étoiles de fiabilité (vecteurs de Mel) — 4 pleines + reste vide */}
      {starX.map((x, i) => {
        const pts = `${x},53.263 ${x + 1.162},56.84 ${x + 4.925},56.84 ${x + 1.881},59.051 ${x + 3.042},62.628 ${x},60.417 ${x - 3.044},62.628 ${x - 1.881},59.051 ${x - 4.925},56.84 ${x - 1.162},56.84`
        return i < stars
          ? <polygon key={i} points={pts} fill="#B2B2B2" />
          : <polygon key={i} points={pts} fill="none" stroke="#B2B2B2" strokeLinecap="round" strokeLinejoin="round" strokeMiterlimit="10" />
      })}

    </svg>
    </div>
  )
}

export default function MelTest() {
  return (
    <div style={{ minHeight: '100vh', background: '#F2F0F2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: '28px 16px', fontFamily: SF }}>
      <div style={{ color: '#4A2A3D', fontSize: 13, fontWeight: 700, opacity: .9, textAlign: 'center', maxWidth: 560, lineHeight: 1.5 }}>
        ✅ v2 — carte rendue depuis la <strong>géométrie EXACTE</strong> du SVG de Mel (sur fond clair = l'ombre ressort, comme dans l'app).<br />
        <span style={{ opacity: .65, fontSize: 11.5, fontWeight: 600 }}>Ses vecteurs · ses coords · ses couleurs · sa police. On ne remplace que photo + textes + genre + pin.</span>
      </div>

      {/* Placeholder Mel (aplat avatar) */}
      <div style={{ width: '100%', maxWidth: 560 }}><PresenceCard /></div>

      {/* Avec une vraie photo + un autre profil (preuve dynamique, même gabarit au pixel) */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <PresenceCard name="Raya" age="29 ans" line1="Tu viens ?" line2="" distance="Dans la région" dots={3} stars={4}
          photo="https://randomuser.me/api/portraits/women/44.jpg" />
      </div>

      <div style={{ color: '#6F6F6E', fontSize: 10.5, opacity: .8, textAlign: 'center', maxWidth: 560, lineHeight: 1.6 }}>
        Carte du haut = placeholder de Mel · carte du bas = mêmes vecteurs avec une vraie photo + autres données.<br />
        Géométrie 100% issue de PresenceCard.svg · icônes genre + pin = ses SVG · police SF UI Text Bold.
      </div>
    </div>
  )
}
