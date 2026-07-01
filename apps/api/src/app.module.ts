import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MasterDataModule } from './modules/master-data/master-data.module';
import { RkapCycleModule } from './modules/rkap-cycle/rkap-cycle.module';
import { RevenueModule } from './modules/revenue/revenue.module';
import { CostModule } from './modules/cost/cost.module';
import { CapexModule } from './modules/capex/capex.module';
import { ProjectionsModule } from './modules/projections/projections.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database')!,
    }),
    AuthModule,
    UsersModule,
    MasterDataModule,
    RkapCycleModule,
    RevenueModule,
    CostModule,
    CapexModule,
    ProjectionsModule,
    WorkflowModule,
    AuditLogModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
