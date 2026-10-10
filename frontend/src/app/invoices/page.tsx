
"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTIONIST";
type PaymentStatus = "UNPAID" | "PAID";

type Patient = {
  id: number;
  user?: { name?: string | null } | null;
};

type Appointment = {
  id: number;
  scheduledAt: string;
  patientId: number;
  doctorId: number;
  status?: string;
};

type Invoice = {
  id: number;
  amount: string | number;
  status: PaymentStatus;
  createdAt: string;
  patient?: {
    id?: number;
    user?: { name?: string | null } | null;
  } | null;
  appointment?: {
    id?: number;
    scheduledAt?: string;
  } | null;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [role, setRole] = useState<UserRole | null>(null);

  const [patientId, setPatientId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("UNPAID");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManageBilling =
    role === "ADMIN" || role === "RECEPTIONIST";

  async function loadData() {
    const token = localStorage.getItem("medcore_token");
    const storedUser = localStorage.getItem("medcore_user");

    if (!token || !storedUser) {
      window.location.href = "/";
      return;
    }

    let currentRole: UserRole;

    try {
      const user = JSON.parse(storedUser);
      currentRole = user.role as UserRole;

      if (
        !["ADMIN", "DOCTOR", "PATIENT", "RECEPTIONIST"].includes(
          currentRole,
        )
      ) {
        throw new Error("Invalid user role.");
      }

      setRole(currentRole);
    } catch {
      localStorage.removeItem("medcore_token");
      localStorage.removeItem("medcore_user");
      window.location.href = "/";
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured. Check frontend/.env.local.");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    setLoading(true);
    setError("");

    try {
      const requests: Promise<Response>[] = [
        fetch(`${API_URL}/invoices`, { headers }),
      ];

      if (
        currentRole === "ADMIN" ||
        currentRole === "RECEPTIONIST"
      ) {
        requests.push(fetch(`${API_URL}/patients`, { headers }));
        requests.push(fetch(`${API_URL}/appointments`, { headers }));
      }

      const responses = await Promise.all(requests);
      const invoicesResponse = responses[0];

      if (!invoicesResponse.ok) {
        throw new Error(
          `Invoices API failed (${invoicesResponse.status}).`,
        );
      }

      const invoicesData = await invoicesResponse.json();

      setInvoices(Array.isArray(invoicesData) ? invoicesData : []);

      if (
        currentRole === "ADMIN" ||
        currentRole === "RECEPTIONIST"
      ) {
        const patientsResponse = responses[1];
        const appointmentsResponse = responses[2];

        if (!patientsResponse.ok) {
          throw new Error(
            `Patients API failed (${patientsResponse.status}).`,
          );
        }

        if (!appointmentsResponse.ok) {
          throw new Error(
            `Appointments API failed (${appointmentsResponse.status}).`,
          );
        }

        const [patientsData, appointmentsData] = await Promise.all([
          patientsResponse.json(),
          appointmentsResponse.json(),
        ]);

        setPatients(Array.isArray(patientsData) ? patientsData : []);
        setAppointments(
          Array.isArray(appointmentsData) ? appointmentsData : [],
        );
      } else {
        setPatients([]);
        setAppointments([]);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load invoice data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageBilling) {
      setError("You are not authorized to create invoices.");
      return;
    }

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    if (!patientId || !amount.trim()) {
      setError("Please select a patient and enter an amount.");
      return;
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than 0.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: Number(patientId),
          appointmentId: appointmentId
            ? Number(appointmentId)
            : undefined,
          amount: numericAmount,
          status,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Failed to create invoice.",
        );
      }

      setPatientId("");
      setAppointmentId("");
      setAmount("");
      setStatus("UNPAID");

      await loadData();
      setSuccess("Invoice created successfully.");
    } catch (err) {
      console.error("Failed to create invoice:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create invoice.",
      );
    } finally {
      setCreating(false);
    }
  }

  // Save the new payment status through the backend.
  async function updateInvoiceStatus(invoice: Invoice) {
    if (!canManageBilling) {
      setError("You are not authorized to update payment status.");
      return;
    }

    if (updatingInvoiceId !== null) return;

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    const nextStatus: PaymentStatus =
      invoice.status === "PAID" ? "UNPAID" : "PAID";

    setUpdatingInvoiceId(invoice.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `${API_URL}/invoices/${invoice.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: nextStatus }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                `Failed to update invoice #${invoice.id}.`,
        );
      }

      // Reload from the API so the displayed status reflects the server.
      await loadData();

      setSuccess(
        `Invoice #${invoice.id} marked ${
          nextStatus === "PAID" ? "Paid" : "Unpaid"
        } successfully.`,
      );
    } catch (err) {
      console.error("Failed to update invoice status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update payment status.",
      );
    } finally {
      setUpdatingInvoiceId(null);
    }
  }

  function logout() {
    localStorage.removeItem("medcore_token");
    localStorage.removeItem("medcore_user");
    window.location.href = "/";
  }

  const selectedPatientAppointments = appointments.filter(
    (appointment) =>
      !patientId || appointment.patientId === Number(patientId),
  );

  const paidInvoices = invoices.filter(
    (invoice) => invoice.status === "PAID",
  );

  const unpaidInvoices = invoices.filter(
    (invoice) => invoice.status === "UNPAID",
  );

  const totalAmount = invoices.reduce(
    (total, invoice) => total + Number(invoice.amount),
    0,
  );

  const currency = (value: number | string) =>
    `₹${Number(value).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => {
              window.location.href = "/dashboard";
            }}
            className="group flex items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-xl shadow-md shadow-blue-200">
              🏥
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900">
                MedCore <span className="text-teal-600">HMS</span>
              </div>
              <div className="text-xs font-medium text-slate-500">
                Hospital Management System
              </div>
            </div>
          </button>

          <button
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 p-7 text-white shadow-xl shadow-blue-200">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10" />

          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
                💳
              </div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="mt-1 max-w-2xl text-sm text-blue-50 md:text-base">
                {canManageBilling
                  ? "Create and manage patient invoices, billing, and payment status."
                  : "View your billing history and invoice payment status."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-100">
                Total Invoices
              </div>
              <div className="mt-1 text-3xl font-bold">
                {invoices.length}
              </div>
            </div>
          </div>
        </section>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-500">
              Total Invoices
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {invoices.length}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-500">
              Paid
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {paidInvoices.length}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Unpaid
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {unpaidInvoices.length}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-500">
              Total Amount
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">
              {currency(totalAmount)}
            </div>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm"
          >
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm"
          >
            <span className="text-lg">✓</span>
            <span>{success}</span>
          </div>
        )}

        {canManageBilling && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500" />

            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg text-white shadow-sm">
                  💳
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create Invoice
                  </h2>
                  <p className="text-sm text-slate-500">
                    Add patient billing information and payment status.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={createInvoice}
              className="grid gap-5 p-6 md:grid-cols-2"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Patient
                </label>
                <select
                  required
                  value={patientId}
                  onChange={(event) => {
                    setPatientId(event.target.value);
                    setAppointmentId("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">Select patient</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.user?.name ?? `Patient #${patient.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Appointment
                </label>
                <select
                  value={appointmentId}
                  onChange={(event) =>
                    setAppointmentId(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">No appointment</option>
                  {selectedPatientAppointments.map((appointment) => (
                    <option key={appointment.id} value={appointment.id}>
                      Appointment #{appointment.id} —{" "}
                      {new Date(appointment.scheduledAt).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="e.g. 1500"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Payment Status
                </label>
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as PaymentStatus)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-4 md:col-span-2">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-500">
                  Invoice Amount
                </div>
                <div className="mt-1 text-2xl font-bold text-slate-900">
                  {currency(amount || 0)}
                </div>
              </div>

              <div className="flex items-center md:col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {creating ? "Creating..." : "Create Invoice"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500" />

          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {role === "PATIENT" ? "My Invoices" : "Invoice List"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {invoices.length} invoice
                {invoices.length === 1 ? "" : "s"} found.
              </p>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading || updatingInvoiceId !== null}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-indigo-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="text-sm font-medium text-slate-500">
                Loading invoices...
              </p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                💳
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No invoices found
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {role === "PATIENT"
                  ? "Your invoices will appear here when billing information is available."
                  : "Create the first invoice using the form above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-gradient-to-r from-blue-50 to-cyan-50 text-xs font-bold uppercase tracking-wider text-blue-700">
                  <tr>
                    <th className="px-6 py-4">Invoice ID</th>
                    {role !== "PATIENT" && (
                      <th className="px-6 py-4">Patient</th>
                    )}
                    <th className="px-6 py-4">Appointment</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    {canManageBilling && (
                      <th className="px-6 py-4">Action</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {invoices.map((invoice) => {
                    const isUpdating =
                      updatingInvoiceId === invoice.id;

                    return (
                      <tr
                        key={invoice.id}
                        className="group text-sm transition hover:bg-blue-50/40"
                      >
                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-indigo-100 px-3 py-1.5 font-bold text-indigo-700">
                            #{invoice.id}
                          </span>
                        </td>

                        {role !== "PATIENT" && (
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 font-bold text-white shadow-sm">
                                {(
                                  invoice.patient?.user?.name ??
                                  `P${invoice.patient?.id ?? ""}`
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {invoice.patient?.user?.name ??
                                    `Patient #${invoice.patient?.id ?? "—"}`}
                                </div>
                                <span className="text-xs text-blue-600">
                                  Patient
                                </span>
                              </div>
                            </div>
                          </td>
                        )}

                        <td className="px-6 py-5">
                          <span className="rounded-lg bg-slate-100 px-3 py-1.5 font-semibold text-slate-700">
                            {invoice.appointment?.id
                              ? `#${invoice.appointment.id}`
                              : "No appointment"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span className="font-bold text-slate-900">
                            {currency(invoice.amount)}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              invoice.status === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {invoice.status === "PAID"
                              ? "Paid"
                              : "Unpaid"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="whitespace-nowrap text-slate-700">
                            {new Date(
                              invoice.createdAt,
                            ).toLocaleDateString()}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {new Date(
                              invoice.createdAt,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>

                        {canManageBilling && (
                          <td className="px-6 py-5">
                            <button
                              type="button"
                              onClick={() =>
                                void updateInvoiceStatus(invoice)
                              }
                              disabled={
                                updatingInvoiceId !== null || loading
                              }
                              className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                invoice.status === "PAID"
                                  ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {isUpdating
                                ? "Saving..."
                                : invoice.status === "PAID"
                                  ? "Mark Unpaid"
                                  : "✓ Mark Paid"}
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

