import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useNavigate } from 'react-router-dom';
import { pb } from '../../lib/pocketbase';

/* =========================================================
   TYPES
========================================================= */

type Client = {
  id: string;
  clientCode?: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  address?: string;
  clientType?: string;
};

type Quotation = {
  id: string;
  quotationNumber: string;
  client: string;
  quotationDate: string;
  projectName?: string;
  status: string;
  subTotal?: number;
  discount?: number;
  tax?: number;
  grandTotal?: number;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  client: string;
  quotation?: string;
  projectName?: string;
  grandTotal?: number;
  status: string;
};

type Project = {
  id: string;

  projectCode: string;
  projectName: string;

  client: string;

  projectType: string;

  location?: string;
  description?: string;

  projectManager?: string;

  startDate?: string;
  expectedEndDate?: string;
  actualEndDate?: string;

  projectValue?: number;

  status: string;

  quotation?: string;
  invoice?: string;

  notes?: string;

  created: string;
  updated: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PROJECT_TYPES = [
  'Commercial Infrastructure',
  'Interior Design',
  'Automation',
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

/* =========================================================
   HELPERS
========================================================= */

const formatCurrency = (
  value: number = 0
) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (
  value?: string
) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }
  );
};

const todayISO = () =>
  new Date()
    .toISOString()
    .slice(0, 10);

/* =========================================================
   COMPONENT
========================================================= */

