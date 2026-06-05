export default function Legal() {
  return (
    <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 24px 80px', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif', color:'#2C1810', lineHeight:1.7 }}>
      <a href="/app" style={{ display:'inline-block', marginBottom:24, color:'#C4748A', fontWeight:600, textDecoration:'none', fontSize:14 }}>← Retour à l'app</a>

      <h1 style={{ fontSize:28, fontWeight:800, marginBottom:6 }}>Conditions d'utilisation & Politique de confidentialité</h1>
      <p style={{ color:'#A08878', fontSize:13, marginBottom:40 }}>Clutch · Version 1.0 · En vigueur dès juin 2026 · Lausanne, Suisse</p>

      {/* ── CGU ── */}
      <section style={{ marginBottom:48 }}>
        <h2 style={{ fontSize:20, fontWeight:800, borderBottom:'2px solid #EDE8E3', paddingBottom:10, marginBottom:20 }}>Conditions Générales d'Utilisation (CGU)</h2>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>1. Objet</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de l'application Clutch (ci-après "l'App"), éditée par David Saugy, domicilié à Lausanne, Suisse (ci-après "Clutch" ou "nous"). En créant un compte, vous acceptez sans réserve ces CGU.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>2. Conditions d'accès</h3>
        <ul style={{ fontSize:14, color:'#4A2E20', paddingLeft:20 }}>
          <li>Vous devez avoir au minimum <strong>18 ans</strong> pour utiliser l'App.</li>
          <li>Un seul compte par personne est autorisé.</li>
          <li>Vous vous engagez à fournir des informations exactes lors de l'inscription.</li>
          <li>L'utilisation de faux profils, de photos d'une autre personne ou d'informations fictives est interdite.</li>
        </ul>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>3. Règles de comportement</h3>
        <p style={{ fontSize:14, color:'#4A2E20', marginBottom:8 }}>En utilisant Clutch, vous vous engagez à :</p>
        <ul style={{ fontSize:14, color:'#4A2E20', paddingLeft:20 }}>
          <li>Respecter les autres utilisateurs et leur dignité.</li>
          <li>Ne pas envoyer de messages à caractère sexuel non sollicités, harcelants, menaçants ou illégaux.</li>
          <li>Ne pas uploader de photos indécentes, violentes ou à caractère sexuel.</li>
          <li>Ne pas vous présenter à un RDV si vous n'avez pas l'intention d'y aller (respect du score de fiabilité).</li>
          <li>Ne pas utiliser l'App à des fins commerciales sans accord préalable écrit de Clutch.</li>
        </ul>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>4. Tarification</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>L'accès à Clutch est <strong>entièrement gratuit pour les femmes</strong>. Un abonnement Premium à CHF 19.90/mois sera disponible pour les autres utilisateurs souhaitant accéder à des fonctionnalités avancées. Les fonctionnalités de base restent accessibles gratuitement.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>5. Responsabilité</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>Clutch est une plateforme de mise en relation. Nous ne sommes pas responsables des rencontres physiques, comportements ou incidents survenant hors de l'App. Nous recommandons de toujours choisir des lieux publics pour vos premiers RDV et d'utiliser la fonction SOS intégrée si nécessaire. Clutch se réserve le droit de suspendre ou supprimer tout compte ne respectant pas ces CGU.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>6. Modération</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>Clutch se réserve le droit de modérer les contenus (photos, messages, profils) et de supprimer tout contenu inapproprié. Les signalements d'utilisateurs sont traités dans les 24 heures ouvrables. Tout signalement abusif peut entraîner la suspension du compte signalant.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>7. Droit applicable</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>Les présentes CGU sont soumises au droit suisse. Tout litige sera soumis à la compétence exclusive des tribunaux du canton de Vaud.</p>
      </section>

      {/* ── PRIVACY ── */}
      <section style={{ marginBottom:48 }}>
        <h2 style={{ fontSize:20, fontWeight:800, borderBottom:'2px solid #EDE8E3', paddingBottom:10, marginBottom:20 }}>Politique de Confidentialité</h2>
        <p style={{ fontSize:13, color:'#A08878', marginBottom:20 }}>Conforme à la Loi fédérale sur la protection des données (LPD, en vigueur dès septembre 2023) et au Règlement Général sur la Protection des Données (RGPD) de l'UE.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>1. Responsable du traitement</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>David Saugy, Lausanne, Suisse<br/>Contact : <a href="mailto:david.saugy@gmail.com" style={{ color:'#C4748A' }}>david.saugy@gmail.com</a></p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>2. Données collectées</h3>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#F5F0EA' }}><th style={{ padding:'8px 12px', textAlign:'left', fontWeight:700 }}>Donnée</th><th style={{ padding:'8px 12px', textAlign:'left', fontWeight:700 }}>Pourquoi</th><th style={{ padding:'8px 12px', textAlign:'left', fontWeight:700 }}>Obligatoire</th></tr></thead>
          <tbody>
            {[
              ['Adresse email','Authentification et communication','Oui'],
              ['Prénom','Affichage sur le profil','Oui'],
              ['Date de naissance (âge calculé)','Vérification des 18 ans requis','Oui'],
              ['Genre','Personalisation de l\'expérience','Oui'],
              ['Photo de profil','Affichage sur le profil','Non (recommandé)'],
              ['Biographie, centres d\'intérêt','Matching et affichage profil','Non'],
              ['Quartier / ville de disponibilité','Affichage localisation approx.','Non (activé par l\'utilisateur)'],
              ['Position GPS (coordonnées)','Conversion en quartier via Nominatim — non stockée','Non (opt-in uniquement)'],
              ['Messages envoyés','Permettre la communication entre utilisateurs','Créés par l\'utilisateur'],
              ['Historique des clutches','Calcul du score de fiabilité','Automatique'],
            ].map(([d,p,o])=>(
              <tr key={d} style={{ borderBottom:'1px solid #EDE8E3' }}>
                <td style={{ padding:'8px 12px', fontWeight:600, color:'#2C1810' }}>{d}</td>
                <td style={{ padding:'8px 12px', color:'#6B4C3B' }}>{p}</td>
                <td style={{ padding:'8px 12px', color:'#A08878' }}>{o}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>3. Où sont stockées vos données ?</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>Vos données sont stockées sur les serveurs de <strong>Supabase</strong> (Amazon Web Services, région Europe — Frankfurt, Allemagne), dans l'Union Européenne. Supabase est conforme au RGPD et à la LPD suisse.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>4. Durée de conservation</h3>
        <ul style={{ fontSize:14, color:'#4A2E20', paddingLeft:20 }}>
          <li>Compte actif : données conservées jusqu'à suppression du compte.</li>
          <li>Compte inactif depuis plus de <strong>2 ans</strong> : suppression automatique avec notification préalable.</li>
          <li>Données de position GPS : <strong>jamais stockées</strong> sur nos serveurs. Converties en quartier au moment de l'activation.</li>
          <li>Messages : conservés pendant la durée du clutch + 30 jours pour traitement de litiges éventuels.</li>
        </ul>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>5. Partage des données</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>Vos données ne sont <strong>jamais vendues</strong> ni transmises à des tiers à des fins publicitaires. Elles peuvent être partagées uniquement :</p>
        <ul style={{ fontSize:14, color:'#4A2E20', paddingLeft:20 }}>
          <li>Avec les autres utilisateurs (prénom, photo, quartier, passions) pour le fonctionnement de l'App.</li>
          <li>Avec nos sous-traitants techniques (Supabase, Nominatim/OpenStreetMap) dans le cadre strict du service.</li>
          <li>Sur demande d'une autorité judiciaire suisse compétente.</li>
        </ul>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>6. Vos droits</h3>
        <p style={{ fontSize:14, color:'#4A2E20', marginBottom:8 }}>Conformément à la LPD et au RGPD, vous disposez des droits suivants :</p>
        <ul style={{ fontSize:14, color:'#4A2E20', paddingLeft:20 }}>
          <li><strong>Accès</strong> : obtenir une copie de vos données personnelles.</li>
          <li><strong>Rectification</strong> : corriger des informations inexactes.</li>
          <li><strong>Suppression</strong> : demander la suppression de votre compte et de toutes vos données.</li>
          <li><strong>Portabilité</strong> : recevoir vos données dans un format structuré.</li>
          <li><strong>Opposition</strong> : vous opposer à certains traitements.</li>
        </ul>
        <p style={{ fontSize:14, color:'#4A2E20', marginTop:8 }}>Pour exercer ces droits, écrivez à : <a href="mailto:david.saugy@gmail.com" style={{ color:'#C4748A' }}>david.saugy@gmail.com</a>. Réponse garantie sous 30 jours.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>7. Cookies</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>L'App utilise uniquement des cookies techniques nécessaires au fonctionnement (session d'authentification). Aucun cookie publicitaire ou de tracking tiers n'est utilisé.</p>

        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:6, marginTop:24 }}>8. Modifications</h3>
        <p style={{ fontSize:14, color:'#4A2E20' }}>En cas de modification substantielle de cette politique, vous serez notifié·e par email avec un délai de 30 jours avant l'entrée en vigueur des nouvelles conditions.</p>
      </section>

      <div style={{ background:'#F5F0EA', borderRadius:14, padding:'16px 20px', fontSize:13, color:'#6B4C3B', marginBottom:40 }}>
        📮 <strong>Contact :</strong> Pour toute question relative à vos données personnelles ou à ces conditions, contactez-nous à <a href="mailto:david.saugy@gmail.com" style={{ color:'#C4748A', fontWeight:600 }}>david.saugy@gmail.com</a>
      </div>

      <a href="/app" style={{ display:'inline-block', padding:'12px 24px', borderRadius:14, background:'#C4748A', color:'#fff', fontWeight:700, fontSize:14, textDecoration:'none' }}>← Retour à l'app</a>
    </div>
  )
}
