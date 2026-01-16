import { Body, Controller, Delete, Param, Post, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/notes.dto';

@ApiTags('notes')
@ApiBearerAuth()
@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  create(@User() user: AuthUser, @Body() dto: CreateNoteDto) {
    return this.notesService.createNote({
      userId: user.userId,
      related_type: dto.related_type,
      related_id: dto.related_id,
      date: dto.date,
      mood: dto.mood,
      content: dto.content,
    });
  }

  @Put(':note_id')
  update(
    @User() user: AuthUser,
    @Param('note_id') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(
      user.userId,
      noteId,
      dto.content,
      dto.mood,
    );
  }

  @Delete(':note_id')
  remove(@User() user: AuthUser, @Param('note_id') noteId: string) {
    return this.notesService.deleteNote(user.userId, noteId);
  }
}
