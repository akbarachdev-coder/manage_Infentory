import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProjectAccessService } from '../common/project-access.service.js';
import { USER_SELECT } from '../common/user-select.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';

const COMMENT_INCLUDE = {
  user: { select: USER_SELECT },
};

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async list(taskId: string, userId: string) {
    await this.access.requireTaskByMember(taskId, userId);

    return this.prisma.comment.findMany({
      where: { taskId },
      include: COMMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(taskId: string, userId: string, dto: CreateCommentDto) {
    await this.access.requireTaskByMember(taskId, userId);

    return this.prisma.comment.create({
      data: {
        taskId,
        userId,
        content: dto.content,
      },
      include: COMMENT_INCLUDE,
    });
  }

  async update(
    taskId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ) {
    await this.access.requireTaskByMember(taskId, userId);
    const comment = await this.findCommentOrThrow(taskId, commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: COMMENT_INCLUDE,
    });
  }

  async remove(taskId: string, commentId: string, userId: string) {
    await this.access.requireTaskByMember(taskId, userId);
    const comment = await this.findCommentOrThrow(taskId, commentId);

    if (comment.userId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { success: true };
  }

  private async findCommentOrThrow(taskId: string, commentId: string) {
    const comment = await this.prisma.comment.findFirst({
      where: { id: commentId, taskId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }
}
