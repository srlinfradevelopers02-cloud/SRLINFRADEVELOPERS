/*
 * Portal roles, in one place.
 *
 * Owner  - an ADMIN with staff.is_owner = true. The only person who
 *          can see and manage staff (add, edit, activate, delete).
 * ADMIN  - full CRM access: leads, clients, projects, inventory,
 *          product catalogue, quotations and invoices.
 * STAFF  - sees the same leads, clients, projects, inventory and
 *          product catalogue as admins, without admin edits.
 *
 * The database enforces the same rules (is_crm_admin / is_owner);
 * these helpers only decide what the screens show.
 */

type RoleHolder =
  | {
      role?: string | null;
      is_owner?: boolean | null;
    }
  | null
  | undefined;

export function isAdminRole(staff: RoleHolder): boolean {
  return staff?.role?.toUpperCase() === 'ADMIN';
}

export function isOwner(staff: RoleHolder): boolean {
  return isAdminRole(staff) && staff?.is_owner === true;
}

export function roleLabel(staff: RoleHolder): string {
  if (isOwner(staff)) return 'Owner';
  if (isAdminRole(staff)) return 'Admin';
  return 'Staff';
}
