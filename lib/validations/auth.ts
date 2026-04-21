import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .refine((val) => val.endsWith("@nitj.ac.in"), {
      message: "Must be a valid @nitj.ac.in email address",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupFormData = z.infer<typeof signupSchema>;

export const verifyOtpSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  otp: z.string().min(6, "OTP must be at least 6 characters").max(6, "OTP can only be 6 characters"),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
