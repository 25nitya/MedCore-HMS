import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';

const appointmentInclude = {
  patient: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
  doctor: {
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
};

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(user: AuthUser) {
    if (user.role === Role.ADMIN || user.role === Role.RECEPTIONIST) {
      return this.prisma.appointment.findMany({
        include: appointmentInclude,
        orderBy: { scheduledAt: 'desc' },
      });
    }

    if (user.role === Role.DOCTOR) {
      const doctor = await this.requireDoctor(user.id);
      return this.prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: appointmentInclude,
        orderBy: { scheduledAt: 'desc' },
      });
    }

    const patient = await this.requirePatient(user.id);
    return this.prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: appointmentInclude,
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async create(dto: CreateAppointmentDto, user: AuthUser) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    let patientId = dto.patientId;

    if (user.role === Role.PATIENT) {
      const patient = await this.requirePatient(user.id);
      patientId = patient.id;
    } else if (user.role === Role.RECEPTIONIST || user.role === Role.ADMIN) {
      if (!patientId) {
        throw new ForbiddenException('patientId is required');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions');
    }

    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        doctorId: dto.doctorId,
        patientId,
        scheduledAt: new Date(dto.scheduledAt),
        reason: dto.reason,
      },
      include: appointmentInclude,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'CREATE',
      resource: 'Appointment',
      resourceId: appointment.id,
    });

    return appointment;
  }

  async updateStatus(
    id: number,
    dto: UpdateAppointmentStatusDto,
    user: AuthUser,
  ) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true, patient: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (user.role === Role.DOCTOR) {
      const doctor = await this.requireDoctor(user.id);
      if (appointment.doctorId !== doctor.id) {
        throw new ForbiddenException('You can only update your appointments');
      }
    } else if (user.role === Role.PATIENT) {
      const patient = await this.requirePatient(user.id);
      if (
        appointment.patientId !== patient.id ||
        dto.status !== AppointmentStatus.CANCELLED
      ) {
        throw new ForbiddenException('Patients can only cancel their appointments');
      }
    } else if (user.role !== Role.ADMIN && user.role !== Role.RECEPTIONIST) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status: dto.status },
      include: appointmentInclude,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'UPDATE_STATUS',
      resource: 'Appointment',
      resourceId: id,
      details: dto.status,
    });

    return updated;
  }

  private async requirePatient(userId: number) {
    const patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }
    return patient;
  }

  private async requireDoctor(userId: number) {
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }
    return doctor;
  }
}
