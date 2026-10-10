
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Staff = {
  id: string;
  user_id?: string;
  full_name: string;
  email?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
};

type Project = {
  id: number;
  project_name?: string;
  project_code?: string;
};

type Client = {
  id: string;
  name?: string;
  client_name?: string;
  company?: string;
  company_name?: string;
  full_name?: string;
};

type TaskStatus =
  | 'TODO'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type Task = {
  id: number;
  task_code: string | null;
  title: string;
  description: string | null;
  assigned_to: string | null;
  department: string | null;
  project_id: number | null;
  client_id: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'ON_HOLD', label: 'On Hold' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PRIORITIES: TaskPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const DEPARTMENTS = [
  'TELECALLING',
  'SALES',
  'INTERIOR DESIGN',
  'AUTOMATION',
  'ELEVATORS',
  'PROJECT MANAGEMENT',
  'ACCOUNTS',
  'HR',
  'MARKETING',
  'OPERATIONS',
  'OTHER',
];

const EMPTY_FORM = {
  title: '',
  description: '',
  assigned_to: '',
  department: '',
  project_id: '',
  client_id: '',
  due_date: '',
  priority: 'MEDIUM' as TaskPriority,
  status: 'TODO' as TaskStatus,
  progress: 0,
};

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

const cardClass =
  'rounded-xl border border-slate-200 bg-white p-4 shadow-sm';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  ) {
    return String(error.message);
  }

  return 'An unexpected error occurred.';
}

function displayClient(client?: Client): string {
  if (!client) return 'Unknown client';

  return (
    client.company_name ||
    client.company ||
    client.client_name ||
    client.name ||
    client.full_name ||
    `Client #${client.id}`
  );
}

