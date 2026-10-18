import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ProjectAccessService } from '../common/project-access.service.js';
import { USER_SELECT } from '../common/user-select.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberDto } from './dto/update-member.dto.js';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
  ) {}

  async list(projectId: string, userId: string) {
    await this.access.requireMember(projectId, userId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: USER_SELECT } },
    });
  }

  async add(projectId: string, userId: string, dto: AddMemberDto) {
    await this.access.requireRole(projectId, userId, [
      Role.OWNER,
      Role.ADMIN,
    ]);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
    });
    if (existing) {
      throw new ConflictException('User is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role ?? Role.MEMBER,
      },
      include: { user: { select: USER_SELECT } },
    });
  }

  async updateRole(
    projectId: string,
    targetUserId: string,
    currentUserId: string,
    dto: UpdateMemberDto,
  ) {
    await this.access.requireRole(projectId, currentUserId, [Role.OWNER]);

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    if (project.ownerId === targetUserId) {
      throw new ForbiddenException('The owner role cannot be changed');
    }

    const member = await this.findMemberOrThrow(projectId, targetUserId);

    return this.prisma.projectMember.update({
      where: { id: member.id },
      data: { role: dto.role },
      include: { user: { select: USER_SELECT } },
    });
  }

  async remove(
    projectId: string,
    targetUserId: string,
    currentUserId: string,
  ) {
    if (targetUserId === currentUserId) {
      await this.access.requireMember(projectId, currentUserId);
    } else {
      await this.access.requireRole(projectId, currentUserId, [
        Role.OWNER,
        Role.ADMIN,
      ]);
    }

    const project = await this.prisma.project.findUniqueOrThrow({
      where: { id: projectId },
    });
    if (project.ownerId === targetUserId) {
      throw new ForbiddenException(
        'The owner cannot be removed from the project',
      );
    }

    const member = await this.findMemberOrThrow(projectId, targetUserId);

    await this.prisma.projectMember.delete({ where: { id: member.id } });

    return { success: true };
  }

  private async findMemberOrThrow(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }
}
