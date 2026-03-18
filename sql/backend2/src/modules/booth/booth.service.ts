import { HttpStatus, Injectable } from '@nestjs/common';
import {
  BoothCategory,
  BoothLocation,
  BoothSession,
  BoothStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { BoothListQueryDto } from './dto/list-query.dto';
import { BoothMapQueryDto } from './dto/map-query.dto';
import { haversineDistanceKm } from '../../common/utils/distance';

type BoothWithMeta = Prisma.BoothGetPayload<{ include: { vendor: true } }>;

@Injectable()
export class BoothService {
  constructor(private readonly prisma: PrismaService) {}

  async getMapBooths(query: BoothMapQueryDto) {
    const where: Prisma.BoothWhereInput = {
      category: query.category,
      ...(query.only_operating ? { status: BoothStatus.operating } : {}),
    };

    const booths = await this.prisma.booth.findMany({
      where,
      include: {
        vendor: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    return this.attachRuntimeState(booths, query.lat, query.lng);
  }

  async listBooths(query: BoothListQueryDto) {
    const where: Prisma.BoothWhereInput = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.keyword
        ? {
            OR: [
              { name: { contains: query.keyword } },
              { description: { contains: query.keyword } },
            ],
          }
        : {}),
    };

    const booths = await this.prisma.booth.findMany({
      where,
      include: {
        vendor: true,
      },
      orderBy: { updated_at: 'desc' },
    });

    const enriched = await this.attachRuntimeState(
      booths,
      query.lat,
      query.lng,
    );

    if (
      query.distance !== undefined &&
      query.lat !== undefined &&
      query.lng !== undefined
    ) {
      return enriched.filter(
        (item) => item.distance_km !== undefined && item.distance_km <= query.distance,
      );
    }
    return enriched;
  }

  async getBoothDetail(id: number) {
    const booth = await this.prisma.booth.findUnique({
      where: { id: BigInt(id) },
      include: {
        vendor: true,
        feedbacks: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
        favorite_locations: true,
      },
    });

    if (!booth) {
      throw new BusinessException(
        AppErrorCode.BOOTH_NOT_FOUND,
        'Booth not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const [latestSession] = await this.prisma.boothSession.findMany({
      where: { booth_id: booth.id },
      orderBy: { start_time: 'desc' },
      take: 1,
    });

    const latestLocation = latestSession
      ? await this.prisma.boothLocation.findFirst({
          where: { booth_id: booth.id, session_id: latestSession.id },
          orderBy: { reported_at: 'desc' },
        })
      : await this.prisma.boothLocation.findFirst({
          where: { booth_id: booth.id },
          orderBy: { reported_at: 'desc' },
        });

    const favorites = await this.prisma.userFavorite.count({
      where: { booth_id: booth.id },
    });

    return {
      ...this.serializeBooth(booth),
      vendor: booth.vendor,
      favorite_locations: booth.favorite_locations,
      feedbacks: booth.feedbacks,
      favorites,
      latest_session: latestSession
        ? this.serializeSession(latestSession)
        : null,
      latest_location: latestLocation
        ? this.serializeLocation(latestLocation)
        : null,
    };
  }

  private async attachRuntimeState(
    booths: BoothWithMeta[],
    lat?: number,
    lng?: number,
  ) {
    const boothIds = booths.map((b) => b.id);

    const latestSessions = await this.prisma.boothSession.findMany({
      where: { booth_id: { in: boothIds } },
      orderBy: [{ booth_id: 'asc' }, { start_time: 'desc' }],
    });

    const sessionByBooth = new Map<bigint, BoothSession>();
    for (const session of latestSessions) {
      if (!sessionByBooth.has(session.booth_id)) {
        sessionByBooth.set(session.booth_id, session);
      }
    }

    const locations = await this.prisma.boothLocation.findMany({
      where: { booth_id: { in: boothIds } },
      orderBy: [{ booth_id: 'asc' }, { reported_at: 'desc' }],
    });

    const locationByBooth = new Map<bigint, BoothLocation>();
    for (const loc of locations) {
      if (!locationByBooth.has(loc.booth_id)) {
        locationByBooth.set(loc.booth_id, loc);
      }
    }

    return booths.map((booth) => {
      const latestSession = sessionByBooth.get(booth.id);
      const latestLocation = locationByBooth.get(booth.id);
      const distance_km =
        lat !== undefined &&
        lng !== undefined &&
        latestLocation?.lat !== undefined &&
        latestLocation?.lng !== undefined
          ? haversineDistanceKm(
              lat,
              lng,
              Number(latestLocation.lat),
              Number(latestLocation.lng),
            )
          : undefined;

      return {
        ...this.serializeBooth(booth),
        vendor: booth.vendor,
        latest_session: latestSession
          ? this.serializeSession(latestSession)
          : null,
        latest_location: latestLocation
          ? this.serializeLocation(latestLocation)
          : null,
        distance_km,
      };
    });
  }

  private serializeBooth(booth: BoothWithMeta) {
    const { vendor, ...rest } = booth;
    return {
      ...rest,
      id: Number(booth.id),
      vendor_id: Number(booth.vendor_id),
      rating: Number(booth.rating),
    };
  }

  private serializeSession(session: BoothSession) {
    return {
      ...session,
      id: Number(session.id),
      booth_id: Number(session.booth_id),
      start_lat: Number(session.start_lat),
      start_lng: Number(session.start_lng),
    };
  }

  private serializeLocation(location: BoothLocation) {
    return {
      ...location,
      id: Number(location.id),
      booth_id: Number(location.booth_id),
      session_id: Number(location.session_id),
      lat: Number(location.lat),
      lng: Number(location.lng),
    };
  }
}
