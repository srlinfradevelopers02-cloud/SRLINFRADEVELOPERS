import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

const COMPANY_NAME = 'SRL Infra Developers';

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

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const WORK_STATUSES = [
  'ASSIGNED',
  'IN_PROGRESS',
  'WAITING_FOR_CLIENT',
  'WAITING_FOR_ADMIN',
  'FOLLOW_UP_REQUIRED',
  'COMPLETED',
  'ON_HOLD',
];

const DEPARTMENT_BY_PROJECT: Record<string, string> = {
  'Interior Design': 'INTERIOR DESIGN',
  Automation: 'AUTOMATION',
  Elevators: 'ELEVATORS',
};

type Lead = {
  id: number;
  created_at: string;
  name: string;
  phone: string;
  email: string;
  company: string | null;
  project_type: string | null;
  message: string | null;
  reference_code: string | null;
  source: string | null;
  status: string | null;
  priority: string | null;
  assigned_to: string | null;
  created_by: string | null;
  estimated_value: number | null;
  lost_reason: string | null;
  next_follow_up_at: string | null;
  converted_at: string | null;
  updated_at: string | null;
  work_status: string | null;
  response_review_status: string | null;
  response_required: boolean;
};

type Staff = {
  id: string;
  user_id: string;
  staff_code: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  designation: string | null;
  is_active: boolean;
};

