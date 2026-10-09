
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';

const include = {
  patient: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
  doctor: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
};

@Injectable()
export class MedicalRecordsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(user: AuthUser) {
    if (user.role === Role.ADMIN) {
      return this.prisma.medicalRecord.findMany({
        include,
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (user.role === Role.DOCTOR) {
      const doctor = await this.requireDoctor(user.id);

      return this.prisma.medicalRecord.findMany({
        where: {
          doctorId: doctor.id,
        },
        include,
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (user.role === Role.PATIENT) {
      const patient = await this.requirePatient(user.id);

      return this.prisma.medicalRecord.findMany({
        where: {
          patientId: patient.id,
        },
        include,
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    throw new ForbiddenException(
      'Receptionists cannot view medical records',
    );
  }

  async create(dto: CreateMedicalRecordDto, user: AuthUser) {
    let doctor;

    if (user.role === Role.DOCTOR) {
      doctor = await this.requireDoctor(user.id);
    } else {
      doctor = await this.prisma.doctor.findUnique({
        where: {
          id: dto.doctorId,
        },
      });
    }

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const patient = await this.prisma.patient.findUnique({
      where: {
        id: dto.patientId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: {
          id: dto.appointmentId,
        },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.patientId !== patient.id) {
        throw new ForbiddenException(
          'Appointment does not belong to the selected patient',
        );
      }

      if (appointment.doctorId !== doctor.id) {
        throw new ForbiddenException(
          'Appointment does not belong to the selected doctor',
        );
      }
    }

    const record = await this.prisma.medicalRecord.create({
      data: {
        patientId: dto.patientId,
        doctorId: doctor.id,
        appointmentId: dto.appointmentId,
        diagnosis: dto.diagnosis,
        notes: dto.notes,
      },
      include,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'CREATE',
      resource: 'MedicalRecord',
      resourceId: record.id,
    });

    return record;
  }

  private async requirePatient(userId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: {
        userId,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient profile not found');
    }

    return patient;
  }

  private async requireDoctor(userId: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: {
        userId,
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }
}

