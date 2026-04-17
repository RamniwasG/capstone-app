"use client";

import { useState } from "react";
import { UserPlus, Mail, Lock, Phone } from "lucide-react";
import Link from "next/link";
import api from "../../lib/axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  const navigate = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    // basic validation
    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    setEmailError("");
    if (!validatePhone(phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setPhoneError("");
    // password strength
    if (!validatePassword(password)) {
      setPasswordError("Password must be 8+ chars, includes atleast one upper, lower, number, special");
      return;
    }
    setPasswordError("");

    if (password !== confirmPassword) {
      setConfirmError("Passwords do not match");
      return;
    }
    setConfirmError("");

    try {
      const payload = { username, email, password, phone, role };
      const res = await api.post("/auth/signup", payload);
      toast.success(res?.data?.message || "Account created");
        
      // optional: redirect after signup
      navigate.push("/");
    } catch (err) {
      const message = err?.response?.data?.error || err.message || "Signup failed";
      toast.error(message);
    }
  }

  function validatePhone(value) {
    if (!value) return false;
    // strip non-digits
    const digits = value.replace(/[^0-9]/g, "");
    let normalized = digits;
    // handle +91 or leading 91 country code
    if (normalized.length === 12 && normalized.startsWith("91")) {
      normalized = normalized.slice(2);
    } else if (normalized.length === 11 && normalized.startsWith("0")) {
      // leading 0 + 10 digits
      normalized = normalized.slice(1);
    }
    // Indian mobile numbers: exactly 10 digits starting with 6-9
    return normalized.length === 10 && /^[6-9][0-9]{9}$/.test(normalized);
  }

  function validateEmail(value) {
    if (!value) return false;
    // simple RFC-like check
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  }

  function validatePassword(value) {
    // min 8, 1 uppercase, 1 lowercase, 1 number, 1 special
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return re.test(value);
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
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                <UserPlus className="h-5 w-5 text-zinc-400" />
                <input
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="enter your username"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                <Mail className="h-5 w-5 text-zinc-400" />
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => {
                      if (e.target.value && !validateEmail(e.target.value)) setEmailError("Enter a valid email address");
                      else setEmailError("");
                    }}
                    className="w-full bg-transparent outline-none"
                    placeholder="you@company.com"
                  />
              </div>
            </div>
              {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
              <div className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2">
                <Lock className="h-5 w-5 text-zinc-400" />
                <input
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value && !validatePassword(e.target.value)) setPasswordError("Password must be 8+ chars, includes atleast one upper, lower, number, special");
                    else setPasswordError("");
                  }}
                  className="w-full bg-transparent outline-none"
                  placeholder="create a password"
                />
              </div>
              {passwordError && <p className="mt-1 text-sm text-red-600">{passwordError}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Confirm password</label>
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${confirmError ? 'border border-red-300' : 'border border-zinc-200'}`}>
                <Lock className="h-5 w-5 text-zinc-400" />
                <input
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={(e) => {
                    if (password && e.target.value !== password) setConfirmError("Passwords do not match");
                    else setConfirmError("");
                  }}
                  className="w-full bg-transparent outline-none"
                  placeholder="confirm password"
                />
              </div>
              {confirmError && <p className="mt-1 text-sm text-red-600">{confirmError}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Role</label>
              <div className="rounded-md border border-zinc-200 px-3 py-2">
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="">Choose role</option>
                  <option value="member">member</option>
                  <option value="admin">admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Phone</label>
              <div className={`flex items-center gap-2 rounded-md px-3 py-2 ${phoneError ? 'border border-red-300' : 'border border-zinc-200'}`}>
                <Phone className="h-5 w-5 text-zinc-400" />
                <input
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value && !validatePhone(e.target.value)) setPhoneError("Enter a valid phone number with 10 digits only");
                    else setPhoneError("");
                  }}
                  className="w-full bg-transparent outline-none"
                  placeholder="+91 555 555 5555"
                />
              </div>
              {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
            </div>

            <button type="submit" className="w-full rounded-md bg-indigo-600 py-2 text-white hover:bg-indigo-700">Create account</button>

            <p className="text-center text-sm text-zinc-500">Already a member? <Link href="/" className="font-medium text-indigo-600">Sign in</Link></p>
          </form>
        </div>
      </div>
    </div>
  );
}
