# Profile Modal — Design Spec
**Date:** 2026-03-31
**Status:** Approved

---

## Overview

Add a profile modal accessible from the sidebar footer. Users can view and edit their name and email, and change their password. The modal overlays the chat page without any route change.

---

## UI / Layout

### Trigger
A profile icon button added to the sidebar footer, sitting between the theme toggle and the logout button. Clicking it opens the modal.

### Modal Structure
- Centered overlay with a dark backdrop (`bg-black/60 backdrop-blur-sm`)
- Card: `max-w-md`, rounded-2xl, dark gradient background (`from-[#2a2a2a] to-[#252525]`), `border border-white/10`, shadow
- Close button (×) top-right corner; also closes on backdrop click
- Avatar circle at the top showing the user's initial (gradient purple→pink, same as sidebar)
- Name and "Joined [Month Year]" subtitle below the avatar (derived from `user.createdAt` which is added to all auth user payloads — see Backend section)
- Two tabs: **Profile** and **Password**, purple underline on active tab

### Tab 1 — Profile
Fields:
- **Full Name** — editable text input
- **Email Address** — editable text input with async duplicate check on blur

Email validation states (shown as a small coloured dot + text below the email field):
- **Checking…** (amber) — debounced 400ms after user stops typing, fires `GET /api/auth/check-email?email=...`
- **Email available** (green) — returned when no other account owns that address
- **Already in use** (red) — returned when another account owns that address; Save is disabled
- No indicator shown when email is unchanged from current

Save button: `gradient purple→pink`, disabled while checking or if email is taken. On success, updates Zustand `authStore` with the new name/email.

### Tab 2 — Password
Fields:
- **Current Password** — required, validated server-side
- **New Password** — min 8 chars, shows the same 4-segment strength meter from RegisterPage
- **Confirm New Password** — must match new password (client-side check)

Update button: same gradient style. Disabled while submitting. On success, shows a brief green success message inside the modal ("Password updated") and clears all three fields.

---

## Backend

### `createdAt` in User Payloads
All handlers that return a user object (`register`, `login`, `getMe`, `updateProfile`) must include `createdAt` in the payload: `{ id, name, email, createdAt }`. The `createdAt` field is already present on the Mongoose model via `{ timestamps: true }`.

### New Endpoints (added to `server/routes/auth.js`)

#### `GET /api/auth/check-email`
- Protected: requires `requireAuth`; uses `authLimiter`
- Query param: `email`
- Returns `{ available: true }` if no other user owns that email, `{ available: false }` otherwise
- Excludes the requesting user's own email from the check

#### `PUT /api/auth/profile`
- Protected: requires `requireAuth`; uses `authLimiter`
- Body: `{ name?, email? }` — Zod schema, both optional but at least one required
- If email is changing, re-checks uniqueness before saving (server-side guard)
- Returns `{ user: { id, name, email } }` on success
- Errors: `409` if email taken, `400` for validation failures

#### `PUT /api/auth/password`
- Protected: requires `requireAuth`; uses `authLimiter`
- Body: `{ currentPassword, newPassword }` — Zod schema, newPassword min 8 chars
- Fetches user with `+password`, bcrypt-compares `currentPassword`
- Returns `401 { error: 'Current password is incorrect' }` on mismatch
- On success: hashes new password, saves, returns `{ ok: true }`

---

## Frontend — New / Modified Files

| File | Change |
|------|--------|
| `client/src/pages/ProfileModal.jsx` | New — the full modal component |
| `client/src/api/auth.js` | Add `checkEmail`, `updateProfile`, `updatePassword` calls |
| `client/src/components/layout/Sidebar.jsx` | Add profile button in footer; pass `onOpenProfile` prop from ChatPage |
| `client/src/pages/ChatPage.jsx` | Add `profileOpen` state; render `<ProfileModal>` |
| `server/controllers/authController.js` | Add `checkEmail`, `updateProfile`, `updatePassword` handlers |
| `server/routes/auth.js` | Register the three new routes |

---

## State & Data Flow

1. User clicks profile button in sidebar → `setProfileOpen(true)` in ChatPage
2. `ProfileModal` mounts, pre-fills name and email from `useAuthStore().user`
3. **Profile save**: `PUT /api/auth/profile` → on success call `setUser(updatedUser)` to sync Zustand + sidebar display
4. **Password update**: `PUT /api/auth/password` → on success clear fields + show inline success message
5. Closing the modal resets any unsaved form state

---

## Validation Summary

| Rule | Where enforced |
|------|---------------|
| Name 1–50 chars | Client (Zod) + Server (Zod) |
| Valid email format | Client (Zod) + Server (Zod) |
| Email uniqueness | Client (check-email endpoint, debounced) + Server (PUT /profile) |
| New password min 8 chars | Client (Zod) + Server (Zod) |
| Confirm matches new password | Client only |
| Current password correct | Server only |

---

## Error Handling

- Network errors on save show a red inline message below the submit button (same pattern as LoginPage `errors.root`)
- Rate limiter already covers all `/api/auth/*` routes via `authLimiter`
- Modal stays open on error so the user can correct and retry

---

## Out of Scope
- Profile photo upload
- Email change confirmation flow (no email verification step)
- Account deletion
