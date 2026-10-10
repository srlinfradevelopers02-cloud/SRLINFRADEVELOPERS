import React, {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../../lib/supabase';

type Client = {
  id: string;
  client_code: string;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  client_type: string | null;
  address: string | null;
  project_type: string | null;
  source_lead: number | null;
  notes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
};

type Lead = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  project_type: string | null;
  message: string | null;
  status: string | null;
  created_at: string;
};

type Staff = {
  id: string;
  user_id: string | null;
  staff_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
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
  'Residential',
  'Retail',
  'Other',
];

const CLIENT_TYPES = [
  'Company',
  'Individual',
];

const CLIENT_STATUSES = [
  'ACTIVE',
  'INACTIVE',
  'COMPLETED',
];

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  company: '',
  client_type: 'Company',
  address: '',
  project_type: '',
  notes: '',
  status: 'ACTIVE',
};

const getErrorMessage = (error: any) => {
  if (!error) return 'Unknown error';

  if (typeof error === 'string') {
    return error;
  }

  return (
    error.message ||
    error.error_description ||
    JSON.stringify(error)
  );
};

const formatDate = (
  value: string | null | undefined
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

export default function Clients() {
  const [currentStaff, setCurrentStaff] =
    useState<Staff | null>(null);

  const [clients, setClients] =
    useState<Client[]>([]);

  const [wonLeads, setWonLeads] =
    useState<Lead[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [typeFilter, setTypeFilter] =
    useState('ALL');

  const [showForm, setShowForm] =
    useState(false);

  const [showLeadModal, setShowLeadModal] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showDelete, setShowDelete] =
    useState(false);

  const [editingClient, setEditingClient] =
    useState<Client | null>(null);

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const isAdmin =
    currentStaff?.role?.toUpperCase() ===
    'ADMIN';

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        throw new Error(
          'Please login first.'
        );
      }

      const {
        data: staff,
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
          is_active
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffError) {
        throw staffError;
      }

      if (!staff) {
        throw new Error(
          'Your account is not registered as an active SRL staff member.'
        );
      }

      setCurrentStaff(
        staff as Staff
      );

      await loadData();
    } catch (error: any) {
      console.error(
        'Clients initialization failed:',
        error
      );

      setErrorMessage(
        getErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    const [
      clientsResult,
      leadsResult,
    ] = await Promise.all([
      supabase
        .from('clients')
        .select('*')
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('leads')
        .select(`
          id,
          name,
          phone,
          email,
          company,
          project_type,
          message,
          status,
          created_at
        `)
        .eq('status', 'WON')
        .order('created_at', {
          ascending: false,
        }),
    ]);

    if (clientsResult.error) {
      throw clientsResult.error;
    }

    if (leadsResult.error) {
      throw leadsResult.error;
    }

    setClients(
      (clientsResult.data ||
        []) as Client[]
    );

    setWonLeads(
      (leadsResult.data ||
        []) as Lead[]
    );
  };

  const filteredClients = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return clients.filter((client) => {
      const searchable = [
        client.client_code,
        client.name,
        client.phone,
        client.email,
        client.company,
        client.project_type,
        client.address,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchable.includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        client.status ===
          statusFilter;

      const matchesType =
        typeFilter === 'ALL' ||
        client.client_type ===
          typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    clients,
    search,
    statusFilter,
    typeFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: clients.length,

      active: clients.filter(
        (client) =>
          client.status === 'ACTIVE'
      ).length,

      companies: clients.filter(
        (client) =>
          client.client_type ===
          'Company'
      ).length,

      individuals: clients.filter(
        (client) =>
          client.client_type ===
          'Individual'
      ).length,

      wonLeads: wonLeads.length,
    };
  }, [clients, wonLeads]);

  const generateClientCode = () => {
    const year =
      new Date().getFullYear();

    const nextNumber =
      clients.length + 1;

    return `CL-${year}-${String(
      nextNumber
    ).padStart(4, '0')}`;
  };

  const openAddForm = () => {
    setEditingClient(null);

    setForm({
      ...EMPTY_FORM,
    });

    setShowForm(true);
  };

  const openEditForm = (
    client: Client
  ) => {
    setEditingClient(client);

    setForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      company: client.company || '',
      client_type:
        client.client_type ||
        'Company',
      address:
        client.address || '',
      project_type:
        client.project_type || '',
      notes: client.notes || '',
      status:
        client.status || 'ACTIVE',
    });

    setShowDetails(false);
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingClient(null);

    setForm({
      ...EMPTY_FORM,
    });
  };

  const handleChange = (
    field: keyof typeof EMPTY_FORM,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const checkDuplicateClient =
    async () => {
      const phone =
        form.phone.trim();

      const email =
        form.email.trim();

      if (!phone && !email) {
        return null;
      }

      let query = supabase
        .from('clients')
        .select(
          'id, name, phone, email'
        );

      if (editingClient) {
        query = query.neq(
          'id',
          editingClient.id
        );
      }

      if (phone && email) {
        query = query.or(
          `phone.eq.${phone},email.eq.${email}`
        );
      } else if (phone) {
        query = query.eq(
          'phone',
          phone
        );
      } else {
        query = query.eq(
          'email',
          email
        );
      }

      const {
        data,
        error,
      } = await query.limit(1);

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    };

  const saveClient = async () => {
    if (!isAdmin) {
      alert(
        'Only Admin can manage clients.'
      );
      return;
    }

    if (!form.name.trim()) {
      alert(
        'Client name is required.'
      );
      return;
    }

    if (!form.phone.trim()) {
      alert(
        'Phone number is required.'
      );
      return;
    }

    setSaving(true);

    try {
      const duplicate =
        await checkDuplicateClient();

      if (duplicate) {
        alert(
          `Client already exists.\n\nName: ${duplicate.name}\nPhone: ${duplicate.phone}`
        );
        return;
      }

      const now =
        new Date().toISOString();

      if (editingClient) {
        const {
          data,
          error,
        } = await supabase
          .from('clients')
          .update({
            name:
              form.name.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email.trim() ||
              null,

            company:
              form.company.trim() ||
              null,

            client_type:
              form.client_type,

            address:
              form.address.trim() ||
              null,

            project_type:
              form.project_type ||
              null,

            notes:
              form.notes.trim() ||
              null,

            status:
              form.status,

            updated_at: now,
          })
          .eq(
            'id',
            editingClient.id
          )
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        setClients((items) =>
          items.map((item) =>
            item.id ===
            editingClient.id
              ? (data as Client)
              : item
          )
        );

        setSelectedClient(
          data as Client
        );

        alert(
          'Client updated successfully.'
        );
      } else {
        const {
          data,
          error,
        } = await supabase
          .from('clients')
          .insert({
            client_code:
              generateClientCode(),

            name:
              form.name.trim(),

            phone:
              form.phone.trim(),

            email:
              form.email.trim() ||
              null,

            company:
              form.company.trim() ||
              null,

            client_type:
              form.client_type,

            address:
              form.address.trim() ||
              null,

            project_type:
              form.project_type ||
              null,

            source_lead: null,

            notes:
              form.notes.trim() ||
              null,

            status:
              form.status,
          })
          .select('*')
          .single();

        if (error) {
          throw error;
        }

        setClients((items) => [
          data as Client,
          ...items,
        ]);

        alert(
          `Client ${data.client_code} created successfully.`
        );
      }

      closeForm();
    } catch (error: any) {
      console.error(
        'Save client failed:',
        error
      );

      alert(
        `Failed to save client.\n\n${getErrorMessage(
          error
        )}`
      );
    } finally {
      setSaving(false);
    }
  };

  const openLeadModal = () => {
    setSelectedLead(null);
    setShowLeadModal(true);
  };

  const convertLeadToClient =
    async () => {
      if (!isAdmin) {
        alert(
          'Only Admin can convert leads.'
        );
        return;
      }

      if (!selectedLead) {
        alert(
          'Please select a WON lead.'
        );
        return;
      }

      setSaving(true);

      try {
        const phone =
          selectedLead.phone.trim();

        const email =
          selectedLead.email?.trim() ||
          '';

        let duplicateQuery =
          supabase
            .from('clients')
            .select(`
              id,
              client_code,
              name,
              phone,
              email
            `);

        if (phone && email) {
          duplicateQuery =
            duplicateQuery.or(
              `phone.eq.${phone},email.eq.${email}`
            );
        } else if (phone) {
          duplicateQuery =
            duplicateQuery.eq(
              'phone',
              phone
            );
        }

        const {
          data: duplicates,
          error:
            duplicateError,
        } =
          await duplicateQuery.limit(
            1
          );

        if (duplicateError) {
          throw duplicateError;
        }

        if (
          duplicates &&
          duplicates.length > 0
        ) {
          const existing =
            duplicates[0];

          alert(
            `This lead already matches an existing client.\n\nClient: ${existing.name}\nCode: ${existing.client_code}`
          );

          return;
        }

        const clientCode =
          generateClientCode();

        const {
          data: newClient,
          error:
            clientError,
        } = await supabase
          .from('clients')
          .insert({
            client_code:
              clientCode,

            name:
              selectedLead.name,

            phone:
              phone,

            email:
              email || null,

            company:
              selectedLead.company ||
              null,

            client_type:
              selectedLead.company
                ? 'Company'
                : 'Individual',

            address: null,

            project_type:
              selectedLead.project_type ||
              null,

            source_lead:
              selectedLead.id,

            notes:
              selectedLead.message ||
              null,

            status:
              'ACTIVE',
          })
          .select('*')
          .single();

        if (clientError) {
          throw clientError;
        }

        const {
          error: leadError,
        } = await supabase
          .from('leads')
          .update({
            status: 'WON',
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            selectedLead.id
          );

        if (leadError) {
          await supabase
            .from('clients')
            .delete()
            .eq(
              'id',
              newClient.id
            );

          throw leadError;
        }

        setClients((items) => [
          newClient as Client,
          ...items,
        ]);

        setWonLeads((items) =>
          items.filter(
            (lead) =>
              lead.id !==
              selectedLead.id
          )
        );

        setSelectedClient(
          newClient as Client
        );

        setSelectedLead(null);
        setShowLeadModal(false);
        setShowDetails(true);

        alert(
          `Lead converted successfully.\n\nClient Code: ${clientCode}`
        );
      } catch (error: any) {
        console.error(
          'Lead conversion failed:',
          error
        );

        alert(
          `Lead conversion failed.\n\n${getErrorMessage(
            error
          )}`
        );
      } finally {
        setSaving(false);
      }
    };

  const deleteClient = async () => {
    if (!isAdmin) {
      alert(
        'Only Admin can delete clients.'
      );
      return;
    }

    if (!selectedClient) {
      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } = await supabase
        .from('clients')
        .delete()
        .eq(
          'id',
          selectedClient.id
        );

      if (error) {
        throw error;
      }

      setClients((items) =>
        items.filter(
          (item) =>
            item.id !==
            selectedClient.id
        )
      );

      setShowDelete(false);
      setShowDetails(false);
      setSelectedClient(null);

      alert(
        'Client deleted successfully.'
      );
    } catch (error: any) {
      console.error(
        'Delete client failed:',
        error
      );

      alert(
        `Failed to delete client.\n\n${getErrorMessage(
          error
        )}`
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = (
    client: Client
  ) => {
    setSelectedClient(client);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setSelectedClient(null);
    setShowDetails(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />

          <p className="text-sm text-slate-500">
            Loading clients...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-red-200 shadow-sm p-7">
          <div className="text-4xl mb-4">
            ⚠️
          </div>

          <h1 className="text-xl font-bold text-red-700">
            Clients failed to load
          </h1>

          <p className="mt-2 text-sm text-slate-600">
            {errorMessage}
          </p>

          <button
            onClick={initialize}
            className="mt-5 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-4">
            🔒
          </div>

          <h1 className="text-xl font-bold text-slate-900">
            Admin Access Required
          </h1>

          <p className="text-sm text-slate-500 mt-2">
            Only Admin users can manage
            Clients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C5832B]">
              SRL INFRA DEVELOPERS
            </p>

            <h1 className="text-3xl font-bold text-slate-900 mt-1">
              Clients
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage customers and convert
              successful leads into clients.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">

            <button
              onClick={loadData}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>

            <button
              onClick={openLeadModal}
              className="px-4 py-2.5 rounded-xl border border-[#C5832B] text-[#C5832B] bg-white text-sm font-semibold hover:bg-[#C5832B]/5"
            >
              Convert WON Lead
            </button>

            <button
              onClick={openAddForm}
              className="px-5 py-2.5 rounded-xl bg-[#C5832B] text-white text-sm font-semibold hover:bg-[#a96f22]"
            >
              + Add Client
            </button>

          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Total Clients
            </p>

            <p className="text-3xl font-bold text-slate-900 mt-2">
              {stats.total}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active
            </p>

            <p className="text-3xl font-bold text-green-600 mt-2">
              {stats.active}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Companies
            </p>

            <p className="text-3xl font-bold text-blue-600 mt-2">
              {stats.companies}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Individuals
            </p>

            <p className="text-3xl font-bold text-purple-600 mt-2">
              {stats.individuals}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              WON Leads
            </p>

            <p className="text-3xl font-bold text-[#C5832B] mt-2">
              {stats.wonLeads}
            </p>
          </div>

        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-5">

          <div className="flex flex-col lg:flex-row gap-3">

            <div className="flex-1">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search client, phone, email, company, project..."
                className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-[#C5832B]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm"
            >
              <option value="ALL">
                All Status
              </option>

              {CLIENT_STATUSES.map(
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
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(
                  e.target.value
                )
              }
              className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm"
            >
              <option value="ALL">
                All Types
              </option>

              {CLIENT_TYPES.map(
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

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

            <div>
              <h2 className="font-bold text-slate-900">
                Client Directory
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                {filteredClients.length}{' '}
                result
                {filteredClients.length !==
                1
                  ? 's'
                  : ''}
              </p>
            </div>

          </div>

          {filteredClients.length ===
          0 ? (
            <div className="py-16 text-center">

              <div className="text-5xl mb-4">
                👥
              </div>

              <h3 className="font-bold text-slate-900">
                No clients found
              </h3>

              <p className="text-sm text-slate-500 mt-1">
                Add a client or convert a
                WON lead.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">

                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
                      Client
                    </th>

                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
                      Company
                    </th>

                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
                      Project
                    </th>

                    <th className="text-left px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="text-right px-5 py-3 text-xs uppercase tracking-wide text-slate-500">
                      Action
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredClients.map(
                    (client) => (
                      <tr
                        key={client.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >

                        <td className="px-5 py-4">

                          <button
                            onClick={() =>
                              openDetails(
                                client
                              )
                            }
                            className="text-left"
                          >

                            <p className="font-bold text-slate-900 hover:text-[#C5832B]">
                              {client.name}
                            </p>

                            <p className="text-xs text-slate-400 mt-1">
                              {client.client_code}
                            </p>

                          </button>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-sm text-slate-700">
                            {client.phone}
                          </p>

                          <p className="text-xs text-slate-400 mt-1">
                            {client.email ||
                              'No email'}
                          </p>

                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {client.company ||
                            'Individual'}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-700">
                          {client.project_type ||
                            '—'}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              client.status ===
                              'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : client.status ===
                                  'COMPLETED'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {client.status ||
                              'ACTIVE'}
                          </span>

                        </td>

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              onClick={() =>
                                openDetails(
                                  client
                                )
                              }
                              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100"
                            >
                              View
                            </button>

                            <button
                              onClick={() =>
                                openEditForm(
                                  client
                                )
                              }
                              className="px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100"
                            >
                              Edit
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

            <div className="px-6 py-5 border-b flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingClient
                    ? 'Edit Client'
                    : 'Add Client'}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Customer information
                </p>
              </div>

              <button
                onClick={closeForm}
                className="text-2xl text-slate-400 hover:text-slate-900"
              >
                ×
              </button>

            </div>

            <div className="p-6 space-y-5">

              <div className="grid md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Client Name *
                  </label>

                  <input
                    value={form.name}
                    onChange={(e) =>
                      handleChange(
                        'name',
                        e.target.value
                      )
                    }
                    placeholder="Client name"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Phone *
                  </label>

                  <input
                    value={form.phone}
                    onChange={(e) =>
                      handleChange(
                        'phone',
                        e.target.value
                      )
                    }
                    placeholder="Phone number"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      handleChange(
                        'email',
                        e.target.value
                      )
                    }
                    placeholder="Email"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Company
                  </label>

                  <input
                    value={form.company}
                    onChange={(e) =>
                      handleChange(
                        'company',
                        e.target.value
                      )
                    }
                    placeholder="Company"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Client Type
                  </label>

                  <select
                    value={
                      form.client_type
                    }
                    onChange={(e) =>
                      handleChange(
                        'client_type',
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                  >
                    {CLIENT_TYPES.map(
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

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Project Type
                  </label>

                  <select
                    value={
                      form.project_type
                    }
                    onChange={(e) =>
                      handleChange(
                        'project_type',
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="">
                      Select project
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(e) =>
                    handleChange(
                      'address',
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Customer address"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    handleChange(
                      'notes',
                      e.target.value
                    )
                  }
                  rows={3}
                  placeholder="Internal client notes"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    handleChange(
                      'status',
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white"
                >
                  {CLIENT_STATUSES.map(
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
              </div>

            </div>

            <div className="px-6 py-5 border-t flex justify-end gap-3">

              <button
                onClick={closeForm}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={saveClient}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#C5832B] text-white font-semibold disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingClient
                  ? 'Update Client'
                  : 'Create Client'}
              </button>

            </div>

          </div>

        </div>
      )}

      {showLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

            <div className="px-6 py-5 border-b flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Convert WON Lead
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Select a successful lead to
                  create a client.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowLeadModal(false)
                }
                className="text-2xl text-slate-400"
              >
                ×
              </button>

            </div>

            <div className="p-6">

              {wonLeads.length ===
              0 ? (
                <div className="py-12 text-center">

                  <div className="text-5xl mb-4">
                    ✓
                  </div>

                  <h3 className="font-bold text-slate-900">
                    No WON leads
                  </h3>

                  <p className="text-sm text-slate-500 mt-1">
                    Leads with status WON will
                    appear here.
                  </p>

                </div>
              ) : (
                <div className="space-y-3">

                  {wonLeads.map(
                    (lead) => (
                      <button
                        key={lead.id}
                        onClick={() =>
                          setSelectedLead(
                            lead
                          )
                        }
                        className={`w-full text-left p-4 rounded-xl border ${
                          selectedLead?.id ===
                          lead.id
                            ? 'border-[#C5832B] bg-[#C5832B]/5'
                            : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <p className="font-bold text-slate-900">
                              {lead.name}
                            </p>

                            <p className="text-sm text-slate-600 mt-1">
                              {lead.phone}
                            </p>

                            {lead.email && (
                              <p className="text-xs text-slate-500 mt-1">
                                {lead.email}
                              </p>
                            )}

                          </div>

                          <span className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                            WON
                          </span>

                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">

                          <div>
                            <p className="text-xs text-slate-400">
                              Company
                            </p>

                            <p className="text-sm font-semibold text-slate-700">
                              {lead.company ||
                                'Individual'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Project
                            </p>

                            <p className="text-sm font-semibold text-slate-700">
                              {lead.project_type ||
                                '—'}
                            </p>
                          </div>

                        </div>

                      </button>
                    )
                  )}

                </div>
              )}

            </div>

            <div className="px-6 py-5 border-t flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowLeadModal(false)
                }
                className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={
                  convertLeadToClient
                }
                disabled={
                  !selectedLead ||
                  saving
                }
                className="px-5 py-2.5 rounded-xl bg-[#C5832B] text-white font-semibold disabled:opacity-50"
              >
                {saving
                  ? 'Converting...'
                  : 'Convert to Client'}
              </button>

            </div>

          </div>

        </div>
      )}

      {showDetails &&
        selectedClient && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">

              <div className="px-6 py-5 border-b flex items-center justify-between">

                <div>
                  <p className="text-xs uppercase tracking-wide text-[#C5832B]">
                    {selectedClient.client_code}
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900 mt-1">
                    {selectedClient.name}
                  </h2>
                </div>

                <button
                  onClick={
                    closeDetails
                  }
                  className="text-2xl text-slate-400"
                >
                  ×
                </button>

              </div>

              <div className="p-6 space-y-5">

                <div className="grid md:grid-cols-2 gap-4">

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Phone
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedClient.phone}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="font-semibold mt-1 break-all">
                      {selectedClient.email ||
                        '—'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Company
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedClient.company ||
                        'Individual'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Client Type
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedClient.client_type ||
                        '—'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Project Type
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedClient.project_type ||
                        '—'}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs text-slate-400">
                      Status
                    </p>

                    <p className="font-semibold mt-1">
                      {selectedClient.status ||
                        'ACTIVE'}
                    </p>
                  </div>

                </div>

                <div>
                  <p className="text-sm font-bold mb-2">
                    Address
                  </p>

                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap">
                    {selectedClient.address ||
                      'No address added.'}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold mb-2">
                    Notes
                  </p>

                  <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 whitespace-pre-wrap">
                    {selectedClient.notes ||
                      'No notes added.'}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">

                  <div>
                    <p className="text-xs text-slate-400">
                      Created
                    </p>

                    <p className="font-medium mt-1">
                      {formatDate(
                        selectedClient.created_at
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Updated
                    </p>

                    <p className="font-medium mt-1">
                      {formatDate(
                        selectedClient.updated_at
                      )}
                    </p>
                  </div>

                </div>

              </div>

              <div className="px-6 py-5 border-t flex justify-end gap-3">

                <button
                  onClick={() =>
                    openEditForm(
                      selectedClient
                    )
                  }
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Edit
                </button>

                <button
                  onClick={() =>
                    setShowDelete(true)
                  }
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold"
                >
                  Delete
                </button>

                <button
                  onClick={
                    closeDetails
                  }
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold"
                >
                  Close
                </button>

              </div>

            </div>

          </div>
        )}

      {showDelete &&
        selectedClient && (
          <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">

            <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl">

              <div className="text-4xl mb-4">
                ⚠️
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Delete Client?
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                This will permanently delete{' '}
                <strong>
                  {selectedClient.name}
                </strong>
                .
              </p>

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() =>
                    setShowDelete(false)
                  }
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 font-semibold"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    deleteClient
                  }
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-50"
                >
                  {saving
                    ? 'Deleting...'
                    : 'Delete Client'}
                </button>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}