# MedCore HMS

A full-stack Hospital Management System built with Next.js, React, NestJS, Prisma, and PostgreSQL.

MedCore HMS is designed to organize hospital workflows, including patient and doctor management, appointments, medical records, prescriptions, and invoices.

## Project Overview

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** NestJS, TypeScript, REST API
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT-related dependencies are included in the backend; verify the configured authentication flow before production deployment.

## Features

The project data model includes:

- Role-based user types: Admin, Doctor, Receptionist, and Patient
- Patient profiles and doctor specializations
- Appointment scheduling and status tracking
- Medical records and prescriptions
- Patient invoices and payment status tracking
- Audit logs for recording application activity

Feature availability and access permissions depend on the implemented application routes and UI.

## Project Structure

\`\`\`text
MedCore-HMS/
├── backend/       # NestJS API and Prisma schema
├── frontend/      # Next.js web application
├── README.md
└── .gitignore
\`\`\`

## Prerequisites

- Node.js and npm
- PostgreSQL
- Git

## Local Development

### 1. Clone the repository

\`\`\`bash
git clone https://github.com/25nitya/MedCore-HMS.git
cd MedCore-HMS
\`\`\`

### 2. Configure the backend

\`\`\`bash
cd backend
npm install
\`\`\`

Create a local \`.env\` file using \`.env.example\` as a reference, if available. Configure PostgreSQL \`DATABASE_URL\` and any other required environment variables.

Generate the Prisma client:

\`\`\`bash
npx prisma generate
\`\`\`

Apply development migrations only after verifying the migration files and database configuration:

\`\`\`bash
npx prisma migrate dev
\`\`\`

Start the backend:

\`\`\`bash
npm run start:dev
\`\`\`

The current local development setup uses port \`4000\` for the API.

### 3. Configure the frontend

Open a second terminal:

\`\`\`bash
cd frontend
npm install
\`\`\`

Create \`frontend/.env.local\` with:

\`\`\`env
NEXT_PUBLIC_API_URL=http://localhost:4000
\`\`\`

Start the frontend:

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

### Backend

\`\`\`bash
npm run start:dev
npm run build
npm run start:prod
npm run test
npm run test:e2e
\`\`\`

### Frontend

\`\`\`bash
npm run dev
npm run build
npm run start
npm run lint
\`\`\`

## Environment Variables and Security

- Never commit \`.env\` files, database credentials, JWT secrets, or real patient information.
- Keep production secrets in your hosting provider's environment-variable settings.
- Configure the frontend to use the deployed API URL in production.
- Restrict backend CORS to trusted frontend origins before public deployment.
- Use synthetic data for demos and testing.

