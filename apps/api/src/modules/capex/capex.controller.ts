import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CapexService } from './capex.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CapExItem } from './entities/capex-item.entity';

@Controller('capex')
@UseGuards(JwtAuthGuard)
export class CapexController {
  constructor(private readonly capexService: CapexService) {}

  @Get()
  findAll(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.capexService.findAllByCycle(cycleId, departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.capexService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<CapExItem>) {
    return this.capexService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updates: Partial<CapExItem>) {
    return this.capexService.update(id, updates);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.capexService.remove(id);
  }
}
