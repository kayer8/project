import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async createFeedback(
    userId: string,
    params: { type: string; content: string; contact?: string },
  ) {
    const ticket = await this.prisma.feedbackTicket.create({
      data: {
        user_id: userId,
        type: params.type,
        content: params.content,
        contact: params.contact ?? null,
      },
    });

    return { ticket_id: ticket.id };
  }
}
