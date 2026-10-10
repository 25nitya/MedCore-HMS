
"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = "ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTIONIST";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

type Patient = {
  id: number;
  user?: { name?: string | null; email?: string | null } | null;
};

type Doctor = {
  id: number;
  specialization?: string | null;
  user?: { name?: string | null; email?: string | null } | null;
};

type Appointment = {
  id: number;
  scheduledAt: string;
  status: string;
  reason?: string | null;
  notes?: string | null;
  patient?: {
    id?: number;
    user?: { name?: string | null } | null;
  } | null;
  doctor?: {
    id?: number;
    specialization?: string | null;
    user?: { name?: string | null } | null;
  } | null;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export default function AppointmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [scheduledAt, setScheduledAt] = useState("");
  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const role = user?.role;
  const isPatient = role === "PATIENT";
  const isDoctor = role === "DOCTOR";
  const canManageAll = role === "ADMIN" || role === "RECEPTIONIST";

  const canCreateAppointment =
    role === "ADMIN" ||
    role === "RECEPTIONIST" ||
    role === "PATIENT";

  const canUpdateStatus = isDoctor || canManageAll;

  async function loadData() {
    const token = localStorage.getItem("medcore_token");
    const storedUser = localStorage.getItem("medcore_user");

    if (!token || !storedUser) {
      window.location.href = "/";
      return;
    }

    let currentUser: User;

    try {
      currentUser = JSON.parse(storedUser);

      if (
        !currentUser ||
        !["ADMIN", "DOCTOR", "PATIENT", "RECEPTIONIST"].includes(
          currentUser.role,
        )
      ) {
        throw new Error("Invalid user session.");
      }

      setUser(currentUser);
    } catch {
      localStorage.removeItem("medcore_token");
      localStorage.removeItem("medcore_user");
      window.location.href = "/";
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    setLoading(true);
    setError("");

    try {
      const appointmentsResponse = await fetch(`${API_URL}/appointments`, {
        headers,
      });

      if (!appointmentsResponse.ok) {
        throw new Error(
          `Unable to load appointments (${appointmentsResponse.status}).`,
        );
      }

      const appointmentsData = await appointmentsResponse.json();

      setAppointments(
        Array.isArray(appointmentsData) ? appointmentsData : [],
      );

      if (currentUser.role === "DOCTOR") {
        setDoctors([]);
        setPatients([]);
        return;
      }

      const doctorsResponse = await fetch(`${API_URL}/doctors`, {
        headers,
      });

      if (!doctorsResponse.ok) {
        throw new Error(
          `Unable to load doctors (${doctorsResponse.status}).`,
        );
      }

      const doctorsData = await doctorsResponse.json();
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

      if (currentUser.role === "PATIENT") {
        const profileResponse = await fetch(`${API_URL}/patients/me`, {
          headers,
        });

        if (!profileResponse.ok) {
          throw new Error(
            `Unable to load your patient profile (${profileResponse.status}).`,
          );
        }

        const profileData = await profileResponse.json();

        if (!profileData?.id) {
          throw new Error("Your patient profile could not be identified.");
        }

        setPatients([profileData]);
        setPatientId(String(profileData.id));
      } else {
        const patientsResponse = await fetch(`${API_URL}/patients`, {
          headers,
        });

        if (!patientsResponse.ok) {
          throw new Error(
            `Unable to load patients (${patientsResponse.status}).`,
          );
        }

        const patientsData = await patientsResponse.json();
        setPatients(Array.isArray(patientsData) ? patientsData : []);
      }
    } catch (err) {
      console.error("Failed to load appointment data:", err);
      setError(
        err instanceof Error ? err.message : "Unable to load appointment data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function updateAppointmentStatus(appointment: Appointment) {
    if (!canUpdateStatus || appointment.status !== "SCHEDULED") return;

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingId(appointment.id);

    try {
      const response = await fetch(
        `${API_URL}/appointments/${appointment.id}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "COMPLETED" }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                `Could not update appointment (${response.status}).`,
        );
      }

      // Use the status returned by the server.
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id ? { ...item, ...data } : item,
        ),
      );

      setSuccess(`Appointment #${appointment.id} marked as completed.`);
      await loadData();
    } catch (err) {
      console.error("Failed to update appointment status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save appointment status.",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function createAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    setError("");
    setSuccess("");

    if (!canCreateAppointment) {
      setError("Your account cannot create appointments.");
      return;
    }

    if (!doctorId || !scheduledAt) {
      setError("Please select a doctor and appointment date/time.");
      return;
    }

    if (!patientId) {
      setError(
        isPatient
          ? "Your patient profile could not be identified."
          : "Please select a patient.",
      );
      return;
    }

    const appointmentDate = new Date(scheduledAt);

    if (Number.isNaN(appointmentDate.getTime())) {
      setError("Please select a valid appointment date and time.");
      return;
    }

    if (appointmentDate.getTime() <= Date.now()) {
      setError("Please choose a future appointment date and time.");
      return;
    }

    setCreating(true);

    try {
      const response = await fetch(`${API_URL}/appointments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          scheduledAt: appointmentDate.toISOString(),
          reason: reason.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Failed to create appointment.",
        );
      }

      setSuccess("Appointment created successfully.");
      setScheduledAt("");
      setDoctorId("");
      setReason("");

      if (!isPatient) setPatientId("");

      await loadData();
    } catch (err) {
      console.error("Failed to create appointment:", err);
      setError(
        err instanceof Error ? err.message : "Unable to create appointment.",
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

  function goDashboard() {
    window.location.href = "/dashboard";
  }

  function getInitials(name?: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  function getStatusStyle(status: string) {
    if (status === "COMPLETED") {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }

    if (status === "CANCELLED") {
      return "bg-red-50 text-red-700 border-red-200";
    }

    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  function renderStatusAction(appointment: Appointment) {
    if (!canUpdateStatus || appointment.status !== "SCHEDULED") return null;

    return (
      <button
        type="button"
        onClick={() => void updateAppointmentStatus(appointment)}
        disabled={updatingId !== null}
        className="mt-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {updatingId === appointment.id ? "Saving..." : "✓ Mark Completed"}
      </button>
    );
  }

  const scheduledCount = appointments.filter(
    (item) => item.status === "SCHEDULED",
  ).length;

  const completedCount = appointments.filter(
    (item) => item.status === "COMPLETED",
  ).length;

  const appointmentStats = isDoctor
    ? [
        {
          label: "My Appointments",
          value: appointments.length,
          icon: "📅",
          color: "bg-blue-50 text-blue-600",
          description: "Appointments assigned to you",
        },
        {
          label: "Scheduled",
          value: scheduledCount,
          icon: "🗓️",
          color: "bg-emerald-50 text-emerald-600",
          description: "Upcoming scheduled visits",
        },
        {
          label: "Completed",
          value: completedCount,
          icon: "✓",
          color: "bg-violet-50 text-violet-600",
          description: "Completed appointments",
        },
      ]
    : [
        {
          label: isPatient ? "My Appointments" : "Total Appointments",
          value: appointments.length,
          icon: "📅",
          color: "bg-blue-50 text-blue-600",
          description: isPatient ? "Your appointment records" : "Appointment records",
        },
        {
          label: "Available Doctors",
          value: doctors.length,
          icon: "🩺",
          color: "bg-indigo-50 text-indigo-600",
          description: "Doctors available",
        },
        {
          label: "Scheduled",
          value: scheduledCount,
          icon: "✓",
          color: "bg-emerald-50 text-emerald-600",
          description: "Active appointments",
        },
        {
          label: "Completed",
          value: completedCount,
          icon: "✔",
          color: "bg-violet-50 text-violet-600",
          description: "Completed appointments",
        },
      ];

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <button onClick={goDashboard} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md shadow-blue-200">
              M
            </div>
            <div className="text-left">
              <p className="text-lg font-bold tracking-tight text-slate-900">
                MedCore HMS
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Hospital Management
              </p>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
            )}
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
              {getInitials(user?.name)}
            </div>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm">
          <button onClick={goDashboard} className="text-slate-400 hover:text-blue-600">
            Dashboard
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-slate-700">Appointments</span>
        </div>

        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 px-6 py-7 text-white shadow-lg shadow-blue-100 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                {isPatient
                  ? "PATIENT PORTAL"
                  : isDoctor
                    ? "DOCTOR WORKSPACE"
                    : "HOSPITAL OPERATIONS"}
              </div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {isPatient
                  ? "My Appointments"
                  : isDoctor
                    ? "My Appointment Schedule"
                    : "Appointment Management"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                {isPatient
                  ? "View your upcoming visits and schedule appointments with our doctors."
                  : isDoctor
                    ? "Review your assigned appointments, upcoming visits, and completed consultations."
                    : "Schedule, monitor and manage hospital appointments from one place."}
              </p>
            </div>
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-md transition hover:bg-blue-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">Unable to complete the request</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <p className="font-semibold">Success</p>
            <p className="mt-1">{success}</p>
          </div>
        )}

        {!loading && (
          <section
            className={`mb-8 grid gap-4 sm:grid-cols-2 ${
              isDoctor ? "lg:grid-cols-3" : "lg:grid-cols-4"
            }`}
          >
            {appointmentStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${stat.color}`}>
                    {stat.icon}
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">{stat.description}</p>
              </div>
            ))}
          </section>
        )}

        {canCreateAppointment && (
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                  📅
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {isPatient ? "Book an Appointment" : "Create Appointment"}
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {isPatient
                      ? "Choose a doctor and convenient time for your visit."
                      : "Create a new appointment for a patient."}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={createAppointment} className="grid gap-5 p-6 sm:p-7 md:grid-cols-2">
              {!isPatient ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Patient</label>
                  <select
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    required
                  >
                    <option value="">Select patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.user?.name ?? `Patient #${patient.id}`}
                        {patient.user?.email ? ` — ${patient.user.email}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Patient</label>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                    <p className="text-sm font-semibold text-blue-900">
                      {patients[0]?.user?.name ?? user?.name ?? "Current patient"}
                    </p>
                    <p className="mt-1 text-xs text-blue-600">
                      Appointment will be booked for your account.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Doctor</label>
                <select
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  required
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.name ?? `Doctor #${doctor.id}`}
                      {doctor.specialization ? ` — ${doctor.specialization}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
                    .toISOString()
                    .slice(0, 16)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="e.g. General consultation"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={creating || loading}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-100 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : isPatient ? "Book Appointment" : "Create Appointment"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:px-7">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isPatient
                  ? "My Appointment History"
                  : isDoctor
                    ? "My Assigned Appointments"
                    : "Appointment List"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {appointments.length} appointment{appointments.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              {isPatient ? "Personal records" : isDoctor ? "Your schedule" : "Hospital records"}
            </div>
          </div>

          {loading ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
              <p className="text-sm text-slate-500">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
                📅
              </div>
              <h3 className="font-semibold text-slate-900">No appointments yet</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                {isPatient
                  ? "Book your first appointment using the form above."
                  : isDoctor
                    ? "Appointments assigned to you will appear here."
                    : "Appointments will appear here once they are created."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {!isPatient && <th className="px-6 py-4">Patient</th>}
                      <th className="px-6 py-4">Doctor</th>
                      <th className="px-6 py-4">Date &amp; Time</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Status / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appointment) => (
                      <tr key={appointment.id} className="transition hover:bg-slate-50/80">
                        {!isPatient && (
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-600">
                                {getInitials(appointment.patient?.user?.name)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {appointment.patient?.user?.name ??
                                    `Patient #${appointment.patient?.id ?? "—"}`}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">Patient</p>
                              </div>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold text-slate-900">
                            {appointment.doctor?.user?.name ??
                              `Doctor #${appointment.doctor?.id ?? "—"}`}
                          </p>
                          {appointment.doctor?.specialization && (
                            <p className="mt-1 text-xs text-slate-500">
                              {appointment.doctor.specialization}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-sm font-medium text-slate-800">
                            {new Date(appointment.scheduledAt).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {new Date(appointment.scheduledAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="max-w-xs px-6 py-5">
                          <p className="truncate text-sm text-slate-600">
                            {appointment.reason ?? "No reason provided"}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(appointment.status)}`}>
                            {appointment.status}
                          </span>
                          {renderStatusAction(appointment)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {appointment.doctor?.user?.name ??
                            `Doctor #${appointment.doctor?.id ?? "—"}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {appointment.doctor?.specialization ?? "Medical consultation"}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </div>

                    {!isPatient && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Patient
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {appointment.patient?.user?.name ??
                            `Patient #${appointment.patient?.id ?? "—"}`}
                        </p>
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</p>
                        <p className="mt-1 text-xs text-slate-700">
                          {new Date(appointment.scheduledAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Time</p>
                        <p className="mt-1 text-xs text-slate-700">
                          {new Date(appointment.scheduledAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Reason</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {appointment.reason ?? "No reason provided"}
                      </p>
                    </div>

                    <div className="mt-3">
                      {renderStatusAction(appointment)}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