type LeadActivity = {
  id: number;
  lead_id: number;
  staff_id: string | null;
  activity_type: string;
  title: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const formatDate = (
  value: string | null | undefined
) => {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const toDateInput = (
  value: string | null
) => {
  if (!value) return '';

  const d = new Date(value);
  const offset = d.getTimezoneOffset();

  return new Date(d.getTime() - offset * 60000)
    .toISOString()
    .slice(0, 16);
};

const statusClass = (
  status: string | null
) => {
  switch (status) {
    case 'WON':
      return 'bg-green-100 text-green-700';

    case 'LOST':
      return 'bg-red-100 text-red-700';

    case 'NEGOTIATION':
    case 'QUOTATION':
      return 'bg-purple-100 text-purple-700';

    case 'CONTACTED':
    case 'QUALIFIED':
      return 'bg-blue-100 text-blue-700';

    case 'MEETING':
    case 'SITE VISIT':
      return 'bg-yellow-100 text-yellow-700';

    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const priorityClass = (
  priority: string | null
) => {
  switch (priority) {
    case 'URGENT':
      return 'text-red-700';

    case 'HIGH':
      return 'text-orange-700';

    case 'MEDIUM':
      return 'text-yellow-700';

    default:
      return 'text-gray-500';
  }
};

const activityName = (
  activity: LeadActivity,
  currentStaff: Staff | null,
  staffMap: Map<string, Staff>
) => {
  if (!activity.staff_id) {
    return 'System';
  }

  if (activity.staff_id === currentStaff?.id) {
    return 'You';
  }

  return (
    staffMap.get(activity.staff_id)?.full_name ||
    activity.staff_id.slice(0, 8)
  );
};

const Leads: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [currentStaff, setCurrentStaff] =
    useState<Staff | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState('ALL');
  const [projectFilter, setProjectFilter] =
    useState('ALL');

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const [activities, setActivities] =
    useState<LeadActivity[]>([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showDelete, setShowDelete] =
    useState<Lead | null>(null);

  const [assignedTo, setAssignedTo] =
    useState('');

  const [notes, setNotes] = useState('');

  const [followUpAt, setFollowUpAt] =
    useState('');

  const [workStatus, setWorkStatus] =
    useState('ASSIGNED');

  const [newLead, setNewLead] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    project_type: '',
    message: '',
    source: 'MANUAL',
    status: 'NEW',
    priority: 'MEDIUM',
    estimated_value: '',
  });

  const isAdmin =
    currentStaff?.role?.toUpperCase() ===
    'ADMIN';

  const department =
    currentStaff?.department?.toUpperCase() || '';

  const isTelecalling =
    department === 'TELECALLING';

  const isStaff =
    Boolean(currentStaff && !isAdmin);

  const staffMap = useMemo(() => {
    const map = new Map<string, Staff>();

    staff.forEach((member) => {
      map.set(member.id, member);
    });

    return map;
  }, [staff]);

  const suggestedDepartment = selectedLead
    ? DEPARTMENT_BY_PROJECT[
        selectedLead.project_type || ''
      ] || ''
    : '';

  const assignableStaff = useMemo(() => {
    if (!suggestedDepartment) {
      return staff;
    }

    return staff.filter(
      (member) =>
        member.department?.toUpperCase() ===
        suggestedDepartment
    );
  }, [staff, suggestedDepartment]);

  useEffect(() => {
    initializeCRM();
  }, []);

  const initializeCRM = async () => {
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
        throw new Error('Please login first.');
      }

      const {
        data,
        error,
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

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error(
          'Your account is not registered as an active SRL staff member.'
        );
      }

      const loggedStaff = data as Staff;

      setCurrentStaff(loggedStaff);

      await loadLeads();

      if (
        loggedStaff.role?.toUpperCase() ===
        'ADMIN'
      ) {
        await loadStaff();
      }
    } catch (error: any) {
      console.error(
        'CRM initialization failed:',
        error
      );

      setErrorMessage(
        error?.message ||
          'CRM initialization failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    const {
      data,
      error,
    } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'Lead loading failed:',
        error
      );

      throw error;
    }

    setLeads((data || []) as Lead[]);
  };

  const loadStaff = async () => {
    const {
      data,
      error,
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
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error(
        'Staff loading failed:',
        error
      );

      throw error;
    }

    setStaff((data || []) as Staff[]);
  };

  const loadLeadDetails = async (
    lead: Lead
  ) => {
    const {
      data,
      error,
    } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', {
        ascending: false,
      });

    if (error) {
      console.error(
        'Activity loading failed:',
        error
      );
    }

    setActivities(
      (data || []) as LeadActivity[]
    );
  };

  const openLead = async (lead: Lead) => {
    setSelectedLead(lead);

    setAssignedTo(
      lead.assigned_to || ''
    );

    setNotes('');

    setFollowUpAt(
      toDateInput(
        lead.next_follow_up_at
      )
    );

    setWorkStatus(
      lead.work_status || 'ASSIGNED'
    );

    await loadLeadDetails(lead);
  };

  const closeLead = () => {
    setSelectedLead(null);
    setActivities([]);
    setAssignedTo('');
    setNotes('');
    setFollowUpAt('');
    setWorkStatus('ASSIGNED');
  };

  const filteredLeads = useMemo(() => {
    const q = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !q ||
        lead.name
          ?.toLowerCase()
          .includes(q) ||
        lead.phone
          ?.toLowerCase()
          .includes(q) ||
        lead.email
          ?.toLowerCase()
          .includes(q) ||
        lead.company
          ?.toLowerCase()
          .includes(q) ||
        lead.reference_code
          ?.toLowerCase()
          .includes(q) ||
        lead.project_type
          ?.toLowerCase()
          .includes(q);

      const matchesStatus =
        statusFilter === 'ALL' ||
        (lead.status || 'NEW') ===
          statusFilter;

      const matchesProject =
        projectFilter === 'ALL' ||
        (lead.project_type || '') ===
          projectFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesProject
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    projectFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: leads.length,

      newLeads: leads.filter(
        (lead) =>
          (lead.status || 'NEW') === 'NEW'
      ).length,

      followUps: leads.filter((lead) =>
        [
          'CONTACTED',
          'QUALIFIED',
          'MEETING',
          'SITE VISIT',
          'NEGOTIATION',
        ].includes(lead.status || '')
      ).length,

      won: leads.filter(
        (lead) => lead.status === 'WON'
      ).length,
    };
  }, [leads]);

  const getStaffName = (
    id: string | null
  ) => {
    if (!id) {
      return 'Unassigned';
    }

    if (currentStaff?.id === id) {
      return 'You';
    }

    return (
      staffMap.get(id)?.full_name ||
      'Assigned Staff'
    );
  };

  const updateLocalLead = (
    id: number,
    changes: Partial<Lead>
  ) => {
    setLeads((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
            }
          : item
      )
    );

    setSelectedLead((item) =>
      item?.id === id
        ? {
            ...item,
            ...changes,
          }
        : item
    );
  };

  const handleCall = (
    phone: string
  ) => {
    if (!phone) {
      alert(
        'Customer phone number is not available.'
      );
      return;
    }

    window.location.href =
      `tel:${phone.replace(
        /[^\d+]/g,
        ''
      )}`;
  };

  const addActivity = async (
    leadId: number,
    type: string,
    title: string,
    description: string
  ) => {
    if (!currentStaff) return;

    const {
      data,
      error,
    } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: leadId,
        staff_id: currentStaff.id,
        activity_type: type,
        title,
        description,
        metadata: {},
      })
      .select('*')
      .single();

    if (error) {
      console.error(
        'Activity creation failed:',
        error
      );
      return;
    }

    if (
      selectedLead?.id === leadId
    ) {
      setActivities((items) => [
        data as LeadActivity,
        ...items,
      ]);
    }
  };

  const updateStatus = async (
    lead: Lead,
    status: string
  ) => {
    if (!isAdmin) return;

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabase
        .from('leads')
        .update({
          status,
          converted_at:
            status === 'WON'
              ? now
              : lead.converted_at,
          updated_at: now,
        })
        .eq('id', lead.id);

      if (error) {
        throw error;
      }

      updateLocalLead(lead.id, {
        status,
        converted_at:
          status === 'WON'
            ? now
            : lead.converted_at,
        updated_at: now,
      });

      await addActivity(
        lead.id,
        'STATUS',
        'Lead status updated',
        `Lead status changed to ${status}.`
      );
    } catch (error: any) {
      console.error(
        'Status update failed:',
        error
      );

      alert(
        error?.message ||
          'Failed to update lead status.'
      );
    } finally {
      setSaving(false);
    }
  };

  const assignLead = async () => {
    if (
      !isAdmin ||
      !selectedLead ||
      !currentStaff
    ) {
      return;
    }

    const assigned =
      assignedTo || null;

    if (assigned) {
      const selectedStaff =
        staffMap.get(assigned);

      if (!selectedStaff) {
        alert(
          'Selected staff member was not found.'
        );
        return;
      }

      if (
        suggestedDepartment &&
        selectedStaff.department?.toUpperCase() !==
          suggestedDepartment
      ) {
        alert(
          `This lead should be assigned to ${suggestedDepartment} staff.`
        );
        return;
      }
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const previousAssignedTo =
        selectedLead.assigned_to;

      const {
        error,
      } = await supabase
        .from('leads')
        .update({
          assigned_to: assigned,
          work_status: assigned
            ? 'ASSIGNED'
            : 'ON_HOLD',
          updated_at: now,
        })
        .eq('id', selectedLead.id);

      if (error) {
        throw error;
      }

      updateLocalLead(
        selectedLead.id,
        {
          assigned_to: assigned,
          work_status: assigned
            ? 'ASSIGNED'
            : 'ON_HOLD',
          updated_at: now,
        }
      );

      const previousName =
        getStaffName(
          previousAssignedTo
        );

      const newName =
        getStaffName(assigned);

      await addActivity(
        selectedLead.id,
        'ASSIGNMENT',
        assigned
          ? 'Lead assigned'
          : 'Lead unassigned',
        assigned
          ? `Lead assigned to ${newName}.`
          : `Lead unassigned from ${previousName}.`
      );

      alert(
        assigned
          ? `Lead assigned to ${newName}.`
          : 'Lead unassigned.'
      );
    } catch (error: any) {
      console.error(
        'Lead assignment failed:',
        error
      );

      alert(
        error?.message ||
          'Failed to assign lead.'
      );
    } finally {
      setSaving(false);
    }
  };

  const updateWorkStatus = async (
    status: string
  ) => {
    if (
      !isStaff ||
      !selectedLead ||
      !currentStaff
    ) {
      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const {
        error,
      } = await supabase
        .from('leads')
        .update({
          work_status: status,
          updated_at: now,
        })
        .eq('id', selectedLead.id)
        .eq(
          'assigned_to',
          currentStaff.id
        );

      if (error) {
        throw error;
      }

      updateLocalLead(
        selectedLead.id,
        {
          work_status: status,
          updated_at: now,
        }
      );

      await addActivity(
        selectedLead.id,
        'WORK_STATUS',
        'Work status updated',
        `Work status changed to ${status}.`
      );
    } catch (error: any) {
      console.error(
        'Work status update failed:',
        error
      );

      alert(
        error?.message ||
          'Failed to update work status.'
      );
    } finally {
      setSaving(false);
    }
  };

  const saveNote = async () => {
    if (
      !selectedLead ||
      !notes.trim()
    ) {
      return;
    }

    setSaving(true);

    try {
      await addActivity(
        selectedLead.id,
        'NOTE',
        'Internal note',
        notes.trim()
      );

      setNotes('');
    } finally {
      setSaving(false);
    }
  };

  const saveFollowUp = async () => {
    if (
      !selectedLead ||
      !currentStaff
    ) {
      return;
    }

    if (
      !isAdmin &&
      !isTelecalling
    ) {
      return;
    }

    setSaving(true);

    try {
      const now =
        new Date().toISOString();

      const nextFollowUp =
        followUpAt
          ? new Date(
              followUpAt
            ).toISOString()
          : null;

      let query = supabase
        .from('leads')
        .update({
          next_follow_up_at:
            nextFollowUp,
          work_status: nextFollowUp
            ? 'FOLLOW_UP_REQUIRED'
            : selectedLead.work_status,
          updated_at: now,
        })
        .eq(
          'id',
          selectedLead.id
        );

      if (!isAdmin) {
        query = query.eq(
          'assigned_to',
          currentStaff.id
        );
      }

      const { error } =
        await query;

      if (error) {
        throw error;
      }

      updateLocalLead(
        selectedLead.id,
        {
          next_follow_up_at:
            nextFollowUp,
          work_status: nextFollowUp
            ? 'FOLLOW_UP_REQUIRED'
            : selectedLead.work_status,
          updated_at: now,
        }
      );

      await addActivity(
        selectedLead.id,
        'FOLLOW_UP',
        'Follow-up scheduled',
        nextFollowUp
          ? `Follow-up scheduled for ${formatDate(
              nextFollowUp
            )}.`
          : 'Follow-up cleared.'
      );
    } catch (error: any) {
      console.error(
        'Follow-up update failed:',
        error
      );

      alert(
        error?.message ||
          'Failed to update follow-up.'
      );
    } finally {
      setSaving(false);
    }
  };

  const addLead = async () => {
    if (
      !isAdmin ||
      !currentStaff
    ) {
      return;
    }

    if (!newLead.name.trim()) {
      alert(
        'Lead name is required.'
      );
      return;
    }

    if (!newLead.phone.trim()) {
      alert(
        'Phone number is required.'
      );
      return;
    }

    setSaving(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from('leads')
        .insert({
          name: newLead.name.trim(),
          phone: newLead.phone.trim(),
          email: newLead.email.trim(),
          company:
            newLead.company.trim() ||
            null,
          project_type:
            newLead.project_type ||
            null,
          message:
            newLead.message.trim() ||
            null,
          source: newLead.source,
          status: newLead.status,
          priority: newLead.priority,
          estimated_value:
            newLead.estimated_value
              ? Number(
                  newLead.estimated_value
                )
              : null,
          created_by:
            currentStaff.id,
          assigned_to: null,
          work_status: 'ON_HOLD',
          response_review_status:
            null,
          response_required:
            false,
        })
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      setLeads((items) => [
        data as Lead,
        ...items,
      ]);

      setNewLead({
        name: '',
        phone: '',
        email: '',
        company: '',
        project_type: '',
        message: '',
        source: 'MANUAL',
        status: 'NEW',
        priority: 'MEDIUM',
        estimated_value: '',
      });

      setShowAdd(false);

      alert(
        'Lead created. Assign it to the appropriate staff member.'
      );
    } catch (error: any) {
      console.error(
        'Lead creation failed:',
        error
      );

      alert(
        error?.message ||
          'Failed to create lead.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async () => {
    if (
      !isAdmin ||
      !showDelete
    ) {
      return;
    }

    setSaving(true);

    try {
      const {
        error,
      } = await supabase
        .from('leads')
        .delete()
        .eq(
          'id',
          showDelete.id
        );

      if (error) {
        throw error;
      }

      setLeads((items) =>
        items.filter(
          (lead) =>
            lead.id !==
            showDelete.id
        )
      );

      if (
        selectedLead?.id ===
        showDelete.id
      ) {
        closeLead();
      }

      setShowDelete(null);
    } catch (error: any) {
      console.error(
        'Lead deletion failed:',
        error
      );

      alert(
        error?.message ||
          'Failed to delete lead.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">
            Loading CRM...
          </p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-xl rounded-xl bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-600">
            CRM Access Error
          </h2>

          <p className="mt-3 text-sm text-gray-600">
            {errorMessage}
          </p>

          <button
            onClick={initializeCRM}
            className="mt-5 rounded-lg bg-[#C5832B] px-5 py-3 text-sm font-semibold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Leads
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Admin Lead Management'
              : `${currentStaff?.department || 'Staff'} - Assigned Leads`}
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() =>
              setShowAdd(true)
            }
            className="rounded-lg bg-[#C5832B] px-5 py-3 text-sm font-semibold text-white"
          >
            + Add Lead
          </button>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-[#C5832B]/20 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-gray-900">
              {COMPANY_NAME}
            </p>

            <p className="text-xs text-gray-500">
              Logged in as:{' '}
              {currentStaff?.full_name}
            </p>
          </div>

          <div className="text-sm text-gray-600">
            {currentStaff?.role}

            {currentStaff?.department
              ? ` • ${currentStaff.department}`
              : ''}
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Leads
          </p>

          <p className="mt-2 text-2xl font-bold">
            {stats.total}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            New
          </p>

          <p className="mt-2 text-2xl font-bold text-blue-600">
            {stats.newLeads}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Follow-ups
          </p>

          <p className="mt-2 text-2xl font-bold text-orange-600">
            {stats.followUps}
          </p>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Won
          </p>

          <p className="mt-2 text-2xl font-bold text-green-600">
            {stats.won}
          </p>
        </div>

      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search name, phone, email, company..."
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          />

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            <option value="ALL">
              All Statuses
            </option>

            {STATUSES.map(
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
            value={projectFilter}
            onChange={(e) =>
              setProjectFilter(
                e.target.value
              )
            }
            className="rounded-lg border border-gray-300 px-4 py-3 text-sm"
          >
            <option value="ALL">
              All Project Types
            </option>

            {PROJECT_TYPES.map(
              (project) => (
                <option
                  key={project}
                  value={project}
                >
                  {project}
                </option>
              )
            )}
          </select>

        </div>
      </div>

      <div className="hidden overflow-hidden rounded-xl bg-white shadow-sm md:block">
        <div className="overflow-x-auto">

          <table className="w-full text-left text-sm">

            <thead className="bg-gray-100 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">
                  Lead
                </th>

                <th className="px-5 py-4">
                  Contact
                </th>

                <th className="px-5 py-4">
                  Project
                </th>

                <th className="px-5 py-4">
                  Status
                </th>

                <th className="px-5 py-4">
                  Work
                </th>

                <th className="px-5 py-4">
                  Assigned
                </th>

                <th className="px-5 py-4">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {filteredLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map(
                  (lead) => (
                    <tr
                      key={lead.id}
                      className="hover:bg-gray-50"
                    >

                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            openLead(lead)
                          }
                          className="text-left"
                        >
                          <p className="font-semibold text-gray-900">
                            {lead.name}
                          </p>

                          <p className="text-xs text-gray-400">
                            {lead.reference_code ||
                              `LEAD-${lead.id}`}
                          </p>
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <p>
                          {lead.phone}
                        </p>

                        <p className="text-xs text-gray-500">
                          {lead.email ||
                            'No email'}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium">
                          {lead.project_type ||
                            'General Enquiry'}
                        </p>

                        <p
                          className={`text-xs font-semibold ${priorityClass(
                            lead.priority
                          )}`}
                        >
                          {lead.priority ||
                            'MEDIUM'}
                        </p>
                      </td>

                      <td className="px-5 py-4">

                        {isAdmin ? (
                          <select
                            value={
                              lead.status ||
                              'NEW'
                            }
                            onChange={(e) =>
                              updateStatus(
                                lead,
                                e.target.value
                              )
                            }
                            disabled={saving}
                            className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold ${statusClass(
                              lead.status
                            )}`}
                          >
                            {STATUSES.map(
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
                        ) : (
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(
                              lead.status
                            )}`}
                          >
                            {lead.status ||
                              'NEW'}
                          </span>
                        )}

                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-gray-600">
                          {lead.work_status ||
                            'ASSIGNED'}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {getStaffName(
                          lead.assigned_to
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              openLead(lead)
                            }
                            className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold"
                          >
                            View
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() =>
                                setShowDelete(
                                  lead
                                )
                              }
                              className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                            >
                              Delete
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>
          </table>

        </div>
      </div>

      <div className="space-y-4 md:hidden">

        {filteredLeads.map(
          (lead) => (
            <div
              key={lead.id}
              className="rounded-xl bg-white p-4 shadow-sm"
            >

              <div className="flex items-start justify-between gap-3">

                <button
                  onClick={() =>
                    openLead(lead)
                  }
                  className="text-left"
                >
                  <h3 className="font-semibold text-gray-900">
                    {lead.name}
                  </h3>

                  <p className="text-xs text-gray-400">
                    {lead.reference_code ||
                      `LEAD-${lead.id}`}
                  </p>
                </button>

                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(
                    lead.status
                  )}`}
                >
                  {lead.status ||
                    'NEW'}
                </span>

              </div>

              <div className="mt-3 space-y-1 text-sm text-gray-600">

                <p>
                  📞 {lead.phone}
                </p>

                <p>
                  ✉ {lead.email ||
                    'No email'}
                </p>

                <p>
                  🏗️{' '}
                  {lead.project_type ||
                    'General Enquiry'}
                </p>

                <p>
                  👤{' '}
                  {getStaffName(
                    lead.assigned_to
                  )}
                </p>

                <p>
                  ⚙️{' '}
                  {lead.work_status ||
                    'ASSIGNED'}
                </p>

              </div>

              <div className="mt-4 flex flex-wrap gap-2">

                <button
                  onClick={() =>
                    handleCall(
                      lead.phone
                    )
                  }
                  className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700"
                >
                  📞 Call
                </button>

                <button
                  onClick={() =>
                    openLead(lead)
                  }
                  className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold"
                >
                  View
                </button>

                {isAdmin && (
                  <button
                    onClick={() =>
                      setShowDelete(
                        lead
                      )
                    }
                    className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                  >
                    Delete
                  </button>
                )}

              </div>

            </div>
          )
        )}

      </div>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">

            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5">

              <div>
                <h2 className="text-xl font-bold">
                  {selectedLead.name}
                </h2>

                <p className="text-sm text-gray-500">
                  {selectedLead.reference_code ||
                    `LEAD-${selectedLead.id}`}
                </p>
              </div>

              <button
                onClick={closeLead}
                className="rounded-lg bg-gray-100 px-3 py-2"
              >
                ✕
              </button>

            </div>

            <div className="space-y-6 p-5">

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Phone
                  </p>

                  <p className="font-medium">
                    {selectedLead.phone}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Email
                  </p>

                  <p className="break-all font-medium">
                    {selectedLead.email ||
                      'Not provided'}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Project
                  </p>

                  <p className="font-medium">
                    {selectedLead.project_type ||
                      'General Enquiry'}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-500">
                    Assigned
                  </p>

                  <p className="font-medium">
                    {getStaffName(
                      selectedLead.assigned_to
                    )}
                  </p>
                </div>

              </div>

              {isAdmin && (
                <div>
                  <h3 className="mb-3 font-semibold">
                    Lead Status
                  </h3>

                  <select
                    value={
                      selectedLead.status ||
                      'NEW'
                    }
                    onChange={(e) =>
                      updateStatus(
                        selectedLead,
                        e.target.value
                      )
                    }
                    disabled={saving}
                    className="w-full rounded-lg border px-4 py-3 text-sm"
                  >
                    {STATUSES.map(
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
              )}

              {isAdmin && (
                <div>

                  <h3 className="mb-3 font-semibold">
                    Assign Staff
                  </h3>

                  {suggestedDepartment && (
                    <div className="mb-3 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                      Suggested Department:{' '}
                      <strong>
                        {suggestedDepartment}
                      </strong>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 md:flex-row">

                    <select
                      value={assignedTo}
                      onChange={(e) =>
                        setAssignedTo(
                          e.target.value
                        )
                      }
                      className="flex-1 rounded-lg border px-4 py-3 text-sm"
                    >

                      <option value="">
                        Unassigned
                      </option>

                      {assignableStaff.map(
                        (member) => (
                          <option
                            key={member.id}
                            value={member.id}
                          >
                            {member.full_name}
                            {member.department
                              ? ` - ${member.department}`
                              : ''}
                          </option>
                        )
                      )}

                    </select>

                    <button
                      onClick={assignLead}
                      disabled={saving}
                      className="rounded-lg bg-[#C5832B] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      {saving
                        ? 'Saving...'
                        : 'Assign'}
                    </button>

                  </div>

                  {suggestedDepartment &&
                    assignableStaff.length ===
                      0 && (
                      <p className="mt-2 text-sm text-red-600">
                        No active staff available
                        for{' '}
                        {suggestedDepartment}.
                      </p>
                    )}

                </div>
              )}

              {isStaff && (
                <div>

                  <h3 className="mb-3 font-semibold">
                    Work Status
                  </h3>

                  <select
                    value={workStatus}
                    onChange={(e) => {
                      const value =
                        e.target.value;

                      setWorkStatus(value);

                      updateWorkStatus(
                        value
                      );
                    }}
                    disabled={saving}
                    className="w-full rounded-lg border px-4 py-3 text-sm"
                  >

                    {WORK_STATUSES.map(
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
              )}

              {(isAdmin ||
                isTelecalling) && (
                <div>

                  <h3 className="mb-3 font-semibold">
                    Follow-up
                  </h3>

                  <div className="flex flex-col gap-3 md:flex-row">

                    <input
                      type="datetime-local"
                      value={followUpAt}
                      onChange={(e) =>
                        setFollowUpAt(
                          e.target.value
                        )
                      }
                      className="flex-1 rounded-lg border px-4 py-3 text-sm"
                    />

                    <button
                      onClick={
                        saveFollowUp
                      }
                      disabled={saving}
                      className="rounded-lg bg-orange-600 px-5 py-3 text-sm font-semibold text-white"
                    >
                      Save Follow-up
                    </button>

                  </div>

                  {selectedLead.next_follow_up_at && (
                    <p className="mt-2 text-xs text-gray-500">
                      Current:{' '}
                      {formatDate(
                        selectedLead.next_follow_up_at
                      )}
                    </p>
                  )}

                </div>
              )}

              <div>

                <h3 className="mb-3 font-semibold">
                  Enquiry Message
                </h3>

                <div className="rounded-lg bg-gray-50 p-4 text-sm leading-6 text-gray-700">
                  {selectedLead.message ||
                    'No message provided.'}
                </div>

              </div>

              <div>

                <h3 className="mb-3 font-semibold">
                  Internal Notes
                </h3>

                <div className="flex flex-col gap-3 md:flex-row">

                  <textarea
                    value={notes}
                    onChange={(e) =>
                      setNotes(
                        e.target.value
                      )
                    }
                    rows={3}
                    placeholder="Add internal CRM note..."
                    className="flex-1 rounded-lg border px-4 py-3 text-sm"
                  />

                  <button
                    onClick={saveNote}
                    disabled={
                      saving ||
                      !notes.trim()
                    }
                    className="rounded-lg bg-gray-800 px-5 py-3 text-sm font-semibold text-white"
                  >
                    Save Note
                  </button>

                </div>

              </div>

              <div>

                <h3 className="mb-3 font-semibold">
                  Activity
                </h3>

                {activities.length === 0 ? (
                  <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    No activity yet.
                  </div>
                ) : (
                  <div className="space-y-3">

                    {activities.map(
                      (activity) => (
                        <div
                          key={
                            activity.id
                          }
                          className="rounded-lg bg-gray-50 p-3"
                        >

                          <div className="flex justify-between gap-3">

                            <p className="text-sm font-semibold">
                              {activity.title ||
                                activity.activity_type}
                            </p>

                            <p className="text-xs text-gray-400">
                              {formatDate(
                                activity.created_at
                              )}
                            </p>

                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            {activityName(
                              activity,
                              currentStaff,
                              staffMap
                            )}
                          </p>

                          {activity.description && (
                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                              {
                                activity.description
                              }
                            </p>
                          )}

                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

              <div className="flex justify-between border-t pt-5">

                <button
                  onClick={closeLead}
                  className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold"
                >
                  Close
                </button>

                {isAdmin && (
                  <button
                    onClick={() =>
                      setShowDelete(
                        selectedLead
                      )
                    }
                    className="rounded-lg bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-600"
                  >
                    Delete Lead
                  </button>
                )}

              </div>

            </div>
          </div>
        </div>
      )}

      {showAdd && isAdmin && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/50 p-4">

          <div className="mx-auto my-6 max-w-3xl rounded-2xl bg-white p-6">

            <div className="flex justify-between">

              <h2 className="text-xl font-bold">
                Add New Lead
              </h2>

              <button
                onClick={() =>
                  setShowAdd(false)
                }
                className="rounded-lg bg-gray-100 px-3 py-2"
              >
                ✕
              </button>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <input
                placeholder="Name *"
                value={newLead.name}
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    name: e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              />

              <input
                placeholder="Phone *"
                value={newLead.phone}
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    phone: e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              />

              <input
                type="email"
                placeholder="Email"
                value={newLead.email}
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    email: e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              />

              <input
                placeholder="Company"
                value={newLead.company}
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    company:
                      e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              />

              <select
                value={
                  newLead.project_type
                }
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    project_type:
                      e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              >

                <option value="">
                  Select Project
                </option>

                {PROJECT_TYPES.map(
                  (project) => (
                    <option
                      key={project}
                      value={project}
                    >
                      {project}
                    </option>
                  )
                )}

              </select>

              <select
                value={newLead.priority}
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    priority:
                      e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              >

                {PRIORITIES.map(
                  (priority) => (
                    <option
                      key={priority}
                      value={priority}
                    >
                      {priority}
                    </option>
                  )
                )}

              </select>

              <input
                type="number"
                placeholder="Estimated Value"
                value={
                  newLead.estimated_value
                }
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    estimated_value:
                      e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              />

              <input
                placeholder="Source"
                value={newLead.source}
                onChange={(e) =>
                  setNewLead((p) => ({
                    ...p,
                    source:
                      e.target.value,
                  }))
                }
                className="rounded-lg border px-4 py-3 text-sm"
              />

            </div>

            <textarea
              placeholder="Enquiry message"
              value={newLead.message}
              onChange={(e) =>
                setNewLead((p) => ({
                  ...p,
                  message:
                    e.target.value,
                }))
              }
              rows={5}
              className="mt-4 w-full rounded-lg border px-4 py-3 text-sm"
            />

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowAdd(false)
                }
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={addLead}
                disabled={saving}
                className="rounded-lg bg-[#C5832B] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Creating...'
                  : 'Create Lead'}
              </button>

            </div>

          </div>
        </div>
      )}

      {showDelete && isAdmin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

          <div className="w-full max-w-md rounded-2xl bg-white p-6">

            <h2 className="text-xl font-bold">
              Delete Lead?
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Delete{' '}
              <strong>
                {showDelete.name}
              </strong>
              ? This cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowDelete(null)
                }
                className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={deleteLead}
                disabled={saving}
                className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? 'Deleting...'
                  : 'Delete'}
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Leads;