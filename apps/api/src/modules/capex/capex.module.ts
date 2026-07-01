import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapExItem } from './entities/capex-item.entity';
import { CapexService } from './capex.service';
import { CapexController } from './capex.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CapExItem])],
  providers: [CapexService],
  controllers: [CapexController],
  exports: [CapexService],
})
export class CapexModule {}
