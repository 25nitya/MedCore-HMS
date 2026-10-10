
"use client";

import { useEffect, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type Patient = {
  id: number;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

type NavigationCard = {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  roles: string[];
};

type StatCard = {
  label: string;
  value: number;
  subtitle: string;
  color: string;
  href: string;
  icon: string;
};

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

const navigationCards: NavigationCard[] = [
  {
    title: "Patients",
    description: "Manage patient profiles and personal information.",
    href: "/patients",
    icon: "👥",
    color: "from-blue-500 to-cyan-500",
    roles: ["ADMIN", "RECEPTIONIST"],
  },
  {
    title: "Doctors",
    description: "View doctors and their medical specializations.",
    href: "/doctors",
    icon: "🩺",
    color: "from-teal-500 to-emerald-500",
    roles: ["ADMIN", "RECEPTIONIST", "PATIENT"],
  },
  {
    title: "Appointments",
    description: "Schedule and manage patient appointments.",
    href: "/appointments",
    icon: "📅",
    color: "from-violet-500 to-purple-500",
    roles: ["ADMIN", "RECEPTIONIST", "DOCTOR", "PATIENT"],
  },
  {
    title: "Medical Records",
    description: "Review diagnoses, notes and clinical records.",
    href: "/medical-records",
    icon: "📋",
    color: "from-orange-500 to-amber-500",
    roles: ["ADMIN", "DOCTOR", "PATIENT"],
  },
  {
    title: "Prescriptions",
    description: "Create and manage patient prescriptions.",
    href: "/prescriptions",
    icon: "💊",
    color: "from-pink-500 to-rose-500",
    roles: ["ADMIN", "DOCTOR", "PATIENT"],
  },
  {
    title: "Invoices",
    description: "View and track patient billing invoices.",
    href: "/invoices",
    icon: "💳",
    color: "from-indigo-500 to-blue-600",
    roles: ["ADMIN", "RECEPTIONIST", "PATIENT"],
  },
];

function StatCard({ card }: { card: StatCard }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = card.href;
      }}
      aria-label={`Open ${card.label}: ${card.value}`}
      className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className={`h-1 bg-gradient-to-r ${card.color}`} />

      <div className="flex items-center justify-between gap-3 p-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {card.label}
          </p>

          <p className="mt-2 text-4xl font-extrabold text-slate-900">
            {card.value}
          </p>

          <p className="mt-1 text-xs font-medium text-blue-600">
            {card.subtitle}
          </p>

          <p className="mt-4 text-xs font-bold text-slate-400 transition group-hover:text-blue-600">
            View details →
          </p>
        </div>

        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-2xl transition group-hover:bg-blue-50">
          {card.icon}
        </span>
      </div>
    </button>
  );
}

