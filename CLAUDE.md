# Coding Guidelines — moi-quand_v3

These rules apply to every agent (Cody, Claude, etc.) working on this codebase.

## Golden Rule: Always Build Before Pushing

```bash
npm run build
```

Run this **before every `git push`**. Vercel runs the exact same command. If it fails locally, it will fail on Vercel. Never push without a passing build.

## Supabase Client: Never Create Inline

**Wrong** (causes build failures — env vars don't exist at build time):
```ts
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**Correct** — use the shared helpers:
```ts
// Server-side (API routes, lib files that run on server)
import { supabaseAdmin } from '@/lib/supabase-server'

// Client-side (components, pages with "use client")
import { supabase } from '@/lib/supabase'
```

Never instantiate `createClient` directly in route files or lib files. If you need a new Supabase client flavor (e.g., with different auth options), add it to `lib/supabase-server.ts`.

## Environment Variables: Never Use `!` at Module Top-Level

**Wrong:**
```ts
const client = new SomeSDK(process.env.API_KEY!)
```

**Correct:**
```ts
const client = new SomeSDK(process.env.API_KEY || 'placeholder')
```

Next.js evaluates top-level module code at build time for static page collection. If an env var is missing, the build crashes. Always provide a fallback. The real values are injected by Vercel at runtime.

This applies to: Supabase, Resend, PayPal, Zoom, Google APIs, and any SDK initialized with an env var.

## DRY: Don't Repeat Yourself

If you find yourself copying the same code into 3+ files, extract it into a shared helper in `lib/`. Current shared helpers:
- `lib/supabase.ts` — browser Supabase client
- `lib/supabase-server.ts` — server Supabase client (admin)
- `lib/email.ts` — Resend email service
- `lib/availability.ts` — availability logic
- `lib/booking-sync.ts` — booking sync
- `lib/google-calendar.ts` — Google Calendar integration
- `lib/zoom.ts` — Zoom integration
- `lib/auth.ts` — authentication helpers

## TypeScript: Prefer `satisfies` Over `as` for Type Narrowing

**Fragile:**
```ts
type: (condition ? "booking" : "payment") as "booking" | "payment"
```

**Better:**
```ts
type: (condition ? "booking" : "payment") satisfies Notification["type"]
```

`satisfies` validates the value against the type. `as` just silences the compiler — it won't catch mistakes.

## Project Structure

```
app/
  [slug]/          — Public therapist booking pages
  api/             — API routes (Next.js Route Handlers)
  book/            — Booking flow pages
  cancel/          — Cancellation flow pages
  dashboard/       — Therapist dashboard (protected)
  login/           — Auth pages
components/        — Shared React components
lib/               — Shared server/client utilities
supabase/          — Database migrations and types
scripts/           — Build/deploy scripts
```

## Deployment (Vercel)

- Deploys automatically on every push to `main`
- Build command: `next build`
- Env vars are configured in Vercel dashboard (not in the repo)
- There is no `vercel.json` — defaults are used
- If a deploy fails, check the Vercel build logs — 99% of the time it's a missing env var fallback or a TypeScript error

## Git Workflow

- Always work on `main` (no feature branches for now)
- Commit messages: use conventional format (`fix:`, `feat:`, `chore:`)
- Pull before pushing if working with multiple agents: `git pull --rebase`
- If a rebase conflicts and you can't resolve it cleanly, stop and ask
