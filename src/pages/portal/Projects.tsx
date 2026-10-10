import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Row = Record<string, any>;

type Project = {
  id: number;
  project_code: string;
  project_name: string;
  client_id: number | null;
  project_type: string;
  location: string | null;
  description: string | null;
  project_manager: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  project_value: number;
  status: string;
  quotation_id: number | null;
  invoice_id: number | null;
  notes: string | null;
  assigned_staff_id: string | null;
  created_at: string;
  updated_at: string;
};

type Staff = {
  id: string;
  user_id: string | null;
  name?: string;
  full_name?: string;
  employee_name?: string;
  email?: string;
  role: string;
  is_active: boolean;
};

const PROJECT_TYPES = [
  'Commercial Infrastructure',
  'Interior Design',
  'Automation',
  'Elevators',
  'Government Office',
  'Restaurant',
  'Banquet Hall',
  'Retail',
  'Residential',
  'Other',
];

const PROJECT_STATUSES = [
  'PLANNING',
  'DESIGN',
  'APPROVED',
  'IN PROGRESS',
  'ON HOLD',
  'COMPLETED',
  'CANCELLED',
];

const emptyForm = {
  project_name: '',
  client_id: '',
  project_type: 'Commercial Infrastructure',
  location: '',
  description: '',
  project_manager: '',
  start_date: '',
  expected_end_date: '',
  actual_end_date: '',
  project_value: '0',
  status: 'PLANNING',
  quotation_id: '',
  invoice_id: '',
  notes: '',
  assigned_staff_id: '',
};

const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const dateText = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
};

const dateInput = (value?: string | null) =>
  value ? value.slice(0, 10) : '';

const displayClient = (client: Row) =>
  client.company ||
  client.company_name ||
  client.name ||
  client.client_name ||
  client.full_name ||
  `Client ${client.id}`;

const displayStaff = (staff: Staff) =>
  staff.name ||
  staff.full_name ||
  staff.employee_name ||
  staff.email ||
  `Staff ${staff.id}`;

const displayQuotation = (quotation: Row) =>
  quotation.quotation_number ||
  quotation.quotationNumber ||
  `Quotation ${quotation.id}`;

const displayInvoice = (invoice: Row) =>
  invoice.invoice_number ||
  invoice.invoiceNumber ||
  `Invoice ${invoice.id}`;

