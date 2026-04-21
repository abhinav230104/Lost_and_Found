# Frontend Integration Guide

## 🎯 Quick Start

The backend is fully implemented with **31+ REST endpoints** + **Socket.io real-time support**.

---

## 📱 Core Integration Steps

### 1. Authentication Flow

```typescript
// 1. Signup (get OTP)
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@nitj.ac.in',
    name: 'John Doe',
    password: 'password123'
  }),
  credentials: 'include', // Important: for cookies
});

// 2. Verify OTP
const verifyResponse = await fetch('/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@nitj.ac.in',
    otp: '123456'
  }),
  credentials: 'include',
});

// 3. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@nitj.ac.in',
    password: 'password123'
  }),
  credentials: 'include',
});
```

**All subsequent requests must include `credentials: 'include'` for JWT cookie.**

---

### 2. Real-Time Notifications

```typescript
'use client';

import { useSocket, onNewNotification } from '@/lib/useSocket';
import { useEffect } from 'react';

export function NotificationPanel() {
  const { socket, isConnected } = useSocket(userId);

  useEffect(() => {
    if (!isConnected) return;

    onNewNotification((notification) => {
      console.log('New notification:', notification);
      // Update UI with notification
      // notification = {
      //   id, type, title, message, read, createdAt, ...
      // }
    });
  }, [isConnected]);

  return (
    <div>
      {isConnected ? 'Connected' : 'Connecting...'}
    </div>
  );
}
```

---

### 3. Item Creation

```typescript
const createItem = async (data) => {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Lost Wallet',
      description: 'Black leather wallet with cards',
      type: 'lost', // or 'found'
      location: 'Campus Gate A',
      date: new Date().toISOString(),
      imageUrl: 'https://...' // From image upload endpoint
    }),
    credentials: 'include',
  });

  const item = await response.json();
  return item;
};
```

---

### 4. Image Upload

```typescript
const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/image', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  const { url } = await response.json();
  return url; // Use in item creation
};
```

---

### 5. Real-Time Chat

```typescript
'use client';

import { useSocket, joinChat, leaveChat, sendMessage, onNewMessage } from '@/lib/useSocket';
import { useEffect } from 'react';

export function ChatView({ chatId, userId }) {
  const { socket, isConnected } = useSocket(userId);

  useEffect(() => {
    if (!isConnected) return;

    joinChat(chatId, userId);

    onNewMessage((message) => {
      // message = { messageId, senderId, content, timestamp }
      addMessageToUI(message);
    });

    return () => leaveChat(chatId, userId);
  }, [chatId, isConnected, userId]);

  const handleSendMessage = (content: string) => {
    // First send via REST API
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, content }),
      credentials: 'include',
    });
    
    // Socket.io will emit automatically on POST /api/messages
  };

  return (
    <div>
      {/* Chat UI */}
    </div>
  );
}
```

---

### 6. Notifications Panel

```typescript
'use client';

import { useEffect, useState } from 'react';

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Fetch notifications on mount
    fetch('/api/notifications?unread=true', {
      credentials: 'include',
    })
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      });
  }, []);

  const markAsRead = async (notificationId: string) => {
    await fetch(`/api/notifications/${notificationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read: true }),
      credentials: 'include',
    });
  };

  const markAllAsRead = async () => {
    await fetch('/api/notifications/mark-read', {
      method: 'PATCH',
      credentials: 'include',
    });
    setUnreadCount(0);
  };

  return (
    <div>
      <button onClick={markAllAsRead}>Mark All Read</button>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
          {!notif.read && <span className="badge">New</span>}
        </div>
      ))}
    </div>
  );
}
```

---

### 7. Search & Discovery

```typescript
// Search items
const searchItems = async (query: string, filters: any) => {
  const params = new URLSearchParams({
    q: query,
    limit: '20',
    offset: '0',
    ...filters, // location, type, status, dateFrom, dateTo
  });

  const response = await fetch(`/api/items?${params}`, {
    credentials: 'include',
  });

  return response.json(); // { total, items, count, offset, limit, hasMore }
};

// Trending items
const getTrendingItems = async () => {
  const response = await fetch('/api/items/trending', {
    credentials: 'include',
  });
  return response.json(); // Sorted by claims count
};

// Resolved items
const getResolvedItems = async () => {
  const response = await fetch('/api/items/resolved', {
    credentials: 'include',
  });
  return response.json(); // Recently closed items
};

