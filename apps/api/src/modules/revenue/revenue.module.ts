import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueLineItem } from './entities/revenue-line-item.entity';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';
import { Department } from '../master-data/entities/department.entity';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RevenueLineItem, Department]),
    WorkflowModule,
  ],
  providers: [RevenueService],
  controllers: [RevenueController],
  exports: [RevenueService],
})
export class RevenueModule {}
