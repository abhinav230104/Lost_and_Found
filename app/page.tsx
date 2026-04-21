"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, Calendar, Compass, SearchSlash } from "lucide-react";
import { apiGet } from "@/lib/apiClient";
import type { Item } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type ItemsResponse = { items: Item[]; total: number };
type ResolvedItem = Item & {
  claims?: Array<{ id: string; user?: { id: string; name: string } }>;
};

function FeedSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-border/50">
          <Skeleton className="h-32 w-full rounded-none" />
          <CardContent className="p-4">
            <Skeleton className="mb-2 h-5 w-1/2" />
            <Skeleton className="mb-1 h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Skeleton className="h-8 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default function HomePage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("query") || "";

  const [typeFilter, setTypeFilter] = useState<"all" | "lost" | "found">("all");
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Item[]>([]);
  const [trending, setTrending] = useState<Item[]>([]);
  const [resolved, setResolved] = useState<ResolvedItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [itemsRes, trendingRes, resolvedRes] = await Promise.all([
          apiGet<ItemsResponse>("/api/items", {
            type: typeFilter === "all" ? undefined : typeFilter,
            query: query || undefined,
            limit: 12,
            offset: 0,
          }),
          apiGet<{ items: Item[] }>("/api/items/trending", { limit: 6 }),
          apiGet<{ items: ResolvedItem[] }>("/api/items/resolved", { limit: 4 }),
        ]);
        if (!alive) return;
        setItems(itemsRes.items || []);
        setTotalCount(itemsRes.total || 0);
        setTrending(trendingRes.items || []);
        setResolved(resolvedRes.items || []);
      } catch {
        if (!alive) return;
        setError("Unable to load the feed right now.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [typeFilter, query]);

  const itemStats = useMemo(() => {
    const resolvedCount = items.filter((i) => i.status === "CLOSED").length;
    const recovery = items.length ? Math.round((resolvedCount / items.length) * 100) : 0;
    return { resolvedCount, recovery };
  }, [items]);

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-10 md:py-14 text-white shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(225,29,72,0.15)_0%,transparent_58%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.05)_0%,transparent_42%)]" />
        <div className="relative z-10 max-w-2xl">
          <h1 className="mb-4 font-[var(--font-dm-serif)] text-4xl md:text-5xl leading-[1.1] tracking-tight">
            Report fast.<br />Recover smarter.
          </h1>
          <p className="mb-8 text-base md:text-lg text-slate-300 max-w-lg">
            The streamlined campus platform to post, discover, claim, and reconnect items with their rightful owners.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-none border-none">
              <Link href="/items/new?type=lost">I Lost Something</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 hover:bg-white/10 text-white shadow-none">
              <Link href="/items/new?type=found">I Found Something</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 md:max-w-md divide-x divide-white/10">
            <div className="pr-4">
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{totalCount}</p>
              <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-slate-400 mt-1">matching</p>
            </div>
            <div className="px-4">
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{itemStats.resolvedCount}</p>
              <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-slate-400 mt-1">resolved</p>
            </div>
            <div className="pl-4">
              <p className="text-2xl md:text-3xl font-bold tracking-tight">{itemStats.recovery}%</p>
              <p className="text-[10px] md:text-xs font-medium uppercase tracking-wider text-slate-400 mt-1">recovery rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:mx-0 sm:px-0 border-b sm:border-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs 
            value={typeFilter} 
            onValueChange={(val) => setTypeFilter(val as any)}
            className="w-full sm:w-auto"
          >
            <TabsList className="w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="lost">Lost Items</TabsTrigger>
              <TabsTrigger value="found">Found Items</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-muted/50 border-border/50"
              placeholder="Search items, descriptions..."
            />
          </div>
        </div>
      </section>

      {error ? (
        <div className="bg-destructive/10 text-destructive p-4 rounded-xl flex items-center justify-center min-h-[120px] text-sm font-medium border border-destructive/20">
          {error}
        </div>
      ) : null}

      {/* Main Feed */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Compass className="h-5 w-5 text-rose-600" />
          <h2 className="text-xl font-bold tracking-tight">Recent Discovery Feed</h2>
        </div>
        
        {loading ? (
          <FeedSkeleton />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center border rounded-2xl bg-muted/20 border-dashed">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <SearchSlash className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">No items found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Try adjusting your search filters or clearing the query to see more results.
            </p>
            <Button variant="outline" onClick={() => { setQuery(""); setTypeFilter("all"); }}>
              Reset filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <Link key={item.id} href={`/item/${item.id}`} className="group block h-full">
                <Card className="h-full overflow-hidden border-border/60 bg-card transition-all hover:shadow-md hover:border-primary/30 flex flex-col">
                  {/* Image Placeholder / Thumbnail */}
                  <div className="relative h-36 bg-muted overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
                         <span className="text-4xl opacity-50">{item.type === "lost" ? "🎧" : "🔑"}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <Badge variant={item.type === "lost" ? "destructive" : "default"} className="uppercase text-[10px] tracking-wider px-2 py-0 h-5">
                        {item.type}
                      </Badge>
                      {item.status === "CLOSED" && (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-200/50 uppercase text-[10px] tracking-wider px-2 py-0 h-5">
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <CardContent className="p-4 flex-1">
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors tracking-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {item.description}
                    </p>
                    <div className="mt-auto flex flex-col gap-1.5 text-xs font-medium text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Resolved / Trending split section could go here later if required, omitted for clean feed focus */}
    </div>
  );
}

