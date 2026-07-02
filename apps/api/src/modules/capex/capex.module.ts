import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CapExItem } from './entities/capex-item.entity';
import { CapexService } from './capex.service';
import { CapexController } from './capex.controller';
import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CapExItem]),
    WorkflowModule,
  ],
  providers: [CapexService],
  controllers: [CapexController],
  exports: [CapexService],
})
export class CapexModule {}
