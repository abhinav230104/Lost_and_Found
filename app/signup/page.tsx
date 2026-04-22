"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, apiPost } from "@/lib/apiClient";
import { signupSchema, type SignupFormData } from "@/lib/validations/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type SignupResponse = { message: string };

export default function SignupPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      await apiPost<SignupResponse>("/api/auth/signup", {
        name: data.name.trim(),
        email: normalizedEmail,
        password: data.password,
      });
      router.push(`/verify-otp?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Unable to create account right now.");
      }
    }
  };

  return (
    <div className="flex bg-muted/20 min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-[var(--font-dm-serif)] tracking-tight">Create Account</CardTitle>
          <CardDescription>
            We will send an OTP to verify your college email.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Eg. Abhinav"
                disabled={isSubmitting}
                {...register("name")}
              />
              {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">College email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@nitj.ac.in"
                autoComplete="email"
                disabled={isSubmitting}
                {...register("email")}
              />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                {...register("password")}
              />
              {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
            </div>

            {serverError && (
              <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
                {serverError}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:text-foreground">
                Login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
