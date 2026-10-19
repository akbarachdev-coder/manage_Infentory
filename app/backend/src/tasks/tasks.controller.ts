import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/jwt-auth.guard.js';
import { AddAssigneeDto } from './dto/add-assignee.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  list(
    @Param('projectId') projectId: string,
    @Query('columnId') columnId: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.list(projectId, user.sub, columnId);
  }

  @Get(':id')
  findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.findOne(projectId, id, user.sub);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.create(projectId, user.sub, dto);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.update(projectId, id, user.sub, dto);
  }

  @Patch(':id/move')
  move(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.move(projectId, id, user.sub, dto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.remove(projectId, id, user.sub);
  }

  @Post(':id/assignees')
  addAssignee(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: AddAssigneeDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.addAssignee(projectId, id, user.sub, dto);
  }

  @Delete(':id/assignees/:userId')
  removeAssignee(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('userId') assigneeId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.tasksService.removeAssignee(
      projectId,
      id,
      assigneeId,
      user.sub,
    );
  }
}
