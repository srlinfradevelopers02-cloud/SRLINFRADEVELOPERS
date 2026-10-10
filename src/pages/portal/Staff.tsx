import React, {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';

import { supabase } from '../../lib/supabase';

type Role = 'ADMIN'| 'STAFF';

type Department =
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

type EmploymentType =
  | 'FULL TIME'
  | 'PART TIME'
  | 'CONTRACT';

type Staff = {
  id: string;
  user_id?: string | null;

  staff_code: string;
  full_name: string;
  email: string;
  phone: string;

  role: Role;
  department: Department;
  designation: string;

  joining_date?: string | null;
  employment_type: EmploymentType;

  skills?: string | null;
  profile_photo?: string | null;
  address?: string | null;
  notes?: string | null;

  is_active: boolean;

  created_at?: string;
  updated_at?: string;
};

type StaffForm = {
  user_id: string;
  staff_code: string;
  full_name: string;
  email: string;
  phone: string;

  role: Role;
  department: Department;
  designation: string;

  joining_date: string;
  employment_type: EmploymentType;

  skills: string;
  profile_photo: File | null;
  address: string;
  notes: string;

  is_active: boolean;
};

const DEPARTMENTS: Department[] = [
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
];

const ROLES: Role[] = [
  'ADMIN',
  'STAFF',
];

const EMPLOYMENT_TYPES: EmploymentType[] = [
  'FULL TIME',
  'PART TIME',
  'CONTRACT',
];

const emptyForm: StaffForm = {
  user_id: '',
  staff_code: '',
  full_name: '',
  email: '',
  phone: '',

  role: 'STAFF',
  department: 'TELECALLING',
  designation: '',

  joining_date: '',
  employment_type: 'FULL TIME',

  skills: '',
  profile_photo: null,
  address: '',
  notes: '',

  is_active: true,
};

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

  return `STF-${year}-${String(nextNumber).padStart(
    4,
    '0'
  )}`;
}

