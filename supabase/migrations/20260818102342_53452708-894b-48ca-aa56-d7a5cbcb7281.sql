create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  contact_email text,
  page_path text,
  category text not null default 'bug',
  subject text not null,
  details text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bug_reports_category_check check (category in ('bug','idea','question','other')),
  constraint bug_reports_status_check check (status in ('open','in_progress','resolved','closed'))
);

grant select, insert on public.bug_reports to authenticated;
grant insert on public.bug_reports to anon;
grant all on public.bug_reports to service_role;
grant update (status) on public.bug_reports to authenticated;

alter table public.bug_reports enable row level security;

drop policy if exists "Members can file reports" on public.bug_reports;
create policy "Members can file reports" on public.bug_reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists "Guests can file reports" on public.bug_reports;
create policy "Guests can file reports" on public.bug_reports
  for insert to anon
  with check (reporter_id is null);

drop policy if exists "Reporters read own reports" on public.bug_reports;
create policy "Reporters read own reports" on public.bug_reports
  for select to authenticated
  using (reporter_id = auth.uid());

drop policy if exists "Admins read all reports" on public.bug_reports;
create policy "Admins read all reports" on public.bug_reports
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins update reports" on public.bug_reports;
create policy "Admins update reports" on public.bug_reports
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists bug_reports_updated_at on public.bug_reports;
create trigger bug_reports_updated_at before update on public.bug_reports
  for each row execute function public.update_updated_at_column();

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind = any (array['follow','like','comment','mention','cheer','bug']));

create or replace function public.notify_admins_of_bug_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.reporter_id is null then
    return new;
  end if;
  insert into public.notifications (recipient_id, actor_id, kind, body, link)
  select ur.user_id, new.reporter_id, 'bug',
         left('New ' || new.category || ' report: ' || new.subject, 300),
         '/community/help'
  from public.user_roles ur
  where ur.role = 'admin' and ur.user_id <> new.reporter_id;
  return new;
end;
$$;

revoke execute on function public.notify_admins_of_bug_report() from anon, authenticated;

drop trigger if exists bug_reports_notify_admins on public.bug_reports;
create trigger bug_reports_notify_admins after insert on public.bug_reports
  for each row execute function public.notify_admins_of_bug_report();