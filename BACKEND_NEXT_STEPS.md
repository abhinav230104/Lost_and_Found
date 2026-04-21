# Backend Next Steps for Lost and Found

## 1. Fixes and stability improvements

- Validate environment variables on startup:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `EMAIL_USER`
  - `EMAIL_PASS`
- Harden OTP flow:
  - increase expiry from 60 seconds to 5-10 minutes
  - add rate limiting or cooldown for OTP requests per email
  - add resend protection and a maximum number of OTP attempts
  - delete expired OTP records automatically or periodically
- Improve token handling:
  - return a consistent 401 response when JWT is invalid or missing
  - prevent `verifyToken` from throwing by handling `JWT_SECRET` absence
  - in production, set `secure: true` on auth cookies
- Improve error handling:
  - add explicit error logging and structured response shapes
  - handle mail sending failures inside `sendOTP()` and report them cleanly
  - wrap critical multi-step actions in transactions where needed
- Prevent duplicate user creation on OTP verification:
  - verify user email still does not exist before creating the account
  - ensure OTP cleanup happens even if user creation fails
- Validate and sanitize inputs more strictly, especially for text fields and dates.

## 2. Security and auth improvements

- Add logout route to clear the JWT cookie.
- Add user profile update route.
- Add refresh-token support optionally if you want longer sessions.
- Add authorization checks for all protected routes uniformly.
- Avoid exposing internal user fields or password hashes in API responses.

## 3. Recommended new routes

- `GET /api/items/[id]`
  - fetch full item details, owner metadata, and claim/chat status
- `GET /api/claims`
  - fetch current user claims with item and status
- `GET /api/chats`
  - fetch all chats for the logged-in user
- `GET /api/chats/[id]`
  - fetch chat details and linked claim/item metadata
- `POST /api/user/profile`
  - allow a user to update their name or email
- `PATCH /api/items/[id]`
  - allow item owners to edit item details before the item is closed
- `DELETE /api/items/[id]`
  - allow item owners to remove items they posted
- `GET /api/items?userId=` or `GET /api/user/items`
  - optional filtering endpoints for items belonging to a user

## 4. Feature improvements for backend capabilities

- Add pagination support to `GET /api/items`
- Add advanced search by item `description`, `location`, and user name
- Add item status filtering by `OPEN` / `CLOSED`
- Add item image upload support via a dedicated upload route or third-party storage
- Add notification support for claim status changes and new chat messages
- Add `status` updates to item claims and allow item owners to manually close an item when claim is resolved
- Add a `chat` creation route if the flow should allow manual chat creation separate from claim approval

## 5. Data model and business logic improvements

- Add soft delete or archival support for items and claims if data should be preserved
- Add `lastMessageAt` or `updatedAt` fields to chats for ordering recent conversations
- Consider adding a `userRole` field if admins or moderators are needed later
- Add `phoneNumber` or additional contact fields if required for item reunification
- Consider splitting OTP storage into a separate `Verification` model with type support for email and password resets

## 6. Testing and validation

- Test all routes with authenticated and unauthenticated users.
- Verify claim approval flow and chat access logic.
- Test item creation and filters with invalid and edge-case input.
- Validate that chat messages are only accessible to the item owner and claimant.
- Test auth cookie behavior in both dev and production profile.
- Add API tests if the project expands, or use Postman/Insomnia collections for backend regression checks.

## 7. Optional backend polish

- Add request logging middleware or route-level logs.
- Add health check route like `GET /api/health`.
- Add CORS settings if frontend and backend deploy separately.
- Add rate limiting for high-volume endpoints such as login and OTP.
- Add response caching for public item listings if performance becomes an issue.
