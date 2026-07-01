import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from './entities/department.entity';
import { ChartOfAccount } from './entities/chart-of-account.entity';
import { User } from '../users/user.entity';
import { MasterDataService } from './master-data.service';
import { DepartmentController, CoaController } from './master-data.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Department, ChartOfAccount, User])],
  providers: [MasterDataService],
  controllers: [DepartmentController, CoaController],
  exports: [MasterDataService],
})
export class MasterDataModule {}
