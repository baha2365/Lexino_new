-- Lexino – Supabase schema. Run once in: Supabase dashboard → SQL editor.
-- Roles: 'parent' (owns children, plays on the family device) and 'logoped' (linked by invite code).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('parent', 'logoped')),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  birth_year int,
  invite_code text not null unique default substr(md5(random()::text || clock_timestamp()::text), 1, 8),
  created_at timestamptz not null default now()
);

create table if not exists public.child_logopeds (
  child_id uuid not null references public.children(id) on delete cascade,
  logoped_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (child_id, logoped_id)
);

create table if not exists public.events (
  id uuid primary key,                       -- generated on the device => sync is idempotent
  child_id uuid not null references public.children(id) on delete cascade,
  ts timestamptz not null,
  game text not null,
  skill text not null,
  card_id text,
  result text not null,
  meta jsonb
);
create index if not exists events_child_ts on public.events (child_id, ts desc);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children(id) on delete cascade,
  by_user uuid default auth.uid(),
  ts timestamptz not null default now(),
  scores jsonb not null,
  notes text
);
create index if not exists assessments_child_ts on public.assessments (child_id, ts);

create table if not exists public.plans (
  child_id uuid primary key references public.children(id) on delete cascade,
  updated_by uuid default auth.uid(),
  updated_at timestamptz not null default now(),
  goal text,
  days jsonb not null default '[]'
);

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER so the policies below do not recurse into each other.
create or replace function public.is_child_owner(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.children c where c.id = cid and c.owner_id = auth.uid());
$$;

create or replace function public.can_access_child(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_child_owner(cid)
      or exists (select 1 from public.child_logopeds l where l.child_id = cid and l.logoped_id = auth.uid());
$$;

-- profile row is created from the sign-up form's metadata
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role, display_name)
  values (
    new.id,
    case when new.raw_user_meta_data->>'role' = 'logoped' then 'logoped' else 'parent' end,
    coalesce(new.raw_user_meta_data->>'display_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- A logoped enters the invite code a parent shows them.
create or replace function public.link_child(code text) returns table (id uuid, name text)
language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'logoped') then
    raise exception 'Only specialist accounts can link to a child';
  end if;
  select c.id into cid from public.children c where c.invite_code = lower(trim(code));
  if cid is null then raise exception 'Invite code not found'; end if;
  insert into public.child_logopeds (child_id, logoped_id) values (cid, auth.uid()) on conflict do nothing;
  return query select c.id, c.name from public.children c where c.id = cid;
end $$;

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.child_logopeds enable row level security;
alter table public.events enable row level security;
alter table public.assessments enable row level security;
alter table public.plans enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "update own profile" on public.profiles for update using (id = auth.uid());

create policy "see accessible children" on public.children for select using (public.can_access_child(id));
create policy "parents add children" on public.children for insert with check (owner_id = auth.uid());
create policy "owner edits child" on public.children for update using (owner_id = auth.uid());
create policy "owner deletes child" on public.children for delete using (owner_id = auth.uid());

create policy "see own links" on public.child_logopeds for select
  using (logoped_id = auth.uid() or public.is_child_owner(child_id));
create policy "unlink" on public.child_logopeds for delete
  using (logoped_id = auth.uid() or public.is_child_owner(child_id));

create policy "read events" on public.events for select using (public.can_access_child(child_id));
create policy "owner writes events" on public.events for insert with check (public.is_child_owner(child_id));

create policy "read assessments" on public.assessments for select using (public.can_access_child(child_id));
create policy "write assessments" on public.assessments for insert with check (public.can_access_child(child_id));

create policy "read plans" on public.plans for select using (public.can_access_child(child_id));
create policy "write plans" on public.plans for insert with check (public.can_access_child(child_id));
create policy "update plans" on public.plans for update using (public.can_access_child(child_id));
