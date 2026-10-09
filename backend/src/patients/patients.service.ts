
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePatientDto, actor: AuthUser) {
    if (
      actor.role !== Role.ADMIN &&
      actor.role !== Role.RECEPTIONIST
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const patient = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: Role.PATIENT,
        },
      });

      return tx.patient.create({
        data: {
          userId: user.id,
          phone: dto.phone,
          dateOfBirth: dto.dateOfBirth
            ? new Date(dto.dateOfBirth)
            : undefined,
          address: dto.address,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });
    });

    await this.auditService.log({
      userId: actor.id,
      action: 'CREATE',
      resource: 'Patient',
      resourceId: patient.id,
      details: dto.email,
    });

    return patient;
  }

  findAll(user: AuthUser) {
    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.RECEPTIONIST &&
      user.role !== Role.DOCTOR
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return this.prisma.patient.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    this.assertCanAccess(patient.userId, user);
    return patient;
  }

  async me(user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  async update(id: number, dto: UpdatePatientDto, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({ where: { id } });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    this.assertCanModify(patient.userId, user);

    const updated = await this.prisma.patient.update({
      where: { id },
      data: {
        phone: dto.phone,
        address: dto.address,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'UPDATE',
      resource: 'Patient',
      resourceId: id,
    });

    return updated;
  }

  private assertCanAccess(patientUserId: number, user: AuthUser) {
    if (user.role === Role.PATIENT && user.id !== patientUserId) {
      throw new ForbiddenException('You can only view your own profile');
    }
  }

  private assertCanModify(patientUserId: number, user: AuthUser) {
    if (
      user.role === Role.ADMIN ||
      user.role === Role.RECEPTIONIST ||
      (user.role === Role.PATIENT && user.id === patientUserId)
    ) {
      return;
    }

    throw new ForbiddenException('Insufficient permissions');
  }
}




