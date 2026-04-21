import Link from "next/link";

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="surface p-6 text-sm muted">
      <div className="mb-4 space-y-2">
        <div className="h-2 w-24 animate-pulse rounded-full bg-slate-200" />
        <div className="h-2 w-36 animate-pulse rounded-full bg-slate-200" />
      </div>
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="surface border-dashed p-8 text-center">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm muted">{description}</p>
      {ctaHref && ctaLabel ? (
        <div className="mt-4">
          <Link href={ctaHref} className="btn btn-ghost">
            {ctaLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
      <p className="font-medium">{title}</p>
      {message ? <p className="mt-1">{message}</p> : null}
    </div>
  );
}
