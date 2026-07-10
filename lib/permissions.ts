// Staff Role Permissions Matrix — source: Staff_Permissions_Matrix for the database.xlsx
// Roles: Admin, Manager, Staff 1, Staff 2, Bookkeeper/Accountant, Set-Up/Breakdown Crew, Driver
//
// RESOLVED WITH CLIENT (Irene, confirmed 2026-07):
//  1. Override privilege — NOT bundled into the Manager role by default. It is granted individually via
//     the existing per-account "50% Override" checkbox in Settings (works for any role, including Manager).
//     Email notification to Irene fires on every override use regardless of who holds the permission.
//  2. Staff 2 — Quotes, Orders, and Invoices now match Staff 1 exactly. Calendar and Reports remain
//     limited to 'view' for Staff 2 as originally set.
//  3. Bookkeeper/Accountant — now has Invoices (full) and Reports (full) access in addition to Dashboard
//     and Customers. Inventory access downgraded to 'view' only per client instruction.
//  4. Scanner access mirrors Inventory access for Bookkeeper (view), Set-Up/Breakdown Crew (limited),
//     and Driver (limited).
//  5. Reports — Bookkeeper has full Reports access. Set-Up/Breakdown Crew and Driver have 'limited'
//     Reports access, intended to be inventory pulled/returned reports only (see Reports page note).

export type UserRole = 'admin' | 'manager' | 'staff1' | 'staff2' | 'bookkeeper' | 'setup_crew' | 'driver'

export type AccessLevel = 'full' | 'view' | 'limited' | 'none'

export interface ModulePermissions {
  dashboard: AccessLevel
  customers: AccessLevel
  inventory: AccessLevel
  scanner: AccessLevel
  quotes: AccessLevel
  orders: AccessLevel
  invoices: AccessLevel
  calendar: AccessLevel
  reports: AccessLevel
  crm: AccessLevel
  backoffice: AccessLevel
  delivery: AccessLevel
  settings: AccessLevel
  overridePrivilege: boolean
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  staff1: 'Staff 1',
  staff2: 'Staff 2',
  bookkeeper: 'Bookkeeper / Accountant',
  setup_crew: 'Set-Up / Breakdown Crew',
  driver: 'Driver',
}

export const ROLE_PERMISSIONS: Record<UserRole, ModulePermissions> = {
  admin: {
    dashboard: 'full', customers: 'full', inventory: 'full', scanner: 'full',
    quotes: 'full', orders: 'full', invoices: 'full', calendar: 'full',
    reports: 'full', crm: 'full', backoffice: 'full', delivery: 'full',
    settings: 'full', overridePrivilege: true,
  },
  manager: {
    dashboard: 'full', customers: 'full', inventory: 'full', scanner: 'full',
    quotes: 'full', orders: 'full', invoices: 'full', calendar: 'full',
    reports: 'full', crm: 'full', backoffice: 'view', delivery: 'full',
    settings: 'limited', overridePrivilege: false, // grant individually via the per-account override checkbox
  },
  staff1: {
    dashboard: 'full', customers: 'full', inventory: 'full', scanner: 'full',
    quotes: 'full', orders: 'full', invoices: 'limited', calendar: 'full',
    reports: 'limited', crm: 'full', backoffice: 'none', delivery: 'full',
    settings: 'none', overridePrivilege: false,
  },
  staff2: {
    dashboard: 'full', customers: 'full', inventory: 'full', scanner: 'full',
    quotes: 'full', orders: 'full', invoices: 'limited', calendar: 'view',
    reports: 'view', crm: 'full', backoffice: 'none', delivery: 'full',
    settings: 'none', overridePrivilege: false,
  },
  bookkeeper: {
    dashboard: 'full', customers: 'view', inventory: 'view', scanner: 'view',
    quotes: 'none', orders: 'none', invoices: 'full', calendar: 'none',
    reports: 'full', crm: 'none', backoffice: 'none', delivery: 'none',
    settings: 'none', overridePrivilege: false,
  },
  setup_crew: {
    dashboard: 'full', customers: 'view', inventory: 'limited', scanner: 'limited',
    quotes: 'none', orders: 'none', invoices: 'none', calendar: 'view',
    reports: 'limited', crm: 'full', backoffice: 'none', delivery: 'limited',
    settings: 'none', overridePrivilege: false,
  },
  driver: {
    dashboard: 'full', customers: 'view', inventory: 'limited', scanner: 'limited',
    quotes: 'none', orders: 'none', invoices: 'none', calendar: 'view',
    reports: 'limited', crm: 'full', backoffice: 'none', delivery: 'limited',
    settings: 'none', overridePrivilege: false,
  },
}

// Roles a Manager is allowed to create (per Settings row: cannot add Bookkeeper/Accountant)
export const MANAGER_CREATABLE_ROLES: UserRole[] = ['staff1', 'staff2', 'setup_crew', 'driver']

export type ReportType = 'revenue' | 'invoices' | 'orders' | 'inventory' | 'audit' | 'partial' | 'full' | 'override' | 'completed'

const ALL_REPORT_TYPES: ReportType[] = ['revenue', 'invoices', 'orders', 'inventory', 'audit', 'partial', 'full', 'override', 'completed']

// Which report tabs each role can see under Reports — confirmed with client 2026-07-09:
//  - Staff 1: Payment Report (daily & periodic = 'revenue'), Invoice & Orders, Frequent Inventory, Inventory (audit)
//  - Staff 2: Daily Payment Report only (revenue, locked to daily period), Frequent Inventory, Inventory (audit)
//  - Bookkeeper/Accountant, Manager, Admin: full report access
//  - Set-Up/Breakdown Crew, Driver: Frequent Inventory only (their Reports access is 'limited' —
//    inventory pulled/returned reports)
export const ROLE_REPORT_TYPES: Record<UserRole, ReportType[]> = {
  admin: ALL_REPORT_TYPES,
  manager: ALL_REPORT_TYPES,
  staff1: ['revenue', 'invoices', 'orders', 'inventory', 'audit'],
  staff2: ['revenue', 'inventory', 'audit'],
  bookkeeper: ALL_REPORT_TYPES,
  setup_crew: ['inventory'],
  driver: ['inventory'],
}

// Roles restricted to the Daily period only on the Revenue/Payment report (no Custom Range / Monthly)
export const DAILY_ONLY_REVENUE_ROLES: UserRole[] = ['staff2']

export function getModuleAccess(role: UserRole, module: keyof Omit<ModulePermissions, 'overridePrivilege'>): AccessLevel {
  return ROLE_PERMISSIONS[role]?.[module] ?? 'none'
}

export function getAllowedReportTypes(role: UserRole): ReportType[] {
  return ROLE_REPORT_TYPES[role] ?? []
}

export function roleHasOverridePrivilege(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role]?.overridePrivilege ?? false
}
