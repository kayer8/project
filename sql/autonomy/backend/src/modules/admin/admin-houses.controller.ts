import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminJwtAuthGuard } from '../../common/guards/admin-jwt-auth.guard';
import { HouseService } from '../house/house.service';
import {
  AdminHouseListQueryDto,
  CreateAdminHouseDto,
  UpdateAdminHouseDto,
} from '../house/dto/house.dto';

@ApiTags('admin-houses')
@ApiBearerAuth()
@Controller('admin/v1/houses')
@UseGuards(AdminJwtAuthGuard)
export class AdminHousesController {
  constructor(private readonly houseService: HouseService) {}

  @Get('options/communities')
  communities() {
    return this.houseService.listCommunities();
  }

  @Get('options/buildings')
  buildings(@Query('communityId') communityId?: string) {
    return this.houseService.listBuildings(communityId);
  }

  @Get()
  list(@Query() query: AdminHouseListQueryDto) {
    return this.houseService.listAdmin(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.houseService.getAdminDetail(id);
  }

  @Post()
  create(@Body() dto: CreateAdminHouseDto) {
    return this.houseService.createAdmin(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminHouseDto) {
    return this.houseService.updateAdmin(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.houseService.removeAdmin(id);
  }
}
