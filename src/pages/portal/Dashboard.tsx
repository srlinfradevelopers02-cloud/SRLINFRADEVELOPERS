import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pb } from '../../lib/pocketbase';

interface Lead {
  id: string;
  referenceCode?: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  projectType?: string;
  message?: string;
  source?: string;
  status: string;
  created: string;
}

const menuItems = [
  { label: 'Dashboard', icon: '▦', path: '/portal' },
  { label: 'Leads', icon: '◉', path: '/portal/leads' },
  { label: 'Clients', icon: '♙', path: '/portal/clients' },
  { label: 'Projects', icon: '▤', path: '/portal/projects' },
  { label: 'Tasks', icon: '✓', path: '/portal/tasks' },
  { label: 'Quotations', icon: '₹', path: '/portal/quotations' },
  { label: 'Staff', icon: '♟', path: '/portal/staff' },
  { label: 'Documents', icon: '▧', path: '/portal/documents' },
  { label: 'Notifications', icon: '◌', path: '/portal/notifications' },
];

const pipelineStages = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'MEETING',
  'SITE VISIT',
  'QUOTATION',
  'NEGOTIATION',
  'WON',
];

export default function Dashboard() {
  const navigate = useNavigate();

  const currentUser = pb.authStore.record;

  // -----------------------------------------
  // LEAD STATE
  // -----------------------------------------

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [leadError, setLeadError] = useState('');

  // -----------------------------------------
  // LOAD LEADS FROM POCKETBASE
  // -----------------------------------------

  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoadingLeads(true);
        setLeadError('');

        const records = await pb.collection('leads').getFullList<Lead>({
          sort: '-created',
        });

        setLeads(records);
      } catch (error) {
        console.error('Error loading leads:', error);
        setLeadError('Unable to load leads right now.');
      } finally {
        setLoadingLeads(false);
      }
    };

    loadLeads();
  }, []);

  // -----------------------------------------
  // LIVE CRM COUNTS
  // -----------------------------------------

  const newLeadsCount = leads.filter(
    (lead) => lead.status === 'NEW'
  ).length;

  // -----------------------------------------
  // LOGOUT
  // -----------------------------------------

  const handleLogout = () => {
    pb.authStore.clear();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f3] text-[#171717] flex">

      {/* =========================================
          SIDEBAR
      ========================================== */}

      <aside className="w-64 bg-[#111111] text-white min-h-screen hidden md:flex flex-col">

        {/* Brand */}
        <div className="px-6 py-6 border-b border-white/10">

          <img
            src="/logo.png"
            alt="SRL Infra Developers"
            className="w-12 h-12 object-contain mb-4"
          />

          <h1 className="text-lg font-semibold tracking-wide">
            SRL INFRA
          </h1>

          <p className="text-xs text-gray-400 mt-1">
            DEVELOPERS
          </p>

          <div className="mt-4 inline-flex px-3 py-1 rounded-full bg-white/10 text-[10px] tracking-widest uppercase text-gray-300">
            Operational CRM
          </div>

        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">

          {menuItems.map((item, index) => (

            <button
              key={item.label}
              onClick={() => {
                if (index === 0) {
                  navigate('/portal');
                } else {
                  navigate(item.path);
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                index === 0
                  ? 'bg-white text-black'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >

              <span className="w-5 text-center">
                {item.icon}
              </span>

              <span>
                {item.label}
              </span>

            </button>

          ))}

        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-white/10">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:bg-red-500/10 hover:text-red-300 transition"
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =========================================
          MAIN
      ========================================== */}

      <main className="flex-1 min-w-0">

        {/* =========================================
            TOP BAR
        ========================================== */}

        <header className="h-20 bg-white border-b border-black/5 flex items-center justify-between px-6 md:px-10">

          <div>

            <p className="text-xs uppercase tracking-widest text-gray-400">
              Operational CRM
            </p>

            <h2 className="text-xl md:text-2xl font-semibold mt-1">
              Dashboard
            </h2>

          </div>

          <div className="flex items-center gap-4">

            <button
              onClick={() => navigate('/portal/notifications')}
              className="w-10 h-10 rounded-full border border-black/10 hover:bg-gray-50 transition"
              title="Notifications"
            >
              🔔
            </button>

            <div className="hidden sm:block text-right">

              <p className="text-sm font-medium">
                {currentUser?.name ||
                  currentUser?.email ||
                  'Staff'}
              </p>

              <p className="text-xs text-gray-400">
                SRL Team
              </p>

            </div>

            <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-semibold">

              {(currentUser?.name ||
                currentUser?.email ||
                'S')
                .charAt(0)
                .toUpperCase()}

            </div>

          </div>

        </header>

        {/* =========================================
            CONTENT
        ========================================== */}

        <div className="p-6 md:p-10">

          {/* =========================================
              WELCOME
          ========================================== */}

          <section className="mb-8">

            <p className="text-sm text-gray-500">
              Welcome back,
            </p>

            <h3 className="text-2xl md:text-3xl font-semibold mt-1">
              {currentUser?.name || 'SRL Team'}
            </h3>

            <p className="text-gray-500 mt-2 max-w-2xl">
              Manage enquiries, clients, projects, staff assignments
              and quotations from one operational workspace.
            </p>

          </section>

          {/* =========================================
              STAT CARDS
          ========================================== */}

          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">

            {/* New Leads */}

            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-[#111111] text-white flex items-center justify-center text-lg">
                  ◉
                </div>

                <span className="text-xs text-gray-400">
                  LIVE
                </span>

              </div>

              <p className="text-sm text-gray-500 mt-6">
                New Leads
              </p>

              <p className="text-3xl font-semibold mt-1">
                {loadingLeads ? '—' : newLeadsCount}
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Awaiting follow-up
              </p>

            </div>

            {/* Active Projects */}

            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-[#111111] text-white flex items-center justify-center text-lg">
                  ▤
                </div>

                <span className="text-xs text-gray-400">
                  CRM
                </span>

              </div>

              <p className="text-sm text-gray-500 mt-6">
                Active Projects
              </p>

              <p className="text-3xl font-semibold mt-1">
                0
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Currently in progress
              </p>

            </div>

            {/* Pending Quotations */}

            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-[#111111] text-white flex items-center justify-center text-lg">
                  ₹
                </div>

                <span className="text-xs text-gray-400">
                  CRM
                </span>

              </div>

              <p className="text-sm text-gray-500 mt-6">
                Pending Quotations
              </p>

              <p className="text-3xl font-semibold mt-1">
                0
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Awaiting response
              </p>

            </div>

            {/* Open Tasks */}

            <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">

              <div className="flex items-center justify-between">

                <div className="w-11 h-11 rounded-xl bg-[#111111] text-white flex items-center justify-center text-lg">
                  ✓
                </div>

                <span className="text-xs text-gray-400">
                  CRM
                </span>

              </div>

              <p className="text-sm text-gray-500 mt-6">
                Open Tasks
              </p>

              <p className="text-3xl font-semibold mt-1">
                0
              </p>

              <p className="text-xs text-gray-400 mt-2">
                Assigned to team
              </p>

            </div>

          </section>

          {/* =========================================
              WORKSPACE
          ========================================== */}

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* =====================================
                RECENT LEADS
            ====================================== */}

            <div className="xl:col-span-2 bg-white rounded-2xl border border-black/5 shadow-sm">

              <div className="p-6 border-b border-black/5 flex items-center justify-between">

                <div>

                  <h3 className="font-semibold">
                    Recent Leads
                  </h3>

                  <p className="text-xs text-gray-400 mt-1">
                    Latest customer enquiries
                  </p>

                </div>

                <button
                  onClick={() => navigate('/portal/leads')}
                  className="text-sm font-medium hover:underline"
                >
                  View all
                </button>

              </div>

              {/* Lead Content */}

              <div className="p-6">

                {loadingLeads ? (

                  <div className="py-10 text-center">

                    <p className="text-sm text-gray-400">
                      Loading leads...
                    </p>

                  </div>

                ) : leadError ? (

                  <div className="py-10 text-center">

                    <p className="text-sm text-red-500">
                      {leadError}
                    </p>

                  </div>

                ) : leads.length === 0 ? (

                  <div className="py-10 text-center">

                    <div className="text-4xl mb-4">
                      ◉
                    </div>

                    <h4 className="font-medium">
                      No leads yet
                    </h4>

                    <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
                      Website enquiries will appear here automatically.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    {leads.slice(0, 5).map((lead) => (

                      <div
                        key={lead.id}
                        className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#f5f5f3] border border-black/5"
                      >

                        <div className="min-w-0">

                          <p className="font-medium truncate">
                            {lead.name}
                          </p>

                          <p className="text-xs text-gray-500 mt-1 truncate">

                            {lead.projectType ||
                              'General Enquiry'}

                            {lead.company
                              ? ` · ${lead.company}`
                              : ''}

                          </p>

                          {lead.referenceCode && (
                            <p className="text-[10px] text-gray-400 mt-1">
                              {lead.referenceCode}
                            </p>
                          )}

                        </div>

                        <span className="shrink-0 px-3 py-1 rounded-full bg-white border border-black/10 text-[10px] font-semibold tracking-wide">
                          {lead.status}
                        </span>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </div>

            {/* =====================================
                QUICK ACTIONS
            ====================================== */}

            <div className="bg-[#111111] text-white rounded-2xl p-6 shadow-sm">

              <h3 className="font-semibold">
                Quick Actions
              </h3>

              <p className="text-sm text-gray-400 mt-1">
                Frequently used CRM actions
              </p>

              <div className="mt-6 space-y-3">

                <button
                  onClick={() => navigate('/portal/leads')}
                  className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                >

                  <p className="font-medium">
                    + Add Lead
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Create a new customer enquiry
                  </p>

                </button>

                <button
                  onClick={() => navigate('/portal/clients')}
                  className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                >

                  <p className="font-medium">
                    + Add Client
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Register a new client
                  </p>

                </button>

                <button
                  onClick={() => navigate('/portal/projects')}
                  className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                >

                  <p className="font-medium">
                    + New Project
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Start a project workflow
                  </p>

                </button>

                <button
                  onClick={() => navigate('/portal/quotations')}
                  className="w-full text-left px-4 py-4 rounded-xl bg-white/10 hover:bg-white/15 transition"
                >

                  <p className="font-medium">
                    + Create Quotation
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Prepare a client quotation
                  </p>

                </button>

              </div>

            </div>

          </section>

          {/* =========================================
              LEAD PIPELINE
          ========================================== */}

          <section className="mt-6 bg-white rounded-2xl border border-black/5 shadow-sm p-6">

            <div className="mb-6">

              <h3 className="font-semibold">
                Lead Pipeline
              </h3>

              <p className="text-xs text-gray-400 mt-1">
                Track enquiries through the sales process
              </p>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">

              {pipelineStages.map((stage) => {

                const stageCount = leads.filter(
                  (lead) => lead.status === stage
                ).length;

                return (

                  <div
                    key={stage}
                    className="rounded-xl bg-[#f5f5f3] p-4 text-center"
                  >

                    <p className="text-lg font-semibold">
                      {loadingLeads ? '—' : stageCount}
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