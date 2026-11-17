/**
 * Polices CDCF V2 à charger au démarrage (useFonts dans app/_layout.tsx).
 * Les clés doivent correspondre exactement aux noms de typography.fonts.
 * On importe chaque .ttf directement : l'index des paquets embarquerait
 * toutes les graisses (~5 Mo) dans le bundle.
 */
export const fontAssets = {
  'PlusJakartaSans-Bold': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_700Bold.ttf'),
  'PlusJakartaSans-SemiBold': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_600SemiBold.ttf'),
  'PlusJakartaSans-Medium': require('@expo-google-fonts/plus-jakarta-sans/PlusJakartaSans_500Medium.ttf'),
  'Inter-Regular': require('@expo-google-fonts/inter/Inter_400Regular.ttf'),
  'Inter-Medium': require('@expo-google-fonts/inter/Inter_500Medium.ttf'),
  'Inter-Bold': require('@expo-google-fonts/inter/Inter_700Bold.ttf'),
};
