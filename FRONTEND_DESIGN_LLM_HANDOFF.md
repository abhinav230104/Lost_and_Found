# Lost & Found Frontend Design Handoff (LLM-Ready)

## 1) Product Summary

This is a campus Lost & Found platform (NITJ email-only auth) with:
- item posting (`lost`/`found`)
- item discovery and filtering
- claim workflow (claimant + item owner approval/rejection)
- 1:1 chat after claim approval
- in-app notifications
- profile, dashboard, and personal stats

Backend is already rich (31+ endpoints). Frontend is currently minimal and mostly proof-of-concept.

---

## 2) Current Frontend Reality (Important)

### Existing UI files
- `app/page.tsx` -> renders `Chat` only, with a **hardcoded chatId**
- `app/dashboard/page.tsx` -> basic unstyled dashboard with raw fetch and `any` types
- `components/Chat.tsx` -> basic chat UI, no design system
- `components/TestSocket.tsx` -> debug socket component
- `app/globals.css` -> Tailwind v4 import + simple light/dark CSS vars
- `app/layout.tsx` -> Geist font setup, default metadata still "Create Next App"

### Key architecture gap
The project has two different real-time approaches:
1. `components/Chat.tsx` + `server/index.js` use events like `join_chat`, `send_message`, `receive_message` on `http://localhost:4000`.
2. `lib/useSocket.ts` + `lib/socket.ts` use events like `join-chat`, `message-sent`, `new-message`, and notification rooms.

These are not aligned and should be unified before final frontend buildout.

---

## 3) Tech Stack + Constraints for Design

- Next.js `16.2.3` (App Router)
- React `19.2.4`
- Tailwind CSS `v4`
- TypeScript strict mode (`strict: true`)
- Auth via JWT in HTTP-only cookie (`token`)
- Most protected API calls require `credentials: "include"`
- Rate limiting:
  - auth: `10 / 15 min`
  - upload: `20 / 15 min`
  - default: `100 / 15 min`

Design implication: UX must include polished states for `401`, `403`, `404`, `429`, and `500`.

---

## 4) Domain Data Model (Frontend Mental Model)

## User
- `id`, `name`, `email`, `createdAt`

## Item
- `id`, `title`, `description`, `type` (`lost | found`), `location`, `date`
- `imageUrl?`, `status` (`OPEN | CLOSED`), `userId`, `createdAt`, `updatedAt`

## Claim
- `id`, `message?`, `status` (`pending | approved | rejected`)
- `itemId`, `userId`, `createdAt`
- optional `chat`

## Chat / Message
- chat belongs to exactly one claim (`claimId` unique)
- message: `id`, `content`, `chatId`, `senderId`, `createdAt`

## Notification
- `id`, `type` (`claim_submitted | claim_approved | claim_rejected | new_message | item_closed`)
- `title`, `message`, `read`, `userId`
- `relatedItemId?`, `relatedClaimId?`, `createdAt`, `updatedAt`

---

## 5) Recommended Frontend IA (Information Architecture)

1. Public
   - `/` Home + search feed
   - `/item/[id]` Item detail + claim CTA
   - auth pages: `/login`, `/signup`, `/verify-otp`
2. Protected user area
   - `/dashboard` overview
   - `/my-items`
   - `/my-claims`
   - `/chats`
   - `/notifications`
   - `/profile`
3. Shared layout shell
   - top nav + search + notification bell + user menu
   - responsive left rail on desktop, bottom nav on mobile

---

## 6) Backend API Contracts Needed by Frontend

## Auth
- `POST /api/auth/signup` -> `{ email, name, password }`
- `POST /api/auth/verify-otp` -> `{ email, otp }`
- `POST /api/auth/login` -> `{ email, password }` (sets cookie)
- `POST /api/auth/logout`

## User
- `GET /api/user/me`
- `PATCH /api/user/profile` -> `{ name?, email? }`
- `GET /api/user/dashboard`
- `GET /api/user/items?status=&limit=&offset=`

## Items
- `GET /api/items?type=&query=&location=&from=&to=&status=&limit=&offset=`
- `POST /api/items` -> `{ title, description, type, location, date, imageUrl? }`
- `GET /api/items/[id]`
- `PATCH /api/items/[id]` -> editable fields
- `DELETE /api/items/[id]`
- `PATCH /api/items/[id]/status` -> `{ status: "OPEN" | "CLOSED" }`
- `GET /api/items/[id]/claims` (owner-only)
- `GET /api/items/trending?days=&limit=`
- `GET /api/items/resolved?limit=`

