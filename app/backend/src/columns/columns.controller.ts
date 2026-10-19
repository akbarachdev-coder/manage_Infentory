import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { JwtPayload } from '../auth/jwt-auth.guard.js';
import { ColumnsService } from './columns.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { MovePositionDto } from './dto/move-position.dto.js';
import { UpdateColumnDto } from './dto/update-column.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('projects/:projectId/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Get()
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.columnsService.list(projectId, user.sub);
  }

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateColumnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.columnsService.create(projectId, user.sub, dto);
  }

  @Patch(':id')
  update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateColumnDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.columnsService.update(projectId, id, user.sub, dto);
  }

  @Patch(':id/move')
  move(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: MovePositionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.columnsService.move(projectId, id, user.sub, dto);
  }

  @Delete(':id')
  remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.columnsService.remove(projectId, id, user.sub);
  }
}
