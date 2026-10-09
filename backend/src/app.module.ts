import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppointmentsModule } from './appointments/appointments.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { InvoicesModule } from './invoices/invoices.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { PatientsModule } from './patients/patients.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    InvoicesModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
