import { Search, User, Bell, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMessages } from "./ui/MessageContext";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
interface HeaderProps {
  onSearch?: (query: string) => void;
  notificationCount?: number;
}

export function Header({ onSearch, notificationCount = 0 }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { toggleMessages } = useMessages();
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    onSearch?.(searchQuery);
  };
  const { data: conversationsData } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: async () => {
      const res = await fetch("/api/conversations");
      if (!res.ok) throw new Error("Failed to load conversations");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 5000, // keep header updated
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    enabled: !!user,
    refetchInterval: 5000,
  });

  const unreadNotifications = notifications.filter(
    (n: any) => !n.isRead
  ).length;

  const markAsRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });
  };


  const unreadMessages = conversationsData?.totalUnread ?? 0;
  const previousUnreadRef = useRef<number>(0);
  useEffect(() => {
    if (unreadMessages > previousUnreadRef.current) {
      toast({
        title: "New Message",
        description: "You have received a new message.",
      });
    }

  previousUnreadRef.current = unreadMessages;
}, [unreadMessages]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href={
              user?.userType === "vendor"
                ? "/vendor-dashboard"
                : user?.userType === "admin"
                  ? "/admin-dashboard"
                  : "/dashboard"
            }>
            <div className="flex items-center gap-2 cursor-pointer hover-elevate active-elevate-2 px-2 py-1 rounded-md transition-all">
              <div className="h-8 w-8 rounded-md gradient-bg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">GS</span>
              </div>
              <span className="font-semibold text-lg gradient-text">GovScale Alliance</span>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {user?.userType === "vendor" && (
              <>
                <Link href="/vendor-dashboard">
                  <Button variant="ghost" className="text-sm">
                    Dashboard
                  </Button>
                </Link>

                <Link href="/services">
                  <Button variant="ghost" className="text-sm">
                    Services
                  </Button>
                </Link>
              </>
            )}

            {user?.userType === "contractor" && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-sm">
                    Dashboard
                  </Button>
                </Link>

                <Link href="/marketplace">
                  <Button variant="ghost" className="text-sm">
                    Marketplace
                  </Button>
                </Link>
              </>
            )}
          </nav>

        </div>

        <div className="flex items-center gap-4">
          {user?.userType !== "admin" && (
          <form onSubmit={handleSearch} className="relative hidden sm:flex">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search vendors, services..."
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search"
            />
          </form>
          )}

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="button-notifications"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />

                    {unreadNotifications > 0 && (
                      <span
                        className="absolute -top-2 -right-2 min-w-[16px] h-[16px] px-[4px]
                          flex items-center justify-center
                          rounded-full
                          bg-red-500 text-white
                          text-[10px] font-semibold
                          leading-none"
                      >
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-96 max-h-[500px] overflow-y-auto p-2"
              >
                <DropdownMenuLabel className="px-2 py-1">
                  Notifications
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {notifications.length === 0 && (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    No notifications
                  </div>
                )}

                {notifications.map((notification: any, index: number) => (
                  <div key={notification.id}>
                    <DropdownMenuItem
                      onClick={() => markAsRead(notification.id)}
                      className={`group flex items-start gap-3 whitespace-normal
                        rounded-md px-3 py-2
                        hover:bg-primary hover:text-white
                        transition-all duration-200
                        ${!notification.isRead ? "bg-muted/50" : ""}
                      `}
                    >
                      {/* Avatar Circle */}
                      <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0 text-sm font-semibold">
                        {notification.sender?.firstName
                          ?.charAt(0)
                          .toUpperCase() || "N"}
                      </div>

                      {/* Content */}
                      <div className="flex flex-col gap-1">
                        {/* Title */}
                        <p className="text-sm font-semibold group-hover:text-white">
                          {notification.title} by{" "}
                          {notification.sender?.firstName}{" "}
                          {notification.sender?.lastName}
                        </p>

                        {/* Message */}
                        <p className="text-xs text-muted-foreground group-hover:text-white">
                          {notification.message}
                        </p>

                        {/* Date */}
                        <p className="text-[10px] text-muted-foreground group-hover:text-white/80">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </DropdownMenuItem>

                    {/* Separator (not after last item) */}
                    {index !== notifications.length - 1 && (
                      <DropdownMenuSeparator />
                    )}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={toggleMessages} >
              <div className="relative">
                <MessageSquare className="h-5 w-5" />
                {unreadMessages > 0 && (
                  <span
                    className=" absolute -top-2 -right-1 min-w-[14px] h-[14px] px-[3px]
                      flex items-center justify-center
                      rounded-full
                      bg-red-500 text-white
                      text-[9px] font-semibold
                      leading-none
                    "
                  >
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </div>
            </Button>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="button-profile">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                    <AvatarFallback>
                      {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email
                      }
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-type">
                      {user?.userType ? user.userType.charAt(0).toUpperCase() + user.userType.slice(1) : "User"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}