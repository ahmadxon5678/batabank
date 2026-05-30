create extension if not exists "pgcrypto";

create type public.institution_type as enum ('school', 'university', 'government', 'other');
create type public.profile_role as enum ('institution', 'admin');
create type public.submission_status as enum ('pending', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_name text not null,
  institution_type public.institution_type not null default 'school',
  region_city text not null,
  contact_person text not null,
  contact text not null,
  role public.profile_role not null default 'institution',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  containers_count integer not null check (containers_count > 0),
  estimated_battery_count integer not null check (estimated_battery_count > 0),
  estimated_weight_kg numeric(10, 2) check (estimated_weight_kg is null or estimated_weight_kg >= 0),
  collection_date date not null,
  status public.submission_status not null default 'pending',
  admin_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.submission_photos (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index submissions_profile_id_idx on public.submissions(profile_id);
create index submissions_status_idx on public.submissions(status);
create index submission_photos_submission_id_idx on public.submission_photos(submission_id);
create index submission_photos_profile_id_idx on public.submission_photos(profile_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    institution_name,
    institution_type,
    region_city,
    contact_person,
    contact,
    role
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'institution_name', 'Yangi tashkilot'),
    coalesce((new.raw_user_meta_data ->> 'institution_type')::public.institution_type, 'school'),
    coalesce(new.raw_user_meta_data ->> 'region_city', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_person', ''),
    coalesce(new.raw_user_meta_data ->> 'contact', new.email),
    'institution'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_photos enable row level security;

create policy "Profiles are publicly readable for leaderboard"
on public.profiles for select
using (true);

create policy "Institutions update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id and role = 'institution');

create policy "Admins update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create policy "Approved submissions are public"
on public.submissions for select
using (status = 'approved');

create policy "Institutions read own submissions"
on public.submissions for select
using (auth.uid() = profile_id);

create policy "Admins read all submissions"
on public.submissions for select
using (public.is_admin());

create policy "Institutions create own submissions"
on public.submissions for insert
with check (auth.uid() = profile_id and status = 'pending');

create policy "Admins review submissions"
on public.submissions for update
using (public.is_admin())
with check (public.is_admin());

create policy "Institutions read own photos"
on public.submission_photos for select
using (auth.uid() = profile_id);

create policy "Admins read all photos"
on public.submission_photos for select
using (public.is_admin());

create policy "Approved submission photos are public metadata"
on public.submission_photos for select
using (
  exists (
    select 1
    from public.submissions
    where submissions.id = submission_photos.submission_id
      and submissions.status = 'approved'
  )
);

create policy "Institutions add own photo metadata"
on public.submission_photos for insert
with check (
  auth.uid() = profile_id
  and exists (
    select 1
    from public.submissions
    where submissions.id = submission_photos.submission_id
      and submissions.profile_id = auth.uid()
  )
);

create policy "Institutions upload own private photos"
on storage.objects for insert
with check (
  bucket_id = 'collection-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Institutions read own private photos"
on storage.objects for select
using (
  bucket_id = 'collection-photos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Admins read all private photos"
on storage.objects for select
using (
  bucket_id = 'collection-photos'
  and public.is_admin()
);

create policy "Approved photos can be signed for public review"
on storage.objects for select
using (
  bucket_id = 'collection-photos'
  and exists (
    select 1
    from public.submission_photos
    join public.submissions on submissions.id = submission_photos.submission_id
    where submission_photos.storage_path = storage.objects.name
      and submissions.status = 'approved'
  )
);
