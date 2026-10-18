import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { ProjectAccessService } from '../common/project-access.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { PROJECT_INCLUDE } from './project.include.js';

const DEFAULT_COLUMN_TITLES = ['To Do', 'In Progress', 'Done'];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async findAll(userId: string) {
    return this.prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
      include: PROJECT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        ownerId: userId,
        members: {
          create: { userId, role: Role.OWNER },
        },
        columns: {
          create: DEFAULT_COLUMN_TITLES.map((title, position) => ({
            title,
            position,
          })),
        },
      },
      include: PROJECT_INCLUDE,
    });
  }

  async findOne(projectId: string, userId: string) {
    await this.access.requireMember(projectId, userId);

    return this.prisma.project.findUnique({
      where: { id: projectId },
      include: PROJECT_INCLUDE,
    });
  }

  async update(projectId: string, userId: string, dto: UpdateProjectDto) {
    await this.access.requireRole(projectId, userId, [
      Role.OWNER,
      Role.ADMIN,
    ]);

    const data: Prisma.ProjectUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;

    return this.prisma.project.update({
      where: { id: projectId },
      data,
      include: PROJECT_INCLUDE,
    });
  }

  async remove(projectId: string, userId: string) {
    await this.access.requireRole(projectId, userId, [Role.OWNER]);

    await this.prisma.project.delete({ where: { id: projectId } });

    return { success: true };
  }
}
