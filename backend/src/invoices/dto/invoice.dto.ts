
import { InvoiceStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  appointmentId?: number;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}

