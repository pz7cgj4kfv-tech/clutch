'use client'

// Identité visuelle v09.06 — Logo option 02
const C = {
  bg: '#0E2035', bgDeep: '#132B45', card: '#1C3A58',
  primary: '#E9B07F', primaryDark: '#C8883A', primaryLight: 'rgba(233,176,127,0.12)',
  text: '#FAFAFA', textMid: 'rgba(250,250,250,0.7)', textLight: 'rgba(250,250,250,0.4)',
  border: 'rgba(250,250,250,0.1)', borderStrong: 'rgba(233,176,127,0.3)',
  sage: '#7AC4A0', gold: '#E9B07F',
}

export default function Flyer() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: ${C.bgDeep}; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: ${C.text}; }
        @media print {
          .no-print { display: none !important; }
          html, body { background: ${C.bgDeep} !important; }
          @page { margin: 1.5cm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        h2 { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.primary}; margin-bottom: 16px; }
        p { line-height: 1.7; }
      `}</style>

      {/* Barre nav */}
      <div className="no-print" style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <a href="/" style={{ color: C.textMid, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>← Accueil</a>
        <span style={{ color: C.border }}>·</span>
        <button onClick={() => window.print()} style={{ background: C.primary, color: C.bgDeep, border: 'none', borderRadius: 8, padding: '7px 20px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
          🖨️ Imprimer / PDF
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── HEADER ── */}
        <div style={{ background: C.bg, borderRadius: 20, padding: '48px 48px 40px', marginBottom: 20, position: 'relative', overflow: 'hidden', border: `1px solid ${C.border}` }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: `radial-gradient(circle, ${C.primary}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, rgba(28,58,88,0.8) 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 80, fontWeight: 900, color: C.text, letterSpacing: '-0.06em', lineHeight: 1 }}>
              CLUT<span style={{ color: C.primary }}>CH</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginTop: 14, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Quelqu'un t'attend.<br/>
              <span style={{ color: C.primary }}>Sois là.</span>
            </div>
            <div style={{ fontSize: 14, color: C.textMid, marginTop: 12, lineHeight: 1.7, maxWidth: 480 }}>
              L'app de rencontres spontanées qui force l'action. Un Clutch = un RDV proposé dans les 2h. Un vrai café, dans les 18h. Conçue pour Lausanne — et la Suisse romande.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 22, flexWrap: 'wrap' }}>
              {['Bêta · Juin 2026', 'Lausanne 🇨🇭', 'Freemium · Gratuit femmes', 'Sécurité incluse 🛡'].map(b => (
                <span key={b} style={{ background: `${C.primary}18`, border: `1px solid ${C.primaryDark}55`, borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: C.primary }}>{b}</span>
              ))}
            </div>
            {/* Slogans choc */}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                '"La présence urbaine à la demande."',
                '"Disponible. Comme toi."',
                '"Pas un match de plus. Un vrai rendez-vous."',
              ].map(s => (
                <div key={s} style={{ fontSize: 13, color: C.textLight, fontStyle: 'italic', paddingLeft: 14, borderLeft: `2px solid ${C.primaryDark}55` }}>{s}</div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PROBLÈME / SOLUTION ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '32px 36px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h2>Le constat</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: C.bgDeep, border: `1px solid ${C.border}`, borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>💀</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textLight, marginBottom: 8 }}>Le problème</div>
              <p style={{ fontSize: 13, color: C.textMid }}>
                Les apps de rencontres sont devenues des <strong style={{ color: C.text }}>cimetières de matchs</strong>. On swipe pendant des heures, on engage des conversations qui durent des jours — et pourtant, on ne se rencontre <em>jamais vraiment</em>.
              </p>
              <p style={{ fontSize: 13, color: C.textMid, marginTop: 10 }}>
                Tinder, Bumble, Hinge : conçus pour maximiser le temps sur l'app, pas pour générer de vraies rencontres. Le match n'est que le début d'un tunnel interminable.
              </p>
            </div>
            <div style={{ background: `${C.primary}12`, border: `1px solid ${C.borderStrong}`, borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.primary, marginBottom: 8 }}>La solution Clutch</div>
              <p style={{ fontSize: 13, color: C.textMid }}>
                Clutch <strong style={{ color: C.text }}>force l'action</strong>. Pas de messagerie infinie, pas de "on verra". Quand tu clutches quelqu'un, tu proposes un lieu, une heure et un message. L'autre a <strong style={{ color: C.text }}>2 heures pour répondre</strong>. Ou ça expire.
              </p>
              <p style={{ fontSize: 13, color: C.primary, marginTop: 12, fontWeight: 700, fontStyle: 'italic' }}>
                "Disponible. Comme toi."
              </p>
            </div>
          </div>
        </div>

        {/* ── VOCABULAIRE ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '32px 36px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h2>Le vocabulaire Clutch</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              ['Clutcher', 'Envoyer une proposition de rendez-vous. "Je t\'ai clutché pour ce soir !" — le verbe qui remplace le banal "swipe".'],
              ['Un clutch', 'La proposition elle-même : un lieu, une heure, un message personnel. Elle expire automatiquement si l\'autre ne répond pas dans les 2h.'],
              ['Score de fiabilité', 'Note de 0 à 100, visible sur chaque profil. Il baisse si tu ne viens pas au rendez-vous, remonte si tu es présent·e. Crée la confiance.'],
              ['Check-in', 'Tu confirmes ton arrivée au café ou au lieu de RDV. Déclenche le feedback mutuel. Prouve que tu es venu·e.'],
              ['Disponible maintenant', 'Mode activé quand tu veux vraiment rencontrer quelqu\'un. Ton profil apparaît en priorité dans les découvertes.'],
              ['Score de compatibilité', 'Calculé à partir de tes intérêts communs avec l\'autre profil et de vos scores de fiabilité respectifs. De 60% à 100%.'],
            ].map(([w, d]) => (
              <div key={w} style={{ background: C.bgDeep, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.primary, marginBottom: 4 }}>{w}</div>
                <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COMMENT ÇA MARCHE ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '32px 36px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h2>Comment ça marche — le flux complet</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                n: '01', icon: '👤', title: 'Tu crées ton profil',
                desc: 'Prénom, photo, âge, ville de disponibilité, quartier et passions. L\'onboarding prend moins de 2 minutes. Tu peux ensuite certifier ton profil avec un selfie pour obtenir le badge de vérification et booster ta visibilité auprès des autres.',
                rule: null,
              },
              {
                n: '02', icon: '🔍', title: 'Tu découvres des profils disponibles',
                desc: 'Seuls les gens qui ont activé leur disponibilité apparaissent dans ta liste — maintenant, ce soir ou demain matin. Tu vois leur score de compatibilité, leurs passions communes, leur quartier et leur score de fiabilité. Aucun fantôme, aucun profil inactif depuis des mois.',
                rule: null,
              },
              {
                n: '03', icon: '⚡', title: 'Tu clutches',
                desc: 'Tu choisis un lieu (café, parc, restaurant, galerie), une heure et tu rédiges un message personnel. Pas un "coucou" automatique — une vraie proposition. Le clutch arrive à l\'autre en temps réel.',
                rule: '⏳ L\'autre a 2 heures pour accepter, refuser ou contre-proposer',
              },
              {
                n: '04', icon: '☕', title: 'Le rendez-vous a lieu',
                desc: 'Un compte à rebours live s\'affiche des deux côtés. Vous vous retrouvez à l\'endroit convenu. En arrivant, tu fais un check-in dans l\'app pour confirmer ta présence — ça protège les deux parties.',
                rule: '📍 Maximum 18 heures après l\'envoi du clutch',
              },
              {
                n: '05', icon: '⭐', title: 'Le feedback mutuel',
                desc: 'Après le RDV, vous vous notez mutuellement de façon anonyme : Super ⭐ / Ok 👍 / Rabbit 🐰 (tu as posé un lapin) / Ghost 👻 (tu as disparu). Ce feedback impacte directement le score de fiabilité de l\'autre — et le tien.',
                rule: null,
              },
            ].map((s) => (
              <div key={s.n} style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ minWidth: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.textLight, letterSpacing: '0.1em', marginBottom: 2 }}>{s.n}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: C.text, marginBottom: 5 }}>{s.title}</div>
                  <p style={{ fontSize: 13, color: C.textMid }}>{s.desc}</p>
                  {s.rule && (
                    <span style={{ display: 'inline-block', marginTop: 8, background: `${C.primary}15`, border: `1px solid ${C.primary}30`, borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: C.primary }}>{s.rule}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FONCTIONNALITÉS ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '32px 36px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h2>Toutes les fonctionnalités</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['🔒', 'Profils certifiés', 'Selfie de vérification comparé à ta photo de profil. Badge visible par tous. Réduit fortement les faux profils et les catfishes.'],
              ['⚡', 'Disponibilité flexible', 'Maintenant, ce soir, demain matin — tu choisis. Et tu choisis où tu veux te retrouver, pas forcément où tu habites.'],
              ['🎯', 'Score de compatibilité', 'Affiché sur chaque profil. Calculé à partir de vos passions communes, de vos âges et de vos scores de fiabilité respectifs.'],
              ['💬', 'Messagerie post-match', 'Le chat n\'est disponible qu\'après un clutch accepté — pas avant. Ça évite les messages non désirés et les conversations interminables.'],
              ['🚨', 'Bouton SOS intégré', 'Partage ta position GPS en temps réel à un proche de confiance + accès direct au 117. Affiché discrètement sur l\'écran pendant le RDV.'],
              ['🚩', 'Signalement & blocage', 'Six catégories de signalement. Chaque rapport est traité en moins de 24h. Profil suspendu immédiatement si comportement grave.'],
              ['🎉', 'Événements Lausanne', 'Concerts, expos, brunches, randos, soirées jeux… Clutch organise ou référence des événements partenaires. Parfait pour briser la glace.'],
              ['📊', 'Score de fiabilité public', 'Visible sur ton profil. Si tu ne viens pas sans prévenir, tu perds des points. Si tu es toujours là, ton score monte. La réputation compte.'],
              ['🤝', 'Partenaires locaux', 'Cafés, restaurants, salles de sport — des lieux partenaires proposent des offres exclusives aux clutcheurs. Réduction sur la première consommation.'],
              ['🛡', 'Filtres de sécurité avancés', 'Tu contrôles qui peut te clutcher : par âge, par genre, par score de fiabilité minimum. Mode discret pour devenir invisible quand tu veux.'],
            ].map(([icon, name, desc]) => (
              <div key={name as string} style={{ background: C.bgDeep, borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 22, minWidth: 26, marginTop: 1 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>{name}</div>
                  <div style={{ fontSize: 11.5, color: C.textMid, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SÉCURITÉ ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '32px 36px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h2>Sécurité & Confiance</h2>
          <p style={{ fontSize: 13, color: C.textMid, marginBottom: 20 }}>
            Clutch a été conçu dès le départ pour que les femmes s'y sentent en sécurité. Chaque fonctionnalité de sécurité est visible, accessible en un geste, et jamais cachée dans un menu.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['📍', 'Position GPS jamais stockée', 'Ta localisation est convertie en quartier au moment de l\'activation ("Lausanne-Flon"), puis supprimée. Tu n\'apparais jamais avec ta rue exacte.'],
              ['🔐', 'Données chiffrées & conformes', 'Hébergées sur Supabase (Amazon Frankfurt, Union Européenne). Conformité RGPD et loi suisse LPD en vigueur depuis septembre 2023.'],
              ['🚨', 'Bouton SOS intégré', 'Partage ta position en temps réel à un proche de confiance + accès direct au 117 (police). Recommandé pour tous les premiers rendez-vous.'],
              ['🤖', 'Modération automatique', 'Liste de mots bannis vérifiée avant chaque message envoyé. Les signalements sont traités en moins de 24 heures ouvrables.'],
              ['⏱', 'Limite de 3 clutches par jour', 'Chaque clutch doit être intentionnel. Cette limite évite le spam et le harcèlement. Les utilisateurs Premium peuvent envoyer plus, mais restent tracés.'],
              ['👁', 'Mode discret', 'Rends-toi invisible quand tu veux. Personne ne peut te clutcher, tu n\'apparais plus dans les découvertes. Idéal si tu veux une pause sans te déconnecter.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: C.bgDeep, borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 20, minWidth: 24 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── MARCHÉ ── */}
        <div style={{ background: C.card, borderRadius: 16, padding: '32px 36px', marginBottom: 16, border: `1px solid ${C.border}` }}>
          <h2>Marché & Opportunité</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              ['500 000', 'personnes 18–35 ans\nen Suisse romande'],
              ['2.7 Mrd $', 'marché mondial\ndating apps 2025'],
              ['0', 'app de spontanéité\nen Suisse romande'],
            ].map(([n, l]) => (
              <div key={n} style={{ background: C.bgDeep, borderRadius: 12, padding: '18px 14px', textAlign: 'center', border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.primary, letterSpacing: '-0.02em' }}>{n}</div>
                <div style={{ fontSize: 11, color: C.textLight, marginTop: 4, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: `${C.primary}12`, border: `1px solid ${C.borderStrong}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.primary, marginBottom: 14 }}>Modèle Freemium</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Tout le monde', 'Profil, découverte des disponibles, clutches quotidiens, bouton SOS', 'Gratuit'],
                ['Premium', 'Browser sans être disponible, clutches illimités, boost visibilité', 'CHF 19.90/mois'],
                ['Femmes', 'Accès complet — gratuité permanente par design éthique', '100% gratuit'],
              ].map(([who, what, price]) => (
                <div key={who} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${C.border}`, gap: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: C.text }}>{who}</span>
                    <span style={{ color: C.textMid }}> — {what}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: price.includes('gratuit') || price === 'Gratuit' ? C.sage : C.primary, whiteSpace: 'nowrap', flexShrink: 0 }}>{price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BETA CTA ── */}
        <div style={{ background: C.bg, borderRadius: 20, padding: '36px 40px', marginBottom: 16, border: `1.5px solid ${C.borderStrong}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${C.primary}18 0%, transparent 70%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 6, letterSpacing: '-0.03em' }}>La ville attend.</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.primary, marginBottom: 16, letterSpacing: '-0.02em' }}>Toi aussi ?</div>
            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, marginBottom: 24, maxWidth: 480 }}>
              Clutch est en bêta fermée à Lausanne. On cherche des gens qui ont envie de sortir, de vraiment rencontrer quelqu'un — et qui veulent nous dire honnêtement ce qui marche.
            </p>
            <div style={{ background: `${C.primary}10`, border: `1px solid ${C.borderStrong}`, borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Ce qu'on te demande</div>
              {[
                'Créer un profil sur la vraie app — 2 minutes chrono',
                'Envoyer au moins 1 clutch à quelqu\'un cette semaine',
                'Nous dire ce qui t\'a bloqué, ce qui t\'a plu, ce qui manque',
                'Partager l\'app à 2–3 amis lausannois qui aiment sortir',
              ].map(item => (
                <div key={item} style={{ fontSize: 13, color: C.textMid, padding: '5px 0', paddingLeft: 18, position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 0, color: C.primary }}>→</span>{item}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <a href="/demo" style={{ background: C.primary, color: C.bgDeep, borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>✦ Essaie la démo</a>
              <a href="/app" style={{ background: 'rgba(255,255,255,0.07)', color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Je suis là →</a>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, padding: '8px 4px' }}>
          <div style={{ fontSize: 12, color: C.textLight }}>Construit à Lausanne 🇨🇭 · Bêta juin 2026</div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: C.textLight }}>
            <span>pz7cgj4kfv-tech.github.io</span>
            <a href="mailto:david.saugy@gmail.com" style={{ color: C.primary, textDecoration: 'none', fontWeight: 600 }}>david.saugy@gmail.com</a>
          </div>
        </div>

      </div>
    </>
  )
}
