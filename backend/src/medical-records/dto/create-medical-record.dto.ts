
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsInt()
  @Min(1)
  patientId: number;

  @IsInt()
  @Min(1)
  doctorId: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  appointmentId?: number;

  @IsString()
  diagnosis: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

