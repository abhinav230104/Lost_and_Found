"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  PackageSearch, 
  MapPin, 
  Calendar, 
  Trash2, 
  MoreVertical, 
  Eye, 
  Unlock, 
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/apiClient";
import type { Item } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type UserItemsResponse = {
  total: number;
  count: number;
  items: Item[];
  offset: number;
  limit: number;
};

export default function MyItemsPage() {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<UserItemsResponse>("/api/user/items", {
        status: statusFilter === "ALL" ? undefined : statusFilter,
        limit: 50,
        offset: 0,
      });
      setItems(res.items || []);
    } catch {
      setError("Failed to load your items.");
      toast.error("Could not fetch items. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [statusFilter]);

  const toggleStatus = async (item: Item) => {
    try {
      const status = item.status === "OPEN" ? "CLOSED" : "OPEN";
      toast.promise(apiPatch(`/api/items/${item.id}/status`, { status }), {
        loading: "Updating status...",
        success: () => {
          setItems((prev) => 
            prev.map(i => i.id === item.id ? { ...i, status } : i)
          );
          return `Item marked as ${status.toLowerCase()}`;
        },
        error: "Failed to update status",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      toast.promise(apiDelete(`/api/items/${itemToDelete}`), {
        loading: "Deleting item...",
        success: () => {
          setItems((prev) => prev.filter((i) => i.id !== itemToDelete));
          return "Item deleted successfully.";
        },
        error: "Failed to delete item",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-[var(--font-dm-serif)] tracking-tight">My Items</h2>
          <p className="text-muted-foreground mt-1 tracking-tight">Manage your posted lost and found items.</p>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
          <Tabs defaultValue="ALL" value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-[300px]">
              <TabsTrigger value="ALL">All Items</TabsTrigger>
              <TabsTrigger value="OPEN">Active</TabsTrigger>
              <TabsTrigger value="CLOSED">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button asChild className="shrink-0">
            <Link href="/items/new">
              <Plus className="h-4 w-4 mr-1" />
              Post Item
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-destructive/5 text-destructive border-destructive/20">
          <AlertCircle className="h-12 w-12 mb-4 opacity-80" />
          <h3 className="text-xl font-bold tracking-tight mb-2">Error</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button variant="outline" onClick={() => loadItems()}>Try Again</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-2xl bg-muted/30">
          <PackageSearch className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-bold tracking-tight mb-2">No items found</h3>
          <p className="text-muted-foreground max-w-sm">
            {statusFilter === "ALL" 
              ? "You haven't posted any items yet." 
              : `You don't have any ${statusFilter.toLowerCase()} items at the moment.`}
          </p>
          {statusFilter === "ALL" ? (
            <Button asChild className="mt-6">
              <Link href="/items/new">
                <Plus className="h-4 w-4 mr-1" />
                Post your first item
              </Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden flex flex-col hover:border-border transition-colors group">
              {item.imageUrl && !brokenImages[item.id] ? (
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                    onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full flex items-center justify-center bg-muted/50 border-b">
                  <PackageSearch className="h-10 w-10 text-muted-foreground/30" />
                </div>
              )}
              
              <CardHeader className="p-4 pb-2 space-y-3 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={item.type === "lost" ? "destructive" : "default"} className="uppercase text-[10px] font-bold">
                    {item.type}
                  </Badge>
                  <Badge 
                    variant={item.status === "CLOSED" ? "secondary" : "outline"} 
                    className={`uppercase text-[10px] ${item.status === "CLOSED" ? "bg-emerald-500/10 text-emerald-600 border-none" : ""}`}
                  >
                    {item.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-base line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-2 text-sm text-muted-foreground flex-1">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary/60" />
                  <span className="line-clamp-1">{item.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 shrink-0 text-primary/60" />
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>
              </CardContent>

              <CardFooter className="p-4 pt-2 border-t bg-muted/10 grid grid-cols-2 gap-2 mt-auto">
                <Button variant="outline" size="sm" asChild className="w-full shadow-none bg-background">
                  <Link href={`/item/${item.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger className="group/button inline-flex h-7 w-full shrink-0 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] border border-border bg-background px-2.5 text-[0.8rem] font-medium shadow-none transition-all outline-none hover:bg-muted hover:text-foreground">
                    Manage
                    <MoreVertical className="h-3 w-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      render={<Link href={`/item/${item.id}`} />}
                      className="cursor-pointer"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View full details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStatus(item)} className="cursor-pointer">
                      {item.status === "OPEN" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" />
                          Mark as Resolved
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4 mr-2" />
                          Reopen listing
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setItemToDelete(item.id)} 
                      className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              posted item and remove it from our servers. Any active claims for this item will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
