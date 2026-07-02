import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CapexService } from './capex.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CapExItem } from './entities/capex-item.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('capex')
@UseGuards(JwtAuthGuard)
export class CapexController {
  constructor(private readonly capexService: CapexService) {}

  @Get()
  findAll(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.capexService.findAllByCycle(cycleId, departmentId, user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.capexService.findOne(id);
  }

  @Post()
  create(@Body() data: Partial<CapExItem>, @CurrentUser() user: User) {
    return this.capexService.create(data, user);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updates: Partial<CapExItem>, @CurrentUser() user: User) {
    return this.capexService.update(id, updates, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.capexService.remove(id, user);
  }
}
