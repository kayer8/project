import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { NIGHT_PROGRAMS } from '../../common/constants/app-config';
import { getYearMonthFromDate, parseDateInput } from '../../common/utils/date-utils';

@Injectable()
export class NightService {
  constructor(private readonly prisma: PrismaService) {}

  getPrograms() {
    return {
      programs: NIGHT_PROGRAMS.map((program) => ({
        program_id: program.program_id,
        title: program.title,
        type: program.type,
        duration_sec: program.duration_sec ?? null,
      })),
    };
  }

  async startSession(userId: string, date: string, programId: string) {
    const program = NIGHT_PROGRAMS.find(
      (item) => item.program_id === programId,
    );
    if (!program) {
      throw new BusinessException(
        AppErrorCode.INVALID_REQUEST,
        'Program not found',
        HttpStatus.BAD_REQUEST,
      );
    }

    const dateValue = parseDateInput(date);
    const existing = await this.prisma.nightSession.findFirst({
      where: { user_id: userId, date: dateValue },
    });

    if (existing) {
      return {
        night_session_id: existing.id,
        status: existing.status,
        started_at: existing.started_at,
      };
    }

    const session = await this.prisma.nightSession.create({
      data: {
        user_id: userId,
        date: dateValue,
        program_id: programId,
        status: 'started',
        started_at: new Date(),
      },
    });

    return {
      night_session_id: session.id,
      status: session.status,
      started_at: session.started_at,
    };
  }

  async finishSession(
    userId: string,
    nightSessionId: string,
    answers: Array<{ qid: string; answer: string }> | undefined,
    finishedAt: string,
  ) {
    const session = await this.prisma.nightSession.findFirst({
      where: { id: nightSessionId, user_id: userId },
    });

    if (!session) {
      throw new BusinessException(
        AppErrorCode.NIGHT_SESSION_NOT_FOUND,
        'Night session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const finishedAtDate = new Date(finishedAt);
    const dateValue = session.date;
    const { year, month } = getYearMonthFromDate(dateValue);

    const updated = await this.prisma.nightSession.update({
      where: { id: session.id },
      data: {
        status: 'finished',
        answers_json: answers ?? Prisma.JsonNull,
        finished_at: finishedAtDate,
      },
    });

    const program = NIGHT_PROGRAMS.find(
      (item) => item.program_id === updated.program_id,
    );

    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: userId, year },
    });

    const traceEventsCreated = plan && program
      ? await Promise.all(
          program.trace_tags.map((tag) =>
            this.prisma.traceEvent.create({
              data: {
                user_id: userId,
                plan_id: plan.id,
                event_type: 'night_done',
                trace_tag: tag,
                direction_id: program.direction_id ?? null,
                source_id: updated.id,
                occurred_at: finishedAtDate,
                date: dateValue,
                year,
                month,
              },
            }),
          ),
        )
      : [];

    return {
      night_session_id: updated.id,
      status: updated.status,
      feedback: { title: '晚安。', subtitle: '今天已经够了。' },
      trace_events_created: traceEventsCreated.map((event) => ({
        trace_tag: event.trace_tag,
        direction_id: event.direction_id,
      })),
    };
  }
}
