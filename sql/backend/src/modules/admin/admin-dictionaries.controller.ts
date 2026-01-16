import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('admin-dictionaries')
@ApiBearerAuth()
@Controller('admin/v1/dictionaries')
@UseGuards(AdminJwtAuthGuard, PermissionsGuard)
export class AdminDictionariesController {
  @Get()
  @RequirePermissions('dictionaries:read')
  getAll() {
    return {
      moods: ['tired', 'empty', 'anxious', 'quiet', 'move'],
      direction_tags: ['emotion', 'body', 'order', 'relax'],
      trace_tags: ['self_care', 'slow_down', 'observe', 'order_small'],
      copy_types: [
        'task_complete',
        'night_closing',
        'empty_state',
        'error',
        'review',
      ],
      night_program_types: ['timer', 'questions', 'audio', 'text'],
    };
  }
}
