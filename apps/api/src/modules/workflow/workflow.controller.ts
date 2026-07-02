import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Controller('workflow')
@UseGuards(JwtAuthGuard)
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get()
  getWorkflow(
    @Query('cycleId') cycleId: string,
    @Query('departmentId') departmentId: string,
    @CurrentUser() user: User,
  ) {
    const resolvedDeptId = departmentId || user.departmentId;
    return this.workflowService.getWorkflow(cycleId, resolvedDeptId);
  }

  @Post('submit')
  submit(
    @Body('cycleId') cycleId: string,
    @Body('departmentId') departmentId: string,
    @CurrentUser() user: User,
  ) {
    const resolvedDeptId = departmentId || user.departmentId;
    return this.workflowService.submit(cycleId, resolvedDeptId, user);
  }

  @Post('approve')
  approve(
    @Body('cycleId') cycleId: string,
    @Body('departmentId') departmentId: string,
    @Body('comment') comment: string,
    @CurrentUser() user: User,
  ) {
    const resolvedDeptId = departmentId || user.departmentId;
    return this.workflowService.approveStage(cycleId, resolvedDeptId, comment, user);
  }

  @Post('reject')
  reject(
    @Body('cycleId') cycleId: string,
    @Body('departmentId') departmentId: string,
    @Body('comment') comment: string,
    @CurrentUser() user: User,
  ) {
    const resolvedDeptId = departmentId || user.departmentId;
    return this.workflowService.rejectStage(cycleId, resolvedDeptId, comment, user);
  }

  @Post('revise')
  revise(
    @Body('cycleId') cycleId: string,
    @Body('departmentId') departmentId: string,
    @CurrentUser() user: User,
  ) {
    const resolvedDeptId = departmentId || user.departmentId;
    return this.workflowService.reviseWorkflow(cycleId, resolvedDeptId, user);
  }

  @Get('divisions')
  getDivisionsWorkflowStatus(@Query('cycleId') cycleId: string) {
    return this.workflowService.getDivisionsWorkflowStatus(cycleId);
  }
}
