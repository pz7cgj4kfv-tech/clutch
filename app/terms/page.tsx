export default function TermsPage() {
  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',color:'#fafafa',fontFamily:'system-ui,sans-serif',padding:'40px 24px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>

        {/* Header */}
        <div style={{marginBottom:40}}>
          <a href="/" style={{color:'#FFBF9E',fontSize:13,textDecoration:'none'}}>← Accueil</a>
          <h1 style={{fontSize:28,fontWeight:900,marginTop:16,marginBottom:4,color:'#fafafa'}}>
            Conditions d'utilisation
          </h1>
          <p style={{fontSize:13,color:'rgba(250,250,250,0.5)',marginTop:0}}>
            Dernière mise à jour : juin 2026
          </p>
        </div>

        <Section title="1. Acceptation des conditions">
          <p>
            En créant un compte ou en utilisant l'application Clutch, vous acceptez les présentes conditions d'utilisation dans leur intégralité. Si vous n'acceptez pas ces conditions, n'utilisez pas l'application.
          </p>
        </Section>

        <Section title="2. Éligibilité — 18 ans minimum">
          <p>
            <strong style={{color:'#ef4444'}}>Clutch est strictement réservé aux personnes âgées de 18 ans ou plus.</strong> En créant un compte, vous confirmez avoir au moins 18 ans. Tout compte appartenant à un mineur sera supprimé immédiatement sans préavis.
          </p>
        </Section>

        <Section title="3. Utilisation acceptable">
          <p>En utilisant Clutch, vous vous engagez à :</p>
          <ul>
            <li>Fournir des informations exactes lors de votre inscription</li>
            <li>Utiliser votre vrai prénom et une vraie photo</li>
            <li>Respecter les autres utilisateurs, en particulier dans les échanges de Clutch</li>
            <li>Honorer les rendez-vous que vous acceptez (les annulations répétées affectent votre score de fiabilité)</li>
            <li>Ne pas créer plusieurs comptes</li>
          </ul>
        </Section>

        <Section title="4. Contenus interdits">
          <p>Il est strictement interdit de :</p>
          <ul>
            <li>Publier ou transmettre tout contenu illégal (harcèlement, menaces, contenu à caractère pédopornographique, incitation à la haine, etc.)</li>
            <li>Usurper l'identité d'une autre personne</li>
            <li>Utiliser l'application à des fins commerciales non autorisées ou de prospection</li>
            <li>Tenter d'accéder aux données d'autres utilisateurs</li>
            <li>Automatiser l'utilisation de l'application (bots, scripts)</li>
            <li>Contourner les mesures de sécurité de la plateforme</li>
          </ul>
          <p>
            Tout comportement abusif peut entraîner la suspension ou la suppression définitive du compte, sans préavis ni remboursement.
          </p>
        </Section>

        <Section title="5. Score de fiabilité">
          <p>
            Clutch attribue à chaque utilisateur un <strong>score de fiabilité</strong> basé sur le respect des rendez-vous confirmés. Un score bas peut restreindre temporairement ou définitivement l'accès à certaines fonctionnalités. Ce mécanisme vise à protéger la communauté contre les comportements de type "ghosting".
          </p>
        </Section>

        <Section title="6. Abonnement et paiements">
          <ul>
            <li><strong>Gratuit pour les femmes</strong> — fonctionnalités complètes sans paiement</li>
            <li><strong>Gratuit avec limitations pour les hommes</strong> — accès restreint</li>
            <li><strong>Premium (CHF 19.90/mois)</strong> — accès complet pour les hommes</li>
            <li>Les abonnements sont gérés via l'App Store Apple ou Google Play et soumis à leurs politiques de remboursement respectives</li>
            <li>Les paiements sont non remboursables sauf disposition contraire légale</li>
          </ul>
        </Section>

        <Section title="7. Résiliation">
          <p>
            Vous pouvez supprimer votre compte à tout moment depuis l'application : <em>Profil → Supprimer mon compte</em>. La suppression est immédiate et définitive. Aucun remboursement prorata ne sera effectué pour les abonnements en cours, sauf si la loi applicable l'exige.
          </p>
          <p>
            Nous nous réservons le droit de suspendre ou de supprimer tout compte ne respectant pas les présentes conditions.
          </p>
        </Section>

        <Section title="8. Limitation de responsabilité">
          <p>
            Clutch est une plateforme de mise en relation. Nous ne sommes pas responsables des interactions entre utilisateurs, ni des dommages pouvant résulter d'une rencontre organisée via l'application. Les utilisateurs sont responsables de leur propre sécurité lors des rendez-vous.
          </p>
          <p>
            L'application est fournie "telle quelle". Nous ne garantissons pas une disponibilité ininterrompue du service.
          </p>
        </Section>

        <Section title="9. Propriété intellectuelle">
          <p>
            La marque Clutch, son design, son code et ses contenus sont la propriété exclusive de David Saugy. Toute reproduction sans autorisation est interdite.
          </p>
          <p>
            En publiant du contenu sur Clutch (photos, messages), vous accordez à Clutch une licence non exclusive et gratuite d'utilisation dans le seul cadre du fonctionnement de l'application.
          </p>
        </Section>

        <Section title="10. Droit applicable">
          <p>
            Les présentes conditions sont régies par le <strong>droit suisse</strong>. Tout litige relatif à l'utilisation de Clutch sera soumis à la compétence exclusive des <strong>tribunaux de Lausanne, Suisse</strong>.
          </p>
        </Section>

        <Section title="11. Modifications">
          <p>
            Nous pouvons modifier ces conditions à tout moment. En continuant à utiliser Clutch après notification d'une modification, vous acceptez les nouvelles conditions.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            Pour toute question relative aux présentes conditions :<br/>
            <a href="mailto:david.saugy@gmail.com" style={{color:'#FFBF9E'}}>david.saugy@gmail.com</a>
          </p>
        </Section>

        <div style={{marginTop:48,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.1)',fontSize:12,color:'rgba(250,250,250,0.4)',textAlign:'center'}}>
          © 2026 Clutch · David Saugy · Lausanne · <a href="/privacy" style={{color:'#FFBF9E'}}>Politique de confidentialité</a>
        </div>
      </div>
    </div>
  )
}

function Section({title, children}: {title: string; children: React.ReactNode}) {
  return (
    <div style={{marginBottom:32}}>
      <h2 style={{fontSize:16,fontWeight:700,color:'#ef4444',marginBottom:12,marginTop:0}}>{title}</h2>
      <div style={{fontSize:14,lineHeight:1.7,color:'rgba(250,250,250,0.8)'}}>
        {children}
      </div>
    </div>
  )
}
