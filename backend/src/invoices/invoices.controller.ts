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
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/invoice.dto';
import { InvoicesService } from './invoices.service';


@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.PATIENT)
  findAll(@CurrentUser() user: AuthUser) {
    return this.invoicesService.findAll(user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: AuthUser) {
    return this.invoicesService.create(dto, user);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceStatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoicesService.updateStatus(id, dto, user);
  }
}
