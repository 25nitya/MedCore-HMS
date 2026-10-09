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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentStatusDto } from './dto/update-appointment-status.dto';


@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthUser) {
    return this.appointmentsService.findAll(user);
  }

  @Post()
  @Roles(Role.PATIENT, Role.RECEPTIONIST, Role.ADMIN)
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthUser) {
    return this.appointmentsService.create(dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.appointmentsService.updateStatus(id, dto, user);
  }
}
