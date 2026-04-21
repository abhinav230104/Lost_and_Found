"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, apiPost } from "@/lib/apiClient";
import { verifyOtpSchema, type VerifyOtpFormData } from "@/lib/validations/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type VerifyOtpResponse = {
  message: string;
  user: { id: string; email: string; name: string };
};

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { email: defaultEmail, otp: "" },
  });

  const onSubmit = async (data: VerifyOtpFormData) => {
    setServerError(null);

    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      await apiPost<VerifyOtpResponse>("/api/auth/verify-otp", {
        email: normalizedEmail,
        otp: data.otp.trim(),
      });
      router.replace(`/login?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Unable to verify OTP right now.");
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-[var(--font-dm-serif)] tracking-tight">Verify OTP</CardTitle>
        <CardDescription>
          Enter the 6-digit OTP sent to your college email.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
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
            <Label htmlFor="otp">OTP</Label>
            <Input
              id="otp"
              placeholder="6-digit OTP"
              inputMode="numeric"
              disabled={isSubmitting}
              {...register("otp")}
            />
            {errors.otp && <p className="text-destructive text-sm">{errors.otp.message}</p>}
          </div>

          {serverError && (
            <p className="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
              {serverError}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Didn&apos;t sign up yet?{" "}
            <Link href="/signup" className="underline hover:text-foreground">
              Create account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="flex bg-muted/20 min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}
