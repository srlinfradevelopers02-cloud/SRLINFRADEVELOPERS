
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Staff = {
  id: string;
  user_id: string;
  staff_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string;
  designation?: string;
  is_active: boolean;
};

type Lead = {
  id: number;
  client_name?: string;
  company_name?: string;
  project_type?: string;
  status?: string;
  work_status?: string;
  created_at?: string;
};

const ADMIN_MENU = [
  { label: 'Dashboard', icon: '▦', path: '/portal' },
  { label: 'Leads', icon: '◉', path: '/portal/leads' },
  { label: 'Clients', icon: '♙', path: '/portal/clients' },
  { label: 'Projects', icon: '▤', path: '/portal/projects' },
  { label: 'Tasks', icon: '✓', path: '/portal/tasks' },
  { label: 'Inventory', icon: '▣', path: '/portal/inventory' },
  { label: 'Product Catalogue', icon: '▧', path: '/portal/product-catalog' },
  { label: 'Quotations', icon: '₹', path: '/portal/quotations' },
  { label: 'Invoices', icon: '▤', path: '/portal/invoices' },
  { label: 'Staff', icon: '♟', path: '/portal/staff' },
];

const STAFF_MENU = [
  { label: 'Dashboard', icon: '▦', path: '/portal' },
  { label: 'Leads', icon: '◉', path: '/portal/leads' },
  { label: 'Clients', icon: '♙', path: '/portal/clients' },
  { label: 'Projects', icon: '▤', path: '/portal/projects' },
  { label: 'Tasks', icon: '✓', path: '/portal/tasks' },
];

function getDepartmentTitle(department: string) {
  switch (department.toUpperCase()) {
    case 'INTERIOR DESIGN':
      return 'Interior Design';
    case 'TELECALLING':
      return 'Telecalling';
    case 'AUTOMATION':
      return 'Automation';
    case 'ELEVATORS':
      return 'Elevators';
    default:
      return department || 'SRL Team';
  }
}

function getDepartmentDescription(department: string) {
  switch (department.toUpperCase()) {
    case 'INTERIOR DESIGN':
      return 'Manage assigned interior design enquiries and customer follow-ups.';
    case 'TELECALLING':
      return 'Manage assigned calls, customer follow-ups and conversions.';
    case 'AUTOMATION':
      return 'Manage assigned automation enquiries and smart solutions.';
    case 'ELEVATORS':
      return 'Manage assigned elevator enquiries and customer requirements.';
    default:
      return 'Manage your assigned SRL Infra Developers work.';
  }
}

function getDepartmentIcon(department: string) {
  switch (department.toUpperCase()) {
    case 'INTERIOR DESIGN':
      return '⌂';
    case 'TELECALLING':
      return '☎';
    case 'AUTOMATION':
      return '⚙';
    case 'ELEVATORS':
      return '↕';
    default:
      return '◉';
  }
}

