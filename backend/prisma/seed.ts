import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(params: {
  email: string;
  name: string;
  password: string;
  role: Role;
}) {
  const password = await bcrypt.hash(params.password, 10);

  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      name: params.name,
      role: params.role,
    },
    create: {
      name: params.name,
      email: params.email,
      password,
      role: params.role,
    },
  });
}

async function main() {
  const admin = await upsertUser({
    email: 'admin@medcore.test',
    name: 'System Admin',
    password: 'password123',
    role: Role.ADMIN,
  });

  const receptionist = await upsertUser({
    email: 'reception@medcore.test',
    name: 'Front Desk',
    password: 'password123',
    role: Role.RECEPTIONIST,
  });

  const doctorUser = await upsertUser({
    email: 'doctor@medcore.test',
    name: 'Dr. Ada Sharma',
    password: 'password123',
    role: Role.DOCTOR,
  });

  const patientUser = await upsertUser({
    email: 'patient@test.com',
    name: 'Test Patient',
    password: 'password123',
    role: Role.PATIENT,
  });

  await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: { specialization: 'General Medicine' },
    create: {
      userId: doctorUser.id,
      specialization: 'General Medicine',
    },
  });

  await prisma.patient.upsert({
    where: { userId: patientUser.id },
    update: {
      phone: '9999999999',
      address: 'Demo City',
    },
    create: {
      userId: patientUser.id,
      phone: '9999999999',
      address: 'Demo City',
    },
  });

  console.log('Seeded users:', {
    admin: admin.email,
    receptionist: receptionist.email,
    doctor: doctorUser.email,
    patient: patientUser.email,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
