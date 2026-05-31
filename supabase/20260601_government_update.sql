do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_approval_status') then
    create type public.profile_approval_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pickup_status') then
    create type public.pickup_status as enum (
      'not_requested',
      'requested',
      'scheduled',
      'picked_up',
      'delivered_to_partner',
      'cancelled'
    );
  end if;
end $$;

alter table public.profiles
  add column if not exists approval_status public.profile_approval_status not null default 'pending',
  add column if not exists approval_note text,
  add column if not exists approved_by uuid references public.profiles(id),
  add column if not exists approved_at timestamptz,
  add column if not exists rejected_at timestamptz;

alter table public.submissions
  add column if not exists message text,
  add column if not exists pickup_requested boolean not null default false,
  add column if not exists pickup_status public.pickup_status not null default 'not_requested',
  add column if not exists pickup_address text,
  add column if not exists pickup_note text,
  add column if not exists pickup_updated_at timestamptz;

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
    role,
    approval_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'institution_name', 'Yangi tashkilot'),
    coalesce((new.raw_user_meta_data ->> 'institution_type')::public.institution_type, 'school'),
    coalesce(new.raw_user_meta_data ->> 'region_city', ''),
    coalesce(new.raw_user_meta_data ->> 'contact_person', ''),
    coalesce(new.raw_user_meta_data ->> 'contact', new.email),
    'institution',
    'pending'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.guard_profile_sensitive_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_admin() then
    if new.role is distinct from old.role
      or new.approval_status is distinct from old.approval_status
      or new.approval_note is distinct from old.approval_note
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at
      or new.rejected_at is distinct from old.rejected_at then
      raise exception 'Only admins can change approval fields';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard_sensitive_fields on public.profiles;
create trigger profiles_guard_sensitive_fields
before update on public.profiles
for each row execute function public.guard_profile_sensitive_fields();

drop policy if exists "Profiles are publicly readable for leaderboard" on public.profiles;
drop policy if exists "Profiles are publicly readable for own/admin only" on public.profiles;
drop policy if exists "Institutions update own profile" on public.profiles;
drop policy if exists "Admins update profiles" on public.profiles;
drop policy if exists "Institutions create own submissions" on public.submissions;

create policy "Profiles are readable by owner and admins"
on public.profiles for select
using (auth.uid() = id or public.is_admin());

create policy "Institutions update own public profile fields"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Admins update profiles"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

create policy "Approved institutions create own submissions"
on public.submissions for insert
with check (
  auth.uid() = profile_id
  and status = 'pending'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.approval_status = 'approved'
  )
);

create or replace function public.public_leaderboard()
returns table (
  profile_id uuid,
  institution_name text,
  institution_type public.institution_type,
  region_city text,
  approved_containers bigint,
  approved_batteries bigint,
  approved_weight numeric,
  latest_activity_date date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    profiles.id,
    profiles.institution_name,
    profiles.institution_type,
    profiles.region_city,
    coalesce(sum(submissions.containers_count), 0)::bigint,
    coalesce(sum(submissions.estimated_battery_count), 0)::bigint,
    sum(submissions.estimated_weight_kg),
    max(submissions.collection_date)
  from public.profiles
  join public.submissions on submissions.profile_id = profiles.id
  where profiles.approval_status = 'approved'
    and submissions.status = 'approved'
  group by profiles.id, profiles.institution_name, profiles.institution_type, profiles.region_city
  order by coalesce(sum(submissions.containers_count), 0) desc, coalesce(sum(submissions.estimated_battery_count), 0) desc;
$$;

create or replace function public.public_recent_activity()
returns table (
  profile_id uuid,
  institution_name text,
  institution_type public.institution_type,
  region_city text,
  containers_count integer,
  estimated_battery_count integer,
  estimated_weight_kg numeric,
  collection_date date,
  reviewed_at timestamptz,
  pickup_status public.pickup_status
)
language sql
security definer
set search_path = public
stable
as $$
  select
    profiles.id,
    profiles.institution_name,
    profiles.institution_type,
    profiles.region_city,
    submissions.containers_count,
    submissions.estimated_battery_count,
    submissions.estimated_weight_kg,
    submissions.collection_date,
    submissions.reviewed_at,
    submissions.pickup_status
  from public.submissions
  join public.profiles on profiles.id = submissions.profile_id
  where profiles.approval_status = 'approved'
    and submissions.status = 'approved'
  order by coalesce(submissions.reviewed_at, submissions.created_at) desc
  limit 25;
$$;

create or replace function public.public_pickup_stats()
returns table (
  pickup_status public.pickup_status,
  total bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select submissions.pickup_status, count(*)::bigint
  from public.submissions
  join public.profiles on profiles.id = submissions.profile_id
  where profiles.approval_status = 'approved'
    and submissions.status = 'approved'
  group by submissions.pickup_status;
$$;

-- If the first admin already exists, approve it manually after running this migration:
-- update public.profiles
-- set role = 'admin', approval_status = 'approved', approved_at = now()
-- where contact = 'admin@example.com' or id = 'AUTH_USER_UUID_HERE';
