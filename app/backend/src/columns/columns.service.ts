import { Injectable } from '@nestjs/common';
import { USER_SELECT } from '../common/user-select.js';
import { ProjectAccessService } from '../common/project-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { MovePositionDto } from './dto/move-position.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';

const COLUMN_INCLUDE = {
  tasks: {
    orderBy: { position: 'asc' as const },
    include: {
      assignees: { include: { user: { select: USER_SELECT } } },
      _count: { select: { comments: true } },
    },
  },
};

@Injectable()
export class ColumnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async list(projectId: string, userId: string) {
    await this.access.requireMember(projectId, userId);

    return this.prisma.column.findMany({
      where: { projectId },
      include: COLUMN_INCLUDE,
      orderBy: { position: 'asc' },
    });
  }

  async create(projectId: string, userId: string, dto: CreateColumnDto) {
    await this.access.requireMember(projectId, userId);

    const position = await this.prisma.column.count({
      where: { projectId },
    });

    return this.prisma.column.create({
      data: {
        projectId,
        title: dto.title,
        position,
      },
      include: COLUMN_INCLUDE,
    });
  }

  async update(
    projectId: string,
    columnId: string,
    userId: string,
    dto: UpdateColumnDto,
  ) {
    await this.access.requireColumn(projectId, columnId, userId);

    return this.prisma.column.update({
      where: { id: columnId },
      data: dto.title !== undefined ? { title: dto.title } : {},
      include: COLUMN_INCLUDE,
    });
  }

  async move(
    projectId: string,
    columnId: string,
    userId: string,
    dto: MovePositionDto,
  ) {
    await this.access.requireColumn(projectId, columnId, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.column.updateMany({
        where: {
          projectId,
          id: { not: columnId },
          position: { gte: dto.position },
        },
        data: { position: { increment: 1 } },
      });

      await tx.column.update({
        where: { id: columnId },
        data: { position: dto.position },
      });
    });

    return this.prisma.column.findUniqueOrThrow({
      where: { id: columnId },
      include: COLUMN_INCLUDE,
    });
  }

  async remove(projectId: string, columnId: string, userId: string) {
    await this.access.requireColumn(projectId, columnId, userId);

    await this.prisma.column.delete({ where: { id: columnId } });

    return { success: true };
  }
}
