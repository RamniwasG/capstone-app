"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Edit,
  FolderKanban,
  Grid,
  List,
  LogOut,
  Plus,
  RefreshCcw,
  Settings,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useProjects } from "@/context/ProjectContext";

const USER_FORM_DEFAULTS = {
  username: "",
  name: "",
  email: "",
  phone: "",
  role: "member",
};

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function normalizeUserApproval(user) {
  if (typeof user?.approved === "boolean") return user.approved;
  if (typeof user?.isApproved === "boolean") return user.isApproved;
  if (typeof user?.active === "boolean") return user.active;
  if (typeof user?.isActive === "boolean") return user.isActive;

  if (typeof user?.status === "string") {
    return ["approved", "active"].includes(user.status.toLowerCase());
  }

  return false;
}

function getUserDisplayName(user) {
  return user?.name || user?.username || user?.email || "Unknown user";
}

function buildUserUpdatePayload(form, existingUser) {
  const payload = {
    username: form.username.trim(),
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    role: form.role,
  };

  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (!value) {
        return key === "role";
      }

      return value !== existingUser?.[key];
    })
  );
}

function SidebarButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
        active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const {
    user,
    users,
    usersLoading,
    projects,
    loading,
    hydrateUser,
    fetchProjects,
    fetchUsers,
    saveProject,
    deleteProject,
    updateUser,
    approveUser,
    addMembersToProject,
    removeProjectMembers,
    logout,
  } = useProjects();

  const isAdmin = user?.role === "admin";
  const [activeTab, setActiveTab] = useState("projects");
  const [showMenu, setShowMenu] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [assignEmail, setAssignEmail] = useState("");
  const [assignEmails, setAssignEmails] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState(USER_FORM_DEFAULTS);

  useEffect(() => {
    hydrateUser();
    fetchProjects();
  }, [fetchProjects, hydrateUser]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [fetchUsers, isAdmin]);

  function openCreateProject() {
    setEditingProject(null);
    setProjectForm({ name: "", description: "" });
    setShowProjectModal(true);
  }

  function openEditProject(project) {
    setEditingProject(project);
    setProjectForm({ name: project.name || "", description: project.description || "" });
    setShowProjectModal(true);
  }

  async function handleSaveProject(event) {
    event.preventDefault();
    const payload = {
      ...projectForm,
      name: capitalize(projectForm.name?.trim()),
      description: projectForm.description?.trim(),
    };
    const success = await saveProject(editingProject?._id, payload);
    if (success) {
      setShowProjectModal(false);
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
    if (!isAdmin) {
      return;
    }
    await removeProjectMembers(projectId, [memberId]);
  }

  async function handleDeleteProject(project, event) {
    event.stopPropagation();
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm(`Delete "${project.name}"?`);
    if (!confirmed) {
      return;
    }

    await deleteProject(project._id);
  }

  function handleCardClick(projectId) {
    router.push(`/project/${projectId}`);
  }

  function stopCardClick(event) {
    event.stopPropagation();
  }

  function openEditUser(userToEdit) {
    setEditingUser(userToEdit);
    setUserForm({
      username: userToEdit?.username || "",
      name: userToEdit?.name || "",
      email: userToEdit?.email || "",
      phone: userToEdit?.phone || "",
      role: userToEdit?.role || "member",
    });
    setShowUserModal(true);
  }

  async function handleApproveUser(userToApprove) {
    await approveUser(userToApprove?._id || userToApprove?.id);
  }

  async function handleUpdateUser(event) {
    event.preventDefault();

    if (!editingUser) {
      return;
    }

    const payload = buildUserUpdatePayload(userForm, editingUser);

    if (Object.keys(payload).length === 0) {
      toast.info("No user changes to save");
      return;
    }

    const success = await updateUser(editingUser._id || editingUser.id, payload);
    if (success) {
      setShowUserModal(false);
    }
  }

  const pendingUsers = users.filter((item) => !normalizeUserApproval(item));
  const approvedUsers = users.filter((item) => normalizeUserApproval(item));
  const currentTab = isAdmin ? activeTab : "projects";

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">
            {isAdmin ? "Admin workspace" : "Workspace"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && <button
            onClick={() => {
              if (currentTab === "projects") {
                openCreateProject();
                return;
              }
              fetchUsers();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {currentTab === "projects" ? (
              <>
                <Plus className="h-4 w-4" /> Create project
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4" /> Refresh users
              </>
            )}
          </button>}

          <div className="relative">
            <button
              onClick={() => setShowMenu((open) => !open)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-zinc-100"
            >
              <span className="hidden text-sm sm:block">
                {user?.name || user?.username || "User"}
              </span>
              <div className="rounded-full bg-zinc-200 p-1">
                <User className="h-5 w-5" />
              </div>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg">
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={() => router.push("/profile")}
                >
                  <User className="h-4 w-4" /> Profile
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={() => router.push("/settings")}
                >
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-50"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        <aside className="w-full rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-24 lg:w-72 lg:self-start">
          <div className="mb-4 rounded-2xl bg-zinc-100 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Signed in as</p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-900">
              {user?.name || user?.username || "User"}
            </h2>
            <p className="text-sm text-zinc-500">{user?.role || "member"}</p>
          </div>

          <nav className="space-y-2">
            <SidebarButton
              active={currentTab === "projects"}
              icon={FolderKanban}
              label="Projects"
              onClick={() => setActiveTab("projects")}
            />
            {isAdmin && (
              <SidebarButton
                active={currentTab === "users"}
                icon={Users}
                label="Users"
                onClick={() => setActiveTab("users")}
              />
            )}
          </nav>

          {isAdmin && (
            <div className="mt-6 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-900">
              <div className="flex items-center gap-2 font-medium">
                <UserCheck className="h-4 w-4" />
                <span>{pendingUsers.length} pending approvals</span>
              </div>
              <p className="mt-2 text-indigo-800/80">
                Review new members from the Users tab and approve them when ready.
              </p>
            </div>
          )}
        </aside>

        <main className="min-w-0 flex-1">
          {currentTab === "projects" ? (
            <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">Projects</h2>
                  <p className="text-sm text-zinc-500">
                    {loading ? "Loading projects..." : `${projects.length} total projects`}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex rounded-xl bg-zinc-100 p-1">
                    <button
                      onClick={() => setViewMode("card")}
                      title="Card view"
                      aria-label="Card view"
                      className={`p-2 ${
                        viewMode === "card"
                          ? "rounded-lg bg-indigo-700 text-white"
                          : "rounded-lg text-zinc-600 hover:bg-white"
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
                          ? "rounded-lg bg-indigo-700 text-white"
                          : "rounded-lg text-zinc-600 hover:bg-white"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === "card" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <div
                      key={project._id}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      onClick={() => handleCardClick(project._id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-zinc-900">
                            {capitalize(project.name)}
                          </h3>
                          <p className="mt-1 text-sm text-zinc-500">{project.description}</p>
                        </div>
                        <div className="flex items-center gap-1" onClick={stopCardClick}>
                          <button
                            onClick={() => openEditProject(project)}
                            className="cursor-pointer rounded-lg p-2 hover:bg-white"
                            title="Edit project"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openAssign(project)}
                            className="cursor-pointer rounded-lg p-2 hover:bg-white"
                            title="Assign members"
                          >
                            <UserPlus className="h-4 w-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={(event) => handleDeleteProject(project, event)}
                              className="cursor-pointer rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                              title="Delete project"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 text-sm">
                        <div className="mb-2 font-medium text-zinc-700">
                          Members ({(project.members || []).length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(project.members || []).slice(0, 5).map((member) => (
                            <div
                              key={member.email || member._id}
                              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-zinc-700"
                            >
                              {member.email}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    handleRemoveMember(project._id, member._id, event)
                                  }
                                  className="p-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
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
                      className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm transition hover:shadow-md md:flex-row md:items-start md:justify-between"
                      onClick={() => handleCardClick(project._id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-zinc-900">
                            {capitalize(project.name)}
                          </h3>
                          <div className="text-sm text-zinc-500">
                            {(project.members || []).length} members
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-zinc-500">{project.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(project.members || []).map((member) => (
                            <div
                              key={member.email || member._id}
                              className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs"
                            >
                              {member.email}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={(event) =>
                                    handleRemoveMember(project._id, member._id, event)
                                  }
                                  className="p-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 md:ml-4" onClick={stopCardClick}>
                        <button
                          onClick={() => openEditProject(project)}
                          className="cursor-pointer rounded-lg p-2 hover:bg-white"
                          title="Edit project"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openAssign(project)}
                          className="cursor-pointer rounded-lg p-2 hover:bg-white"
                          title="Assign members"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={(event) => handleDeleteProject(project, event)}
                            className="cursor-pointer rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                            title="Delete project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ) : (
            <section className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-zinc-500">Total users</div>
                  <div className="mt-2 text-3xl font-semibold text-zinc-900">{users.length}</div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-zinc-500">Pending approval</div>
                  <div className="mt-2 text-3xl font-semibold text-amber-600">
                    {pendingUsers.length}
                  </div>
                </div>
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="text-sm text-zinc-500">Approved users</div>
                  <div className="mt-2 text-3xl font-semibold text-emerald-600">
                    {approvedUsers.length}
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-900">Users</h2>
                    <p className="text-sm text-zinc-500">
                      {usersLoading ? "Loading users..." : "Approve members or update user details"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchUsers}
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                  >
                    <RefreshCcw className="h-4 w-4" /> Refresh
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-[0.18em] text-zinc-400">
                        <th className="py-3 pr-4">User</th>
                        <th className="py-3 pr-4">Role</th>
                        <th className="py-3 pr-4">Phone</th>
                        <th className="py-3 pr-4">Status</th>
                        <th className="py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {users.map((userItem) => {
                        const isApproved = normalizeUserApproval(userItem);

                        return (
                          <tr key={userItem._id || userItem.id}>
                            <td className="py-4 pr-4">
                              <div className="font-medium text-zinc-900">
                                {getUserDisplayName(userItem)}
                              </div>
                              <div className="text-sm text-zinc-500">{userItem.email || "-"}</div>
                            </td>
                            <td className="py-4 pr-4 text-sm text-zinc-600">
                              {userItem.role || "member"}
                            </td>
                            <td className="py-4 pr-4 text-sm text-zinc-600">
                              {userItem.phone || "-"}
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                  isApproved
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-amber-50 text-amber-700"
                                }`}
                              >
                                {isApproved ? "Approved" : "Pending"}
                              </span>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                {!isApproved && (
                                  <button
                                    type="button"
                                    onClick={() => handleApproveUser(userItem)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                                  >
                                    <CheckCircle2 className="h-4 w-4" /> Approve
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openEditUser(userItem)}
                                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-50"
                                >
                                  <Edit className="h-4 w-4" /> Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900">
              {editingProject ? "Edit project" : "Create project"}
            </h3>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input
                  value={projectForm.name}
                  onChange={(event) =>
                    setProjectForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(event) =>
                    setProjectForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="min-h-28 w-full rounded-xl border border-zinc-200 px-3 py-2"
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="rounded-xl px-3 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-3 py-2 text-white"
                >
                  {editingProject ? "Save changes" : "Create project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900">
              Add members to {assignTarget?.name}
            </h3>
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
                    className="flex-1 rounded-xl border border-zinc-200 px-3 py-2"
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
                    className="rounded-xl bg-zinc-100 px-3 py-2"
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {assignEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center gap-2 rounded-full bg-zinc-100 px-2 py-1 text-xs"
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
                  className="rounded-xl px-3 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-white">
                  Add members
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-lg font-semibold text-zinc-900">Update user</h3>
            <form onSubmit={handleUpdateUser} className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Username</label>
                <input
                  value={userForm.username}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, username: event.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  disabled
                  type="email"
                  value={userForm.email}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 hover:bg-zinc-50 cursor-not-allowed bg-zinc-100 text-zinc-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  value={userForm.phone}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium">Role</label>
                <select
                  disabled
                  value={userForm.role}
                  onChange={(event) =>
                    setUserForm((current) => ({ ...current, role: event.target.value }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-3 py-2 hover:bg-zinc-50 cursor-not-allowed bg-zinc-100 text-zinc-500"
                >
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="rounded-xl px-3 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-3 py-2 text-white">
                  Save user
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
