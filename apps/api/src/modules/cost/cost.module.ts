import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CostLineItem } from './entities/cost-line-item.entity';
import { PersonnelCost } from './entities/personnel-cost.entity';
import { CostService } from './cost.service';
import { CostController } from './cost.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CostLineItem, PersonnelCost])],
  providers: [CostService],
  controllers: [CostController],
  exports: [CostService],
})
export class CostModule {}
