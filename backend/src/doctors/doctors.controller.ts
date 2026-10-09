import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthUser } from '../auth/types/jwt-payload';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { DoctorsService } from './doctors.service';


@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @Get()
  findAll() {
    return this.doctorsService.findAll();
  }

  @Get('me')
  @Roles(Role.DOCTOR)
  me(@CurrentUser() user: AuthUser) {
    return this.doctorsService.me(user);
  }

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateDoctorDto, @CurrentUser() user: AuthUser) {
    return this.doctorsService.create(dto, user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.doctorsService.findOne(id);
  }
}