function formatDate(value?: string | null): string {
  if (!value) return 'Not set';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isOverdue(task: Task): boolean {
  if (
    !task.due_date ||
    task.status === 'COMPLETED' ||
    task.status === 'CANCELLED'
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${task.due_date}T00:00:00`);

  return dueDate < today;
}

function statusLabel(status: TaskStatus): string {
  return STATUSES.find((item) => item.value === status)?.label || status;
}

function priorityClass(priority: TaskPriority): string {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-700';
    case 'HIGH':
      return 'bg-orange-100 text-orange-700';
    case 'MEDIUM':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const role = currentStaff?.role?.toUpperCase();

  const isAdmin = role === 'ADMIN';
  const canManageTasks = role === 'ADMIN';

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error('Please sign in to access Tasks.');

      const { data: profile, error: profileError } = await supabase
        .from('staff')
        .select(
          'id,user_id,full_name,email,role,department,is_active',
        )
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        throw new Error(
          'Active staff profile not found. Check that staff.user_id matches your Supabase Auth user ID.',
        );
      }

      setCurrentStaff(profile as Staff);

      const [
        tasksResult,
        staffResult,
        projectsResult,
        clientsResult,
      ] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('staff')
          .select('id,user_id,full_name,email,role,department,is_active')
          .eq('is_active', true)
          .order('full_name'),

        supabase
          .from('projects')
          .select('id,project_name,project_code')
          .order('id', { ascending: false }),

        supabase.from('clients').select('*').order('id', { ascending: false }),
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (staffResult.error) throw staffResult.error;
      if (projectsResult.error) throw projectsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      const allTasks = (tasksResult.data || []) as Task[];

      // UI filtering is not a replacement for Supabase RLS.
      setTasks(
        profile.role?.toUpperCase() === 'ADMIN'
          ? allTasks
          : allTasks.filter(
              (task) => task.assigned_to === profile.id,
            ),
      );

      setStaff((staffResult.data || []) as Staff[]);
      setProjects((projectsResult.data || []) as Project[]);
      setClients((clientsResult.data || []) as Client[]);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.task_code || '').toLowerCase().includes(query) ||
        (task.description || '').toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === 'ALL' || task.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'ALL' || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((task) => task.status === 'TODO').length,
      inProgress: tasks.filter(
        (task) => task.status === 'IN_PROGRESS',
      ).length,
      completed: tasks.filter(
        (task) => task.status === 'COMPLETED',
      ).length,
      overdue: tasks.filter(isOverdue).length,
    }),
    [tasks],
  );

  function getStaffName(id: string | null): string {
    if (!id) return 'Unassigned';

    return (
      staff.find((person) => person.id === id)?.full_name ||
      'Unknown staff'
    );
  }

  function getProjectName(id: number | null): string {
    if (id === null) return 'No project';

    return (
      projects.find((project) => project.id === id)?.project_name ||
      `Project #${id}`
    );
  }

  function getClientName(id: string | null): string {
    if (!id) return 'No client';

    return displayClient(clients.find((client) => client.id === id));
  }

  function openCreateForm() {
    setEditingTask(null);
    setForm({
      ...EMPTY_FORM,
      department: currentStaff?.department || '',
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  }

  function openEditForm(task: Task) {
    setEditingTask(task);

    setForm({
      title: task.title,
      description: task.description || '',
      assigned_to: task.assigned_to || '',
      department: task.department || '',
      project_id:
        task.project_id !== null ? String(task.project_id) : '',
      client_id: task.client_id || '',
      due_date: task.due_date || '',
      priority: task.priority,
      status: task.status,
      progress: task.progress || 0,
    });

    setError('');
    setSuccess('');
    setShowForm(true);
  }

  async function saveTask(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!currentStaff) {
      setError('Staff profile not found. Please sign in again.');
      return;
    }

    if (!form.title.trim()) {
      setError('Task title is required.');
      return;
    }

    if (!canManageTasks && !editingTask) {
      setError('Only an admin can create tasks.');
      return;
    }

    if (
      !canManageTasks &&
      editingTask?.assigned_to !== currentStaff.id
    ) {
      setError('You can update only tasks assigned to you.');
      return;
    }

    if (
      canManageTasks &&
      form.assigned_to &&
      !staff.some((person) => person.id === form.assigned_to)
    ) {
      setError('Please select a valid active staff member.');
      return;
    }

    setSaving(true);

    try {
      const completed = form.status === 'COMPLETED';

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,

        assigned_to: canManageTasks
          ? form.assigned_to || null
          : currentStaff.id,

        department: canManageTasks
          ? form.department || null
          : currentStaff.department || null,

        // projects.id is expected to be BIGINT.
        project_id: form.project_id
          ? Number(form.project_id)
          : null,

        // clients.id is UUID: do not convert it to Number.
        client_id: form.client_id || null,

        due_date: form.due_date || null,
        priority: form.priority,
        status: form.status,
        progress: completed ? 100 : Number(form.progress),
      };

      if (editingTask) {
        let query = supabase
          .from('tasks')
          .update(payload)
          .eq('id', editingTask.id);

        if (!canManageTasks) {
          query = query.eq('assigned_to', currentStaff.id);
        }

        const { error: updateError } = await query;

        if (updateError) throw updateError;

        setSuccess('Task updated successfully.');
      } else {
        const taskCode = `TSK-${Date.now()}`;

        const { error: insertError } = await supabase
          .from('tasks')
          .insert({
            ...payload,
            task_code: taskCode,
            created_by: currentStaff.id,
          });

        if (insertError) throw insertError;

        setSuccess('Task created successfully.');
      }

      setShowForm(false);
      setEditingTask(null);

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function updateTaskStatus(
    task: Task,
    nextStatus: TaskStatus,
  ) {
    if (!currentStaff) return;

    if (
      !canManageTasks &&
      task.assigned_to !== currentStaff.id
    ) {
      setError('You can update only tasks assigned to you.');
      return;
    }

    setError('');
    setSuccess('');
    setUpdatingTaskId(task.id);

    try {
      const nextProgress =
        nextStatus === 'COMPLETED'
          ? 100
          : task.status === 'COMPLETED'
            ? 0
            : task.progress;

      let query = supabase
        .from('tasks')
        .update({
          status: nextStatus,
          progress: nextProgress,
        })
        .eq('id', task.id);

      if (!canManageTasks) {
        query = query.eq('assigned_to', currentStaff.id);
      }

      const { error: updateError } = await query;

      if (updateError) throw updateError;

      setSuccess('Task status updated successfully.');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUpdatingTaskId(null);
    }
  }

  async function deleteTask(task: Task) {
    if (!isAdmin) {
      setError('Only an admin can delete tasks.');
      return;
    }

    const confirmed = window.confirm(
      `Delete "${task.title}"? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);

      if (deleteError) throw deleteError;

      setSuccess('Task deleted successfully.');
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-blue-700" />
              <h1 className="text-2xl font-bold text-slate-900">
                Tasks
              </h1>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Assign, track and manage SRL Infra work.
            </p>

            {currentStaff && (
              <p className="mt-2 text-xs text-slate-500">
                Signed in as {currentStaff.full_name}
                {' · '}
                {currentStaff.department || 'No department'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            {canManageTasks && (
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                <Plus className="h-4 w-4" />
                Create Task
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{error}</span>

            <button
              type="button"
              className="ml-auto"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{success}</span>

            <button
              type="button"
              className="ml-auto"
              onClick={() => setSuccess('')}
              aria-label="Dismiss success"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {[
            {
              label: 'Total Tasks',
              value: stats.total,
              icon: ClipboardList,
            },
            {
              label: 'To Do',
              value: stats.todo,
              icon: Clock3,
            },
            {
              label: 'In Progress',
              value: stats.inProgress,
              icon: RefreshCw,
            },
            {
              label: 'Completed',
              value: stats.completed,
              icon: CheckCircle2,
            },
            {
              label: 'Overdue',
              value: stats.overdue,
              icon: AlertCircle,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className={cardClass}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {item.label}
                  </p>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>

                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {item.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filters and task list */}
        <section className={`${cardClass} space-y-4`}>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                className={`${inputClass} pl-9`}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, code or description..."
                aria-label="Search tasks"
              />
            </div>

            <select
              className={inputClass}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              className={inputClass}
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              aria-label="Filter by priority"
            >
              <option value="ALL">All priorities</option>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading tasks...
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="py-16 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-3 font-semibold text-slate-800">
                No tasks found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {canManageTasks
                  ? 'Create a task to get started.'
                  : 'Tasks assigned to you will appear here.'}
              </p>

              {canManageTasks && (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-4 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {visibleTasks.map((task) => (
                <article
                  key={task.id}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-400">
                        {task.task_code || `TASK-${task.id}`}
                      </p>

                      <h3 className="mt-1 break-words font-semibold text-slate-900">
                        {task.title}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.description && (
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {task.description}
                    </p>
                  )}

                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div className="flex items-start gap-2 text-slate-600">
                      <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">
                          Assigned to
                        </p>

                        <p className="break-words font-medium text-slate-800">
                          {getStaffName(task.assigned_to)}
                        </p>

                        {task.department && (
                          <p className="text-xs text-slate-500">
                            {task.department}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600">
                      <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-400">Due date</p>

                        <p
                          className={`font-medium ${
                            isOverdue(task)
                              ? 'text-red-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {formatDate(task.due_date)}
                          {isOverdue(task) && ' · Overdue'}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Project</p>
                      <p className="mt-1 break-words font-medium text-slate-800">
                        {getProjectName(task.project_id)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">Client</p>
                      <p className="mt-1 break-words font-medium text-slate-800">
                        {getClientName(task.client_id)}
                      </p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-medium text-slate-500">
                        Progress
                      </span>
                      <span className="font-semibold text-slate-700">
                        {task.progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all"
                        style={{
                          width: `${Math.max(0, Math.min(100, task.progress))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">Status</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {statusLabel(task.status)}
                      </p>
                    </div>

                    {!canManageTasks &&
                      task.assigned_to === currentStaff?.id && (
                        <select
                          className={`${inputClass} sm:max-w-44`}
                          value={task.status}
                          disabled={updatingTaskId === task.id}
                          onChange={(event) =>
                            void updateTaskStatus(
                              task,
                              event.target.value as TaskStatus,
                            )
                          }
                          aria-label={`Update status for ${task.title}`}
                        >
                          {STATUSES.map((status) => (
                            <option
                              key={status.value}
                              value={status.value}
                            >
                              {status.label}
                            </option>
                          ))}
                        </select>
                      )}

                    {canManageTasks && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(task)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => void deleteTask(task)}
                            className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}

                    {!canManageTasks &&
                      task.assigned_to === currentStaff?.id && (
                        <button
                          type="button"
                          onClick={() => openEditForm(task)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Update Task
                        </button>
                      )}
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && (
            <p className="text-xs text-slate-400">
              Showing {visibleTasks.length} of {tasks.length} tasks
            </p>
          )}
        </section>
      </div>

      {/* Create/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 sm:p-6">
          <div className="my-auto w-full max-w-2xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTask ? 'Update Task' : 'Create Task'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter the task details below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close task form"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={saveTask} className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Task title *
                </label>

                <input
                  className={inputClass}
                  required
                  maxLength={200}
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  placeholder="e.g. Prepare interior design quotation"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>

                <textarea
                  className={inputClass}
                  rows={3}
                  maxLength={5000}
                  value={form.description}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description: event.target.value,
                    })
                  }
                  placeholder="Describe the work to be completed..."
                />
              </div>

              {canManageTasks && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Assign staff
                    </label>

                    <select
                      className={inputClass}
                      value={form.assigned_to}
                      onChange={(event) => {
                        const selected = staff.find(
                          (person) => person.id === event.target.value,
                        );

                        setForm({
                          ...form,
                          assigned_to: event.target.value,
                          department:
                            selected?.department || form.department,
                        });
                      }}
                    >
                      <option value="">Unassigned</option>

                      {staff.map((person) => (
                        <option key={person.id} value={person.id}>
                          {person.full_name}
                          {' — '}
                          {person.department || 'No department'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Department
                    </label>

                    <select
                      className={inputClass}
                      value={form.department}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          department: event.target.value,
                        })
                      }
                    >
                      <option value="">Select department</option>

                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Project
                  </label>

                  <select
                    className={inputClass}
                    value={form.project_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        project_id: event.target.value,
                      })
                    }
                  >
                    <option value="">No project linked</option>

                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.project_code
                          ? `${project.project_code} — `
                          : ''}
                        {project.project_name ||
                          `Project #${project.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Client
                  </label>

                  <select
                    className={inputClass}
                    value={form.client_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        client_id: event.target.value,
                      })
                    }
                  >
                    <option value="">No client linked</option>

                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {displayClient(client)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Due date
                  </label>

                  <input
                    type="date"
                    className={inputClass}
                    value={form.due_date}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        due_date: event.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <select
                    className={inputClass}
                    value={form.priority}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        priority: event.target.value as TaskPriority,
                      })
                    }
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    className={inputClass}
                    value={form.status}
                    onChange={(event) => {
                      const status = event.target.value as TaskStatus;

                      setForm({
                        ...form,
                        status,
                        progress:
                          status === 'COMPLETED'
                            ? 100
                            : form.progress,
                      });
                    }}
                  >
                    {STATUSES.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Progress: {form.status === 'COMPLETED' ? 100 : form.progress}%
                  </label>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    disabled={form.status === 'COMPLETED'}
                    className="mt-3 w-full accent-blue-700"
                    value={
                      form.status === 'COMPLETED' ? 100 : form.progress
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        progress: Number(event.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingTask
                      ? 'Save Changes'
                      : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
