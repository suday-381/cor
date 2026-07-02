import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CostService } from './cost.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CostLineItem } from './entities/cost-line-item.entity';
import { PersonnelCost } from './entities/personnel-cost.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('cost')
@UseGuards(JwtAuthGuard)
export class CostController {
  constructor(private readonly costService: CostService) {}

  // Cost Line Items
  @Get('line-items')
  findAllLineItems(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.costService.findAllLineItems(cycleId, departmentId, user);
  }

  @Get('line-items/:id')
  findOneLineItem(@Param('id') id: string) {
    return this.costService.findOneLineItem(id);
  }

  @Post('line-items')
  createLineItem(@Body() data: Partial<CostLineItem>, @CurrentUser() user: User) {
    return this.costService.createLineItem(data, user);
  }

  @Patch('line-items/:id')
  updateLineItem(@Param('id') id: string, @Body() updates: Partial<CostLineItem>, @CurrentUser() user: User) {
    return this.costService.updateLineItem(id, updates, user);
  }

  @Delete('line-items/:id')
  removeLineItem(@Param('id') id: string, @CurrentUser() user: User) {
    return this.costService.removeLineItem(id, user);
  }

  // Personnel Costs
  @Get('personnel')
  findAllPersonnel(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.costService.findAllPersonnel(cycleId, departmentId, user);
  }

  @Get('personnel/:id')
  findOnePersonnel(@Param('id') id: string) {
    return this.costService.findOnePersonnel(id);
  }

  @Post('personnel')
  createPersonnel(@Body() data: Partial<PersonnelCost>, @CurrentUser() user: User) {
    return this.costService.createPersonnel(data, user);
  }

  @Patch('personnel/:id')
  updatePersonnel(@Param('id') id: string, @Body() updates: Partial<PersonnelCost>, @CurrentUser() user: User) {
    return this.costService.updatePersonnel(id, updates, user);
  }

  @Delete('personnel/:id')
  removePersonnel(@Param('id') id: string, @CurrentUser() user: User) {
    return this.costService.removePersonnel(id, user);
  }
}
