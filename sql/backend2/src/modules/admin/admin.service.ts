import { HttpStatus, Injectable } from '@nestjs/common';
import { BoothStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    const [
      booths,
      vendors,
      runningSessions,
      abnormalBooths,
      openAnomalies,
      locationsLastHour,
      sessionsToday,
    ] = await Promise.all([
      this.prisma.booth.count(),
      this.prisma.vendor.count(),
      this.prisma.boothSession.count({
        where: { status: { in: ['running', 'paused'] } },
      }),
      this.prisma.booth.count({ where: { status: BoothStatus.abnormal } }),
      this.prisma.boothAnomaly.count({ where: { resolved_at: null } }),
      this.prisma.boothLocation.count({
        where: { reported_at: { gte: oneHourAgo } },
      }),
      this.prisma.boothSession.count({
        where: { start_time: { gte: todayStart } },
      }),
    ]);

    return {
      booths,
      vendors,
      running_sessions: runningSessions,
      abnormal_booths: abnormalBooths,
      open_anomalies: openAnomalies,
      location_reports_last_hour: locationsLastHour,
      sessions_started_today: sessionsToday,
    };
  }

  async getRealtimeBooths() {
    const sessions = await this.prisma.boothSession.findMany({
      where: { status: { in: ['running', 'paused'] } },
      include: { booth: true },
      orderBy: { start_time: 'desc' },
    });
    const sessionIds = sessions.map((s) => s.id);
    const locations = sessionIds.length
      ? await this.prisma.boothLocation.findMany({
          where: { session_id: { in: sessionIds } },
          orderBy: [{ session_id: 'asc' }, { reported_at: 'desc' }],
        })
      : [];

    const locationBySession = new Map<bigint, typeof locations[number]>();
    for (const loc of locations) {
      if (!locationBySession.has(loc.session_id)) {
        locationBySession.set(loc.session_id, loc);
      }
    }

    return sessions.map((session) => {
      const loc = locationBySession.get(session.id);
      return {
        session: this.serializeSession(session),
        booth: {
          id: Number(session.booth.id),
          name: session.booth.name,
          status: session.booth.status,
          category: session.booth.category,
        },
        latest_location: loc
          ? {
              id: Number(loc.id),
              lat: Number(loc.lat),
              lng: Number(loc.lng),
              accuracy: loc.accuracy,
              reported_at: loc.reported_at,
            }
          : null,
      };
    });
  }

  async listAnomalies() {
    const anomalies = await this.prisma.boothAnomaly.findMany({
      orderBy: { detected_at: 'desc' },
      take: 50,
      include: { booth: true, session: true },
    });
    return anomalies.map((a) => ({
      ...a,
      id: Number(a.id),
      booth_id: Number(a.booth_id),
      session_id: Number(a.session_id),
      booth: { id: Number(a.booth.id), name: a.booth.name },
      session: {
        id: Number(a.session.id),
        status: a.session.status,
        start_time: a.session.start_time,
      },
    }));
  }

  async resolveAnomaly(id: number, adminId?: number) {
    const anomaly = await this.prisma.boothAnomaly.findUnique({
      where: { id: BigInt(id) },
    });
    if (!anomaly) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Anomaly not found',
        HttpStatus.NOT_FOUND,
      );
    }
    if (anomaly.resolved_at) {
      return anomaly;
    }
    const resolved = await this.prisma.boothAnomaly.update({
      where: { id: anomaly.id },
      data: {
        resolved_at: new Date(),
        resolved_by: adminId ? BigInt(adminId) : null,
      },
    });
    return {
      ...resolved,
      id: Number(resolved.id),
      booth_id: Number(resolved.booth_id),
      session_id: Number(resolved.session_id),
    };
  }

  private serializeSession(session: {
    id: bigint;
    booth_id: bigint;
    start_time: Date;
    end_time: Date | null;
    status: string;
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
}
