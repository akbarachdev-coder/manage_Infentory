import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Priority } from '@prisma/client';
import { ProjectAccessService } from '../common/project-access.service.js';
import { USER_SELECT } from '../common/user-select.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddAssigneeDto } from './dto/add-assignee.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';

const TASK_INCLUDE = {
  column: { select: { id: true, title: true } },
  assignees: { include: { user: { select: USER_SELECT } } },
  comments: {
    include: { user: { select: USER_SELECT } },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.TaskInclude;

const TASK_SUMMARY_INCLUDE = {
  column: { select: { id: true, title: true } },
  assignees: { include: { user: { select: USER_SELECT } } },
  _count: { select: { comments: true } },
} satisfies Prisma.TaskInclude;

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async list(projectId: string, userId: string, columnId?: string) {
    await this.access.requireMember(projectId, userId);

    if (columnId) {
      await this.access.requireColumn(projectId, columnId, userId);
    }

    return this.prisma.task.findMany({
      where: {
        column: { projectId },
        ...(columnId ? { columnId } : {}),
      },
      include: TASK_SUMMARY_INCLUDE,
      orderBy: { position: 'asc' },
    });
  }

  async findOne(projectId: string, taskId: string, userId: string) {
    await this.access.requireTask(projectId, taskId, userId);

    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: TASK_INCLUDE,
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async create(projectId: string, userId: string, dto: CreateTaskDto) {
    await this.access.requireColumn(projectId, dto.columnId, userId);

    const position = await this.prisma.task.count({
      where: { columnId: dto.columnId },
    });

    return this.prisma.task.create({
      data: {
        columnId: dto.columnId,
        title: dto.title,
        description: dto.description ?? null,
        priority: dto.priority ?? Priority.MEDIUM,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        position,
      },
      include: TASK_SUMMARY_INCLUDE,
    });
  }

  async update(
    projectId: string,
    taskId: string,
    userId: string,
    dto: UpdateTaskDto,
  ) {
    await this.access.requireTask(projectId, taskId, userId);

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate === null ? null : new Date(dto.dueDate);
    }

    return this.prisma.task.update({
      where: { id: taskId },
      data,
      include: TASK_SUMMARY_INCLUDE,
    });
  }

  async move(
    projectId: string,
    taskId: string,
    userId: string,
    dto: MoveTaskDto,
  ) {
    const task = await this.access.requireTask(projectId, taskId, userId);
    const targetColumnId = dto.columnId ?? task.columnId;

    if (targetColumnId !== task.columnId) {
      await this.access.requireColumn(projectId, targetColumnId, userId);
    }

    await this.prisma.$transaction(async (tx) => {
      if (targetColumnId !== task.columnId) {
        await tx.task.updateMany({
          where: {
            columnId: task.columnId,
            position: { gt: task.position },
          },
          data: { position: { decrement: 1 } },
        });
      }

      await tx.task.updateMany({
        where: {
          columnId: targetColumnId,
          id: { not: taskId },
          position: { gte: dto.position },
        },
        data: { position: { increment: 1 } },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { columnId: targetColumnId, position: dto.position },
      });
    });

    return this.prisma.task.findUniqueOrThrow({
      where: { id: taskId },
      include: TASK_SUMMARY_INCLUDE,
    });
  }

  async remove(projectId: string, taskId: string, userId: string) {
    await this.access.requireTask(projectId, taskId, userId);

    await this.prisma.task.delete({ where: { id: taskId } });

    return { success: true };
  }

  async addAssignee(
    projectId: string,
    taskId: string,
    userId: string,
    dto: AddAssigneeDto,
  ) {
    const task = await this.access.requireTask(projectId, taskId, userId);

    const assignee = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!assignee) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId, userId: dto.userId } },
    });
    if (existing) {
      throw new ConflictException('User is already assigned to this task');
    }

    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.taskAssignee.create({
        data: { taskId, userId: dto.userId },
        include: { user: { select: USER_SELECT } },
      });

      await tx.notification.create({
        data: {
          userId: dto.userId,
          message: `You were added to task "${task.title}"`,
        },
      });

      return assignment;
    });
  }

  async removeAssignee(
    projectId: string,
    taskId: string,
    targetUserId: string,
    userId: string,
  ) {
    await this.access.requireTask(projectId, taskId, userId);

    const assignment = await this.prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId, userId: targetUserId } },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    await this.prisma.taskAssignee.delete({
      where: { taskId_userId: { taskId, userId: targetUserId } },
    });

    return { success: true };
  }
}
