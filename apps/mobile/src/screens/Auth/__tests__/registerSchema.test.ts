import { validationStrings as msg } from '../../../constants/strings';
import { registerSchema, type RegisterFormValues } from '../registerSchema';

const valid: RegisterFormValues = {
  fullName: 'Karim Ben Salah',
  email: 'karim@example.com',
  password: 'Password123!',
  phoneNumber: '+21620123456',
};

function errorFor(values: Partial<RegisterFormValues>, field: keyof RegisterFormValues) {
  const result = registerSchema.safeParse({ ...valid, ...values });
  if (result.success) return undefined;
  return result.error.flatten().fieldErrors[field]?.[0];
}

describe('registerSchema', () => {
  it('accepts the ticket example payload unchanged', () => {
    expect(registerSchema.parse(valid)).toEqual(valid);
  });

  it('trims the full name and trims + lowercases the email', () => {
    const parsed = registerSchema.parse({ ...valid, fullName: '  Karim  ', email: '  Karim@Example.COM ' });
    expect(parsed.fullName).toBe('Karim');
    expect(parsed.email).toBe('karim@example.com');
  });

  it('does not trim or alter the password', () => {
    expect(registerSchema.parse({ ...valid, password: ' pass word ' }).password).toBe(' pass word ');
  });

  it.each([
    ['20123456', '+21620123456'],
    ['+216 20 123 456', '+21620123456'],
    ['00216 20-123-456', '+21620123456'],
    ['20.12.34.56', '+21620123456'],
  ])('normalizes phone %p to %p', (input, expected) => {
    expect(registerSchema.parse({ ...valid, phoneNumber: input }).phoneNumber).toBe(expected);
  });

  it.each<[keyof RegisterFormValues, string]>([
    ['fullName', msg.fullNameRequired],
    ['email', msg.emailRequired],
    ['password', msg.passwordRequired],
    ['phoneNumber', msg.phoneRequired],
  ])('requires %s', (field, expected) => {
    expect(errorFor({ [field]: '' }, field)).toBe(expected);
  });

  it('treats a whitespace-only name as empty', () => {
    expect(errorFor({ fullName: '   ' }, 'fullName')).toBe(msg.fullNameRequired);
  });

  it('rejects names shorter than 2 or longer than 60 characters', () => {
    expect(errorFor({ fullName: 'K' }, 'fullName')).toBe(msg.fullNameTooShort);
    expect(errorFor({ fullName: 'K'.repeat(61) }, 'fullName')).toBe(msg.fullNameTooLong);
    expect(errorFor({ fullName: 'K'.repeat(60) }, 'fullName')).toBeUndefined();
  });

  it.each(['karim', 'karim@example', 'karim.example.com', 'karim@ example.com'])(
    'rejects invalid email %p',
    (email) => {
      expect(errorFor({ email }, 'email')).toBe(msg.emailInvalid);
    },
  );

  it('rejects passwords shorter than 8 characters and accepts exactly 8', () => {
    expect(errorFor({ password: '1234567' }, 'password')).toBe(msg.passwordTooShort);
    expect(errorFor({ password: '12345678' }, 'password')).toBeUndefined();
  });

  it.each(['2012345', '201234567', '+33612345678', '+216 2012345', 'abcdefgh'])(
    'rejects invalid phone %p',
    (phoneNumber) => {
      expect(errorFor({ phoneNumber }, 'phoneNumber')).toBe(msg.phoneInvalid);
    },
  );
});
