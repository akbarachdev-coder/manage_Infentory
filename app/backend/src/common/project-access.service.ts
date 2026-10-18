import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Column, ProjectMember, Role, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async requireMember(projectId: string, userId: string): Promise<ProjectMember> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { where: { userId } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = project.members[0];
    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this project',
      );
    }

    return membership;
  }

  async requireRole(
    projectId: string,
    userId: string,
    roles: Role[],
  ): Promise<ProjectMember> {
    const membership = await this.requireMember(projectId, userId);

    if (!roles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to manage this project',
      );
    }

    return membership;
  }

  async requireColumn(
    projectId: string,
    columnId: string,
    userId: string,
  ): Promise<Column> {
    await this.requireMember(projectId, userId);

    const column = await this.prisma.column.findFirst({
      where: { id: columnId, projectId },
    });

    if (!column) {
      throw new NotFoundException('Column not found');
    }

    return column;
  }

  async requireTask(
    projectId: string,
    taskId: string,
    userId: string,
  ): Promise<Task> {
    await this.requireMember(projectId, userId);

    const task = await this.prisma.task.findFirst({
      where: { id: taskId, column: { projectId } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async requireTaskByMember(taskId: string, userId: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { column: { select: { projectId: true } } },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    await this.requireMember(task.column.projectId, userId);

    return task;
  }
}
