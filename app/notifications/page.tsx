"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  Check, 
  Trash2, 
  MessageSquare, 
  CheckCircle2, 
  XCircle, 
  AlertCircle 
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/apiClient";
import type { Notification } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getNotificationIcon(type: Notification["type"]) {
  switch (type) {
    case "claim_approved":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "claim_rejected":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "claim_submitted":
      return <AlertCircle className="h-5 w-5 text-amber-500" />;
    case "new_message":
      return <MessageSquare className="h-5 w-5 text-primary" />;
    default:
      return <Bell className="h-5 w-5 text-muted-foreground" />;
  }
}

function getNotificationColor(type: Notification["type"], read: boolean) {
  if (read) return "bg-background border-border/50";
  
  switch (type) {
    case "claim_approved":
      return "bg-emerald-500/5 border-emerald-500/20";
    case "claim_rejected":
      return "bg-destructive/5 border-destructive/20";
    case "claim_submitted":
      return "bg-amber-500/5 border-amber-500/20";
    case "new_message":
      return "bg-primary/5 border-primary/20";
    default:
      return "bg-muted/50 border-muted";
  }
}

export default function NotificationsPage() {
  const [list, setList] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<{ notifications: Notification[]; unreadCount: number }>(
        "/api/notifications"
      );
      setList(res.notifications || []);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    try {
      await apiPatch(`/api/notifications/${id}`, { read: true });
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error("Failed to mark notification as read");
    }
  };

  const markAllRead = async () => {
    try {
      await apiPatch("/api/notifications/mark-read");
      setList((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const removeOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent marking as read when clicking delete
    try {
      await apiDelete(`/api/notifications/${id}`);
      setList((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to remove notification");
    }
  };

  const unreadCount = list.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-[var(--font-dm-serif)] tracking-tight">Notifications</h2>
          <p className="text-muted-foreground mt-1 tracking-tight">
            {unreadCount > 0 
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.` 
              : "You're all caught up!"}
          </p>
        </div>
        
        {list.length > 0 && (
          <Button 
            variant="outline" 
            onClick={markAllRead} 
            disabled={unreadCount === 0 || loading}
            className="w-full sm:w-auto"
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <Card className="border-muted shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border/50">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 sm:p-6 flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-destructive/5 text-destructive">
            <AlertCircle className="h-10 w-10 mb-4 opacity-80" />
            <p className="font-medium mb-4">{error}</p>
            <Button variant="outline" onClick={load}>Try Again</Button>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-medium tracking-tight mb-2">No notifications yet</h3>
            <p className="text-muted-foreground max-w-sm">
              When someone claims your item or replies to your messages, you'll see it here.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-16rem)] min-h-[500px]">
            <div className="divide-y divide-border/50">
              {list.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.read && markRead(n.id)}
                  className={cn(
                    "p-4 sm:p-6 flex gap-4 items-start transition-colors border-l-4",
                    !n.read ? "cursor-pointer hover:bg-muted/50" : "",
                    getNotificationColor(n.type, n.read),
                    !n.read ? "border-l-primary" : "border-l-transparent"
                  )}
                >
                  <div className="mt-1 shrink-0 p-2 rounded-full bg-background border shadow-sm">
                    {getNotificationIcon(n.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <p className={cn(
                        "text-sm font-semibold truncate",
                        !n.read ? "text-foreground" : "text-foreground/80"
                      )}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1.5">
                        {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block sm:hidden" />}
                        {new Date(n.createdAt).toLocaleDateString(undefined, { 
                          month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    
                    <p className={cn(
                      "text-sm line-clamp-2",
                      !n.read ? "text-muted-foreground" : "text-muted-foreground/70"
                    )}>
                      {n.message}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    {!n.read && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                        title="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Mark as read</span>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => removeOne(n.id, e)}
                      title="Delete notification"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
}
