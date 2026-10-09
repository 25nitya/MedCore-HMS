import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  doctorId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  patientId?: number;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
