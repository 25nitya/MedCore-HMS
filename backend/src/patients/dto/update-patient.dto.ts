import { IsOptional, IsString } from 'class-validator';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;
}
