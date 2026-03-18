import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import {
  AdminBuildingListQueryDto,
  CreateAdminBuildingDto,
  UpdateAdminBuildingDto,
} from './dto/building.dto';

@Injectable()
export class BuildingService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmin(query: AdminBuildingListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const where: Prisma.BuildingWhereInput = {};

    if (query.keyword?.trim()) {
      const keyword = query.keyword.trim();
      where.OR = [
        { buildingName: { contains: keyword } },
        { buildingCode: { contains: keyword } },
      ];
    }

    if (query.status?.trim()) {
      where.status = query.status.trim() as any;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.building.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [{ sortNo: 'asc' }, { buildingName: 'asc' }],
        include: {
          _count: {
            select: {
              houses: true,
            },
          },
        },
      }),
      this.prisma.building.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        buildingCode: item.buildingCode,
        buildingName: item.buildingName,
        sortNo: item.sortNo,
        status: item.status,
        houseCount: item._count.houses,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      total,
      page,
      pageSize,
    };
  }

  async getAdminDetail(id: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      include: {
        houses: {
          orderBy: [{ displayName: 'asc' }],
        },
      },
    });

    if (!building) {
      throw new BusinessException(
        AppErrorCode.BUILDING_NOT_FOUND,
        'Building not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      id: building.id,
      buildingCode: building.buildingCode,
      buildingName: building.buildingName,
      sortNo: building.sortNo,
      status: building.status,
      createdAt: building.createdAt,
      updatedAt: building.updatedAt,
      houseCount: building.houses.length,
      houses: building.houses.map((house) => ({
        id: house.id,
        displayName: house.displayName,
        unitNo: house.unitNo,
        roomNo: house.roomNo,
        houseStatus: house.houseStatus,
      })),
    };
  }

  async listOptions() {
    return this.prisma.building.findMany({
      orderBy: [{ sortNo: 'asc' }, { buildingName: 'asc' }],
      select: {
        id: true,
        buildingName: true,
        buildingCode: true,
        sortNo: true,
        status: true,
      },
    });
  }

  async createAdmin(dto: CreateAdminBuildingDto) {
    const buildingCode = dto.buildingCode.trim();
    await this.ensureBuildingCodeAvailable(buildingCode);

    const building = await this.prisma.building.create({
      data: {
        buildingCode,
        buildingName: dto.buildingName.trim(),
        sortNo: dto.sortNo ?? null,
        status: (dto.status as any) ?? 'ACTIVE',
      },
    });

    return this.getAdminDetail(building.id);
  }

  async updateAdmin(id: string, dto: UpdateAdminBuildingDto) {
    await this.ensureBuildingExists(id);

    if (dto.buildingCode?.trim()) {
      await this.ensureBuildingCodeAvailable(dto.buildingCode.trim(), id);
    }

    await this.prisma.building.update({
      where: { id },
      data: {
        ...(dto.buildingCode?.trim() ? { buildingCode: dto.buildingCode.trim() } : {}),
        ...(dto.buildingName?.trim() ? { buildingName: dto.buildingName.trim() } : {}),
        ...(dto.sortNo !== undefined ? { sortNo: dto.sortNo ?? null } : {}),
        ...(dto.status ? { status: dto.status as any } : {}),
      },
    });

    return this.getAdminDetail(id);
  }

  async removeAdmin(id: string) {
    await this.ensureBuildingExists(id);

    const houseCount = await this.prisma.house.count({
      where: { buildingId: id },
    });

    if (houseCount > 0) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Building has related houses and cannot be deleted',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.building.delete({
      where: { id },
    });

    return {
      id,
      removed: true,
    };
  }

  async ensureBuildingExists(id: string) {
    const building = await this.prisma.building.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!building) {
      throw new BusinessException(
        AppErrorCode.BUILDING_NOT_FOUND,
        'Building not found',
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async ensureBuildingCodeAvailable(buildingCode: string, excludeId?: string) {
    const building = await this.prisma.building.findFirst({
      where: {
        buildingCode,
        ...(excludeId
          ? {
              id: {
                not: excludeId,
              },
            }
          : {}),
      },
      select: { id: true },
    });

    if (building) {
      throw new BusinessException(
        AppErrorCode.INVALID_OPERATION,
        'Building code already exists',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
