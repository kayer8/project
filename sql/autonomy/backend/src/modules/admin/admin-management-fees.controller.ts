import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Admin } from '../../common/decorators/admin.decorator';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { ManagementFeeService } from '../management-fee/management-fee.service';
import {
  AdminManagementFeeHouseQueryDto,
  CreateManagementFeePeriodDto,
  ManagementFeePeriodQueryDto,
  UpdateManagementFeeStatusDto,
} from '../management-fee/dto/management-fee.dto';
import { AdminAuthUser } from './interfaces/admin-auth-user.interface';

@ApiTags('admin-management-fees')
@ApiBearerAuth()
@Controller('admin/v1/management-fees')
@UseGuards(AdminJwtAuthGuard)
export class AdminManagementFeesController {
  constructor(private readonly managementFeeService: ManagementFeeService) {}

  @Get('periods')
  periods() {
    return this.managementFeeService.listPeriods();
  }

  @Post('periods')
  createPeriod(@Body() dto: CreateManagementFeePeriodDto, @Admin() admin: AdminAuthUser, @Req() request: Request) {
    return this.managementFeeService.createPeriod(dto, buildAuditContext(admin, request));
  }

  @Get('summary')
  summary(@Query() query: ManagementFeePeriodQueryDto) {
    return this.managementFeeService.getAdminSummary(query);
  }

  @Get('buildings')
  buildings(@Query() query: ManagementFeePeriodQueryDto) {
    return this.managementFeeService.getAdminBuildingStats(query);
  }

  @Get('houses')
  houses(@Query() query: AdminManagementFeeHouseQueryDto) {
    return this.managementFeeService.listAdminHouses(query);
  }

  @Get('disclosure')
  disclosure(@Query() query: ManagementFeePeriodQueryDto) {
    return this.managementFeeService.getDisclosure(query);
  }

  @Get('options/buildings')
  buildingOptions(@Query() query: ManagementFeePeriodQueryDto) {
    return this.managementFeeService.listBuildingOptions(query);
  }

  @Patch('houses/:id/status')
  updateHouseStatus(
    @Param('id') id: string,
    @Body() dto: UpdateManagementFeeStatusDto,
    @Admin() admin: AdminAuthUser,
    @Req() request: Request,
  ) {
    return this.managementFeeService.updateHousePaymentStatus(id, dto.paymentStatus, buildAuditContext(admin, request));
  }
}

function buildAuditContext(admin: AdminAuthUser, request: Request) {
  return {
    admin,
    ip: request.ip,
    userAgent: request.headers['user-agent'] || null,
  };
}
