# NeuroHome — App Scaffold

Next.js 15 + React 19 + Supabase + GHL integration scaffold for the NeuroHome family dashboard. Implements the Phase 1 (Family view) target from `NeuroHome_Data_Mapping_Spec.md`.

## What's in the box

- ✅ Magic-link authentication (Supabase Auth)
- ✅ Protected app shell with topbar (matches v6 mockup)
- ✅ Dashboard server component with real Supabase queries
- ✅ Composite API endpoint pattern (`/api/family/dashboard`)
- ✅ GHL webhook receiver with HMAC verification
- ✅ One example component port (NextSessionCard)
- ✅ Brand tokens (CSS variables) from the live `neurohome.css`
- ✅ TypeScript strict mode, App Router, CSS Modules

## Prerequisites

**Before you write a line of code — these are HARD gates:**

- [ ] Supabase project on Pro plan (HIPAA requires Pro+)
- [ ] Supabase BAA signed
- [ ] GHL HIPAA add-on activated + BAA signed
- [ ] GHL sub-account dedicated to NeuroHome-Clinical (don't mix with marketing)
- [ ] `supabase_schema.sql` applied to the Supabase DB
- [ ] Magic link auth enabled in Supabase dashboard
- [ ] Resend (or other email provider) verified for Supabase outbound

Skip any of these and you have a HIPAA violation, not a bug.

## Setup

```bash
# 1. Install
npm install

# 2. Copy env template, fill in
cp .env.local.example .env.local
# Edit .env.local with your real Supabase + GHL keys

# 3. Generate types from your Supabase project
npx supabase gen types typescript --project-id <your-id> > lib/types/database.ts

# 4. Run locally
npm run dev
```

Visit http://localhost:3000 → redirects to `/login` → enter email → check inbox → magic link → `/dashboard`.

## File structure

```
neurohome-app/
├── README.md                          ← you are here
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env.local.example                 ← env var template (never commit .env.local)
├── .gitignore
├── middleware.ts                      ← refreshes Supabase session every request
│
├── app/
│   ├── layout.tsx                     ← root layout, font loading
│   ├── page.tsx                       ← redirects: signed in → /dashboard, else → /login
│   ├── globals.css                    ← resets + fonts
│   │
│   ├── login/page.tsx                 ← magic-link form
│   ├── auth/callback/route.ts         ← exchange code for session
│   │
│   ├── (app)/                         ← authed routes (layout enforces auth)
│   │   ├── layout.tsx                 ← Topbar + auth check
│   │   └── dashboard/page.tsx         ← Family dashboard (server component)
│   │
│   └── api/
│       ├── family/dashboard/route.ts  ← composite endpoint (parallel queries)
│       └── sync/ghl/contact/route.ts  ← GHL webhook receiver
│
├── components/
│   ├── Topbar.tsx + .module.css       ← app top bar (logo, nav, user)
│   └── family/
│       └── NextSessionCard.tsx + .module.css  ← example component port
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                  ← server-side Supabase client (cookies)
│   │   ├── client.ts                  ← browser-side client
│   │   └── middleware.ts              ← middleware helper, redirects unauth users
│   ├── ghl/client.ts                  ← thin GHL API wrapper
│   └── types/database.ts              ← Supabase types (regen after schema)
│
└── styles/
    └── tokens.css                     ← brand CSS variables (cyan, etc.)
```

## Porting recipe — adding the rest of the v6 dashboard

The dashboard page is intentionally minimal — only `NextSessionCard` is wired. To port a section from `family_dashboard_v6.html`:

1. Create `components/family/<SectionName>.tsx` and `<SectionName>.module.css`
2. Copy the markup + styles from the v6 mockup
3. Replace inline styles with `styles.className` references
4. Replace static data with typed props
5. Import in `app/(app)/dashboard/page.tsx`, pass data from the Supabase query
6. Add the corresponding data fetch to `/api/family/dashboard` if not already there

**Sections to port** (priority order):

| Section | Data source |
|---|---|
| ProgressRing | `patients.week_current / week_total` |
| ATECSparkline | last 5 `atec_assessments` rows (clickable → `/dashboard/atec`) |
| DeviceCompliance | aggregate of `exercise_completions` last 7 days |
| ConciergeCard | `profiles` joined via `patients.concierge_user_id` |
| WeekSchedule | `sessions` in current week |
| SupplementTracker | `supplement_protocols` + today's `supplement_logs` |
| DocumentsList | `documents` where `parent_visible=true` |
| ResourcesGrid | static config file |

For data mapping detail per element, see Section 6 of `NeuroHome_Data_Mapping_Spec.md`.

## Styling — why CSS Modules (not Tailwind)

- Brand tokens (`--brand`, `--bg-warm`, etc.) port directly from the live `neurohome.css`
- Co-located with components, scoped class names
- Zero build config beyond Next.js defaults
- No runtime cost (vs CSS-in-JS)
- v6 mockup → CSS module is a straight copy-paste

If you want Tailwind later, fine. But starting with Tailwind means rewriting all the v6 styles immediately, which is wasted work.

## Auth flow

```
parent enrolls in GHL → workflow fires
  → POST /api/sync/ghl/contact (with HMAC sig)
  → service-role client creates auth.users + profiles + patients
  → Supabase sends magic-link email
  → parent clicks link → /auth/callback → exchanges code → /dashboard
```

Sessions are HttpOnly cookies, refreshed by `middleware.ts` on every request.
RLS policies enforce that auth.uid() can only see their own patient's data.

## Security checklist (read before any prod deploy)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only — never `NEXT_PUBLIC_*`
- [ ] RLS enabled on every table (done in schema)
- [ ] **RLS policy tests written** — one negative case per policy ("parent A queries patient B → zero rows"). This is the #1 thing that prevents a HIPAA breach.
- [ ] GHL webhook HMAC verified (already in `/api/sync/ghl/contact`)
- [ ] HTTPS-only in production (Vercel default)
- [ ] 2FA enabled on all staff Supabase + GHL accounts
- [ ] Audit log retention configured in Supabase
- [ ] `.env.local` in `.gitignore` (already is — verify before first commit)

## Deploy

```bash
# Vercel
vercel link
# Add all env vars in Vercel dashboard (don't paste from .env.local — set per-environment)
vercel --prod
```

Add custom domain (`app.neurohomesolutions.com`) in Vercel project settings.

For the GHL webhook, set its target URL to `https://app.neurohomesolutions.com/api/sync/ghl/contact` and generate a new `GHL_WEBHOOK_SECRET`, save in both GHL workflow settings and Vercel env vars.

## Known gaps in this scaffold

These are intentional — they're either Phase 2 work or things the engineer should fill in:

- Only `NextSessionCard` is ported — port the rest using the recipe above
- No tests yet — write RLS policy tests in `__tests__/rls.test.ts` (use Supabase test helpers)
- No `app/error.tsx` — add for production error boundaries
- No `loading.tsx` per route — add for streamed loading states
- `/api/sync/ghl/contact` has the structure but actual user creation is stubbed — wire when GHL workflow is live
- No PDF export — implement when porting "Download PDF" on ATEC detail
- No `/dashboard/atec` or `/dashboard/messages` routes yet — port from v6 mockup
- No Realtime subscription on messages — add when porting Messages view
- Clinician role policies are commented out in the schema — uncomment for Phase 2

## Milestones (from spec Section 9)

- **Week 1** — login → dashboard end-to-end with 1 internal test "family"
- **Week 2** — port 7 remaining dashboard sections
- **Week 3** — ATEC Detail view
- **Week 4** — Messages view
- **Weeks 5–7** — Clinician view (Phase 2)

## Where to look when something breaks

| Symptom | First place to check |
|---|---|
| Login email never arrives | Supabase Auth dashboard → Email logs |
| "User not found" after login | Check `/api/sync/ghl/contact` actually fired and created the row |
| Empty dashboard despite login | RLS policy — try a service-role query to see if data exists |
| TypeScript errors after schema change | Re-run `supabase gen types` |
| Middleware redirect loop | Check matcher pattern in `middleware.ts` |
| GHL webhook returns 401 | `x-ghl-signature` header missing or `GHL_WEBHOOK_SECRET` mismatch |

## Reference docs

- `NeuroHome_Data_Mapping_Spec.md` — what data lives where, per UI element
- `supabase_schema.sql` — the schema with RLS policies
- `family_dashboard_v6.html` — the visual target (3 views)

---

**Scaffold version:** 0.1.0
**Last updated:** May 28, 2026
