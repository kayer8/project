import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { TasksService } from './tasks.service';
import { CompleteTaskDto, SkipTaskDto } from './dto/tasks.dto';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('complete')
  complete(@User() user: AuthUser, @Body() dto: CompleteTaskDto) {
    return this.tasksService.completeTask(
      user.userId,
      dto.daily_task_id,
      dto.completed_at,
    );
  }

  @Post('skip')
  skip(@User() user: AuthUser, @Body() dto: SkipTaskDto) {
    return this.tasksService.skipTask(
      user.userId,
      dto.daily_task_id,
      dto.reason,
    );
  }
}
