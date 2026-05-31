# BataBank

BataBank is an Uzbek-first platform for verified used-battery collection across schools, universities, and public institutions.

The current MVP supports:
- institution registration and admin approval
- filled-container requests with metrics, message, photos, and pickup status
- admin review for institution applications and collection evidence
- public leaderboard
- public regional analytics and monthly report pages for ecology/government review
- automatic nishon/badge ladder and a simple printable certificate

## Local Development

```bash
npm install
npm run dev -- -p 3004
```

Open:

```text
http://localhost:3004
```

## Environment Variables

Create `.env.local` from `.env.example`:

```text
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3004
ADMIN_GATE_SECRET=change-this-secret
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
```

For Railway, add the same variables in the Railway service variables. In production, set `NEXT_PUBLIC_APP_URL` to the Railway public URL.
`SUPABASE_SERVICE_ROLE_KEY` must stay server-side only. Never expose it with a `NEXT_PUBLIC_` prefix.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` for a fresh database, or run `supabase/20260601_government_update.sql` on an existing BataBank database.
3. Create a private Storage bucket named `collection-photos`.
4. Add `ADMIN_GATE_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Railway variables.
5. Admin access does not require registration. Click the logo 5 times and enter `ADMIN_GATE_SECRET`.

Optional manual admin promotion:

```sql
update public.profiles
set role = 'admin',
    approval_status = 'approved',
    approved_at = now()
where contact = 'admin@example.com'
   or id = 'AUTH_USER_UUID_HERE';
```

## Main Routes

- `/` public landing page
- `/register` institution registration
- `/login` login
- `/dashboard` institution dashboard
- `/dashboard/certificate` printable certificate
- `/leaderboard` public ranking
- `/analytics` regional analytics
- `/report` monthly report
- `/admin` admin panel

Admin panel access:
- click the BataBank logo 5 times
- enter `ADMIN_GATE_SECRET`
- registration/login is not required
- `/admin` opens using the server-only Supabase service role key

## Badge Ladder

Badges are calculated automatically from approved filled containers:

- 0: Hali nishon yo'q
- 1: Birinchi konteyner
- 3: Faol yig'uvchi
- 10: Eko yetakchi
- 25: Hududiy namuna
- 50: Milliy namuna

## Verification

```bash
npm run lint
npm run build
```
