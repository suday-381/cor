import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RevenueService } from './revenue.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RevenueLineItem } from './entities/revenue-line-item.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('revenue')
@UseGuards(JwtAuthGuard)
export class RevenueController {
  constructor(private readonly revenueService: RevenueService) {}

  @Get()
  findAll(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.revenueService.findAllByCycle(cycleId, departmentId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.revenueService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<RevenueLineItem>, @CurrentUser() user: User) {
    return this.revenueService.create(data, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updates: Partial<RevenueLineItem>, @CurrentUser() user: User) {
    return this.revenueService.update(id, updates, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.revenueService.remove(id, user);
  }
}
