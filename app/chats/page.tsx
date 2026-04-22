"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  MessageSquare, 
  Send, 
  Search, 
  MapPin, 
  CalendarDays, 
  AlertCircle,
  MoreVertical,
  Phone
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/apiClient";
import type { ChatListItem, Message, User, Item } from "@/lib/types";
import { useSocket } from "@/lib/useSocket";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatMessagesResponse = { chatId: string; messages: Message[] };

function ChatSkeleton() {
  return (
    <Card className="flex h-full min-h-[500px] overflow-hidden border-muted shadow-sm">
      <div className="hidden w-full md:w-[320px] border-r bg-muted/10 md:flex md:flex-col">
        <div className="p-4 border-b">
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
        <div className="flex-1 p-3 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex gap-3 items-center">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b flex items-center px-4 justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="flex-1 p-6 space-y-6">
          <div className="flex gap-3 max-w-[80%]">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-20 w-full rounded-2xl rounded-tl-sm" />
          </div>
          <div className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
            <Skeleton className="h-20 w-64 rounded-2xl rounded-tr-sm" />
          </div>
          <div className="flex gap-3 max-w-[80%]">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-12 w-48 rounded-2xl rounded-tl-sm" />
          </div>
        </div>
        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </Card>
  );
}

export default function ChatsPage() {
  const searchParams = useSearchParams();
  const queryClaimId = searchParams.get("claimId");
  const [me, setMe] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<"lost" | "found">("lost");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocket(me?.id || null);

  const syncChats = useCallback(async () => {
    const chatRes = await apiGet<{ chats: ChatListItem[]; count: number }>("/api/chats/all");
    const nextChats = chatRes.chats || [];

    setChats(nextChats);
    setSelectedClaimId((current) => {
      if (queryClaimId && nextChats.some((chat) => chat.claim.id === queryClaimId)) {
        return queryClaimId;
      }
      if (current && nextChats.some((chat) => chat.claim.id === current)) {
        return current;
      }
      return nextChats[0]?.claim.id || null;
    });
  }, [queryClaimId]);

  // Load initial data
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [user, chatRes] = await Promise.all([
          apiGet<User>("/api/user/me"),
          apiGet<{ chats: ChatListItem[]; count: number }>("/api/chats/all"),
        ]);
        if (!alive) return;
        setMe(user);
        setChats(chatRes.chats || []);
        
        const initialClaimId = queryClaimId;
        if (initialClaimId && chatRes.chats?.some((chat) => chat.claim.id === initialClaimId)) {
          setSelectedClaimId(initialClaimId);
        } else if (chatRes.chats?.[0]) {
          setSelectedClaimId(chatRes.chats[0].claim.id);
        }
      } catch {
        if (!alive) return;
        setError("Failed to load chats. Please try refreshing the page.");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [queryClaimId]);

  // Keep chat list fresh for newly created chats and background updates.
  useEffect(() => {
    if (!me) return;

    let alive = true;
    const sync = async () => {
      try {
        await syncChats();
      } catch {
        if (!alive) return;
      }
    };

    const intervalId = window.setInterval(sync, 8000);
    const handleFocus = () => {
      void sync();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [me, syncChats]);

  // Handle socket events for real-time messaging
  useEffect(() => {
    if (!socket || !selectedChatId || !me) return;

    socket.emit("join-chat", selectedChatId, me.id);

    const messageHandler = (newMsg: Message) => {
      setChats((prev) => {
        const idx = prev.findIndex((chat) => chat.id === newMsg.chatId);
        if (idx === -1) {
          void syncChats();
          return prev;
        }

        const chat = prev[idx];
        const updated = {
          ...chat,
          messages: [{
            id: newMsg.id,
            createdAt: newMsg.createdAt,
            senderId: newMsg.senderId,
            content: newMsg.content,
          }],
        };

        const next = [...prev];
        next.splice(idx, 1);
        next.unshift(updated);
        return next;
      });

      if (newMsg.chatId === selectedChatId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    };

    socket.on("new-message", messageHandler);

    return () => {
      socket.off("new-message", messageHandler);
      socket.emit("leave-chat", selectedChatId, me.id);
    };
  }, [socket, selectedChatId, me, syncChats]);

  // Load specific chat messages
  useEffect(() => {
    if (!selectedClaimId) return;
    let alive = true;
    async function loadMessages() {
      try {
        const data = await apiGet<ChatMessagesResponse>(`/api/chats/${selectedClaimId}`);
        if (!alive) return;
        
        setSelectedChatId(data.chatId);
        setMessages(data.messages || []);

        const selected = chats.find((c) => c.claim.id === selectedClaimId);
        if (selected) {
          const itemData = await apiGet<{ item: Item }>(`/api/items/${selected.claim.item.id}`);
          if (alive) setSelectedItemType(itemData.item.type);
        }
      } catch (err) {
         if (alive) toast.error("Could not load messages for this chat.");
      }
    }
    loadMessages();
    return () => { alive = false; };
  }, [selectedClaimId, chats]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const selectedChat = useMemo(
    () => chats.find((c) => c.claim.id === selectedClaimId) || null,
    [chats, selectedClaimId]
  );

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const lowerQ = searchQuery.toLowerCase();
    return chats.filter(c => 
      c.claim.item.title.toLowerCase().includes(lowerQ)
    );
  }, [chats, searchQuery]);

  const send = async () => {
    if (!selectedChatId || !draft.trim() || sending) return;
    setSending(true);
    const content = draft.trim();
    setDraft(""); // Optimistic clear
    
    try {
      const res = await apiPost<{ success: boolean; message: Message }>("/api/messages", {
        chatId: selectedChatId,
        content: content,
      });

      if (socket?.connected) {
        socket.emit("message-sent", res.message);
      }
      
      // Update local state fallback in case socket is slow
      setMessages(prev => {
        if (prev.some(m => m.id === res.message.id)) return prev;
        return [...prev, res.message];
      });
    } catch {
      toast.error("Failed to send message.");
      setDraft(content); // Restore draft on failure
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  function getOtherParticipant(chat: ChatListItem) {
    if (!me) return { name: "User", id: "" };
    // In a real app we'd get the actual other user from the chat participants
    // For now we'll just show the item owner or claimant depending on context
    const isOwner = me.id === chat.claim.item.userId;
    return {
      name: isOwner ? `Claimant (${chat.claim.user?.name || "Unknown"})` : chat.claim.item.user?.name || "Item Owner",
      id: isOwner ? chat.claim.userId : chat.claim.item.userId
    };
  }

  if (loading) return <ChatSkeleton />;
  if (error || !me) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center border-2 border-dashed rounded-2xl bg-destructive/5 text-destructive border-destructive/20 max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-12 w-12 mb-4 opacity-80" />
        <h3 className="text-xl font-bold tracking-tight mb-2">Connection Error</h3>
        <p className="text-muted-foreground mb-6 max-w-md">{error || "Could not load chats"}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Reconnect</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex-1 min-h-0 flex flex-col">
      <div>
        <h2 className="text-3xl font-[var(--font-dm-serif)] tracking-tight">Messages</h2>
        <p className="text-muted-foreground mt-1 tracking-tight">Coordinate securely with finders and owners.</p>
      </div>

      <Card className="flex flex-1 min-h-[500px] md:min-h-0 overflow-hidden border-muted shadow-sm">
        {/* Sidebar - Chat List */}
        <div className={`w-full md:w-[320px] flex-shrink-0 border-r bg-muted/10 flex flex-col min-h-0 ${selectedClaimId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                className="pl-9 bg-background shadow-none"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1 min-h-0">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <MessageSquare className="h-8 w-8 mb-3 opacity-20" />
                <p className="text-sm">No active chats.</p>
                <p className="text-xs mt-1">Chats appear here when claims are approved.</p>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No chats match your search.
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {filteredChats.map((chat) => {
                  const active = selectedClaimId === chat.claim.id;
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  const otherUser = getOtherParticipant(chat);
                  
                  return (
                    <button
                      key={chat.id}
                      onClick={() => setSelectedClaimId(chat.claim.id)}
                      className={`w-full p-4 flex gap-3 text-left transition-colors hover:bg-muted/50 ${active ? "bg-muted/80" : ""}`}
                    >
                      <Avatar className="h-10 w-10 border shadow-sm">
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {otherUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-sm truncate pr-2">
                            {chat.claim.item.title}
                          </span>
                          {lastMessage && (
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                              {formatMessageTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {lastMessage ? (
                            <span className={lastMessage.senderId === me.id ? "" : "text-foreground/80 font-medium"}>
                              {lastMessage.senderId === me.id ? "You: " : ""}{lastMessage.content}
                            </span>
                          ) : (
                            <span className="italic">No messages yet</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col min-w-0 min-h-0 bg-background ${!selectedClaimId ? 'hidden md:flex md:items-center md:justify-center md:bg-muted/10' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b flex items-center justify-between px-4 sm:px-6 bg-background z-10 shadow-sm shrink-0">
                <div className="flex items-center gap-3 w-full">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden -ml-2 shrink-0" 
                    onClick={() => setSelectedClaimId(null)}
                  >
                    ←
                  </Button>
                  
                  <Avatar className="h-9 w-9 border shadow-sm hidden sm:block">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getOtherParticipant(selectedChat).name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">
                        {getOtherParticipant(selectedChat).name}
                      </h3>
                      <Badge variant={selectedItemType === "lost" ? "destructive" : "default"} className="text-[9px] h-4 px-1 uppercase tracking-wider hidden sm:inline-flex">
                        {selectedItemType}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate hover:text-foreground transition-colors cursor-pointer group" title="View Item">
                      Regarding: <span className="font-medium group-hover:underline">{selectedChat.claim.item.title}</span>
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground">
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" />
                        Request contact info
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Report user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth"
              >
                <div className="text-center text-xs text-muted-foreground border-b pb-4 mb-4 max-w-sm mx-auto">
                  <p className="font-medium text-foreground mb-1">Chat securely</p>
                  <p>Do not share passwords or sensitive personal information. Meet in public, well-lit areas for exchanges.</p>
                </div>

                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <MessageSquare className="h-10 w-10 mb-2" />
                    <p className="text-sm">No messages here yet.</p>
                    <p className="text-xs">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const mine = msg.senderId === me.id;
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showAvatar = !mine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                    
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${mine ? "ml-auto flex-row-reverse" : ""}`}
                      >
                        {!mine && (
                          <div className="shrink-0 w-8 flex flex-col justify-end">
                            {showAvatar ? (
                              <Avatar className="h-8 w-8 border shadow-sm">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                  {getOtherParticipant(selectedChat).name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className="w-8" />
                            )}
                          </div>
                        )}
                        
                        <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                          <div
                            className={`px-4 py-2.5 text-sm shadow-sm ${
                              mine
                                ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                                : "bg-card border text-card-foreground rounded-2xl rounded-tl-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-background border-t shrink-0">
                <form 
                  onSubmit={(e) => { e.preventDefault(); send(); }}
                  className="flex gap-2 max-w-4xl mx-auto"
                >
                  <Input
                    className="flex-1 bg-muted/50 border-transparent focus-visible:bg-background shadow-none rounded-full px-4"
                    placeholder="Type your message..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    disabled={sending}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="rounded-full shrink-0 shadow-md h-10 w-10" 
                    disabled={!draft.trim() || sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-medium text-foreground">Your Messages</p>
              <p className="text-sm">Select a chat from the sidebar to view.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
