
"use client";

import { FormEvent, useEffect, useState } from "react";

type UserRole = "ADMIN" | "DOCTOR" | "PATIENT" | "RECEPTIONIST" | "";

type Patient = {
  id: number;
  user?: { name?: string | null } | null;
};

type Doctor = {
  id: number;
  specialization?: string | null;
  user?: { name?: string | null } | null;
};

type Appointment = {
  id: number;
  scheduledAt: string;
  patientId: number;
  doctorId: number;
};

type MedicalRecord = {
  id: number;
  diagnosis: string;
  notes?: string | null;
  createdAt: string;
  patient?: {
    id?: number;
    user?: { name?: string | null } | null;
  } | null;
  doctor?: {
    id?: number;
    user?: { name?: string | null } | null;
  } | null;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [role, setRole] = useState<UserRole>("");

  const [patientId, setPatientId] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [appointmentId, setAppointmentId] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canCreate =
    role === "ADMIN" || role === "DOCTOR";

  async function loadData() {
    const token = localStorage.getItem("medcore_token");
    const storedUser = localStorage.getItem("medcore_user");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured. Check frontend/.env.local.");
      setLoading(false);
      return;
    }

    let currentRole: UserRole = "";

    try {
      const user = storedUser ? JSON.parse(storedUser) : null;
      currentRole = String(user?.role ?? "").toUpperCase() as UserRole;
    } catch {
      setError("Unable to read your account details. Please log in again.");
      setLoading(false);
      return;
    }

    setRole(currentRole);

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    setLoading(true);
    setError("");

    try {
      // Patients must not request the hospital-wide patient list.
      const requests: Promise<Response>[] = [
        fetch(`${API_URL}/medical-records`, { headers }),
        fetch(`${API_URL}/doctors`, { headers }),
        fetch(`${API_URL}/appointments`, { headers }),
      ];

      if (currentRole !== "PATIENT") {
        requests.push(fetch(`${API_URL}/patients`, { headers }));
      }

      const responses = await Promise.all(requests);
      const [recordsResponse, doctorsResponse, appointmentsResponse] =
        responses;

      if (!recordsResponse.ok) {
        throw new Error(
          `Medical records request failed (${recordsResponse.status}).`,
        );
      }

      if (!doctorsResponse.ok) {
        throw new Error(
          `Doctors request failed (${doctorsResponse.status}).`,
        );
      }

      if (!appointmentsResponse.ok) {
        throw new Error(
          `Appointments request failed (${appointmentsResponse.status}).`,
        );
      }

      const [recordsData, doctorsData, appointmentsData] =
        await Promise.all([
          recordsResponse.json(),
          doctorsResponse.json(),
          appointmentsResponse.json(),
        ]);

      let patientsData: Patient[] = [];

      if (currentRole !== "PATIENT") {
        const patientsResponse = responses[3];

        if (!patientsResponse.ok) {
          throw new Error(
            `Patients request failed (${patientsResponse.status}).`,
          );
        }

        const data = await patientsResponse.json();
        patientsData = Array.isArray(data) ? data : [];
      }

      setRecords(Array.isArray(recordsData) ? recordsData : []);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      setAppointments(
        Array.isArray(appointmentsData) ? appointmentsData : [],
      );
      setPatients(patientsData);
    } catch (err) {
      console.error("Failed to load medical records:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load medical record data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function createMedicalRecord(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canCreate) {
      setError("You are not authorized to create medical records.");
      return;
    }

    const token = localStorage.getItem("medcore_token");

    if (!token) {
      window.location.href = "/";
      return;
    }

    if (!patientId || !doctorId || !diagnosis.trim()) {
      setError("Please select a patient and doctor, and enter a diagnosis.");
      return;
    }

    if (!API_URL) {
      setError("API URL is not configured.");
      return;
    }

    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/medical-records`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          ...(appointmentId
            ? { appointmentId: Number(appointmentId) }
            : {}),
          diagnosis: diagnosis.trim(),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Failed to create medical record.",
        );
      }

      setSuccess("Medical record created successfully.");
      setPatientId("");
      setDoctorId("");
      setAppointmentId("");
      setDiagnosis("");
      setNotes("");

      await loadData();
    } catch (err) {
      console.error("Failed to create medical record:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create medical record.",
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

  const selectedPatientAppointments = appointments.filter(
    (appointment) =>
      !patientId || appointment.patientId === Number(patientId),
  );

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
        <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 p-7 text-white shadow-xl shadow-orange-200">
          <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" />
          <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10" />

          <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur">
                📋
              </div>
              <h1 className="text-3xl font-bold">Medical Records</h1>
              <p className="mt-1 max-w-2xl text-sm text-orange-50 md:text-base">
                {role === "PATIENT"
                  ? "Review your medical history and clinical records."
                  : "Create, review, and manage patient medical history in one place."}
              </p>
            </div>

            <div className="rounded-2xl border border-white/20 bg-white/15 px-5 py-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-wider text-orange-100">
                {role === "PATIENT" ? "My Records" : "Total Records"}
              </div>
              <div className="mt-1 text-3xl font-bold">{records.length}</div>
            </div>
          </div>
        </section>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm">
            <span className="text-lg">✓</span>
            <span>{success}</span>
          </div>
        )}

        {canCreate && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400" />

            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-lg text-white shadow-sm">
                  ✚
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Create Medical Record
                  </h2>
                  <p className="text-sm text-slate-500">
                    Add a diagnosis and clinical notes for a patient.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={createMedicalRecord}
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                  Doctor
                </label>
                <select
                  required
                  value={doctorId}
                  onChange={(event) => setDoctorId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                >
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.user?.name ?? `Doctor #${doctor.id}`}
                      {doctor.specialization
                        ? ` — ${doctor.specialization}`
                        : ""}
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
                  onChange={(event) => setAppointmentId(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
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
                  Diagnosis
                </label>
                <input
                  required
                  type="text"
                  value={diagnosis}
                  onChange={(event) => setDiagnosis(event.target.value)}
                  placeholder="e.g. Viral fever"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Clinical Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add additional medical notes, observations, or treatment details..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100"
                />
              </div>

              <div className="flex items-center md:col-span-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-200 transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Medical Record"}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400" />

          <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {role === "PATIENT" ? "My Medical Records" : "Medical Record List"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {records.length} record{records.length === 1 ? "" : "s"} found.
              </p>
            </div>
            <button
              onClick={() => void loadData()}
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-200 transition hover:from-orange-600 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center px-6 py-16">
              <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
              <p className="text-sm font-medium text-slate-500">
                Loading medical records...
              </p>
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-3xl">
                📋
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                No medical records found
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                {role === "PATIENT"
                  ? "Your medical records will appear here when they are available."
                  : "Create the first medical record using the form above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-gradient-to-r from-orange-50 to-amber-50 text-xs font-bold uppercase tracking-wider text-orange-700">
                  <tr>
                    {role !== "PATIENT" && (
                      <th className="px-6 py-4">Patient</th>
                    )}
                    <th className="px-6 py-4">Doctor</th>
                    <th className="px-6 py-4">Diagnosis</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((record) => (
                    <tr
                      key={record.id}
                      className="text-sm transition hover:bg-orange-50/40"
                    >
                      {role !== "PATIENT" && (
                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-900">
                            {record.patient?.user?.name ??
                              `Patient #${record.patient?.id ?? "—"}`}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-5">
                        <div className="font-semibold text-slate-800">
                          {record.doctor?.user?.name ??
                            `Doctor #${record.doctor?.id ?? "—"}`}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex max-w-xs rounded-lg bg-orange-100 px-3 py-1.5 font-semibold text-orange-700">
                          {record.diagnosis}
                        </span>
                      </td>
                      <td className="max-w-sm px-6 py-5 text-slate-600">
                        <div className="line-clamp-2">
                          {record.notes ?? "No additional notes"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="whitespace-nowrap text-slate-700">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          {new Date(record.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}