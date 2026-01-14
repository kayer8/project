import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { BusinessException } from '../../common/exceptions/business.exception';
import { AppErrorCode } from '../../common/exceptions/app-error-code';

@Injectable()
export class BookService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBookDto) {
    return this.prisma.book.create({
      data: {
        title: dto.title,
        author: dto.author,
        description: dto.description ?? null,
        isbn: dto.isbn ?? null,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      },
    });
  }

  async findAll(pagination: PaginationDto) {
    const page = pagination.page;
    const pageSize = pagination.pageSize;
    const skip = (page - 1) * pageSize;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.book.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.book.count(),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
    };
  }

  async getById(id: number) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });
    if (!book) {
      throw new BusinessException(
        AppErrorCode.BOOK_NOT_FOUND,
        'Book not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return book;
  }

  async update(id: number, dto: UpdateBookDto) {
    await this.getById(id);
    return this.prisma.book.update({
      where: { id },
      data: {
        title: dto.title,
        author: dto.author,
        description: dto.description,
        isbn: dto.isbn,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.getById(id);
    return this.prisma.book.delete({
      where: { id },
    });
  }
}
