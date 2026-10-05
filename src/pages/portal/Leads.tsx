import React, { useEffect, useMemo, useState } from 'react';
import { pb } from '../../lib/pocketbase';

interface Lead {
  id: string;
  referenceCode?: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  projectType?: string;
  message?: string;
  source?: string;
  status: string;
  assignedTo?: string;
  notes?: string;
  created: string;
  updated?: string;
}

const STATUSES = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'MEETING',
  'SITE VISIT',
  'QUOTATION',
  'NEGOTIATION',
  'WON',
  'LOST',
];

const PROJECT_TYPES = [
  'Commercial Infrastructure',
  'Interior Design',
  'Automation',
  'Elevators',
  'Government Office',
  'Restaurant',
  'Banquet Hall',
  'Residential',
  'Other',
];

const statusClasses: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700',
  CONTACTED: 'bg-purple-100 text-purple-700',
  QUALIFIED: 'bg-cyan-100 text-cyan-700',
  MEETING: 'bg-indigo-100 text-indigo-700',
  'SITE VISIT': 'bg-orange-100 text-orange-700',
  QUOTATION: 'bg-yellow-100 text-yellow-700',
  NEGOTIATION: 'bg-pink-100 text-pink-700',
  WON: 'bg-green-100 text-green-700',
  LOST: 'bg-red-100 text-red-700',
};

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  company: '',
  projectType: '',
  message: '',
  status: 'NEW',
  assignedTo: '',
};

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState('ALL');

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const [notes, setNotes] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const loadLeads = async () => {
    try {
      setLoading(true);
      setError('');

      const records = await pb.collection('leads').getFullList<Lead>({
        sort: '-created',
      });

      setLeads(records);

      if (selectedLead) {
        const updatedSelected = records.find(
          (lead) => lead.id === selectedLead.id
        );

        if (updatedSelected) {
          setSelectedLead(updatedSelected);
          setNotes(updatedSelected.notes || '');
          setAssignedTo(updatedSelected.assignedTo || '');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Unable to load leads right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !query ||
        [
          lead.name,
          lead.phone,
          lead.email,
          lead.company,
          lead.referenceCode,
          lead.projectType,
          lead.message,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'ALL' || lead.status === statusFilter;

      const matchesProject =
        projectFilter === 'ALL' || lead.projectType === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [leads, search, statusFilter, projectFilter]);

  const openLead = (lead: Lead) => {
    setSelectedLead(lead);
    setNotes(lead.notes || '');
    setAssignedTo(lead.assignedTo || '');
  };

  const closeLead = () => {
    setSelectedLead(null);
    setNotes('');
    setAssignedTo('');
  };

  const handleStatusChange = async (lead: Lead, status: string) => {
    try {
      await pb.collection('leads').update(lead.id, {
        status,
      });

      const updatedLead = { ...lead, status };

      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id ? updatedLead : item
        )
      );

      if (selectedLead?.id === lead.id) {
        setSelectedLead(updatedLead);
      }
    } catch (err) {
      console.error(err);
      alert('Unable to update lead status.');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;

    try {
      setSavingNotes(true);

      const updated = await pb.collection('leads').update<Lead>(
        selectedLead.id,
        {
          notes,
          assignedTo,
        }
      );

      setSelectedLead(updated);

      setLeads((current) =>
        current.map((lead) =>
          lead.id === updated.id ? updated : lead
        )
      );

      alert('Lead details updated.');
    } catch (err) {
      console.error(err);
      alert('Unable to save lead details.');
    } finally {
      setSavingNotes(false);
    }
  };

  const generateReferenceCode = () => {
    return `SRL-${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleAddLead = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      alert('Name and phone number are required.');
      return;
    }

    try {
      setSaving(true);

      const newLead = await pb.collection('leads').create<Lead>({
        referenceCode: generateReferenceCode(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        projectType: form.projectType,
        message: form.message.trim(),
        source: 'CRM',
        status: form.status,
        assignedTo: form.assignedTo.trim(),
        notes: '',
      });

      setLeads((current) => [newLead, ...current]);

      setForm(emptyForm);
      setShowAddModal(false);

      openLead(newLead);
    } catch (err) {
      console.error(err);
      alert('Unable to create lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;

    try {
      await pb.collection('leads').delete(selectedLead.id);

      setLeads((current) =>
        current.filter((lead) => lead.id !== selectedLead.id)
      );

      setShowDeleteModal(false);
      closeLead();
    } catch (err) {
      console.error(err);
      alert('Unable to delete lead.');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalNew = leads.filter((lead) => lead.status === 'NEW').length;
  const totalWon = leads.filter((lead) => lead.status === 'WON').length;
  const totalLost = leads.filter((lead) => lead.status === 'LOST').length;

  return (
    <div className="min-h-screen bg-[#f6f7f9] p-4 md:p-6 lg:p-8">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#C5832B]">
            SRL INFRA DEVELOPERS
          </p>

          <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
            Leads & Enquiries
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage website enquiries, prospects and sales pipeline.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadLeads}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            ↻ Refresh
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="rounded-lg bg-[#C5832B] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a96f22]"
          >
            + Add Lead
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Leads
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {leads.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            New
          </p>
          <p className="mt-2 text-2xl font-bold text-blue-600">
            {totalNew}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Won
          </p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {totalWon}
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Lost
          </p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {totalLost}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="mb-5 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔎
            </span>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email, company..."
              className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#C5832B] focus:ring-2 focus:ring-[#C5832B]/10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
          >
            <option value="ALL">All Statuses</option>

            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
          >
            <option value="ALL">All Project Types</option>

            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* LEADS TABLE */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                Enquiries
              </h2>

              <p className="text-xs text-gray-500">
                Showing {filteredLeads.length} of {leads.length} leads
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="text-sm text-gray-500">
              Loading leads...
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="flex min-h-[250px] flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 text-4xl">📭</div>

            <h3 className="font-semibold text-gray-800">
              No leads found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Try changing your filters or add a new lead.
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-3">Lead</th>
                    <th className="px-5 py-3">Contact</th>
                    <th className="px-5 py-3">Project</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b border-gray-50 transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <button
                          onClick={() => openLead(lead)}
                          className="text-left"
                        >
                          <div className="font-semibold text-gray-900 hover:text-[#C5832B]">
                            {lead.name}
                          </div>

                          <div className="mt-1 text-xs text-gray-400">
                            {lead.referenceCode || lead.id}
                          </div>

                          {lead.company && (
                            <div className="mt-1 text-xs text-gray-500">
                              {lead.company}
                            </div>
                          )}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-700">
                          {lead.phone}
                        </div>

                        {lead.email && (
                          <div className="mt-1 max-w-[220px] truncate text-xs text-gray-400">
                            {lead.email}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-700">
                          {lead.projectType || '—'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) =>
                            handleStatusChange(
                              lead,
                              e.target.value
                            )
                          }
                          className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${
                            statusClasses[lead.status] ||
                            'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {STATUSES.map((status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-500">
                        {formatDate(lead.created)}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openLead(lead)}
                          className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-[#C5832B] hover:text-[#C5832B]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="divide-y divide-gray-100 lg:hidden">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => openLead(lead)}
                      className="text-left"
                    >
                      <div className="font-semibold text-gray-900">
                        {lead.name}
                      </div>

                      <div className="mt-1 text-xs text-gray-400">
                        {lead.referenceCode || lead.id}
                      </div>
                    </button>

                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                        statusClasses[lead.status] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-gray-600">
                    <p>📞 {lead.phone}</p>

                    {lead.email && <p>✉ {lead.email}</p>}

                    {lead.company && <p>🏢 {lead.company}</p>}

                    {lead.projectType && (
                      <p>🏗️ {lead.projectType}</p>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => openLead(lead)}
                      className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                    >
                      View Lead
                    </button>

                    <a
                      href={`tel:${lead.phone}`}
                      className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
                    >
                      Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* LEAD DETAIL MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C5832B]">
                  Lead Details
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  {selectedLead.name}
                </h2>

                <p className="mt-1 text-xs text-gray-400">
                  {selectedLead.referenceCode ||
                    selectedLead.id}
                </p>
              </div>

              <button
                onClick={closeLead}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6 p-5">
              {/* CONTACT INFO */}
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
                      {selectedLead.name}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">
                      Phone
                    </p>
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="mt-1 block text-sm font-medium text-[#C5832B]"
                    >
                      {selectedLead.phone}
                    </a>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">
                      Email
                    </p>

                    {selectedLead.email ? (
                      <a
                        href={`mailto:${selectedLead.email}`}
                        className="mt-1 block break-all text-sm font-medium text-[#C5832B]"
                      >
                        {selectedLead.email}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-gray-400">
                        Not provided
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">
                      Company
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedLead.company || 'Not provided'}
                    </p>
                  </div>
                </div>
              </section>

              {/* PROJECT */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Project Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">
                      Project Type
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedLead.projectType || 'Not specified'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">
                      Source
                    </p>

                    <p className="mt-1 text-sm font-medium text-gray-800">
                      {selectedLead.source || 'Unknown'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 sm:col-span-2">
                    <p className="text-xs text-gray-400">
                      Enquiry
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                      {selectedLead.message ||
                        'No enquiry message provided.'}
                    </p>
                  </div>
                </div>
              </section>

              {/* PIPELINE */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Sales Pipeline
                </h3>

                <select
                  value={selectedLead.status}
                  onChange={(e) =>
                    handleStatusChange(
                      selectedLead,
                      e.target.value
                    )
                  }
                  className={`w-full rounded-lg border border-gray-200 px-3 py-3 text-sm font-semibold outline-none focus:border-[#C5832B] ${
                    statusClasses[selectedLead.status] || ''
                  }`}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </section>

              {/* INTERNAL MANAGEMENT */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Internal Management
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Assigned To
                    </label>

                    <input
                      value={assignedTo}
                      onChange={(e) =>
                        setAssignedTo(e.target.value)
                      }
                      placeholder="Staff member name"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-600">
                      Internal Notes
                    </label>

                    <textarea
                      value={notes}
                      onChange={(e) =>
                        setNotes(e.target.value)
                      }
                      rows={5}
                      placeholder="Add internal notes about this lead..."
                      className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                    />
                  </div>

                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="rounded-lg bg-[#C5832B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#a96f22] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingNotes
                      ? 'Saving...'
                      : 'Save Details'}
                  </button>
                </div>
              </section>

              {/* TIMELINE INFO */}
              <section>
                <h3 className="mb-3 text-sm font-semibold text-gray-900">
                  Record Information
                </h3>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">
                      Created
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
                      {formatDateTime(selectedLead.created)}
                    </p>
                  </div>

                  {selectedLead.updated && (
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">
                        Last Updated
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {formatDateTime(selectedLead.updated)}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* ACTIONS */}
              <section className="border-t border-gray-100 pt-5">
                <div className="flex flex-wrap gap-2">
                  <a
                    href={`tel:${selectedLead.phone}`}
                    className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    📞 Call
                  </a>

                  {selectedLead.email && (
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      ✉ Email
                    </a>
                  )}

                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="ml-auto rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    Delete Lead
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C5832B]">
                  CRM
                </p>

                <h2 className="mt-1 text-xl font-bold text-gray-900">
                  Add New Lead
                </h2>
              </div>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  setForm(emptyForm);
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleAddLead}
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
                    Project Type
                  </label>

                  <select
                    value={form.projectType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        projectType: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  >
                    <option value="">
                      Select project type
                    </option>

                    {PROJECT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-600">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Assigned To
                </label>

                <input
                  value={form.assignedTo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      assignedTo: e.target.value,
                    })
                  }
                  placeholder="Staff member"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-600">
                  Enquiry / Requirement
                </label>

                <textarea
                  rows={5}
                  value={form.message}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      message: e.target.value,
                    })
                  }
                  placeholder="Describe the client's requirement..."
                  className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#C5832B]"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setForm(emptyForm);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#C5832B] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#a96f22] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteModal && selectedLead && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 text-3xl">⚠️</div>

            <h2 className="text-lg font-bold text-gray-900">
              Delete this lead?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This will permanently remove{' '}
              <strong>{selectedLead.name}</strong> from
              the CRM.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteLead}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;