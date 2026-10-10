
"use client";

import { useEffect, useMemo, useState } from "react";

type Doctor = {
  id: number;
  specialization?: string | null;
  name?: string | null;
  email?: string | null;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
  } | null;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [userRole, setUserRole] = useState("");
  const [showAddDoctor, setShowAddDoctor] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "",
  });

  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  async function loadDoctors() {
    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "")}/doctors`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("medcore_token");
        localStorage.removeItem("medcore_user");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(`Doctors API returned ${response.status}`);
      }

      const data = await response.json();

      const doctorList = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setDoctors(doctorList);
    } catch (err) {
      console.error("Failed to load doctors:", err);
      setError("Unable to load doctors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("medcore_user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role ?? "");
      } catch {
        setUserRole("");
      }
    }

    loadDoctors();
  }, []);

  function logout() {
    localStorage.removeItem("medcore_token");
    localStorage.removeItem("medcore_user");
    window.location.href = "/";
  }

  async function createDoctor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(form),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("medcore_token");
        localStorage.removeItem("medcore_user");
        window.location.href = "/";
        return;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message ?? "Unable to create doctor.";

        throw new Error(message);
      }

      setCreateSuccess(
        `${form.name} was created successfully.`,
      );

      setForm({
        name: "",
        email: "",
        password: "",
        specialization: "",
      });

      setShowPassword(false);

      await loadDoctors();
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Unable to create doctor.",
      );
    } finally {
      setCreating(false);
    }
  }

  const filteredDoctors = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return doctors;
    }

    return doctors.filter((doctor) => {
      const name =
        doctor.user?.name?.toLowerCase() ??
        doctor.name?.toLowerCase() ??
        "";

      const email =
        doctor.user?.email?.toLowerCase() ??
        doctor.email?.toLowerCase() ??
        "";

      const specialization =
        doctor.specialization?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        specialization.includes(query)
      );
    });
  }, [doctors, search]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-xl shadow-lg shadow-teal-500/20">
              🏥
            </div>

            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                MedCore
                <span className="text-teal-500"> HMS</span>
              </h1>

              <p className="text-xs font-medium text-slate-400">
                Hospital Management System
              </p>
            </div>
          </button>

          <button
            onClick={logout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-500 p-8 text-white shadow-xl shadow-teal-500/15">
          <div className="relative z-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
              🩺
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-teal-100">
              Medical staff
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight">
              Doctors
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-teal-100">
              View registered doctors, manage medical staff, and
              add new doctor accounts.
            </p>
          </div>

          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />
          <div className="absolute -bottom-28 right-32 h-56 w-56 rounded-full bg-emerald-300/20" />
        </section>

        {userRole === "ADMIN" && (
          <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400" />

            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Doctor Management
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new doctor account and assign a medical specialization.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowAddDoctor((value) => !value);
                  setCreateError("");
                  setCreateSuccess("");
                }}
                className="rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                {showAddDoctor ? "Close Form" : "+ Add Doctor"}
              </button>
            </div>

            {showAddDoctor && (
              <form
                onSubmit={createDoctor}
                className="grid gap-5 p-6 md:grid-cols-2"
              >
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        name: event.target.value,
                      })
                    }
                    placeholder="Dr. John Smith"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        email: event.target.value,
                      })
                    }
                    placeholder="doctor@hospital.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          password: event.target.value,
                        })
                      }
                      placeholder="Minimum 6 characters"
                      minLength={6}
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      title={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? "👁️‍🗨️" : "👁️"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Specialization
                  </label>

                  <input
                    type="text"
                    value={form.specialization}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        specialization: event.target.value,
                      })
                    }
                    placeholder="General Medicine"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                {createError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 md:col-span-2">
                    ⚠️ {createError}
                  </div>
                )}

                {createSuccess && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 md:col-span-2">
                    ✅ {createSuccess}
                  </div>
                )}

                <div className="flex justify-end md:col-span-2">
                  <button
                    type="submit"
                    disabled={creating}
                    className="rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creating ? "Creating Doctor..." : "Create Doctor"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg">
                🔎
              </span>

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, email, or specialization..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <button
              onClick={loadDoctors}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />

            <p className="text-sm font-medium text-slate-500">
              Loading doctors...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
            <div className="mb-2 text-3xl">⚠️</div>

            <p className="font-semibold">{error}</p>

            <button
              onClick={loadDoctors}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-3xl">
              🩺
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              No doctors found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-400" />

            <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Registered Doctors
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-teal-600">
                    {filteredDoctors.length}
                  </span>{" "}
                  of {doctors.length} doctors
                </p>
              </div>

              <div className="rounded-full bg-teal-50 px-4 py-2 text-xs font-bold text-teal-700">
                {doctors.length} Total
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Specialization</th>
                    <th className="px-6 py-4">Doctor ID</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredDoctors.map((doctor) => (
                    <tr
                      key={doctor.id}
                      className="text-sm transition hover:bg-teal-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 font-bold text-white shadow-sm">
                            {(doctor.user?.name ??
                              doctor.name ??
                              "D")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {doctor.user?.name ??
                                doctor.name ??
                                "—"}
                            </p>

                            <p className="text-xs text-slate-400">
                              Doctor #{doctor.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {doctor.user?.email ??
                          doctor.email ??
                          "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                          {doctor.specialization ?? "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700">
                          #{doctor.id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

