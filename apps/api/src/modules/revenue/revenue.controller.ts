import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RevenueLineItem } from './entities/revenue-line-item.entity';

@Controller('revenue')
@UseGuards(JwtAuthGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  findAll(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.revenueService.findAllByCycle(cycleId, departmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.revenueService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<RevenueLineItem>) {
    return this.revenueService.create(data);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updates: Partial<RevenueLineItem>) {
    return this.revenueService.update(id, updates);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.revenueService.remove(id);
  }
}
