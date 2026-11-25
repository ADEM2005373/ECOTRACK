/**
 * EcoTrack Mobile – Citizen Report Screen
 * Signaler une anomalie (Expo Router tab: signaler)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, textStyles } from '../../src/theme';
import { useAuthStore } from '../../src/store/authStore';
import { submitReport } from '../../src/services/reportApi';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ImagePicker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ImagePicker = require('expo-image-picker');
} catch {
  /* not installed */
}

type Category = {
  value: string;
  label: string;
  icon: string;
};

const CATEGORIES: Category[] = [
  { value: 'DEPOT_SAUVAGE', label: 'Dépôt sauvage', icon: '🗑️' },
  { value: 'ENCOMBRANTS', label: 'Encombrants', icon: '📦' },
  { value: 'DECHETS_DANGEREUX', label: 'Déchets dangereux', icon: '☢️' },
  { value: 'GRAFFITI', label: 'Graffiti', icon: '🖌️' },
  { value: 'VEGETAUX', label: 'Végétaux', icon: '🌿' },
  { value: 'AUTRE', label: 'Autre', icon: '❓' },
];

export default function SignalerScreen() {
  const router = useRouter();

  // Form state
  const [category, setCategory] = useState<string>(CATEGORIES[0]!.value);
  const [description, setDescription] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);

  // Location state (strictement GPS de l'appareil)
  const [locationText, setLocationText] = useState('En attente de localisation GPS...');
  const [districtName, setDistrictName] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'ready' | 'denied' | 'error'>('loading');

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const authState = useAuthStore();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token: string | null = (authState as any).token ?? (authState as any).accessToken ?? null;
  const userId: string | null = authState.user?.id ?? null;
  const userMunicipality: string | null = authState.user?.municipality ?? null;

  const fetchDeviceGps = useCallback(async () => {
    setGpsStatus('loading');
    setLocationText('Acquisition de votre position GPS exacte...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLatitude(null);
        setLongitude(null);
        setGpsStatus('denied');
        setLocationText('Permission de localisation refusée. Activez le GPS pour signaler.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude: lat, longitude: lon } = loc.coords;
      setLatitude(lat);
      setLongitude(lon);
      setGpsStatus('ready');

      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (place) {
          const parts = [place.street, place.streetNumber, place.district || place.subregion, place.city].filter(Boolean);
          const addr = parts.join(', ');
          setDistrictName(addr || place.city || null);
          setLocationText(addr || `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        } else {
          setLocationText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
        }
      } catch {
        setLocationText(`${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }
    } catch {
      setLatitude(null);
      setLongitude(null);
      setGpsStatus('error');
      setLocationText('GPS indisponible. Vérifiez que la localisation est activée sur votre appareil.');
    }
  }, []);

  useEffect(() => {
    void fetchDeviceGps();
  }, [fetchDeviceGps]);

  const pickPhoto = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('Non disponible', 'La fonctionnalité photo nécessite expo-image-picker.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ('Images' as never),
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  }, []);

  const takePhoto = useCallback(async () => {
    if (!ImagePicker) {
      Alert.alert('Non disponible', 'La fonctionnalité photo nécessite expo-image-picker.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
    }
  }, []);

  const handlePhotoPress = useCallback(() => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une source',
      [
        { text: 'Appareil photo', onPress: takePhoto },
        { text: 'Galerie', onPress: pickPhoto },
        { text: 'Annuler', style: 'cancel' },
      ],
    );
  }, [takePhoto, pickPhoto]);

  const resetForm = useCallback(() => {
    setCategory(CATEGORIES[0]!.value);
    setDescription('');
    setPhotoUri(null);
    setPhotoBase64(null);
    setErrorMsg(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    setErrorMsg(null);

    if (description.trim().length < 20) {
      setErrorMsg('La description doit contenir au moins 20 caractères.');
      return;
    }
    if (latitude === null || longitude === null) {
      setErrorMsg('La localisation GPS exacte de votre appareil est obligatoire pour envoyer un signalement.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport({
        category,
        description: description.trim(),
        latitude,
        longitude,
        photoUri,
        photoBase64,
        reporterId: userId,
        municipality: userMunicipality,
        district: districtName,
        token,
      });

      if (result.kind === 'success') {
        Alert.alert(
          'Signalement enregistré',
          'Votre signalement a été transmis en direct à la mairie.',
          [
            { text: 'Nouveau signalement', onPress: resetForm, style: 'cancel' },
            {
              text: 'Voir mes dossiers',
              onPress: () => {
                resetForm();
                router.push('/(tabs)/mes-signalements');
              },
            },
          ]
        );
      } else {
        setErrorMsg(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  }, [category, description, latitude, longitude, photoUri, photoBase64, userId, userMunicipality, districtName, token, resetForm, router]);

  const selectedCategory = CATEGORIES.find((c) => c.value === category) ?? CATEGORIES[0]!;
  const descTooShort = description.trim().length > 0 && description.trim().length < 20;
  const canSubmit = !submitting && description.trim().length >= 20 && latitude !== null && longitude !== null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Signaler une anomalie</Text>
          <Text style={styles.headerSub}>
            Contribuez à la propreté de Zarzouna en temps réel
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Catégorie *</Text>
          <TouchableOpacity
            style={styles.pickerToggle}
            onPress={() => setCategoryOpen((v) => !v)}
            accessibilityLabel="Sélectionner une catégorie"
          >
            <Text style={styles.pickerText}>
              {selectedCategory.icon} {selectedCategory.label}
            </Text>
            <Text style={styles.pickerChevron}>{categoryOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {categoryOpen && (
            <View style={styles.pickerDropdown}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.pickerOption,
                    cat.value === category && styles.pickerOptionSelected,
                  ]}
                  onPress={() => { setCategory(cat.value); setCategoryOpen(false); }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      cat.value === category && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {cat.icon} {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Description * (min. 20 caractères)</Text>
          <TextInput
            style={[styles.textArea, descTooShort && styles.textAreaError]}
            placeholder="Décrivez le problème (adresse précise, nature des déchets...)..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={[styles.charCount, descTooShort && styles.charCountError]}>
            {description.trim().length} / 1000 caractères
            {descTooShort ? ' (minimum 20)' : ''}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Photo de l'anomalie</Text>
          {photoUri ? (
            <View style={styles.photoPreviewContainer}>
              <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => { setPhotoUri(null); setPhotoBase64(null); }}
                accessibilityLabel="Supprimer la photo"
              >
                <Text style={styles.photoRemoveText}>✕ Supprimer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.photoButton} onPress={handlePhotoPress}>
              <Text style={styles.photoButtonText}>
                Prendre une photo ou choisir depuis la galerie
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.fieldLabel}>Localisation GPS (Obligatoire) *</Text>
            <TouchableOpacity onPress={() => void fetchDeviceGps()}>
              <Text style={styles.fallbackLink}>Actualiser GPS</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.locationBox}>
            <Text style={styles.locationText}>{locationText}</Text>
          </View>
          {latitude !== null && longitude !== null ? (
            <Text style={styles.coordsText}>
              Position exacte : {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </Text>
          ) : (
            gpsStatus !== 'loading' && (
              <TouchableOpacity
                onPress={() => (gpsStatus === 'denied' ? void Linking.openSettings() : void fetchDeviceGps())}
                style={styles.gpsRetryBtn}
              >
                <Text style={styles.gpsRetryText}>
                  {gpsStatus === 'denied' ? 'Autoriser la localisation dans les paramètres' : 'Activer / Réessayer le GPS'}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
          </View>
        )}

        <Pressable
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel={submitting ? 'Envoi en cours...' : 'Envoyer le signalement'}
          accessibilityState={{ disabled: !canSubmit, busy: submitting }}
        >
          {submitting ? (
            <View style={styles.submitRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.submitText}> Envoi en cours...</Text>
            </View>
          ) : (
            <Text style={styles.submitText}>Envoyer le signalement</Text>
          )}
        </Pressable>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.dark.background },
  scroll: { flex: 1 },
  content: { padding: spacing.lg },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerIcon: { fontSize: 40, marginBottom: spacing.sm },
  headerTitle: {
    ...textStyles.heading,
    color: colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSub: {
    ...textStyles.body,
    color: colors.dark.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.dark.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.dark.border,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.primary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.dark.cardHover,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  pickerText: { ...textStyles.body, color: colors.dark.textPrimary, fontSize: 15 },
  pickerChevron: { color: colors.primary, fontSize: 12 },
  pickerDropdown: {
    marginTop: spacing.sm,
    backgroundColor: colors.dark.cardHover,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  pickerOption: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  pickerOptionSelected: { backgroundColor: `${colors.primary}22` },
  pickerOptionText: { ...textStyles.body, color: colors.dark.textPrimary },
  pickerOptionTextSelected: { color: colors.primary },
  textArea: {
    ...textStyles.body,
    color: colors.dark.textPrimary,
    backgroundColor: colors.dark.cardHover,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
    minHeight: 110,
  },
  textAreaError: { borderColor: colors.danger },
  charCount: { ...textStyles.caption, color: colors.dark.textMuted, marginTop: spacing.xs },
  charCountError: { color: colors.danger },
  photoButton: {
    backgroundColor: colors.dark.cardHover,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  photoButtonText: { ...textStyles.body, color: colors.primary, textAlign: 'center' },
  photoPreviewContainer: { alignItems: 'center', gap: spacing.sm },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
  },
  photoRemove: {
    backgroundColor: `${colors.danger}22`,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  photoRemoveText: { ...textStyles.label, color: colors.danger },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fallbackLink: {
    fontSize: 11,
    color: colors.primary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  locationBox: {
    backgroundColor: colors.dark.cardHover,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.dark.borderLight,
  },
  locationText: { ...textStyles.body, color: colors.dark.textPrimary },
  coordsText: { ...textStyles.caption, color: colors.dark.textMuted, marginTop: spacing.xs },
  gpsRetryBtn: {
    marginTop: spacing.sm,
    backgroundColor: `${colors.primary}22`,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  gpsRetryText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  errorBox: {
    backgroundColor: `${colors.danger}18`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: `${colors.danger}44`,
  },
  errorText: { ...textStyles.body, color: colors.danger },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitText: {
    ...textStyles.subtitle,
    color: '#fff',
    fontSize: 16,
  },
  submitRow: { flexDirection: 'row', alignItems: 'center' },
});