function ModuleCard({ card }: { card: NavigationCard }) {
  return (
    <button
      type="button"
      onClick={() => {
        window.location.href = card.href;
      }}
      className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-slate-200 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <div className={`h-2 bg-gradient-to-r ${card.color}`} />

      <div className="p-6">
        <div className="mb-5 flex items-center justify-between">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-xl text-white shadow-md`}
          >
            {card.icon}
          </div>

          <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500">
            →
          </span>
        </div>

        <h3 className="text-lg font-bold text-slate-900">
          {card.title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {card.description}
        </p>

        <p className="mt-4 text-sm font-bold text-slate-700 transition group-hover:text-blue-600">
          Open module →
        </p>
      </div>
    </button>
  );
}

function PatientTable({
  patients,
  title = "Registered Patients",
  description = "Patient records currently registered in MedCore HMS.",
}: {
  patients: Patient[];
  title?: string;
  description?: string;
}) {
  return (
    <section className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = "/patients";
          }}
          className="self-start rounded-lg bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600 transition hover:bg-blue-100 sm:self-auto"
        >
          View all patients →
        </button>
      </div>

      {patients.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl">
            👥
          </div>

          <p className="mt-4 font-semibold text-slate-700">
            No patients found
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Registered patients will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Patient</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Address</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className="text-sm transition hover:bg-blue-50/40"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                          {patient.user?.name?.charAt(0).toUpperCase() ??
                            "P"}
                        </div>

                        <span className="font-semibold text-slate-900">
                          {patient.user?.name ??
                            `Patient #${patient.id}`}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {patient.user?.email ?? "—"}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {patient.phone ?? "—"}
                    </td>

                    <td className="min-w-48 px-6 py-4 text-slate-600">
                      {patient.address ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-slate-100 px-6 py-4 text-sm text-slate-500">
            Showing {patients.length} patient
            {patients.length === 1 ? "" : "s"}.
          </div>
        </>
      )}
    </section>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [myProfile, setMyProfile] = useState<Patient | null>(null);

  const [doctorCount, setDoctorCount] = useState(0);
  const [appointmentCount, setAppointmentCount] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [recordCount, setRecordCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    const token = localStorage.getItem("medcore_token");
    const storedUser = localStorage.getItem("medcore_user");

    if (!token || !storedUser) {
      window.location.href = "/";
      return;
    }

    try {
      const currentUser: User = JSON.parse(storedUser);
      setUser(currentUser);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      if (!API_URL) {
        throw new Error(
          "API URL is missing. Check frontend/.env.local.",
        );
      }

      // Patient portal: request the signed-in patient's own profile,
      // not the hospital-wide patient directory.
      if (currentUser.role === "PATIENT") {
        const [
          profileResponse,
          doctorsResponse,
          appointmentsResponse,
          recordsResponse,
          prescriptionsResponse,
          invoicesResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/patients/me`, { headers }),
          fetch(`${API_URL}/doctors`, { headers }),
          fetch(`${API_URL}/appointments`, { headers }),
          fetch(`${API_URL}/medical-records`, { headers }),
          fetch(`${API_URL}/prescriptions`, { headers }),
          fetch(`${API_URL}/invoices`, { headers }),
        ]);

        const responses = [
          profileResponse,
          doctorsResponse,
          appointmentsResponse,
          recordsResponse,
          prescriptionsResponse,
          invoicesResponse,
        ];

        if (responses.some((response) => !response.ok)) {
          throw new Error(
            "Failed to load patient data. Check your connection and permissions, then try again.",
          );
        }

        const [
          profileData,
          doctorsData,
          appointmentsData,
          recordsData,
          prescriptionsData,
          invoicesData,
        ] = await Promise.all(
          responses.map((response) => response.json()),
        );

        setMyProfile(profileData);
        setDoctorCount(
          Array.isArray(doctorsData) ? doctorsData.length : 0,
        );
        setAppointmentCount(
          Array.isArray(appointmentsData)
            ? appointmentsData.length
            : 0,
        );
        setRecordCount(
          Array.isArray(recordsData) ? recordsData.length : 0,
        );
        setPrescriptionCount(
          Array.isArray(prescriptionsData)
            ? prescriptionsData.length
            : 0,
        );
        setInvoiceCount(
          Array.isArray(invoicesData) ? invoicesData.length : 0,
        );

        return;
      }

      // Doctor portal: do not fetch /patients or /doctors.
      // This prevents the dashboard from loading the hospital-wide
      // patient directory merely to display a doctor's summary.
      if (currentUser.role === "DOCTOR") {
        const [
          appointmentsResponse,
          recordsResponse,
          prescriptionsResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/appointments`, { headers }),
          fetch(`${API_URL}/medical-records`, { headers }),
          fetch(`${API_URL}/prescriptions`, { headers }),
        ]);

        const responses = [
          appointmentsResponse,
          recordsResponse,
          prescriptionsResponse,
        ];

        if (responses.some((response) => !response.ok)) {
          throw new Error(
            "Failed to load doctor dashboard data. Check your permissions and backend connection.",
          );
        }

        const [
          appointmentsData,
          recordsData,
          prescriptionsData,
        ] = await Promise.all(
          responses.map((response) => response.json()),
        );

        setPatients([]);
        setDoctorCount(0);
        setAppointmentCount(
          Array.isArray(appointmentsData)
            ? appointmentsData.length
            : 0,
        );
        setRecordCount(
          Array.isArray(recordsData) ? recordsData.length : 0,
        );
        setPrescriptionCount(
          Array.isArray(prescriptionsData)
            ? prescriptionsData.length
            : 0,
        );
        setInvoiceCount(0);

        return;
      }

      // Admin and Receptionist: load the hospital management overview.
      const [
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
        invoicesResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/patients`, { headers }),
        fetch(`${API_URL}/doctors`, { headers }),
        fetch(`${API_URL}/appointments`, { headers }),
        fetch(`${API_URL}/invoices`, { headers }),
      ]);

      const responses = [
        patientsResponse,
        doctorsResponse,
        appointmentsResponse,
        invoicesResponse,
      ];

      if (responses.some((response) => !response.ok)) {
        throw new Error(
          "Failed to load hospital dashboard data. Check your permissions and backend connection.",
        );
      }

      const [
        patientsData,
        doctorsData,
        appointmentsData,
        invoicesData,
      ] = await Promise.all(
        responses.map((response) => response.json()),
      );

      const patientList: Patient[] = Array.isArray(patientsData)
        ? patientsData
        : [];

      setPatients(patientList);
      setDoctorCount(
        Array.isArray(doctorsData) ? doctorsData.length : 0,
      );
      setAppointmentCount(
        Array.isArray(appointmentsData)
          ? appointmentsData.length
          : 0,
      );
      setInvoiceCount(
        Array.isArray(invoicesData) ? invoicesData.length : 0,
      );
      setRecordCount(0);
      setPrescriptionCount(0);
    } catch (err) {
      console.error("Failed to load dashboard:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
    // Dashboard data is loaded when the page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPatient = user?.role === "PATIENT";
  const isDoctor = user?.role === "DOCTOR";
  const isAdmin = user?.role === "ADMIN";
  const isReceptionist = user?.role === "RECEPTIONIST";

  // Restrict workspace cards by role. Doctors only see clinical modules.
  const visibleCards = navigationCards.filter((card) => {
    if (!user?.role || !card.roles.includes(user.role)) {
      return false;
    }

    if (user.role === "DOCTOR") {
      return [
        "Appointments",
        "Medical Records",
        "Prescriptions",
      ].includes(card.title);
    }

    return true;
  });

  function navigateTo(href: string) {
    window.location.href = href;
  }

  function logout() {
    localStorage.removeItem("medcore_token");
    localStorage.removeItem("medcore_user");
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="rounded-2xl bg-white px-8 py-7 text-center shadow-sm ring-1 ring-slate-200">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="font-semibold text-slate-700">
            Loading dashboard...
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Getting your hospital data ready.
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-red-100">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl">
            ⚠️
          </div>

          <h1 className="mt-5 text-xl font-extrabold text-slate-900">
            Dashboard unavailable
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Try again
          </button>

          <button
            type="button"
            onClick={logout}
            className="ml-3 mt-6 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </main>
    );
  }

  const patientStats: StatCard[] = [
    {
      label: "Doctors",
      value: doctorCount,
      subtitle: "Available doctors",
      color: "from-emerald-500 to-teal-500",
      href: "/doctors",
      icon: "🩺",
    },
    {
      label: "Appointments",
      value: appointmentCount,
      subtitle: "Your visits",
      color: "from-violet-500 to-purple-500",
      href: "/appointments",
      icon: "📅",
    },
    {
      label: "Medical Records",
      value: recordCount,
      subtitle: "Clinical records",
      color: "from-orange-500 to-amber-500",
      href: "/medical-records",
      icon: "📋",
    },
    {
      label: "Prescriptions",
      value: prescriptionCount,
      subtitle: "Prescribed medicines",
      color: "from-pink-500 to-rose-500",
      href: "/prescriptions",
      icon: "💊",
    },
    {
      label: "Invoices",
      value: invoiceCount,
      subtitle: "Billing records",
      color: "from-indigo-500 to-blue-600",
      href: "/invoices",
      icon: "💳",
    },
  ];

  const doctorStats: StatCard[] = [
    {
      label: "Appointments",
      value: appointmentCount,
      subtitle: "Your appointments",
      color: "from-violet-500 to-purple-500",
      href: "/appointments",
      icon: "📅",
    },
    {
      label: "Medical Records",
      value: recordCount,
      subtitle: "Clinical records",
      color: "from-orange-500 to-amber-500",
      href: "/medical-records",
      icon: "📋",
    },
    {
      label: "Prescriptions",
      value: prescriptionCount,
      subtitle: "Prescriptions issued",
      color: "from-pink-500 to-rose-500",
      href: "/prescriptions",
      icon: "💊",
    },
  ];

  const adminStats: StatCard[] = [
    {
      label: "Patients",
      value: patients.length,
      subtitle: "Registered patients",
      color: "from-blue-500 to-cyan-500",
      href: "/patients",
      icon: "👥",
    },
    {
      label: "Doctors",
      value: doctorCount,
      subtitle: "Medical professionals",
      color: "from-emerald-500 to-teal-500",
      href: "/doctors",
      icon: "🩺",
    },
    {
      label: "Appointments",
      value: appointmentCount,
      subtitle: "Scheduled visits",
      color: "from-violet-500 to-purple-500",
      href: "/appointments",
      icon: "📅",
    },
    {
      label: "Invoices",
      value: invoiceCount,
      subtitle: "Billing records",
      color: "from-orange-500 to-amber-500",
      href: "/invoices",
      icon: "💳",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_top_left,_rgba(99,102,241,0.10),_transparent_28%)]">
        <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-5">
            <button
              type="button"
              onClick={() => navigateTo("/dashboard")}
              className="flex items-center gap-3 text-left"
              aria-label="Go to dashboard"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl text-white shadow-lg">
                🏥
              </div>

              <div>
                <h1 className="text-xl font-extrabold text-slate-900">
                  MedCore HMS
                </h1>
                <p className="text-xs font-medium text-slate-500">
                  Hospital Management System
                </p>
              </div>
            </button>

            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-slate-900">
                  {user?.name}
                </p>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  {user?.role}
                </p>
              </div>

              <button
                type="button"
                onClick={logout}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-6 py-10">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 p-8 text-white shadow-xl sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
              {isPatient
                ? "Patient Portal"
                : isDoctor
                  ? "Doctor Portal"
                  : isAdmin
                    ? "Administrator Portal"
                    : "Reception Portal"}
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              {isPatient
                ? "View your appointments, medical information, prescriptions and billing details from one secure dashboard."
                : isDoctor
                  ? "Manage your appointments, review clinical records and handle prescriptions from your doctor dashboard."
                  : isAdmin
                    ? "Monitor hospital activity and manage patients, doctors, appointments and billing from one centralized platform."
                    : "Coordinate patient registration, appointments and billing from your hospital operations dashboard."}
            </p>
          </section>

          {isPatient && (
            <>
              <section className="mt-8">
                <div className="mb-5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Your Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select a count card to open that section.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                  {patientStats.map((card) => (
                    <StatCard key={card.href} card={card} />
                  ))}
                </div>
              </section>

              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Patient Services
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Access your hospital information and services.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCards.map((card) => (
                    <ModuleCard key={card.href} card={card} />
                  ))}
                </div>
              </section>

              <section className="mt-10 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-bold text-slate-900">
                    My Profile
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Registered patient information
                  </p>
                </div>

                <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Name
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {myProfile?.user?.name ?? user?.name ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Email
                    </p>
                    <p className="mt-2 break-words font-semibold text-slate-900">
                      {myProfile?.user?.email ?? user?.email ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Phone
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {myProfile?.phone ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Address
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {myProfile?.address ?? "—"}
                    </p>
                  </div>
                </div>
              </section>
            </>
          )}

          {isDoctor && (
            <>
              <section className="mt-8">
                <div className="mb-5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Clinical Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Open a count card to access its clinical module.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {doctorStats.map((card) => (
                    <StatCard key={card.href} card={card} />
                  ))}
                </div>
              </section>

              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Doctor Workspace
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Access your clinical and appointment workflows.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCards.map((card) => (
                    <ModuleCard key={card.href} card={card} />
                  ))}
                </div>
              </section>

              {/* The hospital-wide Registered Patients table is intentionally
                  not rendered on the Doctor dashboard. */}
            </>
          )}

          {(isAdmin || isReceptionist) && (
            <>
              <section className="mt-8">
                <div className="mb-5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Hospital Overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Click any count card to open its management page.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {adminStats.map((card) => (
                    <StatCard key={card.href} card={card} />
                  ))}
                </div>
              </section>

              <section className="mt-10">
                <div className="mb-5">
                  <h2 className="text-xl font-extrabold text-slate-900">
                    Hospital Management
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Access your core hospital operations.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCards.map((card) => (
                    <ModuleCard key={card.href} card={card} />
                  ))}
                </div>
              </section>

              <PatientTable
                patients={patients}
                title="Registered Patients"
                description="Patient records currently registered in MedCore HMS."
              />
            </>
          )}

          <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} MedCore HMS. Hospital Management System.
          </footer>
        </div>
      </div>
    </main>
  );
}