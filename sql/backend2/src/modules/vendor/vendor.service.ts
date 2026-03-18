import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Booth,
  BoothStatus,
  SessionStatus,
  Vendor,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@Injectable()
export class VendorService {
  constructor(private readonly prisma: PrismaService) {}

  async startSession(vendorId: number, dto: { boothId?: number; lat: number; lng: number; address?: string }) {
    const vendor = await this.ensureVendor(vendorId);
    const booth = await this.resolveBooth(vendor, dto.boothId);

    const running = await this.prisma.boothSession.findFirst({
      where: {
        booth_id: booth.id,
        status: { in: [SessionStatus.running, SessionStatus.paused] },
      },
      orderBy: { start_time: 'desc' },
    });
    if (running) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'An active session already exists for this booth',
      );
    }

    const now = new Date();
    const session = await this.prisma.boothSession.create({
      data: {
        booth_id: booth.id,
        start_time: now,
        status: SessionStatus.running,
        start_lat: dto.lat,
        start_lng: dto.lng,
        start_address: dto.address ?? null,
      },
    });

    await this.prisma.booth.update({
      where: { id: booth.id },
      data: { status: BoothStatus.operating },
    });

    await this.prisma.boothLocation.create({
      data: {
        booth_id: booth.id,
        session_id: session.id,
        lat: dto.lat,
        lng: dto.lng,
        accuracy: 0,
        reported_at: now,
      },
    });

    return this.serializeSession(session);
  }

  async reportLocation(dto: { sessionId: number; lat: number; lng: number; accuracy: number }) {
    const session = await this.prisma.boothSession.findUnique({
      where: { id: BigInt(dto.sessionId) },
    });
    if (!session) {
      throw new BusinessException(
        AppErrorCode.SESSION_NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (session.status === SessionStatus.ended) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Session already ended',
      );
    }

    const booth = await this.prisma.booth.findUnique({
      where: { id: session.booth_id },
    });
    if (!booth) {
      throw new BusinessException(
        AppErrorCode.BOOTH_NOT_FOUND,
        'Booth not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (session.status === SessionStatus.paused) {
      await this.prisma.boothSession.update({
        where: { id: session.id },
        data: { status: SessionStatus.running },
      });
    }

    const previousLocation = await this.prisma.boothLocation.findFirst({
      where: { session_id: session.id },
      orderBy: { reported_at: 'desc' },
    });
    const now = new Date();
    const location = await this.prisma.boothLocation.create({
      data: {
        booth_id: session.booth_id,
        session_id: session.id,
        lat: dto.lat,
        lng: dto.lng,
        accuracy: dto.accuracy,
        reported_at: now,
      },
    });

    const anomalies: Prisma.BoothAnomalyCreateManyInput[] = [];
    if (previousLocation) {
      const diffMinutes =
        (now.getTime() - new Date(previousLocation.reported_at).getTime()) / 60000;
      if (diffMinutes > 20) {
        anomalies.push({
          booth_id: session.booth_id,
          session_id: session.id,
          type: 'report_timeout',
          level: 'critical',
          description: `Report gap ${diffMinutes.toFixed(1)} min`,
          detected_at: now,
          resolved_at: null,
          resolved_by: null,
        });
      }
    }
    if (dto.accuracy > 200) {
      anomalies.push({
        booth_id: session.booth_id,
        session_id: session.id,
        type: 'location_drift',
        level: 'warning',
        description: `High inaccuracy: ${dto.accuracy}m`,
        detected_at: now,
        resolved_at: null,
        resolved_by: null,
      });
    }

    if (anomalies.length > 0) {
      await this.prisma.boothAnomaly.createMany({ data: anomalies });
      await this.prisma.booth.update({
        where: { id: booth.id },
        data: { status: BoothStatus.abnormal },
      });
    } else if (booth.status !== BoothStatus.operating) {
      await this.prisma.booth.update({
        where: { id: booth.id },
        data: { status: BoothStatus.operating },
      });
    }

    return {
      location: this.serializeLocation(location),
      anomalies_created: anomalies.length,
    };
  }

  async pauseSession(sessionId: number) {
    const session = await this.prisma.boothSession.findUnique({
      where: { id: BigInt(sessionId) },
    });
    if (!session) {
      throw new BusinessException(
        AppErrorCode.SESSION_NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (session.status === SessionStatus.ended) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Session already ended',
      );
    }

    await this.prisma.boothSession.update({
      where: { id: session.id },
      data: { status: SessionStatus.paused },
    });
    await this.prisma.booth.update({
      where: { id: session.booth_id },
      data: { status: BoothStatus.pending },
    });

    return { id: Number(session.id), status: SessionStatus.paused };
  }

  async endSession(sessionId: number) {
    const session = await this.prisma.boothSession.findUnique({
      where: { id: BigInt(sessionId) },
    });
    if (!session) {
      throw new BusinessException(
        AppErrorCode.SESSION_NOT_FOUND,
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (session.status === SessionStatus.ended) {
      return this.serializeSession(session);
    }

    const now = new Date();
    const durationMin = Math.max(
      0,
      Math.round((now.getTime() - new Date(session.start_time).getTime()) / 60000),
    );

    const updated = await this.prisma.boothSession.update({
      where: { id: session.id },
      data: {
        status: SessionStatus.ended,
        end_time: now,
        total_duration_min: durationMin,
      },
    });

    await this.prisma.booth.update({
      where: { id: session.booth_id },
      data: {
        status: BoothStatus.offline,
        total_sessions: { increment: 1 },
        total_duration_min: { increment: durationMin },
      },
    });

    return this.serializeSession(updated);
  }

  async listSessions(vendorId: number, query: { dateRange?: string }) {
    const vendor = await this.ensureVendor(vendorId);
    const booths = await this.prisma.booth.findMany({
      where: { vendor_id: vendor.id },
      select: { id: true, name: true },
    });
    const boothIds = booths.map((b) => b.id);
    if (boothIds.length === 0) {
      return [];
    }

    const where: Prisma.BoothSessionWhereInput = { booth_id: { in: boothIds } };
    if (query.dateRange) {
      const [start, end] = query.dateRange.split(',').map((d) => d.trim());
      if (start) {
        where.start_time = { ...(where.start_time as object), gte: new Date(start) };
      }
      if (end) {
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        where.start_time = { ...(where.start_time as object), lte: endDate };
      }
    }

    const sessions = await this.prisma.boothSession.findMany({
      where,
      orderBy: { start_time: 'desc' },
      include: { booth: true },
    });

    return sessions.map((s) => ({
      ...this.serializeSession(s),
      booth: { id: Number(s.booth.id), name: s.booth.name },
    }));
  }

  private async ensureVendor(vendorId: number): Promise<Vendor> {
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: BigInt(vendorId) },
    });
    if (!vendor) {
      throw new BusinessException(
        AppErrorCode.VENDOR_NOT_FOUND,
        'Vendor not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return vendor;
  }

  private async resolveBooth(vendor: Vendor, boothId?: number): Promise<Booth> {
    if (boothId) {
      const booth = await this.prisma.booth.findFirst({
        where: { id: BigInt(boothId), vendor_id: vendor.id },
      });
      if (!booth) {
        throw new BusinessException(
          AppErrorCode.BOOTH_NOT_FOUND,
          'Booth not found for vendor',
          HttpStatus.NOT_FOUND,
        );
      }
      return booth;
    }

    const booths = await this.prisma.booth.findMany({
      where: { vendor_id: vendor.id },
      orderBy: { created_at: 'asc' },
    });
    if (booths.length === 0) {
      throw new BusinessException(
        AppErrorCode.BOOTH_NOT_FOUND,
        'Vendor has no booths',
        HttpStatus.NOT_FOUND,
      );
    }
    if (booths.length > 1) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Multiple booths found, specify booth_id',
      );
    }
    return booths[0];
  }

  private serializeSession(session: {
    id: bigint;
    booth_id: bigint;
    start_time: Date;
    end_time: Date | null;
    status: SessionStatus;
    start_lat: Prisma.Decimal;
    start_lng: Prisma.Decimal;
    start_address: string | null;
    total_duration_min: number;
    created_at: Date;
  }) {
    return {
      ...session,
      id: Number(session.id),
      booth_id: Number(session.booth_id),
      start_lat: Number(session.start_lat),
      start_lng: Number(session.start_lng),
    };
  }

  private serializeLocation(location: {
    id: bigint;
    booth_id: bigint;
    session_id: bigint;
    lat: Prisma.Decimal;
    lng: Prisma.Decimal;
    accuracy: number;
    reported_at: Date;
    created_at: Date;
  }) {
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
