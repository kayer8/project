import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { BuildingService } from '../building/building.service';
import {
  AdminBuildingListQueryDto,
  CreateAdminBuildingDto,
  UpdateAdminBuildingDto,
} from '../building/dto/building.dto';

@ApiTags('admin-buildings')
@ApiBearerAuth()
@Controller('admin/v1/buildings')
@UseGuards(AdminJwtAuthGuard)
export class AdminBuildingsController {
  constructor(private readonly buildingService: BuildingService) {}

  @Get('options')
  options() {
    return this.buildingService.listOptions();
  }

  @Get()
  list(@Query() query: AdminBuildingListQueryDto) {
    return this.buildingService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.buildingService.getAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminBuildingDto) {
    return this.buildingService.createAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminBuildingDto) {
    return this.buildingService.updateAdmin(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buildingService.removeAdmin(id);
  }
}