export default function Projects() {
  const navigate = useNavigate();

  /* =======================================================
     DATA
  ======================================================= */

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [quotations, setQuotations] =
    useState<Quotation[]>([]);

  const [invoices, setInvoices] =
    useState<Invoice[]>([]);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [typeFilter, setTypeFilter] =
    useState('ALL');

  const [showForm, setShowForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);

  const [selectedProject, setSelectedProject] =
    useState<Project | null>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const emptyForm = {
    projectName: '',
    client: '',
    projectType: 'Commercial Infrastructure',
    location: '',
    description: '',
    projectManager: '',
    startDate: '',
    expectedEndDate: '',
    actualEndDate: '',
    projectValue: '',
    status: 'PLANNING',
    quotation: '',
    invoice: '',
    notes: '',
  };

  const [form, setForm] =
    useState(emptyForm);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = useCallback(
    async () => {
      try {
        setLoading(true);

        const [
          projectResult,
          clientResult,
          quotationResult,
          invoiceResult,
        ] = await Promise.all([
          pb
            .collection('projects')
            .getFullList<Project>({
              sort: '-created',
            }),

          pb
            .collection('clients')
            .getFullList<Client>({
              sort: 'name',
            }),

          pb
            .collection('quotations')
            .getFullList<Quotation>({
              sort: '-created',
            }),

          pb
            .collection('invoices')
            .getFullList<Invoice>({
              sort: '-created',
            }),
        ]);

        setProjects(projectResult);
        setClients(clientResult);
        setQuotations(
          quotationResult
        );
        setInvoices(invoiceResult);
      } catch (error: any) {
        console.error(
          'Failed to load projects:',
          error
        );

        alert(
          `Failed to load projects.\n\n${
            error?.message ||
            'Unknown error'
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     LOOKUPS
  ======================================================= */

  const getClient = useCallback(
    (clientId?: string) =>
      clients.find(
        (client) =>
          client.id === clientId
      ),
    [clients]
  );

  const getQuotation =
    useCallback(
      (quotationId?: string) =>
        quotations.find(
          (quotation) =>
            quotation.id ===
            quotationId
        ),
      [quotations]
    );

  const getInvoice = useCallback(
    (invoiceId?: string) =>
      invoices.find(
        (invoice) =>
          invoice.id === invoiceId
      ),
    [invoices]
  );

  /* =======================================================
     PROJECT CODE
  ======================================================= */

  const generateProjectCode =
    useCallback(() => {
      const year =
        new Date().getFullYear();

      const numbers =
        projects
          .map((project) => {
            const match =
              project.projectCode?.match(
                /PRJ-\d{4}-(\d+)/
              );

            return match
              ? Number(match[1])
              : 0;
          })
          .filter(
            (number) =>
              !Number.isNaN(number)
          );

      const nextNumber =
        numbers.length > 0
          ? Math.max(...numbers) + 1
          : 1;

      return `PRJ-${year}-${String(
        nextNumber
      ).padStart(4, '0')}`;
    }, [projects]);

  /* =======================================================
     FILTER
  ======================================================= */

  const filteredProjects =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return projects.filter(
        (project) => {
          const client =
            getClient(
              project.client
            );

          const searchText = [
            project.projectCode,
            project.projectName,
            project.projectType,
            project.location,
            project.projectManager,
            client?.name,
            client?.company,
            client?.phone,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          const matchesSearch =
            !query ||
            searchText.includes(query);

          const matchesStatus =
            statusFilter === 'ALL' ||
            project.status ===
              statusFilter;

          const matchesType =
            typeFilter === 'ALL' ||
            project.projectType ===
              typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      projects,
      search,
      statusFilter,
      typeFilter,
      getClient,
    ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const total =
      projects.length;

    const active =
      projects.filter(
        (project) =>
          project.status ===
            'IN PROGRESS' ||
          project.status ===
            'DESIGN' ||
          project.status ===
            'APPROVED'
      ).length;

    const planning =
      projects.filter(
        (project) =>
          project.status ===
          'PLANNING'
      ).length;

    const completed =
      projects.filter(
        (project) =>
          project.status ===
          'COMPLETED'
      ).length;

    const totalValue =
      projects.reduce(
        (sum, project) =>
          sum +
          Number(
            project.projectValue ||
              0
          ),
        0
      );

    return {
      total,
      active,
      planning,
      completed,
      totalValue,
    };
  }, [projects]);

  /* =======================================================
     OPEN ADD FORM
  ======================================================= */

  const openAddForm = () => {
    setEditingProject(null);

    setForm({
      ...emptyForm,
      status: 'PLANNING',
      projectType:
        'Commercial Infrastructure',
    });

    setShowForm(true);
  };

  /* =======================================================
     OPEN EDIT FORM
  ======================================================= */

  const openEditForm = (
    project: Project
  ) => {
    setEditingProject(project);

    setForm({
      projectName:
        project.projectName ||
        '',

      client:
        project.client || '',

      projectType:
        project.projectType ||
        'Commercial Infrastructure',

      location:
        project.location || '',

      description:
        project.description ||
        '',

      projectManager:
        project.projectManager ||
        '',

      startDate:
        project.startDate
          ? project.startDate.slice(
              0,
              10
            )
          : '',

      expectedEndDate:
        project.expectedEndDate
          ? project.expectedEndDate.slice(
              0,
              10
            )
          : '',

      actualEndDate:
        project.actualEndDate
          ? project.actualEndDate.slice(
              0,
              10
            )
          : '',

      projectValue:
        project.projectValue !==
        undefined
          ? String(
              project.projectValue
            )
          : '',

      status:
        project.status ||
        'PLANNING',

      quotation:
        project.quotation ||
        '',

      invoice:
        project.invoice ||
        '',

      notes:
        project.notes || '',
    });

    setShowForm(true);
  };

  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  const saveProject =
    async () => {
      if (
        !form.projectName.trim()
      ) {
        alert(
          'Please enter the project name.'
        );

        return;
      }

      if (!form.client) {
        alert(
          'Please select a client.'
        );

        return;
      }

      if (!form.projectType) {
        alert(
          'Please select the project type.'
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          projectCode:
            editingProject
              ?.projectCode ||
            generateProjectCode(),

          projectName:
            form.projectName.trim(),

          client:
            form.client,

          projectType:
            form.projectType,

          location:
            form.location.trim(),

          description:
            form.description.trim(),

          projectManager:
            form.projectManager.trim(),

          startDate:
            form.startDate
              ? `${form.startDate} 00:00:00`
              : '',

          expectedEndDate:
            form.expectedEndDate
              ? `${form.expectedEndDate} 00:00:00`
              : '',

          actualEndDate:
            form.actualEndDate
              ? `${form.actualEndDate} 00:00:00`
              : '',

          projectValue:
            Number(
              form.projectValue ||
                0
            ),

          status:
            form.status,

          quotation:
            form.quotation ||
            '',

          invoice:
            form.invoice ||
            '',

          notes:
            form.notes.trim(),
        };

        if (editingProject) {
          const updated =
            await pb
              .collection(
                'projects'
              )
              .update<Project>(
                editingProject.id,
                payload
              );

          setProjects(
            (previous) =>
              previous.map(
                (project) =>
                  project.id ===
                  updated.id
                    ? updated
                    : project
              )
          );

          setSelectedProject(
            updated
          );

          alert(
            'Project updated successfully.'
          );
        } else {
          const created =
            await pb
              .collection(
                'projects'
              )
              .create<Project>(
                payload
              );

          setProjects(
            (previous) => [
              created,
              ...previous,
            ]
          );

          setSelectedProject(
            created
          );

          alert(
            `Project ${created.projectCode} created successfully.`
          );
        }

        setShowForm(false);
      } catch (error: any) {
        console.error(
          'Project save failed:',
          error
        );

        console.error(
          'Response:',
          error?.response?.data
        );

        alert(
          `Failed to save project.\n\n${
            error?.response?.data
              ? JSON.stringify(
                  error.response.data,
                  null,
                  2
                )
              : error?.message ||
                'Unknown error'
          }`
        );
      } finally {
        setSaving(false);
      }
    };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteProject =
    async (
      project: Project
    ) => {
      const confirmed =
        window.confirm(
          `Delete project ${project.projectCode}?\n\nThis action cannot be undone.`
        );

      if (!confirmed) {
        return;
      }

      try {
        await pb
          .collection('projects')
          .delete(project.id);

        setProjects(
          (previous) =>
            previous.filter(
              (item) =>
                item.id !==
                project.id
            )
        );

        setSelectedProject(
          null
        );

        setShowDetails(false);

        alert(
          'Project deleted successfully.'
        );
      } catch (error: any) {
        console.error(
          'Project deletion failed:',
          error
        );

        alert(
          `Failed to delete project.\n\n${
            error?.message ||
            'Unknown error'
          }`
        );
      }
    };

  /* =======================================================
     CHANGE STATUS
  ======================================================= */

  const updateProjectStatus =
    async (
      project: Project,
      status: string
    ) => {
      try {
        const updated =
          await pb
            .collection(
              'projects'
            )
            .update<Project>(
              project.id,
              {
                status,
              }
            );

        setProjects(
          (previous) =>
            previous.map(
              (item) =>
                item.id ===
                updated.id
                  ? updated
                  : item
            )
        );

        setSelectedProject(
          updated
        );
      } catch (error: any) {
        console.error(
          'Status update failed:',
          error
        );

        alert(
          `Failed to update status.\n\n${
            error?.message ||
            'Unknown error'
          }`
        );
      }
    };

  /* =======================================================
     CREATE PROJECT FROM APPROVED QUOTATION
  ======================================================= */

  const createFromQuotation =
    async (
      quotation: Quotation
    ) => {
      if (
        quotation.status !==
        'APPROVED'
      ) {
        alert(
          'Only APPROVED quotations can create a project.'
        );

        return;
      }

      const existing =
        projects.find(
          (project) =>
            project.quotation ===
            quotation.id
        );

      if (existing) {
        setSelectedProject(
          existing
        );

        setShowDetails(true);

        alert(
          `A project already exists for quotation ${quotation.quotationNumber}.`
        );

        return;
      }

      const client =
        getClient(
          quotation.client
        );

      setEditingProject(null);

      setForm({
        projectName:
          quotation.projectName ||
          '',

        client:
          quotation.client ||
          '',

        projectType:
          'Commercial Infrastructure',

        location: '',

        description:
          `Project created from quotation ${quotation.quotationNumber}.`,

        projectManager: '',

        startDate:
          todayISO(),

        expectedEndDate: '',

        actualEndDate: '',

        projectValue:
          quotation.grandTotal
            ? String(
                quotation.grandTotal
              )
            : '',

        status:
          'PLANNING',

        quotation:
          quotation.id,

        invoice: '',

        notes:
          `Source quotation: ${quotation.quotationNumber}${
            client
              ? `\nClient: ${
                  client.company ||
                  client.name
                }`
              : ''
          }`,
      });

      setShowForm(true);
    };

  /* =======================================================
     OPEN PROJECT
  ======================================================= */

  const openProject = (
    project: Project
  ) => {
    setSelectedProject(
      project
    );

    setShowDetails(true);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="max-w-7xl mx-auto">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <button
              onClick={() =>
                navigate('/portal')
              }
              className="text-sm text-gray-500 hover:text-[#9a641f] mb-2"
            >
              ← Back to Dashboard
            </button>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              Projects
            </h1>

            <p className="text-gray-500 mt-1">
              Manage SRL INFRA DEVELOPERS projects from planning to completion.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={
                loadData
              }
              disabled={
                loading
              }
              className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
            >
              {loading
                ? 'Refreshing...'
                : 'Refresh'}
            </button>

            <button
              onClick={
                openAddForm
              }
              className="px-5 py-3 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017]"
            >
              + New Project
            </button>

          </div>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-7">

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Total Projects
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.total}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Active
            </p>

            <p className="text-2xl font-bold mt-2 text-blue-600">
              {stats.active}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Planning
            </p>

            <p className="text-2xl font-bold mt-2 text-orange-600">
              {stats.planning}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Completed
            </p>

            <p className="text-2xl font-bold mt-2 text-green-600">
              {stats.completed}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Project Value
            </p>

            <p className="text-xl font-bold mt-2">
              {formatCurrency(
                stats.totalValue
              )}
            </p>

          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="bg-white border rounded-xl p-4 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

            <input
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search project, client, location..."
              className="border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#c5832b]"
            />

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Status
              </option>

              {PROJECT_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}

            </select>

            <select
              value={
                typeFilter
              }
              onChange={(
                event
              ) =>
                setTypeFilter(
                  event.target.value
                )
              }
              className="border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Project Types
              </option>

              {PROJECT_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* =================================================
            PROJECT TABLE
        ================================================= */}

        <div className="bg-white border rounded-xl overflow-hidden">

          {loading ? (

            <div className="p-10 text-center text-gray-500">
              Loading projects...
            </div>

          ) : filteredProjects.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl mb-4">
                🏗️
              </div>

              <h3 className="font-semibold text-lg">
                No projects found
              </h3>

              <p className="text-gray-500 mt-1">
                Create your first project to start managing work.
              </p>

              <button
                onClick={
                  openAddForm
                }
                className="mt-5 px-5 py-3 rounded-lg bg-[#9a641f] text-white"
              >
                + Create Project
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-900 text-white">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Project
                    </th>

                    <th className="text-left px-5 py-4">
                      Client
                    </th>

                    <th className="text-left px-5 py-4">
                      Type
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                    <th className="text-left px-5 py-4">
                      Timeline
                    </th>

                    <th className="text-right px-5 py-4">
                      Value
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredProjects.map(
                    (
                      project
                    ) => {

                      const client =
                        getClient(
                          project.client
                        );

                      return (

                        <tr
                          key={
                            project.id
                          }
                          onClick={() =>
                            openProject(
                              project
                            )
                          }
                          className="border-b hover:bg-gray-50 cursor-pointer"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-[#9a641f]">
                              {
                                project.projectCode
                              }
                            </p>

                            <p className="font-medium text-gray-900">
                              {
                                project.projectName
                              }
                            </p>

                            {project.location && (
                              <p className="text-xs text-gray-500">
                                📍{' '}
                                {
                                  project.location
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium">
                              {
                                client?.company ||
                                client?.name ||
                                '—'
                              }
                            </p>

                            {client?.phone && (
                              <p className="text-xs text-gray-500">
                                {
                                  client.phone
                                }
                              </p>
                            )}

                          </td>

                          <td className="px-5 py-4">

                            <span className="text-sm">
                              {
                                project.projectType
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <span
                              className={`
                                inline-flex
                                px-3 py-1
                                rounded-full
                                text-xs
                                font-semibold

                                ${
                                  project.status ===
                                  'COMPLETED'
                                    ? 'bg-green-100 text-green-700'
                                    : project.status ===
                                      'CANCELLED'
                                    ? 'bg-red-100 text-red-700'
                                    : project.status ===
                                      'IN PROGRESS'
                                    ? 'bg-blue-100 text-blue-700'
                                    : project.status ===
                                      'ON HOLD'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              `}
                            >
                              {
                                project.status
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4 text-sm">

                            <div>
                              Start:{' '}
                              {formatDate(
                                project.startDate
                              )}
                            </div>

                            <div className="text-gray-500">
                              End:{' '}
                              {formatDate(
                                project.expectedEndDate
                              )}
                            </div>

                          </td>

                          <td className="px-5 py-4 text-right font-semibold">

                            {formatCurrency(
                              project.projectValue ||
                                0
                            )}

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </div>

      {/* ===================================================
          CREATE / EDIT MODAL
      =================================================== */}

      {showForm && (

        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">

            <div className="p-6 border-b flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  {editingProject
                    ? 'Edit Project'
                    : 'Create Project'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingProject
                    ? editingProject.projectCode
                    : 'New project'}
                </p>

              </div>

              <button
                onClick={() =>
                  setShowForm(
                    false
                  )
                }
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>

            </div>

            <div className="p-6 space-y-6">

              {/* BASIC INFORMATION */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Project Information
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Project Name *
                    </label>

                    <input
                      value={
                        form.projectName
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            projectName:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Enter project name"
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Client *
                    </label>

                    <select
                      value={
                        form.client
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            client:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      <option value="">
                        Select Client
                      </option>

                      {clients.map(
                        (
                          client
                        ) => (
                          <option
                            key={
                              client.id
                            }
                            value={
                              client.id
                            }
                          >
                            {
                              client.company ||
                              client.name
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Project Type *
                    </label>

                    <select
                      value={
                        form.projectType
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            projectType:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      {PROJECT_TYPES.map(
                        (
                          type
                        ) => (
                          <option
                            key={
                              type
                            }
                            value={
                              type
                            }
                          >
                            {
                              type
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Project Manager
                    </label>

                    <input
                      value={
                        form.projectManager
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            projectManager:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Project manager name"
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div className="md:col-span-2">

                    <label className="block text-sm font-medium mb-1">
                      Site / Location
                    </label>

                    <input
                      value={
                        form.location
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            location:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="Project site location"
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div className="md:col-span-2">

                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>

                    <textarea
                      value={
                        form.description
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            description:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      rows={4}
                      placeholder="Describe the project..."
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                </div>

              </div>

              {/* TIMELINE */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Timeline & Value
                </h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.startDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            startDate:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Expected End
                    </label>

                    <input
                      type="date"
                      value={
                        form.expectedEndDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            expectedEndDate:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Actual End
                    </label>

                    <input
                      type="date"
                      value={
                        form.actualEndDate
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            actualEndDate:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Project Value
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        form.projectValue
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            projectValue:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      placeholder="₹ 0"
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                </div>

              </div>

              {/* STATUS */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Project Status
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>

                    <select
                      value={
                        form.status
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            status:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      {PROJECT_STATUSES.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {
                              status
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Quotation
                    </label>

                    <select
                      value={
                        form.quotation
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            quotation:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      <option value="">
                        No quotation
                      </option>

                      {quotations.map(
                        (
                          quotation
                        ) => (
                          <option
                            key={
                              quotation.id
                            }
                            value={
                              quotation.id
                            }
                          >
                            {
                              quotation.quotationNumber
                            }
                            {' — '}
                            {
                              quotation.projectName ||
                              'Project'
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Invoice
                    </label>

                    <select
                      value={
                        form.invoice
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            invoice:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      <option value="">
                        No invoice
                      </option>

                      {invoices.map(
                        (
                          invoice
                        ) => (
                          <option
                            key={
                              invoice.id
                            }
                            value={
                              invoice.id
                            }
                          >
                            {
                              invoice.invoiceNumber
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

              </div>

              {/* NOTES */}

              <div>

                <label className="block text-sm font-medium mb-1">
                  Notes
                </label>

                <textarea
                  value={
                    form.notes
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      {
                        ...form,
                        notes:
                          event
                            .target
                            .value,
                      }
                    )
                  }
                  rows={4}
                  placeholder="Internal project notes..."
                  className="w-full border rounded-lg px-3 py-3"
                />

              </div>

            </div>

            {/* FORM ACTIONS */}

            <div className="p-6 border-t flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowForm(
                    false
                  )
                }
                className="px-5 py-3 rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveProject
                }
                disabled={
                  saving
                }
                className="px-5 py-3 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017] disabled:opacity-50"
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

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {showDetails &&
        selectedProject && (

          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-y-auto">

              {/* HEADER */}

              <div className="p-6 border-b flex items-start justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    {
                      selectedProject.projectCode
                    }
                  </p>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedProject.projectName
                    }
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    {
                      selectedProject.projectType
                    }
                  </p>

                </div>

                <button
                  onClick={() =>
                    setShowDetails(
                      false
                    )
                  }
                  className="text-2xl text-gray-500 hover:text-black"
                >
                  ×
                </button>

              </div>

              <div className="p-6 space-y-6">

                {/* OVERVIEW */}

                <div className="grid md:grid-cols-3 gap-4">

                  <div className="border rounded-xl p-5">

                    <p className="text-sm text-gray-500">
                      Client
                    </p>

                    <p className="font-semibold mt-1">

                      {getClient(
                        selectedProject.client
                      )?.company ||
                        getClient(
                          selectedProject.client
                        )?.name ||
                        '—'}

                    </p>

                  </div>

                  <div className="border rounded-xl p-5">

                    <p className="text-sm text-gray-500">
                      Project Value
                    </p>

                    <p className="font-semibold mt-1 text-[#9a641f]">

                      {formatCurrency(
                        selectedProject.projectValue ||
                          0
                      )}

                    </p>

                  </div>

                  <div className="border rounded-xl p-5">

                    <p className="text-sm text-gray-500">
                      Status
                    </p>

                    <select
                      value={
                        selectedProject.status
                      }
                      onChange={(
                        event
                      ) =>
                        updateProjectStatus(
                          selectedProject,
                          event
                            .target
                            .value
                        )
                      }
                      className="mt-2 w-full border rounded-lg px-3 py-2"
                    >

                      {PROJECT_STATUSES.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {
                              status
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* DETAILS */}

                <div className="grid md:grid-cols-2 gap-5">

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-4">
                      Project Details
                    </h3>

                    <div className="space-y-3 text-sm">

                      <p>

                        <strong>
                          Location:
                        </strong>{' '}

                        {
                          selectedProject.location ||
                          '—'
                        }

                      </p>

                      <p>

                        <strong>
                          Project Manager:
                        </strong>{' '}

                        {
                          selectedProject.projectManager ||
                          '—'
                        }

                      </p>

                      <p>

                        <strong>
                          Start Date:
                        </strong>{' '}

                        {formatDate(
                          selectedProject.startDate
                        )}

                      </p>

                      <p>

                        <strong>
                          Expected End:
                        </strong>{' '}

                        {formatDate(
                          selectedProject.expectedEndDate
                        )}

                      </p>

                      <p>

                        <strong>
                          Actual End:
                        </strong>{' '}

                        {formatDate(
                          selectedProject.actualEndDate
                        )}

                      </p>

                    </div>

                  </div>

                  <div className="border rounded-xl p-5">

                    <h3 className="font-semibold text-[#9a641f] mb-4">
                      CRM Connections
                    </h3>

                    <div className="space-y-3 text-sm">

                      <p>

                        <strong>
                          Quotation:
                        </strong>{' '}

                        {getQuotation(
                          selectedProject.quotation
                        )?.quotationNumber ||
                          'Not linked'}

                      </p>

                      <p>

                        <strong>
                          Invoice:
                        </strong>{' '}

                        {getInvoice(
                          selectedProject.invoice
                        )?.invoiceNumber ||
                          'Not linked'}

                      </p>

                    </div>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-3">
                    Description
                  </h3>

                  <p className="text-gray-700 whitespace-pre-line">

                    {
                      selectedProject.description ||
                      'No description available.'
                    }

                  </p>

                </div>

                {/* NOTES */}

                <div className="border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-3">
                    Notes
                  </h3>

                  <p className="text-gray-700 whitespace-pre-line">

                    {
                      selectedProject.notes ||
                      'No notes available.'
                    }

                  </p>

                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      openEditForm(
                        selectedProject
                      )
                    }
                    className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black"
                  >
                    Edit Project
                  </button>

                  <button
                    onClick={() =>
                      deleteProject(
                        selectedProject
                      )
                    }
                    className="px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete Project
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}