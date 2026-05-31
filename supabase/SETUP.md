# BataBank Supabase Setup

## Fresh Setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Create a private Storage bucket named `collection-photos`.
   - Public bucket: off
   - Suggested file limit: 5 MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
4. Copy `.env.example` to `.env.local`.
5. Set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3004`
   - `ADMIN_GATE_SECRET`

## Existing Deployment Migration

For an existing BataBank database, run:

```text
supabase/20260601_government_update.sql
```

This adds:
- institution approval status
- pickup statuses
- request message/pickup fields
- safe public RPC functions for leaderboard/analytics
- stricter profile read policy

## First Admin

Register the first user from `/register`, then promote it:

```sql
update public.profiles
set role = 'admin',
    approval_status = 'approved',
    approved_at = now()
where contact = 'admin@example.com'
   or id = 'AUTH_USER_UUID_HERE';
```

Admin access requires both:
- successful hidden logo gate using `ADMIN_GATE_SECRET`
- logged-in profile with `role = 'admin'`

## Privacy Notes

The app should not expose contact person, phone/email, admin notes, pickup address, or private storage paths publicly.

Public pages use safe aggregate data:
- institution name
- institution type
- region/city
- approved container totals
- estimated battery totals
- badge level
- latest activity date

The `collection-photos` bucket remains private. Institutions can read their own photos. Admins can read all review photos.
