
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreatePrescriptionDto {
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
  medication: string;

  @IsString()
  dosage: string;

  @IsOptional()
  @IsString()
  instructions?: string;
}