## Claims
- `POST /api/claims` -> `{ itemId, message? }`
- `GET /api/claims/all`
- `PATCH /api/claims/[id]` -> `{ status: "approved" | "rejected" }`

## Chat/Messages
- `GET /api/chats/all`
- `GET /api/chats/[id]` (note: `[id]` is treated as `claimId`)
- `POST /api/messages` -> `{ chatId, content }`
- `GET /api/messages?chatId=...`

## Notifications
- `GET /api/notifications?unread=true|false`
- `PATCH /api/notifications/[id]` -> `{ read?: boolean }`
- `DELETE /api/notifications/[id]`
- `PATCH /api/notifications/mark-read`

## Other
- `GET /api/search/users?name=&limit=&offset=`
- `POST /api/upload/image` (multipart, key: `file`)
- `GET /api/stats`
- `GET /api/health`

---

## 7) Critical UX Flows to Design

1. **Signup + OTP**
   - stepper flow: account form -> OTP verify -> login success
   - strict email pattern: `@nitj.ac.in`

2. **Item lifecycle**
   - create/edit item while `OPEN`
   - close item manually
   - show resolved state and archive style when `CLOSED`

3. **Claim workflow**
   - claimant submits claim
   - owner sees incoming claims, approves/rejects
   - on approval: other claims auto-rejected, chat becomes available

4. **Chat**
   - chat list with last message timestamp
   - threaded messages + sender grouping
   - optimistic send + failure retry

5. **Notifications**
   - dropdown + dedicated page
   - unread badge count
   - mark-one, mark-all, delete

6. **Search and discovery**
   - filters: type, status, date range, query, location
   - trending and recently resolved sections

---

## 8) Design System Requirements (Because Current UI Is Bare)

- Build a clear token system:
  - color roles: bg/surface/text/muted/primary/success/warning/error
  - spacing scale (4px base)
  - radius scale and elevation tokens
  - typography scale mapped to Geist sans
- Components to standardize:
  - button, input, select, textarea, badge, card
  - modal/drawer, tabs, toast, skeleton, empty states
  - table/list row patterns for dashboard data
- Accessibility baseline:
  - keyboard nav, focus ring consistency, color contrast
  - semantic landmarks and ARIA for chat + notifications
- Mobile-first:
  - feed cards, sticky action buttons, compact filters

---

## 9) Error/State Matrix Frontend Must Handle

- `401` -> redirect/login modal + preserve return path
- `403` -> permission message ("Not allowed")
- `404` -> missing item/chat/notification fallback page
- `429` -> retry UX using `Retry-After` header
- `500` -> non-destructive error surface + retry CTA
- Empty states:
  - no items, no claims, no chats, no notifications, no search results

---

## 10) Real-Time Integration Decision (Must Choose One)

Current codebase has inconsistent socket event naming and connection origins.

Recommended direction:
- Standardize on `lib/useSocket.ts` + `lib/socket.ts` naming:
  - `join-user-room`, `join-chat`, `leave-chat`
  - `new-message`, `new-notification`
  - typing events
- Remove legacy `join_chat/send_message/receive_message` API from frontend components.

---

## 11) Frontend Implementation Priorities

1. Foundation: app shell, route map, auth guard, API client wrapper (`credentials: include` by default).
2. Item discovery + detail + create flow.
3. Claim actions + owner moderation surfaces.
4. Chat list + chat room UX.
5. Notifications UX + live updates.
6. Profile/settings + stats polish.
7. Performance pass (pagination, suspense/loading boundaries, skeletons).

---

## 12) Known Gaps You Should Assume While Designing

- No finalized visual identity/branding yet.
- Metadata/title still default boilerplate.
- Current pages are not production UI quality.
- Upload endpoint returns mock URL (`/uploads/...`) and not real cloud CDN.
- Some docs mention query param `q`; code actually uses `query` for item search and `name` for user search.

---

## 13) Prompt Starter for Another LLM (Copy-Paste)

Use this instruction:

"Design and implement a complete production-grade frontend for this Next.js lost-and-found app. Keep existing backend routes unchanged. Build responsive, accessible UI with a cohesive design system, robust loading/error/empty states, and full flows for auth (OTP), item search/posting, claim approval, chat, notifications, dashboard, and profile. Default all protected fetch calls to include credentials. Use the API contracts and domain model from `FRONTEND_DESIGN_LLM_HANDOFF.md` as source of truth."

