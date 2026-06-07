'use client'

const C = {
  bg: '#EDE8E3', bgDeep: '#F5F0EA', card: '#FDFAF7',
  primary: '#C4748A', primaryDark: '#A85C72', primaryLight: 'rgba(196,116,138,0.12)',
  text: '#2C1810', textMid: '#6B4C3B', textLight: '#A08878',
  border: '#E0D8D0', sage: '#7A9E8A', gold: '#C9A96E',
}

export default function Flyer() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${C.bgDeep}; font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: ${C.text}; }
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          @page { margin: 1.5cm; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        h2 { font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: ${C.primary}; margin-bottom: 16px; }
        p { line-height: 1.7; }
      `}</style>

      {/* Barre nav */}
      <div className="no-print" style={{ background: C.text, padding: '12px 24px', display: 'flex', gap: 12, alignItems: 'center' }}>
        <a href="/" style={{ color: C.bgDeep, fontSize: 12, fontWeight: 600, textDecoration: 'none', opacity: 0.7 }}>← Accueil</a>
        <span style={{ color: '#555' }}>·</span>
        <button onClick={() => window.print()} style={{ background: C.primary, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🖨️ Imprimer / PDF
        </button>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── HEADER ── */}
        <div style={{ background: C.text, borderRadius: 20, padding: '48px 48px 40px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${C.primary}33 0%, transparent 70%)` }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${C.gold}22 0%, transparent 70%)` }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', letterSpacing: '-0.05em', lineHeight: 1 }}>
              CLUTCH<span style={{ color: C.primary }}>.</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.primary, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 10 }}>
              Sois spontané·e
            </div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginTop: 10, lineHeight: 1.6, maxWidth: 480 }}>
              L'application de rencontres qui transforme chaque connexion en vrai rendez-vous physique — en 18 heures maximum. Conçue pour Lausanne et la Suisse romande.
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap' }}>
              {['Bêta · Juin 2026', 'Lausanne 🇨🇭', 'Freemium', 'Sécurité incluse 🛡'].map(b => (
                <span key={b} style={{ background: `${C.primary}25`, border: `1px solid ${C.primary}55`, borderRadius: 20, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: C.primary }}>{b}</span>
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
                Les apps de rencontres sont devenues des <strong style={{ color: C.text }}>cimetières de matchs</strong>. On swipe pendant des heures, on engage des conversations qui durent des jours, on partage des photos, des audios, des GIFs — et pourtant, on ne se rencontre <em>jamais vraiment</em>.
              </p>
              <p style={{ fontSize: 13, color: C.textMid, marginTop: 10 }}>
                Tinder, Bumble, Hinge : conçus pour maximiser le temps passé sur l'app, pas pour générer de vraies rencontres. Le match n'est que le début d'un tunnel interminable.
              </p>
            </div>
            <div style={{ background: `${C.primary}0D`, border: `1px solid ${C.primary}33`, borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.primary, marginBottom: 8 }}>La solution Clutch</div>
              <p style={{ fontSize: 13, color: C.textMid }}>
                Clutch <strong style={{ color: C.text }}>force l'action</strong>. Pas de messagerie infinie, pas de "on verra". Quand tu clutches quelqu'un, tu proposes immédiatement un lieu, une heure et un message. L'autre a <strong style={{ color: C.text }}>2 heures pour répondre</strong>. Ou le créneau est libéré.
              </p>
              <p style={{ fontSize: 13, color: C.textMid, marginTop: 10 }}>
                Résultat : des rendez-vous réels dans les 18h. Simple, honnête, local.
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
              <div key={n} style={{ background: C.bgDeep, borderRadius: 12, padding: '18px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: C.primary, letterSpacing: '-0.02em' }}>{n}</div>
                <div style={{ fontSize: 11, color: C.textLight, marginTop: 4, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ background: `${C.primary}0D`, border: `1px solid ${C.primary}25`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.primary, marginBottom: 14 }}>Modèle Freemium</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                ['Tout le monde', 'Profil, découverte des disponibles, 3 clutches/jour, bouton SOS', 'Gratuit'],
                ['Sécurité+', 'Filtres avancés, mode discret, contrôle des clutches reçus, certifications', 'Inclus pour tous'],
                ['Premium', 'Clutches illimités, boost de visibilité, voir qui a vu ton profil, filtres détaillés', 'CHF 19.90/mois'],
                ['Femmes', 'Accès complet Premium sans conditions', '100% gratuit'],
                ['Partenaires événements', 'Commission sur billets et réservations dans les lieux Clutch', 'Commission 10–15%'],
              ].map(([who, what, price]) => (
                <div key={who} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: 13, padding: '8px 0', borderBottom: `1px solid ${C.primary}15`, gap: 12 }}>
                  <div>
                    <span style={{ fontWeight: 700, color: C.text }}>{who}</span>
                    <span style={{ color: C.textMid }}> — {what}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: price === 'Gratuit' || price === 'Inclus pour tous' || price === '100% gratuit' ? C.sage : C.text, whiteSpace: 'nowrap', flexShrink: 0 }}>{price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── BETA CTA ── */}
        <div style={{ background: `linear-gradient(135deg, ${C.text}, #4A2E20)`, borderRadius: 20, padding: '36px 40px', marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 10 }}>On a besoin de toi 🙏</div>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24, maxWidth: 480 }}>
            Clutch est en phase bêta fermée à Lausanne. On cherche des premiers utilisateurs curieux, des gens qui ont envie de sortir de chez eux, de vraiment rencontrer quelqu'un — et qui veulent nous dire honnêtement ce qui marche et ce qui coince.
          </p>
          <div style={{ background: 'rgba(196,116,138,0.15)', border: '1px solid rgba(196,116,138,0.3)', borderRadius: 14, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Ce qu'on te demande</div>
            {[
              'Créer un profil sur la vraie app — 2 minutes chrono',
              'Envoyer au moins 1 clutch à quelqu\'un cette semaine',
              'Nous dire ce qui t\'a bloqué, ce qui t\'a plu, ce qui manque',
              'Partager l\'app à 2–3 amis lausannois qui aiment sortir',
            ].map(item => (
              <div key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', padding: '5px 0', paddingLeft: 18, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: C.primary }}>→</span>{item}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <a href="/demo" style={{ background: C.primary, color: '#fff', borderRadius: 12, padding: '13px 24px', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>🎬 Essaie la démo</a>
            <a href="/app" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '12px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Créer mon profil →</a>
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