// Search users
const searchUsers = async (query: string) => {
  const response = await fetch(`/api/search/users?q=${query}`, {
    credentials: 'include',
  });
  return response.json(); // { users: [...], total, ... }
};
```

---

### 8. Claims & Approval

```typescript
// Submit claim
const submitClaim = async (itemId: string, message: string) => {
  const response = await fetch('/api/claims', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId, message }),
    credentials: 'include',
  });
  return response.json();
};

// Get user's claims
const getMyClaimsj = async () => {
  const response = await fetch('/api/claims/all', {
    credentials: 'include',
  });
  return response.json();
};

// Approve claim (item owner only)
const approveClaim = async (claimId: string) => {
  const response = await fetch(`/api/claims/${claimId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
    credentials: 'include',
  });
  return response.json();
};

// Reject claim (item owner only)
const rejectClaim = async (claimId: string) => {
  const response = await fetch(`/api/claims/${claimId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected' }),
    credentials: 'include',
  });
  return response.json();
};
```

---

### 9. User Dashboard

```typescript
// Get current user
const getCurrentUser = async () => {
  const response = await fetch('/api/user/me', {
    credentials: 'include',
  });
  return response.json(); // { id, email, name }
};

// Get user dashboard (with stats)
const getDashboard = async () => {
  const response = await fetch('/api/user/dashboard', {
    credentials: 'include',
  });
  return response.json(); // { userItems, incomingClaims, outgoingClaims }
};

// Get platform stats
const getStats = async () => {
  const response = await fetch('/api/stats', {
    credentials: 'include',
  });
  return response.json(); // { platform: {...}, user: {...} }
};
```

---

## 🚨 Important Notes

### Credentials & Cookies
All requests to protected endpoints **must include `credentials: 'include'`** for the JWT cookie to be sent.

```typescript
// ❌ WRONG - Will fail with 401
fetch('/api/items', { method: 'POST', body: JSON.stringify(...) })

// ✅ CORRECT
fetch('/api/items', { 
  method: 'POST', 
  body: JSON.stringify(...),
  credentials: 'include'  // Must include this!
})
```

---

### Rate Limiting
Requests will be rate-limited by IP:
- Auth endpoints: 10 req/15 min
- Upload: 20 req/15 min
- Others: 100 req/15 min

If you hit the limit, the API will return `429 Too Many Requests` with a `Retry-After` header.

---

### Socket.io Connection
The Socket.io client should be initialized once in the root layout/app component, not per page.

```typescript
// ✅ In root layout
export default function Layout() {
  const { socket, isConnected } = useSocket(userId);
  
  return (
    <>
      {/* App content */}
    </>
  );
}
```

---

### Environment Setup
Frontend needs these environment variables:

```env
NEXT_PUBLIC_URL=http://localhost:3000  # For Socket.io CORS
```

---

## 📊 Data Models

### Item
```typescript
{
  id: string;
  title: string;
  description: string;
  type: 'lost' | 'found';
  location: string;
  date: Date;
  imageUrl?: string;
  status: 'OPEN' | 'CLOSED';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { claims: number };
}
```

### Claim
```typescript
{
  id: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  itemId: string;
  userId: string;
  createdAt: Date;
  chat?: { id: string; claimId: string };
}
```

### Message
```typescript
{
  id: string;
  content: string;
  chatId: string;
  senderId: string;
  sender: { id: string; name: string };
  createdAt: Date;
}
```

### Notification
```typescript
{
  id: string;
  type: 'claim_submitted' | 'claim_approved' | 'claim_rejected' | 'new_message' | 'item_closed';
  title: string;
  message: string;
  read: boolean;
  userId: string;
  relatedItemId?: string;
  relatedClaimId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔗 Useful Links

- **Full API Docs**: See `BACKEND_COMPLETE.md`
- **Features List**: See `FEATURES.md`
- **Schema**: See `prisma/schema.prisma`

---

## 🆘 Troubleshooting

### 401 Unauthorized on protected routes
- Check that `credentials: 'include'` is set
- Verify JWT cookie was set after login
- Check if token is expired (7-day expiry)

### 429 Too Many Requests
- Wait for the `Retry-After` header duration
- Implement exponential backoff in client

### Socket.io not connecting
- Verify `NEXT_PUBLIC_URL` is set correctly
- Check browser console for connection errors
- Ensure Socket.io server is running

### Notifications not appearing
- Verify user is logged in and socket connected
- Check `/api/notifications` endpoint returns data
- Verify notification was triggered (check logs)

---

**Backend is production-ready!** 🚀
