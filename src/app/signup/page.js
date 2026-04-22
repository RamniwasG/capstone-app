"use client";

import { useState } from "react";
import { UserPlus, Mail, Lock, Phone } from "lucide-react";
import Link from "next/link";
import api from "../../lib/axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const initialFormState = {
  values: {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
  },
  errors: {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
    phone: "",
  },
};

export default function Signup() {
  const [form, setForm] = useState(initialFormState);
  const navigate = useRouter();

  function validatePhone(value) {
    if (!value) return false;
    const digits = value.replace(/[^0-9]/g, "");
    let normalized = digits;

    if (normalized.length === 12 && normalized.startsWith("91")) {
      normalized = normalized.slice(2);
    } else if (normalized.length === 11 && normalized.startsWith("0")) {
      normalized = normalized.slice(1);
    }

    return normalized.length === 10 && /^[6-9][0-9]{9}$/.test(normalized);
  }

  function validateEmail(value) {
    if (!value) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validatePassword(value) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(value);
  }

  function getFieldError(name, value, values) {
    switch (name) {
      case "username":
        if (!value.trim()) return "Username is required";
        if (value.trim().length < 3) return "Username must be at least 3 characters";
        return "";
      case "email":
        if (!value.trim()) return "Email is required";
        if (!validateEmail(value.trim())) return "Enter a valid email address";
        return "";
      case "password":
        if (!value) return "Password is required";
        if (!validatePassword(value)) {
          return "Password must be 8+ chars with upper, lower, number, and special character";
        }
        return "";
      case "confirmPassword":
        if (!value) return "Confirm password is required";
        if (value !== values.password) return "Passwords do not match";
        return "";
      case "role":
        if (!value) return "Role is required";
        return "";
      case "phone":
        if (!value.trim()) return "Phone number is required";
        if (!validatePhone(value.trim())) return "Enter a valid 10-digit Indian mobile number";
        return "";
      default:
        return "";
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const nextValues = {
        ...current.values,
        [name]: value,
      };

      const nextErrors = {
        ...current.errors,
        [name]: current.errors[name] ? getFieldError(name, value, nextValues) : "",
      };

      if (name === "password" && current.errors.confirmPassword) {
        nextErrors.confirmPassword = getFieldError(
          "confirmPassword",
          nextValues.confirmPassword,
          nextValues
        );
      }

      return {
        values: nextValues,
        errors: nextErrors,
      };
    });
  }

  function handleBlur(event) {
    const { name, value } = event.target;

    setForm((current) => {
      const nextValues = {
        ...current.values,
        [name]: value,
      };

      const nextErrors = {
        ...current.errors,
        [name]: getFieldError(name, value, nextValues),
      };

      if (name === "password" && nextValues.confirmPassword) {
        nextErrors.confirmPassword = getFieldError(
          "confirmPassword",
          nextValues.confirmPassword,
          nextValues
        );
      }

      return {
        values: nextValues,
        errors: nextErrors,
      };
    });
  }

  function validateForm() {
    const nextErrors = Object.keys(form.values).reduce((accumulator, key) => {
      accumulator[key] = getFieldError(key, form.values[key], form.values);
      return accumulator;
    }, {});

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
        email: form.values.email.trim(),
        password: form.values.password,
        phone: form.values.phone.trim(),
        role: form.values.role,
      };
      const response = await api.post("/auth/signup", payload);
      toast.success(response?.data?.message || "Account created");
      navigate.push("/");
    } catch (error) {
      const message = error?.response?.data?.error || error.message || "Signup failed";
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
            <UserPlus className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Mini Jira: Team Task Mgt App</h1>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold">Create account</h2>
            <p className="text-sm text-zinc-500">Start your team task management journey.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Username</label>
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${inputBorderClass("username")}`}>
                <UserPlus className="h-5 w-5 text-zinc-400" />
                <input
                  name="username"
                  value={form.values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                  placeholder="enter your username"
                />
              </div>
              {form.errors.username && (
                <p className="mt-1 text-sm text-red-600">{form.errors.username}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${inputBorderClass("email")}`}>
                <Mail className="h-5 w-5 text-zinc-400" />
                <input
                  name="email"
                  type="email"
                  value={form.values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                  placeholder="you@company.com"
                />
              </div>
              {form.errors.email && <p className="mt-1 text-sm text-red-600">{form.errors.email}</p>}
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
                  placeholder="create a password"
                />
              </div>
              {form.errors.password && (
                <p className="mt-1 text-sm text-red-600">{form.errors.password}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Confirm password
              </label>
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${inputBorderClass("confirmPassword")}`}>
                <Lock className="h-5 w-5 text-zinc-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={form.values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                  placeholder="confirm password"
                />
              </div>
              {form.errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{form.errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Role</label>
              <div className={`rounded-md border px-3 py-2 ${inputBorderClass("role")}`}>
                <select
                  name="role"
                  value={form.values.role}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="">Choose role</option>
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              {form.errors.role && <p className="mt-1 text-sm text-red-600">{form.errors.role}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
              <div className={`flex items-center gap-2 rounded-md border px-3 py-2 ${inputBorderClass("phone")}`}>
                <Phone className="h-5 w-5 text-zinc-400" />
                <input
                  name="phone"
                  value={form.values.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-full bg-transparent outline-none"
                  placeholder="+91 XXX XXX XXXX"
                />
              </div>
              {form.errors.phone && <p className="mt-1 text-sm text-red-600">{form.errors.phone}</p>}
            </div>

            <button type="submit" className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700">
              Create account
            </button>

            <p className="text-center text-sm text-zinc-500">
              Already a member? <Link href="/signin" className="font-medium text-indigo-600">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
