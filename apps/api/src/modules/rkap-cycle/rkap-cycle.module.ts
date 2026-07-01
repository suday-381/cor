import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RkapCycle } from './entities/rkap-cycle.entity';
import { MacroAssumption } from './entities/macro-assumption.entity';
import { CycleVersion } from './entities/cycle-version.entity';
import { RevenueLineItem } from '../revenue/entities/revenue-line-item.entity';
import { CostLineItem } from '../cost/entities/cost-line-item.entity';
import { RkapCycleService } from './rkap-cycle.service';
import { RkapCycleController } from './rkap-cycle.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RkapCycle,
      MacroAssumption,
      CycleVersion,
      RevenueLineItem,
      CostLineItem,
    ]),
  ],
  providers: [RkapCycleService],
  controllers: [RkapCycleController],
  exports: [RkapCycleService],
})
export class RkapCycleModule {}
