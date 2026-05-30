# BataBank Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Create a private Storage bucket named `collection-photos`.
   - Public bucket: off
   - File size limit: choose what fits your pilot, for example 5 MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
4. Copy `.env.example` to `.env.local` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL=http://localhost:3004`
5. Register the first institution user from `/register`.
6. Promote the first admin in SQL Editor:

```sql
update public.profiles
set role = 'admin'
where contact = 'admin@example.com'
   or id = 'AUTH_USER_UUID_HERE';
```

For production, keep the bucket private. The app creates short-lived signed URLs for institution-owned photos and admin review. Approved photo metadata becomes readable, while actual file access still goes through Supabase Storage policies.
