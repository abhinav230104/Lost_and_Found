"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ApiError, apiPost } from "@/lib/apiClient";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type LoginResponse = { message: string };

function getNextPath(rawNext: string | null) {
  if (!rawNext) return "/dashboard";
  return rawNext.startsWith("/") ? rawNext : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => getNextPath(searchParams.get("next")), [searchParams]);
  const defaultEmail = searchParams.get("email") || "";

  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: defaultEmail, password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      await apiPost<LoginResponse>("/api/auth/login", {
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      router.replace(nextPath);
      // Wait for layout/navigation hook to detect changes globally
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError("Unable to login right now.");
      }
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-[var(--font-dm-serif)] tracking-tight">Login</CardTitle>
        <CardDescription>
          Use your registered NITJ account.
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
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
            {isSubmitting ? "Logging in..." : "Login"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="underline hover:text-foreground">
              Create account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex bg-muted/20 min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading...</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