function formatDate(date?: string | null) {
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
  return (
    error?.message ||
    error?.error_description ||
    'Something went wrong.'
  );
}

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
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && (
          <span className="text-red-500"> *</span>
        )}
      </span>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

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
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        value={value}
        placeholder={placeholder}
        rows={4}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      <div className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words text-sm font-medium text-slate-800">
        {value || '—'}
      </div>
    </div>
  );
}

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [search, setSearch] =
    useState('');

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

  /*
   * ---------------------------------------------------------
   * LOAD STAFF
   * ---------------------------------------------------------
   */

  const loadStaff = async () => {
    try {
      setLoading(true);

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
          phone,
          role,
          department,
          designation,
          joining_date,
          employment_type,
          skills,
          profile_photo,
          address,
          notes,
          is_active,
          created_at,
          updated_at
        `)
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setStaff(
        (data || []) as Staff[]
      );
    } catch (error: any) {
      console.error(
        'Failed to load staff:',
        error
      );

      alert(
        `Failed to load staff.\n\n${getErrorMessage(
          error
        )}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  /*
   * ---------------------------------------------------------
   * FILTERED STAFF
   * ---------------------------------------------------------
   */

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
        person.designation
          ?.toLowerCase()
          .includes(query);

      const matchesDepartment =
        departmentFilter === 'ALL' ||
        person.department ===
          departmentFilter;

      const matchesRole =
        roleFilter === 'ALL' ||
        person.role === roleFilter;

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

  /*
   * ---------------------------------------------------------
   * STATISTICS
   * ---------------------------------------------------------
   */

  const stats = useMemo(() => {
    const total = staff.length;

    const active = staff.filter(
      (person) => person.is_active
    ).length;

    const inactive = staff.filter(
      (person) => !person.is_active
    ).length;


    const admins = staff.filter(
      (person) =>
        person.role === 'ADMIN'
    ).length;

    return {
      total,
      active,
      inactive,
      admins,
    };
  }, [staff]);

  /*
   * ---------------------------------------------------------
   * OPEN ADD FORM
   * ---------------------------------------------------------
   */

  const openAddForm = () => {
    setEditingStaff(null);

    setForm({
      ...emptyForm,
      staff_code:
        generateStaffCode(staff),
    });

    setShowForm(true);
  };

  /*
   * ---------------------------------------------------------
   * OPEN EDIT FORM
   * ---------------------------------------------------------
   */

  const openEditForm = (
    person: Staff
  ) => {
    setEditingStaff(person);

    setForm({
      user_id:
        person.user_id || '',

      staff_code:
        person.staff_code || '',

      full_name:
        person.full_name || '',

      email:
        person.email || '',

      phone:
        person.phone || '',

      role:
        person.role || 'STAFF',

      department:
        person.department || 'OTHER',

      designation:
        person.designation || '',

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

      profile_photo: null,

      address:
        person.address || '',

      notes:
        person.notes || '',

      is_active:
        person.is_active ?? true,
    });

    setShowForm(true);
  };

  /*
   * ---------------------------------------------------------
   * FORM CHANGE
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * SAVE STAFF
   * ---------------------------------------------------------
   */

  const saveStaff = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (saving) return;

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

    if (!form.designation.trim()) {
      alert(
        'Please enter the designation.'
      );
      return;
    }

    /*
     * Prevent duplicate staff code.
     */

    const duplicateCode =
      staff.find(
        (person) =>
          person.staff_code
            ?.toLowerCase() ===
            form.staff_code
              .trim()
              .toLowerCase() &&
          person.id !==
            editingStaff?.id
      );

    if (duplicateCode) {
      alert(
        'This staff code is already assigned.'
      );
      return;
    }

    /*
     * Prevent duplicate login user
     * when user_id is provided.
     */

    if (form.user_id.trim()) {
      const duplicateUser =
        staff.find(
          (person) =>
            person.user_id ===
              form.user_id.trim() &&
            person.id !==
              editingStaff?.id
        );

      if (duplicateUser) {
        alert(
          `This login account is already linked to ${duplicateUser.full_name}.`
        );
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        user_id:
          form.user_id.trim() ||
          null,

        staff_code:
          form.staff_code.trim(),

        full_name:
          form.full_name.trim(),

        email:
          form.email.trim(),

        phone:
          form.phone.trim(),

        role:
          form.role,

        department:
          form.department,

        designation:
          form.designation.trim(),

        joining_date:
          form.joining_date ||
          null,

        employment_type:
          form.employment_type,

        skills:
          form.skills.trim() ||
          null,

        address:
          form.address.trim() ||
          null,

        notes:
          form.notes.trim() ||
          null,

        is_active:
          form.is_active,
      };

      if (editingStaff) {
        const {
          data,
          error,
        } = await supabase
          .from('staff')
          .update(payload)
          .eq(
            'id',
            editingStaff.id
          )
          .select()
          .single();

        if (error) {
          throw error;
        }

        setStaff((previous) =>
          previous.map((person) =>
            person.id ===
            editingStaff.id
              ? (data as Staff)
              : person
          )
        );

        setSelectedStaff(
          data as Staff
        );

        alert(
          'Staff member updated successfully.'
        );
      } else {
        const {
          data,
          error,
        } = await supabase
          .from('staff')
          .insert(payload)
          .select()
          .single();

        if (error) {
          throw error;
        }

        setStaff((previous) => [
          data as Staff,
          ...previous,
        ]);

        alert(
          'Staff member added successfully.'
        );
      }

      setShowForm(false);
      setEditingStaff(null);
      setForm(emptyForm);
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

  /*
   * ---------------------------------------------------------
   * DELETE STAFF
   * ---------------------------------------------------------
   */

  const deleteStaff = async (
    person: Staff
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${person.full_name}?\n\nThis deletes the staff profile only. It does NOT delete the Supabase login account.`
      );

    if (!confirmed) return;

    try {
      const {
        error,
      } = await supabase
        .from('staff')
        .delete()
        .eq('id', person.id);

      if (error) {
        throw error;
      }

      setStaff((previous) =>
        previous.filter(
          (item) =>
            item.id !== person.id
        )
      );

      setSelectedStaff(null);
      setShowDetails(false);

      alert(
        'Staff member deleted successfully.'
      );
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

  /*
   * ---------------------------------------------------------
   * ACTIVATE / DEACTIVATE
   * ---------------------------------------------------------
   */

  const toggleActive = async (
    person: Staff
  ) => {
    try {
      const newStatus =
        !person.is_active;

      const {
        data,
        error,
      } = await supabase
        .from('staff')
        .update({
          is_active: newStatus,
        })
        .eq('id', person.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setStaff((previous) =>
        previous.map((item) =>
          item.id === person.id
            ? (data as Staff)
            : item
        )
      );

      if (
        selectedStaff?.id ===
        person.id
      ) {
        setSelectedStaff(
          data as Staff
        );
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

  /*
   * ---------------------------------------------------------
   * PROFILE PHOTO
   *
   * Supabase Storage will be connected
   * after the Staff CRUD is verified.
   * ---------------------------------------------------------
   */

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

  /*
   * ---------------------------------------------------------
   * CLOSE FORM
   * ---------------------------------------------------------
   */

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingStaff(null);
    setForm(emptyForm);
  };

  /*
   * ---------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------
   */

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              SRL INFRA DEVELOPERS
            </p>

            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Staff Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage employees and staff profiles.
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

        {/* STATISTICS */}

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
            title="Admins"
            value={stats.admins}
          />
        </div>

        {/* FILTERS */}

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

        {/* STAFF TABLE */}

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
                Add a staff member or change your filters.
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
                              {getInitials(
                                person.full_name
                              )}
                            </div>

                            <div>
                              <div className="font-semibold text-slate-900">
                                {person.full_name}
                              </div>

                              <div className="text-xs text-slate-500">
                                {person.staff_code}
                              </div>

                              <div className="text-xs text-slate-400">
                                {person.designation}
                              </div>
                            </div>

                          </div>
                        </td>

                        {/* DEPARTMENT */}

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            {person.department}
                          </span>
                        </td>

                        {/* ROLE */}

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                              person.role ===
                              'ADMIN'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-600' 
                            }`}
                          >
                            {person.role}
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

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {editingStaff
                    ? 'Edit Staff'
                    : 'Add Staff'}
                </h2>

                <p className="text-sm text-slate-500">
                  Employee information and organization details.
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

            <form
              onSubmit={saveStaff}
              className="space-y-6 p-6"
            >

              {/* AUTH LINK */}

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Login Account
                </h3>

                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">

                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Supabase Auth User ID
                  </label>

                  <input
                    type="text"
                    value={form.user_id}
                    onChange={(event) =>
                      handleFormChange(
                        'user_id',
                        event.target.value
                      )
                    }
                    placeholder="Optional — UUID of the Supabase Auth user"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                  />

                  <p className="mt-2 text-xs text-blue-700">
                    Leave this empty when creating an employee profile without a login account. The login account can be linked later.
                  </p>

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
                    value={form.designation}
                    onChange={(value) =>
                      handleFormChange(
                        'designation',
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

              {/* ORGANIZATION */}

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                  Organization
                </h3>

                <div className="grid gap-4 md:grid-cols-3">

                  <SelectInput
                    label="Role"
                    value={form.role}
                    options={
                      ROLES
                    }
                    onChange={(value) =>
                      handleFormChange(
                        'role',
                        value as Role
                      )
                    }
                  />

                  <SelectInput
                    label="Department"
                    value={
                      form.department
                    }
                    options={
                      DEPARTMENTS
                    }
                    onChange={(value) =>
                      handleFormChange(
                        'department',
                        value as Department
                      )
                    }
                  />

                  <SelectInput
                    label="Employment Type"
                    value={
                      form.employment_type
                    }
                    options={
                      EMPLOYMENT_TYPES
                    }
                    onChange={(value) =>
                      handleFormChange(
                        'employment_type',
                        value as EmploymentType
                      )
                    }
                  />

                </div>
              </section>

              {/* ADDITIONAL INFORMATION */}

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
                  JPG, PNG or WEBP. Maximum 5 MB. Storage upload will be connected after Staff CRUD verification.
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
                      Inactive staff remain in the system but can be excluded from active operations.
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
                  disabled={saving}
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

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-lg font-bold text-white">
                    {getInitials(
                      selectedStaff.full_name
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
                        selectedStaff.designation
                      }
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(false)
                  }
                  className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100"
                >
                  ×
                </button>

              </div>

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
                    selectedStaff.role
                  }
                />

                <Detail
                  label="Department"
                  value={
                    selectedStaff.department
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

                <Detail
                  label="Login Account"
                  value={
                    selectedStaff.user_id
                      ? 'Linked to Supabase Auth'
                      : 'Not linked'
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

              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">

                <button
                  type="button"
                  onClick={() =>
                    toggleActive(
                      selectedStaff
                    )
                  }
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                    selectedStaff.is_active
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  {selectedStaff.is_active
                    ? 'Deactivate'
                    : 'Activate'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    openEditForm(
                      selectedStaff
                    );
                  }}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    deleteStaff(
                      selectedStaff
                    )
                  }
                  className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>

              </div>

            </div>
          </div>
        )}

    </div>
  );
}