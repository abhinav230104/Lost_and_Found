"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { 
  Inbox, 
  MapPin, 
  CalendarDays, 
  MessageSquare, 
  ArrowRight,
  User,
  Clock,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { apiGet } from "@/lib/apiClient";
import type { ClaimStatus } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MyClaim = {
  id: string;
  message?: string | null;
  status: ClaimStatus;
  createdAt: string;
  chat?: { id: string } | null;
  item: {
    id: string;
    title: string;
    type: "lost" | "found";
    location: string;
    date: string;
    user?: { id: string; name: string; email: string } | null;
  };
};

type ClaimsResponse = {
  count: number;
  claims: MyClaim[];
};

function statusBadgeProps(status: ClaimStatus) {
  if (status === "approved") return { variant: "default" as const, className: "bg-emerald-500 hover:bg-emerald-600 text-white" };
  if (status === "rejected") return { variant: "destructive" as const };
  return { variant: "secondary" as const, className: "bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-500" };
}

export default function MyClaimsPage() {
  const [claims, setClaims] = useState<MyClaim[]>([]);
  const [filter, setFilter] = useState<"all" | ClaimStatus>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadClaims() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGet<ClaimsResponse>("/api/claims/all");
        if (!alive) return;
        setClaims(res.claims || []);
      } catch {
        if (!alive) return;
        setError("Failed to load your claims.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    loadClaims();
    return () => {
      alive = false;
    };
  }, []);

  const filteredClaims = useMemo(() => {
    if (filter === "all") return claims;
    return claims.filter((claim) => claim.status === filter);
  }, [claims, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-[var(--font-dm-serif)] tracking-tight">My Claims</h2>
          <p className="text-muted-foreground mt-1 tracking-tight">Track your item requests and chat with owners.</p>
        </div>
        
        <Tabs defaultValue="all" value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-4 sm:w-[400px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <CardHeader className="pb-3 space-y-2">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 pb-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-16 w-full rounded-md mt-4" />
              </CardContent>
              <CardFooter className="pt-3">
                <Skeleton className="h-9 w-full rounded-md" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-destructive/5 text-destructive border-destructive/20">
          <ShieldAlert className="h-12 w-12 mb-4 opacity-80" />
          <h3 className="text-xl font-bold tracking-tight mb-2">Error</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/30">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold tracking-tight mb-2">No claims found</h3>
          <p className="text-muted-foreground max-w-sm">
            {filter === "all" 
              ? "You haven't submitted any claims yet." 
              : `You don't have any ${filter} claims at the moment.`}
          </p>
          {filter === "all" && (
            <Button asChild className="mt-6">
              <Link href="/">Browse Items</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClaims.map((claim) => (
            <Card key={claim.id} className="flex flex-col h-full hover:border-border transition-colors group">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="text-base line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {claim.item.title}
                  </CardTitle>
                  <Badge {...statusBadgeProps(claim.status)} className="uppercase text-[10px] whitespace-nowrap">
                    {claim.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 space-y-3 flex-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`uppercase text-[10px] bg-background ${claim.item.type === "lost" ? "text-destructive border-destructive/30" : "text-emerald-500 border-emerald-500/30"}`}>
                    {claim.item.type} Item
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-4 text-xs sm:text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary/60" />
                    <span className="line-clamp-1">{claim.item.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary/60" />
                    <span>Lost/Found: {new Date(claim.item.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0 text-primary/60" />
                    <span>Owner: <span className="font-medium text-foreground">{claim.item.user?.name || "Unknown"}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-primary/60" />
                    <span>Claimed on: {new Date(claim.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {claim.message && (
                  <div className="mt-4 p-3 rounded-md bg-muted/50 border border-muted text-xs italic text-foreground/80 relative">
                    <MessageSquare className="h-3 w-3 absolute top-3 right-3 opacity-30" />
                    &quot;{claim.message}&quot;
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-4 pb-4 px-4 border-t bg-muted/10 flex gap-2">
                <Button variant="outline" size="sm" asChild className="w-full bg-background">
                  <Link href={`/item/${claim.item.id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Item
                  </Link>
                </Button>
                
                {claim.status === "approved" && claim.chat?.id && (
                  <Button size="sm" asChild className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow">
                    <Link href={`/chats?claimId=${claim.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat
                    </Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
