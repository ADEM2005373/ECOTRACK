/**
 * Textes de l'interface (français), regroupés pour une future traduction.
 */

export const registerStrings = {
  screenTitle: 'Créer un compte',
  heading: 'Rejoignez EcoTrack',
  intro: 'Créez votre compte citoyen pour signaler les anomalies de votre ville.',
  fields: {
    fullName: { label: 'Nom complet', placeholder: 'Karim Ben Salah' },
    email: { label: 'Adresse e-mail', placeholder: 'karim@example.com' },
    password: { label: 'Mot de passe', placeholder: '8 caractères minimum' },
    phoneNumber: {
      label: 'Téléphone',
      placeholder: '20 123 456',
      hint: '8 chiffres, avec ou sans +216',
    },
  },
  showPassword: 'Afficher le mot de passe',
  hidePassword: 'Masquer le mot de passe',
  submit: 'Créer mon compte',
  submitting: 'Création du compte en cours',
  loginLink: 'Déjà un compte ? Se connecter',
  success: 'Compte créé !',
  successDetail: 'Redirection vers la connexion…',
  formHasErrors: 'Veuillez corriger les champs signalés.',
} as const;

export const validationStrings = {
  fullNameRequired: 'Le nom complet est obligatoire.',
  fullNameTooShort: 'Le nom complet doit contenir au moins 2 caractères.',
  fullNameTooLong: 'Le nom complet ne doit pas dépasser 60 caractères.',
  emailRequired: "L'adresse e-mail est obligatoire.",
  emailInvalid: 'Adresse e-mail invalide (exemple : nom@domaine.tn).',
  passwordRequired: 'Le mot de passe est obligatoire.',
  passwordTooShort: 'Le mot de passe doit contenir au moins 8 caractères.',
  phoneRequired: 'Le numéro de téléphone est obligatoire.',
  phoneInvalid: 'Numéro invalide : 8 chiffres, avec ou sans +216.',
} as const;

export const apiErrorStrings = {
  emailAlreadyUsed: 'Cet email est déjà utilisé par un autre citoyen.',
  validation: 'Certaines informations sont invalides. Vérifiez le formulaire.',
  offline: 'Connexion au serveur impossible. Vérifiez votre réseau et réessayez.',
  timeout: 'Le serveur met trop de temps à répondre. Réessayez dans un instant.',
  notConfigured: "L'adresse du serveur n'est pas configurée (EXPO_PUBLIC_API_URL).",
  server: 'Une erreur est survenue côté serveur. Réessayez plus tard.',
} as const;

export const loginStrings = {
  screenTitle: 'Connexion',
  placeholder: "L'écran de connexion arrive avec le ticket dédié.",
} as const;

export const profileStrings = {
  title: 'Profil',
  description: 'Créez votre compte pour suivre vos signalements.',
  createAccount: 'Créer un compte',
} as const;
