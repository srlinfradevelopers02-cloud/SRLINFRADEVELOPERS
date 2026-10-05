import React, { useEffect, useMemo, useState } from 'react';
import { pb } from '../../lib/pocketbase';

interface Client {
  id: string;
  clientCode?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  clientType?: string;
  address?: string;
  projectType?: string;
  sourceLead?: string;
  notes?: string;
  status?: string;
  created: string;
  updated?: string;
}

interface Lead {
  id: string;
  referenceCode?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  projectType?: string;
  message?: string;
  status: string;
  notes?: string;
  created: string;
}

const CLIENT_TYPES = [
  'Individual',
  'Company',
  'Government',
  'Organization',
];

const CLIENT_STATUSES = [
  'ACTIVE',
  'INACTIVE',
];

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [wonLeads, setWonLeads] = useState<Lead[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showConvertModal, setShowConvertModal] =
    useState(false);

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [saving, setSaving] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    clientType: 'Company',
    address: '',
    projectType: '',
    notes: '',
  });

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    clientType: 'Company',
    address: '',
    projectType: '',
    status: 'ACTIVE',
    notes: '',
  });

  // =========================================================
  // LOAD CLIENTS
  // =========================================================

  const loadClients = async () => {
    try {
      setLoading(true);
      setError('');

      const records =
        await pb.collection('clients').getFullList<Client>({
          sort: '-created',
        });

      setClients(records);
    } catch (err) {
      console.error(err);
      setError(
        'Unable to load clients. Make sure the clients collection has been created in PocketBase.'
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD WON LEADS
  // =========================================================

  const loadWonLeads = async () => {
    try {
      const records =
        await pb.collection('leads').getFullList<Lead>({
          sort: '-created',
          filter: 'status = "WON"',
        });

      setWonLeads(records);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadClients();
    loadWonLeads();
  }, []);

  // =========================================================
  // FILTER CLIENTS
  // =========================================================

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        [
          client.name,
          client.phone,
          client.email,
          client.company,
          client.clientCode,
          client.projectType,
          client.address,
        ]
          .filter(Boolean)
          .some((value) =>
            value!.toLowerCase().includes(query)
          );

      const matchesStatus =
        statusFilter === 'ALL' ||
        client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  // =========================================================
  // OPEN CLIENT
  // =========================================================

  const openClient = (client: Client) => {
    setSelectedClient(client);

    setEditForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      company: client.company || '',
      clientType: client.clientType || 'Company',
      address: client.address || '',
      projectType: client.projectType || '',
      status: client.status || 'ACTIVE',
      notes: client.notes || '',
    });
  };

  // =========================================================
  // CLOSE CLIENT
  // =========================================================

  const closeClient = () => {
    setSelectedClient(null);
  };

  // =========================================================
  // GENERATE CLIENT CODE
  // =========================================================

  const generateClientCode = () => {
    return `CLI-${Math.floor(
      100000 + Math.random() * 900000
    )}`;
  };

  // =========================================================
  // GENERATE LEAD -> CLIENT CODE
  // =========================================================

  const convertLeadToClient = async () => {
    if (!selectedLead) return;

    try {
      setSaving(true);

      const existingClient =
        clients.find(
          (client) =>
            client.phone === selectedLead.phone ||
            (
              selectedLead.email &&
              client.email === selectedLead.email
            )
        );

      if (existingClient) {
        alert(
          'A client with this phone number or email already exists.'
        );

        setSaving(false);
        return;
      }

      const client =
        await pb.collection('clients').create<Client>({
          clientCode: generateClientCode(),

          name: selectedLead.name,

          phone: selectedLead.phone,

          email: selectedLead.email || '',

          company: selectedLead.company || '',

          clientType:
            selectedLead.company
              ? 'Company'
              : 'Individual',

          address: '',

          projectType:
            selectedLead.projectType || '',

          sourceLead: selectedLead.id,

          notes:
            selectedLead.notes ||
            selectedLead.message ||
            '',

          status: 'ACTIVE',
        });

      // Keep the original lead but mark it as converted.
      await pb.collection('leads').update(
        selectedLead.id,
        {
          status: 'WON',
          notes:
            `${selectedLead.notes || ''}\n\nConverted to client: ${client.clientCode}`.trim(),
        }
      );

      setClients((current) => [
        client,
        ...current,
      ]);

      setWonLeads((current) =>
        current.filter(
          (lead) => lead.id !== selectedLead.id
        )
      );

      setShowConvertModal(false);
      setSelectedLead(null);

      alert(
        `Lead converted successfully.\nClient ID: ${client.clientCode}`
      );

    } catch (err) {
      console.error(err);

      alert(
        'Unable to convert the lead into a client.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // ADD CLIENT
  // =========================================================

  const handleAddClient = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.phone.trim()
    ) {
      alert(
        'Name and phone number are required.'
      );

      return;
    }

    try {
      setSaving(true);

      const client =
        await pb.collection('clients').create<Client>({
          clientCode: generateClientCode(),

          name: form.name.trim(),

          phone: form.phone.trim(),

          email: form.email.trim(),

          company: form.company.trim(),

          clientType: form.clientType,

          address: form.address.trim(),

          projectType: form.projectType.trim(),

          sourceLead: '',

          notes: form.notes.trim(),

          status: 'ACTIVE',
        });

      setClients((current) => [
        client,
        ...current,
      ]);

      setForm({
        name: '',
        phone: '',
        email: '',
        company: '',
        clientType: 'Company',
        address: '',
        projectType: '',
        notes: '',
      });

      setShowAddModal(false);

      openClient(client);

    } catch (err) {
      console.error(err);

      alert(
        'Unable to create client.'
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // UPDATE CLIENT
  // =========================================================

  const handleUpdateClient = async () => {
    if (!selectedClient) return;

    try {
      setSavingEdit(true);

      const updated =
        await pb.collection('clients').update<Client>(
          selectedClient.id,
          {
            name: editForm.name.trim(),

            phone: editForm.phone.trim(),

            email: editForm.email.trim(),

            company: editForm.company.trim(),

            clientType: editForm.clientType,

            address: editForm.address.trim(),

            projectType:
              editForm.projectType.trim(),

            status: editForm.status,

            notes: editForm.notes.trim(),
          }
        );

      setClients((current) =>
        current.map((client) =>
          client.id === updated.id
            ? updated
            : client
        )
      );

      setSelectedClient(updated);

      alert('Client updated successfully.');

    } catch (err) {
      console.error(err);

      alert(
        'Unable to update client.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================================================
  // DELETE CLIENT
  // =========================================================

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      await pb.collection('clients').delete(
        selectedClient.id
      );

      setClients((current) =>
        current.filter(
          (client) =>
            client.id !== selectedClient.id
        )
      );

      setShowDeleteModal(false);
      closeClient();

    } catch (err) {
      console.error(err);

      alert(
        'Unable to delete client.'
      );
    }
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  // =========================================================
  // DASHBOARD COUNTS
  // =========================================================

  const activeClients =
    clients.filter(
      (client) =>
        client.status === 'ACTIVE'
    ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 md:p-6 lg:p-8">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#C5832B]">
            SRL INFRA DEVELOPERS
          </p>

          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Clients
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage customers and client relationships.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={() => {
              loadClients();
              loadWonLeads();
            }}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            ↻ Refresh
          </button>

          <button
            onClick={() =>
              setShowAddModal(true)
            }
            className="rounded-lg bg-[#C5832B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#a96f22]"
          >
            + Add Client
          </button>

        </div>

      </div>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Clients
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {clients.length}
          </p>

        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Active Clients
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {activeClients}
          </p>

        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Won Leads
          </p>

          <p className="mt-2 text-2xl font-bold text-[#C5832B]">
            {wonLeads.length}
          </p>

        </div>

      </div>

      {/* =====================================================
          WON LEADS CONVERSION
          ===================================================== */}

      {wonLeads.length > 0 && (

        <div className="mb-6 rounded-xl border border-[#C5832B]/20 bg-[#fffaf4] p-5 shadow-sm">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <h2 className="font-semibold text-gray-900">
                Won Leads Ready for Conversion
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Convert successful leads into client records.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[#C5832B]/10 px-3 py-1 text-xs font-semibold text-[#C5832B]">
              {wonLeads.length} Ready
            </span>

          </div>

          <div className="mt-4 grid gap-3">

            {wonLeads.map((lead) => (

              <div
                key={lead.id}
                className="flex flex-col gap-3 rounded-lg border border-gray-100 bg-white p-4 md:flex-row md:items-center md:justify-between"
              >

                <div>

                  <p className="font-semibold text-gray-900">
                    {lead.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {lead.referenceCode || lead.id}
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {lead.phone}
                    {lead.company
                      ? ` • ${lead.company}`
                      : ''}
                  </p>

                </div>

                <button
                  onClick={() => {
                    setSelectedLead(lead);
                    setShowConvertModal(true);
                  }}
                  className="rounded-lg bg-[#C5832B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a96f22]"
                >
                  Convert to Client
                </button>

              </div>

            ))}

          </div>

        </div>

      )}

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (

        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>

      )}

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <div className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">

        <div className="grid gap-3 md:grid-cols-2">

          <div className="relative">

            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search client, phone, email, company..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#C5832B]"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
          >

            <option value="ALL">
              All Client Statuses
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

        </div>

      </div>

      {/* =====================================================
          CLIENT LIST
          ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-5 py-4">

          <h2 className="font-semibold text-gray-900">
            Client Directory
          </h2>

          <p className="text-xs text-gray-500">
            Showing {filteredClients.length} of{' '}
            {clients.length} clients
          </p>

        </div>

        {loading ? (

          <div className="flex min-h-[250px] items-center justify-center">
            <p className="text-sm text-gray-500">
              Loading clients...
            </p>
          </div>

        ) : filteredClients.length === 0 ? (

          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">

            <div className="mb-3 text-4xl">
              👥
            </div>

            <h3 className="font-semibold text-gray-800">
              No clients found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Add a client manually or convert a WON lead into a client.
            </p>

          </div>

        ) : (

          <>

            {/* DESKTOP */}

            <div className="hidden overflow-x-auto lg:block">

              <table className="w-full min-w-[900px]">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">

                    <th className="px-5 py-3">
                      Client
                    </th>

                    <th className="px-5 py-3">
                      Contact
                    </th>

                    <th className="px-5 py-3">
                      Company
                    </th>

                    <th className="px-5 py-3">
                      Project
                    </th>

                    <th className="px-5 py-3">
                      Status
                    </th>

                    <th className="px-5 py-3">
                      Date
                    </th>

                    <th className="px-5 py-3 text-right">
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredClients.map(
                    (client) => (

                      <tr
                        key={client.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >

                        <td className="px-5 py-4">

                          <button
                            onClick={() =>
                              openClient(client)
                            }
                            className="text-left"
                          >

                            <p className="font-semibold text-gray-900 hover:text-[#C5832B]">
                              {client.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {client.clientCode ||
                                client.id}
                            </p>

                          </button>

                        </td>

                        <td className="px-5 py-4">

                          <p className="text-sm text-gray-700">
                            {client.phone}
                          </p>

                          {client.email && (
                            <p className="mt-1 max-w-[200px] truncate text-xs text-gray-400">
                              {client.email}
                            </p>
                          )}

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {client.company || '—'}
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-700">
                          {client.projectType || '—'}
                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                              client.status ===
                              'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {client.status ||
                              'ACTIVE'}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-sm text-gray-500">
                          {formatDate(
                            client.created
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">

                          <button
                            onClick={() =>
                              openClient(client)
                            }
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#C5832B] hover:text-[#C5832B]"
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* MOBILE */}

            <div className="divide-y divide-gray-100 lg:hidden">

              {filteredClients.map(
                (client) => (

                  <div
                    key={client.id}
                    className="p-4"
                  >

                    <div className="flex items-start justify-between gap-3">

                      <button
                        onClick={() =>
                          openClient(client)
                        }
                        className="text-left"
                      >

                        <p className="font-semibold text-gray-900">
                          {client.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {client.clientCode ||
                            client.id}
                        </p>

                      </button>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          client.status ===
                          'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {client.status ||
                          'ACTIVE'}
                      </span>

                    </div>

                    <div className="mt-3 space-y-1 text-sm text-gray-600">

                      <p>
                        📞 {client.phone}
                      </p>

                      {client.email && (
                        <p>
                          ✉ {client.email}
                        </p>
                      )}

                      {client.company && (
                        <p>
                          🏢 {client.company}
                        </p>
                      )}

                      {client.projectType && (
                        <p>
                          🏗️ {client.projectType}
                        </p>
                      )}

                    </div>

                    <button
                      onClick={() =>
                        openClient(client)
                      }
                      className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                    >
                      View Client
                    </button>

                  </div>

                )
              )}

            </div>

          </>

        )}

      </div>

      {/* =====================================================
          CLIENT DETAIL MODAL
          ===================================================== */}

      {selectedClient && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-[#C5832B]">
                  Client
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {selectedClient.name}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedClient.clientCode ||
                    selectedClient.id}
                </p>

              </div>

              <button
                onClick={closeClient}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>

            </div>

            <div className="space-y-6 p-5">

              {/* CONTACT */}

              <section>

                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Contact Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-400">
                      Name
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedClient.name}
                    </p>

                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-400">
                      Phone
                    </p>

                    <a
                      href={`tel:${selectedClient.phone}`}
                      className="mt-1 block text-sm font-medium text-[#C5832B]"
                    >
                      {selectedClient.phone}
                    </a>

                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-400">
                      Email
                    </p>

                    {selectedClient.email ? (

                      <a
                        href={`mailto:${selectedClient.email}`}
                        className="mt-1 block break-all text-sm font-medium text-[#C5832B]"
                      >
                        {selectedClient.email}
                      </a>

                    ) : (

                      <p className="mt-1 text-sm text-gray-400">
                        Not provided
                      </p>

                    )}

                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-400">
                      Client Type
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedClient.clientType ||
                        'Company'}
                    </p>

                  </div>

                </div>

              </section>

              {/* BUSINESS / PROJECT */}

              <section>

                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Business & Project
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-400">
                      Company
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedClient.company ||
                        'Not provided'}
                    </p>

                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">

                    <p className="text-xs text-gray-400">
                      Project Type
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedClient.projectType ||
                        'Not specified'}
                    </p>

                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">

                    <p className="text-xs text-gray-400">
                      Address
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                      {selectedClient.address ||
                        'Not provided'}
                    </p>

                  </div>

                </div>

              </section>

              {/* EDIT */}

              <section>

                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Manage Client
                </h3>

                <div className="space-y-4">

                  <div className="grid gap-4 sm:grid-cols-2">

                    <div>

                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Name
                      </label>

                      <input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            name: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                      />

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Phone
                      </label>

                      <input
                        value={editForm.phone}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            phone: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                      />

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Email
                      </label>

                      <input
                        value={editForm.email}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            email: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                      />

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Company
                      </label>

                      <input
                        value={editForm.company}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            company: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                      />

                    </div>

                    <div>

                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Client Type
                      </label>

                      <select
                        value={
                          editForm.clientType
                        }
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            clientType:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
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

                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        Status
                      </label>

                      <select
                        value={editForm.status}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            status: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
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

                  <div>

                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Address
                    </label>

                    <textarea
                      rows={3}
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          address:
                            e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                    />

                  </div>

                  <div>

                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Internal Notes
                    </label>

                    <textarea
                      rows={4}
                      value={editForm.notes}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          notes:
                            e.target.value,
                        })
                      }
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                    />

                  </div>

                  <button
                    onClick={handleUpdateClient}
                    disabled={savingEdit}
                    className="rounded-lg bg-[#C5832B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a96f22] disabled:opacity-60"
                  >
                    {savingEdit
                      ? 'Saving...'
                      : 'Save Client'}
                  </button>

                </div>

              </section>

              {/* FUTURE CRM */}

              <section>

                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Client Activity
                </h3>

                <div className="grid gap-3 sm:grid-cols-3">

                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center">

                    <p className="text-2xl">
                      📋
                    </p>

                    <p className="mt-2 text-xs font-semibold text-gray-700">
                      Quotations
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Coming next
                    </p>

                  </div>

                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center">

                    <p className="text-2xl">
                      🧾
                    </p>

                    <p className="mt-2 text-xs font-semibold text-gray-700">
                      Invoices
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Coming next
                    </p>

                  </div>

                  <div className="rounded-lg border border-dashed border-gray-200 p-4 text-center">

                    <p className="text-2xl">
                      🏗️
                    </p>

                    <p className="mt-2 text-xs font-semibold text-gray-700">
                      Projects
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Coming next
                    </p>

                  </div>

                </div>

              </section>

              {/* ACTIONS */}

              <section className="border-t border-gray-100 pt-5">

                <div className="flex flex-wrap gap-2">

                  <a
                    href={`tel:${selectedClient.phone}`}
                    className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    📞 Call
                  </a>

                  {selectedClient.email && (

                    <a
                      href={`mailto:${selectedClient.email}`}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      ✉ Email
                    </a>

                  )}

                  <button
                    onClick={() =>
                      setShowDeleteModal(true)
                    }
                    className="ml-auto rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete Client
                  </button>

                </div>

              </section>

            </div>

          </div>

        </div>

      )}

      {/* =====================================================
          ADD CLIENT MODAL
          ===================================================== */}

      {showAddModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-[#C5832B]">
                  CRM
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  Add New Client
                </h2>

              </div>

              <button
                onClick={() =>
                  setShowAddModal(false)
                }
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={handleAddClient}
              className="space-y-4 p-5"
            >

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Name *
                  </label>

                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="Client name"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Phone *
                  </label>

                  <input
                    required
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Phone number"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    placeholder="Email address"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Company
                  </label>

                  <input
                    value={form.company}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company: e.target.value,
                      })
                    }
                    placeholder="Company / organization"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  />

                </div>

                <div>

                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Client Type
                  </label>

                  <select
                    value={form.clientType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        clientType:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
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

                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Project Type
                  </label>

                  <input
                    value={form.projectType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        projectType:
                          e.target.value,
                      })
                    }
                    placeholder="Interior / Automation / Infrastructure..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  />

                </div>

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Address
                </label>

                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      address:
                        e.target.value,
                    })
                  }
                  placeholder="Client address"
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Internal Notes
                </label>

                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes:
                        e.target.value,
                    })
                  }
                  placeholder="Internal client notes..."
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                />

              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddModal(false)
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#C5832B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a96f22] disabled:opacity-60"
                >
                  {saving
                    ? 'Creating...'
                    : 'Create Client'}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =====================================================
          CONVERT LEAD MODAL
          ===================================================== */}

      {showConvertModal &&
        selectedLead && (

          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-4 text-3xl">
                👤
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                Convert Lead to Client?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">

                This will create a client record for{' '}

                <strong>
                  {selectedLead.name}
                </strong>

                {' '}using the information from the WON lead.

              </p>

              <div className="mt-4 rounded-lg bg-gray-50 p-4">

                <p className="text-sm font-semibold text-gray-800">
                  {selectedLead.name}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  {selectedLead.phone}
                </p>

                {selectedLead.company && (

                  <p className="mt-1 text-sm text-gray-500">
                    {selectedLead.company}
                  </p>

                )}

              </div>

              <div className="mt-6 flex justify-end gap-2">

                <button
                  onClick={() => {
                    setShowConvertModal(false);
                    setSelectedLead(null);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={convertLeadToClient}
                  disabled={saving}
                  className="rounded-lg bg-[#C5832B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a96f22] disabled:opacity-60"
                >
                  {saving
                    ? 'Converting...'
                    : 'Convert Client'}
                </button>

              </div>

            </div>

          </div>

        )}

      {/* =====================================================
          DELETE MODAL
          ===================================================== */}

      {showDeleteModal &&
        selectedClient && (

          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">

            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

              <div className="mb-4 text-3xl">
                ⚠️
              </div>

              <h2 className="text-lg font-bold text-gray-900">
                Delete this client?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">

                This will permanently remove{' '}

                <strong>
                  {selectedClient.name}
                </strong>

                {' '}from the CRM.

              </p>

              <div className="mt-6 flex justify-end gap-2">

                <button
                  onClick={() =>
                    setShowDeleteModal(false)
                  }
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteClient}
                  className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete Client
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
};

export default Clients;