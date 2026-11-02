-- Staff access: every role sees the same CRM records; only the Owner
-- manages staff.
--
--   * staff.is_owner marks the Owner (SRL Admin, ADMIN001).
--   * Only the Owner can add, edit, activate or delete staff rows.
--     Admins can still read staff rows (needed to assign leads and
--     projects); every staff member can still read their own row.
--   * Every active staff member can read clients, projects and the
--     whole product catalogue (including unpublished products).
--     Leads and active inventory items are already readable by all
--     active staff.
--   * Edits to leads, clients, inventory, products, quotations and
--     invoices stay with ADMIN (is_crm_admin()), unchanged.
--
-- Additive and re-runnable. Apply in the Supabase SQL editor.

begin;

-- 1. Owner flag -----------------------------------------------------

alter table public.staff
  add column if not exists is_owner boolean not null default false;

update public.staff
set is_owner = true
where staff_code = 'ADMIN001'
  and role = 'ADMIN';

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
    select 1
    from staff
    where user_id = auth.uid()
      and role = 'ADMIN'
      and is_owner = true
      and is_active = true
  );
$function$;

-- 2. Staff table: admins read, only the Owner writes -----------------

drop policy if exists staff_admin_all on public.staff;
drop policy if exists staff_admin_read on public.staff;
drop policy if exists staff_owner_all on public.staff;

create policy staff_admin_read
  on public.staff
  for select
  to authenticated
  using (is_crm_admin());

create policy staff_owner_all
  on public.staff
  for all
  to authenticated
  using (is_owner())
  with check (is_owner());

-- staff_view_self stays as it is.

-- 3. Clients: all active staff can read ------------------------------

drop policy if exists clients_staff_read on public.clients;

create policy clients_staff_read
  on public.clients
  for select
  to authenticated
  using (current_staff_id() is not null);

-- 4. Projects: all active staff can read -----------------------------

drop policy if exists projects_select_admin_or_assigned_staff on public.projects;
drop policy if exists projects_staff_read on public.projects;

create policy projects_staff_read
  on public.projects
  for select
  to authenticated
  using (current_staff_id() is not null);

-- 5. Products: all active staff can read the whole catalogue ---------

drop policy if exists products_staff_read on public.products;

create policy products_staff_read
  on public.products
  for select
  to authenticated
  using (current_staff_id() is not null);

commit;

-- Optional, decide before running: "SRL Infra" (staff_code 'manager',
-- department ADMIN) is role STAFF today, so it cannot edit leads,
-- clients or inventory. If it is meant to be an admin:
--
--   update public.staff set role = 'ADMIN' where staff_code = 'manager';
