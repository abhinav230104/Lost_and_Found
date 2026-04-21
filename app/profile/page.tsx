"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ApiError, apiGet, apiPatch } from "@/lib/apiClient";
import type { User } from "@/lib/types";
import { ErrorState, LoadingState } from "@/components/ui/AsyncState";

type StatsPayload = {
  user: {
    postedItems: number;
    totalClaims: number;
    approvedClaims: number;
    pendingClaims: number;
  };
};

type ProfileUpdateResponse = {
  message: string;
  user: User;
};

export default function ProfilePage() {
  const [me, setMe] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [stats, setStats] = useState<StatsPayload["user"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const [userRes, statsRes] = await Promise.all([
          apiGet<User>("/api/user/me"),
          apiGet<StatsPayload>("/api/stats"),
        ]);
        if (!alive) return;
        setMe(userRes);
        setName(userRes.name);
        setEmail(userRes.email);
        setStats(statsRes.user);
      } catch {
        if (!alive) return;
        setError("Failed to load profile.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      alive = false;
    };
  }, []);

  const hasChanges = useMemo(() => {
    if (!me) return false;
    return name.trim() !== me.name || email.trim().toLowerCase() !== me.email;
  }, [email, me, name]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!me || !hasChanges) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const payload: { name?: string; email?: string } = {};
      if (name.trim() !== me.name) payload.name = name.trim();
      if (email.trim().toLowerCase() !== me.email) payload.email = email.trim().toLowerCase();

      const res = await apiPatch<ProfileUpdateResponse>("/api/user/profile", payload);
      setMe(res.user);
      setName(res.user.name);
      setEmail(res.user.email);
      setSaveSuccess("Profile updated.");
    } catch (err) {
      if (err instanceof ApiError) setSaveError(err.message);
      else setSaveError("Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState label="Loading profile..." />;
  if (error || !me) return <ErrorState message={error || "Could not load profile"} />;

  return (
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_260px]">
      <form onSubmit={handleSubmit} className="surface space-y-3 p-4">
        <div>
          <h1 className="text-[14px] font-medium">Profile</h1>
          <p className="text-[11px] text-muted-foreground">Update your account details.</p>
        </div>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium">Full name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[11px] font-medium">College email</span>
          <input
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>

        <div className="rounded-md border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground" style={{ borderColor: "var(--border)" }}>
          User ID: {me.id}
        </div>

        {saveError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700">{saveError}</p>
        ) : null}
        {saveSuccess ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-[11px] text-green-700">
            {saveSuccess}
          </p>
        ) : null}

        <button disabled={!hasChanges || saving} type="submit" className="btn btn-primary">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <aside className="surface p-4">
        <h2 className="mb-2 text-[12px] font-medium">Your Stats</h2>
        <div className="space-y-2 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Items posted</span>
            <span className="font-medium">{stats?.postedItems ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Claims made</span>
            <span className="font-medium">{stats?.totalClaims ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Approved claims</span>
            <span className="font-medium trend-up">{stats?.approvedClaims ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pending claims</span>
            <span className="font-medium">{stats?.pendingClaims ?? 0}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
