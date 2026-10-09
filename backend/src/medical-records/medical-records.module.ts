import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordsService } from './medical-records.service';

@Module({
  imports: [AuditModule],
  controllers: [MedicalRecordsController],
  providers: [MedicalRecordsService],
})
export class MedicalRecordsModule {}
