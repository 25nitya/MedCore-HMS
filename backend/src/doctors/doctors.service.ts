import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../auth/types/jwt-payload';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.doctor.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async me(user: AuthUser) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor profile not found');
    }

    return doctor;
  }

  async create(dto: CreateDoctorDto, actor: AuthUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const doctor = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          role: 'DOCTOR',
        },
      });

      return tx.doctor.create({
        data: {
          userId: user.id,
          specialization: dto.specialization,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });
    });

    await this.auditService.log({
      userId: actor.id,
      action: 'CREATE',
      resource: 'Doctor',
      resourceId: doctor.id,
      details: dto.email,
    });

    return doctor;
  }
}
