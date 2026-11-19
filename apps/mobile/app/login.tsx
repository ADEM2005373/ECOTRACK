
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const login = useAuthStore((state) => state.login);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setGlobalError(null);
    const result = await login(values);
    
    if (result.kind === 'success') {
      router.replace('/(tabs)');
    } else {
        setGlobalError('Identifiants invalides');
    }
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Connexion</Text>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState: { error } }) => (
            <TextField label="E-mail" value={field.value} onChangeText={field.onChange} error={error?.message} />
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
        <PrimaryButton label="Se connecter" onPress={onSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  heading: { ...textStyles.heading, marginBottom: spacing.lg },
  error: { color: colors.danger, fontSize: 12, marginBottom: spacing.md },
});
