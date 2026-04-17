"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ className }) {
  const router = useRouter();

  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {
      // ignore
    }
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      className={"inline-flex items-center gap-2 rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700 " + (className || "")}
    >
      <LogOut className="h-4 w-4" /> Logout
    </button>
  );
}
