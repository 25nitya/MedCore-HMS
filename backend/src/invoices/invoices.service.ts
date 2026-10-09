import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';

const include = {
  patient: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  appointment: true,
};

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(user: AuthUser) {
    if (user.role === Role.ADMIN || user.role === Role.RECEPTIONIST) {
      return this.prisma.invoice.findMany({
        include,
        orderBy: { createdAt: 'desc' },
      });
    }

    if (user.role === Role.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });
      if (!patient) {
        throw new NotFoundException('Patient profile not found');
      }
      return this.prisma.invoice.findMany({
        where: { patientId: patient.id },
        include,
        orderBy: { createdAt: 'desc' },
      });
    }

    throw new ForbiddenException('Insufficient permissions');
  }

  async create(dto: CreateInvoiceDto, user: AuthUser) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        amount: dto.amount,
      },
      include,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'CREATE',
      resource: 'Invoice',
      resourceId: invoice.id,
    });

    return invoice;
  }

  async updateStatus(id: number, dto: UpdateInvoiceStatusDto, user: AuthUser) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: { status: dto.status },
      include,
    });

    await this.auditService.log({
      userId: user.id,
      action: 'UPDATE_STATUS',
      resource: 'Invoice',
      resourceId: id,
      details: dto.status,
    });

    return invoice;
  }
}
