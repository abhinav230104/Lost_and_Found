export type ItemType = "lost" | "found";
export type ItemStatus = "OPEN" | "CLOSED";
export type ClaimStatus = "pending" | "approved" | "rejected";
export type NotificationType =
  | "claim_submitted"
  | "claim_approved"
  | "claim_rejected"
  | "new_message"
  | "item_closed";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface ClaimUser {
  id: string;
  name: string;
  email?: string;
}

export interface Claim {
  id: string;
  message?: string | null;
  status: ClaimStatus;
  itemId: string;
  userId: string;
  user?: ClaimUser;
  chat?: { id: string } | null;
  createdAt: string;
}

export interface Item {
  id: string;
  title: string;
  description: string;
  type: ItemType;
  location: string;
  date: string;
  imageUrl?: string | null;
  status: ItemStatus;
  userId: string;
  user?: User;
  claims?: Claim[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  sender: Pick<User, "id" | "name">;
  createdAt: string;
}

export interface ChatListItem {
  id: string;
  claim: {
    id: string;
    status: ClaimStatus;
    userId: string;
    item: { id: string; title: string; userId: string; user?: { name: string } };
    user?: { name: string };
  };
  messages: Array<{ id: string; createdAt: string; senderId: string; content: string }>;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  relatedItemId?: string | null;
  relatedClaimId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardPayload {
  myItems: Item[];
  myClaims: Array<Claim & { item: Item }>;
  claimsOnMyItems: Array<Claim & { item: Item; user: ClaimUser }>;
}

export interface PaginatedResult<T> {
  total: number;
  count: number;
  offset: number;
  limit: number;
  hasMore?: boolean;
  items?: T[];
  users?: T[];
}
