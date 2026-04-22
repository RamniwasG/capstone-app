"use client";

import { useState } from "react";
import { Layers, User, Lock } from "lucide-react";
import Link from "next/link";
import api from "@/lib/axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const initialFormState = {
  values: {
    username: "",
    password: "",
  },
  errors: {
    username: "",
    password: "",
  },
};

export default function SignIn() {
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const navigate = useRouter();

  function getFieldError(name, value) {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username is required";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return "";
      default:
        return "";
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      values: {
        ...current.values,
        [name]: value,
      },
      errors: {
        ...current.errors,
        [name]: current.errors[name] ? getFieldError(name, value) : "",
      },
    }));
  }

  function handleBlur(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      errors: {
        ...current.errors,
        [name]: getFieldError(name, value),
      },
    }));
  }

  function validateForm() {
    const nextErrors = {
      username: getFieldError("username", form.values.username),
      password: getFieldError("password", form.values.password),
    };

    setForm((current) => ({
      ...current,
      errors: nextErrors,
    }));

    return Object.values(nextErrors).every((error) => !error);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const payload = {
        username: form.values.username.trim(),
        password: form.values.password,
      };
      const response = await api.post("/auth/signin", payload);
      const token = response?.data?.token || response?.data?.accessToken;
      const user = response?.data?.user || response?.data?.data;

      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      toast.success(response?.data?.message || "Signed in successfully");

      if (navigate && typeof navigate.push === "function") {
        navigate.push("/dashboard");
      }
    } catch (error) {
      const message = error?.response?.data?.error || error.message || "Signin failed";
      setError(message);
      toast.error(message);
    }
  }

  function inputBorderClass(field) {
    return form.errors[field] ? "border-red-300" : "border-zinc-200";
  }

  return (
    <div className="min-h-screen flex w-full bg-zinc-50">
      <div className="hidden md:flex w-1/2 bg-gradient-to-br from-indigo-600 to-violet-600 text-white items-center justify-center">
        <div className="text-center px-8">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-white/10">
            <Layers className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Mini Jira: Team Task Mgt App</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold">Sign in</h2>
          </div>
          {error && <p className="text-sm text-center text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Username</label>
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${inputBorderClass("username")}`}>
                <User className="h-5 w-5 text-zinc-400" />
                <input
                  name="username"
                  value={form.values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                  placeholder="your username"
                />
              </div>
              {form.errors.username && (
                <p className="mt-1 text-sm text-red-600">{form.errors.username}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${inputBorderClass("password")}`}>
                <Lock className="h-5 w-5 text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  value={form.values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                  placeholder="password"
                />
              </div>
              {form.errors.password && (
                <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700"
            >
              Sign in
            </button>

            <p className="text-center text-sm text-zinc-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-indigo-600">
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
