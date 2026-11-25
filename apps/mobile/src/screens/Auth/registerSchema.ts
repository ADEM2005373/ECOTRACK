import { z } from 'zod';
import { validationStrings as msg } from '../../constants/strings';

/** 8 chiffres tunisiens, précédés ou non de +216 / 00216. */
const TUNISIAN_PHONE = /^(?:\+216|00216)?\d{8}$/;

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, msg.fullNameRequired)
    .min(2, msg.fullNameTooShort)
    .max(60, msg.fullNameTooLong),
  email: z.string().trim().toLowerCase().min(1, msg.emailRequired).email(msg.emailInvalid),
  password: z.string().min(1, msg.passwordRequired).min(8, msg.passwordTooShort),
  phoneNumber: z
    .string()
    .trim()
    .min(1, msg.phoneRequired)
    .transform((value) => value.replace(/[\s.-]/g, ''))
    .refine((value) => TUNISIAN_PHONE.test(value), msg.phoneInvalid)
    .transform((value) => `+216${value.slice(-8)}`),
});

/** Valeurs saisies dans le formulaire. */
export type RegisterFormValues = z.input<typeof registerSchema>;

/** Corps envoyé à POST /api/v1/auth/register (champs normalisés). */
export type RegisterPayload = z.output<typeof registerSchema>;

export const emptyRegisterForm: RegisterFormValues = {
  fullName: '',
  email: '',
  password: '',
  phoneNumber: '',
};
