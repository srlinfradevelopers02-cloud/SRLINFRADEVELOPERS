import { useEffect, useMemo, useState } from 'react';
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
} from 'react-router-dom';
import {
  Boxes,
  CheckSquare,
  FileText,
  FolderKanban,
  GalleryVerticalEnd,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  UserCog,
  Users,
  UserSquare2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { isAdminRole, isOwner, roleLabel } from '../../lib/permissions';

export type PortalStaff = {
  id: string;
  user_id: string;
  staff_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  designation?: string;
  is_active: boolean;
  is_owner?: boolean | null;
};

export type PortalContext = {
  staff: PortalStaff;
};

/** The signed-in staff member, loaded once by the portal layout. */
export function usePortalStaff(): PortalStaff {
  return useOutletContext<PortalContext>().staff;
}

type NavItem = {
  label: string;
  path: string;
  icon: LucideIcon;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const ADMIN_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/portal', icon: LayoutDashboard }],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Leads', path: '/portal/leads', icon: Users },
      { label: 'Clients', path: '/portal/clients', icon: UserSquare2 },
      { label: 'Quotations', path: '/portal/quotations', icon: IndianRupee },
      { label: 'Invoices', path: '/portal/invoices', icon: FileText },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Projects', path: '/portal/projects', icon: FolderKanban },
      { label: 'Tasks', path: '/portal/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Products',
    items: [
      {
        label: 'Product Catalogue',
        path: '/portal/product-catalog',
        icon: GalleryVerticalEnd,
      },
      { label: 'Inventory', path: '/portal/inventory', icon: Boxes },
    ],
  },
];

// Staff management is the Owner's alone.
const OWNER_NAV: NavGroup[] = [
  ...ADMIN_NAV,
  {
    title: 'Owner',
    items: [{ label: 'Staff', path: '/portal/staff', icon: UserCog }],
  },
];

// Staff see the same records as admins; quotations and invoices
// stay with admins, as those pages enforce.
const STAFF_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', path: '/portal', icon: LayoutDashboard }],
  },
  {
    title: 'Sales',
    items: [
      { label: 'Leads', path: '/portal/leads', icon: Users },
      { label: 'Clients', path: '/portal/clients', icon: UserSquare2 },
    ],
  },
  {
    title: 'Work',
    items: [
      { label: 'Projects', path: '/portal/projects', icon: FolderKanban },
      { label: 'Tasks', path: '/portal/tasks', icon: CheckSquare },
    ],
  },
  {
    title: 'Products',
    items: [
      {
        label: 'Product Catalogue',
        path: '/portal/product-catalog',
        icon: GalleryVerticalEnd,
      },
      { label: 'Inventory', path: '/portal/inventory', icon: Boxes },
    ],
  },
];

function pageTitle(groups: NavGroup[], pathname: string): string {
  const match = groups
    .flatMap((group) => group.items)
    .find((item) => item.path === pathname);

  return match?.label ?? 'SRL CRM';
}

function SidebarContent({
  groups,
  staff,
  onNavigate,
  onLogout,
}: {
  groups: NavGroup[];
  staff: PortalStaff;
  onNavigate?: () => void;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <img
          src="/logo.png"
          alt="SRL Infra Developers"
          className="h-10 w-10 object-contain"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide">SRL INFRA</p>
          <p className="text-[10px] uppercase tracking-widest text-gray-400">
            Operational CRM
          </p>
        </div>
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto px-3 py-5"
        aria-label="Portal navigation"
      >
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/portal'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                        isActive
                          ? 'bg-white font-medium text-black'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
            {staff.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{staff.full_name}</p>
            <p className="truncate text-xs text-gray-400">
              {roleLabel(staff)} · {staff.staff_code}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function PortalLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [staff, setStaff] = useState<PortalStaff | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadStaff() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate('/portal/login', { replace: true });
        return;
      }

      // select('*') so the screen still loads before the
      // is_owner column exists in the database.
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!mounted) return;

      if (error || !data) {
        await supabase.auth.signOut();
        navigate('/portal/login', { replace: true });
        return;
      }

      setStaff(data as PortalStaff);
      setLoading(false);
    }

    void loadStaff();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/portal/login', { replace: true });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Close the mobile drawer whenever the page changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const groups = useMemo(
    () =>
      isOwner(staff) ? OWNER_NAV : isAdminRole(staff) ? ADMIN_NAV : STAFF_NAV,
    [staff]
  );
  const title = pageTitle(groups, location.pathname);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/portal/login', { replace: true });
  }

  if (loading || !staff) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f3]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading SRL CRM...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#171717] md:flex">
      {/* Desktop sidebar: stays in place while pages change. */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-[#111111] text-white md:block">
        <SidebarContent groups={groups} staff={staff} onLogout={handleLogout} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-[#111111] text-white shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-2 text-gray-400 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              groups={groups}
              staff={staff}
              onNavigate={() => setMobileOpen(false)}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-black/5 bg-white/90 px-4 backdrop-blur md:px-8">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="truncate text-sm font-semibold md:text-base">{title}</h1>

          <div className="ml-auto hidden text-right sm:block">
            <p className="text-sm font-medium">{staff.full_name}</p>
            <p className="text-xs text-gray-400">{roleLabel(staff)}</p>
          </div>
        </header>

        {/* Pages were written as standalone screens with min-h-screen;
            size them to the space under the 3.5rem header instead. */}
        <main className="min-w-0 flex-1 [&>*]:min-h-[calc(100vh-3.5rem)]">
          <Outlet context={{ staff } satisfies PortalContext} />
        </main>
      </div>
    </div>
  );
}
