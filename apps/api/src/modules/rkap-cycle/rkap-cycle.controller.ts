import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { RkapCycleService } from './rkap-cycle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CycleStatus, PeriodType } from '@corplan/shared-types';

@Controller('rkap-cycles')
@UseGuards(JwtAuthGuard)
export class RkapCycleController {
  constructor(private readonly rkapCycleService: RkapCycleService) {}

  @Get()
  findAll() {
    return this.rkapCycleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rkapCycleService.findOne(id);
  }

  @Post()
  create(
    @Body() body: { fiscalYear: number; periodType: PeriodType; macroAssumptions: any, dueDate?: string },
    @CurrentUser() user: any,
  ) {
    return this.rkapCycleService.create(
      body.fiscalYear,
      body.periodType || 'monthly',
      body.macroAssumptions || {},
      user.name || user.email,
      body.dueDate,
    );
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: CycleStatus) {
    return this.rkapCycleService.updateStatus(id, status);
  }

  @Patch(':id/macro')
  updateMacro(@Param('id') id: string, @Body() macro: any) {
    return this.rkapCycleService.updateMacro(id, macro);
  }

  @Patch(':id/due-date')
  updateDueDate(@Param('id') id: string, @Body('dueDate') dueDate: string) {
    return this.rkapCycleService.updateDueDate(id, dueDate);
  }

  @Post(':id/versions')
  addVersion(
    @Param('id') id: string,
    @Body('changeNote') changeNote: string,
    @CurrentUser() user: any,
  ) {
    return this.rkapCycleService.addVersion(id, changeNote || 'Revisi manual', user.name || user.email);
  }

  @Post(':id/copy')
  copyCycle(
    @Param('id') id: string,
    @Body('targetYear') targetYear: number,
    @CurrentUser() user: any,
  ) {
    return this.rkapCycleService.copyCycle(id, targetYear, user.name || user.email);
  }
}
