const C = {
  bg: '#FDFAF7', bgDeep: '#F5F0EA', primary: '#C4748A', primaryDark: '#A85C72',
  text: '#2C1810', textMid: '#6B4C3B', textLight: '#A08878', border: '#EDE8E3',
  sage: '#7A9E8A', sageBg: '#D4E8DE',
}

const S = {
  h2: { fontSize: 20, fontWeight: 800, borderBottom: `2px solid ${C.border}`, paddingBottom: 10, marginBottom: 20, marginTop: 0 } as React.CSSProperties,
  h3: { fontSize: 15, fontWeight: 700, marginBottom: 6, marginTop: 28, color: C.text } as React.CSSProperties,
  p:  { fontSize: 14, color: '#4A2E20', lineHeight: 1.75 } as React.CSSProperties,
  li: { fontSize: 14, color: '#4A2E20', lineHeight: 1.75 } as React.CSSProperties,
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} style={{ marginBottom: 56 }}>
      <h2 style={S.h2}>{title}</h2>
      {children}
    </section>
  )
}

import React from 'react'

export default function Legal() {
  return (
    <div style={{ background: C.bgDeep, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: C.text }}>

      {/* Nav */}
      <div style={{ background: C.text, padding: '12px 28px', display: 'flex', gap: 16, alignItems: 'center' }}>
        <a href="/" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>← Accueil</a>
        <span style={{ color: '#555' }}>·</span>
        <a href="/app" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>App</a>
        <span style={{ color: '#555' }}>·</span>
        <a href="/flyer" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>Flyer</a>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 28px 100px' }}>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.primary, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>CLUTCH · Documents légaux & éthiques</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 12 }}>CGU, Confidentialité<br/>& Charte éthique</h1>
          <p style={{ fontSize: 14, color: C.textLight }}>Version 1.0 · En vigueur dès juin 2026 · Lausanne, Suisse · Droit suisse applicable</p>
        </div>

        {/* Sommaire */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textLight, marginBottom: 14 }}>Sommaire</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              ['#cgu', '1. Conditions Générales d\'Utilisation'],
              ['#privacy', '2. Politique de Confidentialité'],
              ['#ethique', '3. Charte Éthique & Engagement Moral'],
              ['#securite', '4. Sécurité & Responsabilité'],
            ].map(([href, label]) => (
              <a key={href} href={href} style={{ fontSize: 14, color: C.primary, textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.border }}>→</span>{label}
              </a>
            ))}
          </div>
        </div>

        {/* ── CGU ── */}
        <Section title="1. Conditions Générales d'Utilisation (CGU)" id="cgu">
          <h3 style={S.h3}>1.1 Objet</h3>
          <p style={S.p}>Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de l'application Clutch (ci-après "l'App"), éditée par David Saugy, domicilié à Lausanne, Suisse (ci-après "Clutch" ou "nous"). En créant un compte, vous acceptez sans réserve ces CGU.</p>

          <h3 style={S.h3}>1.2 Conditions d'accès</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Vous devez avoir au minimum <strong>18 ans</strong> pour utiliser l'App.</li>
            <li style={S.li}>Un seul compte par personne est autorisé.</li>
            <li style={S.li}>Vous vous engagez à fournir des informations exactes lors de l'inscription.</li>
            <li style={S.li}>L'utilisation de faux profils, de photos d'une autre personne ou d'informations fictives est strictement interdite.</li>
          </ul>

          <h3 style={S.h3}>1.3 Règles de comportement</h3>
          <p style={{ ...S.p, marginBottom: 8 }}>En utilisant Clutch, vous vous engagez à :</p>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Respecter les autres utilisateurs et leur dignité en toutes circonstances.</li>
            <li style={S.li}>Ne pas envoyer de messages à caractère sexuel non sollicités, harcelants, menaçants ou illégaux.</li>
            <li style={S.li}>Ne pas uploader de photos indécentes, violentes ou à caractère sexuel explicite.</li>
            <li style={S.li}>Honorer les rendez-vous que vous acceptez, ou prévenir au moins 1 heure à l'avance en cas d'empêchement.</li>
            <li style={S.li}>Ne pas utiliser l'App à des fins commerciales, de démarchage ou de prostitution.</li>
            <li style={S.li}>Ne pas tenter de contourner les mécanismes de sécurité ou de modération de l'App.</li>
          </ul>

          <h3 style={S.h3}>1.4 Tarification</h3>
          <p style={S.p}>L'accès à Clutch est <strong>entièrement gratuit pour les femmes</strong>, sans condition ni limite de durée. Un abonnement Premium à <strong>CHF 19.90/mois</strong> est disponible pour les autres utilisateurs souhaitant accéder aux fonctionnalités avancées (clutches illimités, boost, filtres détaillés). Les fonctionnalités de base — profil, découverte, 3 clutches/jour, bouton SOS — restent accessibles gratuitement pour tous.</p>

          <h3 style={S.h3}>1.5 Responsabilité</h3>
          <p style={S.p}>Clutch est une plateforme de mise en relation. Nous ne sommes pas responsables des rencontres physiques, comportements ou incidents survenant hors de l'App. Nous recommandons de toujours choisir des lieux publics pour vos premiers RDV et d'utiliser la fonction SOS intégrée en cas de besoin. Clutch se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces CGU, sans préavis en cas de comportement grave.</p>

          <h3 style={S.h3}>1.6 Modération</h3>
          <p style={S.p}>Clutch se réserve le droit de modérer les contenus (photos, messages, profils) et de supprimer tout contenu inapproprié. Les signalements sont traités dans les <strong>24 heures ouvrables</strong>. Tout signalement abusif peut entraîner la suspension du compte signalant.</p>

          <h3 style={S.h3}>1.7 Droit applicable</h3>
          <p style={S.p}>Les présentes CGU sont soumises au droit suisse. Tout litige sera soumis à la compétence exclusive des tribunaux du canton de Vaud, Lausanne.</p>
        </Section>

        {/* ── PRIVACY ── */}
        <Section title="2. Politique de Confidentialité" id="privacy">
          <p style={{ ...S.p, color: C.textLight, marginBottom: 24 }}>Conforme à la Loi fédérale sur la protection des données (LPD, en vigueur dès septembre 2023) et au Règlement Général sur la Protection des Données (RGPD) de l'UE.</p>

          <h3 style={S.h3}>2.1 Responsable du traitement</h3>
          <p style={S.p}>David Saugy, Lausanne, Suisse<br />Contact : <a href="mailto:david.saugy@gmail.com" style={{ color: C.primary }}>david.saugy@gmail.com</a></p>

          <h3 style={S.h3}>2.2 Données collectées</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
            <thead>
              <tr style={{ background: C.bgDeep }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Donnée</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Finalité</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Obligatoire</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Adresse email', 'Authentification et communication', 'Oui'],
                ['Prénom', 'Affichage sur le profil', 'Oui'],
                ['Date de naissance', 'Vérification des 18 ans requis', 'Oui'],
                ['Genre', 'Personnalisation de l\'expérience', 'Oui'],
                ['Photo de profil', 'Affichage sur le profil', 'Non (recommandé)'],
                ['Biographie, centres d\'intérêt', 'Matching et affichage profil', 'Non'],
                ['Quartier / ville de disponibilité', 'Affichage localisation approximative', 'Non (opt-in)'],
                ['Position GPS', 'Convertie en quartier — jamais stockée', 'Non (opt-in)'],
                ['Messages envoyés', 'Communication entre utilisateurs', 'Créés par l\'utilisateur'],
                ['Historique des clutches', 'Calcul du score de fiabilité', 'Automatique'],
              ].map(([d, p, o]) => (
                <tr key={d} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={{ padding: '8px 12px', fontWeight: 600 }}>{d}</td>
                  <td style={{ padding: '8px 12px', color: C.textMid }}>{p}</td>
                  <td style={{ padding: '8px 12px', color: C.textLight }}>{o}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={S.h3}>2.3 Hébergement</h3>
          <p style={S.p}>Vos données sont stockées sur les serveurs de <strong>Supabase</strong> (Amazon Web Services, région Europe — Frankfurt, Allemagne), dans l'Union Européenne. Supabase est conforme au RGPD et à la LPD suisse.</p>

          <h3 style={S.h3}>2.4 Durée de conservation</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Compte actif : données conservées jusqu'à suppression du compte.</li>
            <li style={S.li}>Compte inactif depuis plus de <strong>2 ans</strong> : suppression automatique avec notification préalable.</li>
            <li style={S.li}>Position GPS : <strong>jamais stockée</strong> — convertie en quartier au moment de l'activation puis supprimée.</li>
            <li style={S.li}>Messages : conservés pendant la durée du clutch + 30 jours pour traitement de litiges éventuels.</li>
          </ul>

          <h3 style={S.h3}>2.5 Partage des données</h3>
          <p style={S.p}>Vos données ne sont <strong>jamais vendues</strong> ni transmises à des tiers à des fins publicitaires ou commerciales. Elles peuvent être partagées uniquement avec d'autres utilisateurs (prénom, photo, quartier) pour le fonctionnement de l'App, avec nos sous-traitants techniques (Supabase) dans le cadre strict du service, ou sur demande d'une autorité judiciaire suisse compétente.</p>

          <h3 style={S.h3}>2.6 Vos droits (LPD & RGPD)</h3>
          <ul style={{ paddingLeft: 20 }}>
            {[
              ['Accès', 'Obtenir une copie de vos données personnelles.'],
              ['Rectification', 'Corriger des informations inexactes.'],
              ['Suppression', 'Demander la suppression de votre compte et de toutes vos données.'],
              ['Portabilité', 'Recevoir vos données dans un format structuré et lisible.'],
              ['Opposition', 'Vous opposer à certains traitements de vos données.'],
            ].map(([r, d]) => (
              <li key={r} style={S.li}><strong>{r}</strong> : {d}</li>
            ))}
          </ul>
          <p style={{ ...S.p, marginTop: 10 }}>Pour exercer ces droits : <a href="mailto:david.saugy@gmail.com" style={{ color: C.primary }}>david.saugy@gmail.com</a>. Réponse garantie sous <strong>30 jours</strong>.</p>

          <h3 style={S.h3}>2.7 Cookies</h3>
          <p style={S.p}>L'App utilise uniquement des cookies techniques nécessaires au fonctionnement (session d'authentification). Aucun cookie publicitaire, analytique tiers ou de tracking n'est utilisé.</p>
        </Section>

        {/* ── ÉTHIQUE ── */}
        <Section title="3. Charte Éthique & Engagement Moral" id="ethique">

          <div style={{ background: `${C.primary}10`, border: `1px solid ${C.primary}30`, borderRadius: 14, padding: '20px 24px', marginBottom: 32 }}>
            <p style={{ fontSize: 15, color: C.text, lineHeight: 1.75, fontStyle: 'italic' }}>
              "Clutch n'est pas une app de plus. C'est un pari sur l'honnêteté, le respect et la vraie connexion humaine. Ces valeurs ne sont pas des options — elles sont le cœur du produit."
            </p>
            <p style={{ fontSize: 12, color: C.textLight, marginTop: 8 }}>— Sébastien & David, fondateurs</p>
          </div>

          <h3 style={S.h3}>3.1 Notre vision du lien humain</h3>
          <p style={S.p}>Nous croyons que la technologie peut, et doit, servir la connexion humaine réelle — pas la remplacer. Les apps de rencontres classiques ont créé une économie de l'attention qui profite aux plateformes, pas aux utilisateurs. Plus vous swipez, plus ils gagnent. Clutch inverse ce modèle : nous gagnons uniquement si vous vous rencontrez vraiment.</p>
          <p style={{ ...S.p, marginTop: 12 }}>Le rendez-vous physique n'est pas l'aboutissement d'une expérience digitale — c'est le but dès le premier instant. Tout le design de Clutch est construit autour de cette conviction.</p>

          <h3 style={S.h3}>3.2 Le consentement, valeur centrale</h3>
          <p style={S.p}>Chez Clutch, le consentement n'est pas une case à cocher. C'est une architecture. Voici comment il est intégré concrètement :</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li style={S.li}><strong>Pas de messagerie avant le clutch :</strong> on ne peut pas contacter quelqu'un à froid. Un clutch = une proposition concrète. L'autre choisit d'accepter, refuser ou contre-proposer.</li>
            <li style={S.li}><strong>La contre-offre est un droit :</strong> si le lieu ou l'heure ne convient pas, l'autre peut proposer autre chose sans avoir à refuser sèchement.</li>
            <li style={S.li}><strong>Le mode discret est permanent :</strong> à tout moment, vous pouvez disparaître de la découverte sans vous déconnecter. Pas d'obligation de justifier une pause.</li>
            <li style={S.li}><strong>Les filtres appartiennent à l'utilisateur :</strong> vous choisissez qui peut vous clutcher, par genre, âge, score minimum. Ce n'est pas Clutch qui décide à votre place.</li>
          </ul>

          <h3 style={S.h3}>3.3 Pourquoi c'est gratuit pour les femmes</h3>
          <p style={S.p}>Ce n'est pas une stratégie marketing. C'est une prise de position.</p>
          <p style={{ ...S.p, marginTop: 10 }}>Les femmes supportent une charge émotionnelle et sécuritaire disproportionnée dans les rencontres en ligne : messages non désirés, harcèlement, peur de la rencontre physique, pression sociale. Leur imposer un abonnement payant en plus serait injuste.</p>
          <p style={{ ...S.p, marginTop: 10 }}>En rendant l'app entièrement gratuite pour elles, nous affirmons qu'elles sont les architectes de l'expérience. Elles choisissent, elles décident, elles filtrent. Ce sont elles qui valident la qualité du service — pas des métriques d'engagement.</p>

          <h3 style={S.h3}>3.4 Le score de fiabilité : responsabilisation, pas punition</h3>
          <p style={S.p}>Le score de fiabilité est souvent la première question qu'on nous pose : "N'est-ce pas dangereux de noter les gens ?" Notre réponse est non — si c'est bien fait.</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li style={S.li}><strong>Il mesure les actes, pas les personnes.</strong> Le score reflète si vous êtes venu·e au RDV, pas si vous êtes "bon·ne" ou "mauvais·e".</li>
            <li style={S.li}><strong>Il est symétrique.</strong> Les deux parties se notent mutuellement. Pas de pouvoir asymétrique.</li>
            <li style={S.li}><strong>Il se récupère.</strong> Un mauvais RDV n'est pas une condamnation. Le score évolue dans les deux sens.</li>
            <li style={S.li}><strong>Il est transparent.</strong> Vous voyez votre score et comprenez comment il évolue.</li>
            <li style={S.li}><strong>Il n'est pas le seul critère.</strong> Clutch ne trie pas les profils uniquement par score. Les passions, la disponibilité et la proximité comptent autant.</li>
          </ul>

          <h3 style={S.h3}>3.5 La sécurité des femmes, une priorité non négociable</h3>
          <p style={S.p}>Chaque fonctionnalité de sécurité de Clutch a été conçue en pensant d'abord aux femmes, sans pour autant les traiter comme des victimes potentielles. L'objectif est de leur donner les outils pour agir, pas la peur de ne pas pouvoir se défendre.</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li style={S.li}>Le bouton SOS est visible dès l'écran de RDV, pas caché dans un menu.</li>
            <li style={S.li}>La position n'est jamais partagée avec précision — seulement le quartier.</li>
            <li style={S.li}>Le signalement est en 2 taps, avec 6 catégories claires.</li>
            <li style={S.li}>Un profil signalé plusieurs fois est automatiquement mis en attente de revue.</li>
            <li style={S.li}>Nous encourageons explicitement les RDV dans des lieux publics partenaires pour les premières rencontres.</li>
          </ul>

          <h3 style={S.h3}>3.6 Notre engagement contre les dark patterns</h3>
          <p style={S.p}>Les "dark patterns" sont des mécanismes de design conçus pour manipuler les utilisateurs contre leurs propres intérêts. Clutch s'engage explicitement à ne jamais en utiliser :</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            {[
              'Pas de notifications artificielles pour créer de la FOMO ("Quelqu\'un a regardé ton profil il y a 2 minutes...").',
              'Pas de systèmes de gamification addictifs (streaks, récompenses quotidiennes, etc.).',
              'Pas de limitation artificielle pour pousser vers l\'abonnement Premium.',
              'Pas d\'email de relance agressif si vous n\'utilisez pas l\'app.',
              'Pas de suppression de compte difficile — un bouton, une confirmation, c\'est fait.',
              'Pas d\'algorithme opaque qui favorise certains profils sans que vous le sachiez.',
            ].map(t => <li key={t} style={S.li}>{t}</li>)}
          </ul>

          <h3 style={S.h3}>3.7 Notre rapport à l'addiction</h3>
          <p style={S.p}>Nous savons que les apps de rencontres peuvent créer des comportements compulsifs. Le swipe infini est addictif par design. Clutch choisit une approche radicalement différente :</p>
          <ul style={{ paddingLeft: 20, marginTop: 10 }}>
            <li style={S.li}><strong>3 clutches maximum par jour</strong> en version gratuite — pas pour frustrer, mais pour que chaque proposition soit intentionnelle.</li>
            <li style={S.li}><strong>Pas de "découverte infinie"</strong> — quand il n'y a plus de profils disponibles, on vous le dit clairement plutôt que de vous montrer des profils indisponibles pour remplir l'écran.</li>
            <li style={S.li}><strong>L'expiration des clutches</strong> n'est pas un mécanisme d'urgence artificielle — c'est le respect du temps de chacun.</li>
          </ul>

          <h3 style={S.h3}>3.8 Inclusivité & non-discrimination</h3>
          <p style={S.p}>Clutch accueille toutes les orientations sexuelles, identités de genre, origines et situations. Aucun algorithme de Clutch ne pénalise ou favorise un profil sur base de l'origine ethnique, de la religion ou du statut socio-économique. Tout comportement discriminatoire — dans les messages, les profils ou les signalements abusifs — entraîne une suspension immédiate.</p>

          <h3 style={S.h3}>3.9 Transparence algorithmique</h3>
          <p style={S.p}>Vous avez le droit de savoir comment l'app fonctionne. L'ordre d'affichage des profils dans Discover est basé sur : disponibilité (actif maintenant en premier), score de compatibilité (intérêts communs), proximité géographique, et score de fiabilité. Aucun critère caché, aucun profil "boosté" sans que vous le sachiez. Les comptes Premium peuvent activer un boost de visibilité — c'est clairement indiqué sur leur profil.</p>
        </Section>

        {/* ── SÉCURITÉ ── */}
        <Section title="4. Sécurité & Responsabilité" id="securite">
          <h3 style={S.h3}>4.1 Nos engagements techniques</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Données chiffrées en transit (HTTPS/TLS) et au repos.</li>
            <li style={S.li}>Authentification via Supabase Auth — mots de passe jamais stockés en clair.</li>
            <li style={S.li}>Position GPS convertie en quartier côté client — les coordonnées exactes ne transitent pas par nos serveurs.</li>
            <li style={S.li}>Revue de sécurité régulière de la base de données et des accès.</li>
          </ul>

          <h3 style={S.h3}>4.2 En cas d'incident</h3>
          <p style={S.p}>En cas de violation de données personnelles, vous serez notifié·e dans les <strong>72 heures</strong> suivant la découverte de l'incident, conformément au RGPD et à la LPD suisse. Nous communiquerons sur la nature de l'incident, les données concernées et les mesures prises.</p>

          <h3 style={S.h3}>4.3 Conseils de sécurité pour vos RDV</h3>
          <ul style={{ paddingLeft: 20 }}>
            <li style={S.li}>Choisissez toujours un lieu public pour un premier rendez-vous.</li>
            <li style={S.li}>Informez un proche de l'heure et du lieu de votre RDV.</li>
            <li style={S.li}>Utilisez le bouton SOS intégré si vous vous sentez en danger.</li>
            <li style={S.li}>Ne partagez pas votre adresse personnelle ou votre lieu de travail lors d'un premier RDV.</li>
            <li style={S.li}>Faites confiance à votre instinct — vous pouvez annuler un RDV à tout moment.</li>
          </ul>

          <h3 style={S.h3}>4.4 Limites de responsabilité</h3>
          <p style={S.p}>Clutch est une plateforme de mise en relation entre adultes consentants. Nous mettons tout en œuvre pour garantir la sécurité de l'expérience en ligne, mais nous ne pouvons pas être tenus responsables des comportements des utilisateurs hors de la plateforme. En cas de comportement illégal, nous coopérerons pleinement avec les autorités compétentes.</p>
        </Section>

        {/* Contact */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.textLight, marginBottom: 10 }}>Contact & Questions</div>
          <p style={S.p}>Pour toute question relative à vos données, à ces conditions ou à notre charte éthique :</p>
          <a href="mailto:david.saugy@gmail.com" style={{ display: 'inline-block', marginTop: 12, color: C.primary, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>david.saugy@gmail.com</a>
          <p style={{ fontSize: 12, color: C.textLight, marginTop: 6 }}>Réponse garantie sous 30 jours · Lausanne, Suisse 🇨🇭</p>
        </div>

        <a href="/" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 14, background: C.primary, color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>← Retour à l'accueil</a>

      </div>
    </div>
  )
}
