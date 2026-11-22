import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField } from '../src/components/TextField';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { useAuthStore } from '../src/store/authStore';
import { colors, spacing, textStyles } from '../src/theme';

const loginSchema = z.object({
  email: z.string().email('E-mail invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const { login, logout } = useAuthStore();
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, formState: { isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    setGlobalError(null);
    const result = await login(values);
    
    if (result.kind === 'success') {
      const userRole = result.user.role;

      // Séparation stricte : Les profils Admin / Agent de Mairie sont réservés à la console Web sur PC
      if (userRole === 'ADMIN_SAAS' || userRole === 'ADMIN_MUNICIPALITE' || userRole === 'AGENT_MAIRIE') {
        await logout();
        Alert.alert(
          'Accès Réservé au Web',
          `Le profil "${result.user.fullName}" (${userRole.replace('_', ' ')}) est un compte bureautique / supervision.\n\nCe rôle dispose de sa console complète sur ordinateur Web (http://localhost:3000).\n\nL'application mobile est exclusivement réservée aux équipes de terrain (Chef Ouvrier) et aux Citoyens.`,
          [{ text: 'Compris' }]
        );
        return;
      }

      // Redirection adaptée selon le rôle mobile
      if (userRole === 'CHEF_OUVRIER' || userRole === 'OUVRIER') {
        router.replace('/(tabs)/roadmap');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      setGlobalError('Identifiants invalides ou service injoignable');
    }
  });

  const handleSelectRole = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Figma Brand Header */}
        <View style={styles.brandHeader}>
          <View style={styles.emblem}>
            <Text style={styles.emblemText}>🌱</Text>
          </View>
          <Text style={styles.brandTitle}>ECOTRACK</Text>
          <Text style={styles.brandSubtitle}>PORTAIL SMART CITY MOBILE</Text>
          <Text style={styles.brandDescription}>
            Application mobile dédiée aux équipes de terrain (Chef Ouvrier) et aux Citoyens
          </Text>
        </View>

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState: { error } }) => (
            <TextField label="Adresse E-mail" value={field.value} onChangeText={field.onChange} error={error?.message} />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState: { error } }) => (
            <TextField label="Mot de passe" value={field.value} onChangeText={field.onChange} error={error?.message} secureTextEntry />
          )}
        />
        {globalError && <Text style={styles.error}>{globalError}</Text>}
        
        <View style={styles.buttonContainer}>
          <PrimaryButton label="Se connecter" onPress={onSubmit} loading={isSubmitting} />
        </View>

        {/* 1-Click Role Presets (Strictement Mobile : Chefs & Citoyens) */}
        <View style={styles.presetsContainer}>
          <Text style={styles.presetsTitle}>Comptes Mobiles Dédiés (1 Clic)</Text>
          
          <View style={styles.presetGrid}>
            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => handleSelectRole('chef.voirie@zarzouna.tn', 'Chef2026!')}
            >
              <Text style={styles.presetRole}>👷 Chef Voirie</Text>
              <Text style={styles.presetDesc}>Mohamed Ali Khemiri</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => handleSelectRole('chef.poidslourd@zarzouna.tn', 'Chef2026!')}
            >
              <Text style={styles.presetRole}>🚛 Chef Poids Lourd</Text>
              <Text style={styles.presetDesc}>Tarek Jouini</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => handleSelectRole('citoyen@zarzouna.tn', 'Citoyen2026!')}
            >
              <Text style={styles.presetRole}>👤 Citoyen Zarzouna</Text>
              <Text style={styles.presetDesc}>Signalements Quartier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetButton}
              onPress={() => handleSelectRole('citoyen@ecotrack.tn', 'Citoyen2026!')}
            >
              <Text style={styles.presetRole}>👤 Citoyen Test</Text>
              <Text style={styles.presetDesc}>Compte Démo Citoyen</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.webNoteBox}>
            <Text style={styles.webNoteText}>
              💻 <Text style={{ fontWeight: 'bold' }}>Rôles Web uniquement :</Text> Les consoles Administrateur SaaS, Directeur Mairie et Agent de Modération s'ouvrent sur navigateur PC (http://localhost:3000).
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Nouveau citoyen ? <Text style={styles.registerBold}>Créer un compte</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: spacing.xl, paddingBottom: 40 },
  brandHeader: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
  emblem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  emblemText: { fontSize: 24 },
  brandTitle: { ...textStyles.heading, fontSize: 24, color: '#0f172a', fontWeight: 'bold' },
  brandSubtitle: { fontSize: 10, letterSpacing: 2, color: '#059669', fontWeight: 'bold', marginTop: 2 },
  brandDescription: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: spacing.xs, paddingHorizontal: spacing.md },
  buttonContainer: { marginTop: spacing.sm },
  error: { color: colors.danger, fontSize: 12, marginBottom: spacing.md, textAlign: 'center' },
  presetsContainer: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 10,
  },
  presetRole: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  presetDesc: { fontSize: 10, color: '#64748b', marginTop: 2 },
  webNoteBox: {
    marginTop: 14,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  webNoteText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    textAlign: 'center',
  },
  registerLink: { marginTop: spacing.xl, alignItems: 'center' },
  registerText: { fontSize: 12, color: '#64748b' },
  registerBold: { color: '#059669', fontWeight: 'bold' },
});
