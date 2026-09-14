import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Please enter a valid email address.");

const registerPasswordSchema = z
  .string()
  .min(1, "Password is required.")
  .min(8, "Password must be at least 8 characters.")
  .regex(/[a-z]/, "Password must include at least one lowercase letter.")
  .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
  .regex(/\d/, "Password must include at least one number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Full name is required.")
      .min(2, "Full name must be at least 2 characters.")
      .max(100, "Full name must be at most 100 characters."),
    email: emailSchema,
    password: registerPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
    phone: z.string().trim().max(20, "Phone must be at most 20 characters."),
  })
  .superRefine((value, context) => {
    if (value.confirmPassword !== value.password) {
      context.addIssue({
        code: "custom",
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      });
    }
  });

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const verifyEmailTokenSchema = z.string().trim().min(1, "Verification token is required.");

export const verificationCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{9}$/, "Verification code must contain exactly 9 digits.");

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export function getZodFieldErrors<TField extends string>(error: z.ZodError) {
  const fieldErrors: Partial<Record<TField, string>> = {};

  for (const issue of error.issues) {
    const fieldName = issue.path[0];

    if (typeof fieldName === "string" && !fieldErrors[fieldName as TField]) {
      fieldErrors[fieldName as TField] = issue.message;
    }
  }

  return fieldErrors;
}

export function validateRequiredEmail(email: string) {
  const result = emailSchema.safeParse(email);

  if (result.success) return null;

  return result.error.issues[0]?.message ?? "Please enter a valid email address.";
}

export function validateLoginPassword(password: string) {
  const result = loginSchema.shape.password.safeParse(password);

  if (result.success) return null;

  return result.error.issues[0]?.message ?? "Password is invalid.";
}

export function validateRegisterPassword(password: string) {
  const result = registerPasswordSchema.safeParse(password);

  if (result.success) return null;

  return result.error.issues[0]?.message ?? "Password is invalid.";
}
