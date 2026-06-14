export default function PrivacyPage() {
  return (
    <div style={{minHeight:'100vh',background:'#0a0a0a',color:'#fafafa',fontFamily:'system-ui,sans-serif',padding:'40px 24px'}}>
      <div style={{maxWidth:680,margin:'0 auto'}}>

        {/* Header */}
        <div style={{marginBottom:40}}>
          <a href="/" style={{color:'#FFBF9E',fontSize:13,textDecoration:'none'}}>← Accueil</a>
          <h1 style={{fontSize:28,fontWeight:900,marginTop:16,marginBottom:4,color:'#fafafa'}}>
            Politique de confidentialité
          </h1>
          <p style={{fontSize:13,color:'rgba(250,250,250,0.5)',marginTop:0}}>
            Dernière mise à jour : juin 2026
          </p>
        </div>

        <Section title="1. Responsable du traitement">
          <p>
            <strong style={{color:'#fafafa'}}>Clutch</strong><br/>
            David Saugy<br/>
            Lausanne, Suisse<br/>
            Contact : <a href="mailto:david.saugy@gmail.com" style={{color:'#FFBF9E'}}>david.saugy@gmail.com</a>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement de l'application :</p>
          <ul>
            <li><strong>Données d'identification :</strong> adresse e-mail, prénom</li>
            <li><strong>Données de profil :</strong> genre, date de naissance (l'âge est affiché, pas la date complète), photos de profil</li>
            <li><strong>Données de localisation :</strong> zone de disponibilité choisie par l'utilisateur (arrondissement ou quartier approximatif — pas de position GPS en temps réel)</li>
            <li><strong>Données d'utilisation :</strong> préférences de rencontre, score de fiabilité, historique de rendez-vous</li>
          </ul>
          <p>
            <strong>Nous ne collectons pas</strong> votre position GPS précise en continu. La localisation saisie est une zone géographique choisie volontairement.
          </p>
        </Section>

        <Section title="3. Finalités du traitement">
          <p>Vos données sont utilisées exclusivement pour :</p>
          <ul>
            <li>Permettre la mise en relation entre utilisateurs disponibles dans une même zone</li>
            <li>Proposer et confirmer des rendez-vous spontanés (Clutchs)</li>
            <li>Calculer et afficher un score de fiabilité basé sur le respect des rendez-vous confirmés</li>
            <li>Vous envoyer des notifications liées à vos rendez-vous (si vous avez accepté les notifications)</li>
            <li>Assurer la sécurité et prévenir les abus sur la plateforme</li>
          </ul>
        </Section>

        <Section title="4. Base légale">
          <p>
            Le traitement de vos données est fondé sur l'exécution du contrat (conditions d'utilisation acceptées lors de l'inscription) et, pour certaines données sensibles comme la localisation, sur votre consentement explicite.
          </p>
          <p>
            Conformément à la <strong>Loi fédérale sur la protection des données (LPD)</strong> suisse et au <strong>Règlement général sur la protection des données (RGPD)</strong> européen, vous disposez des droits décrits à l'article 6.
          </p>
        </Section>

        <Section title="5. Partage des données">
          <ul>
            <li><strong>Pas de vente à des tiers.</strong> Vos données personnelles ne sont jamais vendues ou louées.</li>
            <li><strong>Sous-traitants techniques :</strong> Supabase Inc. (hébergement base de données, authentification — serveurs EU), OneSignal (notifications push).</li>
            <li><strong>Obligations légales :</strong> Nous pouvons communiquer des données aux autorités suisses compétentes si la loi l'exige.</li>
          </ul>
        </Section>

        <Section title="6. Vos droits">
          <p>Vous pouvez à tout moment :</p>
          <ul>
            <li><strong>Accéder</strong> à vos données personnelles</li>
            <li><strong>Corriger</strong> des informations inexactes via votre profil</li>
            <li><strong>Supprimer</strong> votre compte et toutes vos données : dans l'app → <em>Profil → Supprimer mon compte</em>. La suppression est définitive et irréversible.</li>
            <li><strong>Retirer votre consentement</strong> à la localisation à tout moment depuis les paramètres de votre appareil</li>
            <li><strong>Portabilité</strong> : demander une copie de vos données en écrivant à <a href="mailto:david.saugy@gmail.com" style={{color:'#FFBF9E'}}>david.saugy@gmail.com</a></li>
          </ul>
          <p>Pour toute demande, contactez-nous à <a href="mailto:david.saugy@gmail.com" style={{color:'#FFBF9E'}}>david.saugy@gmail.com</a>. Délai de réponse : 30 jours maximum.</p>
        </Section>

        <Section title="7. Conservation des données">
          <ul>
            <li>Données de compte : conservées tant que votre compte est actif</li>
            <li>Historique des Clutchs : 90 jours après expiration, puis suppression automatique</li>
            <li>Après suppression du compte : anonymisation immédiate, effacement complet sous 30 jours</li>
          </ul>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Vos données sont stockées sur des serveurs hébergés dans l'Union européenne (Supabase EU). Les connexions sont chiffrées via HTTPS/TLS. L'accès aux données est restreint au personnel technique autorisé.
          </p>
        </Section>

        <Section title="9. Mineurs">
          <p>
            Clutch est réservé aux personnes de 18 ans ou plus. Nous ne collectons pas sciemment de données concernant des mineurs. Si nous apprenons qu'un compte appartient à un mineur, il sera immédiatement supprimé.
          </p>
        </Section>

        <Section title="10. Cookies et technologies de suivi">
          <p>
            L'application utilise uniquement des cookies fonctionnels nécessaires à l'authentification et à la session utilisateur. Aucun cookie publicitaire ou de suivi tiers n'est utilisé.
          </p>
        </Section>

        <Section title="11. Loi applicable">
          <p>
            La présente politique est régie par le droit suisse, en particulier la Loi fédérale sur la protection des données (LPD, RS 235.1) et, pour les utilisateurs résidant dans l'Union européenne, par le RGPD (Règlement UE 2016/679).
          </p>
          <p>
            Tout litige relatif à cette politique sera soumis aux tribunaux compétents de <strong>Lausanne, Suisse</strong>.
          </p>
        </Section>

        <Section title="12. Modifications">
          <p>
            Cette politique peut être mise à jour. En cas de modification substantielle, vous serez informé par notification dans l'application. La version en vigueur est toujours disponible sur cette page.
          </p>
        </Section>

        <div style={{marginTop:48,paddingTop:24,borderTop:'1px solid rgba(255,255,255,0.1)',fontSize:12,color:'rgba(250,250,250,0.4)',textAlign:'center'}}>
          © 2026 Clutch · David Saugy · Lausanne · <a href="/terms" style={{color:'#FFBF9E'}}>Conditions d'utilisation</a>
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
