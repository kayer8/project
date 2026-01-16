import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';
import { getYearMonthFromDate, parseDateInput } from '../../common/utils/date-utils';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  async createNote(params: {
    userId: string;
    related_type: string;
    related_id: string;
    date: string;
    mood?: string;
    content: string;
  }) {
    const dateValue = parseDateInput(params.date);
    const { year, month } = getYearMonthFromDate(dateValue);

    const note = await this.prisma.microNote.create({
      data: {
        user_id: params.userId,
        related_type: params.related_type,
        related_id: params.related_id,
        date: dateValue,
        mood: params.mood ?? null,
        content: params.content,
      },
    });

    const plan = await this.prisma.yearPlan.findFirst({
      where: { user_id: params.userId, year },
    });

    if (plan) {
      await this.prisma.traceEvent.create({
        data: {
          user_id: params.userId,
          plan_id: plan.id,
          event_type: 'note_added',
          trace_tag: 'observe',
          direction_id: null,
          source_id: params.related_id,
          occurred_at: note.created_at,
          date: dateValue,
          year,
          month,
        },
      });
    }

    return { note_id: note.id, created_at: note.created_at };
  }

  async updateNote(userId: string, noteId: string, content: string, mood?: string) {
    const existing = await this.prisma.microNote.findFirst({
      where: { id: noteId, user_id: userId },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.NOTE_NOT_FOUND,
        'Note not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const note = await this.prisma.microNote.update({
      where: { id: noteId },
      data: {
        content,
        ...(mood !== undefined ? { mood } : {}),
      },
    });

    return { note_id: note.id, updated_at: note.updated_at };
  }

  async deleteNote(userId: string, noteId: string) {
    const existing = await this.prisma.microNote.findFirst({
      where: { id: noteId, user_id: userId },
    });

    if (!existing) {
      throw new BusinessException(
        AppErrorCode.NOTE_NOT_FOUND,
        'Note not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.microNote.delete({ where: { id: noteId } });
    return { deleted: true };
  }
}
