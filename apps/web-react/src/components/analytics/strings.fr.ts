/** French UI strings of the decision analytics page and its admin login (ECO-42 / SCRUM-53). */
export const ANALYTICS_STRINGS = {
  navLink: 'Analytique / Décisionnel (ECO-42)',
  pageTitle: 'Analytique / Décisionnel',
  pageSubtitle: 'Rapports Power BI officiels de la municipalité',
  homeLink: 'Accueil',
  tabListLabel: 'Rapports décisionnels',
  iframeTitle: (reportLabel: string) => `Rapport Power BI : ${reportLabel}`,
  loading: 'Chargement du rapport…',
  retry: 'Réessayer',
  reconnect: 'Se reconnecter',
  logout: 'Se déconnecter',
  signedInAs: (fullName: string) => `Connecté : ${fullName}`,
  errors: {
    unauthorized: 'Connexion requise : votre session n’est plus valide.',
    forbidden: 'Accès refusé : votre rôle ne permet pas de consulter ce rapport.',
    notConfigured: 'Rapport non configuré : il n’est pas encore publié pour ce portail.',
    unavailable: 'Le service Power BI est momentanément indisponible. Réessayez dans quelques instants.',
    network: 'Impossible de joindre le serveur. Vérifiez votre connexion réseau.',
    invalidPayload: 'Réponse inattendue du serveur.',
    missingConfig: 'Configuration manquante : VITE_API_BASE_URL.'
  },
  login: {
    title: 'Connexion administrateur',
    subtitle: 'Connectez-vous pour consulter les rapports décisionnels.',
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    submit: 'Se connecter',
    submitting: 'Connexion…',
    sessionExpired: 'Votre session a expiré (15 minutes). Veuillez vous reconnecter.',
    sessionInvalid: 'Votre session n’est plus valide. Veuillez vous reconnecter.',
    errors: {
      invalidCredentials: 'Identifiants invalides.',
      validation: 'L’adresse e-mail et le mot de passe sont obligatoires.',
      rateLimited: 'Trop de tentatives. Patientez une minute avant de réessayer.',
      unavailable: 'Le service de connexion est indisponible.',
      network: 'Impossible de joindre le serveur. Vérifiez votre connexion réseau.',
      invalidPayload: 'Réponse inattendue du serveur.'
    }
  }
} as const;