const ADMIN_MODULES = [
  {
    title: 'Leads & Enquiries',
    description: 'Website enquiries and follow-ups',
    icon: '◉',
    path: '/portal/leads',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    title: 'Clients',
    description: 'Customer records and details',
    icon: '♙',
    path: '/portal/clients',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    title: 'Projects',
    description: 'Project information and progress',
    icon: '▤',
    path: '/portal/projects',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    title: 'Inventory',
    description: 'Manage available stock',
    icon: '▣',
    path: '/portal/inventory',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    title: 'Product Catalogue',
    description: 'Website products, photos and cart limits',
    icon: '▧',
    path: '/portal/product-catalog',
    color: 'bg-pink-50 text-pink-700',
  },
  {
    title: 'Quotations',
    description: 'Prepare and manage quotations',
    icon: '₹',
    path: '/portal/quotations',
    color: 'bg-orange-50 text-orange-700',
  },
  {
    title: 'Invoices',
    description: 'Billing and invoice records',
    icon: '▤',
    path: '/portal/invoices',
    color: 'bg-cyan-50 text-cyan-700',
  },
  {
    title: 'Staff Management',
    description: 'Employees and team management',
    icon: '♟',
    path: '/portal/staff',
    color: 'bg-indigo-50 text-indigo-700',
  },
  {
    title: 'Tasks',
    description: 'Assigned work and follow-ups',
    icon: '✓',
    path: '/portal/tasks',
    color: 'bg-teal-50 text-teal-700',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const isAdmin = staff?.role?.toUpperCase() === 'ADMIN';
  const department = staff?.department?.toUpperCase() || '';
  const departmentTitle = getDepartmentTitle(department);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        navigate('/portal/login', { replace: true });
        return;
      }

      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(
          'id, user_id, staff_code, full_name, email, role, department, designation, is_active'
        )
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffError) throw staffError;

      if (!staffData) {
        await supabase.auth.signOut();
        navigate('/portal/login', { replace: true });
        return;
      }

      setStaff(staffData as Staff);

      let leadQuery = supabase
        .from('leads')
        .select(
          '*'
        )
        .order('created_at', { ascending: false });

      // Admin and staff dashboards both show the same company-wide lead list.
      const { data: leadData, error: leadError } = await leadQuery;

      if (leadError) throw leadError;

      setLeads((leadData || []) as Lead[]);
    } catch (error: any) {
      console.error('Dashboard loading failed:', error);
      setErrorMessage(
        error?.message || 'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/portal/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      newLeads: leads.filter(
        (lead) => lead.status?.toUpperCase() === 'NEW'
      ).length,
      contacted: leads.filter(
        (lead) => lead.status?.toUpperCase() === 'CONTACTED'
      ).length,
      qualified: leads.filter(
        (lead) => lead.status?.toUpperCase() === 'QUALIFIED'
      ).length,
      quotation: leads.filter(
        (lead) => lead.status?.toUpperCase() === 'QUOTATION'
      ).length,
      won: leads.filter(
        (lead) => lead.status?.toUpperCase() === 'WON'
      ).length,
      active: leads.filter(
        (lead) =>
          !['WON', 'LOST'].includes(
            lead.status?.toUpperCase() || ''
          )
      ).length,
      assigned: leads.filter(
        (lead) => lead.work_status?.toUpperCase() === 'ASSIGNED'
      ).length,
    };
  }, [leads]);

  const recentLeads = leads.slice(0, 6);
  const menuItems = isAdmin ? ADMIN_MENU : STAFF_MENU;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/portal/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f3]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-gray-500">
            Loading SRL CRM...
          </p>
        </div>
      </div>
    );
  }

  if (!staff) return null;

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#171717] flex">
      <aside className="w-64 bg-[#111111] text-white min-h-screen hidden md:flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <img
            src="/logo.png"
            alt="SRL Infra Developers"
            className="w-12 h-12 object-contain mb-4"
          />
          <h1 className="text-lg font-semibold">SRL INFRA</h1>
          <p className="text-xs text-gray-400 mt-1">DEVELOPERS</p>
          <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-white/10 text-[10px] tracking-widest uppercase text-gray-300">
            Operational CRM
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const active = window.location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                  active
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="w-5 text-center">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300"
          >
            <span>↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="min-h-20 bg-white border-b border-black/5 flex items-center justify-between gap-4 px-5 md:px-10 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400">
              {isAdmin ? 'Administration' : departmentTitle}
            </p>
            <h2 className="text-xl md:text-2xl font-semibold mt-1">
              {isAdmin
                ? 'Admin Dashboard'
                : `${departmentTitle} Dashboard`}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadDashboard()}
              title="Refresh dashboard"
              className="px-3 py-2 border border-black/10 rounded-lg text-sm hover:bg-gray-50"
            >
              ↻ <span className="hidden sm:inline">Refresh</span>
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{staff.full_name}</p>
              <p className="text-xs text-gray-400">
                {isAdmin ? 'Administrator' : `${departmentTitle} Staff`}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-semibold">
              {staff.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-5 md:p-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">Dashboard data could not load</p>
              <p className="mt-1">{errorMessage}</p>
              <button
                onClick={() => void loadDashboard()}
                className="mt-3 underline font-medium"
              >
                Try again
              </button>
            </div>
          )}

          <section className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-sm text-gray-500">Welcome back,</p>
                <h3 className="text-2xl md:text-3xl font-semibold mt-1">
                  {staff.full_name}
                </h3>
                <p className="text-gray-500 mt-2 max-w-2xl">
                  {isAdmin
                    ? 'Manage SRL Infra Developers operations from one central workspace.'
                    : getDepartmentDescription(department)}
                </p>
              </div>

              <div className="w-16 h-16 rounded-2xl bg-[#111111] text-white flex items-center justify-center text-3xl">
                {isAdmin ? '◆' : getDepartmentIcon(department)}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <span className="px-3 py-1.5 rounded-full bg-black text-white text-xs">
                {staff.staff_code}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs">
                {staff.role}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs">
                {isAdmin ? 'ALL DEPARTMENTS' : departmentTitle}
              </span>
            </div>
          </section>

          {/* Lead statistics */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
            <StatCard
              title="Total Leads"
              value={stats.total}
              description="Accessible enquiries"
              icon="◉"
            />
            <StatCard
              title="New Leads"
              value={stats.newLeads}
              description="Awaiting action"
              icon="✦"
            />
            <StatCard
              title="Active Work"
              value={stats.active}
              description="Open enquiries"
              icon="▤"
            />
            <StatCard
              title="Won"
              value={stats.won}
              description="Converted enquiries"
              icon="✓"
            />
          </section>

          {/* Admin modules */}
          {isAdmin && (
            <section className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
                <div>
                  <h3 className="text-xl font-semibold">
                    Admin Control Center
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Access your CRM modules from one place.
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  SRL INFRA DEVELOPERS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {ADMIN_MODULES.map((module) => (
                  <button
                    key={module.title}
                    onClick={() => navigate(module.path)}
                    className="group bg-white rounded-2xl border border-black/5 p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${module.color}`}
                      >
                        {module.icon}
                      </div>
                      <span className="text-gray-300 group-hover:text-black transition">
                        ↗
                      </span>
                    </div>
                    <h4 className="font-semibold mt-5">{module.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {module.description}
                    </p>
                    <p className="text-xs font-medium mt-4 text-gray-700">
                      Open module →
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-black/5 shadow-sm">
              <div className="p-6 border-b border-black/5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold">
                    Recent Leads
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Latest accessible enquiries
                  </p>
                </div>
                <button
                  onClick={() => navigate('/portal/leads')}
                  className="text-sm font-medium hover:underline"
                >
                  View all →
                </button>
              </div>

              {recentLeads.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-4xl mb-4">
                    {isAdmin ? '◉' : getDepartmentIcon(department)}
                  </div>
                  <h4 className="font-medium">No leads available</h4>
                  <p className="text-sm text-gray-400 mt-2">
                    {isAdmin
                      ? 'New website enquiries will appear here.'
                      : 'Assigned leads will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/5">
                  {recentLeads.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => navigate('/portal/leads')}
                      className="w-full text-left p-5 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {lead.client_name ||
                              lead.company_name ||
                              'Unnamed Client'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {lead.project_type || 'Project enquiry'}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="px-2.5 py-1 rounded-full bg-gray-100 text-[10px] font-medium">
                            {lead.status || 'NEW'}
                          </span>
                          {lead.work_status && (
                            <span className="text-[10px] text-gray-400">
                              {lead.work_status}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111111] text-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold">Quick Actions</h3>
              <p className="text-sm text-gray-400 mt-1">
                {isAdmin ? 'CRM administration' : `${departmentTitle} workspace`}
              </p>

              <div className="mt-6 space-y-3">
                <QuickAction
                  title="View All Leads"
                  description="Open enquiries and follow-ups"
                  onClick={() => navigate('/portal/leads')}
                />

                {isAdmin ? (
                  <>
                    <QuickAction
                      title="Manage Inventory"
                      description="Review available stock"
                      onClick={() => navigate('/portal/inventory')}
                    />
                    <QuickAction
                      title="Product Catalogue"
                      description="Manage website products"
                      onClick={() => navigate('/portal/product-catalog')}
                    />
                    <QuickAction
                      title="Manage Staff"
                      description="Employee management"
                      onClick={() => navigate('/portal/staff')}
                    />
                    <QuickAction
                      title="Quotations"
                      description="Manage client quotations"
                      onClick={() => navigate('/portal/quotations')}
                    />
                  </>
                ) : (
                  <QuickAction
                    title="All Tasks"
                    description="View and update company tasks"
                    onClick={() => navigate('/portal/tasks')}
                  />
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 bg-white rounded-2xl border border-black/5 shadow-sm p-6">
            <div className="mb-6">
              <h3 className="font-semibold">Lead Pipeline</h3>
              <p className="text-xs text-gray-400 mt-1">
                {isAdmin
                  ? 'Complete CRM lead pipeline'
                  : 'Company-wide lead pipeline'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[
                'NEW',
                'CONTACTED',
                'QUALIFIED',
                'MEETING',
                'SITE VISIT',
                'QUOTATION',
                'NEGOTIATION',
                'WON',
              ].map((stage) => {
                const count = leads.filter(
                  (lead) => lead.status?.toUpperCase() === stage
                ).length;

                return (
                  <div
                    key={stage}
                    className="rounded-xl bg-[#f5f5f3] p-4 text-center"
                  >
                    <p className="text-lg font-semibold">{count}</p>
                    <p className="text-[10px] tracking-wide text-gray-500 mt-1">
                      {stage}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <footer className="mt-8 text-center text-xs text-gray-400">
            SRL Infra Developers · CRM Administration
          </footer>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number;
  description: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-[#111111] text-white flex items-center justify-center text-lg">
          {icon}
        </div>
        <span className="text-xs text-gray-400">CRM</span>
      </div>
      <p className="text-sm text-gray-500 mt-6">{title}</p>
      <p className="text-3xl font-semibold mt-1">{value}</p>
      <p className="text-xs text-gray-400 mt-2">{description}</p>
    </div>
  );
}

function QuickAction({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{title}</p>
        <span className="text-gray-400">↗</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </button>
  );
}
