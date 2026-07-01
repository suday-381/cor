import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CostService } from './cost.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CostLineItem } from './entities/cost-line-item.entity';
import { PersonnelCost } from './entities/personnel-cost.entity';

@Controller('cost')
@UseGuards(JwtAuthGuard)
export class CostController {
  constructor(private readonly costService: CostService) {}

  // Cost Line Items
  @Get('line-items')
  findAllLineItems(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.costService.findAllLineItems(cycleId, departmentId);
  }

  @Get('line-items/:id')
  findOneLineItem(@Param('id') id: string) {
    return this.costService.findOneLineItem(id);
  }

  @Post('line-items')
  createLineItem(@Body() data: Partial<CostLineItem>) {
    return this.costService.createLineItem(data);
  }

  @Patch('line-items/:id')
  updateLineItem(@Param('id') id: string, @Body() updates: Partial<CostLineItem>) {
    return this.costService.updateLineItem(id, updates);
  }

  @Delete('line-items/:id')
  removeLineItem(@Param('id') id: string) {
    return this.costService.removeLineItem(id);
  }

  // Personnel Costs
  @Get('personnel')
  findAllPersonnel(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
  ) {
    return this.costService.findAllPersonnel(cycleId, departmentId);
  }

  @Get('personnel/:id')
  findOnePersonnel(@Param('id') id: string) {
    return this.costService.findOnePersonnel(id);
  }

  @Post('personnel')
  createPersonnel(@Body() data: Partial<PersonnelCost>) {
    return this.costService.createPersonnel(data);
  }

  @Patch('personnel/:id')
  updatePersonnel(@Param('id') id: string, @Body() updates: Partial<PersonnelCost>) {
    return this.costService.updatePersonnel(id, updates);
  }

  @Delete('personnel/:id')
  removePersonnel(@Param('id') id: string) {
    return this.costService.removePersonnel(id);
  }
}
