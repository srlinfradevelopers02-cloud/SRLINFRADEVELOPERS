import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { pb } from '../../lib/pocketbase';

/* =========================================================
   TYPES
========================================================= */

type Staff = {
  id: string;
  collectionId?: string;
  collectionName?: string;

  user?: string;

  staff_code: string;
  full_name: string;
  email: string;
  phone: string;

  Role: 'ADMIN' | 'MANAGER' | 'STAFF';

  Department:
    | 'ADMIN'
    | 'TELECALLING'
    | 'SALES'
    | 'INTERIOR DESIGN'
    | 'AUTOMATION'
    | 'PROJECT MANAGEMENT'
    | 'ACCOUNTS'
    | 'HR'
    | 'MARKETING'
    | 'OPERATIONS'
    | 'OTHER';

  Designation: string;

  joining_date?: string;

  employment_type:
    | 'FULL TIME'
    | 'PART TIME'
    | 'CONTRACT';

  skills?: string;
  profile_photo?: string;
  address?: string;
  notes?: string;

  is_active: boolean;

  created: string;
  updated: string;
};

type PBUser = {
  id: string;
  email: string;
  name?: string;
  username?: string;
  verified?: boolean;
};

type StaffForm = {
  user: string;
  staff_code: string;
  full_name: string;
  email: string;
  phone: string;

  Role: 'ADMIN' | 'MANAGER' | 'STAFF';

  Department:
    | 'ADMIN'
    | 'TELECALLING'
    | 'SALES'
    | 'INTERIOR DESIGN'
    | 'AUTOMATION'
    | 'PROJECT MANAGEMENT'
    | 'ACCOUNTS'
    | 'HR'
    | 'MARKETING'
    | 'OPERATIONS'
    | 'OTHER';

  Designation: string;

  joining_date: string;

  employment_type:
    | 'FULL TIME'
    | 'PART TIME'
    | 'CONTRACT';

  skills: string;

  profile_photo: File | null;

  address: string;
  notes: string;

  is_active: boolean;
};

/* =========================================================
   CONSTANTS
========================================================= */

const DEPARTMENTS = [
  'ADMIN',
  'TELECALLING',
  'SALES',
  'INTERIOR DESIGN',
  'AUTOMATION',
  'PROJECT MANAGEMENT',
  'ACCOUNTS',
  'HR',
  'MARKETING',
  'OPERATIONS',
  'OTHER',
] as const;

const ROLES = [
  'ADMIN',
  'MANAGER',
  'STAFF',
] as const;

const EMPLOYMENT_TYPES = [
  'FULL TIME',
  'PART TIME',
  'CONTRACT',
] as const;

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm: StaffForm = {
  user: '',
  staff_code: '',
  full_name: '',
  email: '',
  phone: '',

  Role: 'STAFF',

  Department: 'TELECALLING',

  Designation: '',

  joining_date: '',

  employment_type: 'FULL TIME',

  skills: '',

  profile_photo: null,

  address: '',

  notes: '',

  is_active: true,
};

/* =========================================================
   HELPERS
========================================================= */

function generateStaffCode(existingStaff: Staff[]) {
  const year = new Date().getFullYear();

  const numbers = existingStaff
    .map((staff) => {
      const match = staff.staff_code?.match(
        /^STF-\d{4}-(\d{4})$/
      );

      return match ? Number(match[1]) : 0;
    })
    .filter(Boolean);

  const nextNumber =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1;

  return `STF-${year}-${String(nextNumber).padStart(4, '0')}`;
}

function formatDate(date?: string) {
  if (!date) return '—';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getInitials(name: string) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) =>
        part.charAt(0).toUpperCase()
      )
      .join('') || 'ST'
  );
}

function getErrorMessage(error: any) {
  if (error?.response?.data) {
    const data = error.response.data;

    const fieldErrors = Object.entries(data)
      .map(([field, value]: [string, any]) => {
        if (value?.message) {
          return `${field}: ${value.message}`;
        }

        return '';
      })
      .filter(Boolean);

    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }
  }

  return (
    error?.response?.message ||
    error?.message ||
    'Something went wrong.'
  );
}

