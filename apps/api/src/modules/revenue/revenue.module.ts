import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RevenueLineItem } from './entities/revenue-line-item.entity';
import { RevenueService } from './revenue.service';
import { RevenueController } from './revenue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RevenueLineItem])],
  providers: [RevenueService],
  controllers: [RevenueController],
  exports: [RevenueService],
})
export class RevenueModule {}
