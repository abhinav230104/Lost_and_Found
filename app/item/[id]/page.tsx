"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MoveLeft, CheckCircle2, XCircle, User as UserIcon, Calendar, MapPin, Tag } from "lucide-react";
import Link from "next/link";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { Claim, Item, User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type ItemDetailResponse = {
  item: Item;
  isOwner: boolean;
  claimsCount: number;
};

export default function ItemDetailPage() {
  const params = useParams<{ id: string }>();
  const itemId = params.id;

  const [item, setItem] = useState<Item | null>(null);
  const [claims, setClaims] = useState<Array<Claim & { user?: { name: string } }>>([]);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageBroken, setImageBroken] = useState(false);

  const isOwner = useMemo(() => (item && me ? item.userId === me.id : false), [item, me]);

useEffect(() => {
  let alive = true;

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const detail = await apiGet<ItemDetailResponse>(`/api/items/${itemId}`);
      if (!alive) return;

      setItem(detail.item);
      setImageBroken(false);
    } catch (err) {
      if (!alive) return;
      if (err instanceof ApiError) setError(err.message);
      else setError("Failed to load item");
    } finally {
      if (alive) setLoading(false);
    }

    try {
      const user = await apiGet<User>("/api/user/me");
      if (alive) setMe(user);
    } catch {
      if (alive) setMe(null);
    }
  }

  load();

  return () => {
    alive = false;
  };
}, [itemId]);

  useEffect(() => {
    if (!item || !me || !isOwner) return;
    const currentItemId = item.id;
    let alive = true;
    async function loadClaims() {
      try {
        const data = await apiGet<{ claims: Array<Claim & { user: { name: string } }> }>(
          `/api/items/${currentItemId}/claims`
        );
        if (alive) setClaims(data.claims);
      } catch {
        if (alive) setClaims([]);
      }
    }
    loadClaims();
    return () => {
      alive = false;
    };
  }, [item, me, isOwner]);

  const handleClaim = async () => {
    if (!item) return;
    if (!me) {
      toast.error("You must be logged in to claim an item.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiPost("/api/claims", { itemId: item.id, message: message || undefined });
      toast.success("Claim submitted successfully. The owner has been notified.");
      setMessage("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not submit claim at this time.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimDecision = async (claimId: string, status: "approved" | "rejected") => {
    try {
      await apiPatch(`/api/claims/${claimId}`, { status });
      toast.success(`Claim ${status} successfully.`);
      const data = await apiGet<{ claims: Array<Claim & { user: { name: string } }> }>(
        `/api/items/${itemId}/claims`
      );
      setClaims(data.claims);
      // Depending on backend, item status might become 'CLOSED'. Reloading item to verify.
      const detail = await apiGet<ItemDetailResponse>(`/api/items/${itemId}`);
      setItem(detail.item);
      setImageBroken(false);
    } catch (err) {
      toast.error("Failed to update claim status.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
         <Skeleton className="h-8 w-24 mb-6" />
         <div className="flex flex-col md:flex-row gap-6">
           <Skeleton className="flex-1 h-[400px] rounded-xl" />
           <Skeleton className="w-full md:w-[320px] h-[300px] rounded-xl" />
         </div>
      </div>
    );
  }
  
  if (error || !item) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 text-destructive">
        <XCircle className="h-10 w-10 mb-4 opacity-80" />
        <h2 className="text-xl font-bold tracking-tight mb-2">Item Not Found</h2>
        <p className="text-sm font-medium mb-6">{error || "The item you requested does not exist or has been removed."}</p>
        <Button variant="outline" asChild className="ext-foreground">
          <Link href="/">Return to Feed</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group">
        <MoveLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to feed
      </Link>

      <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
        {/* Item Details */}
        <div className="flex-1 space-y-6">
          <div className="rounded-xl overflow-hidden bg-muted border border-border/50 aspect-video relative flex flex-col items-center justify-center">
            {item.imageUrl && !imageBroken ? (
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={() => setImageBroken(true)}
              />
            ) : (
              <div className="flex bg-muted flex-col items-center justify-center text-6xl shadow-inner">
                {item.type === "lost" ? "🎧" : "🔑"}
              </div>
            )}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant={item.type === "lost" ? "destructive" : "default"} className="uppercase px-3 py-1 shadow-md text-xs tracking-wider font-semibold">
                {item.type}
              </Badge>
              <Badge variant={item.status === "OPEN" ? "outline" : "secondary"} className={`uppercase px-3 py-1 text-xs tracking-wider shadow-md font-semibold ${item.status === "CLOSED" ? "bg-emerald-500/90 text-white border-none" : "bg-background/90 backdrop-blur"}`}>
                {item.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-[var(--font-dm-serif)] tracking-tight leading-tight">{item.title}</h1>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground bg-card border border-border/50 px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-foreground text-sm">{item.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-sm">{new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 shrink-0 text-primary" />
                <span className="font-medium text-sm text-foreground/80">Posted by {item.user?.name ?? "User"}</span>
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed text-foreground/80 mt-6">
              <p className="whitespace-pre-wrap text-[15px]">{item.description}</p>
            </div>
          </div>
        </div>

        {/* Sidebar Actions / Moderation */}
        <aside className="w-full md:w-[340px] shrink-0">
          <Card className="sticky top-24 border-border/60 shadow-sm overflow-hidden">
            <div className="h-1 bg-primary w-full" />
            <CardContent className="p-5 md:p-6 space-y-4 pt-5">
              <h3 className="font-semibold text-lg flex items-center gap-2 tracking-tight">
                <Tag className="h-5 w-5 text-muted-foreground" />
                {isOwner ? "Receive Claims" : "Action Center"}
              </h3>
              
              {!isOwner ? (
                <div className="space-y-4">
                  {item.status === "CLOSED" ? (
                    <div className="p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-500/20 text-sm font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      This item has been successfully resolved.
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {item.type === "lost" 
                          ? "Did you find this item? Contact the owner." 
                          : "Is this yours? Submit a claim so the finder can verify."}
                      </p>
                      
                      <div className="space-y-3">
                        <Textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="resize-none min-h-[100px] text-sm"
                          placeholder="Include a specific detail or identifying mark to prove it's yours..."
                        />
                        <Button 
                          onClick={handleClaim} 
                          disabled={isSubmitting || !message.trim()} 
                          className="w-full h-11 font-semibold"
                        >
                          {isSubmitting ? "Submitting..." : item.type === "lost" ? "Message Owner" : "Claim Item"}
                        </Button>
                        {!me && (
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Please log in or sign up first.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground pb-2 border-b">
                    {claims.length} Active {claims.length === 1 ? "claim" : "claims"}
                  </div>
                  
                  {claims.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                      No claims have been submitted yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {claims.map((claim) => (
                        <div key={claim.id} className="p-3 border rounded-lg bg-card/50 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">{claim.user?.name || "User"}</span>
                            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">Pending</Badge>
                          </div>
                          {claim.message && (
                            <p className="text-xs text-muted-foreground italic border-l-2 pl-2 my-1">
                              &quot;{claim.message}&quot;
                            </p>
                          )}
                          {claim.status === "pending" && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClaimDecision(claim.id, "approved")}
                                className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-800 border-none h-8"
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClaimDecision(claim.id, "rejected")}
                                className="bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive border-none h-8"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}