"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Package, 
  CheckCircle2, 
  MessageSquare, 
  Globe, 
  ArrowRight, 
  TrendingUp,
  Activity,
  Plus
} from "lucide-react";
import { apiGet } from "@/lib/apiClient";
import type { Item } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StatsPayload = {
  platform: { totalItems: number; lostItems: number; foundItems: number };
  user: {
    postedItems: number;
    totalClaims: number;
    approvedClaims: number;
    pendingClaims: number;
  };
};

type UserItemsPayload = { items: Item[]; total: number };

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, itemsRes] = await Promise.all([
          apiGet<StatsPayload>("/api/stats"),
          apiGet<UserItemsPayload>("/api/user/items", { limit: 5, offset: 0 }),
        ]);
        if (!alive) return;
        setStats(statsRes);
        setItems(itemsRes.items || []);
      } catch {
        if (!alive) return;
        setError("Failed to load dashboard");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-destructive/20 rounded-2xl bg-destructive/5 text-destructive">
        <Activity className="h-10 w-10 mb-4 opacity-80" />
        <h2 className="text-xl font-bold tracking-tight mb-2">Oops!</h2>
        <p className="text-sm font-medium mb-6">{error || "Could not load your dashboard."}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-[var(--font-dm-serif)] tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1 tracking-tight">Overview of your activity and items.</p>
      </div>

      <div className="flex justify-start sm:justify-end">
        <Button asChild>
          <Link href="/items/new">
            <Plus className="h-4 w-4" />
            Post Lost/Found Item
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Posted</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.user.postedItems}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
              <TrendingUp className="h-3 w-3 text-emerald-500 mr-1" />
              <span className="text-emerald-500 font-medium">+{Math.max(stats.user.postedItems - 1, 0)}</span> this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Items</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.user.approvedClaims}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successful recoveries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claims Made</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.user.totalClaims}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-amber-500 font-medium">{stats.user.pendingClaims} pending</span> review
            </p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-primary">Platform Scale</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.platform.totalItems}</div>
            <p className="text-xs text-primary/80 mt-1">
              {stats.platform.lostItems} lost • {stats.platform.foundItems} found
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Recent Items</CardTitle>
            <CardDescription>Your most recently tracked items.</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="hidden sm:flex shrink-0">
            <Link href="/my-items">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Date Posted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                      No items posted yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium whitespace-nowrap">
                        <Link href={`/item/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.type === "lost" ? "destructive" : "default"} className="uppercase text-[10px]">
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "CLOSED" ? "secondary" : "outline"} className={`uppercase text-[10px] ${item.status === "CLOSED" ? "bg-emerald-500/10 text-emerald-600 border-none" : ""}`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground whitespace-nowrap truncate">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4 sm:hidden">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/my-items">View all items</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
