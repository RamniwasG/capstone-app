"use client";

import { useState } from "react";
import { Layers, User, Lock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "react-toastify";
 
import { useRouter } from "next/navigation";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    // TODO: wire auth
    console.log("signin", { username, password });
    try {
      const payload = { username, password };
      const res = await api.post("/auth/signin", payload);
      // store token and user details if present
      const token = res?.data?.token || res?.data?.accessToken;
      const user = res?.data?.user || res?.data?.data;
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      toast.success(res?.data?.message || "Signed in successfully");
      // optional: redirect after signin
      if (navigate && typeof navigate.push === "function") navigate.push("/dashboard");
    } catch (err) {
      const message = err?.response?.data?.error || err.message || "Signin failed";
      toast.error(message);
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-zinc-50">
      {/* Left: Branding */}
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white items-center justify-center">
        <div className="text-center px-8">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/10">
            <Layers className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Mini Jira: Team Task Mgt App</h1>
        </div>
      </div>

      {/* Right: Sign in form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
          
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="text-sm text-zinc-500">Welcome back — please enter your details.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Username</label>
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                <User className="h-5 w-5 text-zinc-400" />
                <input
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="your username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                <Lock className="h-5 w-5 text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700"
            >
              Sign in
            </button>

            <p className="text-center text-sm text-zinc-500">
              Don&apos;t have an account? <Link href="/signup" className="font-medium text-indigo-600">Sign up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
