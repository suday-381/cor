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
  getWorkflow(@Query('cycleId') cycleId: string) {
    return this.workflowService.getWorkflow(cycleId);
  }

  @Post('submit')
  submit(@Body('cycleId') cycleId: string, @CurrentUser() user: User) {
    return this.workflowService.submit(cycleId, user);
  }

  @Post('approve')
  approve(
    @Body('cycleId') cycleId: string,
    @Body('comment') comment: string,
    @CurrentUser() user: User,
  ) {
    return this.workflowService.approveStage(cycleId, comment, user);
  }

  @Post('reject')
  reject(
    @Body('cycleId') cycleId: string,
    @Body('comment') comment: string,
    @CurrentUser() user: User,
  ) {
    return this.workflowService.rejectStage(cycleId, comment, user);
  }
}
