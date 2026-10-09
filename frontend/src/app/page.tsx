
"use client";

import { FormEvent, useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@medcore.test");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Invalid email or password",
        );
      }

      localStorage.setItem(
        "medcore_token",
        data.access_token,
      );

      localStorage.setItem(
        "medcore_user",
        JSON.stringify(data.user),
      );

      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Login failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to login. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-slate-100">
      {/* Decorative background */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-2">
          {/* Left panel */}
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-700 via-indigo-600 to-teal-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />

            <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-teal-300/10" />

            <div className="relative">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
                  🏥
                </div>

                <div>
                  <h1 className="text-2xl font-extrabold">
                    MedCore
                    <span className="text-teal-200">
                      {" "}
                      HMS
                    </span>
                  </h1>

                  <p className="text-xs font-medium text-blue-100">
                    Hospital Management System
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-teal-200">
                Smarter healthcare management
              </p>

              <h2 className="text-4xl font-extrabold leading-tight">
                Everything your hospital needs,
                <span className="text-teal-200">
                  {" "}
                  in one place.
                </span>
              </h2>

              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">
                Manage patients, doctors, appointments, clinical
                records, prescriptions and billing through a
                secure centralized system.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                {[
                  "Patient management",
                  "Appointments",
                  "Medical records",
                  "Billing & invoices",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-medium backdrop-blur"
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>

            <p className="relative text-xs text-blue-200">
              Secure • Reliable • Healthcare focused
            </p>
          </section>

          {/* Login panel */}
          <section className="p-8 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-md">
              {/* Mobile logo */}
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 text-xl shadow-lg">
                  🏥
                </div>

                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    MedCore
                    <span className="text-teal-500">
                      {" "}
                      HMS
                    </span>
                  </h1>

                  <p className="text-xs text-slate-400">
                    Hospital Management System
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-2 text-sm font-bold uppercase tracking-wider text-teal-600">
                  Welcome back
                </p>

                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                  Sign in to MedCore
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your credentials to access the hospital
                  management dashboard.
                </p>
              </div>

              {error && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-20 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in to MedCore"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-medium text-slate-400">
                  Demo access
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                  Admin account
                </p>

                <p className="mt-2 text-sm text-slate-700">
                  <span className="font-semibold">
                    Email:
                  </span>{" "}
                  admin@medcore.test
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  <span className="font-semibold">
                    Password:
                  </span>{" "}
                  password123
                </p>
              </div>

              <p className="mt-8 text-center text-xs text-slate-400">
                © 2026 MedCore HMS
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

