import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/jwt-payload';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { PrescriptionsService } from './prescriptions.service';


@Controller('prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
  constructor(private prescriptionsService: PrescriptionsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.DOCTOR, Role.PATIENT)
  findAll(@CurrentUser() user: AuthUser) {
    return this.prescriptionsService.findAll(user);
  }

  @Post()
  @Roles(Role.ADMIN,Role.DOCTOR)
  create(@Body() dto: CreatePrescriptionDto, @CurrentUser() user: AuthUser) {
    return this.prescriptionsService.create(dto, user);
  }
}
