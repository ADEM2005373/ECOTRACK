import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { FormMessage } from '../../components/FormMessage';
import { PrimaryButton } from '../../components/PrimaryButton';
import { TextField } from '../../components/TextField';
import { apiErrorStrings, registerStrings as t } from '../../constants/strings';
import type { RegisterResult } from '../../services/authApi';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, textStyles, touchTarget } from '../../theme';
import { emptyRegisterForm, registerSchema, type RegisterFormValues } from './registerSchema';

/** Délai d'affichage du message de succès avant la redirection. */
export const SUCCESS_REDIRECT_DELAY_MS = 1500;

function errorMessage(result: Exclude<RegisterResult, { kind: 'success' }>): string {
  switch (result.kind) {
    case 'emailAlreadyUsed':
      return apiErrorStrings.emailAlreadyUsed;
    case 'validationError':
      return result.message ?? apiErrorStrings.validation;
    case 'networkError':
      return apiErrorStrings[result.reason];
    case 'serverError':
      return apiErrorStrings.server;
  }
}

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const register = useAuthStore((state) => state.register);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isSubmitting, isSubmitted, dirtyFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: emptyRegisterForm,
    mode: 'onTouched',
  });

  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    [],
  );

  const onSubmit = handleSubmit(async (values) => {
    setGlobalError(null);
    // Valeurs déjà normalisées par le resolver ; parse() les type en RegisterPayload.
    const result = await register(registerSchema.parse(values));

    if (result.kind === 'success') {
      setSucceeded(true);
      redirectTimer.current = setTimeout(() => router.replace('/login'), SUCCESS_REDIRECT_DELAY_MS);
      return;
    }
    if (result.kind === 'emailAlreadyUsed') {
      setError('email', { message: apiErrorStrings.emailAlreadyUsed });
    }
    setGlobalError(errorMessage(result));
  });
  const submit = () => {
    void onSubmit();
  };

  const busy = isSubmitting || succeeded;
  const hasFieldErrors = isSubmitted && Object.keys(errors).length > 0;
  const isValid = (name: keyof RegisterFormValues) => Boolean(dirtyFields[name]) && !errors[name];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading} accessibilityRole="header">
          {t.heading}
        </Text>
        <Text style={styles.intro}>{t.intro}</Text>

        <Controller
          control={control}
          name="fullName"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t.fields.fullName.label}
              placeholder={t.fields.fullName.placeholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.fullName?.message}
              valid={isValid('fullName')}
              editable={!busy}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => setFocus('email')}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t.fields.email.label}
              placeholder={t.fields.email.placeholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.email?.message}
              valid={isValid('email')}
              editable={!busy}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => setFocus('password')}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t.fields.password.label}
              placeholder={t.fields.password.placeholder}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.password?.message}
              valid={isValid('password')}
              editable={!busy}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => setFocus('phoneNumber')}
              accessory={
                <Pressable
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  style={styles.iconButton}
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? t.hidePassword : t.showPassword}
                >
                  <Ionicons
                    name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
              }
            />
          )}
        />

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field }) => (
            <TextField
              ref={field.ref}
              label={t.fields.phoneNumber.label}
              placeholder={t.fields.phoneNumber.placeholder}
              hint={t.fields.phoneNumber.hint}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={errors.phoneNumber?.message}
              valid={isValid('phoneNumber')}
              editable={!busy}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              returnKeyType="done"
              onSubmitEditing={submit}
            />
          )}
        />

        {succeeded ? (
          <FormMessage variant="success" title={t.success} detail={t.successDetail} />
        ) : globalError ? (
          <FormMessage variant="error" title={globalError} />
        ) : hasFieldErrors ? (
          <FormMessage variant="error" title={t.formHasErrors} />
        ) : null}

        <PrimaryButton
          label={t.submit}
          loadingLabel={t.submitting}
          onPress={submit}
          loading={isSubmitting}
          disabled={succeeded}
        />

        <Pressable
          onPress={() => router.push('/login')}
          style={styles.link}
          accessibilityRole="link"
          disabled={busy}
          accessibilityState={{ disabled: busy }}
        >
          <Text style={styles.linkText}>{t.loginLink}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.xl,
  },
  heading: {
    ...textStyles.heading,
    color: colors.secondary,
  },
  intro: {
    ...textStyles.body,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  iconButton: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  linkText: {
    ...textStyles.body,
    fontFamily: textStyles.label.fontFamily,
    color: colors.secondary,
    textDecorationLine: 'underline',
  },
});
