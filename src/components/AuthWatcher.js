"use client";

import { useEffect } from "react";
import { getToken, parseJwt, isTokenExpired, logoutLocal } from "@/lib/auth";

export default function AuthWatcher() {
  useEffect(() => {
    try {
      const token = getToken();
      if (!token) return;
      // if already expired, logout
      if (isTokenExpired(token)) {
        logoutLocal();
        return;
      }

      const payload = parseJwt(token);
      if (!payload || !payload.exp) return;
      const expiryMs = payload.exp * 1000;
      const now = Date.now();
      const timeout = expiryMs - now;
      if (timeout <= 0) {
        logoutLocal();
        return;
      }

      const id = setTimeout(() => {
        logoutLocal();
      }, timeout + 500); // small buffer

      return () => clearTimeout(id);
    } catch (e) {
      // ignore
    }
  }, []);

  return null;
}
