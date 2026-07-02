import { Controller, Get, Post, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ProjectionsService } from './projections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkingCapitalAssumptions } from '@corplan/shared-types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('projections')
@UseGuards(JwtAuthGuard)
export class ProjectionsController {
  constructor(private readonly projectionsService: ProjectionsService) {}

  private async resolveUserDivisionId(user: User): Promise<string> {
    if (!user.departmentId) return '';
    const dept = await this.projectionsService.getPnl.name ? await this.projectionsService.pnlRepository.manager.getRepository('departments').findOne({ where: { id: user.departmentId } }) as any : null;
    if (!dept) return '';
    return dept.parentId || dept.id;
  }

  private async checkGlobalOrFinanceAccess(user: User) {
    const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
    if (isGlobalRole) return;

    if (user.departmentId) {
      const dept = await this.projectionsService.pnlRepository.manager.getRepository('departments').findOne({ where: { id: user.departmentId } }) as any;
      if (dept && dept.code === 'DEPT_FIN') return;
    }

    throw new ForbiddenException('Akses ditolak: Hanya Departemen Finance dan CSP yang memiliki akses ke Proyeksi Arus Kas & Neraca.');
  }

  @Get('pnl')
  async getPnl(
    @Query('cycleId') cycleId: string,
    @Query('divisionId') divisionId?: string,
    @CurrentUser() user?: User,
  ) {
    if (user) {
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      if (!isGlobalRole) {
        // Force division PnL for division members
        const userDivId = await this.resolveUserDivisionId(user);
        return this.projectionsService.getPnl(cycleId, userDivId);
      }
    }
    return this.projectionsService.getPnl(cycleId, divisionId === 'all' ? undefined : divisionId);
  }

  @Get('cashflow')
  async getCashFlow(
    @Query('cycleId') cycleId: string,
    @Query('divisionId') divisionId?: string,
    @CurrentUser() user?: User,
  ) {
    if (user) {
      await this.checkGlobalOrFinanceAccess(user);
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      if (!isGlobalRole) {
        // Finance Dept sees global rollup
        return this.projectionsService.getCashFlow(cycleId, undefined);
      }
    }
    return this.projectionsService.getCashFlow(cycleId, divisionId === 'all' ? undefined : divisionId);
  }

  @Get('balancesheet')
  async getBalanceSheet(
    @Query('cycleId') cycleId: string,
    @Query('divisionId') divisionId?: string,
    @CurrentUser() user?: User,
  ) {
    if (user) {
      await this.checkGlobalOrFinanceAccess(user);
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      if (!isGlobalRole) {
        // Finance Dept sees global rollup
        return this.projectionsService.getBalanceSheet(cycleId, undefined);
      }
    }
    return this.projectionsService.getBalanceSheet(cycleId, divisionId === 'all' ? undefined : divisionId);
  }

  @Post('recalculate')
  async recalculate(
    @Body('cycleId') cycleId: string,
    @Body('wcAssumptions') wcAssumptions?: WorkingCapitalAssumptions,
    @CurrentUser() user?: User,
  ) {
    let divisionId: string | undefined = undefined;
    if (user) {
      const isGlobalRole = ['super_admin', 'csp', 'cfo'].includes(user.role);
      if (!isGlobalRole) {
        divisionId = await this.resolveUserDivisionId(user);
      }
    }
    return this.projectionsService.recalculate(cycleId, wcAssumptions, divisionId);
  }
}
