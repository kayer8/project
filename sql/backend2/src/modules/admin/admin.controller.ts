import { Controller, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AdminService } from './admin.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/summary')
  summary() {
    return this.adminService.getDashboardSummary();
  }

  @Get('booths/realtime')
  realtime() {
    return this.adminService.getRealtimeBooths();
  }

  @Get('anomalies')
  anomalies() {
    return this.adminService.listAnomalies();
  }

  @Post('anomalies/:id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    const adminIdHeader = (req.headers['x-admin-id'] as string) ?? (req.headers['x-adminid'] as string);
    const adminId = adminIdHeader ? Number(adminIdHeader) : undefined;
    return this.adminService.resolveAnomaly(id, adminId);
  }
}
