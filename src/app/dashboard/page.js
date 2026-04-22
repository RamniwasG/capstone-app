"use client";

import { useEffect, useState } from "react";
import { User, LogOut, Settings, Edit, Plus, UserPlus, X, Grid, List } from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useProjects } from "@/context/ProjectContext";

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    projects,
    loading,
    hydrateUser,
    fetchProjects,
    saveProject,
    addMembersToProject,
    removeProjectMembers,
    logout,
  } = useProjects();

  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [assignEmail, setAssignEmail] = useState("");
  const [assignEmails, setAssignEmails] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [showAssignModal, setShowAssignModal] = useState(false);

  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  useEffect(() => {
    hydrateUser();
    fetchProjects();
  }, [fetchProjects, hydrateUser]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  }

  function openEdit(project) {
    setEditing(project);
    setForm({ name: project.name || "", description: project.description || "" });
    setShowModal(true);
  }

  async function handleSaveProject(event) {
    event.preventDefault();
    const payload = {
      ...form,
      name: capitalize(form.name?.trim()),
      description: form.description?.trim(),
    };
    const success = await saveProject(editing?._id, payload);
    if (success) {
      setShowModal(false);
    }
  }

  function openAssign(project) {
    setAssignTarget(project);
    setAssignEmail("");
    setAssignEmails([]);
    setShowAssignModal(true);
  }

  async function handleAssignMembers(event) {
    event.preventDefault();
    const pendingEmails = assignEmail ? [...assignEmails, assignEmail.trim()] : [...assignEmails];
    const normalizedEmails = pendingEmails.map((email) => email.trim()).filter(Boolean);

    if (!assignTarget || normalizedEmails.length === 0) {
      toast.error("Enter at least one email");
      return;
    }

    const success = await addMembersToProject(assignTarget._id, normalizedEmails);
    if (success) {
      setShowAssignModal(false);
    }
  }

  async function handleRemoveMember(projectId, memberId, event) {
    event.stopPropagation();
    await removeProjectMembers(projectId, [memberId]);
  }

  function handleCardClick(projectId) {
    router.push(`/project/${projectId}`);
  }

  function stopCardClick(event) {
    event.stopPropagation();
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="flex items-center justify-between bg-white px-6 py-4 shadow">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={openCreate}
            className="inline-flex cursor-pointer items-center gap-2 rounded bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create project
          </button>

          <div className="relative">
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
              <div className="absolute right-0 mt-2 w-40 rounded bg-white py-1 shadow">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50"
                  onClick={() => router.push("/profile")}
                >
                  <User className="h-4 w-4" /> Profile
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="p-6">
        <section className="min-h-[70vh]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium">Projects</h2>
            <div className="flex items-center gap-3">
              <div className="mr-4 text-sm text-zinc-500">
                {loading ? "Loading..." : `${projects.length} projects`}
              </div>
              <div className="inline-flex rounded bg-zinc-100 p-1">
                <button
                  onClick={() => setViewMode("card")}
                  title="Card view"
                  aria-label="Card view"
                  className={`p-2 ${
                    viewMode === "card"
                      ? "rounded bg-indigo-700 text-white"
                      : "rounded text-zinc-600 hover:bg-white"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="List view"
                  aria-label="List view"
                  className={`p-2 ${
                    viewMode === "list"
                      ? "rounded bg-indigo-700 text-white"
                      : "rounded text-zinc-600 hover:bg-white"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="rounded border bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                  onClick={() => handleCardClick(project._id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-md font-semibold">{capitalize(project.name)}</h3>
                      <p className="text-sm text-zinc-500">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-1" onClick={stopCardClick}>
                      <button
                        onClick={() => openEdit(project)}
                        className="cursor-pointer rounded p-1 hover:bg-zinc-100"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openAssign(project)}
                        className="cursor-pointer rounded p-1 hover:bg-zinc-100"
                      >
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="mb-2 font-medium">Members ({(project.members || []).length})</div>
                    <div className="flex flex-wrap gap-2">
                      {(project.members || []).slice(0, 5).map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center gap-1 rounded bg-zinc-200 px-2 py-1 text-xs"
                        >
                          {member.email}
                          <button
                            type="button"
                            onClick={(event) => handleRemoveMember(project._id, member._id, event)}
                            className="p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {(project.members || []).length > 5 && (
                        <div className="text-xs text-zinc-400">
                          +{(project.members || []).length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project._id}
                  className="flex items-center justify-between rounded border bg-white p-4 shadow-md transition-shadow hover:shadow-lg"
                  onClick={() => handleCardClick(project._id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold">{capitalize(project.name)}</h3>
                      <div className="text-sm text-zinc-500">
                        {(project.members || []).length} members
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-zinc-500">{project.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(project.members || []).map((member) => (
                        <div
                          key={member.email}
                          className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-xs"
                        >
                          {member.email}
                          <button
                            type="button"
                            onClick={(event) => handleRemoveMember(project._id, member._id, event)}
                            className="p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2" onClick={stopCardClick}>
                    <button
                      onClick={() => openEdit(project)}
                      className="cursor-pointer rounded p-2 hover:bg-zinc-100"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openAssign(project)}
                      className="cursor-pointer rounded p-2 hover:bg-zinc-100"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold">
              {editing ? "Edit project" : "Create project"}
            </h3>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="w-full rounded border px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2">
                  Cancel
                </button>
                <button type="submit" className="rounded bg-indigo-600 px-3 py-2 text-white">
                  {editing ? "Save Changes" : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold">Add members to {assignTarget?.name}</h3>
            <form onSubmit={handleAssignMembers} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Member emails</label>
                <div className="flex gap-2">
                  <input
                    value={assignEmail}
                    onChange={(event) => setAssignEmail(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        const value = assignEmail.trim();
                        if (!value) return;
                        setAssignEmails((current) => Array.from(new Set([...current, value])));
                        setAssignEmail("");
                      }
                    }}
                    className="flex-1 rounded border px-3 py-2"
                    placeholder="Press Enter to queue multiple emails"
                    type="email"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const value = assignEmail.trim();
                      if (!value) {
                        toast.error("Enter an email");
                        return;
                      }
                      setAssignEmails((current) => Array.from(new Set([...current, value])));
                      setAssignEmail("");
                    }}
                    className="rounded bg-zinc-100 px-3 py-2"
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {assignEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 rounded bg-zinc-100 px-2 py-1 text-xs"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setAssignEmails((current) => current.filter((item) => item !== email))
                        }
                        className="p-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded bg-indigo-600 px-3 py-2 text-white">
                  Add members
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
