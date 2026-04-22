"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from "react";
import { toast } from "react-toastify";
import api from "@/lib/axios";
import { getToken, logoutLocal } from "@/lib/auth";

const ProjectContext = createContext(null);

const TASK_STORAGE_KEY = "projectTasksByProject";
const TASK_STATUSES = ["pending", "in-progress", "completed"];

function createInitialState() {
  return {
    user: null,
    projects: [],
    loading: false,
    error: null,
    currentProjectId: null,
    tasksByProject: {},
    tasksLoadingByProject: {},
  };
}

function readPersistedTasks() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function normalizeTask(task, fallbackStatus = "pending") {
  const status = TASK_STATUSES.includes(task?.status) ? task.status : fallbackStatus;

  return {
    _id: task?._id || task?.id,
    title: task?.title || "",
    description: task?.description || "",
    assignedTo: task?.assignedTo || "",
    priority: task?.priority || "Medium",
    status,
  };
}

function projectReducer(state, action) {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    case "SET_PROJECTS":
      return {
        ...state,
        projects: action.payload,
        error: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      };
    case "SET_CURRENT_PROJECT":
      return {
        ...state,
        currentProjectId: action.payload,
      };
    case "SET_TASKS_LOADING":
      return {
        ...state,
        tasksLoadingByProject: {
          ...state.tasksLoadingByProject,
          [action.projectId]: action.payload,
        },
      };
    case "HYDRATE_TASKS":
      return {
        ...state,
        tasksByProject: action.payload,
      };
    case "SET_PROJECT_TASKS":
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.projectId]: action.payload.map((task) => normalizeTask(task)),
        },
      };
    case "ADD_PROJECT_TASK":
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.projectId]: [
            normalizeTask(action.payload),
            ...(state.tasksByProject[action.projectId] || []),
          ],
        },
      };
    case "UPDATE_PROJECT_TASK":
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.projectId]: (state.tasksByProject[action.projectId] || []).map((task) =>
            task._id === action.taskId ? normalizeTask({ ...task, ...action.payload }) : task
          ),
        },
      };
    case "DELETE_PROJECT_TASK":
      return {
        ...state,
        tasksByProject: {
          ...state.tasksByProject,
          [action.projectId]: (state.tasksByProject[action.projectId] || []).filter(
            (task) => task._id !== action.taskId
          ),
        },
      };
    case "CLEAR_SESSION":
      return {
        ...createInitialState(),
        tasksByProject: state.tasksByProject,
      };
    default:
      return state;
  }
}