export default function Projects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Row[]>([]);
  const [quotations, setQuotations] = useState<Row[]>([]);
  const [invoices, setInvoices] = useState<Row[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const [currentUserId, setCurrentUserId] = useState('');
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        navigate('/portal/login');
        return;
      }

      setCurrentUserId(user.id);

      const { data: staffRecord, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (staffError) throw staffError;

      if (!staffRecord || !staffRecord.is_active) {
        throw new Error('Active staff account not found for this login.');
      }

      const loggedInStaff = staffRecord as Staff;
      const admin = String(loggedInStaff.role).toUpperCase() === 'ADMIN';

      setCurrentStaff(loggedInStaff);
      setIsAdmin(admin);

      const [
        projectsResult,
        clientsResult,
        quotationsResult,
        invoicesResult,
        staffResult,
      ] = await Promise.all([
        supabase
          .from('projects')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('clients')
          .select('*')
          .order('id', { ascending: false }),

        supabase
          .from('quotations')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('staff')
          .select('*')
          .eq('is_active', true)
          .order('id', { ascending: true }),
      ]);

      if (projectsResult.error) throw projectsResult.error;
      if (clientsResult.error) throw clientsResult.error;
      if (quotationsResult.error) throw quotationsResult.error;
      if (invoicesResult.error) throw invoicesResult.error;
      if (staffResult.error) throw staffResult.error;

      const allProjects = (projectsResult.data || []) as Project[];

      setProjects(
        admin
          ? allProjects
          : allProjects.filter(
              (project) =>
                project.assigned_staff_id === loggedInStaff.id,
            ),
      );

      setClients(clientsResult.data || []);
      setQuotations(quotationsResult.data || []);
      setInvoices(invoicesResult.data || []);
      setStaffList((staffResult.data || []) as Staff[]);
    } catch (err: any) {
      console.error('Projects load failed:', err);
      setError(err?.message || 'Unable to load projects.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const getClient = (id: number | null) =>
    clients.find((item) => Number(item.id) === Number(id));

  const getQuotation = (id: number | null) =>
    quotations.find((item) => Number(item.id) === Number(id));

  const getInvoice = (id: number | null) =>
    invoices.find((item) => Number(item.id) === Number(id));

  const getStaff = (id: string | null) =>
    staffList.find((item) => item.id === id);

  const generateProjectCode = () => {
    const year = new Date().getFullYear();
    const next = projects.reduce((max, project) => {
      const match = project.project_code?.match(/^PRJ-\d{4}-(\d+)$/);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0) + 1;

    return `PRJ-${year}-${String(next).padStart(4, '0')}`;
  };

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();

    return projects.filter((project) => {
      const client = getClient(project.client_id);
      const assignedStaff = getStaff(project.assigned_staff_id);

      const searchableText = [
        project.project_code,
        project.project_name,
        project.project_type,
        project.location,
        project.project_manager,
        client ? displayClient(client) : '',
        assignedStaff ? displayStaff(assignedStaff) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (statusFilter === 'ALL' || project.status === statusFilter) &&
        (typeFilter === 'ALL' || project.project_type === typeFilter)
      );
    });
  }, [projects, clients, staffList, search, statusFilter, typeFilter]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((p) =>
        ['DESIGN', 'APPROVED', 'IN PROGRESS'].includes(p.status),
      ).length,
      planning: projects.filter((p) => p.status === 'PLANNING').length,
      completed: projects.filter((p) => p.status === 'COMPLETED').length,
      value: projects.reduce(
        (sum, p) => sum + Number(p.project_value || 0),
        0,
      ),
    }),
    [projects],
  );

  const openAdd = () => {
    if (!isAdmin) return;

    setEditingProject(null);
    setSelectedProject(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (project: Project) => {
    if (!isAdmin) return;

    setEditingProject(project);
    setSelectedProject(project);

    setForm({
      project_name: project.project_name || '',
      client_id: project.client_id == null ? '' : String(project.client_id),
      project_type: project.project_type || PROJECT_TYPES[0],
      location: project.location || '',
      description: project.description || '',
      project_manager: project.project_manager || '',
      start_date: dateInput(project.start_date),
      expected_end_date: dateInput(project.expected_end_date),
      actual_end_date: dateInput(project.actual_end_date),
      project_value: String(project.project_value ?? 0),
      status: project.status || 'PLANNING',
      quotation_id:
        project.quotation_id == null ? '' : String(project.quotation_id),
      invoice_id:
        project.invoice_id == null ? '' : String(project.invoice_id),
      notes: project.notes || '',
      assigned_staff_id: project.assigned_staff_id || '',
    });

    setShowForm(true);
  };

  const saveProject = async () => {
    if (!isAdmin) {
      alert('Only admins can create or edit projects.');
      return;
    }

    if (!form.project_name.trim()) {
      alert('Enter a project name.');
      return;
    }

    if (!form.client_id) {
      alert('Select a client.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const now = new Date().toISOString();

      const payload = {
        project_code:
          editingProject?.project_code || generateProjectCode(),
        project_name: form.project_name.trim(),
        client_id: Number(form.client_id),
        project_type: form.project_type,
        location: form.location.trim() || null,
        description: form.description.trim() || null,
        project_manager: form.project_manager.trim() || null,
        start_date: form.start_date || null,
        expected_end_date: form.expected_end_date || null,
        actual_end_date: form.actual_end_date || null,
        project_value: Number(form.project_value) || 0,
        status: form.status,
        quotation_id: form.quotation_id ? Number(form.quotation_id) : null,
        invoice_id: form.invoice_id ? Number(form.invoice_id) : null,
        notes: form.notes.trim() || null,
        assigned_staff_id: form.assigned_staff_id || null,
        updated_at: now,
      };

      if (editingProject) {
        const { data, error: updateError } = await supabase
          .from('projects')
          .update(payload)
          .eq('id', editingProject.id)
          .select('*')
          .single();

        if (updateError) throw updateError;

        setProjects((previous) =>
          previous.map((item) =>
            item.id === editingProject.id ? (data as Project) : item,
          ),
        );
        setSelectedProject(data as Project);
        alert('Project updated successfully.');
      } else {
        const { data, error: insertError } = await supabase
          .from('projects')
          .insert({ ...payload, created_at: now })
          .select('*')
          .single();

        if (insertError) throw insertError;

        setProjects((previous) => [data as Project, ...previous]);
        setSelectedProject(data as Project);
        alert(`Project ${data.project_code} created successfully.`);
      }

      setShowForm(false);
    } catch (err: any) {
      console.error('Project save failed:', err);
      alert(err?.message || 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (project: Project, status: string) => {
    if (!isAdmin) return;

    try {
      const { data, error: updateError } = await supabase
        .from('projects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', project.id)
        .select('*')
        .single();

      if (updateError) throw updateError;

      setProjects((previous) =>
        previous.map((item) =>
          item.id === project.id ? (data as Project) : item,
        ),
      );
      setSelectedProject(data as Project);
    } catch (err: any) {
      console.error('Project status update failed:', err);
      alert(err?.message || 'Unable to update project status.');
    }
  };

  const deleteProject = async (project: Project) => {
    if (!isAdmin) return;

    if (!window.confirm(`Delete ${project.project_code} — ${project.project_name}?`)) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (deleteError) throw deleteError;

      setProjects((previous) =>
        previous.filter((item) => item.id !== project.id),
      );

      if (selectedProject?.id === project.id) {
        setSelectedProject(null);
      }

      alert('Project deleted successfully.');
    } catch (err: any) {
      console.error('Project deletion failed:', err);
      alert(err?.message || 'Unable to delete project.');
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:ring-2 focus:ring-amber-500';

  const labelClass = 'text-sm font-medium text-gray-700';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <button
              onClick={() => navigate('/portal')}
              className="mb-3 text-sm text-gray-500 hover:text-amber-700"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="mt-2 text-gray-500">
              Manage SRL Infra Developers projects from planning to completion.
            </p>

            {currentStaff && (
              <p className="mt-2 text-sm text-gray-600">
                Logged in: {displayStaff(currentStaff)} ({isAdmin ? 'Admin' : 'Staff'})
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-lg border bg-white px-4 py-3 disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>

            {isAdmin && (
              <button
                onClick={openAdd}
                className="rounded-lg bg-amber-700 px-5 py-3 font-semibold text-white hover:bg-amber-800"
              >
                + New Project
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Projects failed to load</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => void loadData()}
              className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-white"
            >
              Retry
            </button>
          </div>
        )}

        <div className="mb-7 grid grid-cols-2 gap-4 lg:grid-cols-5">
          {[
            ['Total Projects', stats.total],
            ['Active', stats.active],
            ['Planning', stats.planning],
            ['Completed', stats.completed],
            ['Total Value', currency(stats.value)],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border bg-white p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 rounded-xl border bg-white p-4 md:grid-cols-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search project, client, staff, location..."
            className="rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border px-4 py-3"
          >
            <option value="ALL">All statuses</option>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border px-4 py-3"
          >
            <option value="ALL">All project types</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-xl border bg-white p-10 text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              No projects found
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {isAdmin
                ? 'Create a project or change your search filters.'
                : 'No projects are assigned to your staff account yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => {
              const client = getClient(project.client_id);
              const assignedStaff = getStaff(project.assigned_staff_id);
              const quotation = getQuotation(project.quotation_id);
              const invoice = getInvoice(project.invoice_id);

              return (
                <article
                  key={project.id}
                  className="overflow-hidden rounded-xl border bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b bg-gray-900 p-5 text-white md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-amber-400">
                        {project.project_code}
                      </p>
                      <h2 className="mt-1 text-xl font-bold">
                        {project.project_name}
                      </h2>
                      <p className="mt-1 text-sm text-gray-300">
                        {client ? displayClient(client) : 'Client not found'}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                      {project.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase text-gray-500">Project Type</p>
                      <p className="mt-1 font-medium">{project.project_type || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Location</p>
                      <p className="mt-1 font-medium">{project.location || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Project Manager</p>
                      <p className="mt-1 font-medium">{project.project_manager || '—'}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Assigned Staff</p>
                      <p className="mt-1 font-medium">
                        {assignedStaff ? displayStaff(assignedStaff) : 'Not assigned'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Start Date</p>
                      <p className="mt-1 font-medium">{dateText(project.start_date)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Expected End</p>
                      <p className="mt-1 font-medium">{dateText(project.expected_end_date)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Project Value</p>
                      <p className="mt-1 font-semibold">{currency(project.project_value)}</p>
                    </div>

                    <div>
                      <p className="text-xs uppercase text-gray-500">Actual End</p>
                      <p className="mt-1 font-medium">{dateText(project.actual_end_date)}</p>
                    </div>
                  </div>

                  {project.description && (
                    <div className="border-t px-5 py-4">
                      <p className="text-xs uppercase text-gray-500">Description</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                        {project.description}
                      </p>
                    </div>
                  )}

                  {(quotation || invoice || project.notes) && (
                    <div className="grid gap-4 border-t p-5 sm:grid-cols-3">
                      {quotation && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Quotation</p>
                          <p className="mt-1 font-medium">{displayQuotation(quotation)}</p>
                        </div>
                      )}

                      {invoice && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Invoice</p>
                          <p className="mt-1 font-medium">{displayInvoice(invoice)}</p>
                        </div>
                      )}

                      {project.notes && (
                        <div>
                          <p className="text-xs uppercase text-gray-500">Notes</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">{project.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">
                      Updated: {dateText(project.updated_at)}
                    </p>

                    {isAdmin && (
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={project.status}
                          onChange={(e) => void updateStatus(project, e.target.value)}
                          className="rounded-lg border bg-white px-3 py-2 text-sm"
                        >
                          {PROJECT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={() => openEdit(project)}
                          className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => void deleteProject(project)}
                          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {showForm && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <div className="my-8 max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">
                <div>
                  <h2 className="text-2xl font-bold">
                    {editingProject ? 'Edit Project' : 'Create Project'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the project details below.
                  </p>
                </div>

                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-2xl text-gray-500 hover:bg-gray-100"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <label className={labelClass}>
                  Project Name *
                  <input
                    value={form.project_name}
                    onChange={(e) =>
                      setForm({ ...form, project_name: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Project name"
                    required
                  />
                </label>

                <label className={labelClass}>
                  Client *
                  <select
                    value={form.client_id}
                    onChange={(e) =>
                      setForm({ ...form, client_id: e.target.value })
                    }
                    className={inputClass}
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {displayClient(client)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Project Type *
                  <select
                    value={form.project_type}
                    onChange={(e) =>
                      setForm({ ...form, project_type: e.target.value })
                    }
                    className={inputClass}
                  >
                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Assign Staff
                  <select
                    value={form.assigned_staff_id}
                    onChange={(e) =>
                      setForm({ ...form, assigned_staff_id: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">Not assigned</option>
                    {staffList
                      .filter((staff) => String(staff.role).toUpperCase() !== 'ADMIN')
                      .map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {displayStaff(staff)}
                        </option>
                      ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Project Manager
                  <input
                    value={form.project_manager}
                    onChange={(e) =>
                      setForm({ ...form, project_manager: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Manager name"
                  />
                </label>

                <label className={labelClass}>
                  Site / Location
                  <input
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className={inputClass}
                    placeholder="Project site address"
                  />
                </label>

                <label className={labelClass}>
                  Start Date
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(e) =>
                      setForm({ ...form, start_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Expected End Date
                  <input
                    type="date"
                    value={form.expected_end_date}
                    onChange={(e) =>
                      setForm({ ...form, expected_end_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Actual End Date
                  <input
                    type="date"
                    value={form.actual_end_date}
                    onChange={(e) =>
                      setForm({ ...form, actual_end_date: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Project Value (₹)
                  <input
                    type="number"
                    min="0"
                    value={form.project_value}
                    onChange={(e) =>
                      setForm({ ...form, project_value: e.target.value })
                    }
                    className={inputClass}
                  />
                </label>

                <label className={labelClass}>
                  Status
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className={inputClass}
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Quotation
                  <select
                    value={form.quotation_id}
                    onChange={(e) =>
                      setForm({ ...form, quotation_id: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">No quotation</option>
                    {quotations.map((quotation) => (
                      <option key={quotation.id} value={quotation.id}>
                        {displayQuotation(quotation)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={labelClass}>
                  Invoice
                  <select
                    value={form.invoice_id}
                    onChange={(e) =>
                      setForm({ ...form, invoice_id: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="">No invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {displayInvoice(invoice)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={`${labelClass} md:col-span-2`}>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className={inputClass}
                    rows={3}
                    placeholder="Project scope and description"
                  />
                </label>

                <label className={`${labelClass} md:col-span-2`}>
                  Notes
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    className={inputClass}
                    rows={2}
                    placeholder="Additional notes"
                  />
                </label>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white p-5">
                <button
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-lg border px-5 py-3"
                >
                  Cancel
                </button>

                <button
                  onClick={() => void saveProject()}
                  disabled={saving}
                  className="rounded-lg bg-amber-700 px-6 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingProject
                      ? 'Update Project'
                      : 'Create Project'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}