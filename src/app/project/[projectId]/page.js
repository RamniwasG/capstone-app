"use client";

import { useEffect, useState } from "react";
import {
  CircleUserRound,
  FolderX,
  FilePenLine,
  GripVertical,
  LogOut,
  MoveLeftIcon,
  Plus,
  Settings,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import { useParams, useRouter } from "next/navigation";
import { useProjects, useProjectTasks } from "@/context/ProjectContext";
import api from "@/lib/axios";
import Link from "next/link";

const BOARD_COLUMNS = [
  { id: "pending", title: "Todo" },
  { id: "in-progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

const EMPTY_MESSAGES = {
  pending: "No tasks in Todo yet. Create a new task to get started.",
  "in-progress": "Nothing is in progress yet. Drag a task here when work begins.",
  completed: "No completed tasks yet. Move finished work here.",
};

const TASK_PRIORITY = {
  Low: "low",
  Medium: "medium",
  High: "high",
};

const PRIORITY_STYLES = {
  low: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-rose-50 text-rose-700",
};


function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getAssigneeValue(assignee) {
  if (!assignee) {
    return "";
  }

  if (typeof assignee === "string") {
    return assignee;
  }

  return assignee._id || assignee.email || assignee.username || assignee.name || "";
}

function getAssigneeLabel(assignee, activeMembers = []) {
  if (!assignee) {
    return "Unassigned";
  }

  if (typeof assignee === "string") {
    const user = activeMembers.find(
      (member) =>
        member._id === assignee ||
        member.email === assignee ||
        member.username === assignee ||
        member.name === assignee
    );

    return user ? user.name || user.username || user.email || assignee : assignee;
  }

  return assignee.name || assignee.username || assignee.email || assignee._id || "Unknown";
}

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const router = useRouter();
  const {
    user,
    currentProject,
    hydrateUser,
    fetchProjects,
    deleteProject,
    setCurrentProject,
    logout,
  } = useProjects();
  const isAdmin = user?.role === "admin";
  const {
    columns,
    loading,
    fetchProjectTasks,
    createProjectTask,
    updateProjectTask,
    deleteProjectTask,
    updateTaskStatus,
  } = useProjectTasks(projectId);

  const [showMenu, setShowMenu] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [activeColumn, setActiveColumn] = useState("pending");
  const [editingTask, setEditingTask] = useState(null);
  const [activeMembers, setActiveMembers] = useState([]);
  const [activeMembersLoading, setActiveMembersLoading] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
  });

  useEffect(() => {
    hydrateUser();
    // fetchProjects();
  }, [fetchProjects, hydrateUser]);

  useEffect(() => {
    setCurrentProject(projectId);
    fetchProjectTasks(projectId);

    return () => {
      setCurrentProject(null);
    };
  }, [fetchProjectTasks, projectId, setCurrentProject]);

  useEffect(() => {
    let ignore = false;

    async function fetchActiveMembers() {
      if (!isAdmin) {
        if (!ignore) {
          setActiveMembers(Array.isArray(currentProject?.members) ? currentProject.members : []);
          setActiveMembersLoading(false);
        }
        return;
      }

      setActiveMembersLoading(true);

      try {
        const response = await api.get("/users/all-members");
        const members = response?.data?.users || [];

        if (!ignore) {
          setActiveMembers(Array.isArray(members) ? members : []);
        }
      } catch (error) {
        if (!ignore) {
          setActiveMembers([]);
        }

        toast.error(error?.response?.data?.error || "Could not load active members");
      } finally {
        if (!ignore) {
          setActiveMembersLoading(false);
        }
      }
    }

    fetchActiveMembers();

    return () => {
      ignore = true;
    };
  }, [currentProject, isAdmin]);

  async function handleSubmitTask(event) {
    event.preventDefault();

    if (!taskForm.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if(!taskForm.assignedTo.trim()) {
      toast.error("Please choose assignee for the task");
      return;
    }

    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      assignedTo: taskForm.assignedTo.trim(),
      priority: taskForm.priority,
      status: taskForm.status,
    };

    const success = editingTask
      ? await updateProjectTask(projectId, editingTask._id, payload)
      : await createProjectTask(projectId, payload);

    if (success) {
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        status: activeColumn,
      });
    }
  }

  function openTaskModal(columnId) {
    setActiveColumn(columnId);
    setEditingTask(null);
    setTaskForm({
      title: "",
      description: "",
      assignedTo: "",
      priority: "medium",
      status: columnId,
    });
    setShowTaskModal(true);
  }

  function openEditTaskModal(task) {
    setActiveColumn(task.status);
    setEditingTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      assignedTo: getAssigneeValue(task.assignedTo),
      priority: task.priority || "medium",
      status: task.status || "pending",
    });
    setShowTaskModal(true);
  }

  const selectedAssigneeMissing =
    taskForm.assignedTo &&
    !currentProject?.members?.some((member) => getAssigneeValue(member) === taskForm.assignedTo);

  async function handleDrop(columnId) {
    if (!draggingTaskId) {
      return;
    }

    await updateTaskStatus(projectId, draggingTaskId, columnId);
    setDraggingTaskId(null);
  }

  async function handleDeleteProject() {
    if (!currentProject || !isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${currentProject.name}"? This will remove the project and its board access.`
    );

    if (!confirmed) {
      return;
    }

    const success = await deleteProject(currentProject._id);
    if (success) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-100">
            <MoveLeftIcon className="h4 w-4 text-blue-500" /> Back
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Project board</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900">
              {currentProject ? capitalize(currentProject.name) : "Project details"}
            </h1>
          </div>
        </div>
        <div className="relative flex items-center gap-4">
          {isAdmin && (
            <button
              onClick={() => openTaskModal("pending")}
              className="inline-flex items-center gap-2 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" /> Create task
            </button>
          )}

          <button
            onClick={() => setShowMenu((open) => !open)}
            className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-100"
          >
            <span className="hidden text-sm sm:block">
              {user?.name || user?.username || "User"}
            </span>
            <div className="rounded-full bg-zinc-200 p-1">
              <User className="h-5 w-5" />
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 top-14 w-44 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                onClick={() => router.push("/profile")}
              >
                <CircleUserRound className="h-4 w-4" /> Profile
              </button>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                onClick={() => router.push("/settings")}
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              {isAdmin && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                  onClick={handleDeleteProject}
                >
                  <FolderX className="h-4 w-4" /> Delete project
                </button>
              )}
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-81px)] grid-cols-1 gap-4 p-4 md:grid-cols-3">
        {BOARD_COLUMNS.map((column) => {
          const tasks = columns[column.id] || [];
          return (
            <section
              key={column.id}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => handleDrop(column.id)}
              className="flex min-h-[70vh] flex-col rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm"
            >
              <div className="flex items-center justify-between p-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-zinc-900">{column.title}</h2>
                  <p className="mt-1 text-sm text-zinc-500">({tasks.length})</p>
                </div>
              </div>

              <div className="mt-5 flex-1 space-y-4">
                {loading ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
                    Loading tasks...
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="flex h-full min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-5 text-center">
                    <div className="text-4xl font-semibold text-zinc-300">0</div>
                    {EMPTY_MESSAGES[column.id].split(".").map((sentence, index) => (
                      <p key={index} className="mt-3 text-sm text-zinc-500">
                        {sentence}
                      </p>
                    ))}
                    {isAdmin && column.id === "pending" && (
                    <button
                      onClick={() => openTaskModal(column.id)}
                      className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Create new task
                    </button>)}
                  </div>
                ) : (
                  tasks.map((task) => (
                    <article
                      key={task._id}
                      draggable
                      onDragStart={() => setDraggingTaskId(task._id)}
                      onDragEnd={() => setDraggingTaskId(null)}
                      className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="mt-0.5 h-4 w-4 text-zinc-400" />
                          <div>
                            <h3 className="font-medium text-zinc-900">{task.title}</h3>
                            {/* <p className="mt-2 text-sm leading-6 text-zinc-600">
                              {task.description || "No description yet."}
                            </p> */}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditTaskModal(task)}
                            className="rounded p-1 text-zinc-400 hover:bg-white hover:text-zinc-700"
                            aria-label={`Edit ${task.title}`}
                          >
                            <FilePenLine className="h-4 w-4" />
                          </button>
                          {isAdmin && task.status !== 'completed' && (
                            <button
                              onClick={() => deleteProjectTask(projectId, task._id)}
                              className="rounded p-1 text-zinc-400 hover:bg-white hover:text-rose-600"
                              aria-label={`Delete ${task.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            PRIORITY_STYLES[task.priority] || "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {task.priority}
                        </span>
                        {task.assignedTo ? (
                          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                            {getAssigneeLabel(task.assignedTo, activeMembers)}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </main>

      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-zinc-900">
              {editingTask ? "Edit task" : "Create task"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {editingTask ? "Update the task details and save your changes." : "Add a task to the "}
              {!editingTask && (
                <b>{BOARD_COLUMNS.find((column) => column.id === activeColumn)?.title} </b>
              )}
              {!editingTask && "column."}
            </p>

            <form onSubmit={handleSubmitTask} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Title</label>
                <input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, title: event.target.value }))
                  }
                  className="w-full rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-indigo-500"
                  placeholder="Design login flow"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(event) =>
                    setTaskForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="min-h-28 w-full rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-indigo-500"
                  placeholder="Add details, acceptance criteria, and notes"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Assignee</label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(event) =>
                      setTaskForm((current) => ({ ...current, assignedTo: event.target.value }))
                    }
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-indigo-500"
                    disabled={activeMembersLoading}
                  >
                    <option value="" disabled>
                      {activeMembersLoading ? "Loading assignees..." : "Unassigned"}
                    </option>
                    {selectedAssigneeMissing && (
                      <option value={taskForm.assignedTo}>
                        {getAssigneeLabel(editingTask?.assignedTo || taskForm.assignedTo, activeMembers)}
                      </option>
                    )}
                    {currentProject?.members?.map((member) => {
                      const value = getAssigneeValue(member);
                      return (
                        <option key={value} value={value}>
                          {getAssigneeLabel(member)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(event) =>
                      setTaskForm((current) => ({ ...current, priority: event.target.value }))
                    }
                    className="w-full rounded-md border border-zinc-200 px-3 py-2 outline-none focus:border-indigo-500"
                  >
                    {Object.entries(TASK_PRIORITY).map(([key, value]) => (
                      <option key={key} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setEditingTask(null);
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-red-400 hover:bg-red-500 hover:cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 hover:cursor-pointer"
                >
                  {editingTask ? "Save changes" : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
