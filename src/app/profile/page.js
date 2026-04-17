"use client";

import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { User } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      setUser(null);
    }
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Not signed in.</p>
          <Link href="/">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded bg-white p-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-zinc-100 p-3">
            <User className="h-8 w-8 text-zinc-700" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.name || user.username}</h2>
            <p className="text-sm text-zinc-500">{user.role || "member"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs text-zinc-500">Email</div>
            <div className="font-medium">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Phone</div>
            <div className="font-medium">{user.phone || "-"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">Joined</div>
            <div className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">ID</div>
            <div className="font-mono text-xs break-all">{user._id || user.id || "-"}</div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <Link href="/dashboard" className="px-3 py-2">Back</Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
