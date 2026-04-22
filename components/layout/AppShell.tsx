"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/apiClient";
import type { Notification, User } from "@/lib/types";
import { LoadingState } from "@/components/ui/AsyncState";
import { ThemeToggle } from "./ThemeToggle";
import { useSocket } from "@/lib/useSocket";
import { 
  PackageSearch, 
  Menu, 
  LogOut, 
  Search, 
  LayoutDashboard,
  Package,
  Inbox, 
  MessageSquare,
  Bell, 
  User as UserIcon,
  Home,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { href: "/", label: "Explore", icon: Home },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-items", label: "My Items", icon: Package },
  { href: "/my-claims", label: "My Claims", icon: Inbox },
  { href: "/chats", label: "Chats", icon: MessageSquare },
];

const authRoutes = new Set(["/login", "/signup", "/verify-otp"]);

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isLoggingOut, startLogout] = useTransition();
  const [unreadCount, setUnreadCount] = useState(0);
  const [shellSearch, setShellSearch] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { socket } = useSocket(user?.id ?? null);
  const isAuthRoute = authRoutes.has(pathname);
  const isPublicPath = pathname === "/" || isAuthRoute;
  const requiresAuth = !isPublicPath;
  const shouldCheckAuth = true;

  useEffect(() => {
    let alive = true;

    async function loadCurrentUser() {
      setIsCheckingAuth(true);
      try {
        const currentUser = await apiGet<User>("/api/user/me");
        if (alive) setUser(currentUser);
      } catch (error) {
        if (!alive) return;
        setUser(null);
      } finally {
        if (alive) setIsCheckingAuth(false);
      }
    }

    loadCurrentUser();
    return () => {
      alive = false;
    };
  }, [shouldCheckAuth, pathname]);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    async function loadNotifications() {
      try {
        const data = await apiGet<{ unreadCount: number }>("/api/notifications");
        if (!alive) return;
        setUnreadCount(data.unreadCount || 0);
      } catch {
        if (!alive) return;
        setUnreadCount(0);
      }
    }

    loadNotifications();
    return () => {
      alive = false;
    };
  }, [user, pathname]);

  useEffect(() => {
    if (!socket || !user) return;

    const handleNotif = () => setUnreadCount((c) => c + 1);
    socket.on("new-notification", handleNotif);

    return () => {
      socket.off("new-notification", handleNotif);
    };
  }, [socket, user]);

  useEffect(() => {
    if (isCheckingAuth) return;

    if (!user && requiresAuth) {
      router.replace("/");
      return;
    }

    if (user && isAuthRoute) {
      const nextPath = searchParams.get("next");
      router.replace(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
    }
  }, [isCheckingAuth, user, requiresAuth, isAuthRoute, pathname, router, searchParams]);

  // Close mobile menu on path change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    startLogout(async () => {
      try {
        await apiPost<{ message: string }>("/api/auth/logout");
      } finally {
        setUser(null);
        router.replace("/login");
      }
    });
  };

  const submitGlobalSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalized = shellSearch.trim();
    if (!normalized) {
      router.push("/");
      return;
    }
    router.push(`/?query=${encodeURIComponent(normalized)}`);
    setMobileMenuOpen(false);
  };

  if (isCheckingAuth && shouldCheckAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
           <PackageSearch className="h-8 w-8 text-muted-foreground animate-pulse" />
           <p className="text-sm text-muted-foreground">Checking session...</p>
         </div>
      </main>
    );
  }

  const authenticatedNavItems = user ? navItems : navItems.filter(item => item.href === "/");
  const profileInitial = (user?.name?.trim().charAt(0) || user?.email?.trim().charAt(0) || "U").toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8 max-w-7xl">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <PackageSearch className="h-5 w-5" />
              </div>
              <span className="hidden font-[var(--font-dm-serif)] text-xl font-bold tracking-tight sm:inline-block">
                LostNFound
              </span>
            </Link>

            <nav className="hidden md:flex gap-1 ml-4 shadow-sm border rounded-full p-1 bg-muted/20">
              {authenticatedNavItems.map((item) => {
                const isActive = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-all px-4 py-1.5 rounded-full flex items-center gap-2 ${
                      isActive 
                        ? "bg-background text-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {isActive && <item.icon className="h-3.5 w-3.5" />}
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden lg:flex relative w-64 items-center">
              <form onSubmit={submitGlobalSearch} className="w-full relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="w-full bg-muted/50 pl-9 rounded-full h-9 border-transparent focus-visible:bg-background shadow-none"
                  placeholder="Search items..."
                  value={shellSearch}
                  onChange={(e) => setShellSearch(e.target.value)}
                />
              </form>
            </div>

            {user ? (
              <Button asChild size="sm" className="hidden md:inline-flex rounded-full">
                <Link href="/items/new">
                  <Plus className="h-4 w-4" />
                  Post Item
                </Link>
              </Button>
            ) : null}

            <ThemeToggle />
            
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Button
  variant="ghost"
  size="icon"
  asChild
  className="relative h-9 w-9 rounded-full"
>
  <Link href="/notifications" className="relative flex items-center justify-center">
    <Bell className="h-5 w-5" />

    {unreadCount > 0 && (
      <Badge
        variant="destructive"
        className="absolute -right-1 -top-1 px-1.5 py-0 min-w-4 h-4 flex items-center justify-center text-[10px] rounded-full border-2 border-background"
      >
        {unreadCount > 99 ? "99+" : unreadCount}
      </Badge>
    )}

    <span className="sr-only">Notifications</span>
  </Link>
</Button>

                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-full hover:bg-muted relative h-9 w-9 ml-1">
                    <Avatar className="h-9 w-9 border shadow-sm transition-transform hover:scale-105">
                      <AvatarFallback className="bg-primary/10 text-primary">{profileInitial}</AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem render={<Link href="/profile" />} className="cursor-pointer w-full flex items-center">
                      <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Profile Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut} className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 ml-2">
                <Button variant="ghost" asChild className="rounded-full">
  <Link href="/login">Log in</Link>
</Button>

<Button asChild className="rounded-full shadow-sm">
  <Link href="/signup">Sign up</Link>
</Button>
              </div>
            )}

            {/* Mobile Navigation */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger className="md:hidden inline-flex items-center justify-center rounded-md h-9 w-9 hover:bg-muted text-muted-foreground">
                <div className="relative">
                  <Menu className="h-5 w-5" />
                  {user && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
                  )}
                </div>
                <span className="sr-only">Toggle Menu</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col p-0">
                <div className="p-6 pb-2">
                  <SheetTitle className="text-left flex items-center gap-2 font-[var(--font-dm-serif)] text-xl border-b pb-4">
                    <PackageSearch className="h-5 w-5 text-primary" />
                    LostNFound
                  </SheetTitle>
                </div>
                
                <form onSubmit={submitGlobalSearch} className="px-6 mb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search items..." 
                      className="pl-9 bg-muted/50 shadow-none border-transparent focus-visible:bg-background"
                      value={shellSearch}
                      onChange={e => setShellSearch(e.target.value)}
                    />
                  </div>
                </form>

                <div className="flex-1 overflow-y-auto px-4 py-2">
                  <nav className="flex flex-col gap-1">
                    {user ? (
                      <Link
                        href="/items/new"
                        className="text-sm font-medium transition-colors flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                      >
                        <Plus className="h-4 w-4" />
                        Post Item
                      </Link>
                    ) : null}
                    {authenticatedNavItems.map((item) => {
                      const isActive = isActivePath(pathname, item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`text-sm font-medium transition-colors flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                            isActive 
                              ? "bg-primary/10 text-primary" 
                              : "text-foreground/70 hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
                
                <div className="p-6 pt-4 border-t bg-muted/10 mt-auto">
                  {user ? (
                    <div className="flex flex-col gap-2">
                      <Link
                        href="/notifications"
                        className="text-sm font-medium transition-colors hover:bg-muted py-2.5 px-3 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 text-foreground/70">
                          <Bell className="h-4 w-4" />
                          Notifications
                        </div>
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="flex items-center justify-center px-1.5 h-5 min-w-5 text-[10px] rounded-full">
                            {unreadCount}
                          </Badge>
                        )}
                      </Link>
                      <Link
                        href="/profile"
                        className="text-sm font-medium transition-colors hover:bg-muted py-2.5 px-3 rounded-lg flex items-center gap-3 text-foreground/70"
                      >
                        <UserIcon className="h-4 w-4" />
                        Profile Settings
                      </Link>
                      <Button 
                        variant="ghost" 
                        className="justify-start px-3 py-5 mt-2 text-destructive hover:text-destructive hover:bg-destructive/10 w-full" 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        {isLoggingOut ? "Logging out..." : "Log out"}
                      </Button>
                      
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t px-2">
                        <Avatar className="h-10 w-10 border shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary">{profileInitial}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium leading-none">{user.name}</span>
                          <span className="text-xs text-muted-foreground mt-1">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button variant="outline" asChild className="w-full justify-start rounded-xl h-12">
                        <Link href="/login">Log in</Link>
                      </Button>
                      <Button asChild className="w-full justify-start rounded-xl h-12 shadow-sm">
                        <Link href="/signup">Sign up</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full bg-muted/20 flex flex-col items-stretch">
        <div className="container mx-auto px-4 sm:px-8 py-8 md:py-10 max-w-7xl animate-in fade-in duration-500 flex-1 flex flex-col items-stretch lg:min-h-[75vh]">
          {children}
        </div>
      </main>

      <footer className="border-t py-8 mt-auto bg-background">
        <div className="container mx-auto px-4 max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left text-sm text-muted-foreground">
          <div className="flex items-center gap-2 font-medium">
             <PackageSearch className="h-4 w-4 group-hover:animate-pulse" />
             LostNFound <span className="text-[10px] text-destructive translate-y-[-4px] font-bold">NITJ</span>
          </div>
          <p>
            © {new Date().getFullYear()} Team. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}