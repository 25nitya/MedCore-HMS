import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/jwt-payload';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { MedicalRecordsService } from './medical-records.service';


@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MedicalRecordsController {
  constructor(private medicalRecordsService: MedicalRecordsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  findAll(@CurrentUser() user: AuthUser) {
    return this.medicalRecordsService.findAll(user);
  }

  @Post()
  @Roles(Role.DOCTOR,Role.ADMIN)
  create(@Body() dto: CreateMedicalRecordDto, @CurrentUser() user: AuthUser) {
    return this.medicalRecordsService.create(dto, user);
  }
}
