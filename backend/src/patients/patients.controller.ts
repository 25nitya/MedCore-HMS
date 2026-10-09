
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/jwt-payload';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  findAll(@CurrentUser() user: AuthUser) {
    return this.patientsService.findAll(user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.patientsService.create(dto, user);
  }

  @Get('me')
  @Roles(Role.PATIENT)
  me(@CurrentUser() user: AuthUser) {
    return this.patientsService.me(user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: AuthUser) {
    return this.patientsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.patientsService.update(id, dto, user);
  }
}