/* =========================================================
   COMPONENT
========================================================= */

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);

  /*
   * Login users are NOT loaded during initial page load.
   *
   * They are loaded only when Add/Edit Staff is opened.
   */
  const [users, setUsers] = useState<PBUser[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingUsers, setLoadingUsers] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');

  const [departmentFilter, setDepartmentFilter] =
    useState('ALL');

  const [roleFilter, setRoleFilter] =
    useState('ALL');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [showForm, setShowForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [editingStaff, setEditingStaff] =
    useState<Staff | null>(null);

  const [selectedStaff, setSelectedStaff] =
    useState<Staff | null>(null);

  const [form, setForm] =
    useState<StaffForm>(emptyForm);

  /* =======================================================
     LOAD STAFF
  ======================================================= */

  const loadStaff = async () => {
    try {
      setLoading(true);

      const records =
        await pb.collection('staff').getFullList<Staff>({
          sort: '-created',
        });

      setStaff(records);
    } catch (error: any) {
      console.error(
        'Failed to load staff:',
        error
      );

      alert(
        getErrorMessage(error) ||
          'Failed to load staff.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     LOAD LOGIN USERS
  ======================================================= */

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);

      /*
       * Only request the fields required by this page.
       *
       * This prevents unnecessary user information
       * from being downloaded.
       */
      const result =
        await pb.collection('users').getList<PBUser>(
          1,
          200,
          {
            sort: 'email',
            fields:
              'id,email,name,username,verified',
          }
        );

      setUsers(result.items);
    } catch (error: any) {
      console.error(
        'Failed to load login users:',
        error
      );

      setUsers([]);

      alert(
        `Unable to load login accounts.\n\n${getErrorMessage(
          error
        )}\n\nCheck the PocketBase "users" List/View API rules.`
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadStaff();
  }, []);

  /* =======================================================
     FILTERED STAFF
  ======================================================= */

  const filteredStaff = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return staff.filter((person) => {
      const matchesSearch =
        !query ||
        person.full_name
          ?.toLowerCase()
          .includes(query) ||
        person.staff_code
          ?.toLowerCase()
          .includes(query) ||
        person.email
          ?.toLowerCase()
          .includes(query) ||
        person.phone
          ?.toLowerCase()
          .includes(query) ||
        person.Designation
          ?.toLowerCase()
          .includes(query);

      const matchesDepartment =
        departmentFilter === 'ALL' ||
        person.Department === departmentFilter;

      const matchesRole =
        roleFilter === 'ALL' ||
        person.Role === roleFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' &&
          person.is_active) ||
        (statusFilter === 'INACTIVE' &&
          !person.is_active);

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    staff,
    search,
    departmentFilter,
    roleFilter,
    statusFilter,
  ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const total = staff.length;

    const active = staff.filter(
      (person) => person.is_active
    ).length;

    const inactive = staff.filter(
      (person) => !person.is_active
    ).length;

    const managers = staff.filter(
      (person) =>
        person.Role === 'MANAGER'
    ).length;

    const admins = staff.filter(
      (person) =>
        person.Role === 'ADMIN'
    ).length;

    return {
      total,
      active,
      inactive,
      managers,
      admins,
    };
  }, [staff]);

  /* =======================================================
     OPEN ADD FORM
  ======================================================= */

  const openAddForm = async () => {
    setEditingStaff(null);

    setForm({
      ...emptyForm,
      staff_code:
        generateStaffCode(staff),
    });

    /*
     * Users are loaded ONLY now.
     */
    await loadUsers();

    setShowForm(true);
  };

  /* =======================================================
     OPEN EDIT FORM
  ======================================================= */

  const openEditForm = async (
    person: Staff
  ) => {
    setEditingStaff(person);

    setForm({
      user: person.user || '',

      staff_code:
        person.staff_code || '',

      full_name:
        person.full_name || '',

      email:
        person.email || '',

      phone:
        person.phone || '',

      Role:
        person.Role || 'STAFF',

      Department:
        person.Department || 'OTHER',

      Designation:
        person.Designation || '',

      joining_date:
        person.joining_date
          ? person.joining_date.substring(
              0,
              10
            )
          : '',

      employment_type:
        person.employment_type ||
        'FULL TIME',

      skills:
        person.skills || '',

      profile_photo:
        null,

      address:
        person.address || '',

      notes:
        person.notes || '',

      is_active:
        person.is_active ?? true,
    });

    /*
     * Load users only when editing.
     */
    await loadUsers();

    setShowForm(true);
  };

  /* =======================================================
     FORM CHANGE
  ======================================================= */

  const handleFormChange = (
    field: keyof StaffForm,
    value:
      | string
      | boolean
      | File
      | null
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =======================================================
     USER SELECTION
  ======================================================= */

  const handleUserChange = (
    userId: string
  ) => {
    const selectedUser =
      users.find(
        (user) => user.id === userId
      );

    setForm((previous) => ({
      ...previous,

      user: userId,

      full_name:
        selectedUser?.name ||
        previous.full_name,

      email:
        selectedUser?.email ||
        previous.email,
    }));
  };

  /* =======================================================
     SAVE STAFF
  ======================================================= */

  const saveStaff = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (saving) return;

    if (!pb.authStore.isValid) {
      alert(
        'Your session has expired. Please login again.'
      );

      return;
    }

    if (!form.user.trim()) {
      alert(
        'Please select a login account.'
      );

      return;
    }

    if (!form.staff_code.trim()) {
      alert(
        'Staff code is required.'
      );

      return;
    }

    if (!form.full_name.trim()) {
      alert(
        'Please enter the staff name.'
      );

      return;
    }

    if (!form.email.trim()) {
      alert(
        'Please enter the staff email.'
      );

      return;
    }

    if (!form.phone.trim()) {
      alert(
        'Please enter the staff phone number.'
      );

      return;
    }

    if (!form.Designation.trim()) {
      alert(
        'Please enter the designation.'
      );

      return;
    }

    /*
     * Prevent assigning the same login account
     * to two different staff records.
     */
    const duplicateUser = staff.find(
      (person) =>
        person.user === form.user &&
        person.id !== editingStaff?.id
    );

    if (duplicateUser) {
      alert(
        `This login account is already assigned to ${duplicateUser.full_name}.`
      );

      return;
    }

    try {
      setSaving(true);

      const formData =
        new FormData();

      /*
       * Required fields
       */

      formData.append(
        'user',
        form.user
      );

      formData.append(
        'staff_code',
        form.staff_code.trim()
      );

      formData.append(
        'full_name',
        form.full_name.trim()
      );

      formData.append(
        'email',
        form.email.trim()
      );

      formData.append(
        'phone',
        form.phone.trim()
      );

      formData.append(
        'Role',
        form.Role
      );

      formData.append(
        'Department',
        form.Department
      );

      formData.append(
        'Designation',
        form.Designation.trim()
      );

      formData.append(
        'employment_type',
        form.employment_type
      );

      formData.append(
        'is_active',
        String(form.is_active)
      );

      /*
       * Optional fields
       */

      if (form.joining_date) {
        formData.append(
          'joining_date',
          form.joining_date
        );
      }

      if (form.skills.trim()) {
        formData.append(
          'skills',
          form.skills.trim()
        );
      }

      if (form.address.trim()) {
        formData.append(
          'address',
          form.address.trim()
        );
      }

      if (form.notes.trim()) {
        formData.append(
          'notes',
          form.notes.trim()
        );
      }

      /*
       * Profile photo
       */

      if (form.profile_photo) {
        formData.append(
          'profile_photo',
          form.profile_photo
        );
      }

      /* ===================================================
         UPDATE
      =================================================== */

      if (editingStaff) {
        await pb
          .collection('staff')
          .update(
            editingStaff.id,
            formData
          );

        alert(
          'Staff member updated successfully.'
        );
      }

      /* ===================================================
         CREATE
      =================================================== */

      else {
        await pb
          .collection('staff')
          .create(
            formData
          );

        alert(
          'Staff member added successfully.'
        );
      }

      setShowForm(false);

      setEditingStaff(null);

      setForm(emptyForm);

      await loadStaff();
    } catch (error: any) {
      console.error(
        'Failed to save staff:',
        error
      );

      alert(
        `Failed to save staff.\n\n${getErrorMessage(
          error
        )}`
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE STAFF
  ======================================================= */

  const deleteStaff = async (
    person: Staff
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${person.full_name}?\n\nThis deletes the staff profile only. It does NOT delete the login account.`
      );

    if (!confirmed) return;

    try {
      await pb
        .collection('staff')
        .delete(person.id);

      alert(
        'Staff member deleted successfully.'
      );

      setSelectedStaff(null);

      setShowDetails(false);

      await loadStaff();
    } catch (error: any) {
      console.error(
        'Failed to delete staff:',
        error
      );

      alert(
        `Failed to delete staff.\n\n${getErrorMessage(
          error
        )}`
      );
    }
  };

  /* =======================================================
     TOGGLE ACTIVE
  ======================================================= */

  const toggleActive = async (
    person: Staff
  ) => {
    try {
      await pb
        .collection('staff')
        .update(person.id, {
          is_active:
            !person.is_active,
        });

      await loadStaff();

      if (
        selectedStaff?.id === person.id
      ) {
        setSelectedStaff({
          ...person,
          is_active:
            !person.is_active,
        });
      }
    } catch (error: any) {
      console.error(
        'Failed to update status:',
        error
      );

      alert(
        `Failed to update status.\n\n${getErrorMessage(
          error
        )}`
      );
    }
  };

  /* =======================================================
     PHOTO CHANGE
  ======================================================= */

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      handleFormChange(
        'profile_photo',
        null
      );

      return;
    }

    if (
      !file.type.startsWith(
        'image/'
      )
    ) {
      alert(
        'Please select an image file.'
      );

      event.target.value = '';

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        'Profile photo must be smaller than 5 MB.'
      );

      event.target.value = '';

      return;
    }

    handleFormChange(
      'profile_photo',
      file
    );
  };

  /* =======================================================
     CLOSE FORM
  ======================================================= */

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);

    setEditingStaff(null);

    setForm(emptyForm);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Staff Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage SRL INFRA DEVELOPERS
              employees and staff profiles.
            </p>
          </div>

          <div className="flex gap-2">

            <button
              type="button"
              onClick={loadStaff}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              {loading
                ? 'Refreshing...'
                : 'Refresh'}
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              + Add Staff
            </button>

          </div>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">

          <StatCard
            title="Total Staff"
            value={stats.total}
          />

          <StatCard
            title="Active"
            value={stats.active}
          />

          <StatCard
            title="Inactive"
            value={stats.inactive}
          />

          <StatCard
            title="Managers"
            value={stats.managers}
          />

          <StatCard
            title="Admins"
            value={stats.admins}
          />

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

          <div className="grid gap-3 md:grid-cols-4">

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search staff..."
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            />

            <select
              value={departmentFilter}
              onChange={(event) =>
                setDepartmentFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none"
            >
              <option value="ALL">
                All Departments
              </option>

              {DEPARTMENTS.map(
                (department) => (
                  <option
                    key={department}
                    value={department}
                  >
                    {department}
                  </option>
                )
              )}
            </select>

            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none"
            >
              <option value="ALL">
                All Roles
              </option>

              {ROLES.map((role) => (
                <option
                  key={role}
                  value={role}
                >
                  {role}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none"
            >
              <option value="ALL">
                All Status
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>

          </div>
        </div>

        {/* =================================================
            STAFF TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Loading staff...
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="p-12 text-center">

              <div className="mb-3 text-4xl">
                👥
              </div>

              <h3 className="font-semibold text-slate-900">
                No staff found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a staff member or change
                your filters.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left">

                <thead className="border-b border-slate-200 bg-slate-50">

                  <tr>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Staff
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Department
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Role
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Joining
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredStaff.map(
                    (person) => (
                      <tr
                        key={person.id}
                        className="hover:bg-slate-50"
                      >

                        {/* STAFF */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-sm font-bold text-white">

                              {person.profile_photo ? (
                                <img
                                  src={pb.files.getURL(
                                    person,
                                    person.profile_photo
                                  )}
                                  alt={
                                    person.full_name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                getInitials(
                                  person.full_name
                                )
                              )}

                            </div>

                            <div>
                              <div className="font-semibold text-slate-900">
                                {person.full_name}
                              </div>

                              <div className="text-xs text-slate-500">
                                {
                                  person.staff_code
                                }
                              </div>

                              <div className="text-xs text-slate-400">
                                {
                                  person.Designation
                                }
                              </div>
                            </div>

                          </div>

                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-5 py-4">

                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {
                              person.Department
                            }
                          </span>

                        </td>

                        {/* ROLE */}

                        <td className="px-5 py-4">

                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              person.Role ===
                              'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : person.Role ===
                                  'MANAGER'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {person.Role}
                          </span>

                        </td>

                        {/* CONTACT */}

                        <td className="px-5 py-4">

                          <div className="text-sm text-slate-700">
                            {person.phone}
                          </div>

                          <div className="max-w-[220px] truncate text-xs text-slate-400">
                            {person.email}
                          </div>

                        </td>

                        {/* JOINING */}

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatDate(
                            person.joining_date
                          )}
                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              toggleActive(
                                person
                              )
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              person.is_active
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {person.is_active
                              ? 'ACTIVE'
                              : 'INACTIVE'}
                          </button>

                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">

                          <div className="flex justify-end gap-2">

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStaff(
                                  person
                                );
                                setShowDetails(
                                  true
                                );
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openEditForm(
                                  person
                                )
                              }
                              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
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

      {/* =====================================================
          ADD / EDIT MODAL
      ===================================================== */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingStaff
                    ? 'Edit Staff'
                    : 'Add Staff'}
                </h2>

                <p className="text-sm text-slate-500">
                  Staff login and employee
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={saveStaff}
              className="space-y-6 p-6"
            >

              {/* LOGIN ACCOUNT */}

              <section>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Login Account
                </h3>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    PocketBase Login Account *
                  </label>

                  <select
                    value={form.user}
                    onChange={(event) =>
                      handleUserChange(
                        event.target.value
                      )
                    }
                    disabled={
                      loadingUsers ||
                      saving
                    }
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  >

                    <option value="">
                      {loadingUsers
                        ? 'Loading login accounts...'
                        : 'Select login account'}
                    </option>

                    {users.map((user) => {

                      const alreadyAssigned =
                        staff.some(
                          (person) =>
                            person.user ===
                              user.id &&
                            person.id !==
                              editingStaff?.id
                        );

                      return (
                        <option
                          key={user.id}
                          value={user.id}
                          disabled={
                            alreadyAssigned
                          }
                        >
                          {user.name
                            ? `${user.name} — ${user.email}${
                                alreadyAssigned
                                  ? ' — Already assigned'
                                  : ''
                              }`
                            : `${user.email}${
                                alreadyAssigned
                                  ? ' — Already assigned'
                                  : ''
                              }`}
                        </option>
                      );
                    })}

                  </select>

                  <p className="mt-2 text-xs text-blue-700">
                    The selected PocketBase
                    account will be linked to
                    this staff profile.
                  </p>

                  {!loadingUsers &&
                    users.length === 0 && (
                      <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
                        No login accounts are
                        available. Check the
                        PocketBase users collection
                        List/View API rules.
                      </p>
                    )}

                </div>

              </section>

              {/* BASIC INFORMATION */}

              <section>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <Input
                    label="Staff Code"
                    value={form.staff_code}
                    onChange={(value) =>
                      handleFormChange(
                        'staff_code',
                        value
                      )
                    }
                    required
                  />

                  <Input
                    label="Full Name"
                    value={form.full_name}
                    onChange={(value) =>
                      handleFormChange(
                        'full_name',
                        value
                      )
                    }
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      handleFormChange(
                        'email',
                        value
                      )
                    }
                    required
                  />

                  <Input
                    label="Phone"
                    value={form.phone}
                    onChange={(value) =>
                      handleFormChange(
                        'phone',
                        value
                      )
                    }
                    required
                  />

                  <Input
                    label="Designation"
                    value={form.Designation}
                    onChange={(value) =>
                      handleFormChange(
                        'Designation',
                        value
                      )
                    }
                    required
                  />

                  <Input
                    label="Joining Date"
                    type="date"
                    value={
                      form.joining_date
                    }
                    onChange={(value) =>
                      handleFormChange(
                        'joining_date',
                        value
                      )
                    }
                  />

                </div>

              </section>

              {/* ROLE */}

              <section>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Organization
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <SelectInput
                    label="Role"
                    value={form.Role}
                    onChange={(value) =>
                      handleFormChange(
                        'Role',
                        value as StaffForm['Role']
                      )
                    }
                    options={
                      ROLES as unknown as string[]
                    }
                  />

                  <SelectInput
                    label="Department"
                    value={
                      form.Department
                    }
                    onChange={(value) =>
                      handleFormChange(
                        'Department',
                        value as StaffForm['Department']
                      )
                    }
                    options={
                      DEPARTMENTS as unknown as string[]
                    }
                  />

                  <SelectInput
                    label="Employment Type"
                    value={
                      form.employment_type
                    }
                    onChange={(value) =>
                      handleFormChange(
                        'employment_type',
                        value as StaffForm['employment_type']
                      )
                    }
                    options={
                      EMPLOYMENT_TYPES as unknown as string[]
                    }
                  />

                </div>

              </section>

              {/* SKILLS */}

              <section>

                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Additional Information
                </h3>

                <div className="space-y-4">

                  <Textarea
                    label="Skills"
                    value={form.skills}
                    onChange={(value) =>
                      handleFormChange(
                        'skills',
                        value
                      )
                    }
                    placeholder="Example: AutoCAD, Interior Design, Sales, IoT Automation..."
                  />

                  <Textarea
                    label="Address"
                    value={form.address}
                    onChange={(value) =>
                      handleFormChange(
                        'address',
                        value
                      )
                    }
                  />

                  <Textarea
                    label="Notes"
                    value={form.notes}
                    onChange={(value) =>
                      handleFormChange(
                        'notes',
                        value
                      )
                    }
                  />

                </div>

              </section>

              {/* PROFILE PHOTO */}

              <section>

                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Profile Photo
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handlePhotoChange
                  }
                  disabled={saving}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm"
                />

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WEBP. Maximum
                  5 MB.
                </p>

              </section>

              {/* ACTIVE */}

              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                <label className="flex cursor-pointer items-center gap-3">

                  <input
                    type="checkbox"
                    checked={
                      form.is_active
                    }
                    onChange={(event) =>
                      handleFormChange(
                        'is_active',
                        event.target.checked
                      )
                    }
                    disabled={saving}
                    className="h-4 w-4 rounded"
                  />

                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      Active Staff Member
                    </div>

                    <div className="text-xs text-slate-500">
                      Inactive staff will remain
                      in the system but can be
                      excluded from active
                      operations.
                    </div>
                  </div>

                </label>

              </section>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    loadingUsers ||
                    users.length === 0
                  }
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Saving...'
                    : editingStaff
                    ? 'Update Staff'
                    : 'Add Staff'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          DETAILS MODAL
      ===================================================== */}

      {showDetails &&
        selectedStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-lg font-bold text-white">

                    {selectedStaff.profile_photo ? (
                      <img
                        src={pb.files.getURL(
                          selectedStaff,
                          selectedStaff.profile_photo
                        )}
                        alt={
                          selectedStaff.full_name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getInitials(
                        selectedStaff.full_name
                      )
                    )}

                  </div>

                  <div>

                    <h2 className="text-xl font-bold text-slate-900">
                      {
                        selectedStaff.full_name
                      }
                    </h2>

                    <p className="text-sm text-slate-500">
                      {
                        selectedStaff.Designation
                      }
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(
                      false
                    )
                  }
                  className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>

              </div>

              {/* DETAILS */}

              <div className="grid gap-4 p-6 md:grid-cols-2">

                <Detail
                  label="Staff Code"
                  value={
                    selectedStaff.staff_code
                  }
                />

                <Detail
                  label="Role"
                  value={
                    selectedStaff.Role
                  }
                />

                <Detail
                  label="Department"
                  value={
                    selectedStaff.Department
                  }
                />

                <Detail
                  label="Employment Type"
                  value={
                    selectedStaff.employment_type
                  }
                />

                <Detail
                  label="Email"
                  value={
                    selectedStaff.email
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    selectedStaff.phone
                  }
                />

                <Detail
                  label="Joining Date"
                  value={formatDate(
                    selectedStaff.joining_date
                  )}
                />

                <Detail
                  label="Status"
                  value={
                    selectedStaff.is_active
                      ? 'ACTIVE'
                      : 'INACTIVE'
                  }
                />

                <div className="md:col-span-2">
                  <Detail
                    label="Skills"
                    value={
                      selectedStaff.skills ||
                      '—'
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Detail
                    label="Address"
                    value={
                      selectedStaff.address ||
                      '—'
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <Detail
                    label="Notes"
                    value={
                      selectedStaff.notes ||
                      '—'
                    }
                  />
                </div>

              </div>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-6 sm:flex-row sm:justify-between">

                <button
                  type="button"
                  onClick={() =>
                    deleteStaff(
                      selectedStaff
                    )
                  }
                  className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete Staff
                </button>

                <div className="flex gap-3">

                  <button
                    type="button"
                    onClick={() => {
                      setShowDetails(
                        false
                      );

                      openEditForm(
                        selectedStaff
                      );
                    }}
                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Edit Staff
                  </button>

                </div>

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      >
        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </label>

      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        rows={3}
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="break-words text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}