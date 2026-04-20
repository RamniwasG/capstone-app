"use client";

import { useEffect, useState } from "react";
import { User, LogOut, Settings, Edit, Plus, UserPlus, X, Grid, List } from "lucide-react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  })
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [assignEmail, setAssignEmail] = useState("");
  const [assignEmails, setAssignEmails] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const router = useRouter();
  
  function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    try {
      const res = await api.get("/projects/getAll");
      setProjects(res?.data?.projects || []);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Could not load projects");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  }

  function openEdit(p) {
    console.log(p)
    setEditing(p);
    setForm({ name: p.name || "", description: p.description || "" });
    setShowModal(true);
  }

  async function saveProject(e) {
    e.preventDefault();
    try {
      const payload = { ...form, name: capitalize(form.name?.trim()) };
      if (editing) {
        const res = await api.patch(`/projects/update/${editing._id}`, payload);
        toast.success(res?.data?.message || "Project updated");
      } else {
        const res = await api.post(`/projects/create`, payload);
        toast.success(res?.data?.message || "Project created");
      }
      setShowModal(false);
      fetchProjects();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Save failed");
    }
  }

  function openAssign(p) {
    setAssignTarget(p);
    setAssignEmail("");
    setAssignEmails([]);
    // open assign modal
    setShowAssignModal(true);
  }

  async function doAssign(project, emails) {
    try {
      const resp = await api.post("/users/emails-to-ids", { emails });
      const ids = resp?.data?.userIds || [];
      const res = await api.post(`/projects/${project._id}/add-member`, { memberIds: ids });
      toast.success(res?.data?.message || "Member(s) added");
      fetchProjects();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Add member failed");
    }
  }

  async function removeAssignMember(projectId, memberId) {
    try {
      const res = await api.post(`/projects/${projectId}/remove-member`, { memberIds: [memberId] });
      toast.success(res?.data?.message || "Member removed");
      fetchProjects();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Remove member failed");
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded bg-indigo-600 px-3 py-2 text-white hover:bg-indigo-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Create project
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu((s) => !s)}
              className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-100"
            >
              <span className="hidden sm:block text-sm">{user?.name || user?.username || "User"}</span>
              <div className="rounded-full bg-zinc-200 p-1">
                <User className="h-5 w-5" />
              </div>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded bg-white shadow py-1">
                <button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50" onClick={() => {router.push('/profile')}}>
                  <User className="h-4 w-4" /> Profile
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50" onClick={() => {router.push('/settings')}}>
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-50" onClick={logout}>
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
              <div className="text-sm text-zinc-500 mr-4">{loading ? 'Loading...' : `${projects.length} projects`}</div>
              <div className="inline-flex rounded bg-zinc-100 p-1">
                <button
                  onClick={() => setViewMode("card")}
                  title="Card view"
                  aria-label="Card view"
                  className={`p-2 ${viewMode === "card" ? "bg-indigo-700 text-white rounded" : "text-zinc-600 hover:bg-white rounded"}`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="List view"
                  aria-label="List view"
                  className={`p-2 ${viewMode === "list" ? "bg-indigo-700 text-white rounded" : "text-zinc-600 hover:bg-white rounded"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <div key={p._id} className="rounded border bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-md font-semibold">{capitalize(p.name)}</h3>
                      <p className="text-sm text-zinc-500">{p.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-2 hover:bg-zinc-100 rounded cursor-pointer">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => openAssign(p)} className="p-2 hover:bg-zinc-100 rounded cursor-pointer">
                        <UserPlus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <div className="mb-2 font-medium">Members ({(p.members || []).length})</div>
                    <div className="flex flex-wrap gap-2">
                      {(p.members || []).slice(0,5).map((m) => (
                        <div key={m.email} className="flex items-center gap-1 rounded bg-zinc-200 px-2 py-1 text-xs">
                            {m.email}
                            <button type="button" onClick={() => removeAssignMember(p._id, m._id)} className="p-1">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                      ))}
                      {((p.members || []).length > 5) && <div className="text-xs text-zinc-400">+{(p.members||[]).length - 5} more</div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((p) => (
                <div key={p._id} className="flex items-center justify-between rounded border bg-white p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-md font-semibold">{capitalize(p.name)}</h3>
                      <div className="text-sm text-zinc-500">{(p.members||[]).length} members</div>
                    </div>
                    <p className="text-sm text-zinc-500 mt-2">{p.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(p.members || []).map((m) => (
                        <div key={m.email} className="flex items-center gap-1 rounded bg-zinc-100 px-2 py-1 text-xs">
                            {m.email}
                            <button type="button" onClick={() => removeAssignMember(p._id, m._id)} className="p-1">
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    <button onClick={() => openEdit(p)} className="p-2 hover:bg-zinc-100 rounded cursor-pointer">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => openAssign(p)} className="p-2 hover:bg-zinc-100 rounded cursor-pointer">
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal for create/edit project */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold">{editing ? 'Edit project' : 'Create project'}</h3>
            <form onSubmit={saveProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input value={form.name} onChange={(e) => setForm((s) => ({...s, name: e.target.value}))} className="w-full rounded border px-3 py-2" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((s) => ({...s, description: e.target.value}))} className="w-full rounded border px-3 py-2" />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-3 py-2">Cancel</button>
                <button type="submit" className="rounded bg-indigo-600 px-3 py-2 text-white">{editing ? 'Save Changes' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded bg-white p-6">
            <h3 className="mb-3 text-lg font-semibold">Add members to {assignTarget?.name}</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                // add current input first if present
                const toAdd = assignEmail ? [...assignEmails, assignEmail.trim()] : [...assignEmails];
                const normalized = toAdd.map((s) => s.trim()).filter(Boolean);
                if (normalized.length === 0) {
                  toast.error("Enter at least one email");
                  return;
                }
                await doAssign(assignTarget, normalized);
                setShowAssignModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium">Member emails</label>
                <div className="flex gap-2">
                  <input
                    value={assignEmail}
                    onChange={(e) => setAssignEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = assignEmail.trim();
                        if (!val) return;
                        setAssignEmails((s) => Array.from(new Set([...s, val])));
                        setAssignEmail("");
                      }
                    }}
                    className="flex-1 rounded border px-3 py-2"
                    placeholder="press Enter to add multiple or type and click +"
                    type="email"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = assignEmail.trim();
                      if (!val) return toast.error("Enter an email");
                      setAssignEmails((s) => Array.from(new Set([...s, val])));
                      setAssignEmail("");
                    }}
                    className="rounded bg-zinc-100 px-3 py-2"
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {assignEmails.map((e) => (
                    <div key={e} className="flex items-center gap-2 rounded bg-zinc-100 px-2 py-1 text-xs">
                      <span>{e}</span>
                      <button type="button" onClick={() => setAssignEmails((s) => s.filter((x) => x !== e))} className="p-1">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowAssignModal(false)} className="px-3 py-2">Cancel</button>
                <button type="submit" className="rounded bg-indigo-600 px-3 py-2 text-white">Add members</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
