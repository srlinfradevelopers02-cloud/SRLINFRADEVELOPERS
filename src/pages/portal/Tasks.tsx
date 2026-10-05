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

type Project = {
  id: string;
  projectCode: string;
  projectName: string;
  client: string;
  projectType?: string;
  location?: string;
  status: string;
};

type Task = {
  id: string;

  taskCode: string;
  taskName: string;

  project: string;

  assignedTo?: string;

  priority: string;
  status: string;

  startDate?: string;
  dueDate?: string;
  completionDate?: string;

  description?: string;
  notes?: string;

  created: string;
  updated: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const PRIORITIES = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
];

const STATUSES = [
  'TODO',
  'IN PROGRESS',
  'REVIEW',
  'COMPLETED',
  'CANCELLED',
];

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const dateForInput = (value?: string) => {
  if (!value) return '';

  return value.slice(0, 10);
};

const todayISO = () =>
  new Date().toISOString().slice(0, 10);

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Tasks() {
  const navigate = useNavigate();

  /* =======================================================
     DATA
  ======================================================= */

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [priorityFilter, setPriorityFilter] =
    useState('ALL');

  const [projectFilter, setProjectFilter] =
    useState('ALL');

  const [showForm, setShowForm] =
    useState(false);

  const [showDetails, setShowDetails] =
    useState(false);

  const [editingTask, setEditingTask] =
    useState<Task | null>(null);

  const [selectedTask, setSelectedTask] =
    useState<Task | null>(null);

  /* =======================================================
     FORM
  ======================================================= */

  const emptyForm = {
    taskName: '',
    project: '',
    assignedTo: '',
    priority: 'MEDIUM',
    status: 'TODO',
    startDate: '',
    dueDate: '',
    completionDate: '',
    description: '',
    notes: '',
  };

  const [form, setForm] =
    useState(emptyForm);

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [taskResult, projectResult] =
        await Promise.all([
          pb
            .collection('tasks')
            .getFullList<Task>({
              sort: '-created',
            }),

          pb
            .collection('projects')
            .getFullList<Project>({
              sort: '-created',
            }),
        ]);

      setTasks(taskResult);
      setProjects(projectResult);
    } catch (error: any) {
      console.error(
        'Failed to load tasks:',
        error
      );

      alert(
        `Failed to load tasks.\n\n${
          error?.message ||
          'Unknown error'
        }`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* =======================================================
     LOOKUP PROJECT
  ======================================================= */

  const getProject = useCallback(
    (projectId?: string) => {
      return projects.find(
        (project) =>
          project.id === projectId
      );
    },
    [projects]
  );

  /* =======================================================
     GENERATE TASK CODE
  ======================================================= */

  const generateTaskCode = useCallback(() => {
    const year = new Date().getFullYear();

    const numbers = tasks
      .map((task) => {
        const match =
          task.taskCode?.match(
            /TSK-\d{4}-(\d+)/
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

    return `TSK-${year}-${String(
      nextNumber
    ).padStart(4, '0')}`;
  }, [tasks]);

  /* =======================================================
     FILTER TASKS
  ======================================================= */

  const filteredTasks = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return tasks.filter((task) => {
      const project = getProject(
        task.project
      );

      const searchableText = [
        task.taskCode,
        task.taskName,
        task.assignedTo,
        task.priority,
        task.status,
        task.description,
        project?.projectCode,
        project?.projectName,
        project?.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query ||
        searchableText.includes(query);

      const matchesStatus =
        statusFilter === 'ALL' ||
        task.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'ALL' ||
        task.priority ===
          priorityFilter;

      const matchesProject =
        projectFilter === 'ALL' ||
        task.project === projectFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesProject
      );
    });
  }, [
    tasks,
    search,
    statusFilter,
    priorityFilter,
    projectFilter,
    getProject,
  ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {
    const total = tasks.length;

    const todo = tasks.filter(
      (task) =>
        task.status === 'TODO'
    ).length;

    const inProgress = tasks.filter(
      (task) =>
        task.status === 'IN PROGRESS'
    ).length;

    const review = tasks.filter(
      (task) =>
        task.status === 'REVIEW'
    ).length;

    const completed = tasks.filter(
      (task) =>
        task.status === 'COMPLETED'
    ).length;

    const urgent = tasks.filter(
      (task) =>
        task.priority === 'URGENT'
    ).length;

    return {
      total,
      todo,
      inProgress,
      review,
      completed,
      urgent,
    };
  }, [tasks]);

  /* =======================================================
     OVERDUE
  ======================================================= */

  const isOverdue = (task: Task) => {
    if (
      !task.dueDate ||
      task.status === 'COMPLETED' ||
      task.status === 'CANCELLED'
    ) {
      return false;
    }

    const due = new Date(
      task.dueDate
    );

    const today = new Date();

    due.setHours(23, 59, 59, 999);

    return due < today;
  };

  /* =======================================================
     OPEN ADD FORM
  ======================================================= */

  const openAddForm = () => {
    setEditingTask(null);

    setForm({
      ...emptyForm,
      startDate: todayISO(),
    });

    setShowForm(true);
  };

  /* =======================================================
     OPEN EDIT FORM
  ======================================================= */

  const openEditForm = (
    task: Task
  ) => {
    setEditingTask(task);

    setForm({
      taskName:
        task.taskName || '',

      project:
        task.project || '',

      assignedTo:
        task.assignedTo || '',

      priority:
        task.priority || 'MEDIUM',

      status:
        task.status || 'TODO',

      startDate:
        dateForInput(
          task.startDate
        ),

      dueDate:
        dateForInput(
          task.dueDate
        ),

      completionDate:
        dateForInput(
          task.completionDate
        ),

      description:
        task.description || '',

      notes:
        task.notes || '',
    });

    setShowForm(true);
  };

  /* =======================================================
     SAVE TASK
  ======================================================= */

  const saveTask = async () => {
    if (!form.taskName.trim()) {
      alert(
        'Please enter the task name.'
      );
      return;
    }

    if (!form.project) {
      alert(
        'Please select a project.'
      );
      return;
    }

    if (!form.priority) {
      alert(
        'Please select a priority.'
      );
      return;
    }

    if (!form.status) {
      alert(
        'Please select a status.'
      );
      return;
    }

    try {
      setSaving(true);

      let completionDate =
        form.completionDate;

      /*
       Automatically set completion date
       when task becomes COMPLETED.
      */

      if (
        form.status ===
          'COMPLETED' &&
        !completionDate
      ) {
        completionDate =
          todayISO();
      }

      /*
       Clear completion date when
       task is moved away from COMPLETED.
      */

      if (
        form.status !==
          'COMPLETED'
      ) {
        completionDate = '';
      }

      const payload = {
        taskCode:
          editingTask?.taskCode ||
          generateTaskCode(),

        taskName:
          form.taskName.trim(),

        project:
          form.project,

        assignedTo:
          form.assignedTo.trim(),

        priority:
          form.priority,

        status:
          form.status,

        startDate:
          form.startDate
            ? `${form.startDate} 00:00:00`
            : '',

        dueDate:
          form.dueDate
            ? `${form.dueDate} 00:00:00`
            : '',

        completionDate:
          completionDate
            ? `${completionDate} 00:00:00`
            : '',

        description:
          form.description.trim(),

        notes:
          form.notes.trim(),
      };

      if (editingTask) {
        const updated =
          await pb
            .collection('tasks')
            .update<Task>(
              editingTask.id,
              payload
            );

        setTasks((previous) =>
          previous.map((task) =>
            task.id === updated.id
              ? updated
              : task
          )
        );

        setSelectedTask(updated);

        alert(
          'Task updated successfully.'
        );
      } else {
        const created =
          await pb
            .collection('tasks')
            .create<Task>(
              payload
            );

        setTasks((previous) => [
          created,
          ...previous,
        ]);

        setSelectedTask(created);

        alert(
          `Task ${created.taskCode} created successfully.`
        );
      }

      setShowForm(false);
    } catch (error: any) {
      console.error(
        'Task save failed:',
        error
      );

      console.error(
        'Original error:',
        error?.originalError
      );

      console.error(
        'Error data:',
        error?.data
      );

      console.error(
        'Response:',
        error?.response
      );

      const validationErrors =
        error?.data?.data
          ? Object.entries(
              error.data.data
            )
              .map(
                ([
                  field,
                  details,
                ]: [
                  string,
                  any
                ]) =>
                  `${field}: ${
                    details?.message ||
                    'Invalid value'
                  }`
              )
              .join('\n')
          : error?.message;

      alert(
        `Failed to save task.\n\n${
          validationErrors ||
          'Unknown error'
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     DELETE TASK
  ======================================================= */

  const deleteTask = async (
    task: Task
  ) => {
    const confirmed =
      window.confirm(
        `Delete ${task.taskCode}?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      await pb
        .collection('tasks')
        .delete(task.id);

      setTasks((previous) =>
        previous.filter(
          (item) =>
            item.id !== task.id
        )
      );

      setSelectedTask(null);
      setShowDetails(false);

      alert(
        'Task deleted successfully.'
      );
    } catch (error: any) {
      console.error(
        'Task deletion failed:',
        error
      );

      alert(
        `Failed to delete task.\n\n${
          error?.message ||
          'Unknown error'
        }`
      );
    }
  };

  /* =======================================================
     QUICK STATUS UPDATE
  ======================================================= */

  const updateTaskStatus =
    async (
      task: Task,
      status: string
    ) => {
      try {
        const updateData: any = {
          status,
        };

        if (
          status ===
          'COMPLETED'
        ) {
          updateData.completionDate =
            `${todayISO()} 00:00:00`;
        } else {
          updateData.completionDate =
            '';
        }

        const updated =
          await pb
            .collection('tasks')
            .update<Task>(
              task.id,
              updateData
            );

        setTasks((previous) =>
          previous.map((item) =>
            item.id === updated.id
              ? updated
              : item
          )
        );

        setSelectedTask(updated);
      } catch (error: any) {
        console.error(
          'Task status update failed:',
          error
        );

        alert(
          `Failed to update task status.\n\n${
            error?.message ||
            'Unknown error'
          }`
        );
      }
    };

  /* =======================================================
     OPEN TASK
  ======================================================= */

  const openTask = (
    task: Task
  ) => {
    setSelectedTask(task);
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
              Tasks
            </h1>

            <p className="text-gray-500 mt-1">
              Manage project tasks, assignments and deadlines.
            </p>

          </div>

          <div className="flex gap-3">

            <button
              onClick={loadData}
              disabled={loading}
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
              + New Task
            </button>

          </div>

        </div>

        {/* =================================================
            STATS
        ================================================= */}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-7">

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Total
            </p>

            <p className="text-2xl font-bold mt-2">
              {stats.total}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              To Do
            </p>

            <p className="text-2xl font-bold mt-2 text-gray-700">
              {stats.todo}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              In Progress
            </p>

            <p className="text-2xl font-bold mt-2 text-blue-600">
              {stats.inProgress}
            </p>

          </div>

          <div className="bg-white rounded-xl border p-5">

            <p className="text-sm text-gray-500">
              Review
            </p>

            <p className="text-2xl font-bold mt-2 text-purple-600">
              {stats.review}
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
              Urgent
            </p>

            <p className="text-2xl font-bold mt-2 text-red-600">
              {stats.urgent}
            </p>

          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="bg-white border rounded-xl p-4 mb-6">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search task, project, staff..."
              className="border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#c5832b]"
            />

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Status
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
              value={
                priorityFilter
              }
              onChange={(event) =>
                setPriorityFilter(
                  event.target.value
                )
              }
              className="border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Priority
              </option>

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

            <select
              value={
                projectFilter
              }
              onChange={(event) =>
                setProjectFilter(
                  event.target.value
                )
              }
              className="border rounded-lg px-4 py-3"
            >

              <option value="ALL">
                All Projects
              </option>

              {projects.map(
                (project) => (
                  <option
                    key={project.id}
                    value={project.id}
                  >
                    {project.projectCode} —{' '}
                    {project.projectName}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

        {/* =================================================
            TASK TABLE
        ================================================= */}

        <div className="bg-white border rounded-xl overflow-hidden">

          {loading ? (

            <div className="p-10 text-center text-gray-500">
              Loading tasks...
            </div>

          ) : filteredTasks.length ===
            0 ? (

            <div className="p-12 text-center">

              <div className="text-5xl mb-4">
                📋
              </div>

              <h3 className="font-semibold text-lg">
                No tasks found
              </h3>

              <p className="text-gray-500 mt-1">
                Create your first task to start managing project work.
              </p>

              <button
                onClick={
                  openAddForm
                }
                className="mt-5 px-5 py-3 rounded-lg bg-[#9a641f] text-white"
              >
                + Create Task
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-900 text-white">

                  <tr>

                    <th className="text-left px-5 py-4">
                      Task
                    </th>

                    <th className="text-left px-5 py-4">
                      Project
                    </th>

                    <th className="text-left px-5 py-4">
                      Assigned To
                    </th>

                    <th className="text-left px-5 py-4">
                      Priority
                    </th>

                    <th className="text-left px-5 py-4">
                      Status
                    </th>

                    <th className="text-left px-5 py-4">
                      Due Date
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredTasks.map(
                    (task) => {

                      const project =
                        getProject(
                          task.project
                        );

                      const overdue =
                        isOverdue(task);

                      return (
                        <tr
                          key={
                            task.id
                          }
                          onClick={() =>
                            openTask(
                              task
                            )
                          }
                          className="border-b hover:bg-gray-50 cursor-pointer"
                        >

                          <td className="px-5 py-4">

                            <p className="font-semibold text-[#9a641f]">
                              {
                                task.taskCode
                              }
                            </p>

                            <p className="font-medium text-gray-900">
                              {
                                task.taskName
                              }
                            </p>

                          </td>

                          <td className="px-5 py-4">

                            <p className="font-medium">
                              {
                                project?.projectCode ||
                                '—'
                              }
                            </p>

                            <p className="text-xs text-gray-500">
                              {
                                project?.projectName ||
                                'Project unavailable'
                              }
                            </p>

                          </td>

                          <td className="px-5 py-4 text-sm">

                            {
                              task.assignedTo ||
                              'Unassigned'
                            }

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
                                  task.priority ===
                                  'URGENT'
                                    ? 'bg-red-100 text-red-700'
                                    : task.priority ===
                                      'HIGH'
                                    ? 'bg-orange-100 text-orange-700'
                                    : task.priority ===
                                      'MEDIUM'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              `}
                            >
                              {
                                task.priority
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
                                  task.status ===
                                  'COMPLETED'
                                    ? 'bg-green-100 text-green-700'
                                    : task.status ===
                                      'CANCELLED'
                                    ? 'bg-red-100 text-red-700'
                                    : task.status ===
                                      'IN PROGRESS'
                                    ? 'bg-blue-100 text-blue-700'
                                    : task.status ===
                                      'REVIEW'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-700'
                                }
                              `}
                            >
                              {
                                task.status
                              }
                            </span>

                          </td>

                          <td className="px-5 py-4">

                            <p
                              className={
                                overdue
                                  ? 'text-red-600 font-semibold'
                                  : 'text-gray-700'
                              }
                            >
                              {formatDate(
                                task.dueDate
                              )}
                            </p>

                            {overdue && (
                              <p className="text-xs text-red-500">
                                Overdue
                              </p>
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
                  {editingTask
                    ? 'Edit Task'
                    : 'Create Task'}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingTask
                    ? editingTask.taskCode
                    : 'New task'}
                </p>

              </div>

              <button
                onClick={() =>
                  setShowForm(false)
                }
                className="text-2xl text-gray-500 hover:text-black"
              >
                ×
              </button>

            </div>

            <div className="p-6 space-y-6">

              {/* TASK INFORMATION */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Task Information
                </h3>

                <div className="grid md:grid-cols-2 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Task Name *
                    </label>

                    <input
                      value={
                        form.taskName
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          taskName:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Enter task name"
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Project *
                    </label>

                    <select
                      value={
                        form.project
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          project:
                            event.target
                              .value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      <option value="">
                        Select Project
                      </option>

                      {projects.map(
                        (project) => (
                          <option
                            key={
                              project.id
                            }
                            value={
                              project.id
                            }
                          >
                            {
                              project.projectCode
                            }{' '}
                            —{' '}
                            {
                              project.projectName
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Assigned To
                    </label>

                    <input
                      value={
                        form.assignedTo
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          assignedTo:
                            event.target
                              .value,
                        })
                      }
                      placeholder="Staff member"
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Priority *
                    </label>

                    <select
                      value={
                        form.priority
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          priority:
                            event.target
                              .value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    >

                      {PRIORITIES.map(
                        (priority) => (
                          <option
                            key={
                              priority
                            }
                            value={
                              priority
                            }
                          >
                            {
                              priority
                            }
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Status *
                    </label>

                    <select
                      value={
                        form.status
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          status:
                            event.target
                              .value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-3"
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

                </div>

              </div>

              {/* DATES */}

              <div>

                <h3 className="font-semibold text-[#9a641f] mb-4">
                  Timeline
                </h3>

                <div className="grid md:grid-cols-3 gap-4">

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Start Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.startDate
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          startDate:
                            event.target
                              .value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Due Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.dueDate
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          dueDate:
                            event.target
                              .value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                  <div>

                    <label className="block text-sm font-medium mb-1">
                      Completion Date
                    </label>

                    <input
                      type="date"
                      value={
                        form.completionDate
                      }
                      onChange={(event) =>
                        setForm({
                          ...form,
                          completionDate:
                            event.target
                              .value,
                        })
                      }
                      className="w-full border rounded-lg px-3 py-3"
                    />

                  </div>

                </div>

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="block text-sm font-medium mb-1">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target
                          .value,
                    })
                  }
                  rows={4}
                  placeholder="Describe what needs to be completed..."
                  className="w-full border rounded-lg px-3 py-3"
                />

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
                  onChange={(event) =>
                    setForm({
                      ...form,
                      notes:
                        event.target
                          .value,
                    })
                  }
                  rows={4}
                  placeholder="Internal task notes..."
                  className="w-full border rounded-lg px-3 py-3"
                />

              </div>

            </div>

            {/* ACTIONS */}

            <div className="p-6 border-t flex justify-end gap-3">

              <button
                onClick={() =>
                  setShowForm(false)
                }
                className="px-5 py-3 rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={
                  saveTask
                }
                disabled={saving}
                className="px-5 py-3 rounded-lg bg-[#9a641f] text-white hover:bg-[#7e5017] disabled:opacity-50"
              >
                {saving
                  ? 'Saving...'
                  : editingTask
                  ? 'Update Task'
                  : 'Create Task'}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          DETAILS MODAL
      =================================================== */}

      {showDetails &&
        selectedTask && (

          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">

              <div className="p-6 border-b flex items-start justify-between">

                <div>

                  <p className="text-sm text-gray-500">
                    {
                      selectedTask.taskCode
                    }
                  </p>

                  <h2 className="text-2xl font-bold">
                    {
                      selectedTask.taskName
                    }
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">

                    {
                      getProject(
                        selectedTask.project
                      )?.projectCode ||
                      'Project'
                    }

                    {' — '}

                    {
                      getProject(
                        selectedTask.project
                      )?.projectName ||
                      'Unknown project'
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

                {/* SUMMARY */}

                <div className="grid md:grid-cols-4 gap-4">

                  <div className="border rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Priority
                    </p>

                    <p className="font-semibold mt-1">
                      {
                        selectedTask.priority
                      }
                    </p>

                  </div>

                  <div className="border rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Assigned To
                    </p>

                    <p className="font-semibold mt-1">
                      {
                        selectedTask.assignedTo ||
                        'Unassigned'
                      }
                    </p>

                  </div>

                  <div className="border rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Due Date
                    </p>

                    <p
                      className={`font-semibold mt-1 ${
                        isOverdue(
                          selectedTask
                        )
                          ? 'text-red-600'
                          : ''
                      }`}
                    >
                      {formatDate(
                        selectedTask.dueDate
                      )}
                    </p>

                    {isOverdue(
                      selectedTask
                    ) && (
                      <p className="text-xs text-red-500 mt-1">
                        Overdue
                      </p>
                    )}

                  </div>

                  <div className="border rounded-xl p-4">

                    <p className="text-sm text-gray-500">
                      Status
                    </p>

                    <select
                      value={
                        selectedTask.status
                      }
                      onChange={(event) =>
                        updateTaskStatus(
                          selectedTask,
                          event.target
                            .value
                        )
                      }
                      className="mt-2 w-full border rounded-lg px-2 py-2"
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

                </div>

                {/* TIMELINE */}

                <div className="border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-4">
                    Timeline
                  </h3>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">

                    <div>

                      <p className="text-gray-500">
                        Start Date
                      </p>

                      <p className="font-medium mt-1">
                        {formatDate(
                          selectedTask.startDate
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">
                        Due Date
                      </p>

                      <p className="font-medium mt-1">
                        {formatDate(
                          selectedTask.dueDate
                        )}
                      </p>

                    </div>

                    <div>

                      <p className="text-gray-500">
                        Completion Date
                      </p>

                      <p className="font-medium mt-1">
                        {formatDate(
                          selectedTask.completionDate
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                {/* DESCRIPTION */}

                <div className="border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-3">
                    Description
                  </h3>

                  <p className="whitespace-pre-line text-gray-700">
                    {
                      selectedTask.description ||
                      'No description available.'
                    }
                  </p>

                </div>

                {/* NOTES */}

                <div className="border rounded-xl p-5">

                  <h3 className="font-semibold text-[#9a641f] mb-3">
                    Notes
                  </h3>

                  <p className="whitespace-pre-line text-gray-700">
                    {
                      selectedTask.notes ||
                      'No notes available.'
                    }
                  </p>

                </div>

                {/* ACTIONS */}

                <div className="flex flex-wrap gap-3">

                  <button
                    onClick={() =>
                      openEditForm(
                        selectedTask
                      )
                    }
                    className="px-5 py-3 rounded-lg bg-gray-900 text-white hover:bg-black"
                  >
                    Edit Task
                  </button>

                  <button
                    onClick={() =>
                      deleteTask(
                        selectedTask
                      )
                    }
                    className="px-5 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete Task
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}