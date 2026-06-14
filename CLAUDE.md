# Afshaar CRM

Internal CRM for managing vendor/seller accounts on the Afshaar marketplace platform.
Admins review store applications, confirm or reject vendors, and manage account status.

## Tech Stack

- **Framework**: Next.js 15 (App Router, React 19)
- **Language**: TypeScript (strict)
- **Database**: Supabase (PostgreSQL) — server-side only via service role key
- **Auth**: Custom JWT stored in httpOnly cookies — NOT Supabase Auth
- **UI**: MUI v7 + Emotion + Tailwind CSS v4
- **State**: Zustand (auth store) + React useState (forms/UI)
- **Validation**: Zod (all API routes)
- **Password hashing**: bcryptjs (cost 12)

## Project Structure

```
src/
  app/
    (auth)/login/            # Public login page
    (dashboard)/             # Protected: layout guards all dashboard pages
      dashboard/             # Stats overview + recent pending vendors
      vendors/               # Vendor list + actions (confirm/disable/reject/delete)
      admins/                # Admin user management (super_admin only)
      audit/                 # Audit log viewer (super_admin only)
    api/
      auth/login|logout|me/
      vendors/               # GET list, PATCH status, DELETE
      admins/                # GET list, POST create, PATCH update, DELETE
      audit/                 # GET paginated log (super_admin only)
      dashboard/stats/       # Vendor counts + recent pending
  components/
    Layout/                  # Dashboard shell (sidebar + header + main)
    Sidebar/                 # Navigation sidebar
    Header/                  # Top bar with user menu + logout
    PageHeader/              # Breadcrumbs + title + action slot
    Dashboard/StatsCard/     # Stat metric card
    shared/
      ConfirmDialog/         # Reusable confirmation dialog
      LoadingSpinner/        # Full-screen and inline loading
    Providers/               # MUI ThemeProvider
  lib/
    supabase/server.ts       # createServerClient() — service role, server-side only
    auth/session.ts          # signToken, verifyToken, getCookieOptions
    auth/rateLimit.ts        # In-memory rate limiting (5 attempts / 15 min, 30 min lockout)
    types/index.ts           # Shared TypeScript interfaces
    helpers/index.ts         # formatDate, vendorStatusColor, vendorStatusLabel
    helpers/audit.ts         # logAudit() — writes to audit_logs table
  stores/
    authStore.ts             # Zustand: current admin, login/logout
  theme/
    mui.ts                   # MUI theme (teal primary, slate bg)
  middleware.ts              # JWT verification on all non-public routes
```

## Database Tables

### admins
CRM admin accounts. Passwords stored as bcrypt hashes (cost 12).
Role: `admin` | `super_admin` — only super_admin can manage other admins.

### vendors
Store/seller accounts submitted externally and managed through this CRM.
Status flow: `pending` → `active` (confirm) | `rejected`
             `active` ↔ `disabled` (toggle)
- `confirmed_by` + `confirmed_at` — set on first confirmation from pending → active
- `rejection_reason` — set when status = 'rejected'

### audit_logs
Every CREATE/UPDATE/DELETE/LOGIN/LOGOUT writes a row.
- `admin_id` FK → admins.id (who performed the action)
- Captures `old_values`, `new_values`, `ip_address`, `user_agent`

## Security

- httpOnly + Secure + SameSite=Strict cookies (`afshaar_token`)
- JWT expires in 8 hours
- Rate limiting: 5 failed login attempts → 30-min lockout per IP
- Middleware verifies JWT on every request; injects `x-user-id`, `x-user-username`, `x-user-role` headers
- All mutations validated with Zod schemas
- Passwords hashed with bcrypt cost 12
- Security headers on all responses (X-Frame-Options DENY, nosniff, etc.)
- Self-protection: admins cannot disable/delete their own account
- Guard: cannot disable/delete the last super_admin

## API Conventions

- All API routes under `src/app/api/`
- Auth headers injected by middleware: `x-user-id`, `x-user-username`, `x-user-role`
- Responses: `{ data: T }` for success, `{ error: string }` for errors
- Paginated: `{ data: T[], total, page, pageSize }`
- Super admin guard: `requireSuperAdmin()` helper returns 403 if role !== 'super_admin'

## Component Conventions

- Each component: `ComponentName/index.tsx`
- Styles via MUI `sx` prop objects
- Pages: `'use client'` + React hooks, fetch via API routes
- Forms: controlled components with local useState, validated before POST
- `'use client'` only on components that use hooks or browser APIs

## Vendor Actions by Status

| Status   | Available Actions         |
|----------|---------------------------|
| pending  | Confirm, Reject, Delete   |
| active   | Disable, Delete           |
| disabled | Enable, Delete            |
| rejected | Delete                    |

## Running Locally

```bash
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and JWT_SECRET
npm install
# Run migrations in Supabase SQL editor: supabase/migrations/001_initial.sql
# Run seed: supabase/seed.sql
npm run dev
```

Default login: username `admin`, password `Admin@1234` (change on first login).
