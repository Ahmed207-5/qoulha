import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});
export type LoginInput = z.infer<typeof loginSchema>;

const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
  .regex(/[0-9]/, 'يجب أن تحتوي على رقم');

export const registerSchema = z
  .object({
    email: z.string().email('بريد إلكتروني غير صحيح'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صحيح'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const onboardingSchema = z.object({
  fullName: z.string().trim().min(2, 'الاسم قصير جداً').max(50),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'اسم المستخدم قصير جداً')
    .max(20, 'اسم المستخدم طويل جداً')
    .regex(/^[a-z0-9_]+$/, 'أحرف إنجليزية صغيرة وأرقام و _ فقط'),
  bio: z.string().trim().max(280, 'النبذة طويلة جداً').optional().default(''),
  avatarUrl: z.string().url().optional().nullable(),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;