export function ProjectProvider({ children }) {
  const [state, dispatch] = useReducer(projectReducer, undefined, createInitialState);

  useEffect(() => {
    dispatch({
      type: "HYDRATE_TASKS",
      payload: readPersistedTasks(),
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(state.tasksByProject));
  }, [state.tasksByProject]);

  const hydrateUser = useCallback(() => {
    try {
      const rawUser = localStorage.getItem("user");
      dispatch({
        type: "SET_USER",
        payload: rawUser ? JSON.parse(rawUser) : null,
      });
    } catch {
      dispatch({ type: "SET_USER", payload: null });
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!getToken()) {
      dispatch({ type: "SET_PROJECTS", payload: [] });
      return [];
    }

    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await api.get("/projects/getAll");
      const projects = response?.data?.projects || [];
      dispatch({ type: "SET_PROJECTS", payload: projects });
      return projects;
    } catch (error) {
      const message = error?.response?.data?.error || "Could not load projects";
      dispatch({ type: "SET_ERROR", payload: message });
      toast.error(message);
      return [];
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  const saveProject = useCallback(
    async (projectId, payload) => {
      try {
        if (projectId) {
          const response = await api.patch(`/projects/update/${projectId}`, payload);
          toast.success(response?.data?.message || "Project updated");
        } else {
          const response = await api.post("/projects/create", payload);
          toast.success(response?.data?.message || "Project created");
        }

        await fetchProjects();
        return true;
      } catch (error) {
        toast.error(error?.response?.data?.error || "Save failed");
        return false;
      }
    },
    [fetchProjects]
  );

  const addMembersToProject = useCallback(
    async (projectId, emails) => {
      try {
        const response = await api.post("/users/emails-to-ids", { emails });
        const memberIds = response?.data?.userIds || [];
        const result = await api.post(`/projects/${projectId}/add-member`, { memberIds });
        toast.success(result?.data?.message || "Member(s) added");
        await fetchProjects();
        return true;
      } catch (error) {
        toast.error(error?.response?.data?.error || "Add member failed");
        return false;
      }
    },
    [fetchProjects]
  );

  const removeProjectMembers = useCallback(
    async (projectId, memberIds) => {
      try {
        const response = await api.post(`/projects/${projectId}/remove-member`, { memberIds });
        toast.success(response?.data?.message || "Member removed");
        await fetchProjects();
        return true;
      } catch (error) {
        toast.error(error?.response?.data?.error || "Remove member failed");
        return false;
      }
    },
    [fetchProjects]
  );

  const fetchProjectTasks = useCallback(async (projectId) => {
    if (!projectId) {
      return [];
    }

    dispatch({ type: "SET_TASKS_LOADING", projectId, payload: true });

    try {
      const response = await api.get(`/tasks/${projectId}`);
      const tasks = response?.data?.tasks || [];
      dispatch({ type: "SET_PROJECT_TASKS", projectId, payload: tasks });
      return tasks;
    } catch {
      return [];
    } finally {
      dispatch({ type: "SET_TASKS_LOADING", projectId, payload: false });
    }
  }, []);

  const createProjectTask = useCallback(async (projectId, payload) => {
    if (!projectId) {
      return false;
    }

    try {
      const response = await api.post(`/tasks/${projectId}/create`, payload);
      const createdTask = response?.data?.task || payload;
      dispatch({ type: "ADD_PROJECT_TASK", projectId, payload: createdTask });
      toast.success(response?.data?.message || "Task created");
      return true;
    } catch {
      dispatch({ type: "ADD_PROJECT_TASK", projectId, payload });
      toast.success("Task created locally");
      return true;
    }
  }, []);

  const assignProjectTask = useCallback(async (projectId, taskId, assignee) => {
    if (!projectId || !taskId) {
      return false;
    }

    try {
      const response = await api.patch(`/tasks/assign/${taskId}`, { assignedTo: assignee });
      dispatch({
        type: "UPDATE_PROJECT_TASK",
        projectId,
        taskId,
        payload: response?.data?.task || { assignedTo: assignee },
      });
      toast.success(response?.data?.message || "Task assigned");
      return true;
    } catch {
      dispatch({
        type: "UPDATE_PROJECT_TASK",
        projectId,
        taskId,
        payload: { assignee },
      });
      toast.success("Task assignment updated locally");
      return true;
    }
  }, []);

  const updateProjectTask = useCallback(async (projectId, taskId, payload) => {
    if (!projectId || !taskId) {
      return false;
    }

    try {
      const response = await api.put(`/tasks/${projectId}/update/${taskId}`, payload);
      dispatch({
        type: "UPDATE_PROJECT_TASK",
        projectId,
        taskId,
        payload: response?.data?.task || payload,
      });
      toast.success(response?.data?.message || "Task updated");
      return true;
    } catch {
      dispatch({ type: "UPDATE_PROJECT_TASK", projectId, taskId, payload });
      toast.success("Task updated locally");
      return true;
    }
  }, []);

  const deleteProjectTask = useCallback(async (projectId, taskId) => {
    if (!projectId || !taskId) {
      return false;
    }

    try {
      const response = await api.delete(`/tasks/delete/${taskId}`);
      dispatch({ type: "DELETE_PROJECT_TASK", projectId, taskId });
      toast.success(response?.data?.message || "Task deleted");
      return true;
    } catch {
      dispatch({ type: "DELETE_PROJECT_TASK", projectId, taskId });
      toast.success("Task deleted locally");
      return true;
    }
  }, []);

  const updateTaskStatus = useCallback(async (projectId, taskId, status) => {
    if (!projectId || !taskId || !TASK_STATUSES.includes(status)) {
      return false;
    }

    try {
      const response = await api.patch(`/tasks/status/${taskId}`, { status });
      dispatch({
        type: "UPDATE_PROJECT_TASK",
        projectId,
        taskId,
        payload: response?.data?.task || { status },
      });
      return true;
    } catch {
      dispatch({
        type: "UPDATE_PROJECT_TASK",
        projectId,
        taskId,
        payload: { status },
      });
      toast.success("Task status updated locally");
      return true;
    }
  }, []);

  const setCurrentProject = useCallback((projectId) => {
    dispatch({ type: "SET_CURRENT_PROJECT", payload: projectId });
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: "CLEAR_SESSION" });
    logoutLocal();
  }, []);

  const currentProject =
    state.projects.find((project) => project._id === state.currentProjectId) || null;

  const value = useMemo(
    () => ({
      ...state,
      currentProject,
      hydrateUser,
      fetchProjects,
      saveProject,
      addMembersToProject,
      removeProjectMembers,
      fetchProjectTasks,
      createProjectTask,
      assignProjectTask,
      updateProjectTask,
      deleteProjectTask,
      updateTaskStatus,
      setCurrentProject,
      logout,
    }),
    [
      state,
      currentProject,
      hydrateUser,
      fetchProjects,
      saveProject,
      addMembersToProject,
      removeProjectMembers,
      fetchProjectTasks,
      createProjectTask,
      assignProjectTask,
      updateProjectTask,
      deleteProjectTask,
      updateTaskStatus,
      setCurrentProject,
      logout,
    ]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjects() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider");
  }

  return context;
}

export function useProjectTasks(projectId) {
  const context = useProjects();
  const tasks = context.tasksByProject[projectId] || [];
  const columns = {
    pending: tasks.filter((task) => task.status === "pending"),
    "in-progress": tasks.filter((task) => task.status === "in-progress"),
    completed: tasks.filter((task) => task.status === "completed"),
  };

  return {
    tasks,
    columns,
    loading: Boolean(context.tasksLoadingByProject[projectId]),
    fetchProjectTasks: context.fetchProjectTasks,
    createProjectTask: context.createProjectTask,
    updateProjectTask: context.updateProjectTask,
    deleteProjectTask: context.deleteProjectTask,
    updateTaskStatus: context.updateTaskStatus,
  };
}
