
"use client";

import { useEffect, useMemo, useState } from "react";

type Patient = {
  id: number;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

type PatientForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  address: string;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<PatientForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    dateOfBirth: "",
    address: "",
  });

  async function loadPatients() {
    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients`,
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
        throw new Error(`Failed to load patients (${response.status})`);
      }

      const data = await response.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Unable to load patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("medcore_user");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setRole(user.role ?? "");
      } catch {
        setRole("");
      }
    }

    loadPatients();
  }, []);

  async function createPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setCreating(true);
    setSuccess("");
    setFormError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/patients`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            password: form.password,
            phone: form.phone || undefined,
            dateOfBirth: form.dateOfBirth || undefined,
            address: form.address || undefined,
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("medcore_token");
        localStorage.removeItem("medcore_user");
        window.location.href = "/";
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        if (Array.isArray(data?.message)) {
          throw new Error(data.message.join(", "));
        }

        throw new Error(data?.message || "Unable to create patient.");
      }

      setForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        dateOfBirth: "",
        address: "",
      });

      setShowPassword(false);
      setSuccess(
        `Patient account for ${data?.user?.name ?? "the patient"} created successfully.`,
      );

      await loadPatients();
    } catch (err) {
      console.error(err);
      setFormError(
        err instanceof Error
          ? err.message
          : "Unable to create patient.",
      );
    } finally {
      setCreating(false);
    }
  }

  function logout() {
    localStorage.removeItem("medcore_token");
    localStorage.removeItem("medcore_user");
    window.location.href = "/";
  }

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) => {
      const name = patient.user?.name?.toLowerCase() ?? "";
      const email = patient.user?.email?.toLowerCase() ?? "";
      const phone = patient.phone?.toLowerCase() ?? "";
      const address = patient.address?.toLowerCase() ?? "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query) ||
        address.includes(query)
      );
    });
  }, [patients, search]);

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl shadow-lg shadow-blue-500/20">
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
        <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 p-8 text-white shadow-xl shadow-blue-500/15">
          <div className="relative z-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-3xl backdrop-blur">
              👥
            </div>

            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-blue-100">
              Patient management
            </p>

            <h2 className="text-3xl font-extrabold tracking-tight">
              Patients
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100">
              Register patients, manage patient accounts, and search
              hospital profiles and contact information.
            </p>
          </div>

          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/10" />

          <div className="absolute -bottom-28 right-32 h-56 w-56 rounded-full bg-cyan-300/20" />
        </section>

        {(role === "ADMIN" || role === "RECEPTIONIST") && (
          <section className="mb-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500" />

            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-xl">
                  ➕
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Add New Patient
                  </h3>

                  <p className="text-sm text-slate-500">
                    Create a patient profile and login account.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={createPatient} className="p-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                    placeholder="Enter patient name"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                    placeholder="patient@example.com"
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
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
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phone
                  </label>

                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        phone: event.target.value,
                      })
                    }
                    placeholder="Enter phone number"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        dateOfBirth: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Address
                  </label>

                  <input
                    type="text"
                    value={form.address}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        address: event.target.value,
                      })
                    }
                    placeholder="Enter patient address"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                  />
                </div>
              </div>

              {formError && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  ⚠️ {formError}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  ✅ {success}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creating ? "Creating Patient..." : "＋ Create Patient"}
                </button>
              </div>
            </form>
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
                placeholder="Search by name, email, phone, or address..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
              />
            </div>

            <button
              onClick={loadPatients}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-500" />

            <p className="text-sm font-medium text-slate-500">
              Loading patients...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-700 shadow-sm">
            <div className="mb-2 text-3xl">⚠️</div>

            <p className="font-semibold">{error}</p>

            <button
              onClick={loadPatients}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
              👥
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              No patients found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Try changing your search.
            </p>
          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

            <div className="flex flex-col gap-2 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Registered Patients
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-bold text-blue-600">
                    {filteredPatients.length}
                  </span>{" "}
                  of {patients.length} patients
                </p>
              </div>

              <div className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600">
                {patients.length} Total
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Patient</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Phone</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4">Patient ID</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="text-sm transition hover:bg-blue-50/40"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 font-bold text-white shadow-sm">
                            {patient.user?.name
                              ?.charAt(0)
                              .toUpperCase() ?? "P"}
                          </div>

                          <div>
                            <p className="font-bold text-slate-900">
                              {patient.user?.name ?? "—"}
                            </p>

                            <p className="text-xs text-slate-400">
                              Patient #{patient.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {patient.user?.email ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
                          {patient.phone ?? "—"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {patient.address ?? "—"}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          #{patient.id}
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
