import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ProjectionsService } from './projections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkingCapitalAssumptions } from '@corplan/shared-types';

@Controller('projections')
@UseGuards(JwtAuthGuard)
export class ProjectionsController {
  constructor(private readonly projectionsService: ProjectionsService) {}

  @Get('pnl')
  getPnl(@Query('cycleId') cycleId: string) {
    return this.projectionsService.getPnl(cycleId);
  }

  @Get('cashflow')
  getCashFlow(@Query('cycleId') cycleId: string) {
    return this.projectionsService.getCashFlow(cycleId);
  }

  @Get('balancesheet')
  getBalanceSheet(@Query('cycleId') cycleId: string) {
    return this.projectionsService.getBalanceSheet(cycleId);
  }

  @Post('recalculate')
  recalculate(
    @Body('cycleId') cycleId: string,
    @Body('wcAssumptions') wcAssumptions?: WorkingCapitalAssumptions,
  ) {
    return this.projectionsService.recalculate(cycleId, wcAssumptions);
  }
}
