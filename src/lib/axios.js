import axios from "axios";
import { getToken, isTokenExpired, logoutLocal } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Attach Authorization header from localStorage (if token exists) and
// auto-logout if token is expired.
api.interceptors.request.use(
  (config) => {
    try {
      if (typeof window !== "undefined") {
        const token = getToken();
        if (token) {
          // if token expired, force logout immediately
          if (isTokenExpired(token)) {
            logoutLocal();
            return Promise.reject(new Error("Token expired"));
          }
          config.headers = config.headers || {};
          config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
        }
      }
    } catch (e) {
      // ignore localStorage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: if server returns 401, logout locally.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    try {
      const status = error?.response?.status;
      if (status === 401) {
        logoutLocal();
      }
    } catch (e) {
      // ignore
    }
    return Promise.reject(error);
  }
);

export default api;
