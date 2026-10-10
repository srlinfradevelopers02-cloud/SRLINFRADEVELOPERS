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
  { label: 'Quotations', icon: '₹', path: '/portal/quotations' },
  { label: 'Invoices', icon: '▣', path: '/portal/invoices' },
  { label: 'Staff', icon: '♟', path: '/portal/staff' },
];

const STAFF_MENU = [
  { label: 'Dashboard', icon: '▦', path: '/portal' },
  { label: 'My Leads', icon: '◉', path: '/portal/leads' },
  { label: 'My Tasks', icon: '✓', path: '/portal/tasks' },
];

function getDepartmentTitle(department: string) {
  switch (department) {
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
  switch (department) {
    case 'INTERIOR DESIGN':
      return 'Manage assigned interior design enquiries, customers and follow-ups.';

    case 'TELECALLING':
      return 'Manage assigned calls, customer follow-ups and enquiry conversion.';

    case 'AUTOMATION':
      return 'Manage assigned automation enquiries, smart solutions and follow-ups.';

    case 'ELEVATORS':
      return 'Manage assigned elevator enquiries, requirements and follow-ups.';

    default:
      return 'Manage your assigned SRL Infra Developers work.';
  }
}

function getDepartmentIcon(department: string) {
  switch (department) {
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

export default function Dashboard() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState<Staff | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin =
    staff?.role?.toUpperCase() === 'ADMIN';

  const department =
    staff?.department?.toUpperCase() || '';

  const departmentTitle =
    getDepartmentTitle(department);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        navigate('/portal/login', {
          replace: true,
        });

        return;
      }

      const {
        data: staffData,
        error: staffError,
      } = await supabase
        .from('staff')
        .select(`
          id,
          user_id,
          staff_code,
          full_name,
          email,
          role,
          department,
          designation,
          is_active
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffError) {
        throw staffError;
      }

      if (!staffData) {
        await supabase.auth.signOut();

        navigate('/portal/login', {
          replace: true,
        });

        return;
      }

      setStaff(staffData as Staff);

      const {
        data: leadData,
        error: leadError,
      } = await supabase
        .from('leads')
        .select(`
          id,
          client_name,
          company_name,
          project_type,
          status,
          work_status,
          created_at
        `)
        .order('created_at', {
          ascending: false,
        })
        .limit(100);

      if (leadError) {
        throw leadError;
      }

      setLeads((leadData || []) as Lead[]);
    } catch (error: any) {
      console.error(
        'Dashboard loading failed:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate('/portal/login', {
            replace: true,
          });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: leads.length,

      newLeads: leads.filter(
        (lead) => lead.status === 'NEW'
      ).length,

      contacted: leads.filter(
        (lead) => lead.status === 'CONTACTED'
      ).length,

      qualified: leads.filter(
        (lead) => lead.status === 'QUALIFIED'
      ).length,

      quotation: leads.filter(
        (lead) => lead.status === 'QUOTATION'
      ).length,

      won: leads.filter(
        (lead) => lead.status === 'WON'
      ).length,

      active: leads.filter(
        (lead) =>
          lead.status !== 'WON' &&
          lead.status !== 'LOST'
      ).length,

      assigned: leads.filter(
        (lead) =>
          lead.work_status === 'ASSIGNED'
      ).length,
    };
  }, [leads]);

  const recentLeads = leads.slice(0, 6);

  const menuItems = isAdmin
    ? ADMIN_MENU
    : STAFF_MENU;

  const handleLogout = async () => {
    await supabase.auth.signOut();

    navigate('/portal/login', {
      replace: true,
    });
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

  if (!staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#171717] flex">

      <aside className="w-64 bg-[#111111] text-white min-h-screen hidden md:flex flex-col">

        <div className="px-6 py-6 border-b border-white/10">

          <img
            src="/logo.png"
            alt="SRL Infra Developers"
            className="w-12 h-12 object-contain mb-4"
          />

          <h1 className="text-lg font-semibold">
            SRL INFRA
          </h1>

          <p className="text-xs text-gray-400 mt-1">
            DEVELOPERS
          </p>

          <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-white/10 text-[10px] tracking-widest uppercase text-gray-300">
            Operational CRM
          </div>

        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">

          {menuItems.map((item) => {
            const active =
              window.location.pathname ===
              item.path;

            return (
              <button
                key={item.path}
                onClick={() =>
                  navigate(item.path)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                  active
                    ? 'bg-white text-black'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="w-5 text-center">
                  {item.icon}
                </span>

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

        <header className="h-20 bg-white border-b border-black/5 flex items-center justify-between px-6 md:px-10">

          <div>

            <p className="text-xs uppercase tracking-widest text-gray-400">
              {isAdmin
                ? 'Administration'
                : departmentTitle}
            </p>

            <h2 className="text-xl md:text-2xl font-semibold mt-1">
              {isAdmin
                ? 'Admin Dashboard'
                : `${departmentTitle} Dashboard`}
            </h2>

          </div>

          <div className="flex items-center gap-4">

            <div className="hidden sm:block text-right">

              <p className="text-sm font-medium">
                {staff.full_name}
              </p>

              <p className="text-xs text-gray-400">
                {isAdmin
                  ? 'Administrator'
                  : `${departmentTitle} Staff`}
              </p>

            </div>

            <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-semibold">
              {staff.full_name
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        <div className="p-6 md:p-10">

          <section className="mb-8">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

              <div>

                <p className="text-sm text-gray-500">
                  Welcome back,
                </p>

                <h3 className="text-2xl md:text-3xl font-semibold mt-1">
                  {staff.full_name}
                </h3>

                <p className="text-gray-500 mt-2 max-w-2xl">
                  {isAdmin
                    ? 'Manage the complete SRL Infra Developers CRM from one workspace.'
                    : getDepartmentDescription(
                        department
                      )}
                </p>

              </div>

              <div className="w-16 h-16 rounded-2xl bg-[#111111] text-white flex items-center justify-center text-3xl">
                {isAdmin
                  ? '◆'
                  : getDepartmentIcon(
                      department
                    )}
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
                {isAdmin
                  ? 'ALL DEPARTMENTS'
                  : departmentTitle}
              </span>

            </div>

          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

            <StatCard
              title={
                isAdmin
                  ? 'Total Leads'
                  : 'My Leads'
              }
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

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            <div className="xl:col-span-2 bg-white rounded-2xl border border-black/5 shadow-sm">

              <div className="p-6 border-b border-black/5 flex items-center justify-between">

                <div>

                  <h3 className="font-semibold">
                    {isAdmin
                      ? 'Recent Leads'
                      : `My ${departmentTitle} Leads`}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Latest accessible enquiries
                  </p>

                </div>

                <button
                  onClick={() =>
                    navigate('/portal/leads')
                  }
                  className="text-sm font-medium hover:underline"
                >
                  View all
                </button>

              </div>

              {recentLeads.length === 0 ? (

                <div className="p-12 text-center">

                  <div className="text-4xl mb-4">
                    {isAdmin
                      ? '◉'
                      : getDepartmentIcon(
                          department
                        )}
                  </div>

                  <h4 className="font-medium">
                    No leads available
                  </h4>

                  <p className="text-sm text-gray-400 mt-2">
                    {isAdmin
                      ? 'New website enquiries will appear here.'
                      : 'Leads assigned to you will appear here.'}
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-black/5">

                  {recentLeads.map((lead) => (

                    <button
                      key={lead.id}
                      onClick={() =>
                        navigate('/portal/leads')
                      }
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
                            {lead.project_type ||
                              'Project enquiry'}
                          </p>

                        </div>

                        <div className="flex flex-col items-end gap-1">

                          <span className="shrink-0 px-2.5 py-1 rounded-full bg-gray-100 text-[10px] font-medium">
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

              <h3 className="font-semibold">
                Quick Actions
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                {isAdmin
                  ? 'CRM administration'
                  : `${departmentTitle} workspace`}
              </p>

              <div className="mt-6 space-y-3">

                <button
                  onClick={() =>
                    navigate('/portal/leads')
                  }
                  className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                >

                  <p className="font-medium">
                    {isAdmin
                      ? 'View All Leads'
                      : 'View My Leads'}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Open accessible enquiries
                  </p>

                </button>

                {!isAdmin && (
                  <button
                    onClick={() =>
                      navigate('/portal/tasks')
                    }
                    className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                  >
                    <p className="font-medium">
                      My Tasks
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Check assigned work
                    </p>
                  </button>
                )}

                {isAdmin && (
                  <>
                    <button
                      onClick={() =>
                        navigate('/portal/staff')
                      }
                      className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                    >
                      <p className="font-medium">
                        Manage Staff
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Add and manage employees
                      </p>
                    </button>

                    <button
                      onClick={() =>
                        navigate('/portal/quotations')
                      }
                      className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                    >
                      <p className="font-medium">
                        Quotations
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        Manage client quotations
                      </p>
                    </button>
                  </>
                )}

              </div>

            </div>

          </section>

          <section className="mt-6 bg-white rounded-2xl border border-black/5 shadow-sm p-6">

            <div className="mb-6">

              <h3 className="font-semibold">
                Lead Pipeline
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                {isAdmin
                  ? 'Complete CRM pipeline'
                  : `Your ${departmentTitle} pipeline`}
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

                const count =
                  leads.filter(
                    (lead) =>
                      lead.status === stage
                  ).length;

                return (
                  <div
                    key={stage}
                    className="rounded-xl bg-[#f5f5f3] p-4 text-center"
                  >

                    <p className="text-lg font-semibold">
                      {count}
                    </p>

                    <p className="text-[10px] tracking-wide text-gray-500 mt-1">
                      {stage}
                    </p>

                  </div>
                );
              })}

            </div>

          </section>

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

        <span className="text-xs text-gray-400">
          LIVE
        </span>

      </div>

      <p className="text-sm text-gray-500 mt-6">
        {title}
      </p>

      <p className="text-3xl font-semibold mt-1">
        {value}
      </p>

      <p className="text-xs text-gray-400 mt-2">
        {description}
      </p>

    </div>
  );
}